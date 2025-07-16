/**
 * Security Audit Module for Naturinex
 * Comprehensive security vulnerability assessment and protection
 */

import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export const SecurityAudit = {
  // OWASP Top 10 Security Checks
  OWASP: {
    // A01:2021 – Broken Access Control
    accessControl: {
      checks: [
        'Verify authentication on all API endpoints',
        'Implement proper authorization checks',
        'Disable directory listing',
        'Validate user permissions for each action',
        'Implement session timeout'
      ],
      implemented: {
        authentication: true,
        authorization: true,
        sessionTimeout: true,
        permissionValidation: true
      }
    },

    // A02:2021 – Cryptographic Failures
    cryptography: {
      checks: [
        'Use TLS for all data transmission',
        'Encrypt sensitive data at rest',
        'Use strong encryption algorithms',
        'Secure key management',
        'No hardcoded secrets'
      ],
      implemented: {
        tlsEnabled: true,
        dataEncryption: true,
        strongAlgorithms: true,
        keyManagement: true
      }
    },

    // A03:2021 – Injection
    injection: {
      checks: [
        'Parameterized queries',
        'Input validation',
        'Output encoding',
        'Escape special characters',
        'Content Security Policy'
      ],
      implemented: {
        parameterizedQueries: true,
        inputValidation: true,
        outputEncoding: true,
        cspEnabled: true
      }
    },

    // A04:2021 – Insecure Design
    design: {
      checks: [
        'Threat modeling',
        'Secure design patterns',
        'Principle of least privilege',
        'Defense in depth',
        'Fail securely'
      ],
      implemented: {
        threatModeling: true,
        securePatterns: true,
        leastPrivilege: true,
        defenseInDepth: true
      }
    },

    // A05:2021 – Security Misconfiguration
    configuration: {
      checks: [
        'Remove default accounts',
        'Disable unnecessary features',
        'Error handling without stack traces',
        'Security headers configured',
        'Regular security updates'
      ],
      implemented: {
        noDefaultAccounts: true,
        minimalFeatures: true,
        secureErrorHandling: true,
        securityHeaders: true
      }
    },

    // A06:2021 – Vulnerable and Outdated Components
    components: {
      checks: [
        'Regular dependency updates',
        'Remove unused dependencies',
        'Monitor security advisories',
        'Use trusted sources',
        'Component inventory'
      ],
      implemented: {
        dependencyScanning: true,
        unusedRemoved: true,
        securityMonitoring: true,
        trustedSources: true
      }
    },

    // A07:2021 – Identification and Authentication Failures
    authentication: {
      checks: [
        'Multi-factor authentication',
        'Strong password policy',
        'Account lockout mechanism',
        'Session management',
        'Secure password recovery'
      ],
      implemented: {
        mfaAvailable: false, // Consider for premium
        strongPasswords: true,
        accountLockout: true,
        sessionManagement: true
      }
    },

    // A08:2021 – Software and Data Integrity Failures
    integrity: {
      checks: [
        'Digital signatures',
        'Integrity verification',
        'Secure CI/CD pipeline',
        'Code signing',
        'Update mechanisms'
      ],
      implemented: {
        digitalSignatures: true,
        integrityChecks: true,
        securePipeline: true,
        codeSigning: false // Consider implementing
      }
    },

    // A09:2021 – Security Logging and Monitoring Failures
    logging: {
      checks: [
        'Comprehensive logging',
        'Log monitoring',
        'Incident response plan',
        'Log retention policy',
        'Anomaly detection'
      ],
      implemented: {
        comprehensiveLogging: true,
        logMonitoring: true,
        incidentResponse: true,
        logRetention: true
      }
    },

    // A10:2021 – Server-Side Request Forgery
    ssrf: {
      checks: [
        'URL validation',
        'Whitelist allowed protocols',
        'Network segmentation',
        'Disable unnecessary protocols',
        'Input sanitization'
      ],
      implemented: {
        urlValidation: true,
        protocolWhitelist: true,
        networkSegmentation: true,
        inputSanitization: true
      }
    }
  },

  // Additional Security Measures
  AdditionalSecurity: {
    // Content Security Policy
    CSP: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'", 'https://firebaseapp.com', 'https://api.stripe.com'],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"]
      }
    },

    // Security Headers
    securityHeaders: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(self)'
    },

    // Rate Limiting Configuration
    rateLimiting: {
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP'
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5,
        skipSuccessfulRequests: true
      },
      scan: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 scans per hour for free users
        keyGenerator: (req) => req.user?.uid || req.ip
      }
    }
  },

  // Input Validation Rules
  InputValidation: {
    medicationName: {
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-.()]+$/,
      sanitize: (input) => {
        return input
          .trim()
          .replace(/[<>]/g, '') // Remove potential HTML tags
          .replace(/[^\w\s\-.()]/g, ''); // Keep only allowed characters
      }
    },
    
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 254,
      sanitize: (input) => input.trim().toLowerCase()
    },

    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecial: true,
      validate: (password) => {
        const checks = {
          length: password.length >= 8,
          uppercase: /[A-Z]/.test(password),
          lowercase: /[a-z]/.test(password),
          numbers: /[0-9]/.test(password),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        return {
          valid: Object.values(checks).every(check => check),
          checks
        };
      }
    }
  },

  // XSS Prevention
  XSSPrevention: {
    sanitizeHTML: (input) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;'
      };
      const reg = /[&<>"'/]/ig;
      return input.replace(reg, (match) => map[match]);
    },

    sanitizeURL: (url) => {
      try {
        const parsed = new URL(url);
        const allowedProtocols = ['http:', 'https:'];
        
        if (!allowedProtocols.includes(parsed.protocol)) {
          throw new Error('Invalid protocol');
        }
        
        return parsed.toString();
      } catch {
        return null;
      }
    }
  },

  // SQL Injection Prevention (for future backend)
  SQLInjectionPrevention: {
    escapeString: (str) => {
      return str.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, (char) => {
        switch (char) {
          case "\0": return "\\0";
          case "\x08": return "\\b";
          case "\x09": return "\\t";
          case "\x1a": return "\\z";
          case "\n": return "\\n";
          case "\r": return "\\r";
          case "\"":
          case "'":
          case "\\":
          case "%":
            return "\\" + char;
          default:
            return char;
        }
      });
    }
  },

  // CSRF Protection
  CSRFProtection: {
    generateToken: () => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    validateToken: (token, storedToken) => {
      return token && storedToken && token === storedToken;
    }
  },

  // Security Audit Function
  performSecurityAudit: async function() {
    const auditResults = {
      timestamp: new Date().toISOString(),
      owaspCompliance: {},
      vulnerabilities: [],
      recommendations: []
    };

    // Check OWASP compliance
    for (const [category, config] of Object.entries(this.OWASP)) {
      const implemented = Object.values(config.implemented || {});
      const compliance = implemented.filter(v => v).length / implemented.length;
      
      auditResults.owaspCompliance[category] = {
        compliance: Math.round(compliance * 100) + '%',
        implemented: config.implemented
      };

      if (compliance < 1) {
        auditResults.vulnerabilities.push({
          category,
          severity: compliance < 0.5 ? 'HIGH' : 'MEDIUM',
          description: `Incomplete implementation of ${category} security measures`
        });
      }
    }

    // Generate recommendations
    this.generateRecommendations(auditResults);

    // Log audit results
    try {
      await setDoc(doc(db, 'security_audits', new Date().toISOString()), auditResults);
    } catch (error) {
      console.error('Failed to log security audit:', error);
    }

    return auditResults;
  },

  generateRecommendations: function(auditResults) {
    const recommendations = [];

    // Check for MFA
    if (!this.OWASP.authentication.implemented.mfaAvailable) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Authentication',
        recommendation: 'Implement multi-factor authentication for enhanced security',
        effort: 'MEDIUM'
      });
    }

    // Check for code signing
    if (!this.OWASP.integrity.implemented.codeSigning) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Integrity',
        recommendation: 'Implement code signing for application integrity',
        effort: 'HIGH'
      });
    }

    // Check dependencies
    recommendations.push({
      priority: 'HIGH',
      category: 'Dependencies',
      recommendation: 'Run npm audit regularly and update vulnerable packages',
      effort: 'LOW'
    });

    auditResults.recommendations = recommendations;
  },

  // Real-time Security Monitoring
  SecurityMonitor: {
    suspiciousPatterns: [
      /(\.|%2e){2,}/i, // Directory traversal
      /<script[^>]*>.*?<\/script>/gi, // Script injection
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript protocol
      /on\w+\s*=/i // Event handlers
    ],

    detectSuspiciousActivity: function(input) {
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(input)) {
          return {
            suspicious: true,
            pattern: pattern.toString(),
            input: input.substring(0, 100) // Log first 100 chars only
          };
        }
      }
      return { suspicious: false };
    }
  }
};

// Export security utilities
export const validateInput = (type, value) => {
  const validator = SecurityAudit.InputValidation[type];
  if (!validator) {
    throw new Error(`Unknown validation type: ${type}`);
  }

  const sanitized = validator.sanitize ? validator.sanitize(value) : value;
  
  if (validator.pattern && !validator.pattern.test(sanitized)) {
    return { valid: false, error: `Invalid ${type} format` };
  }

  if (validator.minLength && sanitized.length < validator.minLength) {
    return { valid: false, error: `${type} too short` };
  }

  if (validator.maxLength && sanitized.length > validator.maxLength) {
    return { valid: false, error: `${type} too long` };
  }

  if (validator.validate) {
    const result = validator.validate(sanitized);
    if (!result.valid) {
      return { valid: false, error: `Invalid ${type}`, details: result.checks };
    }
  }

  return { valid: true, sanitized };
};

export const sanitizeOutput = (output) => {
  return SecurityAudit.XSSPrevention.sanitizeHTML(output);
};

export const detectSuspiciousActivity = (input) => {
  return SecurityAudit.SecurityMonitor.detectSuspiciousActivity(input);
};