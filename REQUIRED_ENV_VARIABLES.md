# REQUIRED Environment Variables for Initial Deployment

## 🔴 BACKEND (Render) - Add these to Render Dashboard

```bash
# REQUIRED - Core Functionality
GEMINI_API_KEY=your_actual_gemini_api_key_here
# Get from: https://makersuite.google.com/app/apikey

STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
# Get from: https://dashboard.stripe.com/apikeys

STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
# Get from: https://dashboard.stripe.com/webhooks (after creating webhook)

NODE_ENV=production

PORT=5000

# OPTIONAL - But Recommended
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_actual_private_key_here\n-----END PRIVATE KEY-----"
# Without Firebase, user data won't persist

RESEND_API_KEY=re_your_resend_api_key
# Without this, email features won't work (but app still functions)
```

## 🔵 FRONTEND (Vercel) - Add these to Vercel Dashboard

```bash
# REQUIRED - Must have these
REACT_APP_API_URL=https://naturinex-server.onrender.com
# Your actual Render backend URL (get after deploying to Render)

# Stripe Public Key (for frontend)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
# Get from: https://dashboard.stripe.com/apikeys

# OPTIONAL - Frontend specific
REACT_APP_VERSION=2.0.0
REACT_APP_NAME=Naturinex
NODE_ENV=production
```

## 📝 Stripe Configuration Details

### What you need in Stripe Dashboard:

1. **API Keys** (Dashboard → Developers → API keys):
   - Secret key: `sk_live_...` (for backend)
   - Publishable key: `pk_live_...` (for frontend)

2. **Webhook Endpoint** (Dashboard → Developers → Webhooks):
   - Add endpoint: `https://naturinex-server.onrender.com/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`
   - Copy signing secret: `whsec_...`

3. **Products & Prices** (Dashboard → Products):
   
   **Subscription Tiers** (Create these products):
   ```
   BASIC Plan
   - Price: $4.99/month
   - Price ID: price_xxxxx (you'll get this after creating)
   
   PRO Plan  
   - Price: $9.99/month
   - Price ID: price_xxxxx
   
   FAMILY Plan
   - Price: $24.99/month
   - Price ID: price_xxxxx
   
   ENTERPRISE Plan
   - Price: $299.99/month
   - Price ID: price_xxxxx
   ```

   **Credit Packages** (One-time payments):
   ```
   Starter Pack
   - Price: $2.99 (one-time)
   - Price ID: price_xxxxx
   
   Value Pack
   - Price: $11.99 (one-time)
   - Price ID: price_xxxxx
   
   Bulk Pack
   - Price: $39.99 (one-time)
   - Price ID: price_xxxxx
   ```

## 🚀 Deployment Order

### Step 1: Deploy Backend to Render
1. Connect GitHub repo to Render
2. Set build command: `cd server && npm install`
3. Set start command: `cd server && npm start`
4. Add environment variables above
5. Deploy and get URL: `https://naturinex-server.onrender.com`

### Step 2: Deploy Frontend to Vercel
1. Import GitHub repo to Vercel
2. Add environment variables above
3. Use the Render URL from Step 1 for `REACT_APP_API_URL`
4. Deploy

### Step 3: Configure Stripe Webhook
1. Go to Stripe Dashboard
2. Add webhook endpoint with your Render URL
3. Get webhook secret
4. Update Render environment variable with webhook secret

## ⚠️ Critical Notes

1. **Stripe Pricing**: The credit packages and subscription tiers are **hardcoded** in `server/modules/tierSystem.js`, so you don't need Stripe Price IDs unless you want to use Stripe's pricing table.

2. **Firebase**: Without Firebase credentials, these features won't work:
   - User profiles persistence
   - Medication history
   - Gamification progress
   - But the app will still run!

3. **API URLs**: 
   - Backend URL must NOT have trailing slash
   - Example: ✅ `https://naturinex-server.onrender.com`
   - Not: ❌ `https://naturinex-server.onrender.com/`

## 🎯 Absolute Minimum to Launch

If you want the bare minimum to get started:

**Backend (Render):**
```
GEMINI_API_KEY=your_key
NODE_ENV=production
```

**Frontend (Vercel):**
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

But you won't have payments, data persistence, or email features.

## 💰 Total Initial Costs

- **Gemini AI**: Free (60 requests/min)
- **Stripe**: Free (2.9% + 30¢ per transaction)
- **Render**: $7/month (Starter) or $25/month (better performance)
- **Vercel**: Free (100GB bandwidth)
- **Firebase**: Free tier
- **Resend**: $20/month (optional)

**Minimum monthly cost**: $7 (just Render)
**Recommended**: $27/month (Render + Resend)