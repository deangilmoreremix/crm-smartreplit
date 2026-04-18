-- Add enrichment fields to contacts table
ALTER TABLE contacts ADD COLUMN score DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE contacts ADD COLUMN enrichment_data JSONB;
ALTER TABLE contacts ADD COLUMN last_enriched_at TIMESTAMPTZ;

-- Create contact_custom_fields table
CREATE TABLE contact_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create contact_activities table
CREATE TABLE contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own contact custom fields" ON contact_custom_fields FOR SELECT USING (auth.uid() IN (SELECT user_id FROM contacts WHERE id = contact_id));
CREATE POLICY "Users can manage own contact custom fields" ON contact_custom_fields FOR ALL USING (auth.uid() IN (SELECT user_id FROM contacts WHERE id = contact_id));
CREATE POLICY "Users can view own contact activities" ON contact_activities FOR SELECT USING (auth.uid() IN (SELECT user_id FROM contacts WHERE id = contact_id));
CREATE POLICY "Users can manage own contact activities" ON contact_activities FOR ALL USING (auth.uid() IN (SELECT user_id FROM contacts WHERE id = contact_id));