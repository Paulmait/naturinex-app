import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app-zsga.onrender.com';

export default function StudentVerification({ onVerified, onClose }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('email');
  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    graduationYear: new Date().getFullYear() + 1,
  });

  const verifyWithEmail = async () => {
    if (!email.includes('.edu')) {
      Alert.alert(
        'Invalid Email',
        'Please use your educational email address (ending in .edu)'
      );
      return;
    }

    setLoading(true);
    try {
      const authToken = await SecureStore.getItemAsync('auth_token');
      const response = await fetch(`${API_URL}/api/verify-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verificationMethod: 'email',
        }),
      });

      const result = await response.json();

      if (result.verified) {
        Alert.alert(
          '✅ Verified!',
          'Your student status has been confirmed. Enjoy 40% off all plans!',
          [
            {
              text: 'Continue',
              onPress: () => onVerified(result),
            },
          ]
        );
      } else {
        Alert.alert(
          'Verification Failed',
          'We couldn\'t verify your student status with this email. Try using SheerID verification instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Try SheerID',
              onPress: () => setVerificationMethod('sheerid'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify student status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyWithSheerID = async () => {
    setLoading(true);
    try {
      const authToken = await SecureStore.getItemAsync('auth_token');
      const response = await fetch(`${API_URL}/api/verify-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verificationMethod: 'sheerid',
          additionalData: studentData,
        }),
      });

      const result = await response.json();

      if (result.verified) {
        Alert.alert(
          '✅ Verified!',
          'Your student status has been confirmed through SheerID!',
          [
            {
              text: 'Continue',
              onPress: () => onVerified(result),
            },
          ]
        );
      } else {
        Alert.alert(
          'Verification Failed',
          'We couldn\'t verify your student status. Please check your information and try again.'
        );
      }
    } catch (error) {
      console.error('SheerID verification error:', error);
      Alert.alert('Error', 'Failed to complete verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Student Verification</Text>
        <Text style={styles.subtitle}>
          Verify your student status to get 40% off forever!
        </Text>
      </View>

      <View style={styles.benefits}>
        <Text style={styles.benefitsTitle}>Student Benefits:</Text>
        <View style={styles.benefitItem}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.benefitText}>40% off all plans forever</Text>
        </View>
        <View style={styles.benefitItem}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.benefitText}>Extended 14-day free trial</Text>
        </View>
        <View style={styles.benefitItem}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.benefitText}>Priority support</Text>
        </View>
        <View style={styles.benefitItem}>
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.benefitText}>Campus ambassador eligibility</Text>
        </View>
      </View>

      <View style={styles.methodToggle}>
        <TouchableOpacity
          style={[
            styles.methodButton,
            verificationMethod === 'email' && styles.methodActive,
          ]}
          onPress={() => setVerificationMethod('email')}
        >
          <MaterialIcons name="email" size={20} color={verificationMethod === 'email' ? '#10B981' : '#6B7280'} />
          <Text style={[
            styles.methodText,
            verificationMethod === 'email' && styles.methodTextActive,
          ]}>Email (.edu)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.methodButton,
            verificationMethod === 'sheerid' && styles.methodActive,
          ]}
          onPress={() => setVerificationMethod('sheerid')}
        >
          <MaterialIcons name="verified-user" size={20} color={verificationMethod === 'sheerid' ? '#10B981' : '#6B7280'} />
          <Text style={[
            styles.methodText,
            verificationMethod === 'sheerid' && styles.methodTextActive,
          ]}>SheerID</Text>
        </TouchableOpacity>
      </View>

      {verificationMethod === 'email' ? (
        <View style={styles.form}>
          <Text style={styles.label}>Educational Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@university.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.helper}>
            Use your .edu email address for instant verification
          </Text>
          
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.disabledButton]}
            onPress={verifyWithEmail}
            disabled={loading || !email}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="school" size={20} color="white" />
                <Text style={styles.verifyButtonText}>Verify with Email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John"
            value={studentData.firstName}
            onChangeText={(text) => setStudentData({ ...studentData, firstName: text })}
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Doe"
            value={studentData.lastName}
            onChangeText={(text) => setStudentData({ ...studentData, lastName: text })}
          />

          <Text style={styles.label}>Institution</Text>
          <TextInput
            style={styles.input}
            placeholder="University Name"
            value={studentData.institution}
            onChangeText={(text) => setStudentData({ ...studentData, institution: text })}
          />

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.disabledButton]}
            onPress={verifyWithSheerID}
            disabled={loading || !email || !studentData.firstName || !studentData.lastName}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="verified-user" size={20} color="white" />
                <Text style={styles.verifyButtonText}>Verify with SheerID</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.privacy}>
        <MaterialIcons name="lock" size={16} color="#6B7280" />
        <Text style={styles.privacyText}>
          Your information is secure and only used for verification
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  benefits: {
    backgroundColor: '#ECFDF5',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#047857',
    marginLeft: 8,
  },
  methodToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  methodActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#10B981',
  },
  form: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  helper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
});