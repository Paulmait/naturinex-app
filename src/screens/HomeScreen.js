import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getAuth, signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const [userEmail, setUserEmail] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [freeScansRemaining, setFreeScansRemaining] = useState(0);
  const auth = getAuth();

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await SecureStore.getItemAsync('user_email');
      const count = await SecureStore.getItemAsync('scan_count') || '0';
      const guestStatus = await SecureStore.getItemAsync('is_guest') || 'false';
      const remainingScans = await SecureStore.getItemAsync('free_scans_remaining') || '0';
      
      setUserEmail(email || '');
      setScanCount(parseInt(count));
      setIsGuest(guestStatus === 'true');
      setFreeScansRemaining(parseInt(remainingScans));
    } catch (error) {
      // Error loading user data - handled silently
    }
  };

  const handleScan = async () => {
    if (isGuest && freeScansRemaining <= 0) {
      Alert.alert(
        '🎯 Unlock Unlimited Wellness',
        'You\'ve discovered the power of natural alternatives! Sign up now to:\n\n✓ Unlimited product scans\n✓ Save & share your discoveries\n✓ Access complete wellness history\n✓ Export your personal wellness guide\n\n🎁 Special offer: Start your wellness journey today!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Start Free Trial 🚀', onPress: () => navigation.replace('Login'), style: 'default' }
        ]
      );
      return;
    }
    navigation.navigate('Camera');
  };

  const handleHistory = () => {
    if (isGuest) {
      Alert.alert(
        '📊 Premium Feature',
        'Access your complete wellness history!\\n\\nSign up to:\\n✓ View all past scans\\n✓ Download reports\\n✓ Share discoveries\\n✓ Track your wellness journey',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Sign Up Now 🚀', onPress: () => navigation.replace('Login') }
        ]
      );
      return;
    }
    navigation.navigate('ScanHistory');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleSubscription = () => {
    navigation.navigate('Subscription');
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
              await SecureStore.deleteItemAsync('is_guest');
              await SecureStore.deleteItemAsync('free_scans_remaining');
              navigation.replace('Login');
            } catch (error) {
              // Logout error - showing alert to user
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.userEmail}>{isGuest ? 'Guest User' : userEmail}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
            <MaterialIcons name="person" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Guest Banner */}
        {isGuest && (
          <View style={styles.guestBanner}>
            <View style={styles.scanCounterContainer}>
              <Text style={styles.scanCounterNumber}>{freeScansRemaining}</Text>
              <Text style={styles.scanCounterLabel}>Free Scans Left</Text>
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.guestBannerText}>
                {freeScansRemaining > 0 
                  ? `Try ${freeScansRemaining} more ${freeScansRemaining === 1 ? 'scan' : 'scans'} free!` 
                  : '🎯 Time to unlock unlimited scans!'}
              </Text>
              <TouchableOpacity 
                style={[styles.upgradeButton, freeScansRemaining === 0 && styles.upgradeButtonPulse]} 
                onPress={() => navigation.replace('Login')}
              >
                <Text style={styles.upgradeButtonText}>
                  {freeScansRemaining > 0 ? 'Sign Up' : 'Unlock Now 🚀'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{scanCount}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{isGuest ? freeScansRemaining : '∞'}</Text>
            <Text style={styles.statLabel}>{isGuest ? 'Scans Left' : 'Unlimited'}</Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.mainAction} onPress={handleScan}>
            <View style={styles.actionIcon}>
              <MaterialIcons name="camera-alt" size={32} color="white" />
            </View>
            <Text style={styles.actionTitle}>Scan Product</Text>
            <Text style={styles.actionSubtitle}>
              Discover natural wellness alternatives
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryAction} onPress={handleHistory}>
              <MaterialIcons name="history" size={24} color="#10B981" />
              <Text style={styles.secondaryActionText}>Scan History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={handleSubscription}>
              <MaterialIcons name="star" size={24} color="#10B981" />
              <Text style={styles.secondaryActionText}>Premium</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Hold product label steady for best results
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Ensure good lighting for accurate scanning
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Upgrade to Premium for unlimited scans
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="home" size={24} color="#10B981" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleScan}>
          <MaterialIcons name="camera-alt" size={24} color="#6B7280" />
          <Text style={styles.navText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleHistory}>
          <MaterialIcons name="history" size={24} color="#6B7280" />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfile}>
          <MaterialIcons name="person" size={24} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  scanCounterContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  scanCounterNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  scanCounterLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  bannerTextContainer: {
    flex: 1,
  },
  guestBannerText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  upgradeButtonPulse: {
    backgroundColor: '#DC2626',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  mainAction: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
}); 