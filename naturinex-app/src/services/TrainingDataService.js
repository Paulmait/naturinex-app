/**
 * Training Data Service
 *
 * Handles user consent and anonymized data collection for LLM training.
 * All data is anonymized before storage to protect user privacy.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl ||
  'https://hxhbsxzkzarqwksbjpce.supabase.co';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

// Consent version - increment when terms change
const CONSENT_VERSION = '1.0';

// Storage keys
const CONSENT_KEY = 'training_data_consent';
const ANONYMOUS_ID_KEY = 'training_anonymous_id';

class TrainingDataService {
  constructor() {
    this.anonymousId = null;
    this.consentStatus = null;
  }

  /**
   * Initialize the service and load consent status
   */
  async initialize() {
    try {
      // Load consent status from local storage
      const storedConsent = await AsyncStorage.getItem(CONSENT_KEY);
      if (storedConsent) {
        this.consentStatus = JSON.parse(storedConsent);
      }

      // Load or generate anonymous ID
      let anonymousId = await SecureStore.getItemAsync(ANONYMOUS_ID_KEY);
      if (!anonymousId) {
        anonymousId = await this.generateAnonymousId();
        await SecureStore.setItemAsync(ANONYMOUS_ID_KEY, anonymousId);
      }
      this.anonymousId = anonymousId;

      return true;
    } catch (error) {
      console.error('[TrainingDataService] Initialize error:', error);
      return false;
    }
  }

  /**
   * Generate a unique anonymous ID that cannot be linked back to the user
   */
  async generateAnonymousId() {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const timestamp = Date.now().toString();
    const combined = new Uint8Array([...randomBytes, ...new TextEncoder().encode(timestamp)]);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Array.from(combined).join('')
    );
    return hash;
  }

  /**
   * Check if user has given consent for training data collection
   */
  async hasConsent() {
    if (!this.consentStatus) {
      await this.initialize();
    }
    return this.consentStatus?.consentGiven === true &&
           this.consentStatus?.version === CONSENT_VERSION &&
           !this.consentStatus?.revokedAt;
  }

  /**
   * Get current consent status with details
   */
  async getConsentStatus() {
    if (!this.consentStatus) {
      await this.initialize();
    }
    return {
      hasConsent: await this.hasConsent(),
      consentDate: this.consentStatus?.consentDate,
      version: this.consentStatus?.version,
      revokedAt: this.consentStatus?.revokedAt,
    };
  }

  /**
   * Record user consent for training data collection
   */
  async giveConsent() {
    try {
      const userId = await SecureStore.getItemAsync('user_id');
      const authToken = await SecureStore.getItemAsync('auth_token');

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const consentData = {
        consentGiven: true,
        consentDate: new Date().toISOString(),
        version: CONSENT_VERSION,
        revokedAt: null,
      };

      // Store locally
      await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
      this.consentStatus = consentData;

      // Store on server (if authenticated)
      if (authToken) {
        await this.syncConsentToServer(userId, authToken, true);
      }

      console.log('[TrainingDataService] Consent given');
      return { success: true };
    } catch (error) {
      console.error('[TrainingDataService] Give consent error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Revoke user consent for training data collection
   */
  async revokeConsent() {
    try {
      const userId = await SecureStore.getItemAsync('user_id');
      const authToken = await SecureStore.getItemAsync('auth_token');

      const consentData = {
        ...this.consentStatus,
        consentGiven: false,
        revokedAt: new Date().toISOString(),
      };

      // Store locally
      await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
      this.consentStatus = consentData;

      // Update server
      if (authToken && userId) {
        await this.syncConsentToServer(userId, authToken, false);
      }

      console.log('[TrainingDataService] Consent revoked');
      return { success: true };
    } catch (error) {
      console.error('[TrainingDataService] Revoke consent error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync consent status to server
   */
  async syncConsentToServer(userId, authToken, consentGiven) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/training_data_consent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          consent_given: consentGiven,
          consent_date: consentGiven ? new Date().toISOString() : null,
          consent_version: CONSENT_VERSION,
          revoked_at: consentGiven ? null : new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[TrainingDataService] Sync consent error:', error);
      return false;
    }
  }

  /**
   * Anonymize and submit scan data for training (only if consent given)
   */
  async submitScanForTraining(scanData) {
    try {
      // Check consent first
      const hasConsent = await this.hasConsent();
      if (!hasConsent) {
        console.log('[TrainingDataService] No consent, skipping data submission');
        return { submitted: false, reason: 'no_consent' };
      }

      if (!this.anonymousId) {
        await this.initialize();
      }

      // Anonymize the data
      const anonymizedData = await this.anonymizeScanData(scanData);

      // Submit to server
      const authToken = await SecureStore.getItemAsync('auth_token');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/training_scan_data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anonymizedData),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      console.log('[TrainingDataService] Scan submitted for training');
      return { submitted: true };
    } catch (error) {
      console.error('[TrainingDataService] Submit scan error:', error);
      return { submitted: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Anonymize scan data to remove any personally identifiable information
   */
  async anonymizeScanData(scanData) {
    // Generate hash for image deduplication (if image exists)
    let imageHash = null;
    if (scanData.imageBase64) {
      imageHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        scanData.imageBase64.substring(0, 10000) // Hash first 10KB for performance
      );
    }

    // Remove any PII from extracted text
    const sanitizedText = this.sanitizeText(scanData.extractedText || '');

    // Anonymize AI response (remove any user-specific data)
    const anonymizedAiResponse = this.anonymizeAiResponse(scanData.aiResponse);

    return {
      anonymous_id: this.anonymousId,
      scan_type: scanData.scanType || 'unknown',
      product_category: scanData.category || null,
      extracted_text: sanitizedText,
      medication_name: scanData.medicationName || null,
      detected_ingredients: scanData.ingredients || [],
      ai_response: anonymizedAiResponse,
      natural_alternatives: scanData.alternatives || null,
      confidence_score: scanData.confidenceScore || null,
      image_hash: imageHash,
      ocr_confidence: scanData.ocrConfidence || null,
      is_valid_for_training: true,
      scan_date: new Date().toISOString().split('T')[0], // Only date, no time
    };
  }

  /**
   * Remove potential PII from text
   */
  sanitizeText(text) {
    if (!text) return null;

    // Remove email addresses
    let sanitized = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

    // Remove phone numbers
    sanitized = sanitized.replace(/(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g, '[PHONE]');

    // Remove SSN patterns
    sanitized = sanitized.replace(/\d{3}[-\s]?\d{2}[-\s]?\d{4}/g, '[REDACTED]');

    // Remove names after common patterns (Rx for:, Patient:, etc.)
    sanitized = sanitized.replace(/(Rx\s*(?:for)?|Patient|Name|Dr\.?)\s*:?\s*[A-Z][a-z]+\s+[A-Z][a-z]+/gi, '$1: [NAME]');

    // Remove dates of birth
    sanitized = sanitized.replace(/DOB\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi, 'DOB: [DATE]');

    return sanitized;
  }

  /**
   * Anonymize AI response
   */
  anonymizeAiResponse(response) {
    if (!response) return null;

    // Deep clone to avoid mutating original
    const anonymized = JSON.parse(JSON.stringify(response));

    // Remove any user-related fields
    delete anonymized.userId;
    delete anonymized.userEmail;
    delete anonymized.deviceId;
    delete anonymized.ipAddress;
    delete anonymized.location;

    return anonymized;
  }

  /**
   * Upload image to training storage (only if consent given)
   */
  async uploadTrainingImage(imageBase64, imageHash) {
    try {
      const hasConsent = await this.hasConsent();
      if (!hasConsent) {
        return { uploaded: false, reason: 'no_consent' };
      }

      const authToken = await SecureStore.getItemAsync('auth_token');
      const fileName = `${this.anonymousId}/${imageHash}.jpg`;

      // Convert base64 to blob
      const response = await fetch(`data:image/jpeg;base64,${imageBase64}`);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/training-images/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'image/jpeg',
          },
          body: blob,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      return { uploaded: true, path: fileName };
    } catch (error) {
      console.error('[TrainingDataService] Upload image error:', error);
      return { uploaded: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Get training data statistics (public, anonymized)
   */
  async getTrainingStats() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/training_data_stats?order=stat_date.desc&limit=30`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[TrainingDataService] Get stats error:', error);
      return [];
    }
  }
}

export default new TrainingDataService();
