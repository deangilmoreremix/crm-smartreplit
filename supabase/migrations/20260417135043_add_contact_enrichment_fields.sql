-- Phase 6: Database Schema Extensions
-- Add scoring fields to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_score DECIMAL(3,2) DEFAULT 0.50;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS scoring_rationale TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMP WITH TIME ZONE;

-- Add pipeline fields to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS probability INTEGER;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL(12,2);

-- Create deal activities table
CREATE TABLE IF NOT EXISTS deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES profiles(id),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id INTEGER REFERENCES contacts(id),
  insight_type VARCHAR(50),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled events table for calendar
CREATE TABLE IF NOT EXISTS scheduled_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create smart scheduling rules table
CREATE TABLE IF NOT EXISTS smart_scheduling_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  rule_name VARCHAR(100),
  conditions JSONB,
  action JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
