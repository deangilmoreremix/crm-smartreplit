-- Add missing indexes for performance
-- These improve queries filtering by profile_id or contact_id

-- Index on contact_activities(contact_id) - foreign key already indexed, but ensure explicitly
CREATE INDEX IF NOT EXISTS idx_contact_activities_contact_id 
ON public.contact_activities(contact_id);

-- Composite index for activity timeline queries by contact + date
CREATE INDEX IF NOT EXISTS idx_contact_activities_contact_created 
ON public.contact_activities(contact_id, created_at DESC);

-- Composite index for profile-based activity lookups (if profile_id column exists)
-- First check if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_activities' AND column_name = 'profile_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_contact_activities_profile_created 
    ON public.contact_activities(profile_id, created_at DESC);
  END IF;
END $$;

-- Index on deals(profile_id) if not already present
CREATE INDEX IF NOT EXISTS idx_deals_profile_id 
ON public.deals(profile_id);

-- Index on contacts(profile_id) if not already present
CREATE INDEX IF NOT EXISTS idx_contacts_profile_id 
ON public.contacts(profile_id);