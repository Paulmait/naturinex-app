# Apple Developer Information Needed

To complete the iOS submission setup, I need the following information:

## 1. Apple ID Email
The email associated with your Apple Developer account.
Example: `john.doe@example.com`

## 2. App Store Connect App ID 
You'll get this after creating the app in App Store Connect.
Format: `1234567890`

## 3. Apple Team ID
Found in your Apple Developer account under Membership.
Format: `ABCDEF1234`

## How to Find Your Team ID:
1. Go to https://developer.apple.com/account
2. Sign in with your Apple Developer account
3. Look for "Team ID" under Membership section

## How to Create App in App Store Connect:
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Naturinex Wellness Guide
   - Primary Language: English (U.S.)
   - Bundle ID: Select or create `com.naturinex.app`
   - SKU: `naturinex-wellness-2024`
   - User Access: Full Access

4. After creation, find the Apple ID in App Information section

## Quick Setup Command:
Once you have this info, run:
```bash
eas build:configure
```

And I'll help you update the configuration.