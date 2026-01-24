/**
 * Create Admin Account Script
 *
 * Usage:
 *   node scripts/create-admin.js <email> [role]
 *
 * Examples:
 *   node scripts/create-admin.js admin@company.com super_admin
 *   node scripts/create-admin.js viewer@company.com viewer
 *
 * Roles: owner, super_admin, admin, moderator, viewer
 *
 * Prerequisites:
 *   - Firebase Admin SDK initialized
 *   - GOOGLE_APPLICATION_CREDENTIALS environment variable set
 *   - User must already exist (have signed up through the app)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  // Try to use service account from environment
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    console.log('\nTo set up:');
    console.log('1. Download service account key from Firebase Console');
    console.log('2. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json');
    process.exit(1);
  }
}

const VALID_ROLES = ['owner', 'super_admin', 'admin', 'moderator', 'viewer'];

const ROLE_PERMISSIONS = {
  owner: ['all'],
  super_admin: ['user_management', 'analytics', 'policies', 'exports', 'delete_users'],
  admin: ['user_management', 'analytics', 'warnings', 'suspensions'],
  moderator: ['warnings', 'content_moderation'],
  viewer: ['view_analytics'],
};

async function createAdmin(email, role = 'admin') {
  // Validate role
  if (!VALID_ROLES.includes(role)) {
    console.error(`Invalid role: ${role}`);
    console.log(`Valid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  try {
    console.log(`\nCreating admin account for: ${email}`);
    console.log(`Role: ${role}`);
    console.log('---');

    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${user.uid}`);

    // Set custom claims for admin access
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      role: role,
    });
    console.log('Custom claims set');

    // Calculate password expiration (6 months from now)
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setMonth(passwordExpiresAt.getMonth() + 6);

    // Create entry in admins collection
    await admin.firestore().collection('admins').doc(user.uid).set({
      email: email,
      displayName: user.displayName || email.split('@')[0],
      role: role,
      active: true,
      permissions: ROLE_PERMISSIONS[role] || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      passwordExpiresAt: passwordExpiresAt,
      require2FA: role === 'owner' || role === 'super_admin',
      lastLogin: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    console.log('Admin document created in Firestore');

    // Update user metadata
    await admin.firestore().collection('users').doc(user.uid).set({
      metadata: {
        isAdmin: true,
        adminRole: role,
        adminGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
        adminGrantedBy: 'system_script',
      },
    }, { merge: true });
    console.log('User metadata updated');

    console.log('\n=== Admin Account Created Successfully ===');
    console.log(`Email: ${email}`);
    console.log(`UID: ${user.uid}`);
    console.log(`Role: ${role}`);
    console.log(`Password expires: ${passwordExpiresAt.toISOString()}`);
    console.log(`2FA required: ${role === 'owner' || role === 'super_admin' ? 'Yes' : 'No'}`);
    console.log('\nNext steps:');
    console.log('1. User should log out and back in to get new permissions');
    console.log('2. User should enable 2FA if required');
    console.log('3. User should change password to meet security requirements');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`\nError: User with email ${email} not found.`);
      console.log('The user must sign up through the Naturinex app first.');
    } else {
      console.error('\nError creating admin:', error.message);
    }
    process.exit(1);
  }
}

async function listAdmins() {
  try {
    const adminsSnapshot = await admin.firestore().collection('admins')
      .where('active', '==', true)
      .get();

    console.log('\n=== Active Admins ===\n');

    if (adminsSnapshot.empty) {
      console.log('No active admins found.');
      return;
    }

    adminsSnapshot.forEach(doc => {
      const data = doc.data();
      const expires = data.passwordExpiresAt?.toDate?.() || data.passwordExpiresAt;
      const isExpired = expires && new Date() > new Date(expires);

      console.log(`Email: ${data.email}`);
      console.log(`  Role: ${data.role}`);
      console.log(`  2FA Required: ${data.require2FA ? 'Yes' : 'No'}`);
      console.log(`  Password Expires: ${expires ? new Date(expires).toLocaleDateString() : 'Not set'}`);
      if (isExpired) console.log('  *** PASSWORD EXPIRED ***');
      console.log('');
    });

  } catch (error) {
    console.error('Error listing admins:', error.message);
  }
}

async function revokeAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);

    // Remove custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: false,
      role: null,
    });

    // Deactivate in admins collection
    await admin.firestore().collection('admins').doc(user.uid).update({
      active: false,
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user metadata
    await admin.firestore().collection('users').doc(user.uid).set({
      metadata: {
        isAdmin: false,
        adminRevokedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, { merge: true });

    console.log(`\nAdmin access revoked for: ${email}`);

  } catch (error) {
    console.error('Error revoking admin:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === '--list' || command === '-l') {
  listAdmins().then(() => process.exit(0));
} else if (command === '--revoke' || command === '-r') {
  const email = args[1];
  if (!email) {
    console.log('Usage: node scripts/create-admin.js --revoke <email>');
    process.exit(1);
  }
  revokeAdmin(email).then(() => process.exit(0));
} else if (command === '--help' || command === '-h' || !command) {
  console.log(`
Naturinex Admin Account Manager

Usage:
  node scripts/create-admin.js <email> [role]    Create new admin
  node scripts/create-admin.js --list            List all active admins
  node scripts/create-admin.js --revoke <email>  Revoke admin access

Roles (in order of privilege):
  owner        - Full access, can manage other admins
  super_admin  - User management, policies, critical operations
  admin        - Standard admin operations
  moderator    - Warnings and content moderation only
  viewer       - Read-only access

Examples:
  node scripts/create-admin.js admin@company.com super_admin
  node scripts/create-admin.js support@company.com moderator
  node scripts/create-admin.js --list
  node scripts/create-admin.js --revoke old-admin@company.com

Notes:
  - User must already have signed up through the Naturinex app
  - Set GOOGLE_APPLICATION_CREDENTIALS before running
  - Passwords expire after 6 months
  - Owner and super_admin roles require 2FA
`);
  process.exit(0);
} else {
  const email = command;
  const role = args[1] || 'admin';
  createAdmin(email, role).then(() => process.exit(0));
}
