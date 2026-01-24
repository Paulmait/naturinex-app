/**
 * Language Selector Component
 *
 * Allows users to change the app language.
 * Can be used as a standalone screen or modal.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '../i18n';

export default function LanguageSelector({ visible, onClose, asScreen = false }) {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage());
  const [loading, setLoading] = useState(false);

  const handleSelectLanguage = async (languageCode) => {
    if (languageCode === selectedLanguage) return;

    setLoading(true);
    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        setSelectedLanguage(languageCode);
        // Close modal after a brief delay to show the change
        setTimeout(() => {
          onClose?.();
        }, 300);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLanguageItem = ({ item }) => {
    const isSelected = item.code === selectedLanguage;

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.languageItemSelected]}
        onPress={() => handleSelectLanguage(item.code)}
        disabled={loading}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.languageInfo}>
          <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
            {item.nativeName}
          </Text>
          <Text style={styles.languageEnglish}>{item.name}</Text>
        </View>
        {isSelected && (
          <MaterialIcons name="check-circle" size={24} color="#10B981" />
        )}
        {loading && item.code === selectedLanguage && (
          <ActivityIndicator size="small" color="#10B981" />
        )}
      </TouchableOpacity>
    );
  };

  const content = (
    <View style={[styles.container, asScreen && styles.screenContainer]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.language')}</Text>
        {!asScreen && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.description}>
        Select your preferred language. The app will update immediately.
      </Text>

      <FlatList
        data={SUPPORTED_LANGUAGES}
        renderItem={renderLanguageItem}
        keyExtractor={(item) => item.code}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.footer}>
        <MaterialIcons name="info-outline" size={16} color="#9CA3AF" />
        <Text style={styles.footerText}>
          More languages coming soon. Want to help translate? Contact us!
        </Text>
      </View>
    </View>
  );

  if (asScreen) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {content}
        </View>
      </View>
    </Modal>
  );
}

// Compact version for settings screen
export function LanguageSelectorCompact({ onPress }) {
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();
  const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <TouchableOpacity style={styles.compactContainer} onPress={onPress}>
      <View style={styles.compactLeft}>
        <MaterialIcons name="language" size={24} color="#6B7280" />
        <Text style={styles.compactLabel}>{t('settings.language')}</Text>
      </View>
      <View style={styles.compactRight}>
        <Text style={styles.compactFlag}>{langInfo.flag}</Text>
        <Text style={styles.compactValue}>{langInfo.nativeName}</Text>
        <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  screenContainer: {
    paddingTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  languageItemSelected: {
    backgroundColor: '#ECFDF5',
  },
  flag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  languageNameSelected: {
    color: '#059669',
  },
  languageEnglish: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactLabel: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  compactValue: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
});
