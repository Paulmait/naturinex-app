# Critical Fixes Required for Production

## 1. Firebase Service Account Key (URGENT)
You need to generate and add a Firebase service account key:

1. Go to [Firebase Console](https://console.firebase.google.com/project/naturinex-app/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json` in the `server` directory
4. Add to `.gitignore` to prevent committing secrets

## 2. Update Server Environment Variables
Update `/server/.env` with production values:

```env
# Production Stripe Keys (from your Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# Firebase Admin SDK Path
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

## 3. Deploy Server to Render
Your server needs to be redeployed with correct environment variables:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Add these environment variables:
   - `GEMINI_API_KEY`
   - `STRIPE_SECRET_KEY` (live key)
   - `STRIPE_WEBHOOK_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT` (paste entire JSON content)

## 4. Verify API Endpoints
After deployment, test these endpoints:
- GET `https://naturinex-app-zsga.onrender.com/api/health`
- POST `https://naturinex-app-zsga.onrender.com/api/analyze`

## Action Items:
- [ ] Generate Firebase service account key
- [ ] Update server .env with production keys
- [ ] Set Render environment variables
- [ ] Redeploy server
- [ ] Test API endpoints
- [ ] Verify Stripe webhooks are working