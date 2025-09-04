/**
 * Email Security Hardening Module
 * Production-grade security measures for email service
 */

const crypto = require('crypto');
const validator = require('validator');

class EmailSecurityHardening {
  constructor() {
    this.suspiciousPatterns = [
      /(<script|javascript:|onerror=|onclick=)/gi,
      /(base64|data:text\/html)/gi,
      /(<iframe|<embed|<object)/gi,
      /(\.exe|\.bat|\.cmd|\.scr|\.zip)/gi
    ];
    
    this.blockedDomains = new Set([
      'tempmail.com',
      'throwaway.email',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com',
      'trashmail.com'
    ]);

    this.ipBlacklist = new Map(); // IP -> { count, lastAttempt, blocked }
    this.emailBlacklist = new Map(); // email -> { reason, timestamp }
  }

  // Validate and sanitize email content
  sanitizeEmailContent(content) {
    if (!content) return '';
    
    // Remove any potential XSS attempts
    let sanitized = content;
    for (const pattern of this.suspiciousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    return sanitized;
  }

  // Advanced email validation
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Basic format validation
    if (!validator.isEmail(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Check length
    if (email.length > 254) {
      return { valid: false, reason: 'Email too long' };
    }

    // Check for disposable domains
    const domain = email.split('@')[1].toLowerCase();
    if (this.blockedDomains.has(domain)) {
      return { valid: false, reason: 'Disposable email not allowed' };
    }

    // Check blacklist
    if (this.emailBlacklist.has(email)) {
      const blacklistInfo = this.emailBlacklist.get(email);
      return { valid: false, reason: `Blacklisted: ${blacklistInfo.reason}` };
    }

    // Check for suspicious patterns
    if (email.includes('..') || email.includes('--')) {
      return { valid: false, reason: 'Suspicious email pattern' };
    }

    // DNS validation would go here in production
    // This would check MX records for the domain

    return { valid: true };
  }

  // Rate limiting with exponential backoff
  checkRateLimit(identifier, limits = {}) {
    const defaultLimits = {
      perMinute: 3,
      perHour: 10,
      perDay: 50,
      ...limits
    };

    const now = Date.now();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (!this.rateLimits) {
      this.rateLimits = new Map();
    }

    if (!this.rateLimits.has(identifier)) {
      this.rateLimits.set(identifier, []);
    }

    const attempts = this.rateLimits.get(identifier);
    
    // Clean old attempts
    const validAttempts = attempts.filter(time => now - time < day);
    this.rateLimits.set(identifier, validAttempts);

    // Check limits
    const lastMinute = validAttempts.filter(time => now - time < minute).length;
    const lastHour = validAttempts.filter(time => now - time < hour).length;
    const lastDay = validAttempts.length;

    if (lastMinute >= defaultLimits.perMinute) {
      return { 
        allowed: false, 
        reason: 'Too many requests per minute',
        retryAfter: minute - (now - Math.min(...validAttempts.filter(time => now - time < minute)))
      };
    }

    if (lastHour >= defaultLimits.perHour) {
      return { 
        allowed: false, 
        reason: 'Too many requests per hour',
        retryAfter: hour - (now - Math.min(...validAttempts.filter(time => now - time < hour)))
      };
    }

    if (lastDay >= defaultLimits.perDay) {
      return { 
        allowed: false, 
        reason: 'Daily limit exceeded',
        retryAfter: day - (now - Math.min(...validAttempts))
      };
    }

    // Add current attempt
    validAttempts.push(now);
    this.rateLimits.set(identifier, validAttempts);

    return { allowed: true };
  }

  // IP-based security
  checkIPSecurity(ip) {
    if (!ip) return { allowed: true };

    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    if (this.ipBlacklist.has(ip)) {
      const ipInfo = this.ipBlacklist.get(ip);
      
      // Check if temporarily blocked
      if (ipInfo.blocked && ipInfo.blockedUntil > now) {
        return {
          allowed: false,
          reason: 'IP temporarily blocked',
          blockedUntil: ipInfo.blockedUntil
        };
      }

      // Check suspicious activity
      if (ipInfo.count > 100 && ipInfo.lastAttempt > hourAgo) {
        // Block for 1 hour
        ipInfo.blocked = true;
        ipInfo.blockedUntil = now + (60 * 60 * 1000);
        this.ipBlacklist.set(ip, ipInfo);
        
        return {
          allowed: false,
          reason: 'Suspicious activity detected',
          blockedUntil: ipInfo.blockedUntil
        };
      }

      // Update count
      ipInfo.count = (ipInfo.lastAttempt > hourAgo ? ipInfo.count : 0) + 1;
      ipInfo.lastAttempt = now;
      this.ipBlacklist.set(ip, ipInfo);
    } else {
      this.ipBlacklist.set(ip, {
        count: 1,
        lastAttempt: now,
        blocked: false
      });
    }

    return { allowed: true };
  }

  // Generate secure tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate time-limited token
  generateTimeLimitedToken(data, expiryMinutes = 60) {
    const expiry = Date.now() + (expiryMinutes * 60 * 1000);
    const payload = JSON.stringify({ data, expiry });
    
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
    let encrypted = cipher.update(payload, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  // Verify time-limited token
  verifyTimeLimitedToken(token) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
      let decrypted = decipher.update(token, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const { data, expiry } = JSON.parse(decrypted);
      
      if (Date.now() > expiry) {
        return { valid: false, reason: 'Token expired' };
      }
      
      return { valid: true, data };
    } catch (error) {
      return { valid: false, reason: 'Invalid token' };
    }
  }

  // HMAC signature for webhook security
  generateWebhookSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = this.generateWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Check for email bombing attempts
  detectEmailBombing(recipient, timeWindow = 300000) { // 5 minutes
    if (!this.emailBombTracking) {
      this.emailBombTracking = new Map();
    }

    const now = Date.now();
    const key = recipient.toLowerCase();

    if (!this.emailBombTracking.has(key)) {
      this.emailBombTracking.set(key, []);
    }

    const attempts = this.emailBombTracking.get(key);
    const recentAttempts = attempts.filter(time => now - time < timeWindow);
    
    // Update with cleaned attempts
    this.emailBombTracking.set(key, recentAttempts);

    // Detect bombing (more than 5 emails in 5 minutes)
    if (recentAttempts.length >= 5) {
      // Add to blacklist
      this.emailBlacklist.set(recipient, {
        reason: 'Email bombing detected',
        timestamp: now
      });
      
      return {
        detected: true,
        count: recentAttempts.length,
        action: 'blocked'
      };
    }

    // Add current attempt
    recentAttempts.push(now);
    this.emailBombTracking.set(key, recentAttempts);

    return { detected: false };
  }

  // Content Security Policy for email templates
  getEmailCSP() {
    return {
      'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };
  }

  // Encrypt sensitive data
  encryptSensitiveData(data) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!', 'utf8').slice(0, 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt sensitive data
  decryptSensitiveData(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!', 'utf8').slice(0, 32);
    
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Clean up old blacklist entries
  cleanupBlacklists(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    
    // Clean IP blacklist
    for (const [ip, info] of this.ipBlacklist.entries()) {
      if (now - info.lastAttempt > maxAge) {
        this.ipBlacklist.delete(ip);
      }
    }

    // Clean email blacklist
    for (const [email, info] of this.emailBlacklist.entries()) {
      if (now - info.timestamp > maxAge * 7) { // Keep for 7 days
        this.emailBlacklist.delete(email);
      }
    }

    // Clean rate limits
    if (this.rateLimits) {
      for (const [key, attempts] of this.rateLimits.entries()) {
        const validAttempts = attempts.filter(time => now - time < maxAge);
        if (validAttempts.length === 0) {
          this.rateLimits.delete(key);
        } else {
          this.rateLimits.set(key, validAttempts);
        }
      }
    }
  }

  // Security audit log
  logSecurityEvent(event, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity: this.getEventSeverity(event)
    };

    // In production, this would write to a security log file or service
    console.log('SECURITY_EVENT:', JSON.stringify(logEntry));

    // Critical events could trigger alerts
    if (logEntry.severity === 'CRITICAL') {
      this.sendSecurityAlert(logEntry);
    }

    return logEntry;
  }

  // Determine event severity
  getEventSeverity(event) {
    const criticalEvents = ['EMAIL_BOMBING', 'WEBHOOK_FORGERY', 'XSS_ATTEMPT'];
    const highEvents = ['RATE_LIMIT_EXCEEDED', 'IP_BLOCKED', 'INVALID_TOKEN'];
    
    if (criticalEvents.includes(event)) return 'CRITICAL';
    if (highEvents.includes(event)) return 'HIGH';
    return 'MEDIUM';
  }

  // Send security alerts
  async sendSecurityAlert(event) {
    // In production, this would send to monitoring service
    console.error('🚨 SECURITY ALERT:', event);
    
    // Could integrate with PagerDuty, Slack, etc.
    // await notificationService.sendAlert({
    //   channel: 'security',
    //   priority: 'high',
    //   event
    // });
  }
}

module.exports = new EmailSecurityHardening();