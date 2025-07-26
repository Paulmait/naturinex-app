# 💰 Pricing Optimization & Discount Setup

## Current Status
- **Monthly**: $9.99
- **Yearly**: $99.99 (17% discount)
- **No free trial**
- **No A/B testing**
- **No limited-time offers**

## Implementation Guide

### 1. A/B Pricing Test (Stripe Implementation)

**Step 1: Create Multiple Price Points in Stripe**
```bash
# In Stripe Dashboard:
1. Go to Products > Your Product
2. Add new prices:
   - price_monthly_799: $7.99/month (Test Group A)
   - price_monthly_999: $9.99/month (Test Group B)
   - price_monthly_1199: $11.99/month (Test Group C)
```

**Step 2: Server Implementation**
```javascript
// server/pricing/abTesting.js
const pricingGroups = {
  A: { 
    monthly: 'price_1234_799', 
    yearly: 'price_1234_7999',
    display: '$7.99'
  },
  B: { 
    monthly: 'price_1234_999', 
    yearly: 'price_1234_9999',
    display: '$9.99'
  },
  C: { 
    monthly: 'price_1234_1199', 
    yearly: 'price_1234_11999',
    display: '$11.99'
  }
};

function getUserPricingGroup(userId) {
  // Consistent assignment based on user ID
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const groups = ['A', 'B', 'C'];
  return groups[hash % groups.length];
}
```

### 2. Free Trial Setup

**Stripe Configuration:**
1. Go to Products > Subscription settings
2. Set trial period: 7 days
3. Update your price IDs with trial

**Server Update:**
```javascript
const session = await stripe.checkout.sessions.create({
  // ... existing config
  subscription_data: {
    trial_period_days: 7,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel'
      }
    }
  }
});
```

### 3. Limited-Time Offers

**Create Stripe Coupons:**
```javascript
// One-time setup
const coupon = await stripe.coupons.create({
  id: 'WELCOME50',
  percent_off: 50,
  duration: 'once',
  max_redemptions: 1000,
  redeem_by: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
});

const coupon2 = await stripe.coupons.create({
  id: 'FIRST3MONTHS30',
  percent_off: 30,
  duration: 'repeating',
  duration_in_months: 3
});
```

### 4. Implementation Code

**Update SubscriptionScreen.js:**
```javascript
const [pricingGroup, setPricingGroup] = useState(null);
const [hasDiscount, setHasDiscount] = useState(false);
const [discountCode, setDiscountCode] = useState('');

useEffect(() => {
  checkEligibility();
}, []);

const checkEligibility = async () => {
  const userId = auth.currentUser?.uid;
  
  // Check if new user (registered in last 7 days)
  const userDoc = await getDoc(doc(db, 'users', userId));
  const createdAt = userDoc.data()?.metadata?.createdAt?.toDate();
  const daysSinceSignup = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  
  if (daysSinceSignup < 7) {
    setHasDiscount(true);
    setDiscountCode('WELCOME50');
  }
  
  // Get A/B test group
  const group = await fetch(`${API_URL}/api/pricing/group/${userId}`);
  setPricingGroup(group);
};
```

### 5. Feature Gates Implementation

**Already Implemented ✅**
- Share/Download buttons visible but show upgrade prompt
- Scan history shows "Premium Feature" message
- Limited scans for free users

**Additional Gates to Add:**
```javascript
// Show premium features with blur effect
<View style={isPremium ? {} : styles.blurredContent}>
  <Text>Premium Wellness Insights</Text>
  {!isPremium && (
    <TouchableOpacity style={styles.unlockOverlay}>
      <MaterialIcons name="lock" size={32} />
      <Text>Unlock with Premium</Text>
    </TouchableOpacity>
  )}
</View>
```

## Stripe Dashboard Updates Required

### 1. Create Test Prices
- Login to Stripe Dashboard
- Products > Your Product > Add Price
- Create 3 monthly prices: $7.99, $9.99, $11.99
- Create 3 yearly prices: $79.99, $99.99, $119.99

### 2. Create Promotional Coupons
- Products > Coupons > Create
- WELCOME50: 50% off first month
- NEWYEAR25: 25% off (seasonal)
- FRIEND20: 20% off (referral)

### 3. Configure Customer Portal
- Settings > Billing > Customer portal
- Enable "Apply promotion codes"
- Enable "Switch plans"

### 4. Set Up Webhooks for Trials
Add these events:
- `customer.subscription.trial_will_end` (3 days before)
- `customer.subscription.updated` (track conversions)

## Revenue Tracking

### Track Conversion by Price Point:
```javascript
// Analytics to implement
const trackConversion = {
  pricePoint: '$9.99',
  hadTrial: true,
  hadDiscount: false,
  dayToConvert: 3,
  source: 'scan_limit_reached'
};
```

### Monitor Key Metrics:
1. **Conversion Rate by Price**: Which price converts best?
2. **Trial to Paid**: What % convert after trial?
3. **Discount Usage**: ROI on promotional offers
4. **Churn by Price**: Do cheaper plans churn more?

## Testing Strategy

### Week 1-2: Baseline
- Current $9.99 pricing
- No trial
- Track conversion rate

### Week 3-4: Free Trial
- Add 7-day trial
- Same $9.99 price
- Compare conversion

### Week 5-8: A/B Price Test
- 33% users: $7.99
- 33% users: $9.99  
- 33% users: $11.99
- Find optimal price

### Week 9+: Optimize
- Use winning price
- Test discount offers
- Seasonal promotions

## Expected Results

Based on industry standards:
- **Free Trial**: +30% conversion rate
- **A/B Testing**: Find 15-20% revenue increase
- **Limited Offers**: +25% first-week conversions
- **Annual Discount**: 20% choose annual (higher LTV)

## Important Notes

1. **Legal Compliance**: 
   - Show prices clearly before checkout
   - Honor existing subscriptions at old prices
   - Clear trial terms

2. **User Experience**:
   - Don't change prices for existing users
   - Clear value proposition for each tier
   - Easy cancellation (already implemented)

3. **Technical Setup**:
   - Use Stripe Test Mode first
   - Monitor webhook failures
   - Track everything in analytics