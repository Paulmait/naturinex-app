// Test Stripe webhook endpoint
const https = require('https');

// Test checkout.session.completed event
const testPayload = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2024-12-18.acacia',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_' + Date.now(),
      object: 'checkout.session',
      amount_total: 999,
      currency: 'usd',
      customer: 'cus_test123',
      customer_email: 'test@example.com',
      metadata: {
        userId: 'test_user_123',
        plan: 'premium'
      },
      mode: 'subscription',
      payment_status: 'paid',
      status: 'complete',
      subscription: 'sub_test_' + Date.now()
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

const data = JSON.stringify(testPayload);

const options = {
  hostname: 'naturinex-app-zsga.onrender.com',
  port: 443,
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'stripe-signature': 't=1627580400,v1=test_signature,v0=test' // Test signature format
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', responseData);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Webhook endpoint is working!');
    } else {
      console.log('\n❌ Webhook returned error status');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();

console.log('📤 Sending test webhook to:', options.hostname + options.path);