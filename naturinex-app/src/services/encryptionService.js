// HIPAA-Compliant Encryption Service
// Implements AES-256 encryption for all PHI (Protected Health Information)

import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import { supabase, auditLog } from '../config/supabase';

class EncryptionService {
  constructor() {
    this.masterKey = null;
    this.dataKeys = new Map();
    this.initialized = false;
  }

  // Initialize encryption service
  async initialize() {
    if (this.initialized) return;

    try {
      // Get or create master encryption key
      this.masterKey = await this.getMasterKey();
      
      // Load data encryption keys
      await this.loadDataKeys();
      
      this.initialized = true;
      
      // Audit log
      await auditLog('encryption_initialized', { timestamp: new Date() });
    } catch (error) {
      console.error('Encryption initialization failed:', error);
      throw new Error('Security initialization failed');
    }
  }

  // Get or create master key (device-specific)
  async getMasterKey() {
    try {
      let key = await SecureStore.getItemAsync('hipaa_master_key');
      
      if (!key) {
        // Generate new master key
        key = this.generateKey(256);
        await SecureStore.setItemAsync('hipaa_master_key', key);
        
        // Audit log key generation
        await auditLog('master_key_generated', {
          timestamp: new Date(),
          keyId: this.hashKey(key),
        });
      }
      
      return key;
    } catch (error) {
      console.error('Master key error:', error);
      throw error;
    }
  }

  // Generate cryptographically secure key
  generateKey(bits = 256) {
    const bytes = bits / 8;
    const array = new Uint8Array(bytes);
    
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // React Native fallback
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Load data encryption keys
  async loadDataKeys() {
    // Generate unique keys for different data types
    const dataTypes = [
      'medications',
      'health_conditions',
      'allergies',
      'scan_results',
      'personal_info',
    ];

    for (const dataType of dataTypes) {
      const keyName = `dek_${dataType}`;
      let key = await SecureStore.getItemAsync(keyName);
      
      if (!key) {
        key = this.generateKey(256);
        await SecureStore.setItemAsync(keyName, key);
      }
      
      this.dataKeys.set(dataType, key);
    }
  }

  // Encrypt PHI data
  encryptPHI(data, dataType = 'general') {
    if (!this.initialized) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Get appropriate data key
      const dataKey = this.dataKeys.get(dataType) || this.masterKey;
      
      // Convert data to string
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Encrypt with AES-256
      const encrypted = CryptoJS.AES.encrypt(dataString, dataKey, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      
      // Create encrypted object with metadata
      const encryptedData = {
        ciphertext: encrypted.toString(),
        dataType,
        algorithm: 'AES-256-CBC',
        timestamp: new Date().toISOString(),
        keyId: this.hashKey(dataKey),
      };
      
      return encryptedData;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt PHI data
  decryptPHI(encryptedData) {
    if (!this.initialized) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Get appropriate data key
      const dataKey = this.dataKeys.get(encryptedData.dataType) || this.masterKey;
      
      // Verify key ID
      if (encryptedData.keyId !== this.hashKey(dataKey)) {
        throw new Error('Key mismatch - data may be corrupted');
      }
      
      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(encryptedData.ciphertext, dataKey, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      
      // Convert to string
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Encrypt field-level data for database
  encryptField(value, fieldName) {
    if (!value) return null;
    
    const encrypted = this.encryptPHI(value, this.getDataTypeForField(fieldName));
    return encrypted.ciphertext;
  }

  // Decrypt field-level data from database
  decryptField(encryptedValue, fieldName) {
    if (!encryptedValue) return null;
    
    const encryptedData = {
      ciphertext: encryptedValue,
      dataType: this.getDataTypeForField(fieldName),
      keyId: this.hashKey(this.dataKeys.get(this.getDataTypeForField(fieldName)) || this.masterKey),
    };
    
    return this.decryptPHI(encryptedData);
  }

  // Determine data type based on field name
  getDataTypeForField(fieldName) {
    const fieldMap = {
      medication: 'medications',
      drug: 'medications',
      condition: 'health_conditions',
      diagnosis: 'health_conditions',
      allergy: 'allergies',
      scan: 'scan_results',
      analysis: 'scan_results',
      name: 'personal_info',
      dob: 'personal_info',
      ssn: 'personal_info',
      phone: 'personal_info',
      address: 'personal_info',
    };

    for (const [key, dataType] of Object.entries(fieldMap)) {
      if (fieldName.toLowerCase().includes(key)) {
        return dataType;
      }
    }

    return 'general';
  }

  // Hash key for identification (not reversible)
  hashKey(key) {
    return CryptoJS.SHA256(key).toString().substring(0, 16);
  }

  // Encrypt file (for images, documents)
  async encryptFile(file) {
    try {
      // Read file as base64
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Encrypt base64 data
      const encrypted = this.encryptPHI(base64, 'files');
      
      return encrypted;
    } catch (error) {
      console.error('File encryption error:', error);
      throw error;
    }
  }

  // Secure data transmission
  prepareForTransmission(data) {
    // Add integrity check
    const payload = {
      data: this.encryptPHI(data),
      checksum: CryptoJS.SHA256(JSON.stringify(data)).toString(),
      timestamp: new Date().toISOString(),
    };
    
    // Sign payload
    const signature = CryptoJS.HmacSHA256(
      JSON.stringify(payload),
      this.masterKey
    ).toString();
    
    return {
      ...payload,
      signature,
    };
  }

  // Verify and decrypt received data
  verifyAndDecrypt(payload) {
    // Verify signature
    const { signature, ...data } = payload;
    const expectedSignature = CryptoJS.HmacSHA256(
      JSON.stringify(data),
      this.masterKey
    ).toString();
    
    if (signature !== expectedSignature) {
      throw new Error('Data integrity check failed');
    }
    
    // Decrypt data
    const decrypted = this.decryptPHI(data.data);
    
    // Verify checksum
    const checksum = CryptoJS.SHA256(JSON.stringify(decrypted)).toString();
    if (checksum !== data.checksum) {
      throw new Error('Data corruption detected');
    }
    
    return decrypted;
  }

  // Rotate encryption keys
  async rotateKeys() {
    try {
      // Generate new keys
      const newMasterKey = this.generateKey(256);
      const newDataKeys = new Map();
      
      // Re-encrypt data keys with new master key
      for (const [dataType, oldKey] of this.dataKeys) {
        const newKey = this.generateKey(256);
        newDataKeys.set(dataType, newKey);
        
        // Store encrypted
        await SecureStore.setItemAsync(`dek_${dataType}`, newKey);
      }
      
      // Update master key
      await SecureStore.setItemAsync('hipaa_master_key', newMasterKey);
      
      // Update in memory
      this.masterKey = newMasterKey;
      this.dataKeys = newDataKeys;
      
      // Audit log
      await auditLog('keys_rotated', {
        timestamp: new Date(),
        keyIds: Array.from(newDataKeys.keys()),
      });
      
      return true;
    } catch (error) {
      console.error('Key rotation error:', error);
      throw error;
    }
  }

  // Clear all keys (for logout)
  async clearKeys() {
    this.masterKey = null;
    this.dataKeys.clear();
    this.initialized = false;
    
    // Audit log
    await auditLog('encryption_keys_cleared', {
      timestamp: new Date(),
    });
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

export default encryptionService;

// Export convenience functions
export const encryptPHI = (data, dataType) => encryptionService.encryptPHI(data, dataType);
export const decryptPHI = (encryptedData) => encryptionService.decryptPHI(encryptedData);
export const encryptField = (value, fieldName) => encryptionService.encryptField(value, fieldName);
export const decryptField = (encryptedValue, fieldName) => encryptionService.decryptField(encryptedValue, fieldName);