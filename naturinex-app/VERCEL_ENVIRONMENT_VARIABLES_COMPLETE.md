# 🚀 VERCEL ENVIRONMENT VARIABLES - COMPLETE GUIDE
## Production Deployment Configuration

**Project**: Naturinex Medical Wellness App
**Date**: November 1, 2025
**Purpose**: Complete list of environment variables needed for Vercel deployment

---

## 📋 HOW TO ADD TO VERCEL

### Method 1: Vercel Dashboard (Recommended)
```
1. Go to: https://vercel.com/[username]/naturinex-app/settings/environment-variables
2. Click "Add New"
3. Enter Key, Value, and Environment (Production/Preview/Development)
4. Click "Save"
5. Redeploy your app
```

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variable
vercel env add EXPO_PUBLIC_SUPABASE_URL production
# (Then paste the value when prompted)

# Pull environment variables to local (optional)
vercel env pull .env.local
```

---

## 🔐 CRITICAL SECURITY SECRETS (REQUIRED)

### 1. JWT Secret (Generated from scripts/generate-secrets.js)
```
Key: JWT_SECRET
Value: 52f6ed0495c100f2446c898629dd234e5c6ed27eb5d35d7cc460962ec3dccf7810dca1103feb2bb6e59ac50c1d13096558eaa055fd240967031ce4786ae6df90
Environment: Production, Preview
Sensitive: YES (check the sensitive checkbox)
```

### 2. Session Secret (Generated from scripts/generate-secrets.js)
```
Key: SESSION_SECRET
Value: 0d7f19a48f2dee60e7f9a1e1733023d0d8b9c22321c9e6cda01b499837751620119267333a448afc2c393d2f83eb1cf1eb8ec3fa8b29c733db947726a6390cf6
Environment: Production, Preview
Sensitive: YES
```

### 3. Encryption Key (Generated from scripts/generate-secrets.js)
```
Key: ENCRYPTION_KEY
Value: e538fb921b581358513ffd917d47d46103b1d3f1cb2267f0e7fd1a2e53a49905
Environment: Production, Preview
Sensitive: YES
```

---

## 🔑 AUTHENTICATION & DATABASE (REQUIRED)

### Supabase Configuration
```
Key: EXPO_PUBLIC_SUPABASE_URL
Value: https://hxhbsxzkzarqwksbjpce.supabase.co
Environment: Production, Preview, Development
Sensitive: NO
```

```
Key: EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: [GET FROM: https://supabase.com/dashboard/project/hxhbsxzkzarqwksbjpce/settings/api]
Environment: Production, Preview, Development
Sensitive: NO (anon key is safe to expose, but mark as sensitive for extra security)
```

```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [GET FROM: https://supabase.com/dashboard/project/hxhbsxzkzarqwksbjpce/settings/api]
Environment: Production, Preview
Sensitive: YES (NEVER expose this - it bypasses RLS!)
```

### Firebase Configuration (Optional - if using Firebase)
```
Key: EXPO_PUBLIC_FIREBASE_API_KEY
Value: [GET FROM: Firebase Console > Project Settings > General]
Environment: Production, Preview, Development
Sensitive: NO
```

```
Key: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: naturinex-app.firebaseapp.com
Environment: Production, Preview, Development
Sensitive: NO
```

```
Key: EXPO_PUBLIC_FIREBASE_PROJECT_ID
Value: naturinex-app
Environment: Production, Preview, Development
Sensitive: NO
```

```
Key: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: naturinex-app.appspot.com
Environment: Production, Preview, Development
Sensitive: NO
```

```
Key: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: [GET FROM: Firebase Console]
Environment: Production, Preview, Development
Sensitive: NO
```

```
Key: EXPO_PUBLIC_FIREBASE_APP_ID
Value: [GET FROM: Firebase Console]
Environment: Production, Preview, Development
Sensitive: NO
```

---

## 🤖 AI SERVICES (REQUIRED FOR CORE FUNCTIONALITY)

### Google Gemini API (AI Analysis)
```
Key: EXPO_PUBLIC_GEMINI_API_KEY
Value: [GET FROM: https://makersuite.google.com/app/apikey]
Environment: Production, Preview, Development
Sensitive: YES
Note: Should start with "AIza"
```

```
Key: GEMINI_API_KEY
Value: [SAME AS ABOVE - for server-side access]
Environment: Production, Preview
Sensitive: YES
```

### Google Vision API (OCR)
```
Key: EXPO_PUBLIC_GOOGLE_VISION_API_KEY
Value: [GET FROM: https://console.cloud.google.com/apis/credentials]
Environment: Production, Preview, Development
Sensitive: YES
```

```
Key: GOOGLE_VISION_API_KEY
Value: [SAME AS ABOVE - for server-side access]
Environment: Production, Preview
Sensitive: YES
```

---

## 💳 PAYMENT PROCESSING (STRIPE - REQUIRED)

### Stripe Publishable Key (Client-side)
```
Key: EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_... (for production) or pk_test_... (for development)
Environment: Production (use pk_live_), Preview (use pk_test_)
Sensitive: NO
Get from: https://dashboard.stripe.com/apikeys
```

### Stripe Secret Key (Server-side ONLY)
```
Key: STRIPE_SECRET_KEY
Value: sk_live_... (for production) or sk_test_... (for development)
Environment: Production (use sk_live_), Preview (use sk_test_)
Sensitive: YES (CRITICAL - never expose to client!)
Get from: https://dashboard.stripe.com/apikeys
```

### Stripe Webhook Secret
```
Key: STRIPE_WEBHOOK_SECRET
Value: whsec_...
Environment: Production, Preview
Sensitive: YES
Get from: https://dashboard.stripe.com/webhooks
Note: Create separate webhook endpoints for production and preview
```

---

## 🌐 API CONFIGURATION

### API Base URL
```
Key: EXPO_PUBLIC_API_URL
Value: https://naturinex-app-zsga.onrender.com (or your Vercel URL)
Environment: Production, Preview
Sensitive: NO
```

```
Key: REACT_APP_API_URL
Value: [SAME AS ABOVE - for React web app compatibility]
Environment: Production, Preview
Sensitive: NO
```

```
Key: NEXT_PUBLIC_API_URL
Value: [SAME AS ABOVE - for Next.js compatibility]
Environment: Production, Preview
Sensitive: NO
```

---

## 📊 MONITORING & ERROR TRACKING

### Sentry DSN (Error Tracking)
```
Key: EXPO_PUBLIC_SENTRY_DSN
Value: [GET FROM: https://sentry.io/settings/[org]/projects/[project]/keys/]
Environment: Production, Preview
Sensitive: NO (but mark as sensitive for security)
```

```
Key: SENTRY_DSN
Value: [SAME AS ABOVE - for server-side access]
Environment: Production, Preview
Sensitive: NO
```

```
Key: SENTRY_ORG
Value: naturinex (or your organization slug)
Environment: Production, Preview
Sensitive: NO
```

```
Key: SENTRY_PROJECT
Value: naturinex-app (or your project slug)
Environment: Production, Preview
Sensitive: NO
```

---

## 🚀 ENVIRONMENT & FEATURE FLAGS

### Node Environment
```
Key: NODE_ENV
Value: production
Environment: Production
```

```
Key: NODE_ENV
Value: development
Environment: Preview, Development
```

### Expo Environment
```
Key: EXPO_PUBLIC_ENV
Value: production
Environment: Production
```

```
Key: EXPO_PUBLIC_ENV
Value: preview
Environment: Preview
```

### Feature Flags
```
Key: EXPO_PUBLIC_ENABLE_OCR
Value: true
Environment: Production, Preview, Development
```

```
Key: EXPO_PUBLIC_ENABLE_CAMERA
Value: true
Environment: Production, Preview, Development
```

```
Key: EXPO_PUBLIC_ENABLE_2FA
Value: true
Environment: Production, Preview, Development
```

```
Key: EXPO_PUBLIC_ENABLE_BIOMETRIC
Value: true
Environment: Production, Preview, Development
```

---

## 📧 OPTIONAL (BUT RECOMMENDED)

### SendGrid (Email Notifications)
```
Key: SENDGRID_API_KEY
Value: [GET FROM: https://app.sendgrid.com/settings/api_keys]
Environment: Production, Preview
Sensitive: YES
```

```
Key: SUPPORT_EMAIL
Value: support@naturinex.com
Environment: Production, Preview
```

### Redis (Caching - Optional)
```
Key: REDIS_URL
Value: redis://[host]:[port]
Environment: Production, Preview
Sensitive: YES
```

---

## ✅ QUICK CHECKLIST

Use this checklist when setting up Vercel:

### Critical (MUST HAVE - 15 variables)
- [ ] JWT_SECRET
- [ ] SESSION_SECRET
- [ ] ENCRYPTION_KEY
- [ ] EXPO_PUBLIC_SUPABASE_URL
- [ ] EXPO_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] EXPO_PUBLIC_GEMINI_API_KEY
- [ ] GEMINI_API_KEY
- [ ] EXPO_PUBLIC_GOOGLE_VISION_API_KEY
- [ ] GOOGLE_VISION_API_KEY
- [ ] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] EXPO_PUBLIC_API_URL
- [ ] NODE_ENV

### Important (Should Have - 8 variables)
- [ ] EXPO_PUBLIC_SENTRY_DSN
- [ ] SENTRY_DSN
- [ ] EXPO_PUBLIC_ENV
- [ ] EXPO_PUBLIC_ENABLE_OCR
- [ ] EXPO_PUBLIC_ENABLE_CAMERA
- [ ] EXPO_PUBLIC_ENABLE_2FA
- [ ] EXPO_PUBLIC_ENABLE_BIOMETRIC
- [ ] SUPPORT_EMAIL

### Optional (Nice to Have - 6+ variables)
- [ ] EXPO_PUBLIC_FIREBASE_API_KEY
- [ ] EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
- [ ] EXPO_PUBLIC_FIREBASE_PROJECT_ID
- [ ] SENDGRID_API_KEY
- [ ] REDIS_URL
- [ ] CDN_URL

---

## 🔄 DEPLOYMENT STEPS

After adding all environment variables:

### 1. Verify Variables
```bash
# Check Vercel dashboard
# Go to: Settings > Environment Variables
# Verify all critical variables are present
```

### 2. Test Configuration
```bash
# Build locally with Vercel environment
vercel env pull .env.local
npm run build
npm run start
```

### 3. Deploy to Vercel
```bash
# Deploy to preview (first)
vercel

# Deploy to production (after testing preview)
vercel --prod
```

### 4. Verify Deployment
```
1. Visit your Vercel URL
2. Check browser console for errors
3. Test authentication (signup/login)
4. Test OCR + AI analysis
5. Test subscription checkout
6. Check Sentry for any errors
```

---

## 🆘 TROUBLESHOOTING

### Problem: "API key not configured" error
**Solution**:
- Check that environment variable name matches exactly (case-sensitive)
- Verify the variable is set for the correct environment (Production/Preview/Development)
- Redeploy after adding variables

### Problem: Services not working in production
**Solution**:
- Check that you're using `EXPO_PUBLIC_*` prefix for client-side variables
- Verify API keys are valid and not expired
- Check API key restrictions (Gemini/Vision should allow your Vercel domain)

### Problem: Stripe checkout not working
**Solution**:
- Make sure you're using `pk_live_*` and `sk_live_*` for production
- Verify webhook endpoint is set to your Vercel URL
- Check webhook secret matches

### Problem: "Cannot find module '../config/env'" error
**Solution**:
- Make sure `src/config/env.js` file exists
- Check that all imports are using the correct path
- Rebuild after adding the file

---

## 📝 COPY-PASTE TEMPLATE FOR VERCEL CLI

Save this to a file and run commands one by one:

```bash
# CRITICAL SECRETS (replace values with your actual secrets)
vercel env add JWT_SECRET production
# Paste: 52f6ed0495c100f2446c898629dd234e5c6ed27eb5d35d7cc460962ec3dccf7810dca1103feb2bb6e59ac50c1d13096558eaa055fd240967031ce4786ae6df90

vercel env add SESSION_SECRET production
# Paste: 0d7f19a48f2dee60e7f9a1e1733023d0d8b9c22321c9e6cda01b499837751620119267333a448afc2c393d2f83eb1cf1eb8ec3fa8b29c733db947726a6390cf6

vercel env add ENCRYPTION_KEY production
# Paste: e538fb921b581358513ffd917d47d46103b1d3f1cb2267f0e7fd1a2e53a49905

# SUPABASE
vercel env add EXPO_PUBLIC_SUPABASE_URL production
# Paste: https://hxhbsxzkzarqwksbjpce.supabase.co

vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY production
# Paste: [your_supabase_anon_key]

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: [your_supabase_service_role_key]

# AI SERVICES
vercel env add EXPO_PUBLIC_GEMINI_API_KEY production
# Paste: [your_gemini_api_key]

vercel env add EXPO_PUBLIC_GOOGLE_VISION_API_KEY production
# Paste: [your_vision_api_key]

# STRIPE
vercel env add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste: [your_stripe_publishable_key]

vercel env add STRIPE_SECRET_KEY production
# Paste: [your_stripe_secret_key]

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: [your_stripe_webhook_secret]

# API & ENVIRONMENT
vercel env add EXPO_PUBLIC_API_URL production
# Paste: https://your-app.vercel.app

vercel env add NODE_ENV production
# Paste: production

vercel env add EXPO_PUBLIC_ENV production
# Paste: production

# MONITORING
vercel env add EXPO_PUBLIC_SENTRY_DSN production
# Paste: [your_sentry_dsn]
```

---

## 📌 IMPORTANT NOTES

1. **Never commit environment variables to git**
2. **Use different API keys for production vs development**
3. **Stripe: Use `pk_test_*` and `sk_test_*` for testing, `pk_live_*` and `sk_live_*` for production**
4. **Redeploy after changing environment variables**
5. **Test in Preview environment before deploying to Production**
6. **Rotate secrets every 90 days**
7. **Monitor Sentry for configuration errors after deployment**

---

**Status**: ⬜ Not Applied
**Next Action**: Add environment variables to Vercel
**Estimated Time**: 15-30 minutes

---

*Last Updated: November 1, 2025*
*Version: 1.0.0*
