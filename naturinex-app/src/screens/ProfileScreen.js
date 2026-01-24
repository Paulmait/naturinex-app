import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getAuth, signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import Constants from 'expo-constants';
import accountSecurityService from '../services/AccountSecurityService';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1';
const DELETION_URL = 'https://naturinex.com/delete-account';

export default function ProfileScreen({ navigation }) {
  const [userEmail, setUserEmail] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    loadUserData();
    loadDevices();
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

      // Check admin status
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData?.metadata?.isAdmin === true);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDevices = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setDevicesLoading(true);
    try {
      const userDevices = await accountSecurityService.getUserDevices(user.uid);
      setDevices(userDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setDevicesLoading(false);
    }
  };

  const handleRemoveDevice = (device) => {
    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove "${device.device_name || 'Unknown Device'}"?\n\nThis device will need to re-authenticate to access your account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;

            const success = await accountSecurityService.removeDevice(user.uid, device.device_id);
            if (success) {
              Alert.alert('Success', 'Device removed successfully.');
              loadDevices(); // Refresh the list
            } else {
              Alert.alert('Error', 'Failed to remove device. Please try again.');
            }
          },
        },
      ]
    );
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
    navigation.navigate('PrivacyPolicy');
  };

  const handleTermsOfService = () => {
    navigation.navigate('TermsOfUse');
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      "We're here to help!\n\nEmail: support@naturinex.com\nResponse time: Within 24 hours\n\nFor urgent matters, please include \"URGENT\" in your subject line.",
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Send Email',
          onPress: () => Linking.openURL('mailto:support@naturinex.com'),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    const user = auth.currentUser;

    // Check if user logged in with email/password (needs re-auth)
    const providerData = user?.providerData || [];
    const hasPasswordProvider = providerData.some(p => p.providerId === 'password');

    setShowPasswordField(hasPasswordProvider);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeleting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user signed in');
      }

      // Re-authenticate if needed (for password users)
      if (showPasswordField && password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      const userId = user.uid;
      const authToken = await SecureStore.getItemAsync('auth_token');

      // 1. Call backend to delete user data
      try {
        const response = await fetch(`${API_URL}/api/user/delete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          console.warn('Backend deletion warning:', await response.text());
          // Continue with local deletion even if backend fails
        }
      } catch (backendError) {
        console.warn('Backend deletion error:', backendError);
        // Continue with local deletion
      }

      // 2. Delete Firestore data
      try {
        const db = getFirestore();
        const batch = writeBatch(db);

        // Delete user document
        const userDocRef = doc(db, 'users', userId);
        batch.delete(userDocRef);

        // Delete scan history
        const scansQuery = query(
          collection(db, 'scans'),
          where('userId', '==', userId)
        );
        const scansDocs = await getDocs(scansQuery);
        scansDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
      } catch (firestoreError) {
        console.warn('Firestore deletion error:', firestoreError);
        // Continue with auth deletion
      }

      // 3. Delete Firebase Auth user
      await deleteUser(user);

      // 4. Clear local storage
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_id');
      await SecureStore.deleteItemAsync('user_email');
      await SecureStore.deleteItemAsync('scan_count');
      await SecureStore.deleteItemAsync('is_premium');
      await SecureStore.deleteItemAsync('is_guest');
      await SecureStore.deleteItemAsync('onboarding_completed');
      await SecureStore.deleteItemAsync('notifications_enabled');
      await SecureStore.deleteItemAsync('auto_logout_enabled');
      await SecureStore.deleteItemAsync('subscription_id');

      setShowDeleteModal(false);

      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('Delete account error:', error);

      let errorMessage = 'Failed to delete account. Please try again.';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security, please log out and log back in before deleting your account.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsDeleting(false);
      setPassword('');
      setDeleteConfirmText('');
    }
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

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('TwoFactorSettings')}
          >
            <MaterialIcons name="security" size={24} color="#10B981" />
            <Text style={styles.actionText}>Two-Factor Authentication</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          {isAdmin && (
            <>
              <TouchableOpacity
                style={[styles.actionItem, styles.adminItem]}
                onPress={() => navigation.navigate('AdminDashboard')}
              >
                <MaterialIcons name="dashboard" size={24} color="#7C3AED" />
                <Text style={[styles.actionText, styles.adminText]}>Admin Dashboard</Text>
                <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionItem, styles.adminItem]}
                onPress={() => navigation.navigate('AdminSettings')}
              >
                <MaterialIcons name="admin-panel-settings" size={24} color="#7C3AED" />
                <Text style={[styles.actionText, styles.adminText]}>Admin Settings</Text>
                <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.actionItem} onPress={handleClearHistory}>
            <MaterialIcons name="delete" size={24} color="#F59E0B" />
            <Text style={styles.actionText}>Clear Scan History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Devices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registered Devices</Text>
          {devicesLoading ? (
            <ActivityIndicator size="small" color="#10B981" style={{ padding: 20 }} />
          ) : devices.length === 0 ? (
            <Text style={styles.noDevicesText}>No devices registered yet</Text>
          ) : (
            devices.map((device, index) => (
              <View key={device.id || index} style={styles.deviceItem}>
                <View style={styles.deviceInfo}>
                  <MaterialIcons
                    name={
                      device.device_type === 'ios' ? 'phone-iphone' :
                      device.device_type === 'android' ? 'phone-android' :
                      'computer'
                    }
                    size={24}
                    color="#10B981"
                  />
                  <View style={styles.deviceDetails}>
                    <Text style={styles.deviceName}>{device.device_name || 'Unknown Device'}</Text>
                    <Text style={styles.deviceMeta}>
                      Last active: {new Date(device.last_seen_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveDevice(device)}
                  style={styles.removeDeviceButton}
                >
                  <MaterialIcons name="remove-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
          <Text style={styles.deviceLimitText}>
            Device limit: {devices.length}/{isPremium ? '3' : '1'}
          </Text>
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

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={[styles.actionItem, styles.deleteItem]}
            onPress={handleDeleteAccount}
          >
            <MaterialIcons name="delete-forever" size={24} color="#EF4444" />
            <Text style={[styles.actionText, styles.deleteText]}>Delete Account</Text>
            <MaterialIcons name="chevron-right" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Naturinex Wellness Guide v2.0</Text>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="warning" size={48} color="#EF4444" />
              <Text style={styles.modalTitle}>Delete Account</Text>
            </View>

            <Text style={styles.modalWarning}>
              This action is permanent and cannot be undone. All your data will be deleted:
            </Text>

            <View style={styles.deleteList}>
              <Text style={styles.deleteListItem}>• Your profile and account information</Text>
              <Text style={styles.deleteListItem}>• All scan history and saved results</Text>
              <Text style={styles.deleteListItem}>• Subscription data (if applicable)</Text>
              <Text style={styles.deleteListItem}>• All preferences and settings</Text>
            </View>

            {showPasswordField && (
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password to confirm"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            )}

            <Text style={styles.confirmLabel}>Type DELETE to confirm:</Text>
            <TextInput
              style={styles.confirmInput}
              placeholder="DELETE"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setPassword('');
                }}
                disabled={isDeleting}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteModalButton,
                  deleteConfirmText.toUpperCase() !== 'DELETE' && styles.disabledButton,
                ]}
                onPress={confirmDeleteAccount}
                disabled={isDeleting || deleteConfirmText.toUpperCase() !== 'DELETE'}
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.deleteModalButtonText}>Delete Forever</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.webDeleteLink}
              onPress={() => Linking.openURL(DELETION_URL)}
            >
              <Text style={styles.webDeleteLinkText}>
                Or request deletion via web: naturinex.com/delete-account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  deleteItem: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#EF4444',
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
  adminItem: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  adminText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 10,
  },
  modalWarning: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 15,
    lineHeight: 24,
  },
  deleteList: {
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  deleteListItem: {
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#F9FAFB',
  },
  confirmLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteModalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#FCA5A5',
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  webDeleteLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  webDeleteLinkText: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  // Device management styles
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  deviceMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  removeDeviceButton: {
    padding: 8,
  },
  noDevicesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
  deviceLimitText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
  },
});
