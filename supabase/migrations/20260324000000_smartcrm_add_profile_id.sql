-- Add profile_id column to contacts for multi-tenancy
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);

-- Add index on profile_id for faster queries
CREATE INDEX IF NOT EXISTS idx_contacts_profile_id ON contacts(profile_id);

-- Add tenant_id column to contacts for multi-tenancy
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Add index on tenant_id
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON contacts(tenant_id);

-- Create deals table if it doesn't exist
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  value DECIMAL(10, 2),
  stage TEXT NOT NULL DEFAULT 'lead',
  probability INTEGER DEFAULT 0,
  expected_close_date TIMESTAMP,
  actual_close_date TIMESTAMP,
  description TEXT,
  status TEXT DEFAULT 'open',
  idempotency_key VARCHAR(64),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  profile_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  contact_id UUID REFERENCES contacts(id)
);

-- Add index on deals profile_id
CREATE INDEX IF NOT EXISTS idx_deals_profile_id ON deals(profile_id);

-- Add index on deals tenant_id
CREATE INDEX IF NOT EXISTS idx_deals_tenant_id ON deals(tenant_id);

-- Enable RLS on deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for deals - users can only see their own deals
CREATE POLICY "Users can view own deals" ON deals
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own deals" ON deals
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own deals" ON deals
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own deals" ON deals
  FOR DELETE USING (profile_id = auth.uid());

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  profile_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id)
);

-- Add indexes on tasks
CREATE INDEX IF NOT EXISTS idx_tasks_profile_id ON tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (profile_id = auth.uid());

-- Add profile_id and tenant_id to existing contacts (set to null for now)
UPDATE contacts SET 
  profile_id = NULL,
  tenant_id = NULL
WHERE profile_id IS NULL AND tenant_id IS NULL;
