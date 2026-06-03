var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/partners/index.ts
import { createClient } from "@supabase/supabase-js";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  actionTypes: () => actionTypes,
  aiFeatureDefinitions: () => aiFeatureDefinitions,
  aiFeatureUsage: () => aiFeatureUsage,
  aiQueries: () => aiQueries,
  aiResellerPricing: () => aiResellerPricing,
  appointments: () => appointments,
  commissions: () => commissions,
  communications: () => communications,
  contacts: () => contacts,
  deals: () => deals,
  documents: () => documents,
  entitlements: () => entitlements,
  featurePackages: () => featurePackages,
  features: () => features,
  fieldMetadata: () => fieldMetadata,
  fieldTypes: () => fieldTypes,
  notes: () => notes,
  objectMetadata: () => objectMetadata,
  partnerCustomers: () => partnerCustomers,
  partnerMetrics: () => partnerMetrics,
  partnerTiers: () => partnerTiers,
  partnerWLConfigs: () => partnerWLConfigs,
  partners: () => partners,
  payouts: () => payouts,
  permissions: () => permissions,
  productTiers: () => productTiers,
  profiles: () => profiles,
  relationMetadata: () => relationMetadata,
  roles: () => roles,
  tasks: () => tasks,
  tenantConfigs: () => tenantConfigs,
  tokenTransactions: () => tokenTransactions,
  userAiTokens: () => userAiTokens,
  userFeatures: () => userFeatures,
  userGeneratedImages: () => userGeneratedImages,
  userRoles: () => userRoles,
  userRolesTable: () => userRolesTable,
  userWLSettings: () => userWLSettings,
  viewTypes: () => viewTypes,
  views: () => views,
  whiteLabelPackages: () => whiteLabelPackages,
  workflowActions: () => workflowActions,
  workflowCredits: () => workflowCredits,
  workflowRunLogs: () => workflowRunLogs,
  workflowRunStatus: () => workflowRunStatus,
  workflowRuns: () => workflowRuns,
  workflowTemplates: () => workflowTemplates,
  workflowTriggerTypes: () => workflowTriggerTypes,
  workflows: () => workflows
});
import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, json, varchar, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
var userRoles = ["super_admin", "wl_user", "regular_user"];
var productTiers = ["super_admin", "whitelabel", "smartcrm_bundle", "smartcrm", "sales_maximizer", "ai_boost_unlimited", "ai_communication"];
var fieldTypes = ["ACTOR", "ADDRESS", "ARRAY", "BOOLEAN", "CURRENCY", "DATE", "DATE_TIME", "EMAILS", "FILES", "FULL_NAME", "LINKS", "MORPH_RELATION", "MULTI_SELECT", "NUMBER", "NUMERIC", "PHONES", "POSITION", "RATING", "RAW_JSON", "RELATION", "RICH_TEXT", "SELECT", "TEXT", "TS_VECTOR", "UUID"];
var viewTypes = ["table", "kanban", "calendar"];
var workflowTriggerTypes = ["RECORD_CREATED", "RECORD_UPDATED", "RECORD_DELETED", "MANUAL", "SCHEDULED", "WEBHOOK", "AI_COMPLETED"];
var workflowRunStatus = ["pending", "running", "completed", "failed", "cancelled"];
var actionTypes = ["SEND_EMAIL", "UPDATE_FIELD", "CREATE_RECORD", "CREATE_TASK", "CREATE_NOTE", "WEBHOOK", "CODE", "WAIT", "BRANCH", "ITERATE", "SEND_SMS", "CREATE_DEAL", "CREATE_CONTACT"];
var profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("regular_user"),
  productTier: text("product_tier"),
  avatar: text("avatar_url"),
  appContext: text("app_context").default("smartcrm"),
  emailTemplateSet: text("email_template_set").default("smartcrm"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  industry: text("industry"),
  source: text("source"),
  tags: text("tags").array(),
  notes: text("notes"),
  status: text("status").default("active"),
  score: decimal("score", { precision: 3, scale: 2 }).default("0.50"),
  healthScore: integer("health_score"),
  enrichmentData: jsonb("enrichment_data"),
  lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true }),
  linkedinUrl: text("linkedin_url"),
  linkedinData: jsonb("linkedin_data"),
  linkedinSyncedAt: timestamp("linkedin_synced_at"),
  mailchimpId: text("mailchimp_id"),
  mailchimpEmailId: text("mailchimp_email_id"),
  mailchimpTags: text("mailchimp_tags").array(),
  mailchimpStatus: text("mailchimp_status"),
  mailchimpMergeFields: jsonb("mailchimp_merge_fields"),
  mailchimpStats: jsonb("mailchimp_stats"),
  mailchimpSyncedAt: timestamp("mailchimp_synced_at"),
  customFields: json("custom_fields"),
  position: integer("position").default(0),
  idempotencyKey: varchar("idempotency_key", { length: 64 }),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var partners = pgTable("partners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  status: text("status").default("active"),
  tierId: uuid("tier_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var partnerTiers = pgTable("partner_tiers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0"),
  tierFeatures: jsonb("tier_features").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var partnerMetrics = pgTable("partner_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  period: text("period").notNull(),
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).default("0"),
  totalCommission: decimal("total_commission", { precision: 12, scale: 2 }).default("0"),
  totalCustomers: integer("total_customers").default(0),
  newCustomers: integer("new_customers").default(0),
  churnedCustomers: integer("churned_customers").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var partnerCustomers = pgTable("partner_customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  subscriptionStatus: text("subscription_status").default("active"),
  subscriptionTier: text("subscription_tier"),
  mrr: decimal("mrr", { precision: 10, scale: 2 }).default("0"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var commissions = pgTable("commissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  customerId: uuid("customer_id").references(() => partnerCustomers.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("pending"),
  payoutId: uuid("payout_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("pending"),
  paidAt: timestamp("paid_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var featurePackages = pgTable("feature_packages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  features: jsonb("features").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var tenantConfigs = pgTable("tenant_configs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text("tenant_id").notNull().unique(),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userWLSettings = pgTable("user_wl_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  partnerId: uuid("partner_id").references(() => partners.id),
  wlConfigId: uuid("wl_config_id"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var partnerWLConfigs = pgTable("partner_wl_configs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  packageId: uuid("package_id"),
  customDomain: text("custom_domain"),
  branding: jsonb("branding").default({}),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var whiteLabelPackages = pgTable("white_label_packages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").default("month"),
  features: jsonb("features").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var entitlements = pgTable("entitlements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  productTier: text("product_tier").notNull(),
  status: text("status").default("active"),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userRolesTable = pgTable("user_roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  roleId: uuid("role_id").references(() => roles.id).notNull(),
  tenantId: text("tenant_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: text("timezone"),
  location: text("location"),
  status: text("status").default("scheduled"),
  attendees: jsonb("attendees").default([]),
  recurrence: jsonb("recurrence"),
  reminders: jsonb("reminders").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id),
  contactId: integer("contact_id").references(() => contacts.id)
});
var notes = pgTable("notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title"),
  content: text("content").notNull(),
  type: text("type").default("general"),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id),
  contactId: integer("contact_id").references(() => contacts.id)
});
var communications = pgTable("communications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  direction: text("direction").default("outbound"),
  subject: text("subject"),
  content: text("content"),
  status: text("status").default("sent"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id),
  contactId: integer("contact_id").references(() => contacts.id)
});
var documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  size: integer("size"),
  mimeType: text("mime_type"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id),
  contactId: integer("contact_id").references(() => contacts.id)
});
var aiQueries = pgTable("ai_queries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  response: text("response"),
  model: text("model"),
  tokensUsed: integer("tokens_used"),
  cost: decimal("cost", { precision: 10, scale: 4 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var userAiTokens = pgTable("user_ai_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  totalTokens: integer("total_tokens").default(0),
  usedTokens: integer("used_tokens").default(0),
  purchasedTokens: integer("purchased_tokens").default(0),
  freeTierTokens: integer("free_tier_tokens").default(0),
  resetAt: timestamp("reset_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull()
});
var tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  balance: integer("balance").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull()
});
var userGeneratedImages = pgTable("user_generated_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url"),
  model: text("model"),
  size: text("size"),
  style: text("style"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull()
});
var features = pgTable("features", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category"),
  isEnabled: boolean("is_enabled").default(true),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userFeatures = pgTable("user_features", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  featureId: integer("feature_id").references(() => features.id).notNull(),
  isEnabled: boolean("is_enabled").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var aiFeatureDefinitions = pgTable("ai_feature_definitions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  featureName: text("feature_name").notNull(),
  provider: text("provider").notNull(),
  model: text("model"),
  pricingType: text("pricing_type").default("per_token"),
  inputPricePerUnit: decimal("input_price_per_unit", { precision: 10, scale: 6 }),
  outputPricePerUnit: decimal("output_price_per_unit", { precision: 10, scale: 6 }),
  baseCost: decimal("base_cost", { precision: 10, scale: 4 }),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var aiFeatureUsage = pgTable("ai_feature_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  featureId: uuid("feature_id").references(() => aiFeatureDefinitions.id).notNull(),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  cost: decimal("cost", { precision: 10, scale: 4 }).default("0"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var aiResellerPricing = pgTable("ai_reseller_pricing", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  featureId: uuid("feature_id").references(() => aiFeatureDefinitions.id).notNull(),
  resellerPrice: decimal("reseller_price", { precision: 10, scale: 4 }).notNull(),
  minimumPrice: decimal("minimum_price", { precision: 10, scale: 4 }),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").$type().notNull(),
  triggerConfig: jsonb("trigger_config").default({}),
  actions: jsonb("actions").default([]),
  status: text("status").default("active"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var workflowActions = pgTable("workflow_actions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid("workflow_id").references(() => workflows.id).notNull(),
  sequence: integer("sequence").notNull(),
  type: text("type").$type().notNull(),
  config: jsonb("config").default({}),
  condition: jsonb("condition"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var workflowRuns = pgTable("workflow_runs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid("workflow_id").references(() => workflows.id).notNull(),
  status: text("status").$type().default("pending"),
  triggerData: jsonb("trigger_data").default({}),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var workflowRunLogs = pgTable("workflow_run_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: uuid("run_id").references(() => workflowRuns.id).notNull(),
  actionSequence: integer("action_sequence"),
  status: text("status").default("pending"),
  inputData: jsonb("input_data").default({}),
  outputData: jsonb("output_data").default({}),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var workflowCredits = pgTable("workflow_credits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => profiles.id).notNull(),
  totalCredits: integer("total_credits").default(0),
  usedCredits: integer("used_credits").default(0),
  resetAt: timestamp("reset_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var workflowTemplates = pgTable("workflow_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  triggerType: text("trigger_type").$type().notNull(),
  actions: jsonb("actions").default([]),
  isPublic: boolean("is_public").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var objectMetadata = pgTable("object_metadata", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  label: text("label").notNull(),
  labelPlural: text("label_plural"),
  description: text("description"),
  icon: text("icon"),
  isCustom: boolean("is_custom").default(false),
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false),
  workspaceId: uuid("workspace_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var fieldMetadata = pgTable("field_metadata", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  objectMetadataId: uuid("object_metadata_id").references(() => objectMetadata.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  type: text("type").$type().notNull(),
  description: text("description"),
  icon: text("icon"),
  options: jsonb("options"),
  defaultValue: jsonb("default_value"),
  settings: jsonb("settings"),
  isCustom: boolean("is_custom").default(false),
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false),
  isNullable: boolean("is_nullable").default(true),
  isUnique: boolean("is_unique").default(false),
  workspaceId: uuid("workspace_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var relationMetadata = pgTable("relation_metadata", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceObjectMetadataId: uuid("source_object_metadata_id").references(() => objectMetadata.id, { onDelete: "cascade" }).notNull(),
  targetObjectMetadataId: uuid("target_object_metadata_id").references(() => objectMetadata.id, { onDelete: "cascade" }).notNull(),
  sourceFieldMetadataId: uuid("source_field_metadata_id").references(() => fieldMetadata.id, { onDelete: "cascade" }).notNull(),
  targetFieldMetadataId: uuid("target_field_metadata_id").references(() => fieldMetadata.id, { onDelete: "cascade" }),
  relationType: text("relation_type").notNull(),
  isCustom: boolean("is_custom").default(false),
  workspaceId: uuid("workspace_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var views = pgTable("views", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  objectMetadataId: uuid("object_metadata_id").references(() => objectMetadata.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").$type().notNull(),
  kanbanFieldMetadataId: uuid("kanban_field_metadata_id").references(() => fieldMetadata.id),
  filters: jsonb("filters").default([]),
  sorts: jsonb("sorts").default([]),
  visibleFields: jsonb("visible_fields").default([]),
  hiddenFields: jsonb("hidden_fields").default([]),
  aggregations: jsonb("aggregations").default([]),
  visibility: text("visibility").default("personal"),
  isDefault: boolean("is_default").default(false),
  userId: uuid("user_id").references(() => profiles.id),
  workspaceId: uuid("workspace_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  stage: text("stage").notNull(),
  probability: integer("probability").default(0),
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  description: text("description"),
  status: text("status").default("open"),
  healthScore: integer("health_score"),
  winProbability: integer("win_probability"),
  lastActivityAt: timestamp("last_activity_at"),
  daysInStage: integer("days_in_stage").default(0),
  customFields: jsonb("custom_fields").default({}),
  position: integer("position").default(0),
  idempotencyKey: varchar("idempotency_key", { length: 64 }),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  contactId: integer("contact_id").references(() => contacts.id),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending"),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  customFields: jsonb("custom_fields").default({}),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  contactId: integer("contact_id").references(() => contacts.id),
  dealId: integer("deal_id").references(() => deals.id),
  profileId: uuid("profile_id").references(() => profiles.id),
  assignedTo: uuid("assigned_to").references(() => profiles.id)
});

// server/storage.ts
import { eq, desc, sql as sql2, and } from "drizzle-orm";

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { Pool } from "pg";
var pool = null;
var db = null;
var dbPromise = null;
function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("\u26A0\uFE0F  DATABASE_URL not set \u2014 database features disabled");
    return Promise.resolve();
  }
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    try {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query("SELECT 1");
      db = drizzle(pool, { schema: schema_exports });
      console.log("\u2705 Database connected successfully");
    } catch (error) {
      console.error("\u274C Database connection failed:", error);
      throw error;
    }
  })();
  return dbPromise;
}
if (process.env.DATABASE_URL) {
  initDb().catch(() => {
  });
}

// server/storage.ts
var DatabaseStorage = class {
  db;
  constructor(dbConnection) {
    this.db = dbConnection;
  }
  async getProfile(id) {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.id, id));
    return profile || void 0;
  }
  async getProfileByUsername(username) {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.username, username));
    return profile || void 0;
  }
  async createProfile(insertProfile) {
    const [profile] = await this.db.insert(profiles).values(insertProfile).returning();
    return profile;
  }
  async getAllProfiles() {
    return await this.db.select().from(profiles);
  }
  async updateProfile(id, updates) {
    const [profile] = await this.db.update(profiles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(profiles.id, id)).returning();
    if (!profile) {
      throw new Error(`Profile with id ${id} not found`);
    }
    return profile;
  }
  // Backward compatibility methods
  async getUser(id) {
    return this.getProfile(id);
  }
  async getUserByUsername(username) {
    return this.getProfileByUsername(username);
  }
  async createUser(user) {
    return this.createProfile(user);
  }
  // Partner Management Methods
  async getPartners() {
    return await this.db.select().from(partners).orderBy(partners.createdAt);
  }
  async getPartner(id) {
    const [partner] = await this.db.select().from(partners).where(eq(partners.id, id));
    return partner || void 0;
  }
  async createPartner(partner) {
    const [newPartner] = await this.db.insert(partners).values(partner).returning();
    return newPartner;
  }
  async updatePartner(id, updates) {
    const [partner] = await this.db.update(partners).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(partners.id, id)).returning();
    return partner || void 0;
  }
  async getPartnerStats(partnerId) {
    const partner = await this.getPartner(partnerId);
    if (!partner) return null;
    const [latestMetric] = await this.db.select().from(partnerMetrics).where(eq(partnerMetrics.partnerId, partnerId)).orderBy(desc(partnerMetrics.year), desc(partnerMetrics.month)).limit(1);
    return {
      totalRevenue: partner.totalRevenue,
      totalCommissions: partner.totalCommissions,
      customerCount: partner.customerCount,
      conversionRate: latestMetric?.conversionRate || 0.15,
      monthlyGrowth: 0.08,
      tier: partner.tier,
      commissionRate: partner.commissionRate,
      status: partner.status
    };
  }
  async getPartnerCustomers(partnerId) {
    const customers = await this.db.select({
      id: partnerCustomers.customerId,
      name: sql2`concat(${contacts.firstName}, ' ', ${contacts.lastName})`.as("name"),
      email: contacts.email,
      value: partnerCustomers.lifetime_value,
      status: partnerCustomers.status,
      acquisitionDate: partnerCustomers.acquisitionDate
    }).from(partnerCustomers).innerJoin(contacts, eq(partnerCustomers.customerId, contacts.id)).where(eq(partnerCustomers.partnerId, partnerId));
    return customers;
  }
  async getPartnerCommissions(partnerId) {
    return await this.db.select().from(commissions).where(eq(commissions.partnerId, partnerId)).orderBy(desc(commissions.createdAt));
  }
  async getPartnerTiers() {
    return await this.db.select().from(partnerTiers).where(eq(partnerTiers.isActive, true)).orderBy(partnerTiers.priority);
  }
  async getFeaturePackages() {
    return await this.db.select().from(featurePackages).where(eq(featurePackages.isActive, true)).orderBy(featurePackages.createdAt);
  }
  async createFeaturePackage(pkg) {
    const [featurePackage] = await this.db.insert(featurePackages).values({
      name: pkg.name,
      description: pkg.description || null,
      features: pkg.features || [],
      price: pkg.price || null,
      billingCycle: pkg.billingCycle || "monthly",
      isActive: pkg.isActive !== void 0 ? pkg.isActive : true,
      targetTier: pkg.targetTier || null
    }).returning();
    return featurePackage;
  }
  async getRevenueAnalytics() {
    const partners2 = await this.getPartners();
    const totalRevenue = partners2.reduce((sum, p) => sum + parseFloat(p.totalRevenue || "0"), 0);
    const totalCommissions = partners2.reduce(
      (sum, p) => sum + parseFloat(p.totalCommissions || "0"),
      0
    );
    const totalCustomers = partners2.reduce((sum, p) => sum + (p.customerCount || 0), 0);
    return {
      totalRevenue,
      totalCommissions,
      totalPartners: partners2.length,
      activePartners: partners2.filter((p) => p.status === "active").length,
      totalCustomers,
      averageCommissionRate: 0.2,
      monthlyGrowth: 0.12,
      topPerformingTier: "gold",
      metrics: {
        revenue: {
          current: totalRevenue,
          previousMonth: totalRevenue * 0.9,
          growth: 0.1
        },
        commissions: {
          current: totalCommissions,
          previousMonth: totalCommissions * 0.9,
          growth: 0.1
        },
        partners: {
          current: partners2.length,
          previousMonth: Math.max(1, partners2.length - 1),
          growth: partners2.length > 1 ? 0.05 : 0
        }
      }
    };
  }
  // White Label Storage Methods for DatabaseStorage
  async getTenantConfig(tenantId) {
    const [config] = await this.db.select().from(tenantConfigs).where(eq(tenantConfigs.tenantId, tenantId));
    return config || void 0;
  }
  async createTenantConfig(config) {
    const [tenantConfig] = await this.db.insert(tenantConfigs).values(config).returning();
    return tenantConfig;
  }
  async updateTenantConfig(tenantId, updates) {
    const [config] = await this.db.update(tenantConfigs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(tenantConfigs.tenantId, tenantId)).returning();
    return config || void 0;
  }
  async getUserWLSettings(userId) {
    const [settings] = await this.db.select().from(userWLSettings).where(eq(userWLSettings.userId, userId));
    return settings || void 0;
  }
  async createUserWLSettings(settings) {
    const [userSettings] = await this.db.insert(userWLSettings).values(settings).returning();
    return userSettings;
  }
  async updateUserWLSettings(userId, updates) {
    const [settings] = await this.db.update(userWLSettings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userWLSettings.userId, userId)).returning();
    return settings || void 0;
  }
  async getPartnerWLConfig(partnerId) {
    const [config] = await this.db.select().from(partnerWLConfigs).where(eq(partnerWLConfigs.partnerId, partnerId));
    return config || void 0;
  }
  async createPartnerWLConfig(config) {
    const [partnerConfig] = await this.db.insert(partnerWLConfigs).values(config).returning();
    return partnerConfig;
  }
  async updatePartnerWLConfig(partnerId, updates) {
    const [config] = await this.db.update(partnerWLConfigs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(partnerWLConfigs.partnerId, partnerId)).returning();
    return config || void 0;
  }
  async getWhiteLabelPackages() {
    return await this.db.select().from(whiteLabelPackages).where(eq(whiteLabelPackages.isActive, true)).orderBy(whiteLabelPackages.createdAt);
  }
  // Feature Management Methods
  async getAllFeatures() {
    return await this.db.select().from(features).orderBy(features.category, features.name);
  }
  async getFeatureById(id) {
    const [feature] = await this.db.select().from(features).where(eq(features.id, id));
    return feature || void 0;
  }
  async getFeatureByKey(featureKey) {
    const [feature] = await this.db.select().from(features).where(eq(features.featureKey, featureKey));
    return feature || void 0;
  }
  async createFeature(feature) {
    const [newFeature] = await this.db.insert(features).values(feature).returning();
    return newFeature;
  }
  async updateFeature(id, updates) {
    const [feature] = await this.db.update(features).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(features.id, id)).returning();
    return feature || void 0;
  }
  async deleteFeature(id) {
    await this.db.delete(features).where(eq(features.id, id));
  }
  async getUserFeatures(userId) {
    return await this.db.select().from(userFeatures).where(eq(userFeatures.profileId, userId));
  }
  async setUserFeature(userId, featureId, enabled, grantedBy) {
    const existing = await this.db.select().from(userFeatures).where(and(eq(userFeatures.profileId, userId), eq(userFeatures.featureId, featureId)));
    if (existing.length > 0) {
      const [updated] = await this.db.update(userFeatures).set({ enabled, grantedBy: grantedBy || null }).where(and(eq(userFeatures.profileId, userId), eq(userFeatures.featureId, featureId))).returning();
      return updated;
    } else {
      const [newUserFeature] = await this.db.insert(userFeatures).values({ profileId: userId, featureId, enabled, grantedBy: grantedBy || null }).returning();
      return newUserFeature;
    }
  }
  async removeUserFeature(userId, featureId) {
    await this.db.delete(userFeatures).where(and(eq(userFeatures.profileId, userId), eq(userFeatures.featureId, featureId)));
  }
  async bulkSetUserFeatures(userId, featureIds, enabled, grantedBy) {
    const results = [];
    for (const featureId of featureIds) {
      const result = await this.setUserFeature(userId, featureId, enabled, grantedBy);
      results.push(result);
    }
    return results;
  }
};
var MemStorage = class {
  profiles;
  partners;
  partnerTiers;
  commissions;
  featurePackages;
  tenantConfigs;
  userWLSettings;
  partnerWLConfigs;
  whiteLabelPackages;
  constructor() {
    this.profiles = /* @__PURE__ */ new Map();
    this.partners = /* @__PURE__ */ new Map();
    this.partnerTiers = /* @__PURE__ */ new Map();
    this.commissions = /* @__PURE__ */ new Map();
    this.featurePackages = /* @__PURE__ */ new Map();
    this.tenantConfigs = /* @__PURE__ */ new Map();
    this.userWLSettings = /* @__PURE__ */ new Map();
    this.partnerWLConfigs = /* @__PURE__ */ new Map();
    this.whiteLabelPackages = /* @__PURE__ */ new Map();
    this.initializeTestData();
    this.initializePartnerTestData();
  }
  initializeTestData() {
    const testProfiles = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        username: "dean",
        firstName: "Dean",
        lastName: "Smith",
        role: "user",
        // Will be migrated to super_admin
        productTier: "super_admin",
        avatar: null,
        appContext: "smartcrm",
        emailTemplateSet: "smartcrm",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        username: "victor",
        firstName: "Victor",
        lastName: "Johnson",
        role: "user",
        // Will be migrated to super_admin
        productTier: "super_admin",
        avatar: null,
        appContext: "smartcrm",
        emailTemplateSet: "smartcrm",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        username: "samuel",
        firstName: "Samuel",
        lastName: "Wilson",
        role: "user",
        // Will be migrated to super_admin
        productTier: "super_admin",
        avatar: null,
        appContext: "smartcrm",
        emailTemplateSet: "smartcrm",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        username: "jane.doe",
        firstName: "Jane",
        lastName: "Doe",
        role: "admin",
        // Will be migrated to wl_user
        productTier: "whitelabel",
        avatar: null,
        appContext: "smartcrm",
        emailTemplateSet: "smartcrm",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        username: "john.smith",
        firstName: "John",
        lastName: "Smith",
        role: "customer_admin",
        // Will be migrated to wl_user
        productTier: "smartcrm",
        avatar: null,
        appContext: "smartcrm",
        emailTemplateSet: "smartcrm",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    testProfiles.forEach((profile) => {
      this.profiles.set(profile.id, profile);
    });
  }
  initializePartnerTestData() {
    const tiers = [
      {
        id: "tier-bronze",
        name: "Bronze Partner",
        slug: "bronze",
        commissionRate: "15.00",
        minimumRevenue: "0.00",
        features: ["Basic CRM Access", "Email Support", "Partner Portal"],
        benefits: ["15% commission", "Basic marketing materials"],
        color: "#CD7F32",
        priority: 1,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "tier-silver",
        name: "Silver Partner",
        slug: "silver",
        commissionRate: "20.00",
        minimumRevenue: "5000.00",
        features: ["Advanced CRM Access", "Priority Support", "Custom Branding"],
        benefits: ["20% commission", "Co-marketing opportunities"],
        color: "#C0C0C0",
        priority: 2,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "tier-gold",
        name: "Gold Partner",
        slug: "gold",
        commissionRate: "25.00",
        minimumRevenue: "15000.00",
        features: ["Premium CRM Access", "Dedicated Support", "White Label"],
        benefits: ["25% commission", "Joint sales opportunities"],
        color: "#FFD700",
        priority: 3,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    tiers.forEach((tier) => this.partnerTiers.set(tier.id, tier));
    const testPartners = [
      {
        id: "partner-001",
        companyName: "TechSolutions Inc.",
        contactName: "John Smith",
        contactEmail: "john@techsolutions.com",
        phone: "+1-555-123-4567",
        website: "https://techsolutions.com",
        businessType: "Technology Consulting",
        status: "active",
        tier: "silver",
        commissionRate: "20.00",
        totalRevenue: "8500.00",
        totalCommissions: "1700.00",
        customerCount: 12,
        brandingConfig: {
          logo: "/assets/partners/techsolutions-logo.png",
          primaryColor: "#3B82F6",
          secondaryColor: "#1E40AF"
        },
        contractDetails: {
          startDate: "2024-01-15",
          contractDuration: "12 months",
          autoRenewal: true
        },
        payoutSettings: {
          method: "bank_transfer",
          frequency: "monthly",
          minimumPayout: 100
        },
        createdAt: /* @__PURE__ */ new Date("2024-01-15"),
        updatedAt: /* @__PURE__ */ new Date(),
        profileId: "550e8400-e29b-41d4-a716-446655440000"
      }
    ];
    testPartners.forEach((partner) => this.partners.set(partner.id, partner));
    const packages = [
      {
        id: "pkg-basic",
        name: "Basic CRM Package",
        description: "Essential CRM features for small businesses",
        features: ["Contact Management", "Deal Tracking", "Basic Reporting"],
        price: "29.99",
        billingCycle: "monthly",
        isActive: true,
        targetTier: "bronze",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    packages.forEach((pkg) => this.featurePackages.set(pkg.id, pkg));
    console.log(
      `Initialized ${this.partnerTiers.size} partner tiers, ${this.partners.size} partners, ${this.featurePackages.size} feature packages`
    );
  }
  async getProfile(id) {
    return this.profiles.get(id);
  }
  async getProfileByUsername(username) {
    return Array.from(this.profiles.values()).find((profile) => profile.username === username);
  }
  async createProfile(insertProfile) {
    const profile = {
      id: insertProfile.id,
      username: insertProfile.username || null,
      firstName: insertProfile.firstName || null,
      lastName: insertProfile.lastName || null,
      role: insertProfile.role || null,
      avatar: insertProfile.avatar || null,
      appContext: "smartcrm",
      emailTemplateSet: "smartcrm",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.profiles.set(insertProfile.id, profile);
    return profile;
  }
  // Backward compatibility methods
  async getUser(id) {
    return this.getProfile(id);
  }
  async getUserByUsername(username) {
    return this.getProfileByUsername(username);
  }
  async createUser(user) {
    return this.createProfile(user);
  }
  async getAllProfiles() {
    return Array.from(this.profiles.values());
  }
  async updateProfile(id, updates) {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error(`Profile with id ${id} not found`);
    }
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.profiles.set(id, updated);
    return updated;
  }
  // Partner Management Methods Implementation
  async getPartners() {
    return Array.from(this.partners.values());
  }
  async getPartner(id) {
    return this.partners.get(id);
  }
  async createPartner(insertPartner) {
    const id = "partner-" + Date.now();
    const partner = {
      id,
      companyName: insertPartner.companyName,
      contactName: insertPartner.contactName,
      contactEmail: insertPartner.contactEmail,
      phone: insertPartner.phone || null,
      website: insertPartner.website || null,
      businessType: insertPartner.businessType || null,
      status: insertPartner.status || "pending",
      tier: insertPartner.tier || "bronze",
      commissionRate: insertPartner.commissionRate || "15.00",
      totalRevenue: insertPartner.totalRevenue || "0.00",
      totalCommissions: insertPartner.totalCommissions || "0.00",
      customerCount: insertPartner.customerCount || 0,
      brandingConfig: insertPartner.brandingConfig || null,
      contractDetails: insertPartner.contractDetails || null,
      payoutSettings: insertPartner.payoutSettings || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      profileId: insertPartner.profileId || null
    };
    this.partners.set(id, partner);
    return partner;
  }
  async updatePartner(id, updates) {
    const existing = this.partners.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.partners.set(id, updated);
    return updated;
  }
  async getPartnerStats(partnerId) {
    const partner = this.partners.get(partnerId);
    if (!partner) return null;
    return {
      partnerId,
      totalRevenue: partner.totalRevenue,
      totalCommissions: partner.totalCommissions,
      customerCount: partner.customerCount,
      conversionRate: 0.15,
      monthlyGrowth: 0.08,
      tier: partner.tier,
      commissionRate: partner.commissionRate,
      status: partner.status
    };
  }
  async getPartnerCustomers(partnerId) {
    return [
      {
        id: "customer-001",
        name: "Acme Corp",
        email: "contact@acme.com",
        value: 2500,
        status: "active",
        acquisitionDate: "2024-01-15"
      }
    ];
  }
  async getPartnerCommissions(partnerId) {
    return Array.from(this.commissions.values()).filter(
      (commission) => commission.partnerId === partnerId
    );
  }
  async getPartnerTiers() {
    return Array.from(this.partnerTiers.values()).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
  }
  async getFeaturePackages() {
    return Array.from(this.featurePackages.values());
  }
  async createFeaturePackage(pkg) {
    const id = "pkg-" + Date.now();
    const featurePackage = {
      id,
      name: pkg.name,
      description: pkg.description || null,
      features: pkg.features || [],
      price: pkg.price || null,
      billingCycle: pkg.billingCycle || "monthly",
      isActive: pkg.isActive !== void 0 ? pkg.isActive : true,
      targetTier: pkg.targetTier || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.featurePackages.set(id, featurePackage);
    return featurePackage;
  }
  async getRevenueAnalytics() {
    const partners2 = Array.from(this.partners.values());
    const totalRevenue = partners2.reduce((sum, p) => sum + parseFloat(p.totalRevenue || "0"), 0);
    const totalCommissions = partners2.reduce(
      (sum, p) => sum + parseFloat(p.totalCommissions || "0"),
      0
    );
    const totalCustomers = partners2.reduce((sum, p) => sum + (p.customerCount || 0), 0);
    return {
      totalRevenue,
      totalCommissions,
      totalPartners: partners2.length,
      activePartners: partners2.filter((p) => p.status === "active").length,
      totalCustomers,
      averageCommissionRate: 0.2,
      monthlyGrowth: 0.12,
      topPerformingTier: "gold",
      metrics: {
        revenue: {
          current: totalRevenue,
          previousMonth: totalRevenue * 0.9,
          growth: 0.1
        },
        commissions: {
          current: totalCommissions,
          previousMonth: totalCommissions * 0.9,
          growth: 0.1
        },
        partners: {
          current: partners2.length,
          previousMonth: Math.max(1, partners2.length - 1),
          growth: partners2.length > 1 ? 0.05 : 0
        }
      }
    };
  }
  // White Label Storage Methods for MemStorage
  async getTenantConfig(tenantId) {
    return this.tenantConfigs.get(tenantId);
  }
  async createTenantConfig(config) {
    const id = config.tenantId || "tenant-" + Date.now();
    const tenantConfig = {
      id: "tc-" + Date.now(),
      tenantId: id,
      companyName: config.companyName || "",
      logo: config.logo || null,
      favicon: config.favicon || null,
      primaryColor: config.primaryColor || "#3B82F6",
      secondaryColor: config.secondaryColor || "#1E40AF",
      accentColor: config.accentColor || "#10B981",
      backgroundColor: config.backgroundColor || "#FFFFFF",
      textColor: config.textColor || "#1F2937",
      customDomain: config.customDomain || null,
      customCSS: config.customCSS || null,
      emailFromName: config.emailFromName || null,
      emailReplyTo: config.emailReplyTo || null,
      emailSignature: config.emailSignature || null,
      brandingConfig: config.brandingConfig || null,
      features: config.features || null,
      profileId: config.profileId || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.tenantConfigs.set(id, tenantConfig);
    return tenantConfig;
  }
  async updateTenantConfig(tenantId, updates) {
    const existing = this.tenantConfigs.get(tenantId);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.tenantConfigs.set(tenantId, updated);
    return updated;
  }
  async getUserWLSettings(userId) {
    return this.userWLSettings.get(userId);
  }
  async createUserWLSettings(settings) {
    const userSettings = {
      id: "wl-" + Date.now(),
      userId: settings.userId,
      customBranding: settings.customBranding || null,
      enabledFeatures: settings.enabledFeatures || [],
      preferences: settings.preferences || null,
      settings: settings.settings || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.userWLSettings.set(settings.userId, userSettings);
    return userSettings;
  }
  async updateUserWLSettings(userId, updates) {
    const existing = this.userWLSettings.get(userId);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.userWLSettings.set(userId, updated);
    return updated;
  }
  async getPartnerWLConfig(partnerId) {
    return this.partnerWLConfigs.get(partnerId);
  }
  async createPartnerWLConfig(config) {
    const partnerConfig = {
      id: "pwl-" + Date.now(),
      partnerId: config.partnerId,
      companyName: config.companyName || "",
      logo: config.logo || null,
      primaryColor: config.primaryColor || "#3B82F6",
      secondaryColor: config.secondaryColor || "#1E40AF",
      customDomain: config.customDomain || null,
      emailFromName: config.emailFromName || null,
      emailReplyTo: config.emailReplyTo || null,
      brandingConfig: config.brandingConfig || null,
      features: config.features || null,
      profileId: config.profileId || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.partnerWLConfigs.set(config.partnerId, partnerConfig);
    return partnerConfig;
  }
  async updatePartnerWLConfig(partnerId, updates) {
    const existing = this.partnerWLConfigs.get(partnerId);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.partnerWLConfigs.set(partnerId, updated);
    return updated;
  }
  async getWhiteLabelPackages() {
    return Array.from(this.whiteLabelPackages.values()).filter((pkg) => pkg.isActive);
  }
  // Feature Management Methods (MemStorage stubs - use DatabaseStorage for real feature management)
  async getAllFeatures() {
    return [];
  }
  async getFeatureById(id) {
    return void 0;
  }
  async getFeatureByKey(featureKey) {
    return void 0;
  }
  async createFeature(feature) {
    throw new Error("Feature management requires DatabaseStorage - not available in MemStorage");
  }
  async updateFeature(id, updates) {
    return void 0;
  }
  async deleteFeature(id) {
  }
  async getUserFeatures(userId) {
    return [];
  }
  async setUserFeature(userId, featureId, enabled, grantedBy) {
    throw new Error("Feature management requires DatabaseStorage - not available in MemStorage");
  }
  async removeUserFeature(userId, featureId) {
  }
  async bulkSetUserFeatures(userId, featureIds, enabled, grantedBy) {
    return [];
  }
};
var storage = process.env.DATABASE_URL ? new DatabaseStorage(db) : new MemStorage();

// server/partners/index.ts
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_ANON_KEY;
var supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
var handler = async (event, context) => {
  const { httpMethod, path, queryStringParameters, body } = event;
  const pathParts = path.split("/").filter(Boolean);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  };
  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  try {
    if (pathParts.length === 1 && pathParts[0] === "partners") {
      if (httpMethod === "GET") {
        const partners2 = await storage.getPartners();
        return { statusCode: 200, headers, body: JSON.stringify(partners2) };
      }
      if (httpMethod === "POST") {
        const partnerData = JSON.parse(body);
        const partner = await storage.createPartner(partnerData);
        return { statusCode: 201, headers, body: JSON.stringify(partner) };
      }
    }
    if (pathParts.length === 2 && pathParts[0] === "partners") {
      const partnerId = pathParts[1];
      if (httpMethod === "GET") {
        const partner = await storage.getPartner(partnerId);
        if (!partner) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: "Partner not found" }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify(partner) };
      }
      if (httpMethod === "PUT") {
        const updates = JSON.parse(body);
        const partner = await storage.updatePartner(partnerId, updates);
        if (!partner) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: "Partner not found" }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify(partner) };
      }
    }
    if (pathParts.length === 3 && pathParts[0] === "partners" && pathParts[2] === "stats") {
      const partnerId = pathParts[1];
      if (httpMethod === "GET") {
        const stats = await storage.getPartnerStats(partnerId);
        return { statusCode: 200, headers, body: JSON.stringify(stats) };
      }
    }
    if (pathParts.length === 3 && pathParts[0] === "partners" && pathParts[2] === "commissions") {
      const partnerId = pathParts[1];
      if (httpMethod === "GET") {
        const commissions2 = await storage.getPartnerCommissions(partnerId);
        return { statusCode: 200, headers, body: JSON.stringify(commissions2) };
      }
    }
    if (pathParts.length === 2 && pathParts[0] === "partners" && pathParts[1] === "onboard" && httpMethod === "POST") {
      const { brandingConfig, ...partnerData } = JSON.parse(body);
      const newPartner = await storage.createPartner({
        ...partnerData,
        brandingConfig,
        status: "pending",
        tier: "bronze",
        profileId: "dev-user-12345"
      });
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          partner: newPartner,
          message: "Partner application submitted successfully"
        })
      };
    }
    if (pathParts.length === 3 && pathParts[0] === "partners" && pathParts[2] === "approve" && httpMethod === "POST") {
      const partnerId = pathParts[1];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: partnerId,
          status: "active",
          approvedAt: (/* @__PURE__ */ new Date()).toISOString()
        })
      };
    }
    if (pathParts.length === 2 && pathParts[0] === "partners" && pathParts[1] === "pending" && httpMethod === "GET") {
      if (!supabase) {
        const pendingPartners = [
          {
            id: "partner_1",
            name: "TechCorp Solutions",
            contact_email: "contact@techcorp.com",
            subdomain: "techcorp",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            status: "pending"
          }
        ];
        return { statusCode: 200, headers, body: JSON.stringify(pendingPartners) };
      }
      const { data, error } = await supabase.from("partners").select("*").eq("status", "pending").order("created_at", { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }
    if (pathParts.length === 2 && pathParts[0] === "partners" && pathParts[1] === "active" && httpMethod === "GET") {
      if (!supabase) {
        const activePartners = [
          {
            id: "partner_3",
            name: "SalesForce Plus",
            contact_email: "admin@salesforceplus.com",
            subdomain: "salesforceplus",
            created_at: new Date(Date.now() - 6048e5).toISOString(),
            status: "active"
          }
        ];
        return { statusCode: 200, headers, body: JSON.stringify(activePartners) };
      }
      const { data, error } = await supabase.from("partners").select("*").eq("status", "active").order("created_at", { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }
    if (pathParts.length === 3 && pathParts[0] === "partners" && pathParts[2] === "stats" && httpMethod === "GET") {
      const partnerId = pathParts[1];
      if (!supabase) {
        const stats2 = {
          total_customers: 42,
          active_customers: 38,
          total_revenue: 14200,
          monthly_revenue: 14200,
          customer_growth_rate: 23
        };
        return { statusCode: 200, headers, body: JSON.stringify(stats2) };
      }
      const { data: stats, error: statsError } = await supabase.from("partner_stats").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false }).limit(1).single();
      if (statsError && statsError.code !== "PGRST116") {
        throw statsError;
      }
      if (!stats) {
        const { data: customers, error: customersError } = await supabase.from("partner_customers").select("monthly_revenue, status").eq("partner_id", partnerId);
        if (customersError) throw customersError;
        const totalCustomers = customers?.length || 0;
        const activeCustomers = customers?.filter((c) => c.status === "active").length || 0;
        const totalRevenue = customers?.reduce((sum, c) => sum + (c.monthly_revenue || 0), 0) || 0;
        const calculatedStats = {
          total_customers: totalCustomers,
          active_customers: activeCustomers,
          total_revenue: totalRevenue,
          monthly_revenue: totalRevenue,
          customer_growth_rate: 0
        };
        return { statusCode: 200, headers, body: JSON.stringify(calculatedStats) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(stats) };
    }
    if (pathParts.length === 3 && pathParts[0] === "partners" && pathParts[2] === "customers" && httpMethod === "GET") {
      const partnerId = pathParts[1];
      if (!supabase) {
        const customers = [
          {
            id: "1",
            name: "Acme Corp",
            subdomain: "acme",
            status: "active",
            plan: "enterprise",
            monthly_revenue: 299,
            created_at: "2024-01-15T00:00:00Z",
            last_active: "2024-06-28T00:00:00Z"
          }
        ];
        return { statusCode: 200, headers, body: JSON.stringify(customers) };
      }
      const { data, error } = await supabase.from("partner_customers").select("*").eq("partner_id", partnerId).order("created_at", { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }
    if (pathParts.length === 3 && pathParts[0] === "partners" && pathParts[2] === "customers" && httpMethod === "POST") {
      const partnerId = pathParts[1];
      const { companyName, contactEmail, plan } = JSON.parse(body);
      const newCustomer = {
        id: `customer_${Date.now()}`,
        name: companyName,
        subdomain: companyName.toLowerCase().replace(/\s+/g, ""),
        status: "active",
        plan: plan || "basic",
        monthly_revenue: plan === "enterprise" ? 299 : plan === "pro" ? 149 : 49,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        last_active: (/* @__PURE__ */ new Date()).toISOString()
      };
      return { statusCode: 200, headers, body: JSON.stringify(newCustomer) };
    }
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Partner endpoint not found" })
    };
  } catch (error) {
    console.error("Partners function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error", message: error.message })
    };
  }
};
export {
  handler
};
