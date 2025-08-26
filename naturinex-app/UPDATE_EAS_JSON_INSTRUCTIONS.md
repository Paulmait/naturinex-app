# 🔐 Update eas.json Instructions

## Current eas.json Location:
`C:\Users\maito\mediscan-app\naturinex-app\eas.json`

## What You Need to Update:

### 1. Apple App Store (iOS) - Line 58
Replace:
```json
"appleId": "your-apple-id@email.com",
```
With your actual Apple ID email:
```json
"appleId": "paulmait@example.com",
```

### 2. Apple App ID - Line 59
Replace:
```json
"ascAppId": "PASTE-YOUR-APP-ID-HERE",
```
With your App Store Connect App ID (get from App Store Connect):
```json
"ascAppId": "1234567890",
```

### 3. Apple Team ID - Line 60
The team ID `"LFB9Z5Q3Y9"` might be correct if that's your team. 
To verify:
1. Go to https://developer.apple.com/account
2. Click "Membership" 
3. Find your Team ID

### 4. Create API Keys Directory:
```bash
cd C:\Users\maito\mediscan-app\naturinex-app
mkdir secrets
```

### 5. Apple API Key (appstore-connect-key.json):

1. Go to: https://appstoreconnect.apple.com/access/api
2. Click "+" to create new key
3. Name: "Naturinex EAS"
4. Access: Admin
5. Download the .p8 file
6. Note the Key ID and Issuer ID

Create file: `C:\Users\maito\mediscan-app\naturinex-app\secrets\appstore-connect-key.json`
```json
{
  "key": "-----BEGIN PRIVATE KEY-----\nPASTE YOUR P8 FILE CONTENT HERE\n-----END PRIVATE KEY-----",
  "keyId": "YOUR_KEY_ID",
  "issuerId": "YOUR_ISSUER_ID"
}
```

### 6. Google Play Service Account:

1. Go to: https://console.cloud.google.com/
2. Create new project: "Naturinex App"
3. Enable: Google Play Android Developer API
4. Create service account
5. Download JSON key
6. Save as: `C:\Users\maito\mediscan-app\naturinex-app\secrets\google-play-key.json`

### 7. Link Service Account to Play Console:
1. Go to: https://play.google.com/console
2. Settings → API access
3. Link your service account
4. Grant "Release manager" permissions

## Important Security Note:
Add to `.gitignore`:
```
secrets/
*.p8
*.json
```

This prevents accidentally committing your private keys!