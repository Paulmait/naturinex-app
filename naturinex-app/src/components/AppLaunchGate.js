import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { isAppConfigured, getValidationResult, IS_PRODUCTION } from '../config/env';

/**
 * AppLaunchGate - Validates app configuration at startup
 * Shows a user-friendly error screen if critical configuration is missing
 * Prevents the app from running in a broken state
 */
const AppLaunchGate = ({ children }) => {
  // Check if app is properly configured
  const configured = isAppConfigured();

  // In production, show error screen if misconfigured
  if (!configured && IS_PRODUCTION) {
    const validation = getValidationResult();

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Configuration Error</Text>
          <Text style={styles.message}>
            We're sorry, but the app cannot start due to a configuration issue.
            Please try again later or contact support.
          </Text>
          <Text style={styles.supportEmail}>support@naturinex.com</Text>

          {/* Only show technical details in debug builds */}
          {__DEV__ && validation.errors && (
            <View style={styles.errorList}>
              <Text style={styles.errorTitle}>Missing Configuration:</Text>
              {validation.errors.map((error, index) => (
                <Text key={index} style={styles.errorItem}>• {error}</Text>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // In development, log but still allow the app to run for debugging
  if (!configured && !IS_PRODUCTION) {
    const validation = getValidationResult();
    if (__DEV__) {
      console.warn('AppLaunchGate: App running with incomplete configuration:', validation.errors);
    }
  }

  return <View style={{ flex: 1 }}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  supportEmail: {
    fontSize: 16,
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorList: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    width: '100%',
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorItem: {
    fontSize: 12,
    color: '#ff9999',
    marginBottom: 4,
  },
});

export default AppLaunchGate;
