-- Waits (long DELAY / WAIT_FOR_EVENT / FORM) inside IF_ELSE / ITERATOR branches.
-- `cursor` holds the path of container frames from the top-level step list down to the paused
-- step (NULL for top-level waits), so the runner can resume at that spot and continue the
-- remaining sibling steps / iterations. Shape: [{kind:'if',stepId,branch} | {kind:'iter',stepId,index,items,iterations}].
-- Idempotent and guarded: safe to re-run, and a no-op if the table does not exist yet.
DO $$
BEGIN
  IF to_regclass('public.workflow_run_waits') IS NOT NULL THEN
    ALTER TABLE public.workflow_run_waits ADD COLUMN IF NOT EXISTS cursor JSONB;
    COMMENT ON COLUMN public.workflow_run_waits.cursor IS
      'Resumable path to a wait nested in IF_ELSE/ITERATOR branches (NULL = top-level step_id)';
  END IF;
END $$;
