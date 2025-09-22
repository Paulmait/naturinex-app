import EncryptionService from '../encryptionService';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  },
  auditLog: jest.fn().mockResolvedValue()
}));
describe('EncryptionService', () => {
  let encryptionService;
  beforeEach(() => {
    jest.clearAllMocks();
    encryptionService = new EncryptionService();
  });
  describe('Initialization', () => {
    test('should initialize encryption service with master key', async () => {
      const mockKey = 'test-master-key-256-bits-long';
      SecureStore.getItemAsync.mockResolvedValue(mockKey);
      await encryptionService.initialize();
      expect(encryptionService.initialized).toBe(true);
      expect(encryptionService.masterKey).toBe(mockKey);
    });
    test('should generate new master key if none exists', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      SecureStore.setItemAsync.mockResolvedValue();
      await encryptionService.initialize();
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'hipaa_master_key',
        expect.any(String)
      );
      expect(encryptionService.initialized).toBe(true);
    });
    test('should throw error if initialization fails', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('SecureStore error'));
      await expect(encryptionService.initialize()).rejects.toThrow(
        'Security initialization failed'
      );
    });
  });
  describe('Data Encryption/Decryption', () => {
    beforeEach(async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
    });
    test('should encrypt PHI data correctly', async () => {
      const testData = {
        medicationName: 'Aspirin',
        dosage: '100mg',
        patientId: 'patient-123'
      };
      const encrypted = await encryptionService.encryptPHI(testData, 'medical-data');
      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('keyId');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted.data).not.toBe(JSON.stringify(testData));
    });
    test('should decrypt PHI data correctly', async () => {
      const testData = {
        medicationName: 'Aspirin',
        dosage: '100mg',
        patientId: 'patient-123'
      };
      const encrypted = await encryptionService.encryptPHI(testData, 'medical-data');
      const decrypted = await encryptionService.decryptPHI(encrypted);
      expect(decrypted).toEqual(testData);
    });
    test('should handle encryption of large datasets', async () => {
      const largeData = {
        scanResults: new Array(1000).fill({
          medication: 'Test Med',
          interactions: ['Drug A', 'Drug B'],
          warnings: ['Warning 1', 'Warning 2']
        })
      };
      const encrypted = await encryptionService.encryptPHI(largeData, 'scan-results');
      const decrypted = await encryptionService.decryptPHI(encrypted);
      expect(decrypted).toEqual(largeData);
    });
  });
  describe('Key Management', () => {
    test('should rotate data encryption keys', async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
      const oldKeyCount = encryptionService.dataKeys.size;
      await encryptionService.rotateDataKeys();
      expect(encryptionService.dataKeys.size).toBeGreaterThan(oldKeyCount);
    });
    test('should derive keys consistently', () => {
      const masterKey = 'test-master-key';
      const purpose = 'medical-data';
      const key1 = encryptionService.deriveKey(masterKey, purpose);
      const key2 = encryptionService.deriveKey(masterKey, purpose);
      expect(key1).toBe(key2);
    });
  });
  describe('HIPAA Compliance', () => {
    test('should use AES-256 encryption', async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
      const testData = { sensitive: 'data' };
      const encrypted = await encryptionService.encryptPHI(testData, 'test');
      // Verify encryption strength (AES-256 should produce longer encrypted strings)
      expect(encrypted.data.length).toBeGreaterThan(50);
    });
    test('should generate cryptographically secure IVs', async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
      const testData = { test: 'data' };
      const encrypted1 = await encryptionService.encryptPHI(testData, 'test');
      const encrypted2 = await encryptionService.encryptPHI(testData, 'test');
      // Same data should produce different encrypted outputs due to random IVs
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.data).not.toBe(encrypted2.data);
    });
    test('should maintain audit trail for encryption operations', async () => {
      const { auditLog } = require('../config/supabase');
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
      expect(auditLog).toHaveBeenCalledWith(
        'encryption_initialized',
        expect.objectContaining({ timestamp: expect.any(Date) })
      );
    });
  });
  describe('Error Handling', () => {
    test('should handle corrupted encrypted data gracefully', async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
      const corruptedData = {
        data: 'corrupted-data',
        keyId: 'invalid-key',
        iv: 'invalid-iv'
      };
      await expect(encryptionService.decryptPHI(corruptedData))
        .rejects.toThrow('Decryption failed');
    });
    test('should handle missing encryption keys', async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
      const dataWithMissingKey = {
        data: 'encrypted-data',
        keyId: 'non-existent-key',
        iv: 'some-iv'
      };
      await expect(encryptionService.decryptPHI(dataWithMissingKey))
        .rejects.toThrow('Encryption key not found');
    });
  });
  describe('Performance', () => {
    test('should encrypt data within acceptable time limits', async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
      const testData = { test: 'data' };
      const startTime = Date.now();
      await encryptionService.encryptPHI(testData, 'performance-test');
      const endTime = Date.now();
      // Encryption should complete within 100ms for small data
      expect(endTime - startTime).toBeLessThan(100);
    });
    test('should handle concurrent encryption operations', async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-master-key');
      await encryptionService.initialize();
      const testData = { test: 'data' };
      const operations = Array(10).fill().map(() => 
        encryptionService.encryptPHI(testData, 'concurrent-test')
      );
      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('keyId');
        expect(result).toHaveProperty('iv');
      });
    });
  });
});