# 🔗 Stripe Webhook Setup & Testing

## Current Status
✅ Webhook endpoint is active at `/webhook`
✅ Signature verification is working
✅ Server is running and healthy

## Setup Instructions

### 1. Create Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://naturinex-app-zsga.onrender.com/webhook`
4. Select events to listen to:
   - `checkout.session.completed` ✅ (Most important)
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**

### 2. Get Your Webhook Secret

1. After creating the endpoint, click on it
2. Click **"Reveal"** under Signing secret
3. Copy the secret (starts with `whsec_`)

### 3. Update Render Environment

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your service
3. Go to **Environment** tab
4. Update or add:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_... (your actual secret)
   ```
5. Save changes

## Testing the Webhook

### Method 1: Stripe Dashboard Test (Easiest)

1. In Stripe Dashboard, go to your webhook endpoint
2. Click **"Send test webhook"**
3. Select `checkout.session.completed`
4. Click **"Send test webhook"**
5. Check the response - should be 200 OK

### Method 2: Stripe CLI (Recommended for Development)

```bash
# Install Stripe CLI
# Download from: https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Listen and forward
stripe listen --forward-to https://naturinex-app-zsga.onrender.com/webhook

# In another terminal, trigger events
stripe trigger checkout.session.completed
```

### Method 3: Manual Test with Curl

```bash
# This will fail with "Invalid webhook signature" - that's expected!
# It confirms the endpoint exists and verification is active
curl -X POST https://naturinex-app-zsga.onrender.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

## What Happens When Webhook Works

When a successful `checkout.session.completed` event is received:

1. Server logs: "✅ Checkout session completed for customer: [email]"
2. Updates Firebase with:
   - User's subscription status → 'premium'
   - Stripe customer ID
   - Stripe subscription ID
   - Subscription dates
3. Returns 200 OK to Stripe

## Troubleshooting

### "Invalid webhook signature"
- Wrong webhook secret in Render
- Using test secret with live endpoint or vice versa
- Make sure you're using the secret from the same webhook endpoint

### "Cannot POST /webhook"
- Server isn't running - check Render logs
- Wrong URL - make sure it's exactly `/webhook`

### No Firebase updates
- Check Firebase Admin SDK initialization
- Verify user exists in Firebase with matching email
- Check Render logs for Firebase errors

### Test Not Working?
1. Check Render logs during webhook send
2. Ensure `STRIPE_WEBHOOK_SECRET` matches exactly
3. Try both `/webhook` and `/webhooks/stripe` endpoints
4. Make sure you're in test mode in Stripe

## Live Mode

When ready for production:
1. Create a live webhook endpoint in Stripe
2. Use live webhook secret in production environment
3. Test with real payment to verify