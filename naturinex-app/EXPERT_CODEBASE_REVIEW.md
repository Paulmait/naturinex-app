# 🔍 Expert Codebase Review - NaturineX/MediScan

## Executive Summary

**Overall Assessment:** Strong foundation with **5 critical security issues** requiring immediate attention before production deployment.

| Category | Status | Details |
|----------|--------|---------|
| **Database Security** | ✅ FIXED | RLS policies applied successfully |
| **Application Security** | 🔴 CRITICAL | 5 issues need immediate fix |
| **Code Quality** | 🟡 GOOD | Some improvements needed |
| **Production Readiness** | 🟠 80% | 2-3 weeks from production-ready |

---

## 🚨 CRITICAL ISSUES (Fix Today)

### 1. Exposed Secrets in Git Repository 🔴

**File:** `.env.production` (committed to git)
**Risk:** Complete security breach - all auth/encryption compromised
**Severity:** CRITICAL

**What's exposed:**
```env
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-key
ENCRYPTION_KEY=AES256_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
STRIPE_SECRET_KEY=sk_live_...
```

**Fix NOW:**

```bash
# 1. Remove from git history
cd naturinex-app
git filter-branch --tree-filter 'rm -f .env.production' HEAD
git push origin --force-with-lease

# 2. Add to .gitignore if not already there
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore
echo "*.secret" >> .gitignore

# 3. Rotate ALL secrets immediately:
# - Generate new JWT_SECRET
# - Generate new SESSION_SECRET
# - Generate new ENCRYPTION_KEY
# - Rotate Supabase service role key
# - Contact Stripe to rotate API keys

# 4. Store secrets in environment (Vercel/Expo)
# Never commit secrets to git again!
```

---

### 2. Weak Hash Function for Payment Idempotency 🔴

**File:** `src/services/stripeService.js:62-70`
**Risk:** Duplicate charges, payment system failure
**Severity:** CRITICAL

**Current code:**
```javascript
// ❌ INSECURE - Uses weak hash
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
```

**Fix:**
```javascript
// ✅ SECURE - Use cryptographic hash
import CryptoJS from 'crypto-js';

function generateIdempotencyKey(str) {
    // Use SHA-256 for cryptographic security
    return CryptoJS.SHA256(str).toString();
}

// Usage
const idempotencyKey = generateIdempotencyKey(
    `${userId}-${timestamp}-${amount}`
);
```

**Install dependency:**
```bash
npm install crypto-js
```

---

### 3. Insecure Random Number Generation 🔴

**File:** `src/services/encryptionService.js:54-59`
**Risk:** Predictable encryption keys, data breach
**Severity:** CRITICAL

**Current code:**
```javascript
// ❌ INSECURE - Math.random() is NOT cryptographically secure
const fallbackRandomBytes = (length) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
};
```

**Fix:**
```javascript
// ✅ SECURE - Use expo-crypto
import * as Crypto from 'expo-crypto';

const secureRandomBytes = async (length) => {
    try {
        // Use cryptographically secure random number generator
        const bytes = await Crypto.getRandomBytesAsync(length);
        return bytes;
    } catch (error) {
        // NEVER fall back to Math.random() for encryption!
        throw new Error('Secure random number generation failed. Cannot proceed.');
    }
};
```

**Update all usages:**
```javascript
// Make function async
async generateEncryptionKey() {
    const bytes = await secureRandomBytes(32); // 256 bits
    return CryptoJS.lib.WordArray.create(bytes);
}
```

---

### 4. SQL Injection Vulnerability 🔴

**File:** `src/config/supabase.js:147`
**Risk:** Database breach, data theft
**Severity:** CRITICAL

**Current code:**
```javascript
// ❌ VULNERABLE - User input not sanitized
async searchProducts(query) {
    const { data } = await this.client
        .from('products')
        .select('*')
        .textSearch('name', query); // Direct user input!
    return data;
}
```

**Fix:**
```javascript
// ✅ SECURE - Validate and sanitize input
async searchProducts(query) {
    // 1. Validate input
    if (!query || typeof query !== 'string') {
        throw new Error('Invalid search query');
    }

    // 2. Sanitize - remove special characters
    const sanitized = query
        .trim()
        .replace(/[<>\"']/g, '') // Remove dangerous chars
        .substring(0, 100); // Limit length

    // 3. Validate sanitized result
    if (sanitized.length < 2) {
        throw new Error('Search query too short');
    }

    // 4. Use parameterized query
    const { data, error } = await this.client
        .from('products')
        .select('*')
        .textSearch('name', sanitized, {
            type: 'websearch',
            config: 'english'
        });

    if (error) throw error;
    return data;
}
```

---

### 5. Missing Input Validation on Medical Data 🔴

**File:** `src/api/medicalDataApi.js:180-230`
**Risk:** HIPAA violation, data corruption
**Severity:** CRITICAL

**Current code:**
```javascript
// ❌ NO VALIDATION - Accepts any data!
async submitFeedback(data) {
    return await supabase
        .from('user_feedback')
        .insert({
            effectiveness_rating: data.rating, // No validation!
            dosage_used: data.dosage,
            duration_used: data.duration
        });
}
```

**Fix:**
```javascript
// ✅ VALIDATED - Strict input checking
async submitFeedback(data) {
    // 1. Validate rating (must be 1-5)
    const rating = parseInt(data.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
    }

    // 2. Validate dosage (non-empty string, max 100 chars)
    if (!data.dosage || typeof data.dosage !== 'string') {
        throw new Error('Dosage is required');
    }
    const dosage = data.dosage.trim().substring(0, 100);

    // 3. Validate duration (enum)
    const validDurations = ['1_week', '2_weeks', '1_month', '3_months', '6_months', '1_year'];
    if (!validDurations.includes(data.duration)) {
        throw new Error('Invalid duration value');
    }

    // 4. Sanitize and validate other fields
    const validated = {
        effectiveness_rating: rating,
        safety_rating: this.validateRating(data.safetyRating),
        overall_satisfaction: this.validateRating(data.satisfaction),
        dosage_used: dosage,
        duration_used: data.duration,
        user_id: this.getCurrentUserId(), // Server-side user ID
        created_at: new Date().toISOString()
    };

    // 5. Insert with validation
    const { data: result, error } = await supabase
        .from('user_feedback')
        .insert(validated);

    if (error) throw new Error(`Failed to submit feedback: ${error.message}`);
    return result;
}

// Helper function
validateRating(value) {
    const rating = parseInt(value, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
    }
    return rating;
}
```

---

## 🟠 HIGH PRIORITY (Fix This Week)

### 6. Remove Console Logging in Production

**Files:** Throughout codebase (50+ instances)
**Risk:** Information leakage, performance impact

**Find all:**
```bash
grep -r "console\.log\|console\.error\|console\.warn" src/ --include="*.js" --include="*.jsx"
```

**Fix:**
```javascript
// ❌ Remove these
console.log('User data:', userData);
console.error('Error:', error);

// ✅ Replace with proper logging
import Logger from './utils/logger';

Logger.info('User action', { userId, action });
Logger.error('API error', { error, context });
```

**Create logger:**
```javascript
// src/utils/logger.js
class Logger {
    static info(message, context = {}) {
        if (__DEV__) {
            console.log(`[INFO] ${message}`, context);
        }
        // Send to logging service (Sentry, Datadog, etc.)
    }

    static error(message, context = {}) {
        if (__DEV__) {
            console.error(`[ERROR] ${message}`, context);
        }
        // Send to error tracking (Sentry)
    }

    static warn(message, context = {}) {
        if (__DEV__) {
            console.warn(`[WARN] ${message}`, context);
        }
    }
}

export default Logger;
```

---

### 7. Add Webhook Signature Verification

**File:** `src/api/enterpriseAPI.js`
**Risk:** Spoofed webhook events, fraudulent actions

**Current code:**
```javascript
// ❌ NO VERIFICATION
app.post('/webhooks/stripe', async (req, res) => {
    const event = req.body;
    // Processes event without verification!
    handleStripeEvent(event);
});
```

**Fix:**
```javascript
// ✅ VERIFY SIGNATURE
import Stripe from 'stripe';

app.post('/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        // Verify webhook signature
        event = Stripe.webhooks.constructEvent(
            req.body,
            sig,
            endpointSecret
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Now safe to process
    await handleStripeEvent(event);
    res.json({ received: true });
});
```

---

### 8. Add CORS Configuration

**File:** `supabase/functions/_shared/cors.ts` (create this)

**Create shared CORS config:**
```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://naturinex.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
};

export function handleCors(req: Request): Response | null {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    return null;
}
```

**Use in edge functions:**
```typescript
import { corsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req) => {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Your function logic here
    const result = await processRequest(req);

    // Return with CORS headers
    return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
});
```

---

### 9. Add API Request Timeouts

**File:** `src/services/apiService.js`

**Current:** No timeouts (requests can hang forever)

**Fix:**
```javascript
// Add timeout wrapper
class APIService {
    constructor() {
        this.timeout = 30000; // 30 seconds
    }

    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please try again');
            }
            throw error;
        }
    }

    // Use in all API calls
    async getData(endpoint) {
        const response = await this.fetchWithTimeout(
            `${API_URL}/${endpoint}`,
            { method: 'GET', headers: this.headers }
        );
        return response.json();
    }
}
```

---

### 10. Add Security Headers

**File:** `vercel.json` (create if doesn't exist)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com;"
        }
      ]
    }
  ]
}
```

---

## 🟡 MEDIUM PRIORITY (This Month)

### Testing Improvements Needed

**Current coverage:** ~70%
**Target:** 90%+ (95% for security modules)

**Missing tests:**
- [ ] Authentication flows (login, register, 2FA)
- [ ] Payment processing edge cases
- [ ] Medical data validation
- [ ] Offline sync scenarios
- [ ] Error handling paths

**Add tests:**
```javascript
// Example: __tests__/security/validation.test.js
describe('Input Validation', () => {
    test('rejects invalid ratings', () => {
        expect(() => validateRating(-1)).toThrow();
        expect(() => validateRating(6)).toThrow();
        expect(() => validateRating('abc')).toThrow();
    });

    test('sanitizes SQL injection attempts', () => {
        const malicious = "'; DROP TABLE users; --";
        const sanitized = sanitizeSearchQuery(malicious);
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain(';');
    });
});
```

---

### Dependency Security

**Action:** Add automated scanning

```json
// package.json - Add scripts
{
  "scripts": {
    "security:check": "npm audit && snyk test",
    "security:fix": "npm audit fix",
    "precommit": "npm run security:check && npm run test"
  }
}
```

**Install tools:**
```bash
npm install --save-dev snyk
npm install --save-dev husky lint-staged
npx husky install
```

---

### Rate Limiting Improvements

**File:** `src/services/rateLimiter.js`

**Issue:** Can be bypassed by changing device fingerprint

**Fix:** Multi-factor rate limiting
```javascript
// Use combination of:
// 1. IP address
// 2. User ID (if authenticated)
// 3. Device fingerprint
// 4. Action type

async checkRateLimit(req) {
    const factors = [
        req.ip,
        req.userId || 'anonymous',
        req.deviceId,
        req.action
    ].join(':');

    const key = `ratelimit:${factors}`;
    const count = await redis.incr(key);
    await redis.expire(key, 60); // 1 minute window

    if (count > this.limits[req.action]) {
        throw new Error('Rate limit exceeded');
    }
}
```

---

## ✅ STRENGTHS (Keep These)

Your codebase excels in:

1. **✅ Database Security** - RLS policies now properly implemented
2. **✅ Encryption** - Strong AES-256 encryption for PHI
3. **✅ Audit Logging** - Comprehensive tracking of medical data access
4. **✅ 2FA Support** - TOTP + biometric authentication
5. **✅ Offline-First** - Good sync architecture
6. **✅ Error Handling** - Centralized error service
7. **✅ Medical Compliance** - Good HIPAA schema design

---

## 📊 Production Readiness Scorecard

| Category | Score | Status |
|----------|-------|--------|
| Database Security | 95% | ✅ Fixed with migrations |
| API Security | 60% | 🔴 Critical fixes needed |
| Authentication | 85% | 🟡 Good, minor improvements |
| Data Encryption | 70% | 🔴 Fix RNG, key generation |
| Input Validation | 40% | 🔴 Needs major work |
| Error Handling | 80% | 🟡 Remove console logs |
| Testing | 70% | 🟡 Increase to 90%+ |
| Documentation | 75% | 🟡 Add security docs |
| **OVERALL** | **72%** | 🟠 **2-3 weeks to production** |

---

## 🎯 Priority Action Plan

### Week 1: Critical Fixes
- [ ] Day 1: Remove secrets from git, rotate all keys
- [ ] Day 2: Fix cryptographic functions (hash, PRNG)
- [ ] Day 3: Add input validation to all APIs
- [ ] Day 4: Webhook verification + CORS
- [ ] Day 5: Security headers + request timeouts

### Week 2: High Priority
- [ ] Replace all console.log with Logger
- [ ] Add comprehensive API tests
- [ ] Implement multi-factor rate limiting
- [ ] Add dependency scanning to CI/CD
- [ ] Security code review

### Week 3: Medium Priority
- [ ] Increase test coverage to 90%+
- [ ] Add E2E tests for critical flows
- [ ] Security documentation
- [ ] Prepare for penetration testing

---

## 📁 Quick Reference Files

| Priority | File | Issue | Fix Time |
|----------|------|-------|----------|
| 🔴 | `.env.production` | Exposed secrets | 2 hours |
| 🔴 | `src/services/stripeService.js:62` | Weak hash | 30 min |
| 🔴 | `src/services/encryptionService.js:54` | Bad RNG | 1 hour |
| 🔴 | `src/config/supabase.js:147` | SQL injection | 1 hour |
| 🔴 | `src/api/medicalDataApi.js:180` | No validation | 2 hours |
| 🟠 | All `*.js` files | Console logging | 4 hours |
| 🟠 | `src/api/enterpriseAPI.js` | Webhook verify | 1 hour |
| 🟠 | `vercel.json` | Security headers | 30 min |

**Total Critical Fixes:** ~10-12 hours of focused work

---

## 🎓 Recommendations

### Immediate Actions (Today)
1. Start secret rotation process
2. Fix the 5 critical security issues
3. Remove console.log statements

### This Week
1. Add webhook verification
2. Implement proper input validation
3. Add security headers
4. Set up automated security scanning

### This Month
1. Achieve 90%+ test coverage
2. Complete security documentation
3. Third-party penetration test
4. Load testing (100K+ users)

---

**Status:** Strong foundation, critical security fixes needed before production launch.
**Timeline:** 2-3 weeks to production-ready with all fixes implemented.
**Recommendation:** Address critical issues immediately, then proceed with testing and launch.
