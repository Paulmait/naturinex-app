/**
 * Subscription Screen Wrapper
 *
 * Platform-aware wrapper that routes to:
 * - Apple IAP Paywall on iOS
 * - Stripe-based screen on Android/Web
 */

import React from 'react';
import { Platform } from 'react-native';
import AppleIAPPaywallScreen from './AppleIAPPaywallScreen';
import SubscriptionScreen from './SubscriptionScreen';

export default function SubscriptionScreenWrapper(props) {
  // Use Apple IAP on iOS, Stripe on other platforms
  if (Platform.OS === 'ios') {
    return <AppleIAPPaywallScreen {...props} />;
  }

  // Android and web use existing Stripe implementation
  return <SubscriptionScreen {...props} />;
}
