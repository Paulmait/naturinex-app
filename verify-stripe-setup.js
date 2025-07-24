// Verify Stripe webhook configuration
require('dotenv').config({ path: './functions/.env' });

console.log('🔍 Verifying Stripe Webhook Setup');
console.log('==================================\n');

// Check environment variables
console.log('1️⃣ Environment Variables:');
console.log('   SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set (' + process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...)' : '❌ Missing');
console.log('   WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set (' + process.env.STRIPE_WEBHOOK_SECRET + ')' : '❌ Missing');
console.log('   PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Set (' + process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...)' : '❌ Missing');

console.log('\n2️⃣ Webhook Configuration in Stripe:');
console.log('   Endpoint URL: https://us-central1-mediscan-b6252.cloudfunctions.net/api/webhooks/stripe');
console.log('   Signing Secret: whsec_0V6107GsHBfGlMEpTH1ooLyWXiVZIsr5');
console.log('   API Version: 2024-12-18.acacia');
console.log('   Events: checkout.session.completed, invoice.payment_failed');

console.log('\n3️⃣ Deployment Status:');
console.log('   To check if deployed, run:');
console.log('   node test-production-webhook.js');

console.log('\n4️⃣ Next Steps:');
console.log('   1. Deploy the function using one of the methods in MANUAL_DEPLOYMENT_GUIDE.md');
console.log('   2. Test the webhook endpoint');
console.log('   3. Monitor webhook logs in Stripe Dashboard');

// Test Stripe SDK initialization
try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
    });
    console.log('\n✅ Stripe SDK initialized successfully!');
} catch (error) {
    console.log('\n❌ Error initializing Stripe SDK:', error.message);
}