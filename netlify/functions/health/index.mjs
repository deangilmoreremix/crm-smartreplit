var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
var userRoles, productTiers, fieldTypes, viewTypes, workflowTriggerTypes, workflowRunStatus, actionTypes, profiles, contacts, partners, partnerTiers, partnerMetrics, partnerCustomers, commissions, payouts, featurePackages, tenantConfigs, userWLSettings, partnerWLConfigs, whiteLabelPackages, entitlements, roles, permissions, userRolesTable, appointments, notes, communications, documents, aiQueries, userAiTokens, tokenTransactions, userGeneratedImages, features, userFeatures, aiFeatureDefinitions, aiFeatureUsage, aiResellerPricing, workflows, workflowActions, workflowRuns, workflowRunLogs, workflowCredits, workflowTemplates, objectMetadata, fieldMetadata, relationMetadata, views, deals, tasks;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    userRoles = ["super_admin", "wl_user", "regular_user"];
    productTiers = ["super_admin", "whitelabel", "smartcrm_bundle", "smartcrm", "sales_maximizer", "ai_boost_unlimited", "ai_communication"];
    fieldTypes = ["ACTOR", "ADDRESS", "ARRAY", "BOOLEAN", "CURRENCY", "DATE", "DATE_TIME", "EMAILS", "FILES", "FULL_NAME", "LINKS", "MORPH_RELATION", "MULTI_SELECT", "NUMBER", "NUMERIC", "PHONES", "POSITION", "RATING", "RAW_JSON", "RELATION", "RICH_TEXT", "SELECT", "TEXT", "TS_VECTOR", "UUID"];
    viewTypes = ["table", "kanban", "calendar"];
    workflowTriggerTypes = ["RECORD_CREATED", "RECORD_UPDATED", "RECORD_DELETED", "MANUAL", "SCHEDULED", "WEBHOOK", "AI_COMPLETED"];
    workflowRunStatus = ["pending", "running", "completed", "failed", "cancelled"];
    actionTypes = ["SEND_EMAIL", "UPDATE_FIELD", "CREATE_RECORD", "CREATE_TASK", "CREATE_NOTE", "WEBHOOK", "CODE", "WAIT", "BRANCH", "ITERATE", "SEND_SMS", "CREATE_DEAL", "CREATE_CONTACT"];
    profiles = pgTable("profiles", {
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
    contacts = pgTable("contacts", {
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
    partners = pgTable("partners", {
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
    partnerTiers = pgTable("partner_tiers", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0"),
      tierFeatures: jsonb("tier_features").default([]),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    partnerMetrics = pgTable("partner_metrics", {
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
    partnerCustomers = pgTable("partner_customers", {
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
    commissions = pgTable("commissions", {
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
    payouts = pgTable("payouts", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      partnerId: uuid("partner_id").references(() => partners.id).notNull(),
      amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
      status: text("status").default("pending"),
      paidAt: timestamp("paid_at"),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    featurePackages = pgTable("feature_packages", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      features: jsonb("features").notNull(),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    tenantConfigs = pgTable("tenant_configs", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      tenantId: text("tenant_id").notNull().unique(),
      config: jsonb("config").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userWLSettings = pgTable("user_wl_settings", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").references(() => profiles.id).notNull(),
      partnerId: uuid("partner_id").references(() => partners.id),
      wlConfigId: uuid("wl_config_id"),
      preferences: jsonb("preferences").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    partnerWLConfigs = pgTable("partner_wl_configs", {
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
    whiteLabelPackages = pgTable("white_label_packages", {
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
    entitlements = pgTable("entitlements", {
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
    roles = pgTable("roles", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull().unique(),
      description: text("description"),
      permissions: jsonb("permissions").default([]),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    permissions = pgTable("permissions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull().unique(),
      resource: text("resource").notNull(),
      action: text("action").notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userRolesTable = pgTable("user_roles", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").references(() => profiles.id).notNull(),
      roleId: uuid("role_id").references(() => roles.id).notNull(),
      tenantId: text("tenant_id"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    appointments = pgTable("appointments", {
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
    notes = pgTable("notes", {
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
    communications = pgTable("communications", {
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
    documents = pgTable("documents", {
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
    aiQueries = pgTable("ai_queries", {
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
    userAiTokens = pgTable("user_ai_tokens", {
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
    tokenTransactions = pgTable("token_transactions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      type: text("type").notNull(),
      amount: integer("amount").notNull(),
      balance: integer("balance").notNull(),
      description: text("description"),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      profileId: uuid("profile_id").references(() => profiles.id).notNull()
    });
    userGeneratedImages = pgTable("user_generated_images", {
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
    features = pgTable("features", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      description: text("description"),
      category: text("category"),
      isEnabled: boolean("is_enabled").default(true),
      config: jsonb("config").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userFeatures = pgTable("user_features", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").references(() => profiles.id).notNull(),
      featureId: integer("feature_id").references(() => features.id).notNull(),
      isEnabled: boolean("is_enabled").default(false),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    aiFeatureDefinitions = pgTable("ai_feature_definitions", {
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
    aiFeatureUsage = pgTable("ai_feature_usage", {
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
    aiResellerPricing = pgTable("ai_reseller_pricing", {
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
    workflows = pgTable("workflows", {
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
    workflowActions = pgTable("workflow_actions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      workflowId: uuid("workflow_id").references(() => workflows.id).notNull(),
      sequence: integer("sequence").notNull(),
      type: text("type").$type().notNull(),
      config: jsonb("config").default({}),
      condition: jsonb("condition"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    workflowRuns = pgTable("workflow_runs", {
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
    workflowRunLogs = pgTable("workflow_run_logs", {
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
    workflowCredits = pgTable("workflow_credits", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id").references(() => profiles.id).notNull(),
      totalCredits: integer("total_credits").default(0),
      usedCredits: integer("used_credits").default(0),
      resetAt: timestamp("reset_at"),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    workflowTemplates = pgTable("workflow_templates", {
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
    objectMetadata = pgTable("object_metadata", {
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
    fieldMetadata = pgTable("field_metadata", {
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
    relationMetadata = pgTable("relation_metadata", {
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
    views = pgTable("views", {
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
    deals = pgTable("deals", {
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
    tasks = pgTable("tasks", {
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
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  initDb: () => initDb,
  isDbAvailable: () => isDbAvailable,
  pool: () => pool,
  waitForDb: () => waitForDb
});
import { drizzle } from "drizzle-orm/postgres-js";
import { Pool } from "pg";
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
var pool, db, dbPromise, isDbAvailable, waitForDb;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    pool = null;
    db = null;
    dbPromise = null;
    if (process.env.DATABASE_URL) {
      initDb().catch(() => {
      });
    }
    isDbAvailable = () => pool !== null && db !== null;
    waitForDb = () => initDb();
  }
});

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase server configuration missing. Some features may not work.");
}
var supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;
var isSupabaseConfigured = () => {
  return !!supabase;
};

// server/health/index.ts
async function checkDatabase() {
  const start = Date.now();
  try {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    await db2.execute("SELECT 1 as health_check");
    return {
      name: "database",
      status: "healthy",
      message: "Database connection successful",
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: "database",
      status: "unhealthy",
      message: `Database connection failed: ${error.message}`,
      responseTime: Date.now() - start,
      details: { error: error.message }
    };
  }
}
async function checkSupabase() {
  const start = Date.now();
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        name: "supabase",
        status: "warning",
        message: "Supabase not configured (using mock data)",
        responseTime: Date.now() - start
      };
    }
    const { data, error } = await supabase.from("profiles").select("count").limit(1).single();
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    return {
      name: "supabase",
      status: "healthy",
      message: "Supabase connection successful",
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: "supabase",
      status: "unhealthy",
      message: `Supabase connection failed: ${error.message}`,
      responseTime: Date.now() - start,
      details: { error: error.message }
    };
  }
}
async function checkExternalAPIs() {
  const start = Date.now();
  const results = [];
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      results.push({ service: "openai", status: "warning", message: "API key not configured" });
    } else {
      results.push({ service: "openai", status: "healthy", message: "API key configured" });
    }
  } catch (error) {
    results.push({ service: "openai", status: "unhealthy", message: error.message });
  }
  try {
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      results.push({ service: "google_ai", status: "warning", message: "API key not configured" });
    } else {
      results.push({ service: "google_ai", status: "healthy", message: "API key configured" });
    }
  } catch (error) {
    results.push({ service: "google_ai", status: "unhealthy", message: error.message });
  }
  const hasUnhealthy = results.some((r) => r.status === "unhealthy");
  const hasWarning = results.some((r) => r.status === "warning");
  return {
    name: "external_apis",
    status: hasUnhealthy ? "unhealthy" : hasWarning ? "warning" : "healthy",
    message: `External APIs: ${results.filter((r) => r.status === "healthy").length} healthy, ${results.filter((r) => r.status === "warning").length} warnings, ${results.filter((r) => r.status === "unhealthy").length} unhealthy`,
    responseTime: Date.now() - start,
    details: { apis: results }
  };
}
function checkMemory() {
  const memUsage = process.memoryUsage();
  const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const usagePercent = Math.round(usedMB / totalMB * 100);
  let status = "healthy";
  let message = `Memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent}%)`;
  if (usagePercent > 90) {
    status = "unhealthy";
    message += " - Critical memory usage";
  } else if (usagePercent > 80) {
    status = "warning";
    message += " - High memory usage";
  }
  return {
    name: "memory",
    status,
    message,
    details: {
      heapTotal: totalMB,
      heapUsed: usedMB,
      usagePercent,
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    }
  };
}
function checkSystem() {
  const uptime = process.uptime();
  const uptimeHours = Math.round(uptime / 3600);
  const loadAverage = process.platform === "linux" ? __require("os").loadavg() : [0, 0, 0];
  return {
    name: "system",
    status: "healthy",
    message: `System uptime: ${uptimeHours} hours`,
    details: {
      uptime: uptimeHours,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      loadAverage: loadAverage.map((load) => Math.round(load * 100) / 100)
    }
  };
}
async function performHealthCheck() {
  const checks = await Promise.all([
    checkDatabase(),
    checkSupabase(),
    checkExternalAPIs(),
    checkMemory(),
    checkSystem()
  ]);
  const summary = {
    total: checks.length,
    healthy: checks.filter((c) => c.status === "healthy").length,
    unhealthy: checks.filter((c) => c.status === "unhealthy").length,
    warning: checks.filter((c) => c.status === "warning").length
  };
  let overallStatus = "healthy";
  if (summary.unhealthy > 0) {
    overallStatus = "unhealthy";
  } else if (summary.warning > 0) {
    overallStatus = "degraded";
  }
  return {
    status: overallStatus,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version || "1.0.0",
    checks,
    summary
  };
}
async function healthCheckMiddleware(req, res) {
  try {
    const health = await performHealthCheck();
    let statusCode = 200;
    if (health.status === "unhealthy") {
      statusCode = 503;
    } else if (health.status === "degraded") {
      statusCode = 200;
    }
    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: "Health check failed",
      message: error.message
    });
  }
}
async function handler(event, context) {
  try {
    const health = await performHealthCheck();
    let statusCode = 200;
    if (health.status === "unhealthy") {
      statusCode = 503;
    } else if (health.status === "degraded") {
      statusCode = 200;
    }
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: JSON.stringify(health)
    };
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      statusCode: 503,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: "Health check failed",
        message: error.message
      })
    };
  }
}
export {
  handler,
  healthCheckMiddleware,
  performHealthCheck
};
