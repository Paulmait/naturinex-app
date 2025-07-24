# 🎯 Smart Coupon Strategy Implementation

## ❌ Why NOT to Use Manual Coupon Entry

**Conversion Rate Impact:**
- Manual coupon entry reduces conversions by 15-30%
- Users abandon checkout to search for codes
- Creates "coupon hunting" behavior
- Feels like they're missing out if they don't have a code

## ✅ Recommended Approach: Automatic & Contextual Discounts

### 1. **LAUNCH20 - Automatic for First 30 Days**
```javascript
// In your checkout handler
const isLaunchPeriod = () => {
  const launchDate = new Date('2025-08-01');
  const now = new Date();
  const daysSinceLaunch = Math.floor((now - launchDate) / (1000 * 60 * 60 * 24));
  return daysSinceLaunch >= 0 && daysSinceLaunch < 30;
};

// Automatically apply for annual plans during launch
if (isLaunchPeriod() && billingCycle === 'yearly') {
  sessionParams.discounts = [{ coupon: 'LAUNCH20' }];
  // Show banner: "Launch Special Applied: 20% OFF!"
}
```

### 2. **WELCOME50 - First-Time User Detection**
```javascript
// Check if user has never subscribed before
const isFirstTimeUser = !user.hasHadSubscription;

if (isFirstTimeUser && billingCycle === 'monthly') {
  sessionParams.discounts = [{ coupon: 'WELCOME50' }];
  // Show banner: "Welcome Offer: 50% off first 3 months!"
}
```

### 3. **FRIEND15 - Referral Links**
```javascript
// From referral link: app.naturinex.com/pricing?ref=ABC123
const referralCode = getQueryParam('ref');

if (referralCode) {
  sessionParams.discounts = [{ coupon: 'FRIEND15' }];
  sessionParams.metadata.referralCode = referralCode;
  // Show banner: "Friend Discount Applied: 15% OFF Forever!"
}
```

### 4. **WINBACK50 - Email Campaign Links**
```javascript
// From win-back email: app.naturinex.com/pricing?offer=comeback
const offer = getQueryParam('offer');

if (offer === 'comeback' && user.previouslySubscribed) {
  sessionParams.discounts = [{ coupon: 'WINBACK50' }];
  // Show banner: "Welcome Back! 50% off for 3 months"
}
```

## 📱 Updated Mobile Implementation

```javascript
// Enhanced createCheckoutSession in your API
export async function createCheckoutSession(req: Request, res: Response) {
  const { userId, userEmail, plan, billingCycle, source } = req.body;
  
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    customer_email: userEmail,
    subscription_data: { trial_period_days: 7 },
    metadata: { userId, plan, billingCycle, source }
  };

  // Smart discount application
  const discount = await determineDiscount(userId, billingCycle, source);
  if (discount) {
    sessionParams.discounts = [{ coupon: discount.couponId }];
    
    // Return discount info to show in app
    return res.json({
      url: session.url,
      sessionId: session.id,
      appliedDiscount: {
        name: discount.name,
        description: discount.description,
        amountOff: discount.amountOff
      }
    });
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  res.json({ url: session.url, sessionId: session.id });
}

async function determineDiscount(userId: string, billingCycle: string, source: any) {
  // Launch period check
  if (isLaunchPeriod() && billingCycle === 'yearly') {
    return {
      couponId: 'LAUNCH20',
      name: 'Launch Special',
      description: '20% off your first year',
      amountOff: '20%'
    };
  }

  // First-time user check
  const user = await getUser(userId);
  if (!user.hasHadSubscription && billingCycle === 'monthly') {
    return {
      couponId: 'WELCOME50',
      name: 'Welcome Offer',
      description: '50% off first 3 months',
      amountOff: '50%'
    };
  }

  // Referral check
  if (source?.referralCode) {
    return {
      couponId: 'FRIEND15',
      name: 'Friend Discount',
      description: '15% off forever',
      amountOff: '15%'
    };
  }

  // Win-back check
  if (source?.campaign === 'winback' && user.previouslySubscribed) {
    return {
      couponId: 'WINBACK50',
      name: 'Welcome Back',
      description: '50% off for 3 months',
      amountOff: '50%'
    };
  }

  return null;
}
```

## 🎨 UI/UX Best Practices

### Show Applied Discounts Prominently:
```
┌─────────────────────────────────────────┐
│  🎉 Launch Special Applied!             │
│     20% OFF your first year             │
│                                         │
│  Premium Annual Plan                    │
│  Regular: $139.99/year                  │
│  You pay: $111.99/year                  │
│  You save: $27.99                       │
│                                         │
│  [Continue to Checkout →]               │
└─────────────────────────────────────────┘
```

### Optional: Subtle Promo Code Field
If you must include manual entry, make it subtle:
```
┌─────────────────────────────────────────┐
│  Have a promo code? [________] Apply    │
└─────────────────────────────────────────┘
```

## 📊 Implementation Priority

1. **Week 1-4**: Auto-apply LAUNCH20 for annual plans
2. **Always**: Auto-apply WELCOME50 for new users
3. **When Ready**: Implement referral system with FRIEND15
4. **Month 3+**: Run win-back campaigns with WINBACK50

## 🚀 Marketing Channel Strategy

### 1. **Launch Announcement Email**
Subject: "Naturinex is Live! Get 20% Off Annual Plans"
- Link: `app.naturinex.com/pricing?utm_source=launch`
- Auto-applies LAUNCH20

### 2. **Social Media**
"Start your health journey with 50% off your first 3 months!"
- Link: `app.naturinex.com/pricing?utm_source=social`
- Auto-applies WELCOME50 for new users

### 3. **Referral Program Page**
"Share Naturinex, Get 15% Off Forever"
- Unique links: `app.naturinex.com/pricing?ref=USER123`
- Both referrer and referee get FRIEND15

### 4. **Win-Back Email (Month 3+)**
"We miss you! Come back for 50% off"
- Link: `app.naturinex.com/pricing?offer=comeback`
- Auto-applies WINBACK50

## ✅ Benefits of This Approach

1. **Higher Conversion**: No friction from code hunting
2. **Better Tracking**: Know exactly which campaign works
3. **Personalization**: Right offer for right user
4. **Urgency**: "Applied automatically" feels exclusive
5. **No Discount Abuse**: Controlled distribution

## 🎯 Key Metrics to Track

- Conversion rate by discount type
- Average order value with/without discount
- Customer lifetime value by acquisition discount
- Referral program virality coefficient

This approach maximizes conversions while maintaining pricing integrity!