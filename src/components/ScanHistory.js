import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

function ScanHistory({ user, navigation }) {
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const loadScanHistory = async () => {
      try {
        const premiumStatus = await SecureStore.getItemAsync('is_premium') || 'false';
        setIsPremium(premiumStatus === 'true');
        
        if (user?.uid) {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setScanHistory(data.scanHistory || []);
          }
        }
      } catch (error) {
        console.error("Error loading scan history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScanHistory();
  }, [user?.uid]);

  const exportToPDF = async (scan) => {
    if (!isPremium) {
      Alert.alert(
        '📥 Premium Feature',
        'Download your wellness reports!\n\nUpgrade to Premium to export your discoveries.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now 🚀', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }
    
    try {
      const content = `NATURINEX WELLNESS REPORT
Generated: ${new Date().toLocaleDateString()}

Product: ${scan.productName || scan.medication}
Date Scanned: ${new Date(scan.timestamp).toLocaleDateString()}

Natural Alternatives:
${scan.results}

DISCLAIMER: This information is for educational purposes only. 
Always consult healthcare professionals before making any wellness decisions.
`;
      
      const filename = `naturinex-report-${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri);
      
      Alert.alert('Success', 'Report exported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Unable to export report. Please try again.');
    }
  };

  const shareResults = async (scan) => {
    if (!isPremium) {
      Alert.alert(
        '🌟 Premium Feature',
        'Share your wellness discoveries!\n\nUpgrade to Premium to share results.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now 🚀', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }
    
    try {
      const shareText = `🌿 Natural Wellness Discovery\n\nProduct: ${scan.productName || scan.medication}\nDate: ${new Date(scan.timestamp).toLocaleDateString()}\n\nResults:\n${scan.results}\n\nDiscovered with Naturinex - Your Natural Wellness Guide`;
      
      await Sharing.shareAsync(shareText);
    } catch (error) {
      Alert.alert('Error', 'Unable to share. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading scan history...</Text>
      </View>
    );
  }

  if (scanHistory.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="history" size={64} color="#E5E7EB" />
        <Text style={styles.emptyTitle}>No Scan History</Text>
        <Text style={styles.emptyText}>
          Start scanning products to build your wellness history
        </Text>
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderScanItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.scanItem}
      onPress={() => navigation.navigate('Analysis', { 
        analysisResult: { 
          medicationName: item.productName || item.medication,
          results: item.results 
        }
      })}
    >
      <View style={styles.scanInfo}>
        <Text style={styles.productName}>{item.productName || item.medication}</Text>
        <Text style={styles.scanDate}>
          {new Date(item.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        <Text style={styles.resultsPreview} numberOfLines={2}>
          {item.results}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => shareResults(item)}
        >
          <MaterialIcons name="share" size={20} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => exportToPDF(item)}
        >
          <MaterialIcons name="download" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <Text style={styles.subtitle}>{scanHistory.length} scans</Text>
      </View>

      {!isPremium && (
        <View style={styles.premiumBanner}>
          <MaterialIcons name="lock" size={20} color="#F59E0B" />
          <Text style={styles.premiumText}>
            Full history access is a Premium feature
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={scanHistory.slice().reverse()}
        renderItem={renderScanItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Helper function to save scan to history (to be called from Dashboard)
export const saveScanToHistory = async (user, medication, results) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const scanEntry = {
      productName: medication,
      medication: medication,
      results: results,
      timestamp: Date.now()
    };
    
    await updateDoc(userRef, {
      scanHistory: arrayUnion(scanEntry)
    });
  } catch (error) {
    console.error("Error saving scan to history:", error);
  }
};

export default ScanHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
  },
  scanButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  premiumBanner: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
  },
  premiumText: {
    flex: 1,
    marginLeft: 10,
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
  },
  scanItem: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  scanDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  resultsPreview: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 15,
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
});
