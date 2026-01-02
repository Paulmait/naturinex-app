/**
 * Apple IAP Paywall Screen
 *
 * iOS-only subscription screen using Apple StoreKit.
 * Includes all Apple-required subscription disclosures.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppleIAPService from '../billing/AppleIAPService';
import { PRODUCT_METADATA, getProductsByTier } from '../billing/products';
import DemoDataService from '../services/DemoDataService';

const TERMS_URL = 'https://naturinex.com/terms';
const PRIVACY_URL = 'https://naturinex.com/privacy';

export default function AppleIAPPaywallScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [currentEntitlement, setCurrentEntitlement] = useState(null);

  useEffect(() => {
    loadProducts();
    loadEntitlement();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await AppleIAPService.getSubscriptions();
      setProducts(fetchedProducts);

      // Select default product (Premium Monthly)
      const defaultProduct = fetchedProducts.find(
        p => p.productId === 'naturinex_premium_monthly'
      );
      if (defaultProduct) {
        setSelectedProductId(defaultProduct.productId);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntitlement = async () => {
    const entitlement = await AppleIAPService.getCurrentEntitlement();
    setCurrentEntitlement(entitlement);
  };

  const handlePurchase = async () => {
    if (!selectedProductId) {
      Alert.alert('Select a Plan', 'Please select a subscription plan first.');
      return;
    }

    // Demo mode bypass
    if (DemoDataService.isDemoMode()) {
      Alert.alert('Demo Mode', 'Purchases are simulated in demo mode.');
      return;
    }

    setPurchasing(true);
    try {
      await AppleIAPService.requestSubscription(selectedProductId, {
        onSuccess: (entitlement) => {
          setCurrentEntitlement(entitlement);
          Alert.alert(
            'Welcome to Premium!',
            'Your subscription is now active. Enjoy unlimited access!',
            [{ text: 'Start Exploring', onPress: () => navigation.navigate('Home') }]
          );
        },
        onError: (error) => {
          if (error.code !== 'E_USER_CANCELLED') {
            Alert.alert('Purchase Failed', error.message || 'Please try again.');
          }
        },
      });
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const entitlement = await AppleIAPService.restorePurchases();
      if (entitlement) {
        setCurrentEntitlement(entitlement);
      }
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    AppleIAPService.openSubscriptionManagement();
  };

  const openURL = (url) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  // Filter products by selected period
  const filteredProducts = products.filter(p => {
    const meta = PRODUCT_METADATA[p.productId];
    return meta && meta.period === selectedPeriod;
  });

  // If user already has active subscription, show management screen
  if (currentEntitlement?.isActive) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.activeHeader}>
            <View style={styles.premiumBadge}>
              <MaterialIcons name="star" size={40} color="#FFD700" />
            </View>
            <Text style={styles.activeTitle}>Premium Active</Text>
            <Text style={styles.activeSubtitle}>
              Your {currentEntitlement.tier} subscription is active
            </Text>
            {currentEntitlement.expiresAt && (
              <Text style={styles.expiresText}>
                Renews: {new Date(currentEntitlement.expiresAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Benefits</Text>
            {getProductsByTier()
              .find(t => t.tier === currentEntitlement.tier)
              ?.products[0]?.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
          </View>

          <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
            <MaterialIcons name="settings" size={20} color="#10B981" />
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
          </TouchableOpacity>

          <Text style={styles.manageHint}>
            Opens App Store to manage billing, change plan, or cancel
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Naturinex Premium</Text>
          <Text style={styles.subtitle}>
            Unlock the full power of natural wellness insights
          </Text>
        </View>

        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'monthly' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('monthly')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'monthly' && styles.periodTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'yearly' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('yearly')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'yearly' && styles.periodTextActive,
              ]}
            >
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={styles.loader} />
        ) : (
          <>
            {/* Plan Cards */}
            <View style={styles.plansContainer}>
              {filteredProducts.map((product) => {
                const meta = PRODUCT_METADATA[product.productId];
                const isSelected = selectedProductId === product.productId;

                return (
                  <TouchableOpacity
                    key={product.productId}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                      meta?.popular && styles.planCardPopular,
                    ]}
                    onPress={() => setSelectedProductId(product.productId)}
                  >
                    {meta?.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>MOST POPULAR</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <Text style={styles.planTier}>{meta?.tier?.toUpperCase()}</Text>
                      {meta?.savings && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsText}>{meta.savings}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.planPrice}>
                      {product.displayPrice || product.localizedPrice}
                    </Text>
                    <Text style={styles.planPeriod}>{meta?.periodDisplay}</Text>

                    <View style={styles.featuresContainer}>
                      {meta?.features?.slice(0, 4).map((feature, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <MaterialIcons name="check" size={16} color="#10B981" />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <MaterialIcons name="check-circle" size={24} color="#10B981" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Trial Info */}
            <View style={styles.trialBanner}>
              <MaterialIcons name="celebration" size={24} color="#10B981" />
              <Text style={styles.trialText}>7-day free trial included</Text>
            </View>

            {/* Subscribe Button */}
            <TouchableOpacity
              style={[styles.subscribeButton, purchasing && styles.buttonDisabled]}
              onPress={handlePurchase}
              disabled={purchasing || !selectedProductId}
            >
              {purchasing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="star" size={20} color="white" />
                  <Text style={styles.subscribeButtonText}>
                    Start 7-Day Free Trial
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Restore Purchases */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={restoring}
            >
              {restoring ? (
                <ActivityIndicator color="#10B981" />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Apple Required Subscription Disclosure */}
        <View style={styles.disclosureContainer}>
          <Text style={styles.disclosureTitle}>Subscription Terms</Text>
          <Text style={styles.disclosureText}>
            • Payment will be charged to your Apple ID account at confirmation of purchase
          </Text>
          <Text style={styles.disclosureText}>
            • Subscription automatically renews unless canceled at least 24 hours before the end of the current period
          </Text>
          <Text style={styles.disclosureText}>
            • Your account will be charged for renewal within 24 hours prior to the end of the current period
          </Text>
          <Text style={styles.disclosureText}>
            • You can manage and cancel subscriptions in your App Store account settings
          </Text>
          <Text style={styles.disclosureText}>
            • Any unused portion of a free trial period will be forfeited when you purchase a subscription
          </Text>
        </View>

        {/* Legal Links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => openURL(TERMS_URL)}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>|</Text>
          <TouchableOpacity onPress={() => openURL(PRIVACY_URL)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    alignSelf: 'center',
  },
  periodButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  periodButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#1F2937',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 40,
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  planCardPopular: {
    borderColor: '#10B981',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  planTier: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 1,
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
  },
  planPeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  trialText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  subscribeButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  restoreButton: {
    alignItems: 'center',
    padding: 12,
    marginBottom: 25,
  },
  restoreText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  disclosureContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  disclosureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 10,
  },
  disclosureText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 6,
    lineHeight: 18,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  legalLink: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: '#D1D5DB',
    marginHorizontal: 15,
  },
  bottomPadding: {
    height: 30,
  },
  // Active subscription styles
  activeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  premiumBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  activeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  expiresText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  manageButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  manageHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
  },
});
