/**
 * Account Security Service
 * Prevents account sharing and abuse through device/IP tracking
 */

import { supabase } from '../config/supabase';
import deviceFingerprintService from './deviceFingerprintService';
import { PRICING_TIERS } from '../config/pricing';
import * as SecureStore from 'expo-secure-store';

class AccountSecurityService {
  constructor() {
    this.deviceLimitKey = 'naturinex_device_check';
  }

  /**
   * Register device for user and check if within limits
   * @returns {Object} { allowed: boolean, message: string, deviceCount: number }
   */
  async registerDevice(userId, subscriptionTier = 'free') {
    if (!userId || !supabase) {
      return { allowed: true, message: 'No auth context', deviceCount: 0 };
    }

    try {
      const deviceId = await deviceFingerprintService.getDeviceFingerprint();
      const deviceInfo = await deviceFingerprintService.getDeviceInfo();
      const ipAddress = await this.getClientIP();

      // Get max devices for tier
      const tier = PRICING_TIERS[subscriptionTier.toUpperCase()] || PRICING_TIERS.FREE;
      const maxDevices = tier.limits?.maxDevices || tier.features?.maxDevices || 1;

      // Check existing devices for user
      const { data: existingDevices, error: fetchError } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (fetchError) {
        console.error('Error fetching devices:', fetchError);
        return { allowed: true, error: true };
      }

      // Check if this device is already registered
      const existingDevice = existingDevices?.find(d => d.device_id === deviceId);

      if (existingDevice) {
        // Update last seen
        await supabase
          .from('user_devices')
          .update({
            last_seen_at: new Date().toISOString(),
            ip_address: ipAddress,
          })
          .eq('id', existingDevice.id);

        return {
          allowed: true,
          message: 'Device recognized',
          deviceCount: existingDevices.length,
          isNewDevice: false,
        };
      }

      // Check if adding new device would exceed limit
      if (existingDevices && existingDevices.length >= maxDevices) {
        // Log suspicious activity
        await this.logSecurityEvent(userId, 'device_limit_exceeded', {
          deviceId,
          existingDeviceCount: existingDevices.length,
          maxDevices,
          ipAddress,
        });

        return {
          allowed: false,
          message: `Device limit reached (${maxDevices} devices). Please remove a device or upgrade your plan.`,
          deviceCount: existingDevices.length,
          maxDevices,
          requiresAction: 'remove_device_or_upgrade',
        };
      }

      // Register new device
      const { error: insertError } = await supabase
        .from('user_devices')
        .insert({
          user_id: userId,
          device_id: deviceId,
          device_name: `${deviceInfo.brand || deviceInfo.platform} ${deviceInfo.model || 'Device'}`,
          device_type: deviceInfo.platform,
          device_model: deviceInfo.model,
          os_version: deviceInfo.osVersion,
          ip_address: ipAddress,
          is_active: true,
          registered_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error registering device:', insertError);
        // Don't block user, just log the error
        return { allowed: true, error: true };
      }

      return {
        allowed: true,
        message: 'New device registered',
        deviceCount: (existingDevices?.length || 0) + 1,
        isNewDevice: true,
      };
    } catch (error) {
      console.error('Device registration error:', error);
      return { allowed: true, error: true };
    }
  }

  /**
   * Get list of user's registered devices
   */
  async getUserDevices(userId) {
    if (!userId || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user devices:', error);
      return [];
    }
  }

  /**
   * Remove a device from user's account
   */
  async removeDevice(userId, deviceId) {
    if (!userId || !supabase) return false;

    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('device_id', deviceId);

      if (error) throw error;

      await this.logSecurityEvent(userId, 'device_removed', { deviceId });
      return true;
    } catch (error) {
      console.error('Error removing device:', error);
      return false;
    }
  }

  /**
   * Check for suspicious activity (rapid IP changes, multiple locations)
   */
  async checkSuspiciousActivity(userId) {
    if (!userId || !supabase) return { suspicious: false };

    try {
      const { data: recentScans, error } = await supabase
        .from('scans')
        .select('ip_address, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check for multiple unique IPs in short timeframe
      const uniqueIPs = [...new Set(recentScans?.map(s => s.ip_address).filter(Boolean))];

      if (uniqueIPs.length > 5) {
        // More than 5 different IPs in 24 hours is suspicious
        await this.logSecurityEvent(userId, 'suspicious_ip_pattern', {
          uniqueIPCount: uniqueIPs.length,
          scanCount: recentScans.length,
        });

        return {
          suspicious: true,
          reason: 'multiple_ips',
          uniqueIPCount: uniqueIPs.length,
        };
      }

      return { suspicious: false };
    } catch (error) {
      console.error('Suspicious activity check error:', error);
      return { suspicious: false, error: true };
    }
  }

  /**
   * Log security event for audit trail
   */
  async logSecurityEvent(userId, eventType, metadata = {}) {
    if (!supabase) return;

    try {
      await supabase
        .from('security_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          metadata,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Get client IP address (best effort)
   */
  async getClientIP() {
    try {
      // Try to get IP from public API
      const response = await fetch('https://api.ipify.org?format=json', {
        timeout: 5000,
      });
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Validate scan request (combines device, IP, and rate limit checks)
   */
  async validateScanRequest(userId, subscriptionTier = 'free') {
    const results = {
      allowed: true,
      checks: {},
    };

    // 1. Device check
    const deviceCheck = await this.registerDevice(userId, subscriptionTier);
    results.checks.device = deviceCheck;
    if (!deviceCheck.allowed) {
      results.allowed = false;
      results.reason = 'device_limit';
      results.message = deviceCheck.message;
      return results;
    }

    // 2. Suspicious activity check (for premium users sharing accounts)
    if (['premium', 'plus', 'pro'].includes(subscriptionTier?.toLowerCase())) {
      const suspiciousCheck = await this.checkSuspiciousActivity(userId);
      results.checks.suspicious = suspiciousCheck;
      if (suspiciousCheck.suspicious) {
        // Don't block, but flag for review
        results.flagged = true;
        results.flagReason = suspiciousCheck.reason;
      }
    }

    return results;
  }
}

// Create singleton
const accountSecurityService = new AccountSecurityService();
export default accountSecurityService;
