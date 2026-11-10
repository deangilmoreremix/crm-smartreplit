import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Chainable, thenable query-builder fake. `results[table]` is a queue of results (last one repeats).
const calls: Array<{ table: string; op: string; args: unknown[] }> = [];
const results: Record<string, Array<{ data: any; error: any }>> = {};

function builder(table: string) {
  const next = () => {
    const q = results[table] || [{ data: null, error: null }];
    return q.length > 1 ? q.shift()! : q[0];
  };
  const b: any = {};
  for (const op of ['select', 'eq', 'order', 'limit', 'insert', 'update', 'delete']) {
    b[op] = (...args: unknown[]) => {
      calls.push({ table, op, args });
      return b;
    };
  }
  b.single = () => Promise.resolve(next());
  b.maybeSingle = () => Promise.resolve(next());
  b.then = (resolve: any, reject: any) => Promise.resolve(next()).then(resolve, reject);
  return b;
}

vi.mock('../../supabase', () => ({ supabase: { from: (t: string) => builder(t) } }));

vi.mock('../auth', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    if (req.headers['x-anon']) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = 'user-123';
    next();
  },
}));

const runWorkflow = vi.fn();
vi.mock('@smartcrm/workflows', () => ({ runWorkflow: (...a: unknown[]) => runWorkflow(...a) }));

import { registerWorkflowRoutes } from '../workflows';

const ownerFilter = (table: string) =>
  calls.some((c) => c.table === table && c.op === 'eq' && c.args[0] === 'user_id' && c.args[1] === 'user-123');

describe('Workflow Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    calls.length = 0;
    for (const k of Object.keys(results)) delete results[k];
    runWorkflow.mockReset();
    app = express();
    app.use(express.json());
    registerWorkflowRoutes(app);
  });

  it('returns 401 without auth', async () => {
    const response = await request(app).get('/api/workflows').set('x-anon', '1');
    expect(response.status).toBe(401);
  });

  it('lists only the caller\'s workflows', async () => {
    results.workflows = [{ data: [{ id: 'wf-1', trigger_type: 'MANUAL', trigger_config: {} }], error: null }];
    const response = await request(app).get('/api/workflows');
    expect(response.status).toBe(200);
    expect(response.body.workflows[0].triggerType).toBe('MANUAL');
    expect(ownerFilter('workflows')).toBe(true);
  });

  describe('POST /api/workflows', () => {
    it('creates a workflow owned by the caller with ordered steps', async () => {
      results.workflows = [{ data: { id: 'wf-123', trigger_type: 'MANUAL', trigger_config: {} }, error: null }];
      results.workflow_actions = [{ data: null, error: null }];

      const response = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Test Workflow',
          triggerType: 'MANUAL',
          appSlug: 'contacts',
          steps: [{ actionType: 'CREATE_TASK', configuration: { title: 'x' } }],
        });

      expect(response.status).toBe(201);
      const insert = calls.find((c) => c.table === 'workflows' && c.op === 'insert')!;
      expect((insert.args[0] as any).user_id).toBe('user-123');
      const actions = calls.find((c) => c.table === 'workflow_actions' && c.op === 'insert')!;
      expect((actions.args[0] as any[])[0]).toMatchObject({
        workflow_id: 'wf-123',
        action_type: 'CREATE_TASK',
        config: { title: 'x' },
        order_index: 1,
      });
    });

    it('validates required fields', async () => {
      const response = await request(app).post('/api/workflows').send({});
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/workflows/:id', () => {
    it('returns workflow with steps', async () => {
      results.workflows = [{ data: { id: 'wf-123', trigger_type: 'MANUAL', trigger_config: {} }, error: null }];
      results.workflow_actions = [
        { data: [{ id: 's1', action_type: 'SEND_EMAIL', config: {}, order_index: 1 }], error: null },
      ];
      const response = await request(app).get('/api/workflows/wf-123');
      expect(response.status).toBe(200);
      expect(response.body.workflow.steps[0]).toMatchObject({ id: 's1', actionType: 'SEND_EMAIL', order: 1 });
      expect(ownerFilter('workflows')).toBe(true);
    });

    it('returns 404 for a workflow the caller does not own', async () => {
      results.workflows = [{ data: null, error: null }];
      const response = await request(app).get('/api/workflows/other');
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/workflows/:id', () => {
    it('deletes scoped by owner', async () => {
      results.workflows = [{ data: null, error: null }];
      const response = await request(app).delete('/api/workflows/wf-123');
      expect(response.status).toBe(204);
      expect(ownerFilter('workflows')).toBe(true);
    });
  });

  describe('GET /api/workflows/:id/runs', () => {
    it('returns runs in monitor shape', async () => {
      results.workflows = [{ data: { id: 'wf-123' }, error: null }];
      results.workflow_runs = [
        {
          data: [{ id: 'r1', workflow_id: 'wf-123', status: 'failed', error: 'boom', started_at: 't' }],
          error: null,
        },
      ];
      const response = await request(app).get('/api/workflows/wf-123/runs');
      expect(response.status).toBe(200);
      expect(response.body.runs[0]).toMatchObject({ workflowId: 'wf-123', errorMessage: 'boom', startedAt: 't' });
    });

    it('404s when the workflow is not owned', async () => {
      results.workflows = [{ data: null, error: null }];
      const response = await request(app).get('/api/workflows/x/runs');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/workflows/:id/run', () => {
    it('runs manually as the caller and returns the run', async () => {
      runWorkflow.mockResolvedValue({ id: 'run-1', workflow_id: 'wf-123', status: 'completed', result: { s: 1 } });
      const response = await request(app)
        .post('/api/workflows/wf-123/run')
        .send({ triggerData: { test: true } });
      expect(response.status).toBe(200);
      expect(response.body.run.status).toBe('completed');
      expect(runWorkflow).toHaveBeenCalledWith({
        workflowId: 'wf-123',
        userId: 'user-123',
        triggerType: 'MANUAL',
        triggerData: { test: true },
      });
    });

    it('returns 404 when the workflow is not found', async () => {
      runWorkflow.mockRejectedValue(new Error('Workflow not found'));
      const response = await request(app).post('/api/workflows/nope/run').send({});
      expect(response.status).toBe(404);
    });
  });
});
