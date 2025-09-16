// Script to update Stripe products to match new pricing strategy
// Run this to configure your Stripe account with the new tiers

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// NEW PRICING STRUCTURE
const PRODUCTS_TO_CREATE = {
  // Main Subscription Tiers
  NATURINEX_PLUS: {
    name: 'Naturinex Plus',
    description: 'Unlimited medication scans with AI-powered natural alternatives',
    metadata: {
      tier: 'plus',
      features: 'unlimited_scans,ai_insights,natural_alternatives,export_reports,affiliate_access',
    },
    prices: [
      {
        nickname: 'Plus Monthly',
        unit_amount: 699, // $6.99
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { billing: 'monthly' },
      },
      {
        nickname: 'Plus Yearly - New Year Special',
        unit_amount: 5900, // $59/year (normally $83.88)
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { billing: 'yearly', discount: '30%' },
      },
    ],
  },

  NATURINEX_PRO: {
    name: 'Naturinex Pro',
    description: 'Professional plan with family sharing and expert consultations',
    metadata: {
      tier: 'pro',
      features: 'everything_in_plus,family_sharing,consultations,priority_support,api_access',
    },
    prices: [
      {
        nickname: 'Pro Monthly',
        unit_amount: 1299, // $12.99
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { billing: 'monthly' },
      },
      {
        nickname: 'Pro Yearly',
        unit_amount: 9900, // $99/year (save $56.88)
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { billing: 'yearly', discount: '36%' },
      },
    ],
  },

  // One-Time Purchases
  DETAILED_REPORT: {
    name: 'Detailed Medication Report',
    description: 'Comprehensive PDF report with natural alternatives and research',
    metadata: {
      type: 'one_time',
      category: 'report',
    },
    prices: [
      {
        nickname: 'Single Report',
        unit_amount: 99, // $0.99
        currency: 'usd',
      },
    ],
  },

  EXPERT_CONSULTATION: {
    name: 'Expert Naturopath Consultation',
    description: '30-minute video consultation with certified naturopath',
    metadata: {
      type: 'one_time',
      category: 'consultation',
      duration: '30_minutes',
    },
    prices: [
      {
        nickname: 'Single Consultation',
        unit_amount: 1999, // $19.99
        currency: 'usd',
      },
    ],
  },

  CUSTOM_PROTOCOL: {
    name: 'Personalized Natural Protocol',
    description: 'Custom natural medication protocol based on your health profile',
    metadata: {
      type: 'one_time',
      category: 'protocol',
    },
    prices: [
      {
        nickname: 'Custom Protocol',
        unit_amount: 999, // $9.99
        currency: 'usd',
      },
    ],
  },

  INTERACTION_CHECK: {
    name: 'Drug-Herb Interaction Check',
    description: 'Comprehensive interaction analysis between medications and supplements',
    metadata: {
      type: 'one_time',
      category: 'safety_check',
    },
    prices: [
      {
        nickname: 'Interaction Report',
        unit_amount: 199, // $1.99
        currency: 'usd',
      },
    ],
  },
};

// Map existing products to new structure
const EXISTING_PRODUCT_MAPPING = {
  'Naturinex Basic A': 'ARCHIVE_LEGACY_A',
  'Naturinex Basic B': 'ARCHIVE_LEGACY_B',
  'Naturinex Basic C': 'ARCHIVE_LEGACY_C',
};

async function updateStripeProducts() {
  console.log('🚀 Starting Stripe Product Update...\n');

  try {
    // Step 1: Archive existing products (don't delete, just deactivate)
    console.log('📦 Archiving existing products...');
    const existingProducts = await stripe.products.list({ limit: 100 });

    for (const product of existingProducts.data) {
      if (EXISTING_PRODUCT_MAPPING[product.name]) {
        await stripe.products.update(product.id, {
          active: false,
          metadata: {
            ...product.metadata,
            archived: 'true',
            archived_date: new Date().toISOString(),
            reason: 'pricing_restructure_2025',
          },
        });
        console.log(`  ✅ Archived: ${product.name}`);
      }
    }

    // Step 2: Create new products and prices
    console.log('\n📝 Creating new products and pricing...\n');

    const createdProducts = {};

    for (const [key, productData] of Object.entries(PRODUCTS_TO_CREATE)) {
      // Create product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata,
        active: true,
      });

      console.log(`✅ Created product: ${product.name} (${product.id})`);

      // Create prices for this product
      const createdPrices = [];
      for (const priceData of productData.prices) {
        const priceParams = {
          product: product.id,
          nickname: priceData.nickname,
          unit_amount: priceData.unit_amount,
          currency: priceData.currency,
          metadata: priceData.metadata || {},
        };

        // Add recurring if it's a subscription
        if (priceData.recurring) {
          priceParams.recurring = priceData.recurring;
        }

        const price = await stripe.prices.create(priceParams);
        createdPrices.push(price);
        console.log(`  💰 Created price: ${price.nickname} - $${(price.unit_amount / 100).toFixed(2)} ${price.recurring ? `per ${price.recurring.interval}` : '(one-time)'}`);
      }

      createdProducts[key] = {
        product,
        prices: createdPrices,
      };
    }

    // Step 3: Create promotional coupons
    console.log('\n🎫 Creating promotional coupons...\n');

    const coupons = [
      {
        id: 'NATURAL2025',
        percent_off: 40,
        duration: 'once',
        max_redemptions: 1000,
        metadata: {
          campaign: 'new_year_2025',
          description: 'New Year, New You - 40% off',
        },
      },
      {
        id: 'WELCOME50',
        percent_off: 50,
        duration: 'once',
        max_redemptions: null, // Unlimited
        metadata: {
          campaign: 'first_time_user',
          description: 'Welcome offer - 50% off first month',
        },
      },
      {
        id: 'STUDENT',
        percent_off: 50,
        duration: 'forever',
        max_redemptions: null,
        metadata: {
          campaign: 'student_discount',
          description: 'Student discount - 50% off',
          verification_required: 'true',
        },
      },
    ];

    for (const couponData of coupons) {
      try {
        const coupon = await stripe.coupons.create(couponData);
        console.log(`✅ Created coupon: ${coupon.id} - ${coupon.percent_off}% off`);
      } catch (error) {
        if (error.code === 'resource_already_exists') {
          console.log(`  ⚠️ Coupon ${couponData.id} already exists`);
        } else {
          throw error;
        }
      }
    }

    // Step 4: Create webhook endpoints if needed
    console.log('\n🔗 Checking webhook configuration...\n');

    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    const requiredEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'payment_intent.succeeded',
    ];

    console.log(`Found ${webhooks.data.length} webhook endpoint(s)`);

    if (webhooks.data.length > 0) {
      console.log('📋 Required events to enable:');
      requiredEvents.forEach(event => console.log(`  - ${event}`));
    }

    // Step 5: Output configuration for app
    console.log('\n📄 Configuration for your app:\n');
    console.log('Add these to your .env file:\n');

    for (const [key, data] of Object.entries(createdProducts)) {
      if (data.prices.length > 0) {
        data.prices.forEach(price => {
          const envKey = `STRIPE_PRICE_${key}_${price.recurring ? price.recurring.interval.toUpperCase() : 'ONETIME'}`;
          console.log(`${envKey}=${price.id}`);
        });
      }
    }

    // Step 6: Create a checkout session example
    console.log('\n🛒 Example Checkout Session:\n');
    console.log(`
// Example code to create a checkout session:
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price: '${createdProducts.NATURINEX_PLUS?.prices[1]?.id || 'price_id'}', // Plus Yearly
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: 'https://naturinex.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://naturinex.com/pricing',
  metadata: {
    user_id: 'user_123',
  },
});
    `);

    console.log('\n✨ Stripe products updated successfully!\n');

    // Return created products for reference
    return createdProducts;

  } catch (error) {
    console.error('❌ Error updating Stripe products:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the update
if (require.main === module) {
  updateStripeProducts()
    .then((products) => {
      console.log('\n📊 Summary:');
      console.log(`Created ${Object.keys(products).length} new products`);
      console.log('\nNext steps:');
      console.log('1. Update your app with the new price IDs');
      console.log('2. Test checkout flow with test cards');
      console.log('3. Configure webhook endpoints');
      console.log('4. Launch marketing campaign');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to update products:', error);
      process.exit(1);
    });
}

module.exports = updateStripeProducts;