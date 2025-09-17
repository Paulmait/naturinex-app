import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import TwoFactorAuthService from '../services/TwoFactorAuthService';

const PhoneVerificationComponent = ({ userId, onComplete, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('enter_phone'); // enter_phone, verify_code
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const codeInputRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const formatPhoneNumber = (number) => {
    // Remove all non-digits
    const cleaned = number.replace(/\D/g, '');

    // Apply US phone number formatting
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneNumberChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const getCleanPhoneNumber = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
  };

  const handleSendCode = async () => {
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
      return;
    }

    try {
      setLoading(true);
      const cleanPhone = getCleanPhoneNumber();

      await TwoFactorAuthService.setupPhoneVerification(cleanPhone, userId);

      setStep('verify_code');
      setCountdown(60);
      setCanResend(false);

      Alert.alert(
        'Code Sent',
        `A verification code has been sent to ${phoneNumber}`
      );
    } catch (error) {
      console.error('Phone verification setup error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text, index) => {
    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (text && index === 5 && newCode.every(digit => digit !== '')) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code = null) => {
    const codeToVerify = code || verificationCode.join('');

    if (codeToVerify.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit code.');
      return;
    }

    try {
      setLoading(true);

      await TwoFactorAuthService.verifyPhoneCode(userId, codeToVerify);

      Alert.alert(
        'Success',
        'Phone verification completed successfully!',
        [
          {
            text: 'OK',
            onPress: () => onComplete()
          }
        ]
      );
    } catch (error) {
      console.error('Phone code verification error:', error);
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid verification code. Please try again.'
      );

      // Clear the code inputs
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setLoading(true);
      const cleanPhone = getCleanPhoneNumber();

      await TwoFactorAuthService.setupPhoneVerification(cleanPhone, userId);

      setCountdown(60);
      setCanResend(false);
      setVerificationCode(['', '', '', '', '', '']);

      Alert.alert('Code Resent', 'A new verification code has been sent.');
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneInput = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="smartphone" size={60} color="#007AFF" />
        <Text style={styles.title}>Add Phone Number</Text>
        <Text style={styles.subtitle}>
          We'll send a verification code to your phone for two-factor authentication
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.phoneInputWrapper}>
          <Text style={styles.countryCode}>🇺🇸 +1</Text>
          <TextInput
            style={styles.phoneInput}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            maxLength={14}
            autoFocus
          />
        </View>
        <Text style={styles.inputHelp}>
          Standard messaging rates may apply
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!phoneNumber || loading) && styles.sendButtonDisabled
          ]}
          onPress={handleSendCode}
          disabled={!phoneNumber || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCodeVerification = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="message" size={60} color="#007AFF" />
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {phoneNumber}
        </Text>
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Verification Code</Text>
        <View style={styles.codeInputsWrapper}>
          {verificationCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => codeInputRefs.current[index] = ref}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled
              ]}
              value={digit}
              onChangeText={text => handleCodeChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>
      </View>

      <View style={styles.resendContainer}>
        {countdown > 0 ? (
          <Text style={styles.countdownText}>
            Resend code in {countdown}s
          </Text>
        ) : (
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={!canResend || loading}
          >
            <Text style={[
              styles.resendText,
              (!canResend || loading) && styles.resendTextDisabled
            ]}>
              Resend Code
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (!verificationCode.every(digit => digit !== '') || loading) && styles.verifyButtonDisabled
          ]}
          onPress={() => handleVerifyCode()}
          disabled={!verificationCode.every(digit => digit !== '') || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('enter_phone')}
        >
          <Text style={styles.backButtonText}>Change Number</Text>
        </TouchableOpacity>
      </View>

      {/* Invisible reCAPTCHA container for Firebase */}
      <View id="recaptcha-container" style={{ display: 'none' }} />
    </View>
  );

  return step === 'enter_phone' ? renderPhoneInput() : renderCodeVerification();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
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
  inputContainer: {
    marginBottom: 40
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56
  },
  countryCode: {
    fontSize: 16,
    marginRight: 12,
    color: '#1D1D1F'
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
    ...Platform.select({
      web: {
        outline: 'none'
      }
    })
  },
  inputHelp: {
    fontSize: 12,
    color: '#666',
    marginTop: 8
  },
  codeContainer: {
    marginBottom: 40
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
    textAlign: 'center'
  },
  codeInputsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1D1D1F',
    ...Platform.select({
      web: {
        outline: 'none'
      }
    })
  },
  codeInputFilled: {
    backgroundColor: '#007AFF',
    color: '#fff'
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  countdownText: {
    fontSize: 14,
    color: '#666'
  },
  resendText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600'
  },
  resendTextDisabled: {
    color: '#ccc'
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc'
  },
  sendButtonText: {
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

export default PhoneVerificationComponent;