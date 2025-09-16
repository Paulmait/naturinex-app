# NaturineX Medical Database Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the complete NaturineX medical database migration system with natural alternatives, versioning, clinical evidence, and professional reviews.

## Prerequisites

- Supabase project with PostgreSQL database
- Node.js 16+ environment
- Supabase CLI (optional but recommended)
- Database admin access

## Database Schema Components

### 1. Core Tables
- `medications` - Standardized medication database with RxCUI codes
- `natural_alternatives` - Comprehensive natural alternatives with scientific evidence
- `medication_alternatives` - Mappings between medications and alternatives
- `clinical_studies` - Research citations and studies
- `study_evidence` - Links between studies and alternatives
- `user_feedback` - Real-world user experiences
- `medical_professionals` - Verified healthcare provider profiles
- `professional_reviews` - Expert medical opinions

### 2. Version Control & Workflow
- `data_versions` - Complete version history for all data changes
- `pending_approvals` - Approval workflow queue
- `data_sources` - External data source management
- `data_sync_logs` - Synchronization activity tracking

### 3. Performance & Monitoring
- Advanced indexing strategies
- Materialized views for fast aggregations
- Query performance monitoring
- Automated maintenance procedures

## Deployment Steps

### Step 1: Database Schema Setup

1. **Run Base Medical Compliance Schema**
   ```sql
   -- Execute in Supabase SQL Editor
   \i 'database/schema/medical_compliance_tables.sql'
   ```

2. **Deploy NaturineX Medical Database Schema**
   ```sql
   -- Execute in Supabase SQL Editor
   \i 'database/schema/naturinex_medical_database.sql'
   ```

3. **Apply Performance Optimizations**
   ```sql
   -- Execute in Supabase SQL Editor
   \i 'database/schema/performance_optimization.sql'
   ```

### Step 2: Data Migration

1. **Migrate Existing Data**
   ```sql
   -- Execute migration script
   \i 'database/migrations/002_migrate_naturinex_data.sql'
   ```

2. **Verify Data Migration**
   ```sql
   -- Check migration results
   SELECT
       (SELECT COUNT(*) FROM medications WHERE is_active = true) as medications,
       (SELECT COUNT(*) FROM natural_alternatives WHERE is_active = true) as alternatives,
       (SELECT COUNT(*) FROM medication_alternatives WHERE is_active = true) as mappings,
       (SELECT COUNT(*) FROM clinical_studies WHERE is_active = true) as studies;
   ```

### Step 3: Application Integration

1. **Update Service Layer**
   - Replace `naturalAlternativesService.js` with `naturalAlternativesServiceV2.js`
   - Integrate `medicalDataApi.js` for database operations
   - Implement `dataManagementService.js` for version control

2. **Environment Configuration**
   ```javascript
   // Update .env with Supabase credentials
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Step 4: Performance Optimization

1. **Enable Materialized Views**
   ```sql
   -- Refresh materialized views
   SELECT refresh_performance_views();
   ```

2. **Set Up Automated Maintenance**
   ```sql
   -- Schedule daily maintenance (configure in your environment)
   SELECT run_daily_maintenance();
   ```

## Configuration Options

### Search Configuration
```javascript
// Configure search parameters
const searchOptions = {
  includeAI: true,              // Enable AI-powered suggestions
  includeSafety: true,          // Include safety assessments
  includeResearch: true,        // Include clinical research
  includeUserFeedback: true,    // Include user reviews
  includeProfessionalReviews: true, // Include expert opinions
  maxResults: 20                // Maximum results to return
};
```

### Data Quality Settings
```javascript
// Configure validation rules
const qualitySettings = {
  requireMedicalReview: true,   // Require medical professional review
  autoApproveMinorChanges: true, // Auto-approve non-critical updates
  evidenceThreshold: 'moderate', // Minimum evidence level
  retentionPeriod: '7 years'    // HIPAA compliance retention
};
```

## API Usage Examples

### Basic Alternative Search
```javascript
import naturalAlternativesServiceV2 from './services/naturalAlternativesServiceV2';

// Search for alternatives
const result = await naturalAlternativesServiceV2.getNaturalAlternatives(
  'aspirin',
  {
    includeResearch: true,
    includeProfessionalReviews: true,
    userProfile: {
      age: 45,
      conditions: ['hypertension'],
      currentMedications: ['lisinopril']
    }
  }
);

console.log(result.alternatives);
```

### Submit User Feedback
```javascript
import medicalDataAPI from './api/medicalDataApi';

// Submit user feedback
const feedback = await medicalDataAPI.submitFeedback(userId, {
  medicationAlternativeId: 'uuid-here',
  effectivenessRating: 4,
  safetyRating: 5,
  overallSatisfaction: 4,
  wouldRecommend: true,
  dosageUsed: '500mg twice daily',
  durationUsed: '3 months',
  conditionImproved: true
});
```

### Professional Review Submission
```javascript
// Submit professional review (requires verification)
const review = await medicalDataAPI.submitProfessionalReview(userId, {
  medicationAlternativeId: 'uuid-here',
  recommendation: 'recommend',
  evidenceAssessment: 'moderate',
  clinicalExperienceRating: 4,
  clinicalRationale: 'Based on clinical experience with 50+ patients...',
  patientsTotal: 50,
  successRate: 75
});
```

## Data Management & Version Control

### Create Data Version
```javascript
import dataManagementService from './services/dataManagementService';

// Create new version of an alternative
const version = await dataManagementService.createVersion(
  'natural_alternatives',
  alternativeId,
  {
    standard_dosage: { updated: '500-1000mg daily' },
    contraindications: ['pregnancy', 'liver disease']
  },
  userId,
  'Updated dosage based on recent studies'
);
```

### Approval Workflow
```javascript
// Get pending approvals
const approvals = await dataManagementService.getPendingApprovals(userId, {
  entityType: 'natural_alternatives',
  priority: 'high'
});

// Process approval
await dataManagementService.processApproval(
  approvalId,
  'approve',
  userId,
  'Reviewed and approved based on clinical evidence'
);
```

## Monitoring & Maintenance

### Performance Monitoring
```sql
-- Get database performance metrics
SELECT get_database_metrics();

-- Check slow queries
SELECT * FROM query_performance_log
WHERE execution_time_ms > 5000
ORDER BY executed_at DESC;
```

### Data Quality Checks
```sql
-- Check data completeness
SELECT
  table_name,
  total_records,
  missing_critical_fields,
  quality_score
FROM data_quality_report;
```

### Automated Maintenance
```sql
-- Daily maintenance tasks
SELECT run_daily_maintenance();

-- Weekly cleanup
SELECT cleanup_old_data();
```

## Security Considerations

### Row Level Security (RLS)
- Enabled on all user-facing tables
- Users can only access their own data
- Public read access for approved medical content
- Professional verification required for expert features

### Data Privacy
- Sensitive data is hashed/encrypted
- HIPAA-compliant audit trails
- Configurable data retention policies
- User data export for GDPR compliance

### API Security
```javascript
// Validate user permissions
const canSubmitReview = await medicalDataAPI.getMedicalProfessionalStatus(userId);
if (canSubmitReview.data?.verification_status !== 'verified') {
  throw new Error('Professional verification required');
}
```

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check PostgreSQL version (requires 13+)
   - Verify extensions are enabled
   - Check for conflicting table names

2. **Performance Issues**
   - Run `ANALYZE` on tables
   - Refresh materialized views
   - Check index usage

3. **Search Not Working**
   - Update search vectors
   - Check text search configuration
   - Verify GIN indexes

### Debug Queries
```sql
-- Check table health
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  last_analyze
FROM pg_stat_user_tables;

-- Check index usage
SELECT
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Backup & Recovery

### Regular Backups
```bash
# Create database backup
pg_dump -h your-host -U postgres -d your-db > naturinex_backup.sql

# Restore from backup
psql -h your-host -U postgres -d your-db < naturinex_backup.sql
```

### Data Export
```javascript
// Export user data (GDPR compliance)
const userData = await medicalDataAPI.exportUserData(userId);
```

## Support & Resources

### Documentation
- Supabase Documentation: https://supabase.io/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- FDA Drug Database: https://www.fda.gov/drugs/drug-approvals-and-databases

### Support Channels
- GitHub Issues for bug reports
- Community forums for questions
- Professional support for enterprise deployments

## Next Steps

1. **Set up monitoring dashboards**
2. **Configure automated data sources**
3. **Implement professional verification workflow**
4. **Set up regular data quality audits**
5. **Plan for scaling and performance optimization**

## Compliance Notes

- **HIPAA**: 7-year audit trail retention implemented
- **FDA**: Drug interaction warnings and contraindications included
- **GDPR**: User data export and deletion capabilities
- **Medical Disclaimers**: Comprehensive disclaimers and warnings system

---

**Important**: This system handles medical information. Always consult with legal and medical professionals to ensure compliance with applicable regulations and standards in your jurisdiction.