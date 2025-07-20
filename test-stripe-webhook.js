const crypto = require('crypto');
const https = require('https');

// Your webhook endpoint and secret
const WEBHOOK_URL = 'https://naturinex-app.onrender.com/webhooks/stripe';
const WEBHOOK_SECRET = 'whsec_u1t6Hz8LL14v09vJLTxyJ4v08AdnXPyd';

// Create a test checkout.session.completed event
const testEvent = {
  id: 'evt_test_webhook_' + Date.now(),
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_' + Date.now(),
      object: 'checkout.session',
      amount_total: 1999,
      currency: 'usd',
      customer: 'cus_test123',
      customer_email: 'test@example.com',
      metadata: {
        userId: 'test_user_123'
      },
      mode: 'subscription',
      payment_status: 'paid',
      status: 'complete',
      success_url: 'https://naturinex.com/success',
      cancel_url: 'https://naturinex.com/cancel'
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

// Generate Stripe signature
function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Send the webhook
const payload = JSON.stringify(testEvent);
const signature = generateSignature(payload, WEBHOOK_SECRET);

const url = new URL(WEBHOOK_URL);
const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'stripe-signature': signature
  }
};

console.log('🚀 Sending test webhook to:', WEBHOOK_URL);
console.log('📦 Event type:', testEvent.type);

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📨 Response:');
    console.log('Status:', res.statusCode, res.statusMessage);
    console.log('Body:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Webhook test successful!');
    } else {
      console.log('\n❌ Webhook test failed');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(payload);
req.end();