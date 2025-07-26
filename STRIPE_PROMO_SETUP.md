# 🎯 Stripe Promotional Offers Setup Guide

## Current Implementation Status ✅
- A/B pricing system implemented (3 groups: $7.99, $9.99, $11.99)
- Free trial support (7 days) added to checkout
- Promotional offer detection based on user behavior
- Promo code input in subscription screen
- Dynamic pricing display based on user group

## Required Stripe Dashboard Setup

### 1. Create Price IDs for A/B Testing
Login to Stripe Dashboard and create these prices:

#### Group A - Budget Pricing
- **Monthly**: $7.99/month → `price_monthly_799`
- **Yearly**: $79.99/year → `price_yearly_7999`

#### Group B - Standard Pricing  
- **Monthly**: $9.99/month → `price_monthly_999`
- **Yearly**: $99.99/year → `price_yearly_9999`

#### Group C - Premium Pricing
- **Monthly**: $11.99/month → `price_monthly_1199`
- **Yearly**: $119.99/year → `price_yearly_11999`

### 2. Create Promotional Coupons

Go to **Products → Coupons** and create:

#### New User Offer (Auto-applied)
```
Coupon ID: WELCOME50
Type: Percentage discount
Percentage off: 50%
Duration: Once
Max redemptions: Unlimited
Valid for: 30 days
```

#### Win-back Offer (Auto-applied)
```
Coupon ID: COMEBACK30
Type: Percentage discount  
Percentage off: 30%
Duration: Repeating (3 months)
Max redemptions: Unlimited
```

#### Seasonal Offers
```
Coupon ID: NEWYEAR25
Type: Percentage discount
Percentage off: 25%
Duration: Once
Valid: January only

Coupon ID: SUMMER20
Type: Percentage discount
Percentage off: 20%
Duration: Once
Valid: June-August
```

#### Referral & Partnership
```
Coupon ID: FRIEND20
Type: Percentage discount
Percentage off: 20%
Duration: Once

Coupon ID: STUDENT40
Type: Percentage discount
Percentage off: 40%
Duration: Repeating (12 months)
Requires email verification
```

### 3. Configure Subscription Settings

1. **Enable Free Trials**:
   - Go to Products → Your Product → Edit
   - Add default trial period: 7 days
   - Or handle programmatically (already implemented)

2. **Customer Portal Settings**:
   - Settings → Billing → Customer portal
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to view billing history
   - ✅ Allow promotion codes

### 4. Update Environment Variables

Add to your server `.env`:
```env
# A/B Test Price IDs
STRIPE_PRICE_MONTHLY_799=price_1ABC...
STRIPE_PRICE_YEARLY_7999=price_1DEF...
STRIPE_PRICE_MONTHLY_999=price_1GHI...
STRIPE_PRICE_YEARLY_9999=price_1JKL...
STRIPE_PRICE_MONTHLY_1199=price_1MNO...
STRIPE_PRICE_YEARLY_11999=price_1PQR...

# Webhook endpoint secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Set Up Webhooks

Add webhook endpoint: `https://your-server.com/stripe-webhook`

Required events:
- `checkout.session.completed` ✅ (already handled)
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Testing Your Setup

### 1. Test A/B Pricing
```javascript
// Different users should see different prices
// User1: $7.99/month
// User2: $9.99/month  
// User3: $11.99/month
```

### 2. Test Promotional Offers
```javascript
// New users (< 7 days old)
// Should see: "50% off your first month! Code: WELCOME50"

// Inactive users (> 30 days)
// Should see: "30% off for 3 months! Code: COMEBACK30"
```

### 3. Test Free Trial
- Subscribe to any plan
- Verify 7-day trial period in Stripe
- Check trial_end webhook fires 3 days before

### 4. Test Promo Codes
Enter these codes in the app:
- `WELCOME50` - 50% off first month
- `FRIEND20` - 20% off first month
- `INVALID` - Should show error

## Monitoring & Analytics

### Track Key Metrics
1. **Conversion by Price Point**
   ```sql
   SELECT 
     pricing_group,
     COUNT(*) as views,
     SUM(converted) as conversions,
     AVG(amount) as avg_revenue
   FROM pricing_analytics
   GROUP BY pricing_group
   ```

2. **Promo Code Usage**
   ```sql
   SELECT 
     promo_code,
     COUNT(*) as uses,
     SUM(discount_amount) as total_discount
   FROM subscriptions
   WHERE promo_code IS NOT NULL
   GROUP BY promo_code
   ```

3. **Trial Conversion Rate**
   ```sql
   SELECT 
     COUNT(*) as trials_started,
     SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as converted,
     AVG(CASE WHEN status = 'active' THEN 1 ELSE 0 END) * 100 as conversion_rate
   FROM subscriptions
   WHERE trial_end IS NOT NULL
   ```

## Revenue Optimization Timeline

### Week 1: Baseline
- Current pricing only ($9.99)
- Track conversion rate

### Week 2-3: A/B Test
- Enable all 3 price points
- Monitor conversion by group

### Week 4: Free Trial
- Add 7-day trial to winning price
- Track trial → paid conversion

### Week 5+: Promotions
- Enable auto-applied offers
- Test seasonal campaigns
- Optimize based on data

## Expected Results

Based on industry benchmarks:
- **A/B Testing**: 15-25% revenue increase
- **Free Trial**: 30-50% conversion boost  
- **Welcome Offer**: 40% higher first-week conversion
- **Win-back**: 20% reactivation rate

## Support & Troubleshooting

### Common Issues
1. **Promo code not working**: Check coupon validity in Stripe
2. **Wrong price shown**: Verify price IDs match
3. **Trial not starting**: Check subscription_data in checkout

### Testing Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`