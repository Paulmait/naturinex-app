const express = require('express');
const router = express.Router();
const emailMonitor = require('../monitoring/email-monitor');
const crypto = require('crypto');

// Verify webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Resend webhook handler
router.post('/resend', async (req, res) => {
  const signature = req.headers['svix-signature'];
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  // Verify signature if secret is configured
  if (webhookSecret && signature) {
    const payload = JSON.stringify(req.body);
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const { type, data } = req.body;

  try {
    switch (type) {
      case 'email.sent':
        console.log('Email sent:', data.email_id);
        break;

      case 'email.delivered':
        console.log('Email delivered:', data.email_id);
        break;

      case 'email.bounced':
        await emailMonitor.processBounce({
          email: data.to[0],
          reason: data.bounce_type,
          emailId: data.email_id
        });
        break;

      case 'email.complained':
        await emailMonitor.processComplaint({
          email: data.to[0],
          emailId: data.email_id
        });
        break;

      case 'email.opened':
        // Track email opens
        console.log('Email opened:', data.email_id);
        break;

      case 'email.clicked':
        // Track link clicks
        console.log('Link clicked in email:', data.email_id);
        break;

      default:
        console.log('Unknown webhook event:', type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Generic webhook handler for other services
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Verify Stripe webhook signature
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        // Handle successful payment
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        // Handle failed payment
        break;

      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object);
        // Handle new subscription
        break;

      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object);
        // Handle cancelled subscription
        break;

      default:
        console.log('Unhandled Stripe event:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Health check webhook endpoint
router.post('/health', async (req, res) => {
  const { service, status, message } = req.body;

  console.log(`Health check from ${service}: ${status} - ${message}`);
  
  res.json({ 
    received: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;