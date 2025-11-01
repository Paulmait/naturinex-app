import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Stub component for backup codes - not implemented in MVP
const BackupCodesComponent = ({ visible, codes, onClose }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="vpn-key" size={64} color="#10B981" />
      <Text style={styles.title}>Backup Codes</Text>
      <Text style={styles.message}>
        Backup codes feature is not available yet. This will be added when 2FA is implemented.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>OK</Text>
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

export default BackupCodesComponent;
