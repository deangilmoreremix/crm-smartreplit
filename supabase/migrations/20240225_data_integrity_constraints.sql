-- ============================================================================
-- Data Integrity Hardening Migration
-- 
-- This migration adds idempotency keys, unique constraints, and version
-- columns to prevent duplicate records, race conditions, and lost updates.
-- 
-- THREAT MODEL ADDRESSED:
-- - Double-click creates duplicate records
-- - Network retry creates duplicate data
-- - Concurrent updates cause lost data
-- - Webhook redelivery causes duplicate processing
-- ============================================================================

-- ============================================================================
-- 1. IDEMPOTENCY KEYS - Prevent duplicate processing of same request
-- ============================================================================

-- Add idempotency key to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_idempotency ON contacts(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Add idempotency key to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_idempotency ON deals(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add idempotency key to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_idempotency ON tasks(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add idempotency key to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_idempotency ON appointments(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add idempotency key to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_idempotency ON notes(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add idempotency key to credit_transactions
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_idempotency ON credit_transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add idempotency key to usage_events
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_events_idempotency ON usage_events(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add idempotency key to communications
ALTER TABLE communications ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_communications_idempotency ON communications(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add idempotency key to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_idempotency ON documents(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ============================================================================
-- 2. DUPLICATE PREVENTION - Natural key constraints
-- ============================================================================

-- Prevent duplicate contacts per user (same email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_profile_email 
  ON contacts(profile_id, lower(email))
  WHERE email IS NOT NULL AND email != '';

-- Prevent duplicate deals per user (same title + contact)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_profile_title_contact 
  ON deals(profile_id, title, contact_id)
  WHERE contact_id IS NOT NULL;

-- Prevent double-booking appointments (overlapping time slots per user)
-- Note: This is a partial solution - full overlap detection requires a trigger
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_profile_time 
  ON appointments(profile_id, start_time, end_time);

-- ============================================================================
-- 3. CONCURRENCY CONTROL - Version columns for optimistic locking
-- ============================================================================

-- Add version column to profiles for optimistic locking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add version column to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add version column to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add version column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add version column to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add version column to user_credits (critical for balance operations)
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add version column to entitlements
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- ============================================================================
-- 4. WEBHOOK DEDUPLICATION TABLE
-- ============================================================================

-- Create webhook_events table for idempotent webhook processing
CREATE TABLE IF NOT EXISTS webhook_events (
  id VARCHAR(64) PRIMARY KEY,
  source VARCHAR(50) NOT NULL CHECK (source IN ('stripe', 'paypal', 'jvzoo', 'manual')),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for looking up events by source and type
CREATE INDEX IF NOT EXISTS idx_webhook_events_source_type 
  ON webhook_events(source, event_type);

-- Index for looking up events by user
CREATE INDEX IF NOT EXISTS idx_webhook_events_user 
  ON webhook_events(user_id);

-- Index for cleanup of old events (retain 30 days)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at 
  ON webhook_events(processed_at);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate idempotency key from data
CREATE OR REPLACE FUNCTION generate_idempotency_key(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_data JSONB
) RETURNS VARCHAR(64) AS $$
DECLARE
  v_hash VARCHAR(64);
BEGIN
  v_hash := encode(sha256(
    p_user_id::TEXT || ':' || 
    p_entity_type || ':' || 
    p_entity_data::TEXT || ':' ||
    EXTRACT(EPOCH FROM NOW())::TEXT
  ), 'hex');
  RETURN v_hash;
END;
$$ LANGUAGE plpgsql;

-- Function to check and record webhook event (atomic)
CREATE OR REPLACE FUNCTION process_webhook_event(
  p_event_id VARCHAR(64),
  p_source VARCHAR(50),
  p_event_type VARCHAR(100),
  p_user_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists INTEGER;
BEGIN
  -- Check if already processed
  SELECT 1 INTO v_exists FROM webhook_events WHERE id = p_event_id;
  
  IF v_exists IS NOT NULL THEN
    RETURN FALSE; -- Already processed
  END IF;
  
  -- Insert new event record
  INSERT INTO webhook_events (id, source, event_type, user_id, payload)
  VALUES (p_event_id, p_source, p_event_type, p_user_id, p_payload);
  
  RETURN TRUE; -- Successfully recorded
END;
$$ LANGUAGE plpgsql;

-- Function for optimistic locking update
CREATE OR REPLACE FUNCTION optimistic_update(
  p_table_name TEXT,
  p_record_id INTEGER,
  p_expected_version INTEGER,
  p_updates JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_update_result INTEGER;
  v_query TEXT;
BEGIN
  -- Build dynamic UPDATE query with version check
  v_query := format(
    'UPDATE %I SET version = version + 1, updated_at = NOW() WHERE id = $1 AND version = $2',
    p_table_name
  );
  
  -- Execute with version check
  EXECUTE v_query USING p_record_id, p_expected_version;
  
  GET DIAGNOSTICS v_update_result = ROW_COUNT;
  
  RETURN v_update_result > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CLEANUP JOB FOR OLD WEBHOOK EVENTS (run via pg_cron or manually)
-- ============================================================================

-- Delete webhook events older than 30 days
-- Can be scheduled with: SELECT cron.schedule('cleanup_webhook_events', '0 0 * * *', $$
-- DELETE FROM webhook_events WHERE processed_at < NOW() - INTERVAL '30 days';
-- $$);

-- ============================================================================
-- 7. TRIGGERS FOR AUTOMATIC VERSION INCREMENT
-- ============================================================================

-- Function to automatically increment version on update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to critical tables
DROP TRIGGER IF EXISTS trigger_profiles_version ON profiles;
CREATE TRIGGER trigger_profiles_version
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS trigger_contacts_version ON contacts;
CREATE TRIGGER trigger_contacts_version
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS trigger_deals_version ON deals;
CREATE TRIGGER trigger_deals_version
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS trigger_tasks_version ON tasks;
CREATE TRIGGER trigger_tasks_version
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS trigger_appointments_version ON appointments;
CREATE TRIGGER trigger_appointments_version
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS trigger_user_credits_version ON user_credits;
CREATE TRIGGER trigger_user_credits_version
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN contacts.idempotency_key IS 'Unique key for preventing duplicate creates from retries';
COMMENT ON COLUMN deals.idempotency_key IS 'Unique key for preventing duplicate creates from retries';
COMMENT ON COLUMN tasks.idempotency_key IS 'Unique key for preventing duplicate creates from retries';
COMMENT ON COLUMN appointments.idempotency_key IS 'Unique key for preventing duplicate creates from retries';
COMMENT ON COLUMN credit_transactions.idempotency_key IS 'Unique key for preventing duplicate credit operations';
COMMENT ON COLUMN profiles.version IS 'Version number for optimistic locking';
COMMENT ON COLUMN user_credits.version IS 'Version number for optimistic locking - critical for balance operations';
COMMENT ON TABLE webhook_events IS 'Tracks processed webhooks to prevent duplicate processing';
