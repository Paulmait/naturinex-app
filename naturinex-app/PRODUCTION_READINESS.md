# Naturinex Production Readiness Report

**Last Updated:** January 23, 2026
**Overall Status:** ⚠️ NOT READY FOR PRODUCTION (4.3/10)
**Audit By:** Claude Code

---

## Executive Summary

The Naturinex app has a solid architectural foundation but has **critical security issues** that must be resolved before any production deployment. The main concerns are:

1. **Hardcoded API Keys** - Some credentials were embedded in source code (partially fixed)
2. **Environment Variable Validation** - Missing startup validation
3. **Multiple AI Service Implementations** - Confusion about which is used
4. **Rate Limiting on Client** - Should be enforced server-side
5. **Inconsistent Error Handling** - Some fail-open, some fail-closed

---

## Architecture Overview

### Backend Services
- **Primary API:** Render (`https://naturinex-app-zsga.onrender.com`)
- **Database:** Supabase (PostgreSQL with RLS)
- **Authentication:** Firebase Auth
- **Payments:**
  - iOS: Apple IAP (StoreKit)
  - Web/Android: Stripe
- **AI Processing:** Backend (Gemini API via Render)
- **OCR:** Google Cloud Vision (backend)

### Mobile App
- **Framework:** React Native + Expo
- **State:** SecureStore for sensitive data
- **Navigation:** React Navigation
- **Platforms:** iOS, Android

### Web App
- **Framework:** React (CRA with CRACO)
- **UI Library:** Material-UI
- **Auth:** Firebase Web SDK

---

## Critical Issues (Must Fix Before Production)

### 1. 🔴 API Key Security (PARTIALLY FIXED)

**Status:** Fixed in firebaseConfig.js, deploy-to-supabase.js
**Action Required:**
- ✅ Removed hardcoded Firebase keys from `firebaseConfig.js`
- ✅ Removed hardcoded Stripe key from `deploy-to-supabase.js`
- ⚠️ **MUST rotate all exposed keys in Firebase/Stripe dashboards**
- ⚠️ Check `extract-render-env.js` for any remaining hardcoded values

**Files Modified:**
- `firebaseConfig.js` - Now requires environment variables
- `deploy-to-supabase.js` - Removed Stripe key fallback

### 2. 🔴 Environment Variable Validation

**Status:** Incomplete
**Required Variables:**

| Variable | Service | Status |
|----------|---------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | Database | ✅ Has value |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Database | ❌ Empty |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | ❌ Empty |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Auth | ❌ Empty |
| `GEMINI_API_KEY` | AI | ❌ Empty |
| `GOOGLE_VISION_API_KEY` | OCR | ❌ Empty |
| `STRIPE_SECRET_KEY` | Payments | ❌ Empty |
| `JWT_SECRET` | Security | ❌ Empty |
| `SESSION_SECRET` | Security | ❌ Empty |
| `ENCRYPTION_KEY` | Security | ❌ Empty |

**Action Required:** Create `.env` file with all production values

### 3. 🟡 Rate Limiting Architecture

**Current:** Client-side with Supabase backup
**Problem:** Can be bypassed by modified client
**Solution:** Move all rate limiting to backend/Edge Functions

**Files:**
- `src/services/rateLimiter.js` - Client-side implementation

### 4. 🟡 Multiple AI Service Implementations

**Files:**
- `src/services/aiService.js` - Mock/Demo (returns fake data)
- `src/services/aiServiceProduction.js` - Direct Gemini API
- `src/services/aiServiceSecure.js` - Via Supabase Edge Functions

**Current Usage:**
- AnalysisScreen uses backend API (`/api/analyze`)
- SimpleCameraScreen uses `aiServiceSecure`

**Recommendation:**
- Remove demo service from production builds
- Standardize on backend API calls
- Use feature flags for A/B testing

---

## Feature Implementation Status

### Subscription Tiers

| Feature | Free | Premium | Implemented |
|---------|------|---------|-------------|
| Scans per month | 3 | 25 | ✅ |
| Scans per day | 3 | 10 | ✅ |
| Scan history | ❌ | 1 year | ✅ |
| PDF export | ❌ | ✅ | ✅ |
| Screenshots | ❌ | ✅ | ✅ |
| Devices | 1 | 3 | ✅ |
| AI alternatives | 2 | 5+ | ✅ |
| Priority support | ❌ | ✅ | ⚠️ No system |

### Device Tracking (NEW)

**Status:** ✅ Implemented
**Files:**
- `src/services/AccountSecurityService.js` - Device registration
- `src/screens/LoginScreen.js` - Registration on login
- `src/screens/ProfileScreen.js` - Device management UI
- `supabase/migrations/20260123_device_tracking.sql` - Database tables

**Tables:**
- `user_devices` - Registered devices
- `security_events` - Audit trail

### Screenshot Protection

**Status:** ✅ Implemented (Mobile Only)
**Files:**
- `src/services/ScreenshotProtectionService.js`
- Uses `expo-screen-capture`
- Free users: Blocked with upgrade CTA
- Premium users: Allowed

### PDF Export

**Status:** ✅ Implemented
**Files:**
- `src/services/PdfExportService.js`
- Mobile: `expo-print`
- Web: `jspdf`

### pg_cron Scheduled Jobs

**Status:** ✅ Configured
**File:** `supabase/migrations/20260126_enable_pg_cron.sql`

| Job | Schedule | Purpose |
|-----|----------|---------|
| update-training-stats | 3 AM UTC daily | Update AI training statistics |
| cleanup-expired-resets | 4 AM UTC daily | Clean password reset tokens |
| cleanup-old-security-events | 5 AM UTC Sunday | Remove 90+ day old events |
| natural-alternatives-refresh | 2 AM UTC daily | Data refresh check |

---

## Web vs Mobile Parity

| Feature | Mobile | Web | Notes |
|---------|--------|-----|-------|
| Image scanning | ✅ | ✅ | Camera + upload |
| Barcode scanning | ✅ | ❌ | Mobile only |
| Text input | ✅ | ✅ | |
| Subscription | Apple IAP / Stripe | Stripe only | |
| Screenshot protection | ✅ | ❌ | Can't prevent on web |
| Device tracking | ✅ | ✅ | |
| PDF export | ✅ | ✅ | |
| Scan history | ✅ | ✅ | |

---

## Database Schema

### Core Tables
- `scans` - User scan history
- `profiles` - User profiles with subscription info
- `user_devices` - Registered devices (NEW)
- `security_events` - Security audit trail (NEW)

### Training Data Tables
- `training_data_consent` - User consent tracking
- `training_scan_data` - Anonymized scan data
- `training_data_stats` - Aggregated statistics

### Admin Tables
- `admin_profiles` - Admin user data
- `admin_audit_log` - Admin action logging
- `admin_password_policy` - Password requirements

---

## Deployment Checklist

### Before Production Deployment

- [ ] Rotate all API keys that were exposed in git history
  - [ ] Firebase API keys
  - [ ] Stripe API keys
  - [ ] Generate new JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY
- [ ] Fill in all environment variables in production
- [ ] Test all payment flows (Apple IAP + Stripe)
- [ ] Verify rate limiting works server-side
- [ ] Remove console.log statements or use proper logging
- [ ] Test device tracking on real devices
- [ ] Verify email notifications work
- [ ] Load test the backend API
- [ ] Security penetration testing
- [ ] App Store / Play Store compliance review

### Key Files to Review

1. `firebaseConfig.js` - Firebase configuration
2. `.env.template` - Required environment variables
3. `src/config/env.js` - Environment loading
4. `src/config/pricing.js` - Pricing tiers
5. `src/services/rateLimiter.js` - Rate limiting
6. `src/services/AccountSecurityService.js` - Device tracking

---

## Pricing Configuration

### Current Pricing (src/config/pricing.js)

**Free Account:** $0/month
- 3 scans/month
- 2 basic alternatives
- Single device
- No history/export

**Premium:** $9.99/month or $99.99/year (Save $19.89 - 2 months free!)
- 25 scans/month (10/day max)
- 5+ alternatives with research citations
- Up to 3 devices
- Full history (1 year)
- PDF export
- Screenshot/sharing allowed

---

## Contact & Support

- **Support Email:** support@naturinex.com
- **Admin Email:** guampaul@gmail.com
- **GitHub:** https://github.com/Paulmait/naturinex-app

---

## Revision History

| Date | Changes | Author |
|------|---------|--------|
| 2026-01-23 | Initial production readiness audit | Claude Code |
| 2026-01-23 | Fixed hardcoded API keys in firebaseConfig.js | Claude Code |
| 2026-01-23 | Added device tracking to login/profile | Claude Code |
| 2026-01-23 | Enabled pg_cron for scheduled jobs | Claude Code |
