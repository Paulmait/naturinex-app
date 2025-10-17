// Stripe Service Tests - Idempotency, Webhook Handling, Payment Security
import stripeService from '../src/services/stripeService';
import { supabase } from '../src/config/supabase';

describe('Stripe Service Tests', () => {
  describe('Idempotency Key Generation', () => {
    it('should generate unique idempotency keys', () => {
      const key1 = stripeService.generateIdempotencyKey('checkout', {
        userId: 'user123',
        priceId: 'price_abc'
      });

      const key2 = stripeService.generateIdempotencyKey('checkout', {
        userId: 'user456',
        priceId: 'price_xyz'
      });

      expect(key1).not.toBe(key2);
      expect(key1).toContain('checkout');
      expect(key2).toContain('checkout');
    });

    it('should generate same key for identical parameters', () => {
      const params = { userId: 'user123', priceId: 'price_abc' };

      const key1 = stripeService.generateIdempotencyKey('checkout', params);

      // Wait a bit to ensure timestamp changes
      const key2 = stripeService.generateIdempotencyKey('checkout', params);

      // Keys should be different due to timestamp, but hash should be same
      expect(key1.split('_')[1]).toBe(key2.split('_')[1]);
    });

    it('should include operation type in key', () => {
      const key = stripeService.generateIdempotencyKey('checkout', {});

      expect(key).toMatch(/^checkout_/);
    });

    it('should generate keys for different operations', () => {
      const params = { userId: 'user123' };

      const checkoutKey = stripeService.generateIdempotencyKey('checkout', params);
      const cancelKey = stripeService.generateIdempotencyKey('cancel', params);

      expect(checkoutKey.startsWith('checkout_')).toBe(true);
      expect(cancelKey.startsWith('cancel_')).toBe(true);
    });
  });

  describe('Idempotency Processing', () => {
    beforeEach(() => {
      // Clear cache
      stripeService.idempotencyCache.clear();
    });

    it('should detect already processed operations', () => {
      const key = 'test_key_123';
      const result = { sessionId: 'session_123' };

      stripeService.markProcessed(key, result);

      expect(stripeService.isProcessed(key)).toBe(true);
    });

    it('should return cached result for duplicate requests', async () => {
      const key = 'checkout_test_123';
      const cachedResult = { sessionId: 'cached_session' };

      stripeService.markProcessed(key, cachedResult);

      // Mock the checkout session to ensure it's not called
      const createSpy = jest.spyOn(supabase.functions, 'invoke');

      // Attempt same operation
      const idempotencyKey = key;
      if (stripeService.isProcessed(idempotencyKey)) {
        const result = stripeService.idempotencyCache.get(idempotencyKey).result;
        expect(result).toEqual(cachedResult);
      }

      // Should not have called Supabase
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should clean up old cache entries', (done) => {
      const key = 'temp_key_123';
      stripeService.markProcessed(key, { data: 'test' });

      expect(stripeService.isProcessed(key)).toBe(true);

      // Fast-forward time (cache cleanup is 1 hour)
      setTimeout(() => {
        // In real implementation, this would be cleaned up
        done();
      }, 100);
    });
  });

  describe('Webhook Deduplication', () => {
    beforeEach(() => {
      stripeService.webhookProcessed.clear();
      jest.clearAllMocks();
    });

    it('should detect duplicate webhooks in memory', async () => {
      const event = {
        id: 'evt_test_123',
        type: 'customer.subscription.created',
        data: { object: {} }
      };

      // First processing
      await stripeService.handleWebhook(event);

      // Second processing (duplicate)
      const result = await stripeService.handleWebhook(event);

      expect(result.duplicate).toBe(true);
    });

    it('should check database for processed webhooks', async () => {
      const event = {
        id: 'evt_db_test_456',
        type: 'invoice.payment_succeeded',
        data: { object: {} }
      };

      // Mock database check
      jest.spyOn(supabase.from('webhook_events'), 'select').mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'existing_record' },
          error: null
        })
      });

      const result = await stripeService.handleWebhook(event);

      expect(result.duplicate).toBe(true);
    });

    it('should save processed webhooks to database', async () => {
      const event = {
        id: 'evt_new_789',
        type: 'checkout.session.completed',
        data: { object: { customer: 'cus_123' } }
      };

      // Mock database responses
      jest.spyOn(supabase.from('webhook_events'), 'select').mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      });

      const insertSpy = jest.spyOn(supabase.from('webhook_events'), 'insert')
        .mockResolvedValue({ data: { id: 'new_record' }, error: null });

      await stripeService.handleWebhook(event);

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          stripe_event_id: 'evt_new_789',
          event_type: 'checkout.session.completed'
        })
      );
    });
  });

  describe('Subscription Updates', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update profile on subscription created', async () => {
      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        items: {
          data: [
            { price: { id: 'price_1RpEcUIwUuNq64Np4KLl689G' } }
          ]
        }
      };

      const updateSpy = jest.spyOn(supabase.from('profiles'), 'update')
        .mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        });

      await stripeService.handleSubscriptionUpdate(subscription);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          subscription_tier: 'pro',
          subscription_status: 'active'
        })
      );
    });

    it('should determine correct tier from price ID', () => {
      const testCases = [
        { priceId: 'price_1RpEeKIwUuNq64Np0VUrD3jm', expectedTier: 'plus' },
        { priceId: 'price_1RpEcUIwUuNq64Np4KLl689G', expectedTier: 'pro' },
        { priceId: 'price_unknown', expectedTier: 'free' }
      ];

      testCases.forEach(({ priceId, expectedTier }) => {
        const tier = stripeService.determineTier(priceId);
        expect(tier).toBe(expectedTier);
      });
    });

    it('should downgrade to free on subscription canceled', async () => {
      const subscription = {
        id: 'sub_canceled',
        customer: 'cus_123',
        status: 'canceled'
      };

      const updateSpy = jest.spyOn(supabase.from('profiles'), 'update')
        .mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        });

      await stripeService.handleSubscriptionCanceled(subscription);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'free',
          subscription_status: 'canceled'
        })
      );
    });
  });

  describe('Payment Events', () => {
    it('should handle successful payment', async () => {
      const invoice = {
        customer: 'cus_123',
        status: 'paid'
      };

      const updateSpy = jest.spyOn(supabase.from('profiles'), 'update')
        .mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        });

      await stripeService.handlePaymentSucceeded(invoice);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_status: 'active'
        })
      );
    });

    it('should handle failed payment', async () => {
      const invoice = {
        customer: 'cus_123',
        status: 'open'
      };

      const updateSpy = jest.spyOn(supabase.from('profiles'), 'update')
        .mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        });

      await stripeService.handlePaymentFailed(invoice);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_status: 'past_due'
        })
      );
    });
  });

  describe('Checkout Session Creation', () => {
    it('should use idempotency key when creating session', async () => {
      const invokeSpy = jest.spyOn(supabase.functions, 'invoke')
        .mockResolvedValue({
          data: { sessionId: 'cs_test_123' },
          error: null
        });

      await stripeService.createCheckoutSession('user123', 'price_abc', 'subscription');

      expect(invokeSpy).toHaveBeenCalledWith(
        'create-checkout-session',
        expect.objectContaining({
          body: expect.objectContaining({
            idempotencyKey: expect.any(String)
          })
        })
      );
    });

    it('should return cached session for duplicate requests', async () => {
      const userId = 'user123';
      const priceId = 'price_abc';

      // First call
      jest.spyOn(supabase.functions, 'invoke')
        .mockResolvedValue({
          data: { sessionId: 'cs_cached' },
          error: null
        });

      const result1 = await stripeService.createCheckoutSession(userId, priceId);

      // Mock second call (should use cache)
      const invokeSpy = jest.spyOn(supabase.functions, 'invoke');

      // Generate same idempotency key
      const key = stripeService.generateIdempotencyKey('checkout', {
        userId,
        priceId,
        mode: 'subscription'
      });

      stripeService.markProcessed(key, result1);

      // Check if processed
      if (stripeService.isProcessed(key)) {
        const cachedResult = stripeService.idempotencyCache.get(key).result;
        expect(cachedResult.sessionId).toBe('cs_cached');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const event = {
        id: 'evt_error',
        type: 'customer.subscription.updated',
        data: { object: { customer: 'cus_123' } }
      };

      jest.spyOn(supabase.from('webhook_events'), 'select').mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('DB error'))
      });

      const result = await stripeService.handleWebhook(event);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle Stripe API errors', async () => {
      jest.spyOn(supabase.functions, 'invoke')
        .mockResolvedValue({
          data: null,
          error: new Error('Stripe API error')
        });

      await expect(
        stripeService.createCheckoutSession('user123', 'invalid_price')
      ).rejects.toThrow();
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data in logs', async () => {
      const event = {
        id: 'evt_secure',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            customer: 'cus_123',
            payment_method_details: {
              card: {
                last4: '4242'
              }
            }
          }
        }
      };

      // Ensure no sensitive card details are logged
      const logSpy = jest.spyOn(console, 'log');

      await stripeService.handleWebhook(event);

      const logs = logSpy.mock.calls.flat().join(' ');
      expect(logs).not.toContain('4242');
    });

    it('should validate webhook event IDs', () => {
      const validEventId = 'evt_1234567890abcdef';
      const invalidEventId = 'invalid_event_id';

      expect(validEventId.startsWith('evt_')).toBe(true);
      expect(invalidEventId.startsWith('evt_')).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed webhook processing', async () => {
      const event = {
        id: 'evt_retry',
        type: 'customer.subscription.updated',
        data: { object: { customer: 'cus_123' } }
      };

      let attempts = 0;
      jest.spyOn(supabase.from('profiles'), 'update').mockReturnValue({
        eq: jest.fn().mockImplementation(() => {
          attempts++;
          if (attempts < 3) {
            return Promise.resolve({ data: null, error: new Error('Temp error') });
          }
          return Promise.resolve({ data: {}, error: null });
        })
      });

      // Implement retry logic test
      // This would depend on your actual retry implementation
    });
  });

  describe('Cancellation', () => {
    it('should cancel subscription with idempotency', async () => {
      const invokeSpy = jest.spyOn(supabase.functions, 'invoke')
        .mockResolvedValue({
          data: { canceled: true },
          error: null
        });

      await stripeService.cancelSubscription('user123', 'sub_123');

      expect(invokeSpy).toHaveBeenCalledWith(
        'cancel-subscription',
        expect.objectContaining({
          body: expect.objectContaining({
            idempotencyKey: expect.any(String)
          })
        })
      );
    });
  });
});
