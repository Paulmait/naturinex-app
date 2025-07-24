# 📄 Legal Documents Deployment Guide

## Quick Deployment Options (Choose One)

### Option 1: GitHub Pages (FREE - Recommended) ⭐
**Time: 5 minutes**

1. Create a new GitHub repository called `naturinex-legal`
2. Upload both HTML files:
   - `privacy-policy.html`
   - `terms-of-service.html`
3. Go to Settings → Pages → Source: Deploy from branch (main)
4. Your URLs will be:
   - Privacy: `https://[your-username].github.io/naturinex-legal/privacy-policy.html`
   - Terms: `https://[your-username].github.io/naturinex-legal/terms-of-service.html`

### Option 2: Netlify (FREE)
**Time: 3 minutes**

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `legal` folder to deploy
3. Your URLs will be:
   - Privacy: `https://[generated-name].netlify.app/privacy-policy.html`
   - Terms: `https://[generated-name].netlify.app/terms-of-service.html`

### Option 3: Vercel (FREE)
**Time: 3 minutes**

1. Install Vercel CLI: `npm i -g vercel`
2. In the legal folder, run: `vercel`
3. Follow prompts to deploy
4. Get your URLs from the deployment

### Option 4: Firebase Hosting (FREE)
**Time: 10 minutes**

Since you're already using Firebase:
```bash
# In naturinex-app/legal directory
firebase init hosting
# Select your project
# Use current directory as public
firebase deploy --only hosting
```

### Option 5: Add to Your Existing Website
If you have a website for Naturinex:
- Upload to: `yourwebsite.com/privacy-policy.html`
- Upload to: `yourwebsite.com/terms-of-service.html`

## 🍎 Adding URLs to App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to "App Information" 
4. Scroll to "App Privacy"
5. Add your URLs:
   - **Privacy Policy URL**: `[your deployed privacy URL]`
   - **Terms of Use URL**: `[your deployed terms URL]`
6. Save changes

## 🤖 Adding URLs to Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to "Store presence" → "Main store listing"
4. Scroll to "Privacy Policy"
5. Add your Privacy Policy URL
6. For Terms: Add link in app description or support URL

## 📱 Update Your App

After deploying, update these files with your actual URLs:

1. **In your app code** (if displaying in-app):
   ```javascript
   const PRIVACY_URL = "https://your-deployed-url/privacy-policy.html";
   const TERMS_URL = "https://your-deployed-url/terms-of-service.html";
   ```

2. **In app.json** (optional):
   ```json
   "expo": {
     "extra": {
       "privacyUrl": "https://your-url/privacy-policy.html",
       "termsUrl": "https://your-url/terms-of-service.html"
     }
   }
   ```

## ✅ Quick Checklist

- [ ] Deploy both HTML files to one of the services above
- [ ] Test both URLs work in a browser
- [ ] Add Privacy Policy URL to App Store Connect
- [ ] Add Privacy Policy URL to Google Play Console
- [ ] Update app code with URLs if needed
- [ ] Save/bookmark your URLs for future reference

## 💡 Pro Tips

1. **Custom Domain**: You can later add a custom domain like `legal.naturinex.com`
2. **Updates**: When you update policies, just replace the HTML files
3. **Version Control**: Keep these files in your git repository
4. **SSL**: All recommended options provide HTTPS automatically

## 🚀 Fastest Option

For immediate deployment:
1. Go to [netlify.com](https://netlify.com)
2. Drag the `legal` folder onto the page
3. Done! You'll have URLs in 30 seconds.

---

Need help? The legal documents are styled and ready. Just pick a hosting option and deploy!