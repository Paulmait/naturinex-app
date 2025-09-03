# Vercel Frontend Environment Variables

## ⚠️ CRITICAL: Frontend Variables for Vercel

The variables you currently have in Vercel (FIREBASE_CLIENT_EMAIL, STRIPE_PRICE_BASIC_*, etc.) are **backend variables**. 

For the **frontend (Vercel)**, you need different variables with the `REACT_APP_` prefix.

## Required Frontend Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### 🔴 REQUIRED - Firebase Configuration
```
REACT_APP_FIREBASE_API_KEY=AIzaSyD6X93iVLw92V58oAvMJdrhnW-tFxMcmZA
REACT_APP_FIREBASE_AUTH_DOMAIN=mediscan-b6252.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=mediscan-b6252
REACT_APP_FIREBASE_STORAGE_BUCKET=mediscan-b6252.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1076876259650
REACT_APP_FIREBASE_APP_ID=1:1076876259650:web:f37e5ec88aba25cc8c3f35
REACT_APP_FIREBASE_MEASUREMENT_ID=G-BVDBZFQYF1
```

### 🔴 REQUIRED - API Configuration
```
REACT_APP_API_URL=https://naturinex-app-zsga.onrender.com
```

### 🔴 REQUIRED - Stripe Public Key
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
```

### 🟡 Optional - Google OAuth
```
REACT_APP_GOOGLE_WEB_CLIENT_ID=1076876259650-7o0aaj1ue9kd8e3h3fkq9qtv04e7mqvg.apps.googleusercontent.com
```

## How to Add These Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your `naturinex-webapp` project
3. Go to **Settings** → **Environment Variables**
4. Add each variable above (copy the entire line including the value)
5. Select all environments: **Production**, **Preview**, **Development**
6. Click **Save** after each variable

## Why Your Site Isn't Working

1. **Firebase Auth Error**: The app can't initialize Firebase without the correct API keys
2. **Missing REACT_APP_ prefix**: React apps only recognize environment variables that start with `REACT_APP_`
3. **Wrong Variables**: The variables currently in your Vercel (FIREBASE_CLIENT_EMAIL, etc.) are for your backend server on Render

## After Adding Variables

1. Click **Deployments** in Vercel
2. Click the three dots on the latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes for the build to complete

## Verify It's Working

Once deployed, check:
- The page should load with proper styling
- Sign up should work without Firebase errors
- The subscription plans should display correctly

## Current Variables to REMOVE from Vercel

These backend variables should NOT be in Vercel (they belong in Render):
- FIREBASE_CLIENT_EMAIL
- STRIPE_PRICE_BASIC_A_ANNUAL
- STRIPE_PRICE_BASIC_A_MONTHLY
- STRIPE_PRICE_BASIC_B_ANNUAL
- STRIPE_PRICE_BASIC_B_MONTHLY
- STRIPE_PRICE_BASIC_C_ANNUAL
- STRIPE_PRICE_BASIC_C_MONTHLY

You can remove them or keep them, but they won't be used by the frontend.