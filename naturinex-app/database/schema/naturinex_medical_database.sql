-- NaturineX Medical Database Schema
-- Comprehensive medical database with natural alternatives, versioning, and clinical evidence
-- Built on top of medical_compliance_tables.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text similarity searches

-- ============================================================================
-- MEDICATIONS MASTER TABLE WITH RxCUI CODES
-- ============================================================================

-- Master medications table with standardized drug codes
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rxcui VARCHAR(20) UNIQUE, -- RxNorm Concept Unique Identifier
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_names TEXT[], -- Array of brand names
    drug_class VARCHAR(100),
    therapeutic_category VARCHAR(100),
    mechanism_of_action TEXT,
    common_uses TEXT[],
    standard_dosage JSONB, -- Flexible dosage information
    route_of_administration VARCHAR(50)[],
    half_life VARCHAR(50),
    metabolism TEXT,
    contraindications TEXT[],
    side_effects JSONB, -- Common, serious, rare side effects
    pregnancy_category VARCHAR(5),
    dea_schedule VARCHAR(10), -- DEA controlled substance schedule
    fda_approval_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'withdrawn')),
    is_otc BOOLEAN DEFAULT FALSE, -- Over-the-counter availability
    requires_prescription BOOLEAN DEFAULT TRUE,

    -- Versioning and audit
    version INTEGER DEFAULT 1,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Search optimization
    search_vector tsvector
);

-- Indexes for medications
CREATE INDEX IF NOT EXISTS idx_medications_rxcui ON medications (rxcui) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications USING gin(to_tsvector('english', name)) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medications_generic ON medications USING gin(to_tsvector('english', generic_name)) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medications_class ON medications (drug_class) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications (therapeutic_category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medications_search ON medications USING gin(search_vector);

-- ============================================================================
-- NATURAL ALTERNATIVES WITH SCIENTIFIC EVIDENCE
-- ============================================================================

-- Natural alternatives master table
CREATE TABLE IF NOT EXISTS natural_alternatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    common_names TEXT[], -- Alternative names
    plant_family VARCHAR(100),
    active_compounds TEXT[], -- Key active ingredients
    description TEXT NOT NULL,
    mechanism_of_action TEXT,
    therapeutic_uses TEXT[],
    traditional_uses TEXT[],

    -- Dosage and administration
    standard_dosage JSONB, -- Flexible dosage information
    dosage_forms TEXT[], -- Capsule, tea, extract, etc.
    preparation_methods TEXT[],
    bioavailability_notes TEXT,

    -- Safety information
    safety_profile JSONB, -- Comprehensive safety data
    contraindications TEXT[],
    side_effects JSONB,
    drug_interactions TEXT[],
    pregnancy_safety VARCHAR(20), -- Safe, caution, avoid, unknown
    breastfeeding_safety VARCHAR(20),
    pediatric_safety VARCHAR(20),
    geriatric_considerations TEXT,

    -- Quality and sourcing
    quality_standards TEXT[], -- USP, NSF, third-party tested
    sourcing_regions TEXT[],
    sustainability_notes TEXT,
    organic_available BOOLEAN DEFAULT FALSE,

    -- Regulatory status
    regulatory_status JSONB, -- FDA status, international approvals
    monograph_status VARCHAR(50), -- Official monographs

    -- Evidence and research
    evidence_level VARCHAR(20) DEFAULT 'limited' CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'insufficient')),
    research_summary TEXT,

    -- Versioning and approval
    version INTEGER DEFAULT 1,
    created_by UUID,
    approved_by UUID,
    medical_reviewed_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    medical_review_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Search optimization
    search_vector tsvector
);

-- Indexes for natural alternatives
CREATE INDEX IF NOT EXISTS idx_natural_alternatives_name ON natural_alternatives USING gin(to_tsvector('english', name)) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_natural_alternatives_scientific ON natural_alternatives USING gin(to_tsvector('english', scientific_name)) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_natural_alternatives_uses ON natural_alternatives USING gin(therapeutic_uses) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_natural_alternatives_evidence ON natural_alternatives (evidence_level) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_natural_alternatives_search ON natural_alternatives USING gin(search_vector);

-- ============================================================================
-- MEDICATION-ALTERNATIVE MAPPINGS WITH EFFECTIVENESS RATINGS
-- ============================================================================

-- Relationship between medications and natural alternatives
CREATE TABLE IF NOT EXISTS medication_alternatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    alternative_id UUID NOT NULL REFERENCES natural_alternatives(id) ON DELETE CASCADE,

    -- Effectiveness metrics
    effectiveness_rating DECIMAL(3,2) CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 1),
    confidence_level VARCHAR(20) DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
    evidence_grade VARCHAR(5), -- A, B, C, D based on clinical evidence

    -- Clinical context
    indication TEXT, -- Specific condition/use case
    comparable_efficacy BOOLEAN DEFAULT FALSE, -- Whether it's as effective as medication
    onset_time VARCHAR(50), -- How quickly it works
    duration_of_action VARCHAR(50),

    -- Usage recommendations
    recommended_for JSONB, -- Patient populations, conditions
    not_recommended_for JSONB, -- Contraindications specific to this pairing
    transition_protocol TEXT, -- How to safely transition
    monitoring_requirements TEXT,

    -- Clinical notes
    clinical_notes TEXT,
    prescriber_notes TEXT,
    patient_counseling_points TEXT[],

    -- Quality of evidence
    study_count INTEGER DEFAULT 0,
    rct_count INTEGER DEFAULT 0, -- Randomized controlled trials
    meta_analysis_count INTEGER DEFAULT 0,
    case_study_count INTEGER DEFAULT 0,

    -- Versioning and approval
    version INTEGER DEFAULT 1,
    created_by UUID,
    approved_by UUID,
    medical_reviewed_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    medical_review_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(medication_id, alternative_id, indication)
);

-- Indexes for medication alternatives
CREATE INDEX IF NOT EXISTS idx_med_alternatives_medication ON medication_alternatives (medication_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_med_alternatives_alternative ON medication_alternatives (alternative_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_med_alternatives_effectiveness ON medication_alternatives (effectiveness_rating DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_med_alternatives_evidence ON medication_alternatives (evidence_grade, confidence_level) WHERE is_active = TRUE;

-- ============================================================================
-- CLINICAL STUDIES AND RESEARCH CITATIONS
-- ============================================================================

-- Clinical studies supporting natural alternatives
CREATE TABLE IF NOT EXISTS clinical_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pubmed_id VARCHAR(20), -- PubMed ID
    doi VARCHAR(255), -- Digital Object Identifier
    title TEXT NOT NULL,
    authors TEXT[],
    journal VARCHAR(255),
    publication_date DATE,

    -- Study characteristics
    study_type VARCHAR(50), -- RCT, observational, case-control, etc.
    study_design VARCHAR(100),
    participant_count INTEGER,
    duration_weeks INTEGER,
    population_description TEXT,

    -- Study quality
    jadad_score INTEGER, -- Quality score for RCTs (1-5)
    cochrane_risk VARCHAR(20), -- High, low, unclear risk of bias
    evidence_level VARCHAR(5), -- 1a, 1b, 2a, 2b, 3, 4, 5

    -- Results summary
    primary_outcome TEXT,
    secondary_outcomes TEXT[],
    results_summary TEXT,
    statistical_significance BOOLEAN,
    effect_size DECIMAL(5,3),
    confidence_interval VARCHAR(50),
    p_value DECIMAL(10,8),

    -- Clinical relevance
    clinical_significance TEXT,
    limitations TEXT[],
    conflict_of_interest TEXT,
    funding_source VARCHAR(255),

    -- Content and links
    abstract TEXT,
    full_text_url VARCHAR(500),
    study_registration VARCHAR(100), -- ClinicalTrials.gov ID

    -- Categorization
    therapeutic_area VARCHAR(100),
    intervention_type VARCHAR(50),
    keywords TEXT[],

    -- Status and quality
    peer_reviewed BOOLEAN DEFAULT TRUE,
    retracted BOOLEAN DEFAULT FALSE,
    retraction_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for clinical studies
CREATE INDEX IF NOT EXISTS idx_studies_pubmed ON clinical_studies (pubmed_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_studies_journal ON clinical_studies (journal, publication_date DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_studies_type ON clinical_studies (study_type, evidence_level) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_studies_date ON clinical_studies (publication_date DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_studies_quality ON clinical_studies (jadad_score DESC, cochrane_risk) WHERE is_active = TRUE;

-- ============================================================================
-- STUDY-ALTERNATIVE RELATIONSHIPS
-- ============================================================================

-- Link studies to specific natural alternatives and medications
CREATE TABLE IF NOT EXISTS study_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID NOT NULL REFERENCES clinical_studies(id) ON DELETE CASCADE,
    alternative_id UUID REFERENCES natural_alternatives(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    medication_alternative_id UUID REFERENCES medication_alternatives(id) ON DELETE CASCADE,

    -- Study relevance to this relationship
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    primary_evidence BOOLEAN DEFAULT FALSE, -- Is this the primary supporting study?

    -- Specific findings
    intervention_details TEXT, -- Dosage, duration used in study
    control_comparison TEXT, -- What was compared against
    specific_outcomes TEXT[],
    effect_measure VARCHAR(100), -- How effect was measured
    statistical_results TEXT,

    -- Evidence contribution
    supports_efficacy BOOLEAN,
    supports_safety BOOLEAN,
    quality_weight DECIMAL(3,2), -- Weight given to this study in meta-analysis

    -- Notes
    reviewer_notes TEXT,
    extraction_notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for study evidence
CREATE INDEX IF NOT EXISTS idx_study_evidence_study ON study_evidence (study_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_study_evidence_alternative ON study_evidence (alternative_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_study_evidence_medication ON study_evidence (medication_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_study_evidence_primary ON study_evidence (primary_evidence, relevance_score DESC) WHERE is_active = TRUE;

-- ============================================================================
-- USER FEEDBACK AND REAL-WORLD EVIDENCE
-- ============================================================================

-- User feedback on natural alternatives
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    medication_alternative_id UUID NOT NULL REFERENCES medication_alternatives(id) ON DELETE CASCADE,

    -- Feedback details
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
    overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),

    -- Usage details
    dosage_used TEXT,
    duration_used VARCHAR(50),
    form_used VARCHAR(100), -- Capsule, tea, extract, etc.
    brand_used VARCHAR(255),

    -- Outcomes
    condition_improved BOOLEAN,
    side_effects_experienced TEXT[],
    would_recommend BOOLEAN,
    switched_from_medication BOOLEAN,

    -- Detailed feedback
    positive_aspects TEXT[],
    negative_aspects TEXT[],
    additional_comments TEXT,

    -- Demographics (anonymized)
    age_range VARCHAR(20), -- 18-25, 26-35, etc.
    gender VARCHAR(20),
    health_conditions TEXT[], -- Anonymized

    -- Verification
    verified_purchase BOOLEAN DEFAULT FALSE,
    healthcare_provider_involved BOOLEAN DEFAULT FALSE,

    -- Privacy and compliance
    consent_given BOOLEAN DEFAULT TRUE,
    data_retention_expiry DATE,
    anonymized_data JSONB, -- For research purposes

    -- Moderation
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderated_by UUID,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user feedback
CREATE INDEX IF NOT EXISTS idx_user_feedback_alternative ON user_feedback (medication_alternative_id) WHERE is_active = TRUE AND moderation_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback (user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_feedback_ratings ON user_feedback (effectiveness_rating, safety_rating) WHERE is_active = TRUE AND moderation_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_user_feedback_moderation ON user_feedback (moderation_status, created_at) WHERE is_active = TRUE;

-- ============================================================================
-- MEDICAL PROFESSIONAL VERIFICATION
-- ============================================================================

-- Medical professional profiles and credentials
CREATE TABLE IF NOT EXISTS medical_professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,

    -- Professional details
    license_number_hash VARCHAR(64), -- Hashed for privacy
    license_state VARCHAR(10),
    license_country VARCHAR(10) DEFAULT 'US',
    profession VARCHAR(50), -- MD, DO, PharmD, NP, PA, etc.
    specialty VARCHAR(100),
    board_certifications TEXT[],

    -- Institution affiliation
    institution_name VARCHAR(255),
    institution_type VARCHAR(50), -- Hospital, clinic, academic, etc.
    department VARCHAR(100),

    -- Verification status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_expiry DATE,
    verification_method VARCHAR(100),

    -- Credentials verification
    primary_source_verified BOOLEAN DEFAULT FALSE,
    license_verified BOOLEAN DEFAULT FALSE,
    education_verified BOOLEAN DEFAULT FALSE,

    -- Professional standing
    malpractice_history BOOLEAN DEFAULT FALSE,
    disciplinary_actions BOOLEAN DEFAULT FALSE,
    sanctions_imposed BOOLEAN DEFAULT FALSE,

    -- Activity tracking
    last_activity TIMESTAMP WITH TIME ZONE,
    contributions_count INTEGER DEFAULT 0,
    peer_reviews_count INTEGER DEFAULT 0,

    -- Notes
    verification_notes TEXT,
    admin_notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for medical professionals
CREATE INDEX IF NOT EXISTS idx_medical_professionals_user ON medical_professionals (user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medical_professionals_status ON medical_professionals (verification_status) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medical_professionals_specialty ON medical_professionals (specialty) WHERE is_active = TRUE AND verification_status = 'verified';

-- ============================================================================
-- PROFESSIONAL REVIEWS AND ENDORSEMENTS
-- ============================================================================

-- Professional reviews of medication-alternative pairs
CREATE TABLE IF NOT EXISTS professional_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES medical_professionals(id) ON DELETE CASCADE,
    medication_alternative_id UUID NOT NULL REFERENCES medication_alternatives(id) ON DELETE CASCADE,

    -- Review details
    recommendation VARCHAR(20) DEFAULT 'neutral' CHECK (recommendation IN ('strongly_recommend', 'recommend', 'neutral', 'caution', 'not_recommend')),
    evidence_assessment VARCHAR(20) CHECK (evidence_assessment IN ('strong', 'moderate', 'weak', 'insufficient')),
    clinical_experience_rating INTEGER CHECK (clinical_experience_rating >= 1 AND clinical_experience_rating <= 5),

    -- Clinical context
    appropriate_for JSONB, -- Patient populations
    contraindicated_for JSONB,
    monitoring_recommendations TEXT,
    dosing_recommendations TEXT,

    -- Professional opinion
    clinical_rationale TEXT NOT NULL,
    patient_counseling_notes TEXT,
    integration_with_conventional_care TEXT,

    -- Experience data
    patients_treated INTEGER,
    success_rate_observed DECIMAL(5,2),
    adverse_events_observed INTEGER DEFAULT 0,

    -- Review quality
    peer_reviewed BOOLEAN DEFAULT FALSE,
    peer_reviewer_id UUID REFERENCES medical_professionals(id),
    peer_review_date TIMESTAMP WITH TIME ZONE,
    peer_review_notes TEXT,

    -- Conflicts of interest
    conflicts_of_interest TEXT,
    financial_disclosures TEXT,

    -- Versioning
    version INTEGER DEFAULT 1,
    superseded_by UUID REFERENCES professional_reviews(id),

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(reviewer_id, medication_alternative_id, version)
);

-- Indexes for professional reviews
CREATE INDEX IF NOT EXISTS idx_professional_reviews_alternative ON professional_reviews (medication_alternative_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_professional_reviews_reviewer ON professional_reviews (reviewer_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_professional_reviews_recommendation ON professional_reviews (recommendation, evidence_assessment) WHERE is_active = TRUE;

-- ============================================================================
-- DATA VERSIONING AND CHANGE TRACKING
-- ============================================================================

-- Version history for all major entities
CREATE TABLE IF NOT EXISTS data_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- medications, natural_alternatives, etc.
    entity_id UUID NOT NULL,
    version_number INTEGER NOT NULL,

    -- Change details
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'approve', 'reject')),
    changed_fields JSONB, -- Which fields were modified
    old_values JSONB, -- Previous values
    new_values JSONB, -- New values

    -- Change metadata
    changed_by UUID NOT NULL,
    change_reason TEXT,
    change_description TEXT,

    -- Approval workflow
    requires_approval BOOLEAN DEFAULT TRUE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,

    -- Quality assurance
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    quality_score DECIMAL(3,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for data versions
CREATE INDEX IF NOT EXISTS idx_data_versions_entity ON data_versions (entity_type, entity_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_data_versions_user ON data_versions (changed_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_versions_approval ON data_versions (requires_approval, approved_at) WHERE approved_at IS NULL;

-- ============================================================================
-- APPROVAL WORKFLOW SYSTEM
-- ============================================================================

-- Pending approvals queue
CREATE TABLE IF NOT EXISTS pending_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    version_id UUID NOT NULL REFERENCES data_versions(id) ON DELETE CASCADE,

    -- Approval details
    approval_type VARCHAR(50) NOT NULL, -- content_review, medical_review, final_approval
    assigned_to UUID,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Workflow status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated')),
    assigned_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,

    -- Review process
    review_started_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    escalation_reason TEXT,

    -- Decision
    decision VARCHAR(20) CHECK (decision IN ('approve', 'reject', 'request_changes', 'escalate')),
    decision_reason TEXT,
    decision_at TIMESTAMP WITH TIME ZONE,
    decided_by UUID,

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pending approvals
CREATE INDEX IF NOT EXISTS idx_pending_approvals_assigned ON pending_approvals (assigned_to, status) WHERE status IN ('pending', 'in_review');
CREATE INDEX IF NOT EXISTS idx_pending_approvals_priority ON pending_approvals (priority, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pending_approvals_entity ON pending_approvals (entity_type, entity_id);

-- ============================================================================
-- DATA SOURCE MANAGEMENT
-- ============================================================================

-- External data sources for updates
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- API, database, manual, literature
    url VARCHAR(500),

    -- Source details
    description TEXT,
    data_types TEXT[], -- medications, interactions, studies, etc.
    update_frequency VARCHAR(50), -- daily, weekly, monthly, as_needed
    reliability_score DECIMAL(3,2), -- 0-1 reliability rating

    -- Access details
    requires_authentication BOOLEAN DEFAULT FALSE,
    api_key_required BOOLEAN DEFAULT FALSE,
    rate_limited BOOLEAN DEFAULT FALSE,
    rate_limit_details TEXT,

    -- Data quality
    data_format VARCHAR(50), -- JSON, XML, CSV, etc.
    validation_rules JSONB,
    error_handling JSONB,

    -- Status and monitoring
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    last_successful_sync TIMESTAMP WITH TIME ZONE,
    sync_errors INTEGER DEFAULT 0,
    consecutive_failures INTEGER DEFAULT 0,

    -- Configuration
    sync_configuration JSONB,
    transformation_rules JSONB,
    mapping_configuration JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DATA SYNC LOGS
-- ============================================================================

-- Track data synchronization activities
CREATE TABLE IF NOT EXISTS data_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,

    -- Sync details
    sync_type VARCHAR(50) NOT NULL, -- full, incremental, manual
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('started', 'in_progress', 'completed', 'failed', 'cancelled')),

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,

    -- Results
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Error handling
    error_message TEXT,
    error_details JSONB,
    warning_count INTEGER DEFAULT 0,
    warnings JSONB,

    -- Performance metrics
    processing_rate DECIMAL(10,2), -- Records per second
    memory_usage_mb INTEGER,

    -- Metadata
    triggered_by UUID, -- User who triggered sync
    trigger_reason VARCHAR(100),
    sync_configuration JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for data sync logs
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_source ON data_sync_logs (source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_status ON data_sync_logs (sync_status, started_at DESC);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_medications_compound_search
    ON medications (drug_class, therapeutic_category, is_active)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_alternatives_safety
    ON natural_alternatives (pregnancy_safety, breastfeeding_safety, pediatric_safety)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_med_alternatives_effectiveness_compound
    ON medication_alternatives (effectiveness_rating DESC, confidence_level, evidence_grade)
    WHERE is_active = TRUE;

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_studies_recent_rct
    ON clinical_studies (publication_date DESC)
    WHERE study_type = 'RCT' AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_feedback_high_satisfaction
    ON user_feedback (overall_satisfaction DESC, created_at DESC)
    WHERE overall_satisfaction >= 4 AND moderation_status = 'approved';

-- ============================================================================
-- SEARCH VECTOR MAINTENANCE
-- ============================================================================

-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
    -- Update medications search vector
    IF TG_TABLE_NAME = 'medications' THEN
        NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.generic_name, '')), 'A') ||
            setweight(to_tsvector('english', array_to_string(NEW.brand_names, ' ')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.drug_class, '')), 'C') ||
            setweight(to_tsvector('english', array_to_string(NEW.common_uses, ' ')), 'D');
    END IF;

    -- Update natural alternatives search vector
    IF TG_TABLE_NAME = 'natural_alternatives' THEN
        NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.scientific_name, '')), 'A') ||
            setweight(to_tsvector('english', array_to_string(NEW.common_names, ' ')), 'B') ||
            setweight(to_tsvector('english', array_to_string(NEW.therapeutic_uses, ' ')), 'C') ||
            setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for search vector updates
CREATE TRIGGER medications_search_vector_update
    BEFORE INSERT OR UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vectors();

CREATE TRIGGER natural_alternatives_search_vector_update
    BEFORE INSERT OR UPDATE ON natural_alternatives
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vectors();

-- ============================================================================
-- DATA INTEGRITY TRIGGERS
-- ============================================================================

-- Function to track data changes
CREATE OR REPLACE FUNCTION track_data_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_type VARCHAR(20);
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Determine change type
    IF TG_OP = 'INSERT' THEN
        change_type := 'create';
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        change_type := 'update';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        change_type := 'delete';
        old_data := to_jsonb(OLD);
        new_data := NULL;
    END IF;

    -- Insert version record
    INSERT INTO data_versions (
        entity_type,
        entity_id,
        version_number,
        change_type,
        old_values,
        new_values,
        changed_by
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.version, OLD.version, 1),
        change_type,
        old_data,
        new_data,
        COALESCE(NEW.updated_by, OLD.updated_by, auth.uid())
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply change tracking to key tables
CREATE TRIGGER medications_change_tracking
    AFTER INSERT OR UPDATE OR DELETE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION track_data_changes();

CREATE TRIGGER natural_alternatives_change_tracking
    AFTER INSERT OR UPDATE OR DELETE ON natural_alternatives
    FOR EACH ROW
    EXECUTE FUNCTION track_data_changes();

CREATE TRIGGER medication_alternatives_change_tracking
    AFTER INSERT OR UPDATE OR DELETE ON medication_alternatives
    FOR EACH ROW
    EXECUTE FUNCTION track_data_changes();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE natural_alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for core medical data
CREATE POLICY "Public read access to active medications"
    ON medications FOR SELECT
    USING (is_active = TRUE AND status = 'active');

CREATE POLICY "Public read access to active alternatives"
    ON natural_alternatives FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public read access to approved medication alternatives"
    ON medication_alternatives FOR SELECT
    USING (is_active = TRUE AND approved_at IS NOT NULL);

CREATE POLICY "Public read access to published studies"
    ON clinical_studies FOR SELECT
    USING (is_active = TRUE AND peer_reviewed = TRUE AND retracted = FALSE);

-- User-specific policies for feedback
CREATE POLICY "Users can manage their own feedback"
    ON user_feedback FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Public read access to approved feedback"
    ON user_feedback FOR SELECT
    USING (moderation_status = 'approved' AND is_active = TRUE);

-- Professional-specific policies
CREATE POLICY "Professionals can manage their own profile"
    ON medical_professionals FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Professionals can manage their own reviews"
    ON professional_reviews FOR ALL
    USING (auth.uid() = (SELECT user_id FROM medical_professionals WHERE id = reviewer_id));

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to search medications and alternatives
CREATE OR REPLACE FUNCTION search_medications_and_alternatives(
    search_term TEXT,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    (
        SELECT
            m.id,
            m.name::TEXT,
            'medication'::TEXT as type,
            ts_rank(m.search_vector, plainto_tsquery('english', search_term)) as rank
        FROM medications m
        WHERE m.search_vector @@ plainto_tsquery('english', search_term)
          AND m.is_active = TRUE
          AND m.status = 'active'

        UNION ALL

        SELECT
            na.id,
            na.name::TEXT,
            'alternative'::TEXT as type,
            ts_rank(na.search_vector, plainto_tsquery('english', search_term)) as rank
        FROM natural_alternatives na
        WHERE na.search_vector @@ plainto_tsquery('english', search_term)
          AND na.is_active = TRUE
    )
    ORDER BY rank DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get effectiveness summary for an alternative
CREATE OR REPLACE FUNCTION get_effectiveness_summary(alternative_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    avg_effectiveness DECIMAL(3,2);
    study_count INTEGER;
    rct_count INTEGER;
    user_rating DECIMAL(3,2);
    professional_endorsements INTEGER;
BEGIN
    -- Get average effectiveness from medication alternatives
    SELECT AVG(effectiveness_rating), COUNT(*)
    INTO avg_effectiveness, study_count
    FROM medication_alternatives
    WHERE alternative_id = get_effectiveness_summary.alternative_id
      AND is_active = TRUE;

    -- Get RCT count
    SELECT COUNT(DISTINCT cs.id)
    INTO rct_count
    FROM clinical_studies cs
    JOIN study_evidence se ON cs.id = se.study_id
    WHERE se.alternative_id = get_effectiveness_summary.alternative_id
      AND cs.study_type = 'RCT'
      AND cs.is_active = TRUE;

    -- Get user ratings
    SELECT AVG(effectiveness_rating)
    INTO user_rating
    FROM user_feedback uf
    JOIN medication_alternatives ma ON uf.medication_alternative_id = ma.id
    WHERE ma.alternative_id = get_effectiveness_summary.alternative_id
      AND uf.moderation_status = 'approved';

    -- Get professional endorsements
    SELECT COUNT(*)
    INTO professional_endorsements
    FROM professional_reviews pr
    JOIN medication_alternatives ma ON pr.medication_alternative_id = ma.id
    WHERE ma.alternative_id = get_effectiveness_summary.alternative_id
      AND pr.recommendation IN ('recommend', 'strongly_recommend')
      AND pr.is_active = TRUE;

    -- Build result JSON
    result := jsonb_build_object(
        'average_effectiveness', COALESCE(avg_effectiveness, 0),
        'clinical_studies', COALESCE(study_count, 0),
        'randomized_trials', COALESCE(rct_count, 0),
        'user_rating', COALESCE(user_rating, 0),
        'professional_endorsements', COALESCE(professional_endorsements, 0)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON user_feedback TO authenticated;
GRANT ALL ON medical_professionals TO authenticated;
GRANT ALL ON professional_reviews TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION search_medications_and_alternatives TO authenticated;
GRANT EXECUTE ON FUNCTION get_effectiveness_summary TO authenticated;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE medications IS 'Master table for medications with RxCUI codes and comprehensive drug information';
COMMENT ON TABLE natural_alternatives IS 'Natural alternatives with scientific evidence and safety profiles';
COMMENT ON TABLE medication_alternatives IS 'Mappings between medications and natural alternatives with effectiveness ratings';
COMMENT ON TABLE clinical_studies IS 'Clinical studies and research supporting natural alternatives';
COMMENT ON TABLE study_evidence IS 'Links between studies and specific medication-alternative pairs';
COMMENT ON TABLE user_feedback IS 'Real-world user feedback on natural alternatives';
COMMENT ON TABLE medical_professionals IS 'Verified medical professional profiles and credentials';
COMMENT ON TABLE professional_reviews IS 'Professional reviews and endorsements from verified healthcare providers';
COMMENT ON TABLE data_versions IS 'Version control and change tracking for all medical data';
COMMENT ON TABLE pending_approvals IS 'Approval workflow queue for data changes';
COMMENT ON TABLE data_sources IS 'External data sources for automated updates';
COMMENT ON TABLE data_sync_logs IS 'Logs of data synchronization activities';

COMMENT ON COLUMN medications.rxcui IS 'RxNorm Concept Unique Identifier for standardized drug identification';
COMMENT ON COLUMN natural_alternatives.evidence_level IS 'Level of scientific evidence supporting the alternative';
COMMENT ON COLUMN medication_alternatives.effectiveness_rating IS 'Effectiveness rating from 0-1 based on clinical evidence';
COMMENT ON COLUMN clinical_studies.jadad_score IS 'Quality score for randomized controlled trials (1-5 scale)';
COMMENT ON COLUMN user_feedback.anonymized_data IS 'Anonymized feedback data for research purposes';
COMMENT ON COLUMN medical_professionals.license_number_hash IS 'SHA-256 hashed medical license number for privacy';