import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';

// Initialize Firebase
import './src/config/firebase';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SimpleCameraScreen from './src/screens/SimpleCameraScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SubscriptionScreenWrapper from './src/screens/SubscriptionScreenWrapper';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Platform-specific services
import { Platform } from 'react-native';
import DemoDataService from './src/services/DemoDataService';

// Components
import ScanHistory from './src/components/ScanHistory';
import PrivacyPolicyScreen from './src/components/PrivacyPolicyScreen';
import TermsOfUseScreen from './src/components/TermsOfUseScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import AdminSettings from './src/screens/AdminSettings';
import NotificationProvider from './src/components/NotificationProvider';
import AppLaunchGate from './src/components/AppLaunchGate';
// ErrorBoundary removed - was corrupted
import OfflineIndicator from './src/components/OfflineIndicator';
import NativeMedicalDisclaimerModal from './src/components/NativeMedicalDisclaimerModal';
import { startSession, endSession } from './src/services/engagementTracking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize services
import MonitoringService from './src/services/MonitoringService';
import OfflineServiceV2 from './src/services/OfflineServiceV2';
import ErrorService from './src/services/ErrorService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  useEffect(() => {
    // Check disclaimer status and initialize
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Start engagement session
      startSession();

      // Initialize monitoring
      MonitoringService.trackEvent('app_launch', {
        timestamp: new Date().toISOString(),
      });

      // Initialize demo mode if enabled
      if (DemoDataService.isDemoMode()) {
        await DemoDataService.initializeDemoData();
        console.log('[App] Demo mode initialized');
      }

      // Initialize Apple IAP on iOS
      if (Platform.OS === 'ios') {
        try {
          const AppleIAPService = require('./src/billing/AppleIAPService').default;
          await AppleIAPService.initializeIAP();
        } catch (iapError) {
          console.log('[App] IAP initialization skipped:', iapError.message);
        }
      }

      // Check if user has accepted disclaimer
      const accepted = await AsyncStorage.getItem('disclaimer_accepted');
      setDisclaimerAccepted(accepted === 'true');
      setDisclaimerChecked(true);

      // Give Firebase a moment to initialize
      setTimeout(() => {
        setIsReady(true);
      }, 100);
    } catch (error) {
      ErrorService.logError(error, 'App.initializeApp');
      setDisclaimerChecked(true);
      setIsReady(true);
    }
  };

  // Cleanup on app close
  useEffect(() => {
    return () => {
      endSession();
      MonitoringService.endSession();
    };
  }, []);

  const handleErrorBoundaryRestart = () => {
    // Force app restart logic if needed
    setIsReady(false);
    setTimeout(() => setIsReady(true), 100);
  };

  const handleAuthReset = async () => {
    try {
      // Handle auth reset logic
      await ErrorService.logInfo('Auth reset requested from error boundary');
      // Could add logout logic here
    } catch (error) {
      ErrorService.logError(error, 'App.handleAuthReset');
    }
  };

  const handleDisclaimerAccept = async () => {
    try {
      await AsyncStorage.setItem('disclaimer_accepted', 'true');
      await AsyncStorage.setItem('disclaimer_accepted_date', new Date().toISOString());
      setDisclaimerAccepted(true);

      // Log disclaimer acceptance
      MonitoringService.trackEvent('disclaimer_accepted', {
        timestamp: new Date().toISOString(),
        disclaimer_version: '1.0',
      });
    } catch (error) {
      ErrorService.logError(error, 'App.handleDisclaimerAccept');
      // Still allow them to proceed
      setDisclaimerAccepted(true);
    }
  };

  // Loading state
  if (!isReady || !disclaimerChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 10 }}>Loading Naturinex...</Text>
      </View>
    );
  }

  // Show disclaimer modal if not accepted
  if (!disclaimerAccepted) {
    return (
      <NativeMedicalDisclaimerModal
        visible={true}
        onAccept={handleDisclaimerAccept}
      />
    );
  }

  return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppLaunchGate>
          <NotificationProvider>
            <NavigationContainer>
              <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#10B981',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerRight: () => <OfflineIndicator style={{ marginRight: 15 }} />,
            }}
          >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ 
              title: 'Naturinex',
              headerBackVisible: false
            }}
          />
          <Stack.Screen 
            name="Camera" 
            component={SimpleCameraScreen}
            options={{ title: 'Scan Product' }}
          />
          <Stack.Screen 
            name="Analysis" 
            component={AnalysisScreen}
            options={{ title: 'Analysis Results' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreenWrapper}
            options={{ title: 'Premium' }}
          />
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ScanHistory" 
            component={ScanHistory}
            options={{ title: 'Scan History' }}
          />
          <Stack.Screen 
            name="PrivacyPolicy" 
            component={PrivacyPolicyScreen}
            options={{ title: 'Privacy Policy' }}
          />
          <Stack.Screen 
            name="TermsOfUse" 
            component={TermsOfUseScreen}
            options={{ title: 'Terms of Service' }}
          />
          <Stack.Screen 
            name="AdminDashboard" 
            component={AdminDashboard}
            options={{ title: 'Admin Dashboard' }}
          />
          <Stack.Screen 
            name="AdminSettings" 
            component={AdminSettings}
            options={{ title: 'Admin Settings' }}
          />
        </Stack.Navigator>
          </NavigationContainer>
        </NotificationProvider>
      </AppLaunchGate>
    </SafeAreaProvider>
  );
}