import { Linking, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * Safely opens URLs using in-app browsers (SafariViewController on iOS, Chrome Custom Tabs on Android)
 * Falls back to system browser if in-app browser is not available
 */
export async function safeOpenURL(url, options = {}) {
  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Check if URL can be opened
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error('Cannot open this URL');
    }

    // Try to open in in-app browser first
    const result = await WebBrowser.openBrowserAsync(url, {
      // iOS specific options
      dismissButtonStyle: 'close',
      preferredBarTintColor: '#10B981',
      preferredControlTintColor: '#FFFFFF',
      readerMode: false,
      
      // Android specific options
      showTitle: true,
      enableDefaultShare: true,
      enableBarCollapsing: false,
      
      // Common options
      ...options
    });

    return result;
  } catch (error) {
    console.error('Error opening URL in SafariViewController:', error);
    
    // Fallback to system browser
    try {
      await Linking.openURL(url);
    } catch (fallbackError) {
      Alert.alert(
        'Cannot Open Link',
        'Unable to open this link. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }
}

/**
 * Opens app settings in system preferences
 */
export async function openAppSettings() {
  try {
    await Linking.openSettings();
  } catch (error) {
    Alert.alert(
      'Cannot Open Settings',
      'Unable to open app settings. Please go to Settings manually.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Opens email client with pre-filled content
 */
export async function openEmail(email, subject = '', body = '') {
  try {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'No Email Client',
        'No email client is configured on this device.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    Alert.alert(
      'Error',
      'Unable to open email client.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Opens phone dialer with number
 */
export async function openPhone(phoneNumber) {
  try {
    const url = `tel:${phoneNumber}`;
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Cannot Make Call',
        'Unable to make phone calls from this device.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    Alert.alert(
      'Error',
      'Unable to open phone dialer.',
      [{ text: 'OK' }]
    );
  }
}