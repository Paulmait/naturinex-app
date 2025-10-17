// Medical Disclaimer Modal - REQUIRED for all scans
// User must accept before using medication analysis features

import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import auditLogger, { ACCESS_TYPES, RESOURCE_TYPES } from '../services/auditLogger';
import ErrorService from '../services/ErrorService';

const MedicalDisclaimerModal = ({ isOpen, onAccept, onDecline, user }) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    understand: false,
    notMedicalAdvice: false,
    consultDoctor: false,
    emergency911: false,
  });

  // Check if user has already accepted disclaimer
  useEffect(() => {
    if (user?.id) {
      checkDisclaimerAcceptance(user.id);
    }
  }, [user]);

  const checkDisclaimerAcceptance = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('disclaimer_acceptances')
        .select('*')
        .eq('user_id', userId)
        .eq('disclaimer_type', 'medical')
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setHasAccepted(true);
        onAccept?.();
      }
    } catch (error) {
      // User hasn't accepted - show modal
    }
  };

  const handleAccept = async () => {
    // Validate all checkboxes
    if (!Object.values(checkboxes).every(v => v === true)) {
      alert('Please read and check all boxes before proceeding');
      return;
    }

    setIsLoading(true);

    try {
      // Record acceptance in database
      if (user?.id) {
        const { error } = await supabase
          .from('disclaimer_acceptances')
          .insert({
            user_id: user.id,
            disclaimer_type: 'medical',
            disclaimer_version: '1.0',
            accepted_at: new Date().toISOString(),
            ip_address: await getClientIP(),
            user_agent: navigator.userAgent,
            is_active: true,
          });

        if (error) throw error;

        // Log acceptance in audit trail
        await auditLogger.logAccess({
          userId: user.id,
          action: ACCESS_TYPES.CREATE,
          resourceType: RESOURCE_TYPES.USER_PROFILE,
          resourceId: user.id,
          metadata: {
            event: 'disclaimer_accepted',
            disclaimer_type: 'medical',
            version: '1.0',
          },
        });
      }

      setHasAccepted(true);
      onAccept?.();
    } catch (error) {
      await ErrorService.logError(error, 'MedicalDisclaimerModal.handleAccept');
      alert('Failed to save acceptance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    setCheckboxes({
      understand: false,
      notMedicalAdvice: false,
      consultDoctor: false,
      emergency911: false,
    });
    onDecline?.();
  };

  const handleCheckboxChange = (key) => {
    setCheckboxes(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  if (!isOpen || hasAccepted) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <span style={styles.warningIcon}>⚠️</span>
          </div>
          <h2 style={styles.title}>Important Medical Disclaimer</h2>
          <p style={styles.subtitle}>Please read carefully before proceeding</p>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Main Warning */}
          <div style={styles.warningBox}>
            <h3 style={styles.warningTitle}>🚨 THIS IS NOT MEDICAL ADVICE</h3>
            <p style={styles.warningText}>
              The information provided by Naturinex is for <strong>EDUCATIONAL PURPOSES ONLY</strong>.
              It is NOT a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>

          {/* Key Points */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>You must understand that:</h4>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                ⚠️ <strong>Never stop or change medications without consulting your doctor</strong>
              </li>
              <li style={styles.listItem}>
                ⚠️ Natural alternatives can have <strong>serious side effects and drug interactions</strong>
              </li>
              <li style={styles.listItem}>
                ⚠️ Some conditions <strong>require prescription medication</strong> - natural alternatives may not be appropriate
              </li>
              <li style={styles.listItem}>
                ⚠️ Individual results vary significantly - what works for others may not work for you
              </li>
              <li style={styles.listItem}>
                ⚠️ Quality and potency of supplements varies by manufacturer
              </li>
              <li style={styles.listItem}>
                ⚠️ We <strong>do not diagnose, treat, cure, or prevent any disease</strong>
              </li>
            </ul>
          </div>

          {/* Emergency Warning */}
          <div style={styles.emergencyBox}>
            <h4 style={styles.emergencyTitle}>🚨 EMERGENCY SITUATIONS</h4>
            <p style={styles.emergencyText}>
              If you are experiencing a medical emergency (chest pain, difficulty breathing,
              severe bleeding, stroke symptoms, or any life-threatening condition):
            </p>
            <p style={styles.emergencyNumber}>CALL 911 IMMEDIATELY</p>
            <p style={styles.emergencyText}>
              Do not use this app for emergency medical situations.
            </p>
          </div>

          {/* Who Should Consult Doctor */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Always consult your healthcare provider if you:</h4>
            <ul style={styles.list}>
              <li style={styles.listItem}>Are pregnant or breastfeeding</li>
              <li style={styles.listItem}>Have a chronic medical condition (heart disease, diabetes, cancer, etc.)</li>
              <li style={styles.listItem}>Are taking prescription medications</li>
              <li style={styles.listItem}>Are scheduled for surgery</li>
              <li style={styles.listItem}>Have allergies to medications or supplements</li>
              <li style={styles.listItem}>Are under 18 or over 65 years old</li>
            </ul>
          </div>

          {/* Liability Disclaimer */}
          <div style={styles.liabilityBox}>
            <h4 style={styles.liabilityTitle}>Limitation of Liability</h4>
            <p style={styles.liabilityText}>
              Naturinex and its affiliates, officers, employees, and agents shall not be liable
              for any direct, indirect, incidental, consequential, or punitive damages arising
              from your use of this information. We make no warranties or representations about
              the accuracy or completeness of the information provided.
            </p>
          </div>

          {/* Acknowledgment Checkboxes */}
          <div style={styles.checkboxSection}>
            <h4 style={styles.sectionTitle}>I acknowledge and agree that:</h4>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={checkboxes.understand}
                onChange={() => handleCheckboxChange('understand')}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>
                I have read and <strong>understand</strong> this disclaimer
              </span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={checkboxes.notMedicalAdvice}
                onChange={() => handleCheckboxChange('notMedicalAdvice')}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>
                I understand this is <strong>NOT medical advice</strong>
              </span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={checkboxes.consultDoctor}
                onChange={() => handleCheckboxChange('consultDoctor')}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>
                I will <strong>consult my doctor</strong> before making any medication changes
              </span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={checkboxes.emergency911}
                onChange={() => handleCheckboxChange('emergency911')}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>
                I will <strong>call 911</strong> in case of emergency
              </span>
            </label>
          </div>

          {/* Additional Info */}
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              📋 By proceeding, you acknowledge that you have read, understood, and agree to
              these terms. Your acceptance is recorded for compliance purposes.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            onClick={handleDecline}
            style={styles.declineButton}
            disabled={isLoading}
          >
            I Do Not Accept
          </button>
          <button
            onClick={handleAccept}
            style={{
              ...styles.acceptButton,
              ...(isLoading || !Object.values(checkboxes).every(v => v)
                ? styles.acceptButtonDisabled
                : {}),
            }}
            disabled={isLoading || !Object.values(checkboxes).every(v => v)}
          >
            {isLoading ? 'Processing...' : 'I Accept and Understand'}
          </button>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Version 1.0 | Last Updated: January 17, 2025
          </p>
          <p style={styles.footerText}>
            Questions? Contact: <a href="mailto:support@naturinex.com" style={styles.link}>support@naturinex.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
    overflowY: 'auto',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    backgroundColor: '#FEE2E2',
    padding: '30px',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '15px',
  },
  warningIcon: {
    fontSize: '48px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: '10px',
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    color: '#7F1D1D',
  },
  content: {
    padding: '30px',
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    border: '3px solid #DC2626',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '25px',
  },
  warningTitle: {
    margin: '0 0 15px 0',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#991B1B',
  },
  warningText: {
    margin: 0,
    fontSize: '16px',
    color: '#7F1D1D',
    lineHeight: '1.6',
  },
  section: {
    marginBottom: '25px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: '15px',
    marginTop: 0,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: '10px 0',
    fontSize: '15px',
    color: '#374151',
    borderBottom: '1px solid #E5E7EB',
    lineHeight: '1.5',
  },
  emergencyBox: {
    backgroundColor: '#FEE2E2',
    border: '2px solid #DC2626',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '25px',
    textAlign: 'center',
  },
  emergencyTitle: {
    margin: '0 0 15px 0',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#991B1B',
  },
  emergencyText: {
    margin: '10px 0',
    fontSize: '16px',
    color: '#7F1D1D',
  },
  emergencyNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#DC2626',
    margin: '15px 0',
  },
  liabilityBox: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '25px',
  },
  liabilityTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1F2937',
  },
  liabilityText: {
    margin: 0,
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.6',
  },
  checkboxSection: {
    marginBottom: '25px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    marginBottom: '12px',
    cursor: 'pointer',
    border: '2px solid #E5E7EB',
    transition: 'all 0.2s',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    marginRight: '15px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '15px',
    color: '#1F2937',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #93C5FD',
    borderRadius: '8px',
    padding: '15px',
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#1E40AF',
    lineHeight: '1.6',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    padding: '0 30px 30px 30px',
  },
  declineButton: {
    flex: 1,
    padding: '15px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    border: '2px solid #D1D5DB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  acceptButton: {
    flex: 1,
    padding: '15px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#10B981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  acceptButtonDisabled: {
    backgroundColor: '#D1D5DB',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  footer: {
    backgroundColor: '#F9FAFB',
    padding: '20px 30px',
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
    textAlign: 'center',
    borderTop: '1px solid #E5E7EB',
  },
  footerText: {
    margin: '5px 0',
    fontSize: '13px',
    color: '#6B7280',
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
  },
};

export default MedicalDisclaimerModal;

// Helper: Create disclaimer_acceptances table in Supabase
/*
CREATE TABLE disclaimer_acceptances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disclaimer_type TEXT NOT NULL,
  disclaimer_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disclaimer_user ON disclaimer_acceptances(user_id);
CREATE INDEX idx_disclaimer_type ON disclaimer_acceptances(disclaimer_type);
CREATE INDEX idx_disclaimer_active ON disclaimer_acceptances(is_active);

ALTER TABLE disclaimer_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptances"
  ON disclaimer_acceptances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acceptances"
  ON disclaimer_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);
*/
