var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/polyfills.ts
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class UnavailableWebSocket {
    constructor() {
      throw new Error("WebSocket is not available in this runtime; Supabase realtime is not supported on the server");
    }
  };
}

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { Pool } from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  actionTypes: () => actionTypes,
  aiFeatureDefinitions: () => aiFeatureDefinitions,
  aiFeatureUsage: () => aiFeatureUsage,
  aiQueries: () => aiQueries,
  aiResellerPricing: () => aiResellerPricing,
  appointments: () => appointments,
  automationRules: () => automationRules,
  billingCycles: () => billingCycles,
  billingNotifications: () => billingNotifications,
  campaignEnrollments: () => campaignEnrollments,
  campaigns: () => campaigns,
  commissions: () => commissions,
  communications: () => communications,
  contactActivities: () => contactActivities,
  contactCustomFields: () => contactCustomFields,
  contacts: () => contacts,
  creditTransactions: () => creditTransactions,
  deals: () => deals,
  documents: () => documents,
  entitlements: () => entitlements,
  featurePackages: () => featurePackages,
  features: () => features,
  fieldMetadata: () => fieldMetadata,
  fieldTypes: () => fieldTypes,
  insertAppointmentSchema: () => insertAppointmentSchema,
  insertCommunicationSchema: () => insertCommunicationSchema,
  insertContactSchema: () => insertContactSchema,
  insertDealSchema: () => insertDealSchema,
  insertDocumentSchema: () => insertDocumentSchema,
  insertNoteSchema: () => insertNoteSchema,
  insertTaskSchema: () => insertTaskSchema,
  leadAutomationSettings: () => leadAutomationSettings,
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
  resellerCreditTransactions: () => resellerCreditTransactions,
  resellerCredits: () => resellerCredits,
  roles: () => roles,
  tasks: () => tasks,
  tenantConfigs: () => tenantConfigs,
  tokenTransactions: () => tokenTransactions,
  updateNoteSchema: () => updateNoteSchema,
  usageEvents: () => usageEvents,
  usagePlans: () => usagePlans,
  userAiTokens: () => userAiTokens,
  userApiKeys: () => userApiKeys,
  userCredits: () => userCredits,
  userFeatures: () => userFeatures,
  userGeneratedImages: () => userGeneratedImages,
  userRoles: () => userRoles,
  userRolesTable: () => userRolesTable,
  userUsageLimits: () => userUsageLimits,
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
import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, json, varchar, uuid, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
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
var contacts = pgTable("smartcrm_contacts", {
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
  score: decimal("score", { precision: 3, scale: 2 }),
  // 0-1; null until the contact is scored
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
var entitlements = pgTable("smartcrm_entitlements", {
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
var userRolesTable = pgTable("smartcrm_user_roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  roleId: uuid("role_id").references(() => roles.id).notNull(),
  tenantId: text("tenant_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var appointments = pgTable("smartcrm_appointments", {
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
var notes = pgTable("smartcrm_notes", {
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
var communications = pgTable("smartcrm_communications", {
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
var documents = pgTable("smartcrm_documents", {
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
var aiQueries = pgTable("smartcrm_ai_queries", {
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
var userAiTokens = pgTable("smartcrm_user_ai_tokens", {
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
var tokenTransactions = pgTable("smartcrm_token_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  balance: integer("balance").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull()
});
var userGeneratedImages = pgTable("smartcrm_user_generated_images", {
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
var features = pgTable("smartcrm_features", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category"),
  isEnabled: boolean("is_enabled").default(true),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userFeatures = pgTable("smartcrm_user_features", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  featureId: integer("feature_id").references(() => features.id).notNull(),
  isEnabled: boolean("is_enabled").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var aiFeatureDefinitions = pgTable("smartcrm_ai_feature_definitions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  featureKey: text("feature_key").unique().notNull(),
  featureName: text("feature_name").notNull(),
  description: text("description"),
  category: text("category"),
  baseCreditCost: integer("base_credit_cost").notNull().default(10),
  minCreditCost: integer("min_credit_cost").default(1),
  maxCreditCost: integer("max_credit_cost").default(1e3),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var aiFeatureUsage = pgTable("smartcrm_ai_feature_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  resellerId: uuid("reseller_id").references(() => profiles.id),
  featureKey: text("feature_key").notNull(),
  creditsCharged: integer("credits_charged").notNull(),
  creditsPaidToPlatform: integer("credits_paid_to_platform").notNull(),
  resellerProfitCredits: integer("reseller_profit_credits").default(0),
  context: jsonb("context").default({}),
  createdAt: timestamp("created_at").defaultNow()
});
var aiResellerPricing = pgTable(
  "smartcrm_ai_reseller_pricing",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    resellerId: uuid("reseller_id").references(() => profiles.id).notNull(),
    featureKey: text("feature_key").notNull(),
    retailCreditCost: integer("retail_credit_cost").notNull(),
    wholesaleCreditCost: integer("wholesale_credit_cost").notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => [unique("unique_reseller_feature").on(table.resellerId, table.featureKey)]
);
var workflows = pgTable("smartcrm_workflows", {
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
var workflowActions = pgTable("smartcrm_workflow_actions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid("workflow_id").references(() => workflows.id).notNull(),
  sequence: integer("sequence").notNull(),
  type: text("type").$type().notNull(),
  config: jsonb("config").default({}),
  condition: jsonb("condition"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var workflowRuns = pgTable("smartcrm_workflow_runs", {
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
var workflowRunLogs = pgTable("smartcrm_workflow_run_logs", {
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
var workflowCredits = pgTable("smartcrm_workflow_credits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => profiles.id).notNull(),
  totalCredits: integer("total_credits").default(0),
  usedCredits: integer("used_credits").default(0),
  resetAt: timestamp("reset_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var workflowTemplates = pgTable("smartcrm_workflow_templates", {
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
var objectMetadata = pgTable("smartcrm_object_metadata", {
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
var fieldMetadata = pgTable("smartcrm_field_metadata", {
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
var relationMetadata = pgTable("smartcrm_relation_metadata", {
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
var views = pgTable("smartcrm_views", {
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
var deals = pgTable("smartcrm_deals", {
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
var tasks = pgTable("smartcrm_tasks", {
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
var billingCycles = pgTable("billing_cycles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  tenantId: uuid("tenant_id"),
  billingPlanId: uuid("billing_plan_id"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("active"),
  totalUsage: jsonb("total_usage").default({}),
  totalCostCents: integer("total_cost_cents").default(0),
  stripeSubscriptionId: text("stripe_subscription_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usageEvents = pgTable("usage_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  tenantId: uuid("tenant_id"),
  eventType: text("event_type").notNull(),
  featureName: text("feature_name").notNull(),
  quantity: text("quantity").notNull(),
  unit: text("unit").notNull(),
  costCents: integer("cost_cents").default(0),
  metadata: jsonb("metadata").default({}),
  billingCycleId: uuid("billing_cycle_id"),
  stripeSubscriptionItemId: text("stripe_subscription_item_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userUsageLimits = pgTable("user_usage_limits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  tenantId: uuid("tenant_id"),
  featureName: text("feature_name").notNull(),
  limitValue: text("limit_value").notNull(),
  usedValue: text("used_value").default("0"),
  billingCycleId: uuid("billing_cycle_id"),
  isHardLimit: boolean("is_hard_limit").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var billingNotifications = pgTable("billing_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  notificationType: text("notification_type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usagePlans = pgTable("usage_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  planName: text("plan_name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  billingType: text("billing_type").default("subscription"),
  billingInterval: text("billing_interval").default("month"),
  basePriceCents: integer("base_price_cents").default(0),
  pricingTiers: jsonb("pricing_tiers").default([]),
  features: jsonb("features").default([]),
  limits: jsonb("limits").default({}),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userApiKeys = pgTable("user_api_keys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  provider: text("provider").notNull(),
  apiKey: text("api_key").notNull(),
  model: text("model"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var contactCustomFields = pgTable("smartcrm_contact_custom_fields", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  fieldValue: jsonb("field_value"),
  createdAt: timestamp("created_at").defaultNow()
});
var contactActivities = pgTable("smartcrm_contact_activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow()
});
var automationRules = pgTable("smartcrm_automation_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: json("trigger"),
  // JSON object defining trigger conditions
  actions: json("actions"),
  // JSON array of actions to perform
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var leadAutomationSettings = pgTable("smartcrm_lead_automation_settings", {
  profileId: uuid("profile_id").primaryKey().references(() => profiles.id),
  scoringModel: text("scoring_model").default("ai-powered").notNull(),
  qualificationThreshold: integer("qualification_threshold").default(70).notNull(),
  createFollowupTasks: boolean("create_followup_tasks").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var campaigns = pgTable("smartcrm_campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  audience: jsonb("audience").$type().default({}),
  steps: jsonb("steps").$type().default([]),
  status: text("status").default("active").notNull(),
  // active | paused | completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var campaignEnrollments = pgTable(
  "smartcrm_campaign_enrollments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
    contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
    nextStep: integer("next_step").default(0).notNull(),
    nextDueAt: timestamp("next_due_at"),
    status: text("status").default("active").notNull(),
    // active | done
    enrolledAt: timestamp("enrolled_at").defaultNow()
  },
  (table) => [unique("smartcrm_campaign_enrollment_unique").on(table.campaignId, table.contactId)]
);
var userCredits = pgTable("user_credits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  totalCredits: text("total_credits").notNull().default("0"),
  usedCredits: text("used_credits").notNull().default("0"),
  availableCredits: text("available_credits").notNull().default("0"),
  lifetimePurchased: integer("lifetime_purchased").default(0),
  lifetimeUsed: integer("lifetime_used").default(0),
  lastPurchaseAt: timestamp("last_purchase_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull().default("purchase"),
  // 'purchase', 'usage', 'refund', 'admin_grant'
  amount: text("amount").notNull().default("0"),
  // Positive for purchases/grants, negative for usage
  balanceBefore: text("balance_before"),
  balanceAfter: text("balance_after"),
  description: text("description").notNull(),
  stripeTransactionId: text("stripe_transaction_id"),
  usageEventId: text("usage_event_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var resellerCredits = pgTable("reseller_credits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: uuid("reseller_id").references(() => profiles.id).notNull().unique(),
  wholesaleCreditsPurchased: integer("wholesale_credits_purchased").notNull().default(0),
  wholesaleCreditsUsed: integer("wholesale_credits_used").notNull().default(0),
  wholesaleCreditsAvailable: integer("wholesale_credits_available").notNull().default(0),
  totalRevenueCents: integer("total_revenue_cents").notNull().default(0),
  totalProfitCents: integer("total_profit_cents").notNull().default(0),
  lastPurchaseAt: timestamp("last_purchase_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var resellerCreditTransactions = pgTable("reseller_credit_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: uuid("reseller_id").references(() => profiles.id).notNull(),
  type: text("type").notNull(),
  // 'wholesale_purchase', 'retail_sale', 'payout'
  creditsAmount: integer("credits_amount").notNull(),
  amountCents: integer("amount_cents"),
  endUserId: uuid("end_user_id").references(() => profiles.id),
  featureKey: text("feature_key"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true
});
var insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true
});
var insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateNoteSchema = insertNoteSchema.partial().omit({
  profileId: true
  // Never allow updating profileId
});
var insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true
});

// server/db.ts
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

// server/services/leadAutomation.ts
import { and, desc, eq, inArray, lte, sql as sql2 } from "drizzle-orm";
var DAY_MS = 864e5;
var DEFAULT_SETTINGS = {
  scoringModel: "ai-powered",
  qualificationThreshold: 70,
  createFollowupTasks: true
};
async function getSettings(profileId) {
  const [row] = await db.select().from(leadAutomationSettings).where(eq(leadAutomationSettings.profileId, profileId));
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    scoringModel: row.scoringModel,
    qualificationThreshold: row.qualificationThreshold,
    createFollowupTasks: row.createFollowupTasks
  };
}
var stepDueAt = (enrolledAt, steps, index) => index < steps.length ? new Date(enrolledAt.getTime() + steps[index].day * DAY_MS) : null;
async function processDueSteps(profileId, campaignId, now = /* @__PURE__ */ new Date()) {
  const due = await db.select({ enrollment: campaignEnrollments, campaign: campaigns, contact: contacts }).from(campaignEnrollments).innerJoin(campaigns, eq(campaigns.id, campaignEnrollments.campaignId)).innerJoin(contacts, eq(contacts.id, campaignEnrollments.contactId)).where(
    and(
      eq(campaignEnrollments.status, "active"),
      eq(campaigns.status, "active"),
      lte(campaignEnrollments.nextDueAt, now),
      ...profileId ? [eq(campaigns.profileId, profileId)] : [],
      ...campaignId ? [eq(campaigns.id, campaignId)] : []
    )
  ).limit(500);
  const settingsCache = /* @__PURE__ */ new Map();
  let created = 0;
  const touchedCampaigns = /* @__PURE__ */ new Set();
  for (const { enrollment, campaign, contact } of due) {
    let settings = settingsCache.get(campaign.profileId);
    if (!settings) {
      settings = await getSettings(campaign.profileId);
      settingsCache.set(campaign.profileId, settings);
    }
    if (!settings.createFollowupTasks) continue;
    const steps = campaign.steps || [];
    const step = steps[enrollment.nextStep];
    const nextIndex = enrollment.nextStep + 1;
    if (step) {
      const name = `${contact.firstName} ${contact.lastName}`.trim();
      await db.insert(tasks).values({
        title: `[${campaign.name}] ${step.title} \u2014 ${name}`,
        description: step.message || null,
        priority: "medium",
        dueDate: enrollment.nextDueAt ?? now,
        contactId: contact.id,
        profileId: campaign.profileId,
        customFields: { campaignId: campaign.id, step: enrollment.nextStep, channel: step.channel }
      });
      created++;
    }
    const nextDue = stepDueAt(enrollment.enrolledAt ?? now, steps, nextIndex);
    await db.update(campaignEnrollments).set({ nextStep: nextIndex, nextDueAt: nextDue, status: nextDue ? "active" : "done" }).where(eq(campaignEnrollments.id, enrollment.id));
    touchedCampaigns.add(campaign.id);
  }
  for (const id of touchedCampaigns) {
    const [row] = await db.select({ n: sql2`count(*)::int` }).from(campaignEnrollments).where(and(eq(campaignEnrollments.campaignId, id), eq(campaignEnrollments.status, "active")));
    if ((row?.n ?? 0) === 0) {
      await db.update(campaigns).set({ status: "completed", updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(campaigns.id, id), eq(campaigns.status, "active")));
    }
  }
  return created;
}

// server/lead-automation-tick.ts
var handler = async () => {
  if (!db) {
    return { statusCode: 503, body: JSON.stringify({ error: "Database not configured" }) };
  }
  try {
    const tasksCreated = await processDueSteps();
    console.log(`lead-automation-tick: created ${tasksCreated} task(s)`);
    return { statusCode: 200, body: JSON.stringify({ tasksCreated }) };
  } catch (error) {
    console.error("lead-automation-tick failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Failed" }) };
  }
};
export {
  handler
};
