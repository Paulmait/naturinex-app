# Complete Environment Variables for Vercel Deployment

## Copy and paste these into Vercel Dashboard → Settings → Environment Variables

### 🔴 REQUIRED (App won't work without these)

```bash
# Gemini AI API Key (for medication analysis)
GEMINI_API_KEY=AIzaSyANSnF-XXXXXXXXXXXXXXXXXXXXXXXXXX
# Get from: https://makersuite.google.com/app/apikey

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
# Get from: https://dashboard.stripe.com/apikeys

# Stripe Webhook Secret (for payment confirmations)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXX
# Get from: https://dashboard.stripe.com/webhooks (after creating webhook)

# Backend API URL (Your Render deployment)
REACT_APP_API_URL=https://naturinex-server.onrender.com
# Or your custom backend URL

# Node Environment
NODE_ENV=production
```

### 🟡 HIGHLY RECOMMENDED (For full features)

```bash
# Email Service (Resend) - For medication reminders, reports
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXX
# Get from: https://resend.com/api-keys
# Cost: $20/month for 10,000 emails

# Google Cloud Vision API - For pill identification
GOOGLE_VISION_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# Get from: https://console.cloud.google.com/apis/credentials
# Enable: Cloud Vision API in Google Console

# Firebase Admin SDK (For user data persistence)
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXXXXXXXXXXXXXXXXXXXXXXX\n-----END PRIVATE KEY-----"
# Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
```

### 🟢 OPTIONAL (For enhanced features)

```bash
# Pharmacy Price Comparison APIs
GOODRX_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXX
# Get from: https://developer.goodrx.com

SINGLECARE_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXX  
# Get from: https://developer.singlecare.com

RXSAVER_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXX
# Get from: https://developer.rxsaver.com

# Analytics & Monitoring
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# Get from: https://analytics.google.com

SENTRY_DSN=https://xxxxxxxxxx@sentry.io/xxxxxxx
# Get from: https://sentry.io (for error tracking)

# Push Notifications
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# Get from: https://onesignal.com

# FDA API (For drug database)
FDA_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXX
# Get from: https://open.fda.gov/apis/authentication/
```

### 🔧 Build Configuration (Usually auto-configured)

```bash
# Build settings
CI=false
SKIP_PREFLIGHT_CHECK=true
GENERATE_SOURCEMAP=false

# React App Configuration
REACT_APP_VERSION=2.0.0
REACT_APP_NAME=Naturinex
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
```

## How to Add in Vercel

1. Go to your Vercel Dashboard
2. Select your `naturinex-app` project
3. Navigate to **Settings** → **Environment Variables**
4. For each variable:
   - Enter the **Key** (e.g., `GEMINI_API_KEY`)
   - Enter the **Value** (your actual API key)
   - Select **Production**, **Preview**, and **Development** checkboxes
   - Click **Save**

## Priority Order

1. **First Deploy** (Minimum to get started):
   - `GEMINI_API_KEY`
   - `REACT_APP_API_URL`
   - `NODE_ENV`

2. **Enable Payments**:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY`

3. **Enable Email**:
   - `RESEND_API_KEY`

4. **Enable Advanced Features**:
   - `GOOGLE_VISION_API_KEY`
   - Firebase credentials

## Security Notes

⚠️ **NEVER commit these to Git**
⚠️ **Keep production keys separate from test keys**
⚠️ **Rotate keys regularly (every 90 days)**
⚠️ **Use Vercel's environment variable encryption**

## Testing Your Configuration

After adding environment variables, test each service:

```bash
# Test AI Service
curl https://naturinex.com/api/health

# Test Stripe
curl https://naturinex.com/api/subscriptions/tiers

# Test Email (if configured)
curl -X POST https://naturinex.com/api/email/welcome \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","email":"test@test.com","name":"Test"}'
```

## Troubleshooting

- **API calls failing**: Check `REACT_APP_API_URL` is correct
- **AI not working**: Verify `GEMINI_API_KEY` is valid
- **Payments failing**: Check Stripe keys and webhook secret
- **Emails not sending**: Verify `RESEND_API_KEY` and sender domain

## Current Service Costs

- **Gemini AI**: Free tier (60 requests/minute)
- **Stripe**: 2.9% + 30¢ per transaction
- **Resend Email**: $20/month for 10,000 emails
- **Google Vision**: $1.50 per 1000 images
- **Firebase**: Free tier (10GB storage, 50K reads/day)
- **Vercel Hosting**: Free tier (100GB bandwidth)
- **Render Backend**: $25/month (Starter plan)

**Total Monthly Cost**: ~$45/month for starter
**At 10K users**: ~$200/month