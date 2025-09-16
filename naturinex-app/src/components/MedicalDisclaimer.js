import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { disclaimerService } from '../services/disclaimerService.js';

const MedicalDisclaimer = ({
  visible = true,
  onAccept,
  onDecline,
  type = 'general',
  userId = null,
  enforceAcceptance = true
}) => {
  const [disclaimerContent, setDisclaimerContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: ''
  });
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ipAddress, setIpAddress] = useState(null);
  const [userAgent, setUserAgent] = useState(null);

  useEffect(() => {
    if (visible) {
      initializeDisclaimer();
      captureMetadata();
    }
  }, [visible, type]);

  const initializeDisclaimer = async () => {
    try {
      const content = disclaimerService.getDisclaimerContent(type);
      setDisclaimerContent(content);

      // Check if user already has valid disclaimer
      if (userId && enforceAcceptance) {
        const hasValid = await disclaimerService.hasValidDisclaimer(userId, type);
        if (hasValid) {
          onAccept && onAccept();
          return;
        }
      }
    } catch (error) {
      console.error('Error initializing disclaimer:', error);
    }
  };

  const captureMetadata = async () => {
    try {
      // Capture IP address (in production, this should be done server-side)
      if (typeof window !== 'undefined') {
        setUserAgent(navigator.userAgent);

        // Get IP address from a service (optional)
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          setIpAddress(ipData.ip);
        } catch (error) {
          console.warn('Could not capture IP address:', error);
        }
      }
    } catch (error) {
      console.error('Error capturing metadata:', error);
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const handleAgeVerification = () => {
    if (!dateOfBirth) {
      Alert.alert('Required', 'Please enter your date of birth to continue.');
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 0 || age > 120) {
      Alert.alert('Invalid Date', 'Please enter a valid date of birth.');
      return;
    }

    setIsMinor(age < 18);
    setAgeVerified(true);

    if (age < 18) {
      setShowEmergencyContact(true);
    } else {
      setShowAgeVerification(false);
    }
  };

  const handleEmergencyContactSubmit = () => {
    if (!emergencyContact.name || !emergencyContact.phone) {
      Alert.alert('Required', 'Emergency contact name and phone number are required for minors.');
      return;
    }

    setShowEmergencyContact(false);
    setShowAgeVerification(false);
  };

  const handleAccept = async () => {
    if (!ageVerified) {
      setShowAgeVerification(true);
      return;
    }

    if (isMinor && (!emergencyContact.name || !emergencyContact.phone)) {
      setShowEmergencyContact(true);
      return;
    }

    setIsLoading(true);

    try {
      // Record disclaimer acceptance
      if (userId) {
        const acceptanceData = {
          userId,
          featureType: type,
          disclaimerVersion: disclaimerContent?.version || '1.0',
          ipAddress,
          userAgent,
          isMinor,
          emergencyContact: isMinor ? emergencyContact : null
        };

        await disclaimerService.recordAcceptance(acceptanceData);
      }

      // Show final confirmation
      Alert.alert(
        'Medical Disclaimer Accepted',
        `You have accepted the medical disclaimer for ${disclaimerContent?.description || 'general features'}. This acceptance is valid for 30 days.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              onAccept && onAccept();
            },
            style: 'default'
          }
        ]
      );

    } catch (error) {
      console.error('Error recording disclaimer acceptance:', error);
      Alert.alert(
        'Error',
        'Failed to record disclaimer acceptance. Please try again or contact support.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderAgeVerification = () => (
    <Modal visible={showAgeVerification} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Age Verification Required</Text>
          <Text style={styles.modalText}>
            Please verify your age to proceed with the medical disclaimer.
          </Text>

          <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD):</Text>
          <TextInput
            style={styles.textInput}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="1990-01-01"
            keyboardType="numeric"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowAgeVerification(false);
                onDecline && onDecline();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleAgeVerification}
            >
              <Text style={styles.confirmButtonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmergencyContact = () => (
    <Modal visible={showEmergencyContact} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalScrollContainer}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Emergency Contact Required</Text>
            <Text style={styles.modalText}>
              As a minor, please provide emergency contact information before proceeding.
            </Text>

            <Text style={styles.inputLabel}>Contact Name *:</Text>
            <TextInput
              style={styles.textInput}
              value={emergencyContact.name}
              onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, name: text }))}
              placeholder="Parent/Guardian Name"
            />

            <Text style={styles.inputLabel}>Relationship:</Text>
            <TextInput
              style={styles.textInput}
              value={emergencyContact.relationship}
              onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, relationship: text }))}
              placeholder="Parent, Guardian, etc."
            />

            <Text style={styles.inputLabel}>Phone Number *:</Text>
            <TextInput
              style={styles.textInput}
              value={emergencyContact.phone}
              onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, phone: text }))}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Email Address:</Text>
            <TextInput
              style={styles.textInput}
              value={emergencyContact.email}
              onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, email: text }))}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEmergencyContact(false);
                  onDecline && onDecline();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleEmergencyContactSubmit}
              >
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (!disclaimerContent) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading disclaimer...</Text>
      </View>
    );
  }

  return (
    <>
      {renderAgeVerification()}
      {renderEmergencyContact()}

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>⚠️</Text>
          <Text style={styles.headerTitle}>{disclaimerContent.title}</Text>
        </View>
      
      <View style={styles.content}>
        <View style={styles.criticalBox}>
          <Text style={styles.criticalTitle}>CRITICAL MEDICAL DISCLAIMER</Text>
          <Text style={styles.criticalText}>
            {disclaimerContent.description}
          </Text>
        </View>

        <View style={styles.versionBox}>
          <Text style={styles.versionText}>
            Version: {disclaimerContent.version} | Type: {type}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Critical Warnings:</Text>

        {disclaimerContent.critical_warnings.map((warning, index) => (
          <View key={index} style={styles.limitationItem}>
            <Text style={styles.limitationIcon}>⚠️</Text>
            <Text style={styles.limitationText}>{warning}</Text>
          </View>
        ))}

        {disclaimerContent.additional_warnings && (
          <>
            <Text style={styles.sectionTitle}>Additional Warnings for {type}:</Text>
            {disclaimerContent.additional_warnings.map((warning, index) => (
              <View key={index} style={styles.limitationItem}>
                <Text style={styles.limitationIcon}>🔍</Text>
                <Text style={styles.limitationText}>{warning}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.aiBox}>
          <Text style={styles.aiTitle}>🤖 AI Technology Notice</Text>
          <Text style={styles.aiText}>
            Naturinex uses artificial intelligence to analyze medication information. Important limitations:
          </Text>
          <Text style={styles.aiSubText}>
            • AI suggestions are for educational purposes only{'\n'}
            • AI may make errors or provide incomplete information{'\n'}
            • AI suggestions are not medical advice{'\n'}
            • Always verify information with healthcare professionals{'\n'}
            • AI technology is constantly evolving and improving
          </Text>
        </View>

        <View style={styles.emergencyBox}>
          <Text style={styles.emergencyTitle}>🚨 EMERGENCY WARNING</Text>
          <Text style={styles.emergencyText}>
            {disclaimerContent.emergency_notice}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Your Acknowledgment:</Text>
        <Text style={styles.acknowledgmentText}>
          By using Naturinex, you acknowledge and agree that:
        </Text>
        
        <View style={styles.acknowledgmentItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.acknowledgmentItemText}>
            You understand the limitations of AI-generated health information
          </Text>
        </View>

        <View style={styles.acknowledgmentItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.acknowledgmentItemText}>
            You will not rely solely on our suggestions for medical decisions
          </Text>
        </View>

        <View style={styles.acknowledgmentItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.acknowledgmentItemText}>
            You will consult healthcare providers before making medication changes
          </Text>
        </View>

        <View style={styles.acknowledgmentItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.acknowledgmentItemText}>
            You use the Service at your own risk
          </Text>
        </View>

        <View style={styles.liabilityBox}>
          <Text style={styles.liabilityTitle}>🛡️ LIMITATION OF LIABILITY</Text>
          <Text style={styles.liabilityText}>
            {disclaimerContent.liability_limitation}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.acceptButton, isLoading && styles.disabledButton]}
          onPress={handleAccept}
          disabled={isLoading}
        >
          <Text style={styles.acceptButtonText}>
            {isLoading ? 'Processing...' : 'I Understand & Accept'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.declineButton, isLoading && styles.disabledButton]}
          onPress={onDecline}
          disabled={isLoading}
        >
          <Text style={styles.declineButtonText}>I Do Not Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#dc3545',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  criticalBox: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
  },
  criticalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
  },
  criticalText: {
    fontSize: 14,
    color: '#721c24',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  limitationIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  limitationText: {
    flex: 1,
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  aiBox: {
    backgroundColor: '#d1ecf1',
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
    padding: 15,
    marginVertical: 15,
    borderRadius: 5,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c5460',
    marginBottom: 8,
  },
  aiText: {
    fontSize: 14,
    color: '#0c5460',
    lineHeight: 20,
    marginBottom: 8,
  },
  aiSubText: {
    fontSize: 13,
    color: '#0c5460',
    lineHeight: 18,
  },
  emergencyBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 15,
    marginVertical: 15,
    borderRadius: 5,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  acknowledgmentText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 10,
  },
  acknowledgmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#10B981',
    marginRight: 10,
    fontWeight: 'bold',
  },
  acknowledgmentItemText: {
    flex: 1,
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
  liabilityBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 15,
    marginVertical: 15,
    borderRadius: 5,
  },
  liabilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  liabilityText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: 8,
  },
  liabilitySubText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#6c757d',
  },
  versionText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalScrollContainer: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    padding: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default MedicalDisclaimer; 