/**
 * Apple In-App Purchase Service
 *
 * Handles all StoreKit interactions for iOS subscriptions.
 * Uses react-native-iap for StoreKit integration.
 */

import { Platform, Alert, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ALL_SUBSCRIPTION_IDS, PRODUCT_METADATA, hasEntitlement } from './products';

// API URL for receipt validation
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1';

// IAP module - will be imported dynamically on iOS
let IAP = null;

// Purchase listener
let purchaseUpdateSubscription = null;
let purchaseErrorSubscription = null;

// Current user entitlement state
let currentEntitlement = {
  tier: 'free',
  expiresAt: null,
  productId: null,
  isActive: false,
};

// Callbacks for purchase events
let onPurchaseSuccessCallback = null;
let onPurchaseErrorCallback = null;

/**
 * Initialize IAP connection
 * Should be called on app start
 */
export const initializeIAP = async () => {
  if (Platform.OS !== 'ios') {
    console.log('[AppleIAPService] Not iOS, skipping IAP initialization');
    return false;
  }

  try {
    // Dynamically import react-native-iap
    IAP = require('react-native-iap');

    // Initialize connection to App Store
    const result = await IAP.initConnection();
    console.log('[AppleIAPService] IAP connection initialized:', result);

    // Set up purchase listeners
    setupPurchaseListeners();

    // Check for any pending transactions
    await finishPendingTransactions();

    return true;
  } catch (error) {
    console.error('[AppleIAPService] Failed to initialize IAP:', error);
    return false;
  }
};

/**
 * Set up purchase event listeners
 */
const setupPurchaseListeners = () => {
  if (!IAP) return;

  // Remove existing listeners
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
  }

  // Listen for successful purchases
  purchaseUpdateSubscription = IAP.purchaseUpdatedListener(async (purchase) => {
    console.log('[AppleIAPService] Purchase update:', purchase);

    const receipt = purchase.transactionReceipt;
    if (receipt) {
      try {
        // Extract transaction IDs for Server API verification
        const originalTransactionId = purchase.originalTransactionIdentifierIOS ||
                                       purchase.transactionId ||
                                       null;

        // Validate with server - passes originalTransactionId for Server API
        const validation = await validateReceipt(
          receipt,
          originalTransactionId,
          null // signedTransaction - not available in react-native-iap v12
        );

        if (validation.success) {
          // Update local entitlement
          await updateEntitlement(validation.entitlement);

          // Finish the transaction
          await IAP.finishTransaction({ purchase, isConsumable: false });

          // Notify success
          if (onPurchaseSuccessCallback) {
            onPurchaseSuccessCallback(validation.entitlement);
          }
        } else {
          throw new Error(validation.error || 'Receipt validation failed');
        }
      } catch (error) {
        console.error('[AppleIAPService] Purchase validation error:', error);
        if (onPurchaseErrorCallback) {
          onPurchaseErrorCallback(error);
        }
      }
    }
  });

  // Listen for purchase errors
  purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
    console.error('[AppleIAPService] Purchase error:', error);

    // Don't show error for user cancellation
    if (error.code !== 'E_USER_CANCELLED') {
      if (onPurchaseErrorCallback) {
        onPurchaseErrorCallback(error);
      }
    }
  });
};

/**
 * Finish any pending transactions
 */
const finishPendingTransactions = async () => {
  if (!IAP) return;

  try {
    const pending = await IAP.getAvailablePurchases();
    for (const purchase of pending) {
      await IAP.finishTransaction({ purchase, isConsumable: false });
    }
    console.log('[AppleIAPService] Finished pending transactions:', pending.length);
  } catch (error) {
    console.error('[AppleIAPService] Error finishing pending transactions:', error);
  }
};

/**
 * Get available subscription products from App Store
 */
export const getSubscriptions = async () => {
  if (Platform.OS !== 'ios' || !IAP) {
    return getFallbackProducts();
  }

  try {
    const products = await IAP.getSubscriptions({ skus: ALL_SUBSCRIPTION_IDS });
    console.log('[AppleIAPService] Fetched products:', products.length);

    // Merge with local metadata
    return products.map(product => ({
      ...product,
      ...PRODUCT_METADATA[product.productId],
      // Use localized price from StoreKit
      displayPrice: product.localizedPrice,
      priceValue: product.price,
      currency: product.currency,
    }));
  } catch (error) {
    console.error('[AppleIAPService] Error fetching subscriptions:', error);
    return getFallbackProducts();
  }
};

/**
 * Get fallback product data when IAP is unavailable
 */
const getFallbackProducts = () => {
  return Object.entries(PRODUCT_METADATA).map(([productId, meta]) => ({
    productId,
    ...meta,
    displayPrice: meta.period === 'monthly' ? '$9.99' : '$99.99',
    priceValue: meta.period === 'monthly' ? 9.99 : 99.99,
    currency: 'USD',
    isFallback: true,
  }));
};

/**
 * Request a subscription purchase
 */
export const requestSubscription = async (productId, options = {}) => {
  if (Platform.OS !== 'ios') {
    Alert.alert('Not Available', 'In-App Purchases are only available on iOS.');
    return false;
  }

  if (!IAP) {
    Alert.alert('Error', 'In-App Purchase service is not initialized.');
    return false;
  }

  try {
    // Set callbacks
    onPurchaseSuccessCallback = options.onSuccess;
    onPurchaseErrorCallback = options.onError;

    // Request the subscription
    await IAP.requestSubscription({
      sku: productId,
      andDangerouslyFinishTransactionAutomaticallyIOS: false,
    });

    return true;
  } catch (error) {
    console.error('[AppleIAPService] Error requesting subscription:', error);

    // Handle user cancellation gracefully
    if (error.code === 'E_USER_CANCELLED') {
      return false;
    }

    Alert.alert('Purchase Error', error.message || 'Failed to process purchase. Please try again.');
    return false;
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async () => {
  if (Platform.OS !== 'ios' || !IAP) {
    Alert.alert('Not Available', 'Restore purchases is only available on iOS.');
    return null;
  }

  try {
    const purchases = await IAP.getAvailablePurchases();
    console.log('[AppleIAPService] Restored purchases:', purchases.length);

    if (purchases.length === 0) {
      Alert.alert('No Purchases', 'No previous purchases were found for this Apple ID.');
      return null;
    }

    // Find the most recent subscription
    const latestPurchase = purchases.reduce((latest, current) => {
      if (!latest) return current;
      return new Date(current.transactionDate) > new Date(latest.transactionDate)
        ? current
        : latest;
    }, null);

    if (latestPurchase && latestPurchase.transactionReceipt) {
      // Extract originalTransactionId for Server API verification
      const originalTransactionId = latestPurchase.originalTransactionIdentifierIOS ||
                                     latestPurchase.transactionId ||
                                     null;

      // Validate with server
      const validation = await validateReceipt(
        latestPurchase.transactionReceipt,
        originalTransactionId,
        null
      );

      if (validation.success) {
        await updateEntitlement(validation.entitlement);
        Alert.alert('Restored', 'Your subscription has been restored successfully!');
        return validation.entitlement;
      }
    }

    Alert.alert('Restore Failed', 'Could not verify your previous purchases. Please try again.');
    return null;
  } catch (error) {
    console.error('[AppleIAPService] Error restoring purchases:', error);
    Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    return null;
  }
};

/**
 * Validate receipt/transaction with server
 *
 * SECURITY: userId is derived from auth token on server, not sent in body.
 * Server uses App Store Server API as primary verification method.
 *
 * @param {string} receipt - Base64 receipt data
 * @param {string} originalTransactionId - For Server API verification
 * @param {string} signedTransaction - JWS signed transaction from StoreKit 2
 */
const validateReceipt = async (receipt, originalTransactionId = null, signedTransaction = null) => {
  try {
    const authToken = await SecureStore.getItemAsync('auth_token');

    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/verify-apple-receipt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receipt,
        originalTransactionId,
        signedTransaction,
        sandbox: __DEV__,
      }),
    });

    if (response.status === 401) {
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Server validation failed');
    }

    const result = await response.json();
    console.log('[AppleIAPService] Verification method:', result.verification_method);
    return result;
  } catch (error) {
    console.error('[AppleIAPService] Receipt validation error:', error);

    // Fallback to local validation for demo/testing ONLY
    if (__DEV__) {
      console.warn('[AppleIAPService] Using DEV fallback - not for production!');
      return {
        success: true,
        entitlement: {
          tier: 'premium',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          productId: 'naturinex_premium_monthly',
          isActive: true,
        },
        verification_method: 'dev_fallback',
      };
    }

    return { success: false, error: error.message };
  }
};

/**
 * Update local entitlement state
 */
const updateEntitlement = async (entitlement) => {
  currentEntitlement = entitlement;

  // Persist to secure storage
  await SecureStore.setItemAsync('subscription_tier', entitlement.tier);
  await SecureStore.setItemAsync('subscription_expires', entitlement.expiresAt || '');
  await SecureStore.setItemAsync('subscription_product', entitlement.productId || '');
  await SecureStore.setItemAsync('is_premium', entitlement.isActive ? 'true' : 'false');

  console.log('[AppleIAPService] Entitlement updated:', entitlement);
};

/**
 * Get current entitlement
 */
export const getCurrentEntitlement = async () => {
  try {
    const tier = await SecureStore.getItemAsync('subscription_tier');
    const expires = await SecureStore.getItemAsync('subscription_expires');
    const product = await SecureStore.getItemAsync('subscription_product');
    const isPremium = await SecureStore.getItemAsync('is_premium');

    // Check if subscription is still active
    const isExpired = expires && new Date(expires) < new Date();

    return {
      tier: isExpired ? 'free' : (tier || 'free'),
      expiresAt: expires,
      productId: product,
      isActive: isPremium === 'true' && !isExpired,
    };
  } catch (error) {
    console.error('[AppleIAPService] Error getting entitlement:', error);
    return currentEntitlement;
  }
};

/**
 * Check if user has a specific entitlement level
 */
export const checkEntitlement = async (requiredLevel) => {
  const entitlement = await getCurrentEntitlement();
  return hasEntitlement(entitlement.tier, requiredLevel);
};

/**
 * Open Apple subscription management
 */
export const openSubscriptionManagement = () => {
  // Deep link to App Store subscriptions
  Linking.openURL('https://apps.apple.com/account/subscriptions');
};

/**
 * Clean up IAP listeners
 * Should be called on app close
 */
export const cleanupIAP = async () => {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }

  if (IAP) {
    await IAP.endConnection();
  }

  console.log('[AppleIAPService] IAP cleaned up');
};

export default {
  initializeIAP,
  getSubscriptions,
  requestSubscription,
  restorePurchases,
  getCurrentEntitlement,
  checkEntitlement,
  openSubscriptionManagement,
  cleanupIAP,
};
