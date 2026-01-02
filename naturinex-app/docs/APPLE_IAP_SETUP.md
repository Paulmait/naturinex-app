# Apple In-App Purchase Setup Guide

Complete guide for setting up Apple IAP for Naturinex in App Store Connect.

## Prerequisites

1. Apple Developer Account ($99/year)
2. App registered in App Store Connect
3. Bank/tax information configured in App Store Connect
4. Paid Applications Agreement signed

## Step 1: Create App Store Connect Shared Secret

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **Users and Access** > **Integrations** > **In-App Purchase**
3. Click **Generate Shared Secret**
4. Copy the shared secret (you'll need this for Supabase)

## Step 2: Add Shared Secret to Supabase

```bash
# Set the secret in Supabase
npx supabase secrets set APPLE_SHARED_SECRET=your_shared_secret_here
```

Or via Supabase Dashboard:
1. Go to Project Settings > Edge Functions
2. Add secret: `APPLE_SHARED_SECRET`

## Step 3: Create Subscription Products in App Store Connect

Navigate to: **My Apps** > **Naturinex** > **In-App Purchases** > **Manage**

### Create Subscription Group

1. Click **Create** next to Subscriptions
2. **Reference Name**: "Naturinex Premium"
3. **Subscription Group Reference Name**: "naturinex_subscriptions"

### Create Each Product

Create these 6 products with EXACT product IDs:

#### Basic Monthly
- **Reference Name**: Basic Monthly
- **Product ID**: `naturinex_basic_monthly`
- **Subscription Duration**: 1 Month
- **Price**: $4.99 (or local equivalent)
- **Free Trial**: 7 days

#### Basic Yearly
- **Reference Name**: Basic Yearly
- **Product ID**: `naturinex_basic_yearly`
- **Subscription Duration**: 1 Year
- **Price**: $49.99 (or local equivalent)
- **Free Trial**: 7 days

#### Premium Monthly
- **Reference Name**: Premium Monthly
- **Product ID**: `naturinex_premium_monthly`
- **Subscription Duration**: 1 Month
- **Price**: $9.99 (or local equivalent)
- **Free Trial**: 7 days

#### Premium Yearly
- **Reference Name**: Premium Yearly
- **Product ID**: `naturinex_premium_yearly`
- **Subscription Duration**: 1 Year
- **Price**: $99.99 (or local equivalent)
- **Free Trial**: 7 days

#### Professional Monthly
- **Reference Name**: Professional Monthly
- **Product ID**: `naturinex_professional_monthly`
- **Subscription Duration**: 1 Month
- **Price**: $29.99 (or local equivalent)
- **Free Trial**: 7 days

#### Professional Yearly
- **Reference Name**: Professional Yearly
- **Product ID**: `naturinex_professional_yearly`
- **Subscription Duration**: 1 Year
- **Price**: $299.99 (or local equivalent)
- **Free Trial**: 7 days

## Step 4: Add Localized Information

For each product, add:

1. **Display Name**: e.g., "Premium Monthly"
2. **Description**: Feature description
   - Basic: "10 scans/month, 30-day history, basic wellness insights"
   - Premium: "50 scans/month, permanent history, AI analysis, PDF exports, no ads"
   - Professional: "200 scans/month, API access, team features, dedicated support"

## Step 5: Add Review Screenshot

For each product:
1. Click on the product
2. Go to "Review Information"
3. Upload a screenshot of the subscription paywall
4. Add review notes if needed

## Step 6: Submit Products for Review

1. Each product status should show "Ready to Submit"
2. Products will be reviewed with your next app submission

## Step 7: Deploy Supabase Edge Function

```bash
# Navigate to project
cd naturinex-app

# Deploy the receipt validation function
npx supabase functions deploy verify-apple-receipt

# Run database migration
npx supabase db push
```

## Step 8: Test with Sandbox

1. Create a Sandbox test account:
   - App Store Connect > Users and Access > Sandbox > Testers
   - Add new sandbox tester email

2. On your test device:
   - Sign out of App Store (Settings > [Your Name] > Media & Purchases > Sign Out)
   - When making a test purchase, use sandbox credentials

3. Sandbox purchases:
   - Don't charge real money
   - Subscriptions renew faster (monthly = 5 mins)
   - Receipts are validated against sandbox server

## Subscription Pricing Reference

| Tier | Monthly | Yearly | Savings |
|------|---------|--------|---------|
| Basic | $4.99 | $49.99 | ~17% |
| Premium | $9.99 | $99.99 | ~17% |
| Professional | $29.99 | $299.99 | ~17% |

## Troubleshooting

### "Product not found" Error
- Ensure product IDs match EXACTLY (case-sensitive)
- Wait 15-30 minutes after creating products
- Check that Paid Applications Agreement is signed

### Receipt Validation Fails
- Verify APPLE_SHARED_SECRET is set correctly
- Check if using sandbox vs production URL
- Review Edge Function logs in Supabase

### Purchase Stuck in "Purchasing"
- Check network connectivity
- Verify StoreKit connection is initialized
- Try calling `finishTransaction` manually

## App Store Connect URLs

- [App Store Connect](https://appstoreconnect.apple.com)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [In-App Purchase Configuration](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/)

## Files Reference

| File | Purpose |
|------|---------|
| `src/billing/products.js` | Product IDs and metadata |
| `src/billing/AppleIAPService.js` | StoreKit integration |
| `src/screens/AppleIAPPaywallScreen.js` | iOS subscription UI |
| `supabase/functions/verify-apple-receipt/` | Server-side validation |
| `supabase/migrations/20250102_apple_iap_subscriptions.sql` | Database tables |
