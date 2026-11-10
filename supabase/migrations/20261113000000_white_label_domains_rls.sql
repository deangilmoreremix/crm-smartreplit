-- White-label custom domains: RLS, indexes, request_domain RPC.
-- Tenant == owning auth user (domains.tenant_id = auth.uid()).
-- Idempotent: safe to re-run.
--
-- Write model: owners can SELECT and DELETE their own rows. There is NO insert/update
-- policy for `authenticated`: rows are created through request_domain() (validated,
-- token generated server-side) and verification results are written by the
-- verify-domain Edge Function, so an owner cannot self-mark a domain as verified.

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS domains_owner_select ON public.domains;
CREATE POLICY domains_owner_select ON public.domains
  FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS domains_owner_delete ON public.domains;
CREATE POLICY domains_owner_delete ON public.domains
  FOR DELETE TO authenticated
  USING (tenant_id = auth.uid());

-- Remove any broader grants/policies from earlier experiments
DROP POLICY IF EXISTS domains_owner_all ON public.domains;
REVOKE ALL ON public.domains FROM anon;
REVOKE INSERT, UPDATE ON public.domains FROM authenticated;
GRANT SELECT, DELETE ON public.domains TO authenticated;

-- Indexes (idx_domains_tenant / idx_domains_status already exist from the infra migration)
CREATE INDEX IF NOT EXISTS idx_domains_tenant ON public.domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_domains_domain_lower ON public.domains (lower(domain));

-- ---------------------------------------------------------------------------
-- request_domain: add a pending domain for the caller
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_domain(p_domain TEXT)
RETURNS public.domains
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_domain TEXT;
  v_row public.domains;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  v_domain := lower(btrim(coalesce(p_domain, '')));
  v_domain := regexp_replace(v_domain, '\.$', '');

  IF v_domain !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
     OR length(v_domain) > 253 THEN
    RAISE EXCEPTION 'invalid_hostname' USING ERRCODE = '22023';
  END IF;

  -- Hosts served by the default deployment cannot be claimed as custom domains
  IF v_domain LIKE '%.smartcrm.vip' OR v_domain = 'smartcrm.vip'
     OR v_domain LIKE '%.netlify.app' THEN
    RAISE EXCEPTION 'reserved_hostname' USING ERRCODE = '22023';
  END IF;

  IF (SELECT count(*) FROM public.domains WHERE tenant_id = v_uid) >= 10 THEN
    RAISE EXCEPTION 'domain_limit_reached' USING ERRCODE = '54000';
  END IF;

  IF EXISTS (SELECT 1 FROM public.domains WHERE lower(domain) = v_domain) THEN
    RAISE EXCEPTION 'domain_already_registered' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.domains (tenant_id, domain, status, dns_verified, ssl_status,
                              verification_token, verification_method)
  VALUES (
    v_uid, v_domain, 'pending', FALSE, 'pending',
    'smartcrm-verify-' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    'txt'
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.request_domain(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_domain(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- tenants.parent_partner_id, only if a public.tenants table exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenants'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS parent_partner_id UUID;
    CREATE INDEX IF NOT EXISTS idx_tenants_parent_partner ON public.tenants(parent_partner_id);
  END IF;
END
$$;
