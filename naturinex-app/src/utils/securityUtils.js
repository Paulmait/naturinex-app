// Security utilities and input sanitization
// Compatible with both React Native and Web

export class SecurityUtils {
  // Input sanitization
  static sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
      return '';
    }

    const {
      maxLength = 1000,
      allowHtml = false,
      allowSpecialChars = true
    } = options;

    let sanitized = input.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Remove HTML if not allowed
    if (!allowHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Remove potentially dangerous characters
    if (!allowSpecialChars) {
      sanitized = sanitized.replace(/[<>"'&]/g, '');
    }

    // Remove null bytes and control characters
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    return sanitized;
  }

  // Validate medication name
  static validateMedicationName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Medication name is required' };
    }

    const sanitized = this.sanitizeInput(name, { maxLength: 100, allowHtml: false });

    if (sanitized.length === 0) {
      return { valid: false, error: 'Medication name cannot be empty' };
    }

    if (sanitized.length < 2) {
      return { valid: false, error: 'Medication name too short' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+=/i,
      /<script/i,
      /\bexec\b/i,
      /\beval\b/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        return { valid: false, error: 'Invalid characters detected' };
      }
    }

    return { valid: true, sanitized };
  }

  // Validate email
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (email.length > 254) {
      return { valid: false, error: 'Email too long' };
    }

    return { valid: true, sanitized: email.toLowerCase().trim() };
  }

  // Content Security Policy helpers (Web only)
  static setupCSP() {
    // Only run in web environment
    if (typeof document === 'undefined') return;

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://api.stripe.com https://generativelanguage.googleapis.com;
      frame-src https://js.stripe.com;
    `.replace(/\s+/g, ' ').trim();

    document.head.appendChild(meta);
  }

  // Rate limiting for client-side operations
  static createRateLimiter(maxRequests, windowMs) {
    const requests = new Map();

    return (key = 'default') => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old requests
      if (requests.has(key)) {
        requests.set(key, requests.get(key).filter(time => time > windowStart));
      } else {
        requests.set(key, []);
      }

      const userRequests = requests.get(key);

      if (userRequests.length >= maxRequests) {
        return {
          allowed: false,
          retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
        };
      }

      userRequests.push(now);
      return { allowed: true };
    };
  }

  // Secure local storage wrapper (Web only - use SecureStore for React Native)
  // NOTE: For React Native apps, use expo-secure-store directly
  // This is only for web compatibility
  static secureStorage = {
    async set(key, value, ttl = null) {
      // Only available in web environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.warn('securityUtils.secureStorage is for web only. Use expo-secure-store for React Native.');
        return;
      }

      try {
        const item = {
          value,
          timestamp: Date.now(),
          ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        // Silently fail
      }
    },

    async get(key) {
      // Only available in web environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
      }

      try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);

        // Check if expired
        if (parsed.ttl && Date.now() > parsed.timestamp + parsed.ttl) {
          localStorage.removeItem(key);
          return null;
        }

        return parsed.value;
      } catch (error) {
        return null;
      }
    },

    async remove(key) {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Silently fail
      }
    },

    async clear() {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      try {
        localStorage.clear();
      } catch (error) {
        // Silently fail
      }
    }
  };

  // Environment detection
  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  static isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  // Security headers check (Web only)
  static checkSecurityHeaders() {
    if (typeof document === 'undefined') return;

    const securityHeaders = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security'
    ];

    if (this.isDevelopment()) {
      securityHeaders.forEach(header => {
        const value = document.querySelector(`meta[http-equiv="${header}"]`);
        // Just checking, not logging
      });
    }
  }

  // Generate secure random ID
  static generateSecureId(length = 32) {
    const array = new Uint8Array(length / 2);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Initialize security measures (Web only)
if (typeof window !== 'undefined') {
  // Setup CSP in development
  if (process.env.NODE_ENV === 'development') {
    SecurityUtils.setupCSP();
    SecurityUtils.checkSecurityHeaders();
  }
}

export default SecurityUtils;
