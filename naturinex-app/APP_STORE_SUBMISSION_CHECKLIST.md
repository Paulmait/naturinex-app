# ✅ NATURINEX APP STORE SUBMISSION CHECKLIST
## Pre-Submission Verification

**Version**: 1.0.0
**Build**: iOS 3, Android 2
**Target Submission Date**: TBD (After critical fixes)

---

## 🚨 CRITICAL (MUST COMPLETE BEFORE SUBMISSION)

### Security
- [ ] **CRITICAL**: Exposed secrets removed from git history (.env.production)
- [ ] **CRITICAL**: New JWT_SECRET generated and deployed
- [ ] **CRITICAL**: New SESSION_SECRET generated and deployed
- [ ] **CRITICAL**: New ENCRYPTION_KEY generated and deployed
- [ ] All API keys configured in EAS secrets
- [ ] All API keys configured in Supabase Edge Functions
- [ ] .gitignore includes .env.production
- [ ] Verified git history clean (`git log --all -p | grep -i "jwt_secret"`)

### Legal Documents (REQUIRED BY BOTH STORES)
- [ ] Privacy Policy hosted at public URL: _______________________
- [ ] Terms of Service hosted at public URL: _____________________
- [ ] URLs are HTTPS
- [ ] URLs are accessible without authentication
- [ ] Documents include company name and contact email
- [ ] Last updated date is current

### API Keys (REQUIRED FOR APP TO FUNCTION)
- [ ] GEMINI_API_KEY obtained and configured
- [ ] GOOGLE_VISION_API_KEY obtained and configured
- [ ] EXPO_PUBLIC_SUPABASE_ANON_KEY configured
- [ ] SUPABASE_SERVICE_ROLE_KEY configured
- [ ] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY configured (production)
- [ ] STRIPE_SECRET_KEY configured (production, server-side only)
- [ ] STRIPE_WEBHOOK_SECRET configured
- [ ] SENTRY_DSN configured (optional but recommended)

---

## 📱 APPLE APP STORE REQUIREMENTS

### App Store Connect Setup
- [ ] Apple Developer account active ($99/year paid)
- [ ] App created in App Store Connect (ID: 6749164831)
- [ ] Bundle ID matches: com.naturinex.app
- [ ] Team ID correct: LFB9Z5Q3Y9
- [ ] App Store Connect API key downloaded: AuthKey_NUNBB3ZFJJ.p8
- [ ] API key saved in: ./secrets/AuthKey_NUNBB3ZFJJ.p8

### App Information
- [ ] App name: Naturinex Wellness Guide
- [ ] Subtitle (max 30 chars): _______________________
- [ ] Category: Health & Fitness > Medicine
- [ ] Secondary Category: Education
- [ ] Privacy Policy URL added: _______________________
- [ ] Terms of Service URL added: _____________________
- [ ] Support URL: _______________________
- [ ] Marketing URL (optional): _______________________

### Age Rating
- [ ] Content rating: 17+ (Medical/Treatment Information)
- [ ] Medical questionnaire completed
- [ ] Declared: Educational medical information
- [ ] Declared: No diagnosis or treatment
- [ ] Declared: Includes medical disclaimer

### Permissions & Usage Descriptions (Already in app.json)
- [ ] Camera: "capture text from product labels for educational wellness information" ✅
- [ ] Photos: "analyze product labels and provide educational wellness information" ✅
- [ ] Health: "read your health data to provide personalized wellness insights" ✅
- [ ] Location: "find nearby pharmacies and health services" ✅
- [ ] Biometric: "use Face ID for secure access to your health data" ✅

### App Review Information
- [ ] First name: _______________________
- [ ] Last name: _______________________
- [ ] Phone number: _______________________
- [ ] Email: _______________________
- [ ] Demo account credentials (if required):
  - Username: _______________________
  - Password: _______________________
- [ ] Review notes prepared (explain medical disclaimer, how to test)

### Screenshots Required (Need 6.5" and 5.5" for iPhone)
- [ ] iPhone 6.7" (1290 x 2796): 3-10 screenshots
  - [ ] Launch screen with medical disclaimer
  - [ ] Home screen / Dashboard
  - [ ] Camera/OCR in action
  - [ ] Analysis results with alternatives
  - [ ] Subscription screen
  - [ ] Profile screen
- [ ] iPhone 5.5" (1242 x 2208): 3-10 screenshots
- [ ] iPad Pro 12.9" (2048 x 2732): Optional
- [ ] App Preview Video (optional): Max 30 seconds

### Build & Submission
- [ ] Build created: `eas build --platform ios --profile production`
- [ ] Build number incremented (current: 3, next: _____)
- [ ] TestFlight beta testing completed (minimum 7 days recommended)
- [ ] No crashes in TestFlight analytics
- [ ] Submitted to App Review via: `eas submit --platform ios`

### Compliance
- [ ] Medical disclaimer shown before app use ✅
- [ ] Emergency warnings (911) displayed ✅
- [ ] No medical diagnosis claims ✅
- [ ] Educational purpose clear ✅
- [ ] COPPA compliant (17+ age gate) ✅
- [ ] Encryption declaration: ITSAppUsesNonExemptEncryption: false ✅

---

## 🤖 GOOGLE PLAY STORE REQUIREMENTS

### Google Play Console Setup
- [ ] Google Play Developer account active ($25 one-time fee paid)
- [ ] App created in Play Console
- [ ] Package name matches: com.naturinex.app
- [ ] Service account JSON key downloaded: google-play-key.json
- [ ] Key saved in: ./secrets/google-play-key.json

### Store Listing
- [ ] App name: Naturinex Wellness Guide
- [ ] Short description (max 80 chars): _______________________
- [ ] Full description (max 4000 chars): _______________________
- [ ] Category: Health & Fitness > Medical
- [ ] Privacy Policy URL: _______________________
- [ ] Developer email: _______________________
- [ ] Developer website: _______________________

### Content Rating
- [ ] ESRB questionnaire completed
- [ ] Content rating received: Expected: Everyone or 12+
- [ ] Medical disclaimer questions answered
- [ ] Educational purpose declared

### Data Safety
- [ ] **REQUIRED**: Data Safety form completed
- [ ] Data types collected:
  - [ ] Email address (account creation)
  - [ ] Health data (medication information)
  - [ ] Photos (medication images)
  - [ ] Usage data (analytics)
- [ ] Data usage declared:
  - [ ] App functionality
  - [ ] Analytics
  - [ ] Personalization
- [ ] Data security practices:
  - [x] Data encrypted in transit (HTTPS)
  - [x] Data encrypted at rest (Supabase)
  - [x] Users can request data deletion
- [ ] Data sharing: None (not shared with third parties) ✅

### Screenshots Required
- [ ] Phone (16:9): 2-8 screenshots
  - [ ] Launch screen with medical disclaimer
  - [ ] Home screen
  - [ ] Camera/OCR screen
  - [ ] Analysis results
  - [ ] Subscription screen
- [ ] 7" Tablet (16:9): 2-8 screenshots (optional)
- [ ] 10" Tablet (16:9): 2-8 screenshots (optional)
- [ ] Feature graphic (1024 x 500): 1 required
- [ ] App icon (512 x 512): 1 required

### Build & Submission
- [ ] Build created: `eas build --platform android --profile production`
- [ ] Version code incremented (current: 2, next: _____)
- [ ] Internal testing completed (minimum 7 days recommended)
- [ ] Closed beta testing (optional, recommended for medical apps)
- [ ] Production release track selected: Beta or Production
- [ ] Submitted via: `eas submit --platform android`

### Compliance
- [ ] Medical disclaimer shown before app use ✅
- [ ] Sensitive permissions declared and justified ✅
- [ ] Target SDK 34+ (Android 14) ✅
- [ ] 64-bit architecture support ✅
- [ ] No deceptive content ✅
- [ ] COPPA compliant (12+ age rating) ✅

---

## 🧪 TESTING CHECKLIST (BOTH PLATFORMS)

### Functional Testing
- [ ] **Authentication**: Signup, login, password reset, logout
- [ ] **2FA**: TOTP, SMS, Biometric all work
- [ ] **Camera**: Opens, captures photos, permissions requested
- [ ] **OCR**: Extracts text from medication images (>70% accuracy)
- [ ] **AI Analysis**: Returns natural alternatives (<5s response time)
- [ ] **Medical Disclaimer**: Shows on first launch, tracks acceptance
- [ ] **Safety Warnings**: Critical medication warnings displayed
- [ ] **Rate Limiting**: Free tier limited to 5 scans/month
- [ ] **Subscriptions**: Stripe checkout works, webhooks process
- [ ] **Payment**: Test card 4242 4242 4242 4242 completes successfully
- [ ] **Profile**: User data displays correctly, can edit
- [ ] **Scan History**: Shows past scans (for paid users)
- [ ] **Offline Mode**: App works without internet (limited)
- [ ] **Deep Links**: naturinex:// links work
- [ ] **Push Notifications**: Receive and display correctly

### Device Testing (iOS)
- [ ] iPhone 12 (iOS 17)
- [ ] iPhone 14 Pro (iOS 17)
- [ ] iPhone 15 (iOS 17)
- [ ] iPad Air (iPadOS 17)
- [ ] Face ID works
- [ ] Touch ID works (older devices)

### Device Testing (Android)
- [ ] Google Pixel 6 (Android 13)
- [ ] Samsung Galaxy S22 (Android 13/14)
- [ ] OnePlus device (Android 13/14)
- [ ] Tablet (10" screen)
- [ ] Fingerprint authentication works

### Performance Testing
- [ ] App launch time < 3 seconds
- [ ] OCR processing time < 10 seconds
- [ ] AI analysis time < 5 seconds
- [ ] No crashes in 1 hour of testing
- [ ] No memory leaks
- [ ] Battery usage reasonable (<5% per hour)
- [ ] Network usage reasonable (<10 MB per scan)
- [ ] App size < 50 MB (iOS), < 50 MB (Android)

### Security Testing
- [ ] SQL injection attempts blocked
- [ ] XSS attacks prevented
- [ ] CSRF tokens validated (web)
- [ ] Rate limiting enforced
- [ ] JWT tokens expire correctly
- [ ] Invalid tokens rejected
- [ ] API endpoints require authentication
- [ ] Sensitive data not in logs
- [ ] No secrets in source code
- [ ] HTTPS enforced (no HTTP)

### Accessibility Testing
- [ ] VoiceOver works (iOS)
- [ ] TalkBack works (Android)
- [ ] Larger text sizes supported
- [ ] High contrast mode works
- [ ] Color blind friendly
- [ ] Keyboard navigation works (web)

---

## 📊 ANALYTICS & MONITORING

### Pre-Launch
- [ ] Sentry error tracking configured
- [ ] Firebase Analytics configured (optional)
- [ ] Custom event tracking implemented
- [ ] Performance monitoring enabled
- [ ] Crash reporting enabled

### Post-Launch Monitoring
- [ ] Dashboard to monitor:
  - [ ] Daily active users (DAU)
  - [ ] Monthly active users (MAU)
  - [ ] Signup conversion rate
  - [ ] Subscription conversion rate
  - [ ] Scan success rate
  - [ ] OCR accuracy rate
  - [ ] AI analysis success rate
  - [ ] Error rate by endpoint
  - [ ] Average response time
  - [ ] Crash-free users %

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] Testing completed (see Testing Checklist above)
- [ ] Legal documents hosted and accessible
- [ ] Privacy policy and terms reviewed by legal counsel (recommended)
- [ ] Support email configured and monitored: _______________________
- [ ] Customer support plan ready

### Deployment Commands
```bash
# iOS Production Build
eas build --platform ios --profile production

# Android Production Build
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

### Post-Submission
- [ ] Builds submitted successfully
- [ ] Submission confirmation received
- [ ] Review timeline noted (iOS: 1-3 days, Android: 3-7 days)
- [ ] Team notified of submission
- [ ] Monitoring dashboard ready
- [ ] Support email monitored
- [ ] Social media ready for launch announcement

---

## 🆘 IF REJECTED

### Apple App Store
Common rejection reasons:
- [ ] Privacy policy missing or not accessible
- [ ] Medical claims too strong (diagnosis/treatment)
- [ ] Permissions not justified
- [ ] Crashes or bugs
- [ ] Incomplete information

**Action**: Review rejection details carefully, fix issues, resubmit

### Google Play Store
Common rejection reasons:
- [ ] Data Safety form incomplete
- [ ] Privacy policy missing
- [ ] Permissions not declared
- [ ] Medical content without disclaimer
- [ ] Target SDK too old

**Action**: Review rejection email, fix issues, resubmit

---

## 📞 CONTACTS & RESOURCES

### Support
- Developer Email: _______________________
- Support Email: _______________________
- Emergency Contact: _______________________

### Resources
- Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Policy Center: https://play.google.com/about/developer-content-policy/
- EAS Documentation: https://docs.expo.dev/eas/
- Supabase Documentation: https://supabase.com/docs
- Stripe Documentation: https://stripe.com/docs

---

## ✅ FINAL SIGN-OFF

### Checklist Complete
- [ ] All critical items completed (security, legal, API keys)
- [ ] All high priority items completed (testing, compliance)
- [ ] All medium priority items reviewed (optional features)
- [ ] Team approval received
- [ ] Ready for submission

### Submission Details
- **iOS Build Number**: _______
- **iOS Submission Date**: _______
- **Android Version Code**: _______
- **Android Submission Date**: _______
- **Privacy Policy URL**: _______________________
- **Terms of Service URL**: _____________________

### Post-Launch
- [ ] Launch day monitoring scheduled
- [ ] Team on standby for issues
- [ ] Press release ready (optional)
- [ ] Social media announcement ready
- [ ] Customer support ready

---

**Current Status**: ⚠️ NOT READY - Critical security issue must be resolved first

**Next Action**: Follow URGENT_SECURITY_FIX_PLAN.md

**Estimated Submission Date**: TBD (After security fixes complete)

---

*Last Updated: November 1, 2025*
*Version: 1.0.0*
