# Setting Up EAS Authentication Keys

## For iOS App Store Submission

1. **Go to App Store Connect**
   - Visit https://appstoreconnect.apple.com
   - Sign in with guampaul@gmail.com

2. **Create an API Key**
   - Navigate to: Users and Access → Keys → App Store Connect API
   - Click the "+" button to create a new key
   - Name: "EAS Build Key"
   - Access: "Admin"
   - Click "Generate"

3. **Download and Save the Key**
   - Download the .p8 file (you can only download it once!)
   - Note down:
     - Key ID (shown in the list)
     - Issuer ID (shown at the top of the keys page)

4. **Create the JSON file**
   Create `secrets/appstore-connect-key.json`:
   ```json
   {
     "keyId": "YOUR_KEY_ID",
     "issuerId": "YOUR_ISSUER_ID", 
     "privateKey": "-----BEGIN PRIVATE KEY-----\nPASTE_YOUR_P8_FILE_CONTENTS_HERE\n-----END PRIVATE KEY-----"
   }
   ```

## For Android Google Play Submission

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com
   - Select your project or create a new one

2. **Create a Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: "EAS Build Service"
   - Click "Create and Continue"

3. **Grant Permissions**
   - Skip the permissions in Cloud Console
   - Click "Done"

4. **Create Key**
   - Click on the service account you created
   - Go to "Keys" tab
   - Add Key → Create new key → JSON
   - Download the JSON file

5. **Set up Google Play Console**
   - Go to https://play.google.com/console
   - Settings → API access
   - Link the service account you created
   - Grant "Release manager" permissions

6. **Save the Key**
   - Save the downloaded JSON as `secrets/google-play-key.json`

## Important Security Notes

- NEVER commit these keys to git
- Add `/secrets` to your .gitignore
- These keys allow automated app submission
- Keep the .p8 and JSON files secure

## Next Steps

Once you have:
1. Your App Store Connect App ID
2. Created the API keys

You can run:
```bash
eas build --platform all --profile production
eas submit --platform all
```