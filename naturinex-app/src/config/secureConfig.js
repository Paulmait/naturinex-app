// Secure Configuration Service
// This service handles all sensitive configuration securely
// No API keys are exposed in the source code
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
class SecureConfigService {
  constructor() {
    this.config = {};
    this.initialized = false;
    this.encryptionKey = null;
  }
  // Initialize secure configuration
  async initialize() {
    if (this.initialized) return;
    try {
      // Generate or retrieve device-specific encryption key
      this.encryptionKey = await this.getOrCreateEncryptionKey();
      // Load configuration from secure sources
      await this.loadConfiguration();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize secure config:', error);
      throw new Error('Security initialization failed');
    }
  }
  // Get or create device-specific encryption key
  async getOrCreateEncryptionKey() {
    try {
      let key = await SecureStore.getItemAsync('device_encryption_key');
      if (!key) {
        // Generate new encryption key
        key = this.generateSecureKey();
        await SecureStore.setItemAsync('device_encryption_key', key);
      }
      return key;
    } catch (error) {
      console.error('Error managing encryption key:', error);
      throw error;
    }
  }
  // Generate cryptographically secure key
  generateSecureKey() {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for React Native
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Load configuration from secure sources
  async loadConfiguration() {
    // Environment-based configuration
    const env = Constants.expoConfig?.extra?.env || 'production';
    // API endpoints (public information)
    this.config.api = {
      baseUrl: this.getApiUrl(env),
      timeout: 30000,
      retryAttempts: 3,
    };
    // Load sensitive keys from secure backend
    await this.loadSensitiveKeys();
    // Feature flags
    this.config.features = {
      enableOCR: true,
      enableBarcode: true,
      enableOfflineMode: true,
      enableAnalytics: env === 'production',
      enableCrashReporting: env === 'production',
      requireMedicalDisclaimer: true,
      enforceHIPAA: true,
    };
    // Security settings
    this.config.security = {
      sessionTimeout: 15 * 60 * 1000, // 15 minutes
      maxLoginAttempts: 5,
      passwordMinLength: 12,
      requireMFA: false,
      encryptLocalData: true,
      auditLogging: true,
    };
    // Compliance settings
    this.config.compliance = {
      hipaa: {
        enabled: true,
        encryptPHI: true,
        auditAccess: true,
        dataRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      },
      gdpr: {
        enabled: true,
        requireConsent: true,
        allowDataExport: true,
        allowDataDeletion: true,
      },
    };
  }
  // Get API URL based on environment
  getApiUrl(env) {
    const urls = {
      development: 'http://localhost:54321',
      staging: 'https://api-staging.naturinex.com',
      production: 'https://api.naturinex.com',
    };
    return urls[env] || urls.production;
  }
  // Load sensitive keys from secure backend
  async loadSensitiveKeys() {
    try {
      // These should be fetched from a secure backend endpoint
      // after proper authentication
      const response = await this.fetchSecureKeys();
      if (response) {
        // Store encrypted in memory only
        this.config.keys = this.encryptKeys(response);
      }
    } catch (error) {
      console.error('Failed to load sensitive keys:', error);
      // Use fallback configuration without sensitive keys
      this.config.keys = {};
    }
  }
  // Fetch secure keys from backend
  async fetchSecureKeys() {
    try {
      // Get auth token
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) return null;
      // Fetch from secure endpoint
      const response = await fetch(`${this.config.api.baseUrl}/api/secure/keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: Constants.platform,
          version: Constants.expoConfig?.version,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch secure keys');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching secure keys:', error);
      return null;
    }
  }
  // Encrypt sensitive keys
  encryptKeys(keys) {
    const encrypted = {};
    for (const [key, value] of Object.entries(keys)) {
      if (value) {
        encrypted[key] = CryptoJS.AES.encrypt(
          JSON.stringify(value),
          this.encryptionKey
        ).toString();
      }
    }
    return encrypted;
  }
  // Decrypt and get a specific key
  getSecureKey(keyName) {
    if (!this.config.keys || !this.config.keys[keyName]) {
      return null;
    }
    try {
      const decrypted = CryptoJS.AES.decrypt(
        this.config.keys[keyName],
        this.encryptionKey
      ).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting key:', error);
      return null;
    }
  }
  // Get configuration value
  get(path) {
    const keys = path.split('.');
    let value = this.config;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    return value;
  }
  // Check if a feature is enabled
  isFeatureEnabled(feature) {
    return this.config.features?.[feature] || false;
  }
  // Get API configuration
  getApiConfig() {
    return {
      baseUrl: this.config.api.baseUrl,
      timeout: this.config.api.timeout,
      headers: {
        'X-App-Version': Constants.expoConfig?.version,
        'X-Platform': Constants.platform?.os,
      },
    };
  }
  // Clear sensitive data
  async clearSensitiveData() {
    this.config.keys = {};
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }
  // Validate configuration
  validateConfiguration() {
    const required = [
      'api.baseUrl',
      'security.sessionTimeout',
      'compliance.hipaa.enabled',
    ];
    for (const path of required) {
      if (this.get(path) === undefined) {
        throw new Error(`Missing required configuration: ${path}`);
      }
    }
    return true;
  }
}
// Create singleton instance
const secureConfig = new SecureConfigService();
export default secureConfig;
// Export specific configuration getters
export const getApiUrl = () => secureConfig.get('api.baseUrl');
export const isHIPAAEnabled = () => secureConfig.get('compliance.hipaa.enabled');
export const getSessionTimeout = () => secureConfig.get('security.sessionTimeout');
export const requiresMedicalDisclaimer = () => secureConfig.get('features.requireMedicalDisclaimer');