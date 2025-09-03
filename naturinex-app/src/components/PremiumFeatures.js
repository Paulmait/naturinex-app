/**
 * Premium Features Component
 * Displays and manages all new revenue-generating features
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

const PremiumFeatures = ({ userId, userTier = 'FREE' }) => {
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Fetch usage statistics
  useEffect(() => {
    fetchUsageStats();
  }, [userId]);

  const fetchUsageStats = async () => {
    try {
      const response = await apiService.get(`/api/usage/${userId}`);
      setUsage(response.data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  // Drug Interaction Checker
  const handleDrugInteractionCheck = async (medications) => {
    if (userTier === 'FREE') {
      setSelectedFeature('drugInteractions');
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post('/api/interactions/check', {
        userId,
        medications
      });
      
      if (response.data.success) {
        Alert.alert(
          'Drug Interactions Found',
          `Severity: ${response.data.severityLevels.highestSeverity}`,
          [
            { text: 'View Details', onPress: () => viewInteractionDetails(response.data) },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      if (error.response?.status === 402) {
        setShowUpgradeModal(true);
      } else {
        Alert.alert('Error', 'Failed to check drug interactions');
      }
    } finally {
      setLoading(false);
    }
  };

  // Health Profile Creation
  const handleCreateHealthProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await apiService.post('/api/health-profile', {
        userId,
        profileData
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Health profile created successfully');
      } else if (response.data.upgradeRequired) {
        setSelectedFeature('healthProfiles');
        setShowUpgradeModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create health profile');
    } finally {
      setLoading(false);
    }
  };

  // Medication History
  const handleAddToHistory = async (medicationData) => {
    setLoading(true);
    try {
      const response = await apiService.post('/api/medication-history', {
        userId,
        medicationData
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Added to medication history');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add to history');
    } finally {
      setLoading(false);
    }
  };

  // PDF Report Generation
  const handleGeneratePDFReport = async () => {
    if (!['PRO', 'FAMILY', 'ENTERPRISE'].includes(userTier)) {
      setSelectedFeature('pdfExport');
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.get(`/api/report/pdf/${userId}`, {
        responseType: 'blob'
      });
      
      // Handle PDF download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medication-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      if (error.response?.status === 402) {
        setShowUpgradeModal(true);
      } else {
        Alert.alert('Error', 'Failed to generate PDF report');
      }
    } finally {
      setLoading(false);
    }
  };

  // Credit Purchase
  const handlePurchaseCredits = async (packageId) => {
    setLoading(true);
    try {
      const response = await apiService.post('/api/credits/purchase', {
        userId,
        packageId
      });
      
      if (response.data.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate credit purchase');
    } finally {
      setLoading(false);
    }
  };

  // Affiliate Product Click
  const handleAffiliateClick = async (productData) => {
    try {
      const response = await apiService.post('/api/affiliate/track', {
        userId,
        productData
      });
      
      if (response.data.redirectUrl) {
        // Open affiliate link
        window.open(response.data.redirectUrl, '_blank');
      }
    } catch (error) {
      console.error('Affiliate tracking error:', error);
    }
  };

  // Render Usage Stats
  const renderUsageStats = () => {
    if (!usage) return null;

    return (
      <View style={styles.usageCard}>
        <Text style={styles.usageTitle}>Your Usage This Month</Text>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Daily Scans:</Text>
          <Text style={styles.usageValue}>{usage.daily} remaining</Text>
        </View>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Monthly Scans:</Text>
          <Text style={styles.usageValue}>{usage.monthly} remaining</Text>
        </View>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Credits:</Text>
          <Text style={styles.usageValue}>{usage.credits || 0}</Text>
        </View>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{usage.tier} TIER</Text>
        </View>
      </View>
    );
  };

  // Render Feature Cards
  const renderFeatureCards = () => {
    const features = [
      {
        id: 'drugInteractions',
        title: 'Drug Interaction Checker',
        icon: 'warning',
        color: '#FF6B6B',
        description: 'Check for dangerous interactions between medications',
        premium: true,
        onPress: () => handleDrugInteractionCheck(['aspirin', 'ibuprofen'])
      },
      {
        id: 'healthProfile',
        title: 'Health Profiles',
        icon: 'person',
        color: '#4ECDC4',
        description: 'Store your health conditions and allergies',
        premium: false,
        onPress: () => {} // Open profile modal
      },
      {
        id: 'medicationHistory',
        title: 'Medication History',
        icon: 'history',
        color: '#95A5A6',
        description: 'Track all your scanned medications',
        premium: false,
        onPress: () => {} // Open history view
      },
      {
        id: 'pdfReport',
        title: 'PDF Reports',
        icon: 'picture-as-pdf',
        color: '#9B59B6',
        description: 'Export detailed health reports',
        premium: true,
        onPress: handleGeneratePDFReport
      },
      {
        id: 'buyCredits',
        title: 'Buy Credits',
        icon: 'credit-card',
        color: '#F39C12',
        description: 'Purchase credits for premium features',
        premium: false,
        onPress: () => {} // Open credit purchase modal
      }
    ];

    return features.map(feature => (
      <TouchableOpacity
        key={feature.id}
        style={[styles.featureCard, { borderLeftColor: feature.color }]}
        onPress={feature.onPress}
      >
        <View style={styles.featureHeader}>
          <MaterialIcons name={feature.icon} size={24} color={feature.color} />
          {feature.premium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </TouchableOpacity>
    ));
  };

  // Upgrade Modal
  const renderUpgradeModal = () => (
    <Modal
      visible={showUpgradeModal}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowUpgradeModal(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <FontAwesome5 name="crown" size={48} color="#FFD700" />
          <Text style={styles.modalTitle}>Upgrade to Premium</Text>
          <Text style={styles.modalDescription}>
            This feature requires a premium subscription
          </Text>
          
          <View style={styles.tierOptions}>
            <TouchableOpacity style={styles.tierOption}>
              <Text style={styles.tierName}>Basic</Text>
              <Text style={styles.tierPrice}>$4.99/mo</Text>
              <Text style={styles.tierFeature}>• 50 scans/month</Text>
              <Text style={styles.tierFeature}>• Health profiles</Text>
              <Text style={styles.tierFeature}>• 30-day history</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.tierOption, styles.recommended]}>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>BEST VALUE</Text>
              </View>
              <Text style={styles.tierName}>Professional</Text>
              <Text style={styles.tierPrice}>$9.99/mo</Text>
              <Text style={styles.tierFeature}>• 200 scans/month</Text>
              <Text style={styles.tierFeature}>• Drug interactions</Text>
              <Text style={styles.tierFeature}>• PDF reports</Text>
              <Text style={styles.tierFeature}>• 1-year history</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tierOption}>
              <Text style={styles.tierName}>Family</Text>
              <Text style={styles.tierPrice}>$24.99/mo</Text>
              <Text style={styles.tierFeature}>• 500 scans/month</Text>
              <Text style={styles.tierFeature}>• 5 family members</Text>
              <Text style={styles.tierFeature}>• All Pro features</Text>
              <Text style={styles.tierFeature}>• Priority support</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>View All Plans</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderUsageStats()}
      <Text style={styles.sectionTitle}>Premium Features</Text>
      <View style={styles.featuresGrid}>
        {renderFeatureCards()}
      </View>
      {renderUpgradeModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usageCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  usageLabel: {
    fontSize: 14,
    color: '#666',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tierBadge: {
    backgroundColor: '#667eea',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  tierText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    color: '#333',
  },
  featuresGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  featureCard: {
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  tierOptions: {
    width: '100%',
  },
  tierOption: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recommended: {
    borderColor: '#667eea',
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 8,
  },
  tierFeature: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  upgradeButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PremiumFeatures;