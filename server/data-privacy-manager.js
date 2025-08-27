/**
 * Data Privacy and Retention Manager
 * GDPR/CCPA Compliant Data Management System
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

class DataPrivacyManager {
  constructor() {
    this.retentionPeriods = {
      scans: 30, // 30 days for scan history
      userAccount: 365, // 1 year after account deletion
      analytics: 90, // 90 days for analytics
      errors: 30, // 30 days for error logs
      tempFiles: 1 // 1 day for temporary files
    };
    
    this.encryptionKey = process.env.DATA_ENCRYPTION_KEY || this.generateKey();
  }

  /**
   * Generate encryption key if not provided
   */
  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt sensitive data before storage
   */
  encryptData(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey, 'hex'),
        iv
      );
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted,
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data when needed
   */
  decryptData(encryptedData, iv) {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey, 'hex'),
        Buffer.from(iv, 'hex')
      );
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Store user data with privacy compliance
   */
  async storeUserData(userId, dataType, data) {
    const db = admin.firestore();
    
    // Determine if data needs encryption
    const sensitiveTypes = ['medical', 'personal', 'payment'];
    const needsEncryption = sensitiveTypes.includes(dataType);
    
    const record = {
      userId,
      dataType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: this.calculateExpiration(dataType)
    };
    
    if (needsEncryption) {
      const { encrypted, iv } = this.encryptData(data);
      record.data = encrypted;
      record.iv = iv;
      record.encrypted = true;
    } else {
      // Store non-sensitive data directly
      record.data = this.minimizeData(data);
      record.encrypted = false;
    }
    
    // Store with automatic expiration
    await db.collection('userData').add(record);
    
    // Log for compliance audit
    await this.logDataAccess(userId, 'store', dataType);
  }

  /**
   * Minimize data collection (privacy by design)
   */
  minimizeData(data) {
    // Remove unnecessary fields
    const minimized = { ...data };
    const unnecessaryFields = [
      'deviceId',
      'ipAddress',
      'exactLocation',
      'contacts',
      'deviceContacts'
    ];
    
    unnecessaryFields.forEach(field => {
      delete minimized[field];
    });
    
    return minimized;
  }

  /**
   * Calculate data expiration based on type
   */
  calculateExpiration(dataType) {
    const days = this.retentionPeriods[dataType] || 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * User data export (GDPR compliance)
   */
  async exportUserData(userId) {
    const db = admin.firestore();
    const userData = {
      profile: {},
      scans: [],
      analytics: [],
      preferences: {},
      exportDate: new Date().toISOString()
    };
    
    try {
      // Get user profile
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        userData.profile = this.sanitizeForExport(userDoc.data());
      }
      
      // Get scan history
      const scansSnapshot = await db.collection('scans')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      
      scansSnapshot.forEach(doc => {
        userData.scans.push(this.sanitizeForExport(doc.data()));
      });
      
      // Get user data records
      const userDataSnapshot = await db.collection('userData')
        .where('userId', '==', userId)
        .get();
      
      for (const doc of userDataSnapshot.docs) {
        const record = doc.data();
        if (record.encrypted) {
          // Decrypt sensitive data for export
          const decrypted = this.decryptData(record.data, record.iv);
          userData[record.dataType] = decrypted;
        } else {
          userData[record.dataType] = record.data;
        }
      }
      
      // Log export for compliance
      await this.logDataAccess(userId, 'export', 'full_data');
      
      return userData;
      
    } catch (error) {
      console.error('Data export error:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Delete user data (right to be forgotten)
   */
  async deleteUserData(userId, options = {}) {
    const db = admin.firestore();
    const batch = db.batch();
    
    try {
      // Delete user document
      if (!options.keepAccount) {
        batch.delete(db.collection('users').doc(userId));
      }
      
      // Delete scans
      const scansSnapshot = await db.collection('scans')
        .where('userId', '==', userId)
        .get();
      
      scansSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user data records
      const userDataSnapshot = await db.collection('userData')
        .where('userId', '==', userId)
        .get();
      
      userDataSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete storage files
      await this.deleteUserStorage(userId);
      
      // Commit batch delete
      await batch.commit();
      
      // Log deletion for compliance
      await this.logDataAccess(userId, 'delete', 'all_data');
      
      // Schedule permanent deletion from backups
      await this.schedulePermanentDeletion(userId);
      
      return {
        success: true,
        deletedRecords: scansSnapshot.size + userDataSnapshot.size + 1,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Data deletion error:', error);
      throw new Error('Failed to delete user data');
    }
  }

  /**
   * Delete user's storage files
   */
  async deleteUserStorage(userId) {
    try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({
        prefix: `users/${userId}/`
      });
      
      for (const file of files) {
        await file.delete();
      }
      
      console.log(`Deleted ${files.length} storage files for user ${userId}`);
    } catch (error) {
      console.error('Storage deletion error:', error);
    }
  }

  /**
   * Schedule permanent deletion from backups
   */
  async schedulePermanentDeletion(userId) {
    const db = admin.firestore();
    
    await db.collection('deletionQueue').add({
      userId,
      requestDate: admin.firestore.FieldValue.serverTimestamp(),
      executeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'pending'
    });
  }

  /**
   * Anonymize data for analytics
   */
  anonymizeForAnalytics(data) {
    // Remove all PII
    const anonymized = { ...data };
    delete anonymized.userId;
    delete anonymized.email;
    delete anonymized.name;
    delete anonymized.phone;
    delete anonymized.address;
    
    // Generate anonymous ID
    anonymized.anonymousId = crypto
      .createHash('sha256')
      .update(data.userId + new Date().getDate())
      .digest('hex')
      .substring(0, 16);
    
    return anonymized;
  }

  /**
   * Clean expired data (run periodically)
   */
  async cleanExpiredData() {
    const db = admin.firestore();
    const now = new Date();
    let deletedCount = 0;
    
    try {
      // Clean expired user data
      const expiredSnapshot = await db.collection('userData')
        .where('expiresAt', '<=', now)
        .limit(100)
        .get();
      
      const batch = db.batch();
      expiredSnapshot.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });
      
      await batch.commit();
      
      // Clean old scans
      const oldScansSnapshot = await db.collection('scans')
        .where('expiresAt', '<=', now)
        .limit(100)
        .get();
      
      const scanBatch = db.batch();
      oldScansSnapshot.forEach(doc => {
        scanBatch.delete(doc.ref);
        deletedCount++;
      });
      
      await scanBatch.commit();
      
      console.log(`Cleaned ${deletedCount} expired records`);
      
      return {
        cleaned: deletedCount,
        timestamp: now.toISOString()
      };
      
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  }

  /**
   * Log data access for compliance audit
   */
  async logDataAccess(userId, action, dataType) {
    const db = admin.firestore();
    
    await db.collection('auditLogs').add({
      userId,
      action,
      dataType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: global.currentRequestIp || 'system',
      userAgent: global.currentUserAgent || 'system'
    });
  }

  /**
   * Sanitize data for export
   */
  sanitizeForExport(data) {
    const sanitized = { ...data };
    
    // Remove system fields
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    delete sanitized.__v;
    delete sanitized._id;
    
    // Convert Firestore timestamps
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key]?.toDate) {
        sanitized[key] = sanitized[key].toDate().toISOString();
      }
    });
    
    return sanitized;
  }

  /**
   * Get privacy settings for user
   */
  async getUserPrivacySettings(userId) {
    const db = admin.firestore();
    
    try {
      const doc = await db.collection('privacy').doc(userId).get();
      
      if (!doc.exists) {
        // Return default settings
        return {
          dataCollection: true,
          analytics: true,
          marketing: false,
          thirdPartySharing: false,
          retentionPeriod: 30
        };
      }
      
      return doc.data();
    } catch (error) {
      console.error('Privacy settings error:', error);
      return {};
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(userId, settings) {
    const db = admin.firestore();
    
    await db.collection('privacy').doc(userId).set({
      ...settings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Log privacy preference change
    await this.logDataAccess(userId, 'privacy_update', 'settings');
  }
}

module.exports = DataPrivacyManager;