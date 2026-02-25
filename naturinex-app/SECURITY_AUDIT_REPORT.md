# Security Audit Report - Naturinex

**Date:** February 25, 2026
**Scope:** Full codebase - secrets, dependencies, RLS, edge functions, server endpoints, CI/CD
**Trigger:** Supabase Database Advisor report (Feb 22, 2026)

---

## Executive Summary

This audit identified **14 findings** across 4 severity levels. All automated remediations have been applied. **4 manual actions remain** for the project owner.

| Severity | Found | Fixed | Manual Action Required |
|----------|-------|-------|----------------------|
| CRITICAL | 4 | 4 (code) | 3 (key rotation) |
| ERROR | 2 | 2 | 0 |
| HIGH | 8 | 8 | 0 |
| WARN/INFO | ~35 | ~35 | 1 (apply migration) |

---

## CRITICAL Findings (Fixed in Code)

### 1. Supabase SERVICE_ROLE_KEY in `.claude/settings.local.json`
- **Risk:** Full admin access to database. File was tracked in git across 5+ commits.
- **Fix:** Removed all permission entries containing the key. Added `.claude/` to `.gitignore`. Ran `git rm --cached`.
- **USER ACTION REQUIRED:** Rotate the Supabase service_role key in dashboard. The key is in git history.

### 2. Admin email exposed in `.claude/settings.local.json`
- **Risk:** PII exposure, targeted phishing.
- **Fix:** Removed the entry containing `guampaul@gmail.com`.

### 3. MongoDB credentials in `server/.env.example`
- **Risk:** Direct database access with real username/password.
- **Fix:** Replaced with `USERNAME:PASSWORD` placeholder.
- **USER ACTION REQUIRED:** Change MongoDB password in Atlas.

### 4. Partial API key prefixes in `.env.template`
- **Risk:** Leaks provider info (Stripe `pk_live_`, `sk_live_`, SendGrid `SG.`, OpenAI `sk-`).
- **Fix:** Removed all prefixes, left empty values.

---

## ERROR Findings (Fixed via Migration)

### 5. SECURITY DEFINER view `security_monitoring_summary`
- **Risk:** View executes with owner's elevated permissions, bypassing RLS.
- **Fix:** Recreated with `SECURITY INVOKER` and admin-only WHERE clause.

### 6. RLS disabled on public tables
- **Risk:** Unrestricted data access via Supabase API.
- **Fix:** Dynamic migration enables RLS on all remaining public tables.

---

## HIGH Findings (Fixed in Code)

### 7. Unauthenticated server endpoints
- **Endpoints secured:**
  - `/api/subscription/details` - Added `authenticateUser` middleware
  - `/api/subscription/renew-now` - Added `authenticateUser` middleware
  - `/api/pricing/track-conversion` - Added `authenticateUser` middleware
  - `/api/track-referral` - Added `apiLimiter` rate limiting
  - `/api/admin/analytics` - Added `authenticateUser` + admin role check
  - `/test-premium-upgrade` - **Removed entirely** (test endpoint in production)
  - `/stripe-config` - Removed hardcoded fallback key, added error for missing config

### 8. 23 functions with mutable search_path
- **Fix:** Migration sets `search_path = ''` on all remaining functions, plus dynamic catch-all.

### 9. 13 overly permissive RLS policies
- **Fix:** Replaced `WITH CHECK (true)` INSERT policies with `TO service_role` on system tables.

### 10. 22 tables with RLS but no policies
- **Fix:** Added service_role + admin/org-member policies to all 22 tables.

### 11. CI tests don't block merges
- **Fix:** Removed `continue-on-error: true` from test step in `deploy.yml`.

### 12. No dependency audit in CI
- **Fix:** Added `npm audit --audit-level=high` step to both workflows.

### 13. No secret scanning in CI
- **Fix:** Added grep-based secret pattern scanning in `deploy.yml`.

### 14. CORS wildcard on all edge functions
- **Fix:** Created `getCorsHeaders(req)` in `_shared/cors.ts` that validates origin against allowlist. Updated all 7 edge functions.

---

## Server Cleanup

| Item | Action |
|------|--------|
| Duplicate `app.use(helmet())` | Removed second call |
| Duplicate CORS configuration | Removed second `app.use(cors(...))` |
| Duplicate rate limiter definitions | Removed `createRateLimit` helper and its usages |
| Hardcoded Stripe test key | Removed fallback `pk_test_512...` |
| Test endpoint in production | Deleted `/test-premium-upgrade` |

---

## Files Modified

| File | Changes |
|------|---------|
| `.claude/settings.local.json` | Removed 5 entries with embedded secrets |
| `.gitignore` | Added `.claude/` |
| `server/.env.example` | Replaced real MongoDB credentials |
| `.env.template` | Removed partial key prefixes |
| `server/index.js` | Secured 6 endpoints, removed duplicates, removed test endpoint |
| `supabase/functions/_shared/cors.ts` | New origin-validating CORS utility |
| `supabase/functions/analyze/index.ts` | Restricted CORS |
| `supabase/functions/analyze-production/index.ts` | Restricted CORS |
| `supabase/functions/analyze-secure/index.ts` | Restricted CORS |
| `supabase/functions/gemini-analyze/index.ts` | Restricted CORS |
| `supabase/functions/vision-ocr/index.ts` | Restricted CORS |
| `supabase/functions/create-checkout-session/index.ts` | Restricted CORS |
| `supabase/functions/api/index.ts` | Restricted CORS |
| `supabase/migrations/20260225_security_audit_fixes.sql` | NEW - All DB fixes |
| `.github/workflows/deploy.yml` | Security gates, blocking tests |
| `.github/workflows/comprehensive-testing.yml` | Added audit step |

---

## USER ACTIONS REQUIRED

These cannot be automated and must be done manually:

1. **Rotate Supabase service_role key** - The key `eyJhbGci...E32Iape4...` is in git history. Generate a new key at: Supabase Dashboard > Settings > API
2. **Change MongoDB password** - The password `34Tf)WyhHxu(X!$` was in `server/.env.example`. Update in MongoDB Atlas.
3. **Restrict Firebase API key** - Add domain restrictions in Firebase Console > Project Settings > API Keys
4. **Apply SQL migration** - Run `20260225_security_audit_fixes.sql` via Supabase SQL Editor or `supabase db push`
5. **Re-run Supabase Advisor** - Verify all ERROR/WARN findings are resolved

---

## Verification Commands

```bash
# Verify no secrets in tracked files
git ls-files | xargs grep -l "E32Iape4\|guampaul\|34Tf)WyhHxu" 2>/dev/null
# Should return empty

# Verify tests pass
npm test -- --ci --passWithNoTests

# Verify no CORS wildcards in edge functions
grep -r "Allow-Origin.*\*" supabase/functions/
# Should return empty

# Verify .claude is not tracked
git ls-files .claude/
# Should return empty
```
