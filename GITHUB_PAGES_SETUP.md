# 🌐 GitHub Pages Setup for Legal Documents

## Current Status
Your legal documents are in the repository but not yet accessible as web pages.

### Repository URLs (NOT for app stores):
- ❌ https://github.com/Paulmait/naturinex-legal/blob/main/privacy-policy-enhanced.html
- ❌ https://github.com/Paulmait/naturinex-legal/blob/main/terms-of-service-enhanced.html

### GitHub Pages URLs (USE THESE):
Once enabled, your URLs will be:
- ✅ https://paulmait.github.io/naturinex-legal/privacy-policy-enhanced.html
- ✅ https://paulmait.github.io/naturinex-legal/terms-of-service-enhanced.html

## How to Enable GitHub Pages:

1. **Go to Repository Settings**:
   - Visit: https://github.com/Paulmait/naturinex-legal
   - Click "Settings" tab

2. **Find Pages Section**:
   - Scroll down to "Pages" in the left sidebar
   - Or go directly to: https://github.com/Paulmait/naturinex-legal/settings/pages

3. **Configure GitHub Pages**:
   - Source: Deploy from a branch
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
   - Click "Save"

4. **Wait for Deployment** (2-5 minutes):
   - GitHub will show "Your site is live at..."
   - A green checkmark will appear

5. **Test Your URLs**:
   - https://paulmait.github.io/naturinex-legal/privacy-policy-enhanced.html
   - https://paulmait.github.io/naturinex-legal/terms-of-service-enhanced.html

## Update Your App Configuration:

### In app.json (already correct!):
```json
"extra": {
  "privacyPolicyUrl": "https://paulmait.github.io/naturinex-legal/privacy-policy-enhanced.html",
  "termsOfServiceUrl": "https://paulmait.github.io/naturinex-legal/terms-of-service-enhanced.html"
}
```

### In server/.env (already correct!):
```env
REACT_APP_PRIVACY_POLICY_URL=https://paulmait.github.io/naturinex-legal/privacy-policy-enhanced.html
REACT_APP_TERMS_OF_SERVICE_URL=https://paulmait.github.io/naturinex-legal/terms-of-service-enhanced.html
```

## ✅ Good News!
Your app is already configured with the correct GitHub Pages URLs! You just need to enable GitHub Pages on your repository.

## For App Store Submission:
- Apple App Store: Add these URLs in App Store Connect
- Google Play Store: Add these URLs in Play Console
- Both stores require accessible web URLs, not GitHub repo links