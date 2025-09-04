let admin;
let jwt;

try {
  admin = require('firebase-admin');
} catch (error) {
  console.warn('Firebase Admin not available - Firebase auth disabled');
}

try {
  jwt = require('jsonwebtoken');
} catch (error) {
  console.warn('JWT not available - JWT auth features limited');
}

const crypto = require('crypto');

class AuthMiddleware {
  constructor() {
    this.sessionStore = new Map();
    this.rateLimitStore = new Map();
    this.blacklistedTokens = new Set();
    this.suspiciousActivity = new Map();
  }

  async verifyFirebaseToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid authentication token provided'
        });
      }

      const token = authHeader.split('Bearer ')[1];
      
      // Check if token is blacklisted
      if (this.blacklistedTokens.has(token)) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has been revoked'
        });
      }

      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token, true);
      
      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < now) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired'
        });
      }

      // Check if user is disabled
      const userRecord = await admin.auth().getUser(decodedToken.uid);
      if (userRecord.disabled) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User account has been disabled'
        });
      }

      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        phoneNumber: decodedToken.phone_number,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        customClaims: decodedToken.customClaims || {},
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime
        }
      };

      // Track session
      this.trackSession(req.user.uid, token);
      
      // Log authentication for compliance
      if (global.complianceMonitor) {
        await global.complianceMonitor.logDataAccess(
          req.user.uid,
          'AUTHENTICATION',
          'TOKEN_VERIFY',
          req.ip
        );
      }

      next();
    } catch (error) {
      console.error('Auth verification error:', error);
      
      // Track suspicious activity
      this.trackSuspiciousActivity(req.ip, error.code);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has been revoked',
          code: 'TOKEN_REVOKED'
        });
      }
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      });
    }
  }

  requireEmailVerification(req, res, next) {
    if (!req.user || !req.user.emailVerified) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    next();
  }

  requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userRole = req.user.customClaims?.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient privileges',
          required: allowedRoles,
          current: userRole
        });
      }

      next();
    };
  }

  requireSubscriptionTier(...allowedTiers) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userTier = req.user.customClaims?.tier || 'free';
      
      if (!allowedTiers.includes(userTier)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Upgrade required',
          required: allowedTiers,
          current: userTier
        });
      }

      next();
    };
  }

  async revokeToken(token) {
    this.blacklistedTokens.add(token);
    
    // Clean old tokens periodically
    if (this.blacklistedTokens.size > 10000) {
      const oldestTokens = Array.from(this.blacklistedTokens).slice(0, 5000);
      oldestTokens.forEach(t => this.blacklistedTokens.delete(t));
    }
  }

  async revokeAllUserTokens(uid) {
    try {
      await admin.auth().revokeRefreshTokens(uid);
      
      // Remove user sessions
      for (const [sessionId, session] of this.sessionStore.entries()) {
        if (session.uid === uid) {
          this.sessionStore.delete(sessionId);
          this.blacklistedTokens.add(session.token);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to revoke user tokens:', error);
      return false;
    }
  }

  trackSession(uid, token) {
    const sessionId = crypto.randomUUID();
    this.sessionStore.set(sessionId, {
      uid,
      token,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });
    
    // Clean old sessions
    if (this.sessionStore.size > 10000) {
      const oldestSessions = Array.from(this.sessionStore.entries())
        .slice(0, 5000);
      oldestSessions.forEach(([id]) => this.sessionStore.delete(id));
    }
  }

  trackSuspiciousActivity(ip, errorCode) {
    const activity = this.suspiciousActivity.get(ip) || {
      attempts: 0,
      errors: [],
      firstAttempt: new Date().toISOString()
    };
    
    activity.attempts++;
    activity.errors.push({
      code: errorCode,
      timestamp: new Date().toISOString()
    });
    activity.lastAttempt = new Date().toISOString();
    
    this.suspiciousActivity.set(ip, activity);
    
    // Auto-block after too many failed attempts
    if (activity.attempts > 10) {
      if (global.complianceMonitor) {
        global.complianceMonitor.logSecurityIncident(
          'BRUTE_FORCE_ATTEMPT',
          'HIGH',
          { ip, attempts: activity.attempts }
        );
      }
    }
    
    // Clean old entries
    if (this.suspiciousActivity.size > 1000) {
      const oldestEntries = Array.from(this.suspiciousActivity.entries())
        .slice(0, 500);
      oldestEntries.forEach(([ip]) => this.suspiciousActivity.delete(ip));
    }
  }

  generateApiKey(userId, scope = 'full') {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const keyData = {
      userId,
      scope,
      created: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0
    };
    
    // Store with hashed key
    this.apiKeyStore = this.apiKeyStore || new Map();
    this.apiKeyStore.set(hashedKey, keyData);
    
    return apiKey;
  }

  verifyApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required'
      });
    }
    
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyData = this.apiKeyStore?.get(hashedKey);
    
    if (!keyData) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }
    
    // Update usage stats
    keyData.lastUsed = new Date().toISOString();
    keyData.usageCount++;
    
    req.apiKey = keyData;
    next();
  }

  optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Continue without authentication
      req.user = null;
      return next();
    }
    
    // Try to verify token but don't block if it fails
    this.verifyFirebaseToken(req, res, (err) => {
      if (err) {
        req.user = null;
      }
      next();
    });
  }

  async cleanupSessions() {
    const now = new Date();
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of this.sessionStore.entries()) {
      const lastActivity = new Date(session.lastActivity);
      if (now - lastActivity > sessionTimeout) {
        this.sessionStore.delete(sessionId);
      }
    }
  }
}

module.exports = new AuthMiddleware();