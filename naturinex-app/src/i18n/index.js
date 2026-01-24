/**
 * Internationalization (i18n) Configuration
 *
 * Provides multi-language support using react-i18next.
 * Supports: English (default), Spanish, French, German, Portuguese, Chinese, Japanese
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

// Storage key for language preference
const LANGUAGE_KEY = '@user_language';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

// Resources object with all translations
const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  zh: { translation: zh },
  ja: { translation: ja },
};

// Detect user's preferred language
const getDeviceLanguage = () => {
  const locale = Localization.locale;
  const languageCode = locale.split('-')[0];

  // Check if supported
  if (SUPPORTED_LANGUAGES.find(l => l.code === languageCode)) {
    return languageCode;
  }

  return 'en'; // Default to English
};

// Initialize i18n
const initI18n = async () => {
  // Try to get saved language preference
  let savedLanguage = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    console.error('[i18n] Error reading saved language:', error);
  }

  const initialLanguage = savedLanguage || getDeviceLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v3', // Required for React Native

      interpolation: {
        escapeValue: false, // React already handles escaping
      },

      react: {
        useSuspense: false, // Required for React Native
      },
    });

  console.log('[i18n] Initialized with language:', initialLanguage);
  return initialLanguage;
};

// Change language and persist preference
export const changeLanguage = async (languageCode) => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    console.log('[i18n] Language changed to:', languageCode);
    return true;
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

// Get language info
export const getLanguageInfo = (code) => {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
};

// Export initialization function
export { initI18n };

export default i18n;
