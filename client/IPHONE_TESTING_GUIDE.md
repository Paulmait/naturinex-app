# iPhone Testing Guide for Naturinex

## Quick Start

1. **Install Expo Go** on your iPhone from the App Store
2. **Run the development server**: `npm start` or use `start-expo-iphone.bat`
3. **Scan the QR code** with your iPhone camera or Expo Go app
4. **Test all features** using the checklist below

## Pre-Testing Setup

### 1. Environment Configuration
Ensure these files are properly configured:

**Firebase Setup** (create `.env` file):
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

**Google OAuth** (update `app.json`):
```json
"extra": {
  "googleExpoClientId": "your_expo_client_id",
  "googleIosClientId": "your_ios_client_id",
  "googleAndroidClientId": "your_android_client_id"
}
```

### 2. Network Requirements
- iPhone and computer must be on same WiFi network
- No firewall blocking Expo development server
- Stable internet connection for Firebase and API calls

## Comprehensive Testing Checklist

### ✅ Authentication Testing

#### Login Flow
- [ ] App opens to login screen
- [ ] Email input field works
- [ ] Password input field works (secure text entry)
- [ ] Login button is enabled/disabled appropriately
- [ ] Error messages display for invalid credentials
- [ ] Loading state shows during login
- [ ] Successful login navigates to onboarding or home

#### Google OAuth (if configured)
- [ ] "Continue with Google" button works
- [ ] Google sign-in popup appears
- [ ] OAuth flow completes successfully
- [ ] User data is stored securely

#### Onboarding Flow
- [ ] New users see onboarding screens
- [ ] Progress dots update correctly
- [ ] Skip button works
- [ ] Next/Back navigation works
- [ ] Onboarding completion saves to storage

### ✅ Core App Functionality

#### Home Screen
- [ ] Welcome message displays correctly
- [ ] User email shows in header
- [ ] Scan count displays accurately
- [ ] "Scan Medication" button works
- [ ] Secondary action buttons work
- [ ] Quick tips section displays
- [ ] Bottom navigation highlights active tab

#### Camera Screen
- [ ] Camera permissions request works
- [ ] Camera view displays correctly
- [ ] Scan frame overlay shows
- [ ] Capture button works
- [ ] Gallery picker works
- [ ] Image preview shows after capture
- [ ] Analysis starts automatically
- [ ] Error handling for camera issues

#### Analysis Screen
- [ ] Loading state displays during analysis
- [ ] Results display correctly
- [ ] Medication name shows
- [ ] Natural alternatives list displays
- [ ] Effectiveness badges show
- [ ] Warnings section displays (if any)
- [ ] Recommendations section displays
- [ ] Disclaimer shows at bottom
- [ ] Action buttons work (save, share)
- [ ] Navigation back to camera works

#### Profile Screen
- [ ] User avatar displays correctly
- [ ] Email address shows
- [ ] Subscription status displays
- [ ] Scan statistics show accurately
- [ ] Settings toggles work
- [ ] Action buttons work
- [ ] Legal links work
- [ ] Logout confirmation works

#### Subscription Screen
- [ ] Plan options display correctly
- [ ] Pricing shows accurately
- [ ] Feature lists display
- [ ] Plan selection works
- [ ] Subscribe button works
- [ ] Premium status updates
- [ ] Subscription management works

### ✅ Security & Data Testing

#### Secure Storage
- [ ] Auth tokens are stored securely
- [ ] User data persists between app launches
- [ ] Sensitive data is encrypted
- [ ] Logout clears all stored data

#### Privacy Features
- [ ] Camera permissions are requested appropriately
- [ ] Photo library permissions work
- [ ] Data is not shared without consent
- [ ] Privacy policy links work

#### Error Handling
- [ ] Network errors are handled gracefully
- [ ] Firebase errors show appropriate messages
- [ ] Camera errors are handled
- [ ] API errors display user-friendly messages

### ✅ Performance Testing

#### App Performance
- [ ] App launches quickly (< 3 seconds)
- [ ] Screen transitions are smooth
- [ ] No memory leaks during use
- [ ] Camera performance is good
- [ ] Image processing is reasonable

#### Network Performance
- [ ] API calls complete in reasonable time
- [ ] Firebase operations are fast
- [ ] Image uploads work
- [ ] Offline handling works (if implemented)

### ✅ UI/UX Testing

#### Visual Design
- [ ] All screens look good on iPhone
- [ ] Text is readable
- [ ] Buttons are appropriately sized
- [ ] Colors are consistent
- [ ] Icons display correctly

#### Navigation
- [ ] Back buttons work
- [ ] Header navigation works
- [ ] Bottom navigation works
- [ ] Modal screens work
- [ ] Deep linking works (if applicable)

#### Accessibility
- [ ] Text is readable without zoom
- [ ] Touch targets are appropriately sized
- [ ] Color contrast is sufficient
- [ ] VoiceOver works (if needed)

### ✅ Device-Specific Testing

#### iPhone Models
- [ ] iPhone SE (small screen)
- [ ] iPhone 12/13/14 (standard)
- [ ] iPhone 12/13/14 Pro Max (large screen)
- [ ] iPhone 15 (latest)

#### Orientations
- [ ] Portrait mode works
- [ ] Landscape mode works (if supported)
- [ ] Rotation handling works

#### iOS Versions
- [ ] iOS 15+
- [ ] iOS 16+
- [ ] iOS 17+

## Common Issues & Solutions

### 🔴 App Won't Load
**Symptoms**: Expo Go shows error or blank screen
**Solutions**:
- Check network connection
- Restart Expo development server
- Clear Expo Go cache
- Check Firebase configuration

### 🔴 Camera Not Working
**Symptoms**: Camera permission denied or camera view blank
**Solutions**:
- Check camera permissions in iPhone Settings
- Ensure app.json has correct camera permissions
- Test with different camera apps first

### 🔴 Firebase Errors
**Symptoms**: Authentication fails or data doesn't load
**Solutions**:
- Verify Firebase configuration
- Check network connectivity
- Ensure Firebase project is active
- Verify API keys are correct

### 🔴 Slow Performance
**Symptoms**: App is slow or unresponsive
**Solutions**:
- Check device storage space
- Close other apps
- Restart Expo Go
- Check network speed

### 🔴 Navigation Issues
**Symptoms**: Screens don't navigate properly
**Solutions**:
- Check React Navigation setup
- Verify screen components exist
- Check for JavaScript errors
- Restart development server

## Testing Best Practices

### 1. Systematic Testing
- Test one feature at a time
- Document any issues found
- Test both positive and negative scenarios
- Test edge cases

### 2. Real Device Testing
- Always test on physical iPhone
- Test on different iPhone models
- Test with different iOS versions
- Test with different network conditions

### 3. User Experience Testing
- Think like an end user
- Test common user flows
- Check for intuitive navigation
- Verify error messages are helpful

### 4. Performance Monitoring
- Monitor app startup time
- Check memory usage
- Monitor network requests
- Test battery impact

## Reporting Issues

When reporting issues, include:
- iPhone model and iOS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or videos
- Console error messages
- Network conditions

## Success Criteria

The app is ready for external testing when:
- [ ] All core features work on iPhone
- [ ] Authentication flows work properly
- [ ] Camera functionality works
- [ ] Analysis results display correctly
- [ ] No critical crashes or errors
- [ ] Performance is acceptable
- [ ] UI looks professional
- [ ] Security features work
- [ ] Privacy is maintained

## Next Steps After Testing

1. **Fix any critical issues** found during testing
2. **Optimize performance** if needed
3. **Polish UI/UX** based on feedback
4. **Prepare for App Store submission**
5. **Set up production Firebase project**
6. **Configure production API endpoints** 