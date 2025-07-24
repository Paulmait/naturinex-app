# 🚀 Stripe Pricing Implementation Guide

## 📋 Step 1: Create New Prices in Stripe Dashboard

### Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products) and create:

### 1. **Basic Plan Product**
Create product if not exists: "Naturinex Basic"

**Prices to create:**
- Monthly: $7.99 (existing: `price_1Rn7erIwUuNq64Np5N2Up5TA`)
- Annual: $79.99 (NEW - create this)
- Trial: 7 days free

### 2. **Premium Plan Product** ⭐
Create product if not exists: "Naturinex Premium"

**Prices to create:**
- Monthly: $14.99 (existing: `price_1Rn7frIwUuNq64NpcGXEdiDD`)
- Annual: $139.99 (NEW - create this)
- Trial: 7 days free

### 3. **Professional Plan Product**
Create product if not exists: "Naturinex Professional"

**Prices to create:**
- Monthly: $39.99 (existing: `price_1Rn7gRIwUuNq64NpnqVYDAIF`)
- Annual: $359.99 (NEW - create this)
- Trial: 7 days free

### 4. **Launch Promotion Coupons**
Create in [Stripe Dashboard > Coupons](https://dashboard.stripe.com/coupons):

- **LAUNCH20**: 20% off first year (for annual plans)
- **WELCOME50**: 50% off first 3 months (for monthly plans)
- **FRIEND15**: 15% off forever (referral reward)
- **WINBACK50**: 50% off for 3 months (re-engagement)

## 📝 Step 2: Update Environment Variables

Once you create the new prices, update your `.env`:

```env
# Monthly Prices (existing)
STRIPE_PRICE_BASIC_MONTHLY=price_1Rn7erIwUuNq64Np5N2Up5TA
STRIPE_PRICE_PREMIUM_MONTHLY=price_1Rn7frIwUuNq64NpcGXEdiDD
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1Rn7gRIwUuNq64NpnqVYDAIF

# Annual Prices (NEW - add these after creating)
STRIPE_PRICE_BASIC_YEARLY=price_[NEW_BASIC_ANNUAL_ID]
STRIPE_PRICE_PREMIUM_YEARLY=price_[NEW_PREMIUM_ANNUAL_ID]
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_[NEW_PROFESSIONAL_ANNUAL_ID]

# Promotion Codes
STRIPE_COUPON_LAUNCH=LAUNCH20
STRIPE_COUPON_WELCOME=WELCOME50
STRIPE_COUPON_REFERRAL=FRIEND15
STRIPE_COUPON_WINBACK=WINBACK50

# Free Trial Days
STRIPE_TRIAL_DAYS=7
```

## 🎯 Step 3: Pricing Display Format

### For your app's pricing page:

```
┌─────────────────────────────────────────┐
│              BASIC PLAN                 │
│                                         │
│  $7.99/month  or  $79.99/year         │
│           Save $15.89 (17%)            │
│                                         │
│  ✓ 50 AI Health Scans/month           │
│  ✓ Basic symptom analysis              │
│  ✓ Health tracking                     │
│                                         │
│        [Start 7-Day Free Trial]        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          PREMIUM PLAN ⭐                │
│         Most Popular                    │
│                                         │
│  $14.99/month  or  $139.99/year       │
│           Save $39.89 (22%)            │
│                                         │
│  ✓ Unlimited AI Health Scans          │
│  ✓ Advanced health insights            │
│  ✓ Medicine interactions checker       │
│  ✓ Priority support                   │
│  ✓ Family sharing (up to 4)          │
│                                         │
│        [Start 7-Day Free Trial]        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         PROFESSIONAL PLAN              │
│                                         │
│  $39.99/month  or  $359.99/year       │
│           Save $119.89 (25%)           │
│                                         │
│  ✓ Everything in Premium               │
│  ✓ Advanced AI diagnostics             │
│  ✓ Telehealth integration              │
│  ✓ PDF health reports                 │
│  ✓ API access                         │
│  ✓ White-glove support                │
│                                         │
│        [Start 7-Day Free Trial]        │
└─────────────────────────────────────────┘

    🎁 Limited Time: 20% off annual plans
         with code LAUNCH20
```

## 💻 Step 4: Implementation Code

### A. Update priceConfig.ts with new structure: