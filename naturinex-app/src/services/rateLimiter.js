// Rate Limiting Service
// Prevents abuse and enforces subscription tier limits

import { supabase } from '../config/supabase';
import auditLogger, { ACCESS_TYPES, RESOURCE_TYPES } from './auditLogger';
import ErrorService from './ErrorService';

const RATE_LIMITS = {
  anonymous: {
    scansPerDay: 3,
    scansPerMonth: 3,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  free: {
    scansPerMonth: 3,
    scansPerDay: 3,
    apiRequestsPerMinute: 10,
  },
  premium: {
    scansPerMonth: -1, // unlimited
    scansPerDay: -1, // unlimited
    apiRequestsPerMinute: 100,
  },
  // Backward compatibility aliases
  plus: {
    scansPerMonth: -1,
    scansPerDay: -1,
    apiRequestsPerMinute: 100,
  },
  pro: {
    scansPerMonth: -1,
    scansPerDay: -1,
    apiRequestsPerMinute: 100,
  },
};

class RateLimiter {
  constructor() {
    this.cache = new Map(); // In-memory cache for performance
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes

    // Cleanup old entries periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  /**
   * Check if user can perform action
   */
  async checkLimit(userId, action, tier = 'free') {
    try {
      const limits = RATE_LIMITS[tier] || RATE_LIMITS.free;

      // Check scan limits
      if (action === 'scan') {
        return await this.checkScanLimit(userId, tier, limits);
      }

      // Check API request limits
      if (action === 'api_request') {
        return await this.checkAPILimit(userId, limits);
      }

      return { allowed: true };
    } catch (error) {
      await ErrorService.logError(error, 'RateLimiter.checkLimit');
      // Fail open in case of errors (don't block users)
      return { allowed: true, error: true };
    }
  }

  /**
   * Check scan limits
   */
  async checkScanLimit(userId, tier, limits) {
    try {
      // Get current usage
      const usage = await this.getScanUsage(userId);

      // Check daily limit
      if (limits.scansPerDay !== -1 && usage.today >= limits.scansPerDay) {
        await this.logRateLimitExceeded(userId, 'scan', 'daily', usage.today, limits.scansPerDay);

        return {
          allowed: false,
          reason: 'daily_limit_exceeded',
          limit: limits.scansPerDay,
          used: usage.today,
          resetTime: this.getNextDayResetTime(),
          upgradeRequired: tier === 'free',
        };
      }

      // Check monthly limit
      if (limits.scansPerMonth !== -1 && usage.thisMonth >= limits.scansPerMonth) {
        await this.logRateLimitExceeded(userId, 'scan', 'monthly', usage.thisMonth, limits.scansPerMonth);

        return {
          allowed: false,
          reason: 'monthly_limit_exceeded',
          limit: limits.scansPerMonth,
          used: usage.thisMonth,
          resetTime: this.getNextMonthResetTime(),
          upgradeRequired: true,
        };
      }

      // Allowed
      return {
        allowed: true,
        remaining: {
          today: limits.scansPerDay === -1 ? -1 : limits.scansPerDay - usage.today,
          thisMonth: limits.scansPerMonth === -1 ? -1 : limits.scansPerMonth - usage.thisMonth,
        },
      };
    } catch (error) {
      await ErrorService.logError(error, 'RateLimiter.checkScanLimit');
      return { allowed: true, error: true };
    }
  }

  /**
   * Check API request rate limit
   */
  async checkAPILimit(userId, limits) {
    const key = `api_${userId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Get or create request log
    if (!this.cache.has(key)) {
      this.cache.set(key, []);
    }

    const requests = this.cache.get(key);

    // Remove old requests outside window
    const recentRequests = requests.filter(time => now - time < windowMs);

    // Check if limit exceeded
    if (recentRequests.length >= limits.apiRequestsPerMinute) {
      await this.logRateLimitExceeded(userId, 'api_request', 'minute', recentRequests.length, limits.apiRequestsPerMinute);

      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        limit: limits.apiRequestsPerMinute,
        used: recentRequests.length,
        resetTime: new Date(recentRequests[0] + windowMs),
      };
    }

    // Add current request
    recentRequests.push(now);
    this.cache.set(key, recentRequests);

    return {
      allowed: true,
      remaining: limits.apiRequestsPerMinute - recentRequests.length,
    };
  }

  /**
   * Get scan usage for user
   */
  async getScanUsage(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      // For anonymous users, use device fingerprint or IP
      const identifier = userId || 'anonymous';

      // Query scans from database
      const [todayResult, monthResult] = await Promise.all([
        supabase
          .from('scans')
          .select('id', { count: 'exact' })
          .eq('user_id', identifier)
          .gte('created_at', today.toISOString()),

        supabase
          .from('scans')
          .select('id', { count: 'exact' })
          .eq('user_id', identifier)
          .gte('created_at', thisMonth.toISOString()),
      ]);

      return {
        today: todayResult.count || 0,
        thisMonth: monthResult.count || 0,
      };
    } catch (error) {
      await ErrorService.logError(error, 'RateLimiter.getScanUsage');
      return { today: 0, thisMonth: 0 };
    }
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(userId, action) {
    try {
      // This is handled automatically by scan creation
      // But we can track additional metrics here
      const key = `${action}_${userId}_${new Date().toDateString()}`;
      const current = this.cache.get(key) || 0;
      this.cache.set(key, current + 1);

      return true;
    } catch (error) {
      await ErrorService.logError(error, 'RateLimiter.incrementUsage');
      return false;
    }
  }

  /**
   * Get rate limit status for user
   */
  async getRateLimitStatus(userId, tier = 'free') {
    try {
      const usage = await this.getScanUsage(userId);
      const limits = RATE_LIMITS[tier] || RATE_LIMITS.free;

      return {
        tier,
        limits: {
          scansPerDay: limits.scansPerDay,
          scansPerMonth: limits.scansPerMonth,
          apiRequestsPerMinute: limits.apiRequestsPerMinute,
        },
        usage: {
          today: usage.today,
          thisMonth: usage.thisMonth,
        },
        remaining: {
          today: limits.scansPerDay === -1 ? -1 : Math.max(0, limits.scansPerDay - usage.today),
          thisMonth: limits.scansPerMonth === -1 ? -1 : Math.max(0, limits.scansPerMonth - usage.thisMonth),
        },
        resetTimes: {
          daily: this.getNextDayResetTime(),
          monthly: this.getNextMonthResetTime(),
        },
      };
    } catch (error) {
      await ErrorService.logError(error, 'RateLimiter.getRateLimitStatus');
      throw new Error('Failed to get rate limit status');
    }
  }

  /**
   * Check if anonymous user can scan
   */
  async checkAnonymousLimit(identifier) {
    try {
      // Use device fingerprint or IP as identifier
      const usage = await this.getAnonymousUsage(identifier);
      const limits = RATE_LIMITS.anonymous;

      if (usage.today >= limits.scansPerDay) {
        return {
          allowed: false,
          reason: 'anonymous_daily_limit',
          message: 'Daily scan limit reached. Please sign in for more scans.',
          requiresAuth: true,
        };
      }

      return {
        allowed: true,
        remaining: limits.scansPerDay - usage.today,
        message: `${limits.scansPerDay - usage.today} free scans remaining today`,
      };
    } catch (error) {
      await ErrorService.logError(error, 'RateLimiter.checkAnonymousLimit');
      return { allowed: true, error: true };
    }
  }

  /**
   * Get anonymous user usage
   */
  async getAnonymousUsage(identifier) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('scans')
        .select('id', { count: 'exact' })
        .eq('device_fingerprint', identifier)
        .is('user_id', null)
        .gte('created_at', today.toISOString());

      return {
        today: count || 0,
        thisMonth: count || 0, // Simplified for anonymous
      };
    } catch (error) {
      return { today: 0, thisMonth: 0 };
    }
  }

  /**
   * Log rate limit exceeded event
   */
  async logRateLimitExceeded(userId, action, period, used, limit) {
    try {
      await auditLogger.logAccess({
        userId: userId || 'anonymous',
        action: ACCESS_TYPES.UNAUTHORIZED_ACCESS,
        resourceType: RESOURCE_TYPES.SCAN,
        status: 'blocked',
        metadata: {
          reason: 'rate_limit_exceeded',
          action,
          period,
          used,
          limit,
        },
      });
    } catch (error) {
      // Silent fail - don't break rate limiting if logging fails
    }
  }

  /**
   * Get next day reset time
   */
  getNextDayResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Get next month reset time
   */
  getNextMonthResetTime() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  }

  /**
   * Cleanup old cache entries
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, value] of this.cache.entries()) {
      // Remove old API request logs
      if (Array.isArray(value)) {
        const recent = value.filter(time => now - time < maxAge);
        if (recent.length === 0) {
          this.cache.delete(key);
        } else {
          this.cache.set(key, recent);
        }
      }

      // Remove old daily counters
      if (typeof value === 'number' && key.includes(new Date(now - 48 * 60 * 60 * 1000).toDateString())) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Reset usage for user (admin function)
   */
  async resetUsage(userId) {
    try {
      // Clear cache
      for (const key of this.cache.keys()) {
        if (key.includes(userId)) {
          this.cache.delete(key);
        }
      }

      await auditLogger.logAccess({
        userId,
        action: ACCESS_TYPES.UPDATE,
        resourceType: RESOURCE_TYPES.USER_PROFILE,
        metadata: { event: 'rate_limit_reset' },
      });

      return true;
    } catch (error) {
      await ErrorService.logError(error, 'RateLimiter.resetUsage');
      return false;
    }
  }

  /**
   * Get user tier from database
   */
  async getUserTier(userId) {
    try {
      if (!userId) return 'anonymous';

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();

      if (error || !data) return 'free';

      return data.subscription_tier || 'free';
    } catch (error) {
      return 'free';
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

export default rateLimiter;

// Export convenience functions
export const checkScanLimit = (userId, tier) => rateLimiter.checkLimit(userId, 'scan', tier);
export const checkAPILimit = (userId, tier) => rateLimiter.checkLimit(userId, 'api_request', tier);
export const checkAnonymousLimit = (identifier) => rateLimiter.checkAnonymousLimit(identifier);
export const getRateLimitStatus = (userId, tier) => rateLimiter.getRateLimitStatus(userId, tier);
export const incrementUsage = (userId, action) => rateLimiter.incrementUsage(userId, action);

// Export rate limits for reference
export { RATE_LIMITS };
