const admin = require('firebase-admin');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

class AdminSecurityService {
  constructor() {
    // Initialize email transporter (configure with your SMTP)
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD
      }
    });
    
    // Track admin sessions
    this.activeSessions = new Map();
    
    // Failed login attempts
    this.failedAttempts = new Map();
  }

  /**
   * Generate 2FA setup for admin
   */
  async setupTwoFactor(adminId) {
    const secret = speakeasy.generateSecret({
      name: `Naturinex Admin (${adminId})`,
      length: 32
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    // Store secret securely (encrypted)
    await this.storeAdminSecret(adminId, secret.base32);
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: this.generateBackupCodes()
    };
  }

  /**
   * Verify 2FA token
   */
  verifyTwoFactorToken(adminId, token, secret) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time windows for clock skew
    });
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Enhanced admin authentication with 2FA
   */
  async authenticateAdmin(email, password, twoFactorToken, ipAddress) {
    try {
      // Check failed attempts
      const attempts = this.failedAttempts.get(email) || 0;
      if (attempts >= 5) {
        await this.sendSecurityAlert('BLOCKED_LOGIN', email, ipAddress, 'Too many failed attempts');
        throw new Error('Account temporarily locked. Please contact security.');
      }
      
      // Verify credentials
      const adminUser = await this.verifyAdminCredentials(email, password);
      if (!adminUser) {
        this.failedAttempts.set(email, attempts + 1);
        throw new Error('Invalid credentials');
      }
      
      // Verify 2FA if enabled
      if (adminUser.twoFactorEnabled) {
        const isValid = this.verifyTwoFactorToken(
          adminUser.id,
          twoFactorToken,
          adminUser.twoFactorSecret
        );
        
        if (!isValid) {
          await this.sendSecurityAlert('FAILED_2FA', email, ipAddress);
          throw new Error('Invalid 2FA token');
        }
      }
      
      // Create session
      const sessionToken = this.createAdminSession(adminUser.id, ipAddress);
      
      // Send login alert
      await this.sendSecurityAlert('SUCCESSFUL_LOGIN', email, ipAddress);
      
      // Clear failed attempts
      this.failedAttempts.delete(email);
      
      return {
        success: true,
        sessionToken,
        adminId: adminUser.id,
        permissions: adminUser.permissions
      };
      
    } catch (error) {
      console.error('Admin authentication error:', error);
      throw error;
    }
  }

  /**
   * Create secure admin session
   */
  createAdminSession(adminId, ipAddress) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      adminId,
      ipAddress,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    };
    
    this.activeSessions.set(sessionId, sessionData);
    
    // Set up automatic cleanup
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
    }, 2 * 60 * 60 * 1000);
    
    return sessionId;
  }

  /**
   * Verify admin session
   */
  verifyAdminSession(sessionToken, ipAddress) {
    const session = this.activeSessions.get(sessionToken);
    
    if (!session) {
      return { valid: false, reason: 'Invalid session' };
    }
    
    // Check expiration
    if (new Date() > session.expiresAt) {
      this.activeSessions.delete(sessionToken);
      return { valid: false, reason: 'Session expired' };
    }
    
    // Check IP address change
    if (session.ipAddress !== ipAddress) {
      this.sendSecurityAlert('IP_CHANGE', session.adminId, ipAddress, 'Session IP mismatch');
      return { valid: false, reason: 'IP address changed' };
    }
    
    // Update last activity
    session.lastActivity = new Date();
    
    return { valid: true, adminId: session.adminId };
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(action, adminEmail, ipAddress, details = '') {
    const alertTypes = {
      'SUCCESSFUL_LOGIN': { emoji: '✅', severity: 'info' },
      'FAILED_LOGIN': { emoji: '⚠️', severity: 'warning' },
      'FAILED_2FA': { emoji: '🚨', severity: 'high' },
      'BLOCKED_LOGIN': { emoji: '🔒', severity: 'critical' },
      'IP_CHANGE': { emoji: '📍', severity: 'warning' },
      'DATA_ACCESS': { emoji: '📊', severity: 'info' },
      'DATA_INGESTION': { emoji: '🔄', severity: 'info' },
      'SETTINGS_CHANGE': { emoji: '⚙️', severity: 'warning' }
    };
    
    const alert = alertTypes[action] || { emoji: '🔔', severity: 'info' };
    
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .alert-box { 
            border: 2px solid ${alert.severity === 'critical' ? '#ff0000' : '#0066cc'};
            padding: 20px;
            margin: 20px;
            border-radius: 10px;
          }
          .header { font-size: 24px; font-weight: bold; }
          .details { margin-top: 10px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="alert-box">
          <div class="header">${alert.emoji} Admin Security Alert</div>
          <div class="details">
            <p><strong>Action:</strong> ${action.replace(/_/g, ' ')}</p>
            <p><strong>Admin:</strong> ${adminEmail}</p>
            <p><strong>IP Address:</strong> ${ipAddress}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
            <p><strong>Location:</strong> ${await this.getIPLocation(ipAddress)}</p>
          </div>
          <div class="footer">
            <p>If this wasn't you, please secure your account immediately.</p>
            <p>This is an automated security alert from Naturinex Admin System.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    try {
      await this.emailTransporter.sendMail({
        from: 'security@naturinex.com',
        to: process.env.SECURITY_ALERT_EMAIL || adminEmail,
        subject: `${alert.emoji} Naturinex Admin Security Alert: ${action}`,
        html: emailContent
      });
      
      // Also log to database
      await this.logSecurityEvent(action, adminEmail, ipAddress, details);
      
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  /**
   * Get IP location (basic implementation)
   */
  async getIPLocation(ipAddress) {
    try {
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
      const data = await response.json();
      return `${data.city}, ${data.country}`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Log security events to database
   */
  async logSecurityEvent(action, adminEmail, ipAddress, details) {
    try {
      await admin.firestore().collection('adminSecurityLogs').add({
        action,
        adminEmail,
        ipAddress,
        details,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        severity: this.getActionSeverity(action)
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get action severity level
   */
  getActionSeverity(action) {
    const severityMap = {
      'SUCCESSFUL_LOGIN': 'info',
      'FAILED_LOGIN': 'warning',
      'FAILED_2FA': 'high',
      'BLOCKED_LOGIN': 'critical',
      'IP_CHANGE': 'warning',
      'DATA_ACCESS': 'info',
      'DATA_INGESTION': 'info',
      'SETTINGS_CHANGE': 'warning'
    };
    return severityMap[action] || 'info';
  }

  /**
   * Admin activity monitoring
   */
  async trackAdminActivity(adminId, action, details) {
    await admin.firestore().collection('adminActivity').add({
      adminId,
      action,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Alert on sensitive actions
    const sensitiveActions = ['DELETE_DATA', 'EXPORT_DATA', 'MODIFY_PERMISSIONS'];
    if (sensitiveActions.includes(action)) {
      await this.sendSecurityAlert(action, adminId, 'System', details);
    }
  }

  /**
   * Verify admin credentials
   */
  async verifyAdminCredentials(email, password) {
    try {
      // Check if user exists in adminUsers collection
      const adminSnapshot = await admin.firestore()
        .collection('adminUsers')
        .where('email', '==', email)
        .where('active', '==', true)
        .limit(1)
        .get();
      
      if (adminSnapshot.empty) {
        return null;
      }
      
      const adminDoc = adminSnapshot.docs[0];
      const adminId = adminDoc.id;
      
      // Get user profile
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(adminId)
        .get();
      
      if (!userDoc.exists) {
        return null;
      }
      
      const userData = userDoc.data();
      
      // Verify password
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, userData.passwordHash);
      
      if (!isValidPassword) {
        return null;
      }
      
      return {
        id: adminId,
        email: userData.email,
        twoFactorEnabled: userData.twoFactorEnabled || false,
        twoFactorSecret: userData.twoFactorSecret,
        permissions: userData.permissions || ['read', 'write', 'delete']
      };
    } catch (error) {
      console.error('Error verifying admin credentials:', error);
      return null;
    }
  }

  /**
   * Store admin secret securely (placeholder)
   */
  async storeAdminSecret(adminId, secret) {
    // Store encrypted in database
    const encrypted = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY)
      .update(secret, 'utf8', 'hex');
    
    await admin.firestore().collection('adminSecrets').doc(adminId).set({
      encryptedSecret: encrypted,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

module.exports = new AdminSecurityService();