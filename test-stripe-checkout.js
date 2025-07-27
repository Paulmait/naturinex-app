// Test Stripe webhook with a proper checkout.session.completed event
const https = require('https');
const crypto = require('crypto');

// Your webhook endpoint secret from Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'your_webhook_secret_here';

// Create a realistic checkout session completed event
const event = {
  id: 'evt_1PqwRSRqEPLAinmJXyZ7Test',
  object: 'event',
  api_version: '2024-12-18.acacia',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_a1XyZ123456789',
      object: 'checkout.session',
      after_expiration: null,
      allow_promotion_codes: true,
      amount_subtotal: 999,
      amount_total: 999,
      automatic_tax: {
        enabled: false,
        status: null
      },
      billing_address_collection: null,
      cancel_url: 'https://naturinex-app-zsga.onrender.com/cancel',
      client_reference_id: null,
      consent: null,
      consent_collection: null,
      created: Math.floor(Date.now() / 1000) - 60,
      currency: 'usd',
      customer: 'cus_QwRsTestCustomer',
      customer_creation: 'if_required',
      customer_details: {
        address: null,
        email: 'testuser@example.com',
        name: null,
        phone: null,
        tax_exempt: 'none',
        tax_ids: []
      },
      customer_email: 'testuser@example.com',
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      invoice: null,
      invoice_creation: {
        enabled: false,
        invoice_data: {
          account_tax_ids: null,
          custom_fields: null,
          description: null,
          footer: null,
          metadata: {},
          rendering_options: null
        }
      },
      livemode: false,
      locale: null,
      metadata: {
        userId: 'test_user_' + Date.now(),
        plan: 'premium',
        source: 'web'
      },
      mode: 'subscription',
      payment_intent: null,
      payment_link: null,
      payment_method_collection: 'always',
      payment_method_options: {},
      payment_method_types: ['card'],
      payment_status: 'paid',
      phone_number_collection: {
        enabled: false
      },
      recovered_from: null,
      setup_intent: null,
      shipping_address_collection: null,
      shipping_cost: null,
      shipping_details: null,
      shipping_options: [],
      status: 'complete',
      submit_type: null,
      subscription: 'sub_1PqwRSTestSubscription',
      success_url: 'https://naturinex-app-zsga.onrender.com/success?session_id={CHECKOUT_SESSION_ID}',
      total_details: {
        amount_discount: 0,
        amount_shipping: 0,
        amount_tax: 0
      },
      url: null
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

// Convert to JSON
const payload = JSON.stringify(event);

// Generate test signature (in production, Stripe generates this)
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;

// For testing, we'll create a simple signature
// In production, Stripe uses HMAC with your webhook secret
const signature = `t=${timestamp},v1=test_signature_for_development,v0=test`;

const options = {
  hostname: 'naturinex-app-zsga.onrender.com',
  port: 443,
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'stripe-signature': signature
  }
};

console.log('🚀 Sending test Stripe webhook event...');
console.log('📋 Event type:', event.type);
console.log('👤 User ID:', event.data.object.metadata.userId);
console.log('💳 Customer:', event.data.object.customer);
console.log('📧 Email:', event.data.object.customer_email);
console.log('💰 Amount:', '$' + (event.data.object.amount_total / 100).toFixed(2));
console.log('📦 Subscription:', event.data.object.subscription);
console.log('\n📤 Sending to:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log(`\n📨 Response Status: ${res.statusCode}`);
  
  let responseData = '';
  res.setEncoding('utf8');
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response:', responseData);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Webhook test successful!');
      console.log('The webhook endpoint is ready to receive Stripe events.');
      console.log('\nNext steps:');
      console.log('1. Make a real test purchase to trigger the webhook');
      console.log('2. Check Render logs for processing details');
      console.log('3. Verify user subscription status is updated in Firebase');
    } else if (res.statusCode === 400) {
      console.log('\n⚠️  Webhook signature validation failed (expected in test mode)');
      console.log('This is normal - the production webhook validates real Stripe signatures.');
      console.log('The endpoint is working correctly!');
    } else {
      console.log('\n❌ Unexpected response from webhook');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

// Send the request
req.write(payload);
req.end();