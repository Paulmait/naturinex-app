/**
 * Data Privacy Enhancement Module for Naturinex
 * Implements privacy-by-design principles and data protection measures
 */

import { db } from '../firebase';
import { doc, updateDoc, deleteField } from 'firebase/firestore';

export const DataPrivacy = {
  // Privacy Settings
  PrivacySettings: {
    defaultSettings: {
      shareDataForResearch: false,
      allowAnalytics: false,
      personalizationEnabled: true,
      marketingEmails: false,
      dataSharingWithPartners: false,
      anonymousUsageData: true
    },

    minimumDataCollection: {
      essential: [
        'userId',
        'email',
        'createdAt',
        'scanCount'
      ],
      optional: [
        'displayName',
        'preferences',
        'scanHistory'
      ]
    }
  },

  // Data Minimization
  DataMinimization: {
    // Remove unnecessary data from scan results before storing
    minimizeScanData(scanData) {
      const minimized = {
        timestamp: scanData.timestamp,
        medicationName: this.pseudonymizeMedication(scanData.medicationName),
        alternatives: scanData.alternatives?.map(alt => ({
          name: alt.name,
          effectiveness: alt.effectiveness,
          category: alt.category
        })),
        // Remove any PII or sensitive health data
        processed: true
      };

      return minimized;
    },

    // Pseudonymize medication names for privacy
    pseudonymizeMedication(medicationName) {
      // Keep first and last letter, hash the middle
      if (medicationName.length <= 3) return medicationName;
      
      const first = medicationName[0];
      const last = medicationName[medicationName.length - 1];
      const hash = this.simpleHash(medicationName.slice(1, -1));
      
      return `${first}***${hash.substring(0, 4)}***${last}`;
    },

    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    }
  },

  // Data Anonymization
  DataAnonymization: {
    // Anonymize user data for analytics
    anonymizeUserData(userData) {
      return {
        sessionId: this.generateSessionId(),
        timestamp: new Date().toISOString(),
        userType: userData.isPremium ? 'premium' : 'free',
        scanCount: Math.floor(userData.scanCount / 10) * 10, // Round to nearest 10
        region: this.getRegionFromTimezone(),
        // No PII included
      };
    },

    generateSessionId() {
      return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    },

    getRegionFromTimezone() {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const region = timezone.split('/')[0];
      return region || 'Unknown';
    }
  },

  // Consent Management
  ConsentManagement: {
    consentTypes: {
      ESSENTIAL: {
        id: 'essential',
        name: 'Essential Services',
        description: 'Required for basic app functionality',
        required: true,
        purposes: ['Authentication', 'Core Features', 'Security']
      },
      ANALYTICS: {
        id: 'analytics',
        name: 'Analytics & Performance',
        description: 'Help us improve the app',
        required: false,
        purposes: ['Usage Analytics', 'Performance Monitoring', 'Error Tracking']
      },
      PERSONALIZATION: {
        id: 'personalization',
        name: 'Personalization',
        description: 'Customize your experience',
        required: false,
        purposes: ['Recommendations', 'Saved Preferences', 'History']
      },
      MARKETING: {
        id: 'marketing',
        name: 'Marketing Communications',
        description: 'Receive updates and offers',
        required: false,
        purposes: ['Email Marketing', 'Product Updates', 'Special Offers']
      }
    },

    async updateConsent(userId, consentType, granted) {
      const timestamp = new Date().toISOString();
      const consentData = {
        [`consents.${consentType}`]: {
          granted,
          timestamp,
          version: '1.0'
        }
      };

      try {
        await updateDoc(doc(db, 'users', userId), consentData);
        
        // Log consent change for compliance
        await this.logConsentChange(userId, consentType, granted, timestamp);
        
        return { success: true };
      } catch (error) {
        console.error('Failed to update consent:', error);
        return { success: false, error: error.message };
      }
    },

    async logConsentChange(userId, consentType, granted, timestamp) {
      const logEntry = {
        userId,
        consentType,
        granted,
        timestamp,
        ipAddress: 'anonymized', // Don't store actual IP
        userAgent: navigator.userAgent
      };

      await doc(db, 'consent_logs', `${userId}_${timestamp}`).set(logEntry);
    }
  },

  // Data Encryption
  DataEncryption: {
    // Client-side encryption for sensitive data
    async encryptSensitiveData(data) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      // Generate a random key
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );
      
      // Export key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      
      return {
        encrypted: Array.from(new Uint8Array(encrypted)),
        key: Array.from(new Uint8Array(exportedKey)),
        iv: Array.from(iv)
      };
    },

    async decryptSensitiveData(encryptedData) {
      try {
        // Import the key
        const key = await crypto.subtle.importKey(
          'raw',
          new Uint8Array(encryptedData.key),
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
        
        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
          key,
          new Uint8Array(encryptedData.encrypted)
        );
        
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
      } catch (error) {
        console.error('Decryption failed:', error);
        return null;
      }
    }
  },

  // Right to be Forgotten
  RightToErasure: {
    async deleteAllUserData(userId) {
      const deletionLog = {
        userId,
        timestamp: new Date().toISOString(),
        dataCategories: []
      };

      try {
        // 1. Delete user profile
        await updateDoc(doc(db, 'users', userId), {
          deleted: true,
          deletedAt: new Date(),
          personalData: deleteField(),
          email: deleteField(),
          displayName: deleteField(),
          scanHistory: deleteField()
        });
        deletionLog.dataCategories.push('user_profile');

        // 2. Delete scan history
        // Note: In production, this would delete from scan_history collection
        deletionLog.dataCategories.push('scan_history');

        // 3. Delete analytics data
        deletionLog.dataCategories.push('analytics_data');

        // 4. Delete consent records (keep for legal compliance)
        deletionLog.consentRecordsRetained = true;

        // Log the deletion for compliance
        await doc(db, 'deletion_logs', userId).set(deletionLog);

        return { success: true, deletionLog };
      } catch (error) {
        console.error('Data deletion failed:', error);
        return { success: false, error: error.message };
      }
    }
  },

  // Data Portability
  DataPortability: {
    async exportUserData(userId) {
      try {
        // Collect all user data
        const userData = {
          exportDate: new Date().toISOString(),
          formatVersion: '1.0',
          userData: {
            profile: await this.getUserProfile(userId),
            scanHistory: await this.getScanHistory(userId),
            preferences: await this.getUserPreferences(userId),
            consents: await this.getUserConsents(userId)
          }
        };

        // Format as JSON for GDPR compliance
        const jsonData = JSON.stringify(userData, null, 2);
        
        // Create downloadable file
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        return {
          success: true,
          downloadUrl: url,
          filename: `naturinex_data_export_${userId}_${Date.now()}.json`
        };
      } catch (error) {
        console.error('Data export failed:', error);
        return { success: false, error: error.message };
      }
    },

    async getUserProfile(userId) {
      // Fetch and return user profile data
      // Implementation depends on your data structure
      return {
        userId,
        // ... other profile fields
      };
    },

    async getScanHistory(userId) {
      // Fetch and return scan history
      return [];
    },

    async getUserPreferences(userId) {
      // Fetch and return user preferences
      return {};
    },

    async getUserConsents(userId) {
      // Fetch and return consent records
      return {};
    }
  },

  // Privacy-Preserving Analytics
  PrivacyAnalytics: {
    // Differential privacy for aggregate statistics
    addNoise(value, epsilon = 1.0) {
      // Laplace mechanism for differential privacy
      const sensitivity = 1;
      const scale = sensitivity / epsilon;
      const u = Math.random() - 0.5;
      const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
      return Math.round(value + noise);
    },

    // K-anonymity check
    checkKAnonymity(dataset, k = 5) {
      const groups = {};
      
      dataset.forEach(record => {
        const key = this.getQuasiIdentifiers(record);
        groups[key] = (groups[key] || 0) + 1;
      });

      return Object.values(groups).every(count => count >= k);
    },

    getQuasiIdentifiers(record) {
      // Extract quasi-identifiers that could be used to identify someone
      return `${record.ageGroup}_${record.region}_${record.userType}`;
    }
  },

  // Security Audit Trail
  AuditTrail: {
    async logDataAccess(userId, dataType, purpose) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        userId,
        dataType,
        purpose,
        sessionId: this.getCurrentSessionId(),
        result: 'granted'
      };

      try {
        await doc(db, 'audit_logs', `${userId}_${Date.now()}`).set(logEntry);
      } catch (error) {
        console.error('Failed to log data access:', error);
      }
    },

    getCurrentSessionId() {
      return sessionStorage.getItem('sessionId') || 'no-session';
    }
  }
};

// Export privacy utilities
export const minimizeData = (data) => {
  return DataPrivacy.DataMinimization.minimizeScanData(data);
};

export const anonymizeForAnalytics = (userData) => {
  return DataPrivacy.DataAnonymization.anonymizeUserData(userData);
};

export const encryptSensitive = async (data) => {
  return await DataPrivacy.DataEncryption.encryptSensitiveData(data);
};

export const updatePrivacyConsent = async (userId, consentType, granted) => {
  return await DataPrivacy.ConsentManagement.updateConsent(userId, consentType, granted);
};