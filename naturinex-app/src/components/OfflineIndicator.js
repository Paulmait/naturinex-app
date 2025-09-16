import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import OfflineServiceV2 from '../services/OfflineServiceV2';
import ErrorService from '../services/ErrorService';

/**
 * OfflineIndicator - Shows network status and offline mode information
 */
const OfflineIndicator = ({ style, onPress }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStats, setSyncStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Listen to network changes
    const unsubscribe = OfflineServiceV2.addNetworkListener((networkInfo) => {
      setIsOnline(networkInfo.isOnline);

      // Animate indicator when going offline/online
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Load initial stats
    loadSyncStats();

    // Update stats periodically
    const interval = setInterval(loadSyncStats, 10000); // Every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadSyncStats = async () => {
    try {
      const stats = await OfflineServiceV2.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      ErrorService.logError(error, 'OfflineIndicator.loadSyncStats');
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowDetails(true);
    }
  };

  const handleSync = async () => {
    try {
      if (isOnline) {
        await OfflineServiceV2.forceSyncNow();
        await loadSyncStats();
      }
    } catch (error) {
      ErrorService.logError(error, 'OfflineIndicator.handleSync');
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#EF4444'; // Red for offline
    if (syncStats?.queuedOperations > 0) return '#F59E0B'; // Yellow for pending sync
    return '#10B981'; // Green for online and synced
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStats?.syncInProgress) return 'Syncing...';
    if (syncStats?.queuedOperations > 0) return `${syncStats.queuedOperations} pending`;
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'wifi-off';
    if (syncStats?.syncInProgress) return 'sync';
    if (syncStats?.queuedOperations > 0) return 'schedule';
    return 'wifi';
  };

  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'Never';
    const now = new Date();
    const diff = now - new Date(lastSync);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <>
      <Animated.View style={[styles.container, style, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.indicator, { backgroundColor: getStatusColor() }]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={getStatusIcon()}
            size={16}
            color="white"
            style={syncStats?.syncInProgress && styles.rotating}
          />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Connection Status</Text>
            <TouchableOpacity
              onPress={() => setShowDetails(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Current Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Status</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <MaterialIcons
                    name={getStatusIcon()}
                    size={24}
                    color={getStatusColor()}
                  />
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusMainText}>
                      {isOnline ? 'Connected' : 'Offline'}
                    </Text>
                    <Text style={styles.statusSubText}>
                      {getStatusText()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sync Statistics */}
            {syncStats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sync Information</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{syncStats.queuedOperations}</Text>
                    <Text style={styles.statLabel}>Queued Operations</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{syncStats.pendingScans}</Text>
                    <Text style={styles.statLabel}>Pending Scans</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {formatLastSync(syncStats.lastSync)}
                    </Text>
                    <Text style={styles.statLabel}>Last Sync</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Offline Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offline Features</Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <MaterialIcons name="local-pharmacy" size={20} color="#10B981" />
                  <Text style={styles.featureText}>
                    Medication database cached locally
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="camera-alt" size={20} color="#10B981" />
                  <Text style={styles.featureText}>
                    Scans saved for later upload
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="history" size={20} color="#10B981" />
                  <Text style={styles.featureText}>
                    Scan history available offline
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="nature" size={20} color="#10B981" />
                  <Text style={styles.featureText}>
                    Natural alternatives suggestions
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !isOnline && styles.disabledButton
                ]}
                onPress={handleSync}
                disabled={!isOnline || syncStats?.syncInProgress}
              >
                <MaterialIcons
                  name="sync"
                  size={20}
                  color={!isOnline ? "#9CA3AF" : "white"}
                  style={syncStats?.syncInProgress && styles.rotating}
                />
                <Text style={[
                  styles.actionButtonText,
                  !isOnline && styles.disabledButtonText
                ]}>
                  {syncStats?.syncInProgress ? 'Syncing...' : 'Sync Now'}
                </Text>
              </TouchableOpacity>

              {!isOnline && (
                <View style={styles.offlineNotice}>
                  <MaterialIcons name="info" size={16} color="#6B7280" />
                  <Text style={styles.offlineNoticeText}>
                    You can continue using the app offline. Changes will sync when you're back online.
                  </Text>
                </View>
              )}
            </View>

            {/* Tips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offline Tips</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tipText}>
                  • Scans are automatically saved locally when offline
                </Text>
                <Text style={styles.tipText}>
                  • Medication search works with cached database
                </Text>
                <Text style={styles.tipText}>
                  • Changes sync automatically when connection returns
                </Text>
                <Text style={styles.tipText}>
                  • Enable Wi-Fi for faster syncing
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  rotating: {
    // Note: Rotation animation would be implemented with Animated.View
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusSubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statsGrid: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  featureList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  offlineNoticeText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  tipsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default OfflineIndicator;