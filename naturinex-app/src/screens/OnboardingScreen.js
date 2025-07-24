import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 0,
      title: 'Welcome to Naturinex',
      subtitle: 'Your natural medication companion',
      description: 'Discover natural alternatives to your medications with AI-powered analysis.',
      icon: '💊',
      color: '#10B981',
    },
    {
      id: 1,
      title: 'Scan Medications',
      subtitle: 'Quick and easy analysis',
      description: 'Simply scan your medication label or enter the name to get instant natural alternatives.',
      icon: '📱',
      color: '#3B82F6',
    },
    {
      id: 2,
      title: 'Get Natural Alternatives',
      subtitle: 'Evidence-based suggestions',
      description: 'Receive personalized recommendations for natural supplements and herbs that may help.',
      icon: '🌿',
      color: '#10B981',
    },
    {
      id: 3,
      title: 'Stay Informed',
      subtitle: 'Safety first',
      description: 'Learn about potential interactions, side effects, and always consult your healthcare provider.',
      icon: '🛡️',
      color: '#F59E0B',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await SecureStore.setItemAsync('onboarding_completed', 'true');
      navigation.replace('Home');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigation.replace('Home');
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{currentStepData.icon}</Text>
          </View>

          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MaterialIcons name="camera-alt" size={20} color="#10B981" />
            <Text style={styles.featureText}>Camera scanning</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="search" size={20} color="#10B981" />
            <Text style={styles.featureText}>AI-powered analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="security" size={20} color="#10B981" />
            <Text style={styles.featureText}>Privacy focused</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="star" size={20} color="#10B981" />
            <Text style={styles.featureText}>Premium features</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This app provides educational information only. Always consult with your healthcare provider before making any changes to your medication regimen.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <MaterialIcons
              name={currentStep === steps.length - 1 ? 'check' : 'arrow-forward'}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#10B981',
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
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
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  disclaimerContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
    textAlign: 'center',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 