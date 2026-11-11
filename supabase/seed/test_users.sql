-- =====================================================================================
-- Test users A and B + sample CRM data for staging
-- Run ONLY on a staging project / Supabase branch, never on production.
--
-- STEP 1  Create the two auth users (SQL cannot create them safely; GoTrue hashes the password).
--   Option A (dashboard): Authentication > Users > Add user > Create new user, tick "Auto Confirm User".
--       A: crm-test-a@example.com   B: crm-test-b@example.com   (use strong passwords, keep them in your password manager)
--   Option B (Auth admin API; the service-role key is a secret, never commit it or paste it into chat):
--       export SUPABASE_URL=https://<ref>.supabase.co
--       export SUPABASE_SERVICE_ROLE_KEY=...        # Project settings > API
--       for who in a b; do
--         curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
--           -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
--           -H "Content-Type: application/json" \
--           -d "{\"email\":\"crm-test-$who@example.com\",\"password\":\"<choose-a-password>\",\"email_confirm\":true}" \
--           | jq '{id, email}'
--       done
--   Copy the two user ids if you also want to run supabase/tests/rls.sql.
--
-- STEP 2  Run this file (SQL editor or: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed/test_users.sql).
--   It looks the users up by e-mail (edit the two e-mails below if you chose others) and seeds, for each of them:
--   5 contacts, 5 deals, 5 tasks, 3 notes (with a rich body when the columns exist), 3 CRM companies.
--   Idempotent: every seeded row is identified by a marker ("[seed]" titles / seed-*@smartcrm-test.invalid e-mails),
--   so re-running inserts nothing new. Missing tables or columns are skipped with a NOTICE.
--
-- STEP 3  (optional) Give the users whatever plan/entitlement the app needs for AI tools (check Settings > Billing in the app
--   or your entitlements table); the smoke test reports a SKIP when a route answers 403 for entitlement reasons.
--
-- CLEAN UP  delete from the seeded markers, e.g.
--   DELETE FROM public.contacts WHERE email LIKE 'seed-%@smartcrm-test.invalid';
--   DELETE FROM public.deals    WHERE title LIKE '[seed]%';   (same for tasks.title, notes.content, crm_companies.name)
-- =====================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.has_col(p_tbl text, p_col text) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = p_tbl AND column_name = p_col)
$$;

-- Inserts one row built from p_data (jsonb) when no row with p_where_col = p_where_val exists.
-- Only keys that are real columns are used; types are converted by jsonb_populate_record.
CREATE OR REPLACE FUNCTION pg_temp.seed_row(p_tbl text, p_where_col text, p_where_val text, p_data jsonb) RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  cols text;
  found boolean;
BEGIN
  IF to_regclass('public.' || p_tbl) IS NULL THEN
    RAISE NOTICE 'seed: table public.% does not exist, skipped', p_tbl;
    RETURN false;
  END IF;
  IF NOT pg_temp.has_col(p_tbl, p_where_col) THEN
    RAISE NOTICE 'seed: public.%.% does not exist, skipped', p_tbl, p_where_col;
    RETURN false;
  END IF;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I::text = $1)', p_tbl, p_where_col) INTO found USING p_where_val;
  IF found THEN RETURN false; END IF;

  SELECT string_agg(format('%I', k), ', ') INTO cols
  FROM jsonb_object_keys(p_data) AS k
  WHERE pg_temp.has_col(p_tbl, k);
  IF cols IS NULL THEN RETURN false; END IF;

  EXECUTE format('INSERT INTO public.%1$I (%2$s) SELECT %2$s FROM jsonb_populate_record(NULL::public.%1$I, $1)', p_tbl, cols) USING p_data;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'seed: % row "%" skipped (%)', p_tbl, p_where_val, SQLERRM;
  RETURN false;
END $$;

DO $$
DECLARE
  -- >>> edit if you created the users with other e-mails <<<
  emails text[] := ARRAY['crm-test-a@example.com', 'crm-test-b@example.com'];
  tags   text[] := ARRAY['a', 'b'];
  stages text[] := ARRAY['lead', 'qualified', 'proposal', 'negotiation', 'won'];
  i int; n int; uid uuid; tag text; made int;
  total int := 0;
BEGIN
  FOR i IN 1 .. 2 LOOP
    SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(emails[i]);
    tag := tags[i];
    IF uid IS NULL THEN
      RAISE NOTICE 'seed: auth user % not found, skipped (create it first, see STEP 1)', emails[i];
      CONTINUE;
    END IF;
    made := 0;

    -- the CRM tables reference profiles(id); make sure the row exists
    IF to_regclass('public.profiles') IS NOT NULL THEN
      BEGIN
        INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'seed: could not create profiles row for % (%)', emails[i], SQLERRM;
      END;
    END IF;

    FOR n IN 1 .. 5 LOOP
      IF pg_temp.seed_row('contacts', 'email', format('seed-%s-%s@smartcrm-test.invalid', tag, n), jsonb_build_object(
          'first_name', format('Seed%s', n), 'last_name', format('Contact-%s', upper(tag)),
          'email', format('seed-%s-%s@smartcrm-test.invalid', tag, n),
          'phone', format('+1555010%s0%s', i, n), 'company', format('Seed Company %s', n),
          'status', 'active', 'source', 'seed', 'profile_id', uid)) THEN made := made + 1; END IF;

      IF pg_temp.seed_row('deals', 'title', format('[seed] Deal %s-%s', upper(tag), n), jsonb_build_object(
          'title', format('[seed] Deal %s-%s', upper(tag), n), 'value', n * 1500, 'stage', stages[n],
          'probability', n * 15, 'status', 'open', 'profile_id', uid)) THEN made := made + 1; END IF;

      IF pg_temp.seed_row('tasks', 'title', format('[seed] Task %s-%s', upper(tag), n), jsonb_build_object(
          'title', format('[seed] Task %s-%s', upper(tag), n), 'description', 'Seeded by supabase/seed/test_users.sql',
          'status', CASE WHEN n % 2 = 0 THEN 'completed' ELSE 'pending' END,
          'priority', (ARRAY['low', 'medium', 'high'])[1 + n % 3], 'profile_id', uid)) THEN made := made + 1; END IF;
    END LOOP;

    FOR n IN 1 .. 3 LOOP
      IF pg_temp.seed_row('notes', 'content', format('[seed] Note %s-%s', upper(tag), n), jsonb_build_object(
          'title', format('Seed note %s', n), 'content', format('[seed] Note %s-%s', upper(tag), n),
          'body_text', format('[seed] Note %s-%s', upper(tag), n),
          'body_json', jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object(
              'type', 'paragraph', 'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', format('[seed] Note %s-%s', upper(tag), n)))))),
          'type', 'general', 'profile_id', uid)) THEN made := made + 1; END IF;

      IF pg_temp.seed_row('crm_companies', 'name', format('[seed] Acme %s-%s', upper(tag), n), jsonb_build_object(
          'name', format('[seed] Acme %s-%s', upper(tag), n), 'domain', format('seed-%s-%s.example.com', tag, n),
          'industry', 'Software', 'user_id', uid)) THEN made := made + 1; END IF;
    END LOOP;

    RAISE NOTICE 'seed: % -> % new row(s) (user id %)', emails[i], made, uid;
    total := total + made;
  END LOOP;
  RAISE NOTICE 'seed: done, % row(s) inserted in total (0 on a re-run is expected)', total;
END $$;

COMMIT;
