/**
 * Medical Compliance Utilities
 * Helper functions to integrate disclaimer enforcement throughout the app
 * Ensures HIPAA compliance and FDA guideline adherence
 */

import { disclaimerService } from '../services/disclaimerService.js';
import { drugInteractionService } from '../services/drugInteractionService.js';

/**
 * Higher-order component to enforce medical disclaimers
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {string} featureType - Type of medical feature being accessed
 * @returns {React.Component} - Wrapped component with disclaimer enforcement
 */
export const withMedicalDisclaimer = (WrappedComponent, featureType = 'general') => {
  return function MedicalDisclaimerWrapper(props) {
    const [hasValidDisclaimer, setHasValidDisclaimer] = React.useState(null);
    const [showDisclaimer, setShowDisclaimer] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      checkDisclaimerStatus();
    }, [props.userId]);

    const checkDisclaimerStatus = async () => {
      if (!props.userId) {
        setLoading(false);
        return;
      }

      try {
        const isValid = await disclaimerService.hasValidDisclaimer(props.userId, featureType);
        setHasValidDisclaimer(isValid);

        if (!isValid && props.enforceDisclaimer !== false) {
          setShowDisclaimer(true);
        }
      } catch (error) {
        console.error('Error checking disclaimer status:', error);
        // Fail safe - show disclaimer on error
        setShowDisclaimer(true);
      } finally {
        setLoading(false);
      }
    };

    const handleDisclaimerAccept = async () => {
      setShowDisclaimer(false);
      setHasValidDisclaimer(true);
      // Trigger a recheck to ensure compliance
      await checkDisclaimerStatus();
    };

    const handleDisclaimerDecline = () => {
      setShowDisclaimer(false);
      // Call parent's onDisclaimerDecline if provided
      if (props.onDisclaimerDecline) {
        props.onDisclaimerDecline();
      }
    };

    if (loading) {
      return React.createElement('div', {
        style: { padding: 20, textAlign: 'center' }
      }, 'Verifying medical compliance...');
    }

    if (showDisclaimer) {
      // Import MedicalDisclaimer dynamically to avoid circular dependencies
      const MedicalDisclaimer = React.lazy(() => import('../components/MedicalDisclaimer.js'));

      return React.createElement(React.Suspense, {
        fallback: React.createElement('div', null, 'Loading disclaimer...')
      }, React.createElement(MedicalDisclaimer, {
        visible: true,
        type: featureType,
        userId: props.userId,
        onAccept: handleDisclaimerAccept,
        onDecline: handleDisclaimerDecline,
        enforceAcceptance: true
      }));
    }

    // Pass all props to wrapped component plus disclaimer status
    return React.createElement(WrappedComponent, {
      ...props,
      hasValidDisclaimer,
      medicalComplianceVerified: hasValidDisclaimer
    });
  };
};

/**
 * Hook for medical compliance in functional components
 * @param {string} userId - User ID
 * @param {string} featureType - Type of medical feature
 * @returns {Object} - Compliance status and functions
 */
export const useMedicalCompliance = (userId, featureType = 'general') => {
  const [status, setStatus] = React.useState({
    hasValidDisclaimer: null,
    loading: true,
    error: null
  });

  const checkCompliance = React.useCallback(async () => {
    if (!userId) {
      setStatus({ hasValidDisclaimer: false, loading: false, error: null });
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      const isValid = await disclaimerService.hasValidDisclaimer(userId, featureType);
      const disclaimerStatus = await disclaimerService.getDisclaimerStatus(userId);

      setStatus({
        hasValidDisclaimer: isValid,
        loading: false,
        error: null,
        disclaimerStatus,
        daysRemaining: disclaimerStatus[featureType]?.daysRemaining || 0
      });
    } catch (error) {
      console.error('Medical compliance check failed:', error);
      setStatus({
        hasValidDisclaimer: false,
        loading: false,
        error: error.message
      });
    }
  }, [userId, featureType]);

  React.useEffect(() => {
    checkCompliance();
  }, [checkCompliance]);

  const enforceCompliance = async () => {
    try {
      await disclaimerService.enforceDisclaimer(userId, featureType);
      return true;
    } catch (error) {
      console.error('Compliance enforcement failed:', error);
      throw error;
    }
  };

  const recordAcceptance = async (acceptanceData) => {
    try {
      await disclaimerService.recordAcceptance({
        userId,
        featureType,
        ...acceptanceData
      });
      // Refresh compliance status
      await checkCompliance();
    } catch (error) {
      console.error('Failed to record disclaimer acceptance:', error);
      throw error;
    }
  };

  return {
    ...status,
    enforceCompliance,
    recordAcceptance,
    refreshStatus: checkCompliance
  };
};

/**
 * Middleware function to check compliance before API calls
 * @param {string} userId - User ID
 * @param {string} featureType - Feature type being accessed
 * @returns {Promise<boolean>} - Whether user is compliant
 */
export const ensureMedicalCompliance = async (userId, featureType = 'general') => {
  try {
    await disclaimerService.enforceDisclaimer(userId, featureType);
    return true;
  } catch (error) {
    console.warn('Medical compliance check failed:', error.message);
    return false;
  }
};

/**
 * Helper to get appropriate disclaimer type for different features
 * @param {string} feature - App feature being accessed
 * @returns {string} - Appropriate disclaimer type
 */
export const getDisclaimerTypeForFeature = (feature) => {
  const featureMap = {
    // Scanning and analysis features
    'camera_scan': 'medication_analysis',
    'barcode_scan': 'medication_analysis',
    'pill_identification': 'medication_analysis',
    'medication_analysis': 'medication_analysis',

    // Drug interaction features
    'drug_interaction': 'drug_interaction',
    'interaction_check': 'drug_interaction',
    'medication_checker': 'drug_interaction',

    // Symptom and health features
    'symptom_checker': 'symptom_checker',
    'health_assessment': 'symptom_checker',
    'condition_lookup': 'symptom_checker',

    // AI-powered features
    'ai_analysis': 'medication_analysis',
    'ai_recommendations': 'medication_analysis',
    'smart_suggestions': 'medication_analysis',

    // Default
    'default': 'general'
  };

  return featureMap[feature] || featureMap.default;
};

/**
 * Component wrapper for drug interaction checking
 * @param {React.Component} WrappedComponent - Component to wrap
 * @returns {React.Component} - Component with drug interaction checking
 */
export const withDrugInteractionCheck = (WrappedComponent) => {
  return function DrugInteractionWrapper(props) {
    const [interactionResults, setInteractionResults] = React.useState(null);
    const [checkingInteractions, setCheckingInteractions] = React.useState(false);

    const checkInteractions = async (medications, patientData = {}) => {
      if (!medications || medications.length === 0) {
        setInteractionResults(null);
        return;
      }

      setCheckingInteractions(true);
      try {
        const results = await drugInteractionService.checkInteractions(
          medications,
          { ...patientData, user_id: props.userId }
        );
        setInteractionResults(results);
        return results;
      } catch (error) {
        console.error('Drug interaction check failed:', error);
        throw error;
      } finally {
        setCheckingInteractions(false);
      }
    };

    const getCriticalWarnings = () => {
      if (!interactionResults) return [];

      return [
        ...interactionResults.interactions.filter(i => i.severity === 'critical'),
        ...interactionResults.contraindications.filter(c => c.severity === 'critical'),
        ...interactionResults.allergies // All allergies are critical
      ];
    };

    const hasCriticalWarnings = () => {
      return getCriticalWarnings().length > 0;
    };

    return React.createElement(WrappedComponent, {
      ...props,
      interactionResults,
      checkingInteractions,
      checkInteractions,
      getCriticalWarnings,
      hasCriticalWarnings
    });
  };
};

/**
 * Utility to format compliance warnings for display
 * @param {Array} warnings - Array of warnings/interactions
 * @returns {Array} - Formatted warnings for UI display
 */
export const formatComplianceWarnings = (warnings) => {
  if (!warnings || warnings.length === 0) return [];

  return warnings.map(warning => ({
    id: warning.id,
    type: warning.type || warning.severity,
    severity: warning.severity,
    title: getWarningTitle(warning),
    message: warning.description || warning.warning_text,
    action: warning.management || 'Consult healthcare provider',
    source: warning.source,
    timestamp: warning.timestamp || new Date().toISOString()
  }));
};

/**
 * Get appropriate warning title based on warning type
 * @param {Object} warning - Warning object
 * @returns {string} - Formatted title
 */
const getWarningTitle = (warning) => {
  const { type, severity, drug1, drug2, medication } = warning;

  if (type === 'drug_drug' && drug1 && drug2) {
    return `${severity.toUpperCase()}: ${drug1} + ${drug2} Interaction`;
  }

  if (type === 'drug_allergy') {
    return `ALLERGY ALERT: ${medication || 'Medication'}`;
  }

  if (type === 'drug_pregnancy') {
    return `PREGNANCY WARNING: ${medication || 'Medication'}`;
  }

  if (type === 'drug_age') {
    return `AGE WARNING: ${medication || 'Medication'}`;
  }

  return `${severity.toUpperCase()} WARNING`;
};

/**
 * Utility to check if feature requires enhanced compliance
 * @param {string} featureType - Type of feature
 * @returns {boolean} - Whether enhanced compliance is required
 */
export const requiresEnhancedCompliance = (featureType) => {
  const enhancedFeatures = [
    'drug_interaction',
    'medication_analysis',
    'symptom_checker'
  ];

  return enhancedFeatures.includes(featureType);
};

/**
 * Get compliance status summary for dashboard
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Compliance status summary
 */
export const getComplianceSummary = async (userId) => {
  if (!userId) {
    return {
      overall_status: 'not_authenticated',
      disclaimers: {},
      warnings: [],
      last_check: null
    };
  }

  try {
    const disclaimerStatus = await disclaimerService.getDisclaimerStatus(userId);

    const summary = {
      overall_status: 'compliant',
      disclaimers: disclaimerStatus,
      warnings: [],
      last_check: new Date().toISOString()
    };

    // Check for expiring disclaimers
    Object.entries(disclaimerStatus).forEach(([featureType, status]) => {
      if (!status.isValid) {
        summary.overall_status = 'non_compliant';
        summary.warnings.push({
          type: 'disclaimer_expired',
          feature: featureType,
          message: `Medical disclaimer for ${featureType} has expired`
        });
      } else if (status.daysRemaining <= 7) {
        summary.warnings.push({
          type: 'disclaimer_expiring',
          feature: featureType,
          message: `Medical disclaimer for ${featureType} expires in ${status.daysRemaining} days`
        });
      }
    });

    return summary;
  } catch (error) {
    console.error('Error getting compliance summary:', error);
    return {
      overall_status: 'error',
      disclaimers: {},
      warnings: [{ type: 'system_error', message: 'Unable to check compliance status' }],
      last_check: new Date().toISOString()
    };
  }
};

// Export all utilities
export default {
  withMedicalDisclaimer,
  useMedicalCompliance,
  ensureMedicalCompliance,
  getDisclaimerTypeForFeature,
  withDrugInteractionCheck,
  formatComplianceWarnings,
  requiresEnhancedCompliance,
  getComplianceSummary
};