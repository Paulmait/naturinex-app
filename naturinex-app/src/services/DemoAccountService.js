/**
 * Demo Account Service
 * Manages demo account access with abuse prevention
 *
 * Security Features:
 * - Device-bound demo access (1 demo per device)
 * - Rate limiting for demo activation
 * - Expiration tracking
 * - Revocation capability
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Storage keys
const STORAGE_KEYS = {
  DEMO_DEVICE_ID: 'demo_device_fingerprint',
  DEMO_ACTIVATED_AT: 'demo_activated_at',
  DEMO_ACTIVATION_COUNT: 'demo_activation_count',
  DEMO_LAST_ATTEMPT: 'demo_last_attempt',
  DEMO_REVOKED: 'demo_revoked',
};

// Configuration
const CONFIG = {
  MAX_ACTIVATIONS_PER_DEVICE: 1, // Only 1 demo activation per device
  DEMO_DURATION_DAYS: 7, // Demo lasts 7 days
  COOLDOWN_HOURS: 24, // Wait 24 hours between activation attempts after failure
  MAX_ATTEMPTS_PER_DAY: 3, // Max 3 attempts per day
};

class DemoAccountService {
  constructor() {
    this.deviceFingerprint = null;
  }

  /**
   * Generate a unique device fingerprint
   * Combines multiple device identifiers for uniqueness
   */
  async getDeviceFingerprint() {
    if (this.deviceFingerprint) {
      return this.deviceFingerprint;
    }

    try {
      // Collect device-specific information
      const deviceInfo = {
        platform: Platform.OS,
        installationId: Application.androidId || await Application.getIosIdForVendorAsync() || 'unknown',
        appOwnership: Application.applicationId,
        nativeAppVersion: Application.nativeApplicationVersion,
        nativeBuildVersion: Application.nativeBuildVersion,
      };

      // Create a hash of the device info
      const infoString = JSON.stringify(deviceInfo);
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        infoString
      );

      this.deviceFingerprint = hash.substring(0, 32);
      return this.deviceFingerprint;
    } catch (error) {
      console.error('[DemoAccountService] Fingerprint generation error:', error);
      // Fallback to a random ID stored persistently
      let fallbackId = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_DEVICE_ID);
      if (!fallbackId) {
        fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        await AsyncStorage.setItem(STORAGE_KEYS.DEMO_DEVICE_ID, fallbackId);
      }
      this.deviceFingerprint = fallbackId;
      return this.deviceFingerprint;
    }
  }

  /**
   * Check if demo can be activated for this device
   * @returns {object} { canActivate: boolean, reason?: string }
   */
  async canActivateDemo() {
    try {
      const fingerprint = await this.getDeviceFingerprint();

      // Check if demo was revoked
      const revoked = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_REVOKED);
      if (revoked === fingerprint) {
        return {
          canActivate: false,
          reason: 'Demo access has been revoked for this device.',
        };
      }

      // Check activation count
      const countStr = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_ACTIVATION_COUNT);
      const count = parseInt(countStr || '0', 10);

      if (count >= CONFIG.MAX_ACTIVATIONS_PER_DEVICE) {
        return {
          canActivate: false,
          reason: 'Demo has already been used on this device. Please subscribe for continued access.',
        };
      }

      // Check rate limiting
      const lastAttemptStr = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_LAST_ATTEMPT);
      if (lastAttemptStr) {
        const lastAttempt = JSON.parse(lastAttemptStr);
        const hoursSinceLastAttempt = (Date.now() - lastAttempt.timestamp) / (1000 * 60 * 60);

        if (lastAttempt.count >= CONFIG.MAX_ATTEMPTS_PER_DAY && hoursSinceLastAttempt < CONFIG.COOLDOWN_HOURS) {
          const hoursRemaining = Math.ceil(CONFIG.COOLDOWN_HOURS - hoursSinceLastAttempt);
          return {
            canActivate: false,
            reason: `Too many attempts. Please try again in ${hoursRemaining} hours.`,
          };
        }
      }

      return { canActivate: true };
    } catch (error) {
      console.error('[DemoAccountService] canActivateDemo error:', error);
      return {
        canActivate: false,
        reason: 'Unable to verify demo eligibility. Please try again.',
      };
    }
  }

  /**
   * Activate demo account for this device
   * @returns {object} { success: boolean, error?: string, expiresAt?: string }
   */
  async activateDemo() {
    try {
      // First check if activation is allowed
      const eligibility = await this.canActivateDemo();
      if (!eligibility.canActivate) {
        return { success: false, error: eligibility.reason };
      }

      const fingerprint = await this.getDeviceFingerprint();
      const now = Date.now();
      const expiresAt = new Date(now + CONFIG.DEMO_DURATION_DAYS * 24 * 60 * 60 * 1000);

      // Increment activation count
      const countStr = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_ACTIVATION_COUNT);
      const count = parseInt(countStr || '0', 10);
      await AsyncStorage.setItem(STORAGE_KEYS.DEMO_ACTIVATION_COUNT, String(count + 1));

      // Store activation timestamp
      await AsyncStorage.setItem(STORAGE_KEYS.DEMO_ACTIVATED_AT, JSON.stringify({
        fingerprint,
        activatedAt: now,
        expiresAt: expiresAt.getTime(),
      }));

      // Set up demo account in SecureStore
      await SecureStore.setItemAsync('user_id', `demo_${fingerprint.substring(0, 8)}`);
      await SecureStore.setItemAsync('user_email', 'demo@naturinex.com');
      await SecureStore.setItemAsync('is_guest', 'false');
      await SecureStore.setItemAsync('is_premium', 'true');
      await SecureStore.setItemAsync('premium_tier', 'premium');
      await SecureStore.setItemAsync('premium_expires', expiresAt.toISOString());
      await SecureStore.setItemAsync('demo_mode', 'true');
      await SecureStore.setItemAsync('demo_device_id', fingerprint);
      await SecureStore.setItemAsync('onboarding_completed', 'true');
      await SecureStore.setItemAsync('auth_token', `demo-token-${fingerprint.substring(0, 16)}`);

      console.log('[DemoAccountService] Demo activated successfully');

      return {
        success: true,
        expiresAt: expiresAt.toISOString(),
        daysRemaining: CONFIG.DEMO_DURATION_DAYS,
      };
    } catch (error) {
      console.error('[DemoAccountService] activateDemo error:', error);

      // Record failed attempt for rate limiting
      await this.recordAttempt();

      return {
        success: false,
        error: 'Failed to activate demo. Please try again.',
      };
    }
  }

  /**
   * Record an activation attempt for rate limiting
   */
  async recordAttempt() {
    try {
      const lastAttemptStr = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_LAST_ATTEMPT);
      let attemptData = lastAttemptStr ? JSON.parse(lastAttemptStr) : { count: 0, timestamp: 0 };

      const hoursSinceLastAttempt = (Date.now() - attemptData.timestamp) / (1000 * 60 * 60);

      if (hoursSinceLastAttempt > CONFIG.COOLDOWN_HOURS) {
        // Reset counter after cooldown
        attemptData = { count: 1, timestamp: Date.now() };
      } else {
        attemptData.count++;
        attemptData.timestamp = Date.now();
      }

      await AsyncStorage.setItem(STORAGE_KEYS.DEMO_LAST_ATTEMPT, JSON.stringify(attemptData));
    } catch (error) {
      console.error('[DemoAccountService] recordAttempt error:', error);
    }
  }

  /**
   * Check if current demo is still valid
   * @returns {object} { isValid: boolean, daysRemaining?: number, expired?: boolean }
   */
  async isDemoValid() {
    try {
      const demoMode = await SecureStore.getItemAsync('demo_mode');
      if (demoMode !== 'true') {
        return { isValid: false, expired: false };
      }

      const expiresStr = await SecureStore.getItemAsync('premium_expires');
      if (!expiresStr) {
        return { isValid: false, expired: true };
      }

      const expiresAt = new Date(expiresStr);
      const now = new Date();

      if (now > expiresAt) {
        // Demo has expired
        await this.deactivateDemo();
        return { isValid: false, expired: true };
      }

      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { isValid: true, daysRemaining };
    } catch (error) {
      console.error('[DemoAccountService] isDemoValid error:', error);
      return { isValid: false, expired: false };
    }
  }

  /**
   * Deactivate demo account (on expiration or user request)
   */
  async deactivateDemo() {
    try {
      await SecureStore.setItemAsync('is_premium', 'false');
      await SecureStore.setItemAsync('premium_tier', 'free');
      await SecureStore.deleteItemAsync('premium_expires');
      await SecureStore.setItemAsync('demo_mode', 'false');

      console.log('[DemoAccountService] Demo deactivated');
      return { success: true };
    } catch (error) {
      console.error('[DemoAccountService] deactivateDemo error:', error);
      return { success: false, error: 'Failed to deactivate demo' };
    }
  }

  /**
   * Revoke demo access for this device (admin action)
   */
  async revokeDemo() {
    try {
      const fingerprint = await this.getDeviceFingerprint();
      await AsyncStorage.setItem(STORAGE_KEYS.DEMO_REVOKED, fingerprint);
      await this.deactivateDemo();

      return { success: true };
    } catch (error) {
      console.error('[DemoAccountService] revokeDemo error:', error);
      return { success: false, error: 'Failed to revoke demo' };
    }
  }

  /**
   * Get demo status for display
   */
  async getDemoStatus() {
    try {
      const canActivate = await this.canActivateDemo();
      const validity = await this.isDemoValid();
      const fingerprint = await this.getDeviceFingerprint();

      return {
        deviceId: fingerprint.substring(0, 8),
        canActivate: canActivate.canActivate,
        activateReason: canActivate.reason,
        isActive: validity.isValid,
        daysRemaining: validity.daysRemaining || 0,
        expired: validity.expired || false,
      };
    } catch (error) {
      console.error('[DemoAccountService] getDemoStatus error:', error);
      return {
        deviceId: 'unknown',
        canActivate: false,
        isActive: false,
        daysRemaining: 0,
        expired: false,
      };
    }
  }
}

// Create singleton instance
const demoAccountService = new DemoAccountService();

export default demoAccountService;
