# Vercel Environment Variables Configuration

**Last Updated: January 17, 2025**

---

## Required Environment Variables for Vercel Deployment

### 1. Supabase Configuration

These are **REQUIRED** for the app to function:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get these:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" as `EXPO_PUBLIC_SUPABASE_URL`
4. Copy the "anon/public" key as `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ CRITICAL:** These must be set for **Production** environment in Vercel.

---

### 2. Stripe Configuration

These are **REQUIRED** for payment processing:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
```

**How to get this:**
1. Go to Stripe Dashboard (https://dashboard.stripe.com)
2. Make sure you're in **LIVE MODE** (toggle in top left)
3. Navigate to Developers → API Keys
4. Copy the "Publishable key" starting with `pk_live_`

**⚠️ DO NOT use test keys (pk_test_) in production!**

---

### 3. Google Cloud APIs (Optional but Recommended)

These enable OCR and AI features:

```bash
GOOGLE_VISION_API_KEY=your_vision_api_key_here
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get these:**
1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Create a new project or select existing project
3. Enable the APIs:
   - Vision API: https://console.cloud.google.com/apis/library/vision.googleapis.com
   - Generative Language API (Gemini): https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
4. Create API credentials:
   - Navigate to APIs & Services → Credentials
   - Click "Create Credentials" → API Key
   - Restrict the key to only the APIs you need

**Note:** If not set, OCR scanning will be disabled and AI features will use fallback.

---

### 4. Sentry Monitoring (Optional but Recommended)

For production error tracking:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**How to get this:**
1. Go to Sentry.io and create an account
2. Create a new project (React Native or React)
3. Copy the DSN from Project Settings → Client Keys (DSN)

**Note:** If not set, errors will be logged to console only.

---

### 5. App Configuration

Optional but useful for versioning:

```bash
NODE_ENV=production
EXPO_PUBLIC_VERSION=1.0.0
EXPO_PUBLIC_APP_NAME=Naturinex
```

---

## How to Set Environment Variables in Vercel

### Step 1: Access Vercel Dashboard

1. Go to https://vercel.com
2. Log in to your account
3. Select your project (naturinex-app)

### Step 2: Add Environment Variables

1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar
3. For each variable:
   - **Key**: Enter the variable name (e.g., `EXPO_PUBLIC_SUPABASE_URL`)
   - **Value**: Enter the variable value
   - **Environments**: Select **Production** (and optionally Preview/Development)
   - Click **Save**

### Step 3: Verify Variables

You can verify which environment variables are configured:

1. In Vercel dashboard → Settings → Environment Variables
2. You should see all the variables listed
3. Values are hidden for security (shows as `••••••••`)

### Step 4: Trigger Redeploy

After adding/updating environment variables:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **•••** (three dots) → **Redeploy**
4. Or simply push a new commit to trigger deployment

---

## Environment Variables Checklist

Use this checklist to verify all required variables are set:

### ✅ Critical (App Won't Work Without These)

- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### ⚠️ Important (Features Limited Without These)

- [ ] `GOOGLE_VISION_API_KEY` (OCR scanning disabled without this)
- [ ] `GOOGLE_GEMINI_API_KEY` (AI analysis limited without this)

### 📊 Recommended (Production Best Practices)

- [ ] `EXPO_PUBLIC_SENTRY_DSN` (Error tracking)
- [ ] `NODE_ENV=production`
- [ ] `EXPO_PUBLIC_VERSION`

---

## Security Best Practices

### ✅ DO:

1. **Use production keys** in production environment
2. **Use test keys** in preview/development environments
3. **Rotate keys regularly** (quarterly recommended)
4. **Monitor API usage** in respective dashboards
5. **Set up billing alerts** to avoid surprise charges

### ❌ DON'T:

1. **Never commit** `.env` files to git
2. **Never use test keys** in production
3. **Never share** secret keys in public channels
4. **Never hardcode** API keys in source code
5. **Never expose** server-side keys to client

---

## Troubleshooting

### Issue: "Supabase client not initialized"

**Solution:**
- Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Check they don't have extra spaces or quotes
- Redeploy after setting variables

### Issue: "Stripe publishable key invalid"

**Solution:**
- Verify key starts with `pk_live_` (not `pk_test_`)
- Check key is copied completely (no truncation)
- Verify you're using the publishable key, not secret key

### Issue: "OCR/AI features not working"

**Solution:**
- Check if Google API keys are set
- Verify APIs are enabled in Google Cloud Console
- Check billing is enabled (Google requires billing even for free tier)
- Monitor quotas in Google Cloud Console

### Issue: "Environment variables not updating"

**Solution:**
- After changing variables, you MUST redeploy
- Clear browser cache and try again
- Check the deployment logs for errors

---

## Verifying Deployment

After deployment completes, verify your app:

1. **Check deployment status:**
   - Vercel dashboard → Deployments
   - Status should be "Ready"

2. **Test the app:**
   - Visit your deployment URL (e.g., `https://naturinex.vercel.app`)
   - Try signing up/signing in
   - Attempt a medication scan
   - Check payment flow

3. **Monitor errors:**
   - Vercel dashboard → Logs (realtime)
   - Sentry dashboard (if configured)
   - Browser console for client-side errors

4. **Verify environment:**
   - Open browser dev tools → Console
   - Should NOT see any API keys in source code
   - Should see "production" environment

---

## Environment-Specific Configuration

### Production Environment

```bash
# Use LIVE keys only
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
GOOGLE_VISION_API_KEY=production_key
NODE_ENV=production
```

### Preview Environment (for testing)

```bash
# Use TEST keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
GOOGLE_VISION_API_KEY=development_key
NODE_ENV=development
```

### Development Environment (local)

```bash
# Use TEST keys, local services
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NODE_ENV=development
```

---

## API Usage Monitoring

### Monitor your API usage to avoid unexpected charges:

**Supabase:**
- Dashboard → Usage
- Free tier: 500MB database, 2GB bandwidth
- Set up alerts at 80% usage

**Stripe:**
- Dashboard → Usage
- No charge for API calls, only for successful payments
- Monitor dispute rate (<0.5%)

**Google Cloud:**
- Console → Billing → Budgets & Alerts
- Vision API: Free tier 1,000 units/month
- Gemini API: Check current pricing
- Set alerts at $50, $100, $200

**Sentry:**
- Dashboard → Usage & Billing
- Free tier: 5,000 errors/month
- Upgrade if you exceed limits

---

## Next Steps After Setting Variables

1. ✅ **Verify all critical variables are set**
2. ✅ **Trigger a new deployment**
3. ✅ **Test all major features**
4. ✅ **Monitor error logs**
5. ✅ **Set up billing alerts**
6. ✅ **Document any custom variables**

---

## Support

If you encounter issues:

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Stripe Support:** https://support.stripe.com
- **Google Cloud Support:** https://cloud.google.com/support

---

**Document Version:** 1.0
**Last Updated:** January 17, 2025
**Maintained By:** Development Team
