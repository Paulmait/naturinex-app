# 📱 Mobile App Pricing Implementation Guide

## 🎨 React Native Pricing Screen Component

### 1. Create PricingScreen.js:

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

const PricingScreen = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly'); // Default to yearly
  const [promoCode, setPromoCode] = useState('');
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    fetchPrices();
    checkForLaunchPromo();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch(`${API_URL}/stripe-config`);
      const data = await response.json();
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const checkForLaunchPromo = () => {
    const launchDate = new Date('2025-08-01');
    const now = new Date();
    const daysFromLaunch = Math.floor((now - launchDate) / (1000 * 60 * 60 * 24));
    
    if (daysFromLaunch < 30 && daysFromLaunch >= 0) {
      setPromoCode('LAUNCH20');
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      monthlyPrice: '$7.99',
      yearlyPrice: '$79.99',
      monthlyPriceNum: 7.99,
      yearlyPriceNum: 79.99,
      savings: '$15.89',
      savingsPercent: '17%',
      features: [
        '50 AI Health Scans/month',
        'Basic symptom analysis',
        'Health tracking',
        'Email support',
        '7-day free trial'
      ],
      color: '#4CAF50',
      icon: 'leaf-outline'
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: '$14.99',
      yearlyPrice: '$139.99',
      monthlyPriceNum: 14.99,
      yearlyPriceNum: 139.99,
      savings: '$39.89',
      savingsPercent: '22%',
      popular: true,
      features: [
        'Unlimited AI Health Scans',
        'Advanced health insights',
        'Medicine interactions',
        'Family sharing (4 members)',
        'Priority support',
        '7-day free trial'
      ],
      color: '#2196F3',
      icon: 'star-outline'
    },
    {
      id: 'professional',
      name: 'Professional',
      monthlyPrice: '$39.99',
      yearlyPrice: '$359.99',
      monthlyPriceNum: 39.99,
      yearlyPriceNum: 359.99,
      savings: '$119.89',
      savingsPercent: '25%',
      features: [
        'Everything in Premium',
        'Advanced AI diagnostics',
        'Telehealth integration',
        'PDF health reports',
        'API access',
        'White-glove support',
        '7-day free trial'
      ],
      color: '#9C27B0',
      icon: 'shield-checkmark-outline'
    }
  ];

  const handleSubscribe = async (plan) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          plan: plan.id,
          billingCycle: selectedBilling,
          promoCode: promoCode,
          referralCode: user.referralCode || ''
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        // Open Stripe Checkout in browser
        const result = await WebBrowser.openBrowserAsync(data.url);
        
        // Check if user completed checkout (you'd need to verify this server-side)
        if (result.type === 'dismiss') {
          checkSubscriptionStatus();
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    // Implement checking if the user successfully subscribed
    // This would query your backend/Firebase
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>Start with a 7-day free trial</Text>
        
        {promoCode && (
          <View style={styles.promoBanner}>
            <Text style={styles.promoText}>
              🎉 Launch Special: 20% off annual plans!
            </Text>
          </View>
        )}
      </View>

      {/* Billing Toggle */}
      <View style={styles.billingToggle}>
        <TouchableOpacity
          onPress={() => setSelectedBilling('monthly')}
          style={[
            styles.billingOption,
            selectedBilling === 'monthly' && styles.billingOptionActive
          ]}
        >
          <Text style={[
            styles.billingText,
            selectedBilling === 'monthly' && styles.billingTextActive
          ]}>
            Monthly
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setSelectedBilling('yearly')}
          style={[
            styles.billingOption,
            selectedBilling === 'yearly' && styles.billingOptionActive
          ]}
        >
          <Text style={[
            styles.billingText,
            selectedBilling === 'yearly' && styles.billingTextActive
          ]}>
            Yearly
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>SAVE UP TO 25%</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Plans */}
      {plans.map((plan) => (
        <View 
          key={plan.id} 
          style={[
            styles.planCard,
            plan.popular && styles.popularCard
          ]}
        >
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <Ionicons name={plan.icon} size={32} color={plan.color} />
            <Text style={styles.planName}>{plan.name}</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {selectedBilling === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
            </Text>
            <Text style={styles.period}>
              /{selectedBilling === 'monthly' ? 'month' : 'year'}
            </Text>
          </View>

          {selectedBilling === 'yearly' && (
            <View style={styles.savingsContainer}>
              <Text style={styles.savingsText}>
                Save {plan.savings} ({plan.savingsPercent})
              </Text>
            </View>
          )}

          <View style={styles.features}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={plan.color} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => handleSubscribe(plan)}
            style={[
              styles.subscribeButton,
              { backgroundColor: plan.color },
              loading && styles.disabledButton
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.subscribeText}>Start Free Trial</Text>
            )}
          </TouchableOpacity>
        </View>
      ))}

      {/* Trust Badges */}
      <View style={styles.trustSection}>
        <View style={styles.trustBadge}>
          <Ionicons name="lock-closed" size={20} color="#666" />
          <Text style={styles.trustText}>Secure payment by Stripe</Text>
        </View>
        <View style={styles.trustBadge}>
          <Ionicons name="refresh" size={20} color="#666" />
          <Text style={styles.trustText}>Cancel anytime</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Prices shown in USD. By subscribing, you agree to our Terms of Service.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  promoBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  promoText: {
    color: '#856404',
    fontWeight: '500',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 25,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 22,
  },
  billingOptionActive: {
    backgroundColor: '#2196F3',
  },
  billingText: {
    fontSize: 16,
    color: '#666',
  },
  billingTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  saveBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 18,
    color: '#666',
    marginLeft: 4,
  },
  savingsContainer: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
  },
  savingsText: {
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  features: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  trustText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default PricingScreen;
```

## 🔧 Integration Steps

1. **Update your API URL** in the component
2. **Install required dependencies**:
   ```bash
   expo install expo-web-browser
   ```
3. **Add to your navigation**
4. **Handle success callback** after payment
5. **Update user subscription status** in your app state

## 📊 Analytics to Track

- Plan selection rates
- Monthly vs Annual selection
- Promo code usage
- Conversion funnel drop-offs
- Trial-to-paid conversion rate