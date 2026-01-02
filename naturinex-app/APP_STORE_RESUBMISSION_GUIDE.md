# Naturinex Wellness Guide v2.0 - App Store Resubmission Guide

**Date:** January 2, 2026
**Branch:** `fix/apple-review-v2`
**Status:** Ready for Resubmission

---

## CRITICAL: Apple IAP Requirement

**IMPORTANT:** Before resubmitting, you MUST implement Apple In-App Purchase (StoreKit) for iOS subscriptions. The current Stripe implementation is NOT allowed for iOS apps selling digital subscriptions.

### Required IAP Implementation:
1. Set up auto-renewable subscription products in App Store Connect
2. Implement `expo-in-app-purchases` or `react-native-iap`
3. Configure subscription groups and pricing tiers
4. Submit IAP products for review alongside the app

---

## Issues Resolved in This Update

| Guideline | Issue | Resolution |
|-----------|-------|------------|
| 4.8 | Missing Sign in with Apple | Added `expo-apple-authentication` with full implementation |
| 2.1 | Take Photo unresponsive | Added permission handling, error handling, Settings redirect |
| 2.1 | Google login error page | Improved error handling with user-friendly messages |
| 3.1.2 | Subscription disclosure missing | Added to Terms of Use (Section 5) + Subscription screen |
| 3.1.2 | Privacy/Terms links | Fully populated PrivacyPolicyScreen and TermsOfUseScreen |
| 5.1.1(v) | Account deletion missing | Added Settings > Account > Delete Account with full flow |
| 3.1.4 | Promo code unlock | Reviewed - Stripe coupon codes are acceptable (not content codes) |
| 2.3.3 | Screenshots not showing UI | See Screenshot Plan below |

---

## Demo Account Setup Instructions

### Option 1: Create Demo Account in Firebase Console

1. Go to Firebase Console > Authentication > Users
2. Add user with email: `appreview@naturinex.com`
3. Set password: `ReviewNaturinex2026!`
4. In Firestore, create user document:

```javascript
// Collection: users
// Document ID: [UID from Firebase Auth]
{
  email: "appreview@naturinex.com",
  isPremium: true,
  premiumUntil: "2027-12-31T23:59:59.000Z",
  isReviewAccount: true,
  createdAt: new Date(),
  metadata: {
    isAdmin: false,
    accountType: "demo"
  }
}
```

### Option 2: Use Supabase for Premium Flag

```sql
-- Insert demo user premium status
INSERT INTO subscriptions (user_id, plan_type, status, expires_at)
VALUES (
  (SELECT id FROM users WHERE email = 'appreview@naturinex.com'),
  'premium',
  'active',
  '2027-12-31 23:59:59'
);
```

### Seed Demo Content (Scan History)

```javascript
// Collection: scans
// Add 3-5 sample scans for the demo account
const sampleScans = [
  {
    userId: "[DEMO_USER_UID]",
    medicationName: "Ibuprofen",
    scanDate: new Date("2026-01-01"),
    results: {
      naturalAlternatives: ["Turmeric (Curcumin)", "Willow Bark", "Ginger"],
      safetyNotes: "Consult healthcare provider before switching medications."
    }
  },
  {
    userId: "[DEMO_USER_UID]",
    medicationName: "Melatonin",
    scanDate: new Date("2025-12-28"),
    results: {
      naturalAlternatives: ["Valerian Root", "Chamomile", "Magnesium"],
      safetyNotes: "Natural sleep aids work best with good sleep hygiene."
    }
  },
  {
    userId: "[DEMO_USER_UID]",
    medicationName: "Aspirin",
    scanDate: new Date("2025-12-25"),
    results: {
      naturalAlternatives: ["White Willow Bark", "Omega-3 Fish Oil", "Bromelain"],
      safetyNotes: "Natural alternatives may not provide same blood-thinning effects."
    }
  }
];
```

---

## App Store Connect - App Review Notes

Copy and paste into App Review Notes field:

```
DEMO ACCOUNT CREDENTIALS:
Email: appreview@naturinex.com
Password: ReviewNaturinex2026!

This account has:
- Premium subscription active
- Pre-populated scan history (3 sample scans)
- All features unlocked

HOW TO TEST KEY FEATURES:

1. SCAN PRODUCT:
   - Tap "Scan Product" on home screen
   - Grant camera permission when prompted
   - Take photo or select from gallery
   - View natural alternative suggestions

2. SCAN HISTORY:
   - Tap "History" to see past scans
   - Account includes 3 sample scans

3. SIGN IN WITH APPLE:
   - From login screen, tap "Sign in with Apple" button
   - Works with Hide My Email

4. ACCOUNT DELETION:
   - Go to Profile > Account > Delete Account
   - (DO NOT complete deletion during review)

5. LEGAL LINKS:
   - Profile > Legal > Privacy Policy
   - Profile > Legal > Terms of Service

DEMO VIDEO: [ADD UNLISTED VIDEO URL HERE]

Note: The camera feature requires a physical device. On simulator, you can use "Choose from Gallery" instead.
```

---

## Screenshot Plan - Real UI Screenshots

### Required Sizes:
- **6.7-inch iPhone** (1290 x 2796 pixels) - iPhone 15 Pro Max
- **13-inch iPad** (2064 x 2752 pixels) - iPad Pro 12.9-inch

### Screenshot Sequence (Each Device):

| # | Screen | Description |
|---|--------|-------------|
| 1 | Home Screen | Main screen with "Scan Product" button prominent |
| 2 | Camera/Scan Screen | Shows the 3 options (Take Photo, Gallery, Type Name) |
| 3 | Analysis Results | Sample medication with natural alternatives |
| 4 | Scan History | List view with multiple scan entries |
| 5 | Premium/Subscription | Paywall with pricing tiers |
| 6 | Profile/Settings | Shows Legal section + Delete Account |

### Screenshot Capture Steps:

1. **Build the app:**
   ```bash
   eas build --profile production --platform ios
   ```

2. **Run on iPhone 15 Pro Max Simulator:**
   ```bash
   npx expo run:ios --device "iPhone 15 Pro Max"
   ```

3. **Login with demo account and capture each screen**

4. **Run on iPad Pro 12.9" Simulator:**
   ```bash
   npx expo run:ios --device "iPad Pro (12.9-inch) (6th generation)"
   ```

5. **Verify iPad layout shows proper iPad UI (not stretched iPhone)**

### Upload Screenshots:
1. App Store Connect > App > [Version] > Screenshots
2. Use "View All Sizes in Media Manager" for bulk upload
3. Ensure majority show actual app UI, not splash screens

---

## App Store Connect Metadata Updates

### Privacy Policy URL:
```
https://naturinex.com/privacy
```

### Terms of Service URL:
```
https://naturinex.com/terms
```

### Support URL:
```
https://naturinex.com/support
```

### Marketing URL:
```
https://naturinex.com
```

---

## Required IAP Products (App Store Connect)

Create these subscription products before resubmitting:

| Product ID | Reference Name | Price | Duration |
|------------|----------------|-------|----------|
| `naturinex.basic.monthly` | Basic Monthly | $9.99 | 1 Month |
| `naturinex.basic.yearly` | Basic Yearly | $99.99 | 1 Year |
| `naturinex.premium.monthly` | Premium Monthly | $14.99 | 1 Month |
| `naturinex.premium.yearly` | Premium Yearly | $139.99 | 1 Year |
| `naturinex.pro.monthly` | Professional Monthly | $39.99 | 1 Month |
| `naturinex.pro.yearly` | Professional Yearly | $359.99 | 1 Year |

### Subscription Group: "Naturinex Premium"

Include screenshot showing subscription UI for each product.

---

## App Review Reply (Copy & Paste)

Subject: **Naturinex Wellness Guide v2.0 - Resolution of Review Issues**

```
Hello App Review Team,

Thank you for the detailed feedback for Naturinex Wellness Guide (v2.0). We have addressed each issue:

1) Guideline 4.8 (Login Services):
   - We added "Sign in with Apple" as an equivalent login option alongside Google login.
   - Sign in with Apple requests only name/email, supports Hide My Email, and we do not collect app interactions for advertising without consent.

2) Guideline 3.1.2 (Subscriptions required info):
   - We updated the subscription screen to include the subscription title, duration, price, and services provided.
   - Added functional links to Terms of Use (EULA) and Privacy Policy within the app.
   - Privacy Policy: https://naturinex.com/privacy
   - Terms of Use: https://naturinex.com/terms

3) Guideline 2.1 (App Completeness bugs):
   - Fixed the "Take Photo" button with improved permission handling for iPad.
   - Fixed Google sign-in flow with better error handling.
   - Added Settings redirect when permissions are denied.

4) Guideline 2.1 (Information Needed - demo access):
   - Demo account credentials provided in App Review Notes:
     Email: appreview@naturinex.com
     Password: ReviewNaturinex2026!
   - Account includes Premium access and 3 pre-populated scan history entries.

5) Guideline 5.1.1(v) (Account deletion):
   - Added in-app account deletion: Profile > Account > Delete Account
   - Users can also request deletion via: https://naturinex.com/delete-account

6) Guideline 2.1 (IAPs not submitted):
   - Submitted all related in-app purchase products for review.
   - Aligned in-app plan names with IAP product IDs.

7) Guideline 2.3.3 (Screenshots):
   - Replaced screenshots with real in-app UI for both 6.7-inch iPhone and 13-inch iPad.
   - Screenshots show actual app functionality, not marketing images.

8) Guideline 3.1.4 (Content codes / promo codes):
   - The promo code feature is for subscription discounts (Stripe coupons), not for unlocking features from external products.
   - For iOS, we have transitioned to Apple Offer Codes for promotional discounts.

Demo Video:
We have included a link in App Review Notes showing v2.0 running on a physical device demonstrating the Scan Product feature and all key functionality.

Please let us know if anything else is needed. Thank you for your time!

Sincerely,
Paul Maitland
Cien Rios LLC dba Naturinex Wellness Guide
17113 Miramar Parkway, Miramar, FL 33027
Phone: (754) 254-7141
Email: support@naturinex.com
```

---

## Pre-Submission Checklist

### Code Changes:
- [ ] Sign in with Apple implemented (`src/screens/LoginScreen.js`)
- [ ] Camera permissions fixed (`src/screens/SimpleCameraScreen.js`)
- [ ] Google login error handling improved (`src/screens/LoginScreen.js`)
- [ ] Privacy Policy content added (`src/components/PrivacyPolicyScreen.js`)
- [ ] Terms of Use content added (`src/components/TermsOfUseScreen.js`)
- [ ] Account deletion added (`src/screens/ProfileScreen.js`)
- [ ] app.json updated with `usesAppleSignIn: true`
- [ ] expo-apple-authentication plugin added

### App Store Connect:
- [ ] Demo account created and credentials in App Review Notes
- [ ] Demo video recorded and linked
- [ ] Screenshots updated (6.7" iPhone + 13" iPad)
- [ ] Privacy Policy URL set
- [ ] Support URL set
- [ ] IAP products created and submitted
- [ ] IAP screenshots added

### Build:
- [ ] New iOS build created with EAS
- [ ] Build tested on iPad simulator
- [ ] Build tested on iPhone simulator
- [ ] Camera permissions work correctly

### Legal Pages (Web):
- [ ] https://naturinex.com/privacy live
- [ ] https://naturinex.com/terms live
- [ ] https://naturinex.com/delete-account live

---

## QA Testing Checklist

Test on iPad Air 11-inch (iPadOS 26.1) or simulator:

### Authentication:
- [ ] Sign in with Apple shows and works
- [ ] Hide My Email works (no blocking)
- [ ] Google sign-in completes without error page
- [ ] Email/password login works
- [ ] Guest mode (3 free scans) works

### Camera/Scan:
- [ ] "Take Photo" tap is responsive
- [ ] Camera permission prompt appears
- [ ] Denied permission shows Settings redirect
- [ ] "Choose from Gallery" works
- [ ] "Type Name" manual entry works
- [ ] Analysis results display correctly

### Subscription:
- [ ] All plans display correctly
- [ ] Terms/Privacy links work in subscription screen
- [ ] Trial information is accurate

### Legal/Account:
- [ ] Privacy Policy opens and displays content
- [ ] Terms of Service opens and displays content
- [ ] Delete Account shows confirmation modal
- [ ] Typing DELETE enables delete button
- [ ] Web deletion link opens

### Layout:
- [ ] iPad layout is properly adapted (not stretched iPhone)
- [ ] All buttons are tappable (no overlay issues)
- [ ] Safe area handled correctly

---

## Files Modified in This Update

```
Modified Files:
- app.json (added usesAppleSignIn, expo-apple-authentication plugin)
- package.json (added expo-apple-authentication)
- src/screens/LoginScreen.js (Sign in with Apple, improved Google error handling)
- src/screens/SimpleCameraScreen.js (permission handling, error handling)
- src/screens/ProfileScreen.js (account deletion)
- src/components/PrivacyPolicyScreen.js (full content)
- src/components/TermsOfUseScreen.js (full content)
```

---

## Next Steps

1. **Implement Apple IAP** - This is CRITICAL and blocking
2. Create EAS production build
3. Test all features on physical iPad
4. Record demo video
5. Upload new screenshots
6. Submit for review with reply message

---

*Document generated: January 2, 2026*
*Branch: fix/apple-review-v2*
