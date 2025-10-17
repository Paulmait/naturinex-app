# Vercel Quick Setup Guide

**⚡ Fast setup for Vercel deployment**

---

## 🚨 Critical Variables (Required)

Copy these into Vercel → Settings → Environment Variables → **Production**

```bash
# Supabase (Required)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key

# Stripe (Required)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...your_key
```

**Where to get these:**
- Supabase: https://app.supabase.com → Your Project → Settings → API
- Stripe: https://dashboard.stripe.com → Developers → API Keys (LIVE MODE)

---

## ⚙️ Optional Variables (Recommended)

```bash
# Google Cloud APIs (enables OCR & AI)
GOOGLE_VISION_API_KEY=AIza...your_vision_key
GOOGLE_GEMINI_API_KEY=AIza...your_gemini_key

# Sentry (error monitoring)
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# App Config
NODE_ENV=production
EXPO_PUBLIC_VERSION=1.0.0
```

---

## ✅ Quick Verification

After setting variables in Vercel:

1. **Trigger redeploy:**
   - Vercel Dashboard → Deployments → Latest → ••• → Redeploy
   - Or push a new commit to GitHub

2. **Check deployment:**
   - Wait for "Ready" status
   - Visit your deployment URL

3. **Test app:**
   - Try signing up
   - Attempt a scan
   - Verify no console errors

---

## 🔍 What to Check in Vercel Dashboard

**Settings → Environment Variables:**

You should see these variables (values hidden for security):

- ✅ EXPO_PUBLIC_SUPABASE_URL
- ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY
- ✅ EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
- ⚠️ GOOGLE_VISION_API_KEY (optional)
- ⚠️ GOOGLE_GEMINI_API_KEY (optional)
- ⚠️ EXPO_PUBLIC_SENTRY_DSN (optional)

**Deployments:**

Latest deployment should show:
- Status: ✅ Ready
- Duration: ~2-3 minutes
- No build errors

---

## 🚨 Common Issues

### "Build failed"
- Check Vercel build logs
- Verify all dependencies in package.json
- Check for syntax errors

### "App not loading"
- Verify SUPABASE variables are set
- Check browser console for errors
- Verify environment is "Production"

### "Stripe not working"
- Make sure using `pk_live_` not `pk_test_`
- Verify key is for correct Stripe account
- Check Stripe Dashboard for errors

---

## 📋 Current Deployment Status

**Last Commit:** `8e5fd1d66`
**Branch:** master
**Auto-Deploy:** ✅ Enabled (GitHub → Vercel)
**Status:** Should be deploying now...

**Check deployment:**
https://vercel.com/[your-username]/naturinex-app

---

## 🎯 Next Actions

1. ⚡ **Right Now:**
   - [ ] Go to Vercel Dashboard
   - [ ] Set the 3 critical environment variables
   - [ ] Trigger redeploy (or wait for auto-deploy)

2. 📊 **Within 24 Hours:**
   - [ ] Set optional Google Cloud variables
   - [ ] Set up Sentry monitoring
   - [ ] Test all features

3. 🚀 **Before Launch:**
   - [ ] Legal review complete
   - [ ] Run database migrations
   - [ ] Configure Stripe webhooks
   - [ ] Sign BAAs with vendors

---

**Need detailed instructions?** See `VERCEL_ENVIRONMENT_VARIABLES.md`
