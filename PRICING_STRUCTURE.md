# 💰 Naturinex Pricing Structure

## Subscription Plans

### 📱 Monthly Plans
- **Basic**: $7.99/month (`price_1Rn7erIwUuNq64Np5N2Up5TA`)
- **Premium**: $14.99/month (`price_1Rn7frIwUuNq64NpcGXEdiDD`)
- **Professional**: $39.99/month (`price_1Rn7gRIwUuNq64NpnqVYDAIF`)

### 📅 Annual Plans (All $399.99/year)
- **Basic Annual**: $399.99/year (`price_1Rn7j4IwUuNq64NpXTv3lkwU`)
  - Save $-304.11 vs monthly
- **Premium Annual**: $399.99/year (`price_1Rn7jbIwUuNq64NpooI9IPsF`)
  - Save $-220.11 vs monthly
- **Professional Annual**: $399.99/year (`price_1Rn7jwIwUuNq64NpDIgCKq2G`)
  - Save $79.89 vs monthly

## 🔧 Implementation

### Environment Variables Added
All price IDs have been added to `.env`:
```env
# Basic Plan - $7.99
STRIPE_PRICE_BASIC_MONTHLY=price_1Rn7erIwUuNq64Np5N2Up5TA

# Premium Plan - $14.99
STRIPE_PRICE_PREMIUM_MONTHLY=price_1Rn7frIwUuNq64NpcGXEdiDD

# Professional Plan - $39.99
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1Rn7gRIwUuNq64NpnqVYDAIF

# Annual Plans - $399.99 each
STRIPE_PRICE_BASIC_YEARLY=price_1Rn7j4IwUuNq64NpXTv3lkwU
STRIPE_PRICE_PREMIUM_YEARLY=price_1Rn7jbIwUuNq64NpooI9IPsF
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_1Rn7jwIwUuNq64NpDIgCKq2G
```

### Price Configuration Module
Created `priceConfig.ts` to manage price IDs and plan details.

### API Endpoints

#### 1. Create Checkout Session
```javascript
POST /api/create-checkout-session
{
  "userId": "user123",
  "userEmail": "user@example.com",
  "plan": "premium",        // "basic", "premium", or "professional"
  "billingCycle": "monthly" // "monthly" or "yearly"
}
```

#### 2. Get Stripe Configuration
```javascript
GET /api/stripe-config
// Returns public key and all price IDs
```

#### 3. Customer Portal
```javascript
POST /api/create-portal-session
{
  "customerId": "cus_123"
}
```

## 📱 Mobile App Integration

To use these prices in your React Native app:

```javascript
// Get Stripe config
const response = await fetch('YOUR_API_URL/stripe-config');
const { publicKey, prices } = await response.json();

// Create checkout session
const checkoutResponse = await fetch('YOUR_API_URL/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    plan: 'premium',
    billingCycle: 'monthly'
  })
});

const { url } = await checkoutResponse.json();
// Redirect to Stripe Checkout
```

## 🎯 Note on Annual Pricing

The annual plans are all priced at $399.99, which means:
- **Basic Annual**: Users pay more annually than monthly
- **Premium Annual**: Users pay more annually than monthly  
- **Professional Annual**: Users save $79.89 with annual billing

You may want to adjust the annual pricing to provide better incentives for annual subscriptions.