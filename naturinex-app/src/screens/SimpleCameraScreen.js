import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import deviceFingerprintService from '../services/deviceFingerprintService';
import aiServiceSecure from '../services/aiServiceSecure';
import logger from '../utils/logger';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app-1.onrender.com';

export default function SimpleCameraScreen({ navigation }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [remainingScans, setRemainingScans] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [libraryPermission, setLibraryPermission] = useState(null);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Check permissions and quota on mount
  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      setCheckingPermissions(true);

      // Check camera and library permissions upfront
      const [cameraStatus, libraryStatus] = await Promise.all([
        ImagePicker.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
      ]);

      setCameraPermission(cameraStatus.status);
      setLibraryPermission(libraryStatus.status);

      // Get device fingerprint
      const fingerprint = await deviceFingerprintService.getDeviceFingerprint();
      setDeviceId(fingerprint);

      // Check if guest user
      const guestStatus = (await SecureStore.getItemAsync('is_guest')) || 'false';
      setIsGuest(guestStatus === 'true');

      // Check quota (server-side)
      if (guestStatus === 'true') {
        const quota = await aiServiceSecure.checkQuota(null, fingerprint);
        setRemainingScans(quota.remainingScans);

        if (quota.isBlocked) {
          Alert.alert(
            'Account Blocked',
            quota.reason || 'Your device has been blocked. Please contact support.',
            [{ text: 'OK', onPress: () => navigation.replace('Login') }]
          );
        }
      }
    } catch (error) {
      logger.error('Failed to initialize camera screen', { error: error.message });
    } finally {
      setCheckingPermissions(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(status);

      if (status !== 'granted') {
        if (!canAskAgain) {
          // User has permanently denied, show settings prompt
          Alert.alert(
            'Camera Permission Required',
            'Camera access is needed to scan medication labels. Please enable camera access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        } else {
          Alert.alert(
            'Camera Permission Required',
            'Please grant camera permission to scan medication labels.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error requesting camera permission', { error: error.message });
      Alert.alert('Error', 'Failed to request camera permission. Please try again.');
      return false;
    }
  };

  const requestLibraryPermission = async () => {
    try {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setLibraryPermission(status);

      if (status !== 'granted') {
        if (!canAskAgain) {
          Alert.alert(
            'Photo Library Permission Required',
            'Photo library access is needed to select medication images. Please enable photo library access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        } else {
          Alert.alert(
            'Photo Library Permission Required',
            'Please grant photo library permission to select medication images.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error requesting library permission', { error: error.message });
      Alert.alert('Error', 'Failed to request photo library permission. Please try again.');
      return false;
    }
  };

  const takePhoto = async () => {
    try {
      // Check/request permission first
      if (cameraPermission !== 'granted') {
        const granted = await requestCameraPermission();
        if (!granted) return;
      }

      logger.info('Launching camera');

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      logger.info('Camera result', { cancelled: result.canceled });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImage(result.assets[0]);
        await analyzeImage(result.assets[0]);
      }
    } catch (error) {
      logger.error('Camera error', { error: error.message, code: error.code });

      // Handle specific iOS/iPad errors
      if (error.message?.includes('Camera not available')) {
        Alert.alert(
          'Camera Not Available',
          'The camera is not available on this device. Please try selecting an image from your photo library instead.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Camera Error',
          'Failed to open camera. Please check your camera permissions and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    }
  };

  const pickImage = async () => {
    try {
      // Check/request permission first
      if (libraryPermission !== 'granted') {
        const granted = await requestLibraryPermission();
        if (!granted) return;
      }

      logger.info('Launching image picker');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      logger.info('Image picker result', { cancelled: result.canceled });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImage(result.assets[0]);
        await analyzeImage(result.assets[0]);
      }
    } catch (error) {
      logger.error('Image picker error', { error: error.message });
      Alert.alert(
        'Error',
        'Failed to select image. Please check your photo library permissions and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const analyzeImage = async (image) => {
    try {
      setAnalyzing(true);

      // Check quota (server-side) before allowing scan
      if (isGuest && deviceId) {
        const quota = await aiServiceSecure.checkQuota(null, deviceId);

        if (quota.isBlocked) {
          Alert.alert(
            'Account Blocked',
            quota.reason || 'Your device has been blocked.',
            [{ text: 'OK' }]
          );
          return;
        }

        if (!quota.canScan) {
          Alert.alert(
            'Free Scans Used',
            "You've used all your free scans. Sign up for unlimited access!",
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Sign Up', onPress: () => navigation.replace('Login') },
            ]
          );
          return;
        }

        // Increment scan count on server
        await aiServiceSecure.incrementScanCount(deviceId);
        setRemainingScans(quota.remainingScans - 1);
      }

      // Update local scan count for stats
      const scanCount = parseInt(
        (await SecureStore.getItemAsync('scan_count')) || '0'
      );
      await SecureStore.setItemAsync('scan_count', String(scanCount + 1));

      // Navigate to analysis screen
      navigation.navigate('Analysis', {
        imageUri: image.uri,
        imageBase64: image.base64,
        deviceId: deviceId,
        analyzing: true,
      });
    } catch (error) {
      logger.error('Failed to analyze image', { error: error.message });
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setAnalyzing(false);
      setCapturedImage(null);
    }
  };

  const handleManualInput = async () => {
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    try {
      setShowManualInput(false);
      setAnalyzing(true);

      // Check quota (server-side) before allowing scan
      if (isGuest && deviceId) {
        const quota = await aiServiceSecure.checkQuota(null, deviceId);

        if (quota.isBlocked) {
          Alert.alert(
            'Account Blocked',
            quota.reason || 'Your device has been blocked.',
            [{ text: 'OK' }]
          );
          return;
        }

        if (!quota.canScan) {
          Alert.alert(
            'Free Scans Used',
            `You've used all your free scans (${quota.scanCount}/3). Sign up for unlimited access!`,
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Sign Up', onPress: () => navigation.replace('Login') },
            ]
          );
          return;
        }

        // Increment scan count on server
        await aiServiceSecure.incrementScanCount(deviceId);
        setRemainingScans(quota.remainingScans - 1);
      }

      // Update local scan count for stats
      const scanCount = parseInt(
        (await SecureStore.getItemAsync('scan_count')) || '0'
      );
      await SecureStore.setItemAsync('scan_count', String(scanCount + 1));

      // Navigate to analysis with medication name
      navigation.navigate('Analysis', {
        medicationName: medicationName.trim(),
        deviceId: deviceId,
        isManualEntry: true,
        analyzing: true,
      });
      setMedicationName('');
    } catch (error) {
      logger.error('Failed to process manual input', { error: error.message });
      Alert.alert('Error', 'Failed to process medication name. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Show loading state while checking permissions
  if (checkingPermissions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Preparing camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!analyzing ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Scan Medication</Text>
            <Text style={styles.subtitle}>Choose how to add your medication</Text>
            {isGuest && remainingScans !== null && (
              <View style={styles.scansRemainingBadge}>
                <Text style={styles.scansRemainingText}>
                  {remainingScans} free scan{remainingScans !== 1 ? 's' : ''} remaining
                </Text>
              </View>
            )}
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.option}
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="camera-alt" size={48} color="#10B981" />
              </View>
              <Text style={styles.optionTitle}>Take Photo</Text>
              <Text style={styles.optionDescription}>
                Capture medication label with camera
              </Text>
              {cameraPermission !== 'granted' && (
                <Text style={styles.permissionHint}>Tap to grant camera permission</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="photo-library" size={48} color="#10B981" />
              </View>
              <Text style={styles.optionTitle}>Choose from Gallery</Text>
              <Text style={styles.optionDescription}>
                Select existing photo of medication
              </Text>
              {libraryPermission !== 'granted' && (
                <Text style={styles.permissionHint}>Tap to grant photo access</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => setShowManualInput(true)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="keyboard" size={48} color="#10B981" />
              </View>
              <Text style={styles.optionTitle}>Type Name</Text>
              <Text style={styles.optionDescription}>
                Manually enter medication name
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.analyzingText}>Processing...</Text>
        </View>
      )}

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualInput(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Medication Name</Text>
            <Text style={styles.modalSubtitle}>
              Type the name of the medication you want to analyze
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Ibuprofen, Aspirin, Tylenol"
              value={medicationName}
              onChangeText={setMedicationName}
              autoFocus
              autoCapitalize="words"
              returnKeyType="search"
              onSubmitEditing={handleManualInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowManualInput(false);
                  setMedicationName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.searchButton]}
                onPress={handleManualInput}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scansRemainingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  scansRemainingText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  optionsContainer: {
    padding: 20,
  },
  option: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 5,
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  permissionHint: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 5,
    fontStyle: 'italic',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#10B981',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
