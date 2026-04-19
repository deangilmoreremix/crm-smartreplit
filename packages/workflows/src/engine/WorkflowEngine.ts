import { WorkflowRunStatus } from '../schema/workflow.schema';

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
    const { field, operator, value } = condition as {
      field: string;
      operator: string;
      value: unknown;
    };
    const fieldValue = this.getNestedValue(context.variables, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return true;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc, key) => {
      if (acc && typeof acc === 'object' && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }

  getRegisteredTriggers(): string[] {
    return Array.from(this.triggers.keys());
  }

  getRegisteredActions(): string[] {
    return Array.from(this.actions.keys());
  }
}

export const workflowEngine = new WorkflowEngine();
