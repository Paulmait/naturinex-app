import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Linking,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appConfig from '../config/appConfig';

// Get the config by calling the function
const config = appConfig();
import { safeOpenURL } from '../utils/safeOpenURL';

const DISCLAIMER_ACCEPTED_KEY = 'disclaimer_accepted_v2';
const AGE_VERIFIED_KEY = 'age_verified_v2';
const LAUNCH_GATE_VERSION = '2.0'; // Increment to force re-acceptance

export default function AppLaunchGate({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [hasAcceptedAll, setHasAcceptedAll] = useState(false);

  useEffect(() => {
    checkLaunchGateStatus();
  }, []);

  const checkLaunchGateStatus = async () => {
    try {
      const [disclaimerAccepted, ageVerified] = await Promise.all([
        AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY),
        AsyncStorage.getItem(AGE_VERIFIED_KEY)
      ]);

      const disclaimerValid = disclaimerAccepted === LAUNCH_GATE_VERSION;
      const ageValid = ageVerified === LAUNCH_GATE_VERSION;

      if (!ageValid && config.FEATURES.requireAgeVerification) {
        setShowAgeVerification(true);
      } else if (!disclaimerValid && config.FEATURES.showMedicalDisclaimer) {
        setShowDisclaimer(true);
      } else {
        setHasAcceptedAll(true);
      }
    } catch (error) {
      console.error('Error checking launch gate status:', error);
      // Show disclaimer on error to be safe
      setShowDisclaimer(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeConfirmation = async (isOver17) => {
    if (!isOver17) {
      Alert.alert(
        'Age Requirement',
        'You must be 17 or older to use this app. This app contains medical information that requires mature judgment.',
        [{ text: 'OK', onPress: () => setShowAgeVerification(false) }]
      );
      return;
    }

    try {
      await AsyncStorage.setItem(AGE_VERIFIED_KEY, LAUNCH_GATE_VERSION);
      setShowAgeVerification(false);
      
      // Check if we need to show disclaimer next
      const disclaimerAccepted = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
      if (disclaimerAccepted !== LAUNCH_GATE_VERSION && config.FEATURES.showMedicalDisclaimer) {
        setShowDisclaimer(true);
      } else {
        setHasAcceptedAll(true);
      }
    } catch (error) {
      console.error('Error saving age verification:', error);
    }
  };

  const handleDisclaimerAcceptance = async () => {
    try {
      await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, LAUNCH_GATE_VERSION);
      setShowDisclaimer(false);
      setHasAcceptedAll(true);
    } catch (error) {
      console.error('Error saving disclaimer acceptance:', error);
      Alert.alert('Error', 'Failed to save your acceptance. Please try again.');
    }
  };

  const openLink = (url) => {
    safeOpenURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Age Verification Modal
  if (showAgeVerification) {
    return (
      <Modal visible={true} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <MaterialIcons name="verified-user" size={80} color="#10B981" />
            
            <Text style={styles.title}>Age Verification Required</Text>
            
            <Text style={styles.ageText}>
              This app provides medical and wellness information that requires mature judgment and understanding.
            </Text>

            <Text style={styles.ageText}>
              You must be at least 17 years old to use Naturinex Wellness Guide.
            </Text>

            <View style={styles.ageButtonContainer}>
              <TouchableOpacity 
                style={[styles.ageButton, styles.confirmButton]}
                onPress={() => handleAgeConfirmation(true)}
              >
                <Text style={styles.confirmButtonText}>I am 17 or older</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.ageButton, styles.declineButton]}
                onPress={() => handleAgeConfirmation(false)}
              >
                <Text style={styles.declineButtonText}>I am under 17</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text 
                style={styles.link} 
                onPress={() => openLink(config.APP_CONFIG.termsOfServiceUrl)}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text 
                style={styles.link} 
                onPress={() => openLink(config.APP_CONFIG.privacyPolicyUrl)}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Medical Disclaimer Modal
  if (showDisclaimer) {
    return (
      <Modal visible={true} animationType="slide">
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              <MaterialIcons name="warning" size={60} color="#EF4444" />
              
              <Text style={styles.title}>Important Medical Disclaimer</Text>
              
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerTitle}>⚠️ NOT MEDICAL ADVICE</Text>
                
                <Text style={styles.disclaimerText}>
                  Naturinex Wellness Guide provides educational information about natural wellness alternatives. 
                  This app is NOT a substitute for professional medical advice, diagnosis, or treatment.
                </Text>

                <Text style={styles.disclaimerText}>
                  <Text style={styles.bold}>ALWAYS</Text> consult your physician or qualified healthcare provider:
                  {'\n'}• Before starting any new supplement or natural remedy
                  {'\n'}• Before making changes to prescribed medications
                  {'\n'}• If you have any medical conditions or concerns
                  {'\n'}• If you are pregnant, nursing, or have allergies
                </Text>

                <Text style={styles.disclaimerText}>
                  <Text style={styles.bold}>NEVER</Text> stop taking prescribed medications without consulting your doctor.
                </Text>

                <Text style={styles.disclaimerText}>
                  Information provided is for educational purposes only and is based on publicly available research. 
                  Individual results may vary, and natural alternatives may not be suitable for everyone.
                </Text>

                <Text style={styles.disclaimerText}>
                  In case of medical emergency, call 911 or your local emergency services immediately.
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={handleDisclaimerAcceptance}
              >
                <Text style={styles.acceptButtonText}>
                  I Understand and Accept
                </Text>
              </TouchableOpacity>

              <Text style={styles.legalText}>
                By using this app, you acknowledge that you have read and agree to our{' '}
                <Text 
                  style={styles.link} 
                  onPress={() => openLink(config.APP_CONFIG.termsOfServiceUrl)}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text 
                  style={styles.link} 
                  onPress={() => openLink(config.APP_CONFIG.privacyPolicyUrl)}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  // All checks passed, show the app
  return hasAcceptedAll ? children : null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  disclaimerBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 15,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 15,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: '#DC2626',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginVertical: 20,
    width: '100%',
    maxWidth: 300,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  ageText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  ageButtonContainer: {
    marginTop: 30,
    width: '100%',
    maxWidth: 300,
  },
  ageButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 15,
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  declineButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  declineButtonText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  legalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  link: {
    color: '#10B981',
    textDecorationLine: 'underline',
  },
});