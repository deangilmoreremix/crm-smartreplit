-- Timeline events + rich notes (stream S4). Idempotent; every table touch is guarded.

CREATE TABLE IF NOT EXISTS public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  object_type text NOT NULL,
  record_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('insert','update','delete','note','task','email','ai')),
  actor uuid,
  diff jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timeline_events_record_idx
  ON public.timeline_events (object_type, record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS timeline_events_user_created_idx
  ON public.timeline_events (user_id, created_at DESC);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS timeline_events_owner_select ON public.timeline_events;
CREATE POLICY timeline_events_owner_select ON public.timeline_events
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- Clients may log their own custom events (note/email/ai); triggers bypass RLS.
DROP POLICY IF EXISTS timeline_events_owner_insert ON public.timeline_events;
CREATE POLICY timeline_events_owner_insert ON public.timeline_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

GRANT SELECT, INSERT ON public.timeline_events TO authenticated;

-- Realtime (only if the publication exists and the table is not already in it).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'timeline_events'
     ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events';
  END IF;
END $$;

-- Rich note columns; the existing `content` text column keeps working.
DO $$
BEGIN
  IF to_regclass('public.notes') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS body_json jsonb';
    EXECUTE 'ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS body_text text';
  END IF;
END $$;

-- Generic trigger: TG_ARGV[0] = object type label (e.g. 'contact').
CREATE OR REPLACE FUNCTION public.log_timeline_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  obj text := coalesce(TG_ARGV[0], TG_TABLE_NAME);
  old_j jsonb;
  new_j jsonb;
  row_j jsonb;
  d jsonb := '{}'::jsonb;
  k text;
  owner uuid;
  act uuid;
  ev text;
  rec text;
  rtype text := obj;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_j := to_jsonb(NEW); row_j := new_j; ev := 'insert';
  ELSIF TG_OP = 'DELETE' THEN
    old_j := to_jsonb(OLD); row_j := old_j; ev := 'delete';
  ELSE
    old_j := to_jsonb(OLD); new_j := to_jsonb(NEW); row_j := new_j; ev := 'update';
    FOR k IN SELECT jsonb_object_keys(new_j) UNION SELECT jsonb_object_keys(old_j) LOOP
      IF k <> 'updated_at' AND (old_j -> k) IS DISTINCT FROM (new_j -> k) THEN
        d := d || jsonb_build_object(k, jsonb_build_object('old', old_j -> k, 'new', new_j -> k));
      END IF;
    END LOOP;
    IF d = '{}'::jsonb THEN
      RETURN NULL;  -- nothing but updated_at changed
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    d := new_j - 'updated_at';
  ELSIF TG_OP = 'DELETE' THEN
    d := old_j - 'updated_at';
  END IF;

  rec := row_j ->> 'id';

  -- Notes are attached to their contact/deal and logged as 'note' events.
  IF TG_TABLE_NAME = 'notes' THEN
    IF row_j ->> 'contact_id' IS NOT NULL THEN
      rtype := 'contact'; rec := row_j ->> 'contact_id';
    ELSIF row_j ->> 'deal_id' IS NOT NULL THEN
      rtype := 'deal'; rec := row_j ->> 'deal_id';
    END IF;
    IF TG_OP = 'INSERT' THEN ev := 'note'; END IF;
    -- keep payload small: drop the rich body from the diff
    d := d - 'body_json';
  END IF;

  act := coalesce(auth.uid(), nullif(current_setting('app.actor', true), '')::uuid);
  owner := coalesce(
    nullif(row_j ->> 'profile_id', '')::uuid,
    nullif(row_j ->> 'user_id', '')::uuid,
    act
  );
  IF owner IS NULL OR rec IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.timeline_events (user_id, object_type, record_id, event_type, actor, diff, summary)
  VALUES (owner, rtype, rec, ev, act, d, initcap(obj) || ' ' || CASE ev WHEN 'insert' THEN 'created' WHEN 'delete' THEN 'deleted' WHEN 'note' THEN 'note added' ELSE 'updated' END);

  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.log_timeline_event() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
    ('contacts','contact'), ('deals','deal'), ('tasks','task'),
    ('notes','note'), ('companies','company')
  ) AS v(tbl, lbl)
  LOOP
    IF to_regclass('public.' || t.tbl) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS timeline_log_%1$s ON public.%1$I', t.tbl);
      EXECUTE format(
        'CREATE TRIGGER timeline_log_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I '
        'FOR EACH ROW EXECUTE FUNCTION public.log_timeline_event(%2$L)', t.tbl, t.lbl);
    END IF;
  END LOOP;
END $$;
