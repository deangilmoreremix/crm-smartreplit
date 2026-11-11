import { getPath, interpolate } from './interpolate';

export interface WorkflowContext {
  workflowId: string;
  runId: string;
  triggerType: string;
  recordId?: string;
  userId?: string;
  timestamp: Date;
  variables: Record<string, unknown>;
}

export type WaitRequest =
  | { kind: 'delay'; resumeAt: string }
  | { kind: 'event'; eventKey: string; match?: Record<string, unknown>; resumeAt?: string }
  | {
      kind: 'form';
      form: {
        title?: string;
        fields: Array<{ name: string; label?: string; type?: string; required?: boolean }>;
      };
    };

export interface ActionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration?: number;
  /** Set by pausing actions (delay > inline limit, wait_for_event, form). */
  wait?: WaitRequest;
}

export interface TriggerResult {
  triggered: boolean;
  context?: Partial<WorkflowContext>;
}

export type TriggerDetector = (
  context: Partial<WorkflowContext>
) => Promise<TriggerResult> | TriggerResult;
export type ActionExecutor = (
  context: WorkflowContext,
  config: Record<string, unknown>
) => Promise<ActionResult>;

export interface WorkflowStep {
  id: string;
  actionType: string;
  configuration: Record<string, unknown>;
  order: number;
  parentId?: string;
  condition?: Record<string, unknown>;
}

/**
 * One level of the path from the top-level step list down to a paused step. Persisted in
 * workflow_run_waits.cursor so a run paused inside IF_ELSE / ITERATOR can resume there.
 */
export type CursorFrame =
  | { kind: 'if'; stepId: string; branch: 'then' | 'else' }
  | { kind: 'iter'; stepId: string; index: number; items: unknown[]; iterations: unknown[] };

interface ResumePoint {
  /** Container frames still to descend through (outermost first). Empty: the paused step is in this list. */
  path: CursorFrame[];
  leafId: string;
  output: unknown;
}

export interface ExecuteOptions {
  /** Resume after this previously paused step (nested steps are located through `cursor`). */
  resumeFromStepId?: string;
  /** Containers (IF_ELSE / ITERATOR) the paused step sits inside, outermost first; empty/absent for top level. */
  cursor?: CursorFrame[];
  /** `steps.<id>.output` values recorded before the pause (nested steps are not derivable from results). */
  priorStepsOut?: Record<string, { output: unknown }>;
  /** Step executions already used by earlier segments of this run (the step limit spans pauses). */
  priorExecutions?: number;
  /** Results recorded before the pause. */
  priorResults?: Record<string, ActionResult>;
  /** Output that becomes the paused step's result (form values, event payload...). */
  resumeOutput?: unknown;
}

export interface ExecuteResult {
  success: boolean;
  results: Record<string, ActionResult>;
  status: 'completed' | 'failed' | 'waiting' | 'filtered';
  wait?: WaitRequest & { stepId: string };
  /** Set with `wait`: persist these to resume the run later. */
  cursor?: CursorFrame[];
  stepsOut?: Record<string, { output: unknown }>;
  executions?: number;
}

export const MAX_ITERATIONS = 100;
export const MAX_NESTING = 3;
export const MAX_STEP_EXECUTIONS = 500;
const NESTED_KEYS = ['steps', 'then', 'else'] as const;
const FLOW_ACTIONS = new Set(['IF_ELSE', 'FILTER', 'ITERATOR']);

/** Shared condition evaluator. Supports {field,operator,value} plus {all:[...]} / {any:[...]}. */
export function evaluateCondition(
  condition: Record<string, unknown>,
  scope: Record<string, unknown>,
  variables: Record<string, unknown>
): boolean {
  if (Array.isArray((condition as any).all)) {
    return (condition as any).all.every((c: any) => evaluateCondition(c, scope, variables));
  }
  if (Array.isArray((condition as any).any)) {
    return (condition as any).any.some((c: any) => evaluateCondition(c, scope, variables));
  }
  const { field, operator, value } = condition as { field: string; operator: string; value: unknown };
  const root = String(field ?? '').split(/[.[]/)[0];
  const fieldValue = Object.prototype.hasOwnProperty.call(scope, root)
    ? getPath(scope, String(field))
    : getPath(variables, String(field));

  switch (operator) {
    case 'equals':
      return fieldValue === value || (fieldValue != null && value != null && String(fieldValue) === String(value));
    case 'not_equals':
      return !(fieldValue === value || (fieldValue != null && value != null && String(fieldValue) === String(value)));
    case 'contains':
      return Array.isArray(fieldValue)
        ? fieldValue.map(String).includes(String(value))
        : String(fieldValue ?? '').includes(String(value));
    case 'not_contains':
      return !String(fieldValue ?? '').includes(String(value));
    case 'starts_with':
      return String(fieldValue ?? '').startsWith(String(value));
    case 'ends_with':
      return String(fieldValue ?? '').endsWith(String(value));
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'gte':
      return Number(fieldValue) >= Number(value);
    case 'lte':
      return Number(fieldValue) <= Number(value);
    case 'in':
      return Array.isArray(value) && value.map(String).includes(String(fieldValue));
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;
    case 'is_empty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0);
    default:
      return true;
  }
}

interface RunState {
  results: Record<string, ActionResult>;
  stepsOut: Record<string, { output: unknown }>;
  executions: number;
  filtered: boolean;
  wait?: WaitRequest & { stepId: string };
  waitPath: CursorFrame[];
  failed: boolean;
}

export class WorkflowEngine {
  private triggers: Map<string, TriggerDetector> = new Map();
  private actions: Map<string, ActionExecutor> = new Map();

  registerTrigger(type: string, detector: TriggerDetector): void {
    this.triggers.set(type, detector);
  }

  registerAction(type: string, executor: ActionExecutor): void {
    this.actions.set(type, executor);
  }

  async evaluateTrigger(
    triggerType: string,
    context: Partial<WorkflowContext>
  ): Promise<TriggerResult> {
    const detector = this.triggers.get(triggerType);
    if (!detector) {
      return { triggered: false };
    }
    return detector(context);
  }

  async executeAction(
    actionType: string,
    context: WorkflowContext,
    config: Record<string, unknown>
  ): Promise<ActionResult> {
    const executor = this.actions.get(actionType) ?? this.actions.get(String(actionType).toUpperCase());
    if (!executor) {
      return { success: false, error: `Unknown action type: ${actionType}` };
    }

    const startTime = Date.now();
    try {
      const result = await executor(context, config);
      return {
        ...result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  private scopeFor(context: WorkflowContext, state: RunState, extra: Record<string, unknown> = {}) {
    const vars = context.variables || {};
    return {
      trigger: vars,
      record: vars.record && typeof vars.record === 'object' ? vars.record : vars,
      steps: state.stepsOut,
      run: { id: context.runId, workflowId: context.workflowId },
      ...extra,
    } as Record<string, unknown>;
  }

  private interpolateConfig(step: WorkflowStep, scope: Record<string, unknown>) {
    const type = String(step.actionType).toUpperCase();
    const cfg = { ...(step.configuration || {}) } as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const jsonBody =
      (type === 'HTTP_REQUEST' || type === 'WEBHOOK') &&
      typeof cfg.body === 'string' &&
      /^\s*[{[]/.test(cfg.body);
    for (const [k, v] of Object.entries(cfg)) {
      if ((NESTED_KEYS as readonly string[]).includes(k)) out[k] = v;
      else out[k] = interpolate(v, scope, k === 'body' && jsonBody ? { escapeJson: true } : {});
    }
    return out;
  }

  private async runSteps(
    steps: WorkflowStep[],
    context: WorkflowContext,
    state: RunState,
    depth: number,
    extraScope: Record<string, unknown>,
    keyPrefix: string,
    startIndex = 0,
    resume?: ResumePoint
  ): Promise<void> {
    let first = startIndex;
    if (resume) {
      const targetId = resume.path[0]?.stepId ?? resume.leafId;
      first = steps.findIndex((s) => s.id === targetId);
      if (first < 0) throw new Error(`Cannot resume: step ${targetId} no longer exists`);
    }
    for (let i = first; i < steps.length; i++) {
      const step = steps[i];
      const key = `${keyPrefix}${step.id}`;
      const resuming = resume && i === first ? resume : undefined;
      if (resuming && resuming.path.length === 0) {
        // The paused step itself: its result is what resumed it; continue with the following siblings.
        state.results[key] = { success: true, output: resuming.output };
        state.stepsOut[step.id] = { output: resuming.output };
        continue;
      }
      if (++state.executions > MAX_STEP_EXECUTIONS) {
        state.results[key] = { success: false, error: `Step execution limit (${MAX_STEP_EXECUTIONS}) exceeded` };
        state.failed = true;
        return;
      }
      const scope = this.scopeFor(context, state, extraScope);
      if (!resuming && step.condition && !evaluateCondition(step.condition, scope, context.variables)) {
        state.results[key] = { success: true, output: 'Skipped: condition not met' };
        continue;
      }

      const type = String(step.actionType).toUpperCase();
      let result: ActionResult;
      let config: Record<string, unknown>;
      try {
        config = this.interpolateConfig(step, scope);
      } catch (e) {
        result = { success: false, error: e instanceof Error ? e.message : String(e) };
        state.results[key] = result;
        state.failed = true;
        return;
      }

      if (FLOW_ACTIONS.has(type)) {
        const started = Date.now();
        try {
          result = await this.runFlowAction(type, step, config, context, state, depth, extraScope, key, resuming);
        } catch (e) {
          result = { success: false, error: e instanceof Error ? e.message : String(e) };
        }
        if (state.wait) return; // paused inside this container; it finishes after the resume
        result.duration = Date.now() - started;
        state.results[key] = result;
        if (!result.success) {
          state.failed = true;
          return;
        }
        state.stepsOut[step.id] = { output: result.output };
        if (state.filtered || state.failed) return;
        continue;
      }

      result = await this.executeAction(step.actionType, context, config);
      state.results[key] = result;

      if (result.success && result.wait) {
        state.wait = { ...result.wait, stepId: step.id };
        state.waitPath = [];
        return;
      }
      if (result.success) state.stepsOut[step.id] = { output: result.output };

      if (!result.success && step.actionType !== 'CODE') {
        state.failed = true;
        return;
      }
    }
  }

  private async runFlowAction(
    type: string,
    step: WorkflowStep,
    config: Record<string, unknown>,
    context: WorkflowContext,
    state: RunState,
    depth: number,
    extraScope: Record<string, unknown>,
    key: string,
    resume?: ResumePoint
  ): Promise<ActionResult> {
    const scope = this.scopeFor(context, state, extraScope);
    const sortNested = (raw: unknown): WorkflowStep[] =>
      (Array.isArray(raw) ? (raw as WorkflowStep[]) : [])
        .map((s, idx) => ({ ...s, order: s.order ?? idx, configuration: s.configuration || {} }))
        .sort((a, b) => a.order - b.order);

    if (type === 'FILTER') {
      const condition = config.condition as Record<string, unknown> | undefined;
      if (!condition) return { success: false, error: 'Missing required field: condition' };
      const pass = evaluateCondition(condition, scope, context.variables);
      if (!pass) state.filtered = true;
      return { success: true, output: { passed: pass } };
    }

    if (depth + 1 > MAX_NESTING) {
      return { success: false, error: `Nesting deeper than ${MAX_NESTING} levels is not allowed` };
    }

    if (type === 'IF_ELSE') {
      const condition = config.condition as Record<string, unknown> | undefined;
      if (!condition) return { success: false, error: 'Missing required field: condition' };
      const frame = resume?.path[0];
      const taken =
        frame?.kind === 'if' ? frame.branch === 'then' : evaluateCondition(condition, scope, context.variables);
      await this.runSteps(
        sortNested(taken ? config.then : config.else),
        context,
        state,
        depth + 1,
        extraScope,
        `${key}.${taken ? 'then' : 'else'}.`,
        0,
        resume && { ...resume, path: resume.path.slice(1) }
      );
      if (state.wait) {
        state.waitPath.unshift({ kind: 'if', stepId: step.id, branch: taken ? 'then' : 'else' });
        return { success: true };
      }
      if (state.failed) return { success: false, error: 'A step inside the branch failed', output: { branch: taken } };
      return { success: true, output: { branch: taken ? 'then' : 'else' } };
    }

    // ITERATOR
    const frame = resume?.path[0];
    const items = frame?.kind === 'iter' ? frame.items : config.items;
    if (!Array.isArray(items)) {
      return { success: false, error: 'ITERATOR "items" must resolve to an array' };
    }
    if (items.length > MAX_ITERATIONS) {
      return { success: false, error: `ITERATOR exceeds the ${MAX_ITERATIONS} item limit (${items.length})` };
    }
    const nested = sortNested(config.steps);
    const iterations: unknown[] = frame?.kind === 'iter' ? [...frame.iterations] : [];
    for (let idx = frame?.kind === 'iter' ? frame.index : 0; idx < items.length; idx++) {
      const before = { ...state.stepsOut };
      const resumeHere = resume && frame?.kind === 'iter' && idx === frame.index;
      await this.runSteps(
        nested,
        context,
        state,
        depth + 1,
        { ...extraScope, item: items[idx], index: idx },
        `${key}[${idx}].`,
        0,
        resumeHere ? { ...resume, path: resume.path.slice(1) } : undefined
      );
      if (state.wait) {
        state.waitPath.unshift({ kind: 'iter', stepId: step.id, index: idx, items, iterations });
        return { success: true };
      }
      if (state.failed) {
        return { success: false, error: `Iteration ${idx} failed` };
      }
      iterations.push(
        Object.fromEntries(Object.entries(state.stepsOut).filter(([k]) => !(k in before) || before[k] !== state.stepsOut[k]))
      );
      if (state.filtered) state.filtered = false; // a filter inside an iteration only ends that iteration
    }
    return { success: true, output: { count: items.length, iterations } };
  }

  async executeWorkflow(
    steps: WorkflowStep[],
    context: WorkflowContext,
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    const sorted = [...steps].sort((a, b) => a.order - b.order);
    const state: RunState = {
      results: { ...(options.priorResults || {}) },
      stepsOut: {},
      executions: options.priorExecutions ?? 0,
      filtered: false,
      failed: false,
      waitPath: [],
    };
    for (const [id, r] of Object.entries(state.results)) {
      if (r.success) state.stepsOut[id] = { output: r.output };
    }
    Object.assign(state.stepsOut, options.priorStepsOut || {});

    const resume: ResumePoint | undefined = options.resumeFromStepId
      ? { path: options.cursor || [], leafId: options.resumeFromStepId, output: options.resumeOutput }
      : undefined;
    await this.runSteps(sorted, context, state, 0, {}, '', 0, resume);

    const allSuccessful = Object.values(state.results).every((r) => r.success);
    const status: ExecuteResult['status'] = state.wait
      ? 'waiting'
      : state.filtered
        ? 'filtered'
        : allSuccessful && !state.failed
          ? 'completed'
          : 'failed';
    return {
      success: status !== 'failed',
      results: state.results,
      status,
      ...(state.wait
        ? { wait: state.wait, cursor: state.waitPath, stepsOut: state.stepsOut, executions: state.executions }
        : {}),
    };
  }

  getRegisteredTriggers(): string[] {
    return Array.from(this.triggers.keys());
  }

  getRegisteredActions(): string[] {
    return Array.from(this.actions.keys());
  }
}

export const workflowEngine = new WorkflowEngine();
