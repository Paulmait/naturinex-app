import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Error categorization
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'authentication',
  PERMISSION: 'permission',
  API: 'api',
  STORAGE: 'storage',
  CAMERA: 'camera',
  UNKNOWN: 'unknown'
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error, errorInfo) {
    const errorId = this.generateErrorId();
    this.setState({ errorInfo, errorId });

    // Log to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Categorize and analyze error
    const errorData = this.categorizeError(error, errorInfo);

    // Log to multiple sources
    await this.logError({
      ...errorData,
      errorId,
      timestamp: new Date().toISOString(),
      context: this.props.context || 'app',
    });

    // Send analytics if enabled
    if (this.props.enableAnalytics !== false) {
      this.sendErrorAnalytics(errorData, errorId);
    }
  }

  generateErrorId = () => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  categorizeError = (error, errorInfo) => {
    const errorString = error.toString().toLowerCase();
    const stackTrace = error.stack || '';

    let category = ERROR_CATEGORIES.UNKNOWN;
    let severity = ERROR_SEVERITY.MEDIUM;
    let isRecoverable = true;
    let userMessage = 'An unexpected error occurred';
    let technicalMessage = error.message;

    // Network errors
    if (errorString.includes('network') || errorString.includes('fetch') ||
        errorString.includes('connection') || error.name === 'NetworkError') {
      category = ERROR_CATEGORIES.NETWORK;
      severity = ERROR_SEVERITY.LOW;
      userMessage = 'Network connection issue. Please check your internet connection.';
    }

    // Authentication errors
    else if (errorString.includes('auth') || errorString.includes('token') ||
             errorString.includes('unauthorized') || errorString.includes('login')) {
      category = ERROR_CATEGORIES.AUTH;
      severity = ERROR_SEVERITY.MEDIUM;
      userMessage = 'Authentication issue. Please sign in again.';
    }

    // Validation errors
    else if (errorString.includes('validation') || errorString.includes('invalid') ||
             error.name === 'ValidationError') {
      category = ERROR_CATEGORIES.VALIDATION;
      severity = ERROR_SEVERITY.LOW;
      userMessage = 'Please check your input and try again.';
    }

    // Permission errors
    else if (errorString.includes('permission') || errorString.includes('denied') ||
             errorString.includes('forbidden')) {
      category = ERROR_CATEGORIES.PERMISSION;
      severity = ERROR_SEVERITY.MEDIUM;
      userMessage = 'Permission required. Please check app permissions in settings.';
    }

    // Camera errors
    else if (errorString.includes('camera') || stackTrace.includes('Camera')) {
      category = ERROR_CATEGORIES.CAMERA;
      severity = ERROR_SEVERITY.MEDIUM;
      userMessage = 'Camera access issue. Please check camera permissions.';
    }

    // Storage errors
    else if (errorString.includes('storage') || errorString.includes('quota') ||
             stackTrace.includes('AsyncStorage')) {
      category = ERROR_CATEGORIES.STORAGE;
      severity = ERROR_SEVERITY.MEDIUM;
      userMessage = 'Storage issue. Please free up device storage.';
    }

    // API errors
    else if (errorString.includes('api') || errorString.includes('server') ||
             errorString.includes('http') || stackTrace.includes('api/')) {
      category = ERROR_CATEGORIES.API;
      severity = ERROR_SEVERITY.MEDIUM;
      userMessage = 'Server connection issue. Please try again.';
    }

    // Critical errors (app crashes)
    if (errorString.includes('segmentation') || errorString.includes('memory') ||
        errorString.includes('crash') || error.name === 'ReferenceError') {
      severity = ERROR_SEVERITY.CRITICAL;
      isRecoverable = false;
      userMessage = 'Critical error occurred. App needs to restart.';
    }

    return {
      category,
      severity,
      isRecoverable,
      userMessage,
      technicalMessage,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      componentStack: errorInfo?.componentStack,
    };
  };

  logError = async (errorData) => {
    try {
      // Log to local storage for offline viewing
      await this.logToLocalStorage(errorData);

      // Log to Supabase if available
      if (supabase) {
        await this.logToSupabase(errorData);
      }

      // Log to console in development
      if (__DEV__) {
        console.group(`🚨 Error ${errorData.errorId}`);
        console.error('Category:', errorData.category);
        console.error('Severity:', errorData.severity);
        console.error('Technical:', errorData.technicalMessage);
        console.error('User Message:', errorData.userMessage);
        console.error('Stack:', errorData.stackTrace);
        console.groupEnd();
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  logToLocalStorage = async (errorData) => {
    try {
      const existingLogs = await AsyncStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      // Keep only last 50 errors to prevent storage overflow
      logs.unshift(errorData);
      if (logs.length > 50) {
        logs.splice(50);
      }

      await AsyncStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (storageError) {
      console.error('Failed to log to AsyncStorage:', storageError);
    }
  };

  logToSupabase = async (errorData) => {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        deviceName: Device.deviceName,
        deviceType: Device.deviceType,
        isDevice: Device.isDevice,
        appVersion: Constants.expoConfig?.version || '1.0.0',
      };

      const { error } = await supabase.from('error_logs').insert({
        error_id: errorData.errorId,
        category: errorData.category,
        severity: errorData.severity,
        user_message: errorData.userMessage,
        technical_message: errorData.technicalMessage,
        error_name: errorData.errorName,
        error_message: errorData.errorMessage,
        stack_trace: errorData.stackTrace,
        component_stack: errorData.componentStack,
        device_info: deviceInfo,
        context: errorData.context,
        timestamp: errorData.timestamp,
        is_recoverable: errorData.isRecoverable,
        user_id: (await supabase.auth.getUser())?.data?.user?.id || null,
      });

      if (error) {
        console.error('Supabase logging failed:', error);
      }
    } catch (supabaseError) {
      console.error('Failed to log to Supabase:', supabaseError);
    }
  };

  sendErrorAnalytics = (errorData, errorId) => {
    // Placeholder for analytics integration (Mixpanel, Amplitude, etc.)
    if (typeof this.props.onErrorAnalytics === 'function') {
      this.props.onErrorAnalytics({
        event: 'error_boundary_triggered',
        properties: {
          error_id: errorId,
          category: errorData.category,
          severity: errorData.severity,
          is_recoverable: errorData.isRecoverable,
          context: this.props.context,
        },
      });
    }
  };

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });

    // Call optional restart callback
    if (typeof this.props.onRestart === 'function') {
      this.props.onRestart();
    }
  };

  handleReportError = async () => {
    if (this.state.isReporting) return;

    this.setState({ isReporting: true });

    try {
      // Force upload error logs to Supabase
      const errorData = this.categorizeError(this.state.error, this.state.errorInfo);
      await this.logToSupabase({
        ...errorData,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        context: this.props.context || 'app',
        user_reported: true,
      });

      Alert.alert(
        'Error Reported',
        'Thank you for reporting this error. Our team has been notified.',
        [{ text: 'OK' }]
      );
    } catch (reportError) {
      Alert.alert(
        'Report Failed',
        'Unable to report error. Please try again later.',
        [{ text: 'OK' }]
      );
      console.error('Error reporting failed:', reportError);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  getRecoveryOptions = () => {
    const errorData = this.categorizeError(this.state.error, this.state.errorInfo);

    const options = [{
      title: 'Try Again',
      action: this.handleRestart,
      primary: true
    }];

    // Add category-specific recovery options
    switch (errorData.category) {
      case ERROR_CATEGORIES.NETWORK:
        options.push({
          title: 'Check Connection',
          action: () => {
            Alert.alert(
              'Network Issue',
              'Please check your internet connection and try again.',
              [{ text: 'OK' }]
            );
          }
        });
        break;

      case ERROR_CATEGORIES.AUTH:
        options.push({
          title: 'Sign Out & Sign In',
          action: () => {
            if (typeof this.props.onAuthReset === 'function') {
              this.props.onAuthReset();
            }
          }
        });
        break;

      case ERROR_CATEGORIES.PERMISSION:
        options.push({
          title: 'Open Settings',
          action: () => {
            Alert.alert(
              'Permissions Required',
              'Please check app permissions in your device settings.',
              [{ text: 'OK' }]
            );
          }
        });
        break;

      case ERROR_CATEGORIES.STORAGE:
        options.push({
          title: 'Clear Cache',
          action: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Cache Cleared', 'Please restart the app.');
            } catch (clearError) {
              console.error('Failed to clear cache:', clearError);
            }
          }
        });
        break;
    }

    // Always add report option
    options.push({
      title: 'Report Error',
      action: this.handleReportError
    });

    return options;
  };

  render() {
    if (this.state.hasError) {
      const errorData = this.categorizeError(this.state.error, this.state.errorInfo);
      const recoveryOptions = this.getRecoveryOptions();

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <MaterialIcons
              name={this.getErrorIcon(errorData.category)}
              size={64}
              color={this.getErrorColor(errorData.severity)}
            />
            <Text style={styles.title}>
              {this.getErrorTitle(errorData.category)}
            </Text>
            <Text style={styles.message}>
              {errorData.userMessage}
            </Text>

            {/* Error ID for support */}
            <Text style={styles.errorId}>
              Error ID: {this.state.errorId}
            </Text>

            {/* Recovery Options */}
            <View style={styles.buttonsContainer}>
              {recoveryOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[\n                    styles.button,\n                    option.primary ? styles.primaryButton : styles.secondaryButton,\n                    this.state.isReporting && option.title === 'Report Error' && styles.disabledButton\n                  ]}\n                  onPress={option.action}\n                  disabled={this.state.isReporting && option.title === 'Report Error'}\n                >\n                  <Text style={[\n                    styles.buttonText,\n                    !option.primary && styles.secondaryButtonText\n                  ]}>\n                    {this.state.isReporting && option.title === 'Report Error' ? 'Reporting...' : option.title}\n                  </Text>\n                </TouchableOpacity>\n              ))}\n            </View>\n\n            {/* Technical details in dev mode */}\n            {__DEV__ && (\n              <View style={styles.debugContainer}>\n                <Text style={styles.debugTitle}>Debug Info:</Text>\n                <Text style={styles.debugText}>Category: {errorData.category}</Text>\n                <Text style={styles.debugText}>Severity: {errorData.severity}</Text>\n                <Text style={styles.debugText}>Recoverable: {errorData.isRecoverable ? 'Yes' : 'No'}</Text>\n                {errorData.technicalMessage && (\n                  <Text style={styles.debugText}>Technical: {errorData.technicalMessage}</Text>\n                )}\n              </View>\n            )}\n          </View>\n        </View>\n      );\n    }\n\n    return this.props.children;\n  }\n\n  getErrorIcon = (category) => {\n    switch (category) {\n      case ERROR_CATEGORIES.NETWORK: return 'wifi-off';\n      case ERROR_CATEGORIES.AUTH: return 'account-circle';\n      case ERROR_CATEGORIES.PERMISSION: return 'security';\n      case ERROR_CATEGORIES.CAMERA: return 'camera-alt';\n      case ERROR_CATEGORIES.STORAGE: return 'storage';\n      case ERROR_CATEGORIES.API: return 'cloud-off';\n      case ERROR_CATEGORIES.VALIDATION: return 'error-outline';\n      default: return 'error';\n    }\n  };\n\n  getErrorColor = (severity) => {\n    switch (severity) {\n      case ERROR_SEVERITY.LOW: return '#F59E0B';\n      case ERROR_SEVERITY.MEDIUM: return '#EF4444';\n      case ERROR_SEVERITY.HIGH: return '#DC2626';\n      case ERROR_SEVERITY.CRITICAL: return '#7F1D1D';\n      default: return '#EF4444';\n    }\n  };\n\n  getErrorTitle = (category) => {\n    switch (category) {\n      case ERROR_CATEGORIES.NETWORK: return 'Connection Issue';\n      case ERROR_CATEGORIES.AUTH: return 'Authentication Problem';\n      case ERROR_CATEGORIES.PERMISSION: return 'Permission Required';\n      case ERROR_CATEGORIES.CAMERA: return 'Camera Issue';\n      case ERROR_CATEGORIES.STORAGE: return 'Storage Problem';\n      case ERROR_CATEGORIES.API: return 'Server Issue';\n      case ERROR_CATEGORIES.VALIDATION: return 'Input Error';\n      default: return 'Something went wrong';\n    }\n  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  errorId: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#6B7280',
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ErrorBoundary;
