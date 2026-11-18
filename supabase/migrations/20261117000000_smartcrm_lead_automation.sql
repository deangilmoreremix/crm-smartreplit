-- SmartCRM Lead Automation: per-user settings, campaigns and campaign enrollments.
-- Campaign steps create tasks in smartcrm_tasks; nothing is sent automatically.
-- Labelled smartcrm_ like the other SmartCRM tables in this shared Supabase project.

CREATE TABLE IF NOT EXISTS public.smartcrm_lead_automation_settings (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id),
  scoring_model text NOT NULL DEFAULT 'ai-powered' CHECK (scoring_model IN ('ai-powered', 'rule-based', 'hybrid')),
  qualification_threshold integer NOT NULL DEFAULT 70 CHECK (qualification_threshold BETWEEN 0 AND 100),
  create_followup_tasks boolean NOT NULL DEFAULT true,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.smartcrm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  name text NOT NULL,
  description text,
  audience jsonb DEFAULT '{}'::jsonb,
  steps jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.smartcrm_campaign_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.smartcrm_campaigns(id) ON DELETE CASCADE,
  contact_id integer NOT NULL REFERENCES public.smartcrm_contacts(id) ON DELETE CASCADE,
  next_step integer NOT NULL DEFAULT 0,
  next_due_at timestamp,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done')),
  enrolled_at timestamp DEFAULT now(),
  CONSTRAINT smartcrm_campaign_enrollment_unique UNIQUE (campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS smartcrm_campaigns_profile_idx ON public.smartcrm_campaigns (profile_id);
CREATE INDEX IF NOT EXISTS smartcrm_campaign_enrollments_campaign_idx ON public.smartcrm_campaign_enrollments (campaign_id);
CREATE INDEX IF NOT EXISTS smartcrm_campaign_enrollments_due_idx ON public.smartcrm_campaign_enrollments (status, next_due_at);
CREATE INDEX IF NOT EXISTS smartcrm_campaign_enrollments_contact_idx ON public.smartcrm_campaign_enrollments (contact_id);

COMMENT ON TABLE public.smartcrm_lead_automation_settings IS 'SmartCRM (deangilmoreremix/crm-smartreplit): per-user lead automation settings (scoring model, qualification threshold, follow-up tasks)';
COMMENT ON TABLE public.smartcrm_campaigns IS 'SmartCRM (deangilmoreremix/crm-smartreplit): lead nurturing campaigns; steps create tasks, owned by profile_id';
COMMENT ON TABLE public.smartcrm_campaign_enrollments IS 'SmartCRM (deangilmoreremix/crm-smartreplit): contacts enrolled in a campaign and their next due step';

ALTER TABLE public.smartcrm_lead_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartcrm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartcrm_campaign_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smartcrm owner access" ON public.smartcrm_lead_automation_settings FOR ALL TO authenticated
  USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));
CREATE POLICY "smartcrm owner access" ON public.smartcrm_campaigns FOR ALL TO authenticated
  USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));
CREATE POLICY "smartcrm owner access" ON public.smartcrm_campaign_enrollments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.smartcrm_campaigns c WHERE c.id = campaign_id AND c.profile_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.smartcrm_campaigns c WHERE c.id = campaign_id AND c.profile_id = (select auth.uid())));

-- A contact's score is NULL until it is scored (it used to default to 0.50, which looked like a real score).
ALTER TABLE public.smartcrm_contacts ALTER COLUMN score DROP DEFAULT;
