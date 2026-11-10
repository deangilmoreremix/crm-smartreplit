-- White-label persistence (Supabase-only: tables + RLS + RPC + storage).
-- Replaces localStorage-only branding and the hardcoded hostname map.
-- A tenant == the owning auth user (domains.tenant_id = owner_id).

-- ---------------------------------------------------------------------------
-- Branding config, one row per owner
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whitelabel_branding (
  owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whitelabel_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whitelabel_branding_owner_all ON public.whitelabel_branding;
CREATE POLICY whitelabel_branding_owner_all ON public.whitelabel_branding
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Change history (written by trigger, readable by owner)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whitelabel_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wl_history_owner
  ON public.whitelabel_settings_history(owner_id, created_at DESC);

ALTER TABLE public.whitelabel_settings_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whitelabel_history_owner_read ON public.whitelabel_settings_history;
CREATE POLICY whitelabel_history_owner_read ON public.whitelabel_settings_history
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.whitelabel_branding_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  INSERT INTO public.whitelabel_settings_history (owner_id, config)
  VALUES (NEW.owner_id, NEW.config);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whitelabel_branding_audit ON public.whitelabel_branding;
CREATE TRIGGER trg_whitelabel_branding_audit
  BEFORE INSERT OR UPDATE ON public.whitelabel_branding
  FOR EACH ROW EXECUTE FUNCTION public.whitelabel_branding_audit();

-- ---------------------------------------------------------------------------
-- Public hostname -> branding lookup (anon-callable, returns branding JSON only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_branding_for_host(p_host TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.config
  FROM public.domains d
  JOIN public.whitelabel_branding b ON b.owner_id = d.tenant_id
  WHERE lower(d.domain) = lower(p_host)
    AND d.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_branding_for_host(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_branding_for_host(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for logos/favicons: public read, owners write to <uid>/...
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('whitelabel-assets', 'whitelabel-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS whitelabel_assets_public_read ON storage.objects;
CREATE POLICY whitelabel_assets_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'whitelabel-assets');

DROP POLICY IF EXISTS whitelabel_assets_owner_write ON storage.objects;
CREATE POLICY whitelabel_assets_owner_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'whitelabel-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'whitelabel-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
