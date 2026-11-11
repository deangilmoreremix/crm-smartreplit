-- Custom-object data becomes API-ONLY (hard guarantee for field-level permissions).
-- See 20261116100000_records_api_only.REVIEW.md. Idempotent; every object is guarded.
--
-- After this migration the browser roles (anon, authenticated) have NO table privileges on
-- records / custom_field_values / record_relations and no EXECUTE on records_masked_rows / records_masked.
-- Only service_role (the Netlify API, server/routes/dataModel.ts, which enforces object + field permissions
-- in code) can read or write them. Privileges are checked BEFORE row level security, so the existing
-- owner/member RLS policies stay in place but are unreachable for non-service roles (RLS stays ENABLED:
-- defence in depth if a grant is ever re-added by mistake or by a future migration/default privilege).

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['records', 'custom_field_values', 'record_relations'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', t);
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
      END IF;
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.records_masked') IS NOT NULL THEN
    REVOKE ALL ON TABLE public.records_masked FROM PUBLIC, anon, authenticated;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      GRANT SELECT ON TABLE public.records_masked TO service_role;
    END IF;
  END IF;
  IF to_regprocedure('public.records_masked_rows(uuid)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.records_masked_rows(uuid) FROM PUBLIC, anon, authenticated;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      GRANT EXECUTE ON FUNCTION public.records_masked_rows(uuid) TO service_role;
    END IF;
  END IF;
END $$;

-- Keep Realtime from advertising these tables to browsers (it would fail the grant check anyway).
DO $$
DECLARE
  t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['records', 'custom_field_values', 'record_relations'] LOOP
      IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;
