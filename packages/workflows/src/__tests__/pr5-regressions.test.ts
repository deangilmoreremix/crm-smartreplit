/**
 * Regression tests for the PR #5 review findings.
 *
 * Focuses on the two bugs that had no dedicated coverage:
 *   - P2: `exists` / `not_exists` operators were dropped from the condition
 *     evaluator, silently breaking persisted workflow conditions.
 *   - P1: workflow action/trigger identifiers exported by the public enums are
 *     lowercase (e.g. `send_email`, `contact_created`) while the engine
 *     registries and persisted workflows use uppercase keys, so lookups from
 *     the builder/w API never resolved.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { ConditionEvaluator } from '../engine/conditionEvaluator';
import { registerAllTriggers, registerAllActions } from '../index';
import { WorkflowContext } from '../engine/WorkflowEngine';
import { WorkflowTrigger, WorkflowAction, ConditionOperator, WorkflowCondition } from '../types';

describe('PR #5: legacy `exists` / `not_exists` conditions', () => {
  const evaluator = new ConditionEvaluator();

  const condition = (field: string, operator: ConditionOperator): WorkflowCondition => ({
    id: `cond-${operator}`,
    field,
    operator,
    value: undefined as unknown as never,
  });

  const context: WorkflowContext = {
    workflowId: 'wf-regression',
    runId: 'run-regression',
    variables: {},
    contact: { email: 'deangilmore@smartcrm.vip' },
  } as unknown as WorkflowContext;

  it('`exists` is true when the field is present', () => {
    expect(evaluator.evaluate(condition('contact.email', ConditionOperator.EXISTS), context)).toBe(
      true
    );
  });

  it('`exists` is false when the field is absent', () => {
    expect(evaluator.evaluate(condition('contact.phone', ConditionOperator.EXISTS), context)).toBe(
      false
    );
  });

  it('`not_exists` is true when the field is absent', () => {
    expect(
      evaluator.evaluate(condition('contact.phone', ConditionOperator.NOT_EXISTS), context)
    ).toBe(true);
  });

  it('`not_exists` is false when the field is present', () => {
    expect(
      evaluator.evaluate(condition('contact.email', ConditionOperator.NOT_EXISTS), context)
    ).toBe(false);
  });

  it('treats null and undefined as absent', () => {
    const ctx = {
      ...context,
      contact: { email: null, fullName: undefined },
    } as unknown as WorkflowContext;

    expect(evaluator.evaluate(condition('contact.email', ConditionOperator.EXISTS), ctx)).toBe(
      false
    );
    expect(evaluator.evaluate(condition('contact.email', ConditionOperator.NOT_EXISTS), ctx)).toBe(
      true
    );
    expect(
      evaluator.evaluate(condition('contact.fullName', ConditionOperator.NOT_EXISTS), ctx)
    ).toBe(true);
  });

  it('supports the legacy string operator spellings used by persisted conditions', () => {
    const persisted = {
      id: 'cond-legacy',
      field: 'contact.email',
      operator: 'exists',
      value: undefined,
    } as unknown as WorkflowCondition;

    expect(evaluator.evaluate(persisted, context)).toBe(true);
  });

  it('evaluates boolean condition groups containing existence conditions', () => {
    const group = {
      id: 'group-1',
      operator: 'AND',
      conditions: [
        condition('contact.email', ConditionOperator.EXISTS),
        condition('contact.phone', ConditionOperator.NOT_EXISTS),
      ],
    } as never;

    expect(evaluator.evaluateGroup(group)).toBe(true);
  });
});

describe('PR #5: workflow action/trigger ID normalization', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  it('registers action IDs in both the registry spelling and the public enum spelling', () => {
    registerAllActions(engine);
    const registered = engine.getRegisteredActions();

    // Registry spelling (engine / persisted workflows)
    expect(registered).toContain('SEND_EMAIL');
    // Public enum spelling (WorkflowBuilder / public API consumers)
    expect(registered).toContain(WorkflowAction.SEND_EMAIL);
    expect(registered).toContain(WorkflowAction.NOTIFY);
    expect(registered).toContain(WorkflowAction.CREATE_CONTACT);
  });

  it('registers trigger IDs in both spellings', () => {
    registerAllTriggers(engine);
    const registered = engine.getRegisteredTriggers();

    expect(registered).toContain('RECORD_CREATED');
    expect(registered).toContain(WorkflowTrigger.CONTACT_CREATED);
    expect(registered).toContain(WorkflowTrigger.DEAL_STAGE_CHANGED);
  });

  it('executes an action addressed by the public (lowercase) enum ID', async () => {
    registerAllActions(engine);

    const result = await engine.executeAction(
      WorkflowAction.SEND_EMAIL,
      {
        workflowId: 'wf-regression',
        runId: 'run-regression',
        variables: {},
      } as unknown as WorkflowContext,
      { to: 'deangilmore@smartcrm.vip', subject: 'Hi', body: 'Hello' }
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('resolves public enum trigger IDs to real detectors', async () => {
    registerAllTriggers(engine);

    const triggered = await engine.evaluateTrigger(WorkflowTrigger.CONTACT_CREATED, {
      triggerType: WorkflowTrigger.CONTACT_CREATED,
      recordId: 'contact-1',
    } as unknown as WorkflowContext);

    expect(triggered.triggered).toBe(true);
    expect(triggered.context?.recordId).toBe('contact-1');
  });

  it('still resolves the uppercase spelling used by persisted workflows', async () => {
    registerAllTriggers(engine);

    const triggered = await engine.evaluateTrigger('CONTACT_CREATED', {
      triggerType: 'CONTACT_CREATED',
      recordId: 'contact-1',
    } as unknown as WorkflowContext);

    expect(triggered.triggered).toBe(true);
  });

  it('runs a workflow created from the builder enums end to end', async () => {
    registerAllTriggers(engine);
    registerAllActions(engine);

    const trigger = await engine.evaluateTrigger(WorkflowTrigger.CONTACT_CREATED, {
      triggerType: WorkflowTrigger.CONTACT_CREATED,
      recordId: 'contact-42',
    } as unknown as WorkflowContext);
    expect(trigger.triggered).toBe(true);

    const action = await engine.executeAction(
      WorkflowAction.CREATE_TASK,
      {
        ...trigger.context,
        workflowId: 'wf-regression',
        runId: 'run-regression',
        variables: {},
      } as unknown as WorkflowContext,
      { title: 'Follow up', contactId: 'contact-42' }
    );

    expect(action.success).toBe(true);
  });

  it('exposes a public enum member for every registered action', () => {
    registerAllActions(engine);

    const registered = engine.getRegisteredActions();
    const canonical = registered.map((id) => id.toUpperCase());

    for (const value of Object.values(WorkflowAction)) {
      expect(canonical, `action ${String(value)} is not registered`).toContain(
        String(value).toUpperCase()
      );
    }

    // Every executable action must be addressable through the public enum.
    for (const id of canonical) {
      expect(Object.values(WorkflowAction).some((v) => String(v).toUpperCase() === id)).toBe(true);
    }
  });

  it('exposes a public enum member for every registered trigger', () => {
    registerAllTriggers(engine);

    const registered = engine.getRegisteredTriggers();
    const canonical = registered.map((id) => id.toUpperCase());

    for (const id of canonical) {
      expect(Object.values(WorkflowTrigger).some((v) => String(v).toUpperCase() === id)).toBe(true);
    }

    for (const value of Object.values(WorkflowTrigger)) {
      expect(canonical, `trigger ${String(value)} is not registered`).toContain(
        String(value).toUpperCase()
      );
    }
  });
});
