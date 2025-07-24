/**
 * Test script for Stripe webhook handler
 * Use this to test webhook signature verification and event handling
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Generate a test webhook payload with valid signature
 * This simulates what Stripe would send to your webhook endpoint
 */
export function generateTestWebhookPayload(
  eventType: string,
  eventData: any,
  webhookSecret: string
): { payload: string; signature: string } {
  // Create a test event
  const event = {
    id: `evt_test_${Date.now()}`,
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: eventData,
    },
  };

  // Convert to JSON string (this is what Stripe sends as the body)
  const payload = JSON.stringify(event);

  // Generate signature header
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
    timestamp,
  });

  return { payload, signature };
}

/**
 * Example test data for checkout.session.completed
 */
export const testCheckoutSession: any = {
  id: 'cs_test_123456',
  object: 'checkout.session',
  amount_subtotal: 1499,
  amount_total: 1499,
  currency: 'usd',
  customer: 'cus_test_123',
  customer_email: 'test@example.com',
  mode: 'subscription',
  payment_status: 'paid',
  status: 'complete',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
  metadata: {
    userId: 'user_test_123',
    plan: 'premium',
    billingCycle: 'monthly',
  },
  subscription: 'sub_test_123',
  payment_intent: 'pi_test_123',
  created: Math.floor(Date.now() / 1000),
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  livemode: false,
};

/**
 * Example test data for invoice.payment_failed
 */
export const testFailedInvoice: any = {
  id: 'in_test_123456',
  object: 'invoice',
  amount_due: 1499,
  amount_paid: 0,
  amount_remaining: 1499,
  attempt_count: 1,
  attempted: true,
  currency: 'usd',
  customer: 'cus_test_123',
  customer_email: 'test@example.com',
  subscription: 'sub_test_123',
  hosted_invoice_url: 'https://invoice.stripe.com/i/test_123',
  next_payment_attempt: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
  created: Math.floor(Date.now() / 1000),
  status: 'open',
  billing_reason: 'subscription_cycle',
  charge: 'ch_test_failed',
  collection_method: 'charge_automatically',
};

// Example usage:
if (require.main === module) {
  console.log('🧪 Stripe Webhook Test Data Generator');
  console.log('=====================================\n');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

  // Generate test payload for checkout.session.completed
  const checkoutPayload = generateTestWebhookPayload(
    'checkout.session.completed',
    testCheckoutSession,
    webhookSecret
  );

  console.log('📦 Test Checkout Session Completed:');
  console.log('Payload:', checkoutPayload.payload);
  console.log('Signature Header:', checkoutPayload.signature);
  console.log('');

  // Generate test payload for invoice.payment_failed
  const invoicePayload = generateTestWebhookPayload(
    'invoice.payment_failed',
    testFailedInvoice,
    webhookSecret
  );

  console.log('📦 Test Invoice Payment Failed:');
  console.log('Payload:', invoicePayload.payload);
  console.log('Signature Header:', invoicePayload.signature);
  console.log('');

  console.log('💡 To test the webhook handler:');
  console.log('1. Start your functions emulator: npm run serve');
  console.log('2. Send a POST request to: http://localhost:5001/your-project/us-central1/api/stripe-webhook');
  console.log('3. Include the signature in the "stripe-signature" header');
  console.log('4. Send the payload as the raw body');
}