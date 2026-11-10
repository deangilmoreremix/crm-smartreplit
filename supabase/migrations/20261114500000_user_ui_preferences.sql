-- Per-user UI preferences (dashboard layout, saved views, ...). Idempotent: another migration
-- may create the same table, so every statement is guarded.
CREATE TABLE IF NOT EXISTS public.user_ui_preferences (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, key)
);

ALTER TABLE public.user_ui_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ui_preferences'
      AND policyname = 'user_ui_preferences_owner_select'
  ) THEN
    CREATE POLICY user_ui_preferences_owner_select ON public.user_ui_preferences
      FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ui_preferences'
      AND policyname = 'user_ui_preferences_owner_insert'
  ) THEN
    CREATE POLICY user_ui_preferences_owner_insert ON public.user_ui_preferences
      FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ui_preferences'
      AND policyname = 'user_ui_preferences_owner_update'
  ) THEN
    CREATE POLICY user_ui_preferences_owner_update ON public.user_ui_preferences
      FOR UPDATE TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ui_preferences'
      AND policyname = 'user_ui_preferences_owner_delete'
  ) THEN
    CREATE POLICY user_ui_preferences_owner_delete ON public.user_ui_preferences
      FOR DELETE TO authenticated USING (user_id = (select auth.uid()));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ui_preferences TO authenticated;
