# 🎯 Complete Stripe Setup Guide for Naturinex

## What's Implemented ✅

1. **A/B Pricing System** - 3 test groups ($7.99, $9.99, $11.99)
2. **Free Trials** - 7-day trial for all plans
3. **Promotional Offers** - Auto-applied discounts
4. **Customer Portal** - Full subscription management
5. **One-Click Cancellation** - Direct from app
6. **Webhook Handling** - Automatic subscription updates

## Stripe Dashboard Setup Required

### 1. Create Your Product

1. Go to **Products** in Stripe Dashboard
2. Click **+ Add product**
3. Name: "Naturinex Premium"
4. Description: "Unlimited wellness product scans and analysis"

### 2. Create Price IDs for A/B Testing

Add these prices to your product:

#### Monthly Plans
- **Test Group A**: $7.99/month → Copy the price ID (starts with `price_`)
- **Test Group B**: $9.99/month → Copy the price ID
- **Test Group C**: $11.99/month → Copy the price ID

#### Yearly Plans (2 months free)
- **Test Group A**: $79.99/year → Copy the price ID
- **Test Group B**: $99.99/year → Copy the price ID
- **Test Group C**: $119.99/year → Copy the price ID

### 3. Configure Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Click **Configure portal**
3. Enable these features:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoices
   - ✅ Download invoices
   - ✅ Update billing address
   - ✅ Apply promotion codes

4. Set cancellation policy:
   - Immediate cancellation: ❌ (keep access until end of period)
   - Prorate final invoice: ✅

5. Products section:
   - ✅ Allow switching plans
   - Add all 6 price IDs (3 monthly + 3 yearly)

6. Save configuration

### 4. Create Promotional Coupons

Go to **Products** → **Coupons** and create:

#### Welcome Offer (Auto-applied to new users)
```
ID: WELCOME50
Name: Welcome - 50% off first month
Type: Percentage discount
Percentage off: 50%
Duration: Once
```

#### Win-back Offer (Auto-applied to returning users)
```
ID: COMEBACK30
Name: Come Back - 30% off for 3 months
Type: Percentage discount
Percentage off: 30%
Duration: Repeating
Duration in months: 3
```

#### Seasonal Offers
```
ID: NEWYEAR25
Name: New Year Special - 25% off
Type: Percentage discount
Percentage off: 25%
Duration: Once
Redeem by: January 31st

ID: SUMMER20
Name: Summer Sale - 20% off
Type: Percentage discount
Percentage off: 20%
Duration: Once
Redeem by: August 31st
```

### 5. Set Up Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Endpoint URL: `https://naturinex-app-zsga.onrender.com/webhook`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. Copy the **Signing secret** (starts with `whsec_`)

### 6. Update Environment Variables

Update your server `.env` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_... (already set)
STRIPE_WEBHOOK_SECRET=whsec_... (from step 5)

# A/B Test Price IDs (from step 2)
STRIPE_PRICE_MONTHLY_799=price_...
STRIPE_PRICE_YEARLY_7999=price_...
STRIPE_PRICE_MONTHLY_999=price_...
STRIPE_PRICE_YEARLY_9999=price_...
STRIPE_PRICE_MONTHLY_1199=price_...
STRIPE_PRICE_YEARLY_11999=price_...
```

### 7. Configure Subscription Settings

1. Go to **Settings** → **Subscriptions and emails**
2. Set default trial period: 7 days
3. Configure emails:
   - ✅ Send receipts for successful payments
   - ✅ Send receipts for refunds
   - ✅ Email customers about expiring cards

## Testing Your Setup

### 1. Test Customer Portal
- Subscribe a test user
- Click "Manage Subscription" in the app
- Should open Stripe portal with options to:
  - Cancel subscription
  - Update payment method
  - Download invoices
  - Switch between monthly/yearly

### 2. Test A/B Pricing
- Create 3 test accounts
- Each should see different prices
- Verify pricing tracking in Firestore

### 3. Test Promotional Codes
- New user: Should see WELCOME50 auto-applied
- Manual entry: Try entering SUMMER20
- Invalid code: Should show error

### 4. Test Free Trial
- Subscribe to any plan
- Check Stripe dashboard shows "Trialing" status
- Verify trial_end date is 7 days out

## Subscription Management Options

### In Stripe Dashboard
Users can access the customer portal to:
1. **Cancel subscription** - Keeps access until period ends
2. **Update payment method** - Change or add cards
3. **Download invoices** - For tax purposes
4. **Apply promo codes** - Enter discount codes
5. **Switch plans** - Between monthly/yearly

### In Your App
The "Manage Subscription" button opens the Stripe portal where users can:
- View current plan details
- See next billing date
- Update billing information
- Cancel with one click
- Download receipts

## URL Configuration

The Stripe customer portal uses your configured URLs:
- **Success URL**: `https://naturinex-app.web.app/success`
- **Cancel URL**: `https://naturinex-app.web.app/subscription`
- **Portal Return URL**: `https://naturinex-app.web.app/profile`

If you're using a custom domain:
1. Update these URLs in your server code
2. Update Stripe webhook endpoint
3. Add domain to Stripe settings

## Revenue Optimization Timeline

### Week 1: Launch A/B Test
- Enable all 3 price points
- Track views and conversions
- Monitor by pricing group

### Week 2: Analyze Results
- Check conversion rates by price
- Calculate revenue per user
- Identify winning price

### Week 3: Add Free Trial
- Enable 7-day trial
- Track trial-to-paid conversion
- Send reminder emails

### Week 4: Promotional Campaigns
- Launch WELCOME50 for new users
- Test seasonal offers
- Track discount impact

## Monitoring & Analytics

### Key Metrics to Track
1. **Conversion by Price**: Which price converts best?
2. **Trial Conversion**: What % pay after trial?
3. **Churn by Price**: Do cheaper plans retain?
4. **Promo Code ROI**: Are discounts profitable?

### Firestore Collections
- `users`: Subscription status, customer ID
- `pricingAnalytics`: A/B test events
- `subscriptions`: Detailed subscription data

## Common Issues & Solutions

### Portal Not Loading
- Verify `stripeCustomerId` is saved in Firestore
- Check authentication token is valid
- Ensure webhook is updating customer ID

### Wrong Prices Shown
- Verify price IDs in `.env` match Stripe
- Check `getUserPricingGroup` logic
- Clear app cache and retry

### Promo Code Not Working
- Check coupon is active in Stripe
- Verify coupon ID matches exactly
- Check redemption limits

## Security Best Practices

1. **Never expose secret keys** in client code
2. **Verify webhooks** with signing secret
3. **Authenticate all API calls** to subscription endpoints
4. **Use HTTPS** for all communications
5. **Store minimal data** - let Stripe handle sensitive info

## Next Steps

1. **Complete Stripe setup** using this guide
2. **Test with Stripe test mode** first
3. **Deploy server changes** with new endpoints
4. **Monitor A/B test results** for 2 weeks
5. **Optimize based on data**