-- Telemedicine Database Schema for NaturineX
-- Comprehensive schema for telemedicine functionality including providers, appointments, consultations, messages, and prescriptions

-- Create telemedicine-specific tables
-- Note: This assumes basic user and authentication tables already exist

-- Healthcare Providers Table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL DEFAULT 'doctor', -- doctor, nurse_practitioner, physician_assistant, therapist
    license_number VARCHAR(100) NOT NULL,
    license_state VARCHAR(10) NOT NULL,
    license_expiry_date DATE NOT NULL,

    -- Personal Information (encrypted)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,

    -- Professional Information
    specialties TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of specialties
    education JSONB DEFAULT '[]'::JSONB, -- Array of education details
    certifications JSONB DEFAULT '[]'::JSONB, -- Array of certifications
    experience_years INTEGER DEFAULT 0,
    languages TEXT[] DEFAULT ARRAY['English']::TEXT[],

    -- Practice Information
    practice_name VARCHAR(200),
    practice_address JSONB, -- Full address object
    practice_phone VARCHAR(20),

    -- Telemedicine Settings
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    video_consultation_enabled BOOLEAN DEFAULT true,
    phone_consultation_enabled BOOLEAN DEFAULT false,
    messaging_enabled BOOLEAN DEFAULT true,

    -- Availability and Scheduling
    timezone VARCHAR(50) DEFAULT 'UTC',
    booking_advance_days INTEGER DEFAULT 30, -- How far in advance patients can book
    booking_buffer_minutes INTEGER DEFAULT 15, -- Buffer between appointments
    auto_confirm_appointments BOOLEAN DEFAULT false,

    -- Verification and Status
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, suspended, rejected
    verification_documents JSONB DEFAULT '{}'::JSONB,
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),

    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    is_accepting_new_patients BOOLEAN DEFAULT true,

    -- Platform Statistics
    total_consultations INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT providers_license_unique UNIQUE (license_number, license_state)
);

-- Provider Availability Schedule
CREATE TABLE IF NOT EXISTS provider_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,

    -- Recurring Schedule (weekly pattern)
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,

    -- Time slots configuration
    slot_duration_minutes INTEGER DEFAULT 30,
    break_duration_minutes INTEGER DEFAULT 5,

    -- Date range for this schedule
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,

    -- Override for specific dates
    date_override DATE, -- If set, this overrides the weekly pattern for this specific date
    override_available BOOLEAN DEFAULT true,
    override_start_time TIME,
    override_end_time TIME,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(provider_id, day_of_week, date_override)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,

    -- Scheduling Information
    scheduled_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    timezone VARCHAR(50) NOT NULL,

    -- Appointment Details
    consultation_type VARCHAR(20) NOT NULL DEFAULT 'video', -- video, phone, in_person
    reason TEXT NOT NULL,
    symptoms TEXT,
    urgency_level VARCHAR(20) DEFAULT 'routine', -- routine, urgent, emergency

    -- Patient Information for this appointment
    patient_notes JSONB DEFAULT '{}'::JSONB, -- allergies, medications, previous_treatment, etc.

    -- Status and Workflow
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,

    -- Cancellation/Rescheduling
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,

    reschedule_count INTEGER DEFAULT 0,
    original_datetime TIMESTAMP WITH TIME ZONE, -- For tracking rescheduling
    reschedule_reason TEXT,

    -- Financial
    consultation_fee DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded, failed
    payment_intent_id VARCHAR(100), -- Stripe payment intent ID

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultations Table (Records of actual consultations)
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,

    -- Consultation Session Details
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,

    -- Consultation Type and Method
    consultation_type VARCHAR(20) NOT NULL, -- video, phone, messaging
    platform_used VARCHAR(50), -- webrtc, zoom, phone, etc.

    -- Medical Information
    chief_complaint TEXT,
    present_illness TEXT,
    vital_signs JSONB DEFAULT '{}'::JSONB, -- blood_pressure, heart_rate, temperature, etc.
    physical_examination TEXT,
    assessment TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,

    -- Provider Notes
    consultation_notes TEXT,
    differential_diagnosis TEXT,
    clinical_impression TEXT,

    -- Technical Details
    recording_url TEXT, -- URL to consultation recording (if enabled and allowed)
    recording_duration_seconds INTEGER,
    recording_size_bytes BIGINT,

    -- Call Quality Metrics
    connection_quality VARCHAR(20), -- excellent, good, fair, poor
    audio_quality VARCHAR(20),
    video_quality VARCHAR(20),
    technical_issues TEXT,

    -- Follow-up and Referrals
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_timeframe VARCHAR(50), -- '1 week', '1 month', etc.
    referrals JSONB DEFAULT '[]'::JSONB, -- Array of referral details

    -- Status
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, interrupted, cancelled
    completion_reason VARCHAR(50), -- completed, patient_left, provider_left, technical_issue

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table (Secure messaging between patients and providers)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL, -- Optional link to appointment
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL, -- Optional link to consultation

    -- Message Content (encrypted)
    message_content_encrypted TEXT NOT NULL, -- Encrypted message content
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, document, voice

    -- File Attachments
    attachment_url TEXT,
    attachment_filename VARCHAR(255),
    attachment_size_bytes BIGINT,
    attachment_mime_type VARCHAR(100),

    -- Message Status
    delivery_status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read, failed
    read_at TIMESTAMP WITH TIME ZONE,

    -- Priority and Urgency
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMP WITH TIME ZONE,

    -- Threading (for organizing conversations)
    thread_id UUID, -- Groups related messages
    reply_to_message_id UUID REFERENCES messages(id),

    -- Auto-generated messages
    is_automated BOOLEAN DEFAULT false,
    automation_trigger VARCHAR(50), -- appointment_reminder, follow_up, etc.

    -- Encryption details
    encryption_key_id VARCHAR(100), -- Reference to encryption key used

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Prescription Header Information
    prescription_date DATE DEFAULT CURRENT_DATE,
    prescription_number VARCHAR(50) UNIQUE, -- Generated prescription number

    -- Patient Information (snapshot at time of prescription)
    patient_name VARCHAR(200) NOT NULL,
    patient_dob DATE NOT NULL,
    patient_address JSONB,

    -- Provider Information (snapshot)
    provider_name VARCHAR(200) NOT NULL,
    provider_license VARCHAR(100) NOT NULL,
    provider_npi VARCHAR(20), -- National Provider Identifier

    -- Prescription Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, filled, cancelled, expired

    -- Digital Signature and Security
    digital_signature TEXT, -- Encrypted digital signature
    verification_code VARCHAR(20), -- For pharmacy verification

    -- E-Prescribing
    sent_to_pharmacy_at TIMESTAMP WITH TIME ZONE,
    pharmacy_id VARCHAR(100), -- Pharmacy identifier
    pharmacy_name VARCHAR(200),
    pharmacy_address JSONB,

    -- Metadata
    notes TEXT, -- Special instructions or notes
    diagnosis_codes TEXT[], -- ICD-10 codes

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescription Items (Individual medications)
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,

    -- Medication Information
    medication_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    ndc_code VARCHAR(20), -- National Drug Code

    -- Dosage and Administration
    strength VARCHAR(50) NOT NULL, -- e.g., "500mg", "10mg/5ml"
    dosage_form VARCHAR(50) NOT NULL, -- tablet, capsule, liquid, cream, etc.
    quantity VARCHAR(50) NOT NULL, -- e.g., "30 tablets", "100ml"

    -- Directions for Use
    directions_for_use TEXT NOT NULL, -- "Take 1 tablet twice daily with food"
    route_of_administration VARCHAR(50), -- oral, topical, injection, etc.
    frequency VARCHAR(100), -- "twice daily", "every 6 hours", etc.
    duration VARCHAR(100), -- "for 10 days", "until finished", etc.

    -- Refills and Supply
    refills_authorized INTEGER DEFAULT 0,
    refills_remaining INTEGER DEFAULT 0,
    days_supply INTEGER,

    -- Substitution and Safety
    generic_substitution_allowed BOOLEAN DEFAULT true,
    brand_medically_necessary BOOLEAN DEFAULT false,

    -- Special Instructions
    special_instructions TEXT,
    warnings TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, discontinued, completed

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultation Ratings and Reviews
CREATE TABLE IF NOT EXISTS consultation_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,

    -- Rating (1-5 scale)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),

    -- Detailed Ratings
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    knowledge_rating INTEGER CHECK (knowledge_rating >= 1 AND knowledge_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    technology_rating INTEGER CHECK (technology_rating >= 1 AND technology_rating <= 5),

    -- Written Review
    review_text TEXT,
    review_title VARCHAR(200),

    -- Review Metadata
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT true, -- Verified as actual patient
    is_published BOOLEAN DEFAULT true,

    -- Helpful votes from other users
    helpful_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,

    -- Moderation
    is_flagged BOOLEAN DEFAULT false,
    moderation_status VARCHAR(20) DEFAULT 'approved', -- pending, approved, rejected
    moderation_notes TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one rating per consultation per patient
    UNIQUE(consultation_id, patient_id)
);

-- WebRTC Signaling for Video Calls
CREATE TABLE IF NOT EXISTS consultation_signaling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,

    -- Signaling Data
    signal_type VARCHAR(20) NOT NULL, -- offer, answer, ice-candidate
    signal_data JSONB NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- patient, provider

    -- Session Management
    session_id VARCHAR(100),
    sequence_number INTEGER DEFAULT 0,

    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Cleanup old signaling data
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Provider Billing and Financial Records
CREATE TABLE IF NOT EXISTS provider_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,

    -- Billing Period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,

    -- Financial Details
    consultation_fee DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL, -- NaturineX platform fee
    payment_processing_fee DECIMAL(10,2) DEFAULT 0.00,
    provider_payout DECIMAL(10,2) NOT NULL, -- Amount paid to provider

    -- Tax Information
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,

    -- Payment Status
    payout_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, paid, failed
    payout_date DATE,
    payout_reference VARCHAR(100), -- Bank transfer reference

    -- Accounting
    invoice_number VARCHAR(50),
    invoice_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Trail for HIPAA Compliance
CREATE TABLE IF NOT EXISTS telemedicine_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User and Entity Information
    user_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES providers(id),

    -- Action Details
    action VARCHAR(100) NOT NULL, -- login, view_record, send_message, prescribe, etc.
    entity_type VARCHAR(50) NOT NULL, -- appointment, consultation, message, prescription
    entity_id UUID,

    -- Request Details
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),

    -- Data Access
    data_accessed JSONB, -- What specific data was accessed
    data_modified JSONB, -- What data was changed (before/after)

    -- Result
    success BOOLEAN NOT NULL,
    error_message TEXT,

    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Retention (keep audit logs for required compliance period)
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '7 years')
);

-- Indexes for Performance

-- Providers
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_specialties ON providers USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_providers_location ON providers USING GIN((practice_address));
CREATE INDEX IF NOT EXISTS idx_providers_active_available ON providers(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_providers_verification_status ON providers(verification_status);

-- Provider Availability
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_day ON provider_availability(provider_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_provider_availability_date_override ON provider_availability(provider_id, date_override) WHERE date_override IS NOT NULL;

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_datetime ON appointments(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_datetime ON appointments(patient_id, scheduled_datetime DESC);

-- Consultations
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_provider ON consultations(patient_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_consultations_start_time ON consultations(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_timestamp ON messages(receiver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON messages(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON messages(delivery_status);

-- Prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_provider_patient ON prescriptions(provider_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_date ON prescriptions(patient_id, prescription_date DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Prescription Items
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication_name ON prescription_items(medication_name);

-- Ratings
CREATE INDEX IF NOT EXISTS idx_consultation_ratings_provider ON consultation_ratings(provider_id, overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_ratings_consultation ON consultation_ratings(consultation_id);

-- Signaling
CREATE INDEX IF NOT EXISTS idx_consultation_signaling_consultation ON consultation_signaling(consultation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_consultation_signaling_expires ON consultation_signaling(expires_at);

-- Billing
CREATE INDEX IF NOT EXISTS idx_provider_billing_provider_period ON provider_billing(provider_id, billing_period_start DESC);
CREATE INDEX IF NOT EXISTS idx_provider_billing_payout_status ON provider_billing(payout_status);

-- Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_timestamp ON telemedicine_audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON telemedicine_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_patient_id ON telemedicine_audit_log(patient_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_retention ON telemedicine_audit_log(retention_until);

-- Triggers for Updated Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_availability_updated_at BEFORE UPDATE ON provider_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescription_items_updated_at BEFORE UPDATE ON prescription_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultation_ratings_updated_at BEFORE UPDATE ON consultation_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_billing_updated_at BEFORE UPDATE ON provider_billing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_ratings ENABLE ROW LEVEL SECURITY;

-- Providers can only see their own data
CREATE POLICY providers_own_data ON providers
    FOR ALL USING (user_id = auth.uid());

-- Patients can see provider public information
CREATE POLICY providers_public_info ON providers
    FOR SELECT USING (is_active = true AND verification_status = 'verified');

-- Provider availability - providers manage their own, patients can view verified providers
CREATE POLICY provider_availability_own ON provider_availability
    FOR ALL USING (
        provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    );

CREATE POLICY provider_availability_public ON provider_availability
    FOR SELECT USING (
        provider_id IN (SELECT id FROM providers WHERE is_active = true AND verification_status = 'verified')
    );

-- Appointments - patients and providers can see their own appointments
CREATE POLICY appointments_patient_access ON appointments
    FOR ALL USING (patient_id = auth.uid());

CREATE POLICY appointments_provider_access ON appointments
    FOR ALL USING (
        provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    );

-- Consultations - same as appointments
CREATE POLICY consultations_patient_access ON consultations
    FOR ALL USING (patient_id = auth.uid());

CREATE POLICY consultations_provider_access ON consultations
    FOR ALL USING (
        provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    );

-- Messages - only sender and receiver can access
CREATE POLICY messages_participant_access ON messages
    FOR ALL USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Prescriptions - patient and prescribing provider can access
CREATE POLICY prescriptions_patient_access ON prescriptions
    FOR ALL USING (patient_id = auth.uid());

CREATE POLICY prescriptions_provider_access ON prescriptions
    FOR ALL USING (
        provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    );

-- Prescription items - same as prescriptions
CREATE POLICY prescription_items_patient_access ON prescription_items
    FOR ALL USING (
        prescription_id IN (SELECT id FROM prescriptions WHERE patient_id = auth.uid())
    );

CREATE POLICY prescription_items_provider_access ON prescription_items
    FOR ALL USING (
        prescription_id IN (
            SELECT p.id FROM prescriptions p
            JOIN providers pr ON p.provider_id = pr.id
            WHERE pr.user_id = auth.uid()
        )
    );

-- Ratings - patients can create/edit their own, everyone can read published ones
CREATE POLICY ratings_patient_own ON consultation_ratings
    FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY ratings_patient_edit ON consultation_ratings
    FOR UPDATE USING (patient_id = auth.uid());

CREATE POLICY ratings_public_read ON consultation_ratings
    FOR SELECT USING (is_published = true);

-- Cleanup Function for Old Data
CREATE OR REPLACE FUNCTION cleanup_telemedicine_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired signaling data
    DELETE FROM consultation_signaling WHERE expires_at < NOW();

    -- Clean up old audit logs (keep for compliance period)
    DELETE FROM telemedicine_audit_log WHERE retention_until < CURRENT_DATE;

    -- Archive old consultations (optional - move to archive table instead of delete)
    -- This would depend on business requirements and compliance needs
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (to be run by a cron job or scheduled function)
-- This would typically be set up in the application or database scheduler

-- Comments for documentation
COMMENT ON TABLE providers IS 'Healthcare providers registered for telemedicine services';
COMMENT ON TABLE provider_availability IS 'Provider availability schedules and time slots';
COMMENT ON TABLE appointments IS 'Scheduled telemedicine appointments between patients and providers';
COMMENT ON TABLE consultations IS 'Records of actual consultation sessions with medical notes';
COMMENT ON TABLE messages IS 'Secure messaging between patients and providers';
COMMENT ON TABLE prescriptions IS 'Digital prescriptions issued during consultations';
COMMENT ON TABLE prescription_items IS 'Individual medications within prescriptions';
COMMENT ON TABLE consultation_ratings IS 'Patient ratings and reviews for consultations';
COMMENT ON TABLE consultation_signaling IS 'WebRTC signaling data for video calls';
COMMENT ON TABLE provider_billing IS 'Billing and payout records for providers';
COMMENT ON TABLE telemedicine_audit_log IS 'Audit trail for HIPAA compliance and security monitoring';