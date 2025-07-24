/**
 * Test script to verify webhook endpoint is working
 * Run this to test your webhook locally or on production
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://www.naturinex.com/webhooks/stripe';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'your_webhook_secret_here';

// Test payload
const testPayload = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_123',
      object: 'checkout.session',
      amount_total: 1999,
      currency: 'usd',
      customer_email: 'test@example.com',
      metadata: {
        userId: 'test_user_123'
      }
    }
  },
  type: 'checkout.session.completed'
};

// Generate Stripe signature
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return {
    signature: `t=${timestamp},v1=${signature}`,
    timestamp,
    payload: payloadString
  };
}

// Send test webhook
function testWebhook(url, followRedirects = false) {
  console.log(`\n🧪 Testing webhook endpoint: ${url}`);
  console.log(`Follow redirects: ${followRedirects}`);
  
  const { signature, payload } = generateStripeSignature(testPayload, WEBHOOK_SECRET);
  
  const urlObj = new URL(url);
  const client = urlObj.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'stripe-signature': signature,
      'User-Agent': 'Stripe/1.0 (+https://stripe.com)'
    }
  };

  console.log('\n📤 Request details:');
  console.log(`Method: ${options.method}`);
  console.log(`URL: ${url}`);
  console.log(`Headers:`, options.headers);
  
  const req = client.request(options, (res) => {
    console.log('\n📥 Response received:');
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`\nResponse body: ${data}`);
      
      // Check for redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`\n⚠️  REDIRECT DETECTED!`);
        console.log(`Redirecting to: ${res.headers.location}`);
        
        if (followRedirects) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          testWebhook(redirectUrl, false);
        } else {
          console.log('\n❌ Webhook failed due to redirect.');
          console.log('Stripe does not follow redirects for webhooks.');
          console.log('\nSuggested fixes:');
          console.log('1. Update your Stripe webhook URL to: ' + res.headers.location);
          console.log('2. Configure your server to handle the webhook at the current URL without redirecting');
        }
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('\n✅ Webhook endpoint is working correctly!');
      } else {
        console.log('\n❌ Webhook endpoint returned an error.');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('\n❌ Request failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('The server is not running or not accessible.');
    } else if (error.code === 'ENOTFOUND') {
      console.log('The domain name could not be resolved.');
    }
  });
  
  req.write(payload);
  req.end();
}

// Test different URL variations
function testAllVariations() {
  const baseUrl = WEBHOOK_URL.replace(/\/$/, ''); // Remove trailing slash if present
  const domain = new URL(baseUrl).hostname;
  const path = new URL(baseUrl).pathname;
  
  console.log('🔍 Testing webhook URL variations...\n');
  
  const variations = [
    baseUrl,
    baseUrl + '/',
    baseUrl.replace('https://', 'http://'),
    baseUrl.replace('www.', ''),
    baseUrl.replace(domain, `api.${domain.replace('www.', '')}`),
  ];
  
  // Remove duplicates
  const uniqueUrls = [...new Set(variations)];
  
  console.log('URLs to test:');
  uniqueUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
  });
  
  // Test the main URL with redirect following
  testWebhook(WEBHOOK_URL, true);
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node test-webhook.js [options]

Options:
  --url <url>          Webhook URL to test (default: ${WEBHOOK_URL})
  --secret <secret>    Stripe webhook secret (default: from env)
  --all               Test all URL variations
  --help, -h          Show this help message

Examples:
  node test-webhook.js
  node test-webhook.js --url https://api.example.com/webhook
  node test-webhook.js --all
    `);
    process.exit(0);
  }
  
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    process.env.WEBHOOK_URL = args[urlIndex + 1];
  }
  
  const secretIndex = args.indexOf('--secret');
  if (secretIndex !== -1 && args[secretIndex + 1]) {
    process.env.STRIPE_WEBHOOK_SECRET = args[secretIndex + 1];
  }
  
  if (args.includes('--all')) {
    testAllVariations();
  } else {
    testWebhook(process.env.WEBHOOK_URL || WEBHOOK_URL, true);
  }
}

module.exports = { testWebhook, generateStripeSignature };