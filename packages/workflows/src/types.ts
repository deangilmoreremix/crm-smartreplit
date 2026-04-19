import { WorkflowTriggerType, WorkflowRunStatus } from '../shared/schema';

export { WorkflowTriggerType, WorkflowRunStatus };

export enum WorkflowTrigger {
  CONTACT_CREATED = 'contact_created',
  DEAL_STAGE_CHANGED = 'deal_stage_changed',
  EMAIL_SENT = 'email_sent',
  SCHEDULED = 'scheduled',
  FORM_SUBMITTED = 'form_submitted',
  RECORD_CREATED = 'record_created',
  RECORD_UPDATED = 'record_updated',
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
}

export enum WorkflowAction {
  SEND_EMAIL = 'send_email',
  UPDATE_FIELD = 'update_field',
  CREATE_TASK = 'create_task',
  WEBHOOK = 'webhook',
  NOTIFY = 'notify',
  SCORE_CONTACT = 'score_contact',
  ADD_TAG = 'add_tag',
  REMOVE_TAG = 'remove_tag',
  UPDATE_DEAL_STAGE = 'update_deal_stage',
  ENRICH_CONTACT = 'enrich_contact',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  INCLUDES = 'includes',
  NOT_INCLUDES = 'not_includes',
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export interface ConditionGroup {
  id: string;
  conditions: WorkflowCondition[];
  logicalOperator: LogicalOperator;
}

export interface TriggerConfig {
  type: WorkflowTrigger | WorkflowTriggerType;
  objectType?: 'contact' | 'deal' | 'task' | 'company';
  conditions?: ConditionGroup[];
  schedule?: {
    cron?: string;
    interval?: number;
    timezone?: string;
  };
  webhookUrl?: string;
  formId?: string;
}

export interface ActionConfig {
  id: string;
  type: WorkflowAction;
  order: number;
  config: Record<string, unknown>;
  delay?: number;
  condition?: ConditionGroup;
}

export interface WorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  isActive: boolean;
  workspaceId?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastRunAt?: Date;
  runCount?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowRunStatus;
  triggerData: Record<string, unknown>;
  context: Record<string, unknown>;
  results: ActionResult[];
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface ActionResult {
  actionId: string;
  actionType: WorkflowAction;
  success: boolean;
  data?: unknown;
  error?: string;
  executedAt: Date;
}

export interface WorkflowLog {
  id: string;
  workflowId: string;
  executionId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface WorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageExecutionTime: number;
  mostUsedTrigger: WorkflowTrigger | null;
  mostUsedAction: WorkflowAction | null;
}

export interface EmailActionConfig {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments?: Array<{ name: string; url: string }>;
}

export interface UpdateFieldActionConfig {
  objectType: 'contact' | 'deal' | 'task';
  objectId: string;
  field: string;
  value: unknown;
}

export interface CreateTaskActionConfig {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: Date;
  assignedTo?: string;
  relatedTo?: {
    type: 'contact' | 'deal';
    id: string;
  };
}

export interface WebhookActionConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  retryCount?: number;
}

export interface NotifyActionConfig {
  type: 'in_app' | 'email' | 'sms';
  recipient: string;
  message: string;
  title?: string;
}

export interface ScoreContactActionConfig {
  scoreType: 'lead' | 'engagement' | 'health';
  increment?: number;
  setValue?: number;
  reason?: string;
}

export type ActionConfigType =
  | EmailActionConfig
  | UpdateFieldActionConfig
  | CreateTaskActionConfig
  | WebhookActionConfig
  | NotifyActionConfig
  | ScoreContactActionConfig;
