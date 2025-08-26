import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const MedicalDisclaimer = ({ onAccept, onDecline }) => {
  const handleAccept = () => {
    Alert.alert(
      'Medical Disclaimer',
      'You acknowledge that Naturinex provides educational information only and is not a substitute for professional medical advice. You understand that you should always consult healthcare professionals before making medical decisions.',
      [
        {
          text: 'I Understand & Accept',
          onPress: onAccept,
          style: 'default'
        },
        {
          text: 'Cancel',
          onPress: onDecline,
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚠️</Text>
        <Text style={styles.headerTitle}>Medical Disclaimer</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.criticalBox}>
          <Text style={styles.criticalTitle}>CRITICAL MEDICAL DISCLAIMER</Text>
          <Text style={styles.criticalText}>
            Naturinex is for educational and informational purposes only and is NOT intended to provide medical advice, diagnosis, or treatment recommendations.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Important Limitations:</Text>
        
        <View style={styles.limitationItem}>
          <Text style={styles.limitationIcon}>🚫</Text>
          <Text style={styles.limitationText}>
            <Text style={styles.bold}>Not Medical Advice:</Text> Information provided is not a substitute for professional medical consultation
          </Text>
        </View>

        <View style={styles.limitationItem}>
          <Text style={styles.limitationIcon}>👨‍⚕️</Text>
          <Text style={styles.limitationText}>
            <Text style={styles.bold}>No Doctor-Patient Relationship:</Text> Use of this Service does not create a doctor-patient relationship
          </Text>
        </View>

        <View style={styles.limitationItem}>
          <Text style={styles.limitationIcon}>🏥</Text>
          <Text style={styles.limitationText}>
            <Text style={styles.bold}>Consult Healthcare Providers:</Text> Always seek advice from qualified healthcare professionals
          </Text>
        </View>

        <View style={styles.limitationItem}>
          <Text style={styles.limitationIcon}>🚨</Text>
          <Text style={styles.limitationText}>
            <Text style={styles.bold}>Emergency Situations:</Text> Do not use this app for medical emergencies - call emergency services
          </Text>
        </View>

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
            If you are experiencing a medical emergency, call 911 or your local emergency services immediately. Do not rely on this app for emergency medical situations.
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
            TO THE MAXIMUM EXTENT PERMITTED BY LAW:
          </Text>
          <Text style={styles.liabilitySubText}>
            • We are not liable for any health outcomes from using Naturinex{'\n'}
            • We are not liable for indirect, incidental, or consequential damages{'\n'}
            • Our total liability is limited to the amount you paid us in the past 12 months{'\n'}
            • You use Naturinex at your own risk
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptButtonText}>I Understand & Accept</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
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
});

export default MedicalDisclaimer; 