# 🧪 Stripe Webhook Testing Guide

## Overview

The Stripe webhook handler in `stripeWebhook.ts` securely processes payment events:
- ✅ Verifies webhook signatures using `stripe.webhooks.constructEvent`
- ✅ Handles `checkout.session.completed` for successful payments
- ✅ Handles `invoice.payment_failed` for failed payments
- ✅ Returns 200 OK for valid events, 400 for verification failures
- ✅ Logs all session data on payment success

## Security Features

1. **Signature Verification**: Every webhook request is verified using the Stripe signature
2. **Raw Body Parsing**: The webhook endpoint uses raw body parsing to ensure signature verification works
3. **Environment Variables**: Secrets are loaded from `.env` using dotenv
4. **Error Handling**: Comprehensive error handling with detailed logging

## Testing Methods

### Method 1: Stripe CLI (Recommended)

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop install stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local endpoint**:
   ```bash
   stripe listen --forward-to http://localhost:5001/naturinex-app/us-central1/api/stripe-webhook
   ```
   This will show your webhook signing secret - copy it to your `.env` file!

4. **Trigger test events**:
   ```bash
   # Test successful payment
   stripe trigger checkout.session.completed

   # Test failed payment
   stripe trigger invoice.payment_failed
   ```

### Method 2: Manual Testing with cURL

Use the provided test script:
```bash
cd functions/src
chmod +x webhookTest.sh
./webhookTest.sh
```

### Method 3: Stripe Dashboard Testing

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event type and send

## Event Flow

### Successful Payment (checkout.session.completed):
1. Customer completes checkout
2. Stripe sends webhook event
3. Handler verifies signature
4. Extracts userId from metadata
5. Updates user to premium status in Firestore
6. Logs payment in payments collection
7. Creates success notification

### Failed Payment (invoice.payment_failed):
1. Subscription renewal fails
2. Stripe sends webhook event
3. Handler verifies signature
4. Finds user by customer ID
5. Logs failed payment
6. Creates failure notification
7. Optionally adds grace period flag

## Debugging Tips

### Check Logs:
```bash
# Local logs
firebase functions:log

# Or in your terminal when running emulators
```

### Common Issues:

1. **"No stripe-signature header present"**
   - Ensure you're sending the `stripe-signature` header
   - Check that the webhook URL is correct

2. **"Webhook signature verification failed"**
   - Verify `STRIPE_WEBHOOK_SECRET` in `.env` matches your endpoint secret
   - Ensure raw body parsing is enabled (already configured)
   - Check that you're using the correct environment (test vs live)

3. **"No userId found in session metadata"**
   - Ensure checkout session includes metadata with userId
   - Check the create-checkout-session endpoint

### Verify Environment:
```javascript
// Add this temporarily to debug
console.log('Webhook Secret exists:', !!process.env.STRIPE_WEBHOOK_SECRET);
console.log('Stripe Key exists:', !!process.env.STRIPE_SECRET_KEY);
```

## Production Deployment

1. **Set Firebase config**:
   ```bash
   firebase functions:config:set \
     stripe.secret_key="sk_live_..." \
     stripe.webhook_secret="whsec_..."
   ```

2. **Update code to use Firebase config** (optional):
   ```typescript
   const functions = require('firebase-functions');
   const endpointSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Configure webhook in Stripe Dashboard**:
   - Endpoint URL: `https://us-central1-naturinex-app.cloudfunctions.net/api/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.payment_failed`
     - (optional) `customer.subscription.*`

## Monitoring

### Stripe Dashboard:
- View webhook attempts: [Webhooks > Logs](https://dashboard.stripe.com/webhooks/logs)
- Check event details and response codes
- Retry failed webhooks if needed

### Firebase Console:
- View function logs: [Firebase Console > Functions](https://console.firebase.google.com)
- Monitor function health and errors
- Set up alerts for failures

## Security Best Practices

1. **Always verify signatures** - Never skip signature verification
2. **Use environment variables** - Never hardcode secrets
3. **Return 200 quickly** - Acknowledge receipt even if processing fails
4. **Idempotency** - Handle duplicate events gracefully
5. **Monitor webhook health** - Set up alerts for failures
6. **Rotate secrets periodically** - Update webhook signing secrets

The webhook handler is now fully configured and ready for secure payment processing! 🚀