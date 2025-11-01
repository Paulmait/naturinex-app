import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Stub component for 2FA verification - not implemented in MVP
const TwoFactorVerificationModal = ({ visible, onVerify, onCancel }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.message}>
            2FA is not enabled yet. This feature will be available in a future update.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onCancel}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TwoFactorVerificationModal;
