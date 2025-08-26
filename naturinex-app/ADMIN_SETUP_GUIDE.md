# 🔐 Admin Setup & Authentication Guide

## Current Admin System

**IMPORTANT**: There is no hardcoded admin username/password. Admin access is granted through Firebase Authentication with special privileges.

## How Admin Authentication Works

1. **No Default Admin Credentials**
   - For security, there's no pre-set admin username/password
   - Admins are regular users with elevated privileges
   - Admin status is stored in Firestore user metadata

2. **Admin Features**
   - Change password functionality
   - Access to admin dashboard
   - View all user data and analytics
   - Monitor app usage and revenue

## Setting Up Your First Admin

### Method 1: Via Firebase Console (Easiest)

1. **Create a User Account**:
   - Open the Naturinex app
   - Sign up with your admin email (e.g., admin@yourcompany.com)
   - Use a strong password

2. **Grant Admin Access in Firebase Console**:
   ```javascript
   // Go to Firebase Console > Firestore Database
   // Find your user document in the 'users' collection
   // Add this field to the document:
   {
     "metadata": {
       "isAdmin": true
     }
   }
   ```

3. **Verify Admin Access**:
   - Log out and log back in to the app
   - You should see "Admin Dashboard" and "Admin Settings" in Profile

### Method 2: Via Server Script

Create a file `makeAdmin.js` on your server:

```javascript
const admin = require('firebase-admin');

// Initialize admin SDK (already done in your server)
admin.initializeApp({
  credential: admin.credential.cert({
    // Your service account credentials
  })
});

async function makeUserAdmin(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    // Update Firestore
    await admin.firestore().collection('users').doc(user.uid).set({
      metadata: {
        isAdmin: true,
        adminGrantedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });
    
    console.log(`Successfully made ${email} an admin`);
  } catch (error) {
    console.error('Error making user admin:', error);
  }
}

// Replace with your admin email
makeUserAdmin('your-admin@email.com');
```

Run it once:
```bash
node makeAdmin.js
```

## Admin Security Best Practices

### Password Requirements
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Change every 90 days
- Never share admin credentials

### Two-Factor Authentication (Recommended)
Enable 2FA in Firebase Authentication:
1. Firebase Console > Authentication > Sign-in method
2. Enable "Multi-factor authentication"
3. Require for admin accounts

### Admin Activity Monitoring
All admin actions are logged:
- Login times and locations
- Data exports
- User management actions
- Configuration changes

## Admin Features Available

### 1. Admin Dashboard
- **Total Users**: See registered user count
- **Premium Users**: Monitor subscriptions
- **Daily Scans**: Track app usage
- **Revenue**: Monthly subscription income
- **Popular Products**: Most scanned items

### 2. Admin Settings
- **Change Password**: Update admin credentials
- **Create New Admin**: Instructions for adding admins
- **Security Settings**: Best practices

### 3. User Management
- View all user data
- Export user information (GDPR)
- Monitor suspicious activity
- Manage subscriptions

## Troubleshooting

### "Admin options not showing"
1. Check Firestore for `metadata.isAdmin: true`
2. Log out and log back in
3. Clear app cache

### "Can't change password"
1. Ensure current password is correct
2. New password must be 8+ characters
3. Check internet connection

### "Access denied to admin dashboard"
1. Verify admin status in Firestore
2. Check authentication token
3. Ensure user document exists

## Security Considerations

1. **Limit Admin Accounts**: Only trusted personnel
2. **Regular Audits**: Review admin list monthly
3. **Activity Logs**: Monitor admin actions
4. **Secure Communication**: Never share credentials via email/chat
5. **Incident Response**: Have a plan for compromised accounts

## Removing Admin Access

To revoke admin privileges:
```javascript
// In Firestore, update the user document:
{
  "metadata": {
    "isAdmin": false,
    "adminRevokedAt": timestamp
  }
}
```

The user will lose admin access on next login.

## Support

For admin-related issues:
1. Check server logs for errors
2. Verify Firebase configuration
3. Ensure Firestore security rules are correct
4. Contact technical support with error details