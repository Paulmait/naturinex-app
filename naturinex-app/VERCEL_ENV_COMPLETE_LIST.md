# 🔐 Complete Vercel Environment Variables List

## 📋 Copy & Paste These Exact Variable Names and Values

### 1️⃣ SUPABASE CONFIGURATION (REQUIRED - Fix Build Error)
```
REACT_APP_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your-anon-key-from-supabase]
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key-from-supabase]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key-from-supabase]
```

### 2️⃣ AI CONFIGURATION (Already Have)
```
GEMINI_API_KEY=[already-in-vercel]
```

### 3️⃣ STRIPE CONFIGURATION
```
STRIPE_SECRET_KEY=[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=[your-stripe-webhook-signing-secret]
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
```

### 4️⃣ FIREBASE CONFIGURATION (Keep During Migration)
```
REACT_APP_FIREBASE_API_KEY=AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=398613963385
REACT_APP_FIREBASE_APP_ID=1:398613963385:web:91b3c8e67976c252f0aaa8
FIREBASE_SERVICE_ACCOUNT=[your-firebase-service-account-json]
```

### 5️⃣ API CONFIGURATION
```
REACT_APP_API_URL=https://naturinex-app.onrender.com
REACT_APP_USE_SUPABASE=true
```

### 6️⃣ GOOGLE SERVICES
```
REACT_APP_GOOGLE_WEB_CLIENT_ID=398613963385-7o0aaj1ue9kd8e3h3fkq9qtv04e7mqvg.apps.googleusercontent.com
GOOGLE_APPLICATION_CREDENTIALS=[your-google-cloud-credentials-json]
GOOGLE_CLOUD_VISION_API_KEY=[your-vision-api-key-if-using]
```

### 7️⃣ EMAIL SERVICE (RESEND)
```
RESEND_API_KEY=[your-resend-api-key]
RESEND_FROM_EMAIL=noreply@naturinex.com
```

### 8️⃣ MONITORING (OPTIONAL BUT RECOMMENDED)
```
REACT_APP_SENTRY_DSN=[your-sentry-dsn]
SENTRY_AUTH_TOKEN=[your-sentry-auth-token]
SENTRY_ORG=[your-sentry-org]
SENTRY_PROJECT=[your-sentry-project]
```

### 9️⃣ REDIS CACHING (OPTIONAL FOR SCALE)
```
UPSTASH_REDIS_REST_URL=[your-upstash-redis-url]
UPSTASH_REDIS_REST_TOKEN=[your-upstash-redis-token]
```

### 🔟 APP CONFIGURATION
```
NODE_ENV=production
GENERATE_SOURCEMAP=false
REACT_APP_VERSION=1.0.0
REACT_APP_SUPPORT_EMAIL=guampaul@gmail.com
```

---

## 🔍 WHERE TO GET THESE VALUES

### Supabase (MOST IMPORTANT - FIXES BUILD)
1. Go to: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **URL**: `https://[YOUR_PROJECT_REF].supabase.co`
   - **anon public**: This is your `REACT_APP_SUPABASE_ANON_KEY`
   - **service_role secret**: This is your `SUPABASE_SERVICE_ROLE_KEY`

### Stripe
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy:
   - **Secret key**: starts with `sk_live_`
3. For webhook secret:
   - Go to **Webhooks** → Click on your webhook endpoint
   - Copy **Signing secret**: starts with `whsec_`

### Firebase Service Account
1. Go to: https://console.firebase.google.com
2. Select **naturinex-app** project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Copy the entire JSON content as one line

### Resend (Email)
1. Sign up at: https://resend.com
2. Go to **API Keys**
3. Create an API key
4. Add your domain for `noreply@naturinex.com`

### Sentry (Error Tracking)
1. Sign up at: https://sentry.io
2. Create a project
3. Go to **Settings** → **Projects** → **Client Keys**
4. Copy the DSN

### Upstash Redis (Caching)
1. Sign up at: https://upstash.com
2. Create a Redis database
3. Go to **Details** tab
4. Copy REST URL and REST Token

---

## ⚡ QUICK SETUP STEPS

### Step 1: Go to Vercel Dashboard
1. Navigate to: https://vercel.com/dashboard
2. Click on your **naturinex-app** project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Variables
For each variable above:
1. Click **Add**
2. Enter the **Key** (variable name)
3. Enter the **Value**
4. Select all three environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### Step 3: Critical Variables (Add These First)
These are REQUIRED for the site to work:
```
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
REACT_APP_API_URL
```

### Step 4: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy** → **Redeploy**

---

## ✅ VERIFICATION CHECKLIST

After adding variables and redeploying:

- [ ] Build succeeds without errors
- [ ] Homepage loads at https://naturinex.com
- [ ] Sign up/Login works
- [ ] Navigation buttons work
- [ ] Pricing page displays
- [ ] Database connections work

---

## 🚨 TROUBLESHOOTING

### Build Still Failing?
Make sure you added BOTH:
- `REACT_APP_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
(Same value for both)

### Authentication Not Working?
Check:
- Firebase variables are added
- Supabase anon key is correct

### API Calls Failing?
Verify:
- `REACT_APP_API_URL=https://naturinex-app.onrender.com`
- No trailing slash

---

## 📝 NOTES

1. **Variable names must be EXACT** - Copy/paste to avoid typos
2. **Add to all environments** - Production, Preview, Development
3. **Redeploy after adding** - Changes only take effect after redeploy
4. **Supabase is critical** - Site won't build without it
5. **Keep Firebase for now** - Still using during migration

---

*Last Updated: Today*
*Priority: Add Supabase variables FIRST to fix build*