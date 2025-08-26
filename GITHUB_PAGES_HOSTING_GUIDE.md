# 🌐 GitHub Pages Hosting Guide for Legal Documents

## 📋 Quick Setup (10 minutes)

### Step 1: Create GitHub Repository

1. **Go to GitHub**
   - Open https://github.com/new
   - Sign in to your GitHub account

2. **Create New Repository**
   - Repository name: `naturinex-legal`
   - Description: "Legal documents for Naturinex app"
   - ✅ Public (required for GitHub Pages)
   - ✅ Add a README file
   - Click "Create repository"

### Step 2: Upload Legal Documents

#### Option A: Using GitHub Web Interface (Easiest)

1. **In your new repository**, click "uploading an existing file"
2. **Drag and drop** these files from `C:\Users\maito\mediscan-app\legal`:
   - `privacy-policy-enhanced.html`
   - `terms-of-service-enhanced.html`
3. **Commit message**: "Add privacy policy and terms of service"
4. Click "Commit changes"

#### Option B: Using Git Command Line

```cmd
cd C:\Users\maito\mediscan-app
git clone https://github.com/YOUR_USERNAME/naturinex-legal.git
cd naturinex-legal
copy ..\legal\privacy-policy-enhanced.html .
copy ..\legal\terms-of-service-enhanced.html .
git add .
git commit -m "Add privacy policy and terms of service"
git push origin main
```

### Step 3: Enable GitHub Pages

1. **In your repository**, click "Settings" tab
2. **Scroll down** to "Pages" section (left sidebar)
3. **Source**: Deploy from a branch
4. **Branch**: Select `main`
5. **Folder**: Select `/ (root)`
6. Click "Save"

### Step 4: Get Your URLs

After 2-3 minutes, your documents will be available at:

- **Privacy Policy**: `https://YOUR_USERNAME.github.io/naturinex-legal/privacy-policy-enhanced.html`
- **Terms of Service**: `https://YOUR_USERNAME.github.io/naturinex-legal/terms-of-service-enhanced.html`

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 5: Update Your App Configuration

```cmd
cd C:\Users\maito\mediscan-app\naturinex-app
notepad .env
```

Add these lines to your .env file:
```
REACT_APP_PRIVACY_POLICY_URL=https://YOUR_USERNAME.github.io/naturinex-legal/privacy-policy-enhanced.html
REACT_APP_TERMS_OF_SERVICE_URL=https://YOUR_USERNAME.github.io/naturinex-legal/terms-of-service-enhanced.html
```

## 🎨 Optional: Custom Domain

If you have a custom domain (e.g., naturinex.com):

1. Create a file named `CNAME` in your repository
2. Add your domain: `legal.naturinex.com`
3. Configure DNS settings with your domain provider

## ✅ Verification Checklist

- [ ] Repository created and public
- [ ] Legal documents uploaded
- [ ] GitHub Pages enabled
- [ ] URLs are accessible (test in browser)
- [ ] .env file updated with URLs

## 🔍 Testing Your URLs

Open a browser and test both URLs:
```
https://YOUR_USERNAME.github.io/naturinex-legal/privacy-policy-enhanced.html
https://YOUR_USERNAME.github.io/naturinex-legal/terms-of-service-enhanced.html
```

Both pages should load and display your legal documents.

## 📱 App Store Submission URLs

Use these URLs when submitting to:

### Apple App Store Connect
- Privacy Policy URL: Your GitHub Pages privacy policy URL
- Terms of Use URL: Your GitHub Pages terms of service URL

### Google Play Console
- Privacy Policy URL: Your GitHub Pages privacy policy URL
- Terms of Service URL: Your GitHub Pages terms of service URL

## 🚀 Quick Command Summary

```cmd
# 1. Clone your repository
git clone https://github.com/YOUR_USERNAME/naturinex-legal.git

# 2. Copy legal files
cd naturinex-legal
copy C:\Users\maito\mediscan-app\legal\*.html .

# 3. Push to GitHub
git add .
git commit -m "Add legal documents"
git push origin main

# 4. Wait 2-3 minutes, then test URLs in browser
```

## 🆘 Troubleshooting

### "404 Page Not Found"
- Wait 5-10 minutes for GitHub Pages to deploy
- Check repository is public
- Verify GitHub Pages is enabled in Settings

### "GitHub Pages not showing"
- Make sure you selected the correct branch (main)
- Check that files are in the root directory
- Ensure repository is public

### "Can't push to GitHub"
- Make sure you're logged in: `git config --global user.email "your-email@example.com"`
- Use personal access token instead of password

## 📝 Example URLs

If your GitHub username is `guampaul`, your URLs would be:
- https://guampaul.github.io/naturinex-legal/privacy-policy-enhanced.html
- https://guampaul.github.io/naturinex-legal/terms-of-service-enhanced.html

---

**Time Required**: 10 minutes
**Result**: Permanent, free hosting for your legal documents