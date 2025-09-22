// Security Middleware for API Protection
// Implements rate limiting, DDoS protection, and request validation
import { supabase } from '../config/supabase';
import CryptoJS from 'crypto-js';
class SecurityMiddleware {
  constructor() {
    // Rate limiting configuration
    this.rateLimits = new Map();
    this.blacklist = new Set();
    this.requestCounts = new Map();
    // Configuration
    this.config = {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // per window
        maxBurst: 10, // max requests per second
      },
      security: {
        maxPayloadSize: 10 * 1024 * 1024, // 10MB
        allowedOrigins: [
          'https://naturinex.com',
          'https://www.naturinex.com',
          'https://app.naturinex.com',
        ],
        blockedUserAgents: [
          'bot',
          'crawler',
          'spider',
          'scraper',
        ],
      },
    };
  }
  // Check rate limit
  checkRateLimit(identifier, endpoint = 'default') {
    const now = Date.now();
    const key = `${identifier}:${endpoint}`;
    // Get or create request history
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, []);
    }
    const requests = this.requestCounts.get(key);
    // Clean old requests
    const windowStart = now - this.config.rateLimit.windowMs;
    const recentRequests = requests.filter(time => time > windowStart);
    // Check if rate limit exceeded
    if (recentRequests.length >= this.config.rateLimit.maxRequests) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: Math.ceil((recentRequests[0] + this.config.rateLimit.windowMs - now) / 1000),
      };
    }
    // Check burst limit
    const oneSecondAgo = now - 1000;
    const burstRequests = recentRequests.filter(time => time > oneSecondAgo);
    if (burstRequests.length >= this.config.rateLimit.maxBurst) {
      return {
        allowed: false,
        reason: 'Burst limit exceeded',
        retryAfter: 1,
      };
    }
    // Add current request
    recentRequests.push(now);
    this.requestCounts.set(key, recentRequests);
    return {
      allowed: true,
      remaining: this.config.rateLimit.maxRequests - recentRequests.length,
      reset: new Date(windowStart + this.config.rateLimit.windowMs),
    };
  }
  // Validate request
  validateRequest(request) {
    const validations = [];
    // Check if IP is blacklisted
    if (this.blacklist.has(request.ip)) {
      return {
        valid: false,
        error: 'Access denied',
        code: 'BLACKLISTED',
      };
    }
    // Check origin
    if (request.origin && !this.isAllowedOrigin(request.origin)) {
      validations.push({
        field: 'origin',
        message: 'Invalid origin',
      });
    }
    // Check user agent
    if (this.isSuspiciousUserAgent(request.userAgent)) {
      validations.push({
        field: 'userAgent',
        message: 'Suspicious user agent detected',
      });
    }
    // Check payload size
    if (request.body && JSON.stringify(request.body).length > this.config.security.maxPayloadSize) {
      validations.push({
        field: 'body',
        message: 'Payload too large',
      });
    }
    // Check for SQL injection patterns
    if (this.hasSQLInjectionPattern(request)) {
      validations.push({
        field: 'params',
        message: 'Potential SQL injection detected',
      });
    }
    // Check for XSS patterns
    if (this.hasXSSPattern(request)) {
      validations.push({
        field: 'params',
        message: 'Potential XSS attack detected',
      });
    }
    if (validations.length > 0) {
      return {
        valid: false,
        errors: validations,
        code: 'VALIDATION_FAILED',
      };
    }
    return { valid: true };
  }
  // Check if origin is allowed
  isAllowedOrigin(origin) {
    // Allow localhost in development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return process.env.NODE_ENV === 'development';
    }
    return this.config.security.allowedOrigins.includes(origin);
  }
  // Check for suspicious user agents
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;
    const ua = userAgent.toLowerCase();
    // Check for blocked patterns
    for (const pattern of this.config.security.blockedUserAgents) {
      if (ua.includes(pattern) && !ua.includes('googlebot')) {
        return true;
      }
    }
    // Check for missing standard browser identifiers
    const hasBrowserId = ua.includes('mozilla') || 
                        ua.includes('chrome') || 
                        ua.includes('safari') || 
                        ua.includes('edge');
    return !hasBrowserId;
  }
  // Check for SQL injection patterns
  hasSQLInjectionPattern(request) {
    const suspiciousPatterns = [
      /('|(\-\-)|(;)|(\|\|)|(\/\*)|(\*\/))/gi,
      /(\bselect\b.*\bfrom\b)/gi,
      /(\bunion\b.*\bselect\b)/gi,
      /(\bdrop\b.*\btable\b)/gi,
      /(\binsert\b.*\binto\b)/gi,
      /(\bdelete\b.*\bfrom\b)/gi,
      /(\bupdate\b.*\bset\b)/gi,
      /(\bexec\b|\bexecute\b)/gi,
    ];
    const checkString = JSON.stringify(request.body || '') + 
                        JSON.stringify(request.params || '') +
                        JSON.stringify(request.query || '');
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(checkString)) {
        return true;
      }
    }
    return false;
  }
  // Check for XSS patterns
  hasXSSPattern(request) {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*onerror=/gi,
      /<svg[^>]*onload=/gi,
    ];
    const checkString = JSON.stringify(request.body || '') + 
                        JSON.stringify(request.params || '');
    for (const pattern of xssPatterns) {
      if (pattern.test(checkString)) {
        return true;
      }
    }
    return false;
  }
  // Generate request signature
  generateRequestSignature(request) {
    const data = {
      method: request.method,
      url: request.url,
      timestamp: Date.now(),
      body: request.body,
    };
    return CryptoJS.HmacSHA256(
      JSON.stringify(data),
      process.env.REACT_APP_REQUEST_SECRET || 'default-secret'
    ).toString();
  }
  // Verify request signature
  verifyRequestSignature(request, signature) {
    const expectedSignature = this.generateRequestSignature(request);
    return signature === expectedSignature;
  }
  // Add security headers
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline';",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(self)',
    };
  }
  // Log security event
  async logSecurityEvent(event) {
    try {
      await supabase.from('security_logs').insert({
        event_type: event.type,
        severity: event.severity,
        details: event.details,
        ip_address: event.ip,
        user_id: event.userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  // Block IP address
  async blockIP(ip, reason, duration = 3600000) {
    this.blacklist.add(ip);
    // Log blocking
    await this.logSecurityEvent({
      type: 'ip_blocked',
      severity: 'high',
      details: { reason, duration },
      ip,
    });
    // Auto-unblock after duration
    setTimeout(() => {
      this.blacklist.delete(ip);
    }, duration);
  }
  // Check for DDoS patterns
  detectDDoSPattern(requests) {
    // Check for sudden spike in requests
    const recentRequests = requests.filter(r => 
      Date.now() - r.timestamp < 60000 // Last minute
    );
    if (recentRequests.length > 1000) {
      return {
        detected: true,
        type: 'volume_spike',
        count: recentRequests.length,
      };
    }
    // Check for distributed pattern
    const uniqueIPs = new Set(recentRequests.map(r => r.ip));
    if (uniqueIPs.size > 100 && recentRequests.length / uniqueIPs.size > 50) {
      return {
        detected: true,
        type: 'distributed_attack',
        uniqueIPs: uniqueIPs.size,
      };
    }
    return { detected: false };
  }
  // Middleware function for Express/API routes
  middleware() {
    return async (req, res, next) => {
      try {
        // Get client IP
        const ip = req.ip || req.connection.remoteAddress;
        // Check rate limit
        const rateLimitResult = this.checkRateLimit(ip, req.path);
        if (!rateLimitResult.allowed) {
          await this.logSecurityEvent({
            type: 'rate_limit_exceeded',
            severity: 'medium',
            details: rateLimitResult,
            ip,
          });
          return res.status(429).json({
            error: rateLimitResult.reason,
            retryAfter: rateLimitResult.retryAfter,
          });
        }
        // Validate request
        const validation = this.validateRequest({
          ip,
          origin: req.get('origin'),
          userAgent: req.get('user-agent'),
          body: req.body,
          params: req.params,
          query: req.query,
          method: req.method,
          url: req.url,
        });
        if (!validation.valid) {
          await this.logSecurityEvent({
            type: 'validation_failed',
            severity: 'high',
            details: validation,
            ip,
          });
          // Block IP if multiple violations
          if (validation.code === 'VALIDATION_FAILED' && validation.errors.length > 2) {
            await this.blockIP(ip, 'Multiple security violations');
          }
          return res.status(400).json({
            error: 'Invalid request',
            code: validation.code,
          });
        }
        // Add security headers
        const headers = this.getSecurityHeaders();
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, value);
        }
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', this.config.rateLimit.maxRequests);
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimitResult.reset.toISOString());
        next();
      } catch (error) {
        console.error('Security middleware error:', error);
        res.status(500).json({ error: 'Internal security error' });
      }
    };
  }
  // Clean up old data
  cleanup() {
    const now = Date.now();
    const cutoff = now - this.config.rateLimit.windowMs;
    // Clean request counts
    for (const [key, requests] of this.requestCounts) {
      const filtered = requests.filter(time => time > cutoff);
      if (filtered.length === 0) {
        this.requestCounts.delete(key);
      } else {
        this.requestCounts.set(key, filtered);
      }
    }
  }
}
// Create singleton instance
const securityMiddleware = new SecurityMiddleware();
// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => securityMiddleware.cleanup(), 60000);
}
export default securityMiddleware;