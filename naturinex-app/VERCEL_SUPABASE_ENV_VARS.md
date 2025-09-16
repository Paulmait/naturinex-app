# 🔧 Environment Variables Configuration Guide

## VERCEL Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables

### 1. Supabase Configuration
```bash
REACT_APP_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### 2. Firebase Configuration (Keep for migration period)
```bash
REACT_APP_FIREBASE_API_KEY=AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=398613963385
REACT_APP_FIREBASE_APP_ID=1:398613963385:web:91b3c8e67976c252f0aaa8
```

### 3. Stripe Configuration
```bash
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
STRIPE_SECRET_KEY=[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=[your-webhook-secret]
```

### 4. Redis Cache (Upstash)
```bash
UPSTASH_REDIS_REST_URL=https://[your-endpoint].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-redis-token]
```

### 5. Monitoring
```bash
REACT_APP_SENTRY_DSN=[your-sentry-dsn]
SENTRY_AUTH_TOKEN=[your-sentry-auth-token]
SENTRY_ORG=[your-sentry-org]
SENTRY_PROJECT=[your-sentry-project]
```

### 6. API Configuration
```bash
REACT_APP_API_URL=https://[YOUR_PROJECT_REF].supabase.co/functions/v1
REACT_APP_USE_SUPABASE=true
```

### 7. App Configuration
```bash
REACT_APP_VERSION=1.0.0
REACT_APP_SUPPORT_EMAIL=guampaul@gmail.com
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### 8. Google Services (Optional)
```bash
REACT_APP_GOOGLE_WEB_CLIENT_ID=398613963385-7o0aaj1ue9kd8e3h3fkq9qtv04e7mqvg.apps.googleusercontent.com
GOOGLE_CLOUD_VISION_API_KEY=[if-using-vision-api]
```

---

## SUPABASE Configuration
Add these in Supabase Dashboard → Settings → Edge Functions → Secrets

### 1. Stripe Integration
```bash
STRIPE_SECRET_KEY=sk_live_[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]
STRIPE_PRICE_ID_MONTHLY=[your-monthly-price-id]
STRIPE_PRICE_ID_YEARLY=[your-yearly-price-id]
```

### 2. Redis Cache
```bash
UPSTASH_REDIS_REST_URL=https://[your-endpoint].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-redis-token]
```

### 3. Email Service (Resend)
```bash
RESEND_API_KEY=[your-resend-api-key]
RESEND_FROM_EMAIL=noreply@naturinex.com
```

### 4. AI/ML Services (if applicable)
```bash
OPENAI_API_KEY=[your-openai-key]
GOOGLE_CLOUD_VISION_API_KEY=[your-vision-api-key]
```

### 5. Monitoring
```bash
SENTRY_DSN=[your-sentry-dsn]
```

### 6. App URLs
```bash
APP_URL=https://naturinex.com
API_URL=https://[YOUR_PROJECT_REF].supabase.co/functions/v1
```

---

## 📋 Setup Steps

### For Vercel:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above (Production, Preview, Development)
5. Click "Save"
6. Redeploy for changes to take effect

### For Supabase:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → Edge Functions → Secrets
4. Add each secret using the dashboard or CLI:
```bash
supabase secrets set KEY=value --project-ref [YOUR_PROJECT_REF]
```

---

## 🔐 Getting Your Keys

### Supabase Keys:
1. Go to Settings → API in Supabase Dashboard
2. Find:
   - `anon` public key (safe for frontend)
   - `service_role` key (backend only - KEEP SECRET!)
   - Project URL

### Stripe Keys:
1. Go to https://dashboard.stripe.com/apikeys
2. Get:
   - Publishable key (starts with `pk_`)
   - Secret key (starts with `sk_`)
3. For webhook secret:
   - Go to Webhooks → Your endpoint → Signing secret

### Upstash Redis:
1. Create account at https://upstash.com
2. Create a Redis database
3. Go to Details tab
4. Copy REST URL and Token

### Sentry:
1. Create project at https://sentry.io
2. Go to Settings → Projects → Your Project → Client Keys
3. Copy the DSN

### Resend:
1. Sign up at https://resend.com
2. Go to API Keys
3. Create and copy API key

---

## ⚠️ Security Notes

1. **NEVER commit these to git**
2. **Use different keys for dev/staging/production**
3. **Rotate keys regularly**
4. **Monitor key usage in dashboards**
5. **Set up alerts for unusual activity**

---

## 🚀 Quick Copy-Paste for .env.local (Development)

```bash
# Supabase
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Firebase (temporary during migration)
REACT_APP_FIREBASE_API_KEY=AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=398613963385
REACT_APP_FIREBASE_APP_ID=1:398613963385:web:91b3c8e67976c252f0aaa8

# Stripe
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring
REACT_APP_SENTRY_DSN=

# App Config
REACT_APP_USE_SUPABASE=true
REACT_APP_API_URL=
REACT_APP_VERSION=1.0.0
REACT_APP_SUPPORT_EMAIL=guampaul@gmail.com
```

---

## ✅ Verification Checklist

After adding all environment variables:

- [ ] Test authentication flow
- [ ] Test Stripe checkout
- [ ] Test webhook handling
- [ ] Verify caching works
- [ ] Check error tracking in Sentry
- [ ] Confirm email sending
- [ ] Load test the API endpoints
- [ ] Monitor for 24 hours

---

*Remember: After setting up all variables, redeploy your application on Vercel for changes to take effect!*