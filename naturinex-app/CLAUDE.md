# Claude Code Continuation Guide

**Project:** Naturinex - Natural Medication Alternatives App
**Last Session:** January 27, 2026
**Branch:** master

---

## Quick Context

Naturinex is a mobile/web app that helps users find natural alternatives to medications. Users scan or input medication names, and the app provides natural alternatives with research-backed information.

### Tech Stack
- **Mobile:** React Native + Expo
- **Web:** React (CRA with CRACO) + Material-UI
- **Backend:** Node.js on Render + Supabase Edge Functions
- **Database:** Supabase (PostgreSQL with RLS)
- **Auth:** Firebase
- **Payments:** Apple IAP (iOS) + Stripe (Web/Android)
- **AI:** Google Gemini API (via backend - keys stay server-side)

---

## Current State (January 27, 2026)

### Production Readiness: 8.5/10 - READY ✅

**Completed:**
- ✅ API keys removed from code (rotated by user)
- ✅ Environment validation at startup with error screen
- ✅ Console.log removed in production (Babel plugin)
- ✅ AI services documented (demo vs production)
- ✅ Rate limiting verified server-side
- ✅ Database pricing fixed (Free: 3/mo, Premium: 25/mo)
- ✅ GitHub Actions simplified and working
- ✅ Scan logging for AI/LLM training

**Pending:**
- ⚠️ Vercel deployment needs environment variables configured
- ⚠️ EAS build to verify (started, check status below)

---

## Pending Tasks for Next Session

### 1. Vercel Environment Variables
The Vercel deployment is failing because environment variables are not set in the Vercel dashboard.

**Add these in Vercel Project Settings → Environment Variables:**
```
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<from Supabase dashboard>
REACT_APP_FIREBASE_API_KEY=<from Firebase console>
REACT_APP_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<your-project-id>
REACT_APP_API_URL=https://naturinex-app-zsga.onrender.com
REACT_APP_STRIPE_KEY=<your-publishable-key>
```

### 2. Check EAS Build Status
**Build URL:** https://expo.dev/accounts/guampaul/projects/naturinex/builds/a42815d0-8b93-4c50-8cac-061805b9df9b

If build succeeded, install on iPhone for testing.

### 3. Test Real AI Flow
- Open preview build on iPhone
- Perform a scan with real medication
- Verify results come from Gemini API (not demo data)
- Check Supabase `scans` and `ai_training_data` tables for logged data

---

## Recent Changes (Jan 27, 2026)

### Security Hardening
- `src/config/env.js` - Added `validateClientConfig()`, `validateServerConfig()`, `performStartupValidation()`
- `src/components/AppLaunchGate.js` - Shows user-friendly error screen if config missing
- `babel.config.js` - Added `babel-plugin-transform-remove-console` for production

### AI Service Documentation
- `src/services/aiService.js` - Marked as **DEMO/TEST ONLY**
- `src/services/aiServiceProduction.js` - Marked as **DEPRECATED** (exposes API key)
- `src/services/aiServiceSecure.js` - Marked as **RECOMMENDED** (uses Edge Functions)

### Database Migrations
- `supabase/migrations/20260127_fix_subscription_tiers.sql` - Fixed tier limits to match pricing.js

### GitHub Actions
- `.github/workflows/deploy.yml` - Simplified to basic build/test/mobile flow
- `.github/workflows/comprehensive-testing.yml` - Simplified to just run tests

---

## Key Files

### Configuration
- `src/config/pricing.js` - Subscription tiers and limits
- `src/config/env.js` - Environment loading + validation
- `.env.template` - Required environment variables
- `firebaseConfig.js` - Firebase configuration
- `app.json` / `eas.json` - Expo/EAS Build configuration
- `babel.config.js` - Console removal in production

### AI & OCR Services
- `src/services/aiServiceSecure.js` - **USE THIS** - Via Supabase Edge Functions
- `src/services/aiService.js` - Demo/test only (mock data)
- `src/services/ocrService.js` - Google Cloud Vision OCR

### Security & Billing
- `src/services/AccountSecurityService.js` - Device tracking
- `src/services/ScreenshotProtectionService.js` - Screenshot blocking
- `src/services/rateLimiter.js` - Client-side UX (real enforcement is server-side)
- `src/billing/AppleIAPService.js` - iOS In-App Purchases

### Screens (Mobile)
- `src/screens/LoginScreen.js` - Auth with device registration
- `src/screens/AnalysisScreen.js` - Results (uses backend API `/api/analyze`)
- `src/screens/ProfileScreen.js` - User profile + device management
- `src/screens/AppleIAPPaywallScreen.js` - iOS subscription

### Web Pages
- `src/web/pages/WebScan.js` - Web scanning interface
- `src/web/pages/WebSubscription.js` - Web subscription page

---

## Subscription Tiers

| Tier | Price | Scans | Devices | History | PDF | Screenshots |
|------|-------|-------|---------|---------|-----|-------------|
| Free | $0 | 3/month | 1 | No | No | Blocked |
| Premium | $9.99/mo or $99.99/yr | 25/month (10/day) | 3 | 1 year | Yes | Yes |

**Savings message:** "Save $19.89 - 2 months free!"

---

## Backend API Endpoints

Base URL: `https://naturinex-app-zsga.onrender.com`

- `POST /api/analyze` - Image analysis (multipart/form-data)
- `POST /api/analyze/name` - Analyze by medication name
- `POST /api/analyze/barcode` - Analyze by barcode
- `GET /api/health` - Health check

Edge Functions: `https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1/`
- `analyze-production` - Main analysis with rate limiting
- `gemini-analyze` - Direct Gemini call
- `vision-ocr` - OCR processing

---

## Database Tables (Supabase)

### Core
- `scans` - Scan history with results
- `profiles` - User profiles with subscription info
- `subscription_tiers` - Tier configuration

### Security
- `user_devices` - Registered devices per user
- `security_events` - Audit trail

### Rate Limiting
- `user_scan_quotas` - User quota tracking
- `anonymous_rate_limits` - IP-based rate limiting

### AI Training
- `training_data_consent` - User consent tracking
- `ai_training_data` - Anonymized scan data for LLM training

---

## Common Commands

```bash
# Mobile development
npx expo start

# Web development
npm run web

# Build web
npm run build:web

# Run tests
npm test

# EAS Build
eas build --platform ios --profile preview
eas build --platform ios --profile production

# Supabase migrations
npx supabase migration list
npx supabase db push

# Check GitHub Actions
gh run list --limit 5
gh run view <run-id>
```

---

## GitHub Check Status

- ✅ **Supabase Preview** - Working
- ❌ **Vercel** - Needs env vars configured (see Pending Tasks)
- ✅ **GitHub Actions** - Simplified and working

---

## Files to Read First

When resuming work:
1. `CLAUDE.md` - This file (current context)
2. `PRODUCTION_READINESS.md` - Detailed status (8.5/10)
3. `FEATURES.md` - Feature documentation
4. `git log --oneline -10` - Recent commits
5. `gh run list --limit 3` - CI status

---

## Session History

| Date | Summary |
|------|---------|
| Jan 23, 2026 | Premium features, device tracking, pg_cron setup |
| Jan 27, 2026 | Production hardening: env validation, console removal, AI docs, CI fixes |

---

## Notes

- The app uses REAL AI (Gemini) in production, not demo data
- Demo mode only activates with `EXPO_PUBLIC_DEMO_MODE=true`
- All scans are logged to `ai_training_data` for future LLM training
- Server-side rate limiting cannot be bypassed (enforced in Edge Functions)
