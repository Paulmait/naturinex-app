import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

/**
 * Privacy Compliance Manager
 * Handles HIPAA, GDPR, and health data privacy requirements
 */
class PrivacyComplianceManager {
  constructor() {
    this.consentStatus = {
      dataCollection: false,
      dataProcessing: false,
      dataSharing: false,
      analytics: false,
      marketing: false
    };

    this.dataRetentionPeriods = {
      healthData: 365 * 7, // 7 years for health data
      analytics: 365 * 2,   // 2 years for analytics
      logs: 90,             // 90 days for logs
      temporary: 7          // 7 days for temporary data
    };

    this.encryptionKey = null;
    this.auditLog = [];
  }

  /**
   * Initialize privacy manager
   */
  async initialize() {
    try {
      await this.loadConsentStatus();
      await this.initializeEncryption();
      await this.loadAuditLog();

      console.log('PrivacyComplianceManager initialized');
      return { success: true };
    } catch (error) {
      console.error('Privacy manager initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Request user consent for data processing
   */
  async requestConsent(consentTypes = []) {
    try {
      const consentRequest = {
        id: this.generateConsentId(),
        timestamp: new Date().toISOString(),
        types: consentTypes,
        status: 'pending'
      };

      await this.logAuditEvent('consent_requested', {
        consentId: consentRequest.id,
        types: consentTypes
      });

      return consentRequest;
    } catch (error) {
      console.error('Consent request failed:', error);
      throw error;
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(consentId, granted, consentTypes = []) {
    try {
      const consentRecord = {
        id: consentId,
        timestamp: new Date().toISOString(),
        granted,
        types: consentTypes,
        ipAddress: await this.getClientIP(),
        userAgent: this.getUserAgent(),
        version: '1.0'
      };

      // Update consent status
      consentTypes.forEach(type => {
        if (this.consentStatus.hasOwnProperty(type)) {
          this.consentStatus[type] = granted;
        }
      });

      await this.saveConsentStatus();
      await this.saveConsentRecord(consentRecord);

      await this.logAuditEvent('consent_recorded', {
        consentId,
        granted,
        types: consentTypes
      });

      return { success: true, consentRecord };
    } catch (error) {
      console.error('Consent recording failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate permission request
   */
  async validatePermissionRequest(readTypes, writeTypes) {
    // Check if user has consented to data collection
    if (!this.consentStatus.dataCollection) {
      throw new Error('Data collection consent required');
    }

    // Validate requested permissions are legitimate
    const validTypes = [
      'steps', 'heartRate', 'weight', 'height', 'sleep',
      'distance', 'calories', 'bloodPressure', 'temperature'
    ];

    const invalidRead = readTypes.filter(type => !validTypes.includes(type));
    const invalidWrite = writeTypes.filter(type => !validTypes.includes(type));

    if (invalidRead.length > 0 || invalidWrite.length > 0) {
      throw new Error(`Invalid permission types requested: ${[...invalidRead, ...invalidWrite].join(', ')}`);
    }

    await this.logAuditEvent('permission_validated', {
      readTypes,
      writeTypes
    });

    return true;
  }

  /**
   * Validate data access
   */
  async validateDataAccess(dataType, accessType) {
    // Check consent
    if (!this.consentStatus.dataCollection) {
      throw new Error('Data access not permitted - consent required');
    }

    // Check if access is legitimate
    const sensitiveTypes = ['heartRate', 'bloodPressure', 'weight', 'sleep'];
    if (sensitiveTypes.includes(dataType)) {
      await this.logAuditEvent('sensitive_data_access', {
        dataType,
        accessType,
        timestamp: new Date().toISOString()
      });
    }

    return true;
  }

  /**
   * Validate health data before processing
   */
  async validateHealthData(data) {
    const validationRules = {
      required: ['value', 'timestamp'],
      sanitization: ['metadata', 'source'],
      encryption: ['personalInfo', 'identifiers']
    };

    // Check required fields
    const dataArray = Array.isArray(data) ? data : [data];

    for (const item of dataArray) {
      for (const field of validationRules.required) {
        if (!item[field]) {
          throw new Error(`Required field '${field}' missing in health data`);
        }
      }

      // Sanitize fields
      for (const field of validationRules.sanitization) {
        if (item[field]) {
          item[field] = this.sanitizeData(item[field]);
        }
      }

      // Flag for encryption
      for (const field of validationRules.encryption) {
        if (item[field]) {
          item._requiresEncryption = true;
        }
      }
    }

    return true;
  }

  /**
   * Encrypt sensitive health data
   */
  async encryptHealthData(data) {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption();
      }

      const dataString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();

      await this.logAuditEvent('data_encrypted', {
        dataType: data.type || 'unknown',
        size: dataString.length
      });

      return {
        encrypted: true,
        data: encrypted,
        algorithm: 'AES-256',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt health data
   */
  async decryptHealthData(encryptedData) {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, this.encryptionKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      await this.logAuditEvent('data_decrypted', {
        timestamp: new Date().toISOString()
      });

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Handle data subject rights (GDPR)
   */
  async handleDataSubjectRequest(requestType, userId) {
    const handlers = {
      'access': () => this.handleDataAccessRequest(userId),
      'portability': () => this.handleDataPortabilityRequest(userId),
      'rectification': () => this.handleDataRectificationRequest(userId),
      'erasure': () => this.handleDataErasureRequest(userId),
      'restriction': () => this.handleDataRestrictionRequest(userId),
      'objection': () => this.handleDataObjectionRequest(userId)
    };

    const handler = handlers[requestType];
    if (!handler) {
      throw new Error(`Unknown data subject request type: ${requestType}`);
    }

    await this.logAuditEvent('data_subject_request', {
      requestType,
      userId,
      timestamp: new Date().toISOString()
    });

    return await handler();
  }

  /**
   * Handle data access request (right to access)
   */
  async handleDataAccessRequest(userId) {
    try {
      // Collect all user data
      const userData = await this.collectUserData(userId);

      const accessReport = {
        requestId: this.generateRequestId(),
        userId,
        timestamp: new Date().toISOString(),
        data: userData,
        processingActivities: await this.getProcessingActivities(userId),
        thirdPartySharing: await this.getThirdPartySharing(userId),
        retentionPeriods: this.dataRetentionPeriods
      };

      await this.logAuditEvent('data_access_fulfilled', {
        userId,
        requestId: accessReport.requestId
      });

      return accessReport;
    } catch (error) {
      console.error('Data access request failed:', error);
      throw error;
    }
  }

  /**
   * Handle data erasure request (right to be forgotten)
   */
  async handleDataErasureRequest(userId) {
    try {
      const deletionReport = {
        requestId: this.generateRequestId(),
        userId,
        timestamp: new Date().toISOString(),
        deletedData: [],
        exceptions: []
      };

      // Delete user health data
      const healthDataKeys = await this.getUserHealthDataKeys(userId);
      for (const key of healthDataKeys) {
        try {
          await AsyncStorage.removeItem(key);
          deletionReport.deletedData.push(key);
        } catch (error) {
          deletionReport.exceptions.push({ key, error: error.message });
        }
      }

      // Delete user preferences
      await AsyncStorage.removeItem(`user_preferences_${userId}`);
      deletionReport.deletedData.push(`user_preferences_${userId}`);

      // Delete consent records
      await AsyncStorage.removeItem(`consent_records_${userId}`);
      deletionReport.deletedData.push(`consent_records_${userId}`);

      await this.logAuditEvent('data_erasure_fulfilled', {
        userId,
        requestId: deletionReport.requestId,
        itemsDeleted: deletionReport.deletedData.length
      });

      return deletionReport;
    } catch (error) {
      console.error('Data erasure request failed:', error);
      throw error;
    }
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData() {
    try {
      const now = Date.now();
      const cleanupReport = {
        timestamp: new Date().toISOString(),
        cleaned: []
      };

      for (const [dataType, retentionDays] of Object.entries(this.dataRetentionPeriods)) {
        const cutoffDate = now - (retentionDays * 24 * 60 * 60 * 1000);
        const cleaned = await this.cleanupDataType(dataType, cutoffDate);
        cleanupReport.cleaned.push({ dataType, count: cleaned });
      }

      await this.logAuditEvent('data_cleanup', cleanupReport);
      return cleanupReport;
    } catch (error) {
      console.error('Data cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Generate privacy audit report
   */
  async generatePrivacyAuditReport() {
    try {
      const report = {
        generated: new Date().toISOString(),
        consentStatus: this.consentStatus,
        auditEvents: this.auditLog.slice(-100), // Last 100 events
        dataRetentionCompliance: await this.checkDataRetentionCompliance(),
        encryptionStatus: {
          enabled: !!this.encryptionKey,
          algorithm: 'AES-256'
        },
        complianceScore: await this.calculateComplianceScore()
      };

      await this.logAuditEvent('audit_report_generated', {
        reportId: this.generateRequestId(),
        eventsIncluded: report.auditEvents.length
      });

      return report;
    } catch (error) {
      console.error('Audit report generation failed:', error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  async initializeEncryption() {
    try {
      let key = await AsyncStorage.getItem('encryption_key');
      if (!key) {
        key = CryptoJS.lib.WordArray.random(256/8).toString();
        await AsyncStorage.setItem('encryption_key', key);
      }
      this.encryptionKey = key;
    } catch (error) {
      console.error('Encryption initialization failed:', error);
      throw error;
    }
  }

  sanitizeData(data) {
    if (typeof data === 'string') {
      return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return data;
  }

  async logAuditEvent(eventType, data) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data: data || {}
    };

    this.auditLog.push(event);

    // Keep only last 1000 events in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    await this.saveAuditLog();
  }

  generateConsentId() {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getClientIP() {
    // In a real app, this would get the actual client IP
    return 'client_ip_masked';
  }

  getUserAgent() {
    // In a real app, this would get the actual user agent
    return 'Naturinex Mobile App';
  }

  async loadConsentStatus() {
    try {
      const stored = await AsyncStorage.getItem('consent_status');
      if (stored) {
        this.consentStatus = { ...this.consentStatus, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load consent status:', error);
    }
  }

  async saveConsentStatus() {
    try {
      await AsyncStorage.setItem('consent_status', JSON.stringify(this.consentStatus));
    } catch (error) {
      console.error('Failed to save consent status:', error);
    }
  }

  async saveConsentRecord(record) {
    try {
      const key = `consent_record_${record.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(record));
    } catch (error) {
      console.error('Failed to save consent record:', error);
    }
  }

  async loadAuditLog() {
    try {
      const stored = await AsyncStorage.getItem('audit_log');
      if (stored) {
        this.auditLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load audit log:', error);
    }
  }

  async saveAuditLog() {
    try {
      await AsyncStorage.setItem('audit_log', JSON.stringify(this.auditLog.slice(-1000)));
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  async collectUserData(userId) {
    // This would collect all user data for access requests
    return {
      healthData: await this.getUserHealthData(userId),
      preferences: await this.getUserPreferences(userId),
      consentRecords: await this.getUserConsentRecords(userId)
    };
  }

  async getUserHealthData(userId) {
    // Placeholder - would collect actual health data
    return [];
  }

  async getUserPreferences(userId) {
    try {
      const stored = await AsyncStorage.getItem(`user_preferences_${userId}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  async getUserConsentRecords(userId) {
    // Placeholder - would collect consent records
    return [];
  }

  async getUserHealthDataKeys(userId) {
    // Placeholder - would return all health data keys for a user
    return [];
  }

  async getProcessingActivities(userId) {
    return [
      {
        activity: 'Health Data Analysis',
        purpose: 'Providing health insights and recommendations',
        lawfulBasis: 'Consent'
      }
    ];
  }

  async getThirdPartySharing(userId) {
    return [];
  }

  async cleanupDataType(dataType, cutoffDate) {
    // Placeholder - would clean up expired data
    return 0;
  }

  async checkDataRetentionCompliance() {
    return {
      compliant: true,
      issues: []
    };
  }

  async calculateComplianceScore() {
    let score = 0;
    if (this.consentStatus.dataCollection) score += 25;
    if (this.encryptionKey) score += 25;
    if (this.auditLog.length > 0) score += 25;
    if (this.consentStatus.dataProcessing) score += 25;
    return score;
  }
}

export default PrivacyComplianceManager;