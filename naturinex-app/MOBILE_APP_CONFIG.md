# 📱 Mobile App Configuration for Seamless Operation

## Critical: Both Mobile & Web MUST Work Together

### Current Setup:
- **Web App**: Uses Supabase Edge Functions via CloudFlare
- **Mobile App**: Must use the SAME endpoints
- **Admin Access**: Works on both platforms with full security

## Step 1: Update Mobile App API Configuration

### For React Native/Expo App:

Edit `src/config/api.js` in your mobile app:

```javascript
// API Configuration for Mobile App
const API_CONFIG = {
  // Use CloudFlare protected endpoint if available
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.yourdomain.com/functions/v1',

  // Fallback to direct Supabase if CloudFlare not set up
  FALLBACK_URL: 'https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1',

  // Endpoints
  ENDPOINTS: {
    ANALYZE: '/analyze-secure',
    WEBHOOK: '/stripe-webhook',
    SUBSCRIPTION: '/subscription',
  },

  // Security headers
  getHeaders: async (user) => {
    const deviceId = await getDeviceId(); // From device storage
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
      'X-Platform': 'mobile',
      'X-App-Version': Constants.manifest.version,
    };

    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
};

export default API_CONFIG;
```

## Step 2: Mobile Device Fingerprinting

Create `src/services/mobileDeviceId.js`:

```javascript
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

class MobileDeviceService {
  async getDeviceId() {
    try {
      // Check if we have a stored device ID
      let deviceId = await SecureStore.getItemAsync('device_id');

      if (!deviceId) {
        // Generate new device ID
        const deviceInfo = {
          brand: Device.brand,
          model: Device.modelName,
          os: Device.osName,
          osVersion: Device.osVersion,
          deviceId: Device.osBuildId,
          uniqueId: Constants.sessionId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        // Create hash of device info
        const deviceString = JSON.stringify(deviceInfo);
        deviceId = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          deviceString
        );

        // Store for future use
        await SecureStore.setItemAsync('device_id', deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error('Device ID generation error:', error);
      // Fallback to random ID
      return Constants.sessionId;
    }
  }

  async getDeviceInfo() {
    const location = await this.getLocation();

    return {
      deviceId: await this.getDeviceId(),
      platform: 'mobile',
      os: Device.osName,
      osVersion: Device.osVersion,
      appVersion: Constants.manifest.version,
      brand: Device.brand,
      model: Device.modelName,
      location: location,
    };
  }

  async getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        country: address?.country,
        region: address?.region,
        city: address?.city,
      };
    } catch (error) {
      console.error('Location error:', error);
      return null;
    }
  }
}

export default new MobileDeviceService();
```

## Step 3: Update Mobile Scan Function

Update `src/hooks/useScan.js` in mobile app:

```javascript
import mobileDeviceService from '../services/mobileDeviceId';
import API_CONFIG from '../config/api';

const processScan = async (medicationName) => {
  try {
    // Get device info
    const deviceInfo = await mobileDeviceService.getDeviceInfo();

    // Prepare headers
    const headers = await API_CONFIG.getHeaders(user);

    // Make API call
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANALYZE}`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          medication: medicationName,
          deviceFingerprint: deviceInfo.deviceId,
          platform: 'mobile',
          location: deviceInfo.location,
        }),
      }
    );

    // Check rate limits
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining !== null && parseInt(remaining) <= 2) {
      // Show warning in app
      showRateLimitWarning(remaining);
    }

    if (response.status === 429) {
      // Rate limit exceeded
      throw new Error('Daily limit reached. Please upgrade for unlimited scans.');
    }

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Scan error:', error);
    throw error;
  }
};
```

## Step 4: Admin Access on Mobile

Create `src/screens/AdminScreen.js`:

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { supabase } from '../config/supabase';
import mobileDeviceService from '../services/mobileDeviceId';

export default function AdminScreen({ user }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyAdminAccess();
  }, []);

  const verifyAdminAccess = async () => {
    try {
      // Get device and network info
      const deviceInfo = await mobileDeviceService.getDeviceInfo();
      const networkInfo = await Network.getIpAddressAsync();

      // Log admin access attempt
      const { data: logData } = await supabase.rpc('log_admin_access', {
        p_admin_id: user.uid,
        p_action: 'mobile_admin_login',
        p_resource: 'admin_dashboard',
        p_ip_address: networkInfo,
        p_user_agent: `MobileApp/${deviceInfo.appVersion}`,
        p_metadata: deviceInfo,
      });

      // Check admin profile
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', user.uid)
        .single();

      if (!profile || profile.role !== 'admin') {
        Alert.alert('Access Denied', 'Admin privileges required');
        return;
      }

      // Check password rotation
      const needsRotation = await supabase.rpc('check_password_rotation', {
        p_admin_id: user.uid,
      });

      if (needsRotation) {
        Alert.alert(
          'Password Update Required',
          'Your password has expired. Please update it in settings.',
          [{ text: 'Update Now', onPress: () => navigateToPasswordChange() }]
        );
        return;
      }

      // Check if mobile access is allowed
      if (!profile.permissions?.mobile_access) {
        Alert.alert(
          'Mobile Access Disabled',
          'Contact super admin to enable mobile access for your account.'
        );
        return;
      }

      setIsAdmin(true);

    } catch (error) {
      console.error('Admin verification error:', error);
      Alert.alert('Error', 'Failed to verify admin access');
    } finally {
      setLoading(false);
    }
  };

  // Rest of admin screen implementation
}
```

## Step 5: Environment Variables for Mobile

Create `.env` file in mobile app root:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/functions/v1
EXPO_PUBLIC_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe
EXPO_PUBLIC_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05

# Features
EXPO_PUBLIC_ENABLE_ADMIN=true
EXPO_PUBLIC_ENABLE_FINGERPRINT=true
```

## Step 6: Build and Deploy Mobile App

### For iOS:
```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### For Android:
```bash
# Build for Google Play
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

## Step 7: Test Both Apps Together

### Test Checklist:
- [ ] Anonymous user can scan 3 times on mobile
- [ ] Anonymous user can scan 3 times on web
- [ ] Rate limits are shared between platforms
- [ ] User login syncs between apps
- [ ] Subscription status syncs
- [ ] Admin can access dashboard on both
- [ ] Password rotation works on both
- [ ] IP tracking works on mobile
- [ ] Location tracking works (with permission)

## Security Features for Mobile:

### 1. Jailbreak/Root Detection:
```javascript
import JailMonkey from 'jail-monkey';

if (JailMonkey.isJailBroken()) {
  Alert.alert(
    'Security Warning',
    'This app cannot run on jailbroken/rooted devices for security reasons.'
  );
  return;
}
```

### 2. Certificate Pinning:
```javascript
// In app.json
{
  "expo": {
    "ios": {
      "config": {
        "networkSecurityConfig": {
          "domains": {
            "api.yourdomain.com": {
              "pin-set": {
                "expiration": "2024-12-31",
                "pins": ["sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="]
              }
            }
          }
        }
      }
    }
  }
}
```

### 3. Biometric Authentication for Admins:
```javascript
import * as LocalAuthentication from 'expo-local-authentication';

const authenticateAdmin = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access admin panel',
    fallbackLabel: 'Use password',
  });

  return result.success;
};
```

## Rate Limiting on Mobile:

The mobile app respects the same rate limits:
- **Anonymous**: 3 scans/hour
- **Free**: 10 scans/day
- **Plus**: 100 scans/day
- **Pro**: 1000 scans/day

Rate limit info is shown in the app UI when approaching limits.

## Admin Security on Mobile:

- ✅ All admin access logged with location
- ✅ IP address tracked (when available)
- ✅ Device fingerprint recorded
- ✅ Password rotation enforced
- ✅ Session timeout after 30 min
- ✅ Biometric authentication option
- ✅ Jailbreak detection
- ✅ Certificate pinning

## Monitoring Mobile Usage:

```sql
-- Query to see mobile vs web usage
SELECT
  CASE
    WHEN user_agent LIKE '%Mobile%' THEN 'Mobile'
    ELSE 'Web'
  END as platform,
  COUNT(*) as scan_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  AVG(response_time_ms) as avg_response_time
FROM scan_logs
WHERE DATE(timestamp) = CURRENT_DATE
GROUP BY platform;

-- Admin access by platform
SELECT
  admin_email,
  COUNT(CASE WHEN user_agent LIKE '%Mobile%' THEN 1 END) as mobile_access,
  COUNT(CASE WHEN user_agent NOT LIKE '%Mobile%' THEN 1 END) as web_access,
  MAX(timestamp) as last_access
FROM admin_access_logs
WHERE DATE(timestamp) >= CURRENT_DATE - 7
GROUP BY admin_email;
```

## IMPORTANT: Both Apps Use Same Backend

Both mobile and web apps:
- Use the SAME Supabase Edge Functions
- Share the SAME rate limits
- Access the SAME database
- Use the SAME authentication
- Have the SAME security measures

This ensures complete consistency and seamless operation across platforms!