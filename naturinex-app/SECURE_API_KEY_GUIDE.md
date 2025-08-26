# 🔐 Secure API Key Management for Naturinex

## The Problem with app.json

**NEVER** put sensitive keys directly in app.json or your codebase:
- ❌ Firebase API keys (somewhat safe, but not ideal)
- ❌ Stripe Secret Keys (CRITICAL - never expose)
- ❌ Google OAuth secrets
- ❌ Any server-side API keys

## Secure Solution Architecture

### 1. Public vs Private Keys

**Can be in client code (relatively safe):**
- ✅ Firebase config (with security rules)
- ✅ Stripe Publishable Key (designed to be public)
- ✅ Google OAuth Client IDs

**MUST be server-side only:**
- 🚫 Stripe Secret Key
- 🚫 Firebase Admin SDK
- 🚫 Any API keys with write/delete permissions

### 2. Recommended Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│   Your Backend   │────▶│  External APIs  │
│  (Public keys)  │     │  (Secret keys)   │     │ (Stripe, etc.)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Implementation Guide

### Step 1: Use EAS Secrets for Build-Time Variables

```bash
# Set secrets that are needed during build
eas secret:create --scope project --name FIREBASE_API_KEY --value "your-actual-key"
eas secret:create --scope project --name GOOGLE_CLIENT_ID --value "your-client-id"
```

### Step 2: Create eas.json with Secret References

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "@FIREBASE_API_KEY",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID": "@GOOGLE_CLIENT_ID"
      }
    }
  }
}
```

### Step 3: Update Your Code to Use Environment Variables

**app.json:**
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://naturinex-app.onrender.com",
      "stripePublishableKey": "pk_live_...", // This is OK - designed to be public
      "firebaseApiKey": "@EXPO_PUBLIC_FIREBASE_API_KEY",
      "googleClientId": "@EXPO_PUBLIC_GOOGLE_CLIENT_ID"
    }
  }
}
```

**In your code:**
```javascript
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  // ... other config
};
```

### Step 4: Secure Your Backend

**Never expose these in client code:**
```javascript
// backend/server.js
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FIREBASE_ADMIN_KEY = process.env.FIREBASE_ADMIN_KEY;

// These stay on server only!
```

### Step 5: Use Backend Proxy for Sensitive Operations

**Bad (client-side):**
```javascript
// ❌ Don't do this
const response = await fetch('https://api.stripe.com/v1/charges', {
  headers: {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}` // NEVER!
  }
});
```

**Good (server-proxy):**
```javascript
// ✅ Do this instead
const response = await fetch(`${API_URL}/create-payment`, {
  method: 'POST',
  body: JSON.stringify({ amount, token })
});
```

## Firebase Specific Security

### Step 1: Secure Firestore Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Prevent unauthorized access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 2: Enable App Check (Additional Security)
```javascript
// In Firebase Console
1. Go to App Check
2. Register your app
3. Enable enforcement

// In your app
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-key'),
  isTokenAutoRefreshEnabled: true
});
```

## For Development vs Production

### Development (.env.local - git ignored):
```bash
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_FIREBASE_API_KEY=your-dev-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Production (EAS Secrets):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.naturinex.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-prod-key"
```

## App Store Compliance

### What Apple/Google Look For:
1. ❌ Hardcoded secret keys in code
2. ❌ Unencrypted sensitive data storage
3. ❌ API keys that can be extracted and misused
4. ✅ Proper use of keychain/keystore
5. ✅ Server-side validation
6. ✅ Secure communication (HTTPS)

### Safe Practices:
- ✅ Firebase config in client (with security rules)
- ✅ Stripe publishable key in client
- ✅ All operations validated server-side
- ✅ Rate limiting on your backend
- ✅ API keys rotated regularly

## Quick Security Checklist

Before submitting to app stores:

- [ ] No secret keys in source code
- [ ] All sensitive operations go through your backend
- [ ] Firebase security rules are restrictive
- [ ] API endpoints have authentication
- [ ] Environment variables used for configuration
- [ ] Git repository doesn't contain secrets
- [ ] Backend validates all requests
- [ ] HTTPS everywhere
- [ ] Rate limiting implemented
- [ ] Error messages don't expose system details

## Migration Plan

1. **Immediate:** Remove any secret keys from app.json
2. **Today:** Set up EAS secrets for build configuration
3. **Tomorrow:** Implement backend proxy for sensitive operations
4. **This Week:** Add Firebase App Check
5. **Before Launch:** Security audit with penetration testing

Remember: It's better to be overly cautious with security than to have your keys compromised!