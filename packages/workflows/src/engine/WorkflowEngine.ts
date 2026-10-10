import { WorkflowRunStatus } from '../schema/workflow.schema.ts';
import { ConditionEvaluator } from './conditionEvaluator';

export interface WorkflowContext {
  workflowId: string;
  runId: string;
  triggerType: string;
  recordId?: string;
  userId?: string;
  timestamp: Date;
  variables: Record<string, unknown>;
}

export interface ActionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration?: number;
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

export class WorkflowEngine {
  private triggers: Map<string, TriggerDetector> = new Map();
  private actions: Map<string, ActionExecutor> = new Map();
  private conditionEvaluator: ConditionEvaluator;

  constructor() {
    this.conditionEvaluator = new ConditionEvaluator();
  }

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
    const executor = this.actions.get(actionType);
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

  async executeWorkflow(
    steps: Array<{
      id: string;
      actionType: string;
      configuration: Record<string, unknown>;
      order: number;
      parentId?: string;
      condition?: Record<string, unknown>;
    }>,
    context: WorkflowContext
  ): Promise<{ success: boolean; results: Record<string, ActionResult> }> {
    const results: Record<string, ActionResult> = {};
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

    for (const step of sortedSteps) {
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        results[step.id] = { success: true, output: 'Skipped: condition not met' };
        continue;
      }

      const result = await this.executeAction(step.actionType, context, step.configuration);
      results[step.id] = result;

      if (!result.success && step.actionType !== 'CODE') {
        break;
      }
    }

    const allSuccessful = Object.values(results).every((r) => r.success);
    return { success: allSuccessful, results };
  }

  private evaluateCondition(condition: Record<string, unknown>, context: WorkflowContext): boolean {
    return this.conditionEvaluator.evaluate(condition as any, context.variables);
  }

  getRegisteredTriggers(): string[] {
    return Array.from(this.triggers.keys());
  }

  getRegisteredActions(): string[] {
    return Array.from(this.actions.keys());
  }
}

export const workflowEngine = new WorkflowEngine();
