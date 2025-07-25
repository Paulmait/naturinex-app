# 🍎 Apple Developer Setup Guide for Naturinex

## Prerequisites
- Apple Developer Account ($99/year) - https://developer.apple.com/
- App Store Connect access

## Step 1: Create App ID in Apple Developer Portal

1. **Login to Apple Developer**
   - Go to https://developer.apple.com/account/
   - Navigate to "Certificates, Identifiers & Profiles"

2. **Create App Identifier**
   - Click "Identifiers" → "+"
   - Select "App IDs" → Continue
   - Select "App" → Continue
   - Fill in:
     - Description: "Naturinex"
     - Bundle ID: "com.naturinex.app" (Explicit)
   - Enable Capabilities:
     - ✅ In-App Purchase (for subscriptions)
     - ✅ Push Notifications (if needed later)
   - Click "Continue" → "Register"

## Step 2: Create App in App Store Connect

1. **Login to App Store Connect**
   - Go to https://appstoreconnect.apple.com/
   - Click "My Apps" → "+"

2. **New App Setup**
   - Platform: iOS
   - Name: "Naturinex"
   - Primary Language: English (U.S.)
   - Bundle ID: Select "com.naturinex.app"
   - SKU: "NATURINEX001" (or any unique identifier)
   - User Access: Full Access

3. **Note Your App ID**
   - After creation, go to "App Information"
   - Copy the "Apple ID" (looks like: 1234567890)

## Step 3: Get Your Credentials

You need three values:

1. **Apple ID (Email)**
   - This is your Apple Developer account email
   - Example: your-email@example.com

2. **App Store Connect App ID**
   - Found in App Store Connect > App Information
   - Example: 1234567890

3. **Apple Team ID**
   - Go to https://developer.apple.com/account/
   - Click "Membership" in sidebar
   - Copy your Team ID (looks like: ABCD1234EF)

## Step 4: Update eas.json

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234EF",
        "ascApiKeyPath": "./secrets/appstore-connect-key.json"
      }
    }
  }
}
```

## Step 5: (Optional) Create API Key for Automated Submission

For automated submissions without entering password:

1. **In App Store Connect**
   - Go to "Users and Access"
   - Click "Keys" tab
   - Click "+" to generate new API key
   - Name: "EAS Submit Key"
   - Access: App Manager
   - Download the .p8 file

2. **Create secrets folder**
   ```bash
   mkdir secrets
   ```

3. **Create API key JSON file**
   Create `secrets/appstore-connect-key.json`:
   ```json
   {
     "key": "contents of your .p8 file as a single line",
     "keyId": "ABCD1234EF",
     "issuerId": "12345678-1234-1234-1234-123456789012"
   }
   ```

4. **Add to .gitignore**
   ```bash
   echo "secrets/" >> .gitignore
   ```

## Step 6: Test Your Configuration

```bash
# Build for iOS
eas build --platform ios --profile production

# After build completes, submit to TestFlight
eas submit --platform ios --latest
```

## Common Issues & Solutions

### "Invalid Apple ID"
- Make sure you're using the email associated with your Apple Developer account
- Check for typos or extra spaces

### "App not found"
- Ensure you've created the app in App Store Connect first
- Verify the ascAppId matches exactly

### "Invalid Team ID"
- Team ID is found in Apple Developer Portal > Membership
- It's NOT your personal Apple ID

## Required for App Store Submission

Before submitting, prepare:
1. **App Description** (up to 4000 characters)
2. **Keywords** (100 characters max, separated by commas)
3. **Screenshots**:
   - iPhone 6.7" Display (1290 × 2796)
   - iPhone 6.5" Display (1284 × 2778)
   - iPhone 5.5" Display (1242 × 2208)
   - iPad Pro 12.9" Display (2048 × 2732)
4. **App Icon** 1024×1024 (no transparency, no rounded corners)
5. **Support URL** (can use your website)
6. **Privacy Policy URL** (required for apps that collect data)

Your Apple Developer setup is ready! 🎉