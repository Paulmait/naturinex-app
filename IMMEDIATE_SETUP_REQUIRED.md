# 🚨 IMMEDIATE SETUP REQUIRED FOR PRODUCTION

## Step 1: Firebase Service Account (5 minutes)

1. Open [Firebase Console](https://console.firebase.google.com/project/naturinex-app/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Save the downloaded JSON file as `firebase-service-account.json` in `/server` directory
4. Extract these values from the JSON and add to `/server/.env`:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `project_id` → `FIREBASE_PROJECT_ID`

## Step 2: Stripe Live Keys (5 minutes)

1. Open [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Live Secret Key** (starts with `sk_live_`)
3. Update `/server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_[YOUR_ACTUAL_KEY]
   ```

## Step 3: Stripe Webhook Secret (5 minutes)

1. Open [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Copy the **Signing secret** (starts with `whsec_`)
4. Update `/server/.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_[YOUR_ACTUAL_SECRET]
   ```

## Step 4: Stripe Price ID (2 minutes)

1. Open [Stripe Products](https://dashboard.stripe.com/products)
2. Find your "Premium Subscription" product
3. Copy the **Price ID** (starts with `price_`)
4. Update `/server/.env`:
   ```
   STRIPE_PREMIUM_PRICE_ID=price_[YOUR_ACTUAL_PRICE_ID]
   ```

## Step 5: Update Render Environment Variables (10 minutes)

1. Open [Render Dashboard](https://dashboard.render.com)
2. Select your `naturinex-app` service
3. Go to **Environment** tab
4. Add/Update these variables:
   
   | Key | Value |
   |-----|-------|
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `STRIPE_SECRET_KEY` | sk_live_... (from Step 2) |
   | `STRIPE_WEBHOOK_SECRET` | whsec_... (from Step 3) |
   | `STRIPE_PREMIUM_PRICE_ID` | price_... (from Step 4) |
   | `FIREBASE_PROJECT_ID` | naturinex-app |
   | `FIREBASE_CLIENT_EMAIL` | From service account JSON |
   | `FIREBASE_PRIVATE_KEY` | From service account JSON (entire key including BEGIN/END) |

5. Click **Save Changes**
6. Service will auto-redeploy (takes 5-10 minutes)

## Step 6: Verify Deployment (2 minutes)

After Render finishes deploying, test:

```bash
# Test health endpoint
curl https://naturinex-app-zsga.onrender.com/api/health

# Should return: {"status":"healthy","timestamp":"..."}
```

## ⚠️ CRITICAL NOTES:

1. **NEVER commit** the `firebase-service-account.json` file
2. **NEVER commit** your `.env` file with real keys
3. Keep backup of all keys in a secure password manager
4. Test Stripe webhooks in live mode after deployment

## 📱 Mobile App Update:

If Stripe keys changed, update `/naturinex-app/app.json`:
```json
"stripePublishableKey": "pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05"
```

Then rebuild the app:
```bash
cd naturinex-app
eas build --platform all --profile production
```

---

**Time Required: ~30 minutes total**
**Priority: CRITICAL - App won't work without these steps**