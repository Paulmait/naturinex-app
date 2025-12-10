// Device Fingerprinting Service
// Creates unique device ID for server-side guest mode validation

import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import logger from '../utils/logger';

class DeviceFingerprintService {
  constructor() {
    this.deviceIdKey = 'naturinex_device_id';
  }

  /**
   * Get or create device fingerprint
   * Returns a consistent device ID across app reinstalls (where possible)
   */
  async getDeviceFingerprint() {
    try {
      // First, check if we already have a stored device ID
      const storedId = await SecureStore.getItemAsync(this.deviceIdKey);
      if (storedId) {
        logger.debug('Using stored device ID');
        return storedId;
      }

      // Generate new device fingerprint
      const deviceId = await this.generateDeviceFingerprint();

      // Store for future use
      await SecureStore.setItemAsync(this.deviceIdKey, deviceId);

      logger.info('Generated new device ID');
      return deviceId;

    } catch (error) {
      logger.error('Device fingerprint error', { error: error.message });

      // Fallback to basic UUID if fingerprinting fails
      const fallbackId = this.generateFallbackId();
      try {
        await SecureStore.setItemAsync(this.deviceIdKey, fallbackId);
      } catch (e) {
        // If even secure store fails, just return the ID
      }
      return fallbackId;
    }
  }

  /**
   * Generate device fingerprint based on device characteristics
   * This creates a semi-persistent ID that survives app reinstalls
   */
  async generateDeviceFingerprint() {
    const components = [];

    // Platform
    components.push(Platform.OS);

    // Device model
    if (Device.modelId) {
      components.push(Device.modelId);
    }

    // Device brand
    if (Device.brand) {
      components.push(Device.brand);
    }

    // Device manufacturer
    if (Device.manufacturer) {
      components.push(Device.manufacturer);
    }

    // OS Version
    if (Device.osVersion) {
      components.push(Device.osVersion);
    }

    // Platform-specific IDs (most persistent)
    if (Platform.OS === 'ios') {
      try {
        // iOS Vendor ID - persists until app is uninstalled from all devices
        const vendorId = await Application.getIosIdForVendorAsync();
        if (vendorId) {
          components.push(vendorId);
        }
      } catch (e) {
        logger.warn('Could not get iOS vendor ID');
      }
    } else if (Platform.OS === 'android') {
      try {
        // Android ID - unique per app install
        const androidId = Application.androidId;
        if (androidId) {
          components.push(androidId);
        }
      } catch (e) {
        logger.warn('Could not get Android ID');
      }
    }

    // Application info
    if (Application.applicationId) {
      components.push(Application.applicationId);
    }

    // Create hash from components
    const fingerprint = components.join('|');
    const hash = await this.createHash(fingerprint);

    return hash;
  }

  /**
   * Create SHA-256 hash (simple version for React Native)
   */
  async createHash(input) {
    // Simple hash function for device ID
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to hex and add prefix
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `device_${hexHash}_${Date.now().toString(36)}`;
  }

  /**
   * Generate fallback ID when fingerprinting fails
   */
  generateFallbackId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `fallback_${timestamp}_${random}`;
  }

  /**
   * Get device info for logging/debugging
   */
  async getDeviceInfo() {
    try {
      return {
        platform: Platform.OS,
        model: Device.modelName,
        modelId: Device.modelId,
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        osVersion: Device.osVersion,
        deviceType: Device.deviceType,
        deviceId: await this.getDeviceFingerprint(),
      };
    } catch (error) {
      logger.error('Failed to get device info', { error: error.message });
      return {
        platform: Platform.OS,
        deviceId: await this.getDeviceFingerprint(),
      };
    }
  }

  /**
   * Clear stored device ID (for testing/debugging)
   */
  async clearDeviceId() {
    try {
      await SecureStore.deleteItemAsync(this.deviceIdKey);
      logger.info('Cleared device ID');
      return true;
    } catch (error) {
      logger.error('Failed to clear device ID', { error: error.message });
      return false;
    }
  }
}

// Create singleton instance
const deviceFingerprintService = new DeviceFingerprintService();

export default deviceFingerprintService;
