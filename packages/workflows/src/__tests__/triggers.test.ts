import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { registerAllTriggers } from '../triggers';

describe('Triggers', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    registerAllTriggers(engine);
  });

  const triggerTypes = [
    'RECORD_CREATED',
    'RECORD_UPDATED',
    'RECORD_DELETED',
    'MANUAL',
    'SCHEDULED',
    'WEBHOOK',
    'AI_COMPLETED',
  ] as const;

  triggerTypes.forEach((triggerType) => {
    describe(`${triggerType} trigger`, () => {
      it(`should trigger when context.triggerType is ${triggerType}`, async () => {
        const result = await engine.evaluateTrigger(triggerType, {
          triggerType,
          recordId: 'test-123',
        });
        expect(result.triggered).toBe(true);
        expect(result.context?.recordId).toBe('test-123');
      });

      it(`should not trigger when context.triggerType is different`, async () => {
        const differentType = triggerTypes.find((t) => t !== triggerType) || 'MANUAL';
        const result = await engine.evaluateTrigger(triggerType, {
          triggerType: differentType,
        });
        expect(result.triggered).toBe(false);
      });
    });
  });

  it('should include timestamp in context when triggered', async () => {
    const before = new Date();
    const result = await engine.evaluateTrigger('RECORD_CREATED', {
      triggerType: 'RECORD_CREATED',
    });
    const after = new Date();

    expect(result.triggered).toBe(true);
    expect(result.context?.timestamp).toBeDefined();
    expect(result.context!.timestamp!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.context!.timestamp!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should preserve existing timestamp when provided', async () => {
    const customTimestamp = new Date('2024-01-15T12:00:00Z');
    const result = await engine.evaluateTrigger('MANUAL', {
      triggerType: 'MANUAL',
      timestamp: customTimestamp,
    });

    expect(result.triggered).toBe(true);
    expect(result.context?.timestamp?.toISOString()).toBe(customTimestamp.toISOString());
  });
});
