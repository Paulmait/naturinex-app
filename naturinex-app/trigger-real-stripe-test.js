// Trigger a real Stripe test by creating a checkout session
const https = require('https');

console.log('📋 Creating a real Stripe checkout session to test webhook...\n');

// You'll need to get your Stripe API key from environment or dashboard
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE';

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'sk_test_YOUR_KEY_HERE') {
  console.error('❌ Please set your Stripe secret key!');
  console.error('Get it from: https://dashboard.stripe.com/test/apikeys');
  process.exit(1);
}

// Create checkout session data
const checkoutData = new URLSearchParams({
  'payment_method_types[]': 'card',
  'line_items[0][price]': 'price_1QU8waRqEPLAinmJmJFE8IZU', // Your premium price ID
  'line_items[0][quantity]': '1',
  'mode': 'subscription',
  'success_url': 'https://naturinex-app-zsga.onrender.com/success?session_id={CHECKOUT_SESSION_ID}',
  'cancel_url': 'https://naturinex-app-zsga.onrender.com/cancel',
  'metadata[userId]': 'webhook_test_user_' + Date.now(),
  'metadata[plan]': 'premium',
  'metadata[test]': 'true',
  'customer_email': 'webhook-test@example.com'
}).toString();

const options = {
  hostname: 'api.stripe.com',
  port: 443,
  path: '/v1/checkout/sessions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(checkoutData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('✅ Checkout session created successfully!\n');
        console.log('🔗 Checkout URL:', response.url);
        console.log('📋 Session ID:', response.id);
        console.log('👤 Customer:', response.customer_email);
        console.log('\n📌 What happens next:');
        console.log('1. Visit the checkout URL above');
        console.log('2. Use test card: 4242 4242 4242 4242');
        console.log('3. Complete the payment');
        console.log('4. This will trigger the webhook!');
        console.log('5. Check your Render logs for webhook processing');
        
        // Open the checkout URL in browser (optional)
        if (process.platform === 'win32') {
          require('child_process').exec(`start ${response.url}`);
        }
      } else {
        console.error('❌ Failed to create checkout session');
        console.error('Status:', res.statusCode);
        console.error('Response:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
});

req.write(checkoutData);
req.end();