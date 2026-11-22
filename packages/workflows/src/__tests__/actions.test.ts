import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { registerAllActions } from '../actions';
import { ActionType } from '../schema/workflow.schema';

describe('Actions', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    registerAllActions(engine);
  });

  const createContext = () => ({
    workflowId: 'wf-test',
    runId: 'run-test',
    triggerType: 'MANUAL' as const,
    timestamp: new Date(),
    variables: {},
  });

  describe('SEND_EMAIL', () => {
    it('should report not implemented instead of pretending to send', async () => {
      const result = await engine.executeAction('SEND_EMAIL', createContext(), {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test body content',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });

    it('should fail when to is missing', async () => {
      const result = await engine.executeAction('SEND_EMAIL', createContext(), {
        subject: 'Test',
        body: 'Test',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required');
    });
  });

  describe('UPDATE_FIELD', () => {
    it('should report not implemented', async () => {
      const result = await engine.executeAction('UPDATE_FIELD', createContext(), {
        objectType: 'contact',
        recordId: 'c-123',
        field: 'status',
        value: 'active',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });
  });

  describe('CREATE_TASK', () => {
    it('should report not implemented', async () => {
      const result = await engine.executeAction('CREATE_TASK', createContext(), {
        title: 'Follow up with customer',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });
  });

  describe('WEBHOOK', () => {
    it('should report not implemented', async () => {
      const result = await engine.executeAction('WEBHOOK', createContext(), {
        url: 'https://example.com/webhook',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });

    it('should fail without url', async () => {
      const result = await engine.executeAction('WEBHOOK', createContext(), {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required');
    });
  });

  describe('WAIT', () => {
    it('should wait for specified duration', async () => {
      const result = await engine.executeAction('WAIT', createContext(), {
        duration: 100,
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('waited', 100);
    });

    it('should refuse waits longer than it can hold', async () => {
      const result = await engine.executeAction('WAIT', createContext(), {
        duration: 5,
        unit: 'minutes',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });

    it('should fail without duration', async () => {
      const result = await engine.executeAction('WAIT', createContext(), {});
      expect(result.success).toBe(false);
    });
  });

  describe('BRANCH', () => {
    it('should evaluate condition and return branch result', async () => {
      const result = await engine.executeAction('BRANCH', createContext(), {
        condition: { field: 'status', operator: 'equals', value: 'active' },
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('branchTaken');
    });
  });

  describe('SEND_SMS', () => {
    it('should report not implemented', async () => {
      const result = await engine.executeAction('SEND_SMS', createContext(), {
        to: '+1234567890',
        message: 'Hello!',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });
  });

  describe('CREATE_DEAL', () => {
    it('should report not implemented', async () => {
      const result = await engine.executeAction('CREATE_DEAL', createContext(), {
        title: 'New Deal',
        amount: 5000,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });
  });

  describe('CREATE_CONTACT', () => {
    it('should report not implemented', async () => {
      const result = await engine.executeAction('CREATE_CONTACT', createContext(), {
        email: 'new@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not implemented');
    });
  });
});
