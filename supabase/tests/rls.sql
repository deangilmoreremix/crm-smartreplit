-- =====================================================================================
-- RLS / grants / function-privilege assertions for the 2026-11 migrations
-- (20261110000000 ... 20261114500000).
--
-- HOW TO RUN
--   1. Create two throwaway auth users A and B (see supabase/seed/test_users.sql) and copy their UUIDs
--      (Dashboard > Authentication > Users).
--   2. Replace the two placeholder UUIDs below (AAAAAAAA-... and BBBBBBBB-...) with those ids, then either
--        - paste the whole file into the Supabase SQL editor (runs as role postgres), or
--        - psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
--      Non-interactive psql one-liner (does not modify the file):
--        sed -e "s/AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA/$UID_A/" \
--            -e "s/BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB/$UID_B/" supabase/tests/rls.sql \
--          | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
--   3. Success: the last result is  RLS TESTS PASSED  and a NOTICE "RLS TESTS PASSED: N assertions".
--      Failure: the script stops with  ERROR: RLS FAIL [...]  naming the table / function and what leaked.
--
-- SAFETY
--   * Everything (helper schema rls_test, all seeded rows, membership changes) happens inside ONE transaction that
--     ends with ROLLBACK, so nothing persists. Run it on staging (a Supabase branch), never on production.
--   * It must run as a role that bypasses RLS and can SET ROLE authenticated/anon (postgres in Supabase).
--   * Both users must already exist in auth.users. Existing data of the two users is untouched (rows are only added,
--     then rolled back; assertions look only at the rows seeded here, identified by primary key).
-- =====================================================================================

BEGIN;

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>  EDIT THESE TWO LINES  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
SELECT set_config('rls_test.uid_a', 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', true) AS user_a;
SELECT set_config('rls_test.uid_b', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB', true) AS user_b;
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

DROP SCHEMA IF EXISTS rls_test CASCADE;
CREATE SCHEMA rls_test;

CREATE TABLE rls_test.tally (n serial PRIMARY KEY, what text NOT NULL);
CREATE TABLE rls_test.seed  (tbl text NOT NULL, key_col text NOT NULL, key_val text NOT NULL, owner uuid NOT NULL);
CREATE TABLE rls_test.vars  (k text PRIMARY KEY, v text);

GRANT USAGE ON SCHEMA rls_test TO anon, authenticated;
GRANT SELECT ON rls_test.seed, rls_test.vars TO anon, authenticated;

CREATE FUNCTION rls_test.uid_a() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('rls_test.uid_a')::uuid $$;
CREATE FUNCTION rls_test.uid_b() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('rls_test.uid_b')::uuid $$;
CREATE FUNCTION rls_test.var(p_k text) RETURNS text LANGUAGE sql STABLE AS $$ SELECT v FROM rls_test.vars WHERE k = p_k $$;

-- Records one passed assertion. SECURITY DEFINER so it also works while the session role is anon/authenticated.
CREATE FUNCTION rls_test.ok(p_what text) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, rls_test AS
$$ INSERT INTO rls_test.tally(what) VALUES (p_what) $$;

CREATE FUNCTION rls_test.keys(p_tbl text, p_owner uuid) RETURNS text[] LANGUAGE sql STABLE AS
$$ SELECT coalesce(array_agg(key_val), ARRAY[]::text[]) FROM rls_test.seed WHERE tbl = p_tbl AND owner = p_owner $$;

-- Number of seeded rows (of p_owner) the CURRENT role can see / update / delete. A privilege error counts as 0.
CREATE FUNCTION rls_test.n_visible(p_tbl text, p_key text, p_owner uuid) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I::text = ANY($1)', p_tbl, p_key) INTO n USING rls_test.keys(p_tbl, p_owner);
  RETURN n;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN 0;
END $$;

CREATE FUNCTION rls_test.n_updated(p_tbl text, p_key text, p_owner uuid) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('UPDATE public.%I SET %I = %I WHERE %I::text = ANY($1)', p_tbl, p_key, p_key, p_key) USING rls_test.keys(p_tbl, p_owner);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN 0;
END $$;

CREATE FUNCTION rls_test.n_deleted(p_tbl text, p_key text, p_owner uuid) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('DELETE FROM public.%I WHERE %I::text = ANY($1)', p_tbl, p_key) USING rls_test.keys(p_tbl, p_owner);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN 0;
END $$;

-- The statement must be rejected with a privilege / RLS error (SQLSTATE 42501).
CREATE FUNCTION rls_test.expect_denied(p_label text, p_sql text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'RLS FAIL [%]: statement was allowed but must be denied (role %)', p_label, current_user;
EXCEPTION
  WHEN insufficient_privilege THEN
    PERFORM rls_test.ok('denied: ' || p_label);
END $$;

-- The statement may be rejected (42501) or match zero rows, but must not change anything.
CREATE FUNCTION rls_test.expect_no_rows(p_label text, p_sql text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n > 0 THEN
    RAISE EXCEPTION 'RLS FAIL [%]: statement affected % row(s) but must affect none (role %)', p_label, n, current_user;
  END IF;
  PERFORM rls_test.ok('no rows: ' || p_label);
EXCEPTION
  WHEN insufficient_privilege THEN
    PERFORM rls_test.ok('denied: ' || p_label);
END $$;

-- Raises with a readable message unless the SQLSTATE of running p_sql equals p_state.
CREATE FUNCTION rls_test.expect_error(p_label text, p_sql text, p_state text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'RLS FAIL [%]: expected SQLSTATE % but statement succeeded', p_label, p_state;
EXCEPTION
  WHEN OTHERS THEN
    IF SQLSTATE = 'P0001' AND SQLERRM LIKE 'RLS FAIL%' THEN RAISE; END IF;
    IF SQLSTATE <> p_state THEN
      RAISE EXCEPTION 'RLS FAIL [%]: expected SQLSTATE % but got % (%)', p_label, p_state, SQLSTATE, SQLERRM;
    END IF;
    PERFORM rls_test.ok('error ' || p_state || ': ' || p_label);
END $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA rls_test TO anon, authenticated;

-- ============================================================================================
-- 0. Preconditions (as the admin role)
-- ============================================================================================
DO $$
DECLARE
  a uuid := rls_test.uid_a();
  b uuid := rls_test.uid_b();
  adm boolean;
BEGIN
  -- placeholders are built from pieces so the sed one-liner in the header does not rewrite this check
  IF a::text = repeat('a', 8) || '-' || repeat('a', 4) || '-' || repeat('a', 4) || '-' || repeat('a', 4) || '-' || repeat('a', 12)
     OR b::text = repeat('b', 8) || '-' || repeat('b', 4) || '-' || repeat('b', 4) || '-' || repeat('b', 4) || '-' || repeat('b', 12) THEN
    RAISE EXCEPTION 'RLS SETUP: replace the placeholder UUIDs at the top of this file with the ids of test users A and B';
  END IF;
  IF a = b THEN RAISE EXCEPTION 'RLS SETUP: user A and user B must be different users'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = a) THEN
    RAISE EXCEPTION 'RLS SETUP: user A (%) not found in auth.users - create the users first (supabase/seed/test_users.sql)', a;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = b) THEN
    RAISE EXCEPTION 'RLS SETUP: user B (%) not found in auth.users - create the users first (supabase/seed/test_users.sql)', b;
  END IF;
  SELECT rolsuper OR rolbypassrls INTO adm FROM pg_roles WHERE rolname = current_user;
  IF NOT coalesce(adm, false) THEN
    RAISE EXCEPTION 'RLS SETUP: run as a role that bypasses RLS (postgres); current role % cannot seed data', current_user;
  END IF;
  INSERT INTO rls_test.vars VALUES ('sfx', substr(md5(random()::text), 1, 8));
END $$;

-- 0a. Catalog: every new table exists and has RLS on; extensions; triggers; storage buckets
DO $$
DECLARE
  t text;
  missing text[] := ARRAY[]::text[];
  norls text[] := ARRAY[]::text[];
  tables text[] := ARRAY[
    'whitelabel_branding','whitelabel_settings_history','domains','favorites','favorite_folders','timeline_events',
    'records','object_metadata','field_metadata','custom_field_values','roles','team_members','webhooks',
    'webhook_deliveries','api_keys','views','user_ui_preferences','ai_assistants','ai_threads','ai_thread_messages',
    'ai_jobs','workflows','workflow_actions','workflow_runs','workflow_versions','crm_companies','note_targets',
    'task_targets',
    -- supporting tables from the same migrations
    'custom_field_definitions','record_relations','role_object_permissions','role_field_permissions',
    'workflow_run_waits','workflow_hook_usage','workflow_event_queue','api_key_usage'];
  trg record;
  n int := 0;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      missing := missing || t;
    ELSIF NOT (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = to_regclass('public.' || t)) THEN
      norls := norls || t;
    ELSE
      n := n + 1;
    END IF;
  END LOOP;
  IF cardinality(missing) > 0 THEN
    RAISE EXCEPTION 'RLS FAIL [catalog]: tables missing (apply migrations in order): %', array_to_string(missing, ', ');
  END IF;
  IF cardinality(norls) > 0 THEN
    RAISE EXCEPTION 'RLS FAIL [catalog]: row level security is DISABLED on: %', array_to_string(norls, ', ');
  END IF;
  PERFORM rls_test.ok('catalog: ' || n || ' tables exist with relrowsecurity = true');

  -- no policy that is simply USING (true) on these tables
  SELECT string_agg(tablename || '.' || policyname, ', ') INTO t
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = ANY(tables)
    AND (btrim(coalesce(qual, '')) IN ('true', '(true)') OR (cmd = 'INSERT' AND btrim(coalesce(with_check, '')) IN ('true', '(true)')));
  IF t IS NOT NULL THEN
    RAISE EXCEPTION 'RLS FAIL [catalog]: wide-open policies (USING true): %', t;
  END IF;
  PERFORM rls_test.ok('catalog: no USING (true) policies on new tables');

  -- tables meant to be service-role only must have no policies at all
  SELECT string_agg(tablename || '.' || policyname, ', ') INTO t
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename IN ('api_key_usage','workflow_hook_usage','workflow_event_queue');
  IF t IS NOT NULL THEN
    RAISE EXCEPTION 'RLS FAIL [catalog]: service-role-only tables must not have policies: %', t;
  END IF;
  PERFORM rls_test.ok('catalog: service-role-only tables have no policies');

  FOREACH t IN ARRAY ARRAY['pg_trgm','unaccent'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = t) THEN
      RAISE EXCEPTION 'RLS FAIL [catalog]: extension % is not installed', t;
    END IF;
  END LOOP;
  PERFORM rls_test.ok('catalog: extensions pg_trgm, unaccent present');

  FOR trg IN SELECT * FROM (VALUES
      ('contacts','timeline_log_contacts'), ('deals','timeline_log_deals'),
      ('tasks','timeline_log_tasks'), ('notes','timeline_log_notes'),
      ('contacts','trg_webhook_deliveries'), ('deals','trg_webhook_deliveries'), ('tasks','trg_webhook_deliveries'),
      ('contacts','trg_workflow_event_queue'), ('deals','trg_workflow_event_queue'), ('tasks','trg_workflow_event_queue')
    ) v(tbl, trgname)
  LOOP
    IF to_regclass('public.' || trg.tbl) IS NULL THEN
      RAISE NOTICE 'catalog: public.% does not exist, trigger % skipped', trg.tbl, trg.trgname;
    ELSIF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = to_regclass('public.' || trg.tbl) AND tgname = trg.trgname AND NOT tgisinternal) THEN
      RAISE EXCEPTION 'RLS FAIL [catalog]: trigger % missing on public.%', trg.trgname, trg.tbl;
    ELSE
      PERFORM rls_test.ok('catalog: trigger ' || trg.trgname || ' on ' || trg.tbl);
    END IF;
  END LOOP;
  IF to_regclass('public.contacts') IS NULL AND to_regclass('public.notes') IS NULL THEN
    RAISE EXCEPTION 'RLS FAIL [catalog]: neither contacts nor notes exist, timeline triggers cannot exist';
  END IF;

  FOR trg IN SELECT * FROM (VALUES
      ('whitelabel_branding','trg_whitelabel_branding_audit'), ('records','trg_records_maintain'),
      ('records','trg_records_a_field_perms'), ('custom_field_values','trg_custom_field_values_touch')) v(tbl, trgname)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = to_regclass('public.' || trg.tbl) AND tgname = trg.trgname AND NOT tgisinternal) THEN
      RAISE EXCEPTION 'RLS FAIL [catalog]: trigger % missing on public.%', trg.trgname, trg.tbl;
    END IF;
  END LOOP;
  PERFORM rls_test.ok('catalog: internal triggers present');

  IF to_regclass('storage.buckets') IS NOT NULL THEN
    FOREACH t IN ARRAY ARRAY['whitelabel-assets','generated-images'] LOOP
      IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = t) THEN
        RAISE EXCEPTION 'RLS FAIL [catalog]: storage bucket % missing', t;
      END IF;
    END LOOP;
    PERFORM rls_test.ok('catalog: storage buckets present');
  END IF;

  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'timeline_events') THEN
    RAISE EXCEPTION 'RLS FAIL [catalog]: timeline_events is not in the supabase_realtime publication';
  END IF;
END $$;

-- 0b. Column privileges (checked via the catalog, as admin)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES ('webhooks','secret'), ('api_keys','key_hash')) v(tbl, col) LOOP
    IF has_column_privilege('authenticated', 'public.' || r.tbl, r.col, 'SELECT') THEN
      RAISE EXCEPTION 'RLS FAIL [%.%]: role authenticated has SELECT on the secret column', r.tbl, r.col;
    END IF;
    IF has_column_privilege('anon', 'public.' || r.tbl, r.col, 'SELECT') THEN
      RAISE EXCEPTION 'RLS FAIL [%.%]: role anon has SELECT on the secret column', r.tbl, r.col;
    END IF;
    IF NOT has_column_privilege('authenticated', 'public.' || r.tbl, 'id', 'SELECT') THEN
      RAISE EXCEPTION 'RLS FAIL [%.id]: role authenticated lost SELECT on the non-secret columns', r.tbl;
    END IF;
    PERFORM rls_test.ok('column privileges: ' || r.tbl || '.' || r.col || ' hidden');
  END LOOP;
END $$;

-- 0c. Function privileges (checked via the catalog, as admin; has_function_privilege includes PUBLIC grants)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
      -- signature, anon may execute, authenticated may execute
      ('public.request_domain(text)',                 false, true),
      ('public.global_search(text,int)',              false, true),
      ('public.get_branding_for_host(text)',          true,  true),
      ('public.has_object_perm(uuid,text,text)',      false, true),
      ('public.has_field_perm(uuid,text,text,text)',  false, true),
      ('public.mask_record_data(uuid,text,jsonb)',    false, true),
      ('public.visible_owner_ids()',                  false, true),
      ('public.member_role_id(uuid)',                 false, true),
      ('public.bump_api_key_usage(uuid,timestamptz)', false, false),
      ('public.bump_workflow_hook_usage(uuid,timestamptz)', false, false),
      ('public.log_timeline_event()',                 false, false),
      ('public.enqueue_webhook_deliveries()',         false, false),
      ('public.enqueue_workflow_event()',             false, false)
    ) v(sig, anon_ok, auth_ok)
  LOOP
    IF has_function_privilege('anon', r.sig, 'EXECUTE') <> r.anon_ok THEN
      RAISE EXCEPTION 'RLS FAIL [%]: anon EXECUTE is % but must be %', r.sig, NOT r.anon_ok, r.anon_ok;
    END IF;
    IF has_function_privilege('authenticated', r.sig, 'EXECUTE') <> r.auth_ok THEN
      RAISE EXCEPTION 'RLS FAIL [%]: authenticated EXECUTE is % but must be %', r.sig, NOT r.auth_ok, r.auth_ok;
    END IF;
    PERFORM rls_test.ok('function privileges: ' || r.sig);
  END LOOP;
END $$;

-- ============================================================================================
-- 1. Seed (as admin): the same set of rows for A and B. The (table, key, owner) triples are recorded in rls_test.seed.
-- ============================================================================================
-- note_targets / task_targets have optional FKs to notes/tasks; drop them for this (rolled-back) transaction so the
-- targets can be seeded without creating parent rows.
ALTER TABLE public.note_targets DROP CONSTRAINT IF EXISTS note_targets_note_id_fkey;
ALTER TABLE public.task_targets DROP CONSTRAINT IF EXISTS task_targets_task_id_fkey;

CREATE FUNCTION rls_test.add(p_tbl text, p_key text, p_owner uuid, p_sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  EXECUTE p_sql INTO v;
  INSERT INTO rls_test.seed VALUES (p_tbl, p_key, v, p_owner);
  RETURN v;
END $$;

CREATE FUNCTION rls_test.seed_owner(o uuid, tag text, p_domain_status text) RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  sfx text := rls_test.var('sfx');
  v_obj text; v_cfd text; v_role text; v_hook text; v_asst text; v_thread text; v_wf text; v_id text; v_fld text; v_rec text;
BEGIN
  PERFORM rls_test.add('whitelabel_branding', 'owner_id', o, format(
    $q$INSERT INTO public.whitelabel_branding(owner_id, config) VALUES (%L, jsonb_build_object('brand', %L))
       ON CONFLICT (owner_id) DO UPDATE SET config = EXCLUDED.config RETURNING owner_id::text$q$, o, 'rls-brand-' || tag));
  PERFORM rls_test.add('whitelabel_settings_history', 'id', o, format(
    $q$INSERT INTO public.whitelabel_settings_history(owner_id, config) VALUES (%L, '{"rls":true}') RETURNING id::text$q$, o));
  v_id := rls_test.add('domains', 'id', o, format(
    $q$INSERT INTO public.domains(tenant_id, domain, status, verification_token) VALUES (%L, %L, %L, 'rls-token') RETURNING id::text$q$,
    o, 'rls-' || tag || '-' || sfx || '.example.com', p_domain_status));
  INSERT INTO rls_test.vars VALUES ('domain_' || tag, 'rls-' || tag || '-' || sfx || '.example.com');

  v_id := rls_test.add('favorite_folders', 'id', o, format(
    $q$INSERT INTO public.favorite_folders(user_id, name) VALUES (%L, 'rls folder') RETURNING id::text$q$, o));
  PERFORM rls_test.add('favorites', 'id', o, format(
    $q$INSERT INTO public.favorites(user_id, object_type, record_id, folder_id) VALUES (%L, 'contact', %L, %L) RETURNING id::text$q$,
    o, 'rls-' || tag, v_id));
  PERFORM rls_test.add('timeline_events', 'id', o, format(
    $q$INSERT INTO public.timeline_events(user_id, object_type, record_id, event_type, summary) VALUES (%L, 'contact', %L, 'note', 'rls') RETURNING id::text$q$,
    o, 'rls-' || tag));

  v_obj := rls_test.add('object_metadata', 'id', o, format(
    $q$INSERT INTO public.object_metadata(user_id, name_singular, name_plural, label_singular, label_plural)
       VALUES (%L, %L, %L, 'Rls', 'Rlses') RETURNING id::text$q$, o, 'rlsobj' || tag, 'rlsobjs' || tag));
  INSERT INTO rls_test.vars VALUES ('obj_' || tag, v_obj);
  v_fld := rls_test.add('field_metadata', 'id', o, format(
    $q$INSERT INTO public.field_metadata(object_id, user_id, name, label) VALUES (%L, %L, 'title', 'Title') RETURNING id::text$q$, v_obj, o));
  v_rec := rls_test.add('records', 'id', o, format(
    $q$INSERT INTO public.records(object_id, user_id, data) VALUES (%L, %L, '{"title":"rls secret record"}') RETURNING id::text$q$, v_obj, o));
  INSERT INTO rls_test.vars VALUES ('rec_' || tag, v_rec);
  v_cfd := rls_test.add('custom_field_definitions', 'id', o, format(
    $q$INSERT INTO public.custom_field_definitions(user_id, object_type, key, label) VALUES (%L, 'contacts', 'rls_field', 'Rls') RETURNING id::text$q$, o));
  PERFORM rls_test.add('custom_field_values', 'id', o, format(
    $q$INSERT INTO public.custom_field_values(user_id, object_type, record_id, field_id, value) VALUES (%L, 'contacts', %L, %L, '"x"') RETURNING id::text$q$,
    o, 'rls-' || tag, v_cfd));

  v_role := rls_test.add('roles', 'id', o, format(
    $q$INSERT INTO public.roles(owner_id, name) VALUES (%L, 'rls role') RETURNING id::text$q$, o));
  INSERT INTO rls_test.vars VALUES ('role_' || tag, v_role);
  PERFORM rls_test.add('team_members', 'id', o, format(
    $q$INSERT INTO public.team_members(owner_id, email, role_id, status) VALUES (%L, %L, %L, 'invited') RETURNING id::text$q$,
    o, tag || '-rls-invitee@example.com', v_role));

  v_hook := rls_test.add('webhooks', 'id', o, format(
    $q$INSERT INTO public.webhooks(user_id, url, secret) VALUES (%L, %L, 'rls-signing-secret') RETURNING id::text$q$, o, 'https://example.com/rls-' || tag));
  PERFORM rls_test.add('webhook_deliveries', 'id', o, format(
    $q$INSERT INTO public.webhook_deliveries(webhook_id, event, payload) VALUES (%L, 'contact.created', '{"rls":true}') RETURNING id::text$q$, v_hook));
  PERFORM rls_test.add('api_keys', 'id', o, format(
    $q$INSERT INTO public.api_keys(user_id, name, key_hash, prefix, scopes) VALUES (%L, 'rls key', 'rls-hash', %L, ARRAY['read:contacts']) RETURNING id::text$q$,
    o, 'sk_live_' || tag || '000000'));
  PERFORM rls_test.add('views', 'id', o, format(
    $q$INSERT INTO public.views(user_id, object_type, name) VALUES (%L, 'contacts', 'rls view') RETURNING id::text$q$, o));
  PERFORM rls_test.add('user_ui_preferences', 'key', o, format(
    $q$INSERT INTO public.user_ui_preferences(user_id, kind, key, value) VALUES (%L, 'rls', %L, '{"x":1}')
       ON CONFLICT (user_id, kind, key) DO UPDATE SET value = EXCLUDED.value RETURNING key$q$, o, 'rls-test-' || tag));

  v_asst := rls_test.add('ai_assistants', 'id', o, format(
    $q$INSERT INTO public.ai_assistants(user_id, name) VALUES (%L, 'rls assistant') RETURNING id::text$q$, o));
  v_thread := rls_test.add('ai_threads', 'id', o, format(
    $q$INSERT INTO public.ai_threads(user_id, assistant_id) VALUES (%L, %L) RETURNING id::text$q$, o, v_asst));
  PERFORM rls_test.add('ai_thread_messages', 'id', o, format(
    $q$INSERT INTO public.ai_thread_messages(thread_id, role, content) VALUES (%L, 'user', 'rls secret message') RETURNING id::text$q$, v_thread));
  PERFORM rls_test.add('ai_jobs', 'id', o, format(
    $q$INSERT INTO public.ai_jobs(user_id, kind, input) VALUES (%L, 'batch_respond', '{"prompts":["rls"]}') RETURNING id::text$q$, o));

  v_wf := rls_test.add('workflows', 'id', o, format(
    $q$INSERT INTO public.workflows(user_id, name, trigger_type) VALUES (%L, 'rls workflow', 'MANUAL') RETURNING id::text$q$, o));
  PERFORM rls_test.add('workflow_actions', 'id', o, format(
    $q$INSERT INTO public.workflow_actions(workflow_id, action_type) VALUES (%L, 'CREATE_TASK') RETURNING id::text$q$, v_wf));
  PERFORM rls_test.add('workflow_runs', 'id', o, format(
    $q$INSERT INTO public.workflow_runs(workflow_id, status) VALUES (%L, 'completed') RETURNING id::text$q$, v_wf));
  PERFORM rls_test.add('workflow_versions', 'id', o, format(
    $q$INSERT INTO public.workflow_versions(workflow_id, version) VALUES (%L, 1) RETURNING id::text$q$, v_wf));

  PERFORM rls_test.add('crm_companies', 'id', o, format(
    $q$INSERT INTO public.crm_companies(user_id, name) VALUES (%L, 'Rls Company') RETURNING id::text$q$, o));
  PERFORM rls_test.add('note_targets', 'id', o, format(
    $q$INSERT INTO public.note_targets(user_id, note_id, object_type, record_id) VALUES (%L, gen_random_uuid(), 'contact', %L) RETURNING id::text$q$, o, 'rls-' || tag));
  PERFORM rls_test.add('task_targets', 'id', o, format(
    $q$INSERT INTO public.task_targets(user_id, task_id, object_type, record_id) VALUES (%L, (random() * 1000000000)::int, 'contact', %L) RETURNING id::text$q$, o, 'rls-' || tag));

  -- Optional: a real contact (needs a profiles row for the FK). Used for global_search, team policies and the timeline trigger.
  IF to_regclass('public.contacts') IS NOT NULL AND to_regclass('public.profiles') IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.profiles WHERE id = o) THEN
    BEGIN
      v_id := rls_test.add('contacts', 'id', o, format(
        $q$INSERT INTO public.contacts(first_name, last_name, email, profile_id) VALUES (%L, 'Seeded', %L, %L) RETURNING id::text$q$,
        'Rlsneedle' || tag, 'rls-' || tag || '@example.com', o));
      INSERT INTO rls_test.vars VALUES ('contact_' || tag, v_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'seed: contact for % skipped (%)', tag, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'seed: contact for % skipped (no contacts/profiles table or no profiles row for the user)', tag;
  END IF;
END $fn$;

SELECT rls_test.seed_owner(rls_test.uid_a(), 'a', 'active');
SELECT rls_test.seed_owner(rls_test.uid_b(), 'b', 'pending');

-- contacts are checked through the generic loop only when they exist in the seed table (the seed adds them to rls_test.seed
-- via rls_test.add, so they are covered automatically).

DO $$
DECLARE n int; a uuid := rls_test.uid_a();
BEGIN
  SELECT count(DISTINCT tbl) INTO n FROM rls_test.seed WHERE tbl <> 'contacts';
  IF n < 29 THEN RAISE EXCEPTION 'RLS SETUP: expected to seed 29+ tables, got %', n; END IF;
  -- timeline trigger on contacts: seeding a contact as admin must have produced an insert event for the owner
  IF rls_test.var('contact_a') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.timeline_events WHERE user_id = a AND object_type = 'contact'
                   AND record_id = rls_test.var('contact_a') AND event_type = 'insert') THEN
      RAISE EXCEPTION 'RLS FAIL [timeline]: inserting a contact did not create a timeline_events row (trigger timeline_log_contacts)';
    END IF;
    PERFORM rls_test.ok('timeline trigger writes an insert event for a new contact');
  END IF;
END $$;

-- ============================================================================================
-- 2. Isolation checks: the same loop for A, B and anon
-- ============================================================================================
CREATE FUNCTION rls_test.check_user(p_me uuid, p_other uuid, p_label text, p_other_label text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record; want bigint; got bigint;
BEGIN
  FOR r IN SELECT DISTINCT tbl, key_col FROM rls_test.seed ORDER BY tbl LOOP
    want := cardinality(rls_test.keys(r.tbl, p_me));
    got := rls_test.n_visible(r.tbl, r.key_col, p_me);
    IF got <> want THEN
      RAISE EXCEPTION 'RLS FAIL [%]: % sees only % of its own % seeded row(s) (owner policy too strict, or SELECT not granted)', r.tbl, p_label, got, want;
    END IF;
    got := rls_test.n_visible(r.tbl, r.key_col, p_other);
    IF got <> 0 THEN
      RAISE EXCEPTION 'RLS FAIL [%]: % can SEE % row(s) owned by %', r.tbl, p_label, got, p_other_label;
    END IF;
    got := rls_test.n_updated(r.tbl, r.key_col, p_other);
    IF got <> 0 THEN
      RAISE EXCEPTION 'RLS FAIL [%]: % can UPDATE % row(s) owned by %', r.tbl, p_label, got, p_other_label;
    END IF;
    got := rls_test.n_deleted(r.tbl, r.key_col, p_other);
    IF got <> 0 THEN
      RAISE EXCEPTION 'RLS FAIL [%]: % can DELETE % row(s) owned by %', r.tbl, p_label, got, p_other_label;
    END IF;
    PERFORM rls_test.ok(p_label || ' isolated on ' || r.tbl);
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION rls_test.check_user(uuid, uuid, text, text) TO anon, authenticated;

CREATE FUNCTION rls_test.check_anon() RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record; o uuid; got bigint;
BEGIN
  FOR r IN SELECT DISTINCT tbl, key_col FROM rls_test.seed ORDER BY tbl LOOP
    FOREACH o IN ARRAY ARRAY[rls_test.uid_a(), rls_test.uid_b()] LOOP
      got := rls_test.n_visible(r.tbl, r.key_col, o);
      IF got <> 0 THEN RAISE EXCEPTION 'RLS FAIL [%]: anon can SEE % row(s)', r.tbl, got; END IF;
      got := rls_test.n_updated(r.tbl, r.key_col, o);
      IF got <> 0 THEN RAISE EXCEPTION 'RLS FAIL [%]: anon can UPDATE % row(s)', r.tbl, got; END IF;
      got := rls_test.n_deleted(r.tbl, r.key_col, o);
      IF got <> 0 THEN RAISE EXCEPTION 'RLS FAIL [%]: anon can DELETE % row(s)', r.tbl, got; END IF;
    END LOOP;
    PERFORM rls_test.ok('anon sees nothing on ' || r.tbl);
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION rls_test.check_anon() TO anon, authenticated;

-- 2a. user A
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_a'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_a'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
DO $$
BEGIN
  IF auth.uid() IS DISTINCT FROM rls_test.uid_a() THEN
    RAISE EXCEPTION 'RLS SETUP: auth.uid() does not reflect the simulated JWT (got %)', auth.uid();
  END IF;
  PERFORM rls_test.check_user(rls_test.uid_a(), rls_test.uid_b(), 'user A', 'user B');
END $$;
RESET ROLE;

-- 2b. user B
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_b'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_b'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
DO $$
BEGIN
  PERFORM rls_test.check_user(rls_test.uid_b(), rls_test.uid_a(), 'user B', 'user A');
END $$;
RESET ROLE;

-- 2c. anon
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claim.role', 'anon', true);
DO $$
BEGIN
  IF auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'RLS SETUP: auth.uid() is not null for anon'; END IF;
  PERFORM rls_test.check_anon();
END $$;
RESET ROLE;

-- ============================================================================================
-- 3. Writes with a foreign owner id are rejected (WITH CHECK), secret columns, request_domain, global_search
-- ============================================================================================
-- 3a. user B tries to create rows owned by A
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_b'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_b'), true);
DO $$
DECLARE a uuid := rls_test.uid_a();
BEGIN
  PERFORM rls_test.expect_denied('B inserts crm_companies for A',   format('INSERT INTO public.crm_companies(user_id, name) VALUES (%L, ''x'')', a));
  PERFORM rls_test.expect_denied('B inserts favorites for A',       format('INSERT INTO public.favorites(user_id, object_type, record_id) VALUES (%L, ''contact'', ''zz'')', a));
  PERFORM rls_test.expect_denied('B inserts favorite_folders for A', format('INSERT INTO public.favorite_folders(user_id, name) VALUES (%L, ''x'')', a));
  PERFORM rls_test.expect_denied('B inserts workflows for A',       format('INSERT INTO public.workflows(user_id, name, trigger_type) VALUES (%L, ''x'', ''MANUAL'')', a));
  PERFORM rls_test.expect_denied('B inserts webhooks for A',        format('INSERT INTO public.webhooks(user_id, url, secret) VALUES (%L, ''https://example.com/x'', ''s'')', a));
  PERFORM rls_test.expect_denied('B inserts api_keys for A',        format('INSERT INTO public.api_keys(user_id, name, key_hash, prefix) VALUES (%L, ''x'', ''h'', ''sk_live_zzzzzzzz'')', a));
  PERFORM rls_test.expect_denied('B inserts views for A',           format('INSERT INTO public.views(user_id, object_type, name) VALUES (%L, ''contacts'', ''x'')', a));
  PERFORM rls_test.expect_denied('B inserts user_ui_preferences for A', format('INSERT INTO public.user_ui_preferences(user_id, kind, key) VALUES (%L, ''rls'', ''zz'')', a));
  PERFORM rls_test.expect_denied('B inserts ai_assistants for A',   format('INSERT INTO public.ai_assistants(user_id, name) VALUES (%L, ''x'')', a));
  PERFORM rls_test.expect_denied('B inserts roles for A',           format('INSERT INTO public.roles(owner_id, name) VALUES (%L, ''x'')', a));
  PERFORM rls_test.expect_denied('B inserts records into A''s object', format('INSERT INTO public.records(object_id, user_id, data) VALUES (%L, %L, ''{}'')', rls_test.var('obj_a'), a));
  PERFORM rls_test.expect_denied('B inserts timeline_events for A', format('INSERT INTO public.timeline_events(user_id, object_type, record_id, event_type) VALUES (%L, ''contact'', ''zz'', ''note'')', a));
  PERFORM rls_test.expect_denied('B inserts whitelabel_branding for A', format('INSERT INTO public.whitelabel_branding(owner_id, config) VALUES (%L, ''{}'')', a));
  PERFORM rls_test.expect_denied('B inserts team_members into A''s team', format('INSERT INTO public.team_members(owner_id, email, status) VALUES (%L, ''evil@example.com'', ''active'')', a));
  PERFORM rls_test.expect_denied('B inserts ai_jobs (no insert policy)', format('INSERT INTO public.ai_jobs(user_id, kind) VALUES (%L, ''batch_respond'')', rls_test.uid_b()));
  PERFORM rls_test.expect_denied('B inserts webhook_deliveries (no insert policy)', 'INSERT INTO public.webhook_deliveries(webhook_id, event, payload) SELECT id, ''x'', ''{}'' FROM public.webhooks LIMIT 1');
  -- B cannot re-parent its own row to A (UPDATE ... WITH CHECK)
  PERFORM rls_test.expect_denied('B re-parents own crm_company to A', format('UPDATE public.crm_companies SET user_id = %L WHERE user_id = %L', a, rls_test.uid_b()));
END $$;
RESET ROLE;

-- 3b. anon cannot write either
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
SELECT set_config('request.jwt.claim.sub', '', true);
DO $$
BEGIN
  PERFORM rls_test.expect_denied('anon inserts crm_companies', format('INSERT INTO public.crm_companies(user_id, name) VALUES (%L, ''x'')', rls_test.uid_a()));
  PERFORM rls_test.expect_denied('anon inserts favorites',     format('INSERT INTO public.favorites(user_id, object_type, record_id) VALUES (%L, ''contact'', ''zz'')', rls_test.uid_a()));
  PERFORM rls_test.expect_denied('anon inserts domains',       format('INSERT INTO public.domains(tenant_id, domain, verification_token) VALUES (%L, ''anon-x.example.com'', ''t'')', rls_test.uid_a()));
  -- anon cannot call the SECURITY DEFINER / authenticated-only functions
  PERFORM rls_test.expect_denied('anon calls request_domain',  $q$SELECT public.request_domain('anon-attempt.example.com')$q$);
  PERFORM rls_test.expect_denied('anon calls global_search',   $q$SELECT * FROM public.global_search('a', 5)$q$);
  PERFORM rls_test.expect_denied('anon calls has_object_perm', format('SELECT public.has_object_perm(%L, ''contacts'', ''read'')', rls_test.uid_a()));
  PERFORM rls_test.expect_denied('anon calls mask_record_data', format('SELECT public.mask_record_data(%L, ''contacts'', ''{}''::jsonb)', rls_test.uid_a()));
  -- secret columns
  PERFORM rls_test.expect_denied('anon selects webhooks.secret', 'SELECT secret FROM public.webhooks');
  PERFORM rls_test.expect_denied('anon selects api_keys.key_hash', 'SELECT key_hash FROM public.api_keys');
END $$;
RESET ROLE;

-- 3c. user A: secrets, direct domain writes, request_domain, global_search
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_a'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_a'), true);
DO $$
DECLARE
  a uuid := rls_test.uid_a();
  b uuid := rls_test.uid_b();
  r public.domains;
  new_host text := 'rls-new-' || rls_test.var('sfx') || '.example.com';
  n bigint;
BEGIN
  -- secret columns are not selectable (also not through SELECT *), while the safe columns are
  PERFORM rls_test.expect_denied('A selects webhooks.secret',      'SELECT secret FROM public.webhooks');
  PERFORM rls_test.expect_denied('A selects * from webhooks',      'SELECT * FROM public.webhooks');
  PERFORM rls_test.expect_denied('A selects api_keys.key_hash',    'SELECT key_hash FROM public.api_keys');
  PERFORM rls_test.expect_denied('A selects * from api_keys',      'SELECT * FROM public.api_keys');
  PERFORM rls_test.expect_denied('A filters on webhooks.secret',   'SELECT id FROM public.webhooks WHERE secret IS NOT NULL');
  PERFORM rls_test.expect_denied('A updates webhooks.secret RETURNING it', format('UPDATE public.webhooks SET url = url WHERE user_id = %L RETURNING secret', a));
  EXECUTE 'SELECT count(*) FROM public.webhooks WHERE user_id = $1' INTO n USING a;
  IF n < 1 THEN RAISE EXCEPTION 'RLS FAIL [webhooks]: A cannot read its own non-secret webhook columns'; END IF;
  EXECUTE 'SELECT count(id) FROM public.api_keys WHERE user_id = $1' INTO n USING a;
  IF n < 1 THEN RAISE EXCEPTION 'RLS FAIL [api_keys]: A cannot read its own non-secret api_keys columns'; END IF;
  PERFORM rls_test.ok('A reads non-secret webhook/api_keys columns only');

  -- domains: no direct INSERT/UPDATE for authenticated (only request_domain)
  PERFORM rls_test.expect_denied('A inserts into domains directly',
    format('INSERT INTO public.domains(tenant_id, domain, verification_token) VALUES (%L, ''direct-%s.example.com'', ''t'')', a, rls_test.var('sfx')));
  PERFORM rls_test.expect_no_rows('A self-verifies own domain',
    format('UPDATE public.domains SET status = ''active'', dns_verified = true WHERE tenant_id = %L', a));
  PERFORM rls_test.expect_no_rows('A deletes B''s domain', format('DELETE FROM public.domains WHERE tenant_id = %L', b));

  -- request_domain
  BEGIN
    SELECT * INTO r FROM public.request_domain('  ' || upper(new_host) || '. ');
    IF r.tenant_id <> a OR r.status <> 'pending' OR r.dns_verified IS TRUE OR r.domain <> new_host OR length(r.verification_token) < 40 THEN
      RAISE EXCEPTION 'RLS FAIL [request_domain]: unexpected row (tenant %, status %, domain %)', r.tenant_id, r.status, r.domain;
    END IF;
    PERFORM rls_test.ok('request_domain creates a normalised pending domain for the caller');
    PERFORM rls_test.expect_error('request_domain duplicate (case-insensitive)', format('SELECT public.request_domain(%L)', upper(new_host)), '23505');
    PERFORM rls_test.expect_error('request_domain other user''s host',
      format('SELECT public.request_domain(%L)', rls_test.var('domain_b')), '23505');
  EXCEPTION WHEN SQLSTATE '54000' THEN
    RAISE NOTICE 'request_domain happy-path skipped: user A already owns 10 domains';
  END;
  PERFORM rls_test.expect_error('request_domain invalid host', $q$SELECT public.request_domain('not a host')$q$, '22023');
  PERFORM rls_test.expect_error('request_domain single label', $q$SELECT public.request_domain('localhost')$q$, '22023');
  PERFORM rls_test.expect_error('request_domain reserved smartcrm.vip', $q$SELECT public.request_domain('evil.smartcrm.vip')$q$, '22023');
  PERFORM rls_test.expect_error('request_domain reserved netlify.app', $q$SELECT public.request_domain('evil.netlify.app')$q$, '22023');
  PERFORM rls_test.expect_error('request_domain null', $q$SELECT public.request_domain(NULL)$q$, '22023');
END $$;

DO $$
DECLARE n bigint; needle text := 'Rlsneedlea';
BEGIN
  BEGIN
  -- global_search: RLS of the caller applies (SECURITY INVOKER)
  IF rls_test.var('contact_a') IS NOT NULL THEN
    SELECT count(*) INTO n FROM public.global_search(needle, 10) WHERE object_type = 'contact' AND record_id = rls_test.var('contact_a');
    IF n <> 1 THEN RAISE EXCEPTION 'RLS FAIL [global_search]: A does not find its own seeded contact (% hits)', n; END IF;
    SELECT count(*) INTO n FROM public.global_search('Rlsneedleb', 100) WHERE record_id = rls_test.var('contact_b');
    IF n <> 0 THEN RAISE EXCEPTION 'RLS FAIL [global_search]: A finds B''s contact (% hit(s))', n; END IF;
    PERFORM rls_test.ok('global_search returns only the caller''s rows');
  ELSE
    RAISE NOTICE 'global_search data checks skipped (no contacts seeded)';
  END IF;
  SELECT count(*) INTO n FROM public.global_search('   ', 10);
  IF n <> 0 THEN RAISE EXCEPTION 'RLS FAIL [global_search]: blank query returned % rows', n; END IF;
  SELECT count(*) INTO n FROM public.global_search('Rlsneedlea', 100000);   -- limit is clamped, must not error
  PERFORM rls_test.ok('global_search blank query / limit clamp');
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = 'P0001' AND SQLERRM LIKE 'RLS FAIL%' THEN RAISE; END IF;
    RAISE EXCEPTION 'RLS FAIL [global_search]: the function itself raised an error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
  END;
END $$;
RESET ROLE;

-- 3d. get_branding_for_host: anon may call it, only ACTIVE domains resolve
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
SELECT set_config('request.jwt.claim.sub', '', true);
DO $$
DECLARE r jsonb;
BEGIN
  r := public.get_branding_for_host(rls_test.var('domain_a'));
  IF r IS NULL OR r ->> 'brand' <> 'rls-brand-a' THEN
    RAISE EXCEPTION 'RLS FAIL [get_branding_for_host]: active domain of A did not return A''s branding (got %)', r;
  END IF;
  r := public.get_branding_for_host(upper(rls_test.var('domain_a')));
  IF r IS NULL THEN RAISE EXCEPTION 'RLS FAIL [get_branding_for_host]: lookup is not case-insensitive'; END IF;
  IF public.get_branding_for_host(rls_test.var('domain_b')) IS NOT NULL THEN
    RAISE EXCEPTION 'RLS FAIL [get_branding_for_host]: PENDING domain of B resolved to branding';
  END IF;
  IF public.get_branding_for_host('no-such-host-' || rls_test.var('sfx') || '.example.com') IS NOT NULL THEN
    RAISE EXCEPTION 'RLS FAIL [get_branding_for_host]: unknown host returned branding';
  END IF;
  PERFORM rls_test.ok('get_branding_for_host: active only, case-insensitive, unknown -> null');
END $$;
RESET ROLE;

UPDATE public.domains SET status = 'suspended' WHERE domain = rls_test.var('domain_a');
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
DO $$
BEGIN
  IF public.get_branding_for_host(rls_test.var('domain_a')) IS NOT NULL THEN
    RAISE EXCEPTION 'RLS FAIL [get_branding_for_host]: suspended domain still resolves to branding';
  END IF;
  PERFORM rls_test.ok('get_branding_for_host: suspended domain -> null');
END $$;
RESET ROLE;

-- ============================================================================================
-- 4. Permissions: has_object_perm / has_field_perm / mask_record_data / team policies
--    B becomes an ACTIVE member of A's workspace with a limited role.
-- ============================================================================================
INSERT INTO public.team_members(owner_id, member_id, email, role_id, status)
VALUES (rls_test.uid_a(), rls_test.uid_b(), 'member-b-' || rls_test.var('sfx') || '@example.com', rls_test.var('role_a')::uuid, 'active');
INSERT INTO public.role_object_permissions(role_id, object_type, can_read, can_create, can_update, can_delete)
VALUES (rls_test.var('role_a')::uuid, 'contacts', true, false, false, false);
INSERT INTO public.role_object_permissions(role_id, object_type, can_read, can_update)
VALUES (rls_test.var('role_a')::uuid, rls_test.var('obj_a'), true, false);
INSERT INTO public.role_field_permissions(role_id, object_type, field, can_read, can_write)
VALUES (rls_test.var('role_a')::uuid, 'contacts', 'email', false, false);

-- 4a. as B (member of A)
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_b'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_b'), true);
DO $$
DECLARE a uuid := rls_test.uid_a(); b uuid := rls_test.uid_b(); m jsonb; n bigint;
BEGIN
  IF NOT public.has_object_perm(a, 'contacts', 'read')   THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: member with can_read gets false'; END IF;
  IF public.has_object_perm(a, 'contacts', 'create')     THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: member without can_create gets true'; END IF;
  IF public.has_object_perm(a, 'contacts', 'update')     THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: member without can_update gets true'; END IF;
  IF public.has_object_perm(a, 'contacts', 'delete')     THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: member without can_delete gets true'; END IF;
  IF public.has_object_perm(a, 'deals', 'read')          THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: object without a permission row must be denied'; END IF;
  IF public.has_object_perm(a, 'contacts', 'bogus')      THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: unknown action must be denied'; END IF;
  IF NOT public.has_object_perm(b, 'anything', 'delete') THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: owner must always be allowed'; END IF;
  PERFORM rls_test.ok('has_object_perm: member / non-member / owner semantics');

  IF NOT EXISTS (SELECT 1 FROM public.visible_owner_ids() o WHERE o = a) THEN
    RAISE EXCEPTION 'RLS FAIL [visible_owner_ids]: active member does not see the owner id';
  END IF;
  IF public.member_role_id(a) IS DISTINCT FROM rls_test.var('role_a')::uuid THEN
    RAISE EXCEPTION 'RLS FAIL [member_role_id]: wrong role id for the member';
  END IF;
  PERFORM rls_test.ok('visible_owner_ids / member_role_id for an active member');

  -- field permissions: email is unreadable, everything else defaults to allowed
  IF public.has_field_perm(a, 'contacts', 'email', 'read') THEN RAISE EXCEPTION 'RLS FAIL [has_field_perm]: denied field is readable'; END IF;
  IF NOT public.has_field_perm(a, 'contacts', 'first_name', 'read') THEN RAISE EXCEPTION 'RLS FAIL [has_field_perm]: field without a row must default to allowed'; END IF;
  m := public.mask_record_data(a, 'contacts', '{"email":"x@y.z","first_name":"F"}'::jsonb);
  IF m ? 'email' OR m ->> 'first_name' <> 'F' THEN RAISE EXCEPTION 'RLS FAIL [mask_record_data]: member got % (email must be stripped, first_name kept)', m; END IF;
  PERFORM rls_test.ok('has_field_perm / mask_record_data strip denied fields for a member');

  -- records of a custom object: read granted, update not
  IF rls_test.n_visible('records', 'id', a) <> 1 THEN RAISE EXCEPTION 'RLS FAIL [records]: member with can_read cannot read the owner''s record (records_member_select)'; END IF;
  IF rls_test.n_updated('records', 'id', a) <> 0 THEN RAISE EXCEPTION 'RLS FAIL [records]: member without can_update CAN update the owner''s record'; END IF;
  IF rls_test.n_deleted('records', 'id', a) <> 0 THEN RAISE EXCEPTION 'RLS FAIL [records]: member can DELETE the owner''s record (no member delete policy expected)'; END IF;
  -- the owner's other custom data stays hidden (no role row for it)
  IF rls_test.n_visible('field_metadata', 'id', a) <> 1 THEN RAISE EXCEPTION 'RLS FAIL [field_metadata]: member cannot read field definitions of an object it may read'; END IF;
  IF rls_test.n_visible('workflows', 'id', a) <> 0 THEN RAISE EXCEPTION 'RLS FAIL [workflows]: team membership leaks workflows'; END IF;
  IF rls_test.n_visible('webhooks', 'id', a) <> 0 THEN RAISE EXCEPTION 'RLS FAIL [webhooks]: team membership leaks webhooks'; END IF;
  IF rls_test.n_visible('api_keys', 'id', a) <> 0 THEN RAISE EXCEPTION 'RLS FAIL [api_keys]: team membership leaks api_keys'; END IF;
  PERFORM rls_test.ok('member policies: records read-only per role, nothing else leaks');

  -- contacts (legacy table) through team_member_select, if present and seeded
  IF rls_test.var('contact_a') IS NOT NULL THEN
    IF rls_test.n_visible('contacts', 'id', a) <> 1 THEN
      RAISE NOTICE 'NOTE [contacts]: member with can_read does not see the owner''s contact (policy team_member_select missing or contacts.profile_id is not uuid)';
    ELSE
      PERFORM rls_test.ok('contacts: team_member_select grants read to a member with can_read');
    END IF;
    IF rls_test.n_updated('contacts', 'id', a) <> 0 THEN RAISE EXCEPTION 'RLS FAIL [contacts]: member without can_update CAN update the owner''s contact'; END IF;
    IF rls_test.n_deleted('contacts', 'id', a) <> 0 THEN RAISE EXCEPTION 'RLS FAIL [contacts]: member CAN delete the owner''s contact'; END IF;
    PERFORM rls_test.ok('contacts: member cannot update/delete');
  END IF;
END $$;
RESET ROLE;

-- 4a2. (only when migration 20261115100000 is applied) a role that hides a field of the custom object:
--      raw records rows disappear for the member, the masked view/function still returns the row without that field
DO $$
BEGIN
  IF to_regclass('public.records_masked') IS NOT NULL THEN
    INSERT INTO public.role_field_permissions(role_id, object_type, field, can_read, can_write)
    VALUES (rls_test.var('role_a')::uuid, rls_test.var('obj_a'), 'title', false, false);
  END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_b'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_b'), true);
DO $$
DECLARE d jsonb; n bigint;
BEGIN
  IF to_regclass('public.records_masked') IS NULL THEN
    RAISE NOTICE 'records_masked checks skipped (migration 20261115100000 not applied)';
    RETURN;
  END IF;
  IF rls_test.n_visible('records', 'id', rls_test.uid_a()) <> 0 THEN
    RAISE EXCEPTION 'RLS FAIL [records]: member whose role hides a field can still read raw records rows (field read restriction bypass)';
  END IF;
  SELECT count(*), max(data::text)::jsonb INTO n, d FROM public.records_masked WHERE id = rls_test.var('rec_a')::uuid;
  IF n <> 1 THEN RAISE EXCEPTION 'RLS FAIL [records_masked]: restricted member sees % masked rows (expected 1)', n; END IF;
  IF d ? 'title' THEN RAISE EXCEPTION 'RLS FAIL [records_masked]: hidden field "title" is present in the masked view: %', d; END IF;
  PERFORM rls_test.ok('records_masked hides restricted fields, raw table is closed to restricted members');
END $$;
RESET ROLE;
DELETE FROM public.role_field_permissions WHERE role_id = rls_test.var('role_a')::uuid AND object_type = rls_test.var('obj_a');

-- 4b. as A (owner): unmasked, and A is not a member of B's workspace
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_a'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_a'), true);
DO $$
DECLARE m jsonb;
BEGIN
  m := public.mask_record_data(rls_test.uid_a(), 'contacts', '{"email":"x@y.z","first_name":"F"}'::jsonb);
  IF NOT (m ? 'email') THEN RAISE EXCEPTION 'RLS FAIL [mask_record_data]: owner data was masked'; END IF;
  IF public.has_object_perm(rls_test.uid_b(), 'contacts', 'read') THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: A is not a member of B but got true'; END IF;
  IF EXISTS (SELECT 1 FROM public.visible_owner_ids() o WHERE o = rls_test.uid_b()) THEN RAISE EXCEPTION 'RLS FAIL [visible_owner_ids]: A sees B without membership'; END IF;
  -- members can read their own team_members row but the owner's role permission tables stay private
  PERFORM rls_test.ok('owner is unmasked; no reverse membership');
END $$;
RESET ROLE;

-- 4c. raise the member's grants, then revoke the membership
UPDATE public.role_object_permissions SET can_update = true WHERE role_id = rls_test.var('role_a')::uuid AND object_type = rls_test.var('obj_a');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_b'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_b'), true);
DO $$
BEGIN
  IF rls_test.n_updated('records', 'id', rls_test.uid_a()) <> 1 THEN
    RAISE EXCEPTION 'RLS FAIL [records]: member with can_update cannot update the owner''s record (records_member_update)';
  END IF;
  PERFORM rls_test.ok('records: member with can_update can update');
END $$;
RESET ROLE;

UPDATE public.team_members SET status = 'disabled' WHERE owner_id = rls_test.uid_a() AND member_id = rls_test.uid_b();
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls_test.uid_b'), 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls_test.uid_b'), true);
DO $$
DECLARE a uuid := rls_test.uid_a();
BEGIN
  IF public.has_object_perm(a, 'contacts', 'read') THEN RAISE EXCEPTION 'RLS FAIL [has_object_perm]: disabled member still has access'; END IF;
  IF EXISTS (SELECT 1 FROM public.visible_owner_ids() o WHERE o = a) THEN RAISE EXCEPTION 'RLS FAIL [visible_owner_ids]: disabled member still sees the owner'; END IF;
  IF rls_test.n_visible('records', 'id', a) <> 0 THEN RAISE EXCEPTION 'RLS FAIL [records]: disabled member still reads the owner''s record'; END IF;
  IF rls_test.var('contact_a') IS NOT NULL AND rls_test.n_visible('contacts', 'id', a) <> 0 THEN
    RAISE EXCEPTION 'RLS FAIL [contacts]: disabled member still reads the owner''s contact';
  END IF;
  PERFORM rls_test.ok('disabled member loses all access');
END $$;
RESET ROLE;

-- ============================================================================================
-- 5. Summary, then roll everything back
-- ============================================================================================
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM rls_test.tally;
  RAISE NOTICE 'RLS TESTS PASSED: % assertions', n;
END $$;

ROLLBACK;

SELECT 'RLS TESTS PASSED'::text AS result;
