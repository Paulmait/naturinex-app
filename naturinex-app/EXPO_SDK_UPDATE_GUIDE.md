# 📱 Expo SDK Update Guide (v53 → v52)

## Why This Is Critical
Expo SDK 53 is experimental. App stores require stable SDK versions.

## Step 1: Backup Your Project
```bash
git add -A
git commit -m "Backup before SDK update"
```

## Step 2: Update Expo SDK
```bash
# Install Expo SDK 52 (stable)
npm install expo@~52.0.0

# Let Expo fix dependencies
npx expo install --fix

# Verify the update
npx expo doctor
```

## Step 3: Fix Breaking Changes
Common issues after update:
1. **Camera API changes**: expo-camera might need updates
2. **Secure Store**: Should be compatible
3. **Build configuration**: Update eas.json if needed

## Step 4: Test Thoroughly
```bash
# Clear cache and start
npx expo start -c

# Test these features:
1. Camera functionality
2. Google Sign-In
3. Subscription flow
4. Image analysis
```

## Step 5: Update EAS Build
```bash
# Update EAS CLI
npm install -g eas-cli@latest

# Configure build
eas build:configure
```

## If Something Breaks
1. Check Expo changelog: https://blog.expo.dev/expo-sdk-52
2. Run: `npx expo-doctor`
3. Clear caches:
   ```bash
   npx expo start -c
   rm -rf node_modules
   npm install
   ```

## Alternative: Stay on SDK 53
If update causes too many issues:
1. Keep SDK 53 for now
2. Submit to TestFlight/Internal Testing first
3. Update after initial testing

## Quick Command Summary
```bash
# One-liner update
npm install expo@~52.0.0 && npx expo install --fix && npx expo doctor
```

## Expected Time: 30-60 minutes
Including testing and fixing any issues.