import { pgTable, text, uuid, jsonb, timestamp, boolean, integer, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// ============================================================================
// WORKFLOW ENUMS
// ============================================================================

export const workflowTriggerTypes = [
  'RECORD_CREATED',
  'RECORD_UPDATED',
  'RECORD_DELETED',
  'MANUAL',
  'SCHEDULED',
  'WEBHOOK',
  'AI_COMPLETED',
] as const;
export type WorkflowTriggerType = (typeof workflowTriggerTypes)[number];

export const workflowRunStatus = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;
export type WorkflowRunStatus = (typeof workflowRunStatus)[number];

export const actionTypes = [
  'SEND_EMAIL',
  'UPDATE_FIELD',
  'CREATE_RECORD',
  'CREATE_TASK',
  'CREATE_NOTE',
  'WEBHOOK',
  'CODE',
  'WAIT',
  'BRANCH',
  'ITERATE',
  'SEND_SMS',
  'CREATE_DEAL',
  'CREATE_CONTACT',
] as const;
export type ActionType = (typeof actionTypes)[number];

// ============================================================================
// WORKFLOW TABLES
// ============================================================================

/**
 * workflows: Main workflow definition table
 * Stores trigger configuration and ordered list of action steps
 */
export const workflows = pgTable('workflows', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  triggerType: text('trigger_type').$type<WorkflowTriggerType>().notNull(),
  appSlug: text('app_slug').notNull(), // 'contacts', 'pipeline', 'ai-agents', etc.
  enabled: boolean('enabled').default(true),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => profiles.id),
  configuration: jsonb('configuration'), // trigger-specific config (e.g., { objectType: 'contact' })
  steps: jsonb('steps').notNull(), // Array of { id, actionType, configuration, order, parentId, condition }
  version: integer('version').default(1),
  lastRunAt: timestamp('last_run_at'),
  runCount: integer('run_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * workflow_actions: Individual actions within a workflow
 * Normalized from workflows.steps for better querying and versioning
 */
export const workflowActions = pgTable('workflow_actions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  actionType: text('action_type').$type<ActionType>().notNull(),
  order: integer('order').notNull(), // execution order
  configuration: jsonb('configuration'), // action-specific parameters
  parentId: uuid('parent_id').references(() => workflowActions.id), // for branches/iterators
  condition: jsonb('condition'), // { field, operator, value } for branch conditions
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * workflow_runs: Track each workflow execution instance
 */
export const workflowRuns = pgTable('workflow_runs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id),
  triggeredBy: jsonb('triggered_by'), // { type, recordId, userId, timestamp }
  status: text('status').$type<WorkflowRunStatus>().default('pending'),
  context: jsonb('context'), // Variables passed through the workflow
  results: jsonb('results'), // { actionId: result, ... }
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * workflow_run_logs: Detailed execution logs for debugging
 */
export const workflowRunLogs = pgTable('workflow_run_logs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  runId: uuid('run_id')
    .notNull()
    .references(() => workflowRuns.id, { onDelete: 'cascade' }),
  actionId: uuid('action_id').references(() => workflowActions.id),
  step: integer('step').notNull(),
  level: text('level').default('info'), // info, warn, error
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * workflow_credits: Track workflow usage per tenant for billing
 */
export const workflowCredits = pgTable('workflow_credits', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => profiles.id),
  month: date('month').notNull(), // First day of month
  creditsUsed: integer('credits_used').default(0),
  creditsAvailable: integer('credits_available').default(100),
  limit: integer('limit').default(100),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * workflow_templates: Pre-built workflow templates users can install
 */
export const workflowTemplates = pgTable('workflow_templates', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  trigger: jsonb('trigger').notNull(),
  steps: jsonb('steps').notNull(),
  icon: text('icon'),
  isSystem: boolean('is_system').default(false),
  isPublic: boolean('is_public').default(true),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const workflowRelations = relations(workflows, ({ many, one }) => ({
  creator: one(profiles, {
    fields: [workflows.createdBy],
    references: [profiles.id],
  }),
  actions: many(workflowActions),
  runs: many(workflowRuns),
  templates: many(workflowTemplates, {
    relationName: 'basedOn',
    fields: [workflows.id],
    references: [workflowTemplates.id],
  }),
}));

export const workflowActionRelations = relations(workflowActions, ({ many, one }) => ({
  workflow: one(workflows, {
    fields: [workflowActions.workflowId],
    references: [workflows.id],
  }),
  parent: one(workflowActions, {
    fields: [workflowActions.parentId],
    references: [workflowActions.id],
  }),
  children: many(workflowActions, {
    relationName: 'actionChildren',
    fields: [workflowActions.id],
    references: [workflowActions.parentId],
  }),
}));

export const workflowRunRelations = relations(workflowRuns, ({ many, one }) => ({
  workflow: one(workflows, {
    fields: [workflowRuns.workflowId],
    references: [workflows.id],
  }),
  logs: many(workflowRunLogs),
}));

export const workflowRunLogRelations = relations(workflowRunLogs, ({ one }) => ({
  run: one(workflowRuns, {
    fields: [workflowRunLogs.runId],
    references: [workflowRuns.id],
  }),
}));

export const workflowCreditRelations = relations(workflowCredits, ({ one }) => ({
  tenant: one(profiles, {
    fields: [workflowCredits.tenantId],
    references: [profiles.id],
  }),
}));
