-- Monitoring and compliance tables

-- Monitoring logs table
CREATE TABLE IF NOT EXISTS monitoring_logs (
  id SERIAL PRIMARY KEY,
  service VARCHAR(50) NOT NULL, -- email, payment, auth, etc
  issue_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- critical, warning, info
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for monitoring
CREATE INDEX idx_monitoring_service ON monitoring_logs(service);
CREATE INDEX idx_monitoring_severity ON monitoring_logs(severity);
CREATE INDEX idx_monitoring_created ON monitoring_logs(created_at);

-- Add monitoring columns to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP,
ADD COLUMN IF NOT EXISTS activity_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';

-- Session tracking table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time INTEGER, -- milliseconds
  status_code INTEGER,
  error_message TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_usage_user ON api_usage(user_id);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_created ON api_usage(created_at);

-- Health check results
CREATE TABLE IF NOT EXISTS health_checks (
  id SERIAL PRIMARY KEY,
  service VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- healthy, degraded, unhealthy
  response_time INTEGER,
  details JSONB,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_service ON health_checks(service);
CREATE INDEX idx_health_checked ON health_checks(checked_at);