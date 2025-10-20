// Native Medical Disclaimer Modal for React Native
// Shows on first app launch - HIPAA compliant

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import auditLogger, { ACCESS_TYPES, RESOURCE_TYPES } from '../services/auditLogger';

export default function NativeMedicalDisclaimerModal({ visible, onAccept }) {
  const [checkboxes, setCheckboxes] = useState({
    educational: false,
    notMedicalAdvice: false,
    consultDoctor: false,
    emergency: false,
  });

  const allChecked = Object.values(checkboxes).every((v) => v === true);

  const toggleCheckbox = (key) => {
    setCheckboxes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAccept = async () => {
    if (!allChecked) {
      alert('Please read and check all boxes before proceeding');
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Save acceptance to database
        await supabase.from('disclaimer_acceptances').insert({
          user_id: user.id,
          disclaimer_type: 'medical',
          disclaimer_version: '1.0',
          accepted_at: new Date().toISOString(),
        });

        // Log acceptance
        await auditLogger.logAccess({
          userId: user.id,
          action: ACCESS_TYPES.CREATE,
          resourceType: RESOURCE_TYPES.USER_PROFILE,
          metadata: {
            event: 'disclaimer_accepted',
            disclaimer_type: 'medical',
            disclaimer_version: '1.0',
          },
        });
      }

      onAccept();
    } catch (error) {
      console.error('Error saving disclaimer acceptance:', error);
      // Still allow them to proceed
      onAccept();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="warning" size={48} color="#EF4444" />
            <Text style={styles.title}>Important Medical Disclaimer</Text>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>⚠️ PLEASE READ CAREFULLY</Text>

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                <Text style={styles.bold}>THIS APP IS FOR EDUCATIONAL PURPOSES ONLY.</Text>
                {'\n\n'}
                It is NOT medical advice, diagnosis, or treatment.
                {'\n\n'}
                The information provided by this app should NOT be used to replace
                professional medical advice from qualified healthcare providers.
              </Text>
            </View>

            {/* Emergency Warning */}
            <View style={styles.emergencyBox}>
              <Text style={styles.emergencyTitle}>🚨 MEDICAL EMERGENCIES</Text>
              <Text style={styles.emergencyText}>
                IF YOU ARE EXPERIENCING A MEDICAL EMERGENCY:{'\n\n'}
                <Text style={styles.bold}>CALL 911 IMMEDIATELY</Text>
                {'\n\n'}
                DO NOT use this app for emergencies.
              </Text>
            </View>

            {/* Critical Medications Warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ CRITICAL MEDICATIONS</Text>
              <Text style={styles.warningText}>
                DO NOT stop or change medications for serious conditions without medical supervision.
                {'\n\n'}
                This includes heart disease, diabetes, mental health conditions, cancer, and other serious illnesses.
                {'\n\n'}
                Stopping these medications without supervision can be life-threatening.
              </Text>
            </View>

            {/* Checkboxes */}
            <Text style={styles.checkboxLabel}>I understand and agree that:</Text>

            <CheckboxItem
              checked={checkboxes.educational}
              onPress={() => toggleCheckbox('educational')}
              label="This app provides educational information only, not medical advice"
            />

            <CheckboxItem
              checked={checkboxes.notMedicalAdvice}
              onPress={() => toggleCheckbox('notMedicalAdvice')}
              label="Information from AI may be inaccurate and should not be solely relied upon"
            />

            <CheckboxItem
              checked={checkboxes.consultDoctor}
              onPress={() => toggleCheckbox('consultDoctor')}
              label="I will consult my healthcare provider before making any medication changes"
            />

            <CheckboxItem
              checked={checkboxes.emergency}
              onPress={() => toggleCheckbox('emergency')}
              label="I understand to call 911 for medical emergencies, not use this app"
            />

            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.acceptButton, !allChecked && styles.acceptButtonDisabled]}
              onPress={handleAccept}
              disabled={!allChecked}
            >
              <Text style={styles.acceptButtonText}>
                {allChecked ? 'I Accept - Continue to App' : 'Please Check All Boxes Above'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              By continuing, you acknowledge that you have read and understood this disclaimer.
              {'\n\n'}
              You must be 17 years or older to use this app.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function CheckboxItem({ checked, onPress, label }) {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <MaterialIcons name="check" size={20} color="white" />}
      </View>
      <Text style={styles.checkboxText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  disclaimerBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
  },
  emergencyBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#FEFCE8',
    borderLeftWidth: 4,
    borderLeftColor: '#CA8A04',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#854D0E',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#854D0E',
    lineHeight: 20,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
