# 🔒 Naturinex Database Security Guide

## Overview
This guide outlines the comprehensive security measures implemented to protect the Naturinex database from abuse and ensure data integrity.

## 🛡️ Security Layers

### 1. **Authentication & Authorization**

#### Firebase Authentication
- Multi-factor authentication support
- OAuth providers (Google, Apple)
- Session management with JWT tokens
- Automatic token refresh

#### Role-Based Access Control (RBAC)
```javascript
// User roles
- user: Basic app access
- premium: Premium features + scan history
- admin: Full database access
- superadmin: System configuration
```

### 2. **Admin Access Security**

#### Admin Authentication Flow
1. Admin login with email/password
2. JWT token generation with admin claims
3. Token verification on each request
4. Audit logging of all admin actions

#### Admin Middleware Protection
```javascript
// Every admin request goes through:
- JWT token verification
- Admin role verification
- Active status check
- Rate limiting
- Action logging
```

### 3. **Database Security Rules**

#### Firestore Security Rules
```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Scan history is user-specific
match /scanHistory/{scanId} {
  allow read: if resource.data.userId == request.auth.uid;
  allow create: if request.auth.uid != null;
}

// Admin collections are protected
match /adminLogs/{document=**} {
  allow read: if request.auth.token.admin == true;
  allow write: if false; // Only server can write
}
```

### 4. **API Security**

#### Rate Limiting
- **General API**: 100 requests/15 minutes
- **Auth endpoints**: 5 attempts/15 minutes
- **Admin endpoints**: 100 requests/minute
- **Analysis endpoints**: 10 requests/minute

#### Input Validation
- All inputs sanitized with express-validator
- SQL injection prevention
- XSS protection
- File upload restrictions (images only, 10MB max)

### 5. **Data Protection**

#### Encryption
- Data encrypted at rest (Firebase)
- TLS 1.3 for data in transit
- Sensitive data hashed (passwords)
- API keys stored in environment variables

#### Privacy Measures
- Anonymous scan tracking available
- PII minimization
- Data retention policies
- GDPR compliance ready

### 6. **Abuse Prevention**

#### Device Tracking
- Device ID based rate limiting
- Free tier scan limits (5/day)
- IP-based blocking for abuse
- Behavioral analysis for bot detection

#### Content Filtering
- Profanity filtering in user inputs
- Malicious payload detection
- Image content validation
- OCR text sanitization

### 7. **Monitoring & Alerts**

#### Audit Logging
```javascript
// All admin actions logged:
{
  adminId: 'admin123',
  action: 'PUT /api/admin/alternatives/aspirin',
  timestamp: '2024-01-26T10:30:00Z',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
}
```

#### Security Alerts
- Failed authentication attempts
- Unusual traffic patterns
- Database modification alerts
- Error rate monitoring

### 8. **Backup & Recovery**

#### Automated Backups
- Daily Firestore backups
- Point-in-time recovery
- Cross-region replication
- Encrypted backup storage

#### Disaster Recovery
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 24 hours
- Documented recovery procedures
- Regular recovery testing

## 🔐 Admin Access Guide

### Setting Up Admin Access

1. **Create Admin User**
```bash
# Using Firebase Admin SDK
firebase auth:import admins.json --hash-algo=BCRYPT
```

2. **Set Custom Claims**
```javascript
admin.auth().setCustomUserClaims(uid, { admin: true });
```

3. **Add to Admins Collection**
```javascript
await admin.firestore().collection('admins').doc(uid).set({
  email: 'admin@naturinex.com',
  active: true,
  permissions: ['read', 'write', 'delete'],
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
```

### Admin Endpoints

#### Dashboard
```
GET /api/admin/dashboard
Authorization: Bearer <admin-jwt-token>
```

#### Manage Alternatives
```
GET /api/admin/alternatives/:medication
PUT /api/admin/alternatives/:medication
DELETE /api/admin/alternatives/:medication
```

#### View/Edit Scans
```
GET /api/admin/scans?limit=100&userId=xxx
PATCH /api/admin/scans/:scanId
```

#### Export Training Data
```
GET /api/admin/export/training-data?format=json
GET /api/admin/export/training-data?format=csv
```

## 🚨 Security Best Practices

### For Developers
1. Never commit API keys or secrets
2. Use environment variables for configuration
3. Implement proper error handling (no stack traces to users)
4. Keep dependencies updated
5. Use prepared statements for queries
6. Validate all user inputs
7. Implement CORS properly
8. Use HTTPS everywhere

### For Admins
1. Use strong, unique passwords
2. Enable 2FA on admin accounts
3. Review audit logs regularly
4. Monitor for unusual activity
5. Rotate credentials periodically
6. Limit admin access scope
7. Use VPN for admin access
8. Document all changes

## 📊 Security Metrics

### Key Performance Indicators
- Authentication success rate: >95%
- False positive rate (blocked legitimate users): <1%
- Mean time to detect threats: <5 minutes
- Security incident response time: <30 minutes
- Uptime: 99.9%

### Regular Security Tasks
- Weekly: Review audit logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: Penetration testing

## 🔧 Incident Response

### Security Incident Procedure
1. **Detect**: Automated monitoring alerts
2. **Assess**: Determine severity and scope
3. **Contain**: Isolate affected systems
4. **Eradicate**: Remove threat
5. **Recover**: Restore normal operations
6. **Review**: Post-incident analysis

### Contact Information
- Security Team: security@naturinex.com
- Emergency: +1-XXX-XXX-XXXX
- Bug Bounty: security.naturinex.com/bugbounty

## 🛠️ Security Tools

### Recommended Tools
- **Firebase Security Rules Simulator**: Test rules before deployment
- **OWASP ZAP**: Security testing
- **Postman**: API security testing
- **Google Cloud Security Command Center**: Threat detection
- **Sentry**: Error monitoring

### Security Headers
```javascript
// Implemented in middleware
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

## 📝 Compliance

### Standards & Regulations
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- HIPAA (Health Insurance Portability and Accountability Act) - Ready
- ISO 27001 - Information Security Management
- OWASP Top 10 - Security Best Practices

### Data Rights
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object

---

**Last Updated**: January 2024
**Version**: 2.0
**Maintained by**: Naturinex Security Team