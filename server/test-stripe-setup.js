// Test script to verify Stripe price IDs and coupons
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const priceIds = {
  // Basic Tier
  basic_a_monthly: 'price_1RpEb3IwUuNq64NpP2jNKWIJ',
  basic_a_yearly: 'price_1RpEeKIwUuNq64Np0VUrD3jm',
  basic_b_monthly: 'price_1RpEcUIwUuNq64Np4KLl689G',
  basic_b_yearly: 'price_1RpEeqIwUuNq64NpPculkKkA',
  basic_c_monthly: 'price_1RpEdHIwUuNq64NpfLgNzDkc',
  basic_c_yearly: 'price_1RpEfFIwUuNq64Npcg9kVtC0',
  
  // Premium Tier
  premium_monthly: 'price_1Rn7frIwUuNq64NpcGXEdiDD',
  premium_yearly: 'price_1Rn7jbIwUuNq64NpooI9IPsF',
  
  // Professional Tier
  professional_monthly: 'price_1Rn7gRIwUuNq64NpnqVYDAIF',
  professional_yearly: 'price_1Rn7jwIwUuNq64NpDIgCKq2G'
};

const couponIds = [
  'COMBACK30', // Note: typo in Stripe
  'WINBACK50',
  'FRIEND15',
  'LAUNCH20',
  'WELCOME50'
];

async function testStripeSetup() {
  console.log('🧪 Testing Stripe Setup...\n');
  
  // Test 1: Verify all price IDs exist
  console.log('📋 Testing Price IDs:');
  console.log('=' .repeat(50));
  
  for (const [name, priceId] of Object.entries(priceIds)) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount / 100;
      console.log(`✅ ${name}: $${amount} ${price.recurring.interval}ly - ${price.active ? 'ACTIVE' : 'INACTIVE'}`);
    } catch (error) {
      console.log(`❌ ${name}: PRICE NOT FOUND (${priceId})`);
    }
  }
  
  // Test 2: Verify all coupons exist
  console.log('\n📋 Testing Coupons:');
  console.log('=' .repeat(50));
  
  for (const couponId of couponIds) {
    try {
      const coupon = await stripe.coupons.retrieve(couponId);
      const discount = coupon.percent_off ? `${coupon.percent_off}%` : `$${coupon.amount_off/100}`;
      const duration = coupon.duration === 'repeating' ? `${coupon.duration_in_months} months` : coupon.duration;
      console.log(`✅ ${couponId}: ${discount} off for ${duration} - ${coupon.valid ? 'VALID' : 'EXPIRED'}`);
    } catch (error) {
      console.log(`❌ ${couponId}: COUPON NOT FOUND`);
    }
  }
  
  // Test 3: Create test checkout sessions
  console.log('\n📋 Testing Checkout Sessions:');
  console.log('=' .repeat(50));
  
  const testEmail = 'test@example.com';
  const testUserId = 'test_user_123';
  
  // Test Basic plan with WELCOME50
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceIds.basic_b_monthly,
        quantity: 1,
      }],
      mode: 'subscription',
      customer_email: testEmail,
      metadata: { userId: testUserId },
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: testUserId }
      },
      discounts: [{ coupon: 'WELCOME50' }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel'
    });
    console.log(`✅ Basic Monthly + WELCOME50 + 7-day trial: Session created`);
    console.log(`   Preview: ${session.url}`);
  } catch (error) {
    console.log(`❌ Basic plan checkout failed: ${error.message}`);
  }
  
  // Test Premium plan
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceIds.premium_yearly,
        quantity: 1,
      }],
      mode: 'subscription',
      customer_email: testEmail,
      metadata: { userId: testUserId },
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel'
    });
    console.log(`✅ Premium Yearly: Session created`);
  } catch (error) {
    console.log(`❌ Premium plan checkout failed: ${error.message}`);
  }
  
  // Test Professional plan with FRIEND15
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceIds.professional_monthly,
        quantity: 1,
      }],
      mode: 'subscription',
      customer_email: testEmail,
      metadata: { userId: testUserId },
      discounts: [{ coupon: 'FRIEND15' }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel'
    });
    console.log(`✅ Professional Monthly + FRIEND15: Session created`);
  } catch (error) {
    console.log(`❌ Professional plan checkout failed: ${error.message}`);
  }
  
  // Test 4: Verify customer portal configuration
  console.log('\n📋 Testing Customer Portal:');
  console.log('=' .repeat(50));
  
  try {
    const config = await stripe.billingPortal.configurations.list({ limit: 1 });
    if (config.data.length > 0) {
      console.log('✅ Customer portal configured');
      const features = config.data[0].features;
      console.log(`   - Cancel subscriptions: ${features.subscription_cancel.enabled ? '✓' : '✗'}`);
      console.log(`   - Update payment methods: ${features.payment_method_update.enabled ? '✓' : '✗'}`);
      console.log(`   - View invoices: ${features.invoice_history.enabled ? '✓' : '✗'}`);
    } else {
      console.log('❌ Customer portal not configured');
    }
  } catch (error) {
    console.log(`❌ Portal check failed: ${error.message}`);
  }
  
  console.log('\n🎉 Stripe setup test complete!');
}

// Run the test
testStripeSetup().catch(console.error);