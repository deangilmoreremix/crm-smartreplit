import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerWorkflowRoutes } from '../workflows';

vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn(),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

describe('Workflow Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req: any, res: any, next: any) => {
      req.user = { id: 'user-123' };
      next();
    });
    registerWorkflowRoutes(app);
  });

  describe('GET /api/workflows', () => {
    it('returns 401 without user', async () => {
      const testApp = express();
      testApp.use(express.json());
      registerWorkflowRoutes(testApp);
      const response = await request(testApp).get('/api/workflows');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/workflows', () => {
    it('creates a new workflow', async () => {
      const mockWorkflow = {
        id: 'wf-123',
        name: 'Test Workflow',
        trigger_type: 'MANUAL',
        enabled: true,
      };

      const { supabase } = await import('../../supabase');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockWorkflow, error: null }),
          })),
        })),
      });

      const response = await request(app).post('/api/workflows').send({
        name: 'Test Workflow',
        triggerType: 'MANUAL',
        appSlug: 'contacts',
        steps: [],
      });

      expect(response.status).toBe(201);
      expect(response.body.workflow).toBeDefined();
    });

    it('validates required fields', async () => {
      const response = await request(app).post('/api/workflows').send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/workflows/:id', () => {
    it('returns workflow with steps', async () => {
      const mockWorkflow = {
        id: 'wf-123',
        name: 'Test Workflow',
        trigger_type: 'MANUAL',
      };

      const mockSteps = [
        { id: 'step-1', workflow_id: 'wf-123', action_type: 'SEND_EMAIL', order_index: 1 },
      ];

      const { supabase } = await import('../../supabase');
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockWorkflow, error: null }),
          })),
        })),
      });

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockWorkflow, error: null }),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: mockSteps, error: null }),
            })),
          })),
        });

      const response = await request(app).get('/api/workflows/wf-123');

      expect(response.status).toBe(200);
      expect(response.body.workflow).toBeDefined();
    });
  });

  describe('DELETE /api/workflows/:id', () => {
    it('deletes workflow and associated actions', async () => {
      const { supabase } = await import('../../supabase');
      (supabase.from as any).mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      const response = await request(app).delete('/api/workflows/wf-123');

      expect(response.status).toBe(204);
    });
  });

  describe('POST /api/workflows/:id/run', () => {
    it('executes workflow and returns results', async () => {
      const mockWorkflow = {
        id: 'wf-123',
        name: 'Test Workflow',
        trigger_type: 'MANUAL',
        enabled: true,
      };

      const mockRun = {
        id: 'run-123',
        workflow_id: 'wf-123',
        status: 'completed',
      };

      const { supabase } = await import('../../supabase');
      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockWorkflow, error: null }),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        })
        .mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockRun, error: null }),
            })),
          })),
        })
        .mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: mockRun, error: null }),
          })),
        });

      const response = await request(app)
        .post('/api/workflows/wf-123/run')
        .send({ triggerData: { test: true } });

      expect(response.status).toBe(200);
      expect(response.body.run).toBeDefined();
    });
  });
});
