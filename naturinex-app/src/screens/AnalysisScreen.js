import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import * as Sharing from 'expo-sharing';
import { getDeviceId } from '../utils/deviceId';
import engagementTracker from '../services/engagementTracking';
import { notificationManager } from '../components/NotificationBanner';
import reviewPrompt from '../utils/reviewPrompt';
import { exportToPdf } from '../services/PdfExportService';
import { useScreenshotProtection } from '../services/ScreenshotProtectionService';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app-zsga.onrender.com';

export default function AnalysisScreen({ route, navigation }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('free');

  // Screenshot protection for free users
  const { isProtected } = useScreenshotProtection(subscriptionTier, navigation);

  useEffect(() => {
    checkUserStatus();
    if (route.params?.medicationName) {
      analyzeMedicationByName(route.params.medicationName);
    } else if (route.params?.barcode) {
      analyzeMedicationByBarcode(route.params.barcode);
    } else if (route.params?.imageUri && route.params?.imageBase64) {
      analyzeImage(route.params.imageUri, route.params.imageBase64);
    } else if (route.params?.analysisResult) {
      setAnalysisResult(route.params.analysisResult);
      setLoading(false);
    } else {
      setError('No data provided for analysis');
      setLoading(false);
    }
  }, [route.params]);

  const checkUserStatus = async () => {
    const guestStatus = await SecureStore.getItemAsync('is_guest') || 'false';
    const premiumStatus = await SecureStore.getItemAsync('is_premium') || 'false';
    const tier = await SecureStore.getItemAsync('subscription_tier') || 'free';
    setIsGuest(guestStatus === 'true');
    setIsPremium(premiumStatus === 'true');
    setSubscriptionTier(premiumStatus === 'true' ? 'premium' : tier);
  };

  const analyzeMedicationByName = async (medicationName) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/analyze/name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicationName }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Failed to analyze "${medicationName}". Error: ${error.message}. Please check if the server is running.`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeMedicationByBarcode = async (barcode) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/analyze/barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to find product by barcode. Please try scanning the product label instead.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async (imageUri, imageBase64) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'medication.jpg',
      });

      const deviceId = await getDeviceId();
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Device-Id': deviceId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          Alert.alert(
            'Upgrade to Premium',
            errorData.message || 'You\'ve reached your free scan limit. Upgrade to premium for unlimited scans!',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Upgrade Now', onPress: () => navigation.navigate('Profile') }
            ]
          );
          navigation.goBack();
          return;
        }
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);

      if (result.scansRemaining !== undefined) {
        await SecureStore.setItemAsync('free_scans_remaining', result.scansRemaining.toString());
        if (!isPremium && result.scansRemaining === 1) {
          notificationManager.showWarning(
            '1 free scan remaining!',
            {
              text: 'Upgrade',
              onPress: () => navigation.navigate('Subscription')
            }
          );
        }
      }

      const currentCount = await SecureStore.getItemAsync('scan_count') || '0';
      const newCount = parseInt(currentCount) + 1;
      await SecureStore.setItemAsync('scan_count', newCount.toString());

      await engagementTracker.trackScan(
        result.productInfo?.productName || result.medicationName,
        result
      );

      await reviewPrompt.incrementScanCount();
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Upgrade to Premium to save your scan history and access it anytime.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    try {
      Alert.alert('Success', 'Analysis saved to history!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save to history');
    }
  };

  const handleShare = async () => {
    if (isGuest || !isPremium) {
      Alert.alert(
        'Unlock Sharing',
        'Share your wellness discoveries with friends and family!\n\nPremium members get:\n\n• Share analysis results instantly\n• Export professional PDF reports\n• Save unlimited scan history\n• Use on up to 3 devices\n• Take screenshots freely\n\nStart your 7-day free trial today!',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Start Free Trial',
            style: 'default',
            onPress: () => navigation.navigate('Subscription')
          }
        ]
      );
      return;
    }

    try {
      const shareText = `Natural Wellness Discovery\n\nProduct: ${analysisResult.medicationName || analysisResult.productName}\n\nNatural Alternatives Found:\n${analysisResult.alternatives?.map(alt => `- ${alt.name}`).join('\n') || 'No alternatives found'}\n\nDiscovered with Naturinex - Your Natural Wellness Guide\n\nEducational information only. Consult healthcare professionals.`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText);
        await engagementTracker.trackShare();
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to share. Please try again.');
    }
  };

  const handleDownload = async () => {
    if (isGuest || !isPremium) {
      Alert.alert(
        'Export PDF Reports',
        'Create professional wellness reports to share with your healthcare provider!\n\nPremium includes:\n\n• Beautiful PDF reports\n• Research citations included\n• Dosage recommendations\n• Drug interaction warnings\n• Export entire scan history\n\nOnly $9.99/month - Cancel anytime!',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Upgrade to Premium',
            style: 'default',
            onPress: () => navigation.navigate('Subscription')
          }
        ]
      );
      return;
    }

    try {
      setDownloadingPdf(true);

      const pdfData = {
        medicationName: analysisResult.medicationName || analysisResult.productName || 'Unknown Medication',
        scanDate: new Date().toISOString(),
        naturalAlternatives: analysisResult.alternatives || [],
        analysis: {
          summary: analysisResult.summary || analysisResult.description || '',
          warnings: analysisResult.warnings || [],
          recommendations: analysisResult.recommendations || [],
        },
      };

      const result = await exportToPdf(pdfData);

      if (result.success) {
        Alert.alert('Success', 'PDF report generated successfully!');
        await engagementTracker.trackPDFExport();
      }
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert('Error', 'Unable to generate PDF report. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Analyzing product...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!analysisResult) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No analysis results available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!disclaimerAccepted && analysisResult) {
    return (
      <MedicalDisclaimer
        visible={true}
        type="results"
        onAccept={() => setDisclaimerAccepted(true)}
        onDecline={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analysis Results</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSaveToHistory}>
              <MaterialIcons name="bookmark" size={20} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <MaterialIcons name="share" size={20} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownload}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <MaterialIcons name="picture-as-pdf" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Medical Disclaimer Banner */}
        <View style={styles.disclaimerBanner}>
          <MaterialIcons name="info" size={20} color="#DC2626" />
          <Text style={styles.disclaimerBannerText}>
            Educational information only. Not medical advice. Always consult healthcare professionals.
          </Text>
        </View>

        {/* Mock Data Warning */}
        {analysisResult.isMockData && (
          <View style={styles.mockDataWarning}>
            <MaterialIcons name="info" size={20} color="#F59E0B" />
            <Text style={styles.mockDataWarningText}>
              This is mock data for testing. To enable real camera OCR, configure Google Vision API on the server.
            </Text>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.medicationCard}>
          <Text style={styles.medicationName}>
            {analysisResult.medicationName || analysisResult.productName || 'Unknown Product'}
          </Text>
          <Text style={styles.medicationType}>
            {analysisResult.medicationType || analysisResult.productType || 'Health & Wellness Product'}
          </Text>
        </View>

        {/* Wellness Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Natural Alternatives</Text>
          {analysisResult.alternatives && analysisResult.alternatives.length > 0 ? (
            analysisResult.alternatives.map((alternative, index) => (
              <View key={index} style={styles.alternativeItem}>
                <View style={styles.alternativeHeader}>
                  <Text style={styles.alternativeName}>{alternative.name}</Text>
                  <View style={styles.effectivenessBadge}>
                    <Text style={styles.effectivenessText}>
                      {alternative.effectiveness || 'Moderate'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.alternativeDescription}>
                  {alternative.description || 'Natural alternative with similar benefits'}
                </Text>
                {alternative.benefits && (
                  <View style={styles.benefitsList}>
                    {alternative.benefits.map((benefit, idx) => (
                      <Text key={idx} style={styles.benefitItem}>
                        - {benefit}
                      </Text>
                    ))}
                  </View>
                )}
                {alternative.dosage && (
                  <Text style={styles.dosageText}>
                    Suggested dosage: {alternative.dosage}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noAlternatives}>
              No natural alternatives found for this medication.
            </Text>
          )}
        </View>

        {/* Warnings */}
        {analysisResult.warnings && analysisResult.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Warnings</Text>
            {analysisResult.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <MaterialIcons name="warning" size={16} color="#F59E0B" />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {analysisResult.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <MaterialIcons name="lightbulb" size={16} color="#10B981" />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            This information is for educational purposes only. Always consult with healthcare professionals before making any changes to your wellness routine.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>New Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  disclaimerBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclaimerBannerText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  medicationCard: {
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
  medicationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  medicationType: {
    fontSize: 14,
    color: '#6B7280',
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
  alternativeItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  effectivenessBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  effectivenessText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  alternativeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  dosageText: {
    fontSize: 13,
    color: '#059669',
    fontStyle: 'italic',
    marginTop: 8,
  },
  noAlternatives: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  disclaimerContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  mockDataWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mockDataWarningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
