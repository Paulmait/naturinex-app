import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { auth } from '../../firebaseConfig';
import { PRICING_TIERS } from '../config/pricing';

const ScanHistory = ({ subscriptionTier = 'free', onUpgrade }) => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const isPremium = ['premium', 'plus', 'pro'].includes(subscriptionTier?.toLowerCase());
  const ITEMS_PER_PAGE = 20;

  const fetchScans = useCallback(async (pageNum = 0, refresh = false) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('scans')
        .select('*', { count: 'exact' })
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (refresh || pageNum === 0) {
        setScans(data || []);
      } else {
        setScans(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching scan history:', error);
      Alert.alert('Error', 'Failed to load scan history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isPremium) {
      fetchScans();
    } else {
      setLoading(false);
    }
  }, [isPremium, fetchScans]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScans(0, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchScans(page + 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openScanDetails = (scan) => {
    setSelectedScan(scan);
    setModalVisible(true);
  };

  const renderScanItem = ({ item }) => (
    <TouchableOpacity
      style={styles.scanItem}
      onPress={() => openScanDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.scanIcon}>
        <Ionicons name="medical" size={24} color="#10B981" />
      </View>
      <View style={styles.scanInfo}>
        <Text style={styles.medicationName} numberOfLines={1}>
          {item.medication_name || 'Unknown Medication'}
        </Text>
        <Text style={styles.scanDate}>{formatDate(item.created_at)}</Text>
        {item.natural_alternatives && (
          <Text style={styles.alternativesCount}>
            {Array.isArray(item.natural_alternatives)
              ? `${item.natural_alternatives.length} alternatives found`
              : 'Alternatives available'}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderScanDetails = () => {
    if (!selectedScan) return null;

    const alternatives = selectedScan.natural_alternatives || [];

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scan Details</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Medication</Text>
              <Text style={styles.detailValue}>{selectedScan.medication_name}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Scanned On</Text>
              <Text style={styles.detailValue}>{formatDate(selectedScan.created_at)}</Text>
            </View>

            {selectedScan.confidence_score && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Confidence Score</Text>
                <Text style={styles.detailValue}>
                  {Math.round(selectedScan.confidence_score * 100)}%
                </Text>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Natural Alternatives</Text>
              {Array.isArray(alternatives) && alternatives.length > 0 ? (
                alternatives.map((alt, index) => (
                  <View key={index} style={styles.alternativeItem}>
                    <View style={styles.altHeader}>
                      <Ionicons name="leaf" size={16} color="#10B981" />
                      <Text style={styles.altName}>{alt.name || alt}</Text>
                    </View>
                    {alt.description && (
                      <Text style={styles.altDescription}>{alt.description}</Text>
                    )}
                    {alt.dosage && (
                      <Text style={styles.altDosage}>Suggested dosage: {alt.dosage}</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noAlternatives}>No alternatives recorded</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Show upgrade prompt for free users
  if (!isPremium) {
    return (
      <View style={styles.upgradeContainer}>
        <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
        <Text style={styles.upgradeTitle}>Scan History</Text>
        <Text style={styles.upgradeDescription}>
          Upgrade to Premium to save and access your complete scan history.
        </Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>Unlimited scan history</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>Access from any device</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>Export to PDF</Text>
          </View>
        </View>
        {onUpgrade && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (loading && scans.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading scan history...</Text>
      </View>
    );
  }

  if (scans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No Scans Yet</Text>
        <Text style={styles.emptyDescription}>
          Your scan history will appear here after you scan your first medication.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={scans}
        renderItem={renderScanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10B981"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && !loading ? (
            <ActivityIndicator style={styles.footer} color="#10B981" />
          ) : null
        }
      />
      {renderScanDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  upgradeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  upgradeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scanIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  scanDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  alternativesCount: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  footer: {
    paddingVertical: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  alternativeItem: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  altHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  altName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  altDescription: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  altDosage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noAlternatives: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default ScanHistory;
