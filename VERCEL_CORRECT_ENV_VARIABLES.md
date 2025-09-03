# Correct Vercel Environment Variables for naturinex-app

## ✅ Add These to Vercel Dashboard

Copy and paste these exact environment variables into your Vercel project settings:

```bash
# Firebase Configuration (naturinex-app project)
REACT_APP_FIREBASE_API_KEY=AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=398613963385
REACT_APP_FIREBASE_APP_ID=1:398613963385:web:91b3c8e67976c252f0aaa8

# Backend API URL (Your Render deployment)
REACT_APP_API_URL=https://naturinex-app-zsga.onrender.com

# Stripe Public Key (Safe to expose)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05

# Google OAuth (Optional)
REACT_APP_GOOGLE_WEB_CLIENT_ID=398613963385-7o0aaj1ue9kd8e3h3fkq9qtv04e7mqvg.apps.googleusercontent.com
```

## 🗑️ DELETE These from Vercel

These are backend variables that should only be in Render, NOT in Vercel:

- FIREBASE_CLIENT_EMAIL
- STRIPE_PRICE_BASIC_A_ANNUAL
- STRIPE_PRICE_BASIC_A_MONTHLY
- STRIPE_PRICE_BASIC_B_ANNUAL
- STRIPE_PRICE_BASIC_B_MONTHLY
- STRIPE_PRICE_BASIC_C_ANNUAL
- STRIPE_PRICE_BASIC_C_MONTHLY
- Any other backend/server variables

## 📝 Important Notes

1. **Project Change**: We've switched from the old `mediscan-b6252` project to your actual `naturinex-app` Firebase project
2. **Support Email**: Updated to use `guampaul@gmail.com` as shown in your Firebase console
3. **All variables MUST start with `REACT_APP_`** for React to recognize them
4. **After adding variables**: Click "Redeploy" in Vercel to apply them

## ✅ How to Add in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your `naturinex-webapp` project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. For each variable above:
   - Paste the entire line (name=value)
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click **Save**
6. After adding all variables, go to **Deployments** and click **Redeploy**

## 🔍 Verification

After redeploying, your app should:
- Allow user signup/signin without Firebase errors
- Connect to the correct Firebase project (naturinex-app)
- Show your support email as guampaul@gmail.com