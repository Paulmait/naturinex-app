import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SecureOperationWrapper from './SecureOperationWrapper';

/**
 * Example of how to use SecureOperationWrapper for payment operations
 */
const SecurePaymentScreen = ({ route, navigation }) => {
  const { amount, description } = route.params || {};

  const handlePaymentSuccess = () => {
    Alert.alert(
      'Payment Successful',
      'Your payment has been processed securely.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleVerificationRequired = (operation) => {
    console.log(`2FA verification required for operation: ${operation}`);
  };

  const handleVerificationSuccess = (operation) => {
    console.log(`2FA verification successful for operation: ${operation}`);
  };

  const handleVerificationFailed = (operation, error) => {
    console.log(`2FA verification failed for operation: ${operation}`, error);
    Alert.alert(
      'Verification Required',
      'This payment requires two-factor authentication for security. Please complete the verification to proceed.'
    );
  };

  const renderPaymentForm = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="payment" size={48} color="#007AFF" />
        <Text style={styles.title}>Secure Payment</Text>
        <Text style={styles.subtitle}>Protected by Two-Factor Authentication</Text>
      </View>

      <View style={styles.paymentDetails}>
        <Text style={styles.detailLabel}>Amount:</Text>
        <Text style={styles.detailValue}>${amount || '0.00'}</Text>

        <Text style={styles.detailLabel}>Description:</Text>
        <Text style={styles.detailValue}>{description || 'Premium subscription'}</Text>
      </View>

      <View style={styles.securityNote}>
        <MaterialIcons name="security" size={20} color="#4CAF50" />
        <Text style={styles.securityText}>
          This payment is protected by two-factor authentication
        </Text>
      </View>

      <TouchableOpacity style={styles.payButton} onPress={handlePaymentSuccess}>
        <Text style={styles.payButtonText}>Process Payment</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SecureOperationWrapper
      operation="payment"
      onVerificationRequired={handleVerificationRequired}
      onVerificationSuccess={handleVerificationSuccess}
      onVerificationFailed={handleVerificationFailed}
    >
      {renderPaymentForm()}
    </SecureOperationWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
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
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  paymentDetails: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30
  },
  securityText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center'
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default SecurePaymentScreen;