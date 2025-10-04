# 🔔 STRIPE WEBHOOK TESTING GUIDE

**Webhook URL:** `https://api.naturinex.com/functions/v1/stripe-webhook`
**Status:** ✅ UPDATED WITH ACTUAL PRICE IDs
**Date:** 2025-10-04

---

## 📋 WEBHOOK CONFIGURATION CHECKLIST

### ✅ Code Updates Completed
- [x] Updated webhook Price ID mapping (lines 81-88, 116-121)
- [x] Replaced environment variables with actual Price IDs:
  - `price_1RpEeKIwUuNq64Np0VUrD3jm` → PLUS (monthly & yearly)
  - `price_1RpEcUIwUuNq64Np4KLl689G` → PRO monthly
  - `price_1RpEeqIwUuNq64NpPculkKkA` → PRO yearly

### 🔧 Stripe Dashboard Setup Required

#### 1. Configure Webhook Endpoint
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter URL: `https://api.naturinex.com/functions/v1/stripe-webhook`
4. Select events to send:
   ```
   ✅ checkout.session.completed
   ✅ customer.created
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ```
5. Click **"Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_`)

#### 2. Set Environment Variable in Supabase
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions
2. Add environment variable:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (from step 1.6 above)
3. Restart Supabase Edge Functions

#### 3. Verify Other Environment Variables
Ensure these are set in Supabase:
```bash
STRIPE_SECRET_KEY=sk_test_...         # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...       # Webhook signing secret
SUPABASE_URL=https://....supabase.co  # Your Supabase URL
SUPABASE_SERVICE_ROLE_KEY=...         # Service role key for admin access
```

---

## 🧪 TESTING THE WEBHOOK

### Method 1: Use Stripe CLI (Recommended)

#### Install Stripe CLI
```bash
# Windows (via Scoop)
scoop install stripe

# Mac (via Homebrew)
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

#### Forward Webhooks Locally
```bash
# Login to Stripe
stripe login

# Forward webhooks to your endpoint
stripe listen --forward-to https://api.naturinex.com/functions/v1/stripe-webhook

# This will output a webhook signing secret - add it to Supabase env
```

#### Trigger Test Events
```bash
# Test checkout.session.completed with PLUS monthly
stripe trigger checkout.session.completed \
  --add checkout_session:mode=subscription \
  --add checkout_session:subscription=sub_test123 \
  --add checkout_session:customer=cus_test123

# Test subscription.created
stripe trigger customer.subscription.created

# Test payment succeeded
stripe trigger invoice.payment_succeeded
```

---

### Method 2: Use Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select event type: `checkout.session.completed`
5. Customize the JSON to include your Price IDs:
   ```json
   {
     "id": "evt_test123",
     "type": "checkout.session.completed",
     "data": {
       "object": {
         "id": "cs_test_123",
         "mode": "subscription",
         "customer": "cus_test123",
         "subscription": "sub_test123",
         "metadata": {
           "user_id": "YOUR_TEST_USER_UID"
         }
       }
     }
   }
   ```
6. Click **"Send test webhook"**
7. Check response - should be `200 OK`

---

### Method 3: Real Test Payment

#### Using the Test HTML Page
1. Open `test-stripe-payment.html` in your browser
2. Select billing cycle (Monthly/Yearly)
3. Choose tier (PLUS or PRO)
4. Click "Test Payment"
5. You'll be redirected to your payment page
6. Use test card: `4242 4242 4242 4242`
7. Complete payment
8. Webhook should fire automatically

#### Expected Webhook Flow:
```
1. User completes payment on Stripe Checkout
   ↓
2. Stripe sends webhook: checkout.session.completed
   URL: https://api.naturinex.com/functions/v1/stripe-webhook
   ↓
3. Webhook verifies signature (using STRIPE_WEBHOOK_SECRET)
   ↓
4. Webhook extracts subscription data
   ↓
5. Webhook determines tier based on Price ID:
   - price_1RpEeKIwUuNq64Np0VUrD3jm → 'plus'
   - price_1RpEcUIwUuNq64Np4KLl689G → 'pro'
   - price_1RpEeqIwUuNq64NpPculkKkA → 'pro'
   ↓
6. Webhook updates Supabase profiles table:
   {
     stripe_customer_id: "cus_...",
     stripe_subscription_id: "sub_...",
     subscription_tier: "plus" | "pro",
     subscription_status: "active",
     subscription_expires_at: "2025-11-04T..."
   }
   ↓
7. Webhook logs event to subscription_events table
   ↓
8. Webhook responds: 200 OK
```

---

## 🔍 VERIFICATION STEPS

### 1. Check Webhook Delivery in Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. View recent deliveries
4. Check for:
   - ✅ Response code: **200**
   - ✅ Response body: `{"received":true,"type":"checkout.session.completed"}`
   - ❌ Response code: **400** = Error (check logs)
   - ❌ Response code: **403** = Signature verification failed

### 2. Check Supabase Profiles Table

```sql
-- In Supabase SQL Editor
SELECT
  user_id,
  email,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_tier,
  subscription_status,
  subscription_expires_at
FROM profiles
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

Expected result after successful payment:
```
user_id: "abc123..."
stripe_customer_id: "cus_..."
stripe_subscription_id: "sub_..."
subscription_tier: "plus"  (or "pro")
subscription_status: "active"
subscription_expires_at: "2025-11-04T..."
```

### 3. Check Subscription Events Log

```sql
-- In Supabase SQL Editor
SELECT
  event_type,
  to_tier,
  to_status,
  stripe_event_id,
  stripe_subscription_id,
  metadata,
  created_at
FROM subscription_events
ORDER BY created_at DESC
LIMIT 10;
```

Expected events:
- `checkout.session.completed` with `to_tier: "plus"` or `to_tier: "pro"`
- `customer.subscription.created` with subscription details

### 4. Check Supabase Function Logs

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/functions/stripe-webhook/logs
2. Look for recent invocations
3. Check for errors or success messages
4. You should see:
   ```
   Processing webhook event: checkout.session.completed
   ```

---

## 🐛 TROUBLESHOOTING

### Issue 1: Webhook Returns 403 Forbidden
**Cause:** Signature verification failed

**Solutions:**
1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly in Supabase
2. Check that the webhook secret matches Stripe Dashboard
3. Ensure you're using the **test mode** webhook secret (starts with `whsec_test_`)

**Debug:**
```bash
# Check Supabase environment variables
curl https://api.naturinex.com/functions/v1/stripe-webhook/env
```

---

### Issue 2: Webhook Returns 400 Bad Request
**Cause:** Error processing webhook event

**Solutions:**
1. Check Supabase function logs for error details
2. Verify Price ID mapping is correct
3. Check that Supabase tables exist:
   - `profiles` table with columns: stripe_customer_id, subscription_tier, etc.
   - `subscription_events` table

**Debug:**
```javascript
// Add logging to webhook function
console.log('Price ID:', priceId);
console.log('Determined tier:', tier);
console.log('Updating profile for customer:', customerId);
```

---

### Issue 3: Tier Not Set Correctly
**Cause:** Price ID not recognized

**Current Price ID Mapping:**
```javascript
if (priceId === 'price_1RpEeKIwUuNq64Np0VUrD3jm') {
  tier = 'plus'  // Both monthly & yearly
} else if (priceId === 'price_1RpEcUIwUuNq64Np4KLl689G' ||
           priceId === 'price_1RpEeqIwUuNq64NpPculkKkA') {
  tier = 'pro'   // Monthly & yearly
}
```

**Verify:**
1. Go to Stripe Dashboard → Products
2. Check each product's Price IDs
3. Ensure they match exactly (case-sensitive)

---

### Issue 4: Profile Not Updating
**Cause:** Customer ID mismatch or profile doesn't exist

**Solutions:**
1. Check that customer was created in `customer.created` event
2. Verify profile exists in Supabase with matching email
3. Check that `stripe_customer_id` is set

**Debug SQL:**
```sql
-- Find profile by email
SELECT * FROM profiles WHERE email = 'test@example.com';

-- Find profile by Stripe customer ID
SELECT * FROM profiles WHERE stripe_customer_id = 'cus_...';
```

---

## 📊 EXPECTED WEBHOOK EVENTS FOR A NEW SUBSCRIPTION

### Event Sequence:
1. **customer.created** (if new customer)
   - Creates profile with stripe_customer_id

2. **checkout.session.completed**
   - Updates profile with subscription_tier, subscription_id

3. **customer.subscription.created**
   - Confirms subscription is active
   - Logs subscription event

4. **invoice.payment_succeeded**
   - Confirms first payment succeeded
   - Sets subscription_status to 'active'

### Monthly Subscription Renewal:
1. **invoice.payment_succeeded**
   - Confirms monthly payment succeeded

2. **customer.subscription.updated**
   - Updates subscription_expires_at to next month

### Subscription Cancellation:
1. **customer.subscription.deleted**
   - Sets subscription_tier to 'free'
   - Sets subscription_status to 'canceled'
   - Logs cancellation event

---

## 🧪 TEST SCENARIOS

### Scenario 1: New User - PLUS Monthly
**Steps:**
1. User signs up (creates account)
2. User clicks "Upgrade to Plus" → Monthly
3. User completes Stripe checkout with test card

**Expected Webhooks:**
- `customer.created`
- `checkout.session.completed`
- `customer.subscription.created`
- `invoice.payment_succeeded`

**Expected Database State:**
```javascript
profiles: {
  subscription_tier: 'plus',
  subscription_status: 'active',
  stripe_subscription_id: 'sub_...',
  subscription_expires_at: '2025-11-04' // 1 month from now
}
```

---

### Scenario 2: Existing User - PRO Yearly
**Steps:**
1. User already has PLUS subscription
2. User upgrades to PRO → Yearly
3. Completes payment

**Expected Webhooks:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `invoice.payment_succeeded`

**Expected Database State:**
```javascript
profiles: {
  subscription_tier: 'pro',  // Changed from 'plus'
  subscription_status: 'active',
  subscription_expires_at: '2026-10-04' // 1 year from now
}
```

---

### Scenario 3: Payment Fails
**Steps:**
1. User enters declined test card: `4000 0000 0000 0002`
2. Payment fails

**Expected Webhooks:**
- `invoice.payment_failed`

**Expected Database State:**
```javascript
profiles: {
  subscription_status: 'past_due',
  // subscription_tier remains unchanged
}
```

---

### Scenario 4: User Cancels Subscription
**Steps:**
1. User clicks "Cancel Subscription"
2. Cancellation confirmed in Stripe

**Expected Webhooks:**
- `customer.subscription.deleted`

**Expected Database State:**
```javascript
profiles: {
  subscription_tier: 'free',  // Downgraded
  subscription_status: 'canceled',
  subscription_expires_at: '2025-10-04' // Current date
}
```

---

## ✅ DEPLOYMENT CHECKLIST

### Before Testing:
- [x] Updated webhook code with actual Price IDs
- [ ] Deployed webhook to Supabase Edge Functions
- [ ] Configured webhook endpoint in Stripe Dashboard
- [ ] Set STRIPE_WEBHOOK_SECRET environment variable
- [ ] Verified Supabase tables exist (profiles, subscription_events)

### Deployment Command:
```bash
# Deploy webhook function to Supabase
supabase functions deploy stripe-webhook

# Or using Supabase CLI
npx supabase functions deploy stripe-webhook
```

### Test Webhook:
```bash
# Send test event from Stripe CLI
stripe trigger checkout.session.completed

# Or use Stripe Dashboard → Webhooks → Send test webhook
```

---

## 🚀 PRODUCTION READINESS

### Move to Production:
1. Switch Stripe to **Live Mode**
2. Create webhook endpoint in **Live Mode**
3. Update `STRIPE_WEBHOOK_SECRET` with live secret
4. Update `STRIPE_SECRET_KEY` to `sk_live_...`
5. Test with real card (refund immediately)
6. Monitor webhook deliveries for 24 hours

### Monitoring:
- Set up alerts for failed webhooks (>5% failure rate)
- Monitor Supabase function errors
- Check subscription_events table daily for anomalies

---

## 📞 SUPPORT

**Webhook Issues:**
- Supabase Function Logs: https://supabase.com/dashboard
- Stripe Webhook Logs: https://dashboard.stripe.com/webhooks

**Price ID Reference:**
```
PLUS Monthly:  price_1RpEeKIwUuNq64Np0VUrD3jm
PLUS Yearly:   price_1RpEeKIwUuNq64Np0VUrD3jm
PRO Monthly:   price_1RpEcUIwUuNq64Np4KLl689G
PRO Yearly:    price_1RpEeqIwUuNq64NpPculkKkA
```

**Contact:**
- Email: guampaul@gmail.com
- Stripe Support: https://support.stripe.com

---

**Document Version:** 1.0
**Last Updated:** 2025-10-04
**Status:** ✅ Ready for Testing
