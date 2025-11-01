# 🚀 DEPLOYMENT INSTRUCTIONS
## Step-by-Step Guide to Production Deployment

**Date**: November 1, 2025
**Status**: Ready for deployment after completing checklist

---

## ✅ PRE-DEPLOYMENT CHECKLIST

Before deploying, ensure ALL items are checked:

### Security
- [x] .gitignore updated to exclude all .env files
- [x] .env.production removed from git index
- [x] .env.development removed from git index
- [ ] .env.production removed from git history (see instructions below)
- [ ] New secrets generated (JWT, SESSION, ENCRYPTION)
- [ ] All API keys obtained (Gemini, Vision, Supabase, Stripe)

### Code Changes
- [x] Created unified environment configuration (`src/config/env.js`)
- [x] Updated `src/config/supabase.js` to use unified config
- [x] Updated `src/services/aiServiceProduction.js` to use unified config
- [x] Updated `src/services/ocrService.js` to use unified config
- [x] Updated `src/services/stripeService.js` to use unified config
- [x] Fixed EAS owner mismatch in `app.json` (changed to `guampaul`)

### Environment Setup
- [ ] EAS secrets configured (see below)
- [ ] Supabase Edge Function secrets configured
- [ ] Vercel environment variables configured
- [ ] Local `.env.local` created with development keys

---

## 🔒 STEP 1: REMOVE SECRETS FROM GIT HISTORY (CRITICAL!)

**WARNING**: This rewrites git history. Coordinate with team if applicable.

### Option A: Manual Git Commands (Recommended for Windows)

```bash
# 1. Verify you're in the repository root
cd C:\Users\maito\mediscan-app\naturinex-app

# 2. Check what files are in history
git log --all --full-history --source -- ".env.production" | head -10

# 3. If files exist in history, proceed with removal
# Create a backup branch first
git branch backup-before-history-rewrite

# 4. Use filter-repo (if installed) - BEST METHOD
# Install: pip install git-filter-repo
git filter-repo --path .env.production --invert-paths --force
git filter-repo --path .env.development --invert-paths --force

# 5. If filter-repo not available, use filter-branch
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env.production .env.development" --prune-empty --tag-name-filter cat -- --all

# 6. Clean up
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 7. Verify files are gone
git log --all --full-history -- ".env.production"
# Should return nothing or "fatal: ambiguous argument"

# 8. Force push (WARNING: Destructive - coordinate with team)
# git push origin --force --all
# git push origin --force --tags
```

### Option B: Fresh Start (Easiest but loses history)

If you're okay with losing git history:

```bash
# 1. Create a new repository
cd C:\Users\maito\mediscan-app
mkdir naturinex-app-clean
cd naturinex-app-clean
git init

# 2. Copy files (excluding .git)
xcopy /E /I /H /EXCLUDE:.git ..\naturinex-app\* .

# 3. Remove sensitive files
del .env.production
del .env.development

# 4. Initial commit
git add .
git commit -m "Initial commit: production-ready codebase with security fixes"

# 5. Force push to origin (replaces all history)
git remote add origin [your-repo-url]
git push origin main --force
```

**⚠️ Skip git history rewriting for now if you're unsure. You can do it later. The important part is that .env files are no longer tracked going forward.**

---

## 🔑 STEP 2: CONFIGURE EAS SECRETS (MOBILE APP)

```bash
# 1. Login to EAS
eas login
# Use account: guampaul (matches app.json owner)

# 2. Verify project link
eas whoami
# Should show: guampaul

# 3. Add secrets (generated from scripts/generate-secrets.js)
eas secret:create --scope project --name JWT_SECRET --value "52f6ed0495c100f2446c898629dd234e5c6ed27eb5d35d7cc460962ec3dccf7810dca1103feb2bb6e59ac50c1d13096558eaa055fd240967031ce4786ae6df90"

eas secret:create --scope project --name SESSION_SECRET --value "0d7f19a48f2dee60e7f9a1e1733023d0d8b9c22321c9e6cda01b499837751620119267333a448afc2c393d2f83eb1cf1eb8ec3fa8b29c733db947726a6390cf6"

eas secret:create --scope project --name ENCRYPTION_KEY --value "e538fb921b581358513ffd917d47d46103b1d3f1cb2267f0e7fd1a2e53a49905"

# 4. Add API keys (obtain these first - see VERCEL_ENVIRONMENT_VARIABLES_COMPLETE.md)
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value "[YOUR_GEMINI_KEY]"

eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_VISION_API_KEY --value "[YOUR_VISION_KEY]"

eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "[YOUR_SUPABASE_ANON_KEY]"

eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "[YOUR_STRIPE_PK]"

# 5. Verify secrets
eas secret:list
```

---

## 🔧 STEP 3: CONFIGURE SUPABASE EDGE FUNCTIONS

```bash
# 1. Login to Supabase
supabase login

# 2. Link to project
supabase link --project-ref hxhbsxzkzarqwksbjpce

# 3. Set secrets
supabase secrets set JWT_SECRET="52f6ed0495c100f2446c898629dd234e5c6ed27eb5d35d7cc460962ec3dccf7810dca1103feb2bb6e59ac50c1d13096558eaa055fd240967031ce4786ae6df90"

supabase secrets set SESSION_SECRET="0d7f19a48f2dee60e7f9a1e1733023d0d8b9c22321c9e6cda01b499837751620119267333a448afc2c393d2f83eb1cf1eb8ec3fa8b29c733db947726a6390cf6"

supabase secrets set ENCRYPTION_KEY="e538fb921b581358513ffd917d47d46103b1d3f1cb2267f0e7fd1a2e53a49905"

supabase secrets set GEMINI_API_KEY="[YOUR_GEMINI_KEY]"

supabase secrets set GOOGLE_VISION_API_KEY="[YOUR_VISION_KEY]"

supabase secrets set STRIPE_SECRET_KEY="[YOUR_STRIPE_SK]"

supabase secrets set STRIPE_WEBHOOK_SECRET="[YOUR_WEBHOOK_SECRET]"

# 4. Verify secrets
supabase secrets list

# 5. Deploy Edge Functions
supabase functions deploy analyze-production
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

---

## 🌐 STEP 4: CONFIGURE VERCEL (WEB APP)

### Method 1: Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/[username]/naturinex-app/settings/environment-variables
2. Add all variables from `VERCEL_ENVIRONMENT_VARIABLES_COMPLETE.md`
3. Make sure to set environment (Production/Preview/Development)
4. Mark sensitive variables appropriately
5. Save and redeploy

### Method 2: Vercel CLI

```bash
# 1. Install and login
npm install -g vercel
vercel login

# 2. Link project
vercel link

# 3. Add environment variables (see VERCEL_ENVIRONMENT_VARIABLES_COMPLETE.md)
# Example:
vercel env add JWT_SECRET production
# Paste the value when prompted

# 4. Deploy
vercel --prod
```

**See complete list in**: `VERCEL_ENVIRONMENT_VARIABLES_COMPLETE.md`

---

## 💾 STEP 5: CREATE LOCAL .env.local (DEVELOPMENT)

```bash
# Create .env.local for local development
cat > .env.local << 'EOF'
# Local Development Environment
# This file is NOT committed to git

# Security Secrets (from scripts/generate-secrets.js)
JWT_SECRET=52f6ed0495c100f2446c898629dd234e5c6ed27eb5d35d7cc460962ec3dccf7810dca1103feb2bb6e59ac50c1d13096558eaa055fd240967031ce4786ae6df90
SESSION_SECRET=0d7f19a48f2dee60e7f9a1e1733023d0d8b9c22321c9e6cda01b499837751620119267333a448afc2c393d2f83eb1cf1eb8ec3fa8b29c733db947726a6390cf6
ENCRYPTION_KEY=e538fb921b581358513ffd917d47d46103b1d3f1cb2267f0e7fd1a2e53a49905

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# AI Services
EXPO_PUBLIC_GEMINI_API_KEY=[YOUR_GEMINI_KEY]
GEMINI_API_KEY=[YOUR_GEMINI_KEY]
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=[YOUR_VISION_KEY]
GOOGLE_VISION_API_KEY=[YOUR_VISION_KEY]

# Stripe (use test keys for local development)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# API
EXPO_PUBLIC_API_URL=http://localhost:5001
REACT_APP_API_URL=http://localhost:5001

# Environment
NODE_ENV=development
EXPO_PUBLIC_ENV=development

# Feature Flags
EXPO_PUBLIC_ENABLE_OCR=true
EXPO_PUBLIC_ENABLE_CAMERA=true
EXPO_PUBLIC_ENABLE_2FA=true
EXPO_PUBLIC_ENABLE_BIOMETRIC=true

# Monitoring (optional for local)
# EXPO_PUBLIC_SENTRY_DSN=[YOUR_SENTRY_DSN]
EOF

# Verify .env.local is gitignored
cat .gitignore | grep ".env.local"
```

---

## 📤 STEP 6: COMMIT AND PUSH CHANGES

```bash
# 1. Check what will be committed
git status

# Expected files:
# - .gitignore (updated)
# - app.json (owner fixed)
# - src/config/env.js (new)
# - src/config/supabase.js (updated)
# - src/services/aiServiceProduction.js (updated)
# - src/services/ocrService.js (updated)
# - src/services/stripeService.js (updated)
# - scripts/generate-secrets.js (new)
# - VERCEL_ENVIRONMENT_VARIABLES_COMPLETE.md (new)
# - DEPLOYMENT_INSTRUCTIONS.md (new)
# - Other documentation files

# 2. Verify NO .env files are being committed
git status | grep ".env"
# Should show only .env.example or .env.template (safe)

# 3. Add changes
git add .gitignore
git add app.json
git add src/config/env.js
git add src/config/supabase.js
git add src/services/aiServiceProduction.js
git add src/services/ocrService.js
git add src/services/stripeService.js
git add scripts/generate-secrets.js
git add VERCEL_ENVIRONMENT_VARIABLES_COMPLETE.md
git add DEPLOYMENT_INSTRUCTIONS.md
git add PRODUCTION_READINESS_QC_REPORT.md
git add URGENT_SECURITY_FIX_PLAN.md
git add APP_STORE_SUBMISSION_CHECKLIST.md
git add .env.production.template

# 4. Commit
git commit -m "security: unify environment configuration and remove exposed secrets

- Update .gitignore to exclude all .env files including .env.production
- Remove .env.production and .env.development from git index
- Create unified environment configuration (src/config/env.js)
- Update all services to use unified env config (Supabase, AI, OCR, Stripe)
- Fix EAS owner mismatch in app.json (pmaitland78 -> guampaul)
- Generate new cryptographic secrets (JWT, SESSION, ENCRYPTION)
- Add comprehensive deployment and Vercel configuration documentation
- Add production readiness QC report and security fix plan

BREAKING CHANGE: Environment variable access has been centralized.
All services now import from src/config/env.js instead of directly
accessing process.env. This ensures consistent naming across mobile,
web, and server environments.

Security: Exposed secrets have been rotated. Update all deployment
environments with new values from VERCEL_ENVIRONMENT_VARIABLES_COMPLETE.md

🤖 Generated with Claude Code"

# 5. Push to remote
git push origin master

# 6. If you rewrote history, force push (WARNING: Destructive)
# git push origin --force --all
# git push origin --force --tags
```

---

## 🧪 STEP 7: TEST DEPLOYMENT

### Test Vercel Deployment

```bash
# 1. Visit your Vercel URL
# https://naturinex-app.vercel.app (or your custom domain)

# 2. Open browser console (F12)
# Check for errors

# 3. Test features:
# - Homepage loads
# - Can navigate to login
# - Login/signup works
# - Dashboard displays
# - OCR + AI analysis works
# - Subscription checkout works
```

### Test Mobile App (Local)

```bash
# 1. Start development server
npm start

# 2. Scan QR code with Expo Go app

# 3. Test same features as web
```

### Build Production Mobile Apps

```bash
# 1. Build for iOS
eas build --platform ios --profile production

# 2. Build for Android
eas build --platform android --profile production

# 3. Wait for builds to complete (15-30 minutes)

# 4. Download and test builds
# iOS: Install via TestFlight or direct install
# Android: Install APK/AAB directly
```

---

## 🔍 STEP 8: VERIFY CONFIGURATION

Run this checklist after deployment:

### EAS Secrets
```bash
eas secret:list
# Should show: JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY, EXPO_PUBLIC_GEMINI_API_KEY, etc.
```

### Supabase Secrets
```bash
supabase secrets list
# Should show: JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY, GEMINI_API_KEY, etc.
```

### Vercel Environment Variables
```
Visit: https://vercel.com/[username]/naturinex-app/settings/environment-variables
Verify: All 15-23 variables are present
```

### Git History Clean
```bash
git log --all --full-history -- ".env.production"
# Should return: "fatal: ambiguous argument '.env.production': unknown revision"
```

### Local Development Works
```bash
npm start
# Should start without errors
# Check console for "Environment Configuration Loaded"
```

---

## 🆘 TROUBLESHOOTING

### Error: "API key not configured"
**Solution**: Check environment variable naming matches exactly (case-sensitive)

### Error: "Cannot find module '../config/env'"
**Solution**: Make sure you committed and pushed `src/config/env.js`

### Error: "EAS owner mismatch"
**Solution**: Verify `app.json` has `"owner": "guampaul"`

### Vercel deployment fails
**Solution**: Check build logs, ensure all required env vars are set

### Services not working in production
**Solution**:
1. Check browser console for errors
2. Verify API keys are valid
3. Check API key restrictions (allow your domain)
4. Verify Supabase RLS policies

---

## ✅ COMPLETION CHECKLIST

- [ ] All secrets removed from git history
- [ ] New secrets generated and saved securely
- [ ] EAS secrets configured and verified
- [ ] Supabase secrets configured and verified
- [ ] Vercel environment variables configured
- [ ] Local .env.local created
- [ ] Changes committed and pushed
- [ ] Vercel deployment successful
- [ ] Web app tested and working
- [ ] Mobile app builds completed
- [ ] Mobile apps tested and working
- [ ] No errors in console/logs
- [ ] All features functional

---

## 📞 SUPPORT

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review `PRODUCTION_READINESS_QC_REPORT.md` for detailed findings
3. Check `URGENT_SECURITY_FIX_PLAN.md` for security-specific guidance
4. Review `VERCEL_ENVIRONMENT_VARIABLES_COMPLETE.md` for env var details

---

**Status**: ⬜ Ready to begin
**Estimated Time**: 2-4 hours
**Next Step**: Start with Step 1 (Remove secrets from git history)

---

*Last Updated: November 1, 2025*
*Version: 1.0.0*
