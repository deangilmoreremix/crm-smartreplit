import { supabase } from '../supabase';
import { workflowEngine, type ActionResult, type CursorFrame, type WaitRequest, type WorkflowStep } from './WorkflowEngine';
import { registerAllTriggers } from '../triggers';
import { registerAllActions } from '../actions';
import { getPath } from './interpolate';

let registered = false;
function ensureRegistered() {
  if (registered) return;
  registerAllTriggers(workflowEngine);
  registerAllActions(workflowEngine);
  registered = true;
}

export interface RunWorkflowOptions {
  workflowId: string;
  /** Owner; the workflow must belong to this user. */
  userId: string;
  triggerType: string;
  triggerData?: Record<string, unknown>;
  recordId?: string;
}

/** Snapshot persisted in workflow_run_waits.payload so a paused run can continue later. */
interface WaitSnapshot {
  userId: string;
  triggerType: string;
  recordId?: string;
  variables: Record<string, unknown>;
  results: Record<string, ActionResult>;
  /** steps.<id>.output values (nested steps can't be rebuilt from `results`). */
  stepsOut?: Record<string, { output: unknown }>;
  /** Step executions used so far; the step limit spans pauses. */
  executions?: number;
  versionId?: string | null;
  match?: Record<string, unknown>;
  form?: { title?: string; fields: Array<{ name: string; label?: string; type?: string; required?: boolean }> };
}

const rowsToSteps = (actions: any[]): WorkflowStep[] =>
  (actions || []).map((a: any) => ({
    id: a.id,
    actionType: a.action_type,
    configuration: a.config || {},
    order: a.order_index,
    condition: a.condition || undefined,
  }));

/**
 * Steps for a workflow: the active published version's graph when `active_version_id` is set,
 * otherwise the live rows in workflow_actions (draft/legacy behaviour).
 */
export async function loadSteps(
  workflowId: string,
  versionId?: string | null
): Promise<{ steps: WorkflowStep[]; versionId: string | null }> {
  if (versionId) {
    const { data: version, error } = await supabase
      .from('workflow_versions')
      .select('id, graph')
      .eq('id', versionId)
      .eq('workflow_id', workflowId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!version) throw new Error('Workflow version not found');
    const steps = Array.isArray((version.graph as any)?.steps) ? (version.graph as any).steps : [];
    return {
      versionId: version.id,
      steps: steps.map((s: any, i: number) => ({
        id: String(s.id ?? `s${i}`),
        actionType: s.actionType ?? s.action_type,
        configuration: s.configuration ?? s.config ?? {},
        order: s.order ?? s.order_index ?? i + 1,
        condition: s.condition || undefined,
      })),
    };
  }
  const { data: actions, error } = await supabase
    .from('workflow_actions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('order_index');
  if (error) throw new Error(error.message);
  return { steps: rowsToSteps(actions || []), versionId: null };
}

async function finish(
  runId: string,
  outcome: Awaited<ReturnType<typeof workflowEngine.executeWorkflow>>,
  snapshotBase: Omit<WaitSnapshot, 'results' | 'stepsOut' | 'executions' | 'match' | 'form'>
) {
  const results = outcome.results;
  const patch: Record<string, unknown> = { result: results, error: null };

  if (outcome.status === 'waiting' && outcome.wait) {
    const w = outcome.wait as WaitRequest & { stepId: string };
    const cursor = outcome.cursor && outcome.cursor.length ? outcome.cursor : null;
    const { error: waitError } = await supabase.from('workflow_run_waits').insert({
      run_id: runId,
      // Only set for waits nested in IF_ELSE / ITERATOR, so top-level pauses work before the migration.
      ...(cursor ? { cursor } : {}),
      kind: w.kind,
      step_id: w.stepId,
      resume_at: 'resumeAt' in w && w.resumeAt ? w.resumeAt : null,
      event_key: w.kind === 'event' ? w.eventKey : null,
      payload: {
        ...snapshotBase,
        results,
        stepsOut: outcome.stepsOut,
        executions: outcome.executions,
        match: w.kind === 'event' ? w.match : undefined,
        form: w.kind === 'form' ? w.form : undefined,
      } satisfies WaitSnapshot,
    });
    if (!waitError) {
      patch.status = 'waiting';
    } else {
      patch.status = 'failed';
      patch.error = `Could not pause run: ${waitError.message}`;
      patch.finished_at = new Date().toISOString();
    }
  } else if (outcome.status === 'failed') {
    patch.status = 'failed';
    patch.error = Object.values(results).find((r) => !r.success)?.error || 'A workflow step failed';
    patch.finished_at = new Date().toISOString();
  } else {
    patch.status = 'completed';
    patch.finished_at = new Date().toISOString();
  }

  const { data } = await supabase.from('workflow_runs').update(patch).eq('id', runId).select().single();
  return data;
}

/**
 * Load a workflow (owner-scoped), execute its actions and record the run in workflow_runs
 * (running -> completed | failed | waiting). Returns the final run row.
 */
export async function runWorkflow(opts: RunWorkflowOptions) {
  ensureRegistered();
  const { workflowId, userId, triggerType, triggerData = {}, recordId } = opts;

  const { data: workflow, error: wfError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('user_id', userId)
    .maybeSingle();
  if (wfError) throw new Error(wfError.message);
  if (!workflow) throw new Error('Workflow not found');

  const { steps, versionId } = await loadSteps(workflowId, (workflow as any).active_version_id);

  const { data: run, error: runError } = await supabase
    .from('workflow_runs')
    .insert({ workflow_id: workflowId, status: 'running', trigger_data: triggerData })
    .select()
    .single();
  if (runError || !run) throw new Error(runError?.message || 'Failed to create run');

  let status = 'failed';
  let error: string | null = null;
  try {
    const outcome = await workflowEngine.executeWorkflow(steps, {
      workflowId,
      runId: run.id,
      triggerType,
      recordId,
      userId,
      timestamp: new Date(),
      variables: triggerData,
    });
    const finished = await finish(run.id, outcome, {
      userId,
      triggerType,
      recordId,
      variables: triggerData,
      versionId,
    });
    if (finished) return finished;
    status = outcome.status === 'failed' ? 'failed' : 'completed';
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const { data: failed } = await supabase
    .from('workflow_runs')
    .update({ status, error, finished_at: new Date().toISOString() })
    .eq('id', run.id)
    .select()
    .single();
  return failed || { ...run, status, error };
}

/**
 * Atomically claim a pending wait and continue its run. Returns the updated run, or null when
 * the wait was already resolved by someone else.
 */
export async function resumeWait(waitId: string, output: unknown) {
  ensureRegistered();
  const { data: claimed, error: claimError } = await supabase
    .from('workflow_run_waits')
    .update({ resolved_at: new Date().toISOString(), resume_payload: output ?? null })
    .eq('id', waitId)
    .is('resolved_at', null)
    .select()
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claimed) return null;

  const snap = claimed.payload as WaitSnapshot;
  const { data: run } = await supabase.from('workflow_runs').select('*').eq('id', claimed.run_id).maybeSingle();
  if (!run || run.status !== 'waiting') return run ?? null;

  await supabase.from('workflow_runs').update({ status: 'running' }).eq('id', run.id);
  try {
    const { steps } = await loadSteps(run.workflow_id, snap.versionId);
    const outcome = await workflowEngine.executeWorkflow(
      steps,
      {
        workflowId: run.workflow_id,
        runId: run.id,
        triggerType: snap.triggerType,
        recordId: snap.recordId,
        userId: snap.userId,
        timestamp: new Date(),
        variables: snap.variables,
      },
      {
        resumeFromStepId: claimed.step_id,
        cursor: (claimed.cursor as CursorFrame[] | null) ?? [],
        priorResults: snap.results,
        priorStepsOut: snap.stepsOut,
        priorExecutions: snap.executions,
        resumeOutput: output,
      }
    );
    return await finish(run.id, outcome, {
      userId: snap.userId,
      triggerType: snap.triggerType,
      recordId: snap.recordId,
      variables: snap.variables,
      versionId: snap.versionId,
    });
  } catch (e) {
    const { data } = await supabase
      .from('workflow_runs')
      .update({
        status: 'failed',
        error: e instanceof Error ? e.message : String(e),
        finished_at: new Date().toISOString(),
      })
      .eq('id', run.id)
      .select()
      .single();
    return data;
  }
}

/** Resume delay waits that are due and wait_for_event waits whose timeout elapsed. */
export async function resumeDueWaits(limit = 20): Promise<number> {
  const { data: due, error } = await supabase
    .from('workflow_run_waits')
    .select('id, kind')
    .is('resolved_at', null)
    .not('resume_at', 'is', null)
    .lte('resume_at', new Date().toISOString())
    .limit(limit);
  if (error) throw new Error(error.message);
  let n = 0;
  for (const w of due || []) {
    try {
      const out = w.kind === 'event' ? { timedOut: true } : { resumed: true };
      if (await resumeWait(w.id, out)) n++;
    } catch (e) {
      console.error(`Failed to resume wait ${w.id}:`, e);
    }
  }
  return n;
}

/** Resume runs of `userId` that wait for `type:objectType` (or `type:*`) and whose match filter fits. */
export async function resumeWaitersForEvent(
  userId: string,
  type: string,
  objectType: string | undefined,
  data: Record<string, unknown> = {}
): Promise<number> {
  const keys = [`${type}:*`, ...(objectType ? [`${type}:${objectType}`] : [])];
  return resumeWaitersForKeys(userId, keys, data);
}

export async function resumeWaitersForKeys(
  userId: string,
  keys: string[],
  data: Record<string, unknown> = {}
): Promise<number> {
  const { data: waits, error } = await supabase
    .from('workflow_run_waits')
    .select('id, payload')
    .is('resolved_at', null)
    .in('event_key', keys)
    .limit(100);
  if (error) {
    console.error('Error loading event waits:', error.message);
    return 0;
  }
  let n = 0;
  for (const w of waits || []) {
    const snap = w.payload as WaitSnapshot;
    if (snap?.userId !== userId) continue;
    const match = snap.match || {};
    const ok = Object.entries(match).every(([k, v]) => String(getPath(data, k)) === String(v));
    if (!ok) continue;
    try {
      if (await resumeWait(w.id, { event: data })) n++;
    } catch (e) {
      console.error(`Failed to resume wait ${w.id}:`, e);
    }
  }
  return n;
}
