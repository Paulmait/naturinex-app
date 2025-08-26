// Direct test of webhook handler without emulator
require('dotenv').config();

// Mock Firebase admin
const admin = {
    firestore: () => ({
        collection: (name) => ({
            doc: (id) => ({
                update: async (data) => {
                    console.log(`✅ Would update ${name}/${id} with:`, data);
                    return Promise.resolve();
                }
            }),
            add: async (data) => {
                console.log(`✅ Would add to ${name}:`, data);
                return Promise.resolve();
            },
            where: (field, op, value) => ({
                limit: () => ({
                    get: async () => ({
                        empty: false,
                        docs: [{
                            id: 'test_user_123',
                            ref: {
                                update: async (data) => {
                                    console.log('✅ Would update user with:', data);
                                    return Promise.resolve();
                                }
                            }
                        }]
                    })
                })
            })
        }),
        FieldValue: {
            serverTimestamp: () => new Date()
        }
    })
};

// Mock Stripe
const stripe = {
    webhooks: {
        constructEvent: (body, sig, secret) => {
            console.log('🔐 Verifying signature...');
            if (!sig || !secret) {
                throw new Error('Missing signature or secret');
            }
            // For testing, just parse the body
            return JSON.parse(body.toString());
        }
    },
    subscriptions: {
        retrieve: async (id) => ({
            id,
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            cancel_at_period_end: false
        })
    }
};

// Replace module dependencies
require.cache[require.resolve('firebase-admin')] = { exports: admin };
require.cache[require.resolve('stripe')] = { 
    exports: function() { return stripe; }
};

// Load the webhook handler
const { handleStripeWebhook } = require('./lib/stripeWebhook');

// Create mock request and response
const mockReq = {
    headers: {
        'stripe-signature': 't=123,v1=test'
    },
    body: Buffer.from(JSON.stringify({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
            object: {
                id: 'cs_test_123',
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
    }))
};

const mockRes = {
    status: (code) => ({
        send: (msg) => console.log(`Response ${code}:`, msg),
        json: (data) => console.log(`Response ${code}:`, data)
    })
};

// Test the handler
console.log('🧪 Testing webhook handler directly...\n');
handleStripeWebhook(mockReq, mockRes)
    .then(() => console.log('\n✅ Test completed!'))
    .catch(err => console.error('\n❌ Test failed:', err));