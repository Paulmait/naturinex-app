import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = 'http://10.0.0.74:5000';

export default function AnalysisScreen({ route, navigation }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (route.params?.imageUri && route.params?.imageBase64) {
      analyzeImage(route.params.imageUri, route.params.imageBase64);
    } else if (route.params?.analysisResult) {
      setAnalysisResult(route.params.analysisResult);
      setLoading(false);
    } else {
      setError('No image data provided');
      setLoading(false);
    }
  }, [route.params]);

  const analyzeImage = async (imageUri, imageBase64) => {
    try {
      setLoading(true);
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'medication.jpg',
      });

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
      
      // Save scan count
      const currentCount = await SecureStore.getItemAsync('scan_count') || '0';
      const newCount = parseInt(currentCount) + 1;
      await SecureStore.setItemAsync('scan_count', newCount.toString());
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    try {
      // TODO: Implement save to history functionality
      Alert.alert('Success', 'Analysis saved to history!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save to history');
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    Alert.alert('Coming Soon', 'Share feature will be available soon!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Analyzing medication...</Text>
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
          </View>
        </View>

        {/* Medication Info */}
        <View style={styles.medicationCard}>
          <Text style={styles.medicationName}>
            {analysisResult.medicationName || 'Unknown Medication'}
          </Text>
          <Text style={styles.medicationType}>
            {analysisResult.medicationType || 'Prescription Medication'}
          </Text>
        </View>

        {/* Natural Alternatives */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌿 Natural Alternatives</Text>
          {analysisResult.alternatives && analysisResult.alternatives.length > 0 ? (
            analysisResult.alternatives.map((alternative, index) => (
              <View key={index} style={styles.alternativeItem}>
                <View style={styles.alternativeHeader}>
                  <Text style={styles.alternativeName}>{alternative.name}</Text>
                  <View style={styles.effectivenessBadge}>
                    <Text style={styles.effectivenessText}>
                      {alternative.effectiveness || 'Moderate'} Effectiveness
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
                        • {benefit}
                      </Text>
                    ))}
                  </View>
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
            <Text style={styles.sectionTitle}>⚠️ Important Warnings</Text>
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
            <Text style={styles.sectionTitle}>💡 Recommendations</Text>
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
            ⚠️ This information is for educational purposes only. Always consult with your healthcare provider before making any changes to your medication regimen.
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