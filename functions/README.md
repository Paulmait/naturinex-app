# Naturinex Firebase Functions

This directory contains the Firebase Cloud Functions for the Naturinex app, handling Stripe payments and webhooks.

## Setup

1. **Install dependencies:**
   ```bash
   cd functions
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Stripe keys:
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `STRIPE_WEBHOOK_SECRET`: Your webhook endpoint secret from Stripe Dashboard
     - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

3. **Get Stripe webhook secret:**
   - Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
   - Create endpoint: `https://your-project.cloudfunctions.net/api/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.*`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook signing secret

## Development

### Local development with emulators:
```bash
npm run serve
```

### Build TypeScript:
```bash
npm run build
```

### Watch mode:
```bash
npm run build:watch
```

## Deployment

1. **Login to Firebase:**
   ```bash
   firebase login
   ```

2. **Select project:**
   ```bash
   firebase use naturinex-app
   ```

3. **Set environment variables in Firebase:**
   ```bash
   firebase functions:config:set stripe.secret_key="sk_live_..." stripe.webhook_secret="whsec_..."
   ```

4. **Deploy functions:**
   ```bash
   npm run deploy
   ```

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status

### Create Checkout Session
- **POST** `/api/create-checkout-session`
- Body:
  ```json
  {
    "userId": "user123",
    "userEmail": "user@example.com",
    "plan": "premium",
    "billingCycle": "monthly",
    "amount": 1499,
    "planName": "Premium - Monthly"
  }
  ```

### Get Stripe Config
- **GET** `/api/stripe-config`
- Returns public key for client

### Create Portal Session
- **POST** `/api/create-portal-session`
- Body:
  ```json
  {
    "customerId": "cus_..."
  }
  ```

### Cancel Subscription
- **POST** `/api/cancel-subscription`
- Body:
  ```json
  {
    "subscriptionId": "sub_..."
  }
  ```

### Stripe Webhook
- **POST** `/api/stripe-webhook`
- Handles Stripe events (signature verified)

## Scheduled Functions

### Check Subscriptions
- Runs daily at midnight
- Verifies subscription statuses
- Updates user premium status

## Security Notes

1. Never commit `.env` file
2. Use Firebase config for production secrets
3. Webhook endpoint verifies Stripe signatures
4. All endpoints use HTTPS in production
5. CORS is configured for your domains

## Testing Webhooks Locally

Use Stripe CLI:
```bash
stripe listen --forward-to http://localhost:5001/naturinex-app/us-central1/api/stripe-webhook
```

## Troubleshooting

1. **Webhook signature verification failed:**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure raw body parsing for webhook endpoint

2. **Functions not deploying:**
   - Run `npm run build` first
   - Check TypeScript errors
   - Verify Node.js version (18)

3. **Subscription not updating:**
   - Check Firestore permissions
   - Verify webhook events are configured
   - Check function logs: `firebase functions:log`