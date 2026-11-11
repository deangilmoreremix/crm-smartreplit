import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowEngine, MAX_ITERATIONS, type WorkflowStep } from '../engine/WorkflowEngine';
import { registerAllActions } from '../actions';

vi.mock('../supabase', () => ({ supabase: { from: () => ({}) } }));

const ctx = (variables: Record<string, unknown> = {}) => ({
  workflowId: 'wf',
  runId: 'run',
  triggerType: 'MANUAL',
  userId: 'u1',
  timestamp: new Date(),
  variables,
});
const step = (id: string, actionType: string, configuration: any, order: number): WorkflowStep => ({
  id,
  actionType,
  configuration,
  order,
});

describe('waits nested in IF_ELSE / ITERATOR', () => {
  let engine: WorkflowEngine;
  const calls: string[] = [];
  beforeEach(() => {
    engine = new WorkflowEngine();
    registerAllActions(engine);
    calls.length = 0;
    engine.registerAction('ECHO', async (_c, cfg) => {
      calls.push(String(cfg.value));
      return { success: true, output: { value: cfg.value } };
    });
  });

  const resume = (wf: WorkflowStep[], first: Awaited<ReturnType<WorkflowEngine['executeWorkflow']>>, output: unknown, variables = {}) =>
    engine.executeWorkflow(wf, ctx(variables), {
      resumeFromStepId: first.wait!.stepId,
      cursor: first.cursor,
      priorResults: first.results,
      priorStepsOut: first.stepsOut,
      priorExecutions: first.executions,
      resumeOutput: output,
    });

  it('a long DELAY in an IF_ELSE branch pauses with a cursor and resumes with the remaining siblings', async () => {
    const wf = [
      step('c', 'IF_ELSE', {
        condition: { field: 'trigger.go', operator: 'equals', value: 'yes' },
        then: [
          step('t1', 'ECHO', { value: 'before' }, 1),
          step('d', 'DELAY', { duration: 5, unit: 'minutes' }, 2),
          step('t2', 'ECHO', { value: 'after:{{steps.t1.output.value}}' }, 3),
        ],
        else: [step('e1', 'ECHO', { value: 'else' }, 1)],
      }, 1),
      step('z', 'ECHO', { value: 'end' }, 2),
    ];
    const first = await engine.executeWorkflow(wf, ctx({ go: 'yes' }));
    expect(first.status).toBe('waiting');
    expect(first.wait).toMatchObject({ kind: 'delay', stepId: 'd' });
    expect(first.cursor).toEqual([{ kind: 'if', stepId: 'c', branch: 'then' }]);
    expect(calls).toEqual(['before']);

    // Resume with different trigger data: the saved branch is used, not re-evaluated.
    const second = await resume(wf, first, { resumed: true }, { go: 'no' });
    expect(second.status).toBe('completed');
    expect(calls).toEqual(['before', 'after:before', 'end']);
    expect(second.results.c).toMatchObject({ success: true, output: { branch: 'then' } });
  });

  it('WAIT_FOR_EVENT and FORM inside a branch pause and resume', async () => {
    const wf = [
      step('c', 'IF_ELSE', {
        condition: { field: 'trigger.x', operator: 'exists' },
        then: [
          step('w', 'WAIT_FOR_EVENT', { event: 'record_created', objectType: 'deals' }, 1),
          step('f', 'FORM', { fields: [{ name: 'email' }] }, 2),
          step('o', 'ECHO', { value: '{{steps.f.output.email}}' }, 3),
        ],
      }, 1),
    ];
    const a = await engine.executeWorkflow(wf, ctx({ x: 1 }));
    expect(a.wait).toMatchObject({ kind: 'event', eventKey: 'RECORD_CREATED:deals', stepId: 'w' });
    const b = await resume(wf, a, { event: {} }, { x: 1 });
    expect(b.status).toBe('waiting');
    expect(b.wait).toMatchObject({ kind: 'form', stepId: 'f' });
    const c = await resume(wf, b, { email: 'a@b.co' }, { x: 1 });
    expect(c.status).toBe('completed');
    expect(calls).toEqual(['a@b.co']);
  });

  it('a wait inside an iteration resumes that iteration then continues the remaining ones', async () => {
    const wf = [
      step('it', 'ITERATOR', {
        items: ['a', 'b', 'c'],
        steps: [
          step('s1', 'ECHO', { value: 'pre-{{item}}' }, 1),
          step('d', 'DELAY', { duration: 1, unit: 'hours' }, 2),
          step('s2', 'ECHO', { value: 'post-{{item}}-{{index}}' }, 3),
        ],
      }, 1),
      step('end', 'ECHO', { value: 'done' }, 2),
    ];
    let outcome = await engine.executeWorkflow(wf, ctx());
    const cursors: unknown[] = [];
    let pauses = 0;
    while (outcome.status === 'waiting') {
      pauses++;
      cursors.push(outcome.cursor);
      outcome = await resume(wf, outcome, { resumed: true });
    }
    expect(pauses).toBe(3);
    expect(cursors[1]).toEqual([{ kind: 'iter', stepId: 'it', index: 1, items: ['a', 'b', 'c'], iterations: expect.any(Array) }]);
    expect(outcome.status).toBe('completed');
    expect(calls).toEqual(['pre-a', 'post-a-0', 'pre-b', 'post-b-1', 'pre-c', 'post-c-2', 'done']);
    expect(outcome.results.it).toMatchObject({ success: true, output: { count: 3 } });
  });

  it('supports a wait two containers deep (iterator > if_else)', async () => {
    const wf = [
      step('it', 'ITERATOR', {
        items: [1, 2],
        steps: [
          step('c', 'IF_ELSE', {
            condition: { field: 'item', operator: 'equals', value: 2 },
            then: [step('d', 'DELAY', { duration: 2, unit: 'hours' }, 1), step('after', 'ECHO', { value: 'two' }, 2)],
            else: [step('e', 'ECHO', { value: 'one' }, 1)],
          }, 1),
        ],
      }, 1),
    ];
    const a = await engine.executeWorkflow(wf, ctx());
    expect(a.status).toBe('waiting');
    expect(a.cursor).toMatchObject([
      { kind: 'iter', stepId: 'it', index: 1 },
      { kind: 'if', stepId: 'c', branch: 'then' },
    ]);
    const b = await resume(wf, a, { resumed: true });
    expect(b.status).toBe('completed');
    expect(calls).toEqual(['one', 'two']);
  });

  it('fails the resume cleanly when the paused step no longer exists', async () => {
    const wf = [step('c', 'IF_ELSE', { condition: { field: 'x', operator: 'exists' }, then: [step('d', 'DELAY', { duration: 1, unit: 'hours' }, 1)] }, 1)];
    const a = await engine.executeWorkflow(wf, ctx({ x: 1 }));
    const edited = [step('c', 'IF_ELSE', { condition: { field: 'x', operator: 'exists' }, then: [] }, 1)];
    const r = await resume(edited, a, {}, { x: 1 });
    expect(r.status).toBe('failed');
    expect(r.results.c.error).toContain('Cannot resume');
  });

  it('still enforces nesting, iteration and step-execution limits', async () => {
    const deep = [
      step('a', 'IF_ELSE', { condition: { field: 'x', operator: 'exists' }, then: [
        step('b', 'IF_ELSE', { condition: { field: 'x', operator: 'exists' }, then: [
          step('c', 'IF_ELSE', { condition: { field: 'x', operator: 'exists' }, then: [
            step('d', 'IF_ELSE', { condition: { field: 'x', operator: 'exists' }, then: [step('w', 'DELAY', { duration: 1, unit: 'hours' }, 1)] }, 1),
          ] }, 1),
        ] }, 1),
      ] }, 1),
    ];
    const r = await engine.executeWorkflow(deep, ctx({ x: 1 }));
    expect(r.status).toBe('failed');

    const big = await engine.executeWorkflow(
      [step('it', 'ITERATOR', { items: Array.from({ length: MAX_ITERATIONS + 1 }, (_, i) => i), steps: [step('d', 'DELAY', { duration: 1, unit: 'hours' }, 1)] }, 1)],
      ctx()
    );
    expect(big.status).toBe('failed');

    // the step budget carries across pauses (the container re-entry counts as one execution)
    const wf = [step('it', 'ITERATOR', { items: [1], steps: [step('d', 'DELAY', { duration: 1, unit: 'hours' }, 1)] }, 1)];
    const a = await engine.executeWorkflow(wf, ctx());
    const exhausted = await engine.executeWorkflow(wf, ctx(), {
      resumeFromStepId: 'd',
      cursor: a.cursor,
      priorResults: a.results,
      priorExecutions: 499,
      resumeOutput: {},
    });
    expect(exhausted.status).toBe('completed'); // nothing left to execute after the paused step
    const wf2 = [...wf, step('e', 'ECHO', { value: 'x' }, 2)];
    const over = await engine.executeWorkflow(wf2, ctx(), {
      resumeFromStepId: 'd',
      cursor: a.cursor,
      priorResults: a.results,
      priorExecutions: 499,
      resumeOutput: {},
    });
    expect(over.status).toBe('failed');
  });
});
