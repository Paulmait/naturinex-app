// Script to create admin user
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Admin credentials
    const adminEmail = 'admin@naturinex.com';
    const adminPassword = 'Natur!nex2025#Secure';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create user in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: adminEmail,
        password: adminPassword,
        emailVerified: true,
        displayName: 'Naturinex Admin'
      });
      console.log('Firebase Auth user created:', firebaseUser.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        firebaseUser = await admin.auth().getUserByEmail(adminEmail);
        console.log('Firebase Auth user already exists:', firebaseUser.uid);
      } else {
        throw error;
      }
    }
    
    // Set custom claims for admin
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      admin: true,
      role: 'super_admin'
    });
    console.log('Admin claims set');
    
    // Create admin profile in Firestore
    const adminProfile = {
      uid: firebaseUser.uid,
      email: adminEmail,
      displayName: 'Naturinex Admin',
      role: 'admin',
      isAdmin: true,
      permissions: ['all'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      passwordHash: hashedPassword, // Store for admin security service
      twoFactorEnabled: false,
      securitySettings: {
        requirePasswordChange: true,
        passwordLastChanged: new Date(),
        lastLogin: null,
        loginAttempts: 0
      }
    };
    
    await admin.firestore()
      .collection('users')
      .doc(firebaseUser.uid)
      .set(adminProfile, { merge: true });
    
    console.log('Admin profile created in Firestore');
    
    // Create admin metadata
    await admin.firestore()
      .collection('adminUsers')
      .doc(firebaseUser.uid)
      .set({
        email: adminEmail,
        role: 'super_admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system',
        active: true
      });
    
    console.log('\n✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 UID:', firebaseUser.uid);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('🔐 Enable 2FA immediately for security');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

// Run the script
createAdminUser();