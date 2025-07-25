const crypto = require('crypto');
const axios = require('axios');

// Test webhook with a properly signed Stripe event
async function testStripeWebhook() {
  // This is a test webhook secret - you'll need your actual one from Stripe
  const webhookSecret = 'whsec_test123'; // This matches what's in your guide
  
  // Create a test event
  const testEvent = {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        customer: 'cus_test123',
        customer_email: 'test@example.com',
        payment_status: 'paid',
        status: 'complete',
        mode: 'subscription',
        subscription: 'sub_test123',
        metadata: {
          userId: 'test_user_123'
        }
      }
    },
    type: 'checkout.session.completed',
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null
    }
  };

  const payload = JSON.stringify(testEvent);
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create Stripe signature
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex');
  
  const stripeSignature = `t=${timestamp},v1=${signature}`;

  console.log('Testing webhook at: https://naturinex-app-zsga.onrender.com/webhook');
  console.log('Event type:', testEvent.type);
  console.log('Signature:', stripeSignature);

  try {
    const response = await axios.post(
      'https://naturinex-app-zsga.onrender.com/webhook',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': stripeSignature
        }
      }
    );

    console.log('\n✅ Webhook test successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.log('\n❌ Webhook test failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 This likely means the webhook secret in Render doesn\'t match.');
      console.log('Update STRIPE_WEBHOOK_SECRET in Render to match your Stripe webhook endpoint secret.');
    }
  }
}

// Test basic connectivity first
async function testEndpoint() {
  try {
    console.log('Testing basic endpoint connectivity...');
    const response = await axios.post(
      'https://naturinex-app-zsga.onrender.com/webhook',
      { test: true },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.includes('Invalid webhook signature')) {
      console.log('✅ Endpoint is reachable and webhook verification is active');
      return true;
    }
    console.log('❌ Unexpected response:', error.response?.status, error.response?.data);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Stripe Webhook Integration\n');
  
  const isReachable = await testEndpoint();
  if (!isReachable) {
    console.log('\n⚠️  Fix endpoint issues before testing webhook signature');
    return;
  }

  console.log('\nTesting with signed webhook...\n');
  await testStripeWebhook();
}

runTests();