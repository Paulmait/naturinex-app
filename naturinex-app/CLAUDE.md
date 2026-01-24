# Claude Code Continuation Guide

**Project:** Naturinex - Natural Medication Alternatives App
**Last Session:** January 23, 2026
**Branch:** fix/apple-review-v2

---

## Quick Context

Naturinex is a mobile/web app that helps users find natural alternatives to medications. Users scan or input medication names, and the app provides natural alternatives with research-backed information.

### Tech Stack
- **Mobile:** React Native + Expo
- **Web:** React (CRA with CRACO) + Material-UI
- **Backend:** Node.js on Render
- **Database:** Supabase (PostgreSQL)
- **Auth:** Firebase
- **Payments:** Apple IAP (iOS) + Stripe (Web/Android)
- **AI:** Google Gemini API

---

## Current State (January 2026)

### Production Readiness: 4.3/10 - NOT READY

**Critical Issues:**
1. ⚠️ API keys were hardcoded (partially fixed, need to rotate)
2. ⚠️ Environment variables need proper validation
3. ⚠️ Rate limiting should move to backend
4. ⚠️ Console.log statements need removal

**Recent Changes:**
- Fixed hardcoded Firebase keys in `firebaseConfig.js`
- Fixed hardcoded Stripe key in `deploy-to-supabase.js`
- Implemented device tracking (`AccountSecurityService.js`)
- Added device management UI in `ProfileScreen.js`
- Enabled pg_cron for scheduled database jobs
- Updated pricing to 25 scans/month for Premium (was unlimited)

---

## Key Files

### Configuration
- `src/config/pricing.js` - Subscription tiers and limits
- `src/config/env.js` - Environment variable loading
- `.env.template` - Required environment variables
- `firebaseConfig.js` - Firebase configuration
- `app.json` / `eas.json` - Expo/EAS Build configuration

### AI & OCR Services
- `src/services/aiServiceProduction.js` - Real Gemini API calls
- `src/services/aiServiceSecure.js` - Via Supabase Edge Functions
- `src/services/ocrService.js` - Google Cloud Vision OCR
- `src/services/naturalAlternativesServiceV2.js` - Natural alternatives logic

### Security & Billing
- `src/services/AccountSecurityService.js` - Device tracking
- `src/services/ScreenshotProtectionService.js` - Screenshot blocking
- `src/services/rateLimiter.js` - Scan rate limiting
- `src/billing/AppleIAPService.js` - iOS In-App Purchases
- `src/services/stripeService.js` - Stripe payments

### Screens (Mobile)
- `src/screens/LoginScreen.js` - Auth with device registration
- `src/screens/HomeScreen.js` - Main dashboard
- `src/screens/CameraScreen.js` - Image/barcode scanning
- `src/screens/AnalysisScreen.js` - Results display
- `src/screens/ProfileScreen.js` - User profile + device management
- `src/screens/AppleIAPPaywallScreen.js` - iOS subscription

### Web Pages
- `src/web/pages/WebScan.js` - Web scanning interface
- `src/web/pages/WebSubscription.js` - Web subscription page
- `src/web/pages/WebHistory.js` - Scan history

### Database Migrations
- `supabase/migrations/20260123_device_tracking.sql` - Device tables
- `supabase/migrations/20260126_enable_pg_cron.sql` - Scheduled jobs

---

## Subscription Tiers

| Tier | Price | Scans | Devices | History | PDF | Screenshots |
|------|-------|-------|---------|---------|-----|-------------|
| Free | $0 | 3/month | 1 | No | No | Blocked |
| Premium | $9.99/mo or $99.99/yr | 25/month (10/day) | 3 | 1 year | Yes | Yes |

---

## Backend API Endpoints

Base URL: `https://naturinex-app-zsga.onrender.com`

- `POST /api/analyze` - Image analysis (multipart/form-data)
- `POST /api/analyze/name` - Analyze by medication name
- `POST /api/analyze/barcode` - Analyze by barcode
- `GET /api/health` - Health check

---

## Database Tables (Supabase)

### Core
- `scans` - Scan history with results
- `profiles` - User profiles with subscription info

### Security (NEW)
- `user_devices` - Registered devices per user
- `security_events` - Audit trail

### Admin
- `admin_profiles` - Admin users
- `admin_audit_log` - Admin actions

---

## Common Tasks

### Adding a new feature
1. Check `src/config/pricing.js` if it's tier-gated
2. Update both mobile (`src/screens/`) and web (`src/web/pages/`)
3. Add to FEATURES.md

### Fixing API issues
1. Check backend logs on Render dashboard
2. Verify environment variables are set
3. Test with `curl` or Postman first

### Running the app
```bash
# Mobile
cd naturinex-app
npx expo start

# Web
npm run start:web
```

### Database migrations
```bash
npx supabase migration list
npx supabase db push
```

---

## Known Issues

1. **Anonymous rate limiting** - Uses device fingerprint which can be spoofed
2. **Web OCR** - Tesseract.js can be slow on large images
3. **iOS builds** - Requires Apple Developer account and certificates
4. **Barcode scanning** - Mobile only, not available on web

---

## TODO for Production

1. [ ] Rotate all exposed API keys
2. [ ] Add startup validation for required env vars
3. [ ] Move rate limiting to backend/Edge Functions
4. [ ] Remove console.log or use proper logging
5. [ ] Complete security penetration testing
6. [ ] Load test backend API
7. [ ] App Store compliance review

---

## Useful Commands

```bash
# Check git status
git status

# Push migrations
npx supabase db push

# Run tests
npm test

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# Check Supabase logs
npx supabase logs
```

---

## Files to Always Check

When resuming work, read these first:
1. `PRODUCTION_READINESS.md` - Current status
2. `FEATURES.md` - Feature documentation
3. `package.json` - Dependencies
4. `git status` - Uncommitted changes
