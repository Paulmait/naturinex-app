import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerificationModal from './TwoFactorVerificationModal';

/**
 * SecureOperationWrapper - Wraps sensitive operations with 2FA protection
 *
 * @param {string} operation - The operation being performed (payment, medical_data_access, etc.)
 * @param {ReactNode} children - The component to render after 2FA verification
 * @param {Function} onVerificationRequired - Called when 2FA verification is required
 * @param {Function} onVerificationSuccess - Called when 2FA verification succeeds
 * @param {Function} onVerificationFailed - Called when 2FA verification fails
 * @param {boolean} bypassCheck - Skip 2FA check (for testing or administrative override)
 */
const SecureOperationWrapper = ({
  operation,
  children,
  onVerificationRequired,
  onVerificationSuccess,
  onVerificationFailed,
  bypassCheck = false
}) => {
  const {
    currentUser,
    require2FAForOperation,
    validateSecureSession,
    createSecureSession
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSecurity();
  }, [operation, currentUser]);

  const checkSecurity = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      if (bypassCheck) {
        setIsVerified(true);
        setLoading(false);
        return;
      }

      // Check if operation requires 2FA
      const needsVerification = await require2FAForOperation(operation);

      if (!needsVerification) {
        setIsVerified(true);
        setLoading(false);
        return;
      }

      setRequires2FA(true);

      // Check if user has valid 2FA session
      const hasValidSession = await validateSecureSession();

      if (hasValidSession) {
        setIsVerified(true);
      } else {
        setShow2FAModal(true);
        onVerificationRequired && onVerificationRequired(operation);
      }

    } catch (error) {
      console.error('Security check error:', error);
      setError('Security verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async () => {
    try {
      setShow2FAModal(false);

      // Create secure session with 2FA verification
      await createSecureSession(true);

      setIsVerified(true);
      onVerificationSuccess && onVerificationSuccess(operation);

    } catch (error) {
      console.error('2FA success handling error:', error);
      setError('Verification processing failed');
      onVerificationFailed && onVerificationFailed(operation, error);
    }
  };

  const handle2FACancel = () => {
    setShow2FAModal(false);
    onVerificationFailed && onVerificationFailed(operation, new Error('User cancelled verification'));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusText}>Verifying security requirements...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.errorTitle}>Security Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!currentUser) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.errorTitle}>Authentication Required</Text>
          <Text style={styles.errorText}>Please sign in to continue.</Text>
        </View>
      );
    }

    if (requires2FA && !isVerified) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.verificationTitle}>Security Verification Required</Text>
          <Text style={styles.verificationText}>
            This operation requires two-factor authentication for security.
          </Text>
        </View>
      );
    }

    if (isVerified) {
      return children;
    }

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Preparing secure operation...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}

      <TwoFactorVerificationModal
        visible={show2FAModal}
        onClose={handle2FACancel}
        onSuccess={handle2FASuccess}
        userId={currentUser?.uid || currentUser?.id}
        operation={operation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 8
  },
  verificationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 8
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22
  }
});

export default SecureOperationWrapper;