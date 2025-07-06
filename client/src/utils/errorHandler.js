/**
 * Enhanced error handling utilities
 * Provides standardized error handling across the application
 */

// Error types for consistent identification
export const ERROR_TYPES = {
  NETWORK: 'network_error',
  PERMISSION: 'permission_denied',
  AUTHENTICATION: 'auth_error',
  VALIDATION: 'validation_error',
  QUOTA_EXCEEDED: 'quota_exceeded',
  API_ERROR: 'api_error',
  TIMEOUT: 'timeout_error',
  UNKNOWN: 'unknown_error',
  SCAN_ERROR: 'scan_error'
};

/**
 * Processes errors from various sources into a standardized format
 * @param {Error|Object} error - The error object to process
 * @param {string} context - Context where the error occurred
 * @returns {Object} Standardized error object
 */
export const processError = (error, context = '') => {
  // Default error structure
  const processedError = {
    type: ERROR_TYPES.UNKNOWN,
    message: 'An unexpected error occurred',
    context,
    timestamp: new Date().toISOString(),
    data: {},
    originalError: error
  };

  // Network errors
  if (error instanceof TypeError && error.message.includes('network')) {
    processedError.type = ERROR_TYPES.NETWORK;
    processedError.message = 'Unable to connect. Please check your internet connection.';
  }
  // Permission errors
  else if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
    processedError.type = ERROR_TYPES.PERMISSION;
    processedError.message = 'Permission denied. Please grant the required permissions.';
  }
  // Timeout errors
  else if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    processedError.type = ERROR_TYPES.TIMEOUT;
    processedError.message = 'Request timed out. Please try again.';
  }
  // API errors
  else if (error.status || error.statusCode) {
    processedError.type = ERROR_TYPES.API_ERROR;
    processedError.message = error.message || `API error: ${error.status || error.statusCode}`;
    processedError.data = { status: error.status || error.statusCode };
  }
  // Quota errors
  else if (error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('limit')) {
    processedError.type = ERROR_TYPES.QUOTA_EXCEEDED;
    processedError.message = 'Usage limit reached. Please try again later or upgrade your plan.';
  }
  // Auth errors
  else if (error.code?.includes('auth') || error.message?.toLowerCase().includes('auth')) {
    processedError.type = ERROR_TYPES.AUTHENTICATION;
    processedError.message = 'Authentication error. Please sign in again.';
  }
  // Barcode scan specific errors
  else if (context === 'barcodeScan') {
    processedError.type = ERROR_TYPES.SCAN_ERROR;
    processedError.message = 'Unable to scan barcode. Please try again.';
  }
  // Use provided message if available
  else if (error.message) {
    processedError.message = error.message;
  }

  return processedError;
};

/**
 * Provides user-friendly suggestions based on error type
 * @param {string} errorType - Type of error from ERROR_TYPES
 * @returns {string[]} Array of user-friendly suggestions
 */
export const getErrorSuggestions = (errorType) => {
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return [
        'Check your internet connection',
        'Try connecting to a different network',
        'Disable VPN or proxy services if enabled',
        'Try again in a few minutes'
      ];
    
    case ERROR_TYPES.PERMISSION:
      return [
        'Go to your browser settings to enable camera access',
        'Check app permissions in your device settings',
        'Try using a different browser',
        'Reload the page and accept the permission prompt'
      ];
    
    case ERROR_TYPES.TIMEOUT:
      return [
        'Check your internet connection speed',
        'Try again when you have a stronger connection',
        'Close other apps or tabs that might be using bandwidth',
        'Wait a moment and try again'
      ];
      
    case ERROR_TYPES.SCAN_ERROR:
      return [
        'Make sure the barcode is clearly visible and well-lit',
        'Hold your device steady and center the barcode',
        'Try scanning from a different angle',
        'Make sure the barcode is not damaged or covered'
      ];
    
    case ERROR_TYPES.QUOTA_EXCEEDED:
      return [
        'Try again later when your quota resets',
        'Upgrade your plan for higher usage limits',
        'Consider using the manual search option'
      ];
      
    case ERROR_TYPES.AUTHENTICATION:
      return [
        'Sign in again to refresh your session',
        'Clear your browser cache and cookies',
        'Make sure you are using the correct account'
      ];
      
    default:
      return [
        'Try refreshing the page',
        'Sign out and sign back in',
        'Clear your browser cache',
        'Try again later'
      ];
  }
};

const errorHandler = {
  ERROR_TYPES,
  processError,
  getErrorSuggestions
};

export default errorHandler;
