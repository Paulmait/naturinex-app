import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Stub component for 2FA setup wizard - not implemented in MVP
const TwoFactorSetupWizard = ({ visible, onComplete, onCancel }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="security" size={64} color="#10B981" />
      <Text style={styles.title}>Two-Factor Authentication Setup</Text>
      <Text style={styles.message}>
        2FA setup is not available yet. This security feature will be added in a future update.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onCancel}>
        <Text style={styles.buttonText}>Skip for Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1F2937',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#10B981',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TwoFactorSetupWizard;
