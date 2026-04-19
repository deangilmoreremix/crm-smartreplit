import { createClient } from '@supabase/supabase-js';
import type {
  WorkflowDefinition,
  WorkflowExecution,
  ActionResult,
  WorkflowCondition,
  ConditionGroup,
  TriggerConfig,
  ActionConfig,
  WorkflowAction,
  WorkflowLog,
  WorkflowStats,
} from './types';
import {
  ConditionOperator,
  LogicalOperator,
  WorkflowTrigger,
  WorkflowAction as WorkflowActionEnum,
} from './types';

export class ConditionEvaluator {
  evaluate(condition: WorkflowCondition, context: Record<string, unknown>): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const { operator, value } = condition;

    switch (operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === value;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== value;
      case ConditionOperator.CONTAINS:
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case ConditionOperator.STARTS_WITH:
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
      case ConditionOperator.ENDS_WITH:
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(value);
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(value);
      case ConditionOperator.BETWEEN:
        if (Array.isArray(value) && value.length === 2) {
          return Number(fieldValue) >= Number(value[0]) && Number(fieldValue) <= Number(value[1]);
        }
        return false;
      case ConditionOperator.IS_EMPTY:
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case ConditionOperator.IS_NOT_EMPTY:
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      case ConditionOperator.INCLUDES:
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        return String(fieldValue)
          .split(',')
          .map((v) => v.trim())
          .includes(String(value));
      case ConditionOperator.NOT_INCLUDES:
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(value);
        }
        return !String(fieldValue)
          .split(',')
          .map((v) => v.trim())
          .includes(String(value));
      default:
        return false;
    }
  }

  evaluateGroup(group: ConditionGroup, context: Record<string, unknown>): boolean {
    if (group.conditions.length === 0) return true;

    const results = group.conditions.map((condition) => this.evaluate(condition, context));

    if (group.logicalOperator === LogicalOperator.AND) {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  private getFieldValue(field: string, context: Record<string, unknown>): unknown {
    const parts = field.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}

export class ActionExecutor {
  private supabase: ReturnType<typeof createClient> | null = null;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async execute(action: ActionConfig, context: Record<string, unknown>): Promise<ActionResult> {
    const startTime = new Date();

    try {
      let result: unknown;

      switch (action.type) {
        case WorkflowActionEnum.SEND_EMAIL:
          result = await this.executeSendEmail(action.config, context);
          break;
        case WorkflowActionEnum.UPDATE_FIELD:
          result = await this.executeUpdateField(action.config, context);
          break;
        case WorkflowActionEnum.CREATE_TASK:
          result = await this.executeCreateTask(action.config, context);
          break;
        case WorkflowActionEnum.WEBHOOK:
          result = await this.executeWebhook(action.config, context);
          break;
        case WorkflowActionEnum.NOTIFY:
          result = await this.executeNotify(action.config, context);
          break;
        case WorkflowActionEnum.SCORE_CONTACT:
          result = await this.executeScoreContact(action.config, context);
          break;
        case WorkflowActionEnum.ADD_TAG:
          result = await this.executeAddTag(action.config, context);
          break;
        case WorkflowActionEnum.REMOVE_TAG:
          result = await this.executeRemoveTag(action.config, context);
          break;
        case WorkflowActionEnum.UPDATE_DEAL_STAGE:
          result = await this.executeUpdateDealStage(action.config, context);
          break;
        case WorkflowActionEnum.ENRICH_CONTACT:
          result = await this.executeEnrichContact(action.config, context);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      return {
        actionId: action.id,
        actionType: action.type,
        success: true,
        data: result,
        executedAt: startTime,
      };
    } catch (error) {
      return {
        actionId: action.id,
        actionType: action.type,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executedAt: startTime,
      };
    }
  }

  private async executeSendEmail(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    console.log('[ActionExecutor] Sending email:', { config, context });
    return { sent: true, messageId: `msg_${Date.now()}` };
  }

  private async executeUpdateField(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.supabase) throw new Error('Supabase not configured');
    const { objectType, objectId, field, value } = config as {
      objectType: string;
      objectId: string;
      field: string;
      value: unknown;
    };

    const { data, error } = await this.supabase
      .from(objectType === 'contact' ? 'contacts' : objectType === 'deal' ? 'deals' : 'tasks')
      .update({ [field]: value, updatedAt: new Date().toISOString() })
      .eq('id', objectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async executeCreateTask(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.supabase) throw new Error('Supabase not configured');
    const taskConfig = config as Record<string, unknown>;

    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        title: taskConfig.title,
        description: taskConfig.description,
        status: taskConfig.status || 'pending',
        priority: taskConfig.priority || 'medium',
        dueDate: taskConfig.dueDate,
        contactId: taskConfig.contactId || context.contactId,
        dealId: taskConfig.dealId || context.dealId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async executeWebhook(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    const webhookConfig = config as {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: Record<string, unknown>;
    };

    const response = await fetch(webhookConfig.url, {
      method: webhookConfig.method,
      headers: {
        'Content-Type': 'application/json',
        ...webhookConfig.headers,
      },
      body: webhookConfig.body ? JSON.stringify({ ...webhookConfig.body, context }) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    return { status: response.status, ok: response.ok };
  }

  private async executeNotify(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    console.log('[ActionExecutor] Sending notification:', { config, context });
    return { notified: true, type: (config as { type?: string }).type || 'in_app' };
  }

  private async executeScoreContact(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.supabase) throw new Error('Supabase not configured');
    const scoreConfig = config as {
      scoreType: 'lead' | 'engagement' | 'health';
      increment?: number;
      setValue?: number;
      reason?: string;
    };

    const contactId = context.contactId as string;
    if (!contactId) throw new Error('No contactId in context');

    const scoreField = `${scoreConfig.scoreType}Score`;
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (scoreConfig.setValue !== undefined) {
      updateData[scoreField] = scoreConfig.setValue;
    }

    const { data, error } = await this.supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async executeAddTag(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.supabase) throw new Error('Supabase not configured');
    const tag = config.tag as string;
    const contactId = (context.contactId || config.contactId) as string;

    const { data: contact, error: fetchError } = await this.supabase
      .from('contacts')
      .select('tags')
      .eq('id', contactId)
      .single();

    if (fetchError) throw fetchError;

    const currentTags = (contact.tags as string[]) || [];
    const newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag];

    const { data, error } = await this.supabase
      .from('contacts')
      .update({ tags: newTags, updatedAt: new Date().toISOString() })
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async executeRemoveTag(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.supabase) throw new Error('Supabase not configured');
    const tag = config.tag as string;
    const contactId = (context.contactId || config.contactId) as string;

    const { data: contact, error: fetchError } = await this.supabase
      .from('contacts')
      .select('tags')
      .eq('id', contactId)
      .single();

    if (fetchError) throw fetchError;

    const currentTags = ((contact.tags as string[]) || []).filter((t) => t !== tag);

    const { data, error } = await this.supabase
      .from('contacts')
      .update({ tags: currentTags, updatedAt: new Date().toISOString() })
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async executeUpdateDealStage(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.supabase) throw new Error('Supabase not configured');
    const { stage, probability } = config as { stage: string; probability?: number };
    const dealId = (context.dealId || config.dealId) as string;

    const updateData: Record<string, unknown> = {
      stage,
      updatedAt: new Date().toISOString(),
    };

    if (probability !== undefined) {
      updateData.probability = probability;
    }

    const { data, error } = await this.supabase
      .from('deals')
      .update(updateData)
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async executeEnrichContact(
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.supabase) throw new Error('Supabase not configured');
    const contactId = (context.contactId as string) || (config.contactId as string);

    console.log('[ActionExecutor] Enriching contact:', contactId);
    return { enriched: true, contactId };
  }
}

export class WorkflowEngine {
  private supabase: ReturnType<typeof createClient> | null = null;
  private conditionEvaluator: ConditionEvaluator;
  private actionExecutor: ActionExecutor;
  private logs: WorkflowLog[] = [];

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    this.conditionEvaluator = new ConditionEvaluator();
    this.actionExecutor = new ActionExecutor(supabaseUrl, supabaseKey);
  }

  async evaluate(
    workflow: WorkflowDefinition,
    triggerData: Record<string, unknown>
  ): Promise<boolean> {
    this.log(`Evaluating workflow: ${workflow.name}`, 'info', { workflowId: workflow.id });

    const trigger = workflow.trigger;

    if (!this.matchesTrigger(trigger, triggerData)) {
      this.log('Trigger does not match', 'info', { trigger, triggerData });
      return false;
    }

    if (trigger.conditions && trigger.conditions.length > 0) {
      for (const conditionGroup of trigger.conditions) {
        const result = this.conditionEvaluator.evaluateGroup(conditionGroup, triggerData);
        if (!result) {
          this.log('Conditions not met', 'info', { conditionGroup });
          return false;
        }
      }
    }

    this.log('Workflow conditions met, will execute', 'info', { workflowId: workflow.id });
    return true;
  }

  private matchesTrigger(trigger: TriggerConfig, triggerData: Record<string, unknown>): boolean {
    const triggerType = trigger.type;
    const eventType = triggerData.eventType as string;

    if (triggerType === WorkflowTrigger.MANUAL || triggerType === 'MANUAL') {
      return true;
    }

    if (triggerType === WorkflowTrigger.CONTACT_CREATED || triggerType === 'RECORD_CREATED') {
      return eventType === 'contact_created' || eventType === 'record_created';
    }

    if (triggerType === WorkflowTrigger.DEAL_STAGE_CHANGED || triggerType === 'RECORD_UPDATED') {
      return eventType === 'deal_stage_changed' || eventType === 'record_updated';
    }

    if (triggerType === WorkflowTrigger.EMAIL_SENT) {
      return eventType === 'email_sent';
    }

    if (triggerType === WorkflowTrigger.SCHEDULED || triggerType === 'SCHEDULED') {
      return eventType === 'scheduled';
    }

    if (triggerType === WorkflowTrigger.FORM_SUBMITTED) {
      return eventType === 'form_submitted';
    }

    if (triggerType === WorkflowTrigger.WEBHOOK || triggerType === 'WEBHOOK') {
      return eventType === 'webhook';
    }

    if (triggerType === WorkflowTrigger.RECORD_UPDATED) {
      return eventType === 'record_updated';
    }

    if (triggerType === WorkflowTrigger.RECORD_DELETED) {
      return eventType === 'record_deleted';
    }

    return false;
  }

  async execute(
    workflow: WorkflowDefinition,
    triggerData: Record<string, unknown>
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context = { ...triggerData };

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id || '',
      workflowName: workflow.name,
      status: 'running',
      triggerData,
      context,
      results: [],
      startedAt: new Date(),
    };

    this.log(`Starting workflow execution: ${executionId}`, 'info', { workflowId: workflow.id });

    try {
      for (const action of workflow.actions.sort((a, b) => a.order - b.order)) {
        if (action.delay && action.delay > 0) {
          await this.delay(action.delay);
        }

        if (action.condition && action.condition.conditions.length > 0) {
          const conditionMet = this.conditionEvaluator.evaluateGroup(action.condition, context);
          if (!conditionMet) {
            this.log(`Skipping action ${action.id} due to condition`, 'info');
            continue;
          }
        }

        const result = await this.actionExecutor.execute(action, context);
        execution.results.push(result);

        if (!result.success) {
          this.log(`Action ${action.id} failed: ${result.error}`, 'error');
        } else {
          this.log(`Action ${action.id} completed successfully`, 'info');
        }

        if (result.data) {
          context[`action_${action.id}_result`] = result.data;
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      this.log(`Workflow execution completed: ${executionId}`, 'info');
    } catch (error) {
      execution.status = 'failed';
      execution.errorMessage = error instanceof Error ? error.message : String(error);
      execution.completedAt = new Date();
      this.log(`Workflow execution failed: ${executionId}`, 'error', {
        error: execution.errorMessage,
      });
    }

    await this.saveExecution(execution);
    return execution;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async saveWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    if (!this.supabase) throw new Error('Supabase not configured');

    const workflowData = {
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger as unknown,
      steps: workflow.actions as unknown,
      isActive: workflow.isActive,
      workspaceId: workflow.workspaceId,
      createdBy: workflow.createdBy,
    };

    if (workflow.id) {
      const { data, error } = await this.supabase
        .from('workflows')
        .update({ ...workflowData, updatedAt: new Date().toISOString() })
        .eq('id', workflow.id)
        .select()
        .single();

      if (error) throw error;
      return this.mapToWorkflowDefinition(data);
    } else {
      const { data, error } = await this.supabase
        .from('workflows')
        .insert(workflowData)
        .select()
        .single();

      if (error) throw error;
      return this.mapToWorkflowDefinition(data);
    }
  }

  async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase.from('workflows').select('*').eq('id', id).single();

    if (error) return null;
    return this.mapToWorkflowDefinition(data);
  }

  async getWorkflows(workspaceId?: string): Promise<WorkflowDefinition[]> {
    if (!this.supabase) throw new Error('Supabase not configured');

    let query = this.supabase.from('workflows').select('*');

    if (workspaceId) {
      query = query.eq('workspaceId', workspaceId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(this.mapToWorkflowDefinition);
  }

  async getWorkflowRuns(workflowId: string, limit = 50): Promise<WorkflowExecution[]> {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('workflow_runs')
      .select('*')
      .eq('workflowId', workflowId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this.mapToWorkflowExecution);
  }

  private async saveExecution(execution: WorkflowExecution): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase.from('workflow_runs').insert({
      workflowId: execution.workflowId,
      status: execution.status,
      triggerData: execution.triggerData as unknown,
      context: execution.context as unknown,
      results: execution.results as unknown,
      errorMessage: execution.errorMessage,
      startedAt: execution.startedAt.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
    });

    if (error) {
      console.error('Failed to save workflow execution:', error);
    }

    if (execution.workflowId) {
      await this.supabase
        .from('workflows')
        .update({
          lastRunAt: new Date().toISOString(),
          runCount: this.supabase.sql`run_count + 1`,
        })
        .eq('id', execution.workflowId);
    }
  }

  private mapToWorkflowDefinition(data: Record<string, unknown>): WorkflowDefinition {
    return {
      id: data.id as string,
      name: data.name as string,
      description: data.description as string | undefined,
      trigger: data.trigger as TriggerConfig,
      actions: (data.steps as ActionConfig[]) || [],
      isActive: data.isActive as boolean,
      workspaceId: data.workspaceId as string | undefined,
      createdBy: data.createdBy as string | undefined,
      createdAt: data.createdAt ? new Date(data.createdAt as string) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt as string) : undefined,
      lastRunAt: data.lastRunAt ? new Date(data.lastRunAt as string) : undefined,
      runCount: data.runCount as number | undefined,
    };
  }

  private mapToWorkflowExecution(data: Record<string, unknown>): WorkflowExecution {
    return {
      id: data.id as string,
      workflowId: data.workflowId as string,
      workflowName: '',
      status: data.status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
      triggerData: (data.triggerData as Record<string, unknown>) || {},
      context: (data.context as Record<string, unknown>) || {},
      results: (data.results as ActionResult[]) || [],
      errorMessage: data.errorMessage as string | undefined,
      startedAt: new Date(data.startedAt as string),
      completedAt: data.completedAt ? new Date(data.completedAt as string) : undefined,
    };
  }

  private log(
    message: string,
    level: 'info' | 'warn' | 'error',
    metadata?: Record<string, unknown>
  ): void {
    const logEntry: WorkflowLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: '',
      executionId: '',
      level,
      message,
      metadata,
      timestamp: new Date(),
    };

    this.logs.push(logEntry);
    console.log(`[WorkflowEngine][${level.toUpperCase()}] ${message}`, metadata || '');
  }

  getLogs(): WorkflowLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  async getStats(workflowId?: string): Promise<WorkflowStats> {
    if (!this.supabase) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageExecutionTime: 0,
        mostUsedTrigger: null,
        mostUsedAction: null,
      };
    }

    let query = this.supabase.from('workflow_runs').select('*');

    if (workflowId) {
      query = query.eq('workflowId', workflowId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageExecutionTime: 0,
        mostUsedTrigger: null,
        mostUsedAction: null,
      };
    }

    const runs = data as Array<{
      status: string;
      startedAt: string;
      completedAt: string | null;
    }>;

    const completedRuns = runs.filter((r) => r.status === 'completed');
    const failedRuns = runs.filter((r) => r.status === 'failed');

    const executionTimes = completedRuns
      .filter((r) => r.completedAt)
      .map((r) => new Date(r.completedAt!).getTime() - new Date(r.startedAt).getTime());

    const avgTime =
      executionTimes.length > 0
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        : 0;

    return {
      totalRuns: runs.length,
      successfulRuns: completedRuns.length,
      failedRuns: failedRuns.length,
      averageExecutionTime: avgTime,
      mostUsedTrigger: null,
      mostUsedAction: null,
    };
  }
}

export default WorkflowEngine;
