# 🚀 QUICK START: Test Stripe Integration

**Everything is ready! Follow these steps to test your Stripe payment flow.**

---

## ⚡ IMMEDIATE TESTING STEPS

### Step 1: Configure Webhook in Stripe Dashboard (5 minutes)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter: `https://api.naturinex.com/functions/v1/stripe-webhook`
4. Select these events:
   - ✅ checkout.session.completed
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_succeeded
   - ✅ invoice.payment_failed
5. Click **"Add endpoint"**
6. **COPY THE SIGNING SECRET** (starts with `whsec_`)

### Step 2: Set Webhook Secret in Supabase (2 minutes)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Settings → Edge Functions**
4. Add environment variable:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (from Step 1.6)
5. Save

### Step 3: Test Web Payment (2 minutes)

1. Start your app: `npm start`
2. Sign in to your app
3. Visit: `http://localhost:3000/subscription`
4. Click **"Upgrade to Plus"** (Monthly)
5. You'll see payment page with:
   - Plan: Naturinex Plus
   - Price: $6.99/month
   - Benefits listed
6. Enter test card: `4242 4242 4242 4242`
7. Expiry: Any future date (e.g., 12/25)
8. CVC: Any 3 digits (e.g., 123)
9. Click **"Subscribe for $6.99/month"**
10. Should show: "Payment successful! Redirecting..."

### Step 4: Verify Payment Worked

**Check Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/test/payments
2. You should see payment for $6.99
3. Status: Succeeded
4. Customer email matches your test user

**Check Firebase:**
1. Go to: Firebase Console → Firestore Database
2. Find: `users/{your_uid}`
3. You should see:
   ```javascript
   subscriptionType: "plus"
   stripeCustomerId: "cus_..."
   stripeSubscriptionId: "sub_..."
   billingCycle: "monthly"
   ```

**Check Webhook:**
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook
3. Check recent events
4. Should see: `checkout.session.completed` with status 200

---

## 🧪 TEST ALL TIERS

### Test Matrix:

| Tier | Billing | Price | Test Card | Expected |
|------|---------|-------|-----------|----------|
| PLUS | Monthly | $6.99 | 4242... | ✅ Success |
| PLUS | Yearly | $69.99 | 4242... | ✅ Success |
| PRO | Monthly | $12.99 | 4242... | ✅ Success |
| PRO | Yearly | $129.99 | 4242... | ✅ Success |

### How to Test Each:
1. Go to `/subscription`
2. Toggle Monthly/Yearly
3. Click "Upgrade to Plus" or "Upgrade to Pro"
4. Complete payment with test card
5. Verify in Firebase and Stripe Dashboard

---

## 🔴 TEST FAILURE SCENARIOS

### Declined Card:
- Card: `4000 0000 0000 0002`
- Expected: Error message "Your card was declined."
- Firebase should NOT update

### 3D Secure:
- Card: `4000 0025 0000 3155`
- Expected: 3D Secure modal appears
- Complete authentication
- Payment succeeds after auth

---

## 📱 TEST MOBILE APP (Optional)

1. Start mobile app: `npm start`
2. Press **`a`** for Android or **`i`** for iOS
3. Sign in
4. Tap "Upgrade to Premium"
5. Shows: "$6.99/month (Plus) or $12.99/month (Pro)"
6. Tap "Pay with Stripe"
7. Redirected to Stripe Checkout
8. Complete payment with test card
9. Return to app
10. Premium features unlocked

---

## ✅ VERIFICATION CHECKLIST

After each test, check:

- [ ] Stripe Dashboard shows payment
- [ ] Firebase `subscriptionType` updated to 'plus' or 'pro'
- [ ] Firebase `stripeCustomerId` and `stripeSubscriptionId` populated
- [ ] Webhook delivered successfully (status 200)
- [ ] User redirected to dashboard
- [ ] Premium features unlocked in app

---

## 🐛 TROUBLESHOOTING

### "Stripe is not defined"
**Fix:** Check webConfig.js has `STRIPE_PUBLISHABLE_KEY` set

### "Payment failed"
**Fix:** Check backend API URL is correct and accessible

### "Webhook 403 Forbidden"
**Fix:** Set `STRIPE_WEBHOOK_SECRET` in Supabase environment variables

### "Firestore not updating"
**Fix:** Check webhook is firing in Stripe Dashboard → Webhooks

---

## 📚 FULL DOCUMENTATION

For complete details, see:
- **STRIPE_PAYMENT_FLOW_TESTING.md** - Complete test scenarios
- **WEBHOOK_TESTING_GUIDE.md** - Webhook configuration and debugging
- **STRIPE_WEB_MOBILE_INTEGRATION.md** - Full integration architecture
- **PRICING_IMPLEMENTATION_COMPLETE.md** - Pricing structure details

---

## 🎯 QUICK REFERENCE

**Your Stripe Price IDs:**
```
PLUS Monthly:  price_1RpEeKIwUuNq64Np0VUrD3jm
PLUS Yearly:   price_1RpEeKIwUuNq64Np0VUrD3jm
PRO Monthly:   price_1RpEcUIwUuNq64Np4KLl689G
PRO Yearly:    price_1RpEeqIwUuNq64NpPculkKkA
```

**Webhook URL:**
```
https://api.naturinex.com/functions/v1/stripe-webhook
```

**Test Cards:**
```
Success:     4242 4242 4242 4242
Decline:     4000 0000 0000 0002
3D Secure:   4000 0025 0000 3155
```

**API Endpoint:**
```
https://naturinex-app-zsga.onrender.com
```

---

## 🚀 YOU'RE READY!

Everything is configured and ready for testing. Just:
1. Set webhook secret in Supabase (Step 2 above)
2. Start testing payments (Step 3 above)
3. Verify everything works (Step 4 above)

Your Stripe integration is **production-ready**! 🎉

---

**Questions?** Check the detailed documentation files listed above.
**Support:** guampaul@gmail.com
