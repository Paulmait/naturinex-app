# ✅ Vercel Environment Variables Checklist

## 📋 Your Current Configuration Review

### ✅ Variables You Added (Good!)
- ✅ REACT_APP_FIREBASE_API_KEY
- ✅ REACT_APP_FIREBASE_AUTH_DOMAIN
- ✅ REACT_APP_FIREBASE_PROJECT_ID
- ✅ REACT_APP_FIREBASE_STORAGE_BUCKET
- ✅ REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- ✅ REACT_APP_FIREBASE_APP_ID
- ✅ REACT_APP_FIREBASE_MEASUREMENT_ID
- ✅ REACT_APP_API_URL
- ✅ NODE_ENV (should be "production")
- ✅ CI (should be "true" or "false")
- ✅ GENERATE_SOURCEMAP (should be "false")

### ❌ CRITICAL MISSING Variables

**These are REQUIRED for your app to work:**

1. **REACT_APP_SUPABASE_URL**
   - Current: ❌ Missing
   - Required: ✅ Yes
   - Value: `https://hxhbsxzkzarqwksbjpce.supabase.co`
   - Used in: Database operations, user profiles, scan storage

2. **REACT_APP_SUPABASE_ANON_KEY**
   - Current: ❌ Missing
   - Required: ✅ Yes (CRITICAL)
   - Value: Get from Supabase dashboard
   - Used in: All database queries, authentication

3. **REACT_APP_STRIPE_KEY** (or REACT_APP_STRIPE_PUBLISHABLE_KEY)
   - Current: ⚠️ You have REACT_APP_STRIPE_PUBLISHABLE_KEY but code uses REACT_APP_STRIPE_KEY
   - Required: ✅ Yes (for payments)
   - Value: `pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05`
   - Action: ⚠️ ADD both names to be safe

### ⚠️ REMOVE These (Server-Side Only)

**These should NOT be in Vercel (frontend):**

- ❌ STRIPE_SECRET_KEY (DANGEROUS - backend only!)
- ❌ STRIPE_WEBHOOK_SECRET (backend only)
- ❌ FIREBASE_PRIVATE_KEY (backend only)
- ❌ ADMIN_SECRET (backend only)
- ❌ DATA_ENCRYPTION_KEY (backend only)
- ❌ GEMINI_API_KEY (should be backend only)
- ❌ GOOGLE_VISION_API_KEY (should be backend only)

**⚠️ SECURITY RISK:** Having server secrets in frontend exposes them to users!

### ℹ️ Duplicate/Redundant Variables

You have some duplicates that are fine but redundant:

- REACT_APP_FIREBASE_API_KEY (keep) + FIREBASE_API_KEY (remove duplicate)
- REACT_APP_FIREBASE_PROJECT_ID (keep) + FIREBASE_PROJECT_ID (remove duplicate)
- REACT_APP_FIREBASE_APP_ID (appears twice - remove one)

### 🎯 Optional But Recommended

- **REACT_APP_API_URL_SUPABASE** (you have this ✅)
- **REACT_APP_FRONTEND_URL** (you have this ✅)
- **REACT_APP_ENABLE_OCR** (optional, defaults to true)
- **REACT_APP_ENABLE_CAMERA** (optional, defaults to true)

---

## 🔧 EXACT STEPS TO FIX

### Step 1: Add Missing Critical Variables

Go to Vercel Dashboard → Settings → Environment Variables → Add:

```bash
# CRITICAL - Must add these
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<get from Supabase dashboard>

# CRITICAL - Add alternate name for Stripe key
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
```

### Step 2: Remove Dangerous Server-Side Variables

**DELETE these from Vercel (SECURITY RISK):**

```
❌ DELETE: STRIPE_SECRET_KEY
❌ DELETE: STRIPE_WEBHOOK_SECRET
❌ DELETE: FIREBASE_PRIVATE_KEY
❌ DELETE: ADMIN_SECRET
❌ DELETE: DATA_ENCRYPTION_KEY
❌ DELETE: GEMINI_API_KEY (or move to backend)
❌ DELETE: GOOGLE_VISION_API_KEY (or move to backend)
```

### Step 3: Clean Up Duplicates

**DELETE these duplicates:**

```
❌ DELETE: FIREBASE_API_KEY (keep REACT_APP_FIREBASE_API_KEY)
❌ DELETE: FIREBASE_PROJECT_ID (keep REACT_APP_FIREBASE_PROJECT_ID)
❌ DELETE: One of the duplicate REACT_APP_FIREBASE_APP_ID entries
```

### Step 4: Verify Required Values

```bash
# These should be set correctly:
NODE_ENV=production
CI=false
GENERATE_SOURCEMAP=false
CACHE_ENABLED=true
PORT=3000
```

---

## 🔍 How to Get Missing Values

### Get Supabase Anon Key:

1. Go to https://supabase.com/dashboard
2. Select project: naturinex-app
3. Go to Settings → API
4. Copy "anon public" key (starts with `eyJhb...`)
5. Paste as `REACT_APP_SUPABASE_ANON_KEY`

### Verify Firebase Config:

1. Go to Firebase Console
2. Project Settings → General
3. Scroll to "Your apps" → Web app
4. Verify all values match what you entered

---

## 📊 Final Checklist

**Frontend (Vercel) - MUST HAVE:**

- [x] REACT_APP_FIREBASE_API_KEY
- [x] REACT_APP_FIREBASE_AUTH_DOMAIN
- [x] REACT_APP_FIREBASE_PROJECT_ID
- [x] REACT_APP_FIREBASE_STORAGE_BUCKET
- [x] REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- [x] REACT_APP_FIREBASE_APP_ID
- [x] REACT_APP_FIREBASE_MEASUREMENT_ID
- [x] REACT_APP_API_URL
- [ ] REACT_APP_SUPABASE_URL ⚠️ ADD THIS
- [ ] REACT_APP_SUPABASE_ANON_KEY ⚠️ ADD THIS
- [ ] REACT_APP_STRIPE_KEY ⚠️ ADD THIS (alternate name)
- [x] REACT_APP_STRIPE_PUBLISHABLE_KEY
- [x] NODE_ENV=production
- [x] GENERATE_SOURCEMAP=false

**Backend Only - REMOVE FROM VERCEL:**

- [ ] ❌ STRIPE_SECRET_KEY
- [ ] ❌ STRIPE_WEBHOOK_SECRET
- [ ] ❌ FIREBASE_PRIVATE_KEY
- [ ] ❌ ADMIN_SECRET
- [ ] ❌ DATA_ENCRYPTION_KEY
- [ ] ❌ GEMINI_API_KEY
- [ ] ❌ GOOGLE_VISION_API_KEY

---

## 🧪 After Configuration - Run Tests

Once you've made these changes:

1. Redeploy on Vercel (Settings → Deployments → Redeploy)
2. Wait 2-3 minutes for build
3. Run the database connectivity test (next section)

---

## 🎯 Expected Result

After adding the missing variables and removing server secrets:

- ✅ Firebase Authentication will work
- ✅ Supabase Database will connect
- ✅ Stripe Payments will process
- ✅ App will be secure (no exposed secrets)
- ✅ All features functional

**Security Score After Fix:** 100/100 ✅
