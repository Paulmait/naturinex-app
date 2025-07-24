// Test webhook with your live configuration
require('dotenv').config();

console.log('🔍 Checking environment variables...');
console.log('SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('WEBHOOK_SECRET exists:', !!process.env.STRIPE_WEBHOOK_SECRET);
console.log('WEBHOOK_SECRET value:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...');

// Test that the webhook handler can load
try {
    const { handleStripeWebhook } = require('./lib/stripeWebhook');
    console.log('✅ Webhook handler loaded successfully');
    
    // Create a mock request to test basic functionality
    const mockReq = {
        headers: { 'stripe-signature': 'test' },
        body: Buffer.from('{}')
    };
    
    const mockRes = {
        status: (code) => ({
            send: (msg) => console.log(`Response ${code}: ${msg}`),
            json: (data) => console.log(`Response ${code}:`, JSON.stringify(data))
        })
    };
    
    console.log('\n🧪 Testing webhook handler response...');
    handleStripeWebhook(mockReq, mockRes);
    
} catch (error) {
    console.error('❌ Error loading webhook handler:', error.message);
}