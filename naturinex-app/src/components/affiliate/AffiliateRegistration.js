// Affiliate Registration Component
// Comprehensive registration form for new affiliates
// Created: 2025-09-16

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import affiliateManagementService from '../../services/AffiliateManagementService';

const AffiliateRegistration = ({ navigation, onRegistrationComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '',

    // Business Information
    businessType: 'individual',
    businessName: '',
    taxId: '',

    // Social Media
    socialMedia: {
      instagram: '',
      youtube: '',
      tiktok: '',
      twitter: '',
      facebook: '',
      linkedin: '',
      blog: ''
    },

    // Experience & Audience
    affiliateExperience: '',
    audienceSize: '',
    primaryAudience: '',
    contentType: [],
    trafficSources: [],

    // Payment Information
    paymentMethod: 'bank_transfer',
    bankDetails: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      swiftCode: '',
      iban: ''
    },

    // Terms & Compliance
    termsAccepted: false,
    privacyAccepted: false,
    marketingConsent: false,
    ageConfirmation: false,

    // Source tracking
    signupSource: 'organic',
    referralCode: '',
    utmParams: {}
  });

  const [errors, setErrors] = useState({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    // Track UTM parameters from URL
    trackSignupSource();
  }, []);

  const trackSignupSource = () => {
    // Extract UTM parameters from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
      source: urlParams.get('utm_source'),
      medium: urlParams.get('utm_medium'),
      campaign: urlParams.get('utm_campaign'),
      term: urlParams.get('utm_term'),
      content: urlParams.get('utm_content')
    };

    const referralCode = urlParams.get('ref');

    setFormData(prev => ({
      ...prev,
      utmParams,
      referralCode,
      signupSource: utmParams.source || 'organic'
    }));
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const updateNestedFormData = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Personal Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        break;

      case 2: // Business Information
        if (formData.businessType === 'business' && !formData.businessName.trim()) {
          newErrors.businessName = 'Business name is required for business accounts';
        }
        break;

      case 3: // Experience & Audience
        if (!formData.affiliateExperience) {
          newErrors.affiliateExperience = 'Please select your experience level';
        }
        if (!formData.audienceSize) {
          newErrors.audienceSize = 'Please select your audience size';
        }
        if (!formData.primaryAudience.trim()) {
          newErrors.primaryAudience = 'Please describe your primary audience';
        }
        break;

      case 4: // Payment Information
        if (formData.paymentMethod === 'bank_transfer') {
          if (!formData.bankDetails.accountHolderName.trim()) {
            newErrors.accountHolderName = 'Account holder name is required';
          }
          if (!formData.bankDetails.bankName.trim()) {
            newErrors.bankName = 'Bank name is required';
          }
          if (!formData.bankDetails.accountNumber.trim()) {
            newErrors.accountNumber = 'Account number is required';
          }
          if (!formData.bankDetails.routingNumber.trim()) {
            newErrors.routingNumber = 'Routing number is required';
          }
        }
        break;

      case 5: // Terms & Compliance
        if (!formData.termsAccepted) {
          newErrors.termsAccepted = 'You must accept the terms and conditions';
        }
        if (!formData.privacyAccepted) {
          newErrors.privacyAccepted = 'You must accept the privacy policy';
        }
        if (!formData.ageConfirmation) {
          newErrors.ageConfirmation = 'You must confirm you are 18 or older';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitRegistration = async () => {
    if (!validateStep(5)) return;

    try {
      setLoading(true);

      const result = await affiliateManagementService.registerAffiliate(formData);

      if (result.success) {
        Alert.alert(
          'Registration Successful',
          'Your affiliate application has been submitted successfully. You will receive an email once your application is reviewed.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onRegistrationComplete) {
                  onRegistrationComplete(result.affiliate);
                } else {
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            step <= currentStep && styles.activeStepCircle,
            step < currentStep && styles.completedStepCircle
          ]}>
            <Text style={[
              styles.stepNumber,
              step <= currentStep && styles.activeStepNumber
            ]}>
              {step < currentStep ? '✓' : step}
            </Text>
          </View>
          {step < 5 && (
            <View style={[
              styles.stepLine,
              step < currentStep && styles.completedStepLine
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderPersonalInformation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about yourself to get started with your affiliate account.
      </Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
            placeholder="John"
          />
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>

        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            value={formData.lastName}
            onChangeText={(value) => updateFormData('lastName', value)}
            placeholder="Doe"
          />
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Website/Blog URL</Text>
        <TextInput
          style={styles.input}
          value={formData.website}
          onChangeText={(value) => updateFormData('website', value)}
          placeholder="https://yourblog.com"
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderBusinessInformation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepDescription}>
        Help us understand your business structure for tax and compliance purposes.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Business Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.businessType}
            onValueChange={(value) => updateFormData('businessType', value)}
            style={styles.picker}
          >
            <Picker.Item label="Individual" value="individual" />
            <Picker.Item label="Business/Company" value="business" />
            <Picker.Item label="Influencer" value="influencer" />
            <Picker.Item label="Healthcare Provider" value="healthcare_provider" />
            <Picker.Item label="Non-Profit Organization" value="nonprofit" />
          </Picker>
        </View>
      </View>

      {formData.businessType === 'business' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Business Name *</Text>
          <TextInput
            style={[styles.input, errors.businessName && styles.inputError]}
            value={formData.businessName}
            onChangeText={(value) => updateFormData('businessName', value)}
            placeholder="Your Business Name LLC"
          />
          {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tax ID (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.taxId}
          onChangeText={(value) => updateFormData('taxId', value)}
          placeholder="123-45-6789 or 12-3456789"
        />
        <Text style={styles.helperText}>
          Used for tax reporting. You can add this later if needed.
        </Text>
      </View>
    </View>
  );

  const renderSocialMediaAndAudience = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Social Media & Audience</Text>
      <Text style={styles.stepDescription}>
        Tell us about your online presence and audience to help us support your success.
      </Text>

      <Text style={styles.sectionTitle}>Social Media Profiles</Text>
      {Object.keys(formData.socialMedia).map((platform) => (
        <View key={platform} style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </Text>
          <TextInput
            style={styles.input}
            value={formData.socialMedia[platform]}
            onChangeText={(value) => updateNestedFormData('socialMedia', platform, value)}
            placeholder={`@your${platform}handle`}
            autoCapitalize="none"
          />
        </View>
      ))}

      <Text style={styles.sectionTitle}>Experience & Audience</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Affiliate Marketing Experience *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.affiliateExperience}
            onValueChange={(value) => updateFormData('affiliateExperience', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select experience level" value="" />
            <Picker.Item label="Beginner (0-1 years)" value="beginner" />
            <Picker.Item label="Intermediate (1-3 years)" value="intermediate" />
            <Picker.Item label="Advanced (3-5 years)" value="advanced" />
            <Picker.Item label="Expert (5+ years)" value="expert" />
          </Picker>
        </View>
        {errors.affiliateExperience && <Text style={styles.errorText}>{errors.affiliateExperience}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Audience Size *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.audienceSize}
            onValueChange={(value) => updateFormData('audienceSize', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select audience size" value="" />
            <Picker.Item label="Under 1,000" value="under_1k" />
            <Picker.Item label="1,000 - 10,000" value="1k_10k" />
            <Picker.Item label="10,000 - 50,000" value="10k_50k" />
            <Picker.Item label="50,000 - 100,000" value="50k_100k" />
            <Picker.Item label="100,000 - 500,000" value="100k_500k" />
            <Picker.Item label="500,000+" value="500k_plus" />
          </Picker>
        </View>
        {errors.audienceSize && <Text style={styles.errorText}>{errors.audienceSize}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Primary Audience Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.primaryAudience && styles.inputError]}
          value={formData.primaryAudience}
          onChangeText={(value) => updateFormData('primaryAudience', value)}
          placeholder="Describe your audience (age, interests, demographics)..."
          multiline
          numberOfLines={4}
        />
        {errors.primaryAudience && <Text style={styles.errorText}>{errors.primaryAudience}</Text>}
      </View>
    </View>
  );

  const renderPaymentInformation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment Information</Text>
      <Text style={styles.stepDescription}>
        Set up your payment method to receive commission payouts.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Payment Method *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.paymentMethod}
            onValueChange={(value) => updateFormData('paymentMethod', value)}
            style={styles.picker}
          >
            <Picker.Item label="Bank Transfer (ACH)" value="bank_transfer" />
            <Picker.Item label="PayPal" value="paypal" />
            <Picker.Item label="Stripe" value="stripe" />
            <Picker.Item label="Wire Transfer" value="wire_transfer" />
          </Picker>
        </View>
      </View>

      {formData.paymentMethod === 'bank_transfer' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Account Holder Name *</Text>
            <TextInput
              style={[styles.input, errors.accountHolderName && styles.inputError]}
              value={formData.bankDetails.accountHolderName}
              onChangeText={(value) => updateNestedFormData('bankDetails', 'accountHolderName', value)}
              placeholder="Full name as it appears on account"
            />
            {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={[styles.input, errors.bankName && styles.inputError]}
              value={formData.bankDetails.bankName}
              onChangeText={(value) => updateNestedFormData('bankDetails', 'bankName', value)}
              placeholder="Bank of America, Chase, etc."
            />
            {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Account Number *</Text>
              <TextInput
                style={[styles.input, errors.accountNumber && styles.inputError]}
                value={formData.bankDetails.accountNumber}
                onChangeText={(value) => updateNestedFormData('bankDetails', 'accountNumber', value)}
                placeholder="1234567890"
                keyboardType="numeric"
                secureTextEntry={!showPasswordFields}
              />
              {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Routing Number *</Text>
              <TextInput
                style={[styles.input, errors.routingNumber && styles.inputError]}
                value={formData.bankDetails.routingNumber}
                onChangeText={(value) => updateNestedFormData('bankDetails', 'routingNumber', value)}
                placeholder="123456789"
                keyboardType="numeric"
              />
              {errors.routingNumber && <Text style={styles.errorText}>{errors.routingNumber}</Text>}
            </View>
          </View>

          <TouchableOpacity
            style={styles.showPasswordButton}
            onPress={() => setShowPasswordFields(!showPasswordFields)}
          >
            <Icon name={showPasswordFields ? 'visibility-off' : 'visibility'} size={20} color="#666" />
            <Text style={styles.showPasswordText}>
              {showPasswordFields ? 'Hide' : 'Show'} Account Number
            </Text>
          </TouchableOpacity>
        </>
      )}

      {formData.paymentMethod === 'paypal' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>PayPal Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.bankDetails.paypalEmail}
            onChangeText={(value) => updateNestedFormData('bankDetails', 'paypalEmail', value)}
            placeholder="your@paypal.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      )}

      <View style={styles.securityNotice}>
        <Icon name="security" size={20} color="#2E7D32" />
        <Text style={styles.securityText}>
          All payment information is encrypted and securely stored. We never store full account numbers.
        </Text>
      </View>
    </View>
  );

  const renderTermsAndCompliance = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Terms & Compliance</Text>
      <Text style={styles.stepDescription}>
        Please review and accept our terms to complete your registration.
      </Text>

      <View style={styles.checkboxContainer}>
        <Switch
          value={formData.termsAccepted}
          onValueChange={(value) => updateFormData('termsAccepted', value)}
          trackColor={{ false: '#767577', true: '#2E7D32' }}
          thumbColor={formData.termsAccepted ? '#fff' : '#f4f3f4'}
        />
        <View style={styles.checkboxText}>
          <Text style={styles.checkboxLabel}>
            I accept the{' '}
            <Text style={styles.linkText} onPress={() => console.log('Open terms')}>
              Terms and Conditions
            </Text>{' '}
            and{' '}
            <Text style={styles.linkText} onPress={() => console.log('Open affiliate agreement')}>
              Affiliate Agreement
            </Text>
            *
          </Text>
        </View>
      </View>
      {errors.termsAccepted && <Text style={styles.errorText}>{errors.termsAccepted}</Text>}

      <View style={styles.checkboxContainer}>
        <Switch
          value={formData.privacyAccepted}
          onValueChange={(value) => updateFormData('privacyAccepted', value)}
          trackColor={{ false: '#767577', true: '#2E7D32' }}
          thumbColor={formData.privacyAccepted ? '#fff' : '#f4f3f4'}
        />
        <View style={styles.checkboxText}>
          <Text style={styles.checkboxLabel}>
            I accept the{' '}
            <Text style={styles.linkText} onPress={() => console.log('Open privacy policy')}>
              Privacy Policy
            </Text>
            *
          </Text>
        </View>
      </View>
      {errors.privacyAccepted && <Text style={styles.errorText}>{errors.privacyAccepted}</Text>}

      <View style={styles.checkboxContainer}>
        <Switch
          value={formData.ageConfirmation}
          onValueChange={(value) => updateFormData('ageConfirmation', value)}
          trackColor={{ false: '#767577', true: '#2E7D32' }}
          thumbColor={formData.ageConfirmation ? '#fff' : '#f4f3f4'}
        />
        <View style={styles.checkboxText}>
          <Text style={styles.checkboxLabel}>
            I confirm that I am 18 years of age or older *
          </Text>
        </View>
      </View>
      {errors.ageConfirmation && <Text style={styles.errorText}>{errors.ageConfirmation}</Text>}

      <View style={styles.checkboxContainer}>
        <Switch
          value={formData.marketingConsent}
          onValueChange={(value) => updateFormData('marketingConsent', value)}
          trackColor={{ false: '#767577', true: '#2E7D32' }}
          thumbColor={formData.marketingConsent ? '#fff' : '#f4f3f4'}
        />
        <View style={styles.checkboxText}>
          <Text style={styles.checkboxLabel}>
            I consent to receive marketing communications and affiliate program updates
          </Text>
        </View>
      </View>

      <View style={styles.finalNote}>
        <Icon name="info" size={20} color="#1976D2" />
        <Text style={styles.finalNoteText}>
          Your application will be reviewed within 24-48 hours. You'll receive an email confirmation
          once your affiliate account is approved.
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInformation();
      case 2:
        return renderBusinessInformation();
      case 3:
        return renderSocialMediaAndAudience();
      case 4:
        return renderPaymentInformation();
      case 5:
        return renderTermsAndCompliance();
      default:
        return renderPersonalInformation();
    }
  };

  const renderNavigationButtons = () => (
    <View style={styles.navigationButtons}>
      {currentStep > 1 && (
        <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
          <Icon name="chevron-left" size={20} color="#666" />
          <Text style={styles.prevButtonText}>Previous</Text>
        </TouchableOpacity>
      )}

      <View style={styles.buttonSpacer} />

      {currentStep < 5 ? (
        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Icon name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={submitRegistration}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Affiliate Registration</Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {renderNavigationButtons()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16
  },
  headerSpacer: {
    flex: 1
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f9f9f9'
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeStepCircle: {
    backgroundColor: '#2E7D32'
  },
  completedStepCircle: {
    backgroundColor: '#4CAF50'
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666'
  },
  activeStepNumber: {
    color: '#fff'
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8
  },
  completedStepLine: {
    backgroundColor: '#4CAF50'
  },
  content: {
    flex: 1
  },
  stepContent: {
    padding: 20
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 16
  },
  inputContainer: {
    marginBottom: 16
  },
  inputRow: {
    flexDirection: 'row'
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  inputError: {
    borderColor: '#f44336'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  picker: {
    height: 50
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4
  },
  showPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  showPasswordText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666'
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginTop: 16
  },
  securityText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#2E7D32',
    flex: 1
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  checkboxText: {
    flex: 1,
    marginLeft: 12
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  linkText: {
    color: '#2E7D32',
    textDecorationLine: 'underline'
  },
  finalNote: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 20
  },
  finalNoteText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1976D2',
    flex: 1,
    lineHeight: 18
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff'
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  prevButtonText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#666'
  },
  buttonSpacer: {
    flex: 1
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  nextButtonText: {
    marginRight: 4,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600'
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  }
});

export default AffiliateRegistration;