# 🧪 Stripe Pricing Test Plan

## Test Overview
This document outlines how to test the implemented 3-tier pricing system with A/B testing and promotional coupons.

## Implemented Features ✅

### 1. Three Pricing Tiers
- **Basic** ($7.99/$9.99/$11.99 with A/B testing)
  - 10 scans/month
  - 30-day storage
  - No watermarks
  
- **Premium** ($14.99/month, $139.99/year)
  - 50 scans/month
  - Permanent storage
  - AI analysis
  - PDF exports
  
- **Professional** ($39.99/month, $359.99/year)
  - 200 scans/month
  - API access
  - Bulk tools
  - Team features

### 2. Promotional Coupons
- `WELCOME50` - 50% off for 3 months (new users)
- `WINBACK50` - 50% off for 3 months (returning users)
- `COMBACK30` - 30% off for 3 months
- `FRIEND15` - 15% off forever
- `LAUNCH20` - 20% off forever

### 3. A/B Testing
Users are automatically assigned to one of three Basic pricing groups:
- Group A: $7.99/month
- Group B: $9.99/month  
- Group C: $11.99/month

## Manual Testing Steps

### Step 1: Test User Assignment
1. Create 3 test accounts with different emails
2. Navigate to subscription screen
3. Verify each sees different Basic pricing:
   - User 1: $7.99 Basic plan
   - User 2: $9.99 Basic plan
   - User 3: $11.99 Basic plan

### Step 2: Test Plan Selection
1. Toggle between Monthly/Yearly views
2. Verify savings displayed for yearly plans
3. Select each tier and verify:
   - Features list is correct
   - Price updates properly
   - "Most Popular" badge on Premium

### Step 3: Test Promotional Offers
1. **New User (WELCOME50)**:
   - Create account < 7 days old
   - Should see auto-applied 50% off banner
   - Verify code in promo field

2. **Manual Promo Codes**:
   - Click "Have a promo code?"
   - Test valid codes:
     - `FRIEND15` ✓
     - `LAUNCH20` ✓
   - Test invalid code:
     - `INVALID123` ✗

### Step 4: Test Checkout Flow
1. Select Basic Monthly plan
2. Click "Subscribe"
3. Verify checkout session includes:
   - Correct price ID
   - 7-day trial
   - Applied promo code
   - User email

### Step 5: Test Subscription Management
1. As premium user, click "Manage Subscription"
2. Verify portal link works
3. Test "Cancel Subscription":
   - Shows warning dialog
   - Explains what user loses
   - Keeps access until period end

## API Testing

### Test Pricing Endpoint
```bash
# Get pricing for user
GET /api/pricing/test_user_123

# Expected response:
{
  "tiers": {
    "basic": { "name": "Basic A", "monthly": {...}, "yearly": {...} },
    "premium": { "name": "Premium", "monthly": {...}, "yearly": {...} },
    "professional": { "name": "Professional", "monthly": {...}, "yearly": {...} }
  },
  "offer": {
    "hasOffer": true,
    "code": "WELCOME50",
    "description": "50% off for your first 3 months!"
  },
  "validCoupons": ["COMBACK30", "WINBACK50", "FRIEND15", "LAUNCH20", "WELCOME50"]
}
```

### Test Checkout Session
```bash
POST /api/create-checkout-session
{
  "priceId": "price_1RpEcUIwUuNq64Np4KLl689G",
  "userId": "test_user_123",
  "userEmail": "test@example.com",
  "couponCode": "WELCOME50",
  "trialDays": 7
}
```

### Test Customer Portal
```bash
POST /api/subscription/portal
Authorization: Bearer <auth_token>

# Returns:
{
  "portalUrl": "https://billing.stripe.com/p/session/..."
}
```

## Expected Results

### Conversion Tracking
Each subscription should track:
- User ID
- Pricing group (A/B/C)
- Plan selected (tier + period)
- Promo code used
- Conversion timestamp

### Analytics Data
Monitor in Firestore `pricingAnalytics`:
- Views by pricing group
- Conversions by price point
- Revenue by tier
- Promo code effectiveness

## Common Issues & Solutions

### "Price not found"
- Verify price IDs match Stripe dashboard
- Check environment variables are set
- Ensure prices are active in Stripe

### "Invalid coupon"
- Check coupon ID spelling (note: COMBACK30 typo)
- Verify coupon is not expired
- Check redemption limits

### "Checkout failed"
- Verify user is authenticated
- Check required fields (email, userId)
- Ensure Stripe keys are valid

## Production Checklist

Before going live:
- [ ] Set all price IDs in environment variables
- [ ] Configure webhook endpoint in Stripe
- [ ] Test with Stripe test cards
- [ ] Enable customer portal features
- [ ] Set up monitoring for failed payments
- [ ] Configure trial end notifications
- [ ] Test cancellation flow
- [ ] Verify A/B test distribution