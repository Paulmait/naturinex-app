# Two-Factor Authentication (2FA) System for NaturineX

## Overview

This comprehensive Two-Factor Authentication system provides multiple layers of security for the NaturineX application, supporting SMS verification, authenticator apps (TOTP), biometric authentication, and backup codes.

## Features

### 🔐 Multiple Authentication Methods
- **Phone SMS**: Receive verification codes via text message
- **Authenticator Apps**: Support for Google Authenticator, Authy, Microsoft Authenticator
- **Biometric**: Face ID, Touch ID, and fingerprint authentication
- **Backup Codes**: Emergency access codes for account recovery

### 🛡️ Security Features
- End-to-end encrypted secret storage
- Session-based security validation
- Time-limited verification codes
- Rate limiting and abuse protection
- Secure backup code generation and management

### 🔄 Universal Backend Support
- Firebase Authentication and Firestore
- Supabase Authentication and Database
- Automatic backend detection and switching

## File Structure

```
src/
├── services/
│   └── TwoFactorAuthService.js          # Core 2FA service
├── components/
│   ├── TwoFactorSetupWizard.js          # Multi-step setup wizard
│   ├── PhoneVerificationComponent.js    # SMS verification UI
│   ├── AuthenticatorSetupComponent.js   # TOTP setup with QR codes
│   ├── BiometricSetupComponent.js       # Biometric authentication setup
│   ├── BackupCodesComponent.js          # Backup code management
│   ├── TwoFactorVerificationModal.js    # Verification modal for login
│   ├── SecureOperationWrapper.js        # Protection for sensitive operations
│   └── SecurePaymentScreen.js           # Example secure operation
├── screens/
│   ├── TwoFactorSettingsScreen.js       # 2FA management interface
│   └── LoginScreen.js                   # Updated with 2FA integration
├── contexts/
│   └── AuthContext.js                   # Enhanced with 2FA methods
└── database/
    ├── 2fa_schema.sql                   # Supabase database schema
    └── firestore_2fa_rules.js           # Firebase security rules
```

## Quick Start

### 1. Setup Database

#### For Supabase:
```sql
-- Run the SQL commands in src/database/2fa_schema.sql
-- in your Supabase SQL Editor
```

#### For Firebase:
```javascript
// Add the security rules from src/database/firestore_2fa_rules.js
// to your Firebase Console -> Firestore Database -> Rules
```

### 2. Environment Configuration

Ensure these environment variables are set:
```bash
REACT_APP_USE_SUPABASE=false  # Set to true for Supabase, false for Firebase
```

### 3. Component Integration

#### Basic 2FA Setup:
```jsx
import TwoFactorSetupWizard from '../components/TwoFactorSetupWizard';

function MyComponent() {
  const [showSetup, setShowSetup] = useState(false);

  return (
    <TwoFactorSetupWizard
      visible={showSetup}
      onClose={() => setShowSetup(false)}
      onComplete={(methods) => console.log('Setup complete:', methods)}
    />
  );
}
```

#### Login with 2FA:
```jsx
import TwoFactorVerificationModal from '../components/TwoFactorVerificationModal';

function LoginScreen() {
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState(null);

  return (
    <TwoFactorVerificationModal
      visible={show2FA}
      userId={userId}
      operation="login"
      onSuccess={() => {/* Handle successful verification */}}
      onClose={() => setShow2FA(false)}
    />
  );
}
```

#### Secure Operations:
```jsx
import SecureOperationWrapper from '../components/SecureOperationWrapper';

function PaymentScreen() {
  return (
    <SecureOperationWrapper operation="payment">
      {/* Your payment form here */}
      <PaymentForm />
    </SecureOperationWrapper>
  );
}
```

## API Reference

### TwoFactorAuthService

#### Core Methods

```javascript
// Initialize the service
await TwoFactorAuthService.initialize();

// Setup phone verification
await TwoFactorAuthService.setupPhoneVerification(phoneNumber, userId);
await TwoFactorAuthService.verifyPhoneCode(userId, code);

// Setup TOTP (Authenticator apps)
const { secret, qrCodeData } = await TwoFactorAuthService.setupTOTP(userId);
await TwoFactorAuthService.verifyTOTP(userId, token);

// Setup biometric authentication
await TwoFactorAuthService.setupBiometric(userId);
await TwoFactorAuthService.verifyBiometric(userId, promptMessage);

// Generate and verify backup codes
const codes = await TwoFactorAuthService.generateBackupCodes(userId);
await TwoFactorAuthService.verifyBackupCode(userId, code);

// Session management
const session = await TwoFactorAuthService.createSecureSession(userId, true);
const isValid = await TwoFactorAuthService.validateSession(userId, sessionId);

// Get user settings
const settings = await TwoFactorAuthService.getUserSettings(userId);

// Disable 2FA methods
await TwoFactorAuthService.disable2FA(userId, 'phone'); // or 'totp', 'biometric', 'all'
```

### AuthContext Enhanced Methods

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const {
    setup2FA,
    get2FASettings,
    require2FAForOperation,
    validateSecureSession,
    createSecureSession,
    disable2FA,
    twoFactorSettings,
    secureSession
  } = useAuth();

  // Check if operation requires 2FA
  const needsVerification = await require2FAForOperation('payment');

  // Create secure session after 2FA verification
  const session = await createSecureSession(true);
}
```

## Security Considerations

### 🔒 Data Protection
- All TOTP secrets are encrypted using AES encryption
- Backup codes are stored encrypted in the database
- Session tokens are time-limited and validated
- Biometric data never leaves the device

### 🚨 Rate Limiting
- SMS codes have a 60-second cooldown period
- Failed verification attempts are tracked
- Backup codes can only be used once
- Sessions expire after 24 hours

### 🛡️ Best Practices
- Always validate 2FA for sensitive operations
- Implement proper error handling
- Use HTTPS for all communications
- Regularly rotate backup codes
- Monitor failed authentication attempts

## Sensitive Operations

The following operations are automatically protected by 2FA:

1. **Payments and Subscriptions**
   - Credit card transactions
   - Subscription changes
   - Billing information updates

2. **Medical Data Access**
   - Viewing health records
   - Exporting medical data
   - Sharing health information

3. **Security Settings**
   - Changing passwords
   - Updating 2FA settings
   - Account deletion

4. **Profile Updates**
   - Email address changes
   - Phone number updates
   - Critical profile modifications

## Usage Examples

### Setting Up 2FA for New Users

```jsx
import { useAuth } from '../contexts/AuthContext';
import TwoFactorSetupWizard from '../components/TwoFactorSetupWizard';

function OnboardingScreen() {
  const { currentUser } = useAuth();
  const [showSetup, setShowSetup] = useState(false);

  const handleSetupComplete = (enabledMethods) => {
    console.log('2FA methods enabled:', enabledMethods);
    // Navigate to main app
  };

  return (
    <View>
      <Text>Secure your account with two-factor authentication</Text>
      <Button
        title="Setup 2FA"
        onPress={() => setShowSetup(true)}
      />

      <TwoFactorSetupWizard
        visible={showSetup}
        onClose={() => setShowSetup(false)}
        onComplete={handleSetupComplete}
      />
    </View>
  );
}
```

### Protecting a Payment Screen

```jsx
import SecureOperationWrapper from '../components/SecureOperationWrapper';

function CheckoutScreen() {
  const handlePayment = async () => {
    // Payment processing logic
  };

  return (
    <SecureOperationWrapper
      operation="payment"
      onVerificationSuccess={() => console.log('Payment authorized')}
    >
      <View>
        <Text>Complete your purchase</Text>
        <Button title="Pay Now" onPress={handlePayment} />
      </View>
    </SecureOperationWrapper>
  );
}
```

### Manual 2FA Verification

```jsx
import TwoFactorVerificationModal from '../components/TwoFactorVerificationModal';

function SecuritySensitiveAction() {
  const { currentUser } = useAuth();
  const [showVerification, setShowVerification] = useState(false);

  const performSensitiveAction = () => {
    setShowVerification(true);
  };

  const handleVerificationSuccess = () => {
    setShowVerification(false);
    // Proceed with sensitive action
    console.log('Action authorized');
  };

  return (
    <View>
      <Button
        title="Delete Account"
        onPress={performSensitiveAction}
      />

      <TwoFactorVerificationModal
        visible={showVerification}
        userId={currentUser?.uid}
        operation="account_deletion"
        onSuccess={handleVerificationSuccess}
        onClose={() => setShowVerification(false)}
      />
    </View>
  );
}
```

## Troubleshooting

### Common Issues

1. **SMS not received**
   - Check phone number format
   - Verify network connectivity
   - Check spam/blocked messages
   - Try resending after cooldown period

2. **Authenticator app codes not working**
   - Ensure device time is synchronized
   - Verify correct app is being used
   - Check if secret was entered correctly
   - Try generating a new QR code

3. **Biometric authentication fails**
   - Verify biometric hardware is available
   - Check if biometric data is enrolled
   - Ensure app has necessary permissions
   - Try re-enrolling biometric data

4. **Backup codes not working**
   - Verify code hasn't been used before
   - Check for typos in code entry
   - Ensure codes haven't expired
   - Generate new codes if needed

### Error Codes

- `INVALID_PHONE_NUMBER`: Phone number format is incorrect
- `VERIFICATION_EXPIRED`: Verification code has expired
- `INVALID_CODE`: Verification code is incorrect
- `BIOMETRIC_NOT_AVAILABLE`: Device doesn't support biometric auth
- `SESSION_EXPIRED`: 2FA session has expired
- `BACKUP_CODE_USED`: Backup code has already been used

## Migration Guide

### From Basic Auth to 2FA

1. Update your AuthContext to use the enhanced version
2. Add 2FA settings to user profiles
3. Implement database schema changes
4. Update security rules
5. Add 2FA UI components to your app
6. Test with existing users

### Database Migration

```sql
-- For existing Firebase users, run:
-- Add 2FA settings collection with proper indexes

-- For existing Supabase users, run:
-- Execute the migration scripts in 2fa_schema.sql
```

## Testing

### Unit Tests

```javascript
// Example test for 2FA service
import TwoFactorAuthService from '../services/TwoFactorAuthService';

describe('TwoFactorAuthService', () => {
  test('should generate valid TOTP secret', async () => {
    const result = await TwoFactorAuthService.setupTOTP('test-user');
    expect(result.secret).toHaveLength(32);
    expect(result.qrCodeData).toContain('otpauth://totp/');
  });
});
```

### Integration Testing

1. Test SMS verification flow
2. Verify TOTP code generation and validation
3. Test biometric authentication on devices
4. Validate backup code generation and usage
5. Test session management
6. Verify secure operation protection

## Performance Considerations

- **Caching**: User 2FA settings are cached in memory
- **Lazy Loading**: Components are loaded only when needed
- **Session Management**: Reduces repeated 2FA prompts
- **Background Cleanup**: Expired verifications are cleaned automatically

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in the console
3. Test with different 2FA methods
4. Verify database permissions
5. Check network connectivity

## Changelog

### v1.0.0
- Initial implementation with SMS, TOTP, biometric, and backup codes
- Universal Firebase/Supabase support
- Comprehensive UI components
- Session management
- Secure operation protection

---

**Note**: This 2FA system is designed for production use but should be thoroughly tested in your specific environment before deployment. Always follow security best practices and consider additional measures based on your application's requirements.