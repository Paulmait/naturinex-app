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
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Components
import ScanHistory from './src/components/ScanHistory';
import PrivacyPolicyScreen from './src/components/PrivacyPolicyScreen';
import TermsOfUseScreen from './src/components/TermsOfUseScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import AdminSettings from './src/screens/AdminSettings';
import NotificationProvider from './src/components/NotificationProvider';
import AppLaunchGate from './src/components/AppLaunchGate';
import { startSession, endSession } from './src/services/engagementTracking';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Start engagement session
    startSession();
    
    // End session when app closes
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    // Give Firebase a moment to initialize
    setTimeout(() => {
      setIsReady(true);
    }, 100);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 10 }}>Loading Naturinex...</Text>
      </View>
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
            component={SubscriptionScreen}
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