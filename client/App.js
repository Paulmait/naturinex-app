import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

// API Configuration
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app.onrender.com';
const STRIPE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || 'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const onboardingCompleted = await SecureStore.getItemAsync('onboarding_completed');
      
      if (token) {
        setIsAuthenticated(true);
        setNeedsOnboarding(onboardingCompleted !== 'true');
      } else {
        setIsAuthenticated(false);
        setNeedsOnboarding(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading Naturinex...</Text>
      </View>
    );
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_KEY}
      merchantIdentifier="merchant.com.naturinex.app"
    >
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#10B981" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={isAuthenticated ? (needsOnboarding ? "Onboarding" : "Home") : "Login"}
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
              options={{ 
                title: 'Naturinex',
                headerShown: false 
              }}
            />
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen} 
              options={{ 
                title: 'Welcome to Naturinex',
                headerShown: false 
              }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Naturinex' }}
            />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen} 
              options={{ title: 'Scan Medication' }}
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
              options={{ title: 'Subscription' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10B981',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
    fontWeight: 'bold',
  },
});