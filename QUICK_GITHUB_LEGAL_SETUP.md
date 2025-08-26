# 🚀 QUICK GITHUB LEGAL DOCS SETUP (5 Minutes)

## Step 1: Create Repository on GitHub (2 min)

1. **Open**: https://github.com/new
2. **Repository name**: `naturinex-legal`
3. **Select**: ✅ Public
4. **Click**: "Create repository"

## Step 2: Upload Files (2 min)

1. **In your new repository**, you'll see "Quick setup"
2. **Click**: "uploading an existing file" link
3. **Drag and drop** these 2 files from `C:\Users\maito\mediscan-app\legal`:
   - `privacy-policy-enhanced.html`
   - `terms-of-service-enhanced.html`
4. **Commit message**: "Add legal documents"
5. **Click**: "Commit changes"

## Step 3: Enable GitHub Pages (1 min)

1. **Click**: Settings tab (in your repository)
2. **Scroll to**: "Pages" (left sidebar)
3. **Source**: Deploy from a branch
4. **Branch**: main
5. **Folder**: / (root)
6. **Click**: Save

## ✅ YOUR URLS ARE READY!

After 2-3 minutes, your documents will be live at:

```
https://YOUR_GITHUB_USERNAME.github.io/naturinex-legal/privacy-policy-enhanced.html
https://YOUR_GITHUB_USERNAME.github.io/naturinex-legal/terms-of-service-enhanced.html
```

## Step 4: Update Your App

```cmd
cd C:\Users\maito\mediscan-app\naturinex-app
notepad .env
```

Add these lines (replace YOUR_GITHUB_USERNAME):
```
REACT_APP_PRIVACY_POLICY_URL=https://YOUR_GITHUB_USERNAME.github.io/naturinex-legal/privacy-policy-enhanced.html
REACT_APP_TERMS_OF_SERVICE_URL=https://YOUR_GITHUB_USERNAME.github.io/naturinex-legal/terms-of-service-enhanced.html
```

## 📱 Use These URLs For:

### Apple App Store Connect
- **Privacy Policy URL**: Your GitHub Pages privacy policy URL
- **Support URL**: Your GitHub Pages terms URL (or create a simple contact page)

### Google Play Console
- **Privacy Policy URL**: Your GitHub Pages privacy policy URL

## 🔍 Test Your URLs

Open in browser to verify they work:
1. Your privacy policy URL
2. Your terms of service URL

Both should display properly formatted legal documents.

---

**That's it! Your legal documents are now hosted and ready for app store submission.**