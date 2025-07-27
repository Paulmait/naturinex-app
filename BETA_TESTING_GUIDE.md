# Beta Testing Guide for Naturinex

## 🚀 Deployment & Beta Testing Setup Complete

### ✅ What's Been Implemented

1. **App Store Compliance**
   - ✅ External API attribution (Google Gemini) added
   - ✅ Data retention policy details added
   - ✅ GDPR compliance for EU users implemented

2. **Backend Configuration**
   - ✅ Beta promo codes configured: `BETA2024`, `NATURINEXBETA`, `TESTFLIGHT`
   - ✅ 100% discount for beta testers
   - ✅ Render deployment guide created

3. **Frontend Components**
   - ✅ Beta banner component created
   - ✅ Beta feedback system already exists

### 📱 Beta Testing Process

#### For TestFlight (iOS)
1. Upload your app to App Store Connect
2. Create a TestFlight beta testing group
3. Share promo code `TESTFLIGHT` with testers
4. Beta testers get unlimited scans

#### For Google Play Console (Android)
1. Upload to Internal Testing track
2. Share promo code `BETA2024` with testers
3. Enable test mode in Play Console

### 💰 Beta Testing & Payments

**Current Setup:**
- Beta testers using promo codes get 100% discount
- No real charges during beta period
- Stripe test mode recommended

**How Beta Testers Work:**
1. Testers download app from TestFlight/Play Console
2. They create account and enter promo code
3. They get premium features for free
4. All transactions are in test mode

### 🔧 Render Backend Deployment

**Required Environment Variables:**
```
GEMINI_API_KEY=your_api_key
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NODE_ENV=production
PORT=10000
```

**Start Command:** `cd server && node index.js`

### 📊 Beta Feedback Collection

The app already has a comprehensive beta feedback system that collects:
- Overall rating (1-5 stars)
- Feature-specific ratings
- Bug reports
- Suggestions
- Device information

### 🎯 Next Steps

1. **Deploy Backend to Render**
   - Add environment variables
   - Update start command
   - Deploy and verify

2. **Set Up App Stores**
   - Create TestFlight build
   - Set up Google Play internal testing
   - Configure test environments

3. **Prepare Beta Testers**
   - Create onboarding documentation
   - Share promo codes
   - Set up feedback channels

### 📝 Beta Tester Instructions

Share this with your beta testers:

```
Welcome to Naturinex Beta Testing!

1. Download the app from TestFlight/Play Console
2. Create an account
3. Use promo code: BETA2024
4. You'll get unlimited scans and all premium features for free
5. Please provide feedback using the in-app feedback button
6. Report any bugs or issues you encounter

Thank you for helping us improve Naturinex!
```

### ⚠️ Important Notes

- All beta transactions are in test mode (no real charges)
- Beta promo codes expire on March 31, 2025
- Feedback is stored in Firebase under 'beta_feedback' collection
- Monitor Render logs for any backend issues

Your app is now ready for beta testing deployment!