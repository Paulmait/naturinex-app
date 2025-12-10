/**
 * Production-Safe Logger
 *
 * Replaces console.log statements with a logger that:
 * - Disables logging in production
 * - Sanitizes sensitive data
 * - Integrates with error tracking services
 */

import * as Sentry from '@sentry/react-native';
import { EXPO_ENV, IS_PRODUCTION } from '../config/env';

class Logger {
  constructor() {
    this.isProduction = IS_PRODUCTION;
    this.enableLogging = !this.isProduction || process.env.EXPO_PUBLIC_ENABLE_DEBUG_LOGS === 'true';
  }

  /**
   * Sanitize sensitive data before logging
   */
  sanitize(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'api_key',
      'secret',
      'authorization',
      'cookie',
      'session',
      'ssn',
      'credit_card',
      'cvv',
      'pin',
    ];

    const sanitizeRecursive = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some(sensitiveKey =>
          lowerKey.includes(sensitiveKey)
        );

        if (isSensitive) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeRecursive(obj[key]);
        }
      });
      return obj;
    };

    return sanitizeRecursive(sanitized);
  }

  /**
   * Log debug information (disabled in production)
   */
  debug(...args) {
    if (this.enableLogging) {
      const sanitized = args.map(arg => this.sanitize(arg));
      console.log('[DEBUG]', ...sanitized);
    }
  }

  /**
   * Log informational messages
   */
  info(...args) {
    if (this.enableLogging) {
      const sanitized = args.map(arg => this.sanitize(arg));
      console.info('[INFO]', ...sanitized);
    }
  }

  /**
   * Log warnings
   */
  warn(...args) {
    const sanitized = args.map(arg => this.sanitize(arg));
    console.warn('[WARN]', ...sanitized);

    if (this.isProduction && Sentry) {
      Sentry.captureMessage(`Warning: ${JSON.stringify(sanitized)}`, 'warning');
    }
  }

  /**
   * Log errors
   */
  error(error, context = {}) {
    const sanitizedContext = this.sanitize(context);
    console.error('[ERROR]', error, sanitizedContext);

    if (this.isProduction && Sentry) {
      Sentry.captureException(error, {
        extra: sanitizedContext,
      });
    }
  }

  /**
   * Log with custom severity
   */
  log(level, ...args) {
    switch (level) {
      case 'debug':
        this.debug(...args);
        break;
      case 'info':
        this.info(...args);
        break;
      case 'warn':
        this.warn(...args);
        break;
      case 'error':
        this.error(...args);
        break;
      default:
        this.info(...args);
    }
  }

  /**
   * Disable all logging (for sensitive operations)
   */
  mute() {
    this.enableLogging = false;
  }

  /**
   * Re-enable logging
   */
  unmute() {
    this.enableLogging = !this.isProduction;
  }
}

// Create singleton instance
const logger = new Logger();

// For production, override console methods to prevent accidental logging
if (IS_PRODUCTION) {
  // Preserve original console for critical errors
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console methods
  console.log = () => {}; // Disabled in production
  console.debug = () => {}; // Disabled in production
  console.info = () => {}; // Disabled in production
  console.warn = (...args) => logger.warn(...args);
  console.error = (...args) => {
    originalError(...args);
    if (args[0] instanceof Error) {
      logger.error(args[0], args.slice(1));
    } else {
      logger.error(new Error(String(args[0])), args.slice(1));
    }
  };
}

export default logger;
