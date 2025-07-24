# 🚀 Firebase Functions Setup Instructions

## Prerequisites
- Node.js 18+
- Firebase CLI installed (`npm install -g firebase-tools`)
- Stripe account with API keys

## Quick Setup

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Configure Stripe Keys
1. Copy `.env.example` to `.env`
2. Add your Stripe keys:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Copy your **Secret Key** → `STRIPE_SECRET_KEY`
   - Create webhook endpoint → Copy **Webhook Secret** → `STRIPE_WEBHOOK_SECRET`
   - Your publishable key is already in the file

### 3. Build TypeScript
```bash
npm run build
```

### 4. Test Locally
```bash
# Start Firebase emulators
npm run serve

# In another terminal, test the health endpoint
curl http://localhost:5001/naturinex-app/us-central1/api/health
```

## Stripe Webhook Setup

### For Local Development:
1. Install Stripe CLI
2. Run: `stripe listen --forward-to http://localhost:5001/naturinex-app/us-central1/api/stripe-webhook`
3. Copy the webhook signing secret to your `.env`

### For Production:
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://us-central1-naturinex-app.cloudfunctions.net/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret

## Deployment

### First Time Setup:
```bash
# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init

# Select:
# - Functions
# - Use existing project
# - TypeScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### Deploy Functions:
```bash
# Set production secrets
firebase functions:config:set \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..."

# Deploy
cd functions
npm run deploy
```

## Testing Stripe Integration

### Test Card Numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

### Test Checkout:
```javascript
// POST to /api/create-checkout-session
{
  "userId": "test123",
  "userEmail": "test@example.com",
  "plan": "premium",
  "billingCycle": "monthly",
  "amount": 1499,
  "planName": "Premium - Monthly"
}
```

## Common Issues

### 1. "Cannot find module" errors
- Run `npm install` in functions directory
- Run `npm run build` to compile TypeScript

### 2. Webhook signature verification failed
- Ensure you're using the correct webhook secret
- Check that raw body parsing is enabled for webhook endpoint

### 3. CORS errors
- The API is configured to allow all origins
- For production, update CORS settings in `index.ts`

### 4. Functions not deploying
- Check Node.js version (must be 18)
- Run `firebase --version` (should be latest)
- Try `firebase functions:delete api` then redeploy

## Monitoring

### View Logs:
```bash
firebase functions:log
```

### View Specific Function Logs:
```bash
firebase functions:log --only api
```

### Monitor Stripe Events:
- Check [Stripe Dashboard > Events](https://dashboard.stripe.com/events)
- Verify webhook delivery status

## Security Checklist

- [ ] Never commit `.env` file
- [ ] Use `firebase functions:config` for production
- [ ] Verify webhook signatures
- [ ] Restrict CORS in production
- [ ] Set up Firestore security rules
- [ ] Monitor for suspicious activity

Ready to process payments! 🎉