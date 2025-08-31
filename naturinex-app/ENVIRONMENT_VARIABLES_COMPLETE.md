# Complete Environment Variables for Render

## ✅ Verified Configuration

### Firebase (CONFIRMED CORRECT)
```bash
FIREBASE_API_KEY=AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[Your long private key here]\n-----END PRIVATE KEY-----
```

### Google APIs
```bash
# For AI medication analysis (from Jul 25, 2025)
GEMINI_API_KEY=[Your Generative Language API Key]

# For OCR/image scanning (from Aug 31, 2025)
GOOGLE_VISION_API_KEY=[Your Google Vision API key]
```

### Stripe Configuration
```bash
STRIPE_SECRET_KEY=[Your Stripe secret key starting with sk_]
STRIPE_WEBHOOK_SECRET=[Your webhook secret starting with whsec_]

# Pricing Tiers (A/B/C Testing)
STRIPE_PRICE_BASIC_A_MONTHLY=price_1RpEb3IwUuNq64NpP2jNKWIJ
STRIPE_PRICE_BASIC_A_ANNUAL=price_1RpEeKIwUuNq64Np0VUrD3jm
STRIPE_PRICE_BASIC_B_MONTHLY=price_1RpEcUIwUuNq64Np4KLl689G
STRIPE_PRICE_BASIC_B_ANNUAL=price_1RpEeqIwUuNq64NpPculkKkA
STRIPE_PRICE_BASIC_C_MONTHLY=price_1RpEdHIwUuNq64NpfLgNzDkc
STRIPE_PRICE_BASIC_C_ANNUAL=price_1RpEfFIwUuNq64Npcg9kVtC0
```

### Server Configuration
```bash
NODE_ENV=production
PORT=10000
ADMIN_SECRET=[Your chosen admin secret]
DATA_ENCRYPTION_KEY=[Your chosen encryption key]
CACHE_ENABLED=true
CORS_ORIGIN=*
```

## 🔍 How to Verify Each Key

### FIREBASE_API_KEY ✅
- Length: ~39 characters
- Format: `AIzaSy...` (starts with AIza)
- This is PUBLIC, used in frontend

### FIREBASE_PRIVATE_KEY ⚠️
- Length: ~1600+ characters
- Must include:
  ```
  -----BEGIN PRIVATE KEY-----
  [lots of characters]
  -----END PRIVATE KEY-----
  ```
- Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key

### GEMINI_API_KEY
- Format: Starts with `AIza`
- Get from: https://makersuite.google.com/app/apikey
- Make sure billing is enabled in Google Cloud

### GOOGLE_VISION_API_KEY
- Format: Starts with `AIza`
- Your key created on Aug 31, 2025
- Enable Vision API in Google Cloud Console

## 📊 Deployment Status
- Server: ✅ Running
- Firebase Auth: ✅ Working
- Firestore: ✅ Working
- Gemini AI: ⚠️ Needs valid API key
- Vision OCR: ⚠️ Needs API key added
- Stripe: ⚠️ Needs webhook configuration

## After Adding All Variables:
1. Restart Render service
2. Test with: `node test-production.js`
3. All features should work!