# 📤 Upload Updated Legal Documents to GitHub

## Files to Upload:
✅ Located at: `C:\Users\maito\mediscan-app\naturinex-app\legal\`
- `privacy-policy-enhanced.html`
- `terms-of-service-enhanced.html`

## Method 1: Via GitHub Web Interface (Easiest)

### Step 1: Go to Your Repository
https://github.com/Paulmait/naturinex-legal

### Step 2: Update Privacy Policy
1. Click on `privacy-policy-enhanced.html`
2. Click the **pencil icon** (Edit this file)
3. **DELETE** all existing content
4. Open `C:\Users\maito\mediscan-app\naturinex-app\legal\privacy-policy-enhanced.html` in Notepad
5. Copy ALL content (Ctrl+A, Ctrl+C)
6. Paste into GitHub editor
7. Scroll down, add commit message: "Update privacy policy with medical disclaimers and GDPR compliance"
8. Click **"Commit changes"**

### Step 3: Update Terms of Service
1. Click on `terms-of-service-enhanced.html`
2. Click the **pencil icon** (Edit this file)
3. **DELETE** all existing content
4. Open `C:\Users\maito\mediscan-app\naturinex-app\legal\terms-of-service-enhanced.html` in Notepad
5. Copy ALL content (Ctrl+A, Ctrl+C)
6. Paste into GitHub editor
7. Scroll down, add commit message: "Update terms of service with medical disclaimers and liability"
8. Click **"Commit changes"**

### Step 4: Add index.html (if not done yet)
1. Click **"Add file"** → **"Create new file"**
2. Name it: `index.html`
3. Copy content from the index.html I created earlier
4. Click **"Commit new file"**

## Method 2: Via Git Command Line

```bash
# Clone the repository
git clone https://github.com/Paulmait/naturinex-legal.git
cd naturinex-legal

# Copy the updated files
copy "C:\Users\maito\mediscan-app\naturinex-app\legal\privacy-policy-enhanced.html" .
copy "C:\Users\maito\mediscan-app\naturinex-app\legal\terms-of-service-enhanced.html" .

# Add and commit
git add .
git commit -m "Update legal documents with medical disclaimers and compliance"
git push origin main
```

## Verify Everything Works

After uploading, test these URLs:
1. **Home**: https://paulmait.github.io/naturinex-legal/
2. **Privacy**: https://paulmait.github.io/naturinex-legal/privacy-policy-enhanced.html
3. **Terms**: https://paulmait.github.io/naturinex-legal/terms-of-service-enhanced.html

Check for:
- ✅ Medical disclaimers
- ✅ AI technology notices
- ✅ GDPR/CCPA sections
- ✅ Emergency warnings
- ✅ Proper formatting

## Important Note:
GitHub Pages may take 1-5 minutes to update after you commit changes. If you don't see updates immediately, wait a few minutes and refresh.

## Also Update App References:
Your app already points to the correct URLs:
- WebView loads from: `https://raw.githubusercontent.com/Paulmait/naturinex-legal/main/privacy-policy-enhanced.html`
- GitHub Pages URL: `https://paulmait.github.io/naturinex-legal/privacy-policy-enhanced.html`

Both will work once updated!