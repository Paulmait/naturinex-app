// Data Management Service
// Comprehensive system for version control, approval workflow, and data quality management

import { supabase } from '../config/supabase';

class DataManagementService {
  constructor() {
    this.entityTypes = {
      medications: 'medications',
      natural_alternatives: 'natural_alternatives',
      medication_alternatives: 'medication_alternatives',
      clinical_studies: 'clinical_studies',
      study_evidence: 'study_evidence'
    };

    this.approvalTypes = {
      content_review: 'content_review',
      medical_review: 'medical_review',
      final_approval: 'final_approval'
    };

    this.changeTypes = {
      create: 'create',
      update: 'update',
      delete: 'delete',
      approve: 'approve',
      reject: 'reject'
    };
  }

  // ============================================================================
  // VERSION CONTROL METHODS
  // ============================================================================

  /**
   * Create a new version of an entity
   */
  async createVersion(entityType, entityId, changes, userId, reason = null) {
    try {
      // Get current entity data
      const currentData = await this.getEntityCurrentData(entityType, entityId);

      if (!currentData) {
        throw new Error('Entity not found');
      }

      // Create version record
      const { data: version, error: versionError } = await supabase
        .from('data_versions')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          version_number: currentData.version + 1,
          change_type: this.changeTypes.update,
          changed_fields: this.getChangedFields(currentData, changes),
          old_values: this.sanitizeData(currentData),
          new_values: this.sanitizeData({ ...currentData, ...changes }),
          changed_by: userId,
          change_reason: reason,
          change_description: this.generateChangeDescription(currentData, changes),
          requires_approval: this.requiresApproval(entityType, changes)
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Create approval workflow if required
      if (version.requires_approval) {
        await this.createApprovalWorkflow(version.id, entityType, changes);
      } else {
        // Auto-approve minor changes
        await this.approveVersion(version.id, userId, 'Auto-approved minor change');
      }

      return { data: version, error: null };

    } catch (error) {
      console.error('Create version error:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get version history for an entity
   */
  async getVersionHistory(entityType, entityId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('data_versions')
        .select(`
          *,
          changed_by_user:changed_by (
            id,
            email
          ),
          approved_by_user:approved_by (
            id,
            email
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('version_number', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };

    } catch (error) {
      console.error('Get version history error:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Revert to a previous version
   */
  async revertToVersion(entityType, entityId, targetVersion, userId, reason) {
    try {
      // Get target version data
      const { data: targetVersionData, error: targetError } = await supabase
        .from('data_versions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('version_number', targetVersion)
        .single();

      if (targetError) throw targetError;

      // Create revert version
      const revertData = targetVersionData.new_values;
      const currentData = await this.getEntityCurrentData(entityType, entityId);

      const { data: revertVersion, error: revertError } = await supabase
        .from('data_versions')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          version_number: currentData.version + 1,
          change_type: 'revert',
          changed_fields: this.getChangedFields(currentData, revertData),
          old_values: this.sanitizeData(currentData),
          new_values: this.sanitizeData(revertData),
          changed_by: userId,
          change_reason: reason,
          change_description: `Reverted to version ${targetVersion}`,
          requires_approval: true
        })
        .select()
        .single();

      if (revertError) throw revertError;

      // Create approval workflow
      await this.createApprovalWorkflow(revertVersion.id, entityType, revertData);

      return { data: revertVersion, error: null };

    } catch (error) {
      console.error('Revert version error:', error);
      return { data: null, error: error.message };
    }
  }

  // ============================================================================
  // APPROVAL WORKFLOW METHODS
  // ============================================================================

  /**
   * Create approval workflow
   */
  async createApprovalWorkflow(versionId, entityType, changes) {
    try {
      const approvalSteps = this.getApprovalSteps(entityType, changes);

      for (const step of approvalSteps) {
        await supabase
          .from('pending_approvals')
          .insert({
            entity_type: entityType,
            entity_id: changes.id || changes.entity_id,
            version_id: versionId,
            approval_type: step.type,
            assigned_to: step.assignedTo,
            priority: step.priority,
            due_date: step.dueDate
          });
      }

      return { success: true };

    } catch (error) {
      console.error('Create approval workflow error:', error);
      throw error;
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId, filters = {}) {
    try {
      const {
        entityType = null,
        priority = null,
        status = 'pending',
        limit = 50
      } = filters;

      let queryBuilder = supabase
        .from('pending_approvals')
        .select(`
          *,
          version:version_id (
            entity_type,
            entity_id,
            change_type,
            change_description,
            changed_by,
            created_at
          )
        `)
        .eq('assigned_to', userId)
        .eq('status', status);

      if (entityType) queryBuilder = queryBuilder.eq('entity_type', entityType);
      if (priority) queryBuilder = queryBuilder.eq('priority', priority);

      const { data, error } = await queryBuilder
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };

    } catch (error) {
      console.error('Get pending approvals error:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Process approval decision
   */
  async processApproval(approvalId, decision, userId, notes = null) {
    try {
      // Get approval details
      const { data: approval, error: approvalError } = await supabase
        .from('pending_approvals')
        .select('*')
        .eq('id', approvalId)
        .single();

      if (approvalError) throw approvalError;

      // Update approval status
      const { error: updateError } = await supabase
        .from('pending_approvals')
        .update({
          status: decision === 'approve' ? 'approved' : 'rejected',
          decision,
          decision_reason: notes,
          decision_at: new Date(),
          decided_by: userId
        })
        .eq('id', approvalId);

      if (updateError) throw updateError;

      // Handle approval decision
      if (decision === 'approve') {
        await this.handleApprovalSuccess(approval);
      } else {
        await this.handleApprovalRejection(approval, notes);
      }

      return { success: true };

    } catch (error) {
      console.error('Process approval error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle successful approval
   */
  async handleApprovalSuccess(approval) {
    try {
      // Check if this was the final approval step
      const { data: remainingApprovals, error } = await supabase
        .from('pending_approvals')
        .select('id')
        .eq('version_id', approval.version_id)
        .eq('status', 'pending');

      if (error) throw error;

      if (remainingApprovals.length === 0) {
        // All approvals complete - apply the changes
        await this.applyApprovedVersion(approval.version_id);
      }

    } catch (error) {
      console.error('Handle approval success error:', error);
      throw error;
    }
  }

  /**
   * Apply approved version changes
   */
  async applyApprovedVersion(versionId) {
    try {
      // Get version details
      const { data: version, error: versionError } = await supabase
        .from('data_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Apply changes to the main table
      const { error: updateError } = await supabase
        .from(version.entity_type)
        .update({
          ...version.new_values,
          version: version.version_number,
          updated_at: new Date()
        })
        .eq('id', version.entity_id);

      if (updateError) throw updateError;

      // Mark version as approved
      await supabase
        .from('data_versions')
        .update({
          approved_by: version.changed_by, // TODO: Get actual approver
          approved_at: new Date()
        })
        .eq('id', versionId);

      // Log approval event
      await this.logDataEvent('version_applied', {
        versionId,
        entityType: version.entity_type,
        entityId: version.entity_id
      });

    } catch (error) {
      console.error('Apply approved version error:', error);
      throw error;
    }
  }

  // ============================================================================
  // DATA QUALITY MANAGEMENT
  // ============================================================================

  /**
   * Validate data quality
   */
  async validateDataQuality(entityType, data) {
    const validationRules = this.getValidationRules(entityType);
    const issues = [];

    for (const rule of validationRules) {
      const result = await this.applyValidationRule(rule, data);
      if (!result.passed) {
        issues.push({
          field: rule.field,
          rule: rule.name,
          severity: rule.severity,
          message: result.message
        });
      }
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      score: this.calculateQualityScore(issues)
    };
  }

  /**
   * Get validation rules for entity type
   */
  getValidationRules(entityType) {
    const rules = {
      medications: [
        {
          name: 'required_name',
          field: 'name',
          type: 'required',
          severity: 'error',
          message: 'Medication name is required'
        },
        {
          name: 'valid_dosage',
          field: 'standard_dosage',
          type: 'format',
          severity: 'warning',
          message: 'Dosage format should be standardized'
        },
        {
          name: 'contraindications_present',
          field: 'contraindications',
          type: 'required',
          severity: 'warning',
          message: 'Contraindications should be specified'
        }
      ],
      natural_alternatives: [
        {
          name: 'required_name',
          field: 'name',
          type: 'required',
          severity: 'error',
          message: 'Alternative name is required'
        },
        {
          name: 'scientific_name_format',
          field: 'scientific_name',
          type: 'format',
          severity: 'warning',
          message: 'Scientific name should follow binomial nomenclature'
        },
        {
          name: 'evidence_level_valid',
          field: 'evidence_level',
          type: 'enum',
          values: ['strong', 'moderate', 'limited', 'insufficient'],
          severity: 'error',
          message: 'Evidence level must be valid'
        }
      ]
    };

    return rules[entityType] || [];
  }

  /**
   * Apply validation rule
   */
  async applyValidationRule(rule, data) {
    switch (rule.type) {
      case 'required':
        return {
          passed: data[rule.field] !== null && data[rule.field] !== undefined && data[rule.field] !== '',
          message: rule.message
        };

      case 'format':
        return await this.validateFormat(rule, data);

      case 'enum':
        return {
          passed: rule.values.includes(data[rule.field]),
          message: `${rule.field} must be one of: ${rule.values.join(', ')}`
        };

      default:
        return { passed: true, message: null };
    }
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(issues) {
    let score = 100;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'error': score -= 20; break;
        case 'warning': score -= 10; break;
        case 'info': score -= 5; break;
      }
    });

    return Math.max(0, score);
  }

  // ============================================================================
  // CITATION MANAGEMENT
  // ============================================================================

  /**
   * Add citation to study
   */
  async addCitation(studyData, userId) {
    try {
      // Validate citation data
      const validation = await this.validateCitation(studyData);
      if (!validation.isValid) {
        throw new Error(`Invalid citation: ${validation.errors.join(', ')}`);
      }

      // Check for duplicates
      const existing = await this.findExistingCitation(studyData);
      if (existing) {
        return { data: existing, error: null, duplicate: true };
      }

      // Create study record
      const { data: study, error: studyError } = await supabase
        .from('clinical_studies')
        .insert({
          ...studyData,
          created_by: userId,
          is_active: true
        })
        .select()
        .single();

      if (studyError) throw studyError;

      // Create version tracking
      await this.createVersion('clinical_studies', study.id, studyData, userId, 'New citation added');

      return { data: study, error: null, duplicate: false };

    } catch (error) {
      console.error('Add citation error:', error);
      return { data: null, error: error.message, duplicate: false };
    }
  }

  /**
   * Update citation
   */
  async updateCitation(studyId, updates, userId, reason) {
    try {
      // Get current study data
      const { data: currentStudy, error: getCurrentError } = await supabase
        .from('clinical_studies')
        .select('*')
        .eq('id', studyId)
        .single();

      if (getCurrentError) throw getCurrentError;

      // Validate updates
      const validation = await this.validateCitation({ ...currentStudy, ...updates });
      if (!validation.isValid) {
        throw new Error(`Invalid citation update: ${validation.errors.join(', ')}`);
      }

      // Create version for the update
      const versionResult = await this.createVersion(
        'clinical_studies',
        studyId,
        updates,
        userId,
        reason
      );

      return versionResult;

    } catch (error) {
      console.error('Update citation error:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Validate citation data
   */
  async validateCitation(citationData) {
    const errors = [];

    // Required fields
    if (!citationData.title) errors.push('Title is required');
    if (!citationData.authors || citationData.authors.length === 0) errors.push('At least one author is required');
    if (!citationData.journal) errors.push('Journal is required');
    if (!citationData.publication_date) errors.push('Publication date is required');

    // PubMed ID format
    if (citationData.pubmed_id && !/^\d+$/.test(citationData.pubmed_id)) {
      errors.push('PubMed ID must be numeric');
    }

    // DOI format
    if (citationData.doi && !citationData.doi.startsWith('10.')) {
      errors.push('DOI must start with "10."');
    }

    // Study type validation
    const validStudyTypes = ['RCT', 'observational', 'case-control', 'cohort', 'meta-analysis', 'systematic-review', 'case-report'];
    if (citationData.study_type && !validStudyTypes.includes(citationData.study_type)) {
      errors.push('Invalid study type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Find existing citation
   */
  async findExistingCitation(citationData) {
    try {
      let queryBuilder = supabase
        .from('clinical_studies')
        .select('*')
        .eq('is_active', true);

      // Check by PubMed ID first
      if (citationData.pubmed_id) {
        queryBuilder = queryBuilder.eq('pubmed_id', citationData.pubmed_id);
      } else if (citationData.doi) {
        queryBuilder = queryBuilder.eq('doi', citationData.doi);
      } else {
        // Check by title similarity
        queryBuilder = queryBuilder.ilike('title', `%${citationData.title}%`);
      }

      const { data, error } = await queryBuilder.limit(1);

      if (error) throw error;
      return data[0] || null;

    } catch (error) {
      console.error('Find existing citation error:', error);
      return null;
    }
  }

  // ============================================================================
  // DATA SYNC AND UPDATES
  // ============================================================================

  /**
   * Sync with external data source
   */
  async syncWithDataSource(sourceId, syncType = 'incremental') {
    try {
      // Get data source configuration
      const { data: source, error: sourceError } = await supabase
        .from('data_sources')
        .select('*')
        .eq('id', sourceId)
        .eq('is_active', true)
        .single();

      if (sourceError) throw sourceError;

      // Create sync log
      const { data: syncLog, error: logError } = await supabase
        .from('data_sync_logs')
        .insert({
          source_id: sourceId,
          sync_type: syncType,
          sync_status: 'started',
          started_at: new Date(),
          sync_configuration: source.sync_configuration
        })
        .select()
        .single();

      if (logError) throw logError;

      try {
        // Perform sync based on source type
        const syncResult = await this.performDataSync(source, syncType);

        // Update sync log with results
        await supabase
          .from('data_sync_logs')
          .update({
            sync_status: 'completed',
            completed_at: new Date(),
            duration_seconds: Math.floor((Date.now() - new Date(syncLog.started_at)) / 1000),
            records_processed: syncResult.processed,
            records_created: syncResult.created,
            records_updated: syncResult.updated,
            records_failed: syncResult.failed,
            warnings: syncResult.warnings
          })
          .eq('id', syncLog.id);

        return { data: syncResult, error: null };

      } catch (syncError) {
        // Update sync log with error
        await supabase
          .from('data_sync_logs')
          .update({
            sync_status: 'failed',
            completed_at: new Date(),
            error_message: syncError.message,
            error_details: { stack: syncError.stack }
          })
          .eq('id', syncLog.id);

        throw syncError;
      }

    } catch (error) {
      console.error('Sync with data source error:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Perform actual data sync
   */
  async performDataSync(source, syncType) {
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      warnings: []
    };

    switch (source.type) {
      case 'API':
        return await this.syncFromAPI(source, syncType, results);
      case 'database':
        return await this.syncFromDatabase(source, syncType, results);
      case 'manual':
        return await this.syncManualData(source, syncType, results);
      default:
        throw new Error(`Unsupported sync type: ${source.type}`);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get current entity data
   */
  async getEntityCurrentData(entityType, entityId) {
    try {
      const { data, error } = await supabase
        .from(entityType)
        .select('*')
        .eq('id', entityId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Get entity data error:', error);
      return null;
    }
  }

  /**
   * Get changed fields between old and new data
   */
  getChangedFields(oldData, newData) {
    const changes = [];

    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes.push(key);
      }
    });

    return changes;
  }

  /**
   * Sanitize data for storage
   */
  sanitizeData(data) {
    const sanitized = { ...data };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.license_number_hash;

    // Remove system fields
    delete sanitized.created_at;
    delete sanitized.updated_at;

    return sanitized;
  }

  /**
   * Generate change description
   */
  generateChangeDescription(oldData, newData) {
    const changes = this.getChangedFields(oldData, newData);

    if (changes.length === 0) return 'No changes detected';
    if (changes.length === 1) return `Updated ${changes[0]}`;
    if (changes.length <= 3) return `Updated ${changes.join(', ')}`;

    return `Updated ${changes.length} fields: ${changes.slice(0, 3).join(', ')}...`;
  }

  /**
   * Check if changes require approval
   */
  requiresApproval(entityType, changes) {
    const criticalFields = {
      medications: ['contraindications', 'side_effects', 'standard_dosage'],
      natural_alternatives: ['contraindications', 'side_effects', 'safety_profile'],
      medication_alternatives: ['effectiveness_rating', 'contraindications'],
      clinical_studies: ['results_summary', 'statistical_significance']
    };

    const entityCriticalFields = criticalFields[entityType] || [];
    const changedFields = Object.keys(changes);

    return changedFields.some(field => entityCriticalFields.includes(field));
  }

  /**
   * Get approval steps for entity and changes
   */
  getApprovalSteps(entityType, changes) {
    const steps = [];

    // Content review (always required)
    steps.push({
      type: this.approvalTypes.content_review,
      assignedTo: this.getContentReviewer(entityType),
      priority: 'medium',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
    });

    // Medical review (for medical content)
    if (this.requiresMedicalReview(entityType, changes)) {
      steps.push({
        type: this.approvalTypes.medical_review,
        assignedTo: this.getMedicalReviewer(entityType),
        priority: 'high',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
      });
    }

    // Final approval (for critical changes)
    if (this.requiresFinalApproval(entityType, changes)) {
      steps.push({
        type: this.approvalTypes.final_approval,
        assignedTo: this.getFinalApprover(),
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }

    return steps;
  }

  /**
   * Log data management event
   */
  async logDataEvent(eventType, eventData) {
    try {
      await supabase
        .from('data_management_logs')
        .insert({
          event_type: eventType,
          event_data: eventData,
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Log data event error:', error);
    }
  }

  // Placeholder methods for approval assignment (would be configured based on organization)
  getContentReviewer(entityType) {
    // Return appropriate reviewer based on entity type
    return null; // Would implement actual assignment logic
  }

  getMedicalReviewer(entityType) {
    return null; // Would implement actual assignment logic
  }

  getFinalApprover() {
    return null; // Would implement actual assignment logic
  }

  requiresMedicalReview(entityType, changes) {
    const medicalEntities = ['medications', 'natural_alternatives', 'medication_alternatives'];
    return medicalEntities.includes(entityType);
  }

  requiresFinalApproval(entityType, changes) {
    // Critical changes that need final approval
    const criticalChanges = ['contraindications', 'safety_profile', 'effectiveness_rating'];
    return Object.keys(changes).some(field => criticalChanges.includes(field));
  }
}

// Create singleton instance
const dataManagementService = new DataManagementService();

export default dataManagementService;