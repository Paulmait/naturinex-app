// Production Logger - Replaces console.log
// Safely logs without exposing PHI or sensitive data

import ErrorService from './ErrorService';
import MonitoringService from './MonitoringService';

const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical',
};

class Logger {
  constructor() {
    this.enabled = true;
    this.minLevel = this.getMinLevel();
    this.phiPatterns = this.initPHIPatterns();
    this.logBuffer = [];
    this.maxBufferSize = 100;
  }

  /**
   * Get minimum log level based on environment
   */
  getMinLevel() {
    const env = process.env.NODE_ENV || 'development';

    switch (env) {
      case 'production':
        return LOG_LEVELS.WARN; // Only warnings and errors in production
      case 'staging':
        return LOG_LEVELS.INFO;
      default:
        return LOG_LEVELS.DEBUG;
    }
  }

  /**
   * Initialize PHI detection patterns
   */
  initPHIPatterns() {
    return [
      // Email addresses
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      // Phone numbers
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      // SSN
      /\d{3}-\d{2}-\d{4}/g,
      // Credit card numbers
      /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
      // Dates that might be DOB
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
      // Common medication patterns (to redact actual names)
      /medication[:\s]+([a-zA-Z0-9\s-]+)/gi,
      /drug[:\s]+([a-zA-Z0-9\s-]+)/gi,
      // API keys
      /api[_-]?key[:\s=]*['"]*([a-zA-Z0-9_-]+)['"]/gi,
      /token[:\s=]*['"]*([a-zA-Z0-9_-]+)['"]/gi,
    ];
  }

  /**
   * Sanitize message to remove PHI
   */
  sanitize(message) {
    if (typeof message !== 'string') {
      message = this.safeStringify(message);
    }

    let sanitized = message;

    // Replace PHI with [REDACTED]
    for (const pattern of this.phiPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Replace sensitive field values in JSON
    try {
      if (message.includes('{') && message.includes('}')) {
        const sensitiveFields = [
          'password',
          'token',
          'apiKey',
          'api_key',
          'secret',
          'ssn',
          'social_security',
          'credit_card',
          'medication_name',
          'diagnosis',
          'email',
          'phone',
          'address',
        ];

        for (const field of sensitiveFields) {
          const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`, 'gi');
          sanitized = sanitized.replace(regex, `"${field}":"[REDACTED]"`);
        }
      }
    } catch (error) {
      // If sanitization fails, return safe fallback
      return '[LOG_SANITIZATION_ERROR]';
    }

    return sanitized;
  }

  /**
   * Safe stringify with circular reference handling
   */
  safeStringify(obj) {
    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      // Redact sensitive keys
      const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'ssn'];
      if (sensitiveKeys.includes(key)) {
        return '[REDACTED]';
      }

      return value;
    }, 2);
  }

  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    if (!this.enabled) return false;

    const levels = Object.values(LOG_LEVELS);
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);

    return currentIndex >= minIndex;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitize(message);
    const sanitizedContext = context ? this.sanitize(this.safeStringify(context)) : '';

    return {
      timestamp,
      level,
      message: sanitizedMessage,
      context: sanitizedContext,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Add log to buffer
   */
  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);

    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Debug level logging
   */
  debug(message, context) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;

    const logEntry = this.formatMessage(LOG_LEVELS.DEBUG, message, context);
    this.addToBuffer(logEntry);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${logEntry.message}`, context || '');
    }
  }

  /**
   * Info level logging
   */
  info(message, context) {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;

    const logEntry = this.formatMessage(LOG_LEVELS.INFO, message, context);
    this.addToBuffer(logEntry);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${logEntry.message}`, context || '');
    }

    // Track in monitoring
    MonitoringService.trackEvent('log_info', { message: logEntry.message });
  }

  /**
   * Warning level logging
   */
  warn(message, context) {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;

    const logEntry = this.formatMessage(LOG_LEVELS.WARN, message, context);
    this.addToBuffer(logEntry);

    console.warn(`[WARN] ${logEntry.message}`, context || '');

    // Track in monitoring
    MonitoringService.trackEvent('log_warning', {
      message: logEntry.message,
      context: logEntry.context,
    });
  }

  /**
   * Error level logging
   */
  error(message, error, context) {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';

    const logEntry = this.formatMessage(LOG_LEVELS.ERROR, message, {
      ...context,
      error: errorMessage,
      stack: this.sanitize(stack),
    });

    this.addToBuffer(logEntry);

    console.error(`[ERROR] ${logEntry.message}`, context || '');

    // Log to error service
    ErrorService.logError(error, message, context);
  }

  /**
   * Critical level logging
   */
  critical(message, error, context) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';

    const logEntry = this.formatMessage(LOG_LEVELS.CRITICAL, message, {
      ...context,
      error: errorMessage,
      stack: this.sanitize(stack),
    });

    this.addToBuffer(logEntry);

    console.error(`[CRITICAL] ${logEntry.message}`, context || '');

    // Log to error service with high priority
    ErrorService.logError(error, message, { ...context, severity: 'critical' });

    // Alert monitoring
    MonitoringService.trackEvent('critical_error', {
      message: logEntry.message,
      context: logEntry.context,
    });
  }

  /**
   * Log with specific level
   */
  log(level, message, context) {
    switch (level) {
      case LOG_LEVELS.DEBUG:
        this.debug(message, context);
        break;
      case LOG_LEVELS.INFO:
        this.info(message, context);
        break;
      case LOG_LEVELS.WARN:
        this.warn(message, context);
        break;
      case LOG_LEVELS.ERROR:
        this.error(message, context);
        break;
      case LOG_LEVELS.CRITICAL:
        this.critical(message, context);
        break;
      default:
        this.info(message, context);
    }
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(count = 50) {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearBuffer() {
    this.logBuffer = [];
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level) {
    if (Object.values(LOG_LEVELS).includes(level)) {
      this.minLevel = level;
    }
  }

  /**
   * Performance logging
   */
  logPerformance(operation, duration, metadata = {}) {
    this.info(`Performance: ${operation} took ${duration}ms`, metadata);

    MonitoringService.trackPerformanceMetric(operation, duration, metadata);
  }

  /**
   * User action logging (no PHI)
   */
  logUserAction(action, userId, metadata = {}) {
    this.info(`User action: ${action}`, {
      userId: userId ? userId.substring(0, 8) + '***' : 'anonymous',
      ...metadata,
    });

    MonitoringService.trackUserAction(action, userId, metadata);
  }

  /**
   * API call logging
   */
  logAPICall(method, endpoint, status, duration) {
    const level = status >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;

    this.log(level, `API ${method} ${endpoint} - ${status} (${duration}ms)`);

    MonitoringService.trackEvent('api_call', {
      method,
      endpoint: this.sanitize(endpoint),
      status,
      duration,
    });
  }
}

// Create singleton instance
const logger = new Logger();

// Export singleton
export default logger;

// Export log levels
export { LOG_LEVELS };

// Export convenience functions
export const debug = (message, context) => logger.debug(message, context);
export const info = (message, context) => logger.info(message, context);
export const warn = (message, context) => logger.warn(message, context);
export const error = (message, err, context) => logger.error(message, err, context);
export const critical = (message, err, context) => logger.critical(message, err, context);
export const logPerformance = (operation, duration, metadata) => logger.logPerformance(operation, duration, metadata);
export const logUserAction = (action, userId, metadata) => logger.logUserAction(action, userId, metadata);
export const logAPICall = (method, endpoint, status, duration) => logger.logAPICall(method, endpoint, status, duration);
