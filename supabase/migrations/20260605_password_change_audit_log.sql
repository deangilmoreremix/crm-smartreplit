-- Create password_change_audit_log table for logging password changes
CREATE TABLE IF NOT EXISTS password_change_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT
);

-- Enable RLS for security
ALTER TABLE password_change_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view all audit logs, users can only see their own
CREATE POLICY "Users can view their own password changes"
  ON password_change_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all password changes"
  ON password_change_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Allow service_role to insert (for audit logging from server)
CREATE POLICY "Service can insert audit logs"
  ON password_change_audit_log
  FOR INSERT
  USING (true);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_password_change_audit_log_user_id ON password_change_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_password_change_audit_log_changed_at ON password_change_audit_log(changed_at DESC);

-- Grant permissions
GRANT ALL ON password_change_audit_log TO service_role;
GRANT SELECT ON password_change_audit_log TO authenticated;