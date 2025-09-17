import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import TwoFactorAuthService from '../services/TwoFactorAuthService';

const BiometricSetupComponent = ({ userId, onComplete, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [step, setStep] = useState('check'); // check, setup, verify, complete

  useEffect(() => {
    checkBiometricCapabilities();
  }, []);

  const checkBiometricCapabilities = async () => {
    try {
      setLoading(true);

      // Check if device has biometric hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setIsSupported(false);
        setStep('unsupported');
        return;
      }

      // Check if biometric records are enrolled
      const isEnrolledResult = await LocalAuthentication.isEnrolledAsync();
      setIsEnrolled(isEnrolledResult);

      if (!isEnrolledResult) {
        setStep('not_enrolled');
        return;
      }

      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricType(supportedTypes);
      setIsSupported(true);
      setStep('setup');

    } catch (error) {
      console.error('Biometric check error:', error);
      Alert.alert('Error', 'Failed to check biometric capabilities.');
      setStep('unsupported');
    } finally {
      setLoading(false);
    }
  };

  const getBiometricTypeText = () => {
    if (!biometricType || biometricType.length === 0) return 'Biometric';

    const types = [];
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FACE_ID)) {
      types.push('Face ID');
    }
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      types.push('Fingerprint');
    }
    if (biometricType.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      types.push('Iris');
    }

    return types.length > 0 ? types.join(' or ') : 'Biometric';
  };

  const getBiometricIcon = () => {
    if (!biometricType || biometricType.length === 0) return 'fingerprint';

    if (biometricType.includes(LocalAuthentication.AuthenticationType.FACE_ID)) {
      return 'face';
    }
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (biometricType.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'remove-red-eye';
    }

    return 'fingerprint';
  };

  const handleSetupBiometric = async () => {
    try {
      setLoading(true);
      setStep('verify');

      const result = await TwoFactorAuthService.setupBiometric(userId);

      if (result.success) {
        setStep('complete');
        setTimeout(() => {
          Alert.alert(
            'Success',
            'Biometric authentication setup completed successfully!',
            [
              {
                text: 'OK',
                onPress: () => onComplete()
              }
            ]
          );
        }, 500);
      } else {
        throw new Error('Biometric setup failed');
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      Alert.alert(
        'Setup Failed',
        error.message || 'Failed to set up biometric authentication. Please try again.'
      );
      setStep('setup');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBiometric = async () => {
    try {
      setLoading(true);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Test your biometric authentication',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use passcode'
      });

      if (result.success) {
        Alert.alert(
          'Test Successful',
          'Biometric authentication is working correctly!'
        );
      } else {
        Alert.alert(
          'Test Failed',
          result.error || 'Biometric authentication test failed.'
        );
      }
    } catch (error) {
      console.error('Biometric test error:', error);
      Alert.alert('Error', 'Failed to test biometric authentication.');
    } finally {
      setLoading(false);
    }
  };

  const renderUnsupported = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="error-outline" size={60} color="#FF6B6B" />
        <Text style={styles.title}>Biometric Not Supported</Text>
        <Text style={styles.subtitle}>
          Your device doesn't support biometric authentication or the hardware is not available.
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What you can do:</Text>
        <Text style={styles.infoText}>
          • Use other 2FA methods like SMS or authenticator apps{'\n'}
          • Check if your device supports biometric authentication{'\n'}
          • Update your device software if available
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back to Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotEnrolled = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="fingerprint" size={60} color="#FF9500" />
        <Text style={styles.title}>Biometric Not Set Up</Text>
        <Text style={styles.subtitle}>
          You need to set up biometric authentication in your device settings first.
        </Text>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Setup Instructions:</Text>

        {Platform.OS === 'ios' ? (
          <View style={styles.platformInstructions}>
            <Text style={styles.instructionText}>
              1. Go to Settings → Face ID & Passcode or Touch ID & Passcode{'\n'}
              2. Set up Face ID or Touch ID{'\n'}
              3. Return to this app to continue setup
            </Text>
          </View>
        ) : (
          <View style={styles.platformInstructions}>
            <Text style={styles.instructionText}>
              1. Go to Settings → Security → Fingerprint{'\n'}
              2. Add your fingerprint{'\n'}
              3. Return to this app to continue setup
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={checkBiometricCapabilities}
        >
          <Text style={styles.retryButtonText}>Check Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back to Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSetup = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name={getBiometricIcon()} size={60} color="#007AFF" />
        <Text style={styles.title}>Set Up {getBiometricTypeText()}</Text>
        <Text style={styles.subtitle}>
          Use your {getBiometricTypeText().toLowerCase()} to quickly and securely access your account
        </Text>
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>

        <View style={styles.benefitItem}>
          <MaterialIcons name="speed" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Quick authentication</Text>
        </View>

        <View style={styles.benefitItem}>
          <MaterialIcons name="security" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Enhanced security</Text>
        </View>

        <View style={styles.benefitItem}>
          <MaterialIcons name="smartphone" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Device-specific protection</Text>
        </View>

        <View style={styles.benefitItem}>
          <MaterialIcons name="offline-pin" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Works offline</Text>
        </View>
      </View>

      <View style={styles.securityNote}>
        <MaterialIcons name="info" size={20} color="#007AFF" />
        <Text style={styles.securityNoteText}>
          Your biometric data stays on your device and is never shared with NaturineX or third parties.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.setupButton,
            loading && styles.setupButtonDisabled
          ]}
          onPress={handleSetupBiometric}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.setupButtonText}>Enable {getBiometricTypeText()}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestBiometric}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Test {getBiometricTypeText()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVerify = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name={getBiometricIcon()} size={60} color="#007AFF" />
        <Text style={styles.title}>Verifying {getBiometricTypeText()}</Text>
        <Text style={styles.subtitle}>
          Please use your {getBiometricTypeText().toLowerCase()} to complete the setup
        </Text>
      </View>

      <View style={styles.verifyingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.verifyingText}>
          Touch the sensor or look at the camera...
        </Text>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
        <Text style={styles.title}>{getBiometricTypeText()} Enabled</Text>
        <Text style={styles.subtitle}>
          {getBiometricTypeText()} authentication has been successfully set up for your account
        </Text>
      </View>

      <View style={styles.successContainer}>
        <View style={styles.successItem}>
          <MaterialIcons name="security" size={24} color="#4CAF50" />
          <Text style={styles.successText}>Your account is now more secure</Text>
        </View>

        <View style={styles.successItem}>
          <MaterialIcons name="speed" size={24} color="#4CAF50" />
          <Text style={styles.successText}>Faster login experience</Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    if (loading && step === 'check') {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking biometric capabilities...</Text>
        </View>
      );
    }

    switch (step) {
      case 'unsupported':
        return renderUnsupported();
      case 'not_enrolled':
        return renderNotEnrolled();
      case 'setup':
        return renderSetup();
      case 'verify':
        return renderVerify();
      case 'complete':
        return renderComplete();
      default:
        return renderSetup();
    }
  };

  return renderCurrentStep();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 30
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20
  },
  infoContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  instructionsContainer: {
    marginBottom: 30
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16
  },
  platformInstructions: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16
  },
  instructionText: {
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 20
  },
  benefitsContainer: {
    marginBottom: 30
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  benefitText: {
    fontSize: 16,
    color: '#1D1D1F',
    marginLeft: 12
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30
  },
  securityNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 18
  },
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  verifyingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  successContainer: {
    marginBottom: 40
  },
  successItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  successText: {
    fontSize: 16,
    color: '#2E7D32',
    marginLeft: 12,
    fontWeight: '500'
  },
  footer: {
    paddingBottom: 40
  },
  setupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  setupButtonDisabled: {
    backgroundColor: '#ccc'
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  testButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 16
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  backButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7'
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default BiometricSetupComponent;