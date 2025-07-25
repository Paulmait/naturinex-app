# Testing Stripe Webhook

## Current Setup
- Webhook endpoints: `/webhook` and `/webhooks/stripe`
- Both endpoints use the same handler
- Requires `stripe-signature` header
- Uses `STRIPE_WEBHOOK_SECRET` for verification

## Test Steps

### 1. Local Test (Without Signature)
First, let's test if the endpoint is reachable:

```bash
curl -X POST https://naturinex-app-zsga.onrender.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Expected: Should return error about missing signature

### 2. Stripe CLI Test (Recommended)
Install Stripe CLI and forward webhooks:

```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to your server
stripe listen --forward-to https://naturinex-app-zsga.onrender.com/webhook

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
```

### 3. From Stripe Dashboard
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://naturinex-app-zsga.onrender.com/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret
5. Update in Render: `STRIPE_WEBHOOK_SECRET=whsec_...`

## What Should Happen

When a successful webhook is received:
1. Server logs: "✅ Checkout session completed"
2. User's subscription status updates in Firebase
3. Response: 200 OK

## Common Issues

1. **Signature verification failed**
   - Wrong webhook secret
   - Using test secret with live endpoint or vice versa

2. **Cannot POST /webhook**
   - Endpoint not found (check deployment)

3. **Firebase permission denied**
   - Firebase Admin SDK not properly initialized
   - Service account credentials missing