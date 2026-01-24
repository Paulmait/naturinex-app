/**
 * Training Data Consent Component
 *
 * Modal dialog for obtaining user consent for LLM training data collection.
 * Shows clear explanation of what data is collected and how it's used.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import TrainingDataService from '../services/TrainingDataService';

export default function TrainingDataConsent({ visible, onClose, onConsentChange }) {
  const [loading, setLoading] = useState(false);
  const [consentStatus, setConsentStatus] = useState(null);
  const [imageConsent, setImageConsent] = useState(true);

  useEffect(() => {
    if (visible) {
      loadConsentStatus();
    }
  }, [visible]);

  const loadConsentStatus = async () => {
    const status = await TrainingDataService.getConsentStatus();
    setConsentStatus(status);
  };

  const handleGiveConsent = async () => {
    setLoading(true);
    try {
      const result = await TrainingDataService.giveConsent();
      if (result.success) {
        setConsentStatus({ hasConsent: true });
        onConsentChange?.(true);
        onClose();
      }
    } catch (error) {
      console.error('Consent error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async () => {
    setLoading(true);
    try {
      const result = await TrainingDataService.revokeConsent();
      if (result.success) {
        setConsentStatus({ hasConsent: false });
        onConsentChange?.(false);
      }
    } catch (error) {
      console.error('Revoke error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    onConsentChange?.(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="psychology" size={48} color="#7C3AED" />
              <Text style={styles.title}>Help Improve Our AI</Text>
              <Text style={styles.subtitle}>
                Your scans can help us build better wellness recommendations
              </Text>
            </View>

            {/* Current Status */}
            {consentStatus?.hasConsent && (
              <View style={styles.statusBanner}>
                <MaterialIcons name="check-circle" size={20} color="#10B981" />
                <Text style={styles.statusText}>
                  You're currently helping improve our AI
                </Text>
              </View>
            )}

            {/* What We Collect */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What We Collect</Text>

              <View style={styles.item}>
                <MaterialIcons name="check" size={20} color="#10B981" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Medication Names</Text>
                  <Text style={styles.itemDesc}>Names of products you scan</Text>
                </View>
              </View>

              <View style={styles.item}>
                <MaterialIcons name="check" size={20} color="#10B981" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>AI Responses</Text>
                  <Text style={styles.itemDesc}>Our suggestions and alternatives</Text>
                </View>
              </View>

              <View style={styles.item}>
                <MaterialIcons name="check" size={20} color="#10B981" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Scan Images (Optional)</Text>
                  <Text style={styles.itemDesc}>Photos of product labels</Text>
                </View>
              </View>
            </View>

            {/* What We DON'T Collect */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What We DON'T Collect</Text>

              <View style={styles.item}>
                <MaterialIcons name="close" size={20} color="#EF4444" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Personal Information</Text>
                  <Text style={styles.itemDesc}>No names, emails, or identifiers</Text>
                </View>
              </View>

              <View style={styles.item}>
                <MaterialIcons name="close" size={20} color="#EF4444" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Location Data</Text>
                  <Text style={styles.itemDesc}>We don't track where you are</Text>
                </View>
              </View>

              <View style={styles.item}>
                <MaterialIcons name="close" size={20} color="#EF4444" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Health Records</Text>
                  <Text style={styles.itemDesc}>No connection to your medical history</Text>
                </View>
              </View>
            </View>

            {/* How It's Used */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How It's Used</Text>
              <Text style={styles.description}>
                Your anonymized data helps train our AI to provide better wellness suggestions.
                All data is:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>• Completely anonymized</Text>
                <Text style={styles.bullet}>• Never sold to third parties</Text>
                <Text style={styles.bullet}>• Used only for improving Naturinex</Text>
                <Text style={styles.bullet}>• Stored securely with encryption</Text>
              </View>
            </View>

            {/* Image Consent Toggle */}
            {!consentStatus?.hasConsent && (
              <View style={styles.toggleSection}>
                <View style={styles.toggleInfo}>
                  <MaterialIcons name="photo-camera" size={24} color="#6B7280" />
                  <View style={styles.toggleContent}>
                    <Text style={styles.toggleTitle}>Include scan images</Text>
                    <Text style={styles.toggleDesc}>
                      Help improve our image recognition
                    </Text>
                  </View>
                </View>
                <Switch
                  value={imageConsent}
                  onValueChange={setImageConsent}
                  trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
                  thumbColor={imageConsent ? '#7C3AED' : '#F3F4F6'}
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {consentStatus?.hasConsent ? (
                <>
                  <TouchableOpacity
                    style={styles.revokeButton}
                    onPress={handleRevokeConsent}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#EF4444" />
                    ) : (
                      <Text style={styles.revokeButtonText}>Stop Contributing</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.consentButton}
                    onPress={handleGiveConsent}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <MaterialIcons name="favorite" size={20} color="white" />
                        <Text style={styles.consentButtonText}>Yes, I Want to Help</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={handleDecline}
                    disabled={loading}
                  >
                    <Text style={styles.declineButtonText}>No Thanks</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Privacy Link */}
            <TouchableOpacity style={styles.privacyLink}>
              <Text style={styles.privacyLinkText}>
                View our full Privacy Policy
              </Text>
              <MaterialIcons name="open-in-new" size={14} color="#7C3AED" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    color: '#065F46',
    marginLeft: 8,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemContent: {
    marginLeft: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  bulletList: {
    marginTop: 12,
  },
  bullet: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleContent: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  toggleDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    marginBottom: 16,
  },
  consentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  consentButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  declineButton: {
    alignItems: 'center',
    padding: 12,
  },
  declineButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  revokeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  revokeButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  privacyLinkText: {
    color: '#7C3AED',
    fontSize: 14,
    marginRight: 4,
  },
});
