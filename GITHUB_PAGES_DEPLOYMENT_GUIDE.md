# 🚀 GitHub Pages Deployment Guide

## Step 1: Create GitHub Repository

### 1.1 Create New Repository
1. Go to [GitHub.com](https://github.com)
2. Click the "+" icon in the top right
3. Select "New repository"
4. Name it: `naturinex-legal`
5. Make it **Public** (required for GitHub Pages)
6. Don't initialize with README (we'll upload files)
7. Click "Create repository"

### 1.2 Upload Legal Documents
1. In your new repository, click "uploading an existing file"
2. Drag and drop these files:
   - `legal/privacy-policy.html`
   - `legal/terms-of-service.html`
3. Add commit message: "Add legal documents"
4. Click "Commit changes"

## Step 2: Enable GitHub Pages

### 2.1 Configure Pages
1. Go to your repository settings (Settings tab)
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select "Deploy from a branch"
4. Choose "main" branch
5. Select "/ (root)" folder
6. Click "Save"

### 2.2 Get Your URLs
After a few minutes, your URLs will be:
- **Privacy Policy**: `https://[your-username].github.io/naturinex-legal/privacy-policy.html`
- **Terms of Service**: `https://[your-username].github.io/naturinex-legal/terms-of-service.html`

## Step 3: Test Your URLs

### 3.1 Verify Deployment
1. Wait 2-3 minutes for GitHub Pages to deploy
2. Visit your privacy policy URL in a browser
3. Visit your terms of service URL in a browser
4. Both should display properly with styling

### 3.2 Check Mobile View
1. Open URLs on your phone
2. Verify they look good on mobile
3. Test all links work (email, website)

## Step 4: Alternative Deployment Options

### Option A: Netlify (Even Faster)
1. Go to [netlify.com](https://netlify.com)
2. Drag the `legal` folder to the page
3. Get instant URLs like:
   - `https://[random-name].netlify.app/privacy-policy.html`
   - `https://[random-name].netlify.app/terms-of-service.html`

### Option B: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. In the `legal` folder, run: `vercel`
3. Follow prompts to deploy
4. Get your URLs from the deployment

### Option C: Firebase Hosting
1. In the `legal` folder, run: `firebase init hosting`
2. Select your project
3. Use current directory as public
4. Run: `firebase deploy --only hosting`

## Step 5: Save Your URLs

### 5.1 Document Your URLs
Create a file called `LEGAL_URLS.md`:

```markdown
# Legal Document URLs

## Privacy Policy
https://[your-username].github.io/naturinex-legal/privacy-policy.html

## Terms of Service
https://[your-username].github.io/naturinex-legal/terms-of-service.html

## Notes
- Deployed on: [Date]
- Platform: GitHub Pages
- Status: Active
```

### 5.2 Test Links
1. Test both URLs work
2. Verify email links work: `mailto:privacy@naturinex.com`
3. Verify website links work: `https://naturinex.com`

## ✅ Deployment Checklist

- [ ] Created GitHub repository
- [ ] Uploaded HTML files
- [ ] Enabled GitHub Pages
- [ ] URLs are working
- [ ] Mobile view looks good
- [ ] All links work
- [ ] Saved URLs for app store submission

## 🎯 Next Steps

Once you have your URLs, proceed to:
1. **Add URLs to App Stores** (Step 2)
2. **Test Legal Flow** (Step 3)
3. **Submit to App Stores** (Step 4)

---

**Time Required**: 5-10 minutes
**Cost**: FREE
**Result**: Professional legal document hosting 