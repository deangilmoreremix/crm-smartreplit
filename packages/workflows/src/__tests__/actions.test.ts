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
    it('should send email with required fields', async () => {
      const result = await engine.executeAction('SEND_EMAIL', createContext(), {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test body content',
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('messageId');
      expect(result.output).toHaveProperty('to', 'test@example.com');
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
    it('should update field with all required params', async () => {
      const result = await engine.executeAction('UPDATE_FIELD', createContext(), {
        objectType: 'contact',
        recordId: 'c-123',
        field: 'status',
        value: 'active',
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('field', 'status');
      expect(result.output).toHaveProperty('newValue', 'active');
    });
  });

  describe('CREATE_TASK', () => {
    it('should create task with title', async () => {
      const result = await engine.executeAction('CREATE_TASK', createContext(), {
        title: 'Follow up with customer',
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('taskId');
      expect(result.output).toHaveProperty('title', 'Follow up with customer');
    });
  });

  describe('WEBHOOK', () => {
    it('should call webhook with url', async () => {
      const result = await engine.executeAction('WEBHOOK', createContext(), {
        url: 'https://example.com/webhook',
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('url', 'https://example.com/webhook');
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
    it('should send SMS with to and message', async () => {
      const result = await engine.executeAction('SEND_SMS', createContext(), {
        to: '+1234567890',
        message: 'Hello!',
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('messageId');
    });
  });

  describe('CREATE_DEAL', () => {
    it('should create deal with title', async () => {
      const result = await engine.executeAction('CREATE_DEAL', createContext(), {
        title: 'New Deal',
        amount: 5000,
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('dealId');
      expect(result.output).toHaveProperty('title', 'New Deal');
    });
  });

  describe('CREATE_CONTACT', () => {
    it('should create contact with email', async () => {
      const result = await engine.executeAction('CREATE_CONTACT', createContext(), {
        email: 'new@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('contactId');
      expect(result.output).toHaveProperty('email', 'new@example.com');
    });
  });
});
