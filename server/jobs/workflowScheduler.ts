/**
 * Netlify SCHEDULED function (every minute): runs due cron workflows, resumes delayed /
 * timed-out waits, and drains workflow_event_queue (record changes made outside the API).
 * Built with `npm run build:workflow-scheduler` into netlify/functions/workflow-scheduler.mjs.
 *
 * Netlify scheduled functions have a 30s limit, so the tick stops picking up new work after
 * TICK_BUDGET_MS. A run that is still executing when the function is cut off stays 'running'.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  nextCronRun,
  runWorkflow,
  resumeDueWaits,
  triggerWorkflowsForEvent,
  type WorkflowTriggerType,
} from '@smartcrm/workflows';
import { supabase as serverSupabase } from '../supabase';

export const TICK_BUDGET_MS = 22_000;
export const QUEUE_GRACE_MS = 10_000;
export const MAX_DUE_PER_TICK = 25;
export const MAX_EVENTS_PER_TICK = 50;

export interface SchedulerDeps {
  db: SupabaseClient;
  now?: () => Date;
  runWorkflow?: typeof runWorkflow;
  resumeDueWaits?: typeof resumeDueWaits;
  triggerWorkflowsForEvent?: typeof triggerWorkflowsForEvent;
  budgetMs?: number;
}

export interface TickStats {
  initialized: number;
  scheduledRuns: number;
  resumedWaits: number;
  drainedEvents: number;
  errors: string[];
}

/** Next run for a workflow row, or null when the cron is invalid / never fires. */
export function computeNextRun(cron: string, from: Date): string | null {
  try {
    return nextCronRun(cron, from)?.toISOString() ?? null;
  } catch {
    return null;
  }
}

export async function runSchedulerTick(deps: SchedulerDeps): Promise<TickStats> {
  const { db } = deps;
  const clock = deps.now ?? (() => new Date());
  const run = deps.runWorkflow ?? runWorkflow;
  const resume = deps.resumeDueWaits ?? resumeDueWaits;
  const trigger = deps.triggerWorkflowsForEvent ?? triggerWorkflowsForEvent;
  const started = Date.now();
  const outOfTime = () => Date.now() - started > (deps.budgetMs ?? TICK_BUDGET_MS);
  const stats: TickStats = { initialized: 0, scheduledRuns: 0, resumedWaits: 0, drainedEvents: 0, errors: [] };
  const now = clock();

  // 1. Workflows whose cron was set but next_run_at was never computed: initialise, do not run.
  try {
    const { data: fresh } = await db
      .from('workflows')
      .select('id, schedule_cron')
      .eq('enabled', true)
      .not('schedule_cron', 'is', null)
      .is('next_run_at', null)
      .limit(50);
    for (const w of fresh || []) {
      const next = computeNextRun(w.schedule_cron, now);
      if (!next) continue;
      await db.from('workflows').update({ next_run_at: next }).eq('id', w.id).is('next_run_at', null);
      stats.initialized++;
    }
  } catch (e: any) {
    stats.errors.push(`init: ${e?.message ?? e}`);
  }

  // 2. Due scheduled workflows. The optimistic UPDATE on next_run_at is the claim: only one
  //    concurrent scheduler instance gets the row back, so a workflow never runs twice.
  try {
    const { data: due, error } = await db
      .from('workflows')
      .select('id, user_id, schedule_cron, next_run_at')
      .eq('enabled', true)
      .not('schedule_cron', 'is', null)
      .lte('next_run_at', now.toISOString())
      .order('next_run_at', { ascending: true })
      .limit(MAX_DUE_PER_TICK);
    if (error) throw new Error(error.message);

    for (const w of due || []) {
      if (outOfTime()) break;
      const next = computeNextRun(w.schedule_cron, now);
      const { data: claimed } = await db
        .from('workflows')
        .update({ next_run_at: next })
        .eq('id', w.id)
        .eq('next_run_at', w.next_run_at)
        .select('id');
      if (!claimed || claimed.length === 0) continue;
      if (!next) {
        stats.errors.push(`workflow ${w.id}: invalid or non-firing cron "${w.schedule_cron}"`);
        continue;
      }
      try {
        await run({
          workflowId: w.id,
          userId: w.user_id,
          triggerType: 'SCHEDULED',
          triggerData: { scheduledFor: w.next_run_at, cron: w.schedule_cron },
        });
        stats.scheduledRuns++;
      } catch (e: any) {
        stats.errors.push(`workflow ${w.id}: ${e?.message ?? e}`);
      }
    }
  } catch (e: any) {
    stats.errors.push(`due: ${e?.message ?? e}`);
  }

  // 3. Delay / wait_for_event timeouts.
  if (!outOfTime()) {
    try {
      stats.resumedWaits = await resume(20);
    } catch (e: any) {
      stats.errors.push(`waits: ${e?.message ?? e}`);
    }
  }

  // 4. Event queue (DB-trigger originated record events).
  try {
    const cutoff = new Date(now.getTime() - QUEUE_GRACE_MS).toISOString();
    const { data: events } = await db
      .from('workflow_event_queue')
      .select('id, user_id, event_type, object_type, record_id, data')
      .eq('status', 'pending')
      .lte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(MAX_EVENTS_PER_TICK);
    for (const ev of events || []) {
      if (outOfTime()) break;
      const { data: claimed } = await db
        .from('workflow_event_queue')
        .update({ status: 'processing' })
        .eq('id', ev.id)
        .eq('status', 'pending')
        .select('id');
      if (!claimed || claimed.length === 0) continue;
      try {
        await trigger({
          type: ev.event_type as WorkflowTriggerType,
          tenantId: ev.user_id,
          userId: ev.user_id,
          objectType: ev.object_type,
          recordId: ev.record_id ?? undefined,
          data: ev.data ?? {},
          timestamp: new Date(),
        });
        await db
          .from('workflow_event_queue')
          .update({ status: 'done', processed_at: new Date().toISOString() })
          .eq('id', ev.id);
        stats.drainedEvents++;
      } catch (e: any) {
        await db
          .from('workflow_event_queue')
          .update({ status: 'failed', error: String(e?.message ?? e).slice(0, 500), processed_at: new Date().toISOString() })
          .eq('id', ev.id);
        stats.errors.push(`event ${ev.id}: ${e?.message ?? e}`);
      }
    }
  } catch (e: any) {
    stats.errors.push(`queue: ${e?.message ?? e}`);
  }

  // 5. Hourly housekeeping.
  if (now.getUTCMinutes() === 0) {
    const day = new Date(now.getTime() - 24 * 3600_000).toISOString();
    const week = new Date(now.getTime() - 7 * 24 * 3600_000).toISOString();
    await Promise.allSettled([
      db.from('workflow_hook_usage').delete().lt('window_start', day),
      db.from('api_key_usage').delete().lt('window_start', day),
      db.from('workflow_event_queue').delete().in('status', ['done', 'skipped']).lt('created_at', week),
    ]);
  }

  return stats;
}

/** Netlify scheduled function entry. */
export default async function handler(): Promise<Response> {
  if (!serverSupabase) {
    console.error('workflow-scheduler: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured');
    return new Response('not configured', { status: 500 });
  }
  const stats = await runSchedulerTick({ db: serverSupabase as unknown as SupabaseClient });
  if (stats.errors.length) console.error('workflow-scheduler errors:', stats.errors);
  return new Response(JSON.stringify(stats), { headers: { 'Content-Type': 'application/json' } });
}

// Netlify scheduled functions: https://docs.netlify.com/functions/scheduled-functions/
export const config = { schedule: '* * * * *' };
