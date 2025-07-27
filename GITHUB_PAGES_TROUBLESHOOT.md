# GitHub Pages Troubleshooting

## The Issue
Your index.html content is correct but showing blank on GitHub Pages.

## Common Causes & Solutions

### 1. Browser Cache Issue (MOST LIKELY)
Try these:
- **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Open in incognito/private mode**: This bypasses cache
- **Try a different browser**
- **Clear browser cache completely**

### 2. GitHub Pages Deployment Delay
- GitHub Pages can take 5-10 minutes to update
- Check: https://github.com/Paulmait/naturinex-legal/actions (for deployment status)

### 3. Check GitHub Pages Settings
1. Go to: https://github.com/Paulmait/naturinex-legal/settings/pages
2. Verify:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Status should show: "Your site is live at..."

### 4. Test Direct File Access
Try these URLs directly:
- Raw file: https://raw.githubusercontent.com/Paulmait/naturinex-legal/main/index.html
- Direct privacy: https://paulmait.github.io/naturinex-legal/privacy-policy-enhanced.html
- Direct terms: https://paulmait.github.io/naturinex-legal/terms-of-service-enhanced.html

### 5. Force Rebuild
Make a small change to trigger rebuild:
1. Edit index.html on GitHub
2. Add a space after </html>
3. Commit with message: "Trigger GitHub Pages rebuild"
4. Wait 5 minutes

### 6. Check Console Errors
1. Open the blank page
2. Press F12 (Developer Tools)
3. Click "Console" tab
4. Look for any red error messages

## Quick Test
Open this in a new incognito window:
https://paulmait.github.io/naturinex-legal/?nocache=1

If it works in incognito, it's definitely a cache issue.