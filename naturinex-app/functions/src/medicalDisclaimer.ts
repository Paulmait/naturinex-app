import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

/**
 * Medical disclaimer management and compliance system
 */

export interface MedicalDisclaimerData {
  version: string;
  lastUpdated: Date;
  mustAccept: boolean;
  categories: {
    general: string;
    aiLimitations: string;
    notMedicalAdvice: string;
    emergencyWarning: string;
    dataAccuracy: string;
    professionalConsultation: string;
  };
  displayRules: {
    showOnEveryResult: boolean;
    dismissable: boolean;
    prominenceLevel: 'high' | 'medium' | 'low';
    refreshInterval: number; // days
  };
}

/**
 * Get current medical disclaimer
 */
export async function getMedicalDisclaimer(req: Request, res: Response) {
  const { lang = 'en' } = req.query;
  
  const disclaimer: MedicalDisclaimerData = {
    version: '1.0',
    lastUpdated: new Date('2025-01-21'),
    mustAccept: true,
    categories: {
      general: 'This app provides general health information and is not a substitute for professional medical advice, diagnosis, or treatment.',
      aiLimitations: 'AI analysis may not be 100% accurate. Results are based on image recognition and should be verified by healthcare professionals.',
      notMedicalAdvice: 'IMPORTANT: Information provided by Naturinex is NOT medical advice. Always consult qualified healthcare providers for medical decisions.',
      emergencyWarning: 'In case of medical emergency, call 911 or your local emergency number immediately. Do not rely on this app for emergency situations.',
      dataAccuracy: 'While we strive for accuracy, product information and health data may contain errors. Always verify critical information independently.',
      professionalConsultation: 'Consult healthcare professionals before making changes to medications, supplements, or treatment plans based on app information.'
    },
    displayRules: {
      showOnEveryResult: true,
      dismissable: false,
      prominenceLevel: 'high',
      refreshInterval: 30
    }
  };
  
  res.json({
    disclaimer,
    language: lang,
    alternativeLanguages: ['en', 'es', 'fr'],
    htmlVersion: getHtmlDisclaimer(disclaimer),
    shortVersion: getShortDisclaimer(),
    legalUrl: 'https://app.naturinex.com/medical-disclaimer'
  });
}

/**
 * Record user's disclaimer acknowledgment
 */
export async function acknowledgeDisclaimer(req: Request, res: Response) {
  try {
    const { userId, version, context } = req.body;
    
    if (!userId || !version) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }
    
    // Record acknowledgment
    const acknowledgment = {
      userId,
      version,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      context, // 'initial', 'scan_result', 'settings'
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    await admin.firestore()
      .collection('disclaimer_acknowledgments')
      .add(acknowledgment);
    
    // Update user record
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        medicalDisclaimer: {
          acknowledged: true,
          version,
          lastAcknowledged: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    
    res.json({
      success: true,
      message: 'Disclaimer acknowledged',
      nextReminder: getNextReminderDate()
    });
    
  } catch (error) {
    console.error('Error acknowledging disclaimer:', error);
    res.status(500).json({
      error: 'Failed to record acknowledgment'
    });
  }
}

/**
 * Check if user needs to re-acknowledge disclaimer
 */
export async function checkDisclaimerStatus(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const userData = userDoc.data();
    
    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    const disclaimerData = userData.medicalDisclaimer;
    const needsAcknowledgment = checkIfAcknowledgmentNeeded(disclaimerData);
    
    res.json({
      needsAcknowledgment,
      currentVersion: '1.0',
      userVersion: disclaimerData?.version || null,
      lastAcknowledged: disclaimerData?.lastAcknowledged?.toDate() || null,
      reason: needsAcknowledgment ? getAcknowledgmentReason(disclaimerData) : null
    });
    
  } catch (error) {
    console.error('Error checking disclaimer status:', error);
    res.status(500).json({
      error: 'Failed to check status'
    });
  }
}

/**
 * Get scan result with embedded disclaimer
 */
export async function wrapScanResultWithDisclaimer(scanResult: any, userId: string) {
  const disclaimer = {
    type: 'medical_disclaimer',
    priority: 'high',
    message: getShortDisclaimer(),
    fullDisclaimer: {
      text: 'This analysis is for informational purposes only. Not medical advice.',
      actions: [
        {
          label: 'View Full Disclaimer',
          url: 'https://app.naturinex.com/medical-disclaimer'
        },
        {
          label: 'Consult Healthcare Provider',
          action: 'open_provider_directory'
        }
      ]
    },
    display: {
      position: 'top',
      style: 'warning',
      icon: 'alert-circle',
      color: '#FF6B6B'
    }
  };
  
  // Log disclaimer display
  await admin.firestore()
    .collection('disclaimer_displays')
    .add({
      userId,
      scanId: scanResult.scanId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      disclaimerVersion: '1.0'
    });
  
  return {
    ...scanResult,
    disclaimer,
    metadata: {
      ...scanResult.metadata,
      hasDisclaimer: true,
      disclaimerVersion: '1.0'
    }
  };
}

/**
 * Get HTML formatted disclaimer
 */
function getHtmlDisclaimer(disclaimer: MedicalDisclaimerData): string {
  return `
    <div class="medical-disclaimer">
      <h3>⚠️ Important Medical Disclaimer</h3>
      <div class="disclaimer-content">
        <p><strong>${disclaimer.categories.notMedicalAdvice}</strong></p>
        <ul>
          <li>${disclaimer.categories.general}</li>
          <li>${disclaimer.categories.aiLimitations}</li>
          <li>${disclaimer.categories.dataAccuracy}</li>
        </ul>
        <div class="emergency-warning">
          <strong>🚨 ${disclaimer.categories.emergencyWarning}</strong>
        </div>
        <p>${disclaimer.categories.professionalConsultation}</p>
      </div>
      <style>
        .medical-disclaimer {
          border: 2px solid #FF6B6B;
          background: #FFF5F5;
          padding: 16px;
          border-radius: 8px;
          margin: 16px 0;
        }
        .emergency-warning {
          background: #FFE0E0;
          padding: 12px;
          border-radius: 4px;
          margin: 12px 0;
        }
      </style>
    </div>
  `;
}

/**
 * Get short disclaimer for display
 */
function getShortDisclaimer(): string {
  return 'AI health analysis for informational purposes only. Not medical advice. Consult healthcare professionals.';
}

/**
 * Check if user needs to acknowledge disclaimer
 */
function checkIfAcknowledgmentNeeded(disclaimerData: any): boolean {
  if (!disclaimerData || !disclaimerData.acknowledged) {
    return true;
  }
  
  // Check version
  if (disclaimerData.version !== '1.0') {
    return true;
  }
  
  // Check if acknowledgment expired (30 days)
  if (disclaimerData.lastAcknowledged) {
    const lastAck = disclaimerData.lastAcknowledged.toDate();
    const daysSince = (Date.now() - lastAck.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get reason for re-acknowledgment
 */
function getAcknowledgmentReason(disclaimerData: any): string {
  if (!disclaimerData || !disclaimerData.acknowledged) {
    return 'initial_acknowledgment';
  }
  
  if (disclaimerData.version !== '1.0') {
    return 'version_update';
  }
  
  return 'periodic_renewal';
}

/**
 * Get next reminder date
 */
function getNextReminderDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

/**
 * Medical disclaimer component for React Native
 */
export function getMedicalDisclaimerComponent(): string {
  return `
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const MedicalDisclaimer = ({ onAcknowledge, showActions = true }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
        <Text style={styles.title}>Medical Disclaimer</Text>
      </View>
      
      <Text style={styles.mainText}>
        This AI analysis is for informational purposes only and is not medical advice.
      </Text>
      
      <Text style={styles.subText}>
        Always consult healthcare professionals for medical decisions.
        In emergencies, call 911 immediately.
      </Text>
      
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://app.naturinex.com/medical-disclaimer')}
            style={styles.link}
          >
            <Text style={styles.linkText}>Read Full Disclaimer</Text>
          </TouchableOpacity>
          
          {onAcknowledge && (
            <TouchableOpacity onPress={onAcknowledge} style={styles.button}>
              <Text style={styles.buttonText}>I Understand</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 8,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    padding: 8,
  },
  linkText: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
`;
}