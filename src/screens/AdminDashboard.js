import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Constants from 'expo-constants';
import { useAdminTimeout } from '../hooks/useAdminTimeout';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app-zsga.onrender.com';

export default function AdminDashboard({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    todayScans: 0,
    monthlyRevenue: 0,
    popularProducts: [],
    recentScans: []
  });
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const auth = getAuth();
  const db = getFirestore();
  
  // Use admin timeout for security
  const { resetTimeout } = useAdminTimeout(navigation, isAdmin);

  useEffect(() => {
    checkAdminAccess();
    loadAnalytics();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Access Denied', 'You must be logged in as an admin.');
        navigation.goBack();
        return;
      }

      // Check admin status in database
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('__name__', '==', user.uid)
      ));

      if (userDoc.empty || !userDoc.docs[0].data()?.metadata?.isAdmin) {
        Alert.alert('Access Denied', 'You do not have admin privileges.');
        navigation.goBack();
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Admin check error:', error);
      Alert.alert('Error', 'Failed to verify admin access.');
      navigation.goBack();
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch analytics from server
      const response = await fetch(`${API_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      
      // Get recent scans
      const scansQuery = query(
        collection(db, 'scanHistory'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const recentScansSnapshot = await getDocs(scansQuery);
      const recentScans = recentScansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAnalytics({
        totalUsers: data.totalUsers || 0,
        premiumUsers: data.premiumUsers || 0,
        todayScans: data.todayScans || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        popularProducts: data.popularProducts || [],
        recentScans
      });

    } catch (error) {
      console.error('Analytics error:', error);
      Alert.alert('Error', 'Failed to load analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const renderOverview = () => (
    <View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <MaterialIcons name="people" size={32} color="#10B981" />
          <Text style={styles.statNumber}>{analytics.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialIcons name="star" size={32} color="#F59E0B" />
          <Text style={styles.statNumber}>{analytics.premiumUsers}</Text>
          <Text style={styles.statLabel}>Premium Users</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialIcons name="camera" size={32} color="#3B82F6" />
          <Text style={styles.statNumber}>{analytics.todayScans}</Text>
          <Text style={styles.statLabel}>Scans Today</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialIcons name="attach-money" size={32} color="#10B981" />
          <Text style={styles.statNumber}>${analytics.monthlyRevenue}</Text>
          <Text style={styles.statLabel}>Monthly Revenue</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Products Today</Text>
        {analytics.popularProducts.slice(0, 5).map((product, index) => (
          <View key={index} style={styles.productRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCount}>{product.scanCount} scans</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentScans = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Scans</Text>
      {analytics.recentScans.map((scan) => (
        <View key={scan.id} style={styles.scanCard}>
          <View style={styles.scanHeader}>
            <Text style={styles.scanProduct}>{scan.productInfo?.name || 'Unknown'}</Text>
            <Text style={styles.scanTime}>
              {new Date(scan.timestamp?.toDate()).toLocaleString()}
            </Text>
          </View>
          <View style={styles.scanDetails}>
            <Text style={styles.scanUser}>User: {scan.userId?.substring(0, 8)}...</Text>
            <Text style={styles.scanConfidence}>
              Confidence: {scan.productInfo?.ocrConfidence || 'N/A'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderUsers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>User Management</Text>
      <TouchableOpacity style={styles.actionButton}>
        <MaterialIcons name="file-download" size={24} color="white" />
        <Text style={styles.actionButtonText}>Export User Data</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <MaterialIcons name="search" size={24} color="white" />
        <Text style={styles.actionButtonText}>Search Users</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <MaterialIcons name="analytics" size={24} color="white" />
        <Text style={styles.actionButtonText}>Detailed Analytics</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onScroll={resetTimeout}
      scrollEventThrottle={1000}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <MaterialIcons name="admin-panel-settings" size={24} color="#10B981" />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'scans' && styles.activeTab]}
          onPress={() => setSelectedTab('scans')}
        >
          <Text style={[styles.tabText, selectedTab === 'scans' && styles.activeTabText]}>
            Recent Scans
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'users' && styles.activeTab]}
          onPress={() => setSelectedTab('users')}
        >
          <Text style={[styles.tabText, selectedTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'scans' && renderRecentScans()}
        {selectedTab === 'users' && renderUsers()}
      </View>
    </ScrollView>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#10B981',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    color: '#374151',
  },
  productCount: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  scanCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scanProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  scanTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  scanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scanUser: {
    fontSize: 14,
    color: '#6B7280',
  },
  scanConfidence: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});