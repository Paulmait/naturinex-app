-- =============================================================================
-- NaturineX Enterprise B2B Database Schema
-- =============================================================================

-- Organizations Table (Main tenant management)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL, -- e.g., "acme-corp"
    email_domain VARCHAR(255), -- e.g., "@acme.com" for SSO
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, cancelled
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Billing information
    billing_email VARCHAR(255),
    billing_address JSONB,
    tax_id VARCHAR(100),
    -- Enterprise features
    max_users INTEGER DEFAULT 50,
    features JSONB DEFAULT '{}', -- enabled features per organization
    custom_branding JSONB DEFAULT '{}', -- logo, colors, etc.
    api_quota_monthly INTEGER DEFAULT 10000,
    support_tier VARCHAR(50) DEFAULT 'standard' -- standard, priority, dedicated
);

-- Organization Users (Many-to-many relationship)
CREATE TABLE organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- References existing users table
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- admin, manager, member, viewer
    permissions JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, invited
    invited_by UUID REFERENCES organization_users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Enterprise Billing & Subscriptions
CREATE TABLE enterprise_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id VARCHAR(255), -- Stripe subscription ID
    customer_id VARCHAR(255), -- Stripe customer ID
    plan_id VARCHAR(255) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    seats_included INTEGER NOT NULL DEFAULT 50,
    additional_seats INTEGER DEFAULT 0,
    monthly_fee DECIMAL(10,2) NOT NULL,
    per_seat_fee DECIMAL(10,2) DEFAULT 0,
    api_quota_monthly INTEGER NOT NULL DEFAULT 10000,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, annual
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise Invoices
CREATE TABLE enterprise_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    billing_id UUID NOT NULL REFERENCES enterprise_billing(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    stripe_invoice_id VARCHAR(255),
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, open, paid, void, uncollectible
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_url TEXT,
    pdf_url TEXT,
    line_items JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys Management
CREATE TABLE enterprise_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed API key
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification
    permissions JSONB DEFAULT '{}', -- API permissions
    rate_limit_per_minute INTEGER DEFAULT 100,
    rate_limit_per_hour INTEGER DEFAULT 5000,
    rate_limit_per_day INTEGER DEFAULT 50000,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip INET,
    status VARCHAR(50) DEFAULT 'active', -- active, revoked, expired
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES organization_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Analytics & Tracking
CREATE TABLE enterprise_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255), -- Optional: specific user
    api_key_id UUID REFERENCES enterprise_api_keys(id),
    metric_type VARCHAR(100) NOT NULL, -- api_call, scan, analysis, export, etc.
    metric_category VARCHAR(100), -- medical_scan, drug_interaction, natural_alternatives
    endpoint VARCHAR(255),
    method VARCHAR(10),
    response_status INTEGER,
    response_time_ms INTEGER,
    data_processed_mb DECIMAL(10,3),
    cost_credits DECIMAL(10,6), -- Internal cost tracking
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE GENERATED ALWAYS AS (timestamp::DATE) STORED -- For efficient daily aggregation
);

-- Usage Summaries (Aggregated data for faster reporting)
CREATE TABLE enterprise_usage_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_api_calls INTEGER DEFAULT 0,
    total_scans INTEGER DEFAULT 0,
    total_analyses INTEGER DEFAULT 0,
    total_exports INTEGER DEFAULT 0,
    total_data_processed_mb DECIMAL(12,3) DEFAULT 0,
    total_cost_credits DECIMAL(12,6) DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    peak_concurrent_users INTEGER DEFAULT 0,
    metrics_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, period_type, period_start)
);

-- White Label Configuration
CREATE TABLE enterprise_white_label (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    -- Branding
    company_name VARCHAR(255),
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7), -- Hex color
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    background_color VARCHAR(7),
    text_color VARCHAR(7),
    -- Custom domain
    custom_domain VARCHAR(255),
    ssl_certificate_id VARCHAR(255),
    -- App customization
    app_name VARCHAR(100),
    app_tagline VARCHAR(255),
    app_description TEXT,
    welcome_message TEXT,
    support_email VARCHAR(255),
    support_url TEXT,
    terms_url TEXT,
    privacy_url TEXT,
    -- Features visibility
    hide_naturinex_branding BOOLEAN DEFAULT FALSE,
    custom_footer TEXT,
    custom_css TEXT,
    -- Mobile app customization
    ios_bundle_id VARCHAR(255),
    android_package_name VARCHAR(255),
    app_store_url TEXT,
    play_store_url TEXT,
    -- Configuration
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending, active
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise Integrations (EMR, Insurance, etc.)
CREATE TABLE enterprise_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_type VARCHAR(100) NOT NULL, -- emr, insurance, pharmacy, lab
    provider VARCHAR(100) NOT NULL, -- epic, cerner, allscripts, etc.
    name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    credentials_encrypted TEXT, -- Encrypted connection credentials
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    status VARCHAR(50) DEFAULT 'inactive', -- inactive, configuring, active, error
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    sync_frequency VARCHAR(50) DEFAULT 'real_time', -- real_time, hourly, daily
    data_mapping JSONB DEFAULT '{}', -- Field mappings
    created_by UUID REFERENCES organization_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise Support Tickets
CREATE TABLE enterprise_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES organization_users(id),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    category VARCHAR(100), -- technical, billing, feature_request, bug_report
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, waiting_customer, resolved, closed
    assigned_to VARCHAR(255), -- Support agent
    resolution TEXT,
    sla_response_due TIMESTAMP WITH TIME ZONE,
    sla_resolution_due TIMESTAMP WITH TIME ZONE,
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise Audit Log
CREATE TABLE enterprise_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255), -- Who performed the action
    action VARCHAR(100) NOT NULL, -- login, logout, create_user, delete_user, etc.
    resource_type VARCHAR(100), -- user, api_key, integration, billing
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Wellness Programs
CREATE TABLE enterprise_wellness_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_type VARCHAR(100), -- health_screening, fitness_challenge, nutrition, mental_health
    start_date DATE,
    end_date DATE,
    enrollment_deadline DATE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    rewards JSONB DEFAULT '{}', -- Incentives and rewards
    requirements JSONB DEFAULT '{}', -- Participation requirements
    metrics_tracked JSONB DEFAULT '[]', -- What health metrics to track
    privacy_level VARCHAR(50) DEFAULT 'aggregate', -- individual, aggregate, anonymous
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
    created_by UUID REFERENCES organization_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Wellness Participation
CREATE TABLE enterprise_wellness_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES enterprise_wellness_programs(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Employee user ID
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_status VARCHAR(50) DEFAULT 'enrolled', -- enrolled, active, completed, dropped
    progress_data JSONB DEFAULT '{}',
    achievements JSONB DEFAULT '[]',
    rewards_earned JSONB DEFAULT '[]',
    privacy_consent BOOLEAN DEFAULT FALSE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(program_id, user_id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Organizations indexes
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_subscription_tier ON organizations(subscription_tier);

-- Organization users indexes
CREATE INDEX idx_org_users_org_id ON organization_users(organization_id);
CREATE INDEX idx_org_users_user_id ON organization_users(user_id);
CREATE INDEX idx_org_users_role ON organization_users(role);
CREATE INDEX idx_org_users_status ON organization_users(status);

-- Billing indexes
CREATE INDEX idx_enterprise_billing_org_id ON enterprise_billing(organization_id);
CREATE INDEX idx_enterprise_billing_status ON enterprise_billing(status);
CREATE INDEX idx_enterprise_billing_customer_id ON enterprise_billing(customer_id);

-- Invoice indexes
CREATE INDEX idx_enterprise_invoices_org_id ON enterprise_invoices(organization_id);
CREATE INDEX idx_enterprise_invoices_status ON enterprise_invoices(status);
CREATE INDEX idx_enterprise_invoices_due_date ON enterprise_invoices(due_date);

-- API keys indexes
CREATE INDEX idx_api_keys_org_id ON enterprise_api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON enterprise_api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON enterprise_api_keys(status);

-- Analytics indexes (critical for performance)
CREATE INDEX idx_usage_analytics_org_id ON enterprise_usage_analytics(organization_id);
CREATE INDEX idx_usage_analytics_timestamp ON enterprise_usage_analytics(timestamp);
CREATE INDEX idx_usage_analytics_date ON enterprise_usage_analytics(date);
CREATE INDEX idx_usage_analytics_metric_type ON enterprise_usage_analytics(metric_type);
CREATE INDEX idx_usage_analytics_org_date ON enterprise_usage_analytics(organization_id, date);

-- Usage summaries indexes
CREATE INDEX idx_usage_summaries_org_period ON enterprise_usage_summaries(organization_id, period_type, period_start);

-- Audit log indexes
CREATE INDEX idx_audit_log_org_id ON enterprise_audit_log(organization_id);
CREATE INDEX idx_audit_log_timestamp ON enterprise_audit_log(timestamp);
CREATE INDEX idx_audit_log_user_id ON enterprise_audit_log(user_id);
CREATE INDEX idx_audit_log_action ON enterprise_audit_log(action);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all enterprise tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_usage_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_white_label ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_wellness_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_wellness_participation ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_users_updated_at BEFORE UPDATE ON organization_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_billing_updated_at BEFORE UPDATE ON enterprise_billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_invoices_updated_at BEFORE UPDATE ON enterprise_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_api_keys_updated_at BEFORE UPDATE ON enterprise_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_white_label_updated_at BEFORE UPDATE ON enterprise_white_label
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_integrations_updated_at BEFORE UPDATE ON enterprise_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_support_tickets_updated_at BEFORE UPDATE ON enterprise_support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_wellness_programs_updated_at BEFORE UPDATE ON enterprise_wellness_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part VARCHAR(10);
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;
    sequence_part := LPAD(nextval('invoice_number_seq')::VARCHAR, 6, '0');
    NEW.invoice_number := 'INV-' || year_part || '-' || sequence_part;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Apply invoice number trigger
CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON enterprise_invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Function to auto-generate support ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    org_prefix VARCHAR(10);
    sequence_part VARCHAR(10);
BEGIN
    SELECT UPPER(LEFT(domain, 3)) INTO org_prefix FROM organizations WHERE id = NEW.organization_id;
    sequence_part := LPAD(nextval('ticket_number_seq')::VARCHAR, 6, '0');
    NEW.ticket_number := org_prefix || '-' || sequence_part;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Apply ticket number trigger
CREATE TRIGGER generate_ticket_number_trigger BEFORE INSERT ON enterprise_support_tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Organization dashboard view
CREATE VIEW enterprise_organization_dashboard AS
SELECT
    o.id,
    o.name,
    o.domain,
    o.subscription_tier,
    o.status,
    o.max_users,
    COUNT(DISTINCT ou.user_id) as active_users,
    eb.plan_name,
    eb.monthly_fee,
    eb.current_period_end,
    COALESCE(um.monthly_api_calls, 0) as monthly_api_calls,
    COALESCE(um.monthly_scans, 0) as monthly_scans,
    o.created_at
FROM organizations o
LEFT JOIN organization_users ou ON o.id = ou.organization_id AND ou.status = 'active'
LEFT JOIN enterprise_billing eb ON o.id = eb.organization_id AND eb.status = 'active'
LEFT JOIN (
    SELECT
        organization_id,
        SUM(total_api_calls) as monthly_api_calls,
        SUM(total_scans) as monthly_scans
    FROM enterprise_usage_summaries
    WHERE period_type = 'monthly'
    AND period_start >= DATE_TRUNC('month', NOW())
    GROUP BY organization_id
) um ON o.id = um.organization_id
GROUP BY o.id, o.name, o.domain, o.subscription_tier, o.status, o.max_users,
         eb.plan_name, eb.monthly_fee, eb.current_period_end,
         um.monthly_api_calls, um.monthly_scans, o.created_at;

-- =============================================================================
-- SAMPLE DATA FOR DEVELOPMENT/TESTING
-- =============================================================================

-- Sample organization
INSERT INTO organizations (name, domain, email_domain, subscription_tier, billing_email, max_users, api_quota_monthly)
VALUES
('Acme Healthcare Corp', 'acme-healthcare', '@acme.com', 'enterprise', 'billing@acme.com', 500, 100000),
('TechMed Solutions', 'techmed', '@techmed.com', 'professional', 'finance@techmed.com', 100, 50000);

-- Note: Additional sample data can be added for development and testing purposes