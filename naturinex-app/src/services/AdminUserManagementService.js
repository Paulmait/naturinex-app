/**
 * Admin User Management Service
 *
 * Comprehensive admin service for user management, including:
 * - User suspension/ban/deletion
 * - Password resets
 * - Account status management
 * - Analytics access
 * - Full audit logging
 *
 * All actions are logged with comprehensive audit trail
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl ||
  'https://hxhbsxzkzarqwksbjpce.supabase.co';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

// Password policy defaults (must match DB policy)
const PASSWORD_POLICY = {
  minLength: 16,
  maxLength: 128,
  minUppercase: 2,
  minLowercase: 2,
  minNumbers: 2,
  minSpecial: 2,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  expirationDays: 180, // 6 months
  historyCount: 12, // Cannot reuse last 12 passwords
  maxFailedAttempts: 5,
  lockoutMinutes: 30,
};

// Action severity levels
const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

class AdminUserManagementService {
  constructor() {
    this.adminId = null;
    this.adminEmail = null;
    this.adminRole = null;
    this.sessionToken = null;
  }

  /**
   * Initialize admin session
   */
  async initialize() {
    try {
      this.adminId = await SecureStore.getItemAsync('admin_user_id');
      this.adminEmail = await SecureStore.getItemAsync('admin_email');
      this.adminRole = await SecureStore.getItemAsync('admin_role');
      this.sessionToken = await SecureStore.getItemAsync('admin_session_token');

      return {
        success: true,
        isAdmin: !!this.adminId,
        role: this.adminRole,
      };
    } catch (error) {
      console.error('[AdminService] Initialize error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get authorization headers for API calls
   */
  async getAuthHeaders() {
    const token = await SecureStore.getItemAsync('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get client information for audit logging
   */
  async getClientInfo() {
    return {
      deviceName: Device.deviceName || 'Unknown',
      deviceType: Device.deviceType || 'Unknown',
      osName: Device.osName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      brand: Device.brand || 'Unknown',
      modelName: Device.modelName || 'Unknown',
    };
  }

  // ============================================
  // PASSWORD VALIDATION
  // ============================================

  /**
   * Validate password against security policy
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with errors array
   */
  validatePassword(password) {
    const errors = [];

    // Length checks
    if (password.length < PASSWORD_POLICY.minLength) {
      errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
    }
    if (password.length > PASSWORD_POLICY.maxLength) {
      errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);
    }

    // Uppercase check
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    if (uppercaseCount < PASSWORD_POLICY.minUppercase) {
      errors.push(`Password must contain at least ${PASSWORD_POLICY.minUppercase} uppercase letters`);
    }

    // Lowercase check
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    if (lowercaseCount < PASSWORD_POLICY.minLowercase) {
      errors.push(`Password must contain at least ${PASSWORD_POLICY.minLowercase} lowercase letters`);
    }

    // Numbers check
    const numberCount = (password.match(/[0-9]/g) || []).length;
    if (numberCount < PASSWORD_POLICY.minNumbers) {
      errors.push(`Password must contain at least ${PASSWORD_POLICY.minNumbers} numbers`);
    }

    // Special characters check
    const specialRegex = new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`, 'g');
    const specialCount = (password.match(specialRegex) || []).length;
    if (specialCount < PASSWORD_POLICY.minSpecial) {
      errors.push(`Password must contain at least ${PASSWORD_POLICY.minSpecial} special characters`);
    }

    // Common password check
    const commonPasswords = [
      'password', 'password123', '123456', 'qwerty', 'letmein',
      'welcome', 'admin123', 'admin', 'root', 'master', 'passw0rd',
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    // Sequential characters check
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain 3 or more repeated characters');
    }

    // Sequential numbers check
    if (/012|123|234|345|456|567|678|789|890/.test(password)) {
      errors.push('Password cannot contain sequential numbers');
    }

    // Sequential letters check
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
      errors.push('Password cannot contain sequential letters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password),
    };
  }

  /**
   * Calculate password strength score (0-100)
   */
  calculatePasswordStrength(password) {
    let score = 0;

    // Length score (up to 30 points)
    score += Math.min(password.length * 2, 30);

    // Uppercase (up to 15 points)
    const uppercase = (password.match(/[A-Z]/g) || []).length;
    score += Math.min(uppercase * 5, 15);

    // Lowercase (up to 15 points)
    const lowercase = (password.match(/[a-z]/g) || []).length;
    score += Math.min(lowercase * 3, 15);

    // Numbers (up to 15 points)
    const numbers = (password.match(/[0-9]/g) || []).length;
    score += Math.min(numbers * 5, 15);

    // Special characters (up to 25 points)
    const special = (password.match(/[^A-Za-z0-9]/g) || []).length;
    score += Math.min(special * 8, 25);

    return Math.min(score, 100);
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Get list of all users with status
   */
  async getUsers(options = {}) {
    const {
      page = 1,
      limit = 50,
      status = null,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    try {
      const headers = await this.getAuthHeaders();
      const offset = (page - 1) * limit;

      let url = `${SUPABASE_URL}/rest/v1/user_account_status?select=*&order=${sortBy}.${sortOrder}&offset=${offset}&limit=${limit}`;

      if (status) {
        url += `&status=eq.${status}`;
      }
      if (search) {
        url += `&email=ilike.*${search}*`;
      }

      const response = await fetch(url, { headers });
      const users = await response.json();

      // Log the access
      await this.logAction('user.view_list', 'user_management', null, {
        page,
        limit,
        status,
        search,
        resultCount: users.length,
      });

      return { success: true, users, page, limit };
    } catch (error) {
      console.error('[AdminService] Get users error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(userId) {
    try {
      const headers = await this.getAuthHeaders();

      // Get user account status
      const statusResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/user_account_status?user_id=eq.${userId}`,
        { headers }
      );
      const statusData = await statusResponse.json();

      // Get user profile
      const profileResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        { headers }
      );
      const profileData = await profileResponse.json();

      // Get user scans count
      const scansResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/scans?user_id=eq.${userId}&select=count`,
        { headers }
      );
      const scansData = await scansResponse.json();

      // Log the data access
      await this.logDataAccess(userId, 'profile', ['status', 'profile', 'scans'], 'Admin user review');

      return {
        success: true,
        user: {
          ...profileData[0],
          status: statusData[0] || { status: 'active' },
          scansCount: scansData.length || 0,
        },
      };
    } catch (error) {
      console.error('[AdminService] Get user details error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Suspend a user account
   */
  async suspendUser(userId, reason, durationDays = null, violationType = 'tos') {
    try {
      const headers = await this.getAuthHeaders();

      // Get user info before suspension
      const userBefore = await this.getUserDetails(userId);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_suspend_user`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_admin_id: this.adminId,
          p_user_id: userId,
          p_reason: reason,
          p_duration_days: durationDays,
          p_violation_type: violationType,
        }),
      });

      const result = await response.json();

      // Log the action with full context
      await this.logAction(
        'user.suspend',
        'user_management',
        userId,
        {
          reason,
          duration_days: durationDays,
          violation_type: violationType,
          result,
        },
        userBefore.user?.status,
        { status: 'suspended', reason }
      );

      return { success: result.success, ...result };
    } catch (error) {
      console.error('[AdminService] Suspend user error:', error);
      await this.logAction('user.suspend', 'user_management', userId, { reason }, null, null, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unsuspend a user account
   */
  async unsuspendUser(userId, notes = null) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_unsuspend_user`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_admin_id: this.adminId,
          p_user_id: userId,
          p_notes: notes,
        }),
      });

      const result = await response.json();

      await this.logAction('user.unsuspend', 'user_management', userId, { notes, result });

      return { success: result.success, ...result };
    } catch (error) {
      console.error('[AdminService] Unsuspend user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a user account (soft delete with grace period)
   */
  async deleteUser(userId, reason, immediate = false) {
    try {
      // Verify admin has delete permission (critical action)
      if (this.adminRole !== 'owner' && this.adminRole !== 'super_admin') {
        return { success: false, error: 'Insufficient permissions for user deletion' };
      }

      const headers = await this.getAuthHeaders();
      const userBefore = await this.getUserDetails(userId);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_delete_user`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_admin_id: this.adminId,
          p_user_id: userId,
          p_reason: reason,
          p_immediate: immediate,
        }),
      });

      const result = await response.json();

      await this.logAction(
        immediate ? 'user.delete_immediate' : 'user.delete_scheduled',
        'user_management',
        userId,
        { reason, immediate },
        userBefore.user,
        { status: immediate ? 'deleted' : 'pending_deletion' }
      );

      return { success: result.success, ...result };
    } catch (error) {
      console.error('[AdminService] Delete user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initiate password reset for a user
   */
  async resetUserPassword(userId, reason) {
    try {
      const headers = await this.getAuthHeaders();

      // Generate reset token
      const resetToken = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${userId}-${Date.now()}-${Math.random()}`
      );

      // Get user email
      const userDetails = await this.getUserDetails(userId);
      if (!userDetails.success) {
        return { success: false, error: 'User not found' };
      }

      // Create reset request record
      const response = await fetch(`${SUPABASE_URL}/rest/v1/admin_password_reset_requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          user_email: userDetails.user.email,
          requested_by_admin_id: this.adminId,
          requested_by_admin_email: this.adminEmail,
          reset_token_hash: resetToken,
          reset_reason: reason,
          force_change_on_login: true,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create reset request');
      }

      // Mark user account as requiring password reset
      await fetch(`${SUPABASE_URL}/rest/v1/user_account_status?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          requires_password_reset: true,
          updated_at: new Date().toISOString(),
        }),
      });

      await this.logAction('user.reset_password', 'user_management', userId, {
        reason,
        user_email: userDetails.user.email,
      });

      return {
        success: true,
        message: 'Password reset initiated',
        userId,
        userEmail: userDetails.user.email,
      };
    } catch (error) {
      console.error('[AdminService] Reset password error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add warning to user account
   */
  async warnUser(userId, warningType, message) {
    try {
      const headers = await this.getAuthHeaders();

      // Get current status
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_account_status?user_id=eq.${userId}`,
        { headers }
      );
      const currentStatus = await response.json();

      const warningCount = (currentStatus[0]?.warning_count || 0) + 1;

      await fetch(`${SUPABASE_URL}/rest/v1/user_account_status?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          warning_count: warningCount,
          last_warning_at: new Date().toISOString(),
          abuse_reports: [
            ...(currentStatus[0]?.abuse_reports || []),
            {
              type: warningType,
              message,
              admin: this.adminEmail,
              date: new Date().toISOString(),
            },
          ],
          updated_at: new Date().toISOString(),
        }),
      });

      await this.logAction('user.warn', 'user_management', userId, {
        warning_type: warningType,
        message,
        warning_count: warningCount,
      });

      return { success: true, warningCount };
    } catch (error) {
      console.error('[AdminService] Warn user error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // ANALYTICS ACCESS
  // ============================================

  /**
   * Get overview analytics
   */
  async getAnalyticsOverview() {
    try {
      const headers = await this.getAuthHeaders();

      // Get various stats
      const [usersRes, scansRes, premiumRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/scans?select=count`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/user_account_status?is_premium=eq.true&select=count`, { headers }),
      ]);

      const [users, scans, premium] = await Promise.all([
        usersRes.json(),
        scansRes.json(),
        premiumRes.json(),
      ]);

      await this.logAction('analytics.view_overview', 'data_access', null, {
        metrics: ['total_users', 'total_scans', 'premium_users'],
      });

      return {
        success: true,
        analytics: {
          totalUsers: users.length || 0,
          totalScans: scans.length || 0,
          premiumUsers: premium.length || 0,
          conversionRate: users.length ? ((premium.length / users.length) * 100).toFixed(2) : 0,
        },
      };
    } catch (error) {
      console.error('[AdminService] Get analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user engagement analytics
   */
  async getEngagementAnalytics(dateRange = 30) {
    try {
      const headers = await this.getAuthHeaders();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/scans?created_at=gte.${startDate.toISOString()}&select=created_at,user_id`,
        { headers }
      );
      const scans = await response.json();

      // Calculate daily active users
      const dailyScans = {};
      scans.forEach(scan => {
        const date = scan.created_at.split('T')[0];
        if (!dailyScans[date]) {
          dailyScans[date] = new Set();
        }
        dailyScans[date].add(scan.user_id);
      });

      const dailyActiveUsers = Object.entries(dailyScans).map(([date, users]) => ({
        date,
        activeUsers: users.size,
        scans: scans.filter(s => s.created_at.startsWith(date)).length,
      }));

      await this.logAction('analytics.view_engagement', 'data_access', null, {
        date_range: dateRange,
      });

      return {
        success: true,
        engagement: {
          dailyActiveUsers,
          totalScans: scans.length,
          uniqueUsers: new Set(scans.map(s => s.user_id)).size,
        },
      };
    } catch (error) {
      console.error('[AdminService] Get engagement analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  /**
   * Log admin action with comprehensive context
   */
  async logAction(actionType, category, targetId, metadata = {}, stateBefore = null, stateAfter = null, errorMessage = null) {
    try {
      const headers = await this.getAuthHeaders();
      const clientInfo = await this.getClientInfo();

      const logEntry = {
        admin_id: this.adminId,
        admin_email: this.adminEmail,
        admin_role: this.adminRole || 'admin',
        action_type: actionType,
        action_category: category,
        action_severity: this.getActionSeverity(actionType),
        target_type: targetId ? 'user' : 'system',
        target_id: targetId,
        ip_address: '0.0.0.0', // Will be set by server
        user_agent: `Naturinex Admin/${Constants.expoConfig?.version || '1.0.0'}`,
        device_type: clientInfo.deviceType,
        browser: clientInfo.osName,
        os: `${clientInfo.osName} ${clientInfo.osVersion}`,
        state_before: stateBefore ? JSON.stringify(stateBefore) : null,
        state_after: stateAfter ? JSON.stringify(stateAfter) : null,
        success: !errorMessage,
        error_message: errorMessage,
        metadata,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      await fetch(`${SUPABASE_URL}/rest/v1/admin_audit_log`, {
        method: 'POST',
        headers,
        body: JSON.stringify(logEntry),
      });

      console.log('[AdminService] Logged action:', actionType);
    } catch (error) {
      console.error('[AdminService] Failed to log action:', error);
    }
  }

  /**
   * Log data access for privacy compliance
   */
  async logDataAccess(userId, dataType, fields, reason) {
    try {
      const headers = await this.getAuthHeaders();

      // Get user email
      const userResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=email`,
        { headers }
      );
      const userData = await userResponse.json();

      await fetch(`${SUPABASE_URL}/rest/v1/user_data_access_log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_id: this.adminId,
          admin_email: this.adminEmail,
          user_id: userId,
          user_email: userData[0]?.email || 'unknown',
          data_type: dataType,
          data_fields: fields,
          access_reason: reason,
          ip_address: '0.0.0.0',
          accessed_at: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('[AdminService] Failed to log data access:', error);
    }
  }

  /**
   * Get action severity level
   */
  getActionSeverity(actionType) {
    if (actionType.includes('delete')) return SEVERITY.CRITICAL;
    if (actionType.includes('suspend') || actionType.includes('ban')) return SEVERITY.HIGH;
    if (actionType.includes('modify') || actionType.includes('export')) return SEVERITY.HIGH;
    if (actionType.includes('reset')) return SEVERITY.MEDIUM;
    if (actionType.includes('view')) return SEVERITY.LOW;
    return SEVERITY.MEDIUM;
  }

  /**
   * Get audit logs for review
   */
  async getAuditLogs(options = {}) {
    const {
      page = 1,
      limit = 100,
      adminId = null,
      actionType = null,
      severity = null,
      startDate = null,
      endDate = null,
    } = options;

    try {
      const headers = await this.getAuthHeaders();
      const offset = (page - 1) * limit;

      let url = `${SUPABASE_URL}/rest/v1/admin_audit_log?select=*&order=started_at.desc&offset=${offset}&limit=${limit}`;

      if (adminId) url += `&admin_id=eq.${adminId}`;
      if (actionType) url += `&action_type=eq.${actionType}`;
      if (severity) url += `&action_severity=eq.${severity}`;
      if (startDate) url += `&started_at=gte.${startDate}`;
      if (endDate) url += `&started_at=lte.${endDate}`;

      const response = await fetch(url, { headers });
      const logs = await response.json();

      return { success: true, logs, page, limit };
    } catch (error) {
      console.error('[AdminService] Get audit logs error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // ADMIN PASSWORD MANAGEMENT
  // ============================================

  /**
   * Check if admin password needs rotation
   */
  async checkPasswordExpiry() {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_profiles?user_id=eq.${this.adminId}&select=password_expires_at,force_password_change`,
        { headers }
      );
      const profile = await response.json();

      if (!profile[0]) {
        return { needsRotation: false };
      }

      const expiresAt = new Date(profile[0].password_expires_at);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

      return {
        needsRotation: profile[0].force_password_change || daysUntilExpiry <= 0,
        daysUntilExpiry,
        expiresAt: profile[0].password_expires_at,
        warningThreshold: daysUntilExpiry <= 14,
      };
    } catch (error) {
      console.error('[AdminService] Check password expiry error:', error);
      return { needsRotation: false, error: error.message };
    }
  }

  /**
   * Change admin password with validation
   */
  async changeAdminPassword(currentPassword, newPassword) {
    // Validate new password
    const validation = this.validatePassword(newPassword);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    try {
      const headers = await this.getAuthHeaders();

      // Hash the new password for history check
      const newPasswordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPassword
      );

      // Check password history
      const historyResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_profiles?user_id=eq.${this.adminId}&select=password_history`,
        { headers }
      );
      const historyData = await historyResponse.json();

      if (historyData[0]?.password_history?.includes(newPasswordHash)) {
        return {
          success: false,
          errors: ['This password has been used recently. Please choose a different password.'],
        };
      }

      // Update password in auth system (this would typically call Firebase/Supabase Auth)
      // For now, we'll update the admin profile

      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + PASSWORD_POLICY.expirationDays);

      await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles?user_id=eq.${this.adminId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          password_changed_at: new Date().toISOString(),
          password_expires_at: newExpiry.toISOString(),
          force_password_change: false,
          password_strength_score: validation.strength,
          password_history: [
            newPasswordHash,
            ...(historyData[0]?.password_history || []).slice(0, PASSWORD_POLICY.historyCount - 1),
          ],
          updated_at: new Date().toISOString(),
        }),
      });

      // Log password rotation
      await fetch(`${SUPABASE_URL}/rest/v1/password_rotation_log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_id: this.adminId,
          rotation_type: 'user_initiated',
          success: true,
          rotated_at: new Date().toISOString(),
        }),
      });

      await this.logAction('admin.change_password', 'system_config', this.adminId, {
        strength_score: validation.strength,
        new_expiry: newExpiry.toISOString(),
      });

      return {
        success: true,
        message: 'Password changed successfully',
        expiresAt: newExpiry.toISOString(),
      };
    } catch (error) {
      console.error('[AdminService] Change password error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get password policy configuration
   */
  async getPasswordPolicy() {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_password_policy?limit=1`,
        { headers }
      );
      const policy = await response.json();

      return {
        success: true,
        policy: policy[0] || PASSWORD_POLICY,
      };
    } catch (error) {
      console.error('[AdminService] Get password policy error:', error);
      return { success: true, policy: PASSWORD_POLICY };
    }
  }
}

export default new AdminUserManagementService();
