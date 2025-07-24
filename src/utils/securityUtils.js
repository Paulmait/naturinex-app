// Security utilities and input sanitization
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

  // Content Security Policy helpers
  static setupCSP() {
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

  // Secure local storage wrapper
  static secureStorage = {
    set(key, value, ttl = null) {
      try {
        const item = {
          value,
          timestamp: Date.now(),
          ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    },

    get(key) {
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
        console.warn('Failed to read from localStorage:', error);
        return null;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    },

    clear() {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
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

  // Security headers check
  static checkSecurityHeaders() {
    const securityHeaders = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security'
    ];

    if (this.isDevelopment()) {
      console.log('🔒 Security Headers Check:');
      securityHeaders.forEach(header => {
        const value = document.querySelector(`meta[http-equiv="${header}"]`);
        console.log(`${header}: ${value ? '✅ Present' : '❌ Missing'}`);
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

// Initialize security measures
if (typeof window !== 'undefined') {
  // Setup CSP in development
  if (process.env.NODE_ENV === 'development') {
    SecurityUtils.setupCSP();
    SecurityUtils.checkSecurityHeaders();
  }
}

export default SecurityUtils;
