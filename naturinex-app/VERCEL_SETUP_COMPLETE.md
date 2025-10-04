# ✅ Vercel Environment Configuration - Complete Guide

## 🎯 Current Status

You've added many environment variables to Vercel, but there are **3 CRITICAL missing variables** and **7 DANGEROUS server secrets** that need to be removed.

---

## 🚨 CRITICAL ACTIONS REQUIRED

### ❌ Step 1: ADD THESE MISSING VARIABLES (CRITICAL!)

**Without these, your database won't connect:**

```bash
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<GET FROM SUPABASE DASHBOARD>
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
```

**How to get Supabase Anon Key:**
1. Go to https://supabase.com/dashboard
2. Select your project: `naturinex-app`
3. Settings → API
4. Copy the "anon public" key (starts with `eyJhb...`)

### 🔐 Step 2: REMOVE THESE DANGEROUS VARIABLES (SECURITY RISK!)

**These are server-side secrets and should NEVER be in your frontend:**

```bash
❌ DELETE: STRIPE_SECRET_KEY
❌ DELETE: STRIPE_WEBHOOK_SECRET
❌ DELETE: FIREBASE_PRIVATE_KEY
❌ DELETE: ADMIN_SECRET
❌ DELETE: DATA_ENCRYPTION_KEY
❌ DELETE: GEMINI_API_KEY
❌ DELETE: GOOGLE_VISION_API_KEY
```

**⚠️ CRITICAL:** Having these in your frontend exposes them to all users who visit your site!

### 🧹 Step 3: REMOVE DUPLICATE VARIABLES

**You have these listed twice - keep only one:**

```bash
❌ DELETE: FIREBASE_API_KEY (keep REACT_APP_FIREBASE_API_KEY)
❌ DELETE: FIREBASE_PROJECT_ID (keep REACT_APP_FIREBASE_PROJECT_ID)
❌ DELETE: One duplicate of REACT_APP_FIREBASE_APP_ID
❌ DELETE: One duplicate of REACT_APP_NAME
```

---

## ✅ CORRECT FINAL CONFIGURATION

### Frontend Variables (Vercel) - KEEP THESE:

```bash
# Firebase Auth (✅ You have these)
REACT_APP_FIREBASE_API_KEY=<your_value>
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=398613963385
REACT_APP_FIREBASE_APP_ID=1:398613963385:web:91b3c8e67976c252f0aaa8
REACT_APP_FIREBASE_MEASUREMENT_ID=G-04VE09YVEC

# Database (❌ YOU NEED TO ADD THESE)
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<get_from_supabase>

# API (✅ You have this)
REACT_APP_API_URL=https://naturinex-app-zsga.onrender.com
REACT_APP_API_URL_SUPABASE=<optional>

# Stripe (✅ You have PUBLISHABLE, ⚠️ ADD KEY as well)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05

# Build Configuration (✅ You have these)
NODE_ENV=production
GENERATE_SOURCEMAP=false
CI=false

# Optional
REACT_APP_FRONTEND_URL=<your_vercel_url>
CACHE_ENABLED=true
```

### Total Variables After Cleanup: **18 variables** (down from 30+)

---

## 📊 What Each Variable Does

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase authentication | ✅ Critical |
| `REACT_APP_SUPABASE_URL` | Database connection | ✅ Critical |
| `REACT_APP_SUPABASE_ANON_KEY` | Database authentication | ✅ Critical |
| `REACT_APP_STRIPE_KEY` | Payment processing | ✅ For payments |
| `REACT_APP_API_URL` | Backend API endpoint | ✅ Critical |
| `NODE_ENV` | Environment mode | ✅ Critical |
| `GENERATE_SOURCEMAP` | Build optimization | ⚠️ Recommended |
| All others | See code comments | Optional |

---

## 🧪 Testing After Configuration

### Option 1: Test on Vercel (Recommended)

After you add the missing variables to Vercel:

1. Redeploy your app (Vercel → Deployments → Redeploy)
2. Visit your deployed URL
3. Check browser console for errors
4. Try:
   - Login/Signup
   - Search for a medication
   - View your profile

### Option 2: Local Test (Quick Check)

Create a `.env.local` file in your project root:

```bash
# Copy from .env.example and fill in real values
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your_key>
REACT_APP_FIREBASE_API_KEY=<your_key>
# ... etc
```

Then run:

```bash
node test-database-local.js
```

This will verify:
- ✅ Database connection
- ✅ Read/write operations
- ✅ Authentication service
- ✅ API health

---

## 🎯 Expected Results After Fix

### ✅ What Will Work:

1. **Authentication**
   - ✅ Email/password signup
   - ✅ Google OAuth login
   - ✅ Session management
   - ✅ 2FA (if enabled)

2. **Database**
   - ✅ User profiles saved
   - ✅ Medication scans stored
   - ✅ Scan history retrievable
   - ✅ Real-time updates

3. **Payments**
   - ✅ Stripe checkout
   - ✅ Subscription management
   - ✅ Payment history

4. **Security**
   - ✅ No exposed secrets
   - ✅ HTTPS enforced
   - ✅ CORS configured
   - ✅ Rate limiting active

### ❌ What Won't Work (Until Backend Deployed):

1. **Medication Analysis**
   - API endpoint: `/api/analyze/name`
   - Status: 404 (backend not deployed)
   - Solution: Deploy your backend to Render/Supabase

2. **AI Features**
   - Requires backend with Gemini/Vision API
   - Currently returns 404

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `REACT_APP_*` variables in Vercel (frontend)
- Use environment-specific configs
- Rotate keys regularly
- Monitor access logs

### ❌ DON'T:
- Put `STRIPE_SECRET_KEY` in frontend
- Expose `FIREBASE_PRIVATE_KEY`
- Store `ADMIN_SECRET` in browser
- Commit secrets to git

---

## 📝 Step-by-Step Vercel Configuration

### Detailed Instructions:

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your `naturinex-app` project

2. **Navigate to Settings**
   - Click "Settings" tab
   - Click "Environment Variables"

3. **Add Missing Variables**
   ```
   Name: REACT_APP_SUPABASE_URL
   Value: https://hxhbsxzkzarqwksbjpce.supabase.co
   Environment: Production ✓

   Name: REACT_APP_SUPABASE_ANON_KEY
   Value: <paste your anon key from Supabase>
   Environment: Production ✓

   Name: REACT_APP_STRIPE_KEY
   Value: pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
   Environment: Production ✓
   ```

4. **Delete Dangerous Variables**
   - Find each dangerous variable
   - Click the three dots (...)
   - Click "Delete"
   - Confirm deletion

5. **Redeploy**
   - Go to "Deployments" tab
   - Click three dots on latest deployment
   - Click "Redeploy"
   - Wait 2-3 minutes

6. **Test**
   - Visit your deployed URL
   - Open browser console (F12)
   - Check for errors
   - Try authentication

---

## 🆘 Troubleshooting

### Issue: "Failed to fetch" when searching medications

**Cause:** Backend API not responding
**Solution:**
1. Check if backend is deployed: https://naturinex-app-zsga.onrender.com/health
2. If 404, deploy your backend to Render
3. Update `REACT_APP_API_URL` if backend URL changed

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Cause:** Wrong Firebase API key
**Solution:**
1. Go to Firebase Console
2. Project Settings → General → Web apps
3. Copy the correct API key
4. Update `REACT_APP_FIREBASE_API_KEY` in Vercel

### Issue: "Supabase client error: Invalid JWT"

**Cause:** Wrong Supabase anon key
**Solution:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the "anon public" key (NOT service_role)
4. Update `REACT_APP_SUPABASE_ANON_KEY`

### Issue: Database queries return "insufficient privileges"

**Cause:** Row Level Security (RLS) is working correctly!
**Solution:** This is expected - users need to be authenticated to access data

---

## 📊 Verification Checklist

After making changes, verify:

- [ ] Added `REACT_APP_SUPABASE_URL`
- [ ] Added `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Added `REACT_APP_STRIPE_KEY`
- [ ] Deleted `STRIPE_SECRET_KEY`
- [ ] Deleted `FIREBASE_PRIVATE_KEY`
- [ ] Deleted `ADMIN_SECRET`
- [ ] Deleted `DATA_ENCRYPTION_KEY`
- [ ] Deleted `GEMINI_API_KEY`
- [ ] Deleted `GOOGLE_VISION_API_KEY`
- [ ] Deleted duplicate variables
- [ ] Redeployed on Vercel
- [ ] Tested authentication
- [ ] Tested database read
- [ ] Checked browser console (no errors)

---

## 🎉 Success Criteria

Your setup is correct when:

1. ✅ No Firebase errors in console
2. ✅ No Supabase connection errors
3. ✅ Can sign up / log in
4. ✅ Can view profile
5. ✅ Can save medication scans
6. ✅ No exposed secrets in browser dev tools
7. ✅ All security headers present

---

## 📞 Next Steps

1. **Immediate (Required):**
   - Add 3 missing variables to Vercel
   - Remove 7 dangerous server secrets
   - Redeploy

2. **Soon (Recommended):**
   - Deploy backend API to Render
   - Test end-to-end medication analysis
   - Set up monitoring (Sentry)

3. **Later (Optional):**
   - Add Redis for caching
   - Configure CDN
   - Enable real-time features

---

## 📚 Documentation References

- `VERCEL_ENV_CHECKLIST.md` - Detailed variable breakdown
- `PRODUCTION_QC_REPORT.md` - Full security audit
- `test-database-local.js` - Local connectivity test
- `test-vercel-deployment.js` - Production test suite

---

**Last Updated:** 2025-01-04
**Status:** Awaiting environment variable configuration
**Next Action:** Add missing Supabase credentials to Vercel

---

## 💡 Quick Reference

**Minimum variables for app to work:**
```
REACT_APP_FIREBASE_API_KEY=<your_key>
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your_key>
REACT_APP_STRIPE_KEY=pk_live_...
NODE_ENV=production
```

**That's it!** Just 5 critical variables to get started.
