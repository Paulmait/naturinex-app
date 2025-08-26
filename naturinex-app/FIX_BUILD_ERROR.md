# Fix iOS Build Error

## Issue
The build failed during the "Install dependencies" phase. This is likely due to:
1. Missing iOS configuration
2. Dependency conflicts
3. Sharp package causing issues in EAS Build

## Solution

### Step 1: Remove Sharp from Dependencies
Sharp is only needed locally for generating images, not in the app build.

```bash
npm uninstall sharp
npm install --save-dev sharp
```

### Step 2: Update package.json
Move sharp to devDependencies so it's not included in the build.

### Step 3: Clear EAS Cache and Rebuild

```bash
eas build --platform ios --profile production --clear-cache
```

## Alternative: Use Pre-Built Binary
If the issue persists, we can:
1. Generate all assets locally (already done ✅)
2. Exclude sharp from the build
3. Use Expo's built-in image handling

## Quick Fix Commands

```bash
# Move sharp to devDependencies
npm uninstall sharp
npm install --save-dev sharp

# Commit the change
git add package.json package-lock.json
git commit -m "Move sharp to devDependencies to fix iOS build"

# Rebuild with cache cleared
eas build --platform ios --profile production --clear-cache
```

## Important Notes
- The screenshots issue is in App Store Connect, not the build
- Upload the screenshots from `assets/app-store-screenshots/`
- Use either 1290×2796 or 1320×2868 for 6.9" display