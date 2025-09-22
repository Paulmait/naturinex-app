# 🚨 CRITICAL FIXES REQUIRED - Naturinex App

## IMMEDIATE ACTIONS NEEDED (Before App Store Submission)

### 1. 🔐 Security Fixes

#### Remove Hardcoded Supabase Keys
**File:** `src/config/supabase.js`
**Status:** ✅ FIXED - Removed hardcoded keys

#### Create Secure Environment Configuration
**Action Required:**
1. Set these environment variables in your hosting platform (Render/Vercel):
```
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[Get from Supabase Dashboard]
REACT_APP_STRIPE_PUBLISHABLE_KEY=[Get from Stripe Dashboard]
```

### 2. 🔥 Firebase Configuration

**CRITICAL:** Your app needs a real Firebase project for authentication to work.

#### Steps to Fix:
1. Go to https://console.firebase.google.com
2. Create a new project called "naturinex-app"
3. Enable Authentication > Sign-in methods > Email/Password
4. Get your configuration from Project Settings > General
5. Update `.env` with real values:
```env
REACT_APP_FIREBASE_API_KEY=your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. 💳 Stripe Configuration

**Current Issue:** Live Stripe key may be exposed
**Fix Required:**
1. Generate new Stripe keys at https://dashboard.stripe.com
2. Add to environment variables (not in code)
3. Never commit live keys to repository

### 4. 🏪 App Store Configuration

#### Update app.json:
```json
{
  "expo": {
    "owner": "your_actual_expo_username", // Fix: Currently "guampaul"
    "ios": {
      "bundleIdentifier": "com.naturinex.app",
      "infoPlist": {
        "NSHealthShareUsageDescription": "Naturinex needs access to read your health data to provide personalized wellness insights",
        "NSHealthUpdateUsageDescription": "Naturinex can save wellness data to your Health app",
        "NSBluetoothPeripheralUsageDescription": "Naturinex uses Bluetooth to connect with health monitoring devices",
        "NSLocationWhenInUseUsageDescription": "Naturinex uses your location to find nearby pharmacies and health services"
      }
    }
  }
}
```

#### Update eas.json:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-actual-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

### 5. 🌐 API URLs

**Files to Update:**
- `server/index.js:221-225` - Remove localhost from CORS
- All test files - Remove localhost references

### 6. 📱 Required App Store Assets

#### Create These Immediately:

**iOS Requirements:**
- [ ] Screenshots: iPhone 6.7", 6.5", 5.5", iPad Pro 12.9"
- [ ] Privacy Policy URL (host your privacy policy online)
- [ ] Support URL (create a support page)
- [ ] App Review demo account

**Android Requirements:**
- [ ] Feature Graphic: 1024x500px
- [ ] Screenshots: Phone and Tablet
- [ ] Short Description (80 characters)
- [ ] Full Description (4000 characters)

### 7. 🗑️ Remove Console Logs

Run this command to find all console.log statements:
```bash
grep -r "console.log" src/ --exclude-dir=node_modules | wc -l
```

Remove or comment out all console.log statements that might expose:
- User data
- API keys
- Authentication tokens
- Payment information

### 8. 📋 Legal Requirements

**Host these documents online:**
- Privacy Policy (required)
- Terms of Service (required)
- Support/Contact page (required)

Update `.env`:
```env
REACT_APP_PRIVACY_POLICY_URL=https://your-domain.com/privacy
REACT_APP_TERMS_OF_SERVICE_URL=https://your-domain.com/terms
REACT_APP_SUPPORT_URL=https://your-domain.com/support
```

## ⏰ TIMELINE

### Day 1 (Today):
- [ ] Fix Supabase configuration
- [ ] Create Firebase project
- [ ] Remove all console.logs
- [ ] Update environment variables

### Day 2:
- [ ] Generate app store screenshots
- [ ] Create feature graphics
- [ ] Write store descriptions
- [ ] Host legal documents

### Day 3:
- [ ] Test on real devices
- [ ] Fix any remaining issues
- [ ] Build production versions

### Day 4-5:
- [ ] Submit to TestFlight (iOS)
- [ ] Submit to Google Play internal testing
- [ ] Begin beta testing

### Day 6-7:
- [ ] Fix beta feedback issues
- [ ] Final production builds
- [ ] Submit for review

## 🎯 CHECKLIST BEFORE SUBMISSION

- [ ] No hardcoded API keys in code
- [ ] All environment variables properly set
- [ ] Firebase project created and configured
- [ ] Stripe keys secured
- [ ] Privacy Policy hosted and accessible
- [ ] Terms of Service hosted and accessible
- [ ] Support contact configured
- [ ] All console.logs removed
- [ ] App tested on real devices
- [ ] Screenshots prepared for all sizes
- [ ] Store descriptions written
- [ ] Demo account created for reviewers

## 📞 GET HELP

If you need help with any of these steps:

1. **Firebase Setup:** https://firebase.google.com/docs/web/setup
2. **Stripe Configuration:** https://stripe.com/docs/keys
3. **App Store Guidelines:** https://developer.apple.com/app-store/review/guidelines/
4. **Google Play Guidelines:** https://play.google.com/console/about/guides/

## ⚠️ DO NOT SUBMIT UNTIL ALL ITEMS ARE COMPLETE

The app will be rejected if submitted with:
- Hardcoded API keys
- Missing Firebase configuration
- No privacy policy URL
- Console.log statements with sensitive data
- Localhost URLs in production code

---

**Next Step:** Start with creating the Firebase project - this is blocking authentication from working properly.