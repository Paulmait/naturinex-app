# 🔑 Firebase Service Account Setup Guide

## What You Need From Firebase Console

### Step 1: Go to Service Accounts Tab
1. You're currently in "General" tab
2. Click on **"Service accounts"** tab (you mentioned it in your list)

### Step 2: Generate Private Key
1. In Service accounts tab, you'll see "Firebase Admin SDK"
2. Click **"Generate new private key"** button
3. A JSON file will download - **KEEP THIS SECURE!**

### Step 3: Extract Values from JSON
The downloaded JSON will look like this:
```json
{
  "type": "service_account",
  "project_id": "naturinex-app",
  "private_key_id": "abcd1234...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@naturinex-app.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### Step 4: Add to server/.env
Copy these specific values:
```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"
```

### Important Notes:
1. **FIREBASE_PROJECT_ID**: Already have this - `naturinex-app`
2. **FIREBASE_CLIENT_EMAIL**: Will be in the JSON (looks like `firebase-adminsdk-xxxxx@naturinex-app.iam.gserviceaccount.com`)
3. **FIREBASE_PRIVATE_KEY**: The long key starting with `-----BEGIN PRIVATE KEY-----`

### Step 5: Format the Private Key
The private key has `\n` characters. Keep them as-is in the .env file:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9W8bA\nrest-of-your-key-here\n-----END PRIVATE KEY-----\n"
```

### Step 6: Add Other Required ENV Variables
While you're at it, add these from your Firebase config:
```env
# Gemini API (for medication analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# Stripe (you already have these)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 7: Test Locally
```bash
cd server
npm start
# Should see: "✅\u001b Firebase Admin initialized with service account"
```

### Step 8: Add to Render
1. Go to Render Dashboard > Environment
2. Add the same 3 Firebase variables
3. Click "Save Changes"
4. Render will auto-deploy

## Security Warning! 🚨
- **NEVER** commit the JSON file to Git
- **NEVER** share the private key publicly
- Add `*.json` to `.gitignore` if not already there

## What This Enables:
- ✅ User authentication verification
- ✅ Scan history saving
- ✅ Premium status checking
- ✅ Subscription updates
- ✅ Analytics tracking
- ✅ Admin features

Without this, the app works but with limited features (no user data persistence).