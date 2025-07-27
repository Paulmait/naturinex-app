# 📦 NPM Install Instructions for Expo SDK 52

## Where to Run npm install:

Run npm install in the **root directory** of your Naturinex app:

```bash
cd C:\Users\maito\mediscan-app\naturinex-app
npm install
```

This will update all packages to match Expo SDK 52.

## Expected Output:
- Many packages will be updated
- You may see some warnings (normal)
- Process should complete in 2-5 minutes

## After npm install:
1. Clear Metro cache:
   ```bash
   npx expo start -c
   ```

2. If you see errors, try:
   ```bash
   # Delete node_modules and reinstall
   rmdir /s /q node_modules
   npm install
   ```

## Verify Installation:
```bash
npx expo --version
```
Should show version 52.x.x