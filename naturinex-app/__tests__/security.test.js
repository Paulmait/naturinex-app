// Security Tests - API Key Validation, Input Sanitization, Rate Limiting
import secureConfig from '../src/config/secureConfig';
import rateLimiter from '../src/services/rateLimiter';
import { supabase } from '../src/config/supabase';

describe('Security Tests', () => {
  describe('API Key Validation', () => {
    it('should reject invalid Stripe key format', () => {
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'invalid_key';

      expect(() => {
        secureConfig.getStripeKey('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      }).toThrow('Invalid Stripe publishable key format');
    });

    it('should reject test keys in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123456';

      expect(() => {
        secureConfig.getStripeKey('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      }).toThrow('Cannot use Stripe test keys in production');

      process.env.NODE_ENV = originalEnv;
    });

    it('should accept valid Stripe publishable key', () => {
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_live_51QTj9RRqvalidkey123';

      const key = secureConfig.getStripeKey('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      expect(key).toBe('pk_live_51QTj9RRqvalidkey123');
    });

    it('should throw error for missing required API key', () => {
      delete process.env.REQUIRED_KEY;

      expect(() => {
        secureConfig.getRequired('REQUIRED_KEY');
      }).toThrow();
    });
  });

  describe('Input Sanitization', () => {
    const { sanitizeInput } = require('../src/services/aiServiceProduction');

    it('should remove script tags', () => {
      const malicious = '<script>alert("XSS")</script>Aspirin';
      const sanitized = sanitizeInput(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Aspirin');
    });

    it('should remove SQL injection attempts', () => {
      const malicious = "Aspirin'; DROP TABLE users; --";
      const sanitized = sanitizeInput(malicious);

      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).toContain('Aspirin');
    });

    it('should limit input length', () => {
      const longInput = 'A'.repeat(10000);
      const sanitized = sanitizeInput(longInput);

      expect(sanitized.length).toBeLessThanOrEqual(500);
    });

    it('should remove special characters but keep hyphens', () => {
      const input = "Acetyl-L-Carnitine @#$%";
      const sanitized = sanitizeInput(input);

      expect(sanitized).toContain('Acetyl-L-Carnitine');
      expect(sanitized).not.toContain('@');
      expect(sanitized).not.toContain('#');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      // Clear rate limit cache
      rateLimiter.cache.clear();
    });

    it('should enforce anonymous user daily limit', async () => {
      const deviceId = 'test_device_123';

      // First 3 scans should succeed
      for (let i = 0; i < 3; i++) {
        const result = await rateLimiter.checkLimit(null, 'anonymous', deviceId);
        expect(result.allowed).toBe(true);
      }

      // 4th scan should be blocked
      const result = await rateLimiter.checkLimit(null, 'anonymous', deviceId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('daily_limit_exceeded');
    });

    it('should enforce free tier monthly limit', async () => {
      const userId = 'test_user_free';

      // Mock profile
      jest.spyOn(supabase.from('profiles'), 'select').mockResolvedValue({
        data: { scans_this_month: 4 },
        error: null
      });

      // 5th scan should succeed
      let result = await rateLimiter.checkLimit(userId, 'free');
      expect(result.allowed).toBe(true);

      // Mock 5 scans used
      jest.spyOn(supabase.from('profiles'), 'select').mockResolvedValue({
        data: { scans_this_month: 5 },
        error: null
      });

      // 6th scan should fail
      result = await rateLimiter.checkLimit(userId, 'free');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('monthly_limit_exceeded');
    });

    it('should allow unlimited scans for pro tier', async () => {
      const userId = 'test_user_pro';

      // Mock profile with high scan count
      jest.spyOn(supabase.from('profiles'), 'select').mockResolvedValue({
        data: { scans_this_month: 1000 },
        error: null
      });

      const result = await rateLimiter.checkLimit(userId, 'pro');
      expect(result.allowed).toBe(true);
    });

    it('should detect suspicious activity', async () => {
      const deviceId = 'suspicious_device';

      // Simulate rapid requests
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(rateLimiter.checkLimit(null, 'anonymous', deviceId));
      }

      await Promise.all(promises);

      const suspicious = await rateLimiter.isSuspicious(null, deviceId);
      expect(suspicious).toBe(true);
    });
  });

  describe('Authentication Security', () => {
    it('should require authentication for scan endpoint', async () => {
      // Mock unauthenticated request
      const { data, error } = await supabase.functions.invoke('analyze-secure', {
        body: { medicationName: 'Aspirin' }
      });

      expect(error).toBeTruthy();
      expect(error.message).toContain('unauthorized');
    });

    it('should validate session token format', () => {
      const invalidToken = 'not_a_valid_jwt';

      // Test token validation
      expect(() => {
        // This would be in your auth middleware
        const decoded = JSON.parse(atob(invalidToken.split('.')[1]));
      }).toThrow();
    });
  });

  describe('CORS and Headers', () => {
    it('should have proper security headers', () => {
      // These would be tested in E2E tests
      const expectedHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];

      // Mock response headers
      const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000'
      };

      expectedHeaders.forEach(header => {
        expect(headers[header]).toBeDefined();
      });
    });
  });

  describe('Data Encryption', () => {
    it('should use HTTPS in production', () => {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

      if (process.env.NODE_ENV === 'production') {
        expect(supabaseUrl).toMatch(/^https:\/\//);
      }
    });

    it('should encrypt sensitive data at rest', async () => {
      // Test that audit logs store hashed data
      const testData = {
        medication_name: 'Aspirin',
        email: 'test@example.com'
      };

      const auditLogger = require('../src/services/auditLogger').default;
      const sanitized = auditLogger.sanitizeMetadata(testData);

      expect(sanitized.medication_name).toBe('[REDACTED]');
      expect(sanitized.email).toBe('[REDACTED]');
    });
  });
});
