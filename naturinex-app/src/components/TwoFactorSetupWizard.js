import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorAuthService from '../services/TwoFactorAuthService';
import PhoneVerificationComponent from './PhoneVerificationComponent';
import AuthenticatorSetupComponent from './AuthenticatorSetupComponent';
import BiometricSetupComponent from './BiometricSetupComponent';
import BackupCodesComponent from './BackupCodesComponent';

const { width, height } = Dimensions.get('window');

const SETUP_STEPS = {
  CHOOSE_METHOD: 'choose_method',
  PHONE_SETUP: 'phone_setup',
  AUTHENTICATOR_SETUP: 'authenticator_setup',
  BIOMETRIC_SETUP: 'biometric_setup',
  BACKUP_CODES: 'backup_codes',
  COMPLETION: 'completion'
};

const TwoFactorSetupWizard = ({ visible, onClose, onComplete }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(SETUP_STEPS.CHOOSE_METHOD);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [completedMethods, setCompletedMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [userSettings, setUserSettings] = useState({});

  useEffect(() => {
    if (visible && currentUser) {
      initializeSetup();
    }
  }, [visible, currentUser]);

  const initializeSetup = async () => {
    try {
      setLoading(true);

      // Initialize 2FA service
      const initResult = await TwoFactorAuthService.initialize();
      setBiometricAvailable(initResult.biometricAvailable);

      // Load existing user settings
      const settings = await TwoFactorAuthService.getUserSettings(currentUser.uid || currentUser.id);
      setUserSettings(settings);

      // Pre-select enabled methods
      const enabledMethods = [];
      if (settings.phone_2fa_enabled) enabledMethods.push('phone');
      if (settings.totp_enabled) enabledMethods.push('authenticator');
      if (settings.biometric_enabled) enabledMethods.push('biometric');

      setCompletedMethods(enabledMethods);
    } catch (error) {
      console.error('2FA setup initialization error:', error);
      Alert.alert('Error', 'Failed to initialize 2FA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelection = (method) => {
    setSelectedMethods(prev => {
      if (prev.includes(method)) {
        return prev.filter(m => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const handleNext = async () => {
    if (currentStep === SETUP_STEPS.CHOOSE_METHOD) {
      if (selectedMethods.length === 0) {
        Alert.alert('Selection Required', 'Please select at least one 2FA method.');
        return;
      }

      // Start with the first selected method
      const firstMethod = selectedMethods[0];
      navigateToMethodSetup(firstMethod);
    } else {
      // Navigate to next method or completion
      const nextMethod = getNextMethod();
      if (nextMethod) {
        navigateToMethodSetup(nextMethod);
      } else {
        setCurrentStep(SETUP_STEPS.BACKUP_CODES);
      }
    }
  };

  const navigateToMethodSetup = (method) => {
    switch (method) {
      case 'phone':
        setCurrentStep(SETUP_STEPS.PHONE_SETUP);
        break;
      case 'authenticator':
        setCurrentStep(SETUP_STEPS.AUTHENTICATOR_SETUP);
        break;
      case 'biometric':
        setCurrentStep(SETUP_STEPS.BIOMETRIC_SETUP);
        break;
      default:
        setCurrentStep(SETUP_STEPS.BACKUP_CODES);
    }
  };

  const getNextMethod = () => {
    const pendingMethods = selectedMethods.filter(method => !completedMethods.includes(method));
    return pendingMethods.length > 0 ? pendingMethods[0] : null;
  };

  const handleMethodComplete = (method) => {
    setCompletedMethods(prev => [...prev, method]);

    const nextMethod = getNextMethod();
    if (nextMethod) {
      navigateToMethodSetup(nextMethod);
    } else {
      setCurrentStep(SETUP_STEPS.BACKUP_CODES);
    }
  };

  const handleBackupCodesComplete = () => {
    setCurrentStep(SETUP_STEPS.COMPLETION);
  };

  const handleComplete = () => {
    onComplete && onComplete(completedMethods);
    onClose();
  };

  const handleBack = () => {
    switch (currentStep) {
      case SETUP_STEPS.PHONE_SETUP:
      case SETUP_STEPS.AUTHENTICATOR_SETUP:
      case SETUP_STEPS.BIOMETRIC_SETUP:
        setCurrentStep(SETUP_STEPS.CHOOSE_METHOD);
        break;
      case SETUP_STEPS.BACKUP_CODES:
        const lastMethod = selectedMethods[selectedMethods.length - 1];
        navigateToMethodSetup(lastMethod);
        break;
      case SETUP_STEPS.COMPLETION:
        setCurrentStep(SETUP_STEPS.BACKUP_CODES);
        break;
      default:
        onClose();
    }
  };

  const renderMethodSelection = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Up Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          Choose one or more methods to secure your account
        </Text>
      </View>

      <View style={styles.methodsList}>
        {/* Phone SMS Method */}
        <TouchableOpacity
          style={[
            styles.methodItem,
            selectedMethods.includes('phone') && styles.methodItemSelected,
            completedMethods.includes('phone') && styles.methodItemCompleted
          ]}
          onPress={() => handleMethodSelection('phone')}
        >
          <MaterialIcons
            name="smartphone"
            size={24}
            color={selectedMethods.includes('phone') ? '#fff' : '#007AFF'}
          />
          <View style={styles.methodContent}>
            <Text style={[
              styles.methodTitle,
              selectedMethods.includes('phone') && styles.methodTitleSelected
            ]}>
              Phone SMS
            </Text>
            <Text style={[
              styles.methodDescription,
              selectedMethods.includes('phone') && styles.methodDescriptionSelected
            ]}>
              Receive verification codes via text message
            </Text>
          </View>
          {completedMethods.includes('phone') && (
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          )}
        </TouchableOpacity>

        {/* Authenticator App Method */}
        <TouchableOpacity
          style={[
            styles.methodItem,
            selectedMethods.includes('authenticator') && styles.methodItemSelected,
            completedMethods.includes('authenticator') && styles.methodItemCompleted
          ]}
          onPress={() => handleMethodSelection('authenticator')}
        >
          <MaterialCommunityIcons
            name="shield-key"
            size={24}
            color={selectedMethods.includes('authenticator') ? '#fff' : '#007AFF'}
          />
          <View style={styles.methodContent}>
            <Text style={[
              styles.methodTitle,
              selectedMethods.includes('authenticator') && styles.methodTitleSelected
            ]}>
              Authenticator App
            </Text>
            <Text style={[
              styles.methodDescription,
              selectedMethods.includes('authenticator') && styles.methodDescriptionSelected
            ]}>
              Use Google Authenticator, Authy, or similar apps
            </Text>
          </View>
          {completedMethods.includes('authenticator') && (
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          )}
        </TouchableOpacity>

        {/* Biometric Method */}
        {biometricAvailable && (
          <TouchableOpacity
            style={[
              styles.methodItem,
              selectedMethods.includes('biometric') && styles.methodItemSelected,
              completedMethods.includes('biometric') && styles.methodItemCompleted
            ]}
            onPress={() => handleMethodSelection('biometric')}
          >
            <MaterialIcons
              name="fingerprint"
              size={24}
              color={selectedMethods.includes('biometric') ? '#fff' : '#007AFF'}
            />
            <View style={styles.methodContent}>
              <Text style={[
                styles.methodTitle,
                selectedMethods.includes('biometric') && styles.methodTitleSelected
              ]}>
                Biometric
              </Text>
              <Text style={[
                styles.methodDescription,
                selectedMethods.includes('biometric') && styles.methodDescriptionSelected
              ]}>
                Use Face ID, Touch ID, or fingerprint
              </Text>
            </View>
            {completedMethods.includes('biometric') && (
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing 2FA Setup...</Text>
        </View>
      );
    }

    switch (currentStep) {
      case SETUP_STEPS.CHOOSE_METHOD:
        return renderMethodSelection();

      case SETUP_STEPS.PHONE_SETUP:
        return (
          <PhoneVerificationComponent
            userId={currentUser.uid || currentUser.id}
            onComplete={() => handleMethodComplete('phone')}
            onBack={handleBack}
          />
        );

      case SETUP_STEPS.AUTHENTICATOR_SETUP:
        return (
          <AuthenticatorSetupComponent
            userId={currentUser.uid || currentUser.id}
            onComplete={() => handleMethodComplete('authenticator')}
            onBack={handleBack}
          />
        );

      case SETUP_STEPS.BIOMETRIC_SETUP:
        return (
          <BiometricSetupComponent
            userId={currentUser.uid || currentUser.id}
            onComplete={() => handleMethodComplete('biometric')}
            onBack={handleBack}
          />
        );

      case SETUP_STEPS.BACKUP_CODES:
        return (
          <BackupCodesComponent
            userId={currentUser.uid || currentUser.id}
            onComplete={handleBackupCodesComplete}
            onBack={handleBack}
          />
        );

      case SETUP_STEPS.COMPLETION:
        return (
          <View style={styles.completionContainer}>
            <MaterialIcons name="security" size={80} color="#4CAF50" />
            <Text style={styles.completionTitle}>2FA Setup Complete!</Text>
            <Text style={styles.completionMessage}>
              Your account is now protected with two-factor authentication.
            </Text>

            <View style={styles.completedMethodsList}>
              <Text style={styles.completedMethodsTitle}>Active Methods:</Text>
              {completedMethods.map((method, index) => (
                <View key={index} style={styles.completedMethodItem}>
                  <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.completedMethodText}>
                    {method === 'phone' && 'Phone SMS'}
                    {method === 'authenticator' && 'Authenticator App'}
                    {method === 'biometric' && 'Biometric'}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Text style={styles.completeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return renderMethodSelection();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {renderCurrentStep()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#fff'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7'
  },
  backButton: {
    padding: 8
  },
  closeButton: {
    padding: 8
  },
  container: {
    flex: 1,
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  header: {
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22
  },
  methodsList: {
    flex: 1
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  methodItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  methodItemCompleted: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50'
  },
  methodContent: {
    flex: 1,
    marginLeft: 16
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4
  },
  methodTitleSelected: {
    color: '#fff'
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18
  },
  methodDescriptionSelected: {
    color: '#E3F2FD'
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 40
  },
  nextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center'
  },
  completionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40
  },
  completedMethodsList: {
    width: '100%',
    marginBottom: 40
  },
  completedMethodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
    textAlign: 'center'
  },
  completedMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  completedMethodText: {
    fontSize: 16,
    color: '#4CAF50',
    marginLeft: 8
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%'
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default TwoFactorSetupWizard;