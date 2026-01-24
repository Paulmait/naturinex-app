/**
 * Screenshot Protection Service
 * Prevents screenshots for free users to encourage upgrades
 * Premium users can take screenshots freely
 */

import { Platform, Alert } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { PRICING_TIERS } from '../config/pricing';

class ScreenshotProtectionService {
  constructor() {
    this.isProtectionActive = false;
    this.subscription = null;
  }

  /**
   * Check if screenshot is allowed for user's tier
   */
  isScreenshotAllowed(subscriptionTier = 'free') {
    const tier = PRICING_TIERS[subscriptionTier.toUpperCase()] || PRICING_TIERS.FREE;
    return tier.features?.screenshotAllowed === true;
  }

  /**
   * Activate screenshot protection for free users
   * @param {string} subscriptionTier - User's subscription tier
   * @param {Function} onAttempt - Callback when screenshot is attempted
   */
  async activateProtection(subscriptionTier = 'free', onAttempt = null) {
    // Only protect on native platforms, not web
    if (Platform.OS === 'web') {
      return { success: true, message: 'Web platform - protection not needed' };
    }

    const allowed = this.isScreenshotAllowed(subscriptionTier);

    if (allowed) {
      // Premium user - ensure protection is OFF
      await this.deactivateProtection();
      return { success: true, protected: false, message: 'Screenshots allowed for premium' };
    }

    try {
      // Prevent screen capture for free users
      await ScreenCapture.preventScreenCaptureAsync();
      this.isProtectionActive = true;

      // Listen for screenshot attempts
      if (this.subscription) {
        this.subscription.remove();
      }

      this.subscription = ScreenCapture.addScreenshotListener(() => {
        // User attempted to take screenshot
        if (onAttempt) {
          onAttempt();
        } else {
          this.showUpgradePrompt();
        }
      });

      return { success: true, protected: true, message: 'Screenshot protection active' };
    } catch (error) {
      console.error('Screenshot protection error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deactivate screenshot protection
   */
  async deactivateProtection() {
    if (Platform.OS === 'web') return;

    try {
      await ScreenCapture.allowScreenCaptureAsync();
      this.isProtectionActive = false;

      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deactivating screenshot protection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Show upgrade prompt when screenshot is attempted
   */
  showUpgradePrompt() {
    Alert.alert(
      'Screenshot Protected',
      'Upgrade to Premium to save and share your wellness reports!\n\nPremium benefits:\n• Take screenshots\n• Export PDF reports\n• Share with family\n• 25 scans per month',
      [
        { text: 'Maybe Later', style: 'cancel' },
        {
          text: 'Upgrade Now',
          style: 'default',
          // Navigation will be handled by the calling component
        }
      ]
    );
  }

  /**
   * Check if protection is currently active
   */
  isActive() {
    return this.isProtectionActive;
  }

  /**
   * Clean up on unmount
   */
  cleanup() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}

// Create singleton
const screenshotProtectionService = new ScreenshotProtectionService();
export default screenshotProtectionService;

/**
 * React Hook for screenshot protection
 * Usage: useScreenshotProtection(subscriptionTier, navigation)
 */
export const useScreenshotProtection = (subscriptionTier, navigation) => {
  const React = require('react');

  React.useEffect(() => {
    const handleScreenshotAttempt = () => {
      Alert.alert(
        'Screenshot Protected',
        'Upgrade to Premium to save and share your wellness reports!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => navigation?.navigate?.('Subscription')
          }
        ]
      );
    };

    screenshotProtectionService.activateProtection(subscriptionTier, handleScreenshotAttempt);

    return () => {
      screenshotProtectionService.deactivateProtection();
    };
  }, [subscriptionTier, navigation]);

  return {
    isProtected: !screenshotProtectionService.isScreenshotAllowed(subscriptionTier),
  };
};
