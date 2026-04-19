import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { registerAllTriggers } from '../triggers';
import { registerAllActions } from '../actions';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  describe('trigger registration', () => {
    it('should register and retrieve triggers', () => {
      registerAllTriggers(engine);
      const triggers = engine.getRegisteredTriggers();
      expect(triggers).toContain('RECORD_CREATED');
      expect(triggers).toContain('RECORD_UPDATED');
      expect(triggers).toContain('RECORD_DELETED');
      expect(triggers).toContain('MANUAL');
      expect(triggers).toContain('SCHEDULED');
      expect(triggers).toContain('WEBHOOK');
      expect(triggers).toContain('AI_COMPLETED');
    });

    it('should evaluate RECORD_CREATED trigger correctly', async () => {
      registerAllTriggers(engine);
      const result = await engine.evaluateTrigger('RECORD_CREATED', {
        triggerType: 'RECORD_CREATED',
        recordId: '123',
      });
      expect(result.triggered).toBe(true);
      expect(result.context?.recordId).toBe('123');
    });

    it('should not trigger for mismatched type', async () => {
      registerAllTriggers(engine);
      const result = await engine.evaluateTrigger('RECORD_CREATED', {
        triggerType: 'MANUAL',
      });
      expect(result.triggered).toBe(false);
    });
  });

  describe('action registration', () => {
    it('should register and retrieve actions', () => {
      registerAllActions(engine);
      const actions = engine.getRegisteredActions();
      expect(actions).toContain('SEND_EMAIL');
      expect(actions).toContain('UPDATE_FIELD');
      expect(actions).toContain('CREATE_TASK');
    });

    it('should execute SEND_EMAIL action', async () => {
      registerAllActions(engine);
      const result = await engine.executeAction(
        'SEND_EMAIL',
        {
          workflowId: 'wf-1',
          runId: 'run-1',
          triggerType: 'MANUAL',
          timestamp: new Date(),
          variables: {},
        },
        {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Hello',
        }
      );
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      registerAllActions(engine);
      const result = await engine.executeAction(
        'SEND_EMAIL',
        {
          workflowId: 'wf-1',
          runId: 'run-1',
          triggerType: 'MANUAL',
          timestamp: new Date(),
          variables: {},
        },
        {
          to: 'test@example.com',
        }
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required');
    });
  });

  describe('workflow execution', () => {
    it('should execute a simple workflow with sequential steps', async () => {
      registerAllTriggers(engine);
      registerAllActions(engine);

      const context = {
        workflowId: 'wf-1',
        runId: 'run-1',
        triggerType: 'MANUAL',
        timestamp: new Date(),
        variables: { contactId: 'c-123' },
      };

      const steps = [
        {
          id: 'step-1',
          actionType: 'CREATE_TASK',
          configuration: { title: 'Follow up with contact' },
          order: 1,
        },
        {
          id: 'step-2',
          actionType: 'SEND_EMAIL',
          configuration: { to: 'contact@example.com', subject: 'Hello', body: 'Hi there' },
          order: 2,
        },
      ];

      const result = await engine.executeWorkflow(steps, context);
      expect(result.success).toBe(true);
      expect(result.results['step-1'].success).toBe(true);
      expect(result.results['step-2'].success).toBe(true);
    });

    it('should handle conditional branching', async () => {
      registerAllTriggers(engine);
      registerAllActions(engine);

      const context = {
        workflowId: 'wf-1',
        runId: 'run-1',
        triggerType: 'MANUAL',
        timestamp: new Date(),
        variables: { score: 80 },
      };

      const steps = [
        {
          id: 'step-branch',
          actionType: 'BRANCH',
          configuration: {
            condition: { field: 'score', operator: 'greater_than', value: 50 },
          },
          order: 1,
        },
      ];

      const result = await engine.executeWorkflow(steps, context);
      expect(result.success).toBe(true);
      expect(result.results['step-branch'].output).toBeDefined();
    });
  });

  describe('condition evaluation', () => {
    it('should evaluate equals condition', async () => {
      registerAllTriggers(engine);
      registerAllActions(engine);

      const context = {
        workflowId: 'wf-1',
        runId: 'run-1',
        triggerType: 'MANUAL',
        timestamp: new Date(),
        variables: { status: 'active' },
      };

      const steps = [
        {
          id: 'step-1',
          actionType: 'CODE',
          configuration: {
            code: 'console.log("condition passed")',
          },
          order: 1,
          condition: { field: 'status', operator: 'equals', value: 'active' },
        },
      ];

      const result = await engine.executeWorkflow(steps, context);
      expect(result.success).toBe(true);
    });

    it('should skip step when condition is not met', async () => {
      registerAllTriggers(engine);
      registerAllActions(engine);

      const context = {
        workflowId: 'wf-1',
        runId: 'run-1',
        triggerType: 'MANUAL',
        timestamp: new Date(),
        variables: { status: 'inactive' },
      };

      const steps = [
        {
          id: 'step-1',
          actionType: 'SEND_EMAIL',
          configuration: { to: 'test@example.com', subject: 'Test', body: 'Test' },
          order: 1,
          condition: { field: 'status', operator: 'equals', value: 'active' },
        },
      ];

      const result = await engine.executeWorkflow(steps, context);
      expect(result.results['step-1'].output).toContain('Skipped');
    });
  });

  describe('error handling', () => {
    it('should handle unknown action type gracefully', async () => {
      const result = await engine.executeAction(
        'UNKNOWN_ACTION',
        {
          workflowId: 'wf-1',
          runId: 'run-1',
          triggerType: 'MANUAL',
          timestamp: new Date(),
          variables: {},
        },
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action type');
    });
  });
});
