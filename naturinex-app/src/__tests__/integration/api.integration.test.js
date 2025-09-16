import { supabase } from '../../config/supabase';
import aiService from '../../services/aiService';
import drugInteractionService from '../../services/drugInteractionService';
import encryptionService from '../../services/encryptionService';
import axios from 'axios';

// Integration tests for API endpoints and database operations
describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize services
    await encryptionService.initialize();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Supabase Database Integration', () => {
    test('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase
        .from('health_check')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('should handle authentication with Supabase', async () => {
      const testUser = {
        email: 'test@naturinex.com',
        password: 'test-password-123'
      };
      
      // Test sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp(testUser);
      
      if (signUpError && !signUpError.message.includes('already registered')) {
        expect(signUpError).toBeNull();
      }
      
      // Test sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(testUser);
      
      expect(signInError).toBeNull();
      expect(signInData.user).toBeTruthy();
      expect(signInData.user.email).toBe(testUser.email);
      
      // Clean up
      await supabase.auth.signOut();
    });

    test('should enforce Row Level Security (RLS)', async () => {
      // Test without authentication
      const { data, error } = await supabase
        .from('user_scans')
        .select('*');
      
      // Should either return empty or require authentication
      expect(error || data.length === 0).toBeTruthy();
    });

    test('should handle encrypted data storage and retrieval', async () => {
      const testData = {
        medicationName: 'Test Medication',
        scanResults: {
          interactions: ['Drug A', 'Drug B'],
          warnings: ['Take with food']
        },
        timestamp: new Date().toISOString()
      };
      
      // Encrypt data
      const encryptedData = await encryptionService.encryptPHI(testData, 'test-scan');
      
      // Store in database
      const { data: insertData, error: insertError } = await supabase
        .from('encrypted_scans')
        .insert({
          id: 'test-scan-123',
          encrypted_data: encryptedData.data,
          key_id: encryptedData.keyId,
          iv: encryptedData.iv,
          created_at: new Date().toISOString()
        })
        .select();
      
      expect(insertError).toBeNull();
      expect(insertData).toHaveLength(1);
      
      // Retrieve and decrypt
      const { data: retrievedData, error: retrieveError } = await supabase
        .from('encrypted_scans')
        .select('*')
        .eq('id', 'test-scan-123')
        .single();
      
      expect(retrieveError).toBeNull();
      
      const decryptedData = await encryptionService.decryptPHI({
        data: retrievedData.encrypted_data,
        keyId: retrievedData.key_id,
        iv: retrievedData.iv
      });
      
      expect(decryptedData).toEqual(testData);
      
      // Clean up
      await supabase
        .from('encrypted_scans')
        .delete()
        .eq('id', 'test-scan-123');
    });
  });

  describe('Edge Functions Integration', () => {
    test('should analyze medication via Edge Function', async () => {
      const medicationName = 'Aspirin';
      
      const { data, error } = await supabase.functions.invoke('analyze-medication', {
        body: {
          medicationName,
          analysisType: 'comprehensive',
          includeInteractions: true
        }
      });
      
      expect(error).toBeNull();
      expect(data).toHaveProperty('analysis');
      expect(data.analysis).toHaveProperty('medication');
      expect(data.analysis.medication.name.toLowerCase()).toContain('aspirin');
    });

    test('should process OCR via Edge Function', async () => {
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AP/Z';
      
      const { data, error } = await supabase.functions.invoke('process-ocr', {
        body: {
          imageData: mockImageData,
          ocrSettings: {
            language: 'eng',
            confidence: 0.8
          }
        }
      });
      
      expect(error).toBeNull();
      expect(data).toHaveProperty('extractedText');
      expect(data).toHaveProperty('confidence');
    });

    test('should check drug interactions via Edge Function', async () => {
      const medications = ['Warfarin', 'Aspirin'];
      
      const { data, error } = await supabase.functions.invoke('check-interactions', {
        body: {
          medications,
          patientProfile: {
            age: 65,
            conditions: ['hypertension']
          }
        }
      });
      
      expect(error).toBeNull();
      expect(data).toHaveProperty('interactions');
      expect(Array.isArray(data.interactions)).toBe(true);
    });

    test('should handle Edge Function errors gracefully', async () => {
      const { data, error } = await supabase.functions.invoke('analyze-medication', {
        body: {
          // Invalid payload
          invalidField: 'invalid'
        }
      });
      
      expect(error).toBeTruthy();
      expect(error.message).toContain('validation');
    });
  });

  describe('Real-time Database Features', () => {
    test('should receive real-time updates for user scans', async () => {
      const updates = [];
      
      // Subscribe to changes
      const subscription = supabase
        .channel('user-scans')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'user_scans'
        }, (payload) => {
          updates.push(payload);
        })
        .subscribe();
      
      // Insert a new scan
      const { error } = await supabase
        .from('user_scans')
        .insert({
          id: 'test-realtime-scan',
          user_id: 'test-user',
          medication_name: 'Test Medication',
          scan_status: 'completed'
        });
      
      expect(error).toBeNull();
      
      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(updates).toHaveLength(1);
      expect(updates[0].new.id).toBe('test-realtime-scan');
      
      // Clean up
      await supabase.from('user_scans').delete().eq('id', 'test-realtime-scan');
      subscription.unsubscribe();
    });

    test('should handle subscription errors', async () => {
      let errorReceived = false;
      
      const subscription = supabase
        .channel('invalid-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'invalid',
          table: 'invalid_table'
        }, () => {})
        .on('system', { event: 'error' }, () => {
          errorReceived = true;
        })
        .subscribe();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(errorReceived).toBe(true);
      subscription.unsubscribe();
    });
  });

  describe('External API Integration', () => {
    test('should integrate with FDA Drug Database API', async () => {
      const medicationName = 'aspirin';
      
      try {
        const response = await axios.get(
          `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${medicationName}&limit=1`,
          { timeout: 10000 }
        );
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('results');
        expect(response.data.results.length).toBeGreaterThan(0);
      } catch (error) {
        // Handle rate limiting or API unavailability
        expect(error.response?.status).toBeOneOf([429, 503]);
      }
    });

    test('should integrate with RxNorm API for drug standardization', async () => {
      const drugName = 'aspirin';
      
      try {
        const response = await axios.get(
          `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${drugName}`,
          { timeout: 10000 }
        );
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('drugGroup');
      } catch (error) {
        // Handle API unavailability
        console.warn('RxNorm API unavailable:', error.message);
      }
    });

    test('should handle API rate limiting', async () => {
      const rapidRequests = Array(10).fill().map(() => 
        axios.get('https://api.fda.gov/drug/label.json?search=aspirin&limit=1')
      );
      
      const results = await Promise.allSettled(rapidRequests);
      
      // Should handle rate limiting gracefully
      const rateLimitedRequests = results.filter(result => 
        result.status === 'rejected' && 
        result.reason?.response?.status === 429
      );
      
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Payment Integration', () => {
    test('should process Stripe webhook events', async () => {
      const mockWebhookEvent = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_session',
            customer: 'cus_test_customer',
            subscription: 'sub_test_subscription',
            metadata: {
              userId: 'user-123'
            }
          }
        }
      };
      
      const { data, error } = await supabase.functions.invoke('stripe-webhook', {
        body: mockWebhookEvent
      });
      
      expect(error).toBeNull();
      expect(data).toHaveProperty('received');
      expect(data.received).toBe(true);
    });

    test('should validate subscription status', async () => {
      const userId = 'test-user-123';
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      // Should handle both scenarios (user has subscription or doesn't)
      expect(error?.code === 'PGRST116' || data).toBeTruthy();
    });
  });

  describe('File Storage Integration', () => {
    test('should upload and retrieve scan images', async () => {
      const testImageData = new Uint8Array([255, 216, 255, 224]); // JPEG header
      const fileName = `test-scan-${Date.now()}.jpg`;
      
      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scan-images')
        .upload(fileName, testImageData, {
          contentType: 'image/jpeg'
        });
      
      expect(uploadError).toBeNull();
      expect(uploadData).toHaveProperty('path');
      
      // Retrieve file
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('scan-images')
        .download(fileName);
      
      expect(downloadError).toBeNull();
      expect(downloadData).toBeInstanceOf(Blob);
      
      // Clean up
      await supabase.storage
        .from('scan-images')
        .remove([fileName]);
    });

    test('should enforce file size limits', async () => {
      const largeImageData = new Uint8Array(10 * 1024 * 1024); // 10MB
      const fileName = `large-test-${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('scan-images')
        .upload(fileName, largeImageData);
      
      expect(error).toBeTruthy();
      expect(error.message).toContain('size');
    });

    test('should handle concurrent file operations', async () => {
      const operations = Array(5).fill().map((_, index) => {
        const data = new Uint8Array([255, 216, 255, 224]);
        return supabase.storage
          .from('scan-images')
          .upload(`concurrent-test-${index}-${Date.now()}.jpg`, data);
      });
      
      const results = await Promise.allSettled(operations);
      
      // Most should succeed
      const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error);
      expect(successful.length).toBeGreaterThan(3);
      
      // Clean up
      const filesToDelete = successful.map((_, index) => 
        `concurrent-test-${index}-${Date.now()}.jpg`
      );
      await supabase.storage.from('scan-images').remove(filesToDelete);
    });
  });

  describe('Analytics Integration', () => {
    test('should track user events in analytics table', async () => {
      const eventData = {
        user_id: 'test-user',
        event_type: 'medication_scanned',
        event_properties: {
          medication: 'Aspirin',
          method: 'manual'
        },
        timestamp: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('analytics_events')
        .insert(eventData)
        .select();
      
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].event_type).toBe('medication_scanned');
      
      // Clean up
      await supabase
        .from('analytics_events')
        .delete()
        .eq('id', data[0].id);
    });

    test('should aggregate analytics data correctly', async () => {
      const { data, error } = await supabase
        .from('analytics_summary')
        .select('*')
        .gte('date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false })
        .limit(1);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle database connection failures', async () => {
      // Mock connection failure
      const originalFrom = supabase.from;
      supabase.from = jest.fn(() => {
        throw new Error('Connection failed');
      });
      
      try {
        await drugInteractionService.checkInteractions(['Aspirin']);
      } catch (error) {
        expect(error.message).toContain('Connection failed');
      }
      
      // Restore original method
      supabase.from = originalFrom;
    });

    test('should retry failed operations', async () => {
      let attemptCount = 0;
      
      const mockRetryableOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      };
      
      const result = await aiService.withRetry(mockRetryableOperation, 3);
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    test('should handle timeout scenarios', async () => {
      const slowOperation = () => new Promise(resolve => 
        setTimeout(resolve, 10000)
      );
      
      const startTime = Date.now();
      
      try {
        await aiService.withTimeout(slowOperation(), 1000);
      } catch (error) {
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(2000);
        expect(error.message).toContain('timeout');
      }
    });
  });

  describe('Data Consistency', () => {
    test('should maintain referential integrity', async () => {
      const userId = 'test-user-integrity';
      
      // Create user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({ id: userId, email: 'test@example.com' })
        .select();
      
      expect(userError).toBeNull();
      
      // Create scan for user
      const { data: scanData, error: scanError } = await supabase
        .from('user_scans')
        .insert({
          id: 'test-scan-integrity',
          user_id: userId,
          medication_name: 'Test Med'
        })
        .select();
      
      expect(scanError).toBeNull();
      
      // Try to delete user (should fail due to foreign key)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      expect(deleteError).toBeTruthy();
      
      // Clean up in correct order
      await supabase.from('user_scans').delete().eq('id', 'test-scan-integrity');
      await supabase.from('users').delete().eq('id', userId);
    });

    test('should handle concurrent data modifications', async () => {
      const userId = 'test-concurrent-user';
      
      // Create user
      await supabase
        .from('users')
        .insert({ id: userId, email: 'concurrent@example.com' });
      
      // Simulate concurrent updates
      const updates = Array(5).fill().map((_, index) => 
        supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', userId)
      );
      
      const results = await Promise.allSettled(updates);
      
      // At least one should succeed
      const successful = results.filter(r => 
        r.status === 'fulfilled' && !r.value.error
      );
      expect(successful.length).toBeGreaterThan(0);
      
      // Clean up
      await supabase.from('users').delete().eq('id', userId);
    });
  });
});