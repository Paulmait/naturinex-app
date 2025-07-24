import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getAuth, signOut } from 'firebase/auth';

export default function ProfileScreen({ navigation }) {
  const [userEmail, setUserEmail] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await SecureStore.getItemAsync('user_email');
      const count = await SecureStore.getItemAsync('scan_count') || '0';
      const premium = await SecureStore.getItemAsync('is_premium') || 'false';
      const notifications = await SecureStore.getItemAsync('notifications_enabled') || 'true';
      const autoLogout = await SecureStore.getItemAsync('auto_logout_enabled') || 'true';

      setUserEmail(email || '');
      setScanCount(parseInt(count));
      setIsPremium(premium === 'true');
      setNotificationsEnabled(notifications === 'true');
      setAutoLogoutEnabled(autoLogout === 'true');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              await SecureStore.deleteItemAsync('auth_token');
              await SecureStore.deleteItemAsync('user_id');
              await SecureStore.deleteItemAsync('user_email');
              await SecureStore.deleteItemAsync('scan_count');
              await SecureStore.deleteItemAsync('is_premium');
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSubscription = () => {
    navigation.navigate('Subscription');
  };

  const handleNotificationsToggle = async (value) => {
    setNotificationsEnabled(value);
    await SecureStore.setItemAsync('notifications_enabled', value.toString());
  };

  const handleAutoLogoutToggle = async (value) => {
    setAutoLogoutEnabled(value);
    await SecureStore.setItemAsync('auto_logout_enabled', value.toString());
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.setItemAsync('scan_count', '0');
              setScanCount(0);
              Alert.alert('Success', 'Scan history cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history.');
            }
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here.');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of service content will be displayed here.');
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Support contact information will be displayed here.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{userEmail.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{userEmail}</Text>
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionText}>
              {isPremium ? 'Premium Member' : 'Free Tier'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{scanCount}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{isPremium ? '∞' : '3'}</Text>
            <Text style={styles.statLabel}>Daily Limit</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{isPremium ? '∞' : '10'}</Text>
            <Text style={styles.statLabel}>Monthly Limit</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications" size={24} color="#10B981" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={notificationsEnabled ? 'white' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="security" size={24} color="#10B981" />
              <Text style={styles.settingText}>Auto Logout</Text>
            </View>
            <Switch
              value={autoLogoutEnabled}
              onValueChange={handleAutoLogoutToggle}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={autoLogoutEnabled ? 'white' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleSubscription}>
            <MaterialIcons name="star" size={24} color="#10B981" />
            <Text style={styles.actionText}>
              {isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
            </Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleClearHistory}>
            <MaterialIcons name="delete" size={24} color="#EF4444" />
            <Text style={styles.actionText}>Clear Scan History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handlePrivacyPolicy}>
            <MaterialIcons name="privacy-tip" size={24} color="#10B981" />
            <Text style={styles.actionText}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleTermsOfService}>
            <MaterialIcons name="description" size={24} color="#10B981" />
            <Text style={styles.actionText}>Terms of Service</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleContactSupport}>
            <MaterialIcons name="support-agent" size={24} color="#10B981" />
            <Text style={styles.actionText}>Contact Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  subscriptionBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  subscriptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
}); 