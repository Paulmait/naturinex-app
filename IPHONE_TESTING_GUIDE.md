# iPhone Testing Guide for Naturinex

## ✅ Setup Complete!

You're now ready to test Naturinex on your iPhone. Here are your testing options:

## Option 1: Quick Testing with Expo Go (Recommended for Initial Testing)

1. **Install Expo Go on your iPhone**
   - Download from App Store: https://apps.apple.com/app/expo-go/id982107779

2. **Start the development server**
   ```bash
   cd client
   npm start
   ```

3. **Connect your iPhone**
   - Make sure your iPhone and computer are on the same Wi-Fi network
   - Open Expo Go app on your iPhone
   - Scan the QR code displayed in the terminal with your iPhone camera
   - The app will load in Expo Go

## Option 2: Development Build (Full Features)

For testing all features including camera, Stripe payments, and native functionality:

1. **Create a development build**
   ```bash
   cd client
   eas build --profile development --platform ios
   ```

2. **Wait for build** (usually 15-30 minutes)
   - You'll receive an email when the build is complete
   - Or check status at: https://expo.dev/accounts/guampaul/projects

3. **Install on iPhone**
   - Click the link in the email to install via TestFlight
   - Or download the .ipa file and install using Apple Configurator

## Testing Features

### With Expo Go:
- ✅ UI and navigation
- ✅ Authentication (Firebase)
- ✅ Basic image selection
- ⚠️ Limited camera functionality
- ❌ Stripe payments (requires development build)

### With Development Build:
- ✅ Full camera access for medication scanning
- ✅ Stripe payment processing
- ✅ Push notifications
- ✅ All native features

## Common Commands

```bash
# Start development server
cd client && npm start

# Create iOS development build
cd client && eas build --profile development --platform ios

# Create production build for App Store
cd client && eas build --profile production --platform ios

# Submit to App Store
cd client && eas submit -p ios
```

## Troubleshooting

1. **"Metro bundler not found"**
   - Close all terminals
   - Run `cd client && npm start` again

2. **Camera not working in Expo Go**
   - This is normal - create a development build for full camera access

3. **Connection issues**
   - Ensure iPhone and computer are on same network
   - Try using tunnel mode: `npm start -- --tunnel`

4. **Build errors**
   - Check build logs at https://expo.dev/accounts/guampaul/projects
   - Ensure all dependencies are installed: `cd client && npm install`

## Your Account Info
- **EAS Username**: guampaul
- **Project ID**: 20409717-8b24-4d2c-b941-452d5211d1e2
- **Bundle ID**: com.naturinex.app

## Next Steps

1. Start with Expo Go for quick UI testing
2. Create a development build for full feature testing
3. Test all medical scanning features thoroughly
4. When ready, create production build for App Store submission

Happy testing! 🚀