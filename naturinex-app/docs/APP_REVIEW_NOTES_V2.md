# App Store Review Notes - Naturinex v2.0

## Demo Account Credentials
- **Email**: demo@naturinex.app
- **Password**: ReviewDemo2024!

The demo account has pre-seeded scan history to demonstrate app functionality.

## Important Changes from Previous Submission

### Stripe Removed for iOS
**Stripe is completely removed from the iOS app for digital subscription purchases.**

- All subscription purchases on iOS use Apple In-App Purchase (StoreKit)
- Stripe code has platform guards that throw errors if called on iOS
- The `SubscriptionScreenWrapper` component routes to Apple IAP on iOS

### Subscription Products
We are launching with 2 subscription products:
- `naturinex_premium_monthly` - $9.99/month
- `naturinex_premium_yearly` - $99.99/year

Both include a 7-day free trial.

### Features Available in v2.0
1. **Sign in with Apple** - Primary authentication method
2. **Camera Scanning** - Take photos to scan product ingredients
3. **AI Analysis** - Get wellness insights about ingredients
4. **Scan History** - View past scans (premium feature)
5. **PDF Export** - Export analysis results (premium feature)
6. **Account Deletion** - Fully GDPR/CCPA compliant

### Testing In-App Purchases
1. Use sandbox test account (create in App Store Connect)
2. Navigate to Profile > Upgrade to Premium
3. Select subscription plan
4. Complete purchase with sandbox credentials

### Account Deletion
Account deletion is available at:
- Profile > Settings > Delete Account

This permanently deletes:
- User profile data
- Scan history
- Authentication credentials

## Devices Tested
- iPhone 15 Pro Max (6.7")
- iPhone 14 (6.1")
- iPad Air (11")
- iPad Pro (12.9")

## Screenshots
All screenshots show real app UI captured on physical devices.

## Technical Stack
- React Native (Expo SDK 52)
- Firebase Authentication
- Supabase (Database & Edge Functions)
- Apple StoreKit for iOS subscriptions

## Contact
For any questions during review:
- Email: support@naturinex.com

---

**Version**: 2.0.0
**Build**: [To be filled by EAS Build]
**Date**: January 2026
