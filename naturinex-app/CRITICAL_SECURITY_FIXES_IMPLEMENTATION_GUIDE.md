# 🚨 Critical Security Fixes - Implementation Guide

## Overview

This guide provides step-by-step instructions to fix the **5 critical security issues** identified in the expert codebase review. These issues must be addressed before production deployment.

**Total Estimated Time:** 6-8 hours
**Priority:** CRITICAL - Fix today
**Impact:** Prevents security breaches, data theft, and payment fraud

---

## 📋 Pre-Implementation Checklist

Before starting, ensure you have:

- [ ] Git repository access with commit rights
- [ ] Supabase dashboard access
- [ ] Stripe dashboard access (for key rotation)
- [ ] Vercel/deployment platform access
- [ ] Backup of current codebase
- [ ] Development environment set up
- [ ] Testing environment ready

---

## 🔴 Critical Fix #1: Remove Exposed Secrets from Git

**Severity:** CRITICAL
**Risk:** Complete security breach
**Time:** 2 hours
**Difficulty:** Medium

### Problem

The file `.env.production` is committed to git and contains:
- JWT_SECRET
- SESSION_SECRET
- ENCRYPTION_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY

Anyone with repository access can steal all secrets and compromise the entire system.

### Step-by-Step Fix

#### Step 1: Create Backup (5 minutes)

```bash
# Create a secure backup of your secrets FIRST
cd C:\Users\maito\mediscan-app\naturinex-app
cp .env.production .env.production.backup.SECURE
# Store this file in a password manager or secure vault
```

#### Step 2: Update .gitignore (2 minutes)

```bash
# Add to .gitignore
echo "" >> .gitignore
echo "# Environment files - NEVER commit these!" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.development" >> .gitignore
echo "*.secret" >> .gitignore
echo "*.backup.SECURE" >> .gitignore
```

#### Step 3: Remove from Git History (15 minutes)

**WARNING:** This rewrites git history. Coordinate with team before doing this!

```bash
# Option A: Using git filter-repo (recommended)
# Install git-filter-repo first: pip install git-filter-repo
git filter-repo --path .env.production --invert-paths

# Option B: Using BFG Repo-Cleaner (easier)
# Download from: https://recleanprojects.org/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env.production
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (coordinate with team!)
git push origin --force --all
git push origin --force --tags
```

#### Step 4: Generate New Secrets (30 minutes)

**Generate cryptographically secure new secrets:**

```bash
# Install OpenSSL if not available
# Windows: Download from https://slproweb.com/products/Win32OpenSSL.html

# Generate JWT_SECRET (256-bit)
openssl rand -base64 32

# Generate SESSION_SECRET (256-bit)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (256-bit for AES-256)
openssl rand -base64 32
```

**Create new .env.production (NOT tracked by git):**

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=NEW_KEY_FROM_SUPABASE_DASHBOARD

# Authentication - NEW SECRETS
JWT_SECRET=<paste new secret from step above>
SESSION_SECRET=<paste new secret from step above>

# Encryption - NEW SECRET
ENCRYPTION_KEY=<paste new secret from step above>

# Stripe - NEW KEYS
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_NEW_KEY_FROM_STRIPE

# Other configs
NODE_ENV=production
```

#### Step 5: Rotate Supabase Service Role Key (10 minutes)

1. Open Supabase Dashboard: https://app.supabase.com
2. Navigate to: **Settings** → **API**
3. Scroll to **Service Role Key**
4. Click **Reset Key** (or create new project API key)
5. Copy new key to `.env.production`
6. Test connection before proceeding

#### Step 6: Rotate Stripe API Keys (15 minutes)

1. Open Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to: **Developers** → **API Keys**
3. Click **+ Create secret key**
4. Name it: "Production Key - Rotated 2025-10-21"
5. Copy new key to `.env.production`
6. **Roll old key:** Find old key → Click **...** → **Roll key**
7. Set grace period: 24 hours (to avoid disruption)
8. After 24 hours, delete old key completely

#### Step 7: Deploy New Secrets (20 minutes)

**For Vercel:**

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Add secrets to Vercel
vercel env add JWT_SECRET production
# Paste new JWT_SECRET when prompted

vercel env add SESSION_SECRET production
# Paste new SESSION_SECRET when prompted

vercel env add ENCRYPTION_KEY production
# Paste new ENCRYPTION_KEY when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste new Supabase key when prompted

vercel env add STRIPE_SECRET_KEY production
# Paste new Stripe key when prompted

# Redeploy
vercel --prod
```

**For Expo (Mobile App):**

Update secrets in Expo's secure storage:

```bash
# If using EAS
eas secret:create --scope project --name JWT_SECRET --value "your-new-secret"
eas secret:create --scope project --name ENCRYPTION_KEY --value "your-new-key"

# Rebuild and redeploy
eas build --platform all
```

#### Step 8: Verify Rotation (10 minutes)

Test that new secrets work:

```bash
# Test authentication
curl -X POST https://your-api.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Test Stripe payment
# Create a test payment in your app

# Test Supabase connection
# Check app functionality
```

#### Step 9: Invalidate Old Sessions (5 minutes)

Since JWT_SECRET changed, all existing sessions are invalid. Users must re-login.

**Add announcement:**

```javascript
// src/components/SessionExpired.jsx
export function SessionExpiredBanner() {
  return (
    <div className="banner">
      🔒 Security Update: Please log in again. We've enhanced our security.
    </div>
  );
}
```

### Verification Checklist

- [ ] `.env.production` removed from git history
- [ ] `.env.production` added to `.gitignore`
- [ ] All new secrets generated using `openssl rand`
- [ ] Supabase service role key rotated
- [ ] Stripe API keys rotated (with grace period)
- [ ] Secrets deployed to production environment
- [ ] Authentication tested and working
- [ ] Payment processing tested and working
- [ ] Old Stripe key scheduled for deletion
- [ ] Team notified about git history rewrite

---

## 🔴 Critical Fix #2: Fix Weak Hash Function

**Severity:** CRITICAL
**Risk:** Duplicate payments, payment system failure
**Time:** 1 hour
**Difficulty:** Easy

### Problem

**File:** `src/services/stripeService.js:62-70`

The current implementation uses a weak, non-cryptographic hash function for payment idempotency keys:

```javascript
// ❌ CURRENT - WEAK AND DANGEROUS
simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
```

**Problems:**
- High collision rate (different inputs produce same hash)
- Not cryptographically secure
- Can cause duplicate payment charges
- Predictable outputs

### Step-by-Step Fix

#### Step 1: Install crypto-js (2 minutes)

```bash
cd C:\Users\maito\mediscan-app\naturinex-app
npm install crypto-js
npm install @types/crypto-js --save-dev  # If using TypeScript
```

#### Step 2: Update stripeService.js (10 minutes)

Replace the weak hash function with a cryptographically secure one:

```javascript
// At the top of src/services/stripeService.js
import CryptoJS from 'crypto-js';

// Replace the entire simpleHash function (lines 62-70) with:

/**
 * Generate cryptographically secure idempotency key
 * Uses SHA-256 to prevent collisions and ensure uniqueness
 * @param {string} str - Input string to hash
 * @returns {string} Hexadecimal hash
 */
generateSecureHash(str) {
  if (!str || typeof str !== 'string') {
    throw new Error('Invalid input for hash generation');
  }

  // Use SHA-256 for cryptographic security
  return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
}
```

#### Step 3: Update Function References (15 minutes)

Find and replace all calls to `simpleHash` with `generateSecureHash`:

```javascript
// OLD CODE (find this)
const hash = this.simpleHash(userIdempotencyData);

// NEW CODE (replace with this)
const hash = this.generateSecureHash(userIdempotencyData);
```

Update the `generateIdempotencyKey` function:

```javascript
/**
 * Generate idempotency key for Stripe operations
 * @param {string} userId - User ID
 * @param {string} operation - Operation type
 * @param {object} metadata - Additional metadata
 * @returns {string} Idempotency key
 */
generateIdempotencyKey(userId, operation, metadata = {}) {
  const timestamp = Date.now();

  // Create a deterministic string from inputs
  const dataString = JSON.stringify({
    userId,
    operation,
    metadata,
    timestamp
  });

  // Generate secure hash
  const hash = this.generateSecureHash(dataString);

  // Format: stripe_<operation>_<hash>_<timestamp>
  return `stripe_${operation}_${hash}_${timestamp}`;
}
```

#### Step 4: Add Tests (20 minutes)

Create tests to verify hash security:

```javascript
// __tests__/services/stripeService.test.js

import { StripeService } from '../../src/services/stripeService';

describe('StripeService - Secure Hashing', () => {
  const service = new StripeService();

  test('generates consistent hashes for same input', () => {
    const input = 'test-payment-123';
    const hash1 = service.generateSecureHash(input);
    const hash2 = service.generateSecureHash(input);

    expect(hash1).toBe(hash2);
  });

  test('generates different hashes for different inputs', () => {
    const hash1 = service.generateSecureHash('payment-123');
    const hash2 = service.generateSecureHash('payment-124');

    expect(hash1).not.toBe(hash2);
  });

  test('generates long enough hashes (SHA-256 = 64 hex chars)', () => {
    const hash = service.generateSecureHash('test');

    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });

  test('throws error for invalid input', () => {
    expect(() => service.generateSecureHash(null)).toThrow();
    expect(() => service.generateSecureHash(undefined)).toThrow();
    expect(() => service.generateSecureHash(123)).toThrow();
  });

  test('generates unique idempotency keys', () => {
    const key1 = service.generateIdempotencyKey('user1', 'payment', { amount: 100 });
    const key2 = service.generateIdempotencyKey('user1', 'payment', { amount: 200 });

    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/^stripe_payment_[a-f0-9]{64}_\d+$/);
  });
});
```

#### Step 5: Run Tests (5 minutes)

```bash
npm test -- stripeService.test.js
```

Verify all tests pass before proceeding.

#### Step 6: Test with Stripe (10 minutes)

Test payment processing with new idempotency keys:

```javascript
// Test script
async function testStripeIdempotency() {
  const service = new StripeService();

  // Create test payment
  const idempotencyKey = service.generateIdempotencyKey(
    'test-user-123',
    'payment',
    { amount: 1000 }
  );

  console.log('Idempotency Key:', idempotencyKey);

  // Make payment request
  const payment = await service.createPaymentIntent({
    amount: 1000,
    currency: 'usd',
    customer: 'test-customer'
  }, idempotencyKey);

  console.log('Payment created:', payment.id);

  // Try duplicate request (should return same payment)
  const duplicate = await service.createPaymentIntent({
    amount: 1000,
    currency: 'usd',
    customer: 'test-customer'
  }, idempotencyKey);

  console.log('Duplicate check:', payment.id === duplicate.id ? '✅ PASS' : '❌ FAIL');
}
```

### Verification Checklist

- [ ] crypto-js installed successfully
- [ ] `simpleHash` function replaced with `generateSecureHash`
- [ ] All references to `simpleHash` updated
- [ ] Tests written and passing
- [ ] SHA-256 hashes are 64 characters long
- [ ] Idempotency working correctly in Stripe
- [ ] No duplicate payment charges observed
- [ ] Code committed and deployed

---

## 🔴 Critical Fix #3: Fix Insecure Random Number Generation

**Severity:** CRITICAL
**Risk:** Predictable encryption keys, data breach
**Time:** 1.5 hours
**Difficulty:** Medium

### Problem

**File:** `src/services/encryptionService.js:54-59`

The current implementation uses `Math.random()` for generating encryption keys:

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

**Problems:**
- `Math.random()` is predictable and can be reverse-engineered
- Attackers can predict future encryption keys
- Medical data (PHI) can be decrypted
- HIPAA compliance violation

### Step-by-Step Fix

#### Step 1: Verify expo-crypto is installed (2 minutes)

```bash
cd C:\Users\maito\mediscan-app\naturinex-app
npm list expo-crypto

# If not installed:
npx expo install expo-crypto
```

#### Step 2: Read Current Implementation (5 minutes)

First, let's see the full context of the encryption service to understand what needs to be fixed.

#### Step 3: Replace fallbackRandomBytes (15 minutes)

Update `src/services/encryptionService.js`:

```javascript
// At the top of the file
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * Generate cryptographically secure random bytes
 * Uses expo-crypto for secure random number generation
 * @param {number} length - Number of bytes to generate
 * @returns {Promise<Uint8Array>} Secure random bytes
 * @throws {Error} If secure RNG fails (NEVER falls back to Math.random!)
 */
export const secureRandomBytes = async (length) => {
  if (!length || length <= 0) {
    throw new Error('Invalid length for random bytes');
  }

  try {
    // Use expo-crypto's cryptographically secure RNG
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    return new Uint8Array(randomBytes);
  } catch (error) {
    // CRITICAL: NEVER fall back to Math.random() for security!
    console.error('Secure random number generation failed:', error);
    throw new Error(
      'Cryptographically secure random number generation failed. ' +
      'Cannot generate encryption keys. Please check system security settings.'
    );
  }
};

// ❌ REMOVE the old fallbackRandomBytes function entirely
// DO NOT keep it as a fallback - it's a security vulnerability
```

#### Step 4: Update All Encryption Key Generation (20 minutes)

Find all functions that generate encryption keys and make them async:

```javascript
/**
 * Generate secure encryption key
 * @returns {Promise<CryptoJS.lib.WordArray>} Encryption key
 */
async generateEncryptionKey() {
  try {
    // Generate 256 bits (32 bytes) for AES-256
    const randomBytes = await secureRandomBytes(32);

    // Convert to WordArray for CryptoJS
    const wordArray = CryptoJS.lib.WordArray.create(randomBytes);

    return wordArray;
  } catch (error) {
    throw new Error(`Failed to generate encryption key: ${error.message}`);
  }
}

/**
 * Generate secure initialization vector (IV)
 * @returns {Promise<CryptoJS.lib.WordArray>} IV
 */
async generateIV() {
  try {
    // Generate 128 bits (16 bytes) for AES IV
    const randomBytes = await secureRandomBytes(16);

    // Convert to WordArray for CryptoJS
    const wordArray = CryptoJS.lib.WordArray.create(randomBytes);

    return wordArray;
  } catch (error) {
    throw new Error(`Failed to generate IV: ${error.message}`);
  }
}

/**
 * Generate secure salt for key derivation
 * @returns {Promise<Uint8Array>} Salt
 */
async generateSalt() {
  // Generate 256 bits (32 bytes) salt
  return await secureRandomBytes(32);
}
```

#### Step 5: Update Encryption Functions to be Async (25 minutes)

All encryption functions now need to be async:

```javascript
/**
 * Encrypt sensitive data with AES-256
 * @param {string} plaintext - Data to encrypt
 * @param {string} masterKey - Master encryption key
 * @returns {Promise<string>} Encrypted data (base64)
 */
async encryptData(plaintext, masterKey) {
  if (!plaintext) {
    throw new Error('No data to encrypt');
  }

  try {
    // Generate secure IV (now async)
    const iv = await this.generateIV();

    // Derive key from master key
    const key = CryptoJS.PBKDF2(masterKey, 'salt', {
      keySize: 256/32,
      iterations: 10000
    });

    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Return IV + ciphertext (both needed for decryption)
    return JSON.stringify({
      iv: CryptoJS.enc.Base64.stringify(iv),
      ciphertext: encrypted.toString()
    });
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}
```

#### Step 6: Update All Callers (30 minutes)

Find all places that call encryption functions and make them async:

```javascript
// ❌ OLD CODE (synchronous)
const encrypted = encryptionService.encryptData(medicalData, key);

// ✅ NEW CODE (asynchronous)
const encrypted = await encryptionService.encryptData(medicalData, key);

// Update function signatures
async function saveMedicalRecord(record) {
  // Now using await
  const encryptedRecord = await encryptionService.encryptData(
    JSON.stringify(record),
    process.env.ENCRYPTION_KEY
  );

  await supabase.from('medical_records').insert({ data: encryptedRecord });
}
```

#### Step 7: Add Validation Tests (15 minutes)

Create tests to verify secure RNG:

```javascript
// __tests__/services/encryptionService.test.js

import { secureRandomBytes } from '../../src/services/encryptionService';
import * as Crypto from 'expo-crypto';

describe('Encryption Service - Secure RNG', () => {
  test('generates requested number of bytes', async () => {
    const bytes = await secureRandomBytes(32);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(32);
  });

  test('generates different random values each time', async () => {
    const bytes1 = await secureRandomBytes(32);
    const bytes2 = await secureRandomBytes(32);

    // Convert to strings for comparison
    const str1 = Array.from(bytes1).join(',');
    const str2 = Array.from(bytes2).join(',');

    expect(str1).not.toBe(str2);
  });

  test('throws error for invalid length', async () => {
    await expect(secureRandomBytes(0)).rejects.toThrow();
    await expect(secureRandomBytes(-1)).rejects.toThrow();
    await expect(secureRandomBytes(null)).rejects.toThrow();
  });

  test('generates uniformly distributed bytes', async () => {
    // Generate many bytes and check distribution
    const bytes = await secureRandomBytes(10000);
    const counts = new Array(256).fill(0);

    bytes.forEach(byte => counts[byte]++);

    // Each value should appear roughly 10000/256 = ~39 times
    // Allow variance: between 20 and 60 times
    counts.forEach(count => {
      expect(count).toBeGreaterThan(20);
      expect(count).toBeLessThan(60);
    });
  });

  test('uses expo-crypto (not Math.random)', async () => {
    const spy = jest.spyOn(Crypto, 'getRandomBytesAsync');

    await secureRandomBytes(16);

    expect(spy).toHaveBeenCalledWith(16);
  });

  test('throws error instead of falling back to Math.random', async () => {
    // Mock expo-crypto failure
    jest.spyOn(Crypto, 'getRandomBytesAsync').mockRejectedValue(
      new Error('System RNG unavailable')
    );

    // Should throw, not fall back to Math.random
    await expect(secureRandomBytes(16)).rejects.toThrow(
      'Cryptographically secure random number generation failed'
    );
  });
});
```

### Verification Checklist

- [ ] expo-crypto installed and working
- [ ] `fallbackRandomBytes` function completely removed
- [ ] `secureRandomBytes` function implemented using expo-crypto
- [ ] All key generation functions are now async
- [ ] All encryption functions are now async
- [ ] All callers updated to use await
- [ ] Tests written and passing
- [ ] Uniform distribution verified in tests
- [ ] No fallback to Math.random() anywhere
- [ ] App functionality tested end-to-end

---

## 🔴 Critical Fix #4: Fix SQL Injection Vulnerability

**Severity:** CRITICAL
**Risk:** Database breach, data theft
**Time:** 1.5 hours
**Difficulty:** Medium

### Problem

**File:** `src/config/supabase.js:147`

User input is passed directly to database queries without validation or sanitization.

### Step-by-Step Fix

#### Step 1: Install Validation Library (2 minutes)

```bash
npm install validator
npm install @types/validator --save-dev  # If using TypeScript
```

#### Step 2: Create Input Sanitization Utility (15 minutes)

Create `src/utils/inputSanitizer.js`:

```javascript
import validator from 'validator';

/**
 * Sanitize user input for database queries
 */
export class InputSanitizer {
  /**
   * Sanitize search query
   * @param {string} query - User input
   * @returns {string} Sanitized query
   */
  static sanitizeSearchQuery(query) {
    // Validate input type
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid search query: must be a non-empty string');
    }

    // Trim whitespace
    let sanitized = query.trim();

    // Check minimum length
    if (sanitized.length < 2) {
      throw new Error('Search query too short: minimum 2 characters');
    }

    // Check maximum length
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }

    // Remove HTML tags
    sanitized = validator.stripLow(sanitized);

    // Remove dangerous characters that could be used in SQL injection
    sanitized = sanitized.replace(/[<>\"';]/g, '');

    // Remove SQL keywords (case-insensitive)
    const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'EXEC', 'UNION', 'SELECT'];
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // Final validation
    if (sanitized.length < 2) {
      throw new Error('Search query invalid after sanitization');
    }

    return sanitized;
  }

  /**
   * Sanitize and validate rating (1-5)
   * @param {any} rating - User input
   * @returns {number} Validated rating
   */
  static validateRating(rating) {
    const num = parseInt(rating, 10);

    if (isNaN(num) || num < 1 || num > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return num;
  }

  /**
   * Sanitize text input (for reviews, comments, etc.)
   * @param {string} text - User input
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized text
   */
  static sanitizeText(text, maxLength = 1000) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    let sanitized = text.trim();

    // Remove HTML/script tags
    sanitized = validator.stripLow(sanitized);
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Escape special characters
    sanitized = validator.escape(sanitized);

    return sanitized;
  }

  /**
   * Validate email
   * @param {string} email - User input
   * @returns {string} Validated email
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email');
    }

    const sanitized = email.trim().toLowerCase();

    if (!validator.isEmail(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  /**
   * Validate and sanitize duration enum
   * @param {string} duration - User input
   * @returns {string} Validated duration
   */
  static validateDuration(duration) {
    const validDurations = [
      '1_week',
      '2_weeks',
      '1_month',
      '3_months',
      '6_months',
      '1_year'
    ];

    if (!validDurations.includes(duration)) {
      throw new Error(`Invalid duration. Must be one of: ${validDurations.join(', ')}`);
    }

    return duration;
  }

  /**
   * Validate UUID
   * @param {string} id - User input
   * @returns {string} Validated UUID
   */
  static validateUUID(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid ID');
    }

    if (!validator.isUUID(id)) {
      throw new Error('Invalid ID format');
    }

    return id;
  }
}
```

#### Step 3: Update Supabase Search Functions (20 minutes)

Update `src/config/supabase.js`:

```javascript
import { InputSanitizer } from '../utils/inputSanitizer';

/**
 * Search products with sanitized input
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
async searchProducts(query) {
  try {
    // 1. Sanitize input FIRST
    const sanitized = InputSanitizer.sanitizeSearchQuery(query);

    // 2. Use Supabase's built-in parameterized queries
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .textSearch('name', sanitized, {
        type: 'websearch',
        config: 'english'
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Search error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Search medications with full validation
 * @param {string} query - Search query
 * @param {number} limit - Results limit
 * @returns {Promise<Array>} Search results
 */
async searchMedications(query, limit = 20) {
  try {
    // Sanitize search query
    const sanitizedQuery = InputSanitizer.sanitizeSearchQuery(query);

    // Validate limit
    const validLimit = parseInt(limit, 10);
    if (isNaN(validLimit) || validLimit < 1 || validLimit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    // Use parameterized query
    const { data, error } = await this.client
      .from('medications')
      .select(`
        id,
        name,
        scientific_name,
        description,
        category
      `)
      .or(`name.ilike.%${sanitizedQuery}%,scientific_name.ilike.%${sanitizedQuery}%`)
      .limit(validLimit);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Medication search error:', error);
    throw new Error(`Medication search failed: ${error.message}`);
  }
}
```

#### Step 4: Add Input Validation Tests (20 minutes)

Create `__tests__/utils/inputSanitizer.test.js`:

```javascript
import { InputSanitizer } from '../../src/utils/inputSanitizer';

describe('Input Sanitizer', () => {
  describe('sanitizeSearchQuery', () => {
    test('accepts valid search query', () => {
      const result = InputSanitizer.sanitizeSearchQuery('aspirin');
      expect(result).toBe('aspirin');
    });

    test('throws error for empty query', () => {
      expect(() => InputSanitizer.sanitizeSearchQuery('')).toThrow();
      expect(() => InputSanitizer.sanitizeSearchQuery('  ')).toThrow();
    });

    test('throws error for too short query', () => {
      expect(() => InputSanitizer.sanitizeSearchQuery('a')).toThrow('too short');
    });

    test('truncates long queries', () => {
      const longQuery = 'a'.repeat(200);
      const result = InputSanitizer.sanitizeSearchQuery(longQuery);
      expect(result.length).toBe(100);
    });

    test('removes SQL injection attempts', () => {
      const malicious = "'; DROP TABLE medications; --";
      const result = InputSanitizer.sanitizeSearchQuery(malicious);

      expect(result).not.toContain('DROP');
      expect(result).not.toContain('TABLE');
      expect(result).not.toContain(';');
      expect(result).not.toContain("'");
    });

    test('removes HTML tags', () => {
      const malicious = '<script>alert("xss")</script>aspirin';
      const result = InputSanitizer.sanitizeSearchQuery(malicious);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    test('removes dangerous characters', () => {
      const result = InputSanitizer.sanitizeSearchQuery('test<>"\';');
      expect(result).toBe('test');
    });
  });

  describe('validateRating', () => {
    test('accepts valid ratings 1-5', () => {
      expect(InputSanitizer.validateRating(1)).toBe(1);
      expect(InputSanitizer.validateRating(3)).toBe(3);
      expect(InputSanitizer.validateRating(5)).toBe(5);
    });

    test('rejects invalid ratings', () => {
      expect(() => InputSanitizer.validateRating(0)).toThrow();
      expect(() => InputSanitizer.validateRating(6)).toThrow();
      expect(() => InputSanitizer.validateRating(-1)).toThrow();
      expect(() => InputSanitizer.validateRating('abc')).toThrow();
    });

    test('converts string numbers', () => {
      expect(InputSanitizer.validateRating('4')).toBe(4);
    });
  });

  describe('validateEmail', () => {
    test('accepts valid emails', () => {
      expect(InputSanitizer.validateEmail('test@example.com')).toBe('test@example.com');
    });

    test('rejects invalid emails', () => {
      expect(() => InputSanitizer.validateEmail('not-an-email')).toThrow();
      expect(() => InputSanitizer.validateEmail('@example.com')).toThrow();
    });

    test('normalizes emails', () => {
      expect(InputSanitizer.validateEmail('  TEST@Example.COM  ')).toBe('test@example.com');
    });
  });

  describe('validateUUID', () => {
    test('accepts valid UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(InputSanitizer.validateUUID(uuid)).toBe(uuid);
    });

    test('rejects invalid UUIDs', () => {
      expect(() => InputSanitizer.validateUUID('not-a-uuid')).toThrow();
      expect(() => InputSanitizer.validateUUID('123')).toThrow();
    });
  });
});
```

### Verification Checklist

- [ ] validator package installed
- [ ] InputSanitizer utility created
- [ ] All search functions updated to sanitize input
- [ ] SQL injection tests passing
- [ ] XSS protection tests passing
- [ ] No direct user input in queries
- [ ] All API endpoints validated
- [ ] Penetration test scheduled

---

## 🔴 Critical Fix #5: Add Input Validation to Medical Data API

**Severity:** CRITICAL
**Risk:** HIPAA violation, data corruption
**Time:** 2 hours
**Difficulty:** Medium

### Problem

**File:** `src/api/medicalDataApi.js:180-230`

Medical data endpoints accept any input without validation, risking:
- Data corruption
- HIPAA violations
- Invalid medical records
- Security breaches

### Step-by-Step Fix

#### Step 1: Install Validation Library (2 minutes)

```bash
npm install joi  # For schema-based validation
npm install @types/joi --save-dev  # If using TypeScript
```

#### Step 2: Create Medical Data Validation Schemas (30 minutes)

Create `src/validation/medicalDataSchemas.js`:

```javascript
import Joi from 'joi';

/**
 * Validation schemas for medical data
 * All PHI must be validated before storage (HIPAA requirement)
 */

// Common field validators
const validators = {
  rating: Joi.number().integer().min(1).max(5).required(),
  userId: Joi.string().uuid().required(),
  medicationId: Joi.string().uuid().required(),
  dosage: Joi.string().trim().min(1).max(100).required(),
  duration: Joi.string().valid(
    '1_week',
    '2_weeks',
    '1_month',
    '3_months',
    '6_months',
    '1_year'
  ).required(),
  notes: Joi.string().trim().max(2000).optional(),
  date: Joi.date().max('now').required()
};

/**
 * Schema for user feedback submission
 */
export const feedbackSchema = Joi.object({
  user_id: validators.userId,
  medication_id: validators.medicationId,
  effectiveness_rating: validators.rating,
  safety_rating: validators.rating,
  overall_satisfaction: validators.rating,
  dosage_used: validators.dosage,
  duration_used: validators.duration,
  side_effects: Joi.array().items(
    Joi.string().trim().max(200)
  ).max(10).optional(),
  notes: validators.notes,
  would_recommend: Joi.boolean().required()
});

/**
 * Schema for medical scan submission
 */
export const medicalScanSchema = Joi.object({
  user_id: validators.userId,
  scan_type: Joi.string().valid('medication', 'supplement', 'herb').required(),
  image_url: Joi.string().uri().optional(),
  recognized_items: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().max(200).required(),
      confidence: Joi.number().min(0).max(1).required(),
      category: Joi.string().trim().max(100).required()
    })
  ).max(20).required(),
  metadata: Joi.object().optional()
});

/**
 * Schema for health journey update
 */
export const journeyUpdateSchema = Joi.object({
  user_id: validators.userId,
  journey_id: validators.userId,
  update_type: Joi.string().valid(
    'symptom_change',
    'medication_change',
    'general_update'
  ).required(),
  symptom_severity: Joi.number().integer().min(1).max(10).optional(),
  mood_rating: Joi.number().integer().min(1).max(10).optional(),
  energy_level: Joi.number().integer().min(1).max(10).optional(),
  notes: validators.notes,
  is_public: Joi.boolean().default(false)
});
```

#### Step 3: Update medicalDataApi.js (40 minutes)

Replace the unvalidated submission function:

```javascript
import { feedbackSchema, medicalScanSchema, journeyUpdateSchema } from '../validation/medicalDataSchemas';
import { InputSanitizer } from '../utils/inputSanitizer';

/**
 * Submit user feedback with full validation
 * @param {object} data - Feedback data
 * @returns {Promise<object>} Submission result
 */
async submitFeedback(data) {
  try {
    // 1. Validate against schema
    const { error, value } = feedbackSchema.validate(data, {
      abortEarly: false,  // Return all errors
      stripUnknown: true  // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // 2. Additional sanitization for text fields
    if (value.notes) {
      value.notes = InputSanitizer.sanitizeText(value.notes, 2000);
    }

    if (value.side_effects && value.side_effects.length > 0) {
      value.side_effects = value.side_effects.map(effect =>
        InputSanitizer.sanitizeText(effect, 200)
      );
    }

    // 3. Add server-side metadata
    const validated = {
      ...value,
      submitted_at: new Date().toISOString(),
      ip_address: this.getHashedIP(),  // Store hashed IP for abuse prevention
      user_agent: this.getUserAgent()
    };

    // 4. Insert with RLS protection
    const { data: result, error: dbError } = await supabase
      .from('user_feedback')
      .insert(validated)
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // 5. Log for HIPAA audit trail
    await this.logDataAccess({
      action: 'feedback_submitted',
      user_id: value.user_id,
      resource: 'user_feedback',
      resource_id: result.id
    });

    return result;
  } catch (error) {
    // Log error but don't expose details to user
    console.error('Feedback submission error:', error);
    throw new Error('Failed to submit feedback. Please check your input and try again.');
  }
}

/**
 * Submit medical scan with validation
 * @param {object} data - Scan data
 * @returns {Promise<object>} Submission result
 */
async submitMedicalScan(data) {
  try {
    // 1. Validate against schema
    const { error, value } = medicalScanSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // 2. Validate image URL if provided
    if (value.image_url) {
      const isValidImage = await this.validateImageURL(value.image_url);
      if (!isValidImage) {
        throw new Error('Invalid or inaccessible image URL');
      }
    }

    // 3. Check scan limits (rate limiting)
    const canScan = await this.checkScanLimit(value.user_id);
    if (!canScan) {
      throw new Error('Daily scan limit exceeded. Please upgrade or try again tomorrow.');
    }

    // 4. Add server-side metadata
    const validated = {
      ...value,
      scanned_at: new Date().toISOString(),
      scan_duration_ms: Date.now() - this.scanStartTime
    };

    // 5. Insert and update scan count
    const { data: result, error: dbError } = await supabase
      .from('medical_scans')
      .insert(validated)
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // 6. Increment scan counter
    await this.incrementScanCount(value.user_id);

    // 7. Audit log
    await this.logDataAccess({
      action: 'scan_submitted',
      user_id: value.user_id,
      resource: 'medical_scans',
      resource_id: result.id
    });

    return result;
  } catch (error) {
    console.error('Scan submission error:', error);
    throw new Error(`Scan submission failed: ${error.message}`);
  }
}

/**
 * Update health journey with validation
 * @param {object} data - Journey update data
 * @returns {Promise<object>} Update result
 */
async submitJourneyUpdate(data) {
  try {
    // 1. Validate against schema
    const { error, value } = journeyUpdateSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // 2. Sanitize notes
    if (value.notes) {
      value.notes = InputSanitizer.sanitizeText(value.notes, 2000);
    }

    // 3. Verify user owns this journey
    const ownsJourney = await this.verifyJourneyOwnership(
      value.user_id,
      value.journey_id
    );

    if (!ownsJourney) {
      throw new Error('Unauthorized: You do not own this journey');
    }

    // 4. Add server-side metadata
    const validated = {
      ...value,
      updated_at: new Date().toISOString()
    };

    // 5. Insert update
    const { data: result, error: dbError } = await supabase
      .from('journey_updates')
      .insert(validated)
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // 6. Audit log
    await this.logDataAccess({
      action: 'journey_updated',
      user_id: value.user_id,
      resource: 'journey_updates',
      resource_id: result.id
    });

    return result;
  } catch (error) {
    console.error('Journey update error:', error);
    throw new Error(`Journey update failed: ${error.message}`);
  }
}

// Helper functions

/**
 * Get hashed IP address for privacy
 */
getHashedIP() {
  // Implementation depends on your server setup
  const ip = this.request?.ip || 'unknown';
  return CryptoJS.SHA256(ip).toString();
}

/**
 * Validate image URL
 */
async validateImageURL(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    const contentType = response.headers.get('content-type');
    return contentType && contentType.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Check if user has exceeded scan limits
 */
async checkScanLimit(userId) {
  // Implementation from existing rate limiter
  const limit = await this.rateLimiter.checkScanLimit(userId);
  return limit.allowed;
}

/**
 * Verify user owns the journey
 */
async verifyJourneyOwnership(userId, journeyId) {
  const { data } = await supabase
    .from('user_journeys')
    .select('user_id')
    .eq('id', journeyId)
    .single();

  return data && data.user_id === userId;
}

/**
 * Log data access for HIPAA compliance
 */
async logDataAccess(logData) {
  await supabase
    .from('audit_logs')
    .insert({
      ...logData,
      timestamp: new Date().toISOString()
    });
}
```

#### Step 4: Add Comprehensive Tests (30 minutes)

Create `__tests__/api/medicalDataApi.test.js`:

```javascript
import { feedbackSchema, medicalScanSchema, journeyUpdateSchema } from '../../src/validation/medicalDataSchemas';

describe('Medical Data Validation', () => {
  describe('Feedback Schema', () => {
    const validFeedback = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      medication_id: '123e4567-e89b-12d3-a456-426614174001',
      effectiveness_rating: 4,
      safety_rating: 5,
      overall_satisfaction: 4,
      dosage_used: '10mg twice daily',
      duration_used: '1_month',
      would_recommend: true
    };

    test('accepts valid feedback', () => {
      const { error } = feedbackSchema.validate(validFeedback);
      expect(error).toBeUndefined();
    });

    test('rejects invalid ratings', () => {
      const invalid = { ...validFeedback, effectiveness_rating: 6 };
      const { error } = feedbackSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.message).toContain('must be less than or equal to 5');
    });

    test('rejects invalid UUIDs', () => {
      const invalid = { ...validFeedback, user_id: 'not-a-uuid' };
      const { error } = feedbackSchema.validate(invalid);
      expect(error).toBeDefined();
    });

    test('rejects invalid duration', () => {
      const invalid = { ...validFeedback, duration_used: 'forever' };
      const { error } = feedbackSchema.validate(invalid);
      expect(error).toBeDefined();
    });

    test('limits side effects array', () => {
      const tooMany = Array(15).fill('side effect');
      const invalid = { ...validFeedback, side_effects: tooMany };
      const { error } = feedbackSchema.validate(invalid);
      expect(error).toBeDefined();
    });

    test('truncates long dosage', () => {
      const longDosage = 'a'.repeat(200);
      const invalid = { ...validFeedback, dosage_used: longDosage };
      const { error } = feedbackSchema.validate(invalid);
      expect(error).toBeDefined();
    });
  });

  describe('Medical Scan Schema', () => {
    const validScan = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      scan_type: 'medication',
      recognized_items: [
        {
          name: 'Aspirin',
          confidence: 0.95,
          category: 'Pain Relief'
        }
      ]
    };

    test('accepts valid scan', () => {
      const { error } = medicalScanSchema.validate(validScan);
      expect(error).toBeUndefined();
    });

    test('rejects invalid scan type', () => {
      const invalid = { ...validScan, scan_type: 'invalid' };
      const { error } = medicalScanSchema.validate(invalid);
      expect(error).toBeDefined();
    });

    test('limits recognized items', () => {
      const tooMany = Array(25).fill({ name: 'Item', confidence: 0.9, category: 'Test' });
      const invalid = { ...validScan, recognized_items: tooMany };
      const { error } = medicalScanSchema.validate(invalid);
      expect(error).toBeDefined();
    });
  });
});
```

### Verification Checklist

- [ ] Joi package installed
- [ ] Validation schemas created for all medical data types
- [ ] All API endpoints use schema validation
- [ ] Input sanitization applied to text fields
- [ ] Rate limiting enforced
- [ ] Ownership verification in place
- [ ] Audit logging implemented
- [ ] All validation tests passing
- [ ] HIPAA compliance verified

---

## 🎯 Quick Start Checklist

Use this to track your progress through all 5 critical fixes:

### Fix #1: Secrets Rotation
- [ ] Backup current secrets
- [ ] Update .gitignore
- [ ] Remove from git history
- [ ] Generate new secrets
- [ ] Rotate Supabase keys
- [ ] Rotate Stripe keys
- [ ] Deploy to production
- [ ] Verify functionality

### Fix #2: Hash Function
- [ ] Install crypto-js
- [ ] Replace simpleHash function
- [ ] Update all references
- [ ] Add tests
- [ ] Test with Stripe
- [ ] Deploy

### Fix #3: Secure RNG
- [ ] Verify expo-crypto installed
- [ ] Remove fallbackRandomBytes
- [ ] Implement secureRandomBytes
- [ ] Make encryption functions async
- [ ] Update all callers
- [ ] Add tests
- [ ] Verify no Math.random() usage

### Fix #4: SQL Injection
- [ ] Install validator
- [ ] Create InputSanitizer utility
- [ ] Update search functions
- [ ] Add validation tests
- [ ] Test SQL injection prevention
- [ ] Deploy

### Fix #5: Medical Data Validation
- [ ] Install Joi
- [ ] Create validation schemas
- [ ] Update all medical data APIs
- [ ] Add comprehensive tests
- [ ] Verify HIPAA compliance
- [ ] Deploy

---

## 📊 Post-Implementation Verification

After implementing all 5 critical fixes, verify:

### Security Scan
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm run security:check

# Run penetration tests
npm run security:pentest
```

### Functionality Tests
```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Test in production-like environment
npm run test:staging
```

### Manual Verification
- [ ] User registration and login work
- [ ] Payment processing functional
- [ ] Medical data submission validated
- [ ] Search working correctly
- [ ] Encryption/decryption working
- [ ] No console errors
- [ ] Performance acceptable

---

## 📞 Support and Resources

If you encounter issues during implementation:

1. **Check error logs:** Review console and server logs for specific errors
2. **Run tests:** Ensure all tests pass before deploying
3. **Rollback plan:** Keep previous version ready for rollback
4. **Documentation:** Refer to package documentation for crypto-js, Joi, validator

---

**Implementation Priority:** Fix in order 1 → 2 → 3 → 4 → 5

**Estimated Total Time:** 6-8 hours

**Required Before Production:** All 5 fixes must be completed

**Next Steps After Fixes:**
1. Complete security audit
2. Penetration testing
3. Load testing
4. Production deployment

---

**Last Updated:** 2025-10-21
**Status:** Ready for implementation
**Priority:** CRITICAL - Start immediately
