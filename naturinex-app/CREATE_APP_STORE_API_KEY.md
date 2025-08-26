# How to Create App Store Connect API Key

## Step 1: Go to App Store Connect
1. Open https://appstoreconnect.apple.com
2. Sign in with Apple ID: crazya1c@hotmail.com

## Step 2: Navigate to API Keys
1. Click on "Users and Access" (top menu)
2. Select "Keys" tab
3. Click "Integrations" in the left sidebar
4. Select "App Store Connect API"

## Step 3: Create New Key
1. Click the "+" button to create a new key
2. Enter a name: "EAS Build Key"
3. Select access level: "Admin" or "App Manager"
4. Click "Generate"

## Step 4: Download the Key
**IMPORTANT**: You can only download this key ONCE!
1. Click "Download API Key"
2. Save the file (it will be named like `AuthKey_XXXXXXXXXX.p8`)
3. Note down:
   - **Issuer ID** (shown at the top of the page)
   - **Key ID** (shown next to your key)

## Step 5: Save the Key File
Create a `secrets` folder in your project:
```bash
mkdir secrets
```

Move the downloaded key file to:
```
C:\Users\maito\mediscan-app\naturinex-app\secrets\AuthKey_XXXXXXXXXX.p8
```

## Step 6: Update eas.json
Your eas.json already has placeholders. Update them with your values:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "crazya1c@hotmail.com",
      "ascAppId": "6749164831",
      "appleTeamId": "LFB9Z5Q3Y9",
      "ascApiKeyPath": "./secrets/AuthKey_XXXXXXXXXX.p8",
      "ascApiKeyId": "XXXXXXXXXX",
      "ascApiKeyIssuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  }
}
```

## Step 7: Add to .gitignore
**NEVER commit your API key!**
Add to .gitignore:
```
secrets/
*.p8
```

## Alternative: Manual Upload

If you prefer not to create an API key:

1. Download the .ipa file: https://expo.dev/artifacts/eas/2QmNXtGYxDCZHzVQeFxTdp.ipa
2. Use **Transporter** app on Mac:
   - Download from Mac App Store
   - Sign in with your Apple ID
   - Drag the .ipa file
   - Click "Deliver"

3. Or use **Xcode**:
   - Open Xcode
   - Window → Organizer
   - Click "Distribute App"
   - Follow the upload wizard

## Quick Manual Upload Steps:
1. Download .ipa from: https://expo.dev/artifacts/eas/2QmNXtGYxDCZHzVQeFxTdp.ipa
2. Open https://appstoreconnect.apple.com
3. Go to your app
4. Click "TestFlight" or "App Store" tab
5. Use Transporter or Xcode to upload

The manual method might be faster for your first submission!