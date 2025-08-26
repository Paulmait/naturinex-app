// Test Stripe Integration
const fetch = require('node-fetch');

const API_URL = 'https://naturinex-app-zsga.onrender.com';

async function testStripeConfig() {
  console.log('🔍 Testing Stripe Integration\n');
  
  try {
    // Test 1: Get Stripe public key
    console.log('1️⃣ Testing /stripe-config endpoint...');
    const configResponse = await fetch(`${API_URL}/stripe-config`);
    const config = await configResponse.json();
    console.log('   Public Key:', config.publicKey ? '✅ Received' : '❌ Missing');
    console.log('   Key prefix:', config.publicKey ? config.publicKey.substring(0, 7) : 'N/A');
    
    // Test 2: Test create-checkout-session endpoint
    console.log('\n2️⃣ Testing /create-checkout-session endpoint...');
    const checkoutResponse = await fetch(`${API_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        userEmail: 'test@example.com'
      })
    });
    
    if (checkoutResponse.ok) {
      const session = await checkoutResponse.json();
      console.log('   Session created:', session.sessionId ? '✅ Success' : '❌ Failed');
      console.log('   Session URL:', session.url ? 'Generated' : 'Missing');
    } else {
      const error = await checkoutResponse.text();
      console.log('   ❌ Error:', error);
    }
    
    // Test 3: Check webhook endpoint
    console.log('\n3️⃣ Testing webhook endpoint availability...');
    const webhookResponse = await fetch(`${API_URL}/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({ test: true })
    });
    
    console.log('   Webhook endpoint:', webhookResponse.status === 400 ? '✅ Active (rejected invalid signature)' : '❌ Not working');
    
    console.log('\n✅ Stripe integration test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStripeConfig();