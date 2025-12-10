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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import deviceFingerprintService from '../services/deviceFingerprintService';
import aiServiceSecure from '../services/aiServiceSecure';
import logger from '../utils/logger';
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app-1.onrender.com';
export default function SimpleCameraScreen({ navigation }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [remainingScans, setRemainingScans] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  // Get device ID and check quota on mount
  useEffect(() => {
    checkQuotaAndInit();
  }, []);

  const checkQuotaAndInit = async () => {
    try {
      // Get device fingerprint
      const fingerprint = await deviceFingerprintService.getDeviceFingerprint();
      setDeviceId(fingerprint);

      // Check if guest user
      const guestStatus = await SecureStore.getItemAsync('is_guest') || 'false';
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
    }
  };
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setCapturedImage(result.assets[0]);
      analyzeImage(result.assets[0]);
    }
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setCapturedImage(result.assets[0]);
      analyzeImage(result.assets[0]);
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
            `You've used all your free scans. Sign up for unlimited access!`,
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Sign Up', onPress: () => navigation.replace('Login') }
            ]
          );
          return;
        }

        // Increment scan count on server
        await aiServiceSecure.incrementScanCount(deviceId);
        setRemainingScans(quota.remainingScans - 1);
      }

      // Update local scan count for stats
      const scanCount = parseInt(await SecureStore.getItemAsync('scan_count') || '0');
      await SecureStore.setItemAsync('scan_count', String(scanCount + 1));

      // Navigate to analysis screen
      navigation.navigate('Analysis', {
        imageUri: image.uri,
        imageBase64: image.base64,
        deviceId: deviceId,
        analyzing: true
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
              { text: 'Sign Up', onPress: () => navigation.replace('Login') }
            ]
          );
          return;
        }

        // Increment scan count on server
        await aiServiceSecure.incrementScanCount(deviceId);
        setRemainingScans(quota.remainingScans - 1);
      }

      // Update local scan count for stats
      const scanCount = parseInt(await SecureStore.getItemAsync('scan_count') || '0');
      await SecureStore.setItemAsync('scan_count', String(scanCount + 1));

      // Navigate to analysis with medication name
      navigation.navigate('Analysis', {
        medicationName: medicationName.trim(),
        deviceId: deviceId,
        isManualEntry: true,
        analyzing: true
      });
      setMedicationName('');
    } catch (error) {
      logger.error('Failed to process manual input', { error: error.message });
      Alert.alert('Error', 'Failed to process medication name. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };
  return (
    <View style={styles.container}>
      {!analyzing ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Scan Medication</Text>
            <Text style={styles.subtitle}>Choose how to add your medication</Text>
          </View>
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={takePhoto}>
              <MaterialIcons name="camera-alt" size={48} color="#10B981" />
              <Text style={styles.optionTitle}>Take Photo</Text>
              <Text style={styles.optionDescription}>
                Capture medication label with camera
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={pickImage}>
              <MaterialIcons name="photo-library" size={48} color="#10B981" />
              <Text style={styles.optionTitle}>Choose from Gallery</Text>
              <Text style={styles.optionDescription}>
                Select existing photo of medication
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => setShowManualInput(true)}>
              <MaterialIcons name="keyboard" size={48} color="#10B981" />
              <Text style={styles.optionTitle}>Type Name</Text>
              <Text style={styles.optionDescription}>
                Manually enter medication name
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.analyzingContainer}>
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
  header: {
    paddingTop: 60,
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
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 10,
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    fontSize: 18,
    color: '#6B7280',
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