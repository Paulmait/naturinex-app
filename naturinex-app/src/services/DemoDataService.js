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

// Demo user credentials for App Store Review
// NOTE: Actual credentials should be provided to Apple via App Store Connect review notes
// Do NOT store real passwords in code
export const DEMO_USER = {
  email: 'appreview@naturinex.com',
  displayName: 'App Review User',
  uid: 'demo-user-123',
  isPremium: true,
  subscriptionTier: 'premium',
  subscriptionStatus: 'active',
};

// Demo scan history entries - Pre-populated for App Store Review
export const DEMO_SCAN_HISTORY = [
  {
    id: 'scan_001',
    medicationName: 'Ibuprofen',
    scanDate: '2026-01-20T10:30:00Z',
    displayDate: 'Jan 20, 2026',
    imageUri: null,
    results: {
      productName: 'Ibuprofen 200mg',
      category: 'Pain Relief / Anti-inflammatory',
      naturalAlternatives: [
        {
          name: 'Turmeric (Curcumin)',
          description: 'Traditional herb with studied wellness properties',
          researchContext: 'Research ongoing',
          precautions: 'Consult healthcare provider before use',
        },
        {
          name: 'Willow Bark Extract',
          description: 'Traditional herb historically used for wellness support',
          researchContext: 'Some research available',
          precautions: 'Consult healthcare provider for appropriate use',
        },
        {
          name: 'Ginger Root',
          description: 'Widely used culinary and wellness herb',
          researchContext: 'Traditional use with modern research',
          precautions: 'Consult healthcare provider before use',
        },
      ],
      safetyNotes: 'Always consult your healthcare provider before changing medications. Natural alternatives may interact with existing medications.',
      disclaimer: 'This information is for educational purposes only.',
    },
  },
  {
    id: 'scan_002',
    medicationName: 'Melatonin',
    scanDate: '2026-01-18T22:15:00Z',
    displayDate: 'Jan 18, 2026',
    imageUri: null,
    results: {
      productName: 'Melatonin 5mg Sleep Aid',
      category: 'Sleep Support',
      naturalAlternatives: [
        {
          name: 'Valerian Root',
          description: 'Traditional herbal remedy used for relaxation',
          researchContext: 'Traditional use with some research',
          precautions: 'Consult healthcare provider before use',
        },
        {
          name: 'Chamomile',
          description: 'Traditional calming herb used in teas',
          researchContext: 'Historical traditional use',
          precautions: 'Consult healthcare provider for guidance',
        },
        {
          name: 'Magnesium Glycinate',
          description: 'Mineral supplement for general wellness',
          researchContext: 'Research available on general wellness',
          precautions: 'Consult healthcare provider for appropriate use',
        },
      ],
      safetyNotes: 'Natural sleep aids work best when combined with good sleep hygiene practices.',
      disclaimer: 'This information is for educational purposes only.',
    },
  },
  {
    id: 'scan_003',
    medicationName: 'Aspirin',
    scanDate: '2026-01-15T14:00:00Z',
    displayDate: 'Jan 15, 2026',
    imageUri: null,
    results: {
      productName: 'Aspirin 325mg',
      category: 'Pain Relief / Blood Thinner',
      naturalAlternatives: [
        {
          name: 'White Willow Bark',
          description: 'Traditional herb historically used for wellness',
          researchContext: 'Historical and preliminary research available',
          precautions: 'Consult healthcare provider before use',
        },
        {
          name: 'Omega-3 Fish Oil',
          description: 'Essential fatty acids for general wellness',
          researchContext: 'Well-studied for general wellness',
          precautions: 'Consult healthcare provider for guidance',
        },
        {
          name: 'Bromelain',
          description: 'Enzyme from pineapple studied for wellness',
          researchContext: 'Some research available',
          precautions: 'Consult healthcare provider before use',
        },
      ],
      safetyNotes: 'Natural alternatives may not provide the same blood-thinning effects. Consult your doctor if taking aspirin for cardiovascular protection.',
      disclaimer: 'This information is for educational purposes only.',
    },
  },
  {
    id: 'scan_004',
    medicationName: 'Vitamin D3',
    scanDate: '2026-01-12T09:00:00Z',
    displayDate: 'Jan 12, 2026',
    imageUri: null,
    results: {
      productName: 'Vitamin D3 1000 IU',
      category: 'Vitamin Supplement',
      naturalAlternatives: [
        {
          name: 'Sunlight Exposure',
          description: 'Natural source of vitamin D production',
          researchContext: 'Well-established science',
          precautions: 'Practice sun safety, use sunscreen appropriately',
        },
        {
          name: 'Fatty Fish (Salmon, Mackerel)',
          description: 'Natural dietary source of vitamin D',
          researchContext: 'Established nutritional science',
          precautions: 'Consider mercury content in certain fish',
        },
        {
          name: 'Mushrooms (UV-exposed)',
          description: 'Plant-based source of vitamin D2',
          researchContext: 'Research supports vitamin D content',
          precautions: 'D2 may be less bioavailable than D3',
        },
      ],
      safetyNotes: 'Vitamin D levels should be monitored by healthcare provider. Too much vitamin D can be harmful.',
      disclaimer: 'This information is for educational purposes only.',
    },
  },
  {
    id: 'scan_005',
    medicationName: 'Acetaminophen',
    scanDate: '2026-01-08T16:45:00Z',
    displayDate: 'Jan 8, 2026',
    imageUri: null,
    results: {
      productName: 'Acetaminophen 500mg (Tylenol)',
      category: 'Pain Relief / Fever Reducer',
      naturalAlternatives: [
        {
          name: 'Feverfew',
          description: 'Traditional herb used for headache support',
          researchContext: 'Some clinical research available',
          precautions: 'Consult healthcare provider before use',
        },
        {
          name: 'Peppermint Oil (Topical)',
          description: 'Traditional remedy for tension relief',
          researchContext: 'Limited research on topical use',
          precautions: 'For external use only; dilute properly',
        },
        {
          name: 'Ginger Tea',
          description: 'Traditional warming remedy',
          researchContext: 'Traditional use with some modern research',
          precautions: 'Generally considered safe in food amounts',
        },
      ],
      safetyNotes: 'Acetaminophen is generally well-tolerated but can cause liver damage in high doses. Always follow dosing instructions.',
      disclaimer: 'This information is for educational purposes only.',
    },
  },
];

// Demo scan result for analysis screen
export const DEMO_SCAN_RESULT = DEMO_SCAN_HISTORY[0].results;

// Initialize demo mode data for App Store Review
export const initializeDemoData = async () => {
  if (!isDemoMode()) return false;

  try {
    // Set demo user as logged in with premium access
    await SecureStore.setItemAsync('user_id', DEMO_USER.uid);
    await SecureStore.setItemAsync('user_email', DEMO_USER.email);
    await SecureStore.setItemAsync('is_premium', 'true');
    await SecureStore.setItemAsync('is_guest', 'false');
    await SecureStore.setItemAsync('onboarding_completed', 'true');
    await SecureStore.setItemAsync('scan_count', String(DEMO_SCAN_HISTORY.length));
    await SecureStore.setItemAsync('auth_token', 'demo-auth-token');
    await SecureStore.setItemAsync('subscription_tier', DEMO_USER.subscriptionTier);
    await SecureStore.setItemAsync('subscription_status', DEMO_USER.subscriptionStatus);

    // Set demo scan history for Scan History screen
    await AsyncStorage.setItem('demo_scan_history', JSON.stringify(DEMO_SCAN_HISTORY));

    // Accept disclaimer for demo mode
    await AsyncStorage.setItem('disclaimer_accepted', 'true');

    // Set notifications as enabled
    await SecureStore.setItemAsync('notifications_enabled', 'true');

    console.log('[DemoDataService] Demo mode initialized with', DEMO_SCAN_HISTORY.length, 'pre-populated scans');
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
