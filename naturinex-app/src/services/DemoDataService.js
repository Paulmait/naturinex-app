/**
 * Demo Data Service for Screenshot Mode and App Review
 *
 * When SCREENSHOT_MODE or REVIEW_MODE is enabled, this service
 * provides deterministic demo data for consistent screenshots.
 */

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if demo mode is enabled
export const isDemoMode = () => {
  const env = Constants.expoConfig?.extra?.demoMode;
  const envVar = process.env.EXPO_PUBLIC_DEMO_MODE;
  const screenshotMode = process.env.EXPO_PUBLIC_SCREENSHOT_MODE;
  const reviewMode = process.env.EXPO_PUBLIC_REVIEW_MODE;

  return env === true || env === 'true' ||
         envVar === '1' || envVar === 'true' ||
         screenshotMode === '1' || screenshotMode === 'true' ||
         reviewMode === '1' || reviewMode === 'true';
};

// Demo user credentials
export const DEMO_USER = {
  email: 'appreview@naturinex.com',
  displayName: 'App Review User',
  uid: 'demo-user-123',
  isPremium: true,
};

// Demo scan history entries
export const DEMO_SCAN_HISTORY = [
  {
    id: 'scan_001',
    medicationName: 'Ibuprofen',
    scanDate: '2026-01-01T10:30:00Z',
    displayDate: 'Jan 1, 2026',
    imageUri: null,
    results: {
      productName: 'Ibuprofen 200mg',
      category: 'Pain Relief / Anti-inflammatory',
      naturalAlternatives: [
        {
          name: 'Turmeric (Curcumin)',
          description: 'Natural anti-inflammatory compound found in turmeric root',
          effectiveness: 'High',
          usage: 'Take 500-1000mg with meals',
        },
        {
          name: 'Willow Bark Extract',
          description: 'Natural source of salicin, similar to aspirin',
          effectiveness: 'Moderate',
          usage: 'Take as directed, typically 240mg daily',
        },
        {
          name: 'Ginger Root',
          description: 'Natural anti-inflammatory with pain-relieving properties',
          effectiveness: 'Moderate',
          usage: 'Fresh ginger tea or 250mg supplements',
        },
      ],
      safetyNotes: 'Always consult your healthcare provider before changing medications. Natural alternatives may interact with existing medications.',
      disclaimer: 'This information is for educational purposes only.',
    },
  },
  {
    id: 'scan_002',
    medicationName: 'Melatonin',
    scanDate: '2025-12-28T22:15:00Z',
    displayDate: 'Dec 28, 2025',
    imageUri: null,
    results: {
      productName: 'Melatonin 5mg Sleep Aid',
      category: 'Sleep Support',
      naturalAlternatives: [
        {
          name: 'Valerian Root',
          description: 'Traditional herbal remedy for sleep and relaxation',
          effectiveness: 'Moderate',
          usage: '300-600mg before bedtime',
        },
        {
          name: 'Chamomile',
          description: 'Calming herb that promotes relaxation',
          effectiveness: 'Mild',
          usage: 'Tea or 400mg extract before bed',
        },
        {
          name: 'Magnesium Glycinate',
          description: 'Mineral that supports healthy sleep cycles',
          effectiveness: 'Moderate',
          usage: '200-400mg before bedtime',
        },
      ],
      safetyNotes: 'Natural sleep aids work best when combined with good sleep hygiene practices.',
      disclaimer: 'This information is for educational purposes only.',
    },
  },
  {
    id: 'scan_003',
    medicationName: 'Aspirin',
    scanDate: '2025-12-25T14:00:00Z',
    displayDate: 'Dec 25, 2025',
    imageUri: null,
    results: {
      productName: 'Aspirin 325mg',
      category: 'Pain Relief / Blood Thinner',
      naturalAlternatives: [
        {
          name: 'White Willow Bark',
          description: 'Natural precursor to aspirin with similar effects',
          effectiveness: 'Moderate',
          usage: '240mg standardized extract',
        },
        {
          name: 'Omega-3 Fish Oil',
          description: 'Supports cardiovascular health and reduces inflammation',
          effectiveness: 'Moderate',
          usage: '1000-2000mg EPA/DHA daily',
        },
        {
          name: 'Bromelain',
          description: 'Enzyme from pineapple with anti-inflammatory properties',
          effectiveness: 'Mild',
          usage: '500mg between meals',
        },
      ],
      safetyNotes: 'Natural alternatives may not provide the same blood-thinning effects. Consult your doctor if taking aspirin for cardiovascular protection.',
      disclaimer: 'This information is for educational purposes only.',
    },
  },
];

// Demo scan result for analysis screen
export const DEMO_SCAN_RESULT = DEMO_SCAN_HISTORY[0].results;

// Initialize demo mode data
export const initializeDemoData = async () => {
  if (!isDemoMode()) return false;

  try {
    // Set demo user as logged in
    await SecureStore.setItemAsync('user_id', DEMO_USER.uid);
    await SecureStore.setItemAsync('user_email', DEMO_USER.email);
    await SecureStore.setItemAsync('is_premium', 'true');
    await SecureStore.setItemAsync('is_guest', 'false');
    await SecureStore.setItemAsync('onboarding_completed', 'true');
    await SecureStore.setItemAsync('scan_count', String(DEMO_SCAN_HISTORY.length));
    await SecureStore.setItemAsync('auth_token', 'demo-auth-token');

    // Set demo scan history
    await AsyncStorage.setItem('demo_scan_history', JSON.stringify(DEMO_SCAN_HISTORY));

    // Accept disclaimer for demo mode
    await AsyncStorage.setItem('disclaimer_accepted', 'true');

    console.log('[DemoDataService] Demo mode initialized');
    return true;
  } catch (error) {
    console.error('[DemoDataService] Error initializing demo data:', error);
    return false;
  }
};

// Get demo scan history
export const getDemoScanHistory = async () => {
  if (!isDemoMode()) return null;

  try {
    const history = await AsyncStorage.getItem('demo_scan_history');
    if (history) {
      return JSON.parse(history);
    }
    return DEMO_SCAN_HISTORY;
  } catch (error) {
    console.error('[DemoDataService] Error getting demo history:', error);
    return DEMO_SCAN_HISTORY;
  }
};

// Check if user should be treated as premium in demo mode
export const isDemoPremium = () => {
  return isDemoMode();
};

// Get demo analysis result
export const getDemoAnalysisResult = (medicationName) => {
  if (!isDemoMode()) return null;

  // Find matching scan or return first one
  const match = DEMO_SCAN_HISTORY.find(
    scan => scan.medicationName.toLowerCase() === medicationName?.toLowerCase()
  );

  return match ? match.results : DEMO_SCAN_RESULT;
};

export default {
  isDemoMode,
  initializeDemoData,
  getDemoScanHistory,
  isDemoPremium,
  getDemoAnalysisResult,
  DEMO_USER,
  DEMO_SCAN_HISTORY,
  DEMO_SCAN_RESULT,
};
