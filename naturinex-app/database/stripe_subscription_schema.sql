-- Stripe Subscription Management Database Schema
-- Comprehensive schema for subscription lifecycle, billing, and webhook management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SUBSCRIPTION EVENTS TABLE
-- Tracks all subscription lifecycle events
-- =====================================================

CREATE TABLE subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    subscription_id VARCHAR(255),
    stripe_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Indexes for performance
    CONSTRAINT fk_subscription_events_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for subscription_events
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at DESC);
CREATE UNIQUE INDEX idx_subscription_events_stripe_unique ON subscription_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- =====================================================
-- PAYMENT METHODS TABLE
-- Stores user payment methods with PCI-compliant data
-- =====================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL DEFAULT 'card',

    -- Card details (PCI-safe, from Stripe)
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_country VARCHAR(2),
    card_funding VARCHAR(20),

    -- Status and metadata
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_payment_methods_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for payment_methods
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_payment_methods_active ON payment_methods(user_id, is_active) WHERE is_active = TRUE;

-- Ensure only one default payment method per user
CREATE UNIQUE INDEX idx_payment_methods_one_default
ON payment_methods(user_id)
WHERE is_default = TRUE AND deleted_at IS NULL;

-- =====================================================
-- INVOICES TABLE
-- Detailed invoice tracking from Stripe
-- =====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),

    -- Invoice details
    invoice_number VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    amount_paid INTEGER DEFAULT 0,
    amount_due INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Billing period
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,

    -- Payment details
    payment_intent_id VARCHAR(255),
    payment_method_id VARCHAR(255),
    collection_method VARCHAR(50) DEFAULT 'charge_automatically',

    -- URLs and files
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalized_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,

    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    line_items JSONB DEFAULT '[]',

    CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for invoices
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(stripe_subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_paid_at ON invoices(paid_at DESC) WHERE paid_at IS NOT NULL;

-- =====================================================
-- BILLING HISTORY TABLE
-- Comprehensive payment and billing transaction log
-- =====================================================

CREATE TABLE billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Transaction identifiers
    invoice_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    charge_id VARCHAR(255),
    transaction_id VARCHAR(255),

    -- Transaction details
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'payment', -- payment, refund, chargeback, etc.

    -- Billing period (if applicable)
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,

    -- Payment method used
    payment_method_type VARCHAR(50),
    payment_method_last4 VARCHAR(4),
    payment_method_brand VARCHAR(50),

    -- Failure information
    failure_code VARCHAR(100),
    failure_message TEXT,
    failure_type VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,

    -- Description and metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',

    CONSTRAINT fk_billing_history_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for billing_history
CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_billing_history_invoice_id ON billing_history(invoice_id);
CREATE INDEX idx_billing_history_status ON billing_history(status);
CREATE INDEX idx_billing_history_type ON billing_history(type);
CREATE INDEX idx_billing_history_created_at ON billing_history(created_at DESC);
CREATE INDEX idx_billing_history_paid_at ON billing_history(paid_at DESC) WHERE paid_at IS NOT NULL;

-- =====================================================
-- DUNNING ATTEMPTS TABLE
-- Tracks payment retry attempts and dunning management
-- =====================================================

CREATE TABLE dunning_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id VARCHAR(255) NOT NULL,
    invoice_id VARCHAR(255) NOT NULL,

    -- Attempt details
    attempt_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed

    -- Failure information
    failure_reason TEXT,
    failure_code VARCHAR(100),
    decline_code VARCHAR(100),

    -- Amount and currency
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',

    -- Retry scheduling
    next_retry_date TIMESTAMP WITH TIME ZONE,
    max_retries INTEGER DEFAULT 4,
    retry_interval_days INTEGER DEFAULT 3,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attempted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    CONSTRAINT fk_dunning_attempts_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for dunning_attempts
CREATE INDEX idx_dunning_attempts_user_id ON dunning_attempts(user_id);
CREATE INDEX idx_dunning_attempts_subscription_id ON dunning_attempts(subscription_id);
CREATE INDEX idx_dunning_attempts_invoice_id ON dunning_attempts(invoice_id);
CREATE INDEX idx_dunning_attempts_status ON dunning_attempts(status);
CREATE INDEX idx_dunning_attempts_next_retry ON dunning_attempts(next_retry_date) WHERE next_retry_date IS NOT NULL;
CREATE INDEX idx_dunning_attempts_created_at ON dunning_attempts(created_at DESC);

-- =====================================================
-- WEBHOOK EVENTS TABLE
-- Tracks all incoming webhook events for debugging and monitoring
-- =====================================================

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,

    -- Processing status
    status VARCHAR(50) NOT NULL DEFAULT 'received', -- received, processing, processed, failed

    -- Event data
    event_data JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    error_message TEXT,

    -- Processing metadata
    processing_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    signature_verified BOOLEAN DEFAULT FALSE
);

-- Indexes for webhook_events
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);
CREATE INDEX idx_webhook_events_failed ON webhook_events(status, processing_attempts) WHERE status = 'failed';

-- =====================================================
-- WEBHOOK IDEMPOTENCY TABLE
-- Ensures webhook events are processed only once
-- =====================================================

CREATE TABLE webhook_idempotency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(event_id, idempotency_key)
);

-- Indexes for webhook_idempotency
CREATE INDEX idx_webhook_idempotency_event_key ON webhook_idempotency(event_id, idempotency_key);
CREATE INDEX idx_webhook_idempotency_created_at ON webhook_idempotency(created_at);

-- Auto-cleanup old idempotency records (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_idempotency_records()
RETURNS void AS $$
BEGIN
    DELETE FROM webhook_idempotency
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- WEBHOOK QUEUE LOG TABLE
-- Tracks webhook processing queue for monitoring
-- =====================================================

CREATE TABLE webhook_queue_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_item_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    attempts INTEGER DEFAULT 0,
    result JSONB,
    error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for webhook_queue_log
CREATE INDEX idx_webhook_queue_log_item_id ON webhook_queue_log(queue_item_id);
CREATE INDEX idx_webhook_queue_log_event_id ON webhook_queue_log(event_id);
CREATE INDEX idx_webhook_queue_log_status ON webhook_queue_log(status);
CREATE INDEX idx_webhook_queue_log_created_at ON webhook_queue_log(created_at DESC);

-- =====================================================
-- USAGE TRACKING TABLE
-- Tracks feature usage for billing and analytics
-- =====================================================

CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Usage details
    action VARCHAR(100) NOT NULL, -- scan, ai_analysis, export, consultation, etc.
    resource_type VARCHAR(100), -- medication, supplement, interaction, etc.
    resource_id VARCHAR(255),

    -- Billing period
    billing_period_start DATE,
    billing_period_end DATE,

    -- Quantity and pricing
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER, -- Price per unit in cents (if applicable)
    total_cost INTEGER DEFAULT 0, -- Total cost in cents

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_usage_tracking_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for usage_tracking
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_action ON usage_tracking(action);
CREATE INDEX idx_usage_tracking_billing_period ON usage_tracking(billing_period_start, billing_period_end);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dunning_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- subscription_events policies
CREATE POLICY "Users can view their own subscription events"
ON subscription_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription events"
ON subscription_events FOR ALL
USING (auth.role() = 'service_role');

-- payment_methods policies
CREATE POLICY "Users can view their own payment methods"
ON payment_methods FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can update their own payment methods"
ON payment_methods FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment methods"
ON payment_methods FOR ALL
USING (auth.role() = 'service_role');

-- invoices policies
CREATE POLICY "Users can view their own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage invoices"
ON invoices FOR ALL
USING (auth.role() = 'service_role');

-- billing_history policies
CREATE POLICY "Users can view their own billing history"
ON billing_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage billing history"
ON billing_history FOR ALL
USING (auth.role() = 'service_role');

-- dunning_attempts policies
CREATE POLICY "Users can view their own dunning attempts"
ON dunning_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage dunning attempts"
ON dunning_attempts FOR ALL
USING (auth.role() = 'service_role');

-- usage_tracking policies
CREATE POLICY "Users can view their own usage tracking"
ON usage_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage tracking"
ON usage_tracking FOR ALL
USING (auth.role() = 'service_role');

-- Webhook tables are service-only (no user access needed)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_queue_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for webhook events"
ON webhook_events FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for webhook idempotency"
ON webhook_idempotency FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for webhook queue log"
ON webhook_queue_log FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- Automated data management and cleanup
-- =====================================================

-- Update updated_at timestamp for payment_methods
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a payment method as default, unset all others for this user
    IF NEW.is_default = TRUE THEN
        UPDATE payment_methods
        SET is_default = FALSE
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_default = TRUE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_method_trigger
BEFORE INSERT OR UPDATE ON payment_methods
FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function to automatically set billing period for usage tracking
CREATE OR REPLACE FUNCTION set_usage_billing_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Set billing period to current month if not specified
    IF NEW.billing_period_start IS NULL THEN
        NEW.billing_period_start = DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END IF;

    IF NEW.billing_period_end IS NULL THEN
        NEW.billing_period_end = (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_usage_billing_period_trigger
BEFORE INSERT ON usage_tracking
FOR EACH ROW EXECUTE FUNCTION set_usage_billing_period();

-- =====================================================
-- UTILITY FUNCTIONS
-- Helper functions for subscription management
-- =====================================================

-- Function to get user's current subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
    subscription_tier TEXT,
    subscription_status TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.subscription_tier,
        p.subscription_status,
        p.subscription_expires_at,
        CASE
            WHEN p.subscription_status IN ('active', 'trialing')
            AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
            THEN TRUE
            ELSE FALSE
        END as is_active
    FROM profiles p
    WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's usage summary for current billing period
CREATE OR REPLACE FUNCTION get_current_usage_summary(p_user_id UUID)
RETURNS TABLE (
    action TEXT,
    total_usage BIGINT,
    total_cost INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ut.action,
        COUNT(*) as total_usage,
        COALESCE(SUM(ut.total_cost), 0)::INTEGER as total_cost
    FROM usage_tracking ut
    WHERE ut.user_id = p_user_id
    AND ut.billing_period_start = DATE_TRUNC('month', CURRENT_DATE)::DATE
    GROUP BY ut.action
    ORDER BY total_usage DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old webhook events (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_events
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND status = 'processed';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup functions (if you have pg_cron extension)
-- SELECT cron.schedule('cleanup-webhook-events', '0 2 * * *', 'SELECT cleanup_old_webhook_events();');
-- SELECT cron.schedule('cleanup-idempotency', '0 3 * * *', 'SELECT cleanup_old_idempotency_records();');

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert webhook event types for reference
INSERT INTO public.webhook_events (stripe_event_id, event_type, status, event_data, signature_verified)
VALUES
    ('setup_event', 'setup.complete', 'processed', '{"message": "Schema setup complete"}', true)
ON CONFLICT (stripe_event_id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Stripe subscription schema setup completed successfully!';
    RAISE NOTICE 'Tables created: subscription_events, payment_methods, invoices, billing_history, dunning_attempts, webhook_events, webhook_idempotency, webhook_queue_log, usage_tracking';
    RAISE NOTICE 'All RLS policies, indexes, and triggers have been applied.';
END $$;