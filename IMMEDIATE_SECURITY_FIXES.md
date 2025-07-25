# 🚨 Immediate Security Fixes for Naturinex

## Current Security Status

### ✅ Already Secure:
- **Stripe Publishable Key** in app.json - This is OK! It's designed to be public
- **API URL** - Public endpoint, safe to expose

### ⚠️ Needs Attention:
- **Firebase Config** - Currently has placeholders, needs proper setup
- **Google OAuth Client IDs** - Currently placeholders

### 🚫 Critical (if you had them):
- Never put Stripe Secret Key in client code
- Never put Firebase Admin credentials in client

## Recommended Approach for Naturinex

### Option 1: Use EAS Secrets (Recommended for Production)

```bash
# Set up secrets for production builds
eas secret:create --scope project --name FIREBASE_API_KEY --value "AIzaSy..."
eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN --value "naturinex-app.firebaseapp.com"
eas secret:create --scope project --name FIREBASE_PROJECT_ID --value "naturinex-app"
eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET --value "naturinex-app.appspot.com"
eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID --value "123456789"
eas secret:create --scope project --name FIREBASE_APP_ID --value "1:123456789:web:abc"
```

Then update app.json:
```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "@FIREBASE_API_KEY",
      "firebaseAuthDomain": "@FIREBASE_AUTH_DOMAIN",
      // ... etc
    }
  }
}
```

### Option 2: Runtime Configuration (More Flexible)

Create a configuration endpoint on your backend:

**Backend (server/index.js):**
```javascript
app.get('/api/config', (req, res) => {
  // Return public configuration
  res.json({
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    },
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    }
  });
});
```

**Frontend (App.js):**
```javascript
const [config, setConfig] = useState(null);

useEffect(() => {
  // Load configuration from backend
  fetch(`${API_URL}/api/config`)
    .then(res => res.json())
    .then(data => {
      setConfig(data);
      // Initialize Firebase with config
      initializeApp(data.firebase);
    });
}, []);
```

### Option 3: Firebase Remote Config (Advanced)

Use Firebase Remote Config to manage configuration:

```javascript
import { getRemoteConfig, fetchAndActivate } from "firebase/remote-config";

const remoteConfig = getRemoteConfig();
remoteConfig.settings.minimumFetchIntervalMillis = 3600000;

fetchAndActivate(remoteConfig)
  .then(() => {
    // Get configuration values
    const apiUrl = getValue(remoteConfig, "api_url").asString();
  });
```

## For Testing (Expo Go)

Since you need to test NOW, here's a pragmatic approach:

### 1. Create a Test Firebase Project
- Use a separate Firebase project for testing
- Less critical if test keys are exposed

### 2. Temporary Solution for Testing
```javascript
// src/config/firebase.js
const firebaseConfig = {
  // For testing only - replace before production
  apiKey: "AIza..._TEST_KEY",
  authDomain: "naturinex-test.firebaseapp.com",
  // ...
};

// Add warning comment
if (__DEV__) {
  console.warn("Using test Firebase configuration!");
}
```

### 3. Before Production
- Set up EAS secrets
- Remove all keys from source code
- Use environment variables

## Security Rules for Firebase

```javascript
// firestore.rules - CRITICAL for security
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Secure user data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.data.keys().hasAll(['email', 'isPremium'])
        && !request.resource.data.keys().hasAny(['isAdmin', 'specialPrivileges']);
    }
    
    // Prevent access to everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Will App Stores Reject?

### ✅ App Stores are OK with:
- Public API keys (like Firebase config) IF secured with rules
- Stripe publishable keys
- Public OAuth client IDs
- API endpoints

### ❌ App Stores will REJECT for:
- Hardcoded secret keys (Stripe Secret, Admin keys)
- Unencrypted storage of user passwords
- Keys that allow unauthorized access to user data
- Security vulnerabilities that expose user data

## Your Action Plan

1. **For Testing Today:**
   - Use Firebase config directly (it's relatively safe with security rules)
   - Test with Expo Go
   - Ensure Firestore rules are restrictive

2. **Before Beta Testing:**
   - Set up EAS secrets
   - Move to environment variables
   - Test with development builds

3. **Before Production:**
   - Security audit
   - Remove all sensitive data from code
   - Implement backend validation

The key insight: Firebase config in client code is acceptable IF you have proper security rules. The real danger is server-side keys (like Stripe Secret Key) in client code.