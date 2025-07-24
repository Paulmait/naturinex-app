# 🎯 Stripe Dashboard Action Items

## 📋 Immediate Actions Required

### 1. Create New Annual Prices in Stripe
Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)

#### For Basic Plan:
- Find the "Basic" product (or create if doesn't exist)
- Add new price: **$79.99/year** (recurring)
- Enable 7-day free trial
- Note the new price ID

#### For Premium Plan:
- Find the "Premium" product (or create if doesn't exist)
- Add new price: **$139.99/year** (recurring)
- Enable 7-day free trial
- Note the new price ID

#### For Professional Plan:
- Find the "Professional" product (or create if doesn't exist)
- Add new price: **$359.99/year** (recurring)
- Enable 7-day free trial
- Note the new price ID

### 2. Create Promotional Coupons
Go to [Stripe Dashboard > Coupons](https://dashboard.stripe.com/coupons)

Create these coupons exactly as named:

1. **LAUNCH20**
   - 20% off
   - Duration: Once
   - Max redemptions: 100 (optional limit)

2. **WELCOME50**
   - 50% off
   - Duration: Repeating
   - Duration in months: 3
   
3. **FRIEND15**
   - 15% off
   - Duration: Forever
   
4. **WINBACK50**
   - 50% off
   - Duration: Repeating
   - Duration in months: 3

### 3. Configure Customer Portal
Go to [Stripe Dashboard > Settings > Customer Portal](https://dashboard.stripe.com/settings/billing/portal)

Enable:
- ✅ Customers can cancel subscriptions
- ✅ Customers can switch plans
- ✅ Customers can update payment methods
- ✅ Customers can view billing history

### 4. Update Your .env File
Once you've created the new annual prices, update:

```env
# Replace these with your actual new price IDs
STRIPE_PRICE_BASIC_YEARLY=price_[YOUR_NEW_BASIC_ANNUAL_ID]
STRIPE_PRICE_PREMIUM_YEARLY=price_[YOUR_NEW_PREMIUM_ANNUAL_ID]
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_[YOUR_NEW_PROFESSIONAL_ANNUAL_ID]
```

### 5. Archive Old Annual Prices
- Archive the old $399.99 prices so they're not used
- Keep them available for existing subscribers

## 🚀 Launch Checklist

- [ ] Created new annual prices ($79.99, $139.99, $359.99)
- [ ] Created all 4 promotional coupons
- [ ] Updated .env with new price IDs
- [ ] Configured customer portal settings
- [ ] Rebuilt and deployed functions
- [ ] Tested checkout flow with free trial
- [ ] Tested promo code application
- [ ] Set up webhook monitoring

## 📊 Metrics to Monitor Post-Launch

1. **Conversion Metrics**
   - Free trial sign-up rate
   - Trial-to-paid conversion rate
   - Monthly vs Annual split

2. **Revenue Metrics**
   - Average Revenue Per User (ARPU)
   - Monthly Recurring Revenue (MRR)
   - Customer Lifetime Value (LTV)

3. **Retention Metrics**
   - Churn rate by plan
   - Churn rate: monthly vs annual
   - Reactivation rate from win-back campaigns

## 💡 Pro Tips

1. **Grandfather Existing Users**: Keep anyone on the old $399.99 plan at that price
2. **Email Campaign**: Send launch announcement with LAUNCH20 code
3. **In-App Messaging**: Show "LIMITED TIME" banner for first 30 days
4. **A/B Testing**: Test "Most Popular" badge placement
5. **Referral Launch**: Announce referral program 2 weeks after launch

## 🎉 Expected Results

With this pricing structure, you should see:
- **30-40% of users choosing annual** (up from <10%)
- **60-70% selecting Premium plan** (sweet spot pricing)
- **20-30% higher LTV** due to annual commits
- **Lower CAC** due to referral program

Remember: Pricing is iterative. Monitor your metrics and adjust as needed!