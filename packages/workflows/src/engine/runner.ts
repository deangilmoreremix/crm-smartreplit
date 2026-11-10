import { supabase } from '../supabase';
import { workflowEngine } from './WorkflowEngine';
import { registerAllTriggers } from '../triggers';
import { registerAllActions } from '../actions';

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

/**
 * Load a workflow (owner-scoped), execute its actions in order and record the run in
 * workflow_runs (running -> completed | failed). Returns the final run row.
 */
export async function runWorkflow(opts: RunWorkflowOptions) {
  ensureRegistered();
  const { workflowId, userId, triggerType, triggerData = {}, recordId } = opts;

  const { data: workflow, error: wfError } = await supabase
    .from('workflows')
    .select('id')
    .eq('id', workflowId)
    .eq('user_id', userId)
    .maybeSingle();
  if (wfError) throw new Error(wfError.message);
  if (!workflow) throw new Error('Workflow not found');

  const { data: actions, error: actError } = await supabase
    .from('workflow_actions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('order_index');
  if (actError) throw new Error(actError.message);

  const { data: run, error: runError } = await supabase
    .from('workflow_runs')
    .insert({ workflow_id: workflowId, status: 'running', trigger_data: triggerData })
    .select()
    .single();
  if (runError || !run) throw new Error(runError?.message || 'Failed to create run');

  let status: 'completed' | 'failed' = 'failed';
  let result: unknown = null;
  let error: string | null = null;
  try {
    const steps = (actions || []).map((a: any) => ({
      id: a.id,
      actionType: a.action_type,
      configuration: a.config || {},
      order: a.order_index,
      condition: a.condition || undefined,
    }));
    const outcome = await workflowEngine.executeWorkflow(steps, {
      workflowId,
      runId: run.id,
      triggerType,
      recordId,
      userId,
      timestamp: new Date(),
      variables: triggerData,
    });
    result = outcome.results;
    status = outcome.success ? 'completed' : 'failed';
    if (!outcome.success) {
      error =
        Object.values(outcome.results).find((r) => !r.success)?.error || 'A workflow step failed';
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const { data: finished } = await supabase
    .from('workflow_runs')
    .update({ status, result, error, finished_at: new Date().toISOString() })
    .eq('id', run.id)
    .select()
    .single();
  return finished || { ...run, status, result, error };
}
