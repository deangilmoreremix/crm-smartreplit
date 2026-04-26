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
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints with proper CASCADE behavior
ALTER TABLE deal_activities ADD CONSTRAINT fk_deal_activities_contact_id
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON deal_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_activities_contact_created ON deal_activities(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_activities_type_created ON deal_activities(activity_type, created_at DESC);

-- Add table comment
COMMENT ON TABLE deal_activities IS 'Tracks all activities and interactions related to deals for audit and analytics purposes';

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints with proper CASCADE behavior
ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_events_user_id
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON analytics_events(event_type, created_at DESC);

-- Add table comment
COMMENT ON TABLE analytics_events IS 'Stores analytics events for user behavior tracking and system monitoring';

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  insight_type VARCHAR(50),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints with proper CASCADE behavior
ALTER TABLE ai_insights ADD CONSTRAINT fk_ai_insights_contact_id
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_contact_created ON ai_insights(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_created ON ai_insights(insight_type, created_at DESC);

-- Add table comment
COMMENT ON TABLE ai_insights IS 'Stores AI-generated insights and analysis for contacts to improve sales effectiveness';

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
