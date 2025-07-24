const https = require('https');

// Test the production webhook endpoint
async function testWebhook() {
    const webhookUrl = 'https://us-central1-mediscan-b6252.cloudfunctions.net/api/webhooks/stripe';
    
    // Create test payload
    const payload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'cs_test_webhook',
                object: 'checkout.session',
                amount_total: 1499,
                currency: 'usd',
                customer: 'cus_test_webhook',
                customer_email: 'test@example.com',
                payment_status: 'paid',
                mode: 'subscription',
                subscription: 'sub_test_webhook',
                metadata: {
                    userId: 'test_user_webhook',
                    plan: 'premium',
                    billingCycle: 'monthly'
                }
            }
        }
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'stripe-signature': 't=' + Date.now() + ',v1=test_signature'
        }
    };

    console.log('🚀 Testing webhook at:', webhookUrl);
    console.log('📦 Sending test event...\n');

    return new Promise((resolve, reject) => {
        const req = https.request(webhookUrl, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📡 Response Status:', res.statusCode);
                console.log('📡 Response Headers:', res.headers);
                console.log('📡 Response Body:', data);
                
                if (res.statusCode === 400) {
                    console.log('\n✅ SUCCESS! Webhook is working correctly!');
                    console.log('The 400 error means signature verification is active.');
                    console.log('\nTo test with real events:');
                    console.log('1. Use Stripe Dashboard test webhook feature');
                    console.log('2. Or use Stripe CLI: stripe trigger checkout.session.completed');
                } else if (res.statusCode === 404) {
                    console.log('\n❌ ERROR: Webhook endpoint not found!');
                    console.log('The function may not be deployed yet.');
                } else if (res.statusCode === 200) {
                    console.log('\n⚠️  WARNING: Got 200 OK but signature should have failed!');
                    console.log('Check if signature verification is working properly.');
                }
                
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request Error:', error.message);
            reject(error);
        });

        req.write(payload);
        req.end();
    });
}

// Run the test
console.log('🧪 Stripe Webhook Production Test');
console.log('==================================\n');

testWebhook().catch(console.error);