import analytics, { trackEvent, trackScan, getDeviceId } from '../analytics';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../config/supabase';
// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));
describe('Analytics Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Device ID Management', () => {
    test('should generate and store device ID on first use', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      SecureStore.setItemAsync.mockResolvedValue();
      const deviceId = await getDeviceId();
      expect(deviceId).toBeTruthy();
      expect(deviceId).toMatch(/^[a-f0-9-]{36}$/);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'device_id',
        deviceId
      );
    });
    test('should return existing device ID', async () => {
      const existingId = 'existing-device-id-123';
      SecureStore.getItemAsync.mkResolvedValue(existingId);
      const deviceId = await getDeviceId();
      expect(deviceId).toBe(existingId);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
    test('should handle storage errors gracefully', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));
      const deviceId = await getDeviceId();
      // Should generate fallback ID
      expect(deviceId).toBeTruthy();
      expect(deviceId.startsWith('fallback-')).toBe(true);
    });
  });
  describe('Event Tracking', () => {
    test('should track custom events with proper schema', async () => {
      const eventData = {
        action: 'medication_scanned',
        category: 'user_interaction',
        label: 'aspirin',
        value: 1,
        properties: {
          scanMethod: 'manual',
          userType: 'free'
        }
      };
      await trackEvent(eventData);
      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'medication_scanned',
          event_category: 'user_interaction',
          event_label: 'aspirin',
          event_value: 1,
          event_properties: eventData.properties,
          device_id: expect.any(String),
          timestamp: expect.any(String),
          session_id: expect.any(String)
        })
      );
    });
    test('should validate event data before tracking', async () => {
      const invalidEvents = [
        null,
        undefined,
        {},
        { action: '' },
        { action: 'test', category: null }
      ];
      for (const event of invalidEvents) {
        await expect(trackEvent(event)).rejects.toThrow('Invalid event data');
      }
    });
    test('should sanitize event properties', async () => {
      const eventWithUnsafeProps = {
        action: 'test_event',
        category: 'test',
        properties: {
          normalProp: 'safe value',
          unsafeProp: '<script>alert("xss")</script>',
          sqlInjection: "'; DROP TABLE events; --",
          privateKey: 'sk-1234567890abcdef'
        }
      };
      await trackEvent(eventWithUnsafeProps);
      const insertCall = supabase.from().insert.mock.calls[0][0];
      const properties = insertCall.event_properties;
      expect(properties.unsafeProp).not.toContain('<script>');
      expect(properties.sqlInjection).not.toContain('DROP TABLE');
      expect(properties.privateKey).toBe('[REDACTED]');
    });
  });
  describe('Scan Tracking', () => {
    test('should track medication scans with detailed metrics', async () => {
      const scanData = {
        medicationName: 'Aspirin',
        scanMethod: 'camera',
        scanDuration: 5000,
        ocrConfidence: 0.95,
        analysisResults: {
          interactions: 2,
          warnings: 1,
          sideEffects: 3
        },
        userLocation: 'US',
        deviceType: 'mobile'
      };
      await trackScan(scanData);
      expect(supabase.from).toHaveBeenCalledWith('scan_analytics');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          medication_name: 'Aspirin',
          scan_method: 'camera',
          scan_duration_ms: 5000,
          ocr_confidence: 0.95,
          interactions_found: 2,
          warnings_found: 1,
          side_effects_found: 3,
          user_location: 'US',
          device_type: 'mobile',
          timestamp: expect.any(String)
        })
      );
    });
    test('should anonymize sensitive scan data', async () => {
      const sensitiveData = {
        medicationName: 'Sensitive Medication',
        patientId: 'patient-123',
        doctorName: 'Dr. Smith',
        insuranceInfo: 'Insurance-456'
      };
      await trackScan(sensitiveData);
      const insertCall = supabase.from().insert.mock.calls[0][0];
      expect(insertCall.patient_id).toBe('[ANONYMIZED]');
      expect(insertCall.doctor_name).toBe('[ANONYMIZED]');
      expect(insertCall.insurance_info).toBe('[ANONYMIZED]');
      expect(insertCall.medication_name).toBe('Sensitive Medication');
    });
    test('should track scan errors and failures', async () => {
      const errorData = {
        medicationName: 'Failed Scan',
        errorType: 'ocr_failed',
        errorMessage: 'Unable to recognize text',
        scanDuration: 3000,
        retryCount: 2
      };
      await trackScan(errorData, 'error');
      expect(supabase.from).toHaveBeenCalledWith('scan_errors');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          error_type: 'ocr_failed',
          error_message: 'Unable to recognize text',
          retry_count: 2,
          scan_duration_ms: 3000
        })
      );
    });
  });
  describe('Privacy and Compliance', () => {
    test('should not track PII data', async () => {
      const dataWithPII = {
        action: 'user_login',
        category: 'authentication',
        properties: {
          email: 'user@example.com',
          phone: '+1234567890',
          ssn: '123-45-6789',
          creditCard: '4111-1111-1111-1111'
        }
      };
      await trackEvent(dataWithPII);
      const insertCall = supabase.from().insert.mock.calls[0][0];
      const properties = insertCall.event_properties;
      expect(properties.email).toBeUndefined();
      expect(properties.phone).toBeUndefined();
      expect(properties.ssn).toBeUndefined();
      expect(properties.creditCard).toBeUndefined();
    });
    test('should respect do-not-track preferences', async () => {
      // Mock user preference for no tracking
      SecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'analytics_opt_out') return Promise.resolve('true');
        return Promise.resolve(null);
      });
      await trackEvent({
        action: 'test_event',
        category: 'test'
      });
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });
    test('should comply with GDPR data retention policies', async () => {
      const oldTimestamp = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days ago
      // Mock deletion of old data
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: null, error: null })
      });
      await analytics.cleanupOldData();
      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from().delete).toHaveBeenCalled();
    });
  });
  describe('Session Management', () => {
    test('should generate unique session IDs', async () => {
      const session1 = analytics.generateSessionId();
      const session2 = analytics.generateSessionId();
      expect(session1).not.toBe(session2);
      expect(session1).toMatch(/^session_[a-f0-9]{32}$/);
      expect(session2).toMatch(/^session_[a-f0-9]{32}$/);
    });
    test('should track session duration', async () => {
      analytics.startSession();
      // Simulate 30 seconds of activity
      await new Promise(resolve => setTimeout(resolve, 30));
      const duration = analytics.getSessionDuration();
      expect(duration).toBeGreaterThan(25);
      expect(duration).toBeLessThan(50);
    });
    test('should end session after inactivity', async () => {
      analytics.startSession();
      // Mock inactivity timeout
      jest.useFakeTimers();
      // Fast-forward time by 30 minutes
      jest.advanceTimersByTime(30 * 60 * 1000);
      expect(analytics.isSessionActive()).toBe(false);
      jest.useRealTimers();
    });
  });
  describe('Performance Monitoring', () => {
    test('should track API response times', async () => {
      const apiCallData = {
        endpoint: '/api/analyze',
        method: 'POST',
        responseTime: 1500,
        statusCode: 200,
        payloadSize: 1024
      };
      await analytics.trackAPICall(apiCallData);
      expect(supabase.from).toHaveBeenCalledWith('api_metrics');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/analyze',
          response_time_ms: 1500,
          status_code: 200,
          payload_size_bytes: 1024
        })
      );
    });
    test('should track app performance metrics', async () => {
      const performanceData = {
        loadTime: 2000,
        renderTime: 500,
        memoryUsage: 50.5,
        crashCount: 0,
        errorCount: 2
      };
      await analytics.trackPerformance(performanceData);
      expect(supabase.from).toHaveBeenCalledWith('performance_metrics');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          load_time_ms: 2000,
          render_time_ms: 500,
          memory_usage_mb: 50.5,
          crash_count: 0,
          error_count: 2
        })
      );
    });
  });
  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      supabase.from().insert.mockRejectedValue(new Error('Database error'));
      // Should not throw error
      await expect(trackEvent({
        action: 'test',
        category: 'test'
      })).resolves.not.toThrow();
      // Should log error for debugging
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Analytics error')
      );
    });
    test('should queue events when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      await trackEvent({
        action: 'offline_event',
        category: 'test'
      });
      // Should not make database call
      expect(supabase.from().insert).not.toHaveBeenCalled();
      // Should queue event
      expect(analytics.getQueuedEventsCount()).toBe(1);
    });
    test('should send queued events when back online', async () => {
      // Queue an event while offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      await trackEvent({
        action: 'queued_event',
        category: 'test'
      });
      // Go back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      await analytics.sendQueuedEvents();
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'queued_event'
        })
      );
      expect(analytics.getQueuedEventsCount()).toBe(0);
    });
  });
  describe('Real-time Analytics', () => {
    test('should provide real-time usage statistics', async () => {
      const stats = await analytics.getRealTimeStats();
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('scansPerHour');
      expect(stats).toHaveProperty('errorRate');
      expect(stats).toHaveProperty('avgResponseTime');
    });
    test('should track user engagement metrics', async () => {
      await analytics.trackEngagement({
        pageViews: 5,
        timeOnPage: 120,
        bounceRate: 0.2,
        interactions: 8
      });
      expect(supabase.from).toHaveBeenCalledWith('engagement_metrics');
    });
  });
});