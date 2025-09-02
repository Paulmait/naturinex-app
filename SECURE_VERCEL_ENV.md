# 🔒 SECURE ENVIRONMENT VARIABLES FOR VERCEL

## ⚠️ SECURITY ALERT FIXED!
The exposed Google API key has been removed from the codebase. All API keys are now environment variables.

## 🚀 VERCEL DEPLOYMENT - SECURE SETUP

### For Backend API (`server` directory):
```env
# Get NEW API key from: https://makersuite.google.com/app/apikey
# DO NOT use the exposed key!
GEMINI_API_KEY=GET_NEW_KEY_FROM_GOOGLE

NODE_ENV=production
PORT=5000

# Stripe (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY
```

### For Web App (`naturinex-app` directory):
```env
# Backend URL (after deploying backend)
REACT_APP_API_URL=https://your-backend.vercel.app

# Stripe Public Key (safe to expose)
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05

# Firebase (GET NEW KEYS from Firebase Console)
# Go to: Firebase Console → Project Settings → General
REACT_APP_FIREBASE_API_KEY=GET_NEW_KEY_FROM_FIREBASE
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=398613963385
REACT_APP_FIREBASE_APP_ID=1:398613963385:web:91b3c8e67976c252f0aaa8
REACT_APP_FIREBASE_MEASUREMENT_ID=G-04VE09YVEC
```

## ⚡ QUICK DEPLOYMENT STEPS

### 1. Get New API Keys:
- **Gemini API**: https://makersuite.google.com/app/apikey
- **Firebase**: Firebase Console → Project Settings → General → Web API Key

### 2. Deploy via Vercel Website:
1. Go to [vercel.com](https://vercel.com)
2. Import `Paulmait/naturinex-app` repository
3. **Deploy Backend:**
   - Root Directory: `server`
   - Add environment variables above
4. **Deploy Web App:**
   - Root Directory: `naturinex-app`
   - Build Command: `npm run build:web`
   - Add environment variables above

### 3. Or Deploy via CLI:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd server
vercel --prod
# Add env vars in Vercel dashboard

# Deploy web app
cd ../naturinex-app
vercel --prod
# Add env vars in Vercel dashboard
```

## 🔐 SECURITY BEST PRACTICES

1. **NEVER commit API keys to Git**
2. **Always use environment variables**
3. **Rotate compromised keys immediately**
4. **Use different keys for dev/staging/production**
5. **Enable API key restrictions in Google Cloud Console**

## 🛡️ API Key Restrictions (IMPORTANT!)

### For Gemini API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Click on your API key
4. Add restrictions:
   - Application restrictions: HTTP referrers
   - Add your domains:
     - `https://your-app.vercel.app/*`
     - `https://naturinex.com/*`

### For Firebase API Key:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → General
3. Add authorized domains:
   - `your-app.vercel.app`
   - `naturinex.com`

## ✅ SECURITY CHECKLIST

- [x] Removed hardcoded API keys from code
- [x] Updated to use environment variables
- [x] Created .env.example files
- [x] Pushed security fixes to GitHub
- [ ] Get NEW API keys (don't use exposed ones)
- [ ] Set environment variables in Vercel
- [ ] Add API key restrictions in Google Cloud
- [ ] Test deployment with new keys

## 🎯 READY TO DEPLOY SECURELY!

Your code is now secure. Just:
1. Get new API keys
2. Set them in Vercel environment variables
3. Deploy!

**No more exposed keys! 🔒**