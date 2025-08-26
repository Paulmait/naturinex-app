# 📱 App Store URL Setup Guide

## 🍎 Apple App Store Connect

### Step 1: Access App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Select your Naturinex app

### Step 2: Navigate to App Information
1. Click on your app name
2. Go to "App Information" tab
3. Scroll down to "App Privacy" section

### Step 3: Add Privacy Policy URL
1. Find "Privacy Policy URL" field
2. Enter your hosted privacy policy URL:
   ```
   https://[your-username].github.io/naturinex-legal/privacy-policy.html
   ```
3. Click "Save" button

### Step 4: Add Terms of Use URL (Optional)
1. In the same section, look for "Terms of Use URL"
2. Enter your hosted terms URL:
   ```
   https://[your-username].github.io/naturinex-legal/terms-of-service.html
   ```
3. Click "Save" button

### Step 5: Verify URLs
1. Click on the URLs to test they work
2. Ensure they open in a new tab
3. Verify the pages load properly

## 🤖 Google Play Console

### Step 1: Access Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with your Google account
3. Select your Naturinex app

### Step 2: Navigate to Store Presence
1. Click on "Store presence" in the left menu
2. Select "Main store listing"

### Step 3: Add Privacy Policy URL
1. Scroll down to "Privacy Policy" section
2. Enter your hosted privacy policy URL:
   ```
   https://[your-username].github.io/naturinex-legal/privacy-policy.html
   ```
3. Click "Save" button

### Step 4: Add Terms URL to Description
1. Go to "Short description" or "Full description"
2. Add a line like:
   ```
   Terms of Service: https://[your-username].github.io/naturinex-legal/terms-of-service.html
   ```
3. Click "Save" button

### Step 5: Verify URLs
1. Test both URLs work
2. Ensure they open properly
3. Check mobile view looks good

## 📋 URL Verification Checklist

### Before Adding to App Stores
- [ ] Privacy Policy URL works
- [ ] Terms of Service URL works
- [ ] Both URLs load on mobile
- [ ] Email links work: `mailto:privacy@naturinex.com`
- [ ] Website links work: `https://naturinex.com`
- [ ] Pages look professional
- [ ] No broken links

### After Adding to App Stores
- [ ] URLs saved in App Store Connect
- [ ] URLs saved in Google Play Console
- [ ] Tested URLs from app store consoles
- [ ] URLs accessible to app store reviewers

## 🔧 Troubleshooting

### Common Issues

#### Issue: URLs Not Working
**Solution:**
1. Check your GitHub Pages deployment
2. Wait 5-10 minutes for deployment
3. Try accessing URLs directly in browser
4. Verify repository is public

#### Issue: Mobile View Issues
**Solution:**
1. Test URLs on your phone
2. Check responsive design
3. Verify font sizes are readable
4. Test touch interactions

#### Issue: App Store Rejection
**Solution:**
1. Ensure URLs are accessible
2. Verify no login required
3. Check content is appropriate
4. Test all links work

## 📝 URL Documentation

### Create URL Reference File
Create `APP_STORE_URLS.md`:

```markdown
# App Store Legal URLs

## Apple App Store Connect
- Privacy Policy: https://[your-username].github.io/naturinex-legal/privacy-policy.html
- Terms of Service: https://[your-username].github.io/naturinex-legal/terms-of-service.html

## Google Play Console
- Privacy Policy: https://[your-username].github.io/naturinex-legal/privacy-policy.html
- Terms of Service: https://[your-username].github.io/naturinex-legal/terms-of-service.html

## Notes
- Added to App Store Connect: [Date]
- Added to Google Play Console: [Date]
- Status: Active
- Platform: GitHub Pages
```

## ✅ App Store URL Checklist

### Apple App Store Connect ✅
- [ ] Privacy Policy URL added
- [ ] Terms of Use URL added (optional)
- [ ] URLs tested and working
- [ ] Changes saved
- [ ] Ready for app submission

### Google Play Console ✅
- [ ] Privacy Policy URL added
- [ ] Terms URL in description
- [ ] URLs tested and working
- [ ] Changes saved
- [ ] Ready for app submission

## 🎯 Next Steps

Once URLs are added to both app stores:
1. **Test Legal Flow** (Step 3)
2. **Submit to App Stores** (Step 4)

---

**Time Required**: 10-15 minutes
**Result**: App stores have legal document URLs 