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

// Twenty-inspired field types (matches FieldMetadataType enum)
export const fieldTypes = [
  'ACTOR',
  'ADDRESS',
  'ARRAY',
  'BOOLEAN',
  'CURRENCY',
  'DATE',
  'DATE_TIME',
  'EMAILS',
  'FILES',
  'FULL_NAME',
  'LINKS',
  'MORPH_RELATION',
  'MULTI_SELECT',
  'NUMBER',
  'NUMERIC',
  'PHONES',
  'POSITION',
  'RATING',
  'RAW_JSON',
  'RELATION',
  'RICH_TEXT',
  'SELECT',
  'TEXT',
  'TS_VECTOR',
  'UUID',
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
// PARTNER & BILLING TABLES
// ============================================================================

export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  phone: text('phone'),
  status: text('status').default('active'),
  tierId: uuid('tier_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const partnerTiers = pgTable('partner_tiers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('0'),
  tierFeatures: jsonb('tier_features').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const partnerMetrics = pgTable('partner_metrics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  period: text('period').notNull(),
  totalSales: decimal('total_sales', { precision: 12, scale: 2 }).default('0'),
  totalCommission: decimal('total_commission', { precision: 12, scale: 2 }).default('0'),
  totalCustomers: integer('total_customers').default(0),
  newCustomers: integer('new_customers').default(0),
  churnedCustomers: integer('churned_customers').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const partnerCustomers = pgTable('partner_customers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  subscriptionStatus: text('subscription_status').default('active'),
  subscriptionTier: text('subscription_tier'),
  mrr: decimal('mrr', { precision: 10, scale: 2 }).default('0'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  customerId: uuid('customer_id').references(() => partnerCustomers.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('pending'),
  payoutId: uuid('payout_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('pending'),
  paidAt: timestamp('paid_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const whiteLabelPackages = pgTable('white_label_packages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  interval: text('interval').default('month'),
  features: jsonb('features').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const partnerWLConfigs = pgTable('partner_wl_configs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  packageId: uuid('package_id').references(() => whiteLabelPackages.id),
  customDomain: text('custom_domain'),
  branding: jsonb('branding').default({}),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userWLSettings = pgTable('user_wl_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  partnerId: uuid('partner_id').references(() => partners.id),
  wlConfigId: uuid('wl_config_id').references(() => partnerWLConfigs.id),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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

export const partnersRelations = relations(partners, ({ one, many }) => ({
  tier: one(partnerTiers, {
    fields: [partners.tierId],
    references: [partnerTiers.id],
  }),
  metrics: many(partnerMetrics),
  customers: many(partnerCustomers),
  commissions: many(commissions),
  payouts: many(payouts),
  wlConfigs: many(partnerWLConfigs),
}));

export const partnerWLConfigsRelations = relations(partnerWLConfigs, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerWLConfigs.partnerId],
    references: [partners.id],
  }),
  package: one(whiteLabelPackages, {
    fields: [partnerWLConfigs.packageId],
    references: [whiteLabelPackages.id],
  }),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  partner: one(partners, {
    fields: [commissions.partnerId],
    references: [partners.id],
  }),
  customer: one(partnerCustomers, {
    fields: [commissions.customerId],
    references: [partnerCustomers.id],
  }),
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

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerWLConfigSchema = createInsertSchema(partnerWLConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserWLSettingsSchema = createInsertSchema(userWLSettings).omit({
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

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type PartnerTier = typeof partnerTiers.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type WhiteLabelPackage = typeof whiteLabelPackages.$inferSelect;
export type PartnerWLConfig = typeof partnerWLConfigs.$inferSelect;
export type UserWLSettings = typeof userWLSettings.$inferSelect;
export type InsertUserWLSettings = z.infer<typeof insertUserWLSettingsSchema>;
