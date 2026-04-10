import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  json,
  jsonb,
  varchar,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoles = ['super_admin', 'wl_user', 'regular_user'] as const;
export type UserRole = (typeof userRoles)[number];

export const productTiers = [
  'super_admin',
  'whitelabel',
  'smartcrm_bundle',
  'smartcrm',
  'sales_maximizer',
  'ai_boost_unlimited',
  'ai_communication',
] as const;
export type ProductTier = (typeof productTiers)[number];

// Twenty-inspired field types
export const fieldTypes = [
  'TEXT',
  'NUMBER',
  'DATE',
  'DATE_TIME',
  'SELECT',
  'MULTI_SELECT',
  'BOOLEAN',
  'CURRENCY',
  'EMAIL',
  'PHONE',
  'URL',
  'RELATION',
  'RICH_TEXT',
  'JSON',
  'ARRAY',
  'UUID',
  'POSITION',
] as const;
export type FieldType = (typeof fieldTypes)[number];

export const viewTypes = ['table', 'kanban', 'calendar'] as const;
export type ViewType = (typeof viewTypes)[number];

export const workflowTriggerTypes = [
  'RECORD_CREATED',
  'RECORD_UPDATED',
  'RECORD_DELETED',
  'MANUAL',
  'SCHEDULED',
  'WEBHOOK',
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

// ============================================================================
// CORE TABLES
// ============================================================================

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('regular_user'),
  productTier: text('product_tier'),
  avatar: text('avatar_url'),
  appContext: text('app_context').default('smartcrm'),
  emailTemplateSet: text('email_template_set').default('smartcrm'),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  position: text('position'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country'),
  industry: text('industry'),
  source: text('source'),
  tags: text('tags').array(),
  notes: text('notes'),
  status: text('status').default('active'),
  // Twenty-inspired enhancements
  healthScore: integer('health_score'),
  enrichmentData: jsonb('enrichment_data'),
  lastEnrichedAt: timestamp('last_enriched_at'),
  customFields: jsonb('custom_fields').default({}),
  position: integer('position').default(0),
  idempotencyKey: varchar('idempotency_key', { length: 64 }),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  profileId: uuid('profile_id').references(() => profiles.id),
});

export const deals = pgTable('deals', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  value: decimal('value', { precision: 10, scale: 2 }),
  stage: text('stage').notNull(),
  probability: integer('probability').default(0),
  expectedCloseDate: timestamp('expected_close_date'),
  actualCloseDate: timestamp('actual_close_date'),
  description: text('description'),
  status: text('status').default('open'),
  // Twenty-inspired enhancements
  healthScore: integer('health_score'),
  winProbability: integer('win_probability'),
  lastActivityAt: timestamp('last_activity_at'),
  daysInStage: integer('days_in_stage').default(0),
  customFields: jsonb('custom_fields').default({}),
  position: integer('position').default(0),
  idempotencyKey: varchar('idempotency_key', { length: 64 }),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  contactId: integer('contact_id').references(() => contacts.id),
  profileId: uuid('profile_id').references(() => profiles.id),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  priority: text('priority').default('medium'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  customFields: jsonb('custom_fields').default({}),
  position: integer('position').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  contactId: integer('contact_id').references(() => contacts.id),
  dealId: integer('deal_id').references(() => deals.id),
  profileId: uuid('profile_id').references(() => profiles.id),
  assignedTo: uuid('assigned_to').references(() => profiles.id),
});

// ============================================================================
// TWENTY-INSPIRED METADATA TABLES (EAV Pattern)
// ============================================================================

export const objectMetadata = pgTable('object_metadata', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  label: text('label').notNull(),
  labelPlural: text('label_plural'),
  description: text('description'),
  icon: text('icon'),
  isCustom: boolean('is_custom').default(false),
  isActive: boolean('is_active').default(true),
  isSystem: boolean('is_system').default(false),
  workspaceId: uuid('workspace_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const fieldMetadata = pgTable('field_metadata', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  objectMetadataId: uuid('object_metadata_id')
    .references(() => objectMetadata.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  label: text('label').notNull(),
  type: text('type').$type<FieldType>().notNull(),
  description: text('description'),
  icon: text('icon'),
  options: jsonb('options'), // For SELECT, MULTI_SELECT
  defaultValue: jsonb('default_value'),
  settings: jsonb('settings'),
  isCustom: boolean('is_custom').default(false),
  isActive: boolean('is_active').default(true),
  isSystem: boolean('is_system').default(false),
  isNullable: boolean('is_nullable').default(true),
  isUnique: boolean('is_unique').default(false),
  workspaceId: uuid('workspace_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const relationMetadata = pgTable('relation_metadata', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sourceObjectMetadataId: uuid('source_object_metadata_id')
    .references(() => objectMetadata.id, { onDelete: 'cascade' })
    .notNull(),
  targetObjectMetadataId: uuid('target_object_metadata_id')
    .references(() => objectMetadata.id, { onDelete: 'cascade' })
    .notNull(),
  sourceFieldMetadataId: uuid('source_field_metadata_id')
    .references(() => fieldMetadata.id, { onDelete: 'cascade' })
    .notNull(),
  targetFieldMetadataId: uuid('target_field_metadata_id').references(() => fieldMetadata.id, {
    onDelete: 'cascade',
  }),
  relationType: text('relation_type').notNull(), // 'one-to-many', 'many-to-many', 'one-to-one'
  isCustom: boolean('is_custom').default(false),
  workspaceId: uuid('workspace_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// VIEWS TABLE (Twenty-inspired)
// ============================================================================

export const views = pgTable('views', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  objectMetadataId: uuid('object_metadata_id').references(() => objectMetadata.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  type: text('type').$type<ViewType>().notNull(),
  // For Kanban views
  kanbanFieldMetadataId: uuid('kanban_field_metadata_id').references(() => fieldMetadata.id),
  // Filters and sorts
  filters: jsonb('filters').default([]),
  sorts: jsonb('sorts').default([]),
  // Field visibility
  visibleFields: jsonb('visible_fields').default([]),
  hiddenFields: jsonb('hidden_fields').default([]),
  // Aggregations for Kanban
  aggregations: jsonb('aggregations').default([]),
  // Visibility
  visibility: text('visibility').default('personal'), // 'personal', 'workspace'
  isDefault: boolean('is_default').default(false),
  userId: uuid('user_id').references(() => profiles.id),
  workspaceId: uuid('workspace_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// WORKFLOW TABLES (Twenty-inspired)
// ============================================================================

export const workflows = pgTable('workflows', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  trigger: jsonb('trigger').notNull(), // { type, object, conditions, etc. }
  steps: jsonb('steps').notNull(), // Array of workflow steps/actions
  isActive: boolean('is_active').default(false),
  lastRunAt: timestamp('last_run_at'),
  runCount: integer('run_count').default(0),
  workspaceId: uuid('workspace_id').references(() => profiles.id),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workflowRuns = pgTable('workflow_runs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workflowId: uuid('workflow_id')
    .references(() => workflows.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').$type<WorkflowRunStatus>().notNull(),
  triggerData: jsonb('trigger_data'),
  context: jsonb('context'), // Variables throughout the workflow
  results: jsonb('results'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const workflowTemplates = pgTable('workflow_templates', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  trigger: jsonb('trigger').notNull(),
  steps: jsonb('steps').notNull(),
  isSystem: boolean('is_system').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// ROLES & PERMISSIONS (Twenty-inspired)
// ============================================================================

export const roles = pgTable('roles', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  isCustom: boolean('is_custom').default(true),
  workspaceId: uuid('workspace_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  roleId: uuid('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  objectMetadataId: uuid('object_metadata_id').references(() => objectMetadata.id),
  canRead: boolean('can_read').default(false),
  canCreate: boolean('can_create').default(false),
  canUpdate: boolean('can_update').default(false),
  canDelete: boolean('can_delete').default(false),
  fieldPermissions: jsonb('field_permissions'), // { fieldId: { canRead, canUpdate } }
  workspaceId: uuid('workspace_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  roleId: uuid('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  workspaceId: uuid('workspace_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// EXISTING TABLES (preserved from original schema)
// ============================================================================

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: text('location'),
  isVirtual: boolean('is_virtual').default(false),
  meetingUrl: text('meeting_url'),
  status: text('status').default('scheduled'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  contactId: integer('contact_id').references(() => contacts.id),
  profileId: uuid('profile_id').references(() => profiles.id),
});

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  contactId: integer('contact_id').references(() => contacts.id),
  dealId: integer('deal_id').references(() => deals.id),
  profileId: uuid('profile_id').references(() => profiles.id),
});

export const communications = pgTable('communications', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'email', 'sms', 'call', 'meeting'
  direction: text('direction').notNull(), // 'inbound', 'outbound'
  subject: text('subject'),
  content: text('content'),
  status: text('status').default('pending'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  openedAt: timestamp('opened_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  contactId: integer('contact_id').references(() => contacts.id),
  dealId: integer('deal_id').references(() => deals.id),
  profileId: uuid('profile_id').references(() => profiles.id),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  contactId: integer('contact_id').references(() => contacts.id),
  dealId: integer('deal_id').references(() => deals.id),
  profileId: uuid('profile_id').references(() => profiles.id),
});

// ============================================================================
// AI TABLES (preserved from original schema)
// ============================================================================

export const aiQueries = pgTable('ai_queries', {
  id: serial('id').primaryKey(),
  query: text('query').notNull(),
  response: text('response'),
  model: text('model'),
  tokensUsed: integer('tokens_used'),
  cost: decimal('cost', { precision: 10, scale: 6 }),
  status: text('status').default('pending'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  profileId: uuid('profile_id').references(() => profiles.id),
});

export const userAiTokens = pgTable('user_ai_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => profiles.id)
    .notNull()
    .unique(),
  tokensAvailable: integer('tokens_available').default(0),
  tokensUsed: integer('tokens_used').default(0),
  tokensPurchased: integer('tokens_purchased').default(0),
  lastResetAt: timestamp('last_reset_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tokenTransactions = pgTable('token_transactions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => profiles.id)
    .notNull(),
  amount: integer('amount').notNull(),
  type: text('type').notNull(), // 'purchase', 'usage', 'bonus', 'reset'
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userGeneratedImages = pgTable('user_generated_images', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => profiles.id)
    .notNull(),
  prompt: text('prompt').notNull(),
  imageUrl: text('image_url').notNull(),
  model: text('model'),
  size: text('size'),
  cost: decimal('cost', { precision: 10, scale: 6 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// SUBSCRIPTION & BILLING TABLES (preserved)
// ============================================================================

export const entitlements = pgTable('entitlements', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => profiles.id)
    .notNull(),
  productTier: text('product_tier').notNull(),
  status: text('status').default('active'),
  startedAt: timestamp('started_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const featurePackages = pgTable('feature_packages', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  features: jsonb('features').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const profilesRelations = relations(profiles, ({ many }) => ({
  contacts: many(contacts),
  deals: many(deals),
  tasks: many(tasks),
  appointments: many(appointments),
  notes: many(notes),
  communications: many(communications),
  documents: many(documents),
  aiQueries: many(aiQueries),
  userRoles: many(userRoles),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [contacts.profileId],
    references: [profiles.id],
  }),
  deals: many(deals),
  tasks: many(tasks),
  appointments: many(appointments),
  notes: many(notes),
  communications: many(communications),
  documents: many(documents),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [deals.profileId],
    references: [profiles.id],
  }),
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  tasks: many(tasks),
  notes: many(notes),
  communications: many(communications),
  documents: many(documents),
}));

export const objectMetadataRelations = relations(objectMetadata, ({ many }) => ({
  fields: many(fieldMetadata),
  views: many(views),
}));

export const fieldMetadataRelations = relations(fieldMetadata, ({ one }) => ({
  object: one(objectMetadata, {
    fields: [fieldMetadata.objectMetadataId],
    references: [objectMetadata.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ many }) => ({
  runs: many(workflowRuns),
}));

export const workflowRunsRelations = relations(workflowRuns, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowRuns.workflowId],
    references: [workflows.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(permissions),
  userRoles: many(userRoles),
}));

// ============================================================================
// INSERT SCHEMAS
// ============================================================================

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertObjectMetadataSchema = createInsertSchema(objectMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFieldMetadataSchema = createInsertSchema(fieldMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertViewSchema = createInsertSchema(views).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowRunSchema = createInsertSchema(workflowRuns).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPES
// ============================================================================

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type ObjectMetadata = typeof objectMetadata.$inferSelect;
export type InsertObjectMetadata = z.infer<typeof insertObjectMetadataSchema>;

export type FieldMetadata = typeof fieldMetadata.$inferSelect;
export type InsertFieldMetadata = z.infer<typeof insertFieldMetadataSchema>;

export type View = typeof views.$inferSelect;
export type InsertView = z.infer<typeof insertViewSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type InsertWorkflowRun = z.infer<typeof insertWorkflowRunSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
