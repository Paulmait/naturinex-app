/**
 * Security Tracking Service
 *
 * Tracks security-related events for monitoring and detecting suspicious activity:
 * - Password reset requests
 * - Failed login attempts
 * - Suspicious activity patterns
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://hxhbsxzkzarqwksbjpce.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4aGJzeHpremFycXdrc2JqcGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NjcyNjEsImV4cCI6MjA0OTI0MzI2MX0.D3_dM0VdmqPTN9qEhtuzEMwFXe6rjSsqHOvMcPOqf_o';

let supabase = null;

const getSupabase = () => {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
};

/**
 * Get client info (IP, user agent, etc.)
 */
const getClientInfo = () => {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    screenResolution: typeof window !== 'undefined'
      ? `${window.screen.width}x${window.screen.height}`
      : 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  };
};

/**
 * Track password reset request
 */
export const trackPasswordResetRequest = async (email, success, errorMessage = null) => {
  try {
    const clientInfo = getClientInfo();

    const { error } = await getSupabase()
      .from('password_reset_tracking')
      .insert({
        email: email.toLowerCase(),
        success,
        error_message: errorMessage,
        user_agent: clientInfo.userAgent,
        platform: clientInfo.platform,
        timezone: clientInfo.timezone,
        screen_resolution: clientInfo.screenResolution,
        requested_at: clientInfo.timestamp,
        request_source: 'web'
      });

    if (error) {
      console.error('Failed to track password reset:', error.message);
    }
  } catch (err) {
    console.error('Security tracking error:', err);
  }
};

/**
 * Track failed login attempt
 */
export const trackFailedLogin = async (email, errorCode) => {
  try {
    const clientInfo = getClientInfo();

    const { error } = await getSupabase()
      .from('failed_login_tracking')
      .insert({
        email: email.toLowerCase(),
        error_code: errorCode,
        user_agent: clientInfo.userAgent,
        platform: clientInfo.platform,
        timezone: clientInfo.timezone,
        attempted_at: clientInfo.timestamp,
        attempt_source: 'web'
      });

    if (error) {
      console.error('Failed to track login attempt:', error.message);
    }
  } catch (err) {
    console.error('Security tracking error:', err);
  }
};

/**
 * Check if email has too many reset requests (potential abuse)
 */
export const checkResetRateLimit = async (email) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await getSupabase()
      .from('password_reset_tracking')
      .select('id', { count: 'exact' })
      .eq('email', email.toLowerCase())
      .gte('requested_at', oneHourAgo);

    if (error) {
      console.error('Rate limit check error:', error.message);
      return { allowed: true, count: 0 };
    }

    const count = data?.length || 0;
    const maxResets = 5; // Max 5 resets per hour

    return {
      allowed: count < maxResets,
      count,
      remaining: Math.max(0, maxResets - count),
      message: count >= maxResets
        ? 'Too many password reset requests. Please try again in an hour.'
        : null
    };
  } catch (err) {
    console.error('Rate limit check error:', err);
    return { allowed: true, count: 0 };
  }
};

/**
 * Get password reset statistics for admin dashboard
 */
export const getPasswordResetStats = async (days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await getSupabase()
      .from('password_reset_tracking')
      .select('*')
      .gte('requested_at', startDate)
      .order('requested_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    // Aggregate statistics
    const stats = {
      totalRequests: data.length,
      successfulRequests: data.filter(r => r.success).length,
      failedRequests: data.filter(r => !r.success).length,
      uniqueEmails: [...new Set(data.map(r => r.email))].length,
      requestsByDay: {},
      topRequesters: {},
      suspiciousActivity: []
    };

    // Group by day
    data.forEach(record => {
      const day = record.requested_at.split('T')[0];
      stats.requestsByDay[day] = (stats.requestsByDay[day] || 0) + 1;
      stats.topRequesters[record.email] = (stats.topRequesters[record.email] || 0) + 1;
    });

    // Flag suspicious activity (more than 5 requests from same email)
    Object.entries(stats.topRequesters).forEach(([email, count]) => {
      if (count > 5) {
        stats.suspiciousActivity.push({
          email,
          count,
          severity: count > 10 ? 'high' : 'medium',
          message: `${count} password reset requests in ${days} days`
        });
      }
    });

    return stats;
  } catch (err) {
    console.error('Stats error:', err);
    return { error: err.message };
  }
};

export default {
  trackPasswordResetRequest,
  trackFailedLogin,
  checkResetRateLimit,
  getPasswordResetStats
};
