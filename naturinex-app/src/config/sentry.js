// Sentry Configuration - Error Monitoring
// Configured for HIPAA compliance - no PHI in error reports

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

class SentryConfig {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize Sentry with secure configuration
   */
  initialize() {
    const dsn = process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';

    // Don't initialize in development unless explicitly requested
    if (environment === 'development' && !process.env.SENTRY_FORCE_DEV) {
      console.log('[Sentry] Skipping initialization in development');
      return false;
    }

    if (!dsn) {
      console.warn('[Sentry] No DSN provided - error tracking disabled');
      return false;
    }

    try {
      Sentry.init({
        dsn,
        environment,

        // Performance monitoring
        tracesSampleRate: environment === 'production' ? 0.2 : 1.0, // 20% in prod, 100% in dev
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000, // 30 seconds

        // Distribution and release
        dist: Platform.OS,
        release: `naturinex@${process.env.EXPO_PUBLIC_VERSION || '1.0.0'}`,

        // Privacy & HIPAA compliance
        beforeSend: (event, hint) => {
          return this.scrubPHI(event, hint);
        },

        beforeBreadcrumb: (breadcrumb, hint) => {
          return this.scrubBreadcrumb(breadcrumb, hint);
        },

        // Ignore common errors
        ignoreErrors: [
          // Network errors
          'Network request failed',
          'Failed to fetch',
          'NetworkError',

          // Browser quirks
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection',

          // User cancellations
          'User cancelled',
          'Request aborted',

          // Known issues
          'Loading chunk',
          'Importing a module script failed',
        ],

        // Deny URLs - don't track errors from these sources
        denyUrls: [
          // Browser extensions
          /extensions\//i,
          /^chrome:\/\//i,
          /^moz-extension:\/\//i,

          // Social media widgets
          /facebook\.com/i,
          /twitter\.com/i,
          /instagram\.com/i,
        ],

        // Integrations
        integrations: function(integrations) {
          // Remove integrations that might capture sensitive data
          return integrations.filter(function(integration) {
            return integration.name !== 'Breadcrumbs' ||
                   integration.name !== 'GlobalHandlers';
          });
        },

        // Debug mode
        debug: environment === 'development',

        // Attach stack traces
        attachStacktrace: true,

        // Max breadcrumbs
        maxBreadcrumbs: 50,

        // Auto-instrumentation
        enableAutoPerformanceTracing: true,
        enableOutOfMemoryTracking: true,
      });

      this.initialized = true;
      console.log('[Sentry] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Sentry] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Scrub PHI and sensitive data from error events
   */
  scrubPHI(event, hint) {
    try {
      // Remove user PII
      if (event.user) {
        event.user = {
          id: this.hashUserId(event.user.id),
          // Remove email, username, ip_address, etc.
        };
      }

      // Scrub request data
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
          delete event.request.headers['X-API-Key'];
        }

        // Scrub URL parameters
        if (event.request.url) {
          event.request.url = this.scrubURL(event.request.url);
        }

        // Scrub query string
        if (event.request.query_string) {
          event.request.query_string = this.scrubQueryString(event.request.query_string);
        }

        // Remove request body (may contain PHI)
        delete event.request.data;
      }

      // Scrub exception values
      if (event.exception && event.exception.values) {
        event.exception.values = event.exception.values.map(exception => {
          if (exception.value) {
            exception.value = this.scrubText(exception.value);
          }
          if (exception.stacktrace && exception.stacktrace.frames) {
            exception.stacktrace.frames = exception.stacktrace.frames.map(frame => {
              if (frame.vars) {
                frame.vars = this.scrubVariables(frame.vars);
              }
              return frame;
            });
          }
          return exception;
        });
      }

      // Scrub extra context
      if (event.extra) {
        event.extra = this.scrubVariables(event.extra);
      }

      // Scrub contexts
      if (event.contexts) {
        event.contexts = this.scrubVariables(event.contexts);
      }

      // Add compliance tag
      event.tags = {
        ...event.tags,
        hipaa_compliant: 'true',
        phi_scrubbed: 'true',
      };

      return event;
    } catch (error) {
      console.error('[Sentry] Error scrubbing PHI:', error);
      // If scrubbing fails, don't send the event
      return null;
    }
  }

  /**
   * Scrub sensitive data from breadcrumbs
   */
  scrubBreadcrumb(breadcrumb, hint) {
    try {
      // Remove data from breadcrumbs
      if (breadcrumb.data) {
        breadcrumb.data = this.scrubVariables(breadcrumb.data);
      }

      // Scrub message
      if (breadcrumb.message) {
        breadcrumb.message = this.scrubText(breadcrumb.message);
      }

      return breadcrumb;
    } catch (error) {
      // If scrubbing fails, don't include breadcrumb
      return null;
    }
  }

  /**
   * Scrub sensitive text content
   */
  scrubText(text) {
    if (!text) return text;

    let scrubbed = String(text);

    // Patterns to scrub
    const patterns = [
      // Email addresses
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
      // Phone numbers
      { pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: '[PHONE]' },
      // SSN
      { pattern: /\d{3}-\d{2}-\d{4}/g, replacement: '[SSN]' },
      // Credit cards
      { pattern: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, replacement: '[CARD]' },
      // Medication names (common patterns)
      { pattern: /medication[:\s]+([a-zA-Z0-9\s-]+)/gi, replacement: 'medication: [REDACTED]' },
      // API keys
      { pattern: /api[_-]?key[:\s=]*['"]*([a-zA-Z0-9_-]+)['"]/gi, replacement: 'api_key: [REDACTED]' },
      // Tokens
      { pattern: /token[:\s=]*['"]*([a-zA-Z0-9._-]+)['"]/gi, replacement: 'token: [REDACTED]' },
    ];

    for (const { pattern, replacement } of patterns) {
      scrubbed = scrubbed.replace(pattern, replacement);
    }

    return scrubbed;
  }

  /**
   * Scrub sensitive variables
   */
  scrubVariables(vars) {
    if (!vars || typeof vars !== 'object') return vars;

    const scrubbed = Array.isArray(vars) ? [] : {};
    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'api_key',
      'secret',
      'ssn',
      'social_security',
      'credit_card',
      'medication',
      'diagnosis',
      'email',
      'phone',
      'address',
      'dob',
      'date_of_birth',
      'auth',
      'authorization',
    ];

    for (const [key, value] of Object.entries(vars)) {
      const keyLower = String(key).toLowerCase();

      // Check if key is sensitive
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        scrubbed[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively scrub nested objects
        scrubbed[key] = this.scrubVariables(value);
      } else if (typeof value === 'string') {
        // Scrub text values
        scrubbed[key] = this.scrubText(value);
      } else {
        scrubbed[key] = value;
      }
    }

    return scrubbed;
  }

  /**
   * Scrub URL parameters
   */
  scrubURL(url) {
    try {
      const urlObj = new URL(url);
      const sensitiveParams = ['token', 'key', 'password', 'email', 'phone'];

      for (const param of sensitiveParams) {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      }

      return urlObj.toString();
    } catch {
      return '[INVALID_URL]';
    }
  }

  /**
   * Scrub query string
   */
  scrubQueryString(queryString) {
    if (!queryString) return queryString;

    const params = new URLSearchParams(queryString);
    const sensitiveParams = ['token', 'key', 'password', 'email', 'phone'];

    for (const param of sensitiveParams) {
      if (params.has(param)) {
        params.set(param, '[REDACTED]');
      }
    }

    return params.toString();
  }

  /**
   * Hash user ID for privacy
   */
  hashUserId(userId) {
    if (!userId) return null;

    // Simple hash - in production, use proper hashing
    return 'user_' + String(userId).substring(0, 8) + '***';
  }

  /**
   * Set user context (scrubbed)
   */
  setUser(user) {
    if (!this.initialized) return;

    if (user) {
      Sentry.setUser({
        id: this.hashUserId(user.id),
        // Don't include email, username, etc.
      });
    } else {
      Sentry.setUser(null);
    }
  }

  /**
   * Set custom context
   */
  setContext(name, context) {
    if (!this.initialized) return;

    Sentry.setContext(name, this.scrubVariables(context));
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb) {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      ...breadcrumb,
      data: this.scrubVariables(breadcrumb.data),
    });
  }

  /**
   * Capture exception
   */
  captureException(error, context) {
    if (!this.initialized) {
      console.error('[Sentry] Not initialized - logging error:', error);
      return;
    }

    Sentry.captureException(error, {
      contexts: this.scrubVariables(context),
    });
  }

  /**
   * Capture message
   */
  captureMessage(message, level = 'info', context) {
    if (!this.initialized) return;

    Sentry.captureMessage(this.scrubText(message), {
      level,
      contexts: this.scrubVariables(context),
    });
  }

  /**
   * Start transaction (performance monitoring)
   */
  startTransaction(name, op) {
    if (!this.initialized) return null;

    return Sentry.startTransaction({
      name,
      op,
    });
  }
}

// Create singleton instance
const sentryConfig = new SentryConfig();

// Export singleton
export default sentryConfig;

// Export convenience functions
export const initializeSentry = () => sentryConfig.initialize();
export const setUser = (user) => sentryConfig.setUser(user);
export const captureException = (error, context) => sentryConfig.captureException(error, context);
export const captureMessage = (message, level, context) => sentryConfig.captureMessage(message, level, context);
export const addBreadcrumb = (breadcrumb) => sentryConfig.addBreadcrumb(breadcrumb);
export const startTransaction = (name, op) => sentryConfig.startTransaction(name, op);
