# 🚨 URGENT SECURITY FIX PLAN
## Critical Actions Required Before App Store Submission

**Date**: November 1, 2025
**Priority**: CRITICAL - DO NOT SUBMIT WITHOUT COMPLETING
**Estimated Time**: 4-6 hours

---

## ⚠️ THE PROBLEM

Your production secrets are **exposed in git repository**:
- `JWT_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- Supabase project URL

**File**: `.env.production` (committed on Sep 22, 2025)

**Risk**: Anyone with access to the repository can:
- Forge authentication tokens
- Decrypt user data
- Impersonate any user
- Access your database

---

## ✅ THE SOLUTION (Step-by-Step)

### Step 1: Generate New Secrets (10 minutes)

Run these commands to generate new secure secrets:

```bash
# Navigate to your project
cd C:\Users\maito\mediscan-app\naturinex-app

# Generate new JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate new session secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate new encryption key
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Save these values** - you'll need them in the next steps!

---

### Step 2: Update Environment Variables (30 minutes)

#### A. Update EAS Secrets
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Set new secrets (replace with your generated values)
eas secret:create --scope project --name JWT_SECRET --value "YOUR_NEW_JWT_SECRET"
eas secret:create --scope project --name SESSION_SECRET --value "YOUR_NEW_SESSION_SECRET"
eas secret:create --scope project --name ENCRYPTION_KEY --value "YOUR_NEW_ENCRYPTION_KEY"

# Verify secrets were set
eas secret:list
```

#### B. Update Supabase Edge Functions
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref hxhbsxzkzarqwksbjpce

# Set secrets for Edge Functions
supabase secrets set JWT_SECRET="YOUR_NEW_JWT_SECRET"
supabase secrets set SESSION_SECRET="YOUR_NEW_SESSION_SECRET"
supabase secrets set ENCRYPTION_KEY="YOUR_NEW_ENCRYPTION_KEY"

# Verify
supabase secrets list
```

#### C. Update Vercel/Render (if using)
```bash
# Visit your deployment dashboard:
# - Vercel: https://vercel.com/[username]/[project]/settings/environment-variables
# - Render: https://dashboard.render.com/web/[service-id]/env

# Update these variables:
# - JWT_SECRET
# - SESSION_SECRET
# - ENCRYPTION_KEY
```

#### D. Update Local Development
```bash
# Create/update .env.local (NOT tracked in git)
echo "JWT_SECRET=YOUR_NEW_JWT_SECRET" > .env.local
echo "SESSION_SECRET=YOUR_NEW_SESSION_SECRET" >> .env.local
echo "ENCRYPTION_KEY=YOUR_NEW_ENCRYPTION_KEY" >> .env.local
echo "EXPO_PUBLIC_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co" >> .env.local
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY" >> .env.local
```

---

### Step 3: Remove Secrets from Git History (45 minutes)

#### Option A: Using BFG Repo-Cleaner (Recommended - Faster)

```bash
# 1. Download BFG
# Visit: https://rtyley.github.io/bfg-repo-cleaner/
# Download bfg.jar

# 2. Create a backup
cd C:\Users\maito\mediscan-app
git clone naturinex-app naturinex-app-backup

# 3. Run BFG
cd naturinex-app
java -jar path\to\bfg.jar --delete-files .env.production

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (WARNING: coordinate with team)
git push origin --force --all
git push origin --force --tags
```

#### Option B: Using git filter-branch (Slower, but works everywhere)

```bash
# 1. Create a backup
cd C:\Users\maito\mediscan-app
git clone naturinex-app naturinex-app-backup

# 2. Filter out the file
cd naturinex-app
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env.production" --prune-empty --tag-name-filter cat -- --all

# 3. Clean up refs
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push (WARNING: coordinate with team)
git push origin --force --all
git push origin --force --tags
```

---

### Step 4: Update .gitignore (5 minutes)

Verify your `.gitignore` includes:

```bash
# Check current .gitignore
cat .gitignore | grep -E "\.env"

# Should see:
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production
```

If `.env.production` is not there, add it:

```bash
echo "" >> .gitignore
echo "# Production environment files (NEVER commit)" >> .gitignore
echo ".env.production" >> .gitignore
```

---

### Step 5: Delete Local .env.production File (1 minute)

```bash
# Delete the file (it's no longer needed)
del .env.production

# Or if you want to keep a template:
mv .env.production .env.production.template
# Then manually remove all actual values, leaving only placeholders
```

---

### Step 6: Verify the Fix (15 minutes)

```bash
# 1. Check git history for .env.production
git log --all --full-history -- .env.production
# Should return: "fatal: ambiguous argument '.env.production': unknown revision or path"

# 2. Search all commits for secrets
git log --all -p | grep -i "jwt_secret"
# Should return nothing or only references in .env.example

# 3. Verify EAS secrets
eas secret:list

# 4. Verify Supabase secrets
supabase secrets list

# 5. Test the app locally
npm start
```

---

### Step 7: Obtain Missing API Keys (1-2 hours)

You're missing these critical keys:

#### A. Google Gemini API Key
```bash
# 1. Visit: https://makersuite.google.com/app/apikey
# 2. Sign in with Google account
# 3. Create new API key
# 4. Save it securely

# 5. Add to EAS
eas secret:create --scope project --name GEMINI_API_KEY --value "AIza..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value "AIza..."

# 6. Add to Supabase
supabase secrets set GEMINI_API_KEY="AIza..."
```

#### B. Google Vision API Key
```bash
# 1. Visit: https://console.cloud.google.com/apis/credentials
# 2. Create new credentials > API key
# 3. Restrict to Vision API only
# 4. Save it securely

# 5. Add to EAS
eas secret:create --scope project --name GOOGLE_VISION_API_KEY --value "YOUR_KEY"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_VISION_API_KEY --value "YOUR_KEY"

# 6. Add to Supabase
supabase secrets set GOOGLE_VISION_API_KEY="YOUR_KEY"
```

#### C. Supabase Keys
```bash
# 1. Visit: https://supabase.com/dashboard/project/hxhbsxzkzarqwksbjpce/settings/api
# 2. Copy "anon" key (public)
# 3. Copy "service_role" key (secret)

# 4. Add to EAS
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY"
eas secret:create --scope project --name SUPABASE_SERVICE_ROLE_KEY --value "YOUR_SERVICE_ROLE_KEY" --type sensitive

# 5. Add to Supabase Edge Functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

#### D. Sentry DSN (Optional but recommended)
```bash
# 1. Visit: https://sentry.io/
# 2. Create account/project
# 3. Get DSN from project settings

# 4. Add to EAS
eas secret:create --scope project --name SENTRY_DSN --value "https://...@sentry.io/..."

# 5. Add to local .env.local
echo "SENTRY_DSN=https://...@sentry.io/..." >> .env.local
```

---

### Step 8: Host Legal Documents (30 minutes)

Your privacy policy and terms need to be publicly accessible.

#### Option A: GitHub Pages (Free, Easy)

```bash
# 1. Create a new branch for legal docs
git checkout --orphan legal-docs
git rm -rf .

# 2. Copy legal files
copy legal\privacy-policy-enhanced.html index.html
copy legal\terms-of-service-enhanced.html terms.html

# 3. Create a simple index
echo "<h1>Naturinex Legal Documents</h1><ul><li><a href='index.html'>Privacy Policy</a></li><li><a href='terms.html'>Terms of Service</a></li></ul>" > landing.html

# 4. Commit and push
git add .
git commit -m "Add legal documents"
git push origin legal-docs

# 5. Enable GitHub Pages
# Go to: https://github.com/[username]/naturinex-app/settings/pages
# Source: legal-docs branch
# Save

# 6. Your URLs will be:
# https://[username].github.io/naturinex-app/index.html (Privacy Policy)
# https://[username].github.io/naturinex-app/terms.html (Terms of Service)
```

#### Option B: Firebase Hosting (Already configured)

```bash
# 1. Copy legal files to public directory
copy legal\privacy-policy-enhanced.html public\privacy-policy.html
copy legal\terms-of-service-enhanced.html public\terms-of-service.html

# 2. Deploy to Firebase
firebase deploy --only hosting

# 3. Your URLs will be:
# https://naturinex-app.web.app/privacy-policy.html
# https://naturinex-app.web.app/terms-of-service.html
```

---

### Step 9: Test Everything (1-2 hours)

```bash
# 1. Test authentication
npm start
# - Try signup
# - Try login
# - Try password reset

# 2. Test OCR + AI
# - Take photo of medication
# - Verify OCR extracts text
# - Verify AI returns alternatives
# - Check for medical disclaimers

# 3. Test payments
# - Try Plus subscription checkout
# - Use test card: 4242 4242 4242 4242
# - Verify webhook processes
# - Check user tier updated

# 4. Test on real devices
# iOS:
eas build --platform ios --profile preview
# Install on device via TestFlight or internal distribution

# Android:
eas build --platform android --profile preview
# Install APK on device
```

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

- [ ] New secrets generated and saved securely
- [ ] EAS secrets updated (`eas secret:list`)
- [ ] Supabase secrets updated (`supabase secrets list`)
- [ ] Vercel/Render secrets updated (if applicable)
- [ ] .env.production removed from git history
- [ ] .env.production deleted locally (or made template)
- [ ] .gitignore updated to prevent future commits
- [ ] Git history clean (`git log --all -p | grep -i "jwt_secret"` returns nothing)
- [ ] Gemini API key obtained and configured
- [ ] Vision API key obtained and configured
- [ ] Supabase keys configured
- [ ] Sentry DSN configured (optional)
- [ ] Privacy policy publicly accessible
- [ ] Terms of service publicly accessible
- [ ] Authentication tested (signup, login, reset)
- [ ] OCR + AI tested (real medication images)
- [ ] Payment flow tested (Stripe checkout, webhook)
- [ ] App tested on real iOS device
- [ ] App tested on real Android device

---

## 🎯 TIMELINE

| Step | Time | Status |
|------|------|--------|
| Generate new secrets | 10 min | ⬜ |
| Update environment variables | 30 min | ⬜ |
| Remove from git history | 45 min | ⬜ |
| Update .gitignore | 5 min | ⬜ |
| Delete local file | 1 min | ⬜ |
| Verify the fix | 15 min | ⬜ |
| Obtain missing API keys | 1-2 hours | ⬜ |
| Host legal documents | 30 min | ⬜ |
| Test everything | 1-2 hours | ⬜ |
| **Total** | **4-6 hours** | |

---

## 🆘 IF YOU NEED HELP

### Common Issues

**Q: BFG/filter-branch isn't working**
A: Make sure you have a backup first, then try the other method. If both fail, consider creating a fresh repository and copying clean code.

**Q: Force push is scary**
A: It is! That's why we create backups. If this is a team project, coordinate with your team first. Everyone will need to re-clone the repository.

**Q: I don't have access to generate new Supabase keys**
A: You'll need admin access to your Supabase project. Check your email for invitation or contact your team lead.

**Q: Tests are failing after secret rotation**
A: Verify that all environment variables are set correctly in all environments (EAS, Supabase, local).

---

## ⚠️ IMPORTANT NOTES

1. **Backup Everything**: Before making any changes, backup your repository
2. **Coordinate with Team**: If others are working on this project, notify them before force pushing
3. **Test Thoroughly**: After rotation, test all features to ensure nothing broke
4. **Don't Rush**: Take your time to do this correctly. Mistakes can cause data loss.
5. **Document Changes**: Keep notes on what you changed and when

---

## 📞 SUPPORT

If you encounter issues:
1. Check the backup you created
2. Review error messages carefully
3. Search GitHub/StackOverflow for specific errors
4. Consider hiring a security consultant if unsure

---

**Status**: ⬜ NOT STARTED

**Next Action**: Start with Step 1 - Generate new secrets

**Good luck! You've got this! 💪**
