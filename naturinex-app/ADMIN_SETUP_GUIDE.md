# Admin Setup & Authentication Guide

*Last Updated: January 2026*

## Overview

The Naturinex admin system provides comprehensive user management, analytics, and security features. Admin access is granted through Firebase Authentication with special privileges, and enhanced features are powered by Supabase.

**Important:** There are no hardcoded admin credentials. All admins are regular users with elevated privileges.

---

## Quick Start

### 1. Create Your Admin Account

1. Open the Naturinex app and sign up with your admin email
2. Use a strong password (16+ characters, see requirements below)
3. Verify your email address

### 2. Grant Admin Privileges

**Via Firebase Console:**

1. Go to [Firebase Console](https://console.firebase.google.com) > Firestore Database
2. Find your user in the `users` collection
3. Add these fields:

```json
{
  "metadata": {
    "isAdmin": true,
    "adminRole": "super_admin"
  }
}
```

4. Also create an entry in the `admins` collection:

```json
{
  "email": "your-email@company.com",
  "role": "super_admin",
  "active": true,
  "passwordExpiresAt": "<timestamp 6 months from now>",
  "require2FA": true
}
```

### 3. Set Custom Claims (Required for Full Access)

Run this Node.js script on your server:

```javascript
const admin = require('firebase-admin');

async function createSuperAdmin(email) {
  const user = await admin.auth().getUserByEmail(email);

  await admin.auth().setCustomUserClaims(user.uid, {
    admin: true,
    role: 'super_admin'
  });

  await admin.firestore().collection('admins').doc(user.uid).set({
    email: email,
    role: 'super_admin',
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    passwordExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    require2FA: true,
    permissions: ['all']
  });

  console.log(`Super admin created: ${email}`);
}

createSuperAdmin('your-admin@email.com');
```

### 4. Verify Access

Log out and back in. You should see "Admin Dashboard" in your Profile.

---

## Admin Role Hierarchy

| Role | Level | Capabilities |
|------|-------|--------------|
| `owner` | 5 | Full access, can manage other admins, delete users permanently |
| `super_admin` | 4 | User management, policy changes, critical operations |
| `admin` | 3 | Standard admin operations, view analytics |
| `moderator` | 2 | Issue warnings, content moderation only |
| `viewer` | 1 | Read-only access to dashboards |

---

## Password Requirements (Industry Standard)

All admin accounts must follow these password requirements:

| Requirement | Value |
|-------------|-------|
| **Minimum Length** | 16 characters |
| **Maximum Length** | 128 characters |
| **Uppercase Letters** | At least 2 |
| **Lowercase Letters** | At least 2 |
| **Numbers** | At least 2 |
| **Special Characters** | At least 2 (`!@#$%^&*()_+-=[]{}|;:,.<>?`) |
| **Expiration** | 6 months (180 days) |
| **History** | Cannot reuse last 12 passwords |
| **Lockout** | 5 failed attempts = 30 minute lockout |
| **2FA** | Required for write operations |

### Password Change

1. Profile > Admin Settings > Change Password
2. Enter current password
3. Enter new password meeting requirements
4. Confirm and save

You'll receive warnings 14 days before password expiration.

---

## Admin Features

### Dashboard (Mobile & Web)

Access via Profile > Admin Dashboard

- **Overview Tab:** Total users, premium users, daily scans, revenue
- **Recent Scans Tab:** Latest user activity with product details
- **Users Tab:** User management tools

### User Management

**Available Actions:**

| Action | Required Role | Description |
|--------|---------------|-------------|
| View Users | Admin | List all users with status |
| View User Details | Admin | Full profile, scans, status |
| Issue Warning | Admin | Record violation warnings |
| Suspend User | Admin | Temporary or permanent suspension |
| Unsuspend User | Admin | Reinstate suspended accounts |
| Reset Password | Admin | Force password reset for user |
| Delete User | Super Admin | Soft delete with 30-day grace period |
| Immediate Delete | Owner | Permanent deletion (irreversible) |

### Analytics Access

Admins can view:
- User engagement metrics
- Scan statistics
- Subscription/revenue data (super_admin+)
- Error analytics
- Performance metrics

---

## Supabase Tables (Enhanced Admin Features)

The following tables store admin management data:

| Table | Purpose |
|-------|---------|
| `user_account_status` | User suspensions, bans, violations |
| `admin_audit_log` | Comprehensive admin action logging |
| `admin_password_policy` | Password requirements configuration |
| `admin_password_reset_requests` | Admin-initiated password resets |
| `user_data_access_log` | GDPR-compliant data access logging |
| `admin_analytics_access` | Per-admin analytics permissions |

### Accessing Supabase

1. Go to: https://supabase.com/dashboard
2. Select the Naturinex project
3. Use SQL Editor for reports and queries

**Note:** Full SOP with SQL queries is in `ADMIN_SOP.md` (not in version control for security).

---

## Audit Logging

**All admin actions are logged with:**

- Admin ID, email, role
- Action type and severity
- Target user information
- IP address and geolocation
- Device, browser, OS details
- Before/after state of changes
- Timestamp and duration
- Success/failure status

**Action Severity Levels:**
- `critical` - Delete operations
- `high` - Suspensions, policy changes, exports
- `medium` - Password resets, warnings
- `low` - View operations

View audit logs: Admin Dashboard > Audit Logs (or Supabase)

---

## Security Best Practices

### Daily Tasks
- Review audit logs for unusual activity
- Check failed login attempts
- Monitor suspended user queue

### Weekly Tasks
- Audit admin access logs
- Review password expiration status
- Verify 2FA is enabled for all admins

### Monthly Tasks
- Full admin access audit
- Update password policy if needed
- Test account recovery procedures

### Two-Factor Authentication (2FA)

Required for all admin accounts:

1. Profile > Security > Enable 2FA
2. Scan QR code with authenticator app (Google Authenticator, Authy)
3. Enter verification code
4. Save backup codes securely

---

## Troubleshooting

### "Admin options not showing"
1. Verify `metadata.isAdmin: true` in Firestore `users` collection
2. Verify entry exists in `admins` collection with `active: true`
3. Log out and back in to refresh token
4. Clear app cache

### "Access denied to admin dashboard"
1. Check custom claims are set (requires server script)
2. Verify admin role in `admins` collection
3. Ensure account is not suspended

### "Password expired"
1. You'll see a prompt to change password
2. Enter current password
3. Create new password meeting all requirements
4. Log in again with new password

### "2FA not working"
1. Check device time is synced correctly
2. Ensure you're using the correct authenticator entry
3. Contact another admin to reset your 2FA
4. Use backup codes if available

---

## Emergency Procedures

### Compromised Admin Account
1. Immediately disable the account in Firebase Auth
2. Revoke all sessions in `adminSessions` collection
3. Review audit logs for unauthorized actions
4. Create new account for affected admin
5. Document incident

### Revoking Admin Access

To remove admin privileges:

1. Firebase Console > Firestore > `users` collection
2. Update: `metadata.isAdmin: false`
3. Update `admins` collection: `active: false`
4. Optionally disable in Firebase Auth

Access revoked on next login attempt.

---

## Additional Resources

- **Full SOP:** `ADMIN_SOP.md` (local only, not in git)
- **Firebase Console:** https://console.firebase.google.com
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Security Policies:** See `DATABASE_SECURITY_GUIDE.md`

---

## Changelog

### January 2026
- Added comprehensive admin user management
- Implemented 6-month password expiration
- Added industry-standard password requirements
- Created Supabase tables for admin operations
- Added comprehensive audit logging
- Created admin role hierarchy (owner, super_admin, admin, moderator, viewer)
- Added user suspension/deletion capabilities
- Created GDPR-compliant data access logging

### December 2025
- Initial admin setup guide
- Basic Firebase-based admin authentication
