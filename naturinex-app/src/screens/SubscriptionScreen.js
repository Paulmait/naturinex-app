import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const STRIPE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || 'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05';

export default function SubscriptionScreen({ navigation }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const premium = await SecureStore.getItemAsync('is_premium') || 'false';
      setIsPremium(premium === 'true');
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const handleSubscribe = async (plan) => {
    setLoading(true);
    try {
      // TODO: Implement actual Stripe subscription
      // For now, simulate subscription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await SecureStore.setItemAsync('is_premium', 'true');
      setIsPremium(true);
      
      Alert.alert(
        'Subscription Successful!',
        'Welcome to Naturinex Premium! You now have unlimited scans and access to all features.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert('Manage Subscription', 'Subscription management features will be available soon!');
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.setItemAsync('is_premium', 'false');
              setIsPremium(false);
              Alert.alert('Subscription Cancelled', 'Your premium subscription has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription.');
            }
          },
        },
      ]
    );
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Premium',
      price: '$9.99',
      period: 'per month',
      features: [
        'Unlimited medication scans',
        'Advanced AI analysis',
        'Priority support',
        'No ads',
        'Export scan history',
      ],
    },
    {
      id: 'yearly',
      name: 'Yearly Premium',
      price: '$99.99',
      period: 'per year',
      originalPrice: '$119.88',
      savings: 'Save 17%',
      features: [
        'All monthly features',
        '2 months free',
        'Early access to new features',
        'Premium customer support',
      ],
    },
  ];

  if (isPremium) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Premium Status */}
          <View style={styles.premiumHeader}>
            <View style={styles.premiumBadge}>
              <MaterialIcons name="star" size={32} color="#FFD700" />
            </View>
            <Text style={styles.premiumTitle}>Premium Active</Text>
            <Text style={styles.premiumSubtitle}>
              You have access to all premium features
            </Text>
          </View>

          {/* Premium Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Premium Benefits</Text>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Unlimited medication scans</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Advanced AI analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Priority customer support</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Ad-free experience</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Export scan history</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.actionButton} onPress={handleManageSubscription}>
              <MaterialIcons name="settings" size={20} color="#10B981" />
              <Text style={styles.actionButtonText}>Manage Subscription</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
              <MaterialIcons name="cancel" size={20} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Get unlimited scans and advanced features
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>{plan.period}</Text>
                {plan.originalPrice && (
                  <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                )}
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <MaterialIcons name="check" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.disabledButton]}
          onPress={() => handleSubscribe(selectedPlan)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons name="star" size={20} color="white" />
              <Text style={styles.subscribeButtonText}>
                Subscribe to Premium
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Free Tier Info */}
        <View style={styles.freeTierInfo}>
          <Text style={styles.freeTierTitle}>Free Tier Includes:</Text>
          <View style={styles.featureItem}>
            <MaterialIcons name="check" size={16} color="#6B7280" />
            <Text style={styles.freeFeatureText}>3 scans per day</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check" size={16} color="#6B7280" />
            <Text style={styles.freeFeatureText}>Basic analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check" size={16} color="#6B7280" />
            <Text style={styles.freeFeatureText}>Community support</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Subscriptions auto-renew unless cancelled.
          </Text>
        </View>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  premiumBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 15,
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
  selectedPlan: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  period: {
    fontSize: 14,
    color: '#6B7280',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  featuresList: {
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  freeFeatureText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  freeTierInfo: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  freeTierTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  termsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 15,
  },
  termsText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
    flex: 1,
  },
}); 