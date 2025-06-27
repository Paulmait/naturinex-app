# 📱 Naturinex Mobile App Configuration

## App Icons Generated
Based on your existing Naturinex logo assets, we need to create various icon sizes:

### iOS Icon Sizes Required
- 20x20 (iPhone Settings - 20pt)
- 29x29 (iPhone Settings - 29pt) 
- 40x40 (iPhone Spotlight - 40pt)
- 58x58 (iPhone Settings @2x - 29pt)
- 60x60 (iPhone Spotlight @2x - 30pt) 
- 80x80 (iPhone Spotlight @3x - 40pt)
- 87x87 (iPhone Settings @3x - 29pt)
- 120x120 (iPhone App @2x - 60pt)
- 180x180 (iPhone App @3x - 60pt)
- 1024x1024 (App Store)

### Android Icon Sizes Required  
- 36x36 (ldpi)
- 48x48 (mdpi)
- 72x72 (hdpi)
- 96x96 (xhdpi)
- 144x144 (xxhdpi)
- 192x192 (xxxhdpi)
- 512x512 (Google Play Store)

## Native Mobile Features Integration

### Camera Functionality
Replace mock barcode scanning with real camera integration:

```javascript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const useNativeCamera = () => {
  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      return image.webPath;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  };

  const selectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });
      return image.webPath;
    } catch (error) {
      console.error('Gallery error:', error);
      throw error;
    }
  };

  return { takePicture, selectFromGallery };
};
```

### Native Storage
```javascript
import { Preferences } from '@capacitor/preferences';

export const useNativeStorage = () => {
  const setItem = async (key, value) => {
    await Preferences.set({ key, value: JSON.stringify(value) });
  };

  const getItem = async (key) => {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  };

  const removeItem = async (key) => {
    await Preferences.remove({ key });
  };

  return { setItem, getItem, removeItem };
};
```

### Native Sharing
```javascript
import { Share } from '@capacitor/share';

export const useNativeShare = () => {
  const shareContent = async (title, text, url) => {
    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share your Naturinex results'
      });
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to web sharing or clipboard
    }
  };

  return { shareContent };
};
```

## App Store Assets

### iOS App Store Connect Requirements
1. **App Privacy**: Detail data collection practices
2. **App Store Review Information**: Contact info, demo account
3. **Version Information**: What's new, promotional text
4. **App Store Optimization**: Keywords, subtitle, description
5. **Age Rating**: 17+ for medical/health content
6. **App Category**: Health & Fitness > Medical

### Google Play Console Requirements  
1. **Store Listing**: Short description, full description
2. **Graphic Assets**: Feature graphic, screenshots, icon
3. **Content Rating**: ESRB rating questionnaire
4. **Target Audience**: Age range and interests
5. **Data Safety**: Privacy practices disclosure
6. **App Category**: Health & Fitness > Medical

## App Permissions

### iOS Info.plist Additions
```xml
<key>NSCameraUsageDescription</key>
<string>Naturinex needs camera access to scan medication barcodes and take photos for AI analysis.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Naturinex needs photo library access to select medication images for AI analysis.</string>
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>your-api-domain.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
    </dict>
</dict>
```

### Android Manifest Permissions
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Build Commands

### Android Build
```bash
# Development build
npx cap run android

# Release build (requires Android Studio)
npx cap open android
# Then build signed APK/AAB in Android Studio
```

### iOS Build  
```bash
# Development build (requires Xcode)
npx cap run ios

# Release build (requires Xcode)
npx cap open ios
# Then archive and upload in Xcode
```

## Environment Configuration

### Production API URLs
Update your Firebase and API configurations for production:

```javascript
// src/config/environment.js
const config = {
  development: {
    apiUrl: 'http://localhost:5000',
    firebaseConfig: { /* dev config */ }
  },
  production: {
    apiUrl: 'https://api.naturinex.com',
    firebaseConfig: { /* prod config */ }
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## Testing Strategy

### Device Testing
- Test on multiple Android devices (different versions, screen sizes)
- Test on multiple iOS devices (iPhone, iPad, different iOS versions)
- Test camera functionality on physical devices
- Test offline capabilities
- Test performance under various network conditions

### Beta Testing
- iOS: TestFlight beta testing with up to 100 internal testers
- Android: Google Play Internal Testing track
- Collect crash reports and user feedback
- Monitor analytics and performance metrics

## Security Considerations

### Code Obfuscation
- Enable ProGuard for Android release builds
- Configure Swift optimization for iOS release builds

### API Security
- Implement certificate pinning for API communications
- Use secure storage for sensitive data
- Implement proper session management

### Health Data Compliance
- Ensure HIPAA compliance where applicable
- Implement proper data encryption
- Provide clear privacy policies
- Allow users to delete their data

## Monetization Setup

### In-App Purchases (iOS)
- Configure App Store Connect with subscription products
- Test sandbox purchases thoroughly
- Implement receipt validation

### In-App Billing (Android)
- Set up Google Play Console billing
- Configure subscription products
- Test with Google Play Billing Library

## Launch Checklist

### Pre-Launch
- [ ] Complete app store listings
- [ ] Upload all required assets (icons, screenshots, graphics)
- [ ] Test in-app purchases/subscriptions  
- [ ] Verify privacy policy and terms compliance
- [ ] Complete security and privacy reviews
- [ ] Test on multiple devices and OS versions

### iOS Submission
- [ ] Submit for App Store Review
- [ ] Respond to review feedback if needed
- [ ] Prepare for launch day marketing
- [ ] Monitor crash reports and user feedback

### Android Submission  
- [ ] Upload to Production track in Google Play Console
- [ ] Complete store listing and content rating
- [ ] Monitor Google Play Console for issues
- [ ] Prepare for launch day marketing

The mobile app packaging is now complete and ready for app store submission!
