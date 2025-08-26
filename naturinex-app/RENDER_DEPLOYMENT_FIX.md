# 🚀 Render Deployment Fix - Complete Guide

## Current Issue
Your Render deployment is failing because:
1. Wrong start command path
2. Missing required environment variables

## Quick Fix Steps

### 1. Update Start Command in Render Dashboard

Go to your Render service → Settings → Start Command

Change from:
```
node server/index.js
```

To:
```
cd server && node index.js
```

### 2. Add ALL Required Environment Variables

In Render Dashboard → Environment tab, add these:

#### Required Variables:
1. **GEMINI_API_KEY** ⚠️ CRITICAL
   - Get from: https://makersuite.google.com/app/apikey
   - Value: `AIzaSy...` (your API key)

2. **STRIPE_SECRET_KEY** ⚠️ CRITICAL
   - Get from: https://dashboard.stripe.com/apikeys
   - Value: `sk_live_...` or `sk_test_...` for testing

3. **STRIPE_WEBHOOK_SECRET** ⚠️ CRITICAL
   - For now, use a placeholder: `whsec_test123`
   - Update later when you set up webhooks

#### Optional but Recommended:
4. **NODE_ENV**
   - Value: `production`

5. **PORT**
   - Value: `10000`

6. **CORS_ORIGIN**
   - Value: `*` (for testing) or your app URL

### 3. Optional Firebase Admin (for webhooks)
If you want webhook functionality:

7. **FIREBASE_PROJECT_ID**
   - Value: `naturinex-app`

8. **FIREBASE_CLIENT_EMAIL**
   - Get from Firebase service account JSON

9. **FIREBASE_PRIVATE_KEY**
   - Get from Firebase service account JSON

### 4. Save and Redeploy

1. Click "Save Changes"
2. Watch logs for successful deployment
3. Look for: "Server is running on port 10000"

## Testing Your Deployment

Once deployed, test these endpoints:

1. **Health Check**
   ```
   https://naturinex-api.onrender.com/health
   ```

2. **Test Analysis** (with curl or Postman)
   ```bash
   curl -X POST https://naturinex-api.onrender.com/api/analyze/name \
     -H "Content-Type: application/json" \
     -d '{"medicationName": "Advil"}'
   ```

## Common Errors and Solutions

### "Missing required environment variables"
- You MUST add GEMINI_API_KEY, STRIPE_SECRET_KEY, and STRIPE_WEBHOOK_SECRET

### "Cannot find module"
- Make sure start command is: `cd server && node index.js`

### "EADDRINUSE"
- PORT is already in use, change to different port

## Verification Checklist

- [ ] Start command updated to `cd server && node index.js`
- [ ] GEMINI_API_KEY added
- [ ] STRIPE_SECRET_KEY added
- [ ] STRIPE_WEBHOOK_SECRET added (even if placeholder)
- [ ] Service shows "Live" status
- [ ] Health endpoint returns JSON

## Update Your App

Once deployed, update your `app.json`:
```json
"apiUrl": "https://naturinex-api.onrender.com"
```

Your backend will be fully functional!