# 📱 App Store Deployment Guide - Final Steps

## 1. ✅ Update Expo SDK (COMPLETED)
Updated from SDK 53 to SDK 52 for better app store compatibility.

**Next step**: Run `npm install` to update all packages.

## 2. 🔑 Configure Apple/Google Credentials in eas.json

### For iOS (Apple App Store):
1. **Update Apple ID**: Replace `your-apple-id@email.com` in eas.json with your actual Apple ID
2. **Get App Store Connect API Key**:
   - Go to: https://appstoreconnect.apple.com/access/api
   - Click "+" to create a new key
   - Name: "Naturinex EAS Build"
   - Access: Admin
   - Download the .p8 file
   - Note the Key ID and Issuer ID

3. **Create the API key file**:
   ```
   mkdir secrets
   ```
   Create `secrets/appstore-connect-key.json`:
   ```json
   {
     "key": "-----BEGIN PRIVATE KEY-----\n[YOUR KEY CONTENT]\n-----END PRIVATE KEY-----",
     "keyId": "[YOUR KEY ID]",
     "issuerId": "[YOUR ISSUER ID]"
   }
   ```

### For Android (Google Play):
1. **Create Service Account**:
   - Go to: https://console.cloud.google.com/
   - Create new project or select existing
   - Enable Google Play Android Developer API
   - Create service account with "Service Account User" role
   - Create and download JSON key

2. **Link to Play Console**:
   - Go to: https://play.google.com/console
   - Settings → API access
   - Link the service account
   - Grant "Release manager" permissions

3. **Save key as**: `secrets/google-play-key.json`

## 3. 🔐 Get Stripe Webhook Secret

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint: `https://naturinex-app-zsga.onrender.com/api/stripe/webhook`
3. Under "Signing secret", click "Reveal"
4. Copy the secret (starts with `whsec_`)
5. Add to Render environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## 4. 🤖 Get Gemini API Key

1. Go to: https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Select your project (or create new)
4. Copy the API key
5. Add to Render environment variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## 5. 🚀 Deploy Updated Server to Render

1. **Push all changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update Expo SDK to v52 and prepare for app store deployment"
   git push origin master
   ```

2. **Render will auto-deploy** from your GitHub repo
3. **Monitor deployment**: https://dashboard.render.com/
4. **Check logs** for successful startup

## 6. 🌿 Run Full Data Ingestion

After server is deployed with all environment variables:

1. **Run the ingestion script**:
   ```bash
   curl -X POST https://naturinex-app-zsga.onrender.com/api/admin/ingest-all \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{"adminSecret": "your_admin_secret"}'
   ```

2. **Monitor progress** in Render logs
3. **Verify data** through admin dashboard

## 📋 Checklist Before App Store Submission:

- [ ] Expo SDK downgraded to v52
- [ ] Apple credentials configured in eas.json
- [ ] Google Play credentials configured in eas.json
- [ ] Stripe webhook secret added to Render
- [ ] Gemini API key added to Render
- [ ] Server deployed with all environment variables
- [ ] Full data ingestion completed
- [ ] Legal documents hosted on GitHub Pages
- [ ] All critical bugs fixed (Firebase, Google Sign-In, Camera, Subscriptions)

## 🏗️ Build Commands:

Once everything is configured:

```bash
# Install dependencies with SDK 52
npm install

# Build for iOS
eas build -p ios --profile production

# Build for Android
eas build -p android --profile production

# Submit to stores
eas submit -p ios --profile production
eas submit -p android --profile production
```