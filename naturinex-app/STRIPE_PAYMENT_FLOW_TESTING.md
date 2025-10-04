# 🧪 STRIPE PAYMENT FLOW - COMPLETE TESTING GUIDE

**Date:** 2025-10-04
**Status:** ✅ READY FOR TESTING
**Purpose:** Verify end-to-end Stripe payment integration

---

## 📋 PRE-TESTING CHECKLIST

### ✅ Code Verification
- [x] pricing.js has actual Stripe Price IDs
- [x] WebSubscription.js displays 3 tiers (FREE, PLUS, PRO)
- [x] WebSubscription.js passes tier, priceId, billingCycle via URL
- [x] WebPayment.js reads URL parameters correctly
- [x] WebPayment.js displays correct pricing from config
- [x] Payment form includes CardElement from Stripe Elements

### 🔑 Stripe Dashboard Verification (REQUIRED)
- [ ] Stripe account is in **Test Mode** (top right toggle)
- [ ] Products exist with correct Price IDs:
  - **Naturinex Plus Monthly:** `price_1RpEeKIwUuNq64Np0VUrD3jm` = $6.99
  - **Naturinex Plus Yearly:** `price_1RpEeKIwUuNq64Np0VUrD3jm` = $69.99
  - **Naturinex Pro Monthly:** `price_1RpEcUIwUuNq64Np4KLl689G` = $12.99
  - **Naturinex Pro Yearly:** `price_1RpEeqIwUuNq64NpPculkKkA` = $129.99
- [ ] Webhook endpoint configured at: `https://your-api.onrender.com/api/webhooks/stripe`
- [ ] Webhook events selected:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 🔐 Environment Variables (Backend)
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🧭 COMPLETE USER FLOW MAP

### Flow 1: Plus Monthly Subscription
```
1. User visits /subscription
   ↓
2. Billing toggle set to "Monthly"
   ↓
3. User clicks "Upgrade to Plus" button
   ↓
4. Navigate to: /payment?tier=PLUS&priceId=price_1RpEeKIwUuNq64Np0VUrD3jm&billingCycle=monthly
   ↓
5. Payment page displays:
   - Plan name: "Naturinex Plus"
   - Price: "$6.99/month"
   - Billing cycle: "Monthly" chip
   - Benefits: 100 scans, 1 year history, AI insights, export
   ↓
6. User enters:
   - Name
   - Email
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVC: Any 3 digits
   ↓
7. Click "Subscribe for $6.99/month"
   ↓
8. Frontend sends to backend API:
   POST /api/create-payment-intent
   {
     "priceId": "price_1RpEeKIwUuNq64Np0VUrD3jm",
     "email": "user@example.com",
     "name": "John Doe",
     "tier": "plus",
     "billingCycle": "monthly"
   }
   ↓
9. Backend creates Stripe checkout session
   ↓
10. Stripe processes payment
   ↓
11. Success! Frontend updates Firestore:
   users/{uid}/subscriptionType = "plus"
   users/{uid}/billingCycle = "monthly"
   users/{uid}/stripeCustomerId = "cus_..."
   users/{uid}/stripeSubscriptionId = "sub_..."
   ↓
12. Redirect to /dashboard
```

### Flow 2: Pro Yearly Subscription
```
1. User visits /subscription
   ↓
2. Billing toggle set to "Yearly" (shows "Save 17%" chip)
   ↓
3. User clicks "Upgrade to Pro" button
   ↓
4. Navigate to: /payment?tier=PRO&priceId=price_1RpEeqIwUuNq64NpPculkKkA&billingCycle=yearly
   ↓
5. Payment page displays:
   - Plan name: "Naturinex Pro"
   - Price: "$129.99/year"
   - Savings: "Save $26.89/year" chip
   - Benefits: Unlimited scans, permanent storage, consultations, family sharing
   ↓
6. (Same payment process as Flow 1)
   ↓
7. Firestore updated with:
   subscriptionType = "pro"
   billingCycle = "yearly"
```

---

## 🧪 TEST SCENARIOS

### Test 1: Plus Monthly - Successful Payment
**URL:** `/payment?tier=PLUS&priceId=price_1RpEeKIwUuNq64Np0VUrD3jm&billingCycle=monthly`

**Expected Display:**
- Plan name: "Naturinex Plus"
- Price: "$6.99/month"
- Billing chip: "Monthly"

**Test Card:** `4242 4242 4242 4242`

**Expected Result:**
✅ Payment succeeds
✅ Firestore updates with `subscriptionType: 'plus'`
✅ Redirects to `/dashboard`
✅ Success message: "Payment successful! Redirecting to dashboard..."

**Verification:**
```bash
# Check Firestore
users/{uid}/subscriptionType === 'plus'
users/{uid}/billingCycle === 'monthly'
users/{uid}/stripeCustomerId exists
users/{uid}/stripeSubscriptionId exists
```

---

### Test 2: Pro Yearly - Successful Payment
**URL:** `/payment?tier=PRO&priceId=price_1RpEeqIwUuNq64NpPculkKkA&billingCycle=yearly`

**Expected Display:**
- Plan name: "Naturinex Pro"
- Price: "$129.99/year"
- Billing chip: "Yearly"
- Savings chip: "Save $26.89/year"

**Test Card:** `4242 4242 4242 4242`

**Expected Result:**
✅ Payment succeeds
✅ Firestore updates with `subscriptionType: 'pro'`, `billingCycle: 'yearly'`

---

### Test 3: Declined Payment
**URL:** `/payment?tier=PLUS&priceId=price_1RpEeKIwUuNq64Np0VUrD3jm&billingCycle=monthly`

**Test Card:** `4000 0000 0000 0002` (Decline)

**Expected Result:**
❌ Payment fails
❌ Error alert displays: "Your card was declined."
❌ Firestore NOT updated
❌ User remains on payment page

---

### Test 4: 3D Secure Authentication
**URL:** `/payment?tier=PLUS&priceId=price_1RpEeKIwUuNq64Np0VUrD3jm&billingCycle=monthly`

**Test Card:** `4000 0025 0000 3155`

**Expected Result:**
✅ 3D Secure modal appears
✅ User completes authentication
✅ Payment succeeds after auth
✅ Firestore updated

---

### Test 5: Missing URL Parameters
**URL:** `/payment` (no params)

**Expected Result:**
⚠️ Immediately redirects to `/subscription`
⚠️ No payment form shown

---

### Test 6: Invalid Tier
**URL:** `/payment?tier=INVALID&priceId=price_xxx&billingCycle=monthly`

**Expected Result:**
⚠️ Shows loading spinner
⚠️ Redirects to `/subscription` (tier data not found)

---

### Test 7: Network Error
**Scenario:** Backend API is down

**Expected Result:**
❌ Error alert: "Payment service is temporarily unavailable. Please try again later or contact support at guampaul@gmail.com"
❌ User can retry

---

### Test 8: Toggle Billing Cycle on Subscription Page
**Steps:**
1. Visit `/subscription`
2. Toggle to "Yearly"
3. Verify PLUS shows: "$69.99/year" with "Save $13.89/year"
4. Verify PRO shows: "$129.99/year" with "Save $26.89/year"
5. Click "Upgrade to Plus"
6. Verify URL has: `billingCycle=yearly`
7. Verify payment page shows yearly pricing

---

## 🔍 VERIFICATION POINTS

### Frontend Verification (WebPayment.js)

**URL Parameter Reading:**
```javascript
const searchParams = new URLSearchParams(location.search);
const tier = searchParams.get('tier');           // Should be 'PLUS' or 'PRO'
const priceId = searchParams.get('priceId');     // Should be 'price_1Rp...'
const billingCycle = searchParams.get('billingCycle'); // 'monthly' or 'yearly'
```

**Expected Console Output:**
```
Tier: PLUS
Price ID: price_1RpEeKIwUuNq64Np0VUrD3jm
Billing Cycle: monthly
Tier Data: { name: 'Naturinex Plus', price: { monthly: 6.99, yearly: 69.99 }, ... }
```

**Plan Summary Display:**
- [ ] Tier name displays correctly
- [ ] Price matches billing cycle selection
- [ ] Benefits list shows tier-specific features
- [ ] "Change Plan" button navigates back to `/subscription`

---

### Backend Verification (API Endpoint)

**Endpoint:** `POST /api/create-payment-intent`

**Expected Request Body:**
```json
{
  "priceId": "price_1RpEeKIwUuNq64Np0VUrD3jm",
  "email": "user@example.com",
  "name": "John Doe",
  "tier": "plus",
  "billingCycle": "monthly"
}
```

**Expected Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "customerId": "cus_xxx",
  "subscriptionId": "sub_xxx"
}
```

**Backend Should:**
- [ ] Create or retrieve Stripe customer by email
- [ ] Create Stripe subscription with correct Price ID
- [ ] Return client secret for payment confirmation
- [ ] Return customer ID and subscription ID

---

### Firestore Verification

**Expected Document Structure:**
```javascript
users/{uid} {
  email: "user@example.com",
  subscriptionType: "plus",           // or "pro"
  billingCycle: "monthly",            // or "yearly"
  subscriptionStartDate: "2025-10-04T...",
  stripeCustomerId: "cus_xxx",
  stripeSubscriptionId: "sub_xxx",
  lastUpdated: Timestamp
}
```

**Verification Queries:**
```javascript
// Check subscription type
const userDoc = await getDoc(doc(db, 'users', uid));
console.log('Subscription:', userDoc.data().subscriptionType); // Should be 'plus' or 'pro'

// Check billing cycle
console.log('Billing:', userDoc.data().billingCycle); // Should be 'monthly' or 'yearly'
```

---

### Stripe Dashboard Verification

**After Test Payment:**
1. Go to Stripe Dashboard → Payments
2. Find latest payment
3. Verify:
   - [ ] Amount: $6.99 (PLUS monthly) or $12.99 (PRO monthly) or $69.99/$129.99 (yearly)
   - [ ] Status: Succeeded
   - [ ] Customer email matches test user
   - [ ] Subscription created
   - [ ] Price ID matches: `price_1Rp...`

4. Go to Customers
5. Find customer by email
6. Verify:
   - [ ] Active subscription exists
   - [ ] Subscription plan matches selected tier
   - [ ] Next billing date is set correctly

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue 1: "Stripe is not defined"
**Cause:** Stripe Elements not loaded
**Solution:** Check `STRIPE_PUBLISHABLE_KEY` in webConfig.js
**Fix:**
```javascript
// webConfig.js
STRIPE_PUBLISHABLE_KEY: 'pk_test_...' // Must be set
```

---

### Issue 2: Payment Intent Creation Fails
**Cause:** Backend can't find Price ID in Stripe
**Solution:** Verify Price IDs exist in Stripe Dashboard
**Check:**
```bash
# In Stripe Dashboard → Products → Select Product → Pricing
# Verify Price ID exactly matches: price_1RpEeKIwUuNq64Np0VUrD3jm
```

---

### Issue 3: Firestore Not Updating
**Cause:** Webhook not firing or user UID mismatch
**Solution:**
1. Check webhook is configured
2. Verify webhook secret matches
3. Check backend logs for webhook events
4. Ensure `user.uid` matches Firestore document ID

---

### Issue 4: Wrong Price Displayed
**Cause:** Billing cycle not passed correctly
**Solution:** Verify URL has `billingCycle` parameter
**Debug:**
```javascript
console.log(location.search);
// Should be: ?tier=PLUS&priceId=price_1Rp...&billingCycle=monthly
```

---

### Issue 5: Redirect Loop to /subscription
**Cause:** URL parameters missing or invalid tier
**Solution:** Check WebSubscription.js `handleUpgrade` function passes all params
**Expected URL:**
```
/payment?tier=PLUS&priceId=price_1RpEeKIwUuNq64Np0VUrD3jm&billingCycle=monthly
```

---

## 📊 TEST RESULTS TEMPLATE

### Test Session: [Date]
**Tester:** [Name]
**Environment:** Test Mode / Production

| Test # | Scenario | Tier | Billing | Test Card | Expected | Actual | Status | Notes |
|--------|----------|------|---------|-----------|----------|--------|--------|-------|
| 1 | Success | PLUS | Monthly | 4242... | ✅ Success | | ⬜ | |
| 2 | Success | PLUS | Yearly | 4242... | ✅ Success | | ⬜ | |
| 3 | Success | PRO | Monthly | 4242... | ✅ Success | | ⬜ | |
| 4 | Success | PRO | Yearly | 4242... | ✅ Success | | ⬜ | |
| 5 | Decline | PLUS | Monthly | 0002 | ❌ Error shown | | ⬜ | |
| 6 | 3D Secure | PLUS | Monthly | 3155 | ✅ Auth + Success | | ⬜ | |
| 7 | Missing params | - | - | - | ↩️ Redirect | | ⬜ | |
| 8 | Toggle billing | - | Both | - | 💲 Price updates | | ⬜ | |

---

## 🚀 PRODUCTION CHECKLIST

**Before Going Live:**
- [ ] Switch Stripe to **Live Mode**
- [ ] Update `STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
- [ ] Update `STRIPE_SECRET_KEY` to `sk_live_...`
- [ ] Recreate products in Live Mode with same Price IDs (or update code)
- [ ] Configure webhook in Live Mode with `whsec_live_...`
- [ ] Test with real card (small amount)
- [ ] Verify live webhook fires correctly
- [ ] Update pricing.js with live Price IDs if different
- [ ] Remove test mode alerts from WebPayment.js
- [ ] Enable error monitoring (Sentry, etc.)

---

## 📞 SUPPORT CONTACTS

**Payment Issues:**
- Support Email: `guampaul@gmail.com`
- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Support: https://support.stripe.com

**Test Cards Reference:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`
- More: https://stripe.com/docs/testing

---

## ✅ SIGN-OFF

**Code Ready:** ✅
**Stripe Products Created:** ⬜ (Verify in Dashboard)
**Webhooks Configured:** ⬜ (Verify in Dashboard)
**Test Payments Passed:** ⬜ (Complete test scenarios above)

**Production Ready:** ⬜

---

**Document Version:** 1.0
**Last Updated:** 2025-10-04
**Next Review:** Before production deployment
