import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import TwoFactorAuthService from '../services/TwoFactorAuthService';

const { width } = Dimensions.get('window');

const AuthenticatorSetupComponent = ({ userId, onComplete, onBack }) => {
  const [step, setStep] = useState('setup'); // setup, verify
  const [qrCodeData, setQrCodeData] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setupTOTP();
  }, []);

  const setupTOTP = async () => {
    try {
      setLoading(true);

      const result = await TwoFactorAuthService.setupTOTP(userId, 'NaturineX');

      setQrCodeData(result.qrCodeData);
      setManualEntryKey(result.manualEntryKey);
    } catch (error) {
      console.error('TOTP setup error:', error);
      Alert.alert(
        'Setup Error',
        'Failed to set up authenticator app. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    try {
      await Clipboard.setStringAsync(manualEntryKey);
      Alert.alert('Copied', 'Secret key copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);

      await TwoFactorAuthService.verifyTOTP(userId, verificationCode);

      Alert.alert(
        'Success',
        'Authenticator app setup completed successfully!',
        [
          {
            text: 'OK',
            onPress: () => onComplete()
          }
        ]
      );
    } catch (error) {
      console.error('TOTP verification error:', error);
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid verification code. Please check your authenticator app and try again.'
      );
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const renderSetupStep = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="shield-key" size={60} color="#007AFF" />
        <Text style={styles.title}>Set Up Authenticator App</Text>
        <Text style={styles.subtitle}>
          Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Setting up authenticator...</Text>
        </View>
      ) : (
        <>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Setup Instructions:</Text>

            <View style={styles.instruction}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Download an authenticator app if you don't have one
              </Text>
            </View>

            <View style={styles.instruction}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                Scan the QR code below or enter the key manually
              </Text>
            </View>

            <View style={styles.instruction}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                Enter the 6-digit code from your app to verify
              </Text>
            </View>
          </View>

          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Scan QR Code</Text>
            <View style={styles.qrCodeWrapper}>
              {qrCodeData ? (
                <View style={styles.qrCodeDisplay}>
                  <Text style={styles.qrCodeText}>
                    QR Code will be displayed here.{'\n'}
                    For now, use the manual entry key below.
                  </Text>
                  <Text style={styles.qrDataText}>{qrCodeData}</Text>
                </View>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.manualEntryContainer}>
            <Text style={styles.manualEntryTitle}>Or Enter Key Manually</Text>
            <View style={styles.keyContainer}>
              <Text style={styles.keyText}>{manualEntryKey}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyKey}
              >
                <MaterialIcons name="content-copy" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.keyHelp}>
              Tap to copy the key, then enter it manually in your authenticator app
            </Text>
          </View>

          <View style={styles.appSuggestions}>
            <Text style={styles.appSuggestionsTitle}>Recommended Apps:</Text>
            <View style={styles.appsList}>
              <View style={styles.appItem}>
                <MaterialIcons name="security" size={20} color="#666" />
                <Text style={styles.appText}>Google Authenticator</Text>
              </View>
              <View style={styles.appItem}>
                <MaterialIcons name="security" size={20} color="#666" />
                <Text style={styles.appText}>Authy</Text>
              </View>
              <View style={styles.appItem}>
                <MaterialIcons name="security" size={20} color="#666" />
                <Text style={styles.appText}>Microsoft Authenticator</Text>
              </View>
            </View>
          </View>
        </>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            loading && styles.nextButtonDisabled
          ]}
          onPress={() => setStep('verify')}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>I've Added the Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderVerifyStep = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="shield-check" size={60} color="#007AFF" />
        <Text style={styles.title}>Verify Authenticator</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code from your authenticator app
        </Text>
      </View>

      <View style={styles.verificationContainer}>
        <Text style={styles.verificationLabel}>Verification Code</Text>
        <TextInput
          style={styles.verificationInput}
          value={verificationCode}
          onChangeText={setVerificationCode}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          selectTextOnFocus
          textAlign="center"
        />
        <Text style={styles.verificationHelp}>
          The code refreshes every 30 seconds
        </Text>
      </View>

      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>Troubleshooting:</Text>
        <Text style={styles.troubleshootingText}>
          • Make sure your device's time is correct{'\n'}
          • Try generating a new code{'\n'}
          • Check that you entered the account correctly
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (!verificationCode || verificationCode.length !== 6 || loading) && styles.verifyButtonDisabled
          ]}
          onPress={handleVerifyCode}
          disabled={!verificationCode || verificationCode.length !== 6 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Complete</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('setup')}
        >
          <Text style={styles.backButtonText}>Back to Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return step === 'setup' ? renderSetupStep() : renderVerifyStep();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
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
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
    lineHeight: 22
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7'
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qrCodeDisplay: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8
  },
  qrCodeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8
  },
  qrDataText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace'
    })
  },
  manualEntryContainer: {
    marginBottom: 30
  },
  manualEntryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
    textAlign: 'center'
  },
  keyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8
  },
  keyText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace'
    }),
    color: '#1D1D1F',
    letterSpacing: 1
  },
  copyButton: {
    padding: 8
  },
  keyHelp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  appSuggestions: {
    marginBottom: 40
  },
  appSuggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12
  },
  appsList: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  appText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginLeft: 8
  },
  verificationContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  verificationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16
  },
  verificationInput: {
    width: 150,
    height: 56,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        outline: 'none'
      }
    })
  },
  verificationHelp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  troubleshootingContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8
  },
  troubleshootingText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  footer: {
    paddingBottom: 40
  },
  nextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc'
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc'
  },
  verifyButtonText: {
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

export default AuthenticatorSetupComponent;