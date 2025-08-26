// 🗑️ Account Deletion & Data Retention Policy
// Implements industry-standard account deletion with data retention periods

import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { deleteUser } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { trackEvent } from '../utils/analytics';
import { safeUpdateUserDoc } from '../utils/firebaseUserUtils';

function AccountDeletion({ user, onCancel, onSuccess }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [retentionOption, setRetentionOption] = useState('immediate');

  const deletionReasons = [
    'No longer need the service',
    'Privacy concerns',
    'Found better alternative',
    'Cost concerns',
    'Technical issues',
    'Other'
  ];

  const retentionOptions = {
    immediate: {
      title: 'Delete Immediately',
      description: 'Account and data deleted within 24 hours',
      retention: 0,
      icon: '🗑️'
    },
    soft: {
      title: 'Soft Delete (Recommended)',
      description: 'Account deactivated, data kept for 90 days for recovery',
      retention: 90,
      icon: '💤'
    },
    minimal: {
      title: 'Minimal Retention',
      description: 'Account deleted, scan data kept for 30 days for legal compliance',
      retention: 30,
      icon: '📋'
    }
  };

  const handleAccountDeletion = async () => {
    setIsProcessing(true);
    
    try {
      // Track deletion attempt
      await trackEvent('account_deletion_initiated', {
        userId: user.uid,
        reason,
        retentionOption,
        feedback: feedback ? 'provided' : 'none'
      });

      const deletionData = {
        userId: user.uid,
        userEmail: user.email,
        deletionDate: new Date(),
        deletionReason: reason,
        feedback: feedback,
        retentionOption: retentionOption,
        dataRetentionDays: retentionOptions[retentionOption].retention,
        status: 'pending_deletion',
        
        // Calculate actual deletion date
        scheduledDeletionDate: new Date(Date.now() + (retentionOptions[retentionOption].retention * 24 * 60 * 60 * 1000)),
        
        // Legal and compliance info
        gdprCompliant: true,
        ccpaCompliant: true,
        retentionJustification: retentionOptions[retentionOption].retention > 0 ? 'Legal compliance and account recovery' : 'User requested immediate deletion'
      };

      if (retentionOption === 'immediate') {
        // Immediate deletion
        await performImmediateDeletion(deletionData);
      } else {
        // Soft deletion with retention period
        await performSoftDeletion(deletionData);
      }

      // Track successful deletion
      await trackEvent('account_deletion_completed', {
        userId: user.uid,
        retentionOption,
        deletionType: retentionOption === 'immediate' ? 'hard' : 'soft'
      });

      onSuccess();
      
    } catch (error) {
      console.error('Account deletion error:', error);
      
      // Track deletion failure
      await trackEvent('account_deletion_failed', {
        userId: user.uid,
        error: error.message,
        retentionOption
      });
      
      alert('Account deletion failed. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const performImmediateDeletion = async (deletionData) => {
    // Log deletion request for compliance
    await doc(db, 'deletion_requests', user.uid).set(deletionData);

    // Mark user account for immediate deletion
    await safeUpdateUserDoc(user.uid, {
      status: 'deleted',
      deletionDate: new Date(),
      dataRetentionDays: 0,
      scheduledPurgeDate: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours for processing
    });

    // Delete Firebase Auth account
    await deleteUser(auth.currentUser);
  };

  const performSoftDeletion = async (deletionData) => {
    // Log deletion request
    await doc(db, 'deletion_requests', user.uid).set(deletionData);

    // Mark user account as soft deleted
    await safeUpdateUserDoc(user.uid, {
      status: 'deactivated',
      deactivationDate: new Date(),
      dataRetentionDays: retentionOptions[retentionOption].retention,
      scheduledDeletionDate: deletionData.scheduledDeletionDate,
      canRecover: true,
      recoveryToken: generateRecoveryToken(),
      accountDisabled: true
    });
  };

  const generateRecoveryToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  if (step === 1) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '20px', textAlign: 'center' }}>
          🗑️ Delete Account
        </h2>
        
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h5 style={{ color: '#856404', marginTop: 0 }}>⚠️ Important Notice</h5>
          <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
            Account deletion is permanent and cannot be undone. You will lose access to:
          </p>
          <ul style={{ color: '#856404', marginTop: '10px', paddingLeft: '20px' }}>
            <li>All scan history and results</li>
            <li>Premium subscription benefits</li>
            <li>Saved health profiles</li>
            <li>Account settings and preferences</li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Why are you deleting your account?
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          >
            <option value="">Select a reason...</option>
            {deletionReasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Additional feedback (optional):
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Help us improve by sharing your feedback..."
            style={{
              width: '100%',
              height: '80px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => setStep(2)}
            disabled={!reason}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: !reason ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: !reason ? 'not-allowed' : 'pointer'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '20px', textAlign: 'center' }}>
          📋 Data Retention Options
        </h2>
        
        <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center' }}>
          Choose how we handle your data after account deletion:
        </p>

        {Object.entries(retentionOptions).map(([key, option]) => (
          <div
            key={key}
            onClick={() => setRetentionOption(key)}
            style={{
              border: retentionOption === key ? '2px solid #007bff' : '1px solid #ddd',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px',
              cursor: 'pointer',
              backgroundColor: retentionOption === key ? '#f8f9fa' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>{option.icon}</span>
              <strong>{option.title}</strong>
              {retentionOption === key && (
                <span style={{ marginLeft: 'auto', color: '#007bff' }}>✓</span>
              )}
            </div>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              {option.description}
            </p>
            {option.retention > 0 && (
              <p style={{ margin: '5px 0 0 0', color: '#28a745', fontSize: '12px' }}>
                Data recovery possible for {option.retention} days
              </p>
            )}
          </div>
        ))}

        <div style={{
          backgroundColor: '#e9ecef',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#495057'
        }}>
          <strong>Legal Notice:</strong> We comply with GDPR, CCPA, and other privacy regulations. 
          Some data may be retained for legal compliance, security, and fraud prevention as required by law.
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => setStep(1)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
          <button
            onClick={handleAccountDeletion}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: isProcessing ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? 'Processing...' : 'Delete Account'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default AccountDeletion;
