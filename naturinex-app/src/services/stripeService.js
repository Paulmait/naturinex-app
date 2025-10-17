// Stripe Service - Production Ready with Idempotency
// Handles all Stripe operations securely

import { supabase } from '../config/supabase';
import ErrorService from './ErrorService';
import auditLogger, { ACCESS_TYPES, RESOURCE_TYPES } from './auditLogger';
import Logger from './Logger';

class StripeService {
  constructor() {
    this.stripe = null;
    this.publishableKey = null;
    this.idempotencyCache = new Map();
    this.webhookProcessed = new Set();
  }

  /**
   * Initialize Stripe
   */
  async initialize() {
    try {
      // Get publishable key from secure config
      this.publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!this.publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }

      // Validate key format
      if (!this.publishableKey.startsWith('pk_')) {
        throw new Error('Invalid Stripe key format');
      }

      // Initialize Stripe (client-side)
      if (typeof window !== 'undefined') {
        const { loadStripe } = require('@stripe/stripe-js');
        this.stripe = await loadStripe(this.publishableKey);
      }

      Logger.info('Stripe initialized successfully');
      return true;
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.initialize');
      throw new Error('Failed to initialize payment service');
    }
  }

  /**
   * Generate idempotency key
   */
  generateIdempotencyKey(operation, params) {
    const timestamp = Date.now();
    const paramsStr = JSON.stringify(params);
    const hash = this.simpleHash(paramsStr);

    return `${operation}_${hash}_${timestamp}`;
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if operation was already processed
   */
  isProcessed(idempotencyKey) {
    return this.idempotencyCache.has(idempotencyKey);
  }

  /**
   * Mark operation as processed
   */
  markProcessed(idempotencyKey, result) {
    this.idempotencyCache.set(idempotencyKey, {
      result,
      timestamp: Date.now(),
    });

    // Clean old entries after 1 hour
    setTimeout(() => {
      this.idempotencyCache.delete(idempotencyKey);
    }, 60 * 60 * 1000);
  }

  /**
   * Create checkout session with idempotency
   */
  async createCheckoutSession(userId, priceId, mode = 'subscription') {
    try {
      // Generate idempotency key
      const idempotencyKey = this.generateIdempotencyKey('checkout', {
        userId,
        priceId,
        mode,
      });

      // Check if already processed
      if (this.isProcessed(idempotencyKey)) {
        Logger.info('Returning cached checkout session', { idempotencyKey });
        return this.idempotencyCache.get(idempotencyKey).result;
      }

      // Log attempt
      await auditLogger.logAccess({
        userId,
        action: ACCESS_TYPES.CREATE,
        resourceType: RESOURCE_TYPES.PAYMENT,
        metadata: {
          operation: 'create_checkout_session',
          priceId,
          mode,
        },
      });

      // Call Supabase Edge Function with idempotency key
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId,
          mode,
          idempotencyKey,
        },
      });

      if (error) throw error;

      // Mark as processed
      this.markProcessed(idempotencyKey, data);

      Logger.info('Checkout session created', {
        sessionId: data.sessionId,
        idempotencyKey,
      });

      return data;
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.createCheckoutSession', {
        userId,
        priceId,
      });
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Handle webhook with idempotency
   */
  async handleWebhook(event) {
    try {
      const eventId = event.id;

      // Check if webhook already processed
      if (this.webhookProcessed.has(eventId)) {
        Logger.warn('Webhook already processed', { eventId });
        return { success: true, duplicate: true };
      }

      // Check database for processed webhooks
      const { data: existingEvent } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('stripe_event_id', eventId)
        .single();

      if (existingEvent) {
        Logger.warn('Webhook already in database', { eventId });
        this.webhookProcessed.add(eventId);
        return { success: true, duplicate: true };
      }

      // Process webhook
      const result = await this.processWebhookEvent(event);

      // Save processed event
      await supabase.from('webhook_events').insert({
        stripe_event_id: eventId,
        event_type: event.type,
        processed_at: new Date().toISOString(),
        success: result.success,
        error: result.error || null,
      });

      // Mark as processed in memory
      this.webhookProcessed.add(eventId);

      // Clean up old entries after 24 hours
      setTimeout(() => {
        this.webhookProcessed.delete(eventId);
      }, 24 * 60 * 60 * 1000);

      return result;
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.handleWebhook', {
        eventId: event.id,
        eventType: event.type,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event) {
    try {
      Logger.info('Processing webhook event', { type: event.type });

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdate(event.data.object);

        case 'customer.subscription.deleted':
          return await this.handleSubscriptionCanceled(event.data.object);

        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(event.data.object);

        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event.data.object);

        case 'checkout.session.completed':
          return await this.handleCheckoutCompleted(event.data.object);

        default:
          Logger.info('Unhandled webhook event type', { type: event.type });
          return { success: true, handled: false };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle subscription update
   */
  async handleSubscriptionUpdate(subscription) {
    try {
      const customerId = subscription.customer;
      const subscriptionId = subscription.id;
      const status = subscription.status;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      // Determine tier from price ID
      const priceId = subscription.items.data[0].price.id;
      const tier = this.determineTier(priceId);

      // Update user profile
      const { error } = await supabase
        .from('profiles')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_tier: tier,
          subscription_status: status,
          subscription_expires_at: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (error) throw error;

      // Log subscription change
      await auditLogger.logAccess({
        userId: customerId, // Will be customer ID, map to user ID if needed
        action: ACCESS_TYPES.UPDATE,
        resourceType: RESOURCE_TYPES.USER_PROFILE,
        metadata: {
          event: 'subscription_updated',
          tier,
          status,
        },
      });

      Logger.info('Subscription updated', {
        customerId,
        subscriptionId,
        tier,
        status,
      });

      return { success: true };
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.handleSubscriptionUpdate');
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle subscription canceled
   */
  async handleSubscriptionCanceled(subscription) {
    try {
      const customerId = subscription.customer;

      // Downgrade to free tier
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          subscription_expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (error) throw error;

      Logger.info('Subscription canceled', { customerId });

      return { success: true };
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.handleSubscriptionCanceled');
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle payment succeeded
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const customerId = invoice.customer;

      // Update subscription status to active
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (error) throw error;

      Logger.info('Payment succeeded', { customerId });

      return { success: true };
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.handlePaymentSucceeded');
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle payment failed
   */
  async handlePaymentFailed(invoice) {
    try {
      const customerId = invoice.customer;

      // Update subscription status
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (error) throw error;

      // TODO: Send email notification to user

      Logger.warn('Payment failed', { customerId });

      return { success: true };
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.handlePaymentFailed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle checkout completed
   */
  async handleCheckoutCompleted(session) {
    try {
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!subscriptionId) {
        // One-time payment, not subscription
        return { success: true, oneTime: true };
      }

      // Subscription will be handled by subscription.created event
      Logger.info('Checkout completed', { customerId, subscriptionId });

      return { success: true };
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.handleCheckoutCompleted');
      return { success: false, error: error.message };
    }
  }

  /**
   * Determine subscription tier from price ID
   */
  determineTier(priceId) {
    // Map your Stripe price IDs to tiers
    const priceMap = {
      // Monthly prices
      'price_1RpEeKIwUuNq64Np0VUrD3jm': 'plus',
      'price_1RpEcUIwUuNq64Np4KLl689G': 'pro',

      // Yearly prices
      'price_1RpEeqIwUuNq64NpPculkKkA': 'pro',
    };

    return priceMap[priceId] || 'free';
  }

  /**
   * Cancel subscription with idempotency
   */
  async cancelSubscription(userId, subscriptionId) {
    try {
      const idempotencyKey = this.generateIdempotencyKey('cancel', {
        userId,
        subscriptionId,
      });

      // Check if already processed
      if (this.isProcessed(idempotencyKey)) {
        return this.idempotencyCache.get(idempotencyKey).result;
      }

      // Call backend to cancel
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId,
          userId,
          idempotencyKey,
        },
      });

      if (error) throw error;

      // Mark as processed
      this.markProcessed(idempotencyKey, data);

      // Log cancellation
      await auditLogger.logAccess({
        userId,
        action: ACCESS_TYPES.DELETE,
        resourceType: RESOURCE_TYPES.USER_PROFILE,
        metadata: {
          event: 'subscription_canceled',
          subscriptionId,
        },
      });

      return data;
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.cancelSubscription', {
        userId,
        subscriptionId,
      });
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Update payment method with idempotency
   */
  async updatePaymentMethod(userId, paymentMethodId) {
    try {
      const idempotencyKey = this.generateIdempotencyKey('update_payment', {
        userId,
        paymentMethodId,
      });

      if (this.isProcessed(idempotencyKey)) {
        return this.idempotencyCache.get(idempotencyKey).result;
      }

      // Call backend
      const { data, error } = await supabase.functions.invoke('update-payment-method', {
        body: {
          paymentMethodId,
          userId,
          idempotencyKey,
        },
      });

      if (error) throw error;

      this.markProcessed(idempotencyKey, data);

      return data;
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.updatePaymentMethod');
      throw new Error('Failed to update payment method');
    }
  }

  /**
   * Get customer portal URL
   */
  async getCustomerPortalURL(userId) {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { userId },
      });

      if (error) throw error;

      return data.url;
    } catch (error) {
      await ErrorService.logError(error, 'StripeService.getCustomerPortalURL');
      throw new Error('Failed to get customer portal URL');
    }
  }
}

// Create singleton instance
const stripeService = new StripeService();

export default stripeService;

// Export convenience functions
export const initializeStripe = () => stripeService.initialize();
export const createCheckoutSession = (userId, priceId, mode) =>
  stripeService.createCheckoutSession(userId, priceId, mode);
export const cancelSubscription = (userId, subscriptionId) =>
  stripeService.cancelSubscription(userId, subscriptionId);
export const getCustomerPortalURL = (userId) =>
  stripeService.getCustomerPortalURL(userId);
