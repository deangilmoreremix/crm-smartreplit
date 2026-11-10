import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';
import { runWorkflow } from '@smartcrm/workflows';
import { requireAuth } from './auth';

const router = Router();
router.use(requireAuth());

const TRIGGER_TYPES = [
  'RECORD_CREATED',
  'RECORD_UPDATED',
  'RECORD_DELETED',
  'MANUAL',
  'SCHEDULED',
  'WEBHOOK',
  'AI_COMPLETED',
];

const uid = (req: Request): string => (req as any).userId;

interface StepInput {
  actionType: string;
  configuration?: Record<string, unknown>;
  condition?: Record<string, unknown> | null;
}

const toActionRows = (workflowId: string, steps: StepInput[]) =>
  steps.map((step, index) => ({
    workflow_id: workflowId,
    action_type: step.actionType,
    config: step.configuration || {},
    condition: step.condition || null,
    order_index: index + 1,
  }));

const toStep = (a: any) => ({
  id: a.id,
  actionType: a.action_type,
  configuration: a.config || {},
  order: a.order_index,
  condition: a.condition || undefined,
});

const toWorkflow = (w: any, steps?: any[]) => ({
  ...w,
  triggerType: w.trigger_type,
  appSlug: w.trigger_config?.appSlug || w.trigger_config?.objectType || '',
  ...(steps ? { steps: steps.map(toStep) } : {}),
});

/** Run rows in the camelCase shape the WorkflowMonitor expects. */
const toRun = (r: any) => ({
  ...r,
  workflowId: r.workflow_id,
  triggeredBy: r.trigger_data || {},
  context: {},
  results: r.result || undefined,
  errorMessage: r.error || undefined,
  startedAt: r.started_at,
  completedAt: r.finished_at || undefined,
});

/** Owner-scoped workflow lookup; null when missing or not owned. */
async function findOwned(id: string, userId: string) {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', uid(req))
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ workflows: (data || []).map((w: any) => toWorkflow(w)) });
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = await findOwned(req.params.id, uid(req));
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const { data: steps } = await supabase
      .from('workflow_actions')
      .select('*')
      .eq('workflow_id', req.params.id)
      .order('order_index');
    return res.json({ workflow: toWorkflow(workflow, steps || []) });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, triggerType, appSlug, steps } = req.body || {};
    if (!name || !TRIGGER_TYPES.includes(triggerType)) {
      return res.status(400).json({ error: 'name and a valid triggerType are required' });
    }

    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        user_id: uid(req),
        name,
        description: description || null,
        trigger_type: triggerType,
        trigger_config: appSlug ? { appSlug, objectType: appSlug } : {},
        enabled: true,
      })
      .select()
      .single();
    if (workflowError) throw workflowError;

    if (Array.isArray(steps) && steps.length > 0) {
      const { error: actionsError } = await supabase
        .from('workflow_actions')
        .insert(toActionRows(workflow.id, steps));
      if (actionsError) throw actionsError;
    }

    return res.status(201).json({ workflow: toWorkflow(workflow) });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, triggerType, appSlug, enabled, steps } = req.body || {};
    if (triggerType !== undefined && !TRIGGER_TYPES.includes(triggerType)) {
      return res.status(400).json({ error: 'Invalid triggerType' });
    }
    if (!(await findOwned(id, uid(req)))) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (triggerType !== undefined) patch.trigger_type = triggerType;
    if (enabled !== undefined) patch.enabled = enabled;
    if (appSlug !== undefined) patch.trigger_config = { appSlug, objectType: appSlug };

    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid(req))
      .select()
      .single();
    if (workflowError) throw workflowError;

    if (Array.isArray(steps)) {
      await supabase.from('workflow_actions').delete().eq('workflow_id', id);
      if (steps.length > 0) {
        const { error: actionsError } = await supabase
          .from('workflow_actions')
          .insert(toActionRows(id, steps));
        if (actionsError) throw actionsError;
      }
    }

    return res.json({ workflow: toWorkflow(workflow) });
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // workflow_actions / workflow_runs cascade on delete
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', uid(req));
    if (error) throw error;
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id/runs', async (req: Request, res: Response) => {
  try {
    if (!(await findOwned(req.params.id, uid(req)))) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    const { data: runs, error } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('workflow_id', req.params.id)
      .order('started_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.json({ runs: (runs || []).map(toRun) });
  } catch (error: any) {
    console.error('Error fetching workflow runs:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Manual trigger. Runs synchronously and returns the finished run.
router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const triggerData =
      req.body?.triggerData && typeof req.body.triggerData === 'object' ? req.body.triggerData : {};
    const run = await runWorkflow({
      workflowId: req.params.id,
      userId: uid(req),
      triggerType: 'MANUAL',
      triggerData,
    });
    return res.json({ run: toRun(run), results: run.result });
  } catch (error: any) {
    if (error?.message === 'Workflow not found') {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    console.error('Error running workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

export function registerWorkflowRoutes(app: any): void {
  console.log('Registering workflow routes at /api/workflows');
  app.use('/api/workflows', router);
}

export default router;
