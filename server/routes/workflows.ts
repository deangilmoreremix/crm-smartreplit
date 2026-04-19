import { Router, Request, Response } from 'express';
import { supabase } from '../../supabase';
import { workflowEngine } from '@smartcrm/workflows';
import { registerAllTriggers, registerAllActions } from '@smartcrm/workflows';

const router = Router();

// Initialize workflow engine with all triggers and actions
registerAllTriggers(workflowEngine);
registerAllActions(workflowEngine);

interface WorkflowRow {
  id: string;
  name: string;
  trigger_type: string;
  enabled: boolean;
  app_slug: string;
  configuration: Record<string, unknown>;
  created_by: string;
  tenant_id: string;
}

interface WorkflowActionRow {
  id: string;
  workflow_id: string;
  action_type: string;
  configuration: Record<string, unknown>;
  order_index: number;
  parent_id: string | null;
  condition: Record<string, unknown> | null;
}

interface WorkflowRunRow {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggered_by: Record<string, unknown>;
  context: Record<string, unknown>;
  started_at: Date;
  completed_at: Date | null;
}

async function getTenantId(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();
  return profile?.tenant_id || '';
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tenantId = await getTenantId(userId);
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ workflows });
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { data: steps } = await supabase
      .from('workflow_actions')
      .select('*')
      .eq('workflow_id', id)
      .order('order_index');

    return res.json({ workflow: { ...workflow, steps } });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, triggerType, appSlug, steps } = req.body;
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tenantId = await getTenantId(userId);

    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        name,
        trigger_type: triggerType,
        app_slug: appSlug,
        enabled: true,
        tenant_id: tenantId,
        created_by: userId,
        configuration: {},
      })
      .select()
      .single();

    if (workflowError) throw workflowError;

    if (steps && steps.length > 0) {
      const actionRecords = steps.map((step: any, index: number) => ({
        workflow_id: workflow.id,
        action_type: step.actionType,
        configuration: step.configuration,
        order_index: index + 1,
        parent_id: step.parentId || null,
        condition: step.condition || null,
      }));

      const { error: actionsError } = await supabase.from('workflow_actions').insert(actionRecords);

      if (actionsError) throw actionsError;
    }

    return res.status(201).json({ workflow });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, triggerType, enabled, steps } = req.body;
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .update({
        name,
        trigger_type: triggerType,
        enabled,
      })
      .eq('id', id)
      .select()
      .single();

    if (workflowError) throw workflowError;

    if (steps) {
      await supabase.from('workflow_actions').delete().eq('workflow_id', id);

      const actionRecords = steps.map((step: any, index: number) => ({
        workflow_id: id,
        action_type: step.actionType,
        configuration: step.configuration,
        order_index: index + 1,
        parent_id: step.parentId || null,
        condition: step.condition || null,
      }));

      const { error: actionsError } = await supabase.from('workflow_actions').insert(actionRecords);

      if (actionsError) throw actionsError;
    }

    return res.json({ workflow });
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await supabase.from('workflow_actions').delete().eq('workflow_id', id);
    const { error } = await supabase.from('workflows').delete().eq('id', id);

    if (error) throw error;
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id/runs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: runs, error } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('workflow_id', id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json({ runs });
  } catch (error: any) {
    console.error('Error fetching workflow runs:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { triggerData } = req.body;
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: workflow } = await supabase.from('workflows').select('*').eq('id', id).single();

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { data: actions } = await supabase
      .from('workflow_actions')
      .select('*')
      .eq('workflow_id', id)
      .order('order_index');

    const runId = `run_${Date.now()}`;
    const context = {
      workflowId: id,
      runId,
      triggerType: workflow.trigger_type,
      timestamp: new Date(),
      variables: triggerData || {},
    };

    const { data: run, error: runError } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: id,
        status: 'running',
        triggered_by: triggerData || {},
        context: {},
      })
      .select()
      .single();

    if (runError) throw runError;

    const steps = (actions || []).map((a: any) => ({
      id: a.id,
      actionType: a.action_type,
      configuration: a.configuration,
      order: a.order_index,
      parentId: a.parent_id,
      condition: a.condition,
    }));

    const result = await workflowEngine.executeWorkflow(steps, context);

    await supabase
      .from('workflow_runs')
      .update({
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        results: result.results,
      })
      .eq('id', run.id);

    return res.json({ run, results: result.results });
  } catch (error: any) {
    console.error('Error running workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

export function registerWorkflowRoutes(app: any): void {
  console.log('Registering workflow routes at /api/workflows');
  app.use('/api/workflows', router);
}

export default router;
