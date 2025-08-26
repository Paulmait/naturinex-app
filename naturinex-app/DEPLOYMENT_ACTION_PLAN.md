# 🚀 DEPLOYMENT ACTION PLAN - PRIORITY ORDER

## ✅ COMPLETED FIXES
1. **Firebase Authentication** - Server now works without Firebase
2. **MongoDB Integration** - Database connected and working
3. **Stripe Webhooks** - Configured for new URL
4. **Medical Disclaimers** - Properly implemented
5. **Privacy Compliance** - GDPR/CCPA ready

## 🔴 CRITICAL BLOCKERS (Must Fix)

### 1. Update Expo SDK (30 mins)
```bash
npm install expo@~52.0.0
npx expo install --fix
npx expo doctor
```

### 2. Host Legal Documents (15 mins)
Quick solution - GitHub Pages:
1. Create repo: `naturinex-legal`
2. Add `privacy-policy.html` and `terms.html`
3. Enable GitHub Pages
4. Update app with URLs

### 3. Apple Developer Account ($99/year)
1. Sign up at https://developer.apple.com
2. Create App ID
3. Generate API key
4. Update eas.json

### 4. Fix EAS Credentials (10 mins)
```json
// eas.json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-real-email@gmail.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123XYZ"
      }
    }
  }
}
```

## 🟡 IMPORTANT (But Not Blocking)

### 1. Firebase Service Account
- Go to Firebase Console > Service Accounts
- Generate private key
- Add to server/.env
- Redeploy server

### 2. Google Sign-In Fix
- Verify OAuth consent screen
- Check client IDs match
- Add SHA-1 for Android

### 3. Run Full Data Ingestion
```bash
cd server
node scripts/runDataIngestion.js
```

## 📅 DEPLOYMENT TIMELINE

### Day 1 (Today)
- [ ] Update Expo SDK
- [ ] Host legal documents
- [ ] Create Apple Developer account
- [ ] Fix EAS credentials

### Day 2
- [ ] Configure App Store Connect
- [ ] Create app listing
- [ ] Upload screenshots
- [ ] Build with EAS

### Day 3
- [ ] Submit to TestFlight
- [ ] Internal testing
- [ ] Fix any issues

### Day 4
- [ ] Submit for review
- [ ] Monitor status

## 🧪 TESTING CHECKLIST

Before submission:
- [ ] Guest user: 3 free scans work
- [ ] Subscription upgrade works
- [ ] Camera captures photos
- [ ] Analysis returns results
- [ ] Cancel subscription works
- [ ] Legal links open

## 💰 COSTS
- Apple Developer: $99/year
- Google Play: $25 one-time
- Total: ~$125

## 🆘 EMERGENCY CONTACTS
- Expo Support: https://chat.expo.dev
- Apple Developer: 1-800-633-2152
- Stack Overflow: Tag with [expo] [react-native]

## 🎯 SUCCESS METRICS
- App approved within 48 hours
- No critical rejections
- Beta testers can install
- Subscriptions process correctly

---

**Remember**: The app is technically solid. Main blockers are administrative (credentials) and minor updates (SDK). You can have this live in 3-4 days!