const fetch = require('node-fetch');

// Test webhook locally
async function testWebhook() {
    const webhookUrl = 'http://localhost:5001/naturinex-app/us-central1/api/stripe-webhook';
    
    // Create test payload
    const payload = JSON.stringify({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'cs_test_123',
                object: 'checkout.session',
                amount_total: 1499,
                currency: 'usd',
                customer: 'cus_test_123',
                customer_email: 'test@example.com',
                payment_status: 'paid',
                mode: 'subscription',
                subscription: 'sub_test_123',
                metadata: {
                    userId: 'test_user_123',
                    plan: 'premium',
                    billingCycle: 'monthly'
                }
            }
        }
    });

    try {
        console.log('🚀 Testing webhook at:', webhookUrl);
        console.log('📦 Payload:', payload);
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': 't=' + Date.now() + ',v1=test_signature'
            },
            body: Buffer.from(payload)
        });

        const result = await response.text();
        console.log('📡 Response status:', response.status);
        console.log('📡 Response body:', result);
        
        if (response.status === 400) {
            console.log('\n⚠️  Expected 400 error - webhook signature verification is working!');
            console.log('To test with real signatures, use the Stripe CLI:');
            console.log('1. Install: https://stripe.com/docs/stripe-cli');
            console.log('2. Run: stripe listen --forward-to ' + webhookUrl);
            console.log('3. Trigger: stripe trigger checkout.session.completed');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Make sure the Firebase emulator is running:');
        console.log('cd functions && npm run serve');
    }
}

// Check if node-fetch is installed
try {
    require.resolve('node-fetch');
    testWebhook();
} catch (e) {
    console.log('Installing node-fetch...');
    require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
    console.log('Please run this script again.');
}