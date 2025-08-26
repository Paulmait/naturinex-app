# Render Deployment Complete Guide

## 1. Environment Variables Required

Add these in Render Dashboard → Environment tab:

### Critical Variables (MUST HAVE)
```
GEMINI_API_KEY=your_gemini_api_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Additional Variables
```
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://naturinex.com,https://www.naturinex.com,exp://
```

### Firebase Variables (Optional for full webhook support)
```
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key_here
```

## 2. Update Render Settings

1. Go to Settings → Start Command
2. Change to: `cd server && node index.js`

## 3. Enable Stripe Test Mode for Beta

In your Stripe Dashboard:
1. Toggle to "Test mode" (top right)
2. Create test products/prices
3. Use test API keys (sk_test_...)

## 4. Get Your API Keys

### Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy and add to Render

### Stripe Test Keys
1. Visit: https://dashboard.stripe.com/test/apikeys
2. Copy Secret key (sk_test_...)
3. For webhook secret, create webhook endpoint first

## 5. Create Stripe Webhook
1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://naturinex-api.onrender.com/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy signing secret (whsec_...)

## 6. Deploy Command

After adding all environment variables:
1. Click "Manual Deploy" → "Deploy latest commit"
2. Watch logs for "Server is running on port 10000"

## 7. Verify Deployment

Test your API:
```bash
curl https://naturinex-api.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T...",
  "environment": "production"
}
```

## 8. Update App Configuration

In your app's `app.json` or environment config:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://naturinex-api.onrender.com"
    }
  }
}
```

## Beta Testing Notes

- All Stripe transactions in test mode are free
- Beta testers won't be charged real money
- Use promo codes: BETA2024, NATURINEXBETA
- Webhook will handle auto-refunds if configured