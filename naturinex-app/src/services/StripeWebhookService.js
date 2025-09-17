/**
 * Stripe Webhook Service
 * Handles secure webhook validation, subscription lifecycle management,
 * payment failures, dunning management, and subscription changes
 */

import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { ErrorService } from './ErrorService';
import { MonitoringService } from './MonitoringService';

class StripeWebhookService {
  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second base delay

    // Webhook event handlers
    this.eventHandlers = {
      'customer.subscription.created': this.handleSubscriptionCreated.bind(this),
      'customer.subscription.updated': this.handleSubscriptionUpdated.bind(this),
      'customer.subscription.deleted': this.handleSubscriptionDeleted.bind(this),
      'customer.subscription.trial_will_end': this.handleTrialWillEnd.bind(this),

      'invoice.created': this.handleInvoiceCreated.bind(this),
      'invoice.finalized': this.handleInvoiceFinalized.bind(this),
      'invoice.payment_succeeded': this.handleInvoicePaymentSucceeded.bind(this),
      'invoice.payment_failed': this.handleInvoicePaymentFailed.bind(this),
      'invoice.upcoming': this.handleInvoiceUpcoming.bind(this),

      'payment_intent.succeeded': this.handlePaymentIntentSucceeded.bind(this),
      'payment_intent.payment_failed': this.handlePaymentIntentFailed.bind(this),
      'payment_intent.requires_action': this.handlePaymentIntentRequiresAction.bind(this),

      'payment_method.attached': this.handlePaymentMethodAttached.bind(this),
      'payment_method.detached': this.handlePaymentMethodDetached.bind(this),
      'payment_method.updated': this.handlePaymentMethodUpdated.bind(this),

      'customer.created': this.handleCustomerCreated.bind(this),
      'customer.updated': this.handleCustomerUpdated.bind(this),
      'customer.deleted': this.handleCustomerDeleted.bind(this),

      'checkout.session.completed': this.handleCheckoutSessionCompleted.bind(this),
      'checkout.session.expired': this.handleCheckoutSessionExpired.bind(this),

      'setup_intent.succeeded': this.handleSetupIntentSucceeded.bind(this),
      'setup_intent.setup_failed': this.handleSetupIntentFailed.bind(this),
    };

    // Dunning management settings
    this.dunningSettings = {
      maxAttempts: 4,
      retryIntervals: [3, 5, 7, 10], // days
      gracePeriod: 3, // days before restricting access
    };
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload, signature, secret = null) {
    try {
      const webhookSecret = secret || this.webhookSecret;
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      // Stripe signature format: t=timestamp,v1=signature
      const elements = signature.split(',');
      const signatureElements = {};

      elements.forEach(element => {
        const [key, value] = element.split('=');
        signatureElements[key] = value;
      });

      const timestamp = signatureElements.t;
      const v1Signature = signatureElements.v1;

      if (!timestamp || !v1Signature) {
        throw new Error('Invalid signature format');
      }

      // Check timestamp tolerance (5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp, 10);
      const tolerance = 300; // 5 minutes

      if (Math.abs(currentTime - webhookTime) > tolerance) {
        throw new Error('Request timestamp too old');
      }

      // Compute expected signature
      const signedPayload = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      // Secure comparison
      if (!this.secureCompare(v1Signature, expectedSignature)) {
        throw new Error('Invalid signature');
      }

      return true;
    } catch (error) {
      ErrorService.logError('Webhook signature validation failed', error, {
        signature: signature?.substring(0, 50) + '...',
        payloadLength: payload?.length
      });
      throw error;
    }
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  secureCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Process webhook event with idempotency and retry logic
   */
  async processWebhookEvent(payload, signature, idempotencyKey = null) {
    try {
      // Validate signature
      this.validateWebhookSignature(payload, signature);

      // Parse event
      const event = JSON.parse(payload);

      // Check idempotency
      if (idempotencyKey && await this.isEventProcessed(event.id, idempotencyKey)) {
        console.log(`Event ${event.id} already processed with key ${idempotencyKey}`);
        return { success: true, duplicate: true };
      }

      // Log event
      await this.logWebhookEvent(event, 'received');

      // Process event with retry logic
      const result = await this.processEventWithRetry(event);

      // Mark as processed
      if (idempotencyKey) {
        await this.markEventProcessed(event.id, idempotencyKey, result);
      }

      // Log success
      await this.logWebhookEvent(event, 'processed', result);

      return { success: true, result };

    } catch (error) {
      ErrorService.logError('Webhook processing failed', error, {
        payloadLength: payload?.length,
        idempotencyKey
      });

      // Log failure
      if (payload) {
        try {
          const event = JSON.parse(payload);
          await this.logWebhookEvent(event, 'failed', { error: error.message });
        } catch (parseError) {
          console.error('Failed to parse payload for logging:', parseError);
        }
      }

      throw error;
    }
  }

  /**
   * Process event with retry logic
   */
  async processEventWithRetry(event, attempt = 1) {
    try {
      return await this.processEvent(event);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Retrying event ${event.id} in ${delay}ms (attempt ${attempt + 1})`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processEventWithRetry(event, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Process individual webhook event
   */
  async processEvent(event) {
    const { type, data } = event;

    console.log(`Processing webhook event: ${type} (${event.id})`);

    // Get event handler
    const handler = this.eventHandlers[type];

    if (!handler) {
      console.log(`No handler for event type: ${type}`);
      return { handled: false, type };
    }

    // Process event
    const result = await handler(data.object, event);

    // Track event for monitoring
    MonitoringService.trackEvent('webhook_processed', {
      type,
      eventId: event.id,
      customerId: data.object.customer,
      result
    });

    return { handled: true, type, result };
  }

  /**
   * Subscription Created Handler
   */
  async handleSubscriptionCreated(subscription, event) {
    try {
      const customerId = subscription.customer;
      const userId = await this.getUserIdFromCustomer(customerId);

      if (!userId) {
        throw new Error(`User not found for customer: ${customerId}`);
      }

      // Update user subscription
      await this.updateUserSubscription(userId, {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        subscription_status: subscription.status,
        subscription_tier: this.getTierFromPriceId(subscription.items.data[0].price.id),
        subscription_starts_at: new Date(subscription.start_date * 1000),
        subscription_expires_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        billing_cycle: subscription.items.data[0].price.recurring?.interval || 'month',
        subscription_metadata: subscription.metadata
      });

      // Log subscription event
      await this.logSubscriptionEvent(userId, 'subscription_created', {
        subscriptionId: subscription.id,
        status: subscription.status,
        tier: this.getTierFromPriceId(subscription.items.data[0].price.id)
      });

      // Send welcome email if not in trial
      if (subscription.status === 'active') {
        await this.sendSubscriptionWelcomeEmail(userId, subscription);
      }

      return { subscriptionId: subscription.id, status: subscription.status };
    } catch (error) {
      throw new Error(`Failed to handle subscription created: ${error.message}`);
    }
  }

  /**
   * Subscription Updated Handler
   */
  async handleSubscriptionUpdated(subscription, event) {
    try {
      const customerId = subscription.customer;
      const userId = await this.getUserIdFromCustomer(customerId);

      if (!userId) {
        console.log(`User not found for customer: ${customerId}, skipping update`);
        return { skipped: true };
      }

      const previousAttributes = event.data?.previous_attributes || {};

      // Determine what changed
      const changes = this.getSubscriptionChanges(subscription, previousAttributes);

      // Update user subscription
      await this.updateUserSubscription(userId, {
        subscription_status: subscription.status,
        subscription_tier: this.getTierFromPriceId(subscription.items.data[0].price.id),
        subscription_expires_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
      });

      // Log subscription event
      await this.logSubscriptionEvent(userId, 'subscription_updated', {
        subscriptionId: subscription.id,
        changes,
        status: subscription.status
      });

      // Handle specific changes
      if (changes.includes('tier_change')) {
        await this.handleTierChange(userId, subscription, previousAttributes);
      }

      if (changes.includes('status_change')) {
        await this.handleStatusChange(userId, subscription, previousAttributes);
      }

      if (changes.includes('cancellation')) {
        await this.handleSubscriptionCancellation(userId, subscription);
      }

      return { subscriptionId: subscription.id, changes };
    } catch (error) {
      throw new Error(`Failed to handle subscription updated: ${error.message}`);
    }
  }

  /**
   * Subscription Deleted Handler
   */
  async handleSubscriptionDeleted(subscription, event) {
    try {
      const customerId = subscription.customer;
      const userId = await this.getUserIdFromCustomer(customerId);

      if (!userId) {
        console.log(`User not found for customer: ${customerId}, skipping deletion`);
        return { skipped: true };
      }

      // Update user to free tier
      await this.updateUserSubscription(userId, {
        subscription_status: 'canceled',
        subscription_tier: 'free',
        subscription_expires_at: null,
        trial_ends_at: null,
        stripe_subscription_id: null,
        canceled_at: new Date()
      });

      // Log subscription event
      await this.logSubscriptionEvent(userId, 'subscription_deleted', {
        subscriptionId: subscription.id,
        canceledAt: new Date()
      });

      // Send cancellation confirmation email
      await this.sendSubscriptionCanceledEmail(userId, subscription);

      // Clear premium data
      await this.clearUserPremiumData(userId);

      return { subscriptionId: subscription.id, status: 'deleted' };
    } catch (error) {
      throw new Error(`Failed to handle subscription deleted: ${error.message}`);
    }
  }

  /**
   * Trial Will End Handler
   */
  async handleTrialWillEnd(subscription, event) {
    try {
      const customerId = subscription.customer;
      const userId = await this.getUserIdFromCustomer(customerId);

      if (!userId) {
        return { skipped: true };
      }

      const trialEndDate = new Date(subscription.trial_end * 1000);
      const daysUntilEnd = Math.ceil((trialEndDate - new Date()) / (1000 * 60 * 60 * 24));

      // Log event
      await this.logSubscriptionEvent(userId, 'trial_will_end', {
        subscriptionId: subscription.id,
        trialEndDate,
        daysUntilEnd
      });

      // Send trial ending email
      await this.sendTrialEndingEmail(userId, subscription, daysUntilEnd);

      return { subscriptionId: subscription.id, daysUntilEnd };
    } catch (error) {
      throw new Error(`Failed to handle trial will end: ${error.message}`);
    }
  }

  /**
   * Invoice Payment Failed Handler - Implements Dunning Management
   */
  async handleInvoicePaymentFailed(invoice, event) {
    try {
      const customerId = invoice.customer;
      const userId = await this.getUserIdFromCustomer(customerId);

      if (!userId) {
        return { skipped: true };
      }

      const subscriptionId = invoice.subscription;

      // Get current dunning attempt count
      const attemptNumber = await this.getDunningAttemptCount(userId, subscriptionId) + 1;

      // Log dunning attempt
      await this.logDunningAttempt(userId, subscriptionId, invoice.id, attemptNumber, {
        amount: invoice.amount_due,
        currency: invoice.currency,
        failureCode: invoice.last_finalization_error?.code,
        failureMessage: invoice.last_finalization_error?.message
      });

      // Check if we've exceeded max attempts
      if (attemptNumber >= this.dunningSettings.maxAttempts) {
        // Final attempt failed - cancel subscription
        await this.handleFinalDunningFailure(userId, subscriptionId, invoice);
      } else {
        // Schedule retry and send notification
        await this.scheduleNextDunningAttempt(userId, subscriptionId, attemptNumber);
        await this.sendPaymentFailureEmail(userId, invoice, attemptNumber);
      }

      // Update payment method if card was declined
      if (this.isCardDeclined(invoice.last_finalization_error)) {
        await this.handleCardDeclined(userId, customerId);
      }

      return {
        attemptNumber,
        maxAttemptsReached: attemptNumber >= this.dunningSettings.maxAttempts,
        nextRetryDate: this.getNextRetryDate(attemptNumber)
      };
    } catch (error) {
      throw new Error(`Failed to handle invoice payment failed: ${error.message}`);
    }
  }

  /**
   * Invoice Payment Succeeded Handler
   */
  async handleInvoicePaymentSucceeded(invoice, event) {
    try {
      const customerId = invoice.customer;
      const userId = await this.getUserIdFromCustomer(customerId);

      if (!userId) {
        return { skipped: true };
      }

      // Clear any dunning attempts
      await this.clearDunningAttempts(userId, invoice.subscription);

      // Log successful payment
      await this.logBillingHistory(userId, {
        invoice_id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        paid_at: new Date(invoice.status_transitions.paid_at * 1000),
        description: invoice.description || 'Subscription payment',
        period_start: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        period_end: invoice.period_end ? new Date(invoice.period_end * 1000) : null
      });

      // Send payment receipt
      await this.sendPaymentReceiptEmail(userId, invoice);

      // Update subscription if was past due
      if (invoice.subscription) {
        const subscription = await this.getStripeSubscription(invoice.subscription);
        if (subscription.status === 'active') {
          await this.updateUserSubscription(userId, {
            subscription_status: 'active',
            last_payment_at: new Date()
          });
        }
      }

      return { invoiceId: invoice.id, amount: invoice.amount_paid };
    } catch (error) {
      throw new Error(`Failed to handle invoice payment succeeded: ${error.message}`);
    }
  }

  /**
   * Payment Method Attached Handler
   */
  async handlePaymentMethodAttached(paymentMethod, event) {
    try {
      const customerId = paymentMethod.customer;
      const userId = await this.getUserIdFromCustomer(customerId);

      if (!userId) {
        return { skipped: true };
      }

      // Store payment method
      await this.storePaymentMethod(userId, {
        stripe_payment_method_id: paymentMethod.id,
        type: paymentMethod.type,
        card_brand: paymentMethod.card?.brand,
        card_last4: paymentMethod.card?.last4,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        is_default: false, // Will be updated if set as default
        created_at: new Date()
      });

      return { paymentMethodId: paymentMethod.id, type: paymentMethod.type };
    } catch (error) {
      throw new Error(`Failed to handle payment method attached: ${error.message}`);
    }
  }

  /**
   * Helper Methods
   */

  async getUserIdFromCustomer(customerId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (error) {
        console.error('Error finding user by customer ID:', error);
        return null;
      }

      return data?.user_id;
    } catch (error) {
      console.error('Error in getUserIdFromCustomer:', error);
      return null;
    }
  }

  async updateUserSubscription(userId, updates) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update user subscription: ${error.message}`);
    }
  }

  async logSubscriptionEvent(userId, eventType, data) {
    await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: data,
        created_at: new Date()
      });
  }

  async logWebhookEvent(event, status, result = null) {
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        status,
        result,
        created_at: new Date()
      });
  }

  async isEventProcessed(eventId, idempotencyKey) {
    const { data } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', eventId)
      .eq('idempotency_key', idempotencyKey)
      .single();

    return !!data;
  }

  async markEventProcessed(eventId, idempotencyKey, result) {
    await supabase
      .from('webhook_events')
      .update({
        status: 'processed',
        result,
        processed_at: new Date()
      })
      .eq('stripe_event_id', eventId)
      .eq('idempotency_key', idempotencyKey);
  }

  getTierFromPriceId(priceId) {
    // Map price IDs to tiers - update these with your actual price IDs
    const priceToTierMap = {
      [process.env.STRIPE_PLUS_PRICE_ID]: 'plus',
      [process.env.STRIPE_PRO_PRICE_ID]: 'pro',
      [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise'
    };

    return priceToTierMap[priceId] || 'free';
  }

  getSubscriptionChanges(subscription, previousAttributes) {
    const changes = [];

    if (previousAttributes.status && previousAttributes.status !== subscription.status) {
      changes.push('status_change');
    }

    if (previousAttributes.items &&
        JSON.stringify(previousAttributes.items) !== JSON.stringify(subscription.items)) {
      changes.push('tier_change');
    }

    if (previousAttributes.cancel_at_period_end !== subscription.cancel_at_period_end) {
      changes.push('cancellation');
    }

    return changes;
  }

  async handleTierChange(userId, subscription, previousAttributes) {
    const newTier = this.getTierFromPriceId(subscription.items.data[0].price.id);
    const oldTier = previousAttributes.items?.data?.[0]?.price?.id ?
      this.getTierFromPriceId(previousAttributes.items.data[0].price.id) : 'unknown';

    await this.logSubscriptionEvent(userId, 'tier_change', {
      subscriptionId: subscription.id,
      oldTier,
      newTier,
      effectiveDate: new Date()
    });

    // Send tier change notification
    await this.sendTierChangeEmail(userId, oldTier, newTier);
  }

  async handleStatusChange(userId, subscription, previousAttributes) {
    const newStatus = subscription.status;
    const oldStatus = previousAttributes.status;

    await this.logSubscriptionEvent(userId, 'status_change', {
      subscriptionId: subscription.id,
      oldStatus,
      newStatus,
      effectiveDate: new Date()
    });

    // Handle specific status changes
    if (newStatus === 'past_due' && oldStatus === 'active') {
      await this.handleSubscriptionPastDue(userId, subscription);
    } else if (newStatus === 'active' && oldStatus === 'past_due') {
      await this.handleSubscriptionReactivated(userId, subscription);
    }
  }

  async getDunningAttemptCount(userId, subscriptionId) {
    const { count } = await supabase
      .from('dunning_attempts')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('subscription_id', subscriptionId)
      .gte('created_at', this.getGracePeriodStart());

    return count || 0;
  }

  async logDunningAttempt(userId, subscriptionId, invoiceId, attemptNumber, details) {
    await supabase
      .from('dunning_attempts')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        invoice_id: invoiceId,
        attempt_number: attemptNumber,
        failure_reason: details.failureMessage,
        failure_code: details.failureCode,
        amount: details.amount,
        currency: details.currency,
        next_retry_date: this.getNextRetryDate(attemptNumber),
        created_at: new Date()
      });
  }

  getNextRetryDate(attemptNumber) {
    if (attemptNumber >= this.dunningSettings.maxAttempts) {
      return null;
    }

    const days = this.dunningSettings.retryIntervals[attemptNumber - 1] || 10;
    const nextRetry = new Date();
    nextRetry.setDate(nextRetry.getDate() + days);
    return nextRetry;
  }

  getGracePeriodStart() {
    const gracePeriodStart = new Date();
    gracePeriodStart.setDate(gracePeriodStart.getDate() - this.dunningSettings.gracePeriod);
    return gracePeriodStart;
  }

  isCardDeclined(error) {
    return error?.decline_code || error?.code === 'card_declined';
  }

  // Email notification methods (implement based on your email service)
  async sendSubscriptionWelcomeEmail(userId, subscription) {
    // Implementation depends on your email service
    console.log(`Sending welcome email to user ${userId}`);
  }

  async sendTrialEndingEmail(userId, subscription, daysUntilEnd) {
    console.log(`Sending trial ending email to user ${userId}, ${daysUntilEnd} days remaining`);
  }

  async sendPaymentFailureEmail(userId, invoice, attemptNumber) {
    console.log(`Sending payment failure email to user ${userId}, attempt ${attemptNumber}`);
  }

  async sendPaymentReceiptEmail(userId, invoice) {
    console.log(`Sending payment receipt to user ${userId}`);
  }

  async sendSubscriptionCanceledEmail(userId, subscription) {
    console.log(`Sending cancellation confirmation to user ${userId}`);
  }

  async sendTierChangeEmail(userId, oldTier, newTier) {
    console.log(`Sending tier change email to user ${userId}: ${oldTier} -> ${newTier}`);
  }

  // Additional stub methods for completeness
  async handleCheckoutSessionCompleted(session, event) {
    // Handle successful checkout completion
    return { handled: true };
  }

  async handleCheckoutSessionExpired(session, event) {
    // Handle expired checkout session
    return { handled: true };
  }

  async handleCustomerCreated(customer, event) {
    // Handle new customer creation
    return { handled: true };
  }

  async handleCustomerUpdated(customer, event) {
    // Handle customer updates
    return { handled: true };
  }

  async handleCustomerDeleted(customer, event) {
    // Handle customer deletion
    return { handled: true };
  }

  async handlePaymentIntentSucceeded(paymentIntent, event) {
    // Handle successful payment intent
    return { handled: true };
  }

  async handlePaymentIntentFailed(paymentIntent, event) {
    // Handle failed payment intent
    return { handled: true };
  }

  async handlePaymentIntentRequiresAction(paymentIntent, event) {
    // Handle payment intent requiring action
    return { handled: true };
  }

  async handlePaymentMethodDetached(paymentMethod, event) {
    // Handle payment method removal
    return { handled: true };
  }

  async handlePaymentMethodUpdated(paymentMethod, event) {
    // Handle payment method updates
    return { handled: true };
  }

  async handleSetupIntentSucceeded(setupIntent, event) {
    // Handle successful setup intent
    return { handled: true };
  }

  async handleSetupIntentFailed(setupIntent, event) {
    // Handle failed setup intent
    return { handled: true };
  }

  async handleInvoiceCreated(invoice, event) {
    // Handle invoice creation
    return { handled: true };
  }

  async handleInvoiceFinalized(invoice, event) {
    // Handle invoice finalization
    return { handled: true };
  }

  async handleInvoiceUpcoming(invoice, event) {
    // Handle upcoming invoice notification
    return { handled: true };
  }

  // Additional helper methods
  async clearDunningAttempts(userId, subscriptionId) {
    await supabase
      .from('dunning_attempts')
      .delete()
      .eq('user_id', userId)
      .eq('subscription_id', subscriptionId);
  }

  async logBillingHistory(userId, billingData) {
    await supabase
      .from('billing_history')
      .insert({
        user_id: userId,
        ...billingData,
        created_at: new Date()
      });
  }

  async storePaymentMethod(userId, paymentMethodData) {
    await supabase
      .from('payment_methods')
      .insert({
        user_id: userId,
        ...paymentMethodData
      });
  }

  async clearUserPremiumData(userId) {
    // Clear any premium data when subscription is canceled
    console.log(`Clearing premium data for user ${userId}`);
  }

  async handleFinalDunningFailure(userId, subscriptionId, invoice) {
    // Handle final dunning failure - typically cancels subscription
    console.log(`Final dunning failure for user ${userId}, subscription ${subscriptionId}`);
  }

  async scheduleNextDunningAttempt(userId, subscriptionId, attemptNumber) {
    // Schedule next dunning attempt
    console.log(`Scheduling dunning attempt ${attemptNumber + 1} for user ${userId}`);
  }

  async handleCardDeclined(userId, customerId) {
    // Handle declined card scenario
    console.log(`Card declined for user ${userId}, customer ${customerId}`);
  }

  async getStripeSubscription(subscriptionId) {
    // This would typically use Stripe SDK to fetch subscription
    // For now, return a mock object
    return { status: 'active' };
  }

  async handleSubscriptionCancellation(userId, subscription) {
    console.log(`Handling subscription cancellation for user ${userId}`);
  }

  async handleSubscriptionPastDue(userId, subscription) {
    console.log(`Handling past due subscription for user ${userId}`);
  }

  async handleSubscriptionReactivated(userId, subscription) {
    console.log(`Handling subscription reactivation for user ${userId}`);
  }
}

// Export singleton instance
export const stripeWebhookService = new StripeWebhookService();
export default stripeWebhookService;