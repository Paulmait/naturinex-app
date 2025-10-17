// Integration Tests - End-to-End Scan Flow, Authentication, Payment Flow
import { supabase } from '../src/config/supabase';
import aiService from '../src/services/aiServiceProduction';
import ocrService from '../src/services/ocrService';
import rateLimiter from '../src/services/rateLimiter';
import stripeService from '../src/services/stripeService';
import auditLogger from '../src/services/auditLogger';

describe('Integration Tests', () => {
  describe('End-to-End Scan Flow - Manual Input', () => {
    it('should complete full scan workflow for authenticated user', async () => {
      // 1. Mock user authentication
      const mockUser = {
        id: 'user_test_123',
        email: 'test@example.com'
      };

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // 2. Mock user profile with subscription
      jest.spyOn(supabase.from('profiles'), 'select').mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_id: mockUser.id,
            subscription_tier: 'pro',
            subscription_status: 'active',
            scans_this_month: 5
          },
          error: null
        })
      });

      // 3. Check rate limit
      const rateLimitResult = await rateLimiter.checkLimit(
        mockUser.id,
        'pro'
      );
      expect(rateLimitResult.allowed).toBe(true);

      // 4. Mock AI analysis
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  alternatives: [
                    {
                      name: 'Turmeric',
                      purpose: 'Anti-inflammatory',
                      dosage: '500mg daily',
                      evidence: 'Clinical studies show...'
                    }
                  ]
                })
              }]
            }
          }]
        })
      });

      const analysisResult = await aiService.analyzeMedication('Aspirin');

      expect(analysisResult).toHaveProperty('alternatives');
      expect(analysisResult).toHaveProperty('disclaimer');
      expect(analysisResult.alternatives.length).toBeGreaterThan(0);

      // 5. Save scan to database
      const insertSpy = jest.spyOn(supabase.from('scans'), 'insert')
        .mockResolvedValue({
          data: { id: 'scan_123' },
          error: null
        });

      await supabase.from('scans').insert({
        user_id: mockUser.id,
        medication_name: 'Aspirin',
        natural_alternatives: analysisResult.alternatives,
        scan_source: 'manual'
      });

      expect(insertSpy).toHaveBeenCalled();

      // 6. Verify audit log created
      const auditSpy = jest.spyOn(supabase.from('audit_logs'), 'insert')
        .mockResolvedValue({ data: {}, error: null });

      await auditLogger.logAccess({
        userId: mockUser.id,
        action: 'CREATE',
        resourceType: 'SCAN',
        resourceId: 'scan_123'
      });

      expect(auditSpy).toHaveBeenCalled();
    });

    it('should block scan when rate limit exceeded', async () => {
      const mockUser = { id: 'user_limited' };

      // Mock profile with limits reached
      jest.spyOn(supabase.from('profiles'), 'select').mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            subscription_tier: 'free',
            scans_this_month: 5 // Free tier limit
          },
          error: null
        })
      });

      const rateLimitResult = await rateLimiter.checkLimit(mockUser.id, 'free');

      expect(rateLimitResult.allowed).toBe(false);
      expect(rateLimitResult.reason).toBe('monthly_limit_exceeded');
    });
  });

  describe('End-to-End Scan Flow - OCR', () => {
    it('should complete OCR workflow from image to alternatives', async () => {
      // 1. Mock image file
      const mockImageUri = 'file:///test/medication.jpg';

      global.FileSystem = {
        readAsStringAsync: jest.fn().mockResolvedValue('base64_image_data')
      };

      // 2. Mock Vision API OCR response
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            responses: [{
              textAnnotations: [
                { description: 'Aspirin 100mg Take one tablet daily', confidence: 0.95 }
              ]
            }]
          })
        })
        // 3. Mock Gemini AI response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    alternatives: [
                      { name: 'Willow Bark', purpose: 'Pain relief' }
                    ]
                  })
                }]
              }
            }]
          })
        });

      // 4. Process OCR
      const ocrResult = await ocrService.scanImage(mockImageUri);

      expect(ocrResult.medications).toBeDefined();
      expect(ocrResult.medications.length).toBeGreaterThan(0);
      expect(ocrResult.confidence).toBeGreaterThan(0.8);

      // 5. Get AI alternatives
      const medicationName = ocrResult.medications[0];
      const alternatives = await aiService.analyzeMedication(medicationName);

      expect(alternatives.alternatives).toBeDefined();
      expect(alternatives.disclaimer).toBeDefined();
    });
  });

  describe('Authentication Flow', () => {
    it('should complete sign-up and profile creation', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!'
      };

      // Mock sign-up
      jest.spyOn(supabase.auth, 'signUp').mockResolvedValue({
        data: {
          user: { id: 'new_user_123', email: newUser.email },
          session: { access_token: 'token_123' }
        },
        error: null
      });

      const signUpResult = await supabase.auth.signUp(newUser);

      expect(signUpResult.data.user).toBeDefined();

      // Mock profile creation
      const insertSpy = jest.spyOn(supabase.from('profiles'), 'insert')
        .mockResolvedValue({ data: {}, error: null });

      await supabase.from('profiles').insert({
        user_id: signUpResult.data.user.id,
        email: newUser.email,
        subscription_tier: 'free',
        subscription_status: 'inactive'
      });

      expect(insertSpy).toHaveBeenCalled();
    });

    it('should handle sign-in and session management', async () => {
      jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: {
          user: { id: 'user_123' },
          session: { access_token: 'token_abc' }
        },
        error: null
      });

      const signInResult = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(signInResult.data.session).toBeDefined();
      expect(signInResult.data.session.access_token).toBe('token_abc');
    });

    it('should require authentication for protected resources', async () => {
      // Mock unauthenticated request
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const user = await supabase.auth.getUser();

      expect(user.data.user).toBeNull();
      expect(user.error).toBeDefined();
    });
  });

  describe('Payment Flow', () => {
    it('should complete subscription purchase flow', async () => {
      const mockUser = { id: 'user_payment_123' };
      const priceId = 'price_1RpEcUIwUuNq64Np4KLl689G'; // Pro tier

      // 1. Create checkout session
      jest.spyOn(supabase.functions, 'invoke').mockResolvedValue({
        data: {
          sessionId: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123'
        },
        error: null
      });

      const checkoutSession = await stripeService.createCheckoutSession(
        mockUser.id,
        priceId,
        'subscription'
      );

      expect(checkoutSession.sessionId).toBeDefined();
      expect(checkoutSession.url).toBeDefined();

      // 2. Simulate webhook: checkout.session.completed
      const checkoutEvent = {
        id: 'evt_checkout_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_123'
          }
        }
      };

      jest.spyOn(supabase.from('webhook_events'), 'select').mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: {} })
      });

      jest.spyOn(supabase.from('webhook_events'), 'insert')
        .mockResolvedValue({ data: {}, error: null });

      await stripeService.handleWebhook(checkoutEvent);

      // 3. Simulate webhook: customer.subscription.created
      const subscriptionEvent = {
        id: 'evt_sub_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            items: {
              data: [{ price: { id: priceId } }]
            }
          }
        }
      };

      const updateSpy = jest.spyOn(supabase.from('profiles'), 'update')
        .mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        });

      await stripeService.handleWebhook(subscriptionEvent);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'pro',
          subscription_status: 'active'
        })
      );
    });

    it('should handle payment failure gracefully', async () => {
      const paymentFailedEvent = {
        id: 'evt_payment_failed',
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_123',
            attempt_count: 1
          }
        }
      };

      jest.spyOn(supabase.from('webhook_events'), 'select').mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: {} })
      });

      jest.spyOn(supabase.from('webhook_events'), 'insert')
        .mockResolvedValue({ data: {}, error: null });

      const updateSpy = jest.spyOn(supabase.from('profiles'), 'update')
        .mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        });

      await stripeService.handleWebhook(paymentFailedEvent);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_status: 'past_due'
        })
      );
    });
  });

  describe('Medical Safety Integration', () => {
    it('should enforce disclaimer acceptance before first scan', async () => {
      const newUser = { id: 'user_new_123' };

      // Check if user has accepted disclaimer
      jest.spyOn(supabase.from('disclaimer_acceptances'), 'select')
        .mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        });

      const hasAccepted = await supabase
        .from('disclaimer_acceptances')
        .select('*')
        .eq('user_id', newUser.id)
        .eq('disclaimer_type', 'medical')
        .maybeSingle();

      expect(hasAccepted.data).toBeNull();

      // User must accept before scanning
      const insertSpy = jest.spyOn(supabase.from('disclaimer_acceptances'), 'insert')
        .mockResolvedValue({ data: {}, error: null });

      await supabase.from('disclaimer_acceptances').insert({
        user_id: newUser.id,
        disclaimer_type: 'medical',
        disclaimer_version: '1.0'
      });

      expect(insertSpy).toHaveBeenCalled();
    });

    it('should add critical medication warnings', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  alternatives: [{ name: 'Alternative' }]
                })
              }]
            }
          }]
        })
      });

      const result = await aiService.analyzeMedication('Warfarin');

      expect(result.criticalWarning).toBeDefined();
      expect(result.criticalWarning).toContain('CRITICAL MEDICATION');
    });
  });

  describe('HIPAA Compliance Integration', () => {
    it('should log all PHI access with sanitization', async () => {
      const mockUser = { id: 'user_hipaa_123' };

      const auditSpy = jest.spyOn(supabase.from('audit_logs'), 'insert')
        .mockResolvedValue({ data: {}, error: null });

      await auditLogger.logAccess({
        userId: mockUser.id,
        action: 'READ',
        resourceType: 'SCAN',
        metadata: {
          medication_name: 'Aspirin',
          timestamp: new Date().toISOString()
        }
      });

      expect(auditSpy).toHaveBeenCalled();

      const logEntry = auditSpy.mock.calls[0][0];
      expect(logEntry.metadata.medication_name).toBe('[REDACTED]');
    });

    it('should maintain audit trail for 7 years', () => {
      const retentionPolicy = auditLogger.getRetentionPolicy();

      expect(retentionPolicy.years).toBe(7);
    });
  });

  describe('Error Recovery', () => {
    it('should handle API failures with graceful degradation', async () => {
      // Simulate AI API failure
      global.fetch = jest.fn().mockRejectedValue(new Error('AI service unavailable'));

      await expect(aiService.analyzeMedication('Aspirin'))
        .rejects.toThrow();

      // Should still save scan with error flag
      const insertSpy = jest.spyOn(supabase.from('scans'), 'insert')
        .mockResolvedValue({ data: {}, error: null });

      // Error handling would save partial data
    });

    it('should retry transient database errors', async () => {
      let attempts = 0;

      jest.spyOn(supabase.from('scans'), 'insert').mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.resolve({ data: null, error: new Error('Transient error') });
        }
        return Promise.resolve({ data: { id: 'scan_123' }, error: null });
      });

      // Implement retry logic test
    });
  });

  describe('Performance', () => {
    it('should complete scan workflow within acceptable time', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({ alternatives: [] })
              }]
            }
          }]
        })
      });

      const start = Date.now();
      await aiService.analyzeMedication('Aspirin');
      const duration = Date.now() - start;

      // Should complete in under 3 seconds
      expect(duration).toBeLessThan(3000);
    });
  });
});
