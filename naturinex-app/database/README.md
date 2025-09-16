# Medical Compliance Database Setup

This directory contains the database schema and migrations for the NaturineX medical compliance system, including HIPAA-compliant disclaimer tracking and drug interaction checking.

## Overview

The medical compliance system includes:

1. **Disclaimer Management**: HIPAA-compliant tracking of medical disclaimer acceptances
2. **Drug Interaction Database**: Comprehensive drug interaction checking with severity levels
3. **Medical Warnings**: Age, pregnancy, and condition-based warnings
4. **Emergency Contacts**: Secure storage of emergency contacts for minors
5. **Audit Logging**: Complete audit trail for compliance

## Files

### Schema Files
- `schema/medical_compliance_tables.sql` - Complete schema with all tables, indexes, and functions
- `migrations/001_medical_compliance_migration.sql` - Migration script for existing databases

### Database Tables

#### Core Tables

**disclaimer_acceptances**
- Tracks user acceptance of medical disclaimers
- 30-day expiry enforcement
- HIPAA-compliant data hashing
- Support for minors with emergency contacts

**drug_interactions**
- Comprehensive drug interaction database
- Multiple severity levels (critical, major, moderate, minor)
- Support for different interaction types
- Evidence-based classifications

**medical_warnings**
- Age-specific warnings (pediatric, geriatric)
- Pregnancy category warnings (A, B, C, D, X)
- Condition-based contraindications
- Monitoring requirements

**emergency_contacts**
- Encrypted contact information for minors
- Primary contact designation
- Verification status tracking

#### Audit Tables

**disclaimer_audit_logs**
- Complete audit trail for disclaimer events
- 7-year retention for HIPAA compliance
- Session and IP tracking (hashed)

**interaction_audit_logs**
- Drug interaction check history
- Risk assessment tracking
- Usage analytics

## Setup Instructions

### For New Supabase Projects

1. Run the complete schema file:
```sql
-- In Supabase SQL Editor
\i schema/medical_compliance_tables.sql
```

### For Existing Supabase Projects

1. Run the migration script:
```sql
-- In Supabase SQL Editor
\i migrations/001_medical_compliance_migration.sql
```

### Environment Variables

Add these to your `.env` file:
```env
# API Keys for drug interaction services
REACT_APP_RXNORM_API_KEY=your_rxnorm_key
REACT_APP_FDA_API_KEY=your_fda_key
REACT_APP_DRUGS_COM_API_KEY=your_drugs_com_key

# Encryption salt for data hashing
REACT_APP_SALT=your_secure_salt_here
```

## Security Features

### HIPAA Compliance
- All sensitive data is hashed using SHA-256
- IP addresses and user agents are hashed for privacy
- 7-year audit log retention as required
- Row Level Security (RLS) enabled
- Encrypted emergency contact storage

### Data Protection
- User data isolation via RLS policies
- Audit trails for all medical interactions
- Secure session tracking
- Encrypted sensitive information

### Access Controls
- Users can only access their own data
- Audit logs are read-only for users
- Admin-only access to sensitive operations

## API Integration

### Supported Drug Interaction APIs

1. **RxNorm (NIH/NLM)** - Primary source
   - Free government API
   - High confidence data
   - Real-time interaction checking

2. **FDA Orange Book** - Secondary source
   - Official FDA drug labeling
   - Regulatory compliance data
   - Black box warnings

3. **Local Database** - Fallback
   - Critical interactions cached locally
   - Offline capability
   - Custom warnings

### Usage Examples

```javascript
// Check if user has valid disclaimer
const hasValidDisclaimer = await disclaimerService.hasValidDisclaimer(userId, 'drug_interaction');

// Record disclaimer acceptance
await disclaimerService.recordAcceptance({
  userId: 'user-uuid',
  featureType: 'drug_interaction',
  isMinor: false,
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Check drug interactions
const interactions = await drugInteractionService.checkInteractions(
  [
    { name: 'warfarin', rxcui: '11289' },
    { name: 'aspirin', rxcui: '1191' }
  ],
  {
    age: 65,
    allergies: [{ allergen: 'sulfa', reaction_type: 'rash' }],
    conditions: ['hypertension']
  }
);
```

## Monitoring and Maintenance

### Regular Tasks

1. **Audit Log Cleanup**
```sql
-- Clean up logs older than 7 years (run monthly)
SELECT cleanup_old_audit_logs();
```

2. **Data Validation**
```sql
-- Check disclaimer compliance
SELECT
  feature_type,
  COUNT(*) as active_disclaimers,
  COUNT(*) FILTER (WHERE accepted_at < NOW() - INTERVAL '30 days') as expired
FROM disclaimer_acceptances
WHERE is_active = TRUE
GROUP BY feature_type;
```

3. **Interaction Database Updates**
```sql
-- Update drug interaction database with new sources
INSERT INTO drug_interactions (drug1, drug2, severity, description, source)
VALUES ('new_drug', 'existing_drug', 'major', 'Description', 'Source')
ON CONFLICT (drug1, drug2, interaction_type) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();
```

### Performance Monitoring

Monitor these queries for performance:
- Disclaimer validity checks (most frequent)
- Drug interaction lookups
- Audit log insertions

Key indexes to maintain:
- `idx_disclaimer_active` - Critical for real-time checks
- `idx_drug_interactions_drugs` - Essential for interaction queries
- `idx_warnings_medication` - Important for warning lookups

## Compliance Notes

### HIPAA Requirements Met
- ✅ Data encryption at rest and in transit
- ✅ Audit logging with 7-year retention
- ✅ Access controls and user isolation
- ✅ Data minimization (hashing sensitive data)
- ✅ Business Associate Agreement compatibility

### FDA Guidelines Followed
- ✅ Clear medical disclaimers required
- ✅ Non-diagnostic language throughout
- ✅ Emergency contact requirements for minors
- ✅ Interaction severity classifications
- ✅ Proper liability limitations

### Development Guidelines
- Always test with sample data first
- Never commit real user data to version control
- Use environment variables for sensitive configuration
- Follow principle of least privilege for database access
- Regular security audits of database access patterns

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check if extensions are enabled: `uuid-ossp`, `pgcrypto`
   - Verify user has CREATE privileges
   - Check for existing table name conflicts

2. **RLS Policies Block Access**
   - Ensure `auth.uid()` returns expected user ID
   - Check if user is properly authenticated
   - Verify policy conditions match your use case

3. **Performance Issues**
   - Check if indexes are being used: `EXPLAIN ANALYZE`
   - Consider partitioning audit tables for large datasets
   - Monitor connection pool usage

4. **Disclaimer Not Enforced**
   - Check if 30-day expiry logic is working
   - Verify `is_active` flag is being set correctly
   - Ensure triggers are firing properly

### Support

For additional support:
1. Check Supabase documentation for RLS and security
2. Review FDA guidelines for medical app compliance
3. Consult HIPAA requirements for healthcare data
4. Contact development team for custom modifications