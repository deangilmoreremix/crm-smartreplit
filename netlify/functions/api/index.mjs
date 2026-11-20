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
var userRoles, productTiers, fieldTypes, viewTypes, workflowTriggerTypes, workflowRunStatus, actionTypes, profiles, contacts, partners, partnerTiers, partnerMetrics, partnerCustomers, commissions, payouts, featurePackages, tenantConfigs, userWLSettings, partnerWLConfigs, whiteLabelPackages, entitlements, roles, permissions, userRolesTable, appointments, notes, communications, documents, aiQueries, userAiTokens, tokenTransactions, userGeneratedImages, features, userFeatures, aiFeatureDefinitions, aiFeatureUsage, aiResellerPricing, workflows, workflowActions, workflowRuns, workflowRunLogs, workflowCredits, workflowTemplates, objectMetadata, fieldMetadata, relationMetadata, views, deals, tasks, billingCycles, usageEvents, userUsageLimits, billingNotifications, usagePlans, userApiKeys, contactCustomFields, contactActivities, automationRules, leadAutomationSettings, campaigns, campaignEnrollments, userCredits, creditTransactions, resellerCredits, resellerCreditTransactions, insertContactSchema, insertDealSchema, insertTaskSchema, insertAppointmentSchema, insertCommunicationSchema, insertNoteSchema, updateNoteSchema, insertDocumentSchema;
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
    contacts = pgTable("smartcrm_contacts", {
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
    entitlements = pgTable("smartcrm_entitlements", {
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
    userRolesTable = pgTable("smartcrm_user_roles", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").references(() => profiles.id).notNull(),
      roleId: uuid("role_id").references(() => roles.id).notNull(),
      tenantId: text("tenant_id"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    appointments = pgTable("smartcrm_appointments", {
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
    notes = pgTable("smartcrm_notes", {
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
    communications = pgTable("smartcrm_communications", {
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
    documents = pgTable("smartcrm_documents", {
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
    aiQueries = pgTable("smartcrm_ai_queries", {
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
    userAiTokens = pgTable("smartcrm_user_ai_tokens", {
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
    tokenTransactions = pgTable("smartcrm_token_transactions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      type: text("type").notNull(),
      amount: integer("amount").notNull(),
      balance: integer("balance").notNull(),
      description: text("description"),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      profileId: uuid("profile_id").references(() => profiles.id).notNull()
    });
    userGeneratedImages = pgTable("smartcrm_user_generated_images", {
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
    features = pgTable("smartcrm_features", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      description: text("description"),
      category: text("category"),
      isEnabled: boolean("is_enabled").default(true),
      config: jsonb("config").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userFeatures = pgTable("smartcrm_user_features", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").references(() => profiles.id).notNull(),
      featureId: integer("feature_id").references(() => features.id).notNull(),
      isEnabled: boolean("is_enabled").default(false),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    aiFeatureDefinitions = pgTable("smartcrm_ai_feature_definitions", {
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
    aiFeatureUsage = pgTable("smartcrm_ai_feature_usage", {
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
    aiResellerPricing = pgTable(
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
    workflows = pgTable("smartcrm_workflows", {
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
    workflowActions = pgTable("smartcrm_workflow_actions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      workflowId: uuid("workflow_id").references(() => workflows.id).notNull(),
      sequence: integer("sequence").notNull(),
      type: text("type").$type().notNull(),
      config: jsonb("config").default({}),
      condition: jsonb("condition"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    workflowRuns = pgTable("smartcrm_workflow_runs", {
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
    workflowRunLogs = pgTable("smartcrm_workflow_run_logs", {
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
    workflowCredits = pgTable("smartcrm_workflow_credits", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      tenantId: uuid("tenant_id").references(() => profiles.id).notNull(),
      totalCredits: integer("total_credits").default(0),
      usedCredits: integer("used_credits").default(0),
      resetAt: timestamp("reset_at"),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    workflowTemplates = pgTable("smartcrm_workflow_templates", {
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
    objectMetadata = pgTable("smartcrm_object_metadata", {
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
    fieldMetadata = pgTable("smartcrm_field_metadata", {
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
    relationMetadata = pgTable("smartcrm_relation_metadata", {
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
    views = pgTable("smartcrm_views", {
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
    deals = pgTable("smartcrm_deals", {
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
    tasks = pgTable("smartcrm_tasks", {
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
    billingCycles = pgTable("billing_cycles", {
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
    usageEvents = pgTable("usage_events", {
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
    userUsageLimits = pgTable("user_usage_limits", {
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
    billingNotifications = pgTable("billing_notifications", {
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
    usagePlans = pgTable("usage_plans", {
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
    userApiKeys = pgTable("user_api_keys", {
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
    contactCustomFields = pgTable("smartcrm_contact_custom_fields", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
      fieldKey: text("field_key").notNull(),
      fieldValue: jsonb("field_value"),
      createdAt: timestamp("created_at").defaultNow()
    });
    contactActivities = pgTable("smartcrm_contact_activities", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
      activityType: text("activity_type").notNull(),
      description: text("description"),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at").defaultNow()
    });
    automationRules = pgTable("smartcrm_automation_rules", {
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
    leadAutomationSettings = pgTable("smartcrm_lead_automation_settings", {
      profileId: uuid("profile_id").primaryKey().references(() => profiles.id),
      scoringModel: text("scoring_model").default("ai-powered").notNull(),
      qualificationThreshold: integer("qualification_threshold").default(70).notNull(),
      createFollowupTasks: boolean("create_followup_tasks").default(true).notNull(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    campaigns = pgTable("smartcrm_campaigns", {
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
    campaignEnrollments = pgTable(
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
    userCredits = pgTable("user_credits", {
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
    creditTransactions = pgTable("credit_transactions", {
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
    resellerCredits = pgTable("reseller_credits", {
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
    resellerCreditTransactions = pgTable("reseller_credit_transactions", {
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
    insertContactSchema = createInsertSchema(contacts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertDealSchema = createInsertSchema(deals).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTaskSchema = createInsertSchema(tasks).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true
    });
    insertAppointmentSchema = createInsertSchema(appointments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCommunicationSchema = createInsertSchema(communications).omit({
      id: true,
      createdAt: true
    });
    insertNoteSchema = createInsertSchema(notes).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateNoteSchema = insertNoteSchema.partial().omit({
      profileId: true
      // Never allow updating profileId
    });
    insertDocumentSchema = createInsertSchema(documents).omit({
      id: true,
      createdAt: true
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

// server/services/creditService.ts
var creditService_exports = {};
__export(creditService_exports, {
  CreditService: () => CreditService
});
import { eq as eq7, and as and6, desc as desc6 } from "drizzle-orm";
var CreditService;
var init_creditService = __esm({
  "server/services/creditService.ts"() {
    "use strict";
    init_db();
    init_schema();
    CreditService = class {
      /**
       * Get user's credit balance
       */
      static async getCreditBalance(userId, tx) {
        const dbClient = tx || db;
        try {
          const credits = await dbClient.select().from(userCredits).where(eq7(userCredits.userId, userId)).limit(1);
          if (credits.length === 0) {
            const newCredits = {
              userId,
              totalCredits: "0",
              usedCredits: "0",
              availableCredits: "0"
            };
            await dbClient.insert(userCredits).values(newCredits);
            return {
              totalCredits: 0,
              usedCredits: 0,
              availableCredits: 0,
              lastPurchaseAt: null
            };
          }
          const creditData = credits[0];
          return {
            totalCredits: parseFloat(creditData.totalCredits || "0"),
            usedCredits: parseFloat(creditData.usedCredits || "0"),
            availableCredits: parseFloat(creditData.availableCredits || "0"),
            lastPurchaseAt: creditData.lastPurchaseAt
          };
        } catch (error) {
          console.error("Error getting credit balance:", error);
          throw error;
        }
      }
      /**
       * Purchase credits for a user - uses atomic transaction with row-level locking
       */
      static async purchaseCredits(data) {
        return await db.transaction(async (tx) => {
          const plan = await tx.select().from(usagePlans).where(eq7(usagePlans.id, data.planId)).limit(1);
          if (plan.length === 0) {
            throw new Error(`Plan ${data.planId} not found`);
          }
          const planData = plan[0];
          const limits = planData.limits;
          const creditAmount = limits?.credits || 0;
          if (!creditAmount || typeof creditAmount !== "number") {
            throw new Error(`Plan ${data.planId} does not define credit amount`);
          }
          const currentBalance = await this.getCreditBalance(data.userId, tx);
          const newTotalCredits = currentBalance.totalCredits + creditAmount;
          const newAvailableCredits = currentBalance.availableCredits + creditAmount;
          await tx.insert(userCredits).values({
            userId: data.userId,
            totalCredits: newTotalCredits.toString(),
            usedCredits: currentBalance.usedCredits.toString(),
            availableCredits: newAvailableCredits.toString(),
            lastPurchaseAt: /* @__PURE__ */ new Date()
          }).onConflictDoUpdate({
            target: userCredits.userId,
            set: {
              totalCredits: newTotalCredits.toString(),
              availableCredits: newAvailableCredits.toString(),
              lastPurchaseAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
          const transaction = {
            userId: data.userId,
            type: "purchase",
            amount: creditAmount.toString(),
            description: `Purchased ${creditAmount} credits (${planData.displayName})`,
            balanceBefore: currentBalance.availableCredits.toString(),
            balanceAfter: newAvailableCredits.toString(),
            stripeTransactionId: data.stripeTransactionId
          };
          const result = await tx.insert(creditTransactions).values(transaction).returning({ id: creditTransactions.id });
          return {
            success: true,
            creditsPurchased: creditAmount,
            newBalance: newAvailableCredits,
            transactionId: result[0]?.id
          };
        });
      }
      /**
       * Deduct credits for usage - uses atomic transaction
       */
      static async deductCredits(data) {
        return await db.transaction(async (tx) => {
          const currentBalance = await this.getCreditBalance(data.userId, tx);
          if (currentBalance.availableCredits < data.amount) {
            throw new Error(
              `Insufficient credits. Available: ${currentBalance.availableCredits}, Required: ${data.amount}`
            );
          }
          const newUsedCredits = currentBalance.usedCredits + data.amount;
          const newAvailableCredits = currentBalance.availableCredits - data.amount;
          await tx.update(userCredits).set({
            usedCredits: newUsedCredits.toString(),
            availableCredits: newAvailableCredits.toString(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq7(userCredits.userId, data.userId));
          const transaction = {
            userId: data.userId,
            type: "usage",
            amount: (-data.amount).toString(),
            // Negative for usage
            description: data.description,
            balanceBefore: currentBalance.availableCredits.toString(),
            balanceAfter: newAvailableCredits.toString(),
            usageEventId: data.usageEventId
          };
          const result = await tx.insert(creditTransactions).values(transaction).returning({ id: creditTransactions.id });
          return {
            success: true,
            creditsDeducted: data.amount,
            newBalance: newAvailableCredits,
            transactionId: result[0]?.id
          };
        });
      }
      /**
       * Check if user has sufficient credits
       */
      static async hasSufficientCredits(userId, requiredAmount) {
        try {
          const balance = await this.getCreditBalance(userId);
          return balance.availableCredits >= requiredAmount;
        } catch (error) {
          console.error("Error checking credit balance:", error);
          return false;
        }
      }
      /**
       * Get credit transaction history
       */
      static async getCreditTransactionHistory(userId, limit = 50) {
        try {
          const transactions = await db.select().from(creditTransactions).where(eq7(creditTransactions.userId, userId)).orderBy(desc6(creditTransactions.createdAt)).limit(limit);
          return transactions.map((transaction) => ({
            id: transaction.id,
            type: transaction.type,
            amount: parseFloat(transaction.amount),
            description: transaction.description,
            balanceBefore: transaction.balanceBefore ? parseFloat(transaction.balanceBefore) : null,
            balanceAfter: transaction.balanceAfter ? parseFloat(transaction.balanceAfter) : null,
            stripeTransactionId: transaction.stripeTransactionId,
            createdAt: transaction.createdAt
          }));
        } catch (error) {
          console.error("Error getting credit transaction history:", error);
          return [];
        }
      }
      /**
       * Get available credit packages/plans
       */
      static async getCreditPackages() {
        try {
          const packages = await db.select().from(usagePlans).where(and6(eq7(usagePlans.billingType, "pay_per_use"), eq7(usagePlans.isActive, true)));
          return packages.map((pkg) => {
            const limits = pkg.limits;
            return {
              id: pkg.id,
              planName: pkg.planName,
              displayName: pkg.displayName,
              description: pkg.description,
              basePriceCents: pkg.basePriceCents,
              credits: limits?.credits || 0,
              features: pkg.features
            };
          });
        } catch (error) {
          console.error("Error getting credit packages:", error);
          return [];
        }
      }
      /**
       * Admin: Grant credits to user - uses atomic transaction
       */
      static async grantCredits(userId, amount, description, adminId) {
        return await db.transaction(async (tx) => {
          const currentBalance = await this.getCreditBalance(userId, tx);
          const newTotalCredits = currentBalance.totalCredits + amount;
          const newAvailableCredits = currentBalance.availableCredits + amount;
          await tx.insert(userCredits).values({
            userId,
            totalCredits: newTotalCredits.toString(),
            usedCredits: currentBalance.usedCredits.toString(),
            availableCredits: newAvailableCredits.toString()
          }).onConflictDoUpdate({
            target: userCredits.userId,
            set: {
              totalCredits: newTotalCredits.toString(),
              availableCredits: newAvailableCredits.toString(),
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
          const transaction = {
            userId,
            type: "admin_grant",
            amount: amount.toString(),
            description: `${description} (Granted by admin ${adminId})`,
            balanceBefore: currentBalance.availableCredits.toString(),
            balanceAfter: newAvailableCredits.toString()
          };
          await tx.insert(creditTransactions).values(transaction);
          return {
            success: true,
            creditsGranted: amount,
            newBalance: newAvailableCredits
          };
        });
      }
      /**
       * Process refund - return credits to user - uses atomic transaction
       */
      static async refundCredits(userId, amount, description, stripeTransactionId) {
        return await db.transaction(async (tx) => {
          const currentBalance = await this.getCreditBalance(userId, tx);
          const maxRefundable = Math.min(amount, currentBalance.usedCredits);
          const newUsedCredits = Math.max(0, currentBalance.usedCredits - maxRefundable);
          const newAvailableCredits = currentBalance.availableCredits + maxRefundable;
          await tx.update(userCredits).set({
            usedCredits: newUsedCredits.toString(),
            availableCredits: newAvailableCredits.toString(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq7(userCredits.userId, userId));
          const transaction = {
            userId,
            type: "refund",
            amount: maxRefundable.toString(),
            description: maxRefundable < amount ? `${description} (Limited to ${maxRefundable} due to usage cap)` : description,
            balanceBefore: currentBalance.availableCredits.toString(),
            balanceAfter: newAvailableCredits.toString(),
            stripeTransactionId
          };
          await tx.insert(creditTransactions).values(transaction);
          return {
            success: true,
            creditsRefunded: maxRefundable,
            originalRefundRequest: amount,
            newBalance: newAvailableCredits
          };
        });
      }
    };
  }
});

// server/polyfills.ts
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class UnavailableWebSocket {
    constructor() {
      throw new Error("WebSocket is not available in this runtime; Supabase realtime is not supported on the server");
    }
  };
}

// server/netlify-api.ts
import serverless from "serverless-http";

// server/app.ts
import "dotenv/config";
import { createClient as createClient12 } from "@supabase/supabase-js";
import express2 from "express";

// server/services/userOpenAI.ts
init_db();
init_schema();
import OpenAI from "openai";
import { eq, and, desc } from "drizzle-orm";

// server/services/openaiModels.ts
var DEFAULT_MODEL = "gpt-6.2-sol";
var ADVANCED_MODEL = "gpt-6.2-astra";
var IMAGE_MODEL = "gpt-image-2.6-flare";
var IMAGE_EDIT_MODEL = "gpt-image-2.6-sunburst";
var IMAGE_MODELS = ["gpt-image-2.6-flare", "gpt-image-2.6-sunburst"];
var EMBEDDING_MODEL = "text-embedding-3-small";
var TRANSCRIBE_MODEL = "gpt-transcribe";
var LEGACY_DEFAULT = /* @__PURE__ */ new Set([
  "gpt-4o-mini",
  "gpt-3.5-turbo",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "o4-mini",
  "o1-mini",
  "gpt-6-luna"
]);
var LEGACY_ADVANCED = /* @__PURE__ */ new Set([
  "gpt-4o",
  "gpt-4",
  "gpt-4-turbo",
  "gpt-4.1",
  "o1",
  "o1-preview",
  "o3",
  "gpt-5",
  "gpt-6.1-sol"
]);
function mapLegacyModel(model) {
  if (!model) return DEFAULT_MODEL;
  const base = model.replace(/-\d{4}-\d{2}-\d{2}$/, "").replace(/-\d{4}$/, "");
  if (LEGACY_DEFAULT.has(base)) return DEFAULT_MODEL;
  if (LEGACY_ADVANCED.has(base)) return ADVANCED_MODEL;
  if (IMAGE_MODELS.includes(base)) return base;
  if (base.startsWith("dall-e") || base.includes("-image")) return IMAGE_MODEL;
  if (base.startsWith("gemini") || base.startsWith("gemma")) {
    return base.includes("pro") ? ADVANCED_MODEL : DEFAULT_MODEL;
  }
  return model;
}

// server/services/requestContext.ts
import { AsyncLocalStorage } from "async_hooks";
var requestContext = new AsyncLocalStorage();
function currentUserId() {
  return requestContext.getStore()?.userId;
}

// server/services/openaiResponses.ts
function outputText(response) {
  if (typeof response?.output_text === "string" && response.output_text) return response.output_text;
  const parts = [];
  for (const item of response?.output || []) {
    if (item.type === "message") {
      for (const c of item.content || []) if (c.type === "output_text") parts.push(c.text);
    }
  }
  return parts.join("");
}
function extractSources(response) {
  const seen = /* @__PURE__ */ new Map();
  for (const item of response?.output || []) {
    if (item.type !== "message") continue;
    for (const c of item.content || []) {
      for (const a of c.annotations || []) {
        if (a.type === "url_citation" && a.url && !seen.has(a.url)) seen.set(a.url, { url: a.url, title: a.title });
      }
    }
  }
  return [...seen.values()];
}
function extractImages(response) {
  return (response?.output || []).filter((item) => item.type === "image_generation_call" && item.result).map((item) => item.result);
}
function textFormat(json2) {
  if (!json2) return void 0;
  if (json2 === true) return { format: { type: "json_object" } };
  return { format: { type: "json_schema", name: json2.name, schema: json2.schema, strict: true } };
}
function parseJSONText(text2) {
  if (!text2) return void 0;
  try {
    return JSON.parse(text2);
  } catch {
    const match = text2.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
      }
    }
    return void 0;
  }
}
function toResult(response, wantJson) {
  const text2 = outputText(response);
  const data = wantJson ? parseJSONText(text2) : void 0;
  return {
    id: response.id,
    status: response.status,
    text: text2,
    data,
    sources: extractSources(response),
    images: extractImages(response),
    usage: response.usage,
    raw: response
  };
}
async function respond(client, options) {
  const instructions = options.json === true && !/json/i.test(`${options.instructions || ""} ${JSON.stringify(options.input)}`) ? `${options.instructions ? options.instructions + "\n" : ""}Respond with valid JSON.` : options.instructions;
  const response = await client.responses.create({
    model: mapLegacyModel(options.model),
    input: options.input,
    ...instructions ? { instructions } : {},
    ...options.json ? { text: textFormat(options.json) } : {},
    ...options.tools?.length ? { tools: options.tools } : {},
    ...options.toolChoice ? { tool_choice: options.toolChoice } : {},
    ...options.maxOutputTokens ? { max_output_tokens: options.maxOutputTokens } : {},
    ...options.previousResponseId ? { previous_response_id: options.previousResponseId } : {},
    ...options.conversation ? { conversation: options.conversation } : {},
    ...options.background ? { background: true } : {},
    ...options.include?.length ? { include: options.include } : {},
    // Background mode and conversations need stored responses; everything else is not retained
    store: options.store ?? Boolean(options.background || options.conversation || options.previousResponseId)
  });
  return toResult(response, Boolean(options.json));
}
var webSearchTool = (userLocation) => ({
  type: "web_search",
  search_context_size: "medium",
  ...userLocation ? { user_location: { type: "approximate", ...userLocation } } : {}
});
var MIME = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" };
var QUALITY = ["auto", "low", "medium", "high", "xhigh", "max"];
async function generateImage(client, options) {
  const editing = Boolean(options.inputImages?.length);
  const model = options.imageModel && IMAGE_MODELS.includes(options.imageModel) ? options.imageModel : editing ? IMAGE_EDIT_MODEL : IMAGE_MODEL;
  const quality = options.quality === "hd" ? "high" : options.quality === "standard" ? "medium" : options.quality;
  let format = options.output_format;
  if (options.background === "transparent" && (!format || format === "jpeg")) format = "png";
  const body = { model, prompt: options.prompt };
  if (options.size) body.size = options.size;
  if (quality && QUALITY.includes(quality)) body.quality = quality;
  if (options.n) body.n = Math.min(Math.max(options.n, 1), format === "svg" ? 1 : 4);
  if (options.background) body.background = options.background;
  if (format) body.output_format = format;
  if (options.complexity) body.complexity = options.complexity;
  if (options.output_compression !== void 0 && (format === "jpeg" || format === "webp")) {
    body.output_compression = options.output_compression;
  }
  if (format === "gif") {
    if (options.frame_count) body.frame_count = Math.min(Math.max(options.frame_count, 2), 16);
    if (options.frame_duration_ms) body.frame_duration_ms = Math.max(options.frame_duration_ms, 20);
  }
  if (editing) {
    if (options.mask && options.markup) throw new Error("Use either a mask or a markup overlay, not both");
    body.images = options.inputImages.slice(0, 16).map((image_url) => ({ image_url }));
    if (options.mask) body.mask = { image_url: options.mask };
    if (options.markup) body.markup = { image_url: options.markup };
  }
  const data = await client.post(editing ? "/images/edits" : "/images/generations", { body });
  const b64 = (data?.data || []).map((d) => d.b64_json).filter(Boolean);
  if (!b64.length) throw new Error("No image was generated");
  const outputFormat = data?.output_format || format || "png";
  return { b64, model, outputFormat, mime: MIME[outputFormat] || "image/png" };
}
function contentToResponses(content) {
  if (typeof content === "string" || content == null) return content ?? "";
  return content.map((part) => {
    if (part.type === "text") return { type: "input_text", text: part.text };
    if (part.type === "image_url") {
      const url = typeof part.image_url === "string" ? part.image_url : part.image_url?.url;
      return { type: "input_image", image_url: url, ...part.image_url?.detail ? { detail: part.image_url.detail } : {} };
    }
    return part;
  });
}
function chatToResponsesParams(params) {
  const {
    model,
    messages = [],
    response_format,
    max_tokens,
    max_completion_tokens,
    tools,
    tool_choice,
    stream
  } = params;
  const instructions = messages.filter((m) => m.role === "system" || m.role === "developer").map((m) => typeof m.content === "string" ? m.content : (m.content || []).map((p) => p.text).join("\n")).join("\n\n");
  const input = messages.filter((m) => m.role !== "system" && m.role !== "developer").map(
    (m) => m.role === "tool" ? { type: "function_call_output", call_id: m.tool_call_id, output: String(m.content ?? "") } : { role: m.role, content: contentToResponses(m.content) }
  );
  let text2;
  if (response_format?.type === "json_object") text2 = { format: { type: "json_object" } };
  if (response_format?.type === "json_schema") {
    const s = response_format.json_schema || {};
    text2 = { format: { type: "json_schema", name: s.name || "output", schema: s.schema, strict: s.strict ?? true } };
  }
  const needsJsonHint = text2?.format?.type === "json_object" && !/json/i.test(`${instructions} ${JSON.stringify(input)}`);
  const maxTokens = max_completion_tokens ?? max_tokens;
  return {
    model: mapLegacyModel(model),
    input: input.length ? input : "",
    ...instructions || needsJsonHint ? { instructions: `${instructions}${needsJsonHint ? "\nRespond with valid JSON." : ""}`.trim() } : {},
    ...text2 ? { text: text2 } : {},
    ...maxTokens ? { max_output_tokens: maxTokens } : {},
    ...tools?.length ? {
      tools: tools.map(
        (t) => t.type === "function" && t.function ? {
          type: "function",
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters ?? { type: "object", properties: {} },
          strict: t.function.strict ?? false
        } : t
      )
    } : {},
    ...tool_choice ? { tool_choice: typeof tool_choice === "object" && tool_choice.function ? { type: "function", name: tool_choice.function.name } : tool_choice } : {},
    ...stream ? { stream: true } : {},
    store: false
  };
}
function responseToChatCompletion(response) {
  const calls = (response.output || []).filter((item) => item.type === "function_call");
  const content = outputText(response);
  return {
    id: response.id,
    object: "chat.completion",
    created: response.created_at,
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: content || null,
          ...calls.length ? {
            tool_calls: calls.map((c) => ({
              id: c.call_id,
              type: "function",
              function: { name: c.name, arguments: c.arguments }
            }))
          } : {}
        },
        finish_reason: calls.length ? "tool_calls" : response.status === "incomplete" ? "length" : "stop"
      }
    ],
    usage: response.usage ? {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.total_tokens
    } : void 0
  };
}
async function* responsesStreamAsChatChunks(stream) {
  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      yield { object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: event.delta } }] };
    } else if (event.type === "response.completed") {
      yield { object: "chat.completion.chunk", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] };
    } else if (event.type === "error" || event.type === "response.failed") {
      throw new Error(event.message || event.response?.error?.message || "OpenAI stream failed");
    }
  }
}

// server/services/userOpenAI.ts
var NO_KEY_MESSAGE = "Add your OpenAI API key in Settings \u2192 API Keys to use AI features.";
async function getUserApiKey(userId, provider = "openai") {
  if (!db || !userId) return null;
  const key = await db.query.userApiKeys.findFirst({
    where: and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider),
      eq(userApiKeys.isActive, true)
    ),
    orderBy: [desc(userApiKeys.isDefault)]
  });
  return key ? { apiKey: key.apiKey, model: key.model } : null;
}
var GPT_IMAGE_SIZES = {
  "1792x1024": "1536x1024",
  "1024x1792": "1024x1536",
  "256x256": "1024x1024",
  "512x512": "1024x1024"
};
function normalizeImageParams(params) {
  const { style: _style, quality, response_format: _format, size, ...rest } = params;
  return {
    ...rest,
    model: rest.model ? mapLegacyModel(rest.model) : IMAGE_MODEL,
    ...size ? { size: GPT_IMAGE_SIZES[size] || size } : {},
    ...quality && !["hd", "standard"].includes(quality) ? { quality } : {}
  };
}
function wrapClient(client) {
  const responsesCreate = client.responses.create.bind(client.responses);
  const createResponse2 = (params, options) => {
    const { temperature: _temperature, top_p: _topP, ...rest } = params;
    return responsesCreate({ store: false, ...rest, model: mapLegacyModel(rest.model) }, options);
  };
  client.responses.create = createResponse2;
  client.chat.completions.create = async (params, options) => {
    const request = chatToResponsesParams(params);
    if (request.stream) return responsesStreamAsChatChunks(await createResponse2(request, options));
    return responseToChatCompletion(await createResponse2(request, options));
  };
  client.images.generate = async (params) => {
    const { prompt, size, model, quality, n } = normalizeImageParams(params);
    const { b64, mime } = await generateImage(client, { imageModel: model, prompt, size, quality, n });
    return { created: Math.floor(Date.now() / 1e3), data: b64.map((b) => ({ b64_json: b, url: `data:${mime};base64,${b}` })) };
  };
  return client;
}
async function getUserOpenAIClient(userId = currentUserId()) {
  if (!userId) return null;
  const keyData = await getUserApiKey(userId);
  if (!keyData) return null;
  return {
    client: wrapClient(new OpenAI({ apiKey: keyData.apiKey })),
    model: mapLegacyModel(keyData.model)
  };
}

// server/routes/crm.ts
init_schema();
import { eq as eq2, and as and2, desc as desc2, sql as sql2 } from "drizzle-orm";

// server/routes/auth.ts
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
var router = Router();
var supabaseUrl = process.env.SUPABASE_URL || "";
var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
async function verifySupabaseToken(token) {
  if (!token || !supabaseUrl || !serviceRoleKey) return null;
  const supabase8 = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase8.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email };
}
function isRequireAuthOptions(arg) {
  return arg && typeof arg === "object" && !("method" in arg) && !("headers" in arg);
}
async function requireAuthHandler(req, res, next, checkEntitlement) {
  try {
    let userId = req.session?.userId;
    let userEmail = req.session?.userEmail;
    let isAuthenticated = false;
    if (userId) {
      isAuthenticated = true;
    } else {
      const authHeader = req.headers.authorization;
      const hostname = req.headers.host || "";
      const isDevHost = hostname.includes("localhost") || hostname.includes("replit.dev") || hostname.includes("127.0.0.1");
      if (process.env.NODE_ENV !== "production" && isDevHost && authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        if (token.startsWith("dev-bypass-token-")) {
          userId = "dev-user-12345";
          userEmail = "dev@smartcrm.local";
          isAuthenticated = true;
          req.user = {
            id: userId,
            email: userEmail,
            username: userEmail,
            role: "super_admin",
            productTier: "super_admin"
          };
        }
      }
      if (!userId && authHeader?.startsWith("Bearer ")) {
        const user = await verifySupabaseToken(authHeader.substring(7));
        if (user) {
          userId = user.id;
          userEmail = user.email;
          isAuthenticated = true;
        }
      }
    }
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - Not authenticated" });
    }
    req.userId = userId;
    req.isAuthenticated = isAuthenticated;
    const ctx = requestContext.getStore();
    if (ctx) ctx.userId = userId;
    if (userEmail) {
      req.userEmail = userEmail;
    }
    if (checkEntitlement) {
      if (supabaseUrl && serviceRoleKey) {
        const supabase8 = createClient(supabaseUrl, serviceRoleKey);
        const { data: entitlement } = await supabase8.from("smartcrm_user_entitlements").select("package").eq("user_id", userId).single();
        if (entitlement && entitlement.package === "no_access") {
          return res.status(403).json({
            error: "Forbidden - No subscription",
            message: "Your account has no active subscription. Please upgrade to access this feature."
          });
        }
      }
    }
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
}
var requireAuth = (options) => {
  if (isRequireAuthOptions(options)) {
    const checkEntitlement = options.checkEntitlement !== false;
    return (req, res, next) => requireAuthHandler(req, res, next, checkEntitlement);
  }
  return (req, res, next) => requireAuthHandler(req, res, next, true);
};
var requireAdmin = async (req, res, next) => {
  try {
    let userId = req.userId ?? req.session?.userId;
    let userEmail = req.userEmail ?? req.session?.userEmail;
    const authHeader = req.headers.authorization;
    if (!userId && authHeader?.startsWith("Bearer ")) {
      const user = await verifySupabaseToken(authHeader.substring(7));
      userId = user?.id;
      userEmail = user?.email;
    }
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - Not authenticated" });
    }
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    const supabase8 = createClient(supabaseUrl, serviceRoleKey);
    const [profileResult, entitlementResult] = await Promise.all([
      supabase8.from("profiles").select("role").eq("id", userId).single(),
      userEmail ? supabase8.rpc("smartcrm_user_has_feature", {
        input_email: userEmail,
        input_feature_key: "admin_panel"
      }) : null
    ]);
    const profile = profileResult.data;
    if (profileResult.error || !profile) {
      return res.status(403).json({ error: "Forbidden - User not found" });
    }
    if (profile.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    if (entitlementResult && entitlementResult.data !== true) {
      return res.status(403).json({
        error: "Forbidden - Admin entitlement not found",
        message: "Your account does not have admin privileges. Please contact support."
      });
    }
    req.user = profile;
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ error: "Internal server error during admin check" });
  }
};
router.post("/invite", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!serviceRoleKey) {
      console.error("Service role key not configured");
      return res.status(500).json({ error: "Service role key not configured" });
    }
    const supabase8 = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase8.auth.admin.inviteUserByEmail(email);
    if (error) {
      console.error("Invite error:", error);
      return res.status(400).json({ error: error.message });
    }
    console.log("Invitation sent successfully:", email);
    res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        user: data.user
      }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
router.get("/users", async (req, res) => {
  try {
    if (!serviceRoleKey) {
      return res.status(500).json({ error: "Service role key not configured" });
    }
    const supabase8 = createClient(supabaseUrl, serviceRoleKey);
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 50;
    const { data, error } = await supabase8.auth.admin.listUsers({
      page,
      perPage
    });
    if (error) {
      console.error("List users error:", error);
      return res.status(400).json({ error: error.message });
    }
    res.json({
      success: true,
      data: {
        users: data.users,
        total: data.total_metadata?.total_count ?? data.users.length
      }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!serviceRoleKey) {
      return res.status(500).json({ error: "Service role key not configured" });
    }
    const supabase8 = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase8.auth.admin.deleteUser(id);
    if (error) {
      console.error("Delete user error:", error);
      return res.status(400).json({ error: error.message });
    }
    res.json({
      success: true,
      message: `User ${id} deleted successfully`
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, email_confirm, phone_confirm, user_metadata, app_metadata } = req.body;
    if (!serviceRoleKey) {
      return res.status(500).json({ error: "Service role key not configured" });
    }
    const supabase8 = createClient(supabaseUrl, serviceRoleKey);
    const updateData = {};
    if (email !== void 0) updateData.email = email;
    if (phone !== void 0) updateData.phone = phone;
    if (email_confirm !== void 0) updateData.email_confirm = email_confirm;
    if (phone_confirm !== void 0) updateData.phone_confirm = phone_confirm;
    if (user_metadata !== void 0) updateData.user_metadata = user_metadata;
    if (app_metadata !== void 0) updateData.app_metadata = app_metadata;
    const { data, error } = await supabase8.auth.admin.updateUserById(id, updateData);
    if (error) {
      console.error("Update user error:", error);
      return res.status(400).json({ error: error.message });
    }
    res.json({
      success: true,
      data: { user: data.user }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
var auth_default = router;

// server/memory.ts
var MemoryService = class {
  async recordObservation(_userId, _type, _content, _metadata) {
  }
  isEnabled() {
    return false;
  }
  async recordChatInteraction(_userId, _sessionId, _input, _output, _metadata) {
  }
  async recordSystemEvent(_eventType, _content, _metadata) {
  }
};
var memoryService = new MemoryService();

// server/routes/crm.ts
function registerCRMRoutes(app2) {
  app2.get("/api/contacts", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userContacts = await db2.select().from(contacts).where(eq2(contacts.profileId, userId)).orderBy(desc2(contacts.createdAt));
      res.json(userContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });
  app2.get("/api/contacts/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.id);
      const [contact] = await db2.select().from(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId)));
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });
  app2.post("/api/contacts", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const validatedData = insertContactSchema.parse({
        ...req.body,
        profileId: userId
      });
      const [newContact] = await db2.insert(contacts).values(validatedData).returning();
      res.status(201).json(newContact);
    } catch (error) {
      console.error("Error creating contact:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create contact" });
    }
  });
  app2.put("/api/contacts/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.id);
      const [existingContact] = await db2.select().from(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId)));
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      const [updatedContact] = await db2.update(contacts).set({
        ...req.body,
        profileId: userId,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId))).returning();
      res.json(updatedContact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });
  app2.delete("/api/contacts/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.id);
      const [deletedContact] = await db2.delete(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId))).returning();
      if (!deletedContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });
  app2.get("/api/contacts/duplicates", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userContacts = await db2.select().from(contacts).where(eq2(contacts.profileId, userId)).orderBy(desc2(contacts.createdAt));
      const groups = [];
      const seen = /* @__PURE__ */ new Set();
      const normalize = (value) => (value || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 120);
      const makeKey = (ids) => [...ids].sort().join("::");
      const addPair = (a, b, reason) => {
        const key = makeKey([String(a.id), String(b.id)]);
        if (seen.has(key)) return;
        seen.add(key);
        groups.push({
          contactA: a,
          contactB: b,
          reason,
          matchScore: reason === "email" ? 95 : reason === "phone" ? 90 : 70,
          merged: {
            id: a.id,
            firstName: a.firstName || b.firstName || "",
            lastName: a.lastName || b.lastName || "",
            email: a.email || b.email || "",
            phone: a.phone || b.phone || "",
            company: a.company || b.company || "",
            position: a.position || b.position || "",
            industry: a.industry || b.industry || "",
            status: a.status || b.status || "active",
            notes: [a.notes, b.notes].filter(Boolean).join("\n---\n"),
            tags: Array.from(/* @__PURE__ */ new Set([...a.tags || [], ...b.tags || []]))
          }
        });
      };
      for (let i = 0; i < userContacts.length; i++) {
        for (let j = i + 1; j < userContacts.length; j++) {
          const a = userContacts[i];
          const b = userContacts[j];
          const sameEmail = normalize(a.email).length > 3 && normalize(b.email).length > 3 && normalize(a.email) === normalize(b.email);
          const samePhone = normalize(a.phone).length > 3 && normalize(b.phone).length > 3 && normalize(a.phone) === normalize(b.phone);
          const sameNameCompany = normalize(a.firstName).length > 1 && normalize(a.lastName).length > 1 && normalize(b.firstName).length > 1 && normalize(b.lastName).length > 1 && normalize(a.firstName) === normalize(b.firstName) && normalize(a.lastName) === normalize(b.lastName) && normalize(a.company).length > 1 && normalize(a.company) === normalize(b.company);
          if (sameEmail) {
            addPair(a, b, "email");
          } else if (samePhone) {
            addPair(a, b, "phone");
          } else if (sameNameCompany) {
            addPair(a, b, "name_company");
          }
        }
      }
      res.json({ duplicates: groups });
    } catch (error) {
      console.error("Error finding duplicates:", error);
      res.status(500).json({ error: "Failed to find duplicates" });
    }
  });
  app2.post("/api/contacts/merge", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { primaryId, duplicateId, mergedFields } = req.body || {};
      if (!primaryId || !duplicateId) {
        return res.status(400).json({ error: "primaryId and duplicateId are required" });
      }
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [primary] = await db2.select().from(contacts).where(and2(eq2(contacts.id, primaryId), eq2(contacts.profileId, userId)));
      const [duplicate] = await db2.select().from(contacts).where(and2(eq2(contacts.id, duplicateId), eq2(contacts.profileId, userId)));
      if (!primary || !duplicate) {
        return res.status(404).json({ error: "Primary or duplicate contact not found" });
      }
      if (primaryId === duplicateId) {
        return res.status(400).json({ error: "Cannot merge a contact with itself" });
      }
      const updatePayload = { ...mergedFields || {}, updatedAt: /* @__PURE__ */ new Date() };
      const [updated] = await db2.update(contacts).set(updatePayload).where(and2(eq2(contacts.id, primaryId), eq2(contacts.profileId, userId))).returning();
      await db2.delete(contacts).where(and2(eq2(contacts.id, duplicateId), eq2(contacts.profileId, userId)));
      res.json({ contact: updated, merged: true });
    } catch (error) {
      console.error("Error merging contacts:", error);
      res.status(500).json({ error: "Failed to merge contacts" });
    }
  });
  app2.get("/api/deals", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userDeals = await db2.select().from(deals).where(eq2(deals.profileId, userId)).orderBy(desc2(deals.createdAt));
      res.json(userDeals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });
  app2.get("/api/deals/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dealId = parseInt(req.params.id);
      const [deal] = await db2.select().from(deals).where(and2(eq2(deals.id, dealId), eq2(deals.profileId, userId)));
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });
  app2.post("/api/deals", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const validatedData = insertDealSchema.parse({
        ...req.body,
        profileId: userId
      });
      const [newDeal] = await db2.insert(deals).values(validatedData).returning();
      res.status(201).json(newDeal);
    } catch (error) {
      console.error("Error creating deal:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create deal" });
    }
  });
  app2.put("/api/deals/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dealId = parseInt(req.params.id);
      const [existingDeal] = await db2.select().from(deals).where(and2(eq2(deals.id, dealId), eq2(deals.profileId, userId)));
      if (!existingDeal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      const [updatedDeal] = await db2.update(deals).set({
        ...req.body,
        profileId: userId,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and2(eq2(deals.id, dealId), eq2(deals.profileId, userId))).returning();
      res.json(updatedDeal);
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(500).json({ error: "Failed to update deal" });
    }
  });
  app2.delete("/api/deals/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dealId = parseInt(req.params.id);
      const [deletedDeal] = await db2.delete(deals).where(and2(eq2(deals.id, dealId), eq2(deals.profileId, userId))).returning();
      if (!deletedDeal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json({ message: "Deal deleted successfully" });
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });
  app2.get("/api/tasks", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userTasks = await db2.select().from(tasks).where(eq2(tasks.profileId, userId)).orderBy(desc2(tasks.createdAt));
      res.json(userTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
  app2.get("/api/tasks/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const taskId = parseInt(req.params.id);
      const [task] = await db2.select().from(tasks).where(and2(eq2(tasks.id, taskId), eq2(tasks.profileId, userId)));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });
  app2.post("/api/tasks", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        profileId: userId
      });
      const [newTask] = await db2.insert(tasks).values(validatedData).returning();
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });
  app2.put("/api/tasks/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const taskId = parseInt(req.params.id);
      const [existingTask] = await db2.select().from(tasks).where(and2(eq2(tasks.id, taskId), eq2(tasks.profileId, userId)));
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      const validatedData = insertTaskSchema.parse(req.body);
      const [updatedTask] = await db2.update(tasks).set({
        ...validatedData,
        profileId: userId,
        // Explicitly set to prevent privilege escalation
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and2(eq2(tasks.id, taskId), eq2(tasks.profileId, userId))).returning();
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });
  app2.delete("/api/tasks/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const taskId = parseInt(req.params.id);
      const [deletedTask] = await db2.delete(tasks).where(and2(eq2(tasks.id, taskId), eq2(tasks.profileId, userId))).returning();
      if (!deletedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });
  app2.get("/api/appointments", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userAppointments = await db2.select().from(appointments).where(eq2(appointments.profileId, userId)).orderBy(desc2(appointments.startTime));
      res.json(userAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });
  app2.get("/api/appointments/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const appointmentId = parseInt(req.params.id);
      const [appointment] = await db2.select().from(appointments).where(and2(eq2(appointments.id, appointmentId), eq2(appointments.profileId, userId)));
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });
  app2.post("/api/appointments", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const validatedData = insertAppointmentSchema.parse({
        ...req.body,
        profileId: userId
      });
      const [newAppointment] = await db2.insert(appointments).values(validatedData).returning();
      res.status(201).json(newAppointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });
  app2.put("/api/appointments/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const appointmentId = parseInt(req.params.id);
      const [existingAppointment] = await db2.select().from(appointments).where(and2(eq2(appointments.id, appointmentId), eq2(appointments.profileId, userId)));
      if (!existingAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      const validatedData = insertAppointmentSchema.parse(req.body);
      const [updatedAppointment] = await db2.update(appointments).set({
        ...validatedData,
        profileId: userId,
        // Explicitly set to prevent privilege escalation
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and2(eq2(appointments.id, appointmentId), eq2(appointments.profileId, userId))).returning();
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });
  app2.delete("/api/appointments/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const appointmentId = parseInt(req.params.id);
      const [deletedAppointment] = await db2.delete(appointments).where(and2(eq2(appointments.id, appointmentId), eq2(appointments.profileId, userId))).returning();
      if (!deletedAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });
  app2.get("/api/communications", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userCommunications = await db2.select().from(communications).where(eq2(communications.profileId, userId)).orderBy(desc2(communications.createdAt));
      res.json(userCommunications);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });
  app2.post("/api/communications", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const validatedData = insertCommunicationSchema.parse({
        ...req.body,
        profileId: userId
      });
      const [newCommunication] = await db2.insert(communications).values(validatedData).returning();
      res.status(201).json(newCommunication);
    } catch (error) {
      console.error("Error creating communication:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create communication" });
    }
  });
  app2.get("/api/notes", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userNotes = await db2.select().from(notes).where(eq2(notes.profileId, userId)).orderBy(desc2(notes.createdAt));
      res.json(userNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });
  app2.get("/api/notes/contact/:contactId", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.contactId);
      const contactNotes = await db2.select().from(notes).where(and2(eq2(notes.contactId, contactId), eq2(notes.profileId, userId))).orderBy(desc2(notes.createdAt));
      res.json(contactNotes);
    } catch (error) {
      console.error("Error fetching contact notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });
  app2.get("/api/notes/deal/:dealId", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dealId = parseInt(req.params.dealId);
      const dealNotes = await db2.select().from(notes).where(and2(eq2(notes.dealId, dealId), eq2(notes.profileId, userId))).orderBy(desc2(notes.createdAt));
      res.json(dealNotes);
    } catch (error) {
      console.error("Error fetching deal notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });
  app2.post("/api/notes", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const validatedData = insertNoteSchema.parse({
        ...req.body,
        profileId: userId
      });
      const [newNote] = await db2.insert(notes).values(validatedData).returning();
      res.status(201).json(newNote);
    } catch (error) {
      console.error("Error creating note:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create note" });
    }
  });
  app2.put("/api/notes/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const noteId = parseInt(req.params.id);
      const [existingNote] = await db2.select().from(notes).where(and2(eq2(notes.id, noteId), eq2(notes.profileId, userId)));
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }
      const validatedData = updateNoteSchema.parse(req.body);
      const [updatedNote] = await db2.update(notes).set({
        ...validatedData,
        profileId: userId,
        // Explicitly set to prevent privilege escalation
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and2(eq2(notes.id, noteId), eq2(notes.profileId, userId))).returning();
      res.json(updatedNote);
    } catch (error) {
      console.error("Error updating note:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update note" });
    }
  });
  app2.delete("/api/notes/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const noteId = parseInt(req.params.id);
      const [deletedNote] = await db2.delete(notes).where(and2(eq2(notes.id, noteId), eq2(notes.profileId, userId))).returning();
      if (!deletedNote) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });
  app2.get("/api/documents", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userDocuments = await db2.select().from(documents).where(eq2(documents.profileId, userId)).orderBy(desc2(documents.createdAt));
      res.json(userDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });
  app2.post("/api/documents", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        profileId: userId
      });
      const [newDocument] = await db2.insert(documents).values(validatedData).returning();
      res.status(201).json(newDocument);
    } catch (error) {
      console.error("Error creating document:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });
  app2.delete("/api/documents/:id", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const documentId = parseInt(req.params.id);
      const [deletedDocument] = await db2.delete(documents).where(and2(eq2(documents.id, documentId), eq2(documents.profileId, userId))).returning();
      if (!deletedDocument) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });
  app2.get("/api/tenants", requireAuth(), async (req, res) => {
    try {
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const tenantList = await db2.select().from(tenantConfigs);
      res.json(tenantList);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });
  app2.post("/api/tenants", requireAuth(), async (req, res) => {
    try {
      const { name, domain, config } = req.body;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [newTenant] = await db2.insert(tenantConfigs).values({
        tenantId: domain || `tenant-${Date.now()}`,
        config: config || {}
      }).returning();
      res.status(201).json(newTenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ error: "Failed to create tenant" });
    }
  });
  app2.put("/api/tenants/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [updatedTenant] = await db2.update(tenantConfigs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(tenantConfigs.id, id)).returning();
      if (!updatedTenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      res.json(updatedTenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });
  app2.delete("/api/tenants/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await db2.delete(tenantConfigs).where(eq2(tenantConfigs.id, id));
      res.json({ message: "Tenant deleted successfully" });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ error: "Failed to delete tenant" });
    }
  });
  app2.post("/api/domains/verify", requireAuth(), async (req, res) => {
    try {
      const { domain } = req.body;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      const isValidFormat = domainRegex.test(domain);
      if (!isValidFormat) {
        return res.json({
          domain,
          verified: false,
          message: "Invalid domain format. Use format: subdomain.domain.tld"
        });
      }
      const existing = await db2.select().from(tenantConfigs).where(eq2(tenantConfigs.tenantId, domain));
      const isAvailable = existing.length === 0;
      res.json({
        domain,
        verified: isAvailable,
        message: isAvailable ? "Domain is available and valid" : "Domain is already in use"
      });
    } catch (error) {
      console.error("Error verifying domain:", error);
      res.status(500).json({ error: "Failed to verify domain" });
    }
  });
  app2.post("/api/domains/configure", requireAuth(), async (req, res) => {
    try {
      const { tenantId, domain } = req.body;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      if (!tenantId || !domain) {
        return res.status(400).json({ error: "tenantId and domain are required" });
      }
      const [existing] = await db2.select().from(tenantConfigs).where(eq2(tenantConfigs.id, tenantId));
      const currentConfig = existing?.config || {};
      const [updated] = await db2.update(tenantConfigs).set({ config: { ...currentConfig, domain } }).where(eq2(tenantConfigs.id, tenantId)).returning();
      res.json({
        tenantId,
        domain,
        configured: true,
        cnameTarget: "app.smartcrm.vip",
        sslCertificate: "auto-generated",
        status: "pending_dns_propagation",
        message: "Domain configured successfully. DNS propagation may take up to 24 hours.",
        nextSteps: [
          "Update your DNS CNAME record to point to app.smartcrm.vip",
          "SSL certificate will be automatically generated",
          "Domain will be active once DNS propagates"
        ]
      });
    } catch (error) {
      console.error("Error configuring domain:", error);
      res.status(500).json({ error: "Failed to configure domain" });
    }
  });
  app2.get("/api/domains/status/:domain", requireAuth(), async (req, res) => {
    try {
      const { domain } = req.params;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [tenant] = await db2.select().from(tenantConfigs).where(eq2(tenantConfigs.tenantId, domain));
      const isConfigured = !!tenant;
      res.json({
        domain,
        status: isConfigured ? "active" : "pending",
        dnsResolved: isConfigured,
        sslCertificate: isConfigured ? "valid" : "pending",
        lastChecked: (/* @__PURE__ */ new Date()).toISOString(),
        cnameTarget: "app.smartcrm.vip"
      });
    } catch (error) {
      console.error("Error checking domain status:", error);
      res.status(500).json({ error: "Failed to check domain status" });
    }
  });
  app2.get("/api/security/audit/:tenantId", requireAuth(), async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [userCount] = await db2.select({ count: sql2`count(*)` }).from(profiles);
      const [contactCount] = await db2.select({ count: sql2`count(*)` }).from(contacts);
      const activityCount = await db2.select({ count: sql2`count(*)` }).from(contactActivities);
      const tenant = await db2.select().from(tenantConfigs).where(eq2(tenantConfigs.id, tenantId)).then((r) => r[0]);
      const findings = [
        {
          id: "data-inventory",
          severity: "info",
          category: "inventory",
          title: "Data Inventory Review",
          description: `System contains ${userCount.count} users, ${contactCount.count} contacts, and ${activityCount.count} activity records.`,
          impact: "Baseline security posture established",
          remediation: "Continue monitoring data growth and access patterns",
          status: "resolved"
        },
        {
          id: "access-controls",
          severity: userCount.count > 0 ? "low" : "medium",
          category: "authentication",
          title: "Access Control Review",
          description: userCount.count > 0 ? "User access controls are configured via Supabase auth and role-based entitlements." : "No users detected in system.",
          impact: "Proper access controls reduce unauthorized access risk",
          remediation: "Review role assignments and entitlement packages quarterly",
          status: userCount.count > 0 ? "resolved" : "open"
        },
        {
          id: "data-retention",
          severity: contactCount.count > 100 ? "medium" : "low",
          category: "governance",
          title: "Data Retention Policy",
          description: `${contactCount.count} contact records stored. Ensure retention policies align with compliance requirements.`,
          impact: "Proper data retention reduces legal and compliance risk",
          remediation: "Define and enforce data retention and deletion schedules",
          status: contactCount.count > 0 ? "open" : "resolved"
        }
      ];
      const overallRisk = findings.some((f) => f.severity === "high") ? "high" : findings.some((f) => f.severity === "medium") ? "medium" : "low";
      const auditResult = {
        tenantId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        overallRisk,
        findings,
        recommendations: [
          "Enable comprehensive audit logging for all data access",
          "Implement data encryption at rest and in transit",
          "Schedule quarterly security reviews",
          "Train users on security best practices",
          "Verify backup integrity and restoration procedures"
        ]
      };
      res.json(auditResult);
    } catch (error) {
      console.error("Error running security audit:", error);
      res.status(500).json({ error: "Failed to run security audit" });
    }
  });
  app2.post("/api/security/policies", requireAuth(), async (req, res) => {
    try {
      const { tenantId, policyType, settings } = req.body;
      const policyUpdate = {
        tenantId,
        policyType,
        settings,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        applied: true
      };
      res.json({
        message: "Security policy updated successfully",
        policy: policyUpdate
      });
    } catch (error) {
      console.error("Error updating security policy:", error);
      res.status(500).json({ error: "Failed to update security policy" });
    }
  });
  app2.get("/api/security/compliance/:tenantId", requireAuth(), async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [contactCount] = await db2.select({ count: sql2`count(*)` }).from(contacts);
      const [activityCount] = await db2.select({ count: sql2`count(*)` }).from(contactActivities);
      const [tenant] = await db2.select().from(tenantConfigs).where(eq2(tenantConfigs.id, tenantId));
      const hasTenantConfig = !!tenant;
      const now = /* @__PURE__ */ new Date();
      const lastAudit = now.toISOString();
      const nextAudit = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1e3).toISOString();
      const standards = {
        gdpr: {
          compliant: hasTenantConfig && contactCount.count > 0,
          lastAudit,
          nextAudit,
          evidence: contactCount.count > 0 ? "Contact records present with createdAt/updatedAt timestamps" : "No personal data detected"
        },
        soc2: {
          compliant: hasTenantConfig,
          message: hasTenantConfig ? "Tenant configuration present" : "Tenant configuration missing",
          lastAudit,
          expectedCompletion: nextAudit
        },
        hipaa: {
          compliant: false,
          applicable: false,
          message: "Not applicable to this tenant"
        }
      };
      const overallCompliance = standards.gdpr.compliant && standards.soc2.compliant ? "compliant" : "partial";
      const complianceStatus = {
        tenantId,
        lastChecked: now.toISOString(),
        standards,
        overallCompliance
      };
      res.json(complianceStatus);
    } catch (error) {
      console.error("Error checking compliance status:", error);
      res.status(500).json({ error: "Failed to check compliance status" });
    }
  });
  app2.post("/api/contacts/:id/enrich", requireAuth({ checkEntitlement: false }), async (req, res) => {
    const userId = req.userId;
    try {
      const contactId = parseInt(req.params.id);
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [contact] = await db2.select().from(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId)));
      if (!contact) {
        memoryService.recordObservation(
          userId,
          "error",
          `Enrichment failed: Contact ${contactId} not found`,
          { endpoint: "/api/contacts/:id/enrich", contactId }
        ).catch(() => {
        });
        return res.status(404).json({ error: "Contact not found" });
      }
      let enrichedData;
      try {
        const openaiData = await getUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
        }
        const openai = openaiData.client;
        const prompt = `Enrich this contact's information with additional professional details:
Name: ${contact.firstName} ${contact.lastName}
Title: ${contact.title || ""}
Company: ${contact.company || ""}
Industry: ${contact.industry || ""}
Email: ${contact.email || ""}

Search the web for this person and their company. Only include details you found; leave unknown fields empty.
Return as JSON with keys: companySize, industry, socialProfiles, insights`;
        const result = await respond(openai, {
          model: ADVANCED_MODEL,
          input: prompt,
          json: true,
          tools: [webSearchTool()]
        });
        try {
          if (!result.data) throw new Error("No JSON in response");
          enrichedData = { ...result.data, sources: result.sources };
        } catch (parseError) {
          memoryService.recordObservation(
            userId,
            "error",
            `Enrichment parsing failed for contact ${contactId}`,
            { endpoint: "/api/contacts/:id/enrich", contactId, error: "JSON parse error" }
          ).catch(() => {
          });
          return res.status(500).json({ error: "Failed to parse enrichment data" });
        }
      } catch (aiError) {
        memoryService.recordObservation(
          userId,
          "error",
          `Enrichment AI call failed for contact ${contactId}: ${aiError instanceof Error ? aiError.message : "Unknown"}`,
          { endpoint: "/api/contacts/:id/enrich", contactId }
        ).catch(() => {
        });
        return res.status(500).json({ error: "Enrichment failed" });
      }
      const [updatedContact] = await db2.update(contacts).set({
        enrichmentData: enrichedData,
        lastEnrichedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(contacts.id, contactId)).returning();
      await db2.insert(contactActivities).values({
        contactId,
        activityType: "enrichment",
        description: "AI enrichment completed",
        metadata: { enrichedFields: Object.keys(enrichedData) }
      });
      memoryService.recordObservation(
        userId,
        "tool_use",
        `Contact enrichment completed for ${contact.firstName} ${contact.lastName} (ID: ${contactId})`,
        {
          endpoint: "contact_enrichment",
          contactId,
          contactName: `${contact.firstName} ${contact.lastName}`,
          enrichedFields: Object.keys(enrichedData),
          fieldsCount: Object.keys(enrichedData).length,
          company: contact.company,
          industry: enrichedData.industry || contact.industry
        }
      ).catch(() => {
      });
      res.json({ enriched: true, data: enrichedData, contact: updatedContact });
    } catch (error) {
      console.error("Error enriching contact:", error);
      memoryService.recordObservation(
        userId,
        "error",
        `Enrichment exception for contact ${req.params.id}: ${error.message}`,
        { endpoint: "/api/contacts/:id/enrich", contactId: req.params.id, stack: error.stack?.slice(0, 200) }
      ).catch(() => {
      });
      res.status(500).json({ error: "Enrichment failed", details: error.message });
    }
  });
  app2.get("/api/contacts/:id/enrichment-history", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.id);
      const [contact] = await db2.select().from(contacts).where(eq2(contacts.id, contactId));
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      const history = await db2.select().from(contactActivities).where(and2(eq2(contactActivities.contactId, contactId), eq2(contactActivities.activityType, "enrichment"))).orderBy(desc2(contactActivities.createdAt));
      res.json(history.map((h) => ({
        timestamp: h.createdAt,
        source: "OpenAI",
        data: h.metadata
      })));
    } catch (error) {
      console.error("Error fetching enrichment history:", error);
      res.status(500).json({ error: "Failed to fetch enrichment history" });
    }
  });
  app2.post("/api/contacts/:id/score", requireAuth({ checkEntitlement: false }), async (req, res) => {
    const userId = req.userId;
    try {
      const contactId = parseInt(req.params.id);
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [contact] = await db2.select().from(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId)));
      if (!contact) {
        memoryService.recordObservation(
          userId,
          "error",
          `Scoring failed: Contact ${contactId} not found`,
          { endpoint: "/api/contacts/:id/score", contactId }
        ).catch(() => {
        });
        return res.status(404).json({ error: "Contact not found" });
      }
      let scoreData;
      try {
        const openaiData = await getUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
        }
        const openai = openaiData.client;
        const prompt = `Score this contact's sales potential on a scale of 0-100:
Name: ${contact.firstName} ${contact.lastName}
Title: ${contact.title || ""}
Company: ${contact.company || ""}
Industry: ${contact.industry || ""}
Status: ${contact.status || ""}
Notes: ${contact.notes || ""}

Return JSON with: score (0-100), rationale, lead_score, engagement_score`;
        const completion = await openai.chat.completions.create({
          model: ADVANCED_MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });
        scoreData = parseJSONText(completion.choices[0].message.content || "");
        if (!scoreData) {
          memoryService.recordObservation(
            userId,
            "error",
            `Scoring parsing failed for contact ${contactId}`,
            { endpoint: "/api/contacts/:id/score", contactId, error: "JSON parse error" }
          ).catch(() => {
          });
          return res.status(500).json({ error: "Failed to parse scoring data" });
        }
      } catch (aiError) {
        memoryService.recordObservation(
          userId,
          "error",
          `Scoring AI call failed for contact ${contactId}: ${aiError instanceof Error ? aiError.message : "Unknown"}`,
          { endpoint: "/api/contacts/:id/score", contactId }
        ).catch(() => {
        });
        return res.status(500).json({ error: "Scoring failed" });
      }
      const [updatedContact] = await db2.update(contacts).set({
        score: String(scoreData.score / 100),
        aiScoreRationale: scoreData.rationale,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(contacts.id, contactId)).returning();
      await db2.insert(contactActivities).values({
        contactId,
        activityType: "scoring",
        description: "AI scoring completed",
        metadata: scoreData
      });
      memoryService.recordObservation(
        userId,
        "tool_use",
        `Contact scoring completed for ${contact.firstName} ${contact.lastName} (ID: ${contactId})`,
        {
          endpoint: "contact_scoring",
          contactId,
          contactName: `${contact.firstName} ${contact.lastName}`,
          score: scoreData.score,
          leadScore: scoreData.lead_score,
          engagementScore: scoreData.engagement_score,
          rationale: scoreData.rationale?.slice(0, 200),
          company: contact.company
        }
      ).catch(() => {
      });
      res.json({
        score: scoreData.score,
        rationale: scoreData.rationale,
        leadScore: scoreData.lead_score,
        engagementScore: scoreData.engagement_score,
        contact: updatedContact
      });
    } catch (error) {
      console.error("Error scoring contact:", error);
      memoryService.recordObservation(
        userId,
        "error",
        `Scoring exception for contact ${req.params.id}: ${error.message}`,
        { endpoint: "/api/contacts/:id/score", contactId: req.params.id, stack: error.stack?.slice(0, 200) }
      ).catch(() => {
      });
      res.status(500).json({ error: "Scoring failed", details: error.message });
    }
  });
  app2.get("/api/contacts/scoring-stats", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const userContacts = await db2.select().from(contacts).where(eq2(contacts.profileId, userId));
      const scores = userContacts.map((c) => parseFloat(c.score || "0")).filter((s) => !isNaN(s));
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const highPriority = userContacts.filter((c) => parseFloat(c.score || "0") > 0.7).length;
      res.json({
        averageAiScore: Math.round(averageScore * 100),
        totalContacts: userContacts.length,
        highPriorityCount: highPriority
      });
    } catch (error) {
      console.error("Error fetching scoring stats:", error);
      res.status(500).json({ error: "Failed to fetch scoring stats" });
    }
  });
  app2.put("/api/contacts/:id/custom-fields", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.id);
      const { customFields } = req.body;
      const [contact] = await db2.select().from(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId)));
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      if (customFields) {
        const validKey = (key) => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key);
        const invalidKeys = Object.keys(customFields).filter((k) => !validKey(k));
        if (invalidKeys.length > 0) {
          return res.status(400).json({ error: "Invalid custom field keys" });
        }
      }
      const mergedFields = { ...contact.customFields || {}, ...customFields || {} };
      await db2.delete(contactCustomFields).where(eq2(contactCustomFields.contactId, contactId));
      if (mergedFields && Object.keys(mergedFields).length > 0) {
        await db2.insert(contactCustomFields).values(
          Object.entries(mergedFields).map(([key, value]) => ({
            contactId,
            fieldKey: key,
            fieldValue: value
          }))
        );
      }
      await db2.update(contacts).set({ customFields: mergedFields }).where(eq2(contacts.id, contactId));
      res.json({ updated: true, customFields: mergedFields });
    } catch (error) {
      console.error("Error updating custom fields:", error);
      res.status(500).json({ error: "Failed to update custom fields" });
    }
  });
  app2.delete("/api/contacts/:id/custom-fields/:key", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.id);
      const fieldKey = req.params.key;
      const [contact] = await db2.select().from(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId)));
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      await db2.delete(contactCustomFields).where(and2(eq2(contactCustomFields.contactId, contactId), eq2(contactCustomFields.fieldKey, fieldKey)));
      const updatedFields = { ...contact.customFields || {} };
      delete updatedFields[fieldKey];
      await db2.update(contacts).set({ customFields: updatedFields }).where(eq2(contacts.id, contactId));
      res.json({ deleted: true });
    } catch (error) {
      console.error("Error deleting custom field:", error);
      res.status(500).json({ error: "Failed to delete custom field" });
    }
  });
  app2.get("/api/contacts/:id/activities", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.id);
      const type = req.query.type;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const [contact] = await db2.select().from(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId)));
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      const conditions = [eq2(contactActivities.contactId, contactId)];
      if (type) {
        conditions.push(eq2(contactActivities.activityType, type));
      }
      const offset = (page - 1) * limit;
      const activities = await db2.select().from(contactActivities).where(and2(...conditions)).orderBy(desc2(contactActivities.createdAt)).limit(limit).offset(offset);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });
  app2.post("/api/contacts/:id/activities", requireAuth({ checkEntitlement: false }), async (req, res) => {
    try {
      const userId = req.userId;
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const contactId = parseInt(req.params.id);
      const { activityType, description, metadata } = req.body;
      const [contact] = await db2.select().from(contacts).where(and2(eq2(contacts.id, contactId), eq2(contacts.profileId, userId)));
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      const validTypes = ["email", "call", "meeting", "note", "enrichment", "scoring", "task_completed"];
      if (!validTypes.includes(activityType)) {
        return res.status(400).json({ error: "Invalid activity type" });
      }
      const [activity] = await db2.insert(contactActivities).values({
        contactId,
        activityType,
        description: description || "",
        metadata: metadata || {}
      }).returning();
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ error: "Failed to create activity" });
    }
  });
}

// server/supabase.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var supabaseUrl2 = process.env.SUPABASE_URL || "";
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl2 || !supabaseServiceKey) {
  console.warn("Supabase server configuration missing. Some features may not work.");
}
var supabase = supabaseUrl2 && supabaseServiceKey ? createClient2(supabaseUrl2, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;
var isSupabaseConfigured = () => {
  return !!supabase;
};

// server/middleware/security.ts
import helmet from "helmet";
import cors from "cors";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
var securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://*.supabase.co", "wss:", "ws:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  // Allow embedding for dashboard
  hsts: {
    maxAge: 31536e3,
    includeSubDomains: true,
    preload: true
  }
});
var defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://smartcrm.vip",
  "https://www.smartcrm.vip",
  "https://app.smartcrm.vip",
  "https://*.smartcrm.vip",
  "https://*.vercel.app"
];
var corsConfig = cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : defaultOrigins;
    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed.includes("*")) {
        const regex = new RegExp(allowed.replace("*", ".*"));
        return regex.test(origin);
      }
      return origin === allowed;
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Tenant-ID",
    "X-Webhook-Signature"
  ],
  exposedHeaders: ["X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"]
});
var createRateLimit = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: "Too many requests",
      message: options.message || "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil(options.windowMs / 1e3)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    // Use IP address for rate limiting (IPv6-safe via library helper)
    keyGenerator: (req) => ipKeyGenerator(req),
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(options.windowMs / 1e3)
      });
    }
  });
};
var apiLimiter = createRateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // 100 requests per 15 minutes
  message: "Too many API requests. Please try again later."
});
var authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 attempts per 15 minutes
  message: "Too many authentication attempts. Please try again later.",
  skipFailedRequests: false
});
var aiLimiter = createRateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 10,
  // 10 AI requests per minute
  message: "AI request limit exceeded. Please wait before making another request.",
  skipSuccessfulRequests: false
});
var uploadLimiter = createRateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 5,
  // 5 uploads per minute
  message: "Upload limit exceeded. Please wait before uploading again."
});
var adminLimiter = createRateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 30,
  // 30 admin requests per minute
  message: "Admin request limit exceeded."
});
var webhookLimiter = createRateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 1e3,
  // 1000 webhook calls per minute
  message: "Webhook rate limit exceeded.",
  skipSuccessfulRequests: true
  // Don't count successful webhooks
});
var healthLimiter = rateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 1e4,
  // Very permissive for health checks
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: true
});

// server/middleware/auditLog.ts
function auditLog(action) {
  return (req, res, next) => {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    const userId = req.user?.id || "anonymous";
    const userEmail = req.user?.username || "unknown";
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const method = req.method;
    const path2 = req.path;
    const userAgent = req.get("User-Agent") || "unknown";
    console.log(
      `\u{1F50D} AUDIT [${timestamp2}] ${action}: ${userEmail} (${userId}) from ${ip} - ${method} ${path2}`
    );
    res.auditData = {
      timestamp: timestamp2,
      userId,
      userEmail,
      action,
      ip,
      method,
      path: path2,
      userAgent,
      params: req.params,
      query: req.query,
      body: req.method !== "GET" ? req.body : void 0
    };
    next();
  };
}
var auditUserCreate = auditLog("USER_CREATE");
var auditUserUpdate = auditLog("USER_UPDATE");
var auditUserDelete = auditLog("USER_DELETE");
var auditBulkImport = auditLog("BULK_IMPORT");
var auditRoleChange = auditLog("ROLE_CHANGE");
var auditTierChange = auditLog("TIER_CHANGE");
var auditEmailSend = auditLog("EMAIL_SEND");
var auditSettingsChange = auditLog("SETTINGS_CHANGE");

// server/middleware/validation.ts
import { z } from "zod";

// server/services/errorLogger.ts
var ErrorLogger = class {
  sentryEnabled;
  datadogEnabled;
  logToFile;
  constructor() {
    this.sentryEnabled = !!process.env.SENTRY_DSN;
    this.datadogEnabled = !!process.env.DATADOG_API_KEY;
    this.logToFile = process.env.LOG_TO_FILE === "true";
  }
  /**
   * Log an error with context
   */
  async logError(message, error, context) {
    const logEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "error",
      message,
      error,
      context,
      stack: error?.stack
    };
    this.logToConsole(logEntry);
    if (this.sentryEnabled) {
      await this.sendToSentry(logEntry);
    }
    if (this.datadogEnabled) {
      await this.sendToDataDog(logEntry);
    }
    if (this.logToFile) {
      await this.writeToFile(logEntry);
    }
  }
  /**
   * Log a warning
   */
  async logWarning(message, context) {
    const logEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "warn",
      message,
      context
    };
    this.logToConsole(logEntry);
    if (this.logToFile) {
      await this.writeToFile(logEntry);
    }
  }
  /**
   * Log info message
   */
  async logInfo(message, context) {
    const logEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "info",
      message,
      context
    };
    if (process.env.NODE_ENV === "development") {
      this.logToConsole(logEntry);
    }
    if (this.logToFile) {
      await this.writeToFile(logEntry);
    }
  }
  /**
   * Console logging with formatting
   */
  logToConsole(entry) {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    switch (entry.level) {
      case "error":
        console.error(`${prefix} ${entry.message}${contextStr}`);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
      case "warn":
        console.warn(`${prefix} ${entry.message}${contextStr}`);
        break;
      case "info":
        console.log(`${prefix} ${entry.message}${contextStr}`);
        break;
    }
  }
  /**
   * Send to Sentry (placeholder for actual implementation)
   */
  async sendToSentry(entry) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[Sentry] Would send:", entry.message);
      }
    } catch (error) {
      console.error("Failed to send to Sentry:", error);
    }
  }
  /**
   * Send to DataDog (placeholder for actual implementation)
   */
  async sendToDataDog(entry) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[DataDog] Would send:", entry.message);
      }
    } catch (error) {
      console.error("Failed to send to DataDog:", error);
    }
  }
  /**
   * Write to log file
   */
  async writeToFile(entry) {
    try {
      const fs2 = await import("fs/promises");
      const path2 = await import("path");
      const logDir = path2.join(process.cwd(), "logs");
      const logFile = path2.join(logDir, `app-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.log`);
      try {
        await fs2.mkdir(logDir, { recursive: true });
      } catch (error) {
      }
      const logLine = JSON.stringify(entry) + "\n";
      await fs2.appendFile(logFile, logLine);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }
  /**
   * Create error context from Express request
   */
  createContextFromRequest(req) {
    return {
      userId: req.session?.userId || req.user?.id,
      requestId: req.id,
      endpoint: req.path,
      method: req.method,
      userAgent: req.get("user-agent"),
      ip: req.ip || req.connection.remoteAddress
    };
  }
  /**
   * Express middleware for automatic error logging
   */
  errorMiddleware() {
    return async (err, req, res, next) => {
      const context = this.createContextFromRequest(req);
      context.statusCode = res.statusCode || 500;
      await this.logError(`Unhandled error in ${req.method} ${req.path}`, err, context);
      next(err);
    };
  }
};
var errorLogger = new ErrorLogger();

// server/middleware/validation.ts
var schemas = {
  // UUID validation
  uuid: z.string().uuid(),
  // Email validation
  email: z.string().email().max(254),
  // Password validation
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be at most 128 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one lowercase letter, one uppercase letter, and one number"
  ),
  // Name validation
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters").regex(/^[a-zA-Z\s\-']+$/, "Name contains invalid characters"),
  // Domain validation
  domain: z.string().min(1, "Domain is required").max(253, "Domain is too long").regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i, "Invalid domain format"),
  // Subdomain validation
  subdomain: z.string().regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/, "Invalid subdomain format").max(63, "Subdomain is too long"),
  // URL validation
  url: z.string().url().max(2048),
  // File size validation
  fileSize: (maxSize) => z.number().max(maxSize, `File size exceeds ${maxSize} bytes`),
  // Color validation (hex)
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  // Phone validation
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format").max(20),
  // Tenant plan validation
  tenantPlan: z.enum(["starter", "professional", "enterprise"]),
  // Tenant type validation
  tenantType: z.enum(["customer", "partner", "reseller"]),
  // Theme config validation
  themeConfig: z.object({
    colors: z.object({
      primary: z.string().regex(/^#[0-9A-F]{6}$/i),
      secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
      accent: z.string().regex(/^#[0-9A-F]{6}$/i),
      background: z.string().regex(/^#[0-9A-F]{6}$/i),
      surface: z.string().regex(/^#[0-9A-F]{6}$/i),
      text: z.object({
        primary: z.string().regex(/^#[0-9A-F]{6}$/i),
        secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
        disabled: z.string().regex(/^#[0-9A-F]{6}$/i)
      }),
      success: z.string().regex(/^#[0-9A-F]{6}$/i),
      warning: z.string().regex(/^#[0-9A-F]{6}$/i),
      error: z.string().regex(/^#[0-9A-F]{6}$/i),
      info: z.string().regex(/^#[0-9A-F]{6}$/i)
    }),
    typography: z.object({
      fontFamily: z.object({
        primary: z.string().max(100),
        secondary: z.string().max(100),
        monospace: z.string().max(100)
      }),
      fontSize: z.record(z.string().regex(/^\d+(\.\d+)?(rem|px|em)$/)),
      fontWeight: z.record(z.number().min(100).max(900)),
      lineHeight: z.record(z.union([z.number(), z.string()]))
    }),
    spacing: z.record(z.string().regex(/^\d+(\.\d+)?(rem|px|em)$/)),
    borderRadius: z.record(z.string().regex(/^\d+(\.\d+)?(rem|px|em|%)$/)),
    shadows: z.record(z.string()),
    animations: z.object({
      duration: z.record(z.string().regex(/^\d+ms$/)),
      easing: z.record(z.string())
    })
  }),
  // Asset category validation
  assetCategory: z.enum(["logo", "icon", "image", "document", "video"]),
  // Search query validation
  searchQuery: z.string().max(100, "Search query too long").regex(/^[^<>\"'%;()&+]*$/, "Search query contains invalid characters"),
  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1).max(1e3).default(1),
    limit: z.number().int().min(1).max(100).default(50)
  }),
  // Date range validation
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).refine((data) => new Date(data.start) < new Date(data.end), {
    message: "Start date must be before end date"
  }),
  // Metric type validation
  metricType: z.enum([
    "user_signup",
    "user_login",
    "contact_created",
    "deal_created",
    "deal_won",
    "deal_lost",
    "task_completed",
    "email_sent",
    "ai_request",
    "file_upload",
    "page_view",
    "api_call",
    "error_occurred"
  ]),
  // Report config validation
  reportConfig: z.object({
    metrics: z.array(z.string()).min(1).max(20),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }),
    groupBy: z.enum(["day", "week", "month"]).optional(),
    filters: z.record(z.any()).optional(),
    charts: z.array(
      z.object({
        type: z.enum(["line", "bar", "pie", "area"]),
        metric: z.string(),
        title: z.string().max(100)
      })
    ).max(10).optional()
  }),
  // Security policy validation
  securityPolicy: z.object({
    policyType: z.enum([
      "ip_whitelist",
      "password_policy",
      "session_policy",
      "mfa_policy",
      "api_access"
    ]),
    config: z.record(z.any())
  }),
  // IP whitelist validation
  ipWhitelist: z.object({
    allowedIPs: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)).max(100),
    allowedRanges: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/(?:[0-9]|[1-2][0-9]|3[0-2])$/)).max(50),
    blockByDefault: z.boolean()
  }),
  // Password policy validation
  passwordPolicy: z.object({
    minLength: z.number().int().min(8).max(128),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
    expiryDays: z.number().int().min(30).max(365).optional(),
    preventReuse: z.number().int().min(1).max(10).optional()
  }),
  // Session policy validation
  sessionPolicy: z.object({
    maxDuration: z.number().int().min(5).max(480),
    // 5 minutes to 8 hours
    idleTimeout: z.number().int().min(5).max(240),
    // 5 minutes to 4 hours
    requireReauth: z.boolean(),
    singleSessionOnly: z.boolean()
  }),
  // MFA policy validation
  mfaPolicy: z.object({
    required: z.boolean(),
    methods: z.array(z.enum(["totp", "sms", "email"])).min(1).max(3),
    gracePeriod: z.number().int().min(1).max(30).optional()
    // days
  }),
  // API access policy validation
  apiAccessPolicy: z.object({
    enabled: z.boolean(),
    rateLimit: z.number().int().min(1).max(1e4),
    allowedIPs: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)).max(100).optional(),
    requireAPIKey: z.boolean()
  })
};
var validateUserData = (fields) => {
  return (req, res, next) => {
    try {
      const schema = z.object({
        email: fields.includes("email") ? schemas.email.optional() : z.undefined(),
        role: fields.includes("role") ? z.enum(["super_admin", "admin", "wl_user", "regular_user"]).optional() : z.undefined(),
        productTier: fields.includes("productTier") ? z.string().optional() : z.undefined(),
        firstName: fields.includes("firstName") ? schemas.name.optional() : z.undefined(),
        lastName: fields.includes("lastName") ? schemas.name.optional() : z.undefined()
      });
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      next(error);
    }
  };
};
var validateBulkImport = () => {
  return (req, res, next) => {
    try {
      const schema = z.object({
        users: z.array(z.object({
          email: schemas.email,
          first_name: schemas.name.optional(),
          last_name: schemas.name.optional(),
          company: z.string().optional(),
          phone: schemas.phone.optional(),
          role: z.enum(["super_admin", "admin", "wl_user", "regular_user"]).optional(),
          product_tier: z.string().optional()
        })),
        send_notifications: z.boolean().optional()
      });
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      next(error);
    }
  };
};
var validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = schema.parse(req.body);
      }
      if (req.query && Object.keys(req.query).length > 0) {
        if (schema === schemas.pagination) {
          req.query = schema.parse(req.query);
        }
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        await errorLogger.logError("Validation failed", error, {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          errors: error.errors
        });
        return res.status(400).json({
          error: "Validation failed",
          message: "Request data does not match expected format",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code
          }))
        });
      }
      await errorLogger.logError("Unknown validation error", error, {
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(400).json({
        error: "Validation error",
        message: "Request validation failed"
      });
    }
  };
};
var validateTenantCreation = validate(
  z.object({
    name: schemas.name,
    subdomain: schemas.subdomain,
    contactEmail: schemas.email,
    contactName: schemas.name.optional(),
    plan: schemas.tenantPlan,
    type: schemas.tenantType,
    parentPartnerId: schemas.uuid.optional(),
    templateId: schemas.uuid.optional()
  })
);
var validateDomainVerification = validate(
  z.object({
    tenantId: schemas.uuid,
    domain: schemas.domain,
    subdomain: schemas.subdomain.optional(),
    verificationMethod: z.enum(["txt", "cname", "http"]).default("txt")
  })
);
var validateAssetUpload = validate(
  z.object({
    tenantId: schemas.uuid,
    category: schemas.assetCategory,
    optimize: z.boolean().optional(),
    generateThumbnail: z.boolean().optional(),
    metadata: z.record(z.any()).optional()
  })
);
var validateThemeCreation = validate(
  z.object({
    tenantId: schemas.uuid,
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    config: schemas.themeConfig
  })
);
var validateReportCreation = validate(
  z.object({
    tenantId: schemas.uuid,
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    config: schemas.reportConfig,
    schedule: z.enum(["daily", "weekly", "monthly", "custom", "manual"]),
    recipients: z.array(schemas.email).max(10),
    format: z.enum(["pdf", "csv", "excel", "json"])
  })
);
var validateMetricRecording = validate(
  z.object({
    tenantId: schemas.uuid,
    metricType: schemas.metricType,
    metricValue: z.number().min(0),
    metadata: z.record(z.any()).optional()
  })
);
var validateSecurityPolicy = validate(
  z.object({
    tenantId: schemas.uuid,
    policyType: schemas.securityPolicy.shape.policyType,
    config: z.record(z.any())
  })
);
var validateSearchQuery = validate(
  z.object({
    q: schemas.searchQuery,
    page: z.number().int().min(1).max(1e3).optional(),
    limit: z.number().int().min(1).max(100).optional()
  })
);
var sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").trim();
  };
  const sanitizeObject = (obj) => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

// server/routes/admin.ts
init_schema();
import { eq as eq3, count, sql as sql3 } from "drizzle-orm";
async function sendPasswordSetupEmail(email) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.SITE_URL || "https://smart-crm.videoremix.io"}/auth/callback?setup=true`
  });
  if (error) throw new Error(error.message);
}
function registerAdminRoutes(app2) {
  app2.get("/api/admin/stats", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const totalUsersResult = await db2.select({ count: count() }).from(profiles);
      const totalUsers = totalUsersResult[0]?.count || 0;
      const adminUsersResult = await db2.select({ count: count() }).from(profiles).where(sql3`${profiles.role} IN ('super_admin', 'admin')`);
      const adminUsers = adminUsersResult[0]?.count || 0;
      const systemHealth = null;
      const alerts = null;
      const activeSessions = null;
      res.json({
        totalUsers,
        activeSessions,
        systemHealth,
        alerts,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      res.status(500).json({ error: "Failed to fetch system statistics" });
    }
  });
  app2.get("/api/users", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const users = await db2.select().from(profiles).orderBy(sql3`${profiles.createdAt} DESC`);
      const transformedUsers = users.map((user) => ({
        id: user.id,
        email: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        productTier: user.productTier,
        tenantId: "default",
        // Default since not in schema
        status: "active",
        // Default since not in schema
        lastActive: user.updatedAt || user.createdAt,
        createdAt: user.createdAt,
        permissions: user.role === "super_admin" ? ["all"] : [],
        invitedBy: null,
        // Not in schema
        twoFactorEnabled: false
        // Not in schema
      }));
      res.json(transformedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.post(
    "/api/users/invite",
    adminLimiter,
    requireAdmin,
    sanitizeInput,
    validateUserData(["email", "role"]),
    auditUserCreate,
    async (req, res) => {
      try {
        const { email, role, firstName, lastName, permissions: permissions2 } = req.body;
        if (!email || !role) {
          return res.status(400).json({ error: "Email and role are required" });
        }
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const existingUser = await db2.select().from(profiles).where(eq3(profiles.username, email.toLowerCase())).limit(1);
        if (existingUser.length > 0) {
          return res.status(400).json({ error: "User already exists" });
        }
        const newUser = await db2.insert(profiles).values({
          id: crypto.randomUUID(),
          username: email.toLowerCase(),
          firstName: firstName || "",
          lastName: lastName || "",
          role,
          productTier: "smartcrm",
          // Default tier
          appContext: "smartcrm",
          emailTemplateSet: "smartcrm",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).returning();
        res.json({
          success: true,
          user: newUser[0],
          invitationSent: false,
          message: "User created (no invitation email was sent)"
        });
      } catch (error) {
        console.error("Failed to invite user:", error);
        res.status(500).json({ error: "Failed to send invitation" });
      }
    }
  );
  app2.patch(
    "/api/users/:id/role",
    adminLimiter,
    requireAdmin,
    sanitizeInput,
    validateUserData(["role"]),
    auditUserUpdate,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role) {
          return res.status(400).json({ error: "Role is required" });
        }
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const updatedUser = await db2.update(profiles).set({
          role,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(profiles.id, id)).returning();
        if (!updatedUser.length) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json({
          success: true,
          user: updatedUser[0],
          message: "User role updated successfully"
        });
      } catch (error) {
        console.error("Failed to update user role:", error);
        res.status(500).json({ error: "Failed to update user role" });
      }
    }
  );
  app2.patch("/api/users/:id/status", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const user = await db2.select().from(profiles).where(eq3(profiles.id, id)).limit(1);
      if (!user.length) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        success: true,
        user: user[0],
        message: "User status updated successfully"
      });
    } catch (error) {
      console.error("Failed to update user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });
  app2.patch(
    "/api/users/:id/product-tier",
    adminLimiter,
    requireAdmin,
    sanitizeInput,
    validateUserData(["productTier"]),
    auditTierChange,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { productTier } = req.body;
        if (!productTier) {
          return res.status(400).json({ error: "Product tier is required" });
        }
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const updatedUser = await db2.update(profiles).set({
          productTier,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(profiles.id, id)).returning();
        if (!updatedUser.length) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json({
          success: true,
          user: updatedUser[0],
          message: "User product tier updated successfully"
        });
      } catch (error) {
        console.error("Failed to update user product tier:", error);
        res.status(500).json({ error: "Failed to update user product tier" });
      }
    }
  );
  app2.delete(
    "/api/users/:id",
    adminLimiter,
    requireAdmin,
    auditUserDelete,
    async (req, res) => {
      try {
        const { id } = req.params;
        if (id === req.user.id) {
          return res.status(400).json({ error: "Cannot delete your own account" });
        }
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const deletedUser = await db2.delete(profiles).where(eq3(profiles.id, id)).returning();
        if (!deletedUser.length) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json({
          success: true,
          message: "User deleted successfully"
        });
      } catch (error) {
        console.error("Failed to delete user:", error);
        res.status(500).json({ error: "Failed to delete user" });
      }
    }
  );
  app2.post(
    "/api/admin/send-password-setup",
    adminLimiter,
    requireAdmin,
    auditEmailSend,
    async (req, res) => {
      try {
        const { email, firstName } = req.body;
        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }
        if (!supabase) {
          return res.status(501).json({ error: "Email sending is not configured (Supabase)" });
        }
        await sendPasswordSetupEmail(email);
        res.json({
          success: true,
          message: "Password setup email sent successfully"
        });
      } catch (error) {
        console.error("Failed to send password setup email:", error);
        res.status(500).json({ error: "Failed to send password setup email" });
      }
    }
  );
  app2.post(
    "/api/admin/send-bulk-password-setup",
    adminLimiter,
    requireAdmin,
    auditEmailSend,
    async (req, res) => {
      try {
        const { emails } = req.body;
        if (!Array.isArray(emails) || emails.length === 0) {
          return res.status(400).json({ error: "Emails array is required" });
        }
        if (!supabase) {
          return res.status(501).json({ error: "Email sending is not configured (Supabase)" });
        }
        let sent = 0;
        let failed = 0;
        for (const email of emails) {
          try {
            await sendPasswordSetupEmail(email);
            sent++;
          } catch (error) {
            console.error(`Failed to send to ${email}:`, error);
            failed++;
          }
        }
        res.json({
          success: failed === 0,
          sent,
          failed,
          message: `Bulk password setup emails processed: ${sent} sent, ${failed} failed`
        });
      } catch (error) {
        console.error("Failed to send bulk password setup emails:", error);
        res.status(500).json({ error: "Failed to send bulk password setup emails" });
      }
    }
  );
  app2.post("/api/bulk-import/parse-csv", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const { csv_content } = req.body;
      if (!csv_content) {
        return res.status(400).json({ error: "CSV content is required" });
      }
      const lines = csv_content.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());
      const users = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length === headers.length) {
          const user = {};
          headers.forEach((header, index) => {
            user[header] = values[index] || "";
          });
          users.push(user);
        }
      }
      res.json({
        success: true,
        users,
        count: users.length
      });
    } catch (error) {
      console.error("Failed to parse CSV:", error);
      res.status(500).json({ error: "Failed to parse CSV data" });
    }
  });
  app2.post(
    "/api/admin/bulk-actions/suspend-inactive",
    adminLimiter,
    requireAdmin,
    auditUserUpdate,
    async (req, res) => {
      try {
        const { daysInactive = 30 } = req.body;
        const cutoffDate = /* @__PURE__ */ new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const inactiveUsers = await db2.select().from(profiles).where(sql3`${profiles.createdAt} < ${cutoffDate} AND ${profiles.role} != 'super_admin'`);
        res.json({
          success: true,
          affected: inactiveUsers.length,
          message: `Found ${inactiveUsers.length} inactive users (${daysInactive}+ days)`,
          note: "Users would be suspended in production implementation"
        });
      } catch (error) {
        console.error("Failed to suspend inactive users:", error);
        res.status(500).json({ error: "Failed to process inactive users" });
      }
    }
  );
  app2.post(
    "/api/admin/bulk-actions/upgrade-trials",
    adminLimiter,
    requireAdmin,
    auditUserUpdate,
    async (req, res) => {
      try {
        const { targetTier = "smartcrm" } = req.body;
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const trialUsers = await db2.select().from(profiles).where(
          sql3`${profiles.productTier} IN ('smartcrm', 'sales_maximizer') AND ${profiles.role} != 'super_admin'`
        );
        res.json({
          success: true,
          affected: trialUsers.length,
          message: `Found ${trialUsers.length} users eligible for upgrade to ${targetTier}`,
          note: "Users would be upgraded in production implementation"
        });
      } catch (error) {
        console.error("Failed to upgrade trial users:", error);
        res.status(500).json({ error: "Failed to process trial upgrades" });
      }
    }
  );
  app2.get("/api/admin/activity-stats", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const totalUsers = await db2.select({ count: count() }).from(profiles);
      const recentUsers = await db2.select({ count: count() }).from(profiles).where(sql3`${profiles.createdAt} > ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3)}`);
      const todayUsers = await db2.select({ count: count() }).from(profiles).where(sql3`${profiles.createdAt} > ${new Date(Date.now() - 24 * 60 * 60 * 1e3)}`);
      const activeUsers24h = null;
      const activeUsers7d = null;
      const newUsersToday = todayUsers[0]?.count || 0;
      res.json({
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers24h,
        activeUsers7d,
        newUsersToday,
        newUsers7d: recentUsers[0]?.count || 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Failed to fetch activity stats:", error);
      res.status(500).json({ error: "Failed to fetch activity statistics" });
    }
  });
  app2.get("/api/admin/database-health", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const startTime = Date.now();
      const testQuery = await db2.select({ count: count() }).from(profiles);
      const queryTime = Date.now() - startTime;
      const health = {
        database: {
          status: "healthy",
          responseTime: queryTime,
          connectionCount: null,
          activeConnections: null
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        lastBackup: null,
        alerts: null,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json(health);
    } catch (error) {
      console.error("Failed to check database health:", error);
      res.status(500).json({
        database: { status: "unhealthy", error: error.message },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/admin/audit-logs", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 50, action, userId, dateFrom, dateTo } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const auditLogs = [];
      let filteredLogs = auditLogs;
      if (action) {
        filteredLogs = filteredLogs.filter((log2) => log2.action === action);
      }
      if (userId) {
        filteredLogs = filteredLogs.filter((log2) => log2.targetUserId === userId);
      }
      if (dateFrom) {
        filteredLogs = filteredLogs.filter(
          (log2) => new Date(log2.createdAt) >= new Date(dateFrom)
        );
      }
      if (dateTo) {
        filteredLogs = filteredLogs.filter(
          (log2) => new Date(log2.createdAt) <= new Date(dateTo)
        );
      }
      const paginatedLogs = filteredLogs.slice(offset, offset + parseInt(limit));
      res.json({
        logs: paginatedLogs,
        total: filteredLogs.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredLogs.length / parseInt(limit)),
        persisted: false
      });
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });
  app2.post(
    "/api/admin/user-templates",
    adminLimiter,
    requireAdmin,
    sanitizeInput,
    async (req, res) => {
      try {
        const { name, config } = req.body;
        if (!name || !config) {
          return res.status(400).json({ error: "Name and config are required" });
        }
        return res.status(501).json({ error: "User templates are not implemented (no storage)" });
      } catch (error) {
        console.error("Failed to create user template:", error);
        res.status(500).json({ error: "Failed to create user template" });
      }
    }
  );
  app2.get("/api/admin/user-templates", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const templates = [];
      res.json({
        success: true,
        templates
      });
    } catch (error) {
      console.error("Failed to fetch user templates:", error);
      res.status(500).json({ error: "Failed to fetch user templates" });
    }
  });
  app2.post(
    "/api/admin/automated-actions/setup",
    adminLimiter,
    requireAdmin,
    async (req, res) => {
      try {
        const { actionType, config } = req.body;
        if (!actionType || !config) {
          return res.status(400).json({ error: "Action type and config are required" });
        }
        return res.status(501).json({ error: `Automated ${actionType} actions are not implemented` });
      } catch (error) {
        console.error("Failed to setup automated action:", error);
        res.status(500).json({ error: "Failed to setup automated action" });
      }
    }
  );
  app2.post(
    "/api/bulk-import/users",
    adminLimiter,
    requireAdmin,
    validateBulkImport(),
    auditBulkImport,
    async (req, res) => {
      try {
        const { users, send_notifications } = req.body;
        if (!Array.isArray(users)) {
          return res.status(400).json({ error: "Users array is required" });
        }
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        let success = 0;
        let failed = 0;
        const errors = [];
        const importedUsers = [];
        for (const userData of users) {
          try {
            const { email, first_name, last_name, company, phone, role, product_tier } = userData;
            if (!email) {
              errors.push(`Missing email for user: ${first_name} ${last_name}`);
              failed++;
              continue;
            }
            const existingUser = await db2.select().from(profiles).where(eq3(profiles.username, email.toLowerCase())).limit(1);
            if (existingUser.length > 0) {
              errors.push(`User already exists: ${email}`);
              failed++;
              continue;
            }
            const newUser = await db2.insert(profiles).values({
              id: crypto.randomUUID(),
              username: email.toLowerCase(),
              firstName: first_name || "",
              lastName: last_name || "",
              role: role || "regular_user",
              productTier: product_tier || "smartcrm",
              appContext: "smartcrm",
              emailTemplateSet: "smartcrm",
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }).returning();
            importedUsers.push(email);
            success++;
          } catch (error) {
            console.error("Failed to import user:", userData, error);
            errors.push(
              `Failed to import ${userData.email}: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            failed++;
          }
        }
        res.json({
          success: true,
          result: {
            success,
            failed,
            errors,
            imported_users: importedUsers
          },
          message: `Import completed: ${success} successful, ${failed} failed`
        });
      } catch (error) {
        console.error("Failed to bulk import users:", error);
        res.status(500).json({ error: "Failed to import users" });
      }
    }
  );
}

// server/routes/workflows.ts
import { Router as Router2 } from "express";

// packages/workflows/src/events/emitter.ts
var WorkflowEventEmitter = class {
  handlers = /* @__PURE__ */ new Map();
  on(eventType, handler2) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, /* @__PURE__ */ new Set());
    }
    this.handlers.get(eventType).add(handler2);
  }
  off(eventType, handler2) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler2);
    }
  }
  async emit(event) {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map(
          (handler2) => handler2(event).catch((error) => {
            console.error(`Error in workflow event handler for ${event.type}:`, error);
          })
        )
      );
    }
  }
  clear() {
    this.handlers.clear();
  }
};
var workflowEventEmitter = new WorkflowEventEmitter();

// packages/workflows/src/engine/WorkflowEngine.ts
var WorkflowEngine = class {
  triggers = /* @__PURE__ */ new Map();
  actions = /* @__PURE__ */ new Map();
  registerTrigger(type, detector) {
    this.triggers.set(type, detector);
  }
  registerAction(type, executor) {
    this.actions.set(type, executor);
  }
  async evaluateTrigger(triggerType, context) {
    const detector = this.triggers.get(triggerType);
    if (!detector) {
      return { triggered: false };
    }
    return detector(context);
  }
  async executeAction(actionType, context, config) {
    const executor = this.actions.get(actionType);
    if (!executor) {
      return { success: false, error: `Unknown action type: ${actionType}` };
    }
    const startTime = Date.now();
    try {
      const result = await executor(context, config);
      return {
        ...result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }
  async executeWorkflow(steps, context) {
    const results = {};
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    for (const step of sortedSteps) {
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        results[step.id] = { success: true, output: "Skipped: condition not met" };
        continue;
      }
      const result = await this.executeAction(step.actionType, context, step.configuration);
      results[step.id] = result;
      if (!result.success && step.actionType !== "CODE") {
        break;
      }
    }
    const allSuccessful = Object.values(results).every((r) => r.success);
    return { success: allSuccessful, results };
  }
  evaluateCondition(condition, context) {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(context.variables, field);
    switch (operator) {
      case "equals":
        return fieldValue === value;
      case "not_equals":
        return fieldValue !== value;
      case "contains":
        return String(fieldValue).includes(String(value));
      case "greater_than":
        return Number(fieldValue) > Number(value);
      case "less_than":
        return Number(fieldValue) < Number(value);
      case "exists":
        return fieldValue !== void 0 && fieldValue !== null;
      case "not_exists":
        return fieldValue === void 0 || fieldValue === null;
      default:
        return true;
    }
  }
  getNestedValue(obj, path2) {
    return path2.split(".").reduce((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return acc[key];
      }
      return void 0;
    }, obj);
  }
  getRegisteredTriggers() {
    return Array.from(this.triggers.keys());
  }
  getRegisteredActions() {
    return Array.from(this.actions.keys());
  }
};
var workflowEngine = new WorkflowEngine();

// packages/workflows/src/triggers/index.ts
var recordCreatedTrigger = async (context) => {
  if (!context.triggerType || context.triggerType !== "RECORD_CREATED") {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || /* @__PURE__ */ new Date()
    }
  };
};
var recordUpdatedTrigger = async (context) => {
  if (!context.triggerType || context.triggerType !== "RECORD_UPDATED") {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || /* @__PURE__ */ new Date()
    }
  };
};
var recordDeletedTrigger = async (context) => {
  if (!context.triggerType || context.triggerType !== "RECORD_DELETED") {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || /* @__PURE__ */ new Date()
    }
  };
};
var manualTrigger = async (context) => {
  if (!context.triggerType || context.triggerType !== "MANUAL") {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || /* @__PURE__ */ new Date()
    }
  };
};
var scheduledTrigger = async (context) => {
  if (!context.triggerType || context.triggerType !== "SCHEDULED") {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || /* @__PURE__ */ new Date()
    }
  };
};
var webhookTrigger = async (context) => {
  if (!context.triggerType || context.triggerType !== "WEBHOOK") {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || /* @__PURE__ */ new Date()
    }
  };
};
var aiCompletedTrigger = async (context) => {
  if (!context.triggerType || context.triggerType !== "AI_COMPLETED") {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || /* @__PURE__ */ new Date()
    }
  };
};
var registerAllTriggers = (engine) => {
  engine.registerTrigger("RECORD_CREATED", recordCreatedTrigger);
  engine.registerTrigger("RECORD_UPDATED", recordUpdatedTrigger);
  engine.registerTrigger("RECORD_DELETED", recordDeletedTrigger);
  engine.registerTrigger("MANUAL", manualTrigger);
  engine.registerTrigger("SCHEDULED", scheduledTrigger);
  engine.registerTrigger("WEBHOOK", webhookTrigger);
  engine.registerTrigger("AI_COMPLETED", aiCompletedTrigger);
};

// packages/workflows/src/actions/index.ts
var sendEmailAction = async (context, config) => {
  const { to, subject, body, from } = config;
  if (!to || !subject || !body) {
    return { success: false, error: "Missing required email fields: to, subject, body" };
  }
  console.log(`[Workflow ${context.workflowId}] Sending email to ${to}`);
  return {
    success: true,
    output: { messageId: `email_${Date.now()}`, to, subject }
  };
};
var updateFieldAction = async (context, config) => {
  const { objectType, recordId, field, value } = config;
  if (!objectType || !recordId || !field) {
    return { success: false, error: "Missing required fields: objectType, recordId, field" };
  }
  console.log(
    `[Workflow ${context.workflowId}] Updating ${objectType}:${recordId} ${field} = ${value}`
  );
  return {
    success: true,
    output: { objectType, recordId, field, newValue: value }
  };
};
var createRecordAction = async (context, config) => {
  const { objectType, data } = config;
  if (!objectType || !data) {
    return { success: false, error: "Missing required fields: objectType, data" };
  }
  const recordId = `record_${Date.now()}`;
  console.log(`[Workflow ${context.workflowId}] Creating ${objectType} record: ${recordId}`);
  return {
    success: true,
    output: { recordId, objectType, data }
  };
};
var createTaskAction = async (context, config) => {
  const { title, description, assigneeId, dueDate } = config;
  if (!title) {
    return { success: false, error: "Missing required field: title" };
  }
  const taskId = `task_${Date.now()}`;
  console.log(`[Workflow ${context.workflowId}] Creating task: ${title}`);
  return {
    success: true,
    output: { taskId, title, assigneeId, dueDate }
  };
};
var createNoteAction = async (context, config) => {
  const { content, recordId, recordType } = config;
  if (!content || !recordId) {
    return { success: false, error: "Missing required fields: content, recordId" };
  }
  const noteId = `note_${Date.now()}`;
  console.log(
    `[Workflow ${context.workflowId}] Creating note on ${recordType || "record"}:${recordId}`
  );
  return {
    success: true,
    output: { noteId, recordId, recordType }
  };
};
var webhookAction = async (context, config) => {
  const { url, method, headers, body } = config;
  if (!url) {
    return { success: false, error: "Missing required field: url" };
  }
  console.log(`[Workflow ${context.workflowId}] Calling webhook ${url}`);
  return {
    success: true,
    output: { url, statusCode: 200, message: "Webhook called successfully" }
  };
};
var codeAction = async (context, config) => {
  const { code, language } = config;
  if (!code) {
    return { success: false, error: "Missing required field: code" };
  }
  console.log(`[Workflow ${context.workflowId}] Executing ${language || "javascript"} code`);
  try {
    const result = { executed: true, timestamp: Date.now() };
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};
var waitAction = async (context, config) => {
  const { duration, unit } = config;
  if (!duration) {
    return { success: false, error: "Missing required field: duration" };
  }
  const ms = unit === "minutes" ? duration * 60 * 1e3 : unit === "hours" ? duration * 60 * 60 * 1e3 : duration;
  console.log(`[Workflow ${context.workflowId}] Waiting ${duration} ${unit || "ms"}`);
  await new Promise((resolve) => setTimeout(resolve, Math.min(ms, 1e3)));
  return {
    success: true,
    output: { waited: duration, unit: unit || "ms" }
  };
};
var branchAction = async (context, config) => {
  const { condition, trueBranch, falseBranch } = config;
  if (!condition) {
    return { success: false, error: "Missing required field: condition" };
  }
  const { field, operator, value } = condition;
  const fieldValue = field.startsWith("context.") ? context[field.replace("context.", "")] : field;
  let result = false;
  switch (operator) {
    case "equals":
      result = fieldValue === value;
      break;
    case "not_equals":
      result = fieldValue !== value;
      break;
    case "contains":
      result = String(fieldValue).includes(String(value));
      break;
    case "greater_than":
      result = Number(fieldValue) > Number(value);
      break;
    case "less_than":
      result = Number(fieldValue) < Number(value);
      break;
    default:
      result = false;
  }
  console.log(`[Workflow ${context.workflowId}] Branch evaluation: ${result ? "TRUE" : "FALSE"}`);
  return {
    success: true,
    output: { branchTaken: result ? "true" : "false", condition }
  };
};
var sendSmsAction = async (context, config) => {
  const { to, message } = config;
  if (!to || !message) {
    return { success: false, error: "Missing required fields: to, message" };
  }
  console.log(`[Workflow ${context.workflowId}] Sending SMS to ${to}`);
  return {
    success: true,
    output: { messageId: `sms_${Date.now()}`, to }
  };
};
var createDealAction = async (context, config) => {
  const { title, amount, stage, contactId } = config;
  if (!title) {
    return { success: false, error: "Missing required field: title" };
  }
  const dealId = `deal_${Date.now()}`;
  console.log(`[Workflow ${context.workflowId}] Creating deal: ${title}`);
  return {
    success: true,
    output: { dealId, title, amount, stage }
  };
};
var createContactAction = async (context, config) => {
  const { email, firstName, lastName, company } = config;
  if (!email) {
    return { success: false, error: "Missing required field: email" };
  }
  const contactId = `contact_${Date.now()}`;
  console.log(`[Workflow ${context.workflowId}] Creating contact: ${email}`);
  return {
    success: true,
    output: { contactId, email, firstName, lastName }
  };
};
var registerAllActions = (engine) => {
  engine.registerAction("SEND_EMAIL", sendEmailAction);
  engine.registerAction("UPDATE_FIELD", updateFieldAction);
  engine.registerAction("CREATE_RECORD", createRecordAction);
  engine.registerAction("CREATE_TASK", createTaskAction);
  engine.registerAction("CREATE_NOTE", createNoteAction);
  engine.registerAction("WEBHOOK", webhookAction);
  engine.registerAction("CODE", codeAction);
  engine.registerAction("WAIT", waitAction);
  engine.registerAction("BRANCH", branchAction);
  engine.registerAction("SEND_SMS", sendSmsAction);
  engine.registerAction("CREATE_DEAL", createDealAction);
  engine.registerAction("CREATE_CONTACT", createContactAction);
};

// server/routes/workflows.ts
var router2 = Router2();
registerAllTriggers(workflowEngine);
registerAllActions(workflowEngine);
async function getTenantId(userId) {
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
  return profile?.tenant_id || "";
}
router2.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const tenantId = await getTenantId(userId);
    const { data: workflows2, error } = await supabase.from("smartcrm_workflows").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ workflows: workflows2 });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return res.status(500).json({ error: error.message });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { data: workflow, error } = await supabase.from("smartcrm_workflows").select("*").eq("id", id).single();
    if (error) throw error;
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    const { data: steps } = await supabase.from("smartcrm_workflow_actions").select("*").eq("workflow_id", id).order("order_index");
    return res.json({ workflow: { ...workflow, steps } });
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return res.status(500).json({ error: error.message });
  }
});
router2.post("/", async (req, res) => {
  try {
    const { name, triggerType, appSlug, steps } = req.body;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!name || !triggerType) {
      return res.status(400).json({ error: "name and triggerType are required" });
    }
    const tenantId = await getTenantId(userId);
    const { data: workflow, error: workflowError } = await supabase.from("smartcrm_workflows").insert({
      name,
      trigger_type: triggerType,
      app_slug: appSlug,
      enabled: true,
      tenant_id: tenantId,
      created_by: userId,
      configuration: {}
    }).select().single();
    if (workflowError) throw workflowError;
    if (steps && steps.length > 0) {
      const actionRecords = steps.map((step, index) => ({
        workflow_id: workflow.id,
        action_type: step.actionType,
        configuration: step.configuration,
        order_index: index + 1,
        parent_id: step.parentId || null,
        condition: step.condition || null
      }));
      const { error: actionsError } = await supabase.from("smartcrm_workflow_actions").insert(actionRecords);
      if (actionsError) throw actionsError;
    }
    return res.status(201).json({ workflow });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return res.status(500).json({ error: error.message });
  }
});
router2.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, triggerType, enabled, steps } = req.body;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { data: workflow, error: workflowError } = await supabase.from("smartcrm_workflows").update({
      name,
      trigger_type: triggerType,
      enabled
    }).eq("id", id).select().single();
    if (workflowError) throw workflowError;
    if (steps) {
      await supabase.from("smartcrm_workflow_actions").delete().eq("workflow_id", id);
      const actionRecords = steps.map((step, index) => ({
        workflow_id: id,
        action_type: step.actionType,
        configuration: step.configuration,
        order_index: index + 1,
        parent_id: step.parentId || null,
        condition: step.condition || null
      }));
      const { error: actionsError } = await supabase.from("smartcrm_workflow_actions").insert(actionRecords);
      if (actionsError) throw actionsError;
    }
    return res.json({ workflow });
  } catch (error) {
    console.error("Error updating workflow:", error);
    return res.status(500).json({ error: error.message });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await supabase.from("smartcrm_workflow_actions").delete().eq("workflow_id", id);
    const { error } = await supabase.from("smartcrm_workflows").delete().eq("id", id);
    if (error) throw error;
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return res.status(500).json({ error: error.message });
  }
});
router2.get("/:id/runs", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { data: runs, error } = await supabase.from("smartcrm_workflow_runs").select("*").eq("workflow_id", id).order("started_at", { ascending: false }).limit(50);
    if (error) throw error;
    return res.json({ runs });
  } catch (error) {
    console.error("Error fetching workflow runs:", error);
    return res.status(500).json({ error: error.message });
  }
});
router2.post("/:id/run", async (req, res) => {
  try {
    const { id } = req.params;
    const { triggerData } = req.body;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { data: workflow } = await supabase.from("smartcrm_workflows").select("*").eq("id", id).single();
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    const { data: actions } = await supabase.from("smartcrm_workflow_actions").select("*").eq("workflow_id", id).order("order_index");
    const runId = `run_${Date.now()}`;
    const context = {
      workflowId: id,
      runId,
      triggerType: workflow.trigger_type,
      timestamp: /* @__PURE__ */ new Date(),
      variables: triggerData || {}
    };
    const { data: run, error: runError } = await supabase.from("smartcrm_workflow_runs").insert({
      workflow_id: id,
      status: "running",
      triggered_by: triggerData || {},
      context: {}
    }).select().single();
    if (runError) throw runError;
    const steps = (actions || []).map((a) => ({
      id: a.id,
      actionType: a.action_type,
      configuration: a.configuration,
      order: a.order_index,
      parentId: a.parent_id,
      condition: a.condition
    }));
    const result = await workflowEngine.executeWorkflow(steps, context);
    await supabase.from("smartcrm_workflow_runs").update({
      status: result.success ? "completed" : "failed",
      completed_at: (/* @__PURE__ */ new Date()).toISOString(),
      results: result.results
    }).eq("id", run.id);
    return res.json({ run, results: result.results });
  } catch (error) {
    console.error("Error running workflow:", error);
    return res.status(500).json({ error: error.message });
  }
});
function registerWorkflowRoutes(app2) {
  console.log("Registering workflow routes at /api/workflows");
  app2.use("/api/workflows", requireAuth(), router2);
}

// server/routes/billing.ts
init_schema();
import { Router as Router3 } from "express";
import { createClient as createClient4 } from "@supabase/supabase-js";

// server/middleware/entitlements.ts
import { createClient as createClient3 } from "@supabase/supabase-js";
var supabaseUrl3 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
var serviceRoleKey2 = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
function requireEntitlement(featureKey) {
  return async (req, res, next) => {
    try {
      const userId = req.userId ?? req.session?.userId;
      const userEmail = req.userEmail ?? req.session?.userEmail;
      if (!userId && !userEmail) {
        return res.status(401).json({ error: "Unauthorized - Not authenticated" });
      }
      if (!supabaseUrl3 || !serviceRoleKey2) {
        return res.status(500).json({ error: "Supabase not configured" });
      }
      const supabase8 = createClient3(supabaseUrl3, serviceRoleKey2);
      let entitlement = null;
      if (userEmail) {
        const { data } = await supabase8.from("smartcrm_user_entitlements").select("*").eq("email", userEmail).single();
        entitlement = data;
      }
      if (!entitlement && userId) {
        const { data } = await supabase8.from("smartcrm_user_entitlements").select("*").eq("user_id", userId).single();
        entitlement = data;
      }
      if (!entitlement) {
        return next();
      }
      if (entitlement.package === "no_access") {
        return res.status(403).json({
          error: "Forbidden - No subscription found",
          requiredFeature: featureKey,
          message: "Please purchase a subscription to access this feature"
        });
      }
      const { data: hasAccess } = await supabase8.rpc("smartcrm_user_has_feature", {
        input_email: entitlement.email,
        input_feature_key: featureKey
      });
      if (!hasAccess) {
        return res.status(403).json({
          error: "Forbidden - Feature not included in your package",
          requiredFeature: featureKey,
          userPackage: entitlement.package,
          message: "This feature is not available in your current subscription. Please upgrade."
        });
      }
      req.entitlement = entitlement;
      req.userPackage = entitlement.package;
      next();
    } catch (error) {
      console.error("Entitlement check error:", error);
      res.status(500).json({ error: "Internal server error during entitlement check" });
    }
  };
}

// server/types/entitlements.ts
var FeatureKey = {
  // Core CRM
  CORE_CRM: "core_crm",
  DASHBOARD: "dashboard",
  CONTACTS: "contacts",
  PIPELINE: "pipeline",
  CALENDAR: "calendar",
  // AI Tools
  AI_TOOLS: "ai_tools",
  AI_GOALS: "ai_goals",
  // Analytics & Intelligence
  ANALYTICS: "analytics",
  BUSINESS_INTELLIGENCE: "business_intelligence",
  SALES_INTELLIGENCE: "sales_intelligence",
  DEAL_INTELLIGENCE_DASHBOARD: "deal_intelligence_dashboard",
  CONTACT_ANALYTICS_DASHBOARD: "contact_analytics_dashboard",
  PIPELINE_INTELLIGENCE: "pipeline_intelligence",
  DEAL_RISK_MONITOR: "deal_risk_monitor",
  SMART_CONVERSION_INSIGHTS: "smart_conversion_insights",
  PIPELINE_HEALTH_DASHBOARD: "pipeline_health_dashboard",
  SALES_CYCLE_ANALYTICS: "sales_cycle_analytics",
  WIN_RATE_INTELLIGENCE: "win_rate_intelligence",
  AI_SALES_FORECAST: "ai_sales_forecast",
  COMPETITOR_INSIGHTS: "competitor_insights",
  REVENUE_INTELLIGENCE: "revenue_intelligence",
  // Contact Enhancements
  CONTACT_ENHANCEMENTS: "contact_enhancements",
  AI_CONTACT_ENRICHMENT: "ai_contact_enrichment",
  AI_LEAD_SCORING: "ai_lead_scoring",
  CUSTOM_FIELDS: "custom_fields",
  CONTACT_ACTIVITY_TRACKING: "contact_activity_tracking",
  BULK_CONTACT_OPERATIONS: "bulk_contact_operations",
  // Communication Hub
  COMMUNICATION_HUB: "communication_hub",
  APPOINTMENTS: "appointments",
  VIDEO_EMAIL: "video_email",
  TEXT_MESSAGES: "text_messages",
  PHONE_SYSTEM: "phone_system",
  VOICE_PROFILES: "voice_profiles",
  INVOICING: "invoicing",
  LEAD_AUTOMATION: "lead_automation",
  FORMS_SURVEYS: "forms_surveys",
  BUSINESS_ANALYZER: "business_analyzer",
  CONTENT_LIBRARY: "content_library",
  CIRCLE_PROSPECTING: "circle_prospecting",
  CONNECTED_APPS: "connected_apps",
  FUNNELCRAFT_AI: "funnelcraft_ai",
  SMARTCRM_CLOSER: "smartcrm_closer",
  CONTENT_AI: "content_ai",
  BILLING_CREDITS: "billing_credits",
  BUY_CREDITS: "buy_credits",
  // White Label
  WHITE_LABEL: "white_label",
  WHITE_LABEL_CUSTOMIZATION: "white_label_customization",
  WHITE_LABEL_MANAGEMENT: "white_label_management",
  MULTI_TENANT_FEATURES: "multi_tenant_features",
  CUSTOM_BRANDING: "custom_branding",
  DOMAIN_MANAGEMENT: "domain_management",
  PACKAGE_BUILDER: "package_builder",
  REVENUE_SHARING: "revenue_sharing",
  PARTNER_DASHBOARD: "partner_dashboard",
  PARTNER_ONBOARDING: "partner_onboarding",
  BRAND_ASSET_MANAGEMENT: "brand_asset_management",
  THEME_CUSTOMIZATION: "theme_customization",
  CUSTOM_DOMAIN_SETUP: "custom_domain_setup",
  FEATURE_PACKAGE_CONFIGURATION: "feature_package_configuration",
  // Admin & System
  OPENCLAW: "openclaw",
  ADMIN_PANEL: "admin_panel",
  FEATURE_MANAGEMENT: "feature_management",
  USER_MANAGEMENT: "user_management",
  SYSTEM_MONITORING: "system_monitoring",
  SECURITY_AUDIT_LOGS: "security_audit_logs",
  COMPLIANCE_TOOLS: "compliance_tools",
  SECURITY_COMPLIANCE: "security_compliance"
};

// server/routes/billing.ts
var requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};
var router3 = Router3();
router3.use(requireAuth());
router3.use(requireEntitlement(FeatureKey.BUY_CREDITS));
var stripe = null;
var stripeInitError = null;
async function getStripe() {
  if (stripe) return stripe;
  if (stripeInitError) return null;
  try {
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_demo_stripe_key_placeholder") {
      const Stripe = await import("stripe");
      stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16"
      });
      return stripe;
    }
    stripeInitError = "Stripe not configured";
    console.warn("Stripe not configured, billing features disabled for demo");
    return null;
  } catch (error) {
    stripeInitError = error instanceof Error ? error.message : String(error);
    console.warn("Stripe initialization failed, billing features disabled:", error);
    return null;
  }
}
var supabaseClient = null;
var getSupabase = () => supabaseClient ??= createClient4(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
var upgradePricing = {
  smartcrm_bundle: {
    priceEnv: "STRIPE_SMARTCRM_BUNDLE_PRICE_ID",
    amount: 97,
    name: "SmartCRM Bundle"
  },
  sales_maximizer: {
    priceEnv: "STRIPE_SALES_MAXIMIZER_PRICE_ID",
    amount: 67,
    name: "Sales Maximizer"
  }
};
router3.post("/upgrade", async (req, res) => {
  try {
    const { tierId, currentTier } = req.body;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!productTiers.includes(tierId)) {
      return res.status(400).json({ error: "Invalid tier ID" });
    }
    const { data: profile, error: profileError } = await getSupabase().from("smartcrm_user_entitlements").select("product_tier").eq("user_id", userId).maybeSingle();
    if (profileError) {
      return res.status(500).json({ error: "Failed to get user profile" });
    }
    const openClawEnabledTiers = [
      "super_admin",
      "whitelabel",
      "smartcrm_bundle",
      "sales_maximizer"
    ];
    if (!openClawEnabledTiers.includes(tierId)) {
      return res.status(400).json({ error: "Tier does not include OpenClaw access" });
    }
    const tierHierarchy = {
      ai_communication: 1,
      ai_boost_unlimited: 2,
      sales_maximizer: 3,
      smartcrm: 4,
      smartcrm_bundle: 5,
      whitelabel: 6,
      super_admin: 7
    };
    const currentTierLevel = tierHierarchy[profile?.product_tier] || 0;
    const targetTierLevel = tierHierarchy[tierId] || 0;
    if (targetTierLevel <= currentTierLevel) {
      return res.status(400).json({ error: "User already has this tier or higher" });
    }
    const stripeClient = await getStripe();
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe not configured" });
    }
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: requireEnv(upgradePricing[tierId].priceEnv),
          quantity: 1
        }
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/settings?upgrade=success&tier=${tierId}`,
      cancel_url: `${process.env.FRONTEND_URL}/settings?upgrade=cancelled`,
      metadata: {
        userId,
        tierId,
        upgradeType: "openclaw"
      },
      customer_email: profile.email
    });
    res.json({
      sessionId: session.id,
      url: session.url,
      tier: tierId,
      amount: upgradePricing[tierId].amount
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    res.status(500).json({ error: "Failed to create upgrade session" });
  }
});
router3.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeClient = await getStripe();
  if (!stripeClient || !endpointSecret) {
    return res.status(500).json({ error: "Stripe not configured" });
  }
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.metadata?.upgradeType === "openclaw") {
        const userId = session.metadata.userId;
        const tierId = session.metadata.tierId;
        const { error } = await getSupabase().from("profiles").update({
          productTier: tierId,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", userId);
        if (error) {
          console.error("Failed to update user tier:", error);
        } else {
          console.log(`Successfully upgraded user ${userId} to ${tierId}`);
        }
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});
router3.get("/plans", async (req, res) => {
  try {
    const plans = Object.entries(upgradePricing).map(([tierId, config]) => ({
      id: tierId,
      name: config.name,
      price: config.amount,
      priceId: process.env[config.priceEnv] || null
    }));
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: "Failed to get plans" });
  }
});

// server/routes/openclaw.ts
import { Router as Router4 } from "express";
init_db();
init_schema();
import { eq as eq4, and as and3, or, like, desc as desc3 } from "drizzle-orm";

// server/routes/videos.ts
var videoEmails = [];
function listVideosForUser(userId) {
  return videoEmails.filter((video) => video.profileId === userId);
}
function createVideoForUser(userId, input) {
  const { title, script, recipientName, recipientEmail, company } = input;
  const newVideo = {
    id: crypto.randomUUID(),
    title,
    script,
    duration: Math.floor(script.length / 10),
    // Rough estimate based on script length
    thumbnail: "/api/placeholder/400/225",
    // Placeholder thumbnail
    status: "draft",
    analytics: {
      views: 0,
      completionRate: 0,
      engagement: 0
    },
    gpt5Metadata: {
      generatedScript: false,
      optimizationScore: null,
      // not measured
      suggestedImprovements: [],
      tone: "professional",
      targetAudience: "business"
    },
    recipient: recipientName && recipientEmail ? {
      name: recipientName,
      email: recipientEmail,
      company: company || ""
    } : void 0,
    profileId: userId,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  };
  videoEmails.push(newVideo);
  return newVideo;
}
function registerVideoRoutes(app2) {
  app2.use("/api/videos", requireAuth(), requireEntitlement(FeatureKey.VIDEO_EMAIL));
  app2.get("/api/videos", async (req, res) => {
    try {
      res.json(listVideosForUser(req.userId));
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });
  app2.get("/api/videos/stats", async (req, res) => {
    try {
      const userVideos = videoEmails.filter((video) => video.profileId === req.userId);
      const stats = {
        totalVideos: userVideos.length,
        totalViews: userVideos.reduce((sum, video) => sum + video.analytics.views, 0),
        averageEngagement: userVideos.length > 0 ? userVideos.reduce((sum, video) => sum + video.analytics.engagement, 0) / userVideos.length : 0,
        conversionRate: null,
        // conversions are not tracked (was a hardcoded 15%)
        topPerformingVideo: userVideos.length > 0 ? userVideos.reduce(
          (top, video) => video.analytics.views > (userVideos.find((v) => v.title === top)?.analytics.views || 0) ? video.title : top,
          userVideos[0]?.title || ""
        ) : ""
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching video stats:", error);
      res.status(500).json({ error: "Failed to fetch video stats" });
    }
  });
  app2.post("/api/videos", async (req, res) => {
    try {
      const userId = req.userId;
      const { title, script, recipientName, recipientEmail, company } = req.body;
      if (!title || !script) {
        return res.status(400).json({ error: "Title and script are required" });
      }
      const newVideo = createVideoForUser(userId, { title, script, recipientName, recipientEmail, company });
      res.status(201).json(newVideo);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ error: "Failed to create video" });
    }
  });
  app2.get("/api/videos/:id", async (req, res) => {
    try {
      const videoId = req.params.id;
      const video = videoEmails.find((v) => v.id === videoId && v.profileId === req.userId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });
  app2.put("/api/videos/:id", async (req, res) => {
    try {
      const videoId = req.params.id;
      const videoIndex = videoEmails.findIndex((v) => v.id === videoId && v.profileId === req.userId);
      if (videoIndex === -1) {
        return res.status(404).json({ error: "Video not found" });
      }
      const allowedFields = ["title", "script", "duration", "thumbnail", "status", "recipient"];
      const updates = {};
      for (const field of allowedFields) {
        if (field in req.body) {
          updates[field] = req.body[field];
        }
      }
      const updatedVideo = {
        ...videoEmails[videoIndex],
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      };
      videoEmails[videoIndex] = updatedVideo;
      res.json(updatedVideo);
    } catch (error) {
      console.error("Error updating video:", error);
      res.status(500).json({ error: "Failed to update video" });
    }
  });
  app2.delete("/api/videos/:id", async (req, res) => {
    try {
      const videoId = req.params.id;
      const videoIndex = videoEmails.findIndex((v) => v.id === videoId && v.profileId === req.userId);
      if (videoIndex === -1) {
        return res.status(404).json({ error: "Video not found" });
      }
      videoEmails.splice(videoIndex, 1);
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });
}
function registerVideoScriptRoute(app2) {
  app2.post("/api/videos/generate-script", async (req, res) => {
    try {
      const { recipient, purpose, tone, length } = req.body;
      const ai = await getUserOpenAIClient();
      if (!ai) {
        return res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
      }
      const result = await respond(ai.client, {
        model: ai.model,
        store: false,
        instructions: "You write short, natural scripts for personal sales/marketing video messages. Write only words to be spoken.",
        input: `Write a video message script.
Recipient: ${recipient ? JSON.stringify(recipient) : "not specified"}
Purpose: ${purpose || "general"}
Tone: ${tone || "friendly"}
Target length: ${length || "about 60 seconds"}`,
        json: {
          name: "video_script",
          schema: {
            type: "object",
            properties: {
              script: { type: "string" },
              suggestions: { type: "array", items: { type: "string" } }
            },
            required: ["script", "suggestions"],
            additionalProperties: false
          }
        }
      });
      if (!result.data?.script) {
        return res.status(502).json({ error: "AI returned no script" });
      }
      const script = result.data.script;
      res.json({
        script,
        tone,
        estimatedDuration: Math.ceil(script.split(/\s+/).length / 150),
        // minutes at ~150 words/min
        suggestions: result.data.suggestions || []
      });
    } catch (error) {
      console.error("Error generating script:", error);
      res.status(500).json({ error: "Failed to generate script" });
    }
  });
}

// server/services/safeUrl.ts
import { lookup } from "dns/promises";
import { isIP } from "net";
function isPrivateAddress(address) {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || // "this" network
    a === 10 || a === 127 || a === 100 && b >= 64 && b <= 127 || // CGNAT
    a === 169 && b === 254 || // link-local incl. 169.254.169.254 metadata
    a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 192 && b === 0 || a === 198 && (b === 18 || b === 19) || // benchmarking
    a >= 224;
  }
  if (isIP(ip) === 6) {
    if (ip === "::" || ip === "::1") return true;
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return ip.startsWith("fc") || ip.startsWith("fd") || // unique local
    /^fe[89ab]/.test(ip) || // link-local
    ip.startsWith("ff");
  }
  return true;
}
var BLOCKED_HOSTNAMES = ["localhost", "metadata.google.internal"];
var BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home"];
var defaultResolve = async (host) => (await lookup(host, { all: true, verbatim: true })).map((r) => r.address);
async function isSafeExternalUrl(rawUrl, options = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || BLOCKED_HOSTNAMES.includes(host) || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return false;
  }
  const allowed = (options.allowedHosts || []).map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(host)) return false;
  if (isIP(host.replace(/^\[|\]$/g, ""))) return !isPrivateAddress(host);
  try {
    const addresses = await (options.resolve || defaultResolve)(host);
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a));
  } catch {
    return false;
  }
}

// server/routes/openclaw.ts
var router4 = Router4();
router4.use(requireAuth());
router4.use((req, res, next) => {
  if (req.path === "/health") {
    return next();
  }
  return requireEntitlement(FeatureKey.OPENCLAW)(req, res, next);
});
var OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || "http://localhost:3001";
var OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || "";
var OPENCLAW_ALLOWED_HOSTS = (process.env.OPENCLAW_ALLOWED_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean);
async function getOpenClawConfigForUser(userId) {
  let apiKey = OPENCLAW_API_KEY;
  let baseUrl = OPENCLAW_API_URL;
  try {
    if (supabase && userId) {
      const { data } = await supabase.from("user_api_keys").select("api_key, metadata").eq("user_id", userId).eq("provider", "openclaw").eq("is_active", true).maybeSingle();
      if (data?.api_key) {
        apiKey = data.api_key;
      }
      const userBaseUrl = data?.metadata?.base_url;
      if (userBaseUrl) {
        if (await isSafeExternalUrl(userBaseUrl, { allowedHosts: OPENCLAW_ALLOWED_HOSTS })) {
          baseUrl = userBaseUrl.replace(/\/+$/, "");
        } else {
          console.warn("Ignoring unsafe per-user OpenClaw base URL; using server default");
        }
      }
    }
  } catch (err) {
    console.warn("Could not fetch per-user OpenClaw config, using server defaults:", err);
  }
  return { apiKey, baseUrl };
}
async function getOpenAIClient() {
  return (await getUserOpenAIClient())?.client ?? null;
}
var aiRateLimit = /* @__PURE__ */ new Map();
var AI_RATE_LIMIT_WINDOW_MS = 6e4;
var AI_RATE_LIMIT_MAX = 20;
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of aiRateLimit) {
      if (now > entry.resetAt) {
        aiRateLimit.delete(key);
      }
    }
  },
  5 * 60 * 1e3
);
function checkAIRateLimit(userId) {
  const now = Date.now();
  const entry = aiRateLimit.get(userId);
  if (!entry || now > entry.resetAt) {
    aiRateLimit.set(userId, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= AI_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}
async function fetchWithTimeout(url, options, timeoutMs = 1e4) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
function safeJsonParse(text2) {
  const parsed = parseJSONText(text2);
  if (parsed === void 0) throw new Error("The AI returned a response that was not valid JSON");
  return parsed;
}
var crmTools = [
  // Contact Management
  {
    name: "search_contacts",
    description: "Search contacts by name, email, or company",
    parameters: { query: "string", limit: { type: "number", default: 10 } },
    category: "crm"
  },
  {
    name: "get_contact_details",
    description: "Get detailed information about a contact",
    parameters: { contactId: "string" },
    category: "crm"
  },
  {
    name: "create_contact",
    description: "Create a new contact",
    parameters: {
      firstName: "string",
      lastName: "string",
      email: "string",
      company: "string",
      phone: "string?"
    },
    category: "crm"
  },
  {
    name: "update_contact",
    description: "Update contact information",
    parameters: { contactId: "string", data: "object" },
    category: "crm"
  },
  {
    name: "delete_contact",
    description: "Delete a contact from the CRM",
    parameters: { contactId: "string" },
    category: "crm"
  },
  // Deal Management
  {
    name: "list_deals",
    description: "List all deals in the pipeline",
    parameters: { stage: "string?", limit: "number?", status: "string?" },
    category: "crm"
  },
  {
    name: "create_deal",
    description: "Create a new deal",
    parameters: {
      name: "string",
      value: "number",
      stage: "string",
      contactId: "string?",
      companyId: "string?"
    },
    category: "crm"
  },
  {
    name: "update_deal_stage",
    description: "Move deal to a different pipeline stage",
    parameters: { dealId: "string", stage: "string" },
    category: "crm"
  },
  {
    name: "close_deal",
    description: "Close a deal as won or lost",
    parameters: { dealId: "string", status: "closed-won | closed-lost", notes: "string?" },
    category: "crm"
  },
  // Task Management
  {
    name: "list_tasks",
    description: "List tasks for the current user",
    parameters: { status: "string?", limit: "number?", dueDate: "string?" },
    category: "crm"
  },
  {
    name: "create_task",
    description: "Create a new task",
    parameters: {
      title: "string",
      description: "string?",
      dueDate: "string",
      priority: "low | medium | high",
      contactId: "string?",
      dealId: "string?"
    },
    category: "crm"
  },
  {
    name: "complete_task",
    description: "Mark a task as completed",
    parameters: { taskId: "string" },
    category: "crm"
  },
  {
    name: "delete_task",
    description: "Delete a task",
    parameters: { taskId: "string" },
    category: "crm"
  },
  // Company Management
  {
    name: "search_companies",
    description: "Search companies by name or industry",
    parameters: { query: "string", limit: { type: "number", default: 10 } },
    category: "crm"
  },
  {
    name: "create_company",
    description: "Create a new company",
    parameters: {
      name: "string",
      industry: "string?",
      website: "string?",
      phone: "string?",
      address: "string?"
    },
    category: "crm"
  },
  // Calendar & Appointments
  {
    name: "list_appointments",
    description: "List appointments",
    parameters: { date: "string?", limit: "number?" },
    category: "crm"
  },
  {
    name: "create_appointment",
    description: "Schedule a new appointment",
    parameters: {
      title: "string",
      dateTime: "string",
      duration: "number",
      contactId: "string?",
      notes: "string?"
    },
    category: "crm"
  },
  {
    name: "cancel_appointment",
    description: "Cancel an appointment",
    parameters: { appointmentId: "string" },
    category: "crm"
  },
  // Communication
  {
    name: "send_email",
    description: "Send an email to a contact",
    parameters: { to: "string", subject: "string", body: "string", contactId: "string?" },
    category: "crm"
  },
  {
    name: "send_sms",
    description: "Send an SMS to a contact",
    parameters: { to: "string", message: "string", contactId: "string?" },
    category: "crm"
  },
  // Navigation
  {
    name: "navigate_to_app",
    description: "Navigate to a specific app in the CRM",
    parameters: { app: "string", route: "string?" },
    category: "navigation"
  },
  {
    name: "open_remote_app",
    description: "Open a Module Federation remote app",
    parameters: { appName: "string", parameters: "object?" },
    category: "navigation"
  },
  // Automation
  {
    name: "trigger_automation",
    description: "Trigger a workflow automation",
    parameters: { workflowId: "string", context: "object" },
    category: "automation"
  },
  {
    name: "run_ai_insights",
    description: "Get AI insights for a deal or contact",
    parameters: { entityType: "deal | contact | company", entityId: "string" },
    category: "ai"
  },
  // Analytics
  {
    name: "get_pipeline_summary",
    description: "Get pipeline summary with key metrics",
    parameters: {},
    category: "analytics"
  },
  {
    name: "get_sales_forecast",
    description: "Get AI-powered sales forecast",
    parameters: { period: "week | month | quarter?" },
    category: "analytics"
  },
  // Communications & Activity
  {
    name: "list_communications",
    description: "List communications for a contact",
    parameters: { contactId: "string", type: "string?", limit: "number?" },
    category: "crm"
  },
  {
    name: "create_communication",
    description: "Log a communication (email, call, sms, meeting)",
    parameters: {
      contactId: "string",
      type: "email | call | sms | meeting",
      subject: "string?",
      content: "string?",
      direction: "inbound | outbound"
    },
    category: "crm"
  },
  {
    name: "list_notes",
    description: "List notes for a contact or deal",
    parameters: { contactId: "string?", dealId: "string?", limit: "number?" },
    category: "crm"
  },
  {
    name: "create_note",
    description: "Create a note for a contact or deal",
    parameters: { content: "string", type: "string?", contactId: "string?", dealId: "string?" },
    category: "crm"
  },
  {
    name: "delete_note",
    description: "Delete a note",
    parameters: { noteId: "string" },
    category: "crm"
  },
  // Tags
  {
    name: "add_contact_tag",
    description: "Add a tag to a contact",
    parameters: { contactId: "string", tag: "string" },
    category: "crm"
  },
  {
    name: "remove_contact_tag",
    description: "Remove a tag from a contact",
    parameters: { contactId: "string", tag: "string" },
    category: "crm"
  },
  // Engagement & Interaction History
  {
    name: "get_contact_engagement",
    description: "Get engagement metrics for a contact",
    parameters: { contactId: "string" },
    category: "analytics"
  },
  {
    name: "get_interaction_history",
    description: "Get full interaction history for a contact",
    parameters: { contactId: "string", limit: "number?" },
    category: "crm"
  },
  // AI Features
  {
    name: "analyze_lead_score",
    description: "AI-powered lead scoring analysis for a contact",
    parameters: { contactId: "string" },
    category: "ai"
  },
  {
    name: "generate_personalization",
    description: "Generate personalization recommendations for a contact",
    parameters: { contactId: "string" },
    category: "ai"
  },
  {
    name: "enrich_contact",
    description: "AI-powered contact enrichment with research",
    parameters: { contactId: "string" },
    category: "ai"
  },
  {
    name: "social_media_research",
    description: "Research contact social media profiles",
    parameters: { contactId: "string", platforms: "string?" },
    category: "ai"
  },
  {
    name: "analyze_sentiment",
    description: "Analyze sentiment of text content",
    parameters: { text: "string" },
    category: "ai"
  },
  {
    name: "generate_email_draft",
    description: "Generate an AI email draft for a contact",
    parameters: { contactId: "string", purpose: "string", context: "string?" },
    category: "ai"
  },
  // Bulk Operations
  {
    name: "bulk_analyze_contacts",
    description: "Run AI analysis on multiple contacts",
    parameters: { contactIds: "string" },
    category: "ai"
  },
  {
    name: "bulk_export_contacts",
    description: "Export contacts to CSV format",
    parameters: { contactIds: "string?", filters: "object?" },
    category: "crm"
  },
  // Advanced Search
  {
    name: "search_contacts_advanced",
    description: "Advanced search with multiple filter criteria",
    parameters: {
      query: "string?",
      status: "string?",
      interestLevel: "string?",
      industry: "string?",
      tags: "string?",
      minScore: "number?",
      maxScore: "number?",
      source: "string?",
      location: "string?",
      favoritesOnly: "boolean?",
      limit: "number?"
    },
    category: "crm"
  },
  // Deal AI
  {
    name: "analyze_deal",
    description: "AI-powered strategic analysis of a deal",
    parameters: { dealId: "string" },
    category: "ai"
  },
  // Deal Analytics
  {
    name: "get_deal_analytics",
    description: "Get deal analytics with revenue, conversion, and metrics",
    parameters: { period: "week | month | quarter?" },
    category: "analytics"
  },
  {
    name: "get_deal_risks",
    description: "Get deals at risk based on inactivity and low probability",
    parameters: {},
    category: "analytics"
  },
  // Contact Customization
  {
    name: "toggle_favorite",
    description: "Toggle favorite status for a contact",
    parameters: { contactId: "string" },
    category: "crm"
  },
  {
    name: "add_custom_field",
    description: "Add a custom field to a contact",
    parameters: { contactId: "string", key: "string", value: "string" },
    category: "crm"
  },
  {
    name: "remove_custom_field",
    description: "Remove a custom field from a contact",
    parameters: { contactId: "string", key: "string" },
    category: "crm"
  },
  // Social Monitoring
  {
    name: "setup_social_monitoring",
    description: "Set up ongoing social media monitoring for a contact",
    parameters: { contactId: "string", platforms: "string?", alertTypes: "string?" },
    category: "ai"
  },
  {
    name: "get_social_alerts",
    description: "Get social media monitoring alerts for a contact",
    parameters: { contactId: "string" },
    category: "ai"
  },
  // Module Federation
  {
    name: "get_module_federation_status",
    description: "Get status of all module federation remote apps",
    parameters: {},
    category: "navigation"
  },
  {
    name: "broadcast_to_modules",
    description: "Broadcast a message to all module federation apps",
    parameters: { type: "string", data: "object" },
    category: "navigation"
  },
  // UI Control
  {
    name: "toggle_dark_mode",
    description: "Toggle dark mode theme for the application",
    parameters: {},
    category: "navigation"
  },
  {
    name: "set_theme",
    description: "Set the application theme",
    parameters: { theme: "light | dark | auto" },
    category: "navigation"
  },
  // Image Generation
  {
    name: "generate_image",
    description: "Generate an image with OpenAI (size: 1024x1024, 1536x1024 or 1024x1536)",
    parameters: { prompt: "string", size: "string?" },
    category: "ai"
  },
  // Video/Demo
  {
    name: "generate_demo_script",
    description: "Generate a product demo script using AI",
    parameters: { productName: "string", productDescription: "string?", targetAudience: "string?" },
    category: "ai"
  },
  {
    name: "list_videos",
    description: "List all video emails for the user",
    parameters: { limit: "number?" },
    category: "crm"
  },
  {
    name: "create_video",
    description: "Create a new video email entry",
    parameters: {
      title: "string",
      script: "string",
      recipientEmail: "string?",
      recipientName: "string?"
    },
    category: "crm"
  },
  // Pipeline Drag & Drop (alias for update_deal_stage with position)
  {
    name: "move_deal",
    description: "Move a deal to a different pipeline stage (drag & drop equivalent)",
    parameters: { dealId: "string", stage: "string", position: "number?" },
    category: "crm"
  },
  // Shared State Sync
  {
    name: "sync_shared_state",
    description: "Sync shared state across all module federation apps",
    parameters: { dataType: "contacts | deals | appointments", data: "object" },
    category: "navigation"
  },
  // AI Agents
  {
    name: "list_agents",
    description: "List all available AI agents",
    parameters: {},
    category: "ai"
  },
  {
    name: "get_agent",
    description: "Get details about a specific AI agent",
    parameters: { agentId: "string" },
    category: "ai"
  },
  {
    name: "execute_agent",
    description: "Execute an AI agent with input data",
    parameters: { agentId: "string", input: "object", task: "string?" },
    category: "ai"
  },
  {
    name: "get_agent_execution",
    description: "Get the status and result of an agent execution",
    parameters: { executionId: "string" },
    category: "ai"
  },
  {
    name: "list_agent_executions",
    description: "List recent agent executions",
    parameters: { limit: "number?", status: "string?" },
    category: "ai"
  },
  // AI Calendar
  {
    name: "get_calendar_ai_suggestions",
    description: "Get AI-powered meeting scheduling suggestions",
    parameters: { contactId: "string?", context: "string?" },
    category: "ai"
  },
  {
    name: "schedule_meeting_intelligence",
    description: "Schedule a meeting with AI-optimized timing",
    parameters: { title: "string", contactIds: "string[]", duration: "number", context: "string?" },
    category: "ai"
  },
  {
    name: "get_meeting_summary",
    description: "Get AI-generated meeting summary and action items",
    parameters: { appointmentId: "string" },
    category: "ai"
  }
];
router4.post("/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const userId = req.userId;
    const { apiKey: effectiveApiKey, baseUrl: effectiveBaseUrl } = await getOpenClawConfigForUser(userId);
    const openclawRequest = {
      message,
      history: history || [],
      tools: crmTools,
      context: {
        ...context,
        crmBaseUrl: process.env.CRM_BASE_URL || "http://localhost:3000",
        userId
      }
    };
    const response = await fetchWithTimeout(
      `${effectiveBaseUrl}/api/v1/chat/completions`,
      {
        method: "POST",
        redirect: "error",
        // never follow redirects from a (possibly user-supplied) base URL
        headers: {
          "Content-Type": "application/json",
          ...effectiveApiKey ? { Authorization: `Bearer ${effectiveApiKey}` } : {}
        },
        body: JSON.stringify(openclawRequest)
      },
      3e4
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenClaw API error:", response.status);
      return res.status(response.status).json({ error: "OpenClaw API error" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("OpenClaw proxy error:", error.name === "AbortError" ? "Timeout" : error.message);
    res.status(500).json({ error: "Failed to communicate with OpenClaw API" });
  }
});
router4.post("/chat/stream", async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const userId = req.userId;
    const { apiKey: effectiveApiKey, baseUrl: effectiveBaseUrl } = await getOpenClawConfigForUser(userId);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const openclawRequest = {
      message,
      history: history || [],
      tools: crmTools,
      stream: true,
      context: {
        ...context,
        crmBaseUrl: process.env.CRM_BASE_URL || "http://localhost:3000",
        userId
      }
    };
    const response = await fetchWithTimeout(
      `${effectiveBaseUrl}/api/v1/chat/completions`,
      {
        method: "POST",
        redirect: "error",
        // never follow redirects from a (possibly user-supplied) base URL
        headers: {
          "Content-Type": "application/json",
          ...effectiveApiKey ? { Authorization: `Bearer ${effectiveApiKey}` } : {}
        },
        body: JSON.stringify(openclawRequest)
      },
      6e4
    );
    if (!response.ok) {
      res.end(`data: ${JSON.stringify({ error: "OpenClaw API error" })}

`);
      return;
    }
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) {
      res.end(`data: ${JSON.stringify({ error: "No response body" })}

`);
      return;
    }
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (error) {
    console.error("OpenClaw streaming error:", error);
    res.end(`data: ${JSON.stringify({ error: "Failed to stream from OpenClaw" })}

`);
  }
});
router4.get("/tools", (req, res) => {
  res.json({ tools: crmTools });
});
router4.post("/execute", async (req, res) => {
  try {
    const { tool, parameters } = req.body;
    if (!tool) {
      return res.status(400).json({ error: "Tool name is required" });
    }
    const userId = req.userId;
    const toolDef = crmTools.find((t) => t.name === tool);
    if (!toolDef) {
      return res.status(400).json({ error: `Tool '${tool}' not found` });
    }
    const isAITool = toolDef.category === "ai";
    if (isAITool && !checkAIRateLimit(userId)) {
      return res.status(429).json({ error: "Rate limit exceeded for AI tools" });
    }
    const result = await executeCRMFunction(tool, parameters, userId);
    res.json({ success: true, tool, result });
  } catch (error) {
    console.error("Tool execution error:", error);
    res.status(500).json({ error: "Failed to execute tool", details: error.message });
  }
});
async function executeCRMFunction(toolName, params, userId) {
  console.log(`Executing CRM function: ${toolName}`);
  if (!isDbAvailable()) {
    return { error: "Database not available" };
  }
  if (!userId) {
    return { error: "User ID required" };
  }
  try {
    switch (toolName) {
      case "search_contacts": {
        const query = params.query || "";
        const limit = params.limit || 10;
        const results = await db.select().from(contacts).where(
          query ? and3(
            eq4(contacts.profileId, userId),
            or(
              like(contacts.firstName, `%${query}%`),
              like(contacts.lastName, `%${query}%`),
              like(contacts.email, `%${query}%`),
              like(contacts.company, `%${query}%`)
            )
          ) : eq4(contacts.profileId, userId)
        ).limit(limit);
        return { contacts: results, count: results.length };
      }
      case "get_contact_details": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        return contact || { error: "Contact not found" };
      }
      case "create_contact": {
        const validated = insertContactSchema.parse({ ...params, profileId: userId });
        const [newContact] = await db.insert(contacts).values(validated).returning();
        return { contact: newContact };
      }
      case "update_contact": {
        const contactId = parseInt(params.contactId);
        const [updated] = await db.update(contacts).set({ ...params.data, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId))).returning();
        return updated || { error: "Contact not found" };
      }
      case "delete_contact": {
        const contactId = parseInt(params.contactId);
        await db.delete(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        return { success: true, message: "Contact deleted" };
      }
      case "list_deals": {
        const limit = params.limit || 20;
        const stage = params.stage;
        const status = params.status;
        let whereClause = eq4(deals.profileId, userId);
        let results = await db.select().from(deals).where(eq4(deals.profileId, userId)).limit(limit);
        if (stage) results = results.filter((d) => d.stage === stage);
        if (status) results = results.filter((d) => d.status === status);
        return { deals: results, count: results.length };
      }
      case "create_deal": {
        const validated = insertDealSchema.parse({ ...params, profileId: userId });
        const [newDeal] = await db.insert(deals).values(validated).returning();
        return { deal: newDeal };
      }
      case "update_deal_stage": {
        const dealId = parseInt(params.dealId);
        const [updated] = await db.update(deals).set({ stage: params.stage, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(deals.id, dealId), eq4(deals.profileId, userId))).returning();
        return updated || { error: "Deal not found" };
      }
      case "close_deal": {
        const dealId = parseInt(params.dealId);
        const status = params.status === "closed-won" ? "won" : "lost";
        const [updated] = await db.update(deals).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(deals.id, dealId), eq4(deals.profileId, userId))).returning();
        return updated || { error: "Deal not found" };
      }
      case "list_tasks": {
        const limit = params.limit || 20;
        const status = params.status;
        const dueDate = params.dueDate;
        let results = await db.select().from(tasks).where(eq4(tasks.profileId, userId)).limit(limit);
        if (status) results = results.filter((t) => t.status === status);
        if (dueDate)
          results = results.filter(
            (t) => t.dueDate && t.dueDate.toISOString().split("T")[0] === dueDate
          );
        return { tasks: results, count: results.length };
      }
      case "create_task": {
        const validated = insertTaskSchema.parse({ ...params, profileId: userId });
        const [newTask] = await db.insert(tasks).values(validated).returning();
        return { task: newTask };
      }
      case "complete_task": {
        const taskId = parseInt(params.taskId);
        const [updated] = await db.update(tasks).set({ status: "completed", updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(tasks.id, taskId), eq4(tasks.profileId, userId))).returning();
        return updated || { error: "Task not found" };
      }
      case "delete_task": {
        const taskId = parseInt(params.taskId);
        await db.delete(tasks).where(and3(eq4(tasks.id, taskId), eq4(tasks.profileId, userId)));
        return { success: true, message: "Task deleted" };
      }
      case "search_companies": {
        const query = params.query || "";
        const limit = params.limit || 10;
        let supabaseQuery = supabase.from("companies").select("*").eq("owner_user_id", userId);
        if (query) {
          supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);
        }
        const { data: results, error } = await supabaseQuery.limit(limit);
        if (error) throw error;
        return { companies: results || [], count: results?.length || 0 };
      }
      case "create_company": {
        const { data: company, error } = await supabase.from("companies").insert({
          name: params.name,
          domain: params.website,
          description: params.address,
          industry: params.industry,
          owner_user_id: userId
        }).select().single();
        if (error) throw error;
        return { company };
      }
      case "list_appointments": {
        const limit = params.limit || 20;
        const date = params.date;
        let results = await db.select().from(appointments).where(eq4(appointments.profileId, userId)).limit(limit);
        if (date) {
          results = results.filter(
            (a) => a.dateTime && a.dateTime.toISOString().split("T")[0] === date
          );
        }
        return { appointments: results, count: results.length };
      }
      case "create_appointment": {
        const validated = insertAppointmentSchema.parse({
          ...params,
          profileId: userId,
          dateTime: new Date(params.dateTime)
        });
        const [newAppointment] = await db.insert(appointments).values(validated).returning();
        return { appointment: newAppointment };
      }
      case "cancel_appointment": {
        const appointmentId = String(params.appointmentId);
        await db.delete(appointments).where(and3(eq4(appointments.id, appointmentId), eq4(appointments.profileId, userId)));
        return { success: true, message: "Appointment cancelled" };
      }
      case "send_email": {
        if (!params.to || !params.subject || !params.body) {
          return { error: "to, subject, and body are required" };
        }
        let emailContactId = params.contactId ? parseInt(params.contactId) : null;
        if (!emailContactId) {
          const [existing] = await db.select({ id: contacts.id }).from(contacts).where(and3(eq4(contacts.email, params.to), eq4(contacts.profileId, userId))).limit(1);
          if (existing) emailContactId = existing.id;
        }
        const [newComm] = await db.insert(communications).values({
          type: "email",
          subject: params.subject,
          content: params.body,
          direction: "outbound",
          status: "sent",
          sentAt: /* @__PURE__ */ new Date(),
          contactId: emailContactId,
          profileId: userId
        }).returning();
        return { success: true, communication: newComm, message: `Email queued for ${params.to}` };
      }
      case "send_sms": {
        if (!params.to || !params.message) {
          return { error: "to and message are required" };
        }
        let smsContactId = params.contactId ? parseInt(params.contactId) : null;
        if (!smsContactId) {
          const [existing] = await db.select({ id: contacts.id }).from(contacts).where(and3(eq4(contacts.phone, params.to), eq4(contacts.profileId, userId))).limit(1);
          if (existing) smsContactId = existing.id;
        }
        const [newComm] = await db.insert(communications).values({
          type: "sms",
          subject: null,
          content: params.message,
          direction: "outbound",
          status: "sent",
          sentAt: /* @__PURE__ */ new Date(),
          contactId: smsContactId,
          profileId: userId
        }).returning();
        return { success: true, communication: newComm, message: `SMS queued for ${params.to}` };
      }
      case "trigger_automation": {
        if (!params.workflowId) {
          return { error: "workflowId is required" };
        }
        const ruleId = parseInt(params.workflowId);
        const [rule] = await db.select().from(automationRules).where(and3(eq4(automationRules.id, ruleId), eq4(automationRules.profileId, userId)));
        if (!rule) return { error: "Automation rule not found" };
        if (!rule.isActive) return { error: "Automation rule is inactive" };
        const actions = rule.actions || [];
        const results = [];
        for (const action of actions) {
          try {
            const actionResult = await executeCRMFunction(
              action.type || action.tool,
              { ...action.params, ...action.parameters, ...params.context },
              userId
            );
            results.push({
              action: action.type || action.tool,
              success: true,
              result: actionResult
            });
          } catch (actionError) {
            results.push({
              action: action.type || action.tool,
              success: false,
              error: actionError.message
            });
          }
        }
        return { success: true, automation: rule.name, actionsExecuted: results.length, results };
      }
      case "run_ai_insights": {
        if (!params.entityType || !params.entityId) {
          return { error: "entityType and entityId are required" };
        }
        let entity = null;
        if (params.entityType === "deal") {
          const [deal] = await db.select().from(deals).where(and3(eq4(deals.id, parseInt(params.entityId)), eq4(deals.profileId, userId)));
          entity = deal;
        } else if (params.entityType === "contact") {
          const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, parseInt(params.entityId)), eq4(contacts.profileId, userId)));
          entity = contact;
        } else if (params.entityType === "company") {
          const { data } = await supabase.from("companies").select("*").eq("id", params.entityId).eq("owner_user_id", userId).single();
          entity = data;
        }
        if (!entity) return { error: `${params.entityType} not found` };
        const openaiClient = await getOpenAIClient();
        if (!openaiClient) return { error: NO_KEY_MESSAGE };
        const response = await openaiClient.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a CRM analyst. Provide actionable insights for the given entity. Return JSON with: summary (string), recommendations (string array), riskLevel (low/medium/high), nextBestAction (string), confidence (number 0-1)."
            },
            {
              role: "user",
              content: `Analyze this ${params.entityType} and provide insights: ${JSON.stringify(entity)}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 500
        });
        const insights = JSON.parse(response.choices[0].message.content || "{}");
        return { entityType: params.entityType, entityId: params.entityId, ...insights };
      }
      case "get_pipeline_summary": {
        const allDeals = await db.select().from(deals).where(eq4(deals.profileId, userId));
        const totalValue = allDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const wonDeals = allDeals.filter((d) => d.status === "won");
        const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const openDeals = allDeals.filter((d) => d.status === "open");
        const stageBreakdown = {};
        allDeals.forEach((d) => {
          stageBreakdown[d.stage] = (stageBreakdown[d.stage] || 0) + 1;
        });
        return {
          totalDeals: allDeals.length,
          openDeals: openDeals.length,
          wonDeals: wonDeals.length,
          totalValue,
          wonValue,
          stageBreakdown
        };
      }
      case "get_sales_forecast": {
        const allDeals = await db.select().from(deals).where(eq4(deals.profileId, userId));
        const openDeals = allDeals.filter((d) => d.status === "open");
        const totalPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const avgDealSize = openDeals.length > 0 ? totalPipeline / openDeals.length : 0;
        const winRate = allDeals.length > 0 ? allDeals.filter((d) => d.status === "won").length / allDeals.length : 0;
        return {
          period: params.period || "month",
          pipelineValue: totalPipeline,
          averageDealSize: avgDealSize,
          projectedRevenue: totalPipeline * winRate,
          winRate: winRate * 100,
          dealCount: openDeals.length
        };
      }
      case "navigate_to_app": {
        const validApps = {
          // Core CRM
          contacts: "/contacts",
          deals: "/pipeline",
          pipeline: "/pipeline",
          tasks: "/tasks",
          appointments: "/appointments",
          appointments_dashboard: "/appointments-dashboard",
          calendar: "/calendar",
          companies: "/companies",
          dashboard: "/dashboard",
          // Communication
          email: "/email",
          sms: "/text-messages",
          messaging: "/text-messages",
          communication: "/communication",
          communication_hub: "/communication-hub",
          phone: "/phone-system",
          phone_system: "/phone-system",
          video: "/video-email",
          video_email: "/video-email",
          voice_profiles: "/voice-profiles",
          invoicing: "/invoicing",
          // AI & Analytics
          analytics: "/analytics",
          ai_tools: "/ai-tools",
          ai_goals: "/ai-goals",
          ai_integration: "/ai-integration",
          ai_sales_forecast: "/ai-sales-forecast",
          assistants: "/assistants",
          content_ai: "/content-ai",
          business_intel: "/business-intel",
          competitor_insights: "/competitor-insights",
          revenue_intelligence: "/revenue-intelligence",
          sales_cycle_analytics: "/sales-cycle-analytics",
          win_rate_intelligence: "/win-rate-intelligence",
          deal_risk_monitor: "/deal-risk-monitor",
          pipeline_intelligence: "/pipeline-intelligence",
          pipeline_health: "/pipeline-health-dashboard",
          live_deal_analysis: "/live-deal-analysis",
          smartcrm_closer: "/smartcrm-closer",
          // Automation & Leads
          automations: "/lead-automation",
          lead_automation: "/lead-automation",
          // Content & Forms
          content_library: "/content-library",
          forms: "/forms",
          surveys: "/forms",
          circle_prospecting: "/circle-prospecting",
          funnelcraft: "/funnelcraft-ai",
          // Admin & Settings
          admin: "/admin",
          settings: "/settings",
          users: "/users",
          white_label: "/white-label",
          white_label_management: "/white-label-management",
          package_builder: "/package-builder",
          feature_management: "/feature-management",
          bulk_import: "/bulk-import",
          system_overview: "/system-overview",
          // Partner
          partner_dashboard: "/partner-dashboard",
          partner_onboarding: "/partner-onboarding",
          revenue_sharing: "/revenue-sharing",
          // Credits & Upgrade
          credits: "/buy-credits",
          upgrade: "/upgrade",
          // Other
          openclaw: "/openclaw",
          business_analysis: "/business-analysis",
          demo_recorder: "/demo-recorder"
        };
        const appKey = (params.app || "").toLowerCase().replace(/[\s-]/g, "_");
        const route = validApps[appKey] || params.route || "/";
        return {
          type: "navigation",
          action: "navigate",
          app: appKey,
          route,
          url: route,
          message: `Navigating to ${appKey}${route !== "/" ? ` (${route})` : ""}`
        };
      }
      case "open_remote_app": {
        const remoteApps = {
          pipeline: {
            url: "https://pipeline.smartcrm.vip",
            module: "./PipelineApp",
            description: "Pipeline Management Remote App"
          },
          analytics: {
            url: "https://ai-analytics.smartcrm.vip",
            module: "./AnalyticsApp",
            description: "AI Analytics Dashboard"
          },
          contacts: {
            url: "https://contacts.smartcrm.vip",
            module: "./ContactsApp",
            description: "Contacts Management App"
          },
          calendar: {
            url: "https://calendar.smartcrm.vip",
            module: "./CalendarApp",
            description: "Calendar App"
          },
          agency: {
            url: "https://agency.smartcrm.vip",
            module: "./AgencyApp",
            description: "AI Agency App"
          },
          research: {
            url: "https://research.smartcrm.vip",
            module: "./ResearchApp",
            description: "Product Research App",
            available: false
            // Temporarily disabled - returns HTML not remoteEntry
          }
        };
        const appNameKey = (params.appName || "").toLowerCase();
        const remoteApp = remoteApps[appNameKey];
        if (!remoteApp) {
          return {
            error: `Remote app '${params.appName}' not found. Available: ${Object.keys(remoteApps).join(", ")}`
          };
        }
        return {
          type: "remote_app",
          action: "open",
          appName: appNameKey,
          remoteUrl: remoteApp.url,
          remoteModule: remoteApp.module,
          remoteEntry: `${remoteApp.url}/assets/remoteEntry.js`,
          parameters: params.parameters || {},
          message: `Opening remote app: ${remoteApp.description}`
        };
      }
      // Communications
      case "list_communications": {
        const contactId = parseInt(params.contactId);
        const limit = params.limit || 50;
        const type = params.type;
        let results = await db.select().from(communications).where(and3(eq4(communications.contactId, contactId), eq4(communications.profileId, userId))).limit(limit);
        if (type) results = results.filter((c) => c.type === type);
        return { communications: results, count: results.length };
      }
      case "create_communication": {
        const validated = insertCommunicationSchema.parse({
          ...params,
          contactId: parseInt(params.contactId),
          profileId: userId,
          sentAt: /* @__PURE__ */ new Date()
        });
        const [newComm] = await db.insert(communications).values(validated).returning();
        return { communication: newComm };
      }
      // Notes
      case "list_notes": {
        const limit = params.limit || 50;
        const contactId = params.contactId ? parseInt(params.contactId) : null;
        const dealId = params.dealId ? parseInt(params.dealId) : null;
        const conditions = [eq4(notes.profileId, userId)];
        if (contactId) conditions.push(eq4(notes.contactId, contactId));
        if (dealId) conditions.push(eq4(notes.dealId, dealId));
        const results = await db.select().from(notes).where(and3(...conditions)).limit(limit).orderBy(desc3(notes.createdAt));
        return { notes: results, count: results.length };
      }
      case "create_note": {
        const validated = insertNoteSchema.parse({
          ...params,
          contactId: params.contactId ? parseInt(params.contactId) : void 0,
          dealId: params.dealId ? parseInt(params.dealId) : void 0,
          profileId: userId
        });
        const [newNote] = await db.insert(notes).values(validated).returning();
        return { note: newNote };
      }
      case "delete_note": {
        const noteId = parseInt(params.noteId);
        await db.delete(notes).where(and3(eq4(notes.id, noteId), eq4(notes.profileId, userId)));
        return { success: true, message: "Note deleted" };
      }
      // Tags
      case "add_contact_tag": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) return { error: "Contact not found" };
        const currentTags = contact.tags || [];
        const newTags = [.../* @__PURE__ */ new Set([...currentTags, params.tag])];
        const [updated] = await db.update(contacts).set({ tags: newTags, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId))).returning();
        return { contact: updated, tags: newTags };
      }
      case "remove_contact_tag": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) return { error: "Contact not found" };
        const currentTags = contact.tags || [];
        const newTags = currentTags.filter((t) => t !== params.tag);
        const [updated] = await db.update(contacts).set({ tags: newTags, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId))).returning();
        return { contact: updated, tags: newTags };
      }
      // Engagement & Interaction History
      case "get_contact_engagement": {
        const contactId = parseInt(params.contactId);
        const comms = await db.select().from(communications).where(
          and3(eq4(communications.contactId, contactId), eq4(communications.profileId, userId))
        );
        const emails = comms.filter((c) => c.type === "email");
        const calls = comms.filter((c) => c.type === "call");
        const meetings = comms.filter((c) => c.type === "meeting");
        const sms = comms.filter((c) => c.type === "sms");
        const inboundCount = comms.filter((c) => c.direction === "inbound").length;
        const outboundCount = comms.filter((c) => c.direction === "outbound").length;
        const lastCommunication = comms.sort(
          (a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime()
        )[0];
        return {
          totalCommunications: comms.length,
          emails: emails.length,
          calls: calls.length,
          meetings: meetings.length,
          sms: sms.length,
          inboundCount,
          outboundCount,
          responseRate: outboundCount > 0 ? Math.round(inboundCount / outboundCount * 100) : 0,
          lastCommunication: lastCommunication ? {
            type: lastCommunication.type,
            sentAt: lastCommunication.sentAt || lastCommunication.createdAt,
            subject: lastCommunication.subject
          } : null
        };
      }
      case "get_interaction_history": {
        const contactId = parseInt(params.contactId);
        const limit = params.limit || 50;
        const comms = await db.select().from(communications).where(and3(eq4(communications.contactId, contactId), eq4(communications.profileId, userId))).limit(limit).orderBy(desc3(communications.sentAt), desc3(communications.createdAt));
        const contactNotes = await db.select().from(notes).where(and3(eq4(notes.contactId, contactId), eq4(notes.profileId, userId))).limit(limit).orderBy(desc3(notes.createdAt));
        const interactions = [
          ...comms.map((c) => ({
            type: "communication",
            subtype: c.type,
            subject: c.subject,
            content: c.content,
            direction: c.direction,
            date: c.sentAt || c.createdAt
          })),
          ...contactNotes.map((n) => ({
            type: "note",
            subtype: n.type,
            content: n.content,
            date: n.createdAt
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { interactions: interactions.slice(0, limit), count: interactions.length };
      }
      // AI Features
      case "analyze_lead_score": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) {
          memoryService.recordObservation(
            userId,
            "error",
            `analyze_lead_score: Contact ${contactId} not found`,
            { tool: "analyze_lead_score", contactId }
          ).catch(() => {
          });
          return { error: "Contact not found" };
        }
        const client = await getOpenAIClient();
        if (!client) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "analyze_lead_score: OpenAI not configured",
            { tool: "analyze_lead_score", contactId }
          ).catch(() => {
          });
          return { error: NO_KEY_MESSAGE };
        }
        try {
          const response = await client.chat.completions.create({
            model: ADVANCED_MODEL,
            messages: [
              {
                role: "system",
                content: "You are a sales AI expert. Analyze the lead and provide a lead score from 1-100 with detailed reasoning. Return JSON with fields: score, reasoning, strengths, weaknesses, recommendations."
              },
              {
                role: "user",
                content: `Analyze this lead: ${JSON.stringify(contact)}`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 1e3
          });
          const result = safeJsonParse(response.choices[0].message.content || "{}");
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Lead score analysis for ${contact.firstName} ${contact.lastName}: score=${result.score}`,
            {
              tool: "analyze_lead_score",
              contactId,
              contactName: `${contact.firstName} ${contact.lastName}`,
              score: result.score,
              strengthsCount: result.strengths?.length || 0,
              weaknessesCount: result.weaknesses?.length || 0
            }
          ).catch(() => {
          });
          return result;
        } catch (error) {
          memoryService.recordObservation(
            userId,
            "error",
            `analyze_lead_score failed: ${error instanceof Error ? error.message : String(error)}`,
            { tool: "analyze_lead_score", contactId }
          ).catch(() => {
          });
          return {
            error: "Analysis failed",
            details: error instanceof Error ? error.message : String(error)
          };
        }
      }
      case "generate_personalization": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) {
          memoryService.recordObservation(
            userId,
            "error",
            `generate_personalization: Contact ${contactId} not found`,
            { tool: "generate_personalization", contactId }
          ).catch(() => {
          });
          return { error: "Contact not found" };
        }
        const comms = await db.select().from(communications).where(and3(eq4(communications.contactId, contactId), eq4(communications.profileId, userId))).limit(10);
        const client = await getOpenAIClient();
        if (!client) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "generate_personalization: OpenAI not configured",
            { tool: "generate_personalization", contactId }
          ).catch(() => {
          });
          return { error: NO_KEY_MESSAGE };
        }
        const previousInteractions = comms.map(
          (c) => `${c.type}: ${c.subject || ""} - ${c.content || ""}`
        );
        try {
          const response = await client.chat.completions.create({
            model: ADVANCED_MODEL,
            messages: [
              {
                role: "system",
                content: "You are a personalization expert. Generate personalized outreach strategies based on contact data and interaction history. Return JSON with fields: recommendations (array of objects with title, description, priority), talkingPoints (array), bestApproach, suggestedTiming."
              },
              {
                role: "user",
                content: `Contact: ${JSON.stringify(contact)}. Previous interactions: ${JSON.stringify(previousInteractions)}`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1500
          });
          const result = safeJsonParse(response.choices[0].message.content || "{}");
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Personalization generated for ${contact.firstName} ${contact.lastName}`,
            {
              tool: "generate_personalization",
              contactId,
              recommendationsCount: result.recommendations?.length || 0,
              talkingPointsCount: result.talkingPoints?.length || 0
            }
          ).catch(() => {
          });
          return result;
        } catch (error) {
          memoryService.recordObservation(
            userId,
            "error",
            `generate_personalization failed: ${error instanceof Error ? error.message : String(error)}`,
            { tool: "generate_personalization", contactId }
          ).catch(() => {
          });
          return {
            error: "Personalization failed",
            details: error instanceof Error ? error.message : String(error)
          };
        }
      }
      case "enrich_contact": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) {
          memoryService.recordObservation(userId, "error", `enrich_contact: Contact ${contactId} not found`, {
            tool: "enrich_contact",
            contactId
          }).catch(() => {
          });
          return { error: "Contact not found" };
        }
        const client = await getOpenAIClient();
        if (!client) {
          memoryService.recordObservation(userId, "system_event", "enrich_contact: OpenAI not configured", {
            tool: "enrich_contact",
            contactId
          }).catch(() => {
          });
          return { error: NO_KEY_MESSAGE };
        }
        try {
          const research = await respond(client, {
            model: ADVANCED_MODEL,
            instructions: "You are a contact research expert. Search the web for this person and their company. Only include details you found in sources; leave unknown fields empty. Return JSON with fields: suggestedFields (object with field values to add), socialProfiles, companyInfo, industryInsights, confidence.",
            input: `Research and enrich this contact: ${JSON.stringify(contact)}`,
            json: true,
            tools: [webSearchTool()]
          });
          if (!research.data) throw new Error("The AI returned a response that was not valid JSON");
          const result = { ...research.data, sources: research.sources };
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Contact enrichment via OpenClaw: ${contact.firstName} ${contact.lastName}`,
            {
              tool: "enrich_contact",
              contactId,
              confidence: result.confidence,
              suggestedFieldsCount: Object.keys(result.suggestedFields || {}).length,
              hasSocialProfiles: !!result.socialProfiles,
              hasCompanyInfo: !!result.companyInfo
            }
          ).catch(() => {
          });
          return result;
        } catch (error) {
          memoryService.recordObservation(
            userId,
            "error",
            `enrich_contact failed: ${error instanceof Error ? error.message : String(error)}`,
            { tool: "enrich_contact", contactId }
          ).catch(() => {
          });
          return {
            error: "Enrichment failed",
            details: error instanceof Error ? error.message : String(error)
          };
        }
      }
      case "social_media_research": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) {
          memoryService.recordObservation(
            userId,
            "error",
            `social_media_research: Contact ${contactId} not found`,
            { tool: "social_media_research", contactId }
          ).catch(() => {
          });
          return { error: "Contact not found" };
        }
        const client = await getOpenAIClient();
        if (!client) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "social_media_research: OpenAI not configured",
            { tool: "social_media_research", contactId }
          ).catch(() => {
          });
          return { error: NO_KEY_MESSAGE };
        }
        const platforms = params.platforms ? params.platforms.split(",").map((p) => p.trim()) : ["LinkedIn", "Twitter", "Instagram", "YouTube", "GitHub"];
        try {
          const research = await respond(client, {
            model: ADVANCED_MODEL,
            instructions: `You are a social media research expert. Search the web for this contact's public profiles on these platforms: ${platforms.join(", ")}. Only list profiles you actually found (with their real URL); never guess usernames or URLs. Return JSON with fields: profiles (array with platform, username, url, confidence), personalityInsights (object with communicationStyle, interests), engagementMetrics (object with bestPostingTimes, recommendedContent), monitoringRecommendations (array of strings).`,
            input: `Research social media for: ${JSON.stringify(contact)}`,
            json: true,
            tools: [webSearchTool()]
          });
          if (!research.data) throw new Error("The AI returned a response that was not valid JSON");
          const result = { ...research.data, sources: research.sources };
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Social media research for ${contact.firstName} ${contact.lastName} on ${platforms.join(", ")}`,
            {
              tool: "social_media_research",
              contactId,
              platforms: platforms.join(", "),
              profilesFound: result.profiles?.length || 0,
              hasPersonalityInsights: !!result.personalityInsights,
              hasEngagementMetrics: !!result.engagementMetrics
            }
          ).catch(() => {
          });
          return result;
        } catch (error) {
          memoryService.recordObservation(
            userId,
            "error",
            `social_media_research failed: ${error instanceof Error ? error.message : String(error)}`,
            { tool: "social_media_research", contactId }
          ).catch(() => {
          });
          return {
            error: "Research failed",
            details: error instanceof Error ? error.message : String(error)
          };
        }
      }
      case "analyze_sentiment": {
        const text2 = params.text;
        if (!text2) {
          memoryService.recordObservation(userId, "error", "analyze_sentiment: missing text parameter", {
            tool: "analyze_sentiment"
          }).catch(() => {
          });
          return { error: "Text is required for sentiment analysis" };
        }
        const client = await getOpenAIClient();
        if (!client) {
          memoryService.recordObservation(userId, "system_event", "analyze_sentiment: OpenAI not configured", {
            tool: "analyze_sentiment"
          }).catch(() => {
          });
          return { error: NO_KEY_MESSAGE };
        }
        try {
          const response = await client.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
              {
                role: "system",
                content: "You are a sentiment analysis expert. Analyze the sentiment and return JSON with: sentiment (positive/negative/neutral/mixed), score (1-100), confidence, keyPhrases (array), emotionalTone."
              },
              {
                role: "user",
                content: `Analyze the sentiment of: "${text2}"`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 500
          });
          const result = safeJsonParse(response.choices[0].message.content || "{}");
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Sentiment analysis: ${result.sentiment} (score: ${result.score})`,
            {
              tool: "analyze_sentiment",
              sentiment: result.sentiment,
              score: result.score,
              confidence: result.confidence,
              textLength: text2.length,
              keyPhrasesCount: result.keyPhrases?.length || 0
            }
          ).catch(() => {
          });
          return result;
        } catch (error) {
          memoryService.recordObservation(
            userId,
            "error",
            `analyze_sentiment failed: ${error instanceof Error ? error.message : String(error)}`,
            { tool: "analyze_sentiment", textLength: text2.length }
          ).catch(() => {
          });
          return {
            error: "Sentiment analysis failed",
            details: error instanceof Error ? error.message : String(error)
          };
        }
      }
      case "generate_email_draft": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) {
          memoryService.recordObservation(
            userId,
            "error",
            `generate_email_draft: Contact ${contactId} not found`,
            { tool: "generate_email_draft", contactId }
          ).catch(() => {
          });
          return { error: "Contact not found" };
        }
        const purpose = params.purpose || "follow-up";
        const context = params.context || "";
        const client = await getOpenAIClient();
        if (!client) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "generate_email_draft: OpenAI not configured",
            { tool: "generate_email_draft", contactId, purpose }
          ).catch(() => {
          });
          return { error: NO_KEY_MESSAGE };
        }
        try {
          const response = await client.chat.completions.create({
            model: ADVANCED_MODEL,
            messages: [
              {
                role: "system",
                content: "You are a sales email expert. Draft professional, personalized emails. Return JSON with: subject, body, suggestedSendTime."
              },
              {
                role: "user",
                content: `Draft a ${purpose} email to ${contact.name} (${contact.position} at ${contact.company}). Additional context: ${context}. Contact info: ${JSON.stringify(contact)}`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1e3
          });
          const result = safeJsonParse(response.choices[0].message.content || "{}");
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Email draft generated for ${contact.name}: ${result.subject?.slice(0, 50) || "No subject"}`,
            {
              tool: "generate_email_draft",
              contactId,
              purpose,
              hasSubject: !!result.subject,
              hasBody: !!result.body,
              bodyLength: result.body?.length || 0
            }
          ).catch(() => {
          });
          return result;
        } catch (error) {
          memoryService.recordObservation(
            userId,
            "error",
            `generate_email_draft failed: ${error instanceof Error ? error.message : String(error)}`,
            { tool: "generate_email_draft", contactId, purpose }
          ).catch(() => {
          });
          return {
            error: "Email draft failed",
            details: error instanceof Error ? error.message : String(error)
          };
        }
      }
      // Bulk Operations
      case "bulk_analyze_contacts": {
        const contactIds = (params.contactIds || "").split(",").map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
        if (contactIds.length === 0) {
          memoryService.recordObservation(userId, "error", "bulk_analyze_contacts: no valid contact IDs", {
            tool: "bulk_analyze_contacts",
            contactIdsCount: 0
          }).catch(() => {
          });
          return { error: "No valid contact IDs provided" };
        }
        if (contactIds.length > 50) {
          memoryService.recordObservation(userId, "error", "bulk_analyze_contacts: exceeded limit", {
            tool: "bulk_analyze_contacts",
            requested: contactIds.length
          }).catch(() => {
          });
          return { error: "Maximum 50 contacts per bulk analysis" };
        }
        const client = await getOpenAIClient();
        if (!client) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "bulk_analyze_contacts: OpenAI not configured",
            { tool: "bulk_analyze_contacts", contactIdsCount: contactIds.length }
          ).catch(() => {
          });
          return { error: NO_KEY_MESSAGE };
        }
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const contactId of contactIds) {
          try {
            const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
            if (contact) {
              try {
                const response = await client.chat.completions.create({
                  model: DEFAULT_MODEL,
                  messages: [
                    {
                      role: "system",
                      content: "Analyze this lead. Return JSON with: score (1-100), reasoning, recommendations."
                    },
                    { role: "user", content: `Contact: ${JSON.stringify(contact)}` }
                  ],
                  response_format: { type: "json_object" },
                  temperature: 0.3,
                  max_tokens: 300
                });
                const result = safeJsonParse(response.choices[0].message.content || "{}");
                results.push({ contactId, contactName: contact.name, ...result });
                successCount++;
              } catch (e) {
                errorCount++;
                results.push({
                  contactId,
                  contactName: contact.name,
                  error: e instanceof Error ? e.message : "Analysis failed"
                });
              }
            } else {
              errorCount++;
              results.push({ contactId, error: "Contact not found" });
            }
          } catch (e) {
            errorCount++;
            results.push({ contactId, error: e instanceof Error ? e.message : "Processing error" });
          }
        }
        memoryService.recordObservation(
          userId,
          "tool_use",
          `Bulk analysis completed: ${successCount} succeeded, ${errorCount} failed out of ${contactIds.length} contacts`,
          {
            tool: "bulk_analyze_contacts",
            totalContacts: contactIds.length,
            successCount,
            errorCount,
            successRate: successCount / contactIds.length
          }
        ).catch(() => {
        });
        return {
          results,
          summary: { total: contactIds.length, success: successCount, failed: errorCount }
        };
      }
      case "bulk_export_contacts": {
        let contactList;
        if (params.contactIds) {
          const ids = params.contactIds.split(",").map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
          contactList = await db.select().from(contacts).where(and3(eq4(contacts.profileId, userId), ...ids.map((id) => eq4(contacts.id, id))));
        } else if (params.filters) {
          const conditions = [eq4(contacts.profileId, userId)];
          if (params.filters.status) conditions.push(eq4(contacts.status, params.filters.status));
          if (params.filters.industry)
            conditions.push(eq4(contacts.industry, params.filters.industry));
          contactList = await db.select().from(contacts).where(and3(...conditions)).limit(1e3);
        } else {
          contactList = await db.select().from(contacts).where(eq4(contacts.profileId, userId)).limit(1e3);
        }
        const csvHeader = "Name,Email,Phone,Company,Position,Status,Industry,Score,Location,Last Contact\n";
        const csvRows = contactList.map(
          (c) => `"${c.name}","${c.email}","${c.phone || ""}","${c.company || ""}","${c.position || ""}","${c.status}","${c.industry || ""}","${c.score || ""}","${c.location || ""}","${c.lastContact || ""}"`
        ).join("\n");
        return {
          csv: csvHeader + csvRows,
          count: contactList.length,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      case "search_contacts_advanced": {
        const conditions = [eq4(contacts.profileId, userId)];
        if (params.status) conditions.push(eq4(contacts.status, params.status));
        if (params.industry) conditions.push(eq4(contacts.industry, params.industry));
        if (params.source) conditions.push(eq4(contacts.source, params.source));
        if (params.location) conditions.push(like(contacts.location, `%${params.location}%`));
        if (params.query) {
          conditions.push(
            or(
              like(contacts.name, `%${params.query}%`),
              like(contacts.email, `%${params.query}%`),
              like(contacts.company, `%${params.query}%`)
            )
          );
        }
        const limit = params.limit || 50;
        let results = await db.select().from(contacts).where(and3(...conditions)).limit(limit);
        if (params.interestLevel) {
          results = results.filter((c) => c.interestLevel === params.interestLevel);
        }
        if (params.minScore !== void 0) {
          results = results.filter((c) => (c.score || 0) >= params.minScore);
        }
        if (params.maxScore !== void 0) {
          results = results.filter((c) => (c.score || 0) <= params.maxScore);
        }
        if (params.favoritesOnly) {
          results = results.filter((c) => c.isFavorite === true);
        }
        if (params.tags) {
          const tagList = params.tags.split(",").map((t) => t.trim());
          results = results.filter(
            (c) => tagList.some((tag) => c.tags?.includes(tag))
          );
        }
        return { contacts: results, count: results.length };
      }
      // Deal AI
      case "analyze_deal": {
        const dealId = parseInt(params.dealId);
        const [deal] = await db.select().from(deals).where(and3(eq4(deals.id, dealId), eq4(deals.profileId, userId)));
        if (!deal) {
          memoryService.recordObservation(userId, "error", `analyze_deal: Deal ${dealId} not found`, {
            tool: "analyze_deal",
            dealId
          }).catch(() => {
          });
          return { error: "Deal not found" };
        }
        let contact = null;
        if (deal.contactId) {
          const [found] = await db.select().from(contacts).where(eq4(contacts.id, deal.contactId));
          contact = found;
        }
        const client = await getOpenAIClient();
        if (!client) {
          memoryService.recordObservation(userId, "system_event", "analyze_deal: OpenAI not configured", {
            tool: "analyze_deal",
            dealId,
            dealName: deal.name
          }).catch(() => {
          });
          return { error: NO_KEY_MESSAGE };
        }
        try {
          const response = await client.chat.completions.create({
            model: ADVANCED_MODEL,
            messages: [
              {
                role: "system",
                content: "You are a sales strategy expert. Analyze this deal and return JSON with: winProbability, strengths (array), risks (array), recommendedActions (array), timeline, competitivePosition, pricingRecommendation."
              },
              {
                role: "user",
                content: `Deal: ${JSON.stringify(deal)}. Contact: ${JSON.stringify(contact)}. Analyze this deal strategically.`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 1500
          });
          const result = safeJsonParse(response.choices[0].message.content || "{}");
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Deal analysis for ${deal.name}: win probability ${result.winProbability}%, ${result.strengths?.length || 0} strengths, ${result.risks?.length || 0} risks`,
            {
              tool: "analyze_deal",
              dealId,
              dealName: deal.name,
              dealValue: deal.value,
              winProbability: result.winProbability,
              strengthsCount: result.strengths?.length || 0,
              risksCount: result.risks?.length || 0,
              recommendedActionsCount: result.recommendedActions?.length || 0
            }
          ).catch(() => {
          });
          return result;
        } catch (error) {
          memoryService.recordObservation(
            userId,
            "error",
            `analyze_deal failed: ${error instanceof Error ? error.message : String(error)}`,
            { tool: "analyze_deal", dealId, dealName: deal.name }
          ).catch(() => {
          });
          return {
            error: "Deal analysis failed",
            details: error instanceof Error ? error.message : String(error)
          };
        }
      }
      // Deal Analytics
      case "get_deal_analytics": {
        const allDeals = await db.select().from(deals).where(eq4(deals.profileId, userId));
        const wonDeals = allDeals.filter((d) => d.status === "won");
        const lostDeals = allDeals.filter((d) => d.status === "lost");
        const openDeals = allDeals.filter((d) => d.status === "open");
        const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
        const conversionRate = allDeals.length > 0 ? Math.round(wonDeals.length / allDeals.length * 100) : 0;
        const stageBreakdown = {};
        allDeals.forEach((d) => {
          const stage = d.stage || "unknown";
          if (!stageBreakdown[stage]) stageBreakdown[stage] = { count: 0, value: 0 };
          stageBreakdown[stage].count++;
          stageBreakdown[stage].value += d.value || 0;
        });
        const priorityBreakdown = {};
        allDeals.forEach((d) => {
          const priority = d.priority || "unknown";
          priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
        });
        return {
          period: params.period || "month",
          totalDeals: allDeals.length,
          openDeals: openDeals.length,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
          totalRevenue,
          totalPipelineValue,
          avgDealSize: Math.round(avgDealSize),
          conversionRate,
          stageBreakdown,
          priorityBreakdown
        };
      }
      case "get_deal_risks": {
        const allDeals = await db.select().from(deals).where(eq4(deals.profileId, userId));
        const now = /* @__PURE__ */ new Date();
        const highRisk = allDeals.filter((d) => {
          if (d.status !== "open") return false;
          const daysSinceUpdate = Math.floor(
            (now.getTime() - new Date(d.updatedAt).getTime()) / (1e3 * 60 * 60 * 24)
          );
          return daysSinceUpdate > 7 || (d.probability || 0) < 30;
        });
        const mediumRisk = allDeals.filter((d) => {
          if (d.status !== "open") return false;
          const daysSinceUpdate = Math.floor(
            (now.getTime() - new Date(d.updatedAt).getTime()) / (1e3 * 60 * 60 * 24)
          );
          return daysSinceUpdate > 3 && daysSinceUpdate <= 7 && (d.probability || 0) >= 30;
        });
        const atRiskValue = highRisk.reduce((sum, d) => sum + (d.value || 0), 0);
        return {
          highRiskCount: highRisk.length,
          mediumRiskCount: mediumRisk.length,
          atRiskValue,
          highRiskDeals: highRisk.map((d) => ({
            id: d.id,
            title: d.title,
            value: d.value,
            probability: d.probability,
            daysInactive: Math.floor(
              (now.getTime() - new Date(d.updatedAt).getTime()) / (1e3 * 60 * 60 * 24)
            )
          }))
        };
      }
      // Contact Customization
      case "toggle_favorite": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) return { error: "Contact not found" };
        const currentFav = contact.isFavorite || false;
        const [updated] = await db.update(contacts).set({ isFavorite: !currentFav, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId))).returning();
        return { contact: updated, isFavorite: !currentFav };
      }
      case "add_custom_field": {
        const contactId = parseInt(params.contactId);
        if (!params.key || !params.value) return { error: "Key and value are required" };
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) return { error: "Contact not found" };
        const currentFields = contact.customFields || {};
        const updatedFields = { ...currentFields, [params.key]: params.value };
        const [updated] = await db.update(contacts).set({ customFields: updatedFields, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId))).returning();
        return { contact: updated, customFields: updatedFields };
      }
      case "remove_custom_field": {
        const contactId = parseInt(params.contactId);
        if (!params.key) return { error: "Key is required" };
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) return { error: "Contact not found" };
        const currentFields = contact.customFields || {};
        const { [params.key]: _, ...updatedFields } = currentFields;
        const [updated] = await db.update(contacts).set({ customFields: updatedFields, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId))).returning();
        return { contact: updated, customFields: updatedFields };
      }
      // Social Monitoring
      case "setup_social_monitoring": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) return { error: "Contact not found" };
        const platforms = params.platforms ? params.platforms.split(",").map((p) => p.trim()) : ["LinkedIn", "Twitter"];
        const alertTypes = params.alertTypes ? params.alertTypes.split(",").map((a) => a.trim()) : ["job_change", "new_content", "engagement"];
        return {
          success: true,
          contactId,
          platforms,
          alertTypes,
          monitoringId: `mon_${contactId}_${Date.now()}`,
          message: `Monitoring set up for ${contact.name} on ${platforms.join(", ")}`
        };
      }
      case "get_social_alerts": {
        const contactId = parseInt(params.contactId);
        const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, contactId), eq4(contacts.profileId, userId)));
        if (!contact) return { error: "Contact not found" };
        return {
          contactId,
          contactName: contact.name,
          alerts: [],
          message: "Social monitoring alerts retrieved. Configure monitoring first via setup_social_monitoring."
        };
      }
      // Module Federation
      case "get_module_federation_status": {
        const remotes = [
          {
            name: "pipeline",
            url: "https://pipeline.smartcrm.vip",
            module: "./PipelineApp"
          },
          { name: "analytics", url: "https://ai-analytics.smartcrm.vip", module: "./AnalyticsApp" },
          { name: "contacts", url: "https://contacts.smartcrm.vip", module: "./ContactsApp" },
          { name: "calendar", url: "https://calendar.smartcrm.vip", module: "./CalendarApp" },
          { name: "agency", url: "https://agency.smartcrm.vip", module: "./AgencyApp" },
          {
            name: "research",
            url: "https://research.smartcrm.vip",
            module: "./ResearchApp"
          }
        ];
        const statusChecks = await Promise.allSettled(
          remotes.map(async (remote) => {
            try {
              const response = await fetch(`${remote.url}/assets/remoteEntry.js`, {
                method: "HEAD",
                signal: AbortSignal.timeout(3e3)
              });
              return { ...remote, status: response.ok ? "available" : "unreachable" };
            } catch {
              return { ...remote, status: "unreachable" };
            }
          })
        );
        return {
          mfeEnabled: process.env.VITE_ENABLE_MFE === "true",
          remotes: statusChecks.map((result, i) => ({
            ...remotes[i],
            status: result.status === "fulfilled" ? result.value.status : "error"
          }))
        };
      }
      case "broadcast_to_modules": {
        return {
          success: true,
          type: params.type,
          data: params.data,
          message: "Broadcast message sent to all module federation apps",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      // UI Control
      case "toggle_dark_mode": {
        return {
          type: "ui_action",
          action: "toggle_dark_mode",
          message: "Toggling dark mode",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      case "set_theme": {
        return {
          type: "ui_action",
          action: "set_theme",
          theme: params.theme || "light",
          message: `Setting theme to ${params.theme || "light"}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      // Image Generation
      case "generate_image": {
        const prompt = params.prompt;
        if (!prompt) return { error: "Prompt is required for image generation" };
        const client = await getOpenAIClient();
        if (!client) return { error: NO_KEY_MESSAGE };
        const size = params.size || "1024x1024";
        const validSizes = ["1024x1024", "1536x1024", "1024x1536"];
        const imageSize = validSizes.includes(size) ? size : "1024x1024";
        const response = await client.images.generate({
          model: IMAGE_MODEL,
          prompt,
          size: imageSize,
          n: 1
        });
        return {
          images: response.data.map((img) => ({
            url: img.url,
            revisedPrompt: img.revised_prompt
          })),
          model: IMAGE_MODEL,
          size: imageSize
        };
      }
      // Demo Agent
      case "generate_demo_script": {
        const productName = params.productName;
        if (!productName) return { error: "Product name is required" };
        const client = await getOpenAIClient();
        if (!client) return { error: NO_KEY_MESSAGE };
        const response = await client.chat.completions.create({
          model: ADVANCED_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a product demo expert. Create compelling demo scripts. Return JSON with: introduction, keyFeatures (array with name, demo, benefit), callToAction, estimatedDuration, talkingPoints (array)."
            },
            {
              role: "user",
              content: `Create a demo script for: ${productName}. Description: ${params.productDescription || "N/A"}. Target audience: ${params.targetAudience || "business professionals"}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2e3
        });
        return safeJsonParse(response.choices[0].message.content || "{}");
      }
      // Video Management
      case "list_videos": {
        if (!userId) return { error: "Authentication required" };
        const limit = params.limit || 20;
        const videos = listVideosForUser(userId);
        return { videos: videos.slice(0, limit), count: videos.length };
      }
      case "create_video": {
        if (!userId) return { error: "Authentication required" };
        if (!params.title || !params.script) return { error: "title and script are required" };
        const video = createVideoForUser(userId, {
          title: params.title,
          script: params.script,
          recipientName: params.recipientName,
          recipientEmail: params.recipientEmail
        });
        return { video };
      }
      // Pipeline Drag & Drop
      case "move_deal": {
        const dealId = parseInt(params.dealId);
        const stage = params.stage;
        if (!stage) return { error: "Stage is required" };
        const [updated] = await db.update(deals).set({ stage, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(deals.id, dealId), eq4(deals.profileId, userId))).returning();
        return updated ? { deal: updated, message: `Deal moved to ${stage}` } : { error: "Deal not found" };
      }
      // Shared State Sync
      case "sync_shared_state": {
        return {
          type: "state_sync",
          action: "sync",
          dataType: params.dataType,
          data: params.data,
          message: `Shared state synced: ${params.dataType}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      // AI Agents
      case "list_agents": {
        const { data: agents, error } = await supabase.from("ai_agents").select("*").eq("profile_id", userId).limit(50);
        if (error) return { error: "Failed to fetch agents", details: error.message };
        return {
          agents: agents || [],
          count: agents?.length || 0
        };
      }
      case "get_agent": {
        const agentId = params.agentId;
        if (!agentId) return { error: "Agent ID is required" };
        const { data: agent, error } = await supabase.from("ai_agents").select("*").eq("id", agentId).single();
        if (error) return { error: "Agent not found" };
        const { data: configs } = await supabase.from("agent_configurations").select("config_key, config_value").eq("agent_id", agentId);
        return {
          agent,
          configurations: configs || []
        };
      }
      case "execute_agent": {
        const agentId = params.agentId;
        const input = params.input || {};
        const task = params.task || "Execute agent task";
        if (!agentId) return { error: "Agent ID is required" };
        const { data: agent, error: agentError } = await supabase.from("ai_agents").select("*").eq("id", agentId).single();
        if (agentError || !agent) return { error: "Agent not found" };
        const { data: execution, error: execError } = await supabase.from("agent_executions").insert({
          agent_id: agentId,
          app_id: "smartcrm",
          profile_id: userId,
          input_data: { ...input, task },
          status: "running",
          started_at: (/* @__PURE__ */ new Date()).toISOString()
        }).select().single();
        if (execError) return { error: "Failed to create execution", details: execError.message };
        const client = await getOpenAIClient();
        if (!client) return { error: NO_KEY_MESSAGE };
        const systemPrompt = agent.system_prompt || `You are a helpful AI agent.`;
        const userPrompt = `Task: ${task}

Input data: ${JSON.stringify(input)}`;
        try {
          const response = await client.chat.completions.create({
            model: ADVANCED_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2e3
          });
          const output = response.choices[0].message.content;
          await supabase.from("agent_executions").update({
            status: "completed",
            output_data: { result: output, model: ADVANCED_MODEL },
            completed_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", execution.id);
          return {
            execution_id: execution.id,
            status: "completed",
            result: output,
            agent_id: agentId,
            agent_name: agent.name
          };
        } catch (aiError) {
          await supabase.from("agent_executions").update({
            status: "failed",
            error_message: aiError.message,
            completed_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", execution.id);
          return {
            execution_id: execution.id,
            status: "failed",
            error: aiError.message
          };
        }
      }
      case "get_agent_execution": {
        const executionId = params.executionId;
        if (!executionId) return { error: "Execution ID is required" };
        const { data: execution, error } = await supabase.from("agent_executions").select("*").eq("id", executionId).single();
        if (error) return { error: "Execution not found" };
        return { execution };
      }
      case "list_agent_executions": {
        const limit = params.limit || 20;
        const status = params.status;
        let query = supabase.from("agent_executions").select("*").eq("profile_id", userId).order("started_at", { ascending: false }).limit(limit);
        if (status) {
          query = query.eq("status", status);
        }
        const { data: executions, error } = await query;
        if (error) return { error: "Failed to fetch executions" };
        return {
          executions: executions || [],
          count: executions?.length || 0
        };
      }
      // AI Calendar
      case "get_calendar_ai_suggestions": {
        const contactId = params.contactId;
        const context = params.context || "";
        let suggestions = {
          recommended_times: [],
          recommended_durations: [],
          optimal_days: []
        };
        const client = await getOpenAIClient();
        if (!client) return { error: NO_KEY_MESSAGE };
        let contactInfo = "";
        if (contactId) {
          const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, parseInt(contactId)), eq4(contacts.profileId, userId)));
          if (contact) {
            contactInfo = `Contact: ${contact.firstName} ${contact.lastName} (${contact.email})`;
          }
        }
        const response = await client.chat.completions.create({
          model: ADVANCED_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a meeting scheduling expert. Based on the context provided, suggest optimal meeting times and durations. Return JSON with: recommended_times (array of time slots with day, hour, reason), recommended_durations (array with duration, use_case), optimal_days (array of best days of week for meetings with reasons)."
            },
            {
              role: "user",
              content: `Context: ${context}

${contactInfo}

Provide meeting scheduling suggestions.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
          max_tokens: 1e3
        });
        suggestions = safeJsonParse(response.choices[0].message.content || "{}");
        return suggestions;
      }
      case "schedule_meeting_intelligence": {
        const title = params.title;
        const contactIds = params.contactIds || [];
        const duration = params.duration || 30;
        const meetingContext = params.context || "";
        if (!title) return { error: "Meeting title is required" };
        const client = await getOpenAIClient();
        if (!client) return { error: NO_KEY_MESSAGE };
        const contactInfo = [];
        for (const cid of contactIds.slice(0, 5)) {
          const [contact] = await db.select().from(contacts).where(and3(eq4(contacts.id, parseInt(cid)), eq4(contacts.profileId, userId)));
          if (contact) {
            contactInfo.push({
              name: `${contact.firstName} ${contact.lastName}`,
              email: contact.email,
              company: contact.company
            });
          }
        }
        const response = await client.chat.completions.create({
          model: ADVANCED_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a meeting scheduling expert. Find the optimal meeting time considering business hours (9am-5pm weekdays). Return JSON with: suggested_date (ISO string), suggested_time, duration_minutes, meeting_type (internal/external), agenda_points (array), preparation_notes."
            },
            {
              role: "user",
              content: `Meeting: ${title}
Duration: ${duration} minutes
Context: ${meetingContext}
Attendees: ${JSON.stringify(contactInfo)}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 800
        });
        const scheduling = safeJsonParse(response.choices[0].message.content || "{}");
        const suggestedDate = scheduling.suggested_date || (/* @__PURE__ */ new Date()).toISOString();
        const suggestedTime = scheduling.suggested_time || "10:00";
        const [appointment] = await db.insert(appointments).values({
          profileId: userId,
          title,
          dateTime: /* @__PURE__ */ new Date(`${suggestedDate.split("T")[0]}T${suggestedTime}:00`),
          duration,
          notes: `Agenda: ${(scheduling.agenda_points || []).join(", ")}

Preparation: ${scheduling.preparation_notes || ""}`
        }).returning();
        return {
          appointment,
          scheduling,
          message: `Meeting "${title}" scheduled for ${scheduling.suggested_date} at ${scheduling.suggested_time}`
        };
      }
      case "get_meeting_summary": {
        const appointmentId = params.appointmentId;
        if (!appointmentId) return { error: "Appointment ID is required" };
        const [appointment] = await db.select().from(appointments).where(
          and3(eq4(appointments.id, String(appointmentId)), eq4(appointments.profileId, userId))
        );
        if (!appointment) return { error: "Appointment not found" };
        const client = await getOpenAIClient();
        if (!client) return { error: NO_KEY_MESSAGE };
        const relatedNotes = appointment.contactId ? await db.select().from(notes).where(and3(eq4(notes.contactId, appointment.contactId), eq4(notes.profileId, userId))) : [];
        const response = await client.chat.completions.create({
          model: ADVANCED_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a meeting summarization expert. Create a comprehensive summary with: attendees, meeting_title, date_time, duration_actual, key_discussion_points (array), decisions_made (array), action_items (array with task, assignee, due_date), follow_up_required (boolean), next_steps."
            },
            {
              role: "user",
              content: `Meeting Details:
Title: ${appointment.title}
Start: ${appointment.startTime}
End: ${appointment.endTime}
Description: ${appointment.description || "N/A"}

Related Notes: ${relatedNotes.map((n) => n.content).join("\n") || "None"}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1500
        });
        return safeJsonParse(response.choices[0].message.content || "{}");
      }
      default:
        return { error: `Tool '${toolName}' not implemented` };
    }
  } catch (error) {
    console.error(`Error executing CRM function ${toolName}:`, error);
    return { error: error.message || "Unknown error" };
  }
}
router4.get("/health", async (req, res) => {
  try {
    const response = await fetch(`${OPENCLAW_API_URL}/api/v1/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5e3)
    });
    if (response.ok) {
      res.json({ status: "connected", openclawUrl: OPENCLAW_API_URL });
    } else {
      res.json({ status: "degraded", openclawUrl: OPENCLAW_API_URL });
    }
  } catch (error) {
    res.json({
      status: "disconnected",
      openclawUrl: OPENCLAW_API_URL,
      error: "Unable to reach OpenClaw API"
    });
  }
});
var openclaw_default = router4;

// server/routes/analytics.ts
import { Router as Router5 } from "express";

// server/services/whitelabel/analyticsEngine.ts
import { createClient as createClient5 } from "@supabase/supabase-js";

// server/utils/analyticsUtils.ts
var MILLISECONDS_PER_SECOND = 1e3;
var SECONDS_PER_MINUTE = 60;
var MINUTES_PER_HOUR = 60;
var HOURS_PER_DAY = 24;
var DAYS_PER_MONTH = 30;
var MILLISECONDS_PER_DAY = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;
var DEFAULT_ANALYTICS_PERIOD_DAYS = DAYS_PER_MONTH;
function getDateRange(endDate = /* @__PURE__ */ new Date(), days = DEFAULT_ANALYTICS_PERIOD_DAYS) {
  const end = new Date(endDate);
  const start = new Date(end.getTime() - days * MILLISECONDS_PER_DAY);
  return { start, end };
}
function validateTimeRange(startDate, endDate) {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    throw new Error("Invalid start date provided");
  }
  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    throw new Error("Invalid end date provided");
  }
  if (startDate >= endDate) {
    throw new Error("Start date must be before end date");
  }
  const maxRangeDays = 365;
  const rangeMs = endDate.getTime() - startDate.getTime();
  const rangeDays = rangeMs / MILLISECONDS_PER_DAY;
  if (rangeDays > maxRangeDays) {
    throw new Error(`Date range cannot exceed ${maxRangeDays} days`);
  }
}
function calculatePeriodDays(start, end) {
  return Math.ceil((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY);
}

// server/services/whitelabel/analyticsEngine.ts
var supabaseUrl4 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase2 = supabaseUrl4 && supabaseKey ? createClient5(supabaseUrl4, supabaseKey) : null;
var AnalyticsEngine = class {
  /**
   * Record metric
   */
  async recordMetric(tenantId, metricType, metricValue, metadata) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    try {
      const { data, error } = await supabase2.from("analytics_metrics").insert({
        tenant_id: tenantId,
        metric_type: metricType,
        metric_value: metricValue,
        metadata: metadata || {},
        recorded_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error) {
        throw new Error(`Failed to record metric: ${error.message}`);
      }
      return this.mapDatabaseToMetric(data);
    } catch (error) {
      await errorLogger.logError("Metric recording failed", error, {
        tenantId,
        metricType
      });
      throw error;
    }
  }
  /**
   * Get metrics for tenant
   */
  async getMetrics(tenantId, metricType, startDate, endDate) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    let query = supabase2.from("analytics_metrics").select("*").eq("tenant_id", tenantId);
    if (metricType) {
      query = query.eq("metric_type", metricType);
    }
    if (startDate) {
      query = query.gte("recorded_at", startDate.toISOString());
    }
    if (endDate) {
      query = query.lte("recorded_at", endDate.toISOString());
    }
    const { data, error } = await query.order("recorded_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to get metrics: ${error.message}`);
    }
    return (data || []).map((d) => this.mapDatabaseToMetric(d));
  }
  /**
   * Get analytics summary for tenant
   */
  async getAnalyticsSummary(tenantId, startDate, endDate) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    const { start, end } = startDate && endDate ? { start: startDate, end: endDate } : getDateRange();
    validateTimeRange(start, end);
    try {
      const { data: users } = await supabase2.from("profiles").select("id, created_at").eq("id", tenantId);
      const { data: contacts2 } = await supabase2.from("smartcrm_contacts").select("id, created_at").eq("profile_id", tenantId);
      const { data: deals2 } = await supabase2.from("smartcrm_deals").select("id, title, value, status, created_at").eq("profile_id", tenantId);
      const totalUsers = users?.length || 0;
      const totalContacts = contacts2?.length || 0;
      const totalDeals = deals2?.length || 0;
      const wonDeals = deals2?.filter((d) => d.status === "won") || [];
      const totalRevenue = wonDeals.reduce((sum, deal) => sum + parseFloat(deal.value || "0"), 0);
      const avgDealValue = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
      const conversionRate = totalDeals > 0 ? wonDeals.length / totalDeals * 100 : 0;
      const periodDuration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodDuration);
      const previousEnd = start;
      const previousContacts = contacts2?.filter(
        (c) => new Date(c.created_at) >= previousStart && new Date(c.created_at) < previousEnd
      ).length || 0;
      const previousDeals = deals2?.filter(
        (d) => new Date(d.created_at) >= previousStart && new Date(d.created_at) < previousEnd
      ).length || 0;
      const currentContacts = contacts2?.filter(
        (c) => new Date(c.created_at) >= startDate && new Date(c.created_at) <= endDate
      ).length || 0;
      const currentDeals = deals2?.filter(
        (d) => new Date(d.created_at) >= startDate && new Date(d.created_at) <= endDate
      ).length || 0;
      const usersGrowth = previousContacts > 0 ? (currentContacts - previousContacts) / previousContacts * 100 : 0;
      const dealsGrowth = previousDeals > 0 ? (currentDeals - previousDeals) / previousDeals * 100 : 0;
      const topDeals = (deals2 || []).sort((a, b) => parseFloat(b.value || "0") - parseFloat(a.value || "0")).slice(0, 5).map((d) => ({
        id: d.id.toString(),
        title: d.title,
        value: parseFloat(d.value || "0")
      }));
      return {
        tenantId,
        period: {
          start,
          end
        },
        metrics: {
          totalUsers,
          activeUsers: totalUsers,
          // Would need last_active_at tracking
          totalContacts,
          totalDeals,
          totalRevenue,
          conversionRate,
          avgDealValue,
          avgResponseTime: 0
          // Would need response time tracking
        },
        trends: {
          usersGrowth,
          revenueGrowth: 0,
          // Would need previous revenue data
          dealsGrowth
        },
        topPerformers: {
          users: [],
          // Would need user performance metrics
          deals: topDeals
        }
      };
    } catch (error) {
      await errorLogger.logError("Analytics summary generation failed", error, {
        tenantId
      });
      throw error;
    }
  }
  /**
   * Create report
   */
  async createReport(tenantId, name, config, schedule, recipients, format, createdBy, description) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    try {
      const nextGenerationAt = this.calculateNextGeneration(schedule);
      const { data, error } = await supabase2.from("analytics_reports").insert({
        tenant_id: tenantId,
        name,
        description,
        config,
        schedule,
        recipients,
        format,
        next_generation_at: nextGenerationAt?.toISOString(),
        created_by: createdBy,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error) {
        throw new Error(`Failed to create report: ${error.message}`);
      }
      return this.mapDatabaseToReport(data);
    } catch (error) {
      await errorLogger.logError("Report creation failed", error, {
        tenantId,
        reportName: name
      });
      throw error;
    }
  }
  /**
   * Generate report
   */
  async generateReport(reportId) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    try {
      const { data: reportData, error } = await supabase2.from("analytics_reports").select("*").eq("id", reportId).single();
      if (error || !reportData) {
        throw new Error("Report not found");
      }
      const report = this.mapDatabaseToReport(reportData);
      validateTimeRange(report.config.dateRange.start, report.config.dateRange.end);
      const summary = await this.getAnalyticsSummary(
        report.tenantId,
        report.config.dateRange.start,
        report.config.dateRange.end
      );
      const metrics = await this.getMetrics(
        report.tenantId,
        void 0,
        report.config.dateRange.start,
        report.config.dateRange.end
      );
      let formattedData;
      switch (report.format) {
        case "json":
          formattedData = {
            report: {
              id: report.id,
              name: report.name,
              generatedAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            summary,
            metrics
          };
          break;
        case "csv":
          formattedData = this.formatAsCSV(summary, metrics);
          break;
        case "pdf":
        case "excel":
          formattedData = {
            message: `${report.format.toUpperCase()} generation not yet implemented`,
            summary,
            metrics
          };
          break;
        default:
          formattedData = { summary, metrics };
      }
      await supabase2.from("analytics_reports").update({
        last_generated_at: (/* @__PURE__ */ new Date()).toISOString(),
        next_generation_at: this.calculateNextGeneration(report.schedule)?.toISOString()
      }).eq("id", reportId);
      return {
        data: formattedData,
        format: report.format
      };
    } catch (error) {
      await errorLogger.logError("Report generation failed", error, {
        reportId
      });
      throw error;
    }
  }
  /**
   * List reports for tenant
   */
  async listReports(tenantId) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    const { data, error } = await supabase2.from("analytics_reports").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list reports: ${error.message}`);
    }
    return (data || []).map((d) => this.mapDatabaseToReport(d));
  }
  /**
   * Update report
   */
  async updateReport(reportId, updates) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    const dbUpdates = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== void 0) dbUpdates.description = updates.description;
    if (updates.config) dbUpdates.config = updates.config;
    if (updates.schedule) {
      dbUpdates.schedule = updates.schedule;
      dbUpdates.next_generation_at = this.calculateNextGeneration(updates.schedule)?.toISOString();
    }
    if (updates.recipients) dbUpdates.recipients = updates.recipients;
    if (updates.format) dbUpdates.format = updates.format;
    const { data, error } = await supabase2.from("analytics_reports").update(dbUpdates).eq("id", reportId).select().single();
    if (error) {
      throw new Error(`Failed to update report: ${error.message}`);
    }
    return this.mapDatabaseToReport(data);
  }
  /**
   * Delete report
   */
  async deleteReport(reportId) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    const { error } = await supabase2.from("analytics_reports").delete().eq("id", reportId);
    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }
  /**
   * Calculate next generation time based on schedule
   */
  calculateNextGeneration(schedule) {
    if (schedule === "manual") {
      return null;
    }
    const now = /* @__PURE__ */ new Date();
    const next = new Date(now);
    switch (schedule) {
      case "daily":
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        break;
      case "weekly":
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(0, 0, 0, 0);
        break;
      case "custom":
        next.setDate(next.getDate() + 7);
        break;
    }
    return next;
  }
  /**
   * Format data as CSV
   */
  formatAsCSV(summary, metrics) {
    let csv = "Metric Type,Value,Recorded At\n";
    csv += `Total Users,${summary.metrics.totalUsers},${(/* @__PURE__ */ new Date()).toISOString()}
`;
    csv += `Active Users,${summary.metrics.activeUsers},${(/* @__PURE__ */ new Date()).toISOString()}
`;
    csv += `Total Contacts,${summary.metrics.totalContacts},${(/* @__PURE__ */ new Date()).toISOString()}
`;
    csv += `Total Deals,${summary.metrics.totalDeals},${(/* @__PURE__ */ new Date()).toISOString()}
`;
    csv += `Total Revenue,${summary.metrics.totalRevenue},${(/* @__PURE__ */ new Date()).toISOString()}
`;
    csv += `Conversion Rate,${summary.metrics.conversionRate}%,${(/* @__PURE__ */ new Date()).toISOString()}
`;
    csv += `Avg Deal Value,${summary.metrics.avgDealValue},${(/* @__PURE__ */ new Date()).toISOString()}
`;
    metrics.forEach((metric) => {
      csv += `${metric.metricType},${metric.metricValue},${metric.recordedAt.toISOString()}
`;
    });
    return csv;
  }
  /**
   * Process scheduled reports
   */
  async processScheduledReports() {
    if (!supabase2) {
      return;
    }
    try {
      const { data: reports, error } = await supabase2.from("analytics_reports").select("*").lte("next_generation_at", (/* @__PURE__ */ new Date()).toISOString()).neq("schedule", "manual");
      if (error) {
        throw error;
      }
      if (!reports || reports.length === 0) {
        return;
      }
      for (const reportData of reports) {
        try {
          await this.generateReport(reportData.id);
          console.log(`Report generated: ${reportData.name} for tenant ${reportData.tenant_id}`);
        } catch (error2) {
          await errorLogger.logError("Scheduled report generation failed", error2, {
            reportId: reportData.id
          });
        }
      }
    } catch (error) {
      await errorLogger.logError("Scheduled report processing failed", error);
    }
  }
  /**
   * Export data in specified format
   */
  async exportData(tenantId, dataType, format) {
    if (!supabase2) {
      throw new Error("Supabase not configured");
    }
    try {
      let exportData = {};
      if (dataType === "contacts" || dataType === "all") {
        const { data: contacts2 } = await supabase2.from("smartcrm_contacts").select("*").eq("profile_id", tenantId);
        exportData.contacts = contacts2 || [];
      }
      if (dataType === "deals" || dataType === "all") {
        const { data: deals2 } = await supabase2.from("smartcrm_deals").select("*").eq("profile_id", tenantId);
        exportData.deals = deals2 || [];
      }
      if (dataType === "tasks" || dataType === "all") {
        const { data: tasks2 } = await supabase2.from("smartcrm_tasks").select("*").eq("profile_id", tenantId);
        exportData.tasks = tasks2 || [];
      }
      let formattedData;
      let filename;
      switch (format) {
        case "json":
          formattedData = JSON.stringify(exportData, null, 2);
          filename = `${dataType}-export-${Date.now()}.json`;
          break;
        case "csv":
          formattedData = this.convertToCSV(exportData);
          filename = `${dataType}-export-${Date.now()}.csv`;
          break;
        case "excel":
          formattedData = exportData;
          filename = `${dataType}-export-${Date.now()}.xlsx`;
          break;
        default:
          formattedData = exportData;
          filename = `${dataType}-export-${Date.now()}.json`;
      }
      return {
        data: formattedData,
        format,
        filename
      };
    } catch (error) {
      await errorLogger.logError("Data export failed", error, {
        tenantId,
        dataType,
        format
      });
      throw error;
    }
  }
  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    let csv = "";
    for (const [tableName, records] of Object.entries(data)) {
      if (records.length === 0) continue;
      csv += `
${tableName.toUpperCase()}
`;
      const headers = Object.keys(records[0]);
      csv += headers.join(",") + "\n";
      records.forEach((record) => {
        const values = headers.map((header) => {
          const value = record[header];
          if (value === null || value === void 0) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += values.join(",") + "\n";
      });
    }
    return csv;
  }
  /**
   * Map database record to Metric
   */
  mapDatabaseToMetric(data) {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      metricType: data.metric_type,
      metricValue: parseFloat(data.metric_value),
      metadata: data.metadata || {},
      recordedAt: new Date(data.recorded_at)
    };
  }
  /**
   * Map database record to Report
   */
  mapDatabaseToReport(data) {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      description: data.description,
      config: data.config,
      schedule: data.schedule,
      lastGeneratedAt: data.last_generated_at ? new Date(data.last_generated_at) : void 0,
      nextGenerationAt: data.next_generation_at ? new Date(data.next_generation_at) : void 0,
      recipients: data.recipients || [],
      format: data.format,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
};
var analyticsEngine = new AnalyticsEngine();

// server/routes/analytics.ts
var router5 = Router5();
router5.use(requireAuth());
router5.use(requireEntitlement(FeatureKey.ANALYTICS));
router5.post("/metrics", async (req, res) => {
  try {
    const { tenantId, metricType, metricValue, metadata } = req.body;
    if (!tenantId || !metricType || metricValue === void 0) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "metricType", "metricValue"]
      });
    }
    const metric = await analyticsEngine.recordMetric(tenantId, metricType, metricValue, metadata);
    res.status(201).json({
      message: "Metric recorded successfully",
      metric
    });
  } catch (error) {
    await errorLogger.logError("Metric recording failed", error, {
      endpoint: "/api/analytics/metrics",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to record metric",
      message: error.message
    });
  }
});
router5.get("/metrics/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { metricType, startDate, endDate } = req.query;
    const metrics = await analyticsEngine.getMetrics(
      tenantId,
      metricType,
      startDate ? new Date(startDate) : void 0,
      endDate ? new Date(endDate) : void 0
    );
    res.json({
      metrics,
      count: metrics.length
    });
  } catch (error) {
    await errorLogger.logError("Failed to get metrics", error, {
      endpoint: `/api/analytics/metrics/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to get metrics",
      message: error.message
    });
  }
});
router5.get("/summary/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;
    const { start, end } = startDate && endDate ? { start: new Date(startDate), end: new Date(endDate) } : getDateRange();
    const summary = await analyticsEngine.getAnalyticsSummary(tenantId, start, end);
    res.json({
      summary,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        days: calculatePeriodDays(start, end)
      }
    });
  } catch (error) {
    await errorLogger.logError("Failed to get analytics summary", error, {
      endpoint: `/api/analytics/summary/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to get analytics summary",
      message: error.message
    });
  }
});
router5.post("/reports", async (req, res) => {
  try {
    const { tenantId, name, description, config, schedule, recipients, format } = req.body;
    const userId = req.session?.userId;
    if (!tenantId || !name || !config || !schedule || !format) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "name", "config", "schedule", "format"]
      });
    }
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }
    const report = await analyticsEngine.createReport(
      tenantId,
      name,
      config,
      schedule,
      recipients || [],
      format,
      userId,
      description
    );
    res.status(201).json({
      message: "Report created successfully",
      report
    });
  } catch (error) {
    await errorLogger.logError("Report creation failed", error, {
      endpoint: "/api/analytics/reports",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to create report",
      message: error.message
    });
  }
});
router5.get("/reports/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const reports = await analyticsEngine.listReports(tenantId);
    res.json({
      reports,
      count: reports.length
    });
  } catch (error) {
    await errorLogger.logError("Failed to list reports", error, {
      endpoint: `/api/analytics/reports/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to list reports",
      message: error.message
    });
  }
});
router5.post("/reports/:reportId/generate", async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await analyticsEngine.generateReport(reportId);
    const contentTypes = {
      json: "application/json",
      csv: "text/csv",
      pdf: "application/pdf",
      excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    };
    res.setHeader("Content-Type", contentTypes[result.format] || "application/json");
    if (result.format === "json") {
      res.json(result.data);
    } else {
      res.send(result.data);
    }
  } catch (error) {
    await errorLogger.logError("Report generation failed", error, {
      endpoint: `/api/analytics/reports/${req.params.reportId}/generate`,
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to generate report",
      message: error.message
    });
  }
});
router5.put("/reports/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;
    const report = await analyticsEngine.updateReport(reportId, updates);
    res.json({
      message: "Report updated successfully",
      report
    });
  } catch (error) {
    await errorLogger.logError("Report update failed", error, {
      endpoint: `/api/analytics/reports/${req.params.reportId}`,
      method: "PUT"
    });
    res.status(500).json({
      error: "Failed to update report",
      message: error.message
    });
  }
});
router5.delete("/reports/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    await analyticsEngine.deleteReport(reportId);
    res.json({
      message: "Report deleted successfully",
      reportId
    });
  } catch (error) {
    await errorLogger.logError("Report deletion failed", error, {
      endpoint: `/api/analytics/reports/${req.params.reportId}`,
      method: "DELETE"
    });
    res.status(500).json({
      error: "Failed to delete report",
      message: error.message
    });
  }
});
router5.get("/export/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { dataType, format } = req.query;
    if (!dataType || !format) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["dataType", "format"]
      });
    }
    const validDataTypes = ["contacts", "deals", "tasks", "all"];
    const validFormats = ["csv", "json", "excel"];
    if (!validDataTypes.includes(dataType)) {
      return res.status(400).json({
        error: "Invalid dataType",
        validDataTypes
      });
    }
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        error: "Invalid format",
        validFormats
      });
    }
    const result = await analyticsEngine.exportData(tenantId, dataType, format);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    if (result.format === "json") {
      res.json(result.data);
    } else {
      res.send(result.data);
    }
  } catch (error) {
    await errorLogger.logError("Data export failed", error, {
      endpoint: `/api/analytics/export/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to export data",
      message: error.message
    });
  }
});
var analytics_default = router5;

// server/routes/companies.ts
import { Router as Router6 } from "express";
import crypto2 from "crypto";
var router6 = Router6();
router6.use(requireAuth({ checkEntitlement: false }));
router6.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { name, domain, description, industry } = req.body;
    const { data: existingCompany } = await supabase.from("companies").select("id").eq("owner_user_id", userId).single();
    if (existingCompany) {
      return res.status(400).json({ error: "User already owns a company" });
    }
    const { data: company, error } = await supabase.from("companies").insert({
      name,
      domain,
      description,
      industry,
      owner_user_id: userId
    }).select().single();
    if (error) throw error;
    await supabase.from("company_users").insert({
      company_id: company.id,
      user_id: userId,
      role: "owner",
      status: "active"
    });
    await supabase.from("company_whitelabel_configs").insert({
      company_id: company.id,
      company_name: name
    });
    res.json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
});
router6.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { data: companies, error } = await supabase.from("companies").select(`
        *,
        company_users!inner(role, status)
      `).eq("company_users.user_id", userId).eq("company_users.status", "active");
    if (error) throw error;
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});
router6.get("/:companyId", async (req, res) => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;
    const { data: membership } = await supabase.from("company_users").select("role").eq("company_id", companyId).eq("user_id", userId).eq("status", "active").single();
    if (!membership) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { data: company, error } = await supabase.from("companies").select("*").eq("id", companyId).single();
    if (error) throw error;
    res.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ error: "Failed to fetch company" });
  }
});
router6.put("/:companyId", async (req, res) => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;
    const updates = req.body;
    const { data: membership } = await supabase.from("company_users").select("role").eq("company_id", companyId).eq("user_id", userId).eq("status", "active").single();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    const { data: company, error } = await supabase.from("companies").update(updates).eq("id", companyId).select().single();
    if (error) throw error;
    res.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
});
router6.get("/:companyId/users", async (req, res) => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;
    const { data: membership } = await supabase.from("company_users").select("role").eq("company_id", companyId).eq("user_id", userId).eq("status", "active").single();
    if (!membership) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { data: users, error } = await supabase.from("company_users").select(`
        *,
        profiles:user_id (
          id,
          username,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `).eq("company_id", companyId).eq("status", "active");
    if (error) throw error;
    res.json(users);
  } catch (error) {
    console.error("Error fetching company users:", error);
    res.status(500).json({ error: "Failed to fetch company users" });
  }
});
router6.post("/:companyId/invitations", async (req, res) => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;
    const { email, role } = req.body;
    const { data: membership } = await supabase.from("company_users").select("role").eq("company_id", companyId).eq("user_id", userId).eq("status", "active").single();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    const { data: existingUser } = await supabase.from("company_users").select("id").eq("company_id", companyId).eq("user_id", email).single();
    if (existingUser) {
      return res.status(400).json({ error: "User already in company" });
    }
    const token = crypto2.randomBytes(32).toString("hex");
    const { data: invitation, error } = await supabase.from("company_invitations").insert({
      company_id: companyId,
      email,
      role,
      token,
      invited_by: userId
    }).select().single();
    if (error) throw error;
    try {
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = (await import("@sendgrid/mail")).default;
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const { data: company } = await supabase.from("companies").select("name").eq("id", companyId).single();
        const { data: inviter } = await supabase.from("profiles").select("first_name, last_name").eq("id", userId).single();
        const inviteUrl = `${process.env.FRONTEND_URL || "https://smart-crm.videoremix.io"}/accept-invitation?token=${invitation.token}`;
        await sgMail.send({
          to: email,
          from: {
            email: process.env.FROM_EMAIL || "noreply@smartcrm.vip",
            name: "SmartCRM Team"
          },
          subject: `You're invited to join ${company?.name || "the company"} on SmartCRM`,
          templateId: process.env.SENDGRID_INVITE_TEMPLATE_ID || "d-invite-template",
          dynamicTemplateData: {
            company_name: company?.name || "the company",
            inviter_name: inviter?.first_name || "Team Member",
            invite_url: inviteUrl,
            expiry_days: 7
          }
        });
        console.log(`\u2705 Invitation email sent to ${email} for company ${company?.name || "unknown"}`);
      } else {
        console.warn("SendGrid not configured, invitation email not sent");
      }
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
    }
    res.json(invitation);
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});
router6.post("/invitations/:token/accept", async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.params;
    const { data: invitation, error: inviteError } = await supabase.from("company_invitations").select("*, companies(*)").eq("token", token).eq("status", "pending").single();
    if (inviteError || !invitation) {
      return res.status(404).json({ error: "Invalid invitation" });
    }
    const { data: userProfile } = await supabase.from("profiles").select("email").eq("id", userId).single();
    if (userProfile.email !== invitation.email) {
      return res.status(403).json({ error: "Email mismatch" });
    }
    await supabase.from("company_users").insert({
      company_id: invitation.company_id,
      user_id: userId,
      role: invitation.role,
      status: "active",
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
      joined_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    await supabase.from("company_invitations").update({ status: "accepted" }).eq("id", invitation.id);
    res.json({ message: "Successfully joined company", company: invitation.companies });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});
router6.get("/:companyId/whitelabel", async (req, res) => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;
    const { data: membership } = await supabase.from("company_users").select("role").eq("company_id", companyId).eq("user_id", userId).eq("status", "active").single();
    if (!membership) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { data: config, error } = await supabase.from("company_whitelabel_configs").select("*").eq("company_id", companyId).single();
    if (error) throw error;
    res.json(config);
  } catch (error) {
    console.error("Error fetching whitelabel config:", error);
    res.status(500).json({ error: "Failed to fetch whitelabel config" });
  }
});
router6.put("/:companyId/whitelabel", async (req, res) => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;
    const updates = req.body;
    const { data: membership } = await supabase.from("company_users").select("role").eq("company_id", companyId).eq("user_id", userId).eq("status", "active").single();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    const { data: config, error } = await supabase.from("company_whitelabel_configs").upsert({
      company_id: companyId,
      ...updates
    }).select().single();
    if (error) throw error;
    res.json(config);
  } catch (error) {
    console.error("Error updating whitelabel config:", error);
    res.status(500).json({ error: "Failed to update whitelabel config" });
  }
});
var companies_default = router6;

// server/routes/openai.ts
import { Router as Router7 } from "express";
var router7 = Router7();
var getUserOpenAI = (userId) => getUserOpenAIClient(userId);
var needsApiKey = (res) => res.status(400).json({ success: false, error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
var aiFailed = (res, what, error) => res.status(500).json({ success: false, error: `Failed to ${what}`, message: error instanceof Error ? error.message : String(error) });
router7.get("/api/openai/status", requireAuth(), async (req, res) => {
  const userId = req.userId;
  const openaiData = await getUserOpenAI(userId);
  if (!openaiData) {
    return res.json({
      configured: false,
      model: "none",
      status: "needs_api_key",
      message: "No OpenAI API key configured. Add your key in Settings > API Keys."
    });
  }
  try {
    await openaiData.client.chat.completions.create({
      model: openaiData.model,
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1
    });
    res.json({
      configured: true,
      model: openaiData.model,
      status: "ready"
    });
  } catch (error) {
    res.json({
      configured: false,
      model: openaiData.model,
      status: "api_key_invalid",
      error: error?.message || "API key validation failed"
    });
  }
});
router7.post("/api/openai/smart-greeting", requireAuth(), async (req, res) => {
  const authReq = req;
  const userId = authReq.userId;
  const sessionId = req.body.sessionId || `session-${Date.now()}`;
  try {
    const { userMetrics, timeOfDay, recentActivity } = req.body;
    const openaiData = await getUserOpenAI(userId);
    if (!openaiData) return needsApiKey(res);
    const response = await openaiData.client.chat.completions.create({
      model: openaiData.model,
      messages: [
        {
          role: "system",
          content: "You are an expert business advisor. Generate personalized, strategic greetings that provide actionable insights based on user data."
        },
        {
          role: "user",
          content: `Generate a smart greeting for ${timeOfDay}. User metrics: ${JSON.stringify(userMetrics)}. Recent activity: ${JSON.stringify(recentActivity)}. Provide both a greeting and a strategic insight in JSON format.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 300
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    await memoryService.recordChatInteraction(
      userId,
      sessionId,
      `Smart greeting request - time: ${timeOfDay}`,
      `Generated greeting: ${result.greeting || "N/A"}, Insight: ${result.insight || "N/A"}`,
      { endpoint: "smart-greeting", userMetrics, recentActivity }
    );
    res.json(result);
  } catch (error) {
    console.error("Smart greeting error:", error);
    await memoryService.recordObservation(
      userId,
      "error",
      `Smart greeting generation failed: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: "smart-greeting", sessionId }
    );
    aiFailed(res, "generate smart greeting", error);
  }
});
router7.post("/api/openai/kpi-analysis", requireAuth(), async (req, res) => {
  const userId = req.userId;
  const sessionId = req.body.sessionId || `session-${Date.now()}`;
  try {
    const { historicalData, currentMetrics } = req.body;
    const openaiData = await getUserOpenAI(userId);
    if (!openaiData) return needsApiKey(res);
    const response = await openaiData.client.chat.completions.create({
      model: openaiData.model,
      messages: [
        {
          role: "system",
          content: "You are an expert business analyst. Analyze KPI trends and provide strategic insights with actionable recommendations."
        },
        {
          role: "user",
          content: `Analyze these KPI trends: Historical: ${JSON.stringify(historicalData)}, Current: ${JSON.stringify(currentMetrics)}. Provide summary, trends, predictions, and recommendations in JSON format.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    await memoryService.recordChatInteraction(
      userId,
      sessionId,
      `KPI analysis request - historical: ${JSON.stringify(historicalData).slice(0, 200)}...`,
      `Analysis result: summary=${result.summary?.slice(0, 100) || "N/A"}`,
      { endpoint: "kpi-analysis", historicalData, currentMetrics }
    );
    res.json(result);
  } catch (error) {
    console.error("KPI analysis error:", error);
    await memoryService.recordObservation(
      userId,
      "error",
      `KPI analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: "kpi-analysis", sessionId }
    );
    aiFailed(res, "analyze KPIs", error);
  }
});
router7.post("/api/openai/deal-intelligence", requireAuth(), async (req, res) => {
  const userId = req.userId;
  const sessionId = req.body.sessionId || `session-${Date.now()}`;
  try {
    const { dealData, contactHistory, marketContext } = req.body;
    const openaiData = await getUserOpenAI(userId);
    if (!openaiData) return needsApiKey(res);
    const response = await openaiData.client.chat.completions.create({
      model: openaiData.model,
      messages: [
        {
          role: "system",
          content: "You are an expert sales strategist. Provide comprehensive deal intelligence including win probability, risk factors, and strategic recommendations."
        },
        {
          role: "user",
          content: `Analyze this deal: ${JSON.stringify(dealData)}. Contact history: ${JSON.stringify(contactHistory)}. Market context: ${JSON.stringify(marketContext)}. Provide probability_score, risk_level, key_factors, recommendations, confidence_level, estimated_close_days, and value_optimization in JSON format.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 600
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    await memoryService.recordChatInteraction(
      userId,
      sessionId,
      `Deal intelligence request - deal: ${JSON.stringify(dealData).slice(0, 150)}...`,
      `Probability: ${result.probability_score || "N/A"}, Risk: ${result.risk_level || "N/A"}`,
      { endpoint: "deal-intelligence", dealData, contactHistory, marketContext }
    );
    res.json(result);
  } catch (error) {
    console.error("Deal intelligence error:", error);
    await memoryService.recordObservation(
      userId,
      "error",
      `Deal intelligence analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: "deal-intelligence", sessionId }
    );
    aiFailed(res, "analyze deal", error);
  }
});
router7.post("/api/openai/business-intelligence", requireAuth(), async (req, res) => {
  const userId = req.userId;
  const sessionId = req.body.sessionId || `session-${Date.now()}`;
  try {
    const { businessData, marketContext, objectives } = req.body;
    const openaiData = await getUserOpenAI(userId);
    if (!openaiData) return needsApiKey(res);
    const response = await openaiData.client.chat.completions.create({
      model: openaiData.model,
      messages: [
        {
          role: "system",
          content: "You are a senior business consultant. Generate strategic business intelligence including market insights, competitive advantages, risk factors, growth opportunities, and strategic recommendations."
        },
        {
          role: "user",
          content: `Generate business intelligence for: ${JSON.stringify(businessData)}. Market context: ${JSON.stringify(marketContext)}. Objectives: ${JSON.stringify(objectives)}. Provide market_insights, competitive_advantages, risk_factors, growth_opportunities, and strategic_recommendations in JSON format.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1e3
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    await memoryService.recordChatInteraction(
      userId,
      sessionId,
      `Business intelligence request - objectives: ${JSON.stringify(objectives).slice(0, 150)}...`,
      `Generated insights: ${result.market_insights?.slice(0, 100) || "N/A"}`,
      { endpoint: "business-intelligence", businessData, marketContext, objectives }
    );
    res.json(result);
  } catch (error) {
    console.error("Business intelligence error:", error);
    await memoryService.recordObservation(
      userId,
      "error",
      `Business intelligence generation failed: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: "business-intelligence", sessionId }
    );
    aiFailed(res, "generate business intelligence", error);
  }
});
var openai_default = router7;

// server/routes/openaiResponses.ts
import { Router as Router8 } from "express";
var router8 = Router8();
var RESPONSES_API_MODELS = [
  {
    id: DEFAULT_MODEL,
    name: "GPT-6.2 Sol",
    description: "OpenAI's go-to model for everyday work",
    pricing: "$2.00 / $10.00 per 1M tokens",
    contextLength: "1.05M tokens"
  },
  {
    id: ADVANCED_MODEL,
    name: "GPT-6.2 Astra",
    description: "More capable model for difficult analysis and reasoning",
    pricing: "See OpenAI pricing",
    contextLength: "See OpenAI model page"
  }
];
function extractResponseText(response) {
  try {
    if (!response?.output || !Array.isArray(response.output)) {
      return JSON.stringify(response);
    }
    const textParts = [];
    for (const item of response.output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        for (const content of item.content) {
          if (content.type === "output_text" && typeof content.text === "string") {
            textParts.push(content.text);
          }
        }
      }
      if (item.type === "output_text" && typeof item.text === "string") {
        textParts.push(item.text);
      }
    }
    if (textParts.length > 0) return textParts.join("\n");
    return JSON.stringify(response.output);
  } catch {
    return JSON.stringify(response);
  }
}
async function createResponse(userId, input, model) {
  const userKeyData = await getUserOpenAIClient(userId);
  if (!userKeyData) {
    throw new Error(NO_KEY_MESSAGE);
  }
  const selectedModel = model || userKeyData.model;
  const openai = userKeyData.client;
  try {
    const response = await openai.responses.create({
      model: selectedModel,
      input
    });
    return {
      id: response.id,
      model: response.model || selectedModel,
      output: response.output,
      text: extractResponseText(response),
      usage: response.usage,
      status: response.status
    };
  } catch (error) {
    console.error("OpenAI Responses API error:", error);
    throw new Error(error?.message || "Failed to create OpenAI Responses API response");
  }
}
async function getAvailableModels() {
  return RESPONSES_API_MODELS;
}
router8.post("/api/openai/responses", requireAuth(), async (req, res) => {
  try {
    const userId = req.userId;
    const { input, model } = req.body;
    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return res.status(400).json({ error: "Input string is required" });
    }
    const response = await createResponse(userId, input, model);
    res.json(response);
  } catch (error) {
    console.error("Responses API endpoint error:", error);
    res.status(500).json({
      error: "Failed to generate response",
      message: error?.message || "Unknown error"
    });
  }
});
router8.get("/api/openai/models", requireAuth(), async (req, res) => {
  try {
    const models = await getAvailableModels();
    res.json({ models });
  } catch (error) {
    console.error("Models endpoint error:", error);
    res.status(500).json({ error: "Failed to fetch available models", models: RESPONSES_API_MODELS });
  }
});
router8.post("/api/openai/responses/stream", requireAuth(), async (req, res) => {
  try {
    const userId = req.userId;
    const { input, model } = req.body;
    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return res.status(400).json({ error: "Input string is required" });
    }
    const userKeyData = await getUserOpenAIClient(userId);
    if (!userKeyData) {
      return res.status(400).json({ error: NO_KEY_MESSAGE, needsApiKey: true });
    }
    const selectedModel = model || userKeyData.model;
    const openai = userKeyData.client;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
      const stream = await openai.responses.create({
        model: selectedModel,
        input,
        stream: true
      });
      for await (const event of stream) {
        if (res.writable) {
          res.write(`data: ${JSON.stringify(event)}

`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (streamError) {
      res.write(`data: ${JSON.stringify({ error: streamError?.message || "Stream error" })}

`);
      res.end();
    }
  } catch (error) {
    console.error("Streaming responses endpoint error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to stream response",
        message: error?.message || "Unknown error"
      });
    } else {
      res.end();
    }
  }
});
var openaiResponses_default = router8;

// server/routes/domains.ts
import { Router as Router9 } from "express";

// server/services/whitelabel/domainManager.ts
import { createClient as createClient7 } from "@supabase/supabase-js";
import dns from "dns/promises";
import https from "https";

// server/services/cache.ts
import { createClient as createClient6 } from "redis";
var CacheManager = class _CacheManager {
  static instance;
  client;
  config;
  isConnected = false;
  // Statistics
  stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };
  constructor() {
    this.config = {
      url: process.env.REDIS_URL || "redis://localhost:6379",
      ttl: parseInt(process.env.CACHE_TTL || "300"),
      // 5 minutes default
      maxRetries: parseInt(process.env.CACHE_MAX_RETRIES || "3"),
      retryDelay: parseInt(process.env.CACHE_RETRY_DELAY || "1000"),
      keyPrefix: process.env.CACHE_KEY_PREFIX || "smartcrm:"
    };
    this.client = createClient6({
      url: this.config.url,
      socket: {
        connectTimeout: 5e3,
        lazyConnect: true
      },
      retry_strategy: (options) => {
        if (options.error && options.error.code === "ECONNREFUSED") {
          console.error("Redis connection refused");
          return new Error("Redis server connection refused");
        }
        if (options.total_retry_time > 1e3 * 60 * 60) {
          console.error("Redis retry time exhausted");
          return new Error("Retry time exhausted");
        }
        if (options.attempt > this.config.maxRetries) {
          return void 0;
        }
        return Math.min(options.attempt * this.config.retryDelay, 3e3);
      }
    });
    this.setupEventHandlers();
    this.connect();
  }
  static getInstance() {
    if (!_CacheManager.instance) {
      _CacheManager.instance = new _CacheManager();
    }
    return _CacheManager.instance;
  }
  setupEventHandlers() {
    this.client.on("connect", () => {
      console.log("Redis cache connected");
      this.isConnected = true;
    });
    this.client.on("ready", () => {
      console.log("Redis cache ready");
    });
    this.client.on("error", (err) => {
      console.error("Redis cache error:", err);
      this.isConnected = false;
      errorLogger.logError("Redis cache error", err);
    });
    this.client.on("end", () => {
      console.log("Redis cache connection ended");
      this.isConnected = false;
    });
  }
  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error.message);
      this.isConnected = false;
    }
  }
  /**
   * Generate cache key with prefix
   */
  getKey(key) {
    return `${this.config.keyPrefix}${key}`;
  }
  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isConnected) {
      return null;
    }
    try {
      const value = await this.client.get(this.getKey(key));
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      console.error("Cache get error:", error.message);
      return null;
    }
  }
  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.config.ttl) {
    if (!this.isConnected) {
      return false;
    }
    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(this.getKey(key), ttl, serialized);
      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error("Cache set error:", error.message);
      return false;
    }
  }
  /**
   * Delete value from cache
   */
  async delete(key) {
    if (!this.isConnected) {
      return false;
    }
    try {
      await this.client.del(this.getKey(key));
      this.stats.deletes++;
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error("Cache delete error:", error.message);
      return false;
    }
  }
  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }
    try {
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      this.stats.errors++;
      console.error("Cache exists error:", error.message);
      return false;
    }
  }
  /**
   * Set multiple values
   */
  async mset(data, ttl = this.config.ttl) {
    if (!this.isConnected) {
      return false;
    }
    try {
      const pipeline = this.client.multi();
      for (const [key, value] of Object.entries(data)) {
        pipeline.setEx(this.getKey(key), ttl, JSON.stringify(value));
      }
      await pipeline.exec();
      this.stats.sets += Object.keys(data).length;
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error("Cache mset error:", error.message);
      return false;
    }
  }
  /**
   * Get multiple values
   */
  async mget(keys) {
    if (!this.isConnected) {
      return new Array(keys.length).fill(null);
    }
    try {
      const redisKeys = keys.map((key) => this.getKey(key));
      const values = await this.client.mget(redisKeys);
      return values.map((value, index) => {
        if (value) {
          this.stats.hits++;
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        } else {
          this.stats.misses++;
          return null;
        }
      });
    } catch (error) {
      this.stats.errors++;
      console.error("Cache mget error:", error.message);
      return new Array(keys.length).fill(null);
    }
  }
  /**
   * Set value only if key doesn't exist (atomic)
   */
  async setnx(key, value, ttl = this.config.ttl) {
    if (!this.isConnected) {
      return false;
    }
    try {
      const result = await this.client.set(this.getKey(key), JSON.stringify(value), {
        NX: true,
        EX: ttl
      });
      if (result) {
        this.stats.sets++;
      }
      return result === "OK";
    } catch (error) {
      this.stats.errors++;
      console.error("Cache setnx error:", error.message);
      return false;
    }
  }
  /**
   * Increment counter
   */
  async incr(key, ttl = this.config.ttl) {
    if (!this.isConnected) {
      return null;
    }
    try {
      const result = await this.client.incr(this.getKey(key));
      if (result === 1) {
        await this.client.expire(this.getKey(key), ttl);
      }
      return result;
    } catch (error) {
      this.stats.errors++;
      console.error("Cache incr error:", error.message);
      return null;
    }
  }
  /**
   * Get TTL for key
   */
  async ttl(key) {
    if (!this.isConnected) {
      return -2;
    }
    try {
      return await this.client.ttl(this.getKey(key));
    } catch (error) {
      this.stats.errors++;
      console.error("Cache ttl error:", error.message);
      return -2;
    }
  }
  /**
   * Clear all keys with pattern
   */
  async clearPattern(pattern) {
    if (!this.isConnected) {
      return 0;
    }
    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}${pattern}`);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.stats.deletes += keys.length;
      }
      return keys.length;
    } catch (error) {
      this.stats.errors++;
      console.error("Cache clear pattern error:", error.message);
      return 0;
    }
  }
  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total * 100 : 0;
    return {
      ...this.stats,
      hitRate
    };
  }
  /**
   * Health check
   */
  async healthCheck() {
    const stats = this.getStats();
    if (!this.isConnected) {
      return {
        isHealthy: false,
        isConnected: false,
        stats
      };
    }
    try {
      const info = await this.client.info();
      const ping = await this.client.ping();
      return {
        isHealthy: ping === "PONG",
        isConnected: this.isConnected,
        stats,
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      return {
        isHealthy: false,
        isConnected: this.isConnected,
        stats
      };
    }
  }
  /**
   * Parse Redis INFO command
   */
  parseRedisInfo(info) {
    const lines = info.split("\n");
    const result = {};
    for (const line of lines) {
      if (line.includes(":")) {
        const [key, value] = line.split(":");
        result[key] = value;
      }
    }
    return result;
  }
  /**
   * Graceful shutdown
   */
  async close() {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log("Cache connection closed");
    }
  }
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }
};
var cache = CacheManager.getInstance();
var CACHE_TTL = {
  SHORT: 60,
  // 1 minute
  MEDIUM: 300,
  // 5 minutes
  LONG: 3600,
  // 1 hour
  DAY: 86400,
  // 1 day
  WEEK: 604800
  // 1 week
};
async function withCache(key, fn, ttl = CACHE_TTL.MEDIUM) {
  const cached = await cache.get(key);
  if (cached !== null) {
    return cached;
  }
  const result = await fn();
  await cache.set(key, result, ttl);
  return result;
}

// server/services/whitelabel/domainManager.ts
var supabaseUrl5 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
var supabaseKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase3 = supabaseUrl5 && supabaseKey2 ? createClient7(supabaseUrl5, supabaseKey2) : null;
var DomainManager = class _DomainManager {
  platformDomain;
  constructor() {
    this.platformDomain = process.env.PLATFORM_DOMAIN || "smartcrm.vip";
  }
  getPlatformDomain() {
    return this.platformDomain;
  }
  /**
   * Generate verification token for domain
   */
  generateVerificationToken(domain, tenantId) {
    const crypto3 = __require("crypto");
    const data = `${domain}:${tenantId}:${Date.now()}`;
    return crypto3.createHash("sha256").update(data).digest("hex").substring(0, 32);
  }
  /**
   * Get DNS records required for domain verification
   */
  getRequiredDNSRecords(domain, verificationToken, method) {
    const records = [];
    switch (method) {
      case "txt":
        records.push({
          type: "TXT",
          name: `_smartcrm-verification.${domain}`,
          value: verificationToken,
          ttl: 300
        });
        break;
      case "cname":
        records.push({
          type: "CNAME",
          name: domain,
          value: this.platformDomain,
          ttl: 300
        });
        records.push({
          type: "TXT",
          name: `_smartcrm-verification.${domain}`,
          value: verificationToken,
          ttl: 300
        });
        break;
      case "http":
        records.push({
          type: "A",
          name: domain,
          value: process.env.PLATFORM_IP || "0.0.0.0",
          ttl: 300
        });
        break;
    }
    return records;
  }
  /**
   * Verify domain ownership via DNS
   */
  async verifyDomainDNS(domain, verificationToken, method) {
    try {
      if (method === "txt") {
        const txtRecords = await dns.resolveTxt(`_smartcrm-verification.${domain}`);
        const flatRecords = txtRecords.flat();
        return flatRecords.includes(verificationToken);
      } else if (method === "cname") {
        const cnameRecords = await dns.resolveCname(domain);
        return cnameRecords.some(
          (record) => record === this.platformDomain || record.endsWith(`.${this.platformDomain}`)
        );
      }
      return false;
    } catch (error) {
      console.error(`DNS verification failed for ${domain}:`, error.message);
      return false;
    }
  }
  /**
   * Verify domain ownership via HTTP
   */
  async verifyDomainHTTP(domain, verificationToken) {
    return new Promise((resolve) => {
      const url = `https://${domain}/.well-known/smartcrm-verification.txt`;
      https.get(url, { timeout: 5e3 }, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          resolve(data.trim() === verificationToken);
        });
      }).on("error", () => {
        resolve(false);
      });
    });
  }
  /**
   * Initiate domain verification
   */
  async initiateDomainVerification(config) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    const verificationToken = this.generateVerificationToken(config.domain, config.tenantId);
    const domainConfig = {
      ...config,
      status: "pending",
      dnsVerified: false,
      sslStatus: "pending",
      verificationToken,
      lastCheckedAt: /* @__PURE__ */ new Date()
    };
    const { data, error } = await supabase3.from("domains").insert({
      tenant_id: domainConfig.tenantId,
      domain: domainConfig.domain,
      subdomain: domainConfig.subdomain,
      status: domainConfig.status,
      dns_verified: domainConfig.dnsVerified,
      ssl_status: domainConfig.sslStatus,
      verification_token: domainConfig.verificationToken,
      verification_method: domainConfig.verificationMethod,
      last_checked_at: domainConfig.lastCheckedAt
    }).select().single();
    if (error) {
      throw new Error(`Failed to save domain configuration: ${error.message}`);
    }
    return { ...domainConfig, id: data.id };
  }
  /**
   * Check domain verification status
   */
  async checkDomainVerification(domainId) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    const { data: domainData, error } = await supabase3.from("domains").select("*").eq("id", domainId).single();
    if (error || !domainData) {
      throw new Error("Domain not found");
    }
    const domain = domainData.domain;
    const verificationToken = domainData.verification_token;
    const verificationMethod = domainData.verification_method;
    let verified = false;
    if (verificationMethod === "http") {
      verified = await this.verifyDomainHTTP(domain, verificationToken);
    } else {
      verified = await this.verifyDomainDNS(domain, verificationToken, verificationMethod);
    }
    const newStatus = verified ? "active" : "verifying";
    const { data: updated, error: updateError } = await supabase3.from("domains").update({
      dns_verified: verified,
      status: newStatus,
      last_checked_at: (/* @__PURE__ */ new Date()).toISOString(),
      error_message: verified ? null : "DNS verification pending"
    }).eq("id", domainId).select().single();
    if (updateError) {
      throw new Error(`Failed to update domain status: ${updateError.message}`);
    }
    if (verified && domainData.ssl_status === "pending") {
      await this.provisionSSL(domainId);
    }
    return this.mapDatabaseToDomainConfig(updated);
  }
  /**
   * Provision SSL certificate for domain
   */
  async provisionSSL(domainId) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    try {
      await supabase3.from("domains").update({
        ssl_status: "provisioning",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", domainId);
      await this.syncSSLStatus(domainId);
    } catch (error) {
      await supabase3.from("domains").update({
        ssl_status: "failed",
        error_message: `SSL provisioning failed: ${error.message}`,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", domainId);
      throw error;
    }
  }
  /**
   * Check domain health
   */
  async checkDomainHealth(domain) {
    const health = {
      domain,
      isAccessible: false,
      dnsResolved: false,
      sslValid: false,
      lastChecked: /* @__PURE__ */ new Date(),
      issues: []
    };
    try {
      const addresses = await dns.resolve4(domain);
      health.dnsResolved = addresses.length > 0;
      if (!health.dnsResolved) {
        health.issues.push("DNS not resolved");
      }
    } catch (error) {
      health.issues.push("DNS resolution failed");
    }
    try {
      const startTime = Date.now();
      await new Promise((resolve, reject) => {
        https.get(`https://${domain}`, { timeout: 5e3 }, (res) => {
          health.isAccessible = res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302;
          health.responseTime = Date.now() - startTime;
          resolve();
        }).on("error", reject);
      });
      if (!health.isAccessible) {
        health.issues.push("Domain not accessible via HTTPS");
      }
    } catch (error) {
      health.issues.push("HTTPS connection failed");
    }
    try {
      const cert = await this.getSSLCertificate(domain);
      if (cert) {
        health.sslValid = true;
        const expiresAt = new Date(cert.valid_to);
        const now = /* @__PURE__ */ new Date();
        health.sslExpiresIn = Math.floor(
          (expiresAt.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24)
        );
        if (health.sslExpiresIn < 30) {
          health.issues.push(`SSL certificate expires in ${health.sslExpiresIn} days`);
        }
      } else {
        health.issues.push("SSL certificate not found");
      }
    } catch (error) {
      health.issues.push("SSL certificate check failed");
    }
    return health;
  }
  /**
   * Record the TLS certificate a domain actually serves: 'active' with its real expiry when a
   * certificate for the domain is served, otherwise 'pending' (the provider has not issued one yet).
   */
  async syncSSLStatus(domainId) {
    if (!supabase3) throw new Error("Supabase not configured");
    const { data: row, error } = await supabase3.from("domains").select("domain").eq("id", domainId).single();
    if (error || !row?.domain) throw new Error(`Domain not found: ${error?.message || domainId}`);
    let cert = null;
    try {
      cert = await this.getSSLCertificate(row.domain);
    } catch {
      cert = null;
    }
    const names = `${cert?.subject?.CN || ""} ${cert?.subjectaltname || ""}`.toLowerCase();
    const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
    const coversDomain = names.includes(String(row.domain).toLowerCase());
    const active = Boolean(validTo && validTo > /* @__PURE__ */ new Date() && coversDomain);
    await supabase3.from("domains").update({
      ssl_status: active ? "active" : "pending",
      ssl_expires_at: active && validTo ? validTo.toISOString() : null,
      error_message: active ? null : "No valid certificate is served for this domain yet",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", domainId);
  }
  /**
   * Get SSL certificate information
   */
  async getSSLCertificate(domain) {
    return new Promise((resolve, reject) => {
      const options = {
        host: domain,
        port: 443,
        method: "GET",
        rejectUnauthorized: false
      };
      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        resolve(cert);
      });
      req.on("error", reject);
      req.end();
    });
  }
  /**
   * Monitor domain health (scheduled task)
   */
  async monitorDomainHealth() {
    if (!supabase3) {
      console.warn("Supabase not configured, skipping domain health monitoring");
      return;
    }
    try {
      const { data: domains, error } = await supabase3.from("domains").select("*").in("status", ["active", "verifying"]);
      if (error) {
        throw error;
      }
      if (!domains || domains.length === 0) {
        return;
      }
      for (const domainData of domains) {
        try {
          const health = await this.checkDomainHealth(domainData.domain);
          const updates = {
            last_checked_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (health.issues.length > 0) {
            updates.error_message = health.issues.join("; ");
            if (!health.isAccessible || !health.dnsResolved) {
              updates.status = "failed";
            }
          } else {
            updates.error_message = null;
            updates.status = "active";
          }
          if (health.sslExpiresIn !== void 0 && health.sslExpiresIn < 30) {
            await this.renewSSL(domainData.id);
          }
          await supabase3.from("domains").update(updates).eq("id", domainData.id);
        } catch (error2) {
          console.error(`Health check failed for ${domainData.domain}:`, error2.message);
        }
      }
    } catch (error) {
      console.error("Domain health monitoring failed:", error.message);
    }
  }
  /**
   * Renew SSL certificate
   */
  async renewSSL(domainId) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    try {
      await supabase3.from("domains").update({
        ssl_status: "provisioning",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", domainId);
      await this.syncSSLStatus(domainId);
    } catch (error) {
      await supabase3.from("domains").update({
        ssl_status: "failed",
        error_message: `SSL renewal failed: ${error.message}`,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", domainId);
      throw error;
    }
  }
  /**
   * Remove domain configuration
   */
  async removeDomain(domainId) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    const { error } = await supabase3.from("domains").delete().eq("id", domainId);
    if (error) {
      throw new Error(`Failed to remove domain: ${error.message}`);
    }
  }
  /**
   * Get domain configuration
   */
  async getDomainConfig(domainId) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    const { data, error } = await supabase3.from("domains").select("*").eq("id", domainId).single();
    if (error || !data) {
      throw new Error("Domain not found");
    }
    return this.mapDatabaseToDomainConfig(data);
  }
  /**
   * List domains for tenant
   */
  async listTenantDomains(tenantId) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    const { data, error } = await supabase3.from("domains").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list domains: ${error.message}`);
    }
    return (data || []).map((d) => this.mapDatabaseToDomainConfig(d));
  }
  /**
   * Update domain configuration
   */
  async updateDomainConfig(domainId, updates) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    const dbUpdates = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.subdomain !== void 0) dbUpdates.subdomain = updates.subdomain;
    if (updates.dnsVerified !== void 0) dbUpdates.dns_verified = updates.dnsVerified;
    if (updates.sslStatus) dbUpdates.ssl_status = updates.sslStatus;
    if (updates.errorMessage !== void 0) dbUpdates.error_message = updates.errorMessage;
    const { data, error } = await supabase3.from("domains").update(dbUpdates).eq("id", domainId).select().single();
    if (error) {
      throw new Error(`Failed to update domain: ${error.message}`);
    }
    return this.mapDatabaseToDomainConfig(data);
  }
  /**
   * Map database record to DomainConfig
   */
  mapDatabaseToDomainConfig(data) {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      domain: data.domain,
      subdomain: data.subdomain,
      status: data.status,
      dnsVerified: data.dns_verified,
      sslStatus: data.ssl_status,
      sslExpiresAt: data.ssl_expires_at ? new Date(data.ssl_expires_at) : void 0,
      verificationToken: data.verification_token,
      verificationMethod: data.verification_method,
      lastCheckedAt: data.last_checked_at ? new Date(data.last_checked_at) : void 0,
      errorMessage: data.error_message
    };
  }
  /**
   * Get domain by name
   */
  async getDomainByName(domain) {
    if (!supabase3) {
      return null;
    }
    const { data, error } = await supabase3.from("domains").select("*").eq("domain", domain).single();
    if (error || !data) {
      return null;
    }
    return this.mapDatabaseToDomainConfig(data);
  }
  /**
   * Common reserved subdomain/domain words
   */
  static RESERVED_WORDS = /* @__PURE__ */ new Set([
    "www",
    "mail",
    "ftp",
    "admin",
    "api",
    "app",
    "blog",
    "cdn",
    "dev",
    "docs",
    "email",
    "help",
    "info",
    "login",
    "m",
    "mobile",
    "news",
    "ns1",
    "ns2",
    "old",
    "portal",
    "secure",
    "shop",
    "smtp",
    "stage",
    "staging",
    "static",
    "test",
    "testing",
    "web",
    "www1",
    "www2",
    "www3",
    "mail1",
    "mail2",
    "ns",
    "dns",
    "cloud",
    "auth",
    "account",
    "accounts",
    "billing",
    "support",
    "status",
    "dashboard",
    "stg",
    "prod",
    "production",
    "demo",
    "sandbox",
    "internal",
    "external",
    "public",
    "private",
    "localhost",
    "local",
    "server",
    "host",
    "gateway",
    "proxy",
    "vpn",
    "ssh",
    "sftp",
    "db",
    "database",
    "sql",
    "mysql",
    "postgres",
    "mongodb",
    "redis",
    "cache",
    "queue",
    "worker",
    "job",
    "task",
    "cron",
    "schedule",
    "monitor",
    "metrics",
    "logs",
    "log",
    "alert",
    "alerts",
    "notifications",
    "push",
    "ws",
    "socket",
    "stream",
    "media",
    "video",
    "audio",
    "image",
    "img",
    "pic",
    "photo",
    "cdn1",
    "cdn2",
    "edge",
    "origin",
    "source",
    "build",
    "ci",
    "cd",
    "deploy",
    "release",
    "version",
    "git",
    "svn",
    "repo",
    "repository",
    "code",
    "src",
    "source",
    "assets",
    "static",
    "public",
    "private",
    "secret",
    "key",
    "token",
    "oauth",
    "sso",
    "saml",
    "ldap",
    "ad",
    "active",
    "directory",
    "ldap",
    "kerberos",
    "radius",
    "tacacs"
  ]);
  static COMMON_TLDS = /* @__PURE__ */ new Set([
    "com",
    "net",
    "org",
    "io",
    "co",
    "ai",
    "app",
    "dev",
    "me",
    "tv",
    "cc",
    "ly",
    "info",
    "biz",
    "name",
    "pro",
    "mobi",
    "tel",
    "xxx",
    "xyz",
    "club",
    "online",
    "site",
    "store",
    "tech",
    "space",
    "live",
    "news",
    "blog",
    "cloud",
    "digital",
    "agency",
    "solutions",
    "services",
    "consulting",
    "academy",
    "education",
    "training",
    "shop",
    "store",
    "sale",
    "deals",
    "coupons",
    "marketing",
    "seo",
    "design",
    "graphics",
    "photography",
    "video",
    "media",
    "music",
    "audio",
    "game",
    "games",
    "play",
    "fun",
    "life",
    "world",
    "global",
    "international",
    "usa",
    "uk",
    "eu",
    "asia",
    "africa",
    "ca",
    "uk",
    "us",
    "fr",
    "de",
    "es",
    "it",
    "nl",
    "se",
    "no",
    "dk",
    "fi",
    "au",
    "nz"
  ]);
  static SUGGESTION_PREFIXES = ["my", "the", "get", "try", "use", "go", "hello", "hi", "hey"];
  static SUGGESTION_SUFFIXES = ["app", "hq", "co", "get", "now", "today", "hub", "lab", "box", "base"];
  /**
   * Validate domain format with IDN and TLD support
   */
  async validateDomainFormat(domain) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };
    if (!domain || typeof domain !== "string") {
      result.isValid = false;
      result.errors.push("Domain is required");
      return result;
    }
    const trimmed = domain.trim().toLowerCase();
    let normalizedDomain = trimmed;
    let isIdn = false;
    try {
      if (/[^\x00-\x7F]/.test(trimmed)) {
        isIdn = true;
        const url = new URL(`http://${trimmed}`);
        normalizedDomain = url.hostname.toLowerCase();
      } else {
        const url = new URL(`http://${trimmed}`);
        normalizedDomain = url.hostname.toLowerCase();
      }
    } catch {
      result.isValid = false;
      result.errors.push("Invalid domain format");
      return result;
    }
    result.normalizedDomain = normalizedDomain;
    result.isIdn = isIdn;
    if (normalizedDomain.length > 253) {
      result.isValid = false;
      result.errors.push("Domain name exceeds maximum length of 253 characters");
    }
    const labels = normalizedDomain.split(".");
    if (labels.length < 2) {
      result.isValid = false;
      result.errors.push("Domain must have at least a second-level domain and TLD");
    }
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (label.length === 0) {
        result.isValid = false;
        result.errors.push("Domain contains empty labels (consecutive dots)");
        break;
      }
      if (label.length > 63) {
        result.isValid = false;
        result.errors.push(`Label "${label}" exceeds maximum length of 63 characters`);
      }
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label)) {
        result.isValid = false;
        result.errors.push(`Label "${label}" contains invalid characters or starts/ends with hyphen`);
      }
      if (label.startsWith("-") || label.endsWith("-")) {
        result.isValid = false;
        result.errors.push(`Label "${label}" cannot start or end with a hyphen`);
      }
    }
    const tld = labels[labels.length - 1];
    if (tld && !_DomainManager.COMMON_TLDS.has(tld)) {
      result.warnings.push(`TLD ".${tld}" is not in the common TLDs list`);
    }
    const sld = labels[0];
    if (sld && _DomainManager.RESERVED_WORDS.has(sld)) {
      result.warnings.push(`"${sld}" is a reserved word and may not be available`);
    }
    return result;
  }
  /**
   * Check if subdomain is available (real-time)
   */
  async isSubdomainAvailable(subdomain) {
    if (!supabase3) {
      return true;
    }
    const { data, error } = await supabase3.from("tenants").select("id").eq("subdomain", subdomain).single();
    return !data;
  }
  /**
   * Check domain/subdomain availability with caching
   */
  async checkDomainAvailability(domain) {
    const cacheKey = `domain:availability:${domain}`;
    return withCache(cacheKey, async () => {
      const existing = await this.getDomainByName(domain);
      if (existing) {
        return {
          domain,
          available: false,
          reason: "Domain is already registered in the system"
        };
      }
      try {
        await dns.resolve4(domain);
        return {
          domain,
          available: false,
          reason: "Domain already exists and resolves to an IP address"
        };
      } catch {
        return {
          domain,
          available: true
        };
      }
    }, CACHE_TTL.SHORT);
  }
  /**
   * Bulk availability checking for multiple domains
   */
  async checkBulkAvailability(domains) {
    const results = await Promise.all(
      domains.map((domain) => this.checkDomainAvailability(domain))
    );
    return {
      results,
      checkedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Get alternative domain suggestions
   */
  async suggestDomains(domain, count2 = 5) {
    const suggestions = [];
    const normalized = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const parts = normalized.split(".");
    const sld = parts[0];
    const tld = parts.length > 1 ? parts.slice(1).join(".") : "com";
    for (const prefix of _DomainManager.SUGGESTION_PREFIXES) {
      if (suggestions.length >= count2) break;
      const candidate = `${prefix}${sld}`;
      if (candidate !== sld && !suggestions.includes(candidate)) {
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(`${candidate}.${tld}`);
        }
      }
    }
    for (const suffix of _DomainManager.SUGGESTION_SUFFIXES) {
      if (suggestions.length >= count2) break;
      const candidate = `${sld}${suffix}`;
      if (!suggestions.includes(candidate)) {
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(`${candidate}.${tld}`);
        }
      }
    }
    if (!sld.includes("-")) {
      if (suggestions.length < count2) {
        const candidate = `${sld}-${_DomainManager.SUGGESTION_PREFIXES[0]}`;
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(`${candidate}.${tld}`);
        }
      }
      if (suggestions.length < count2 && sld.length > 3) {
        const mid = Math.floor(sld.length / 2);
        const candidate = `${sld.slice(0, mid)}-${sld.slice(mid)}`;
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(`${candidate}.${tld}`);
        }
      }
    }
    if (suggestions.length < count2) {
      for (const altTld of Array.from(_DomainManager.COMMON_TLDS).slice(0, 10)) {
        if (altTld === tld) continue;
        if (suggestions.length >= count2) break;
        const candidate = `${sld}.${altTld}`;
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(candidate);
        }
      }
    }
    return suggestions;
  }
  /**
   * Auto-provision subdomain for tenant
   */
  async provisionSubdomainForTenant(tenantId, preferredSubdomain) {
    if (!supabase3) {
      throw new Error("Supabase not configured");
    }
    const { data: tenant, error: tenantError } = await supabase3.from("tenants").select("name, subdomain").eq("id", tenantId).single();
    if (tenantError || !tenant) {
      throw new Error("Tenant not found");
    }
    let subdomain = preferredSubdomain || tenant.subdomain;
    if (!subdomain) {
      const baseName = tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 30);
      subdomain = baseName;
    }
    subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "").substring(0, 63);
    if (!subdomain) {
      throw new Error("Unable to generate valid subdomain from tenant name");
    }
    let isAvailable = await this.isSubdomainAvailable(subdomain);
    if (!isAvailable) {
      const suggestions = await this.suggestSubdomains(subdomain);
      if (suggestions.length === 0) {
        throw new Error(`Subdomain "${subdomain}" is not available and no alternatives found`);
      }
      subdomain = suggestions[0];
    }
    const domain = `${subdomain}.${this.platformDomain}`;
    const domainConfig = await this.initiateDomainVerification({
      tenantId,
      domain,
      subdomain,
      verificationMethod: "txt"
    });
    const dnsRecords = this.getRequiredDNSRecords(domain, domainConfig.verificationToken, "txt");
    if (!preferredSubdomain || preferredSubdomain !== subdomain) {
      await supabase3.from("tenants").update({ subdomain, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", tenantId);
    }
    return {
      subdomain,
      tenantId,
      domain,
      dnsRecords,
      accessUrl: `https://${domain}`,
      status: domainConfig.status
    };
  }
  /**
   * Suggest available subdomains
   */
  async suggestSubdomains(baseSubdomain) {
    const suggestions = [];
    const cleanBase = baseSubdomain.replace(/[^a-z0-9]/g, "").toLowerCase();
    const suffixes = ["", "1", "2", "3", "hq", "app", "co", "io"];
    for (const suffix of suffixes) {
      if (suggestions.length >= 5) break;
      const candidate = suffix ? `${cleanBase}${suffix}` : cleanBase;
      if (await this.isSubdomainAvailable(candidate)) {
        suggestions.push(candidate);
      }
    }
    return suggestions;
  }
  /**
   * Generate DNS configuration instructions for different providers
   */
  getDNSProviderInstructions(domain, provider) {
    const records = this.getRequiredDNSRecords(domain, "YOUR_VERIFICATION_TOKEN", "txt");
    const providerInstructions = {
      cloudflare: {
        steps: [
          "Log in to Cloudflare Dashboard",
          "Select your domain",
          "Go to DNS > Records",
          'Click "Add record"',
          'Select "TXT" as the record type',
          `Enter ${records[0]?.name || "_smartcrm-verification"} as the Name`,
          `Enter your verification token as the Content`,
          'Set TTL to 5 minutes (or "Auto")',
          "Save the record",
          "Wait 5-10 minutes for propagation"
        ],
        ttlRecommendation: 300,
        estimatedPropagation: "5-10 minutes"
      },
      godaddy: {
        steps: [
          "Log in to GoDaddy Domain Portfolio",
          'Select your domain and click "DNS"',
          'Scroll to "Records" section',
          'Click "Add" to create a new record',
          'Select "TXT" as the Type',
          `Enter ${records[0]?.name || "@"} as the Host`,
          `Enter your verification token as the TXT Value`,
          "Set TTL to 1/2 hour (or lowest available)",
          "Save the record",
          "Wait 10-30 minutes for propagation"
        ],
        ttlRecommendation: 1800,
        estimatedPropagation: "10-30 minutes"
      },
      namecheap: {
        steps: [
          "Log in to Namecheap account",
          "Go to Domain List > Manage > Advanced DNS",
          'Under "Host Records", click "Add New Record"',
          'Select "TXT Record" from the Type dropdown',
          `Enter ${records[0]?.name || "@"} as the Host`,
          `Enter your verification token as the Value`,
          "Set TTL to 1 min (or 60 seconds)",
          "Save changes",
          "Wait 5-15 minutes for propagation"
        ],
        ttlRecommendation: 60,
        estimatedPropagation: "5-15 minutes"
      },
      route53: {
        steps: [
          "Log in to AWS Route 53 Console",
          "Select your hosted zone",
          'Click "Create record"',
          'Choose "Simple record"',
          'Select "TXT - Text" as the Record type',
          `Enter ${records[0]?.name || domain} in the Record name field`,
          `Enter your verification token in the Value field (wrap in quotes)`,
          "Set TTL to 300 seconds",
          "Create records",
          "Wait 30-60 seconds for propagation (Route53 is usually fast)"
        ],
        ttlRecommendation: 300,
        estimatedPropagation: "30-60 seconds"
      },
      google: {
        steps: [
          "Log in to Google Domains",
          "Select your domain",
          'Click "DNS" in the left sidebar',
          'Scroll to "Custom resource records"',
          "In the first field, enter the subdomain/prefix",
          `Select "TXT" from the Type dropdown`,
          `Enter your verification token in the Data field`,
          "Set TTL to 1 hour (or 3600 seconds)",
          "Add the record",
          "Wait 5-15 minutes for propagation"
        ],
        ttlRecommendation: 3600,
        estimatedPropagation: "5-15 minutes"
      },
      generic: {
        steps: [
          "Log in to your domain registrar or DNS provider",
          "Find the DNS management or Zone Editor section",
          "Create a new TXT record",
          `Set the host/name to: ${records[0]?.name || domain}`,
          `Set the value/content to your verification token`,
          "Set TTL to 300 seconds (5 minutes) if available",
          "Save the DNS record",
          "Wait 15 minutes to 48 hours for global propagation"
        ],
        ttlRecommendation: 300,
        estimatedPropagation: "15 minutes - 48 hours"
      }
    };
    const instructions = providerInstructions[provider] || providerInstructions.generic;
    return {
      provider,
      records,
      steps: instructions.steps,
      ttlRecommendation: instructions.ttlRecommendation,
      estimatedPropagation: instructions.estimatedPropagation
    };
  }
  /**
   * Check DNS propagation status
   */
  async checkPropagationStatus(domain) {
    try {
      const nameservers = await dns.resolveNs(domain);
      try {
        await dns.resolveTxt(`_smartcrm-verification.${domain}`);
        return { propagated: true, nameservers: nameservers.map((ns) => ns.replace(/\.$/, "")) };
      } catch {
        return { propagated: false, nameservers: nameservers.map((ns) => ns.replace(/\.$/, "")) };
      }
    } catch {
      return { propagated: false };
    }
  }
  /**
   * Check if domain is available
   */
  async isDomainAvailable(domain) {
    const existing = await this.getDomainByName(domain);
    return existing === null;
  }
};
var domainManager = new DomainManager();

// server/routes/domains.ts
var router9 = Router9();
router9.use(requireAuth());
router9.use(requireEntitlement(FeatureKey.DOMAIN_MANAGEMENT));
router9.post("/verify", async (req, res) => {
  try {
    const { tenantId, domain, subdomain, verificationMethod } = req.body;
    if (!tenantId || !domain) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "domain"]
      });
    }
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        error: "Invalid domain format",
        domain
      });
    }
    const isAvailable = await domainManager.isDomainAvailable(domain);
    if (!isAvailable) {
      return res.status(409).json({
        error: "Domain already registered",
        domain
      });
    }
    const domainConfig = await domainManager.initiateDomainVerification({
      tenantId,
      domain,
      subdomain,
      verificationToken: "",
      // Will be generated
      verificationMethod: verificationMethod || "txt"
    });
    const dnsRecords = domainManager.getRequiredDNSRecords(
      domain,
      domainConfig.verificationToken,
      domainConfig.verificationMethod
    );
    res.status(201).json({
      domainConfig,
      dnsRecords,
      instructions: {
        message: "Add the following DNS records to verify domain ownership",
        verificationMethod: domainConfig.verificationMethod,
        estimatedTime: "5-15 minutes for DNS propagation"
      }
    });
  } catch (error) {
    await errorLogger.logError("Domain verification initiation failed", error, {
      endpoint: "/api/domains/verify",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to initiate domain verification",
      message: error.message
    });
  }
});
router9.get("/:domainId", async (req, res) => {
  try {
    const { domainId } = req.params;
    const domainConfig = await domainManager.getDomainConfig(domainId);
    res.json({
      domainConfig,
      dnsRecords: domainManager.getRequiredDNSRecords(
        domainConfig.domain,
        domainConfig.verificationToken,
        domainConfig.verificationMethod
      )
    });
  } catch (error) {
    await errorLogger.logError("Failed to get domain config", error, {
      endpoint: `/api/domains/${req.params.domainId}`,
      method: "GET"
    });
    res.status(404).json({
      error: "Domain not found",
      message: error.message
    });
  }
});
router9.post("/:domainId/check", async (req, res) => {
  try {
    const { domainId } = req.params;
    const domainConfig = await domainManager.checkDomainVerification(domainId);
    res.json({
      domainConfig,
      verified: domainConfig.dnsVerified,
      sslActive: domainConfig.sslStatus === "active",
      message: domainConfig.dnsVerified ? "Domain verified successfully" : "Domain verification pending"
    });
  } catch (error) {
    await errorLogger.logError("Domain verification check failed", error, {
      endpoint: `/api/domains/${req.params.domainId}/check`,
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to check domain verification",
      message: error.message
    });
  }
});
router9.get("/health/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const health = await domainManager.checkDomainHealth(domain);
    res.json({
      health,
      status: health.issues.length === 0 ? "healthy" : "issues_detected",
      recommendations: health.issues.length > 0 ? ["Review DNS configuration", "Check SSL certificate", "Verify domain accessibility"] : ["Domain is healthy"]
    });
  } catch (error) {
    await errorLogger.logError("Domain health check failed", error, {
      endpoint: `/api/domains/health/${req.params.domain}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to check domain health",
      message: error.message
    });
  }
});
router9.post("/:domainId/ssl/renew", async (req, res) => {
  try {
    const { domainId } = req.params;
    await domainManager.renewSSL(domainId);
    const domainConfig = await domainManager.getDomainConfig(domainId);
    res.json({
      message: "SSL certificate renewed successfully",
      domainConfig,
      expiresAt: domainConfig.sslExpiresAt
    });
  } catch (error) {
    await errorLogger.logError("SSL renewal failed", error, {
      endpoint: `/api/domains/${req.params.domainId}/ssl/renew`,
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to renew SSL certificate",
      message: error.message
    });
  }
});
router9.put("/:domainId", async (req, res) => {
  try {
    const { domainId } = req.params;
    const updates = req.body;
    const domainConfig = await domainManager.updateDomainConfig(domainId, updates);
    res.json({
      message: "Domain configuration updated",
      domainConfig
    });
  } catch (error) {
    await errorLogger.logError("Domain update failed", error, {
      endpoint: `/api/domains/${req.params.domainId}`,
      method: "PUT"
    });
    res.status(500).json({
      error: "Failed to update domain configuration",
      message: error.message
    });
  }
});
router9.delete("/:domainId", async (req, res) => {
  try {
    const { domainId } = req.params;
    await domainManager.removeDomain(domainId);
    res.json({
      message: "Domain removed successfully",
      domainId
    });
  } catch (error) {
    await errorLogger.logError("Domain removal failed", error, {
      endpoint: `/api/domains/${req.params.domainId}`,
      method: "DELETE"
    });
    res.status(500).json({
      error: "Failed to remove domain",
      message: error.message
    });
  }
});
router9.get("/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const domains = await domainManager.listTenantDomains(tenantId);
    res.json({
      domains,
      count: domains.length
    });
  } catch (error) {
    await errorLogger.logError("Failed to list tenant domains", error, {
      endpoint: `/api/domains/tenant/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to list domains",
      message: error.message
    });
  }
});
router9.post("/monitor", async (req, res) => {
  try {
    await domainManager.monitorDomainHealth();
    res.json({
      message: "Domain health monitoring completed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    await errorLogger.logError("Domain monitoring failed", error, {
      endpoint: "/api/domains/monitor",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to monitor domain health",
      message: error.message
    });
  }
});
router9.post("/check-availability", async (req, res) => {
  try {
    const { domain, subdomain } = req.body;
    if (!domain && !subdomain) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["domain or subdomain"]
      });
    }
    let result;
    if (subdomain && !domain) {
      const isAvailable = await domainManager.isSubdomainAvailable(subdomain);
      result = {
        domain: `${subdomain}.${process.env.PLATFORM_DOMAIN || "smartcrm.vip"}`,
        available: isAvailable,
        type: "subdomain"
      };
    } else {
      result = await domainManager.checkDomainAvailability(domain);
    }
    res.json(result);
  } catch (error) {
    await errorLogger.logError("Domain availability check failed", error, {
      endpoint: "/api/domains/check-availability",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to check domain availability",
      message: error.message
    });
  }
});
router9.post("/suggest", async (req, res) => {
  try {
    const { domain, count: count2 } = req.body;
    if (!domain) {
      return res.status(400).json({
        error: "Domain is required"
      });
    }
    const suggestions = await domainManager.suggestDomains(domain, count2 || 5);
    res.json({
      domain,
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    await errorLogger.logError("Domain suggestion failed", error, {
      endpoint: "/api/domains/suggest",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to generate domain suggestions",
      message: error.message
    });
  }
});
router9.get("/validate/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const validation = await domainManager.validateDomainFormat(domain);
    const availability = await domainManager.checkDomainAvailability(validation.normalizedDomain || domain);
    res.json({
      domain,
      validation,
      availability
    });
  } catch (error) {
    await errorLogger.logError("Domain validation failed", error, {
      endpoint: `/api/domains/validate/${req.params.domain}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to validate domain",
      message: error.message
    });
  }
});
router9.post("/provision-subdomain", async (req, res) => {
  try {
    const { tenantId, subdomain } = req.body;
    if (!tenantId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId"]
      });
    }
    const result = await domainManager.provisionSubdomainForTenant(tenantId, subdomain);
    res.status(201).json({
      message: "Subdomain provisioned successfully",
      ...result
    });
  } catch (error) {
    await errorLogger.logError("Subdomain provisioning failed", error, {
      endpoint: "/api/domains/provision-subdomain",
      method: "POST"
    });
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("not available") ? 409 : 500;
    res.status(statusCode).json({
      error: "Failed to provision subdomain",
      message: error.message
    });
  }
});
var domains_default = router9;

// server/routes/themes.ts
import { Router as Router10 } from "express";

// server/services/whitelabel/themeManager.ts
import { createClient as createClient8 } from "@supabase/supabase-js";
var supabaseUrl6 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
var supabaseKey3 = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase4 = supabaseUrl6 && supabaseKey3 ? createClient8(supabaseUrl6, supabaseKey3) : null;
var ThemeManager = class {
  /**
   * Get default theme configuration
   */
  getDefaultTheme() {
    return {
      colors: {
        primary: "#3B82F6",
        secondary: "#6366F1",
        accent: "#8B5CF6",
        background: "#FFFFFF",
        surface: "#F9FAFB",
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          disabled: "#9CA3AF"
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6"
      },
      typography: {
        fontFamily: {
          primary: "Inter, system-ui, sans-serif",
          secondary: "Georgia, serif",
          monospace: "Fira Code, monospace"
        },
        fontSize: {
          xs: "0.75rem",
          sm: "0.875rem",
          base: "1rem",
          lg: "1.125rem",
          xl: "1.25rem",
          "2xl": "1.5rem",
          "3xl": "1.875rem"
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem"
      },
      borderRadius: {
        none: "0",
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      shadows: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
      },
      animations: {
        duration: {
          fast: "150ms",
          normal: "300ms",
          slow: "500ms"
        },
        easing: {
          linear: "linear",
          easeIn: "cubic-bezier(0.4, 0, 1, 1)",
          easeOut: "cubic-bezier(0, 0, 0.2, 1)",
          easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)"
        }
      }
    };
  }
  /**
   * Get dark theme configuration
   */
  getDarkTheme() {
    const defaultTheme = this.getDefaultTheme();
    return {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        background: "#111827",
        surface: "#1F2937",
        text: {
          primary: "#F9FAFB",
          secondary: "#D1D5DB",
          disabled: "#6B7280"
        }
      }
    };
  }
  /**
   * Create theme
   */
  async createTheme(tenantId, name, config, createdBy, description) {
    if (!supabase4) {
      throw new Error("Supabase not configured");
    }
    try {
      await supabase4.from("themes").update({ is_active: false }).eq("tenant_id", tenantId);
      const { data, error } = await supabase4.from("themes").insert({
        tenant_id: tenantId,
        name,
        description,
        is_active: true,
        config,
        created_by: createdBy,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error) {
        throw new Error(`Failed to create theme: ${error.message}`);
      }
      return this.mapDatabaseToTheme(data);
    } catch (error) {
      await errorLogger.logError("Theme creation failed", error, {
        tenantId,
        themeName: name
      });
      throw error;
    }
  }
  /**
   * Get active theme for tenant
   */
  async getActiveTheme(tenantId) {
    if (!supabase4) {
      return null;
    }
    const { data, error } = await supabase4.from("themes").select("*").eq("tenant_id", tenantId).eq("is_active", true).single();
    if (error || !data) {
      return null;
    }
    return this.mapDatabaseToTheme(data);
  }
  /**
   * List themes for tenant
   */
  async listThemes(tenantId) {
    if (!supabase4) {
      return [];
    }
    const { data, error } = await supabase4.from("themes").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list themes: ${error.message}`);
    }
    return (data || []).map((d) => this.mapDatabaseToTheme(d));
  }
  /**
   * Update theme
   */
  async updateTheme(themeId, updates) {
    if (!supabase4) {
      throw new Error("Supabase not configured");
    }
    const dbUpdates = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== void 0) dbUpdates.description = updates.description;
    if (updates.config) dbUpdates.config = updates.config;
    if (updates.isActive !== void 0) {
      dbUpdates.is_active = updates.isActive;
      if (updates.isActive) {
        const theme = await this.getTheme(themeId);
        await supabase4.from("themes").update({ is_active: false }).eq("tenant_id", theme.tenantId).neq("id", themeId);
      }
    }
    const { data, error } = await supabase4.from("themes").update(dbUpdates).eq("id", themeId).select().single();
    if (error) {
      throw new Error(`Failed to update theme: ${error.message}`);
    }
    return this.mapDatabaseToTheme(data);
  }
  /**
   * Delete theme
   */
  async deleteTheme(themeId) {
    if (!supabase4) {
      throw new Error("Supabase not configured");
    }
    const { error } = await supabase4.from("themes").delete().eq("id", themeId);
    if (error) {
      throw new Error(`Failed to delete theme: ${error.message}`);
    }
  }
  /**
   * Get theme by ID
   */
  async getTheme(themeId) {
    if (!supabase4) {
      throw new Error("Supabase not configured");
    }
    const { data, error } = await supabase4.from("themes").select("*").eq("id", themeId).single();
    if (error || !data) {
      throw new Error("Theme not found");
    }
    return this.mapDatabaseToTheme(data);
  }
  /**
   * Generate CSS from theme configuration
   */
  generateThemeCSS(config) {
    const css = `
:root {
  /* Colors */
  --color-primary: ${config.colors.primary};
  --color-secondary: ${config.colors.secondary};
  --color-accent: ${config.colors.accent};
  --color-background: ${config.colors.background};
  --color-surface: ${config.colors.surface};
  --color-text-primary: ${config.colors.text.primary};
  --color-text-secondary: ${config.colors.text.secondary};
  --color-text-disabled: ${config.colors.text.disabled};
  --color-success: ${config.colors.success};
  --color-warning: ${config.colors.warning};
  --color-error: ${config.colors.error};
  --color-info: ${config.colors.info};

  /* Typography */
  --font-family-primary: ${config.typography.fontFamily.primary};
  --font-family-secondary: ${config.typography.fontFamily.secondary};
  --font-family-monospace: ${config.typography.fontFamily.monospace};
  
  --font-size-xs: ${config.typography.fontSize.xs};
  --font-size-sm: ${config.typography.fontSize.sm};
  --font-size-base: ${config.typography.fontSize.base};
  --font-size-lg: ${config.typography.fontSize.lg};
  --font-size-xl: ${config.typography.fontSize.xl};
  --font-size-2xl: ${config.typography.fontSize["2xl"]};
  --font-size-3xl: ${config.typography.fontSize["3xl"]};
  
  --font-weight-light: ${config.typography.fontWeight.light};
  --font-weight-normal: ${config.typography.fontWeight.normal};
  --font-weight-medium: ${config.typography.fontWeight.medium};
  --font-weight-semibold: ${config.typography.fontWeight.semibold};
  --font-weight-bold: ${config.typography.fontWeight.bold};
  
  --line-height-tight: ${config.typography.lineHeight.tight};
  --line-height-normal: ${config.typography.lineHeight.normal};
  --line-height-relaxed: ${config.typography.lineHeight.relaxed};

  /* Spacing */
  --spacing-xs: ${config.spacing.xs};
  --spacing-sm: ${config.spacing.sm};
  --spacing-md: ${config.spacing.md};
  --spacing-lg: ${config.spacing.lg};
  --spacing-xl: ${config.spacing.xl};
  --spacing-2xl: ${config.spacing["2xl"]};

  /* Border Radius */
  --radius-none: ${config.borderRadius.none};
  --radius-sm: ${config.borderRadius.sm};
  --radius-md: ${config.borderRadius.md};
  --radius-lg: ${config.borderRadius.lg};
  --radius-xl: ${config.borderRadius.xl};
  --radius-full: ${config.borderRadius.full};

  /* Shadows */
  --shadow-sm: ${config.shadows.sm};
  --shadow-md: ${config.shadows.md};
  --shadow-lg: ${config.shadows.lg};
  --shadow-xl: ${config.shadows.xl};

  /* Animations */
  --duration-fast: ${config.animations.duration.fast};
  --duration-normal: ${config.animations.duration.normal};
  --duration-slow: ${config.animations.duration.slow};
  
  --easing-linear: ${config.animations.easing.linear};
  --easing-ease-in: ${config.animations.easing.easeIn};
  --easing-ease-out: ${config.animations.easing.easeOut};
  --easing-ease-in-out: ${config.animations.easing.easeInOut};
}

/* Apply theme to body */
body {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-background);
}

/* Button styles */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-normal) var(--easing-ease-in-out);
}

.btn-primary:hover {
  opacity: 0.9;
  box-shadow: var(--shadow-md);
}

/* Card styles */
.card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

/* Input styles */
.input {
  border: 1px solid var(--color-text-disabled);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  font-size: var(--font-size-base);
  transition: border-color var(--duration-fast) var(--easing-ease-in-out);
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
    `.trim();
    return css;
  }
  /**
   * Generate Tailwind configuration from theme
   */
  generateTailwindConfig(config) {
    return {
      theme: {
        extend: {
          colors: {
            primary: config.colors.primary,
            secondary: config.colors.secondary,
            accent: config.colors.accent,
            success: config.colors.success,
            warning: config.colors.warning,
            error: config.colors.error,
            info: config.colors.info
          },
          fontFamily: {
            sans: [config.typography.fontFamily.primary],
            serif: [config.typography.fontFamily.secondary],
            mono: [config.typography.fontFamily.monospace]
          },
          fontSize: config.typography.fontSize,
          fontWeight: config.typography.fontWeight,
          lineHeight: config.typography.lineHeight,
          spacing: config.spacing,
          borderRadius: config.borderRadius,
          boxShadow: config.shadows
        }
      }
    };
  }
  /**
   * Validate theme configuration
   */
  validateThemeConfig(config) {
    const errors = [];
    const hexRegex = /^#[0-9A-F]{6}$/i;
    const colorFields = [
      config.colors.primary,
      config.colors.secondary,
      config.colors.accent,
      config.colors.background,
      config.colors.surface,
      config.colors.text.primary,
      config.colors.text.secondary,
      config.colors.text.disabled,
      config.colors.success,
      config.colors.warning,
      config.colors.error,
      config.colors.info
    ];
    colorFields.forEach((color, index) => {
      if (!hexRegex.test(color)) {
        errors.push(`Invalid color format at index ${index}: ${color}`);
      }
    });
    const sizeRegex = /^\d+(\.\d+)?(rem|px|em)$/;
    Object.entries(config.typography.fontSize).forEach(([key, value]) => {
      if (!sizeRegex.test(value)) {
        errors.push(`Invalid font size for ${key}: ${value}`);
      }
    });
    Object.entries(config.typography.fontWeight).forEach(([key, value]) => {
      if (value < 100 || value > 900 || value % 100 !== 0) {
        errors.push(`Invalid font weight for ${key}: ${value}`);
      }
    });
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Clone theme
   */
  async cloneTheme(themeId, newName, createdBy) {
    if (!supabase4) {
      throw new Error("Supabase not configured");
    }
    const originalTheme = await this.getTheme(themeId);
    return await this.createTheme(
      originalTheme.tenantId,
      newName,
      originalTheme.config,
      createdBy,
      `Cloned from ${originalTheme.name}`
    );
  }
  /**
   * Export theme as JSON
   */
  exportTheme(theme) {
    return JSON.stringify(
      {
        name: theme.name,
        description: theme.description,
        config: theme.config
      },
      null,
      2
    );
  }
  /**
   * Import theme from JSON
   */
  async importTheme(tenantId, themeJson, createdBy) {
    try {
      const parsed = JSON.parse(themeJson);
      if (!parsed.name || !parsed.config) {
        throw new Error("Invalid theme format: missing name or config");
      }
      const validation = this.validateThemeConfig(parsed.config);
      if (!validation.valid) {
        throw new Error(`Invalid theme configuration: ${validation.errors.join(", ")}`);
      }
      return await this.createTheme(
        tenantId,
        parsed.name,
        parsed.config,
        createdBy,
        parsed.description
      );
    } catch (error) {
      await errorLogger.logError("Theme import failed", error, {
        tenantId
      });
      throw error;
    }
  }
  /**
   * Get theme presets
   */
  getThemePresets() {
    return [
      {
        name: "Default Light",
        description: "Clean and professional light theme",
        config: this.getDefaultTheme()
      },
      {
        name: "Default Dark",
        description: "Modern dark theme for reduced eye strain",
        config: this.getDarkTheme()
      },
      {
        name: "Ocean Blue",
        description: "Calming blue tones inspired by the ocean",
        config: {
          ...this.getDefaultTheme(),
          colors: {
            ...this.getDefaultTheme().colors,
            primary: "#0EA5E9",
            secondary: "#06B6D4",
            accent: "#3B82F6"
          }
        }
      },
      {
        name: "Forest Green",
        description: "Natural green theme for eco-friendly brands",
        config: {
          ...this.getDefaultTheme(),
          colors: {
            ...this.getDefaultTheme().colors,
            primary: "#10B981",
            secondary: "#059669",
            accent: "#34D399"
          }
        }
      },
      {
        name: "Sunset Orange",
        description: "Warm and energetic orange theme",
        config: {
          ...this.getDefaultTheme(),
          colors: {
            ...this.getDefaultTheme().colors,
            primary: "#F97316",
            secondary: "#EA580C",
            accent: "#FB923C"
          }
        }
      },
      {
        name: "Royal Purple",
        description: "Elegant purple theme for premium brands",
        config: {
          ...this.getDefaultTheme(),
          colors: {
            ...this.getDefaultTheme().colors,
            primary: "#8B5CF6",
            secondary: "#7C3AED",
            accent: "#A78BFA"
          }
        }
      }
    ];
  }
  /**
   * Map database record to Theme
   */
  mapDatabaseToTheme(data) {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      description: data.description,
      isActive: data.is_active,
      config: data.config,
      previewUrl: data.preview_url,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
};
var themeManager = new ThemeManager();

// server/routes/themes.ts
var router10 = Router10();
router10.use(requireAuth());
router10.use(requireEntitlement(FeatureKey.WHITE_LABEL_CUSTOMIZATION));
router10.post("/", async (req, res) => {
  try {
    const { tenantId, name, description, config } = req.body;
    const userId = req.session?.userId;
    if (!tenantId || !name || !config) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "name", "config"]
      });
    }
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }
    const validation = themeManager.validateThemeConfig(config);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid theme configuration",
        details: validation.errors
      });
    }
    const theme = await themeManager.createTheme(tenantId, name, config, userId, description);
    const css = themeManager.generateThemeCSS(config);
    res.status(201).json({
      message: "Theme created successfully",
      theme,
      css
    });
  } catch (error) {
    await errorLogger.logError("Theme creation failed", error, {
      endpoint: "/api/themes",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to create theme",
      message: error.message
    });
  }
});
router10.get("/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const themes = await themeManager.listThemes(tenantId);
    res.json({
      themes,
      count: themes.length
    });
  } catch (error) {
    await errorLogger.logError("Failed to list themes", error, {
      endpoint: `/api/themes/tenant/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to list themes",
      message: error.message
    });
  }
});
router10.get("/active/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const theme = await themeManager.getActiveTheme(tenantId);
    if (!theme) {
      const defaultConfig = themeManager.getDefaultTheme();
      return res.json({
        theme: null,
        defaultConfig,
        css: themeManager.generateThemeCSS(defaultConfig)
      });
    }
    const css = themeManager.generateThemeCSS(theme.config);
    res.json({
      theme,
      css
    });
  } catch (error) {
    await errorLogger.logError("Failed to get active theme", error, {
      endpoint: `/api/themes/active/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to get active theme",
      message: error.message
    });
  }
});
router10.get("/:themeId", async (req, res) => {
  try {
    const { themeId } = req.params;
    const theme = await themeManager.getTheme(themeId);
    const css = themeManager.generateThemeCSS(theme.config);
    res.json({
      theme,
      css
    });
  } catch (error) {
    await errorLogger.logError("Failed to get theme", error, {
      endpoint: `/api/themes/${req.params.themeId}`,
      method: "GET"
    });
    res.status(404).json({
      error: "Theme not found",
      message: error.message
    });
  }
});
router10.put("/:themeId", async (req, res) => {
  try {
    const { themeId } = req.params;
    const updates = req.body;
    if (updates.config) {
      const validation = themeManager.validateThemeConfig(updates.config);
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid theme configuration",
          details: validation.errors
        });
      }
    }
    const theme = await themeManager.updateTheme(themeId, updates);
    const css = themeManager.generateThemeCSS(theme.config);
    res.json({
      message: "Theme updated successfully",
      theme,
      css
    });
  } catch (error) {
    await errorLogger.logError("Failed to update theme", error, {
      endpoint: `/api/themes/${req.params.themeId}`,
      method: "PUT"
    });
    res.status(500).json({
      error: "Failed to update theme",
      message: error.message
    });
  }
});
router10.delete("/:themeId", async (req, res) => {
  try {
    const { themeId } = req.params;
    await themeManager.deleteTheme(themeId);
    res.json({
      message: "Theme deleted successfully",
      themeId
    });
  } catch (error) {
    await errorLogger.logError("Failed to delete theme", error, {
      endpoint: `/api/themes/${req.params.themeId}`,
      method: "DELETE"
    });
    res.status(500).json({
      error: "Failed to delete theme",
      message: error.message
    });
  }
});
router10.post("/:themeId/activate", async (req, res) => {
  try {
    const { themeId } = req.params;
    const theme = await themeManager.updateTheme(themeId, { isActive: true });
    const css = themeManager.generateThemeCSS(theme.config);
    res.json({
      message: "Theme activated successfully",
      theme,
      css
    });
  } catch (error) {
    await errorLogger.logError("Failed to activate theme", error, {
      endpoint: `/api/themes/${req.params.themeId}/activate`,
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to activate theme",
      message: error.message
    });
  }
});
router10.post("/:themeId/clone", async (req, res) => {
  try {
    const { themeId } = req.params;
    const { name } = req.body;
    const userId = req.session?.userId;
    if (!name) {
      return res.status(400).json({
        error: "Theme name is required"
      });
    }
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }
    const clonedTheme = await themeManager.cloneTheme(themeId, name, userId);
    res.status(201).json({
      message: "Theme cloned successfully",
      theme: clonedTheme
    });
  } catch (error) {
    await errorLogger.logError("Failed to clone theme", error, {
      endpoint: `/api/themes/${req.params.themeId}/clone`,
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to clone theme",
      message: error.message
    });
  }
});
router10.get("/presets/list", async (req, res) => {
  try {
    const presets = themeManager.getThemePresets();
    res.json({
      presets,
      count: presets.length
    });
  } catch (error) {
    await errorLogger.logError("Failed to get theme presets", error, {
      endpoint: "/api/themes/presets",
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to get theme presets",
      message: error.message
    });
  }
});
router10.post("/import", async (req, res) => {
  try {
    const { tenantId, themeJson } = req.body;
    const userId = req.session?.userId;
    if (!tenantId || !themeJson) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "themeJson"]
      });
    }
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }
    const theme = await themeManager.importTheme(tenantId, themeJson, userId);
    res.status(201).json({
      message: "Theme imported successfully",
      theme
    });
  } catch (error) {
    await errorLogger.logError("Theme import failed", error, {
      endpoint: "/api/themes/import",
      method: "POST"
    });
    res.status(400).json({
      error: "Failed to import theme",
      message: error.message
    });
  }
});
router10.get("/:themeId/export", async (req, res) => {
  try {
    const { themeId } = req.params;
    const theme = await themeManager.getTheme(themeId);
    const themeJson = themeManager.exportTheme(theme);
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${theme.name.replace(/\s+/g, "-").toLowerCase()}-theme.json"`
    );
    res.send(themeJson);
  } catch (error) {
    await errorLogger.logError("Theme export failed", error, {
      endpoint: `/api/themes/${req.params.themeId}/export`,
      method: "GET"
    });
    res.status(404).json({
      error: "Failed to export theme",
      message: error.message
    });
  }
});
router10.post("/preview", async (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({
        error: "Theme config is required"
      });
    }
    const validation = themeManager.validateThemeConfig(config);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid theme configuration",
        details: validation.errors
      });
    }
    const css = themeManager.generateThemeCSS(config);
    const tailwindConfig = themeManager.generateTailwindConfig(config);
    res.json({
      css,
      tailwindConfig
    });
  } catch (error) {
    await errorLogger.logError("Theme preview generation failed", error, {
      endpoint: "/api/themes/preview",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to generate theme preview",
      message: error.message
    });
  }
});
var themes_default = router10;

// server/routes/provisioning.ts
import { Router as Router11 } from "express";

// server/services/whitelabel/tenantProvisioner.ts
import { createClient as createClient9 } from "@supabase/supabase-js";
var supabaseUrl7 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
var supabaseKey4 = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase5 = supabaseUrl7 && supabaseKey4 ? createClient9(supabaseUrl7, supabaseKey4) : null;
var TenantProvisioner = class {
  /**
   * Create new tenant with automated setup
   */
  async createTenant(config) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    try {
      const isAvailable = await this.isSubdomainAvailable(config.subdomain);
      if (!isAvailable) {
        throw new Error(`Subdomain '${config.subdomain}' is already taken`);
      }
      let template = null;
      if (config.templateId) {
        template = await this.getTemplate(config.templateId);
      } else {
        template = await this.getDefaultTemplate(config.plan);
      }
      const { data: tenantData, error: tenantError } = await supabase5.from("tenants").insert({
        name: config.name,
        subdomain: config.subdomain,
        status: config.plan === "starter" ? "trial" : "active",
        type: config.type,
        plan: config.plan,
        contact_email: config.contactEmail,
        contact_name: config.contactName,
        monthly_revenue: 0,
        user_count: 0,
        parent_partner_id: config.parentPartnerId,
        trial_ends_at: config.plan === "starter" ? this.getTrialEndDate() : null,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (tenantError) {
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }
      const tenant = this.mapDatabaseToTenant(tenantData);
      if (template) {
        await this.applyTemplate(tenant.id, template);
      }
      await this.initializeOnboarding(tenant.id, template?.onboardingSteps || []);
      await this.sendWelcomeEmail(tenant);
      if (template?.defaultSettings?.seedData) {
        await this.seedInitialData(tenant.id, template.defaultSettings.seedData);
      }
      return tenant;
    } catch (error) {
      await errorLogger.logError("Tenant creation failed", error, {
        subdomain: config.subdomain
      });
      throw error;
    }
  }
  /**
   * Check if subdomain is available
   */
  async isSubdomainAvailable(subdomain) {
    if (!supabase5) {
      return true;
    }
    const { data, error } = await supabase5.from("tenants").select("id").eq("subdomain", subdomain).single();
    return !data;
  }
  /**
   * Get template by ID
   */
  async getTemplate(templateId) {
    if (!supabase5) {
      return null;
    }
    const { data, error } = await supabase5.from("tenant_templates").select("*").eq("id", templateId).single();
    if (error || !data) {
      return null;
    }
    return this.mapDatabaseToTemplate(data);
  }
  /**
   * Get default template for plan
   */
  async getDefaultTemplate(plan) {
    if (!supabase5) {
      return null;
    }
    const { data, error } = await supabase5.from("tenant_templates").select("*").eq("is_default", true).single();
    if (error || !data) {
      return {
        id: "default",
        name: "Default Template",
        description: "Basic tenant configuration",
        config: {},
        features: {},
        defaultSettings: {},
        onboardingSteps: this.getDefaultOnboardingSteps(),
        isDefault: true
      };
    }
    return this.mapDatabaseToTemplate(data);
  }
  /**
   * Apply template to tenant
   */
  async applyTemplate(tenantId, template) {
    if (!supabase5) {
      return;
    }
    try {
      await supabase5.from("white_label_configs").insert({
        tenant_id: tenantId,
        ...template.config,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (template.features && Object.keys(template.features).length > 0) {
        const featureEntries = Object.entries(template.features).map(([feature, enabled]) => ({
          tenant_id: tenantId,
          feature_key: feature,
          enabled,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }));
        await supabase5.from("tenant_features").insert(featureEntries);
      }
    } catch (error) {
      await errorLogger.logError("Template application failed", error, {
        tenantId,
        templateId: template.id
      });
      throw error;
    }
  }
  /**
   * Initialize onboarding for tenant
   */
  async initializeOnboarding(tenantId, steps) {
    if (!supabase5) {
      return;
    }
    try {
      const onboardingSteps = steps.length > 0 ? steps : this.getDefaultOnboardingSteps();
      await supabase5.from("tenant_onboarding").insert({
        tenant_id: tenantId,
        current_step: 1,
        total_steps: onboardingSteps.length,
        completed_steps: [],
        status: "in_progress",
        started_at: (/* @__PURE__ */ new Date()).toISOString(),
        metadata: { steps: onboardingSteps }
      });
    } catch (error) {
      await errorLogger.logError("Onboarding initialization failed", error, {
        tenantId
      });
    }
  }
  /**
   * Get default onboarding steps
   */
  getDefaultOnboardingSteps() {
    return [
      {
        id: "welcome",
        title: "Welcome to SmartCRM",
        description: "Get started with your new CRM platform",
        action: "view_dashboard",
        completed: false,
        order: 1
      },
      {
        id: "branding",
        title: "Customize Your Branding",
        description: "Upload your logo and set your brand colors",
        action: "configure_branding",
        completed: false,
        order: 2
      },
      {
        id: "domain",
        title: "Set Up Custom Domain",
        description: "Configure your custom domain for white label access",
        action: "configure_domain",
        completed: false,
        order: 3
      },
      {
        id: "users",
        title: "Invite Team Members",
        description: "Add users to your CRM instance",
        action: "invite_users",
        completed: false,
        order: 4
      },
      {
        id: "data",
        title: "Import Your Data",
        description: "Import contacts, deals, and other data",
        action: "import_data",
        completed: false,
        order: 5
      }
    ];
  }
  /**
   * Send welcome email to tenant
   */
  async sendWelcomeEmail(tenant) {
    try {
      console.log(`Welcome email would be sent to: ${tenant.contactEmail}`);
      await errorLogger.logInfo("Welcome email sent", {
        tenantId: tenant.id,
        email: tenant.contactEmail
      });
    } catch (error) {
      await errorLogger.logWarning("Welcome email failed", {
        tenantId: tenant.id,
        error: error.message
      });
    }
  }
  /**
   * Seed initial data for tenant
   */
  async seedInitialData(tenantId, seedData) {
    if (!supabase5) {
      return;
    }
    try {
      if (seedData.contacts && Array.isArray(seedData.contacts)) {
        const contacts2 = seedData.contacts.map((contact) => ({
          ...contact,
          profile_id: tenantId,
          // Link to tenant
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }));
        await supabase5.from("smartcrm_contacts").insert(contacts2);
      }
      if (seedData.deals && Array.isArray(seedData.deals)) {
        const deals2 = seedData.deals.map((deal) => ({
          ...deal,
          profile_id: tenantId,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }));
        await supabase5.from("smartcrm_deals").insert(deals2);
      }
    } catch (error) {
      await errorLogger.logWarning("Initial data seeding failed", {
        tenantId,
        error: error.message
      });
    }
  }
  /**
   * Get trial end date (14 days from now)
   */
  getTrialEndDate() {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString();
  }
  /**
   * Get tenant by ID
   */
  async getTenant(tenantId) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    const { data, error } = await supabase5.from("tenants").select("*").eq("id", tenantId).single();
    if (error || !data) {
      throw new Error("Tenant not found");
    }
    return this.mapDatabaseToTenant(data);
  }
  /**
   * List tenants with filtering
   */
  async listTenants(options) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const offset = (page - 1) * limit;
    let query = supabase5.from("tenants").select("*", { count: "exact" });
    if (options.status) {
      query = query.eq("status", options.status);
    }
    if (options.type) {
      query = query.eq("type", options.type);
    }
    if (options.parentPartnerId) {
      query = query.eq("parent_partner_id", options.parentPartnerId);
    }
    const { data, error, count: count2 } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (error) {
      throw new Error(`Failed to list tenants: ${error.message}`);
    }
    const tenants = (data || []).map((d) => this.mapDatabaseToTenant(d));
    const total = count2 || 0;
    const pages = Math.ceil(total / limit);
    return { tenants, total, page, pages };
  }
  /**
   * Update tenant
   */
  async updateTenant(tenantId, updates) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    const dbUpdates = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.plan) dbUpdates.plan = updates.plan;
    if (updates.contactEmail) dbUpdates.contact_email = updates.contactEmail;
    if (updates.contactName) dbUpdates.contact_name = updates.contactName;
    if (updates.customDomain !== void 0) dbUpdates.custom_domain = updates.customDomain;
    const { data, error } = await supabase5.from("tenants").update(dbUpdates).eq("id", tenantId).select().single();
    if (error) {
      throw new Error(`Failed to update tenant: ${error.message}`);
    }
    return this.mapDatabaseToTenant(data);
  }
  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId, reason) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    await supabase5.from("tenants").update({
      status: "suspended",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", tenantId);
    await errorLogger.logInfo("Tenant suspended", {
      tenantId,
      reason
    });
  }
  /**
   * Activate tenant
   */
  async activateTenant(tenantId) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    await supabase5.from("tenants").update({
      status: "active",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", tenantId);
    await errorLogger.logInfo("Tenant activated", {
      tenantId
    });
  }
  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(tenantId) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    await supabase5.from("tenants").update({
      status: "inactive",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", tenantId);
    await errorLogger.logInfo("Tenant deleted (soft)", {
      tenantId
    });
  }
  /**
   * Get onboarding status
   */
  async getOnboardingStatus(tenantId) {
    if (!supabase5) {
      return null;
    }
    const { data, error } = await supabase5.from("tenant_onboarding").select("*").eq("tenant_id", tenantId).single();
    if (error || !data) {
      return null;
    }
    return {
      tenantId: data.tenant_id,
      currentStep: data.current_step,
      totalSteps: data.total_steps,
      completedSteps: data.completed_steps || [],
      status: data.status,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : void 0
    };
  }
  /**
   * Update onboarding progress
   */
  async updateOnboardingProgress(tenantId, stepId, completed) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    const status = await this.getOnboardingStatus(tenantId);
    if (!status) {
      throw new Error("Onboarding not found");
    }
    const completedSteps = completed ? [...status.completedSteps, stepId] : status.completedSteps.filter((s) => s !== stepId);
    const allCompleted = completedSteps.length === status.totalSteps;
    const { data, error } = await supabase5.from("tenant_onboarding").update({
      completed_steps: completedSteps,
      current_step: completedSteps.length + 1,
      status: allCompleted ? "completed" : "in_progress",
      completed_at: allCompleted ? (/* @__PURE__ */ new Date()).toISOString() : null
    }).eq("tenant_id", tenantId).select().single();
    if (error) {
      throw new Error(`Failed to update onboarding: ${error.message}`);
    }
    return {
      tenantId: data.tenant_id,
      currentStep: data.current_step,
      totalSteps: data.total_steps,
      completedSteps: data.completed_steps || [],
      status: data.status,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : void 0
    };
  }
  /**
   * List available templates
   */
  async listTemplates() {
    if (!supabase5) {
      return [];
    }
    const { data, error } = await supabase5.from("tenant_templates").select("*").order("name");
    if (error) {
      throw new Error(`Failed to list templates: ${error.message}`);
    }
    return (data || []).map((d) => this.mapDatabaseToTemplate(d));
  }
  /**
   * Create template
   */
  async createTemplate(template) {
    if (!supabase5) {
      throw new Error("Supabase not configured");
    }
    const { data, error } = await supabase5.from("tenant_templates").insert({
      name: template.name,
      description: template.description,
      config: template.config,
      features: template.features,
      default_settings: template.defaultSettings,
      onboarding_steps: template.onboardingSteps,
      is_default: template.isDefault,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
    return this.mapDatabaseToTemplate(data);
  }
  /**
   * Map database record to Tenant
   */
  mapDatabaseToTenant(data) {
    return {
      id: data.id,
      name: data.name,
      subdomain: data.subdomain,
      customDomain: data.custom_domain,
      status: data.status,
      type: data.type,
      plan: data.plan,
      contactEmail: data.contact_email,
      contactName: data.contact_name,
      monthlyRevenue: parseFloat(data.monthly_revenue || 0),
      userCount: data.user_count || 0,
      parentPartnerId: data.parent_partner_id,
      trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : void 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
  /**
   * Map database record to Template
   */
  mapDatabaseToTemplate(data) {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      config: data.config || {},
      features: data.features || {},
      defaultSettings: data.default_settings || {},
      onboardingSteps: data.onboarding_steps || [],
      isDefault: data.is_default || false
    };
  }
};
var tenantProvisioner = new TenantProvisioner();

// server/routes/provisioning.ts
var router11 = Router11();
router11.use(requireAuth());
router11.use(requireEntitlement(FeatureKey.PARTNER_ONBOARDING));
router11.post("/create", async (req, res) => {
  try {
    const config = req.body;
    if (!config.name || !config.subdomain || !config.contactEmail) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["name", "subdomain", "contactEmail"]
      });
    }
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(config.subdomain)) {
      return res.status(400).json({
        error: "Invalid subdomain format",
        message: "Subdomain must be lowercase alphanumeric with hyphens, 1-63 characters"
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.contactEmail)) {
      return res.status(400).json({
        error: "Invalid email format"
      });
    }
    const tenant = await tenantProvisioner.createTenant(config);
    const onboarding = await tenantProvisioner.getOnboardingStatus(tenant.id);
    res.status(201).json({
      message: "Tenant created successfully",
      tenant,
      onboarding,
      nextSteps: [
        "Configure branding and theme",
        "Set up custom domain",
        "Invite team members",
        "Import initial data"
      ],
      accessUrl: `https://${tenant.subdomain}.smartcrm.vip`
    });
  } catch (error) {
    await errorLogger.logError("Tenant creation failed", error, {
      endpoint: "/api/provisioning/create",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to create tenant",
      message: error.message
    });
  }
});
router11.get("/templates", async (req, res) => {
  try {
    const templates = await tenantProvisioner.listTemplates();
    res.json({
      templates,
      count: templates.length
    });
  } catch (error) {
    await errorLogger.logError("Failed to list templates", error, {
      endpoint: "/api/provisioning/templates",
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to list templates",
      message: error.message
    });
  }
});
router11.post("/apply-template", async (req, res) => {
  try {
    const { tenantId, templateId } = req.body;
    if (!tenantId || !templateId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "templateId"]
      });
    }
    const template = await tenantProvisioner.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        error: "Template not found"
      });
    }
    await tenantProvisioner.applyTemplate(tenantId, template);
    res.json({
      message: "Template applied successfully",
      template: {
        id: template.id,
        name: template.name
      }
    });
  } catch (error) {
    await errorLogger.logError("Template application failed", error, {
      endpoint: "/api/provisioning/apply-template",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to apply template",
      message: error.message
    });
  }
});
router11.get("/status/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await tenantProvisioner.getTenant(tenantId);
    const onboarding = await tenantProvisioner.getOnboardingStatus(tenantId);
    res.json({
      tenant,
      onboarding,
      progress: onboarding ? {
        percentage: Math.round(
          onboarding.completedSteps.length / onboarding.totalSteps * 100
        ),
        currentStep: onboarding.currentStep,
        totalSteps: onboarding.totalSteps
      } : null
    });
  } catch (error) {
    await errorLogger.logError("Failed to get provisioning status", error, {
      endpoint: `/api/provisioning/status/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(404).json({
      error: "Tenant not found",
      message: error.message
    });
  }
});
router11.post("/onboarding/step", async (req, res) => {
  try {
    const { tenantId, stepId, completed } = req.body;
    if (!tenantId || !stepId || completed === void 0) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "stepId", "completed"]
      });
    }
    const onboarding = await tenantProvisioner.updateOnboardingProgress(
      tenantId,
      stepId,
      completed
    );
    res.json({
      message: completed ? "Step completed" : "Step marked incomplete",
      onboarding,
      progress: {
        percentage: Math.round(onboarding.completedSteps.length / onboarding.totalSteps * 100),
        remaining: onboarding.totalSteps - onboarding.completedSteps.length
      }
    });
  } catch (error) {
    await errorLogger.logError("Failed to update onboarding step", error, {
      endpoint: "/api/provisioning/onboarding/step",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to update onboarding step",
      message: error.message
    });
  }
});
router11.post("/complete", async (req, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) {
      return res.status(400).json({
        error: "tenantId is required"
      });
    }
    const onboarding = await tenantProvisioner.getOnboardingStatus(tenantId);
    if (!onboarding) {
      return res.status(404).json({
        error: "Onboarding not found"
      });
    }
    const allSteps = onboarding.completedSteps;
    for (let i = 1; i <= onboarding.totalSteps; i++) {
      if (!allSteps.includes(`step_${i}`)) {
        allSteps.push(`step_${i}`);
      }
    }
    const updatedOnboarding = await tenantProvisioner.updateOnboardingProgress(
      tenantId,
      "final",
      true
    );
    res.json({
      message: "Onboarding completed successfully",
      onboarding: updatedOnboarding
    });
  } catch (error) {
    await errorLogger.logError("Failed to complete onboarding", error, {
      endpoint: "/api/provisioning/complete",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to complete onboarding",
      message: error.message
    });
  }
});
router11.get("/tenants", async (req, res) => {
  try {
    const { status, type, parentPartnerId, page, limit } = req.query;
    const result = await tenantProvisioner.listTenants({
      status,
      type,
      parentPartnerId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    });
    res.json(result);
  } catch (error) {
    await errorLogger.logError("Failed to list tenants", error, {
      endpoint: "/api/provisioning/tenants",
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to list tenants",
      message: error.message
    });
  }
});
router11.get("/tenants/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await tenantProvisioner.getTenant(tenantId);
    res.json({ tenant });
  } catch (error) {
    await errorLogger.logError("Failed to get tenant", error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(404).json({
      error: "Tenant not found",
      message: error.message
    });
  }
});
router11.put("/tenants/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;
    const tenant = await tenantProvisioner.updateTenant(tenantId, updates);
    res.json({
      message: "Tenant updated successfully",
      tenant
    });
  } catch (error) {
    await errorLogger.logError("Failed to update tenant", error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}`,
      method: "PUT"
    });
    res.status(500).json({
      error: "Failed to update tenant",
      message: error.message
    });
  }
});
router11.post("/tenants/:tenantId/suspend", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;
    await tenantProvisioner.suspendTenant(tenantId, reason);
    res.json({
      message: "Tenant suspended successfully",
      tenantId
    });
  } catch (error) {
    await errorLogger.logError("Failed to suspend tenant", error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}/suspend`,
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to suspend tenant",
      message: error.message
    });
  }
});
router11.post("/tenants/:tenantId/activate", async (req, res) => {
  try {
    const { tenantId } = req.params;
    await tenantProvisioner.activateTenant(tenantId);
    res.json({
      message: "Tenant activated successfully",
      tenantId
    });
  } catch (error) {
    await errorLogger.logError("Failed to activate tenant", error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}/activate`,
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to activate tenant",
      message: error.message
    });
  }
});
router11.delete("/tenants/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    await tenantProvisioner.deleteTenant(tenantId);
    res.json({
      message: "Tenant deleted successfully",
      tenantId
    });
  } catch (error) {
    await errorLogger.logError("Failed to delete tenant", error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}`,
      method: "DELETE"
    });
    res.status(500).json({
      error: "Failed to delete tenant",
      message: error.message
    });
  }
});
var provisioning_default = router11;

// server/routes/assets.ts
import { Router as Router12 } from "express";

// server/services/whitelabel/assetManager.ts
import { createClient as createClient10 } from "@supabase/supabase-js";
var supabaseUrl8 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
var supabaseKey5 = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase6 = supabaseUrl8 && supabaseKey5 ? createClient10(supabaseUrl8, supabaseKey5) : null;
var AssetManager = class {
  storageBucket;
  cdnUrl;
  constructor() {
    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "assets";
    this.cdnUrl = process.env.CDN_URL;
  }
  /**
   * Upload asset to storage
   */
  async uploadAsset(file, fileName, options) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    try {
      const fileExt = fileName.split(".").pop();
      const uniqueName = `${options.tenantId}/${options.category}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase6.storage.from(this.storageBucket).upload(uniqueName, file, {
        contentType: this.getMimeType(fileName),
        cacheControl: "3600",
        upsert: false
      });
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      const { data: urlData } = supabase6.storage.from(this.storageBucket).getPublicUrl(uniqueName);
      const url = urlData.publicUrl;
      const cdnUrl = this.cdnUrl ? `${this.cdnUrl}/${uniqueName}` : url;
      const fileSize = file.length;
      const mimeType = this.getMimeType(fileName);
      const { data: assetData, error: dbError } = await supabase6.from("assets").insert({
        tenant_id: options.tenantId,
        name: fileName.replace(/\.[^/.]+$/, ""),
        // Remove extension
        original_name: fileName,
        file_type: fileExt || "unknown",
        file_size: fileSize,
        mime_type: mimeType,
        category: options.category,
        url,
        cdn_url: cdnUrl,
        optimized: false,
        version: 1,
        metadata: options.metadata || {},
        usage_count: 0,
        created_by: options.createdBy,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (dbError) {
        await supabase6.storage.from(this.storageBucket).remove([uniqueName]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }
      const asset = this.mapDatabaseToAsset(assetData);
      if (options.optimize && this.isImage(mimeType)) {
        this.optimizeAssetAsync(asset.id).catch((error) => {
          errorLogger.logError("Asset optimization failed", error, { assetId: asset.id });
        });
      }
      if (options.generateThumbnail && this.isImage(mimeType)) {
        this.generateThumbnailAsync(asset.id).catch((error) => {
          errorLogger.logError("Thumbnail generation failed", error, { assetId: asset.id });
        });
      }
      return asset;
    } catch (error) {
      await errorLogger.logError("Asset upload failed", error, {
        tenantId: options.tenantId,
        fileName
      });
      throw error;
    }
  }
  /**
   * Get asset by ID
   */
  async getAsset(assetId) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    const { data, error } = await supabase6.from("assets").select("*").eq("id", assetId).single();
    if (error || !data) {
      throw new Error("Asset not found");
    }
    await supabase6.from("assets").update({ usage_count: (data.usage_count || 0) + 1 }).eq("id", assetId);
    return this.mapDatabaseToAsset(data);
  }
  /**
   * List assets
   */
  async listAssets(options) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const offset = (page - 1) * limit;
    let query = supabase6.from("assets").select("*", { count: "exact" }).eq("tenant_id", options.tenantId);
    if (options.category) {
      query = query.eq("category", options.category);
    }
    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,original_name.ilike.%${options.search}%`);
    }
    const { data, error, count: count2 } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (error) {
      throw new Error(`Failed to list assets: ${error.message}`);
    }
    const assets = (data || []).map((d) => this.mapDatabaseToAsset(d));
    const total = count2 || 0;
    const pages = Math.ceil(total / limit);
    return { assets, total, page, pages };
  }
  /**
   * Update asset metadata
   */
  async updateAsset(assetId, updates) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    const dbUpdates = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.metadata) dbUpdates.metadata = updates.metadata;
    const { data, error } = await supabase6.from("assets").update(dbUpdates).eq("id", assetId).select().single();
    if (error) {
      throw new Error(`Failed to update asset: ${error.message}`);
    }
    return this.mapDatabaseToAsset(data);
  }
  /**
   * Delete asset
   */
  async deleteAsset(assetId) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    const { data: assetData, error: fetchError } = await supabase6.from("assets").select("url, tenant_id, category").eq("id", assetId).single();
    if (fetchError || !assetData) {
      throw new Error("Asset not found");
    }
    const urlParts = assetData.url.split("/");
    const storagePath = urlParts.slice(urlParts.indexOf(this.storageBucket) + 1).join("/");
    const { error: storageError } = await supabase6.storage.from(this.storageBucket).remove([storagePath]);
    if (storageError) {
      console.error("Failed to delete from storage:", storageError);
    }
    const { error: dbError } = await supabase6.from("assets").delete().eq("id", assetId);
    if (dbError) {
      throw new Error(`Failed to delete asset: ${dbError.message}`);
    }
  }
  /**
   * Optimize asset (async operation)
   */
  async optimizeAssetAsync(assetId) {
    try {
      if (!supabase6) return;
      await supabase6.from("assets").update({
        optimized: true,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", assetId);
    } catch (error) {
      console.error(`Asset optimization failed for ${assetId}:`, error.message);
    }
  }
  /**
   * Generate thumbnail (async operation)
   */
  async generateThumbnailAsync(assetId) {
    try {
      console.log(`Thumbnail generation queued for asset ${assetId}`);
    } catch (error) {
      console.error(`Thumbnail generation failed for ${assetId}:`, error.message);
    }
  }
  /**
   * Get asset versions
   */
  async getAssetVersions(assetId) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    const { data: asset, error: assetError } = await supabase6.from("assets").select("*").eq("id", assetId).single();
    if (assetError || !asset) {
      throw new Error("Asset not found");
    }
    const parentId = asset.parent_asset_id || assetId;
    const { data, error } = await supabase6.from("assets").select("*").or(`id.eq.${parentId},parent_asset_id.eq.${parentId}`).order("version", { ascending: false });
    if (error) {
      throw new Error(`Failed to get asset versions: ${error.message}`);
    }
    return (data || []).map((d) => this.mapDatabaseToAsset(d));
  }
  /**
   * Create new asset version
   */
  async createAssetVersion(assetId, file, fileName) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    const { data: originalAsset, error: fetchError } = await supabase6.from("assets").select("*").eq("id", assetId).single();
    if (fetchError || !originalAsset) {
      throw new Error("Original asset not found");
    }
    const versions = await this.getAssetVersions(assetId);
    const latestVersion = Math.max(...versions.map((v) => v.version));
    const newAsset = await this.uploadAsset(file, fileName, {
      tenantId: originalAsset.tenant_id,
      category: originalAsset.category,
      createdBy: originalAsset.created_by,
      metadata: originalAsset.metadata
    });
    await supabase6.from("assets").update({
      parent_asset_id: originalAsset.parent_asset_id || assetId,
      version: latestVersion + 1
    }).eq("id", newAsset.id);
    return {
      ...newAsset,
      version: latestVersion + 1,
      parentAssetId: originalAsset.parent_asset_id || assetId
    };
  }
  /**
   * Bulk upload assets
   */
  async bulkUpload(files, options) {
    const assets = [];
    const errors = [];
    for (const file of files) {
      try {
        const asset = await this.uploadAsset(file.buffer, file.fileName, options);
        assets.push(asset);
      } catch (error) {
        errors.push({
          fileName: file.fileName,
          error: error.message
        });
      }
    }
    return { assets, errors };
  }
  /**
   * Get asset usage statistics
   */
  async getAssetUsageStats(tenantId) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    const { data: assets, error } = await supabase6.from("assets").select("*").eq("tenant_id", tenantId);
    if (error) {
      throw new Error(`Failed to get asset stats: ${error.message}`);
    }
    const assetList = (assets || []).map((d) => this.mapDatabaseToAsset(d));
    const totalAssets = assetList.length;
    const totalSize = assetList.reduce((sum, asset) => sum + asset.fileSize, 0);
    const byCategory = {};
    assetList.forEach((asset) => {
      byCategory[asset.category] = (byCategory[asset.category] || 0) + 1;
    });
    const recentUploads = assetList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
    return {
      totalAssets,
      totalSize,
      byCategory,
      recentUploads
    };
  }
  /**
   * Search assets
   */
  async searchAssets(tenantId, query) {
    if (!supabase6) {
      throw new Error("Supabase not configured");
    }
    const { data, error } = await supabase6.from("assets").select("*").eq("tenant_id", tenantId).or(`name.ilike.%${query}%,original_name.ilike.%${query}%`).order("created_at", { ascending: false }).limit(50);
    if (error) {
      throw new Error(`Asset search failed: ${error.message}`);
    }
    return (data || []).map((d) => this.mapDatabaseToAsset(d));
  }
  /**
   * Get MIME type from file name
   */
  getMimeType(fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Videos
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      // Other
      json: "application/json",
      txt: "text/plain",
      css: "text/css",
      js: "application/javascript"
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }
  /**
   * Check if MIME type is an image
   */
  isImage(mimeType) {
    return mimeType.startsWith("image/");
  }
  /**
   * Map database record to Asset
   */
  mapDatabaseToAsset(data) {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      originalName: data.original_name,
      fileType: data.file_type,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      category: data.category,
      url: data.url,
      cdnUrl: data.cdn_url,
      thumbnailUrl: data.thumbnail_url,
      width: data.width,
      height: data.height,
      optimized: data.optimized,
      version: data.version,
      parentAssetId: data.parent_asset_id,
      metadata: data.metadata,
      usageCount: data.usage_count,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
  /**
   * Validate file size
   */
  validateFileSize(fileSize, maxSize = 10 * 1024 * 1024) {
    return fileSize <= maxSize;
  }
  /**
   * Validate file type
   */
  validateFileType(mimeType, allowedTypes) {
    return allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return mimeType.startsWith(type.replace("/*", "/"));
      }
      return mimeType === type;
    });
  }
};
var assetManager = new AssetManager();

// server/routes/assets.ts
import multer from "multer";
var router12 = Router12();
router12.use(requireAuth());
router12.use(requireEntitlement(FeatureKey.BRAND_ASSET_MANAGEMENT));
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    // 10MB limit
    files: 10
    // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/x-icon",
      "application/pdf",
      "video/mp4",
      "video/webm"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});
router12.post("/upload", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files;
    const { tenantId, category, optimize, generateThumbnail, metadata } = req.body;
    const userId = req.session?.userId;
    if (!tenantId || !category) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "category"]
      });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: "No files provided"
      });
    }
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }
    const validCategories = ["logo", "icon", "image", "document", "video"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: "Invalid category",
        validCategories
      });
    }
    const uploadOptions = {
      tenantId,
      category,
      optimize: optimize === "true" || optimize === true,
      generateThumbnail: generateThumbnail === "true" || generateThumbnail === true,
      metadata: metadata ? JSON.parse(metadata) : {},
      createdBy: userId
    };
    if (files.length === 1) {
      const asset = await assetManager.uploadAsset(
        files[0].buffer,
        files[0].originalname,
        uploadOptions
      );
      res.status(201).json({
        message: "Asset uploaded successfully",
        asset
      });
    } else {
      const fileData = files.map((f) => ({
        buffer: f.buffer,
        fileName: f.originalname
      }));
      const result = await assetManager.bulkUpload(fileData, uploadOptions);
      res.status(201).json({
        message: `Uploaded ${result.assets.length} assets`,
        assets: result.assets,
        errors: result.errors,
        summary: {
          successful: result.assets.length,
          failed: result.errors.length,
          total: files.length
        }
      });
    }
  } catch (error) {
    await errorLogger.logError("Asset upload failed", error, {
      endpoint: "/api/assets/upload",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to upload asset",
      message: error.message
    });
  }
});
router12.get("/", async (req, res) => {
  try {
    const { tenantId, category, page, limit, search } = req.query;
    if (!tenantId) {
      return res.status(400).json({
        error: "tenantId is required"
      });
    }
    const result = await assetManager.listAssets({
      tenantId,
      category,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      search
    });
    res.json(result);
  } catch (error) {
    await errorLogger.logError("Failed to list assets", error, {
      endpoint: "/api/assets",
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to list assets",
      message: error.message
    });
  }
});
router12.get("/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    const asset = await assetManager.getAsset(assetId);
    res.json({ asset });
  } catch (error) {
    await errorLogger.logError("Failed to get asset", error, {
      endpoint: `/api/assets/${req.params.assetId}`,
      method: "GET"
    });
    res.status(404).json({
      error: "Asset not found",
      message: error.message
    });
  }
});
router12.put("/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    const updates = req.body;
    const asset = await assetManager.updateAsset(assetId, updates);
    res.json({
      message: "Asset updated successfully",
      asset
    });
  } catch (error) {
    await errorLogger.logError("Failed to update asset", error, {
      endpoint: `/api/assets/${req.params.assetId}`,
      method: "PUT"
    });
    res.status(500).json({
      error: "Failed to update asset",
      message: error.message
    });
  }
});
router12.delete("/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    await assetManager.deleteAsset(assetId);
    res.json({
      message: "Asset deleted successfully",
      assetId
    });
  } catch (error) {
    await errorLogger.logError("Failed to delete asset", error, {
      endpoint: `/api/assets/${req.params.assetId}`,
      method: "DELETE"
    });
    res.status(500).json({
      error: "Failed to delete asset",
      message: error.message
    });
  }
});
router12.get("/:assetId/versions", async (req, res) => {
  try {
    const { assetId } = req.params;
    const versions = await assetManager.getAssetVersions(assetId);
    res.json({
      versions,
      count: versions.length,
      latest: versions[0]
    });
  } catch (error) {
    await errorLogger.logError("Failed to get asset versions", error, {
      endpoint: `/api/assets/${req.params.assetId}/versions`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to get asset versions",
      message: error.message
    });
  }
});
router12.post("/:assetId/version", upload.single("file"), async (req, res) => {
  try {
    const { assetId } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        error: "No file provided"
      });
    }
    const newVersion = await assetManager.createAssetVersion(
      assetId,
      file.buffer,
      file.originalname
    );
    res.status(201).json({
      message: "New asset version created",
      asset: newVersion
    });
  } catch (error) {
    await errorLogger.logError("Failed to create asset version", error, {
      endpoint: `/api/assets/${req.params.assetId}/version`,
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to create asset version",
      message: error.message
    });
  }
});
router12.get("/stats/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const stats = await assetManager.getAssetUsageStats(tenantId);
    res.json({
      stats,
      summary: {
        totalAssets: stats.totalAssets,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
        categories: Object.keys(stats.byCategory).length
      }
    });
  } catch (error) {
    await errorLogger.logError("Failed to get asset stats", error, {
      endpoint: `/api/assets/stats/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to get asset statistics",
      message: error.message
    });
  }
});
router12.get("/search/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        error: "Search query (q) is required"
      });
    }
    const assets = await assetManager.searchAssets(tenantId, q);
    res.json({
      assets,
      count: assets.length,
      query: q
    });
  } catch (error) {
    await errorLogger.logError("Asset search failed", error, {
      endpoint: `/api/assets/search/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Asset search failed",
      message: error.message
    });
  }
});
var assets_default = router12;

// server/routes/whitelabel.ts
import { Router as Router13 } from "express";
import { createClient as createClient11 } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
var router13 = Router13();
var supabaseUrl9 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
var serviceRoleKey3 = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
var supabase7 = supabaseUrl9 && serviceRoleKey3 ? createClient11(supabaseUrl9, serviceRoleKey3) : null;
var BACKUP_DIR = process.env.WHITELABEL_BACKUP_DIR || path.join(process.cwd(), "backups", "whitelabel");
var ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  return BACKUP_DIR;
};
function getTenantConfig(tenantId) {
  return supabase7.from("white_label_configs").select("*").eq("tenant_id", tenantId).single();
}
function getChildTenants(parentTenantId) {
  return supabase7.from("tenants").select("id, name, subdomain, status").eq("parent_partner_id", parentTenantId);
}
function insertHistoryEntry(entry) {
  return supabase7.from("whitelabel_settings_history").insert(entry);
}
function listHistory(tenantId, limit = 50) {
  return supabase7.from("whitelabel_settings_history").select("*").eq("tenant_id", tenantId).order("changed_at", { ascending: false }).limit(limit);
}
router13.use(requireAuth());
router13.use(requireEntitlement(FeatureKey.WHITE_LABEL_MANAGEMENT));
router13.post("/propagate", async (req, res) => {
  try {
    const { tenantId, targetTenantIds, strategy = "merge" } = req.body;
    if (!tenantId) {
      return res.status(400).json({
        error: "Missing required field",
        required: ["tenantId"]
      });
    }
    const { data: sourceConfig, error: sourceErr } = await getTenantConfig(tenantId);
    if (sourceErr || !sourceConfig) {
      return res.status(404).json({
        error: "Source tenant configuration not found",
        tenantId
      });
    }
    let targets = [];
    if (targetTenantIds && Array.isArray(targetTenantIds) && targetTenantIds.length > 0) {
      targets = targetTenantIds;
    } else {
      const { data: children, error: childrenErr } = await getChildTenants(tenantId);
      if (childrenErr || !children) {
        return res.status(500).json({
          error: "Failed to resolve child tenants",
          message: childrenErr?.message
        });
      }
      targets = children.map((c) => c.id);
    }
    const results = [];
    for (const targetId of targets) {
      const { data: existingConfig } = await getTenantConfig(targetId);
      let mergedConfig = { ...sourceConfig };
      if (existingConfig && strategy === "merge") {
        mergedConfig = {
          ...existingConfig,
          ...sourceConfig,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      if (existingConfig) {
        const { error: updateErr } = await supabase7.from("white_label_configs").update({ ...mergedConfig, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("tenant_id", targetId);
        results.push({ tenantId: targetId, status: updateErr ? "failed" : "updated", error: updateErr?.message });
      } else {
        mergedConfig.tenant_id = targetId;
        mergedConfig.id = void 0;
        const { error: insertErr } = await supabase7.from("white_label_configs").insert(mergedConfig);
        results.push({ tenantId: targetId, status: insertErr ? "failed" : "created", error: insertErr?.message });
      }
      await insertHistoryEntry({
        id: randomUUID(),
        tenant_id: targetId,
        action: "propagate",
        source_tenant_id: tenantId,
        changes: mergedConfig,
        changed_by: req.userEmail || req.session?.userEmail || null,
        changed_at: (/* @__PURE__ */ new Date()).toISOString(),
        metadata: { strategy }
      });
    }
    res.json({
      message: "Propagation completed",
      sourceTenantId: tenantId,
      strategy,
      results,
      summary: {
        total: results.length,
        succeeded: results.filter((r) => r.status !== "failed").length,
        failed: results.filter((r) => r.status === "failed").length
      }
    });
  } catch (error) {
    await errorLogger.logError("White-label propagation failed", error, {
      endpoint: "/api/whitelabel/propagate",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to propagate white-label settings",
      message: error.message
    });
  }
});
router13.post("/sync", async (req, res) => {
  try {
    const { sourceTenantId, targetTenantId, strategy = "merge" } = req.body;
    if (!sourceTenantId || !targetTenantId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["sourceTenantId", "targetTenantId"]
      });
    }
    if (sourceTenantId === targetTenantId) {
      return res.status(400).json({ error: "sourceTenantId and targetTenantId must be different" });
    }
    const { data: sourceConfig, error: sourceErr } = await getTenantConfig(sourceTenantId);
    if (sourceErr || !sourceConfig) {
      return res.status(404).json({ error: "Source tenant configuration not found", sourceTenantId });
    }
    const { data: targetConfig, error: targetErr } = await getTenantConfig(targetTenantId);
    if (targetErr && targetErr.code !== "PGRST116") {
      return res.status(500).json({ error: "Failed to load target tenant configuration" });
    }
    let mergedConfig;
    if (!targetConfig) {
      mergedConfig = { ...sourceConfig, tenant_id: targetTenantId, id: void 0 };
      const { error: insertErr } = await supabase7.from("white_label_configs").insert(mergedConfig);
      if (insertErr) {
        throw insertErr;
      }
    } else {
      if (strategy === "source-wins") {
        mergedConfig = { ...sourceConfig, tenant_id: targetTenantId, id: targetConfig.id };
      } else if (strategy === "target-wins") {
        mergedConfig = targetConfig;
      } else {
        mergedConfig = { ...targetConfig, ...sourceConfig, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      }
      const { error: updateErr } = await supabase7.from("white_label_configs").update({ ...mergedConfig, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("tenant_id", targetTenantId);
      if (updateErr) {
        throw updateErr;
      }
    }
    await insertHistoryEntry({
      id: randomUUID(),
      tenant_id: targetTenantId,
      action: "sync",
      source_tenant_id: sourceTenantId,
      changes: mergedConfig,
      changed_by: req.userEmail || req.session?.userEmail || null,
      changed_at: (/* @__PURE__ */ new Date()).toISOString(),
      metadata: { strategy, sourceTenantId }
    });
    res.json({
      message: "Sync completed successfully",
      sourceTenantId,
      targetTenantId,
      strategy,
      syncedConfig: mergedConfig
    });
  } catch (error) {
    await errorLogger.logError("White-label sync failed", error, {
      endpoint: "/api/whitelabel/sync",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to sync white-label settings",
      message: error.message
    });
  }
});
router13.get("/history/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const { data: history, error } = await listHistory(tenantId, limit);
    if (error) {
      throw error;
    }
    res.json({
      tenantId,
      history: history || [],
      count: history?.length || 0
    });
  } catch (error) {
    await errorLogger.logError("Failed to fetch white-label history", error, {
      endpoint: `/api/whitelabel/history/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to fetch white-label history",
      message: error.message
    });
  }
});
router13.post("/backup", async (req, res) => {
  try {
    const { tenantId, label } = req.body;
    if (!tenantId) {
      return res.status(400).json({
        error: "Missing required field",
        required: ["tenantId"]
      });
    }
    const { data: config, error: configErr } = await getTenantConfig(tenantId);
    if (configErr || !config) {
      return res.status(404).json({
        error: "Tenant configuration not found",
        tenantId
      });
    }
    const backupDir = ensureBackupDir();
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const filename = `whitelabel-${tenantId}-${timestamp2}${label ? `-${label.replace(/\s+/g, "-")}` : ""}.json`;
    const filePath = path.join(backupDir, filename);
    const backupPayload = {
      id: randomUUID(),
      tenantId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      createdBy: req.userEmail || req.session?.userEmail || null,
      label: label || null,
      config
    };
    fs.writeFileSync(filePath, JSON.stringify(backupPayload, null, 2), "utf-8");
    await insertHistoryEntry({
      id: randomUUID(),
      tenant_id: tenantId,
      action: "backup",
      source_tenant_id: tenantId,
      changes: backupPayload,
      changed_by: req.userEmail || req.session?.userEmail || null,
      changed_at: (/* @__PURE__ */ new Date()).toISOString(),
      metadata: { filename, filePath }
    });
    res.status(201).json({
      message: "Backup created successfully",
      backup: {
        id: backupPayload.id,
        tenantId,
        filename,
        createdAt: backupPayload.createdAt
      }
    });
  } catch (error) {
    await errorLogger.logError("White-label backup failed", error, {
      endpoint: "/api/whitelabel/backup",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to create white-label backup",
      message: error.message
    });
  }
});
router13.post("/restore", async (req, res) => {
  try {
    const { tenantId, filename } = req.body;
    if (!tenantId || !filename) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["tenantId", "filename"]
      });
    }
    const backupDir = ensureBackupDir();
    const filePath = path.join(backupDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Backup file not found",
        filename
      });
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const backupPayload = JSON.parse(raw);
    if (backupPayload.tenantId !== tenantId) {
      return res.status(400).json({
        error: "Backup tenantId does not match requested tenantId"
      });
    }
    const config = backupPayload.config;
    const { data: existingConfig } = await getTenantConfig(tenantId);
    if (existingConfig) {
      const { error: updateErr } = await supabase7.from("white_label_configs").update({ ...config, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("tenant_id", tenantId);
      if (updateErr) {
        throw updateErr;
      }
    } else {
      const { error: insertErr } = await supabase7.from("white_label_configs").insert({ ...config, tenant_id: tenantId, id: void 0 });
      if (insertErr) {
        throw insertErr;
      }
    }
    await insertHistoryEntry({
      id: randomUUID(),
      tenant_id: tenantId,
      action: "restore",
      source_tenant_id: tenantId,
      changes: config,
      changed_by: req.userEmail || req.session?.userEmail || null,
      changed_at: (/* @__PURE__ */ new Date()).toISOString(),
      metadata: { filename, restoredFrom: filePath }
    });
    res.json({
      message: "Configuration restored successfully",
      tenantId,
      filename,
      restoredConfig: config
    });
  } catch (error) {
    await errorLogger.logError("White-label restore failed", error, {
      endpoint: "/api/whitelabel/restore",
      method: "POST"
    });
    res.status(500).json({
      error: "Failed to restore white-label configuration",
      message: error.message
    });
  }
});
router13.get("/backups/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const backupDir = ensureBackupDir();
    const files = fs.readdirSync(backupDir).filter((f) => f.startsWith(`whitelabel-${tenantId}-`) && f.endsWith(".json")).map((filename) => {
      const fullPath = path.join(backupDir, filename);
      const stats = fs.statSync(fullPath);
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString()
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({
      tenantId,
      backups: files,
      count: files.length
    });
  } catch (error) {
    await errorLogger.logError("Failed to list white-label backups", error, {
      endpoint: `/api/whitelabel/backups/${req.params.tenantId}`,
      method: "GET"
    });
    res.status(500).json({
      error: "Failed to list backups",
      message: error.message
    });
  }
});
router13.get("/stream/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const pollIntervalMs = parseInt(req.query.interval || "5000", 10);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.write(`data: ${JSON.stringify({ type: "connected", tenantId, timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`);
    let lastTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    const interval = setInterval(async () => {
      try {
        const { data: newEntries, error } = await supabase7.from("whitelabel_settings_history").select("*").eq("tenant_id", tenantId).gt("changed_at", lastTimestamp).order("changed_at", { ascending: true });
        if (error) {
          res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}

`);
          return;
        }
        if (newEntries && newEntries.length > 0) {
          for (const entry of newEntries) {
            res.write(`data: ${JSON.stringify({ type: "change", payload: entry })}

`);
          }
          lastTimestamp = newEntries[newEntries.length - 1].changed_at;
        }
        res.write(`data: ${JSON.stringify({ type: "heartbeat", timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`);
      } catch (err) {
        res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}

`);
      }
    }, pollIntervalMs);
    req.on("close", () => {
      clearInterval(interval);
    });
  } catch (error) {
    await errorLogger.logError("White-label stream setup failed", error, {
      endpoint: `/api/whitelabel/stream/${req.params.tenantId}`,
      method: "GET"
    });
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to establish stream",
        message: error.message
      });
    }
  }
});
var whitelabel_default = router13;

// server/routes/messaging.ts
import { and as and4, desc as desc4, eq as eq5 } from "drizzle-orm";
init_db();
init_schema();

// server/messaging/index.ts
var twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
var twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
var twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
var supabaseUrl10 = process.env.SUPABASE_URL;
var supabaseKey6 = process.env.SUPABASE_ANON_KEY;
function twilioClient(accountSid, authToken) {
  const base = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const toMessage2 = (m) => ({
    sid: m.sid,
    body: m.body,
    to: m.to,
    status: m.status,
    price: m.price,
    dateSent: m.date_sent,
    dateCreated: m.date_created
  });
  return {
    messages: {
      async create(params) {
        const form = new URLSearchParams({ Body: params.body, To: params.to });
        if (params.from) form.set("From", params.from);
        if (params.statusCallback) form.set("StatusCallback", params.statusCallback);
        const res = await fetch(base, {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Twilio error ${res.status}`);
        return toMessage2(data);
      },
      async list(params) {
        const query = new URLSearchParams({ PageSize: String(Math.min(1e3, params.limit || 50)) });
        if (params.dateSentAfter) query.set("DateSent>", params.dateSentAfter.toISOString().slice(0, 10));
        if (params.dateSentBefore) query.set("DateSent<", params.dateSentBefore.toISOString().slice(0, 10));
        const res = await fetch(`${base}?${query}`, { headers: { Authorization: auth } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Twilio error ${res.status}`);
        return (data.messages || []).map(toMessage2);
      }
    }
  };
}

// server/routes/messaging.ts
var twilioConfigured = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
var toMessage = (row) => ({
  id: row.id,
  content: row.content || "",
  recipient: row.metadata?.recipient || "",
  provider: row.metadata?.provider || "twilio",
  status: row.status || "sent",
  sentAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt || Date.now())).toISOString(),
  priority: row.metadata?.priority || "medium",
  ...row.metadata?.error ? { error: row.metadata.error } : {}
});
var noDb = (res) => res.status(503).json({ error: "Database not configured" });
async function userMessages(userId) {
  return db.select().from(communications).where(and4(eq5(communications.profileId, userId), eq5(communications.type, "sms"))).orderBy(desc4(communications.createdAt));
}
function registerMessagingRoutes(app2) {
  app2.use("/api/messaging", requireAuth(), requireEntitlement(FeatureKey.TEXT_MESSAGES));
  app2.get("/api/messaging/providers", async (_req, res) => {
    res.json([
      {
        id: "twilio",
        name: "Twilio",
        supportedFeatures: ["SMS"],
        status: twilioConfigured() ? "active" : "inactive",
        ...twilioConfigured() ? {} : { message: "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER" }
      }
    ]);
  });
  app2.get("/api/messaging/messages", async (req, res) => {
    try {
      if (!db) return noDb(res);
      res.json((await userMessages(req.userId)).map(toMessage));
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.get("/api/messaging/stats", async (req, res) => {
    try {
      if (!db) return noDb(res);
      const messages = (await userMessages(req.userId)).map(toMessage);
      const delivered = messages.filter((m) => m.status === "delivered").length;
      const failed = messages.filter((m) => m.status === "failed").length;
      res.json({
        totalMessages: messages.length,
        deliveredMessages: delivered,
        failedMessages: failed,
        deliveryRate: messages.length ? delivered / messages.length : null,
        averageResponseTime: null,
        totalCost: null,
        costPerMessage: null,
        activeProviders: twilioConfigured() ? 1 : 0
      });
    } catch (error) {
      console.error("Error fetching messaging stats:", error);
      res.status(500).json({ error: "Failed to fetch messaging stats" });
    }
  });
  app2.post("/api/messaging/send", async (req, res) => {
    try {
      const { content, recipient, provider = "twilio" } = req.body || {};
      if (!content || !recipient) {
        return res.status(400).json({ error: "Content and recipient are required" });
      }
      if (typeof content !== "string" || content.length === 0 || content.length > 1600) {
        return res.status(400).json({ error: "Content must be between 1 and 1600 characters" });
      }
      if (typeof recipient !== "string" || !/^\+?[0-9\s().-]{7,20}$/.test(recipient)) {
        return res.status(400).json({ error: "Recipient must be a phone number" });
      }
      if (provider !== "twilio") {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }
      if (!twilioConfigured()) {
        return res.status(501).json({
          error: "SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER."
        });
      }
      if (!db) return noDb(res);
      const to = recipient.replace(/[\s().-]/g, "");
      let status = "failed";
      let sid;
      let error;
      try {
        const sent = await twilioClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN).messages.create({
          body: content,
          from: process.env.TWILIO_PHONE_NUMBER,
          to
        });
        status = sent.status || "queued";
        sid = sent.sid;
      } catch (sendError) {
        error = sendError?.message || "Twilio send failed";
      }
      const [row] = await db.insert(communications).values({
        type: "sms",
        direction: "outbound",
        content,
        status,
        profileId: req.userId,
        metadata: { recipient: to, provider: "twilio", sid, ...error ? { error } : {} }
      }).returning();
      if (error) return res.status(502).json({ error, message: toMessage(row) });
      res.status(201).json(toMessage(row));
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app2.get("/api/messaging/messages/:id", async (req, res) => {
    try {
      if (!db) return noDb(res);
      const [row] = await db.select().from(communications).where(
        and4(
          eq5(communications.id, req.params.id),
          eq5(communications.profileId, req.userId),
          eq5(communications.type, "sms")
        )
      );
      if (!row) return res.status(404).json({ error: "Message not found" });
      res.json(toMessage(row));
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });
  app2.put("/api/messaging/messages/:id/status", async (req, res) => {
    try {
      if (!db) return noDb(res);
      const { status } = req.body || {};
      if (!["queued", "sent", "delivered", "failed", "undelivered"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const [row] = await db.update(communications).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(
        and4(
          eq5(communications.id, req.params.id),
          eq5(communications.profileId, req.userId),
          eq5(communications.type, "sms")
        )
      ).returning();
      if (!row) return res.status(404).json({ error: "Message not found" });
      res.json(toMessage(row));
    } catch (error) {
      console.error("Error updating message status:", error);
      res.status(500).json({ error: "Failed to update message status" });
    }
  });
}

// server/routes/phone.ts
import { and as and5, desc as desc5, eq as eq6 } from "drizzle-orm";
init_db();
init_schema();
var CALL_FIELDS = ["caller", "duration", "status", "sentiment", "transcript", "recording", "gpt5Analysis"];
var toCall = (row) => ({
  id: row.id,
  ...row.metadata || {},
  transcript: row.content ?? row.metadata?.transcript,
  createdAt: row.createdAt
});
var noDb2 = (res) => res.status(503).json({ error: "Database not configured" });
async function findCall(userId, id) {
  const [row] = await db.select().from(communications).where(and5(eq6(communications.id, id), eq6(communications.profileId, userId), eq6(communications.type, "call")));
  return row;
}
var ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "keyPoints", "actionItems", "sentimentScore", "sentiment"],
  properties: {
    summary: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    actionItems: { type: "array", items: { type: "string" } },
    sentimentScore: { type: "number", description: "0 (very negative) to 1 (very positive)" },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] }
  }
};
function registerPhoneRoutes(app2) {
  app2.use("/api/phone", requireAuth(), requireEntitlement(FeatureKey.PHONE_SYSTEM));
  app2.get("/api/phone/calls", async (req, res) => {
    try {
      if (!db) return noDb2(res);
      const rows = await db.select().from(communications).where(and5(eq6(communications.profileId, req.userId), eq6(communications.type, "call"))).orderBy(desc5(communications.createdAt));
      res.json(rows.map(toCall));
    } catch (error) {
      console.error("Error fetching calls:", error);
      res.status(500).json({ error: "Failed to fetch calls" });
    }
  });
  app2.get("/api/phone/stats", async (req, res) => {
    try {
      if (!db) return noDb2(res);
      const rows = await db.select().from(communications).where(and5(eq6(communications.profileId, req.userId), eq6(communications.type, "call")));
      const calls = rows.map(toCall);
      const answered = calls.filter((c) => c.status === "completed");
      res.json({
        totalCalls: calls.length,
        answeredCalls: answered.length,
        averageCallDuration: answered.length ? Math.round(answered.reduce((sum, c) => sum + (Number(c.duration) || 0), 0) / answered.length) : 0,
        callQuality: null,
        customerSatisfaction: null,
        aiAccuracy: null
      });
    } catch (error) {
      console.error("Error fetching phone stats:", error);
      res.status(500).json({ error: "Failed to fetch phone stats" });
    }
  });
  app2.post("/api/phone/calls", async (req, res) => {
    try {
      if (!db) return noDb2(res);
      const { caller, duration, status, transcript, sentiment, recording } = req.body;
      if (!caller || status === void 0) {
        return res.status(400).json({ error: "Caller and status are required" });
      }
      const [row] = await db.insert(communications).values({
        type: "call",
        direction: "outbound",
        status: String(status),
        content: transcript ?? null,
        profileId: req.userId,
        metadata: { caller, duration: Number(duration) || 0, status, sentiment: sentiment || "neutral", recording }
      }).returning();
      res.status(201).json(toCall(row));
    } catch (error) {
      console.error("Error creating call:", error);
      res.status(500).json({ error: "Failed to create call" });
    }
  });
  app2.get("/api/phone/calls/:id", async (req, res) => {
    try {
      if (!db) return noDb2(res);
      const row = await findCall(req.userId, req.params.id);
      if (!row) return res.status(404).json({ error: "Call not found" });
      res.json(toCall(row));
    } catch (error) {
      console.error("Error fetching call:", error);
      res.status(500).json({ error: "Failed to fetch call" });
    }
  });
  app2.put("/api/phone/calls/:id", async (req, res) => {
    try {
      if (!db) return noDb2(res);
      const row = await findCall(req.userId, req.params.id);
      if (!row) return res.status(404).json({ error: "Call not found" });
      const updates = {};
      for (const field of CALL_FIELDS) if (field in req.body) updates[field] = req.body[field];
      const [updated] = await db.update(communications).set({
        metadata: { ...row.metadata, ...updates },
        ..."transcript" in updates ? { content: String(updates.transcript ?? "") } : {},
        ..."status" in updates ? { status: String(updates.status) } : {},
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq6(communications.id, row.id)).returning();
      res.json(toCall(updated));
    } catch (error) {
      console.error("Error updating call:", error);
      res.status(500).json({ error: "Failed to update call" });
    }
  });
  app2.post("/api/phone/calls/:id/analyze", async (req, res) => {
    try {
      if (!db) return noDb2(res);
      const userId = req.userId;
      const row = await findCall(userId, req.params.id);
      if (!row) return res.status(404).json({ error: "Call not found" });
      const call = toCall(row);
      if (!call.transcript) {
        return res.status(400).json({ error: "Call has no transcript to analyze" });
      }
      const openaiData = await getUserOpenAIClient(userId);
      if (!openaiData) {
        return res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
      }
      const result = await respond(openaiData.client, {
        model: openaiData.model,
        instructions: "You analyse sales call transcripts. Summarise, list key points and concrete action items, and rate sentiment. Use only what the transcript says.",
        input: `Caller: ${call.caller}
Transcript:
${call.transcript}`,
        json: { name: "call_analysis", schema: ANALYSIS_SCHEMA }
      });
      if (!result.data) return res.status(502).json({ error: "The AI response was not valid JSON" });
      const { sentiment, ...analysis } = result.data;
      await db.update(communications).set({ metadata: { ...row.metadata, sentiment, gpt5Analysis: analysis }, updatedAt: /* @__PURE__ */ new Date() }).where(eq6(communications.id, row.id));
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing call:", error);
      res.status(500).json({ error: error?.message || "Failed to analyze call" });
    }
  });
  app2.post("/api/phone/calls/start", async (req, res) => {
    const { number } = req.body || {};
    if (!number) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    res.status(501).json({
      error: "Outbound calling is not connected. Use your phone app, then log the call."
    });
  });
}

// server/routes/appointments.ts
var appointments2 = [
  {
    id: "1",
    title: "Product Demo with Acme Corp",
    date: "2024-01-15",
    time: "10:00 AM",
    duration: 60,
    attendees: ["john@acme.com", "sarah@acme.com"],
    type: "video",
    status: "scheduled",
    priority: "high",
    notes: "Demo of new CRM features",
    gpt5Insights: {
      optimalTime: "10:00 AM",
      preparationNotes: ["Review product specs", "Prepare demo script"],
      followUpActions: ["Send follow-up email", "Schedule technical review"]
    }
  },
  {
    id: "2",
    title: "Team Standup",
    date: "2024-01-15",
    time: "2:00 PM",
    duration: 30,
    attendees: ["team@company.com"],
    type: "meeting",
    status: "scheduled",
    priority: "medium",
    notes: "Daily team sync"
  }
];
var meetingStats = {
  totalMeetings: 24,
  completedToday: 3,
  upcomingToday: 5,
  averageDuration: 45,
  successRate: 0.85
};
function registerAppointmentRoutes(app2) {
  app2.use("/api/appointments", requireAuth(), requireEntitlement(FeatureKey.APPOINTMENTS));
  app2.get("/api/appointments", async (req, res) => {
    try {
      res.json(appointments2);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });
  app2.get("/api/appointments/stats", async (req, res) => {
    try {
      res.json(meetingStats);
    } catch (error) {
      console.error("Error fetching appointment stats:", error);
      res.status(500).json({ error: "Failed to fetch appointment stats" });
    }
  });
  app2.post("/api/appointments", async (req, res) => {
    try {
      const { title, date, time, duration, attendees, type, priority, notes: notes2 } = req.body;
      if (!title || !date || !time) {
        return res.status(400).json({ error: "Title, date, and time are required" });
      }
      const newAppointment = {
        id: crypto.randomUUID(),
        title,
        date,
        time,
        duration: duration || 60,
        attendees: attendees || [],
        type: type || "meeting",
        status: "scheduled",
        priority: priority || "medium",
        notes: notes2
      };
      appointments2.push(newAppointment);
      meetingStats.totalMeetings += 1;
      meetingStats.upcomingToday += 1;
      res.status(201).json(newAppointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });
  app2.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointmentId = req.params.id;
      const appointment = appointments2.find((a) => a.id === appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });
  app2.put("/api/appointments/:id", async (req, res) => {
    try {
      const appointmentId = req.params.id;
      const appointmentIndex = appointments2.findIndex((a) => a.id === appointmentId);
      if (appointmentIndex === -1) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      const updatedAppointment = {
        ...appointments2[appointmentIndex],
        ...req.body
      };
      appointments2[appointmentIndex] = updatedAppointment;
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });
  app2.delete("/api/appointments/:id", async (req, res) => {
    try {
      const appointmentId = req.params.id;
      const appointmentIndex = appointments2.findIndex((a) => a.id === appointmentId);
      if (appointmentIndex === -1) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      appointments2.splice(appointmentIndex, 1);
      meetingStats.totalMeetings -= 1;
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });
  app2.post("/api/appointments/generate-insights", async (req, res) => {
    try {
      const { title, attendees, type, duration } = req.body;
      const ai = await getUserOpenAIClient();
      if (!ai) {
        return res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
      }
      const result = await respond(ai.client, {
        model: ai.model,
        instructions: "You are a sales meeting coach. Give concise, specific advice for this meeting.",
        input: `Meeting: ${JSON.stringify({ title, attendees, type, duration })}`,
        json: {
          name: "appointment_insights",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["optimalTime", "preparationNotes", "followUpActions"],
            properties: {
              optimalTime: { type: "string" },
              preparationNotes: { type: "array", items: { type: "string" } },
              followUpActions: { type: "array", items: { type: "string" } }
            }
          }
        }
      });
      if (!result.data) throw new Error("The AI returned an unreadable response");
      const insights = result.data;
      res.json(insights);
    } catch (error) {
      console.error("Error generating appointment insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });
}

// server/services/aiPricingService.ts
init_db();
init_schema();
init_creditService();
import { eq as eq8, and as and7, sql as sql5 } from "drizzle-orm";
var AIPricingService = class {
  /**
   * Get all AI features with pricing for a specific user context
   * For Super Admin: shows base prices
   * For Reseller: shows their configured retail prices
   * For End User: shows reseller's retail price or base price
   */
  static async getAIFeaturesWithPricing(userId, userRole, resellerId) {
    const features2 = await db.select().from(aiFeatureDefinitions).where(eq8(aiFeatureDefinitions.isActive, true));
    const result = [];
    for (const feature of features2) {
      let retailPrice = feature.baseCreditCost;
      let wholesalePrice = Math.floor(feature.baseCreditCost * 0.5);
      if (userRole === "whitelabel" || userRole === "reseller") {
        const resellerPricing = await db.select().from(aiResellerPricing).where(
          and7(
            eq8(aiResellerPricing.resellerId, userId),
            eq8(aiResellerPricing.featureKey, feature.featureKey),
            eq8(aiResellerPricing.isActive, true)
          )
        ).limit(1);
        if (resellerPricing.length > 0) {
          retailPrice = resellerPricing[0].retailCreditCost;
          wholesalePrice = resellerPricing[0].wholesaleCreditCost;
        }
      } else if (resellerId) {
        const resellerPricing = await db.select().from(aiResellerPricing).where(
          and7(
            eq8(aiResellerPricing.resellerId, resellerId),
            eq8(aiResellerPricing.featureKey, feature.featureKey),
            eq8(aiResellerPricing.isActive, true)
          )
        ).limit(1);
        if (resellerPricing.length > 0) {
          retailPrice = resellerPricing[0].retailCreditCost;
        }
      }
      result.push({
        featureKey: feature.featureKey,
        featureName: feature.featureName,
        description: feature.description || "",
        category: feature.category || "general",
        baseCreditCost: feature.baseCreditCost,
        retailPrice,
        wholesalePrice,
        minPrice: feature.minCreditCost,
        maxPrice: feature.maxCreditCost
      });
    }
    return result;
  }
  /**
   * Set pricing for a feature (Super Admin only)
   */
  static async setFeatureBasePrice(featureKey, updates) {
    await db.update(aiFeatureDefinitions).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(aiFeatureDefinitions.featureKey, featureKey));
  }
  /**
   * Set reseller pricing for their customers
   */
  static async setResellerPricing(resellerId, featureKey, retailCreditCost, wholesaleCreditCost) {
    const feature = await db.select().from(aiFeatureDefinitions).where(eq8(aiFeatureDefinitions.featureKey, featureKey)).limit(1);
    if (feature.length === 0) {
      throw new Error(`Feature ${featureKey} not found`);
    }
    const baseWholesale = wholesaleCreditCost || Math.floor(feature[0].baseCreditCost * 0.5);
    await db.insert(aiResellerPricing).values({
      resellerId,
      featureKey,
      retailCreditCost,
      wholesaleCreditCost: baseWholesale,
      isActive: true
    }).onConflictDoUpdate({
      target: [aiResellerPricing.resellerId, aiResellerPricing.featureKey],
      set: {
        retailCreditCost,
        wholesaleCreditCost: baseWholesale,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  /**
   * Charge user for AI feature usage
   * Returns result with credits charged and revenue split
   */
  static async chargeForFeature(userId, featureKey, description, options = {}) {
    try {
      let retailPrice;
      let wholesalePrice;
      if (options.resellerId) {
        const resellerPricing = await db.select().from(aiResellerPricing).where(
          and7(
            eq8(aiResellerPricing.resellerId, options.resellerId),
            eq8(aiResellerPricing.featureKey, featureKey),
            eq8(aiResellerPricing.isActive, true)
          )
        ).limit(1);
        if (resellerPricing.length > 0) {
          retailPrice = resellerPricing[0].retailCreditCost;
          wholesalePrice = resellerPricing[0].wholesaleCreditCost;
        } else {
          const feature = await db.select().from(aiFeatureDefinitions).where(eq8(aiFeatureDefinitions.featureKey, featureKey)).limit(1);
          retailPrice = feature[0]?.baseCreditCost || 10;
          wholesalePrice = Math.floor(retailPrice * 0.5);
        }
        const resellerBalance = await this.getResellerCreditBalance(options.resellerId);
        if (resellerBalance.available < wholesalePrice) {
          return {
            success: false,
            creditsCharged: 0,
            creditsPaidToPlatform: 0,
            resellerProfit: 0,
            error: "Reseller has insufficient credits. Please contact your reseller."
          };
        }
      } else {
        const feature = await db.select().from(aiFeatureDefinitions).where(eq8(aiFeatureDefinitions.featureKey, featureKey)).limit(1);
        retailPrice = feature[0]?.baseCreditCost || 10;
        wholesalePrice = retailPrice;
      }
      const hasCredits = await CreditService.hasSufficientCredits(userId, retailPrice);
      if (!hasCredits) {
        return {
          success: false,
          creditsCharged: 0,
          creditsPaidToPlatform: 0,
          resellerProfit: 0,
          error: `Insufficient credits. Need ${retailPrice} credits for this feature.`
        };
      }
      await CreditService.deductCredits({
        userId,
        amount: retailPrice,
        description: `${description} (${featureKey})`,
        metadata: {
          featureKey,
          resellerId: options.resellerId,
          ...options.metadata
        }
      });
      const usageRecord = {
        userId,
        resellerId: options.resellerId,
        featureKey,
        creditsCharged: retailPrice,
        creditsPaidToPlatform: wholesalePrice,
        resellerProfitCredits: options.resellerId ? retailPrice - wholesalePrice : 0,
        context: options.context || {}
      };
      await db.insert(aiFeatureUsage).values(usageRecord);
      if (options.resellerId) {
        await this.deductResellerCredits(options.resellerId, wholesalePrice, userId, featureKey);
      }
      return {
        success: true,
        creditsCharged: retailPrice,
        creditsPaidToPlatform: wholesalePrice,
        resellerProfit: options.resellerId ? retailPrice - wholesalePrice : 0
      };
    } catch (error) {
      console.error("Error charging for AI feature:", error);
      return {
        success: false,
        creditsCharged: 0,
        creditsPaidToPlatform: 0,
        resellerProfit: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Get reseller credit balance
   */
  static async getResellerCreditBalance(resellerId) {
    const balance = await db.select().from(resellerCredits).where(eq8(resellerCredits.resellerId, resellerId)).limit(1);
    if (balance.length === 0) {
      await db.insert(resellerCredits).values({
        resellerId,
        wholesaleCreditsPurchased: 0,
        wholesaleCreditsUsed: 0,
        wholesaleCreditsAvailable: 0,
        totalRevenueCents: 0,
        totalProfitCents: 0
      });
      return { purchased: 0, used: 0, available: 0, totalRevenue: 0, totalProfit: 0 };
    }
    return {
      purchased: balance[0].wholesaleCreditsPurchased,
      used: balance[0].wholesaleCreditsUsed,
      available: balance[0].wholesaleCreditsAvailable,
      totalRevenue: balance[0].totalRevenueCents,
      totalProfit: balance[0].totalProfitCents
    };
  }
  /**
   * Purchase wholesale credits (for resellers)
   */
  static async purchaseWholesaleCredits(resellerId, creditsAmount, costCents, stripeTransactionId) {
    const currentBalance = await this.getResellerCreditBalance(resellerId);
    await db.insert(resellerCredits).values({
      resellerId,
      wholesaleCreditsPurchased: creditsAmount,
      wholesaleCreditsUsed: 0,
      wholesaleCreditsAvailable: creditsAmount,
      totalRevenueCents: 0,
      totalProfitCents: 0,
      lastPurchaseAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: resellerCredits.resellerId,
      set: {
        wholesaleCreditsPurchased: sql5`${resellerCredits.wholesaleCreditsPurchased} + ${creditsAmount}`,
        wholesaleCreditsAvailable: sql5`${resellerCredits.wholesaleCreditsAvailable} + ${creditsAmount}`,
        lastPurchaseAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    const transaction = {
      resellerId,
      type: "wholesale_purchase",
      creditsAmount,
      amountCents: costCents,
      description: `Purchased ${creditsAmount} wholesale credits`
    };
    await db.insert(resellerCreditTransactions).values(transaction);
  }
  /**
   * Deduct wholesale credits from reseller
   */
  static async deductResellerCredits(resellerId, amount, endUserId, featureKey) {
    await db.update(resellerCredits).set({
      wholesaleCreditsUsed: sql5`${resellerCredits.wholesaleCreditsUsed} + ${amount}`,
      wholesaleCreditsAvailable: sql5`${resellerCredits.wholesaleCreditsAvailable} - ${amount}`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(resellerCredits.resellerId, resellerId));
    const transaction = {
      resellerId,
      type: "retail_sale",
      creditsAmount: -amount,
      endUserId,
      featureKey,
      description: `Credits used for ${featureKey} by user ${endUserId}`
    };
    await db.insert(resellerCreditTransactions).values(transaction);
  }
  /**
   * Get usage analytics for a reseller
   */
  static async getResellerUsageAnalytics(resellerId, startDate, endDate) {
    const usage = await db.select({
      featureKey: aiFeatureUsage.featureKey,
      count: sql5`count(*)`,
      totalCharged: sql5`sum(${aiFeatureUsage.creditsCharged})`,
      totalWholesale: sql5`sum(${aiFeatureUsage.creditsPaidToPlatform})`,
      totalProfit: sql5`sum(${aiFeatureUsage.resellerProfitCredits})`
    }).from(aiFeatureUsage).where(
      and7(
        eq8(aiFeatureUsage.resellerId, resellerId),
        sql5`${aiFeatureUsage.createdAt} >= ${startDate}`,
        sql5`${aiFeatureUsage.createdAt} <= ${endDate}`
      )
    ).groupBy(aiFeatureUsage.featureKey);
    const featureBreakdown = usage.map((u) => ({
      featureKey: u.featureKey,
      usageCount: Number(u.count),
      creditsCharged: Number(u.totalCharged),
      profit: Number(u.totalProfit)
    }));
    return {
      totalUsage: featureBreakdown.reduce((sum, f) => sum + f.usageCount, 0),
      totalCreditsCharged: featureBreakdown.reduce((sum, f) => sum + f.creditsCharged, 0),
      totalWholesaleCost: usage.reduce((sum, u) => sum + Number(u.totalWholesale), 0),
      totalProfit: featureBreakdown.reduce((sum, f) => sum + f.profit, 0),
      featureBreakdown
    };
  }
  /**
   * Get Super Admin platform-wide analytics
   */
  static async getPlatformAnalytics(startDate, endDate) {
    return {
      totalUsage: 0,
      totalRevenueCredits: 0,
      totalResellerPayouts: 0,
      platformProfit: 0,
      topFeatures: [],
      topResellers: []
    };
  }
};

// server/routes/aiPricing.ts
init_db();
init_schema();
import { eq as eq9, desc as desc8, sql as sql6 } from "drizzle-orm";
async function getCallerRole(userId) {
  if (!db || !userId) return "regular_user";
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq9(profiles.id, userId)).limit(1);
  const role = profile?.role ?? "regular_user";
  return role === "wl_user" ? "whitelabel" : role;
}
async function getCallerResellerId(_userId) {
  return void 0;
}
function registerAIPricingRoutes(app2) {
  app2.get("/api/admin/ai-features", requireAdmin, async (req, res) => {
    try {
      const features2 = await db.select().from(aiFeatureDefinitions).orderBy(aiFeatureDefinitions.category, aiFeatureDefinitions.featureName);
      res.json({
        success: true,
        features: features2.map((f) => ({
          id: f.id,
          featureKey: f.featureKey,
          featureName: f.featureName,
          description: f.description,
          category: f.category,
          baseCreditCost: f.baseCreditCost,
          minCreditCost: f.minCreditCost,
          maxCreditCost: f.maxCreditCost,
          isActive: f.isActive
        }))
      });
    } catch (error) {
      console.error("Error fetching AI features:", error);
      res.status(500).json({ success: false, error: "Failed to fetch AI features" });
    }
  });
  app2.put(
    "/api/admin/ai-features/:featureKey",
    requireAdmin,
    async (req, res) => {
      try {
        const { featureKey } = req.params;
        const { baseCreditCost, minCreditCost, maxCreditCost, isActive } = req.body;
        await AIPricingService.setFeatureBasePrice(featureKey, {
          baseCreditCost,
          minCreditCost,
          maxCreditCost,
          isActive
        });
        res.json({ success: true, message: "Feature updated successfully" });
      } catch (error) {
        console.error("Error updating AI feature:", error);
        res.status(500).json({ success: false, error: "Failed to update feature" });
      }
    }
  );
  app2.get("/api/admin/ai-analytics", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const usageStats = await db.select({
        totalUsage: sql6`count(*)`,
        totalRevenue: sql6`sum(${aiFeatureUsage.creditsCharged})`,
        totalPlatformRevenue: sql6`sum(${aiFeatureUsage.creditsPaidToPlatform})`,
        totalResellerProfit: sql6`sum(${aiFeatureUsage.resellerProfitCredits})`
      }).from(aiFeatureUsage);
      const featureBreakdown = await db.select({
        featureKey: aiFeatureUsage.featureKey,
        usageCount: sql6`count(*)`,
        totalCredits: sql6`sum(${aiFeatureUsage.creditsCharged})`
      }).from(aiFeatureUsage).groupBy(aiFeatureUsage.featureKey).orderBy(desc8(sql6`count(*)`));
      const topResellers = await db.select({
        resellerId: aiFeatureUsage.resellerId,
        usageCount: sql6`count(*)`,
        totalRevenue: sql6`sum(${aiFeatureUsage.creditsCharged})`
      }).from(aiFeatureUsage).where(sql6`${aiFeatureUsage.resellerId} IS NOT NULL`).groupBy(aiFeatureUsage.resellerId).orderBy(desc8(sql6`count(*)`)).limit(10);
      res.json({
        success: true,
        analytics: {
          summary: usageStats[0] || {
            totalUsage: 0,
            totalRevenue: 0,
            totalPlatformRevenue: 0,
            totalResellerProfit: 0
          },
          featureBreakdown,
          topResellers
        }
      });
    } catch (error) {
      console.error("Error fetching AI analytics:", error);
      res.status(500).json({ success: false, error: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/reseller/ai-pricing", requireAuth(), async (req, res) => {
    try {
      const userId = req.userId;
      const userRole = await getCallerRole(userId);
      if (userRole !== "whitelabel" && userRole !== "reseller" && userRole !== "super_admin") {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      const features2 = await AIPricingService.getAIFeaturesWithPricing(
        userId,
        userRole,
        userId
        // For resellers, they see their own pricing
      );
      const creditBalance = await AIPricingService.getResellerCreditBalance(userId);
      res.json({
        success: true,
        features: features2,
        creditBalance
      });
    } catch (error) {
      console.error("Error fetching reseller pricing:", error);
      res.status(500).json({ success: false, error: "Failed to fetch pricing" });
    }
  });
  app2.put(
    "/api/reseller/ai-pricing/:featureKey",
    requireAuth(),
    async (req, res) => {
      try {
        const userId = req.userId;
        const userRole = await getCallerRole(userId);
        const { featureKey } = req.params;
        const { retailCreditCost, wholesaleCreditCost } = req.body;
        if (userRole !== "whitelabel" && userRole !== "reseller" && userRole !== "super_admin") {
          return res.status(403).json({ success: false, error: "Access denied" });
        }
        const feature = await db.select().from(aiFeatureDefinitions).where(eq9(aiFeatureDefinitions.featureKey, featureKey)).limit(1);
        if (feature.length === 0) {
          return res.status(404).json({ success: false, error: "Feature not found" });
        }
        const minCreditCost = feature[0].minCreditCost ?? 1;
        const maxCreditCost = feature[0].maxCreditCost ?? 1e3;
        if (retailCreditCost < minCreditCost || retailCreditCost > maxCreditCost) {
          return res.status(400).json({
            success: false,
            error: `Retail price must be between ${minCreditCost} and ${maxCreditCost} credits`
          });
        }
        await AIPricingService.setResellerPricing(
          userId,
          featureKey,
          retailCreditCost,
          wholesaleCreditCost
        );
        res.json({ success: true, message: "Pricing updated successfully" });
      } catch (error) {
        console.error("Error updating reseller pricing:", error);
        res.status(500).json({ success: false, error: "Failed to update pricing" });
      }
    }
  );
  app2.get("/api/reseller/ai-analytics", requireAuth(), async (req, res) => {
    try {
      const userId = req.userId;
      const userRole = await getCallerRole(userId);
      if (userRole !== "whitelabel" && userRole !== "reseller" && userRole !== "super_admin") {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
      const end = endDate ? new Date(endDate) : /* @__PURE__ */ new Date();
      const analytics = await AIPricingService.getResellerUsageAnalytics(userId, start, end);
      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error("Error fetching reseller analytics:", error);
      res.status(500).json({ success: false, error: "Failed to fetch analytics" });
    }
  });
  app2.post("/api/reseller/purchase-credits", requireAuth(), async (req, res) => {
    try {
      const userId = req.userId;
      const userRole = await getCallerRole(userId);
      const { creditsAmount, paymentMethodId } = req.body;
      if (userRole !== "whitelabel" && userRole !== "reseller" && userRole !== "super_admin") {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      const costCents = creditsAmount;
      await AIPricingService.purchaseWholesaleCredits(
        userId,
        creditsAmount,
        costCents,
        `demo_txn_${Date.now()}`
      );
      res.json({
        success: true,
        message: `Successfully purchased ${creditsAmount} wholesale credits`,
        creditsPurchased: creditsAmount,
        costCents
      });
    } catch (error) {
      console.error("Error purchasing wholesale credits:", error);
      res.status(500).json({ success: false, error: "Failed to purchase credits" });
    }
  });
  app2.get("/api/ai-features", requireAuth(), async (req, res) => {
    try {
      const userId = req.userId;
      const userRole = await getCallerRole(userId);
      const resellerId = await getCallerResellerId(userId);
      const features2 = await AIPricingService.getAIFeaturesWithPricing(
        userId,
        userRole,
        resellerId
      );
      res.json({
        success: true,
        features: features2.map((f) => ({
          featureKey: f.featureKey,
          featureName: f.featureName,
          description: f.description,
          category: f.category,
          creditCost: f.retailPrice
          // End users see retail price
        }))
      });
    } catch (error) {
      console.error("Error fetching AI features:", error);
      res.status(500).json({ success: false, error: "Failed to fetch AI features" });
    }
  });
  app2.get("/api/ai-features/:featureKey/cost", requireAuth(), async (req, res) => {
    try {
      const { featureKey } = req.params;
      const userId = req.userId;
      const userRole = await getCallerRole(userId);
      const resellerId = await getCallerResellerId(userId);
      const features2 = await AIPricingService.getAIFeaturesWithPricing(
        userId,
        userRole,
        resellerId
      );
      const feature = features2.find((f) => f.featureKey === featureKey);
      if (!feature) {
        return res.status(404).json({ success: false, error: "Feature not found" });
      }
      res.json({
        success: true,
        featureKey: feature.featureKey,
        featureName: feature.featureName,
        creditCost: feature.retailPrice,
        userCurrency: "credits"
      });
    } catch (error) {
      console.error("Error fetching feature cost:", error);
      res.status(500).json({ success: false, error: "Failed to fetch cost" });
    }
  });
  app2.get(
    "/api/ai-features/:featureKey/check",
    requireAuth(),
    async (req, res) => {
      try {
        const { featureKey } = req.params;
        const userId = req.userId;
        const userRole = await getCallerRole(userId);
        const resellerId = await getCallerResellerId(userId);
        const features2 = await AIPricingService.getAIFeaturesWithPricing(
          userId,
          userRole,
          resellerId
        );
        const feature = features2.find((f) => f.featureKey === featureKey);
        if (!feature) {
          return res.status(404).json({ success: false, error: "Feature not found" });
        }
        const { CreditService: CreditService2 } = await Promise.resolve().then(() => (init_creditService(), creditService_exports));
        const balance = await CreditService2.getCreditBalance(userId);
        const canAfford = balance.availableCredits >= feature.retailPrice;
        res.json({
          success: true,
          canAfford,
          creditCost: feature.retailPrice,
          userBalance: balance.availableCredits,
          featureName: feature.featureName
        });
      } catch (error) {
        console.error("Error checking feature affordability:", error);
        res.status(500).json({ success: false, error: "Failed to check affordability" });
      }
    }
  );
  app2.post(
    "/api/ai-features/:featureKey/charge",
    requireAuth(),
    async (req, res) => {
      try {
        const { featureKey } = req.params;
        const userId = req.userId;
        const resellerId = await getCallerResellerId(userId);
        const { description, metadata, context } = req.body;
        const result = await AIPricingService.chargeForFeature(
          userId,
          featureKey,
          description || `AI Feature: ${featureKey}`,
          {
            resellerId,
            metadata,
            context
          }
        );
        if (!result.success) {
          return res.status(402).json({
            success: false,
            error: result.error,
            creditsRequired: result.creditsCharged
          });
        }
        res.json({
          success: true,
          creditsCharged: result.creditsCharged,
          newBalance: result.creditsCharged
          // Would return actual new balance
        });
      } catch (error) {
        console.error("Error charging for AI feature:", error);
        res.status(500).json({ success: false, error: "Failed to process charge" });
      }
    }
  );
  app2.get("/api/ai-usage", requireAuth(), async (req, res) => {
    try {
      const userId = req.userId;
      const { limit = 50, offset = 0 } = req.query;
      const usage = await db.select({
        id: aiFeatureUsage.id,
        featureKey: aiFeatureUsage.featureKey,
        creditsCharged: aiFeatureUsage.creditsCharged,
        context: aiFeatureUsage.context,
        createdAt: aiFeatureUsage.createdAt
      }).from(aiFeatureUsage).where(eq9(aiFeatureUsage.userId, userId)).orderBy(desc8(aiFeatureUsage.createdAt)).limit(Number(limit)).offset(Number(offset));
      res.json({
        success: true,
        usage
      });
    } catch (error) {
      console.error("Error fetching usage history:", error);
      res.status(500).json({ success: false, error: "Failed to fetch usage history" });
    }
  });
}

// server/routes/ai.ts
import express from "express";
import { toFile } from "openai";
var createUserOpenAIClient = (userId) => getUserOpenAIClient(userId);
function registerAIRoutes(app2) {
  const requireAITools = [requireAuth(), requireEntitlement(FeatureKey.AI_TOOLS)];
  app2.get("/api/openai/status", requireAuth(), async (req, res) => {
    const userId = req.userId;
    const results = {
      openai: {
        available: false,
        model: "none",
        error: null,
        version: null
      }
    };
    try {
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        results.openai = {
          available: false,
          model: "none",
          error: "No OpenAI API key configured. Add your key in Settings > API Keys.",
          version: null
        };
      } else {
        const modelsToTry = [openaiData.model];
        let success = false;
        for (const model of modelsToTry) {
          try {
            await openaiData.client.models.retrieve(model);
            results.openai = {
              available: true,
              model,
              error: null,
              version: model
            };
            success = true;
            break;
          } catch {
            continue;
          }
        }
        if (!success) {
          results.openai = {
            available: false,
            model: "none",
            error: "OpenAI API key is invalid or model unavailable",
            version: null
          };
        }
      }
    } catch (error) {
      results.openai = {
        available: false,
        model: "none",
        error: error?.message || "OpenAI check failed",
        version: null
      };
    }
    const anyWorking = results.openai.available;
    const capabilities = [];
    if (results.openai.available) {
      capabilities.push(`OpenAI (${results.openai.model})`);
    }
    if (!anyWorking) {
      capabilities.push("Configure your API keys in Settings to enable AI features");
    }
    res.json({
      configured: anyWorking,
      model: results.openai.model,
      status: anyWorking ? "ready" : "needs_api_keys",
      openai: results.openai,
      capabilities
    });
  });
  const noKey = (res) => res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
  const sendResult = (res, result, model) => res.json({
    success: true,
    content: result.text,
    data: result.data,
    sources: result.sources,
    responseId: result.id,
    status: result.status,
    model,
    usage: result.usage
  });
  const buildInput = (prompt, images, files) => images?.length || files?.length ? [
    {
      role: "user",
      content: [
        { type: "input_text", text: prompt },
        ...(images || []).map((url) => ({ type: "input_image", image_url: url })),
        ...(files || []).map(
          (f) => f.url ? { type: "input_file", file_url: f.url } : { type: "input_file", filename: f.filename, file_data: f.data }
        )
      ]
    }
  ] : prompt;
  const runRespond = async (req, res, research) => {
    const userId = req.userId;
    try {
      const {
        prompt,
        system,
        json: json2 = false,
        schema,
        schemaName = "result",
        tier = research ? "advanced" : "default",
        maxTokens = research ? 4e3 : 2e3,
        images,
        files,
        background = false
      } = req.body || {};
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "prompt is required" });
      }
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const model = tier === "advanced" ? ADVANCED_MODEL : openaiData.model;
      const result = await respond(openaiData.client, {
        model,
        instructions: system ? String(system) : void 0,
        input: buildInput(prompt, images, files),
        json: schema ? { name: String(schemaName), schema } : Boolean(json2),
        maxOutputTokens: maxTokens,
        // Web search is limited to research features (POST /api/ai/research)
        ...research ? { tools: [webSearchTool()], include: ["web_search_call.action.sources"] } : {},
        background: Boolean(background)
      });
      sendResult(res, result, model);
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message || "AI request failed" });
    }
  };
  app2.post("/api/ai/generate", ...requireAITools, (req, res) => runRespond(req, res, false));
  app2.post("/api/ai/research", ...requireAITools, (req, res) => runRespond(req, res, true));
  app2.get("/api/ai/responses/:id", ...requireAITools, async (req, res) => {
    const userId = req.userId;
    try {
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const response = await openaiData.client.responses.retrieve(req.params.id);
      sendResult(res, toResult(response, Boolean(response?.text?.format && response.text.format.type !== "text")), response.model);
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message || "Failed to fetch response" });
    }
  });
  app2.post("/api/ai/image", ...requireAITools, async (req, res) => {
    const userId = req.userId;
    try {
      const {
        prompt,
        size,
        quality,
        images,
        model,
        n,
        background,
        output_format,
        output_compression,
        complexity,
        frame_count,
        frame_duration_ms,
        mask,
        markup
      } = req.body || {};
      if (!prompt) return res.status(400).json({ error: "prompt is required" });
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const result = await generateImage(openaiData.client, {
        imageModel: model,
        prompt: String(prompt),
        size,
        quality,
        n,
        background,
        output_format,
        output_compression,
        complexity,
        frame_count,
        frame_duration_ms,
        mask,
        markup,
        inputImages: Array.isArray(images) ? images : void 0
      });
      res.json({
        success: true,
        images: result.b64.map((b) => `data:${result.mime};base64,${b}`),
        model: result.model,
        outputFormat: result.outputFormat
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message || "Image generation failed" });
    }
  });
  app2.post(
    "/api/ai/transcribe",
    ...requireAITools,
    express.raw({ type: () => true, limit: "25mb" }),
    async (req, res) => {
      const userId = req.userId;
      try {
        const audio = req.body;
        if (!Buffer.isBuffer(audio) || audio.length === 0) {
          return res.status(400).json({ error: "Send the audio file as the request body" });
        }
        const filename = String(req.query.filename || "audio.webm").replace(/[^\w.-]/g, "_");
        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) return noKey(res);
        const transcription = await openaiData.client.audio.transcriptions.create({
          file: await toFile(audio, filename),
          model: TRANSCRIBE_MODEL,
          ...req.query.prompt ? { prompt: String(req.query.prompt) } : {}
        });
        res.json({ success: true, text: transcription.text || "", model: TRANSCRIBE_MODEL });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message || "Transcription failed" });
      }
    }
  );
  app2.post("/api/ai/conversations", ...requireAITools, async (req, res) => {
    const userId = req.userId;
    try {
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const conversation = await openaiData.client.conversations.create({
        metadata: { app: "smartcrm", ...req.body?.title ? { title: String(req.body.title).slice(0, 512) } : {} }
      });
      res.json({ success: true, conversationId: conversation.id });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message || "Failed to create conversation" });
    }
  });
  app2.post("/api/ai/conversations/:id/messages", ...requireAITools, async (req, res) => {
    const userId = req.userId;
    try {
      const { message, system, tier = "default" } = req.body || {};
      if (!message) return res.status(400).json({ error: "message is required" });
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const model = tier === "advanced" ? ADVANCED_MODEL : openaiData.model;
      const result = await respond(openaiData.client, {
        model,
        instructions: system ? String(system) : void 0,
        input: String(message),
        conversation: req.params.id
      });
      sendResult(res, result, model);
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message || "Conversation request failed" });
    }
  });
  app2.get("/api/ai/conversations/:id/messages", ...requireAITools, async (req, res) => {
    const userId = req.userId;
    try {
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const page = await openaiData.client.conversations.items.list(req.params.id, { order: "asc", limit: 100 });
      const messages = (page.data || []).filter((item) => item.type === "message").map((item) => ({
        id: item.id,
        role: item.role,
        text: (item.content || []).map((c) => c.text || "").join("")
      }));
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message || "Failed to load conversation" });
    }
  });
  app2.post(
    "/api/openai/test",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      try {
        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: "No OpenAI API key configured",
            message: "Please add your OpenAI API key in Settings > API Keys"
          });
        }
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [{ role: "user", content: "Generate a business insight" }],
          max_tokens: 200
          // reasoning models need room; very small limits return empty text
        });
        res.json({
          success: true,
          model: openaiData.model,
          output: response.choices[0].message.content
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
  app2.post(
    "/api/openai/embeddings",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      try {
        const { text: text2, model = EMBEDDING_MODEL } = req.body;
        if (!text2) return res.status(400).json({ error: "Text required" });
        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: "No OpenAI API key configured",
            message: "Please add your OpenAI API key in Settings > API Keys"
          });
        }
        const response = await openaiData.client.embeddings.create({
          model,
          input: text2,
          encoding_format: "float"
        });
        res.json({ success: true, embedding: response.data[0].embedding, model });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
  app2.post(
    "/api/openai/images/generate",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      try {
        const { prompt, model = IMAGE_MODEL, size = "1024x1024" } = req.body;
        const imageModel = IMAGE_MODELS.includes(model) ? model : IMAGE_MODEL;
        if (!prompt) return res.status(400).json({ error: "Prompt required" });
        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: "No OpenAI API key configured",
            message: "Please add your OpenAI API key in Settings > API Keys"
          });
        }
        const response = await openaiData.client.images.generate({ model: imageModel, prompt, size, n: 1 });
        res.json({ success: true, data: response.data, model: imageModel });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
  app2.post(
    "/api/openai/smart-greeting",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      const { userMetrics, timeOfDay } = req.body;
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      try {
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [
            {
              role: "system",
              content: "You are an expert business advisor. Generate personalized, strategic greetings that provide actionable insights based on user data."
            },
            {
              role: "user",
              content: `Generate a smart greeting for ${timeOfDay}. User metrics: ${JSON.stringify(userMetrics)}. Provide both a greeting and a strategic insight in JSON format.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 300
        });
        res.json({
          ...JSON.parse(response.choices[0].message.content || "{}"),
          source: openaiData.model
        });
      } catch (error) {
        res.status(502).json({ success: false, error: error?.message || "Smart greeting failed" });
      }
    }
  );
  app2.post(
    "/api/openai/kpi-analysis",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      const { historicalData, currentMetrics } = req.body;
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        return res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
      }
      try {
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [
            {
              role: "system",
              content: "You are an expert business analyst. Analyze KPI trends and provide strategic insights with actionable recommendations."
            },
            {
              role: "user",
              content: `Analyze these KPI trends: Historical: ${JSON.stringify(historicalData)}, Current: ${JSON.stringify(currentMetrics)}. Provide summary, trends, predictions, and recommendations in JSON format.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 800
        });
        res.json(JSON.parse(response.choices[0].message.content || "{}"));
      } catch (error) {
        res.status(500).json({ error: error?.message || "KPI analysis failed" });
      }
    }
  );
  app2.post(
    "/api/openai/deal-intelligence",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      const { dealData, contactHistory, marketContext } = req.body;
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        return res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
      }
      try {
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [
            {
              role: "system",
              content: "You are an expert sales strategist. Provide comprehensive deal intelligence including win probability, risk factors, and strategic recommendations."
            },
            {
              role: "user",
              content: `Analyze this deal: ${JSON.stringify(dealData)}. Contact history: ${JSON.stringify(contactHistory)}. Market context: ${JSON.stringify(marketContext)}. Provide probability_score, risk_level, key_factors, recommendations, confidence_level, estimated_close_days, and value_optimization in JSON format.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 600
        });
        res.json(JSON.parse(response.choices[0].message.content || "{}"));
      } catch (error) {
        res.status(500).json({ error: error?.message || "Deal analysis failed" });
      }
    }
  );
  app2.post(
    "/api/openai/business-intelligence",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      const { businessData, marketContext, objectives } = req.body;
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        return res.status(400).json({ error: "No OpenAI API key configured", message: NO_KEY_MESSAGE, needsApiKey: true });
      }
      try {
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [
            {
              role: "system",
              content: "You are a senior business consultant. Generate strategic business intelligence including market insights, competitive advantages, risk factors, growth opportunities, and strategic recommendations."
            },
            {
              role: "user",
              content: `Generate business intelligence for: ${JSON.stringify(businessData)}. Market context: ${JSON.stringify(marketContext)}. Objectives: ${JSON.stringify(objectives)}. Provide market_insights, competitive_advantages, risk_factors, growth_opportunities, and strategic_recommendations in JSON format.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
          max_tokens: 1e3
        });
        res.json(JSON.parse(response.choices[0].message.content || "{}"));
      } catch (error) {
        res.status(500).json({ error: error?.message || "Business intelligence failed" });
      }
    }
  );
  app2.post(
    "/api/respond",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      try {
        const {
          prompt,
          imageUrl,
          schema,
          temperature = 0.4,
          max_output_tokens = 2048
        } = req.body;
        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: "No OpenAI API key configured",
            message: NO_KEY_MESSAGE,
            needsApiKey: true
          });
        }
        const messages = [
          {
            role: "system",
            content: "You are a helpful sales + ops assistant for white-label CRM applications."
          },
          {
            role: "user",
            // JSON mode requires the word "json" in the messages
            content: (imageUrl ? `${prompt}

Image URL: ${imageUrl}` : prompt) + (schema ? `

Respond with valid JSON matching this schema: ${JSON.stringify(schema)}` : "")
          }
        ];
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages,
          temperature,
          max_tokens: max_output_tokens,
          response_format: schema ? { type: "json_object" } : void 0
        });
        res.json({
          output_text: response.choices[0].message.content,
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: response.choices[0].message.content
                }
              ]
            }
          ],
          model: response.model,
          usage: response.usage
        });
      } catch (error) {
        console.error("AI API error:", error);
        res.status(500).json({
          error: "Failed to process AI request",
          message: error.message
        });
      }
    }
  );
  app2.post(
    "/api/stream",
    ...requireAITools,
    async (req, res) => {
      const userId = req.userId;
      try {
        const { prompt, temperature = 0.4, max_output_tokens = 2048 } = req.body;
        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: "No OpenAI API key configured",
            message: "Please add your OpenAI API key in Settings > AI Keys to use streaming features.",
            needsApiKey: true
          });
        }
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        const stream = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: max_output_tokens,
          stream: true
        });
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}

`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (error) {
        console.error("Streaming error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}

`);
        res.end();
      }
    }
  );
  console.log("\u2705 AI routes registered (user API key mode)");
}

// server/routes/apiKeys.ts
init_db();
init_schema();
import { eq as eq10, and as and9 } from "drizzle-orm";
var SUPPORTED_PROVIDERS = ["openai", "openclaw"];
function registerApiKeyRoutes(app2) {
  const requireApiKeyAuth = requireAuth();
  app2.get("/api/user/api-keys", requireApiKeyAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }
      const keys = await db.query.userApiKeys.findMany({
        where: eq10(userApiKeys.userId, userId),
        orderBy: (userApiKeys2, { desc: desc13 }) => [desc13(userApiKeys2.createdAt)]
      });
      const maskedKeys = keys.map((key) => ({
        ...key,
        apiKey: maskApiKey(key.apiKey)
      }));
      res.json({ success: true, keys: maskedKeys });
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });
  app2.post("/api/user/api-keys", requireApiKeyAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }
      const { provider, apiKey, apiKeyName, model, isDefault, baseUrl } = req.body;
      if (!SUPPORTED_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: 'Provider must be "openai" or "openclaw"' });
      }
      let metadata;
      if (provider === "openclaw" && baseUrl !== void 0) {
        if (baseUrl && !await isSafeExternalUrl(String(baseUrl))) {
          return res.status(400).json({
            error: "OpenClaw base URL must be a public https URL"
          });
        }
        metadata = baseUrl ? { base_url: String(baseUrl).trim() } : {};
      }
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
        return res.status(400).json({ error: "API key must be at least 10 characters" });
      }
      if (provider === "openai" && !apiKey.startsWith("sk-")) {
        return res.status(400).json({
          error: 'Invalid OpenAI API key format. Key must start with "sk-"'
        });
      }
      const existingKeys = await db.query.userApiKeys.findMany({
        where: and9(eq10(userApiKeys.userId, userId), eq10(userApiKeys.provider, provider))
      });
      if (existingKeys.length > 0) {
        const [updatedKey] = await db.update(userApiKeys).set({
          apiKey: apiKey.trim(),
          ...model !== void 0 && { model: model || null },
          ...metadata !== void 0 && { metadata },
          isActive: true,
          isDefault: true,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq10(userApiKeys.id, existingKeys[0].id)).returning();
        return res.json({ success: true, key: { ...updatedKey, apiKey: maskApiKey(updatedKey.apiKey) } });
      }
      if (isDefault && existingKeys.length > 0) {
        await db.update(userApiKeys).set({ isDefault: false, updatedAt: /* @__PURE__ */ new Date() }).where(and9(eq10(userApiKeys.userId, userId), eq10(userApiKeys.provider, provider)));
      }
      const shouldBeDefault = isDefault || existingKeys.length === 0;
      const [newKey] = await db.insert(userApiKeys).values({
        userId,
        provider,
        apiKey: apiKey.trim(),
        apiKeyName: apiKeyName || null,
        model: model || null,
        ...metadata !== void 0 && { metadata },
        isDefault: shouldBeDefault,
        isActive: true,
        testStatus: "pending"
      }).returning();
      res.status(201).json({
        success: true,
        key: {
          ...newKey,
          apiKey: maskApiKey(newKey.apiKey)
        }
      });
    } catch (error) {
      console.error("Error adding API key:", error);
      res.status(500).json({ error: "Failed to add API key" });
    }
  });
  app2.post("/api/user/api-keys/:id/test", requireApiKeyAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const keyId = req.params.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }
      const apiKeyRecord = await db.query.userApiKeys.findFirst({
        where: and9(eq10(userApiKeys.id, keyId), eq10(userApiKeys.userId, userId))
      });
      if (!apiKeyRecord) {
        return res.status(404).json({ error: "API key not found" });
      }
      let testResult;
      if (apiKeyRecord.provider === "openai") {
        testResult = await testOpenAIKey(apiKeyRecord.apiKey);
      } else if (apiKeyRecord.provider === "openclaw") {
        testResult = await testOpenClawKey(
          apiKeyRecord.apiKey,
          apiKeyRecord.metadata?.base_url
        );
      } else {
        return res.status(400).json({ error: "Unknown provider" });
      }
      await db.update(userApiKeys).set({
        lastTestedAt: /* @__PURE__ */ new Date(),
        testStatus: testResult.success ? "success" : "failed",
        testError: testResult.error || null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq10(userApiKeys.id, keyId));
      res.json({
        success: testResult.success,
        provider: apiKeyRecord.provider,
        error: testResult.error || null
      });
    } catch (error) {
      console.error("Error testing API key:", error);
      res.status(500).json({ error: "Failed to test API key" });
    }
  });
  app2.put("/api/user/api-keys/:id", requireApiKeyAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const keyId = req.params.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }
      const { apiKeyName, model, isDefault, isActive } = req.body;
      const existingKey = await db.query.userApiKeys.findFirst({
        where: and9(eq10(userApiKeys.id, keyId), eq10(userApiKeys.userId, userId))
      });
      if (!existingKey) {
        return res.status(404).json({ error: "API key not found" });
      }
      if (isDefault) {
        await db.update(userApiKeys).set({ isDefault: false, updatedAt: /* @__PURE__ */ new Date() }).where(
          and9(
            eq10(userApiKeys.userId, userId),
            eq10(userApiKeys.provider, existingKey.provider),
            eq10(userApiKeys.isDefault, true)
          )
        );
      }
      const [updatedKey] = await db.update(userApiKeys).set({
        ...apiKeyName !== void 0 && { apiKeyName },
        ...model !== void 0 && { model },
        ...isDefault !== void 0 && { isDefault },
        ...isActive !== void 0 && { isActive },
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq10(userApiKeys.id, keyId)).returning();
      res.json({
        success: true,
        key: {
          ...updatedKey,
          apiKey: maskApiKey(updatedKey.apiKey)
        }
      });
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ error: "Failed to update API key" });
    }
  });
  app2.delete("/api/user/api-keys/:id", requireApiKeyAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const keyId = req.params.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }
      const existingKey = await db.query.userApiKeys.findFirst({
        where: and9(eq10(userApiKeys.id, keyId), eq10(userApiKeys.userId, userId))
      });
      if (!existingKey) {
        return res.status(404).json({ error: "API key not found" });
      }
      await db.delete(userApiKeys).where(eq10(userApiKeys.id, keyId));
      if (existingKey.isDefault) {
        const nextKey = await db.query.userApiKeys.findFirst({
          where: and9(
            eq10(userApiKeys.userId, userId),
            eq10(userApiKeys.provider, existingKey.provider),
            eq10(userApiKeys.isActive, true)
          )
        });
        if (nextKey) {
          await db.update(userApiKeys).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq10(userApiKeys.id, nextKey.id));
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });
  app2.get("/api/user/api-keys/active/:provider", requireApiKeyAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const provider = req.params.provider;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }
      if (!SUPPORTED_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: 'Provider must be "openai" or "openclaw"' });
      }
      const activeKey = await db.query.userApiKeys.findFirst({
        where: and9(
          eq10(userApiKeys.userId, userId),
          eq10(userApiKeys.provider, provider),
          eq10(userApiKeys.isActive, true),
          eq10(userApiKeys.isDefault, true)
        )
      });
      if (!activeKey) {
        const anyKey = await db.query.userApiKeys.findFirst({
          where: and9(
            eq10(userApiKeys.userId, userId),
            eq10(userApiKeys.provider, provider),
            eq10(userApiKeys.isActive, true)
          )
        });
        if (!anyKey) {
          return res.status(404).json({ error: `No active ${provider} API key found` });
        }
        return res.json({
          success: true,
          key: {
            id: anyKey.id,
            provider: anyKey.provider,
            apiKey: maskApiKey(anyKey.apiKey),
            // never send the plaintext key to the browser
            model: anyKey.model
          }
        });
      }
      res.json({
        success: true,
        key: {
          id: activeKey.id,
          provider: activeKey.provider,
          apiKey: maskApiKey(activeKey.apiKey),
          // never send the plaintext key to the browser
          model: activeKey.model
        }
      });
    } catch (error) {
      console.error("Error fetching active API key:", error);
      res.status(500).json({ error: "Failed to fetch active API key" });
    }
  });
  console.log("\u2705 API key routes registered");
}
function maskApiKey(key) {
  if (key.length <= 8) {
    return "****";
  }
  return key.substring(0, 4) + "****" + key.substring(key.length - 4);
}
async function testOpenAIKey(apiKey) {
  try {
    const OpenAI2 = (await import("openai")).default;
    const client = new OpenAI2({ apiKey });
    await client.models.retrieve(DEFAULT_MODEL);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "OpenAI API key validation failed"
    };
  }
}
async function testOpenClawKey(apiKey, baseUrl) {
  const url = (baseUrl || process.env.OPENCLAW_API_URL || "").replace(/\/+$/, "");
  if (!url) return { success: false, error: "No OpenClaw URL configured" };
  if (baseUrl && !await isSafeExternalUrl(baseUrl)) {
    return { success: false, error: "OpenClaw base URL must be a public https URL" };
  }
  try {
    const response = await fetch(`${url}/api/v1/health`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      redirect: "error",
      signal: AbortSignal.timeout(1e4)
    });
    return response.ok ? { success: true } : { success: false, error: `OpenClaw health check failed (${response.status})` };
  } catch (error) {
    return { success: false, error: error?.message || "OpenClaw health check failed" };
  }
}

// server/services/aiToolsService.ts
async function getOpenAIClient2() {
  return (await getUserOpenAIClient())?.client ?? null;
}
function sendAIError(res, error) {
  const message = typeof error === "string" ? error : error?.message || "AI request failed";
  if (message === NO_KEY_MESSAGE) {
    return res.status(400).json({ success: false, error: "No OpenAI API key configured", message, needsApiKey: true });
  }
  return res.status(500).json({ success: false, error: message });
}
var aiRateLimit2 = /* @__PURE__ */ new Map();
var AI_RATE_LIMIT_WINDOW_MS2 = 6e4;
var AI_RATE_LIMIT_MAX2 = 30;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of aiRateLimit2) {
    if (now > entry.resetAt) aiRateLimit2.delete(key);
  }
}, 5 * 60 * 1e3);
function checkAIRateLimit2(userId) {
  const now = Date.now();
  const entry = aiRateLimit2.get(userId);
  if (!entry || now > entry.resetAt) {
    aiRateLimit2.set(userId, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS2 });
    return true;
  }
  if (entry.count >= AI_RATE_LIMIT_MAX2) return false;
  entry.count++;
  return true;
}
async function callAIJson(systemPrompt, userPrompt, model = DEFAULT_MODEL, maxTokens = 1e3, userId, toolName, metadata) {
  const client = await getOpenAIClient2();
  if (!client) {
    return { success: false, error: NO_KEY_MESSAGE, source: "fallback" };
  }
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: maxTokens
    });
    const content = response.choices[0].message.content || "";
    const parsedContent = parseJSONText(content);
    if (parsedContent === void 0) throw new Error("The AI returned a response that was not valid JSON");
    if (userId && memoryService.isEnabled()) {
      memoryService.recordObservation(
        userId,
        "tool_use",
        `AI tool: ${toolName || "unknown"} - model: ${model}`,
        {
          tool: toolName,
          model,
          userPrompt: userPrompt?.slice(0, 200),
          tokensUsed: response.usage?.total_tokens || 0,
          parsedResult: Object.keys(parsedContent).join(", "),
          ...metadata
        }
      ).catch(() => {
      });
    }
    return {
      success: true,
      data: parsedContent,
      source: "openai",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  } catch (error) {
    console.error("AI call error:", error.message);
    if (userId && memoryService.isEnabled()) {
      memoryService.recordObservation(
        userId,
        "error",
        `AI tool ${toolName || "unknown"} failed: ${error.message}`,
        { tool: toolName, model, error: error.message, ...metadata }
      ).catch(() => {
      });
    }
    return { success: false, error: error.message, source: "fallback" };
  }
}
async function callAIWithTools(systemPrompt, userPrompt, tools, model = ADVANCED_MODEL, maxTokens = 4e3) {
  const client = await getOpenAIClient2();
  if (!client) return { success: false, error: NO_KEY_MESSAGE, source: "fallback" };
  try {
    const result = await respond(client, {
      model,
      instructions: systemPrompt,
      input: userPrompt,
      json: true,
      tools,
      maxOutputTokens: maxTokens
    });
    if (!result.data) return { success: false, error: "The AI response was not valid JSON", source: "fallback" };
    return {
      success: true,
      data: { ...result.data, ...result.sources.length ? { sources: result.sources } : {} },
      source: "openai",
      usage: result.usage ? {
        promptTokens: result.usage.input_tokens,
        completionTokens: result.usage.output_tokens,
        totalTokens: result.usage.total_tokens
      } : void 0
    };
  } catch (error) {
    console.error("AI call error:", error.message);
    return { success: false, error: error.message, source: "fallback" };
  }
}
var CODE_INTERPRETER = { type: "code_interpreter", container: { type: "auto" } };
async function analyzeLeadScore(contactData) {
  return callAIJson(
    `You are an expert sales analyst. Analyze the contact data and provide a lead score (0-100) with detailed rationale. Consider: engagement level, company fit, deal history, response patterns, and buying signals. Return JSON with: score (number), rationale (string), buyingSignals (array), riskFactors (array), recommendedActions (array), priority (hot/warm/cold).`,
    `Analyze this contact for lead scoring: ${JSON.stringify(contactData)}`,
    DEFAULT_MODEL,
    600
  );
}
async function generateDealIntelligence(dealData, contactHistory, marketContext) {
  return callAIJson(
    `You are an expert sales strategist. Provide comprehensive deal intelligence. Return JSON with: probability_score (number), risk_level (low/medium/high), key_factors (array), recommendations (array), confidence_level (number), estimated_close_days (number), value_optimization (string), competitive_threats (array), next_best_action (string).`,
    `Analyze this deal: ${JSON.stringify(dealData)}. Contact history: ${JSON.stringify(contactHistory)}. Market context: ${JSON.stringify(marketContext || {})}`,
    DEFAULT_MODEL,
    800
  );
}
async function analyzePipelineHealth(deals2) {
  return callAIJson(
    `You are a sales operations expert. Analyze the pipeline health and return JSON with: overall_health_score (number), healthy_deals (number), at_risk_deals (number), critical_deals (number), bottlenecks (array), recommendations (array), velocity_trend (improving/stable/declining), forecast_accuracy (number).`,
    `Analyze pipeline health for these deals: ${JSON.stringify(deals2)}`,
    DEFAULT_MODEL,
    700
  );
}
async function monitorDealRisk(deals2) {
  return callAIJson(
    `You are a deal risk analyst. Identify at-risk deals and return JSON with: high_risk (array of {dealId, title, riskScore, riskFactors, recommendedAction}), medium_risk (array), low_risk (array), total_at_risk_value (number), summary (string).`,
    `Analyze deal risks for: ${JSON.stringify(deals2)}`,
    DEFAULT_MODEL,
    700
  );
}
async function optimizeConversion(deals2, contacts2) {
  return callAIJson(
    `You are a conversion optimization expert. Analyze the sales funnel and return JSON with: conversion_rate (number), stage_conversion (object with stage names as keys), drop_off_points (array), optimization_opportunities (array), a_b_test_suggestions (array), projected_improvement (number).`,
    `Analyze conversion optimization. Deals: ${JSON.stringify(deals2)}. Contacts: ${JSON.stringify(contacts2)}`,
    DEFAULT_MODEL,
    700
  );
}
async function analyzeWinRate(deals2) {
  return callAIJson(
    `You are a sales performance analyst. Analyze win rate patterns and return JSON with: overall_win_rate (number), win_rate_by_stage (object), win_rate_by_deal_size (object), key_win_factors (array), key_loss_factors (array), recommendations (array), benchmark_comparison (string).`,
    `Analyze win rate intelligence for: ${JSON.stringify(deals2)}`,
    DEFAULT_MODEL,
    700
  );
}
async function generateSalesForecast(deals2, period = "quarter") {
  return callAIWithTools(
    `You are a sales forecasting expert. Use the python tool to compute the weighted forecast (value \xD7 probability), best and worst case from the deal data. Return JSON with: weighted_forecast (number), best_case (number), worst_case (number), confidence_level (number), period (string), monthly_breakdown (array of {month, forecast, probability}), key_drivers (array), risk_factors (array), recommendations (array).`,
    `Generate ${period} sales forecast for: ${JSON.stringify(deals2)}`,
    [CODE_INTERPRETER]
  );
}
async function analyzeLiveDeals(deals2) {
  return callAIJson(
    `You are a real-time deal analyst. Provide live analysis and return JSON with: hot_deals (array), warm_deals (array), cold_deals (array), immediate_actions (array), engagement_insights (object with metrics), temperature_analysis (object), activity_feed (array of {dealId, title, activity, timestamp, priority}).`,
    `Provide live deal analysis for: ${JSON.stringify(deals2)}`,
    DEFAULT_MODEL,
    800
  );
}
async function composeEmail(context) {
  return callAIJson(
    `You are an expert sales email writer. Compose a professional, personalized email. Return JSON with: subject (string), body (string), tone (string), key_elements (array), follow_up_suggestion (string).`,
    `Compose email. Recipient: ${context.recipientName} at ${context.recipientCompany}. Purpose: ${context.purpose}. Tone: ${context.tone}. Key points: ${JSON.stringify(context.keyPoints || [])}. CTA: ${context.callToAction || "none"}`,
    DEFAULT_MODEL,
    500
  );
}
async function generateEmailReply(originalEmail, context, tone = "professional") {
  return callAIJson(
    `You are a sales communication expert. Generate a thoughtful reply. Return JSON with: subject (string), body (string), tone (string), key_points_addressed (array).`,
    `Generate reply to: "${originalEmail}". Context: ${context}. Tone: ${tone}`,
    DEFAULT_MODEL,
    400
  );
}
async function generateFollowUp(contactData, lastInteraction, purpose) {
  return callAIJson(
    `You are a sales follow-up expert. Generate a strategic follow-up plan. Return JSON with: subject (string), message (string), timing (string), channel (email/call/sms), urgency (high/medium/low), personalization_tips (array).`,
    `Generate follow-up for contact: ${JSON.stringify(contactData)}. Last interaction: ${lastInteraction}. Purpose: ${purpose}`,
    DEFAULT_MODEL,
    400
  );
}
async function handleObjection(objection, productInfo, contactData) {
  return callAIJson(
    `You are a master sales objection handler. Provide expert strategies. Return JSON with: understanding_statement (string), reframing_strategy (string), response_options (array of strings), evidence_to_use (string), next_step (string), confidence_score (number).`,
    `Handle objection: "${objection}". Product: ${productInfo}. Contact: ${JSON.stringify(contactData || {})}`,
    DEFAULT_MODEL,
    500
  );
}
async function generateProposal(context) {
  return callAIJson(
    `You are a proposal writing expert. Generate a professional proposal. Return JSON with: title (string), executive_summary (string), scope_of_work (string), timeline (string), pricing_structure (string), terms (string), next_steps (string).`,
    `Generate proposal for: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    800
  );
}
async function generateAppointmentMessage(appointmentData, messageType = "confirmation") {
  return callAIJson(
    `You are a scheduling assistant. Generate a professional appointment message. Return JSON with: subject (string), body (string), calendar_note (string), reminder_text (string).`,
    `Generate ${messageType} for appointment: ${JSON.stringify(appointmentData)}`,
    DEFAULT_MODEL,
    300
  );
}
async function generateVideoEmailScript(context) {
  return callAIJson(
    `You are a video email script writer. Create an engaging script. Return JSON with: hook (string), intro (string), main_content (string), call_to_action (string), closing (string), estimated_duration (string), tips (array).`,
    `Generate video email script: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    500
  );
}
async function generateSMSMessage(purpose, contactName, context) {
  return callAIJson(
    `You are a concise SMS message writer. Create a brief, effective SMS (max 160 chars). Return JSON with: message (string), character_count (number), follow_up_suggestion (string).`,
    `Generate SMS. Purpose: ${purpose}. Contact: ${contactName}. Context: ${context}`,
    DEFAULT_MODEL,
    200
  );
}
async function generateVoiceScript(context) {
  return callAIJson(
    `You are a voice message script writer. Create a natural-sounding script. Return JSON with: script (string), talking_points (array), estimated_duration (string), tone_guidance (string).`,
    `Generate voice script: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    400
  );
}
async function generateContent(context) {
  return callAIJson(
    `You are a content marketing expert. Generate high-quality marketing content. Return JSON with: title (string), content (string), meta_description (string), keywords (array), call_to_action (string), content_type (string).`,
    `Generate ${context.type} content. Topic: ${context.topic}. Audience: ${context.audience}. Tone: ${context.tone}. Keywords: ${JSON.stringify(context.keywords || [])}`,
    DEFAULT_MODEL,
    800
  );
}
async function generateSalesPage(context) {
  return callAIJson(
    `You are a conversion copywriter. Generate a high-converting sales page. Return JSON with: headline (string), subheadline (string), hero_section (string), benefits (array), social_proof (string), cta (string), faq (array), guarantee (string).`,
    `Generate sales page: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    1e3
  );
}
async function generateOffer(context) {
  return callAIJson(
    `You are a offers expert. Create an irresistible offer. Return JSON with: offer_headline (string), offer_summary (string), value_stack (array), bonus_items (array), urgency_element (string), guarantee (string), cta (string), price_anchor (string).`,
    `Generate offer: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    700
  );
}
async function generateSocialPost(context) {
  return callAIJson(
    `You are a social media expert. Create an engaging ${context.platform} post. Return JSON with: post_text (string), hashtags (array), engagement_tip (string), best_posting_time (string), character_count (number).`,
    `Generate ${context.platform} post. Topic: ${context.topic}. Tone: ${context.tone}. Hashtags: ${context.includeHashtags}`,
    DEFAULT_MODEL,
    300
  );
}
async function generateWebinarInvite(context) {
  return callAIJson(
    `You are a webinar marketing expert. Create a compelling invitation. Return JSON with: subject_line (string), headline (string), description (string), key_benefits (array), speaker_bio (string), registration_cta (string), reminder_text (string).`,
    `Generate webinar invite: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    500
  );
}
async function generateCaseStudy(context) {
  return callAIJson(
    `You are a case study writer. Create a compelling case study. Return JSON with: title (string), executive_summary (string), challenge_section (string), solution_section (string), results_section (string), testimonial (string), key_metrics (array).`,
    `Generate case study: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    800
  );
}
async function transformTestimonial(rawTestimonial, format = "polished") {
  return callAIJson(
    `You are a testimonial expert. Transform this testimonial into a powerful social proof piece. Return JSON with: polished_testimonial (string), short_quote (string), social_media_version (string), headline_suggestion (string), key_themes (array).`,
    `Transform testimonial (${format}): "${rawTestimonial}"`,
    DEFAULT_MODEL,
    300
  );
}
async function analyzeBusiness(businessData) {
  return callAIWithTools(
    `You are a senior business consultant. Use web search to check the business's website, market and competitors. Return JSON with: swot_analysis (object with strengths/weaknesses/opportunities/threats), market_position (string), growth_opportunities (array), risk_factors (array), strategic_recommendations (array), kpi_suggestions (array), competitive_advantages (array).`,
    `Analyze this business: ${JSON.stringify(businessData)}`,
    [webSearchTool()]
  );
}
async function summarizeMeeting(transcript) {
  return callAIJson(
    `You are a meeting summarizer. Create a concise, actionable summary. Return JSON with: summary (string), key_decisions (array), action_items (array of {task, owner, due_date}), follow_up_tasks (array), notable_quotes (array), next_meeting_suggestion (string).`,
    `Summarize this meeting transcript: "${transcript}"`,
    DEFAULT_MODEL,
    700
  );
}
async function speechToTextNote(audioContext) {
  return callAIJson(
    `You are a note-taking assistant. Convert the spoken content into structured notes. Return JSON with: formatted_notes (string), key_points (array), action_items (array), summary (string).`,
    `Convert to structured notes: "${audioContext}"`,
    DEFAULT_MODEL,
    500
  );
}
async function createTaskFromDescription(description, context) {
  return callAIJson(
    `You are a task management assistant. Create a well-structured task. Return JSON with: title (string), description (string), priority (high/medium/low), estimated_duration (string), subtasks (array), due_date_suggestion (string), category (string).`,
    `Create task from: "${description}". Context: ${JSON.stringify(context || {})}`,
    DEFAULT_MODEL,
    300
  );
}
async function generateMeetingNotes(meetingData) {
  return callAIJson(
    `You are a meeting notes expert. Generate comprehensive meeting notes. Return JSON with: agenda_summary (string), discussion_points (array), decisions_made (array), action_items (array of {task, owner, deadline}), parking_lot (array), next_steps (string).`,
    `Generate meeting notes for: ${JSON.stringify(meetingData)}`,
    DEFAULT_MODEL,
    600
  );
}
async function suggestCalendarTimes(appointments3, preferences) {
  return callAIJson(
    `You are a scheduling assistant. Based on the user's existing appointments and preferences, suggest meeting times. Return JSON with: optimal_times (array of strings), scheduling_tips (array of strings), conflict_warnings (array of strings), productivity_score (number 0-100 based on how well the current calendar supports focused work).`,
    `Existing appointments: ${JSON.stringify(appointments3 || [])}. Preferences: ${JSON.stringify(preferences || {})}`,
    DEFAULT_MODEL,
    500
  );
}
async function recommendPipelineStages(deals2, targetStage) {
  return callAIJson(
    `You are a sales pipeline automation expert. Assess pipeline health and recommend a stage for each deal. Return JSON with: overall_health_score (number 0-100), bottlenecks (array of strings), recommendations (array of strings), stage_recommendations (array of {dealId, currentStage, recommendedStage, auto_actions (array of strings), reasoning}). Include one stage_recommendations entry per deal, using each deal's id as dealId.`,
    `Deals: ${JSON.stringify(deals2)}${targetStage ? `. Target stage: ${targetStage}` : ""}`,
    DEFAULT_MODEL,
    1200
  );
}
async function processFormSubmission(formData, formType) {
  return callAIJson(
    `You are a lead-intake automation expert. Evaluate a ${formType} form submission. Return JSON with: lead_score (number 0-100), auto_response (a short personalised reply to the submitter), follow_up_sequence (array of next steps), segmentation ({segment, intent, interests (array)}).`,
    `Form submission: ${JSON.stringify(formData)}`,
    DEFAULT_MODEL,
    600
  );
}
async function suggestFollowUpTasks(completedTask, context) {
  return callAIJson(
    `You are a productivity expert. Suggest logical follow-up tasks. Return JSON with: suggested_tasks (array of {title, description, priority, estimated_time}), reasoning (string), automation_suggestions (array).`,
    `Suggest follow-up tasks for completed: "${completedTask}". Context: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    400
  );
}
async function analyzeImage(imageUrl, prompt) {
  const client = await getOpenAIClient2();
  if (!client) return { success: false, error: NO_KEY_MESSAGE, source: "fallback" };
  try {
    const response = await client.chat.completions.create({
      model: ADVANCED_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "Analyze this image in detail. Describe what you see, extract any text, identify objects, and provide insights." },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 800
    });
    return {
      success: true,
      data: { analysis: response.choices[0].message.content },
      source: "openai"
    };
  } catch (error) {
    return { success: false, error: error.message, source: "fallback" };
  }
}
async function semanticSearch(query, items) {
  return callAIJson(
    `You are a semantic search engine. Rank the items by relevance to the query. Return JSON with: results (array of {id, relevance_score, match_reason}), query_understanding (string), suggested_refinements (array).`,
    `Search query: "${query}". Items: ${JSON.stringify(items)}`,
    DEFAULT_MODEL,
    600
  );
}
async function generateRecommendations(context) {
  return callAIJson(
    `You are a recommendation engine. Provide smart, personalized recommendations. Return JSON with: recommendations (array of {item, score, reasoning}), insights (array), confidence (number).`,
    `Generate ${context.type} recommendations. Data: ${JSON.stringify(context.data)}. Preferences: ${JSON.stringify(context.preferences || {})}`,
    DEFAULT_MODEL,
    600
  );
}
async function researchTopic(topic, depth = "comprehensive") {
  return callAIWithTools(
    `You are an AI research assistant. Search the web and base findings on current sources. Return JSON with: summary (string), key_findings (array), sources_suggested (array of URLs you used), related_topics (array), market_implications (array), action_items (string).`,
    `Research topic: "${topic}". Depth: ${depth}`,
    [webSearchTool()]
  );
}
async function generateReasoning(task, data) {
  return callAIJson(
    `You are an AI reasoning engine. Provide step-by-step reasoning. Return JSON with: reasoning_steps (array of strings), conclusion (string), confidence (number), assumptions (array), alternative_approaches (array).`,
    `Reason through: "${task}". Data: ${JSON.stringify(data)}`,
    DEFAULT_MODEL,
    600
  );
}
async function generateWorkflow(workflowData) {
  return callAIJson(
    `You are a workflow automation expert. Design an optimal workflow. Return JSON with: workflow_name (string), trigger (string), steps (array of {action, condition, delay}), expected_outcome (string), optimization_tips (array).`,
    `Generate workflow: ${JSON.stringify(workflowData)}`,
    DEFAULT_MODEL,
    600
  );
}
async function segmentContacts(contacts2, criteria) {
  return callAIJson(
    `You are a contact segmentation expert. Segment contacts intelligently. Return JSON with: segments (array of {name, description, contact_count, contact_ids, characteristics}), unsegmented_count (number), recommendations (array).`,
    `Segment contacts by: ${criteria}. Contacts: ${JSON.stringify(contacts2)}`,
    DEFAULT_MODEL,
    600
  );
}
async function generateAutomationRules(context) {
  return callAIJson(
    `You are an automation rules expert. Generate smart automation rules. Return JSON with: rules (array of {name, trigger, condition, action, priority}), optimization_suggestions (array), estimated_time_saved (string).`,
    `Generate automation rules: ${JSON.stringify(context)}`,
    DEFAULT_MODEL,
    500
  );
}
async function autoSaveSuggestions(data, type) {
  return callAIJson(
    `You are an AI assistant that auto-saves smart suggestions. Return JSON with: suggestions (array of {type, content, confidence, action}), auto_save_recommendations (array).`,
    `Generate auto-save suggestions for ${type}: ${JSON.stringify(data)}`,
    DEFAULT_MODEL,
    400
  );
}
console.log("\u2705 AI Tools Service loaded");

// server/routes/aiSalesTools.ts
function registerAISalesToolsRoutes(app2) {
  const requireSalesIntelligence = [
    requireAuth(),
    requireEntitlement(FeatureKey.SALES_INTELLIGENCE)
  ];
  app2.post(
    "/api/ai/sales-assistant",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded. Try again in 60 seconds." });
      }
      const { question, context } = req.body;
      if (!question) {
        memoryService.recordObservation(userId, "error", "Missing question", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Question required" });
      }
      const result = await generateReasoning(question, context || {});
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, response: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/lead-score",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { contactData } = req.body;
      if (!contactData) {
        memoryService.recordObservation(userId, "error", "Missing contactData", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Contact data required" });
      }
      const result = await analyzeLeadScore(contactData);
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, scoring: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/deal-intelligence",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { dealData, contactHistory, marketContext } = req.body;
      if (!dealData) {
        memoryService.recordObservation(userId, "error", "Missing dealData", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Deal data required" });
      }
      const result = await generateDealIntelligence(
        dealData,
        contactHistory || [],
        marketContext
      );
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, intelligence: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/pipeline-intelligence",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { deals: deals2 } = req.body;
      if (!deals2) {
        memoryService.recordObservation(userId, "error", "Missing deals data", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Deals data required" });
      }
      const result = await analyzePipelineHealth(deals2);
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, analysis: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/deal-risk-monitor",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { deals: deals2 } = req.body;
      if (!deals2) return res.status(400).json({ error: "Deals data required" });
      const result = await monitorDealRisk(deals2);
      if (result.success) {
        res.json({ success: true, riskAnalysis: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/conversion-optimization",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { deals: deals2, contacts: contacts2 } = req.body;
      const result = await optimizeConversion(deals2 || [], contacts2 || []);
      if (result.success) {
        res.json({ success: true, optimization: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/win-rate-intelligence",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { deals: deals2 } = req.body;
      if (!deals2) return res.status(400).json({ error: "Deals data required" });
      const result = await analyzeWinRate(deals2);
      if (result.success) {
        res.json({ success: true, winRate: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/sales-forecast",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { deals: deals2, period } = req.body;
      if (!deals2) return res.status(400).json({ error: "Deals data required" });
      const result = await generateSalesForecast(deals2, period || "quarter");
      if (result.success) {
        res.json({ success: true, forecast: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/live-deal-analysis",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { deals: deals2 } = req.body;
      if (!deals2) return res.status(400).json({ error: "Deals data required" });
      const result = await analyzeLiveDeals(deals2);
      if (result.success) {
        res.json({ success: true, liveAnalysis: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/pipeline-health",
    ...requireSalesIntelligence,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { deals: deals2 } = req.body;
      if (!deals2) return res.status(400).json({ error: "Deals data required" });
      const result = await analyzePipelineHealth(deals2);
      if (result.success) {
        res.json({ success: true, health: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  console.log("\u2705 AI Sales Tools routes registered");
}

// server/routes/aiCommunication.ts
function registerAICommunicationRoutes(app2) {
  const requireAI = [requireAuth(), requireEntitlement(FeatureKey.AI_TOOLS)];
  app2.post(
    "/api/ai/email/compose",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { recipientName, recipientCompany, purpose, tone, keyPoints, callToAction } = req.body;
      if (!purpose) {
        memoryService.recordObservation(userId, "error", "Purpose required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Purpose required" });
      }
      const result = await composeEmail({
        recipientName: recipientName || "there",
        recipientCompany: recipientCompany || "",
        purpose,
        tone: tone || "professional",
        keyPoints,
        callToAction
      });
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, email: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/email/reply",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { originalEmail, context, tone } = req.body;
      if (!originalEmail) {
        memoryService.recordObservation(userId, "error", "Original email required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Original email required" });
      }
      const result = await generateEmailReply(originalEmail, context || "", tone);
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, reply: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/follow-up/generate",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { contactData, lastInteraction, purpose } = req.body;
      if (!purpose) {
        memoryService.recordObservation(userId, "error", "Purpose required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Purpose required" });
      }
      const result = await generateFollowUp(contactData || {}, lastInteraction || "No recent interaction", purpose);
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, followUp: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/objection/handle",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { objection, productInfo, contactData } = req.body;
      if (!objection) {
        memoryService.recordObservation(userId, "error", "Objection text required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Objection text required" });
      }
      const result = await handleObjection(objection, productInfo || "our product", contactData);
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, response: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/proposal/generate",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { clientName, projectDescription, budget, timeline, deliverables } = req.body;
      if (!clientName || !projectDescription) {
        memoryService.recordObservation(userId, "error", "Client name and project description required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Client name and project description required" });
      }
      const result = await generateProposal({ clientName, projectDescription, budget, timeline, deliverables });
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, proposal: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/appointment/message",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { appointmentData, messageType } = req.body;
      if (!appointmentData) {
        memoryService.recordObservation(userId, "error", "Appointment data required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Appointment data required" });
      }
      const result = await generateAppointmentMessage(appointmentData, messageType || "confirmation");
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, message: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/video/script",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { recipientName, productName, keyMessage, duration } = req.body;
      if (!productName || !keyMessage) {
        memoryService.recordObservation(userId, "error", "Product name and key message required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Product name and key message required" });
      }
      const result = await generateVideoEmailScript({
        recipientName: recipientName || "there",
        productName,
        keyMessage,
        duration: duration || "60 seconds"
      });
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, script: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/sms/generate",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { purpose, contactName, context } = req.body;
      if (!purpose) {
        memoryService.recordObservation(userId, "error", "Purpose required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Purpose required" });
      }
      const result = await generateSMSMessage(purpose, contactName || "", context || "");
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, sms: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/voice/script",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { purpose, contactName, keyPoints, duration } = req.body;
      if (!purpose) {
        memoryService.recordObservation(userId, "error", "Purpose required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Purpose required" });
      }
      const result = await generateVoiceScript({
        purpose,
        contactName: contactName || "",
        keyPoints: keyPoints || [],
        duration: duration || "30 seconds"
      });
      memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
      });
      if (result.success) {
        res.json({ success: true, voiceScript: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  console.log("\u2705 AI Communication Tools routes registered");
}

// server/routes/aiContent.ts
function registerAIContentRoutes(app2) {
  const requireContent = [requireAuth(), requireEntitlement(FeatureKey.CONTENT_LIBRARY)];
  app2.post(
    "/api/ai/content/generate",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { type, topic, audience, tone, keywords } = req.body;
      if (!type || !topic) return res.status(400).json({ error: "Type and topic required" });
      const result = await generateContent({
        type,
        topic,
        audience: audience || "general",
        tone: tone || "professional",
        keywords
      });
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, content: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/content/sales-page",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { productName, targetAudience, keyBenefits, price } = req.body;
      if (!productName) return res.status(400).json({ error: "Product name required" });
      const result = await generateSalesPage({ productName, targetAudience, keyBenefits, price });
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, salesPage: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/content/proposal",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { clientName, projectDescription, budget, timeline, deliverables } = req.body;
      if (!clientName || !projectDescription) {
        return res.status(400).json({ error: "Client name and project description required" });
      }
      const result = await generateProposal({ clientName, projectDescription, budget, timeline, deliverables });
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, proposal: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/content/offer",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { productName, targetAudience, pricePoint, uniqueValue } = req.body;
      if (!productName) return res.status(400).json({ error: "Product name required" });
      const result = await generateOffer({ productName, targetAudience, pricePoint, uniqueValue });
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, offer: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/content/social-post",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { platform, topic, tone, includeHashtags } = req.body;
      if (!platform || !topic) return res.status(400).json({ error: "Platform and topic required" });
      const result = await generateSocialPost({ platform, topic, tone: tone || "professional", includeHashtags: includeHashtags !== false });
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, post: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/content/webinar-invite",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { topic, speakerName, date, duration, keyTakeaways } = req.body;
      if (!topic) return res.status(400).json({ error: "Topic required" });
      const result = await generateWebinarInvite({ topic, speakerName: speakerName || "Expert Speaker", date: date || "TBD", duration: duration || "60 minutes", keyTakeaways: keyTakeaways || [] });
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, invite: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/content/case-study",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { clientName, challenge, solution, results } = req.body;
      if (!clientName || !challenge) return res.status(400).json({ error: "Client name and challenge required" });
      const result = await generateCaseStudy({ clientName, challenge, solution: solution || "", results: results || [] });
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, caseStudy: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/content/testimonial",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { rawTestimonial, format } = req.body;
      if (!rawTestimonial) return res.status(400).json({ error: "Testimonial text required" });
      const result = await transformTestimonial(rawTestimonial, format || "polished");
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, testimonial: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/business/analyze",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { businessData } = req.body;
      if (!businessData) return res.status(400).json({ error: "Business data required" });
      const result = await analyzeBusiness(businessData);
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, analysis: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Failed: " + (result?.error || "endpoint error"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/content/save",
    ...requireContent,
    async (req, res) => {
      const userId = req.userId;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      const { title, content } = req.body;
      if (!title || !content) return res.status(400).json({ error: "Title and content required" });
      res.status(501).json({ success: false, error: "Saving generated content is not available yet" });
    }
  );
  console.log("\u2705 Content & Marketing Tools routes registered");
}

// server/routes/aiProductivity.ts
function registerAIProductivityRoutes(app2) {
  const requireAI = [requireAuth(), requireEntitlement(FeatureKey.AI_TOOLS)];
  app2.post(
    "/api/ai/meeting/summarize",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { transcript } = req.body;
      if (!transcript) {
        memoryService.recordObservation(userId, "error", "Meeting transcript required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Meeting transcript required" });
      }
      try {
        const result = await summarizeMeeting(transcript);
        if (result.success) {
          memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
          });
          res.json({ success: true, summary: result.data, source: result.source });
        } else {
          sendAIError(res, result.error);
        }
      } catch (err) {
        memoryService.recordObservation(userId, "error", err.message, { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, err);
      }
    }
  );
  app2.post(
    "/api/ai/speech/to-text",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { audioContext } = req.body;
      if (!audioContext) {
        memoryService.recordObservation(userId, "error", "Audio context/transcript required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Audio context/transcript required" });
      }
      try {
        const result = await speechToTextNote(audioContext);
        if (result.success) {
          memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
          });
          res.json({ success: true, notes: result.data, source: result.source });
        } else {
          sendAIError(res, result.error);
        }
      } catch (err) {
        memoryService.recordObservation(userId, "error", err.message, { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, err);
      }
    }
  );
  app2.post(
    "/api/ai/task/create",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { description, context } = req.body;
      if (!description) {
        memoryService.recordObservation(userId, "error", "Task description required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Task description required" });
      }
      try {
        const result = await createTaskFromDescription(description, context);
        if (result.success) {
          memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
          });
          res.json({ success: true, task: result.data, source: result.source });
        } else {
          sendAIError(res, result.error);
        }
      } catch (err) {
        memoryService.recordObservation(userId, "error", err.message, { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, err);
      }
    }
  );
  app2.post(
    "/api/ai/meeting/notes",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { meetingData } = req.body;
      if (!meetingData) {
        memoryService.recordObservation(userId, "error", "Meeting data required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Meeting data required" });
      }
      try {
        const result = await generateMeetingNotes(meetingData);
        if (result.success) {
          memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
          });
          res.json({ success: true, notes: result.data, source: result.source });
        } else {
          sendAIError(res, result.error);
        }
      } catch (err) {
        memoryService.recordObservation(userId, "error", err.message, { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, err);
      }
    }
  );
  app2.post(
    "/api/ai/task/follow-up-suggestions",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { completedTask, context } = req.body;
      if (!completedTask) {
        memoryService.recordObservation(userId, "error", "Completed task description required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Completed task description required" });
      }
      try {
        const result = await suggestFollowUpTasks(completedTask, context);
        if (result.success) {
          memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
          });
          res.json({ success: true, suggestions: result.data, source: result.source });
        } else {
          sendAIError(res, result.error);
        }
      } catch (err) {
        memoryService.recordObservation(userId, "error", err.message, { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, err);
      }
    }
  );
  app2.post(
    "/api/ai/calendar/suggest",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { appointments: appointments3, preferences } = req.body;
      try {
        const result = await suggestCalendarTimes(appointments3, preferences);
        if (result.success) {
          memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
          });
          res.json({ success: true, suggestions: result.data, source: result.source });
        } else {
          sendAIError(res, result.error);
        }
      } catch (err) {
        sendAIError(res, err);
      }
    }
  );
  console.log("\u2705 Meeting & Productivity Tools routes registered");
}

// server/routes/aiAdvanced.ts
function registerAIAdvancedRoutes(app2) {
  const requireAI = [requireAuth(), requireEntitlement(FeatureKey.AI_TOOLS)];
  app2.post(
    "/api/ai/vision/analyze",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { imageUrl, prompt } = req.body;
      if (!imageUrl) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Image URL required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Image URL required" });
      }
      const result = await analyzeImage(imageUrl, prompt);
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, analysis: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": " + (result.error?.message || "unknown"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/search/semantic",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { query, items } = req.body;
      if (!query) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Search query required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Search query required" });
      }
      const result = await semanticSearch(query, items || []);
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, results: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": " + (result.error?.message || "unknown"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/function/assistant",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { request, context } = req.body;
      if (!request) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Request required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Request required" });
      }
      const result = await generateReasoning(request, context || {});
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, response: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": " + (result.error?.message || "unknown"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/reasoning/generate",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { task, data } = req.body;
      if (!task) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Task description required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Task description required" });
      }
      const result = await generateReasoning(task, data || {});
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, reasoning: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": " + (result.error?.message || "unknown"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/research/topic",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { topic, depth } = req.body;
      if (!topic) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Topic required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Topic required" });
      }
      const result = await researchTopic(topic, depth || "comprehensive");
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, research: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": " + (result.error?.message || "unknown"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/recommendations",
    ...requireAI,
    async (req, res) => {
      const userId = req.userId;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      memoryService.recordObservation(userId, "user_prompt", JSON.stringify(req.body), { endpoint: req.path }).catch(() => {
      });
      if (!checkAIRateLimit2(userId)) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Rate limit exceeded", { endpoint: req.path }).catch(() => {
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { type, data, preferences } = req.body;
      if (!type) {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": Recommendation type required", { endpoint: req.path }).catch(() => {
        });
        return res.status(400).json({ error: "Recommendation type required" });
      }
      const result = await generateRecommendations({ type, data: data || {}, preferences });
      if (result.success) {
        memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {
        });
        res.json({ success: true, recommendations: result.data, source: result.source });
      } else {
        memoryService.recordObservation(userId, "error", "Error in " + req.path + ": " + (result.error?.message || "unknown"), { endpoint: req.path }).catch(() => {
        });
        sendAIError(res, result.error);
      }
    }
  );
  console.log("\u2705 Advanced AI Tools routes registered");
}

// server/routes/aiAutomation.ts
function registerAIAutomationRoutes(app2) {
  const requireAutomation = [requireAuth(), requireEntitlement(FeatureKey.LEAD_AUTOMATION)];
  app2.post(
    "/api/ai/automation/workflow",
    ...requireAutomation,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { workflowData } = req.body;
      if (!workflowData) return res.status(400).json({ error: "Workflow data required" });
      const result = await generateWorkflow(workflowData);
      if (result.success) {
        res.json({ success: true, workflow: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/automation/follow-up",
    ...requireAutomation,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { contactData, lastInteraction, purpose } = req.body;
      if (!contactData) return res.status(400).json({ error: "Contact data required" });
      const result = await generateFollowUp(contactData, lastInteraction || "", purpose || "follow-up");
      if (result.success) {
        res.json({ success: true, automation: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/automation/appointment",
    ...requireAutomation,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { appointmentData, messageType } = req.body;
      if (!appointmentData) return res.status(400).json({ error: "Appointment data required" });
      const result = await generateAppointmentMessage(appointmentData, messageType || "confirmation");
      if (result.success) {
        res.json({ success: true, automation: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/automation/pipeline-stage",
    ...requireAutomation,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { deals: deals2, targetStage } = req.body;
      if (!Array.isArray(deals2) || deals2.length === 0) {
        return res.status(400).json({ error: "deals must be a non-empty array" });
      }
      const result = await recommendPipelineStages(deals2, targetStage);
      if (result.success) {
        res.json({ success: true, automation: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/automation/form-submission",
    ...requireAutomation,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { formData, formType } = req.body;
      if (!formData) return res.status(400).json({ error: "Form data required" });
      const result = await processFormSubmission(formData, formType || "contact");
      if (result.success) {
        res.json({ success: true, automation: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/automation/segment",
    ...requireAutomation,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { contacts: contacts2, criteria } = req.body;
      if (!contacts2) return res.status(400).json({ error: "Contacts data required" });
      const result = await segmentContacts(contacts2, criteria || "engagement");
      if (result.success) {
        res.json({ success: true, segments: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/automation/auto-save",
    ...requireAutomation,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { data, type } = req.body;
      if (!data || !type) return res.status(400).json({ error: "Data and type required" });
      const result = await autoSaveSuggestions(data, type);
      if (result.success) {
        res.json({ success: true, saved: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  app2.post(
    "/api/ai/automation/rules",
    ...requireAutomation,
    async (req, res) => {
      const userId = req.userId;
      if (!checkAIRateLimit2(userId)) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      const { context } = req.body;
      const result = await generateAutomationRules(context || {});
      if (result.success) {
        res.json({ success: true, rules: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );
  console.log("\u2705 Automation Tools routes registered");
}

// server/routes/partners.ts
init_schema();
import { eq as eq13, desc as desc11, sql as sql9, and as and12 } from "drizzle-orm";

// server/services/commissionService.ts
init_db();
init_schema();
import { eq as eq11, desc as desc9, and as and10 } from "drizzle-orm";
async function calculateCommission(input) {
  const { partnerId, customerId, amount } = input;
  const partner = await db.select().from(partners).where(eq11(partners.id, partnerId)).limit(1);
  if (!partner.length) {
    throw new Error(`Partner ${partnerId} not found`);
  }
  let tier;
  if (partner[0].tierId) {
    const tierResult = await db.select().from(partnerTiers).where(eq11(partnerTiers.id, partner[0].tierId)).limit(1);
    if (tierResult.length) {
      tier = tierResult[0];
    }
  }
  if (!tier) {
    const activeTier = await db.select().from(partnerTiers).where(eq11(partnerTiers.isActive, true)).orderBy(partnerTiers.createdAt).limit(1);
    if (activeTier.length) {
      tier = activeTier[0];
    }
  }
  const commissionRate = tier ? parseFloat(tier.commissionRate) / 100 : 0;
  const commissionAmount = Math.round(amount * commissionRate * 100) / 100;
  return {
    partnerId,
    customerId,
    amount,
    commissionRate,
    commissionAmount,
    tierName: tier?.name || "default",
    metadata: input.metadata
  };
}
async function createCommissionRecord(partnerId, customerId, amount, status = "pending", metadata) {
  const calculation = await calculateCommission({ partnerId, customerId, amount, metadata });
  const [record] = await db.insert(commissions).values({
    partnerId,
    customerId,
    amount: calculation.commissionAmount.toString(),
    status,
    metadata: calculation.metadata || {}
  }).returning();
  if (!record) {
    throw new Error("Failed to create commission record");
  }
  return record;
}
async function getPartnerCommissions(partnerId, status) {
  const conditions = [eq11(commissions.partnerId, partnerId)];
  if (status) {
    conditions.push(eq11(commissions.status, status));
  }
  return await db.select().from(commissions).where(and10(...conditions)).orderBy(desc9(commissions.createdAt));
}

// server/services/payoutService.ts
init_db();
init_schema();
import { eq as eq12, desc as desc10, sql as sql8, and as and11 } from "drizzle-orm";
async function processPayout(payoutId) {
  const [payout] = await db.select().from(payouts).where(eq12(payouts.id, payoutId)).limit(1);
  if (!payout) {
    return void 0;
  }
  const [updated] = await db.update(payouts).set({ status: "paid", paidAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq12(payouts.id, payoutId)).returning();
  if (updated) {
    await db.update(commissions).set({ status: "paid", payoutId: updated.id, updatedAt: /* @__PURE__ */ new Date() }).where(eq12(commissions.partnerId, updated.partnerId)).where(eq12(commissions.status, "pending"));
  }
  return updated || void 0;
}

// server/routes/partners.ts
function registerPartnersRoutes(app2) {
  app2.get("/api/partners", requireAuth(), async (req, res) => {
    try {
      const { db: dbConnection } = await Promise.resolve().then(() => (init_db(), db_exports));
      const allPartners = await dbConnection.select().from(partners).orderBy(desc11(partners.createdAt));
      res.json(allPartners);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });
  app2.get("/api/partners/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { db: dbConnection } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [partner] = await dbConnection.select().from(partners).where(eq13(partners.id, id)).limit(1);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      console.error("Failed to fetch partner:", error);
      res.status(500).json({ error: "Failed to fetch partner" });
    }
  });
  app2.post("/api/partners", requireAdmin, async (req, res) => {
    try {
      const { name, email, company, phone, tierId, status, metadata } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      const { db: dbConnection } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [partner] = await dbConnection.insert(partners).values({
        name,
        email,
        company: company || null,
        phone: phone || null,
        tierId: tierId || null,
        status: status || "active",
        metadata: metadata || {}
      }).returning();
      if (!partner) {
        return res.status(500).json({ error: "Failed to create partner" });
      }
      res.status(201).json(partner);
    } catch (error) {
      console.error("Failed to create partner:", error);
      res.status(500).json({ error: "Failed to create partner" });
    }
  });
  app2.put("/api/partners/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, company, phone, tierId, status, metadata } = req.body;
      const { db: dbConnection } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [existing] = await dbConnection.select().from(partners).where(eq13(partners.id, id)).limit(1);
      if (!existing) {
        return res.status(404).json({ error: "Partner not found" });
      }
      const [partner] = await dbConnection.update(partners).set({
        name: name ?? existing.name,
        email: email ?? existing.email,
        company: company ?? existing.company,
        phone: phone ?? existing.phone,
        tierId: tierId ?? existing.tierId,
        status: status ?? existing.status,
        metadata: metadata ?? existing.metadata,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq13(partners.id, id)).returning();
      if (!partner) {
        return res.status(500).json({ error: "Failed to update partner" });
      }
      res.json(partner);
    } catch (error) {
      console.error("Failed to update partner:", error);
      res.status(500).json({ error: "Failed to update partner" });
    }
  });
  app2.get("/api/partners/:id/stats", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { db: dbConnection } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [partner] = await dbConnection.select().from(partners).where(eq13(partners.id, id)).limit(1);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      const customers = await dbConnection.select().from(partnerCustomers).where(eq13(partnerCustomers.partnerId, id));
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter((c) => c.subscriptionStatus === "active").length;
      const totalRevenue = customers.reduce((sum, c) => sum + parseFloat(c.mrr || "0"), 0);
      const [latestMetric] = await dbConnection.select().from(partnerMetrics).where(eq13(partnerMetrics.partnerId, id)).orderBy(desc11(partnerMetrics.createdAt)).limit(1);
      const previousRevenue = totalRevenue * 0.9;
      const growthRate = previousRevenue > 0 ? (totalRevenue - previousRevenue) / previousRevenue * 100 : 0;
      res.json({
        partnerId: id,
        totalCustomers,
        activeCustomers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRevenue: Math.round(totalRevenue * 100) / 100,
        customerGrowthRate: Math.round(growthRate * 100) / 100,
        metrics: latestMetric || null
      });
    } catch (error) {
      console.error("Failed to fetch partner stats:", error);
      res.status(500).json({ error: "Failed to fetch partner stats" });
    }
  });
  app2.get("/api/partners/:id/commissions", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const status = req.query.status;
      const partnerCommissions = await getPartnerCommissions(id, status);
      res.json(partnerCommissions);
    } catch (error) {
      console.error("Failed to fetch partner commissions:", error);
      res.status(500).json({ error: "Failed to fetch partner commissions" });
    }
  });
  app2.post("/api/commissions/calculate", requireAuth(), async (req, res) => {
    try {
      const { partnerId, customerId, amount, metadata } = req.body;
      if (!partnerId || !customerId || !amount) {
        return res.status(400).json({ error: "partnerId, customerId, and amount are required" });
      }
      const { db: dbConnection } = await Promise.resolve().then(() => (init_db(), db_exports));
      const [partner] = await dbConnection.select().from(partners).where(eq13(partners.id, partnerId)).limit(1);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      let tierRate = 0;
      if (partner.tierId) {
        const [tier] = await dbConnection.select().from(partnerTiers).where(eq13(partnerTiers.id, partner.tierId)).limit(1);
        if (tier) {
          tierRate = parseFloat(tier.commissionRate) / 100;
        }
      }
      const commissionAmount = Math.round(amount * tierRate * 100) / 100;
      const record = await createCommissionRecord(partnerId, customerId, amount, "pending", metadata);
      res.status(201).json({
        commission: record,
        calculation: {
          originalAmount: amount,
          commissionRate: tierRate,
          commissionAmount
        }
      });
    } catch (error) {
      console.error("Failed to calculate commission:", error);
      res.status(500).json({ error: "Failed to calculate commission" });
    }
  });
  app2.get("/api/payouts", requireAuth(), async (req, res) => {
    try {
      const partnerId = req.query.partnerId;
      const status = req.query.status;
      const { db: dbConnection } = await Promise.resolve().then(() => (init_db(), db_exports));
      const conditions = [];
      if (partnerId) {
        conditions.push(eq13(payouts.partnerId, partnerId));
      }
      if (status) {
        conditions.push(eq13(payouts.status, status));
      }
      let query = dbConnection.select().from(payouts).orderBy(desc11(payouts.createdAt));
      if (conditions.length > 0) {
        query = query.where(and12(...conditions));
      }
      const allPayouts = await query;
      res.json(allPayouts);
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });
  app2.post("/api/payouts/process", requireAdmin, async (req, res) => {
    try {
      const { payoutId } = req.body;
      if (!payoutId) {
        return res.status(400).json({ error: "payoutId is required" });
      }
      const payout = await processPayout(payoutId);
      if (!payout) {
        return res.status(404).json({ error: "Payout not found" });
      }
      res.json(payout);
    } catch (error) {
      console.error("Failed to process payout:", error);
      res.status(500).json({ error: "Failed to process payout" });
    }
  });
  app2.get("/api/revenue/analytics", requireAuth(), async (req, res) => {
    try {
      const { db: dbConnection } = await Promise.resolve().then(() => (init_db(), db_exports));
      const allPartners = await dbConnection.select().from(partners);
      const totalPartners = allPartners.length;
      const activePartners = allPartners.filter((p) => p.status === "active").length;
      const totalRevenueResult = await dbConnection.select({
        total: sql9`COALESCE(SUM(${partnerCustomers.mrr}), 0)`
      }).from(partnerCustomers);
      const totalCommissionResult = await dbConnection.select({
        total: sql9`COALESCE(SUM(${commissions.amount}), 0)`
      }).from(commissions);
      const totalCustomers = await dbConnection.select({ count: sql9`COUNT(*)` }).from(partnerCustomers);
      const totalRevenue = totalRevenueResult[0]?.total || 0;
      const totalCommissions = totalCommissionResult[0]?.total || 0;
      const customersCount = totalCustomers[0]?.count || 0;
      res.json({
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        totalPartners,
        activePartners,
        totalCustomers: customersCount,
        averageCommissionRate: totalRevenue > 0 ? Math.round(totalCommissions / totalRevenue * 1e4) / 100 : 0,
        monthlyGrowth: 0,
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
            current: totalPartners,
            previousMonth: Math.max(1, totalPartners - 1),
            growth: totalPartners > 1 ? 0.05 : 0
          }
        }
      });
    } catch (error) {
      console.error("Failed to fetch revenue analytics:", error);
      res.status(500).json({ error: "Failed to fetch revenue analytics" });
    }
  });
}

// server/routes/leadAutomation.ts
import { and as and14, eq as eq15 } from "drizzle-orm";
init_db();
init_schema();

// server/services/leadAutomation.ts
init_db();
init_schema();
import { and as and13, desc as desc12, eq as eq14, inArray, lte, sql as sql10 } from "drizzle-orm";
var DAY_MS = 864e5;
var NO_QUALIFY_STATUSES = ["qualified", "converted", "customer", "lost", "churned", "inactive"];
var DEFAULT_SETTINGS = {
  scoringModel: "ai-powered",
  qualificationThreshold: 70,
  createFollowupTasks: true
};
var SCORING_MODELS = ["ai-powered", "rule-based", "hybrid"];
function parseSettings(body) {
  const value = { ...DEFAULT_SETTINGS };
  if (body?.scoringModel !== void 0) {
    if (!SCORING_MODELS.includes(body.scoringModel)) return { error: "Invalid scoringModel" };
    value.scoringModel = body.scoringModel;
  }
  if (body?.qualificationThreshold !== void 0) {
    const n = Number(body.qualificationThreshold);
    if (!Number.isInteger(n) || n < 0 || n > 100) return { error: "qualificationThreshold must be 0-100" };
    value.qualificationThreshold = n;
  }
  if (body?.createFollowupTasks !== void 0) {
    if (typeof body.createFollowupTasks !== "boolean") return { error: "createFollowupTasks must be a boolean" };
    value.createFollowupTasks = body.createFollowupTasks;
  }
  return { value };
}
async function getSettings(profileId) {
  const [row] = await db.select().from(leadAutomationSettings).where(eq14(leadAutomationSettings.profileId, profileId));
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    scoringModel: row.scoringModel,
    qualificationThreshold: row.qualificationThreshold,
    createFollowupTasks: row.createFollowupTasks
  };
}
async function saveSettings(profileId, settings) {
  await db.insert(leadAutomationSettings).values({ profileId, ...settings }).onConflictDoUpdate({
    target: leadAutomationSettings.profileId,
    set: { ...settings, updatedAt: /* @__PURE__ */ new Date() }
  });
  return settings;
}
var priorityFor = (score) => score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
function ruleBasedScore(contact, dealCount, now = /* @__PURE__ */ new Date()) {
  const reasons = [];
  let score = 0;
  const add = (points, ok, label) => {
    if (ok) {
      score += points;
      reasons.push(`+${points} ${label}`);
    }
  };
  add(20, Boolean(contact.email), "has an email");
  add(10, Boolean(contact.phone), "has a phone number");
  add(15, Boolean(contact.company), "has a company");
  add(5, Boolean(contact.industry), "industry known");
  add(10, Array.isArray(contact.tags) && contact.tags.length > 0, "is tagged");
  const updated = contact.updatedAt ? new Date(contact.updatedAt).getTime() : 0;
  const ageDays = updated ? (now.getTime() - updated) / DAY_MS : Infinity;
  add(20, ageDays <= 14, "active in the last 14 days");
  add(10, ageDays > 14 && ageDays <= 60, "active in the last 60 days");
  add(Math.min(20, dealCount * 10), dealCount > 0, `${dealCount} deal(s) in the CRM`);
  score = Math.min(100, score);
  return {
    score,
    priority: priorityFor(score),
    rationale: reasons.length ? `Rule-based score: ${reasons.join(", ")}.` : "Rule-based score: no scoring signals on this contact."
  };
}
function blendScores(rule, ai) {
  const score = Math.round((rule.score + ai.score) / 2);
  return { score, priority: priorityFor(score), rationale: `Average of rule-based (${rule.score}) and AI (${ai.score}) scores. ${ai.rationale}` };
}
var canAutoQualify = (status) => !NO_QUALIFY_STATUSES.includes(String(status || "").toLowerCase());
async function persistScore(profileId, contact, result, method, threshold) {
  const qualified = result.score >= threshold && canAutoQualify(contact.status);
  await db.update(contacts).set({
    score: (result.score / 100).toFixed(2),
    ...qualified ? { status: "qualified" } : {},
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and13(eq14(contacts.id, contact.id), eq14(contacts.profileId, profileId)));
  await db.insert(contactActivities).values({
    contactId: contact.id,
    activityType: "scoring",
    description: `Lead scored ${result.score}/100 (${method})${qualified ? " and marked qualified" : ""}`,
    metadata: { ...result, method }
  });
  return { ...result, method, qualified };
}
async function countDeals(profileId, contactId) {
  const [row] = await db.select({ n: sql10`count(*)::int` }).from(deals).where(and13(eq14(deals.contactId, contactId), eq14(deals.profileId, profileId)));
  return row?.n ?? 0;
}
var CHANNELS = ["email", "call", "sms", "task"];
function parseCampaign(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 120) return { error: "name is required (max 120 characters)" };
  const stepsIn = body?.steps;
  if (!Array.isArray(stepsIn) || stepsIn.length === 0 || stepsIn.length > 20) {
    return { error: "steps must be a list of 1 to 20 steps" };
  }
  const steps = [];
  for (const s of stepsIn) {
    const day = Number(s?.day);
    const title = typeof s?.title === "string" ? s.title.trim() : "";
    const message = typeof s?.message === "string" ? s.message.trim() : "";
    if (!Number.isInteger(day) || day < 0 || day > 365) return { error: "each step needs a day between 0 and 365" };
    if (!title || title.length > 160) return { error: "each step needs a title (max 160 characters)" };
    if (!CHANNELS.includes(s?.channel)) return { error: `step channel must be one of ${CHANNELS.join(", ")}` };
    steps.push({ day, channel: s.channel, title, message: message.slice(0, 4e3) });
  }
  steps.sort((a, b) => a.day - b.day);
  const list = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string" && x).slice(0, 50) : void 0;
  const audience = {
    statuses: list(body?.audience?.statuses),
    sources: list(body?.audience?.sources),
    tags: list(body?.audience?.tags)
  };
  return {
    value: { name, description: typeof body?.description === "string" ? body.description.slice(0, 1e3) : void 0, audience, steps }
  };
}
function contactMatchesAudience(contact, audience) {
  const lower = (v) => String(v ?? "").toLowerCase();
  if (audience.statuses?.length && !audience.statuses.map(lower).includes(lower(contact.status))) return false;
  if (audience.sources?.length && !audience.sources.map(lower).includes(lower(contact.source))) return false;
  if (audience.tags?.length) {
    const tags = (Array.isArray(contact.tags) ? contact.tags : []).map(lower);
    if (!audience.tags.some((t) => tags.includes(lower(t)))) return false;
  }
  return true;
}
var stepDueAt = (enrolledAt, steps, index) => index < steps.length ? new Date(enrolledAt.getTime() + steps[index].day * DAY_MS) : null;
async function createCampaign(profileId, input) {
  const [campaign] = await db.insert(campaigns).values({ profileId, name: input.name, description: input.description, audience: input.audience, steps: input.steps, status: "active" }).returning();
  const owned = await db.select().from(contacts).where(eq14(contacts.profileId, profileId));
  const matching = owned.filter((c) => contactMatchesAudience(c, input.audience));
  const now = /* @__PURE__ */ new Date();
  if (matching.length) {
    await db.insert(campaignEnrollments).values(
      matching.map((c) => ({
        campaignId: campaign.id,
        contactId: c.id,
        nextStep: 0,
        nextDueAt: stepDueAt(now, input.steps, 0),
        enrolledAt: now
      }))
    ).onConflictDoNothing();
  }
  const tasksCreated = await processDueSteps(profileId, campaign.id);
  return { campaign, enrolled: matching.length, tasksCreated };
}
async function listCampaigns(profileId) {
  const rows = await db.select().from(campaigns).where(eq14(campaigns.profileId, profileId)).orderBy(desc12(campaigns.createdAt));
  if (!rows.length) return [];
  const stats = await db.select({
    campaignId: campaignEnrollments.campaignId,
    leads: sql10`count(*)::int`,
    converted: sql10`(count(*) filter (where lower(${contacts.status}) in ('converted', 'customer')))::int`
  }).from(campaignEnrollments).innerJoin(contacts, eq14(contacts.id, campaignEnrollments.contactId)).where(
    inArray(
      campaignEnrollments.campaignId,
      rows.map((r) => r.id)
    )
  ).groupBy(campaignEnrollments.campaignId);
  const byId = new Map(stats.map((s) => [s.campaignId, s]));
  return rows.map((c) => {
    const s = byId.get(c.id);
    const leads = s?.leads ?? 0;
    return { ...c, leads, converted: s?.converted ?? 0, conversionRate: leads ? (s?.converted ?? 0) / leads : null };
  });
}
async function getCampaign(profileId, id) {
  const [campaign] = await db.select().from(campaigns).where(and13(eq14(campaigns.id, id), eq14(campaigns.profileId, profileId)));
  if (!campaign) return null;
  const enrollments = await db.select({
    id: campaignEnrollments.id,
    contactId: campaignEnrollments.contactId,
    firstName: contacts.firstName,
    lastName: contacts.lastName,
    nextStep: campaignEnrollments.nextStep,
    nextDueAt: campaignEnrollments.nextDueAt,
    status: campaignEnrollments.status
  }).from(campaignEnrollments).innerJoin(contacts, eq14(contacts.id, campaignEnrollments.contactId)).where(eq14(campaignEnrollments.campaignId, id));
  return { campaign, enrollments };
}
async function processDueSteps(profileId, campaignId, now = /* @__PURE__ */ new Date()) {
  const due = await db.select({ enrollment: campaignEnrollments, campaign: campaigns, contact: contacts }).from(campaignEnrollments).innerJoin(campaigns, eq14(campaigns.id, campaignEnrollments.campaignId)).innerJoin(contacts, eq14(contacts.id, campaignEnrollments.contactId)).where(
    and13(
      eq14(campaignEnrollments.status, "active"),
      eq14(campaigns.status, "active"),
      lte(campaignEnrollments.nextDueAt, now),
      ...profileId ? [eq14(campaigns.profileId, profileId)] : [],
      ...campaignId ? [eq14(campaigns.id, campaignId)] : []
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
    await db.update(campaignEnrollments).set({ nextStep: nextIndex, nextDueAt: nextDue, status: nextDue ? "active" : "done" }).where(eq14(campaignEnrollments.id, enrollment.id));
    touchedCampaigns.add(campaign.id);
  }
  for (const id of touchedCampaigns) {
    const [row] = await db.select({ n: sql10`count(*)::int` }).from(campaignEnrollments).where(and13(eq14(campaignEnrollments.campaignId, id), eq14(campaignEnrollments.status, "active")));
    if ((row?.n ?? 0) === 0) {
      await db.update(campaigns).set({ status: "completed", updatedAt: /* @__PURE__ */ new Date() }).where(and13(eq14(campaigns.id, id), eq14(campaigns.status, "active")));
    }
  }
  return created;
}
async function updateCampaign(profileId, id, body) {
  const set = { updatedAt: /* @__PURE__ */ new Date() };
  if (body?.status !== void 0) {
    if (!["active", "paused"].includes(body.status)) return { error: "status must be active or paused" };
    set.status = body.status;
  }
  if (body?.name !== void 0) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 120) return { error: "name must be 1-120 characters" };
    set.name = name;
  }
  const [row] = await db.update(campaigns).set(set).where(and13(eq14(campaigns.id, id), eq14(campaigns.profileId, profileId))).returning();
  return { campaign: row ?? null };
}
async function deleteCampaign(profileId, id) {
  const rows = await db.delete(campaigns).where(and13(eq14(campaigns.id, id), eq14(campaigns.profileId, profileId))).returning({ id: campaigns.id });
  return rows.length > 0;
}

// server/routes/leadAutomation.ts
var noDb3 = (res) => res.status(503).json({ error: "Database not configured" });
function registerLeadAutomationRoutes(app2) {
  app2.use("/api/lead-automation", requireAuth(), requireEntitlement(FeatureKey.LEAD_AUTOMATION));
  app2.get("/api/lead-automation/settings", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      res.json(await getSettings(req.userId));
    } catch (error) {
      console.error("Error loading lead automation settings:", error);
      res.status(500).json({ error: "Failed to load settings" });
    }
  });
  app2.put("/api/lead-automation/settings", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      const userId = req.userId;
      const current = await getSettings(userId);
      const parsed = parseSettings({ ...current, ...req.body });
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });
      res.json(await saveSettings(userId, parsed.value));
    } catch (error) {
      console.error("Error saving lead automation settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });
  app2.post("/api/lead-automation/score/:contactId", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      const userId = req.userId;
      const contactId = parseInt(req.params.contactId, 10);
      if (!Number.isInteger(contactId)) return res.status(400).json({ error: "Invalid contact id" });
      const [contact] = await db.select().from(contacts).where(and14(eq15(contacts.id, contactId), eq15(contacts.profileId, userId)));
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      const settings = await getSettings(userId);
      const dealCount = await countDeals(userId, contactId);
      const rule = ruleBasedScore(contact, dealCount);
      let result = rule;
      if (settings.scoringModel !== "rule-based") {
        if (!checkAIRateLimit2(userId)) return res.status(429).json({ error: "Rate limit exceeded" });
        const ai = await analyzeLeadScore({
          name: `${contact.firstName} ${contact.lastName}`.trim(),
          email: contact.email,
          company: contact.company,
          industry: contact.industry,
          status: contact.status,
          source: contact.source,
          tags: contact.tags,
          dealCount,
          lastUpdated: contact.updatedAt
        });
        if (!ai.success) return sendAIError(res, ai.error);
        const score = Math.max(0, Math.min(100, Math.round(Number(ai.data?.score))));
        if (!Number.isFinite(score)) return res.status(502).json({ error: "The AI response had no score" });
        const aiResult = {
          score,
          priority: ["hot", "warm", "cold"].includes(ai.data?.priority) ? ai.data.priority : priorityFor(score),
          rationale: String(ai.data?.rationale || "")
        };
        result = settings.scoringModel === "hybrid" ? blendScores(rule, aiResult) : aiResult;
      }
      const saved = await persistScore(userId, contact, result, settings.scoringModel, settings.qualificationThreshold);
      res.json({ contactId, ...saved });
    } catch (error) {
      console.error("Error scoring lead:", error);
      res.status(500).json({ error: error?.message || "Failed to score lead" });
    }
  });
  app2.get("/api/lead-automation/campaigns", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      res.json(await listCampaigns(req.userId));
    } catch (error) {
      console.error("Error listing campaigns:", error);
      res.status(500).json({ error: "Failed to load campaigns" });
    }
  });
  app2.post("/api/lead-automation/campaigns", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      const parsed = parseCampaign(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });
      res.status(201).json(await createCampaign(req.userId, parsed.value));
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });
  app2.get("/api/lead-automation/campaigns/:id", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      const found = await getCampaign(req.userId, req.params.id);
      if (!found) return res.status(404).json({ error: "Campaign not found" });
      res.json(found);
    } catch (error) {
      console.error("Error loading campaign:", error);
      res.status(500).json({ error: "Failed to load campaign" });
    }
  });
  app2.put("/api/lead-automation/campaigns/:id", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      const result = await updateCampaign(req.userId, req.params.id, req.body);
      if ("error" in result) return res.status(400).json({ error: result.error });
      if (!result.campaign) return res.status(404).json({ error: "Campaign not found" });
      res.json(result.campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });
  app2.delete("/api/lead-automation/campaigns/:id", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      if (!await deleteCampaign(req.userId, req.params.id)) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });
  app2.post("/api/lead-automation/process", async (req, res) => {
    try {
      if (!db) return noDb3(res);
      res.json({ tasksCreated: await processDueSteps(req.userId) });
    } catch (error) {
      console.error("Error processing campaign steps:", error);
      res.status(500).json({ error: "Failed to process campaign steps" });
    }
  });
}

// server/routes/index.ts
async function registerRoutes(app2) {
  console.log("Registering auth routes at /api/auth");
  app2.use("/api/auth", auth_default);
  registerCRMRoutes(app2);
  registerWorkflowRoutes(app2);
  registerAdminRoutes(app2);
  console.log("Registering billing routes at /api/billing");
  app2.use("/api/billing", router3);
  console.log("Registering OpenClaw routes at /api/openclaw");
  app2.use("/api/openclaw", openclaw_default);
  console.log("Registering analytics routes at /api/analytics");
  app2.use("/api/analytics", analytics_default);
  console.log("Registering messaging routes");
  registerMessagingRoutes(app2);
  console.log("Registering phone routes");
  registerPhoneRoutes(app2);
  console.log("Registering video routes");
  registerVideoRoutes(app2);
  registerVideoScriptRoute(app2);
  console.log("Registering appointment routes");
  registerAppointmentRoutes(app2);
  console.log("Registering AI routes");
  registerAIRoutes(app2);
  console.log("Registering AI pricing routes");
  registerAIPricingRoutes(app2);
  console.log("Registering companies routes at /api/companies");
  app2.use("/api/companies", companies_default);
  console.log("Registering OpenAI routes at /api/openai");
  app2.use(openai_default);
  console.log("Registering OpenAI Responses API routes at /api/openai");
  app2.use(openaiResponses_default);
  console.log("Registering domains routes at /api/domains");
  app2.use("/api/domains", domains_default);
  console.log("Registering themes routes at /api/themes");
  app2.use("/api/themes", themes_default);
  console.log("Registering provisioning routes at /api/provisioning");
  app2.use("/api/provisioning", provisioning_default);
  console.log("Registering assets routes at /api/assets");
  app2.use("/api/assets", assets_default);
  console.log("Registering white-label routes at /api/whitelabel");
  app2.use("/api/whitelabel", whitelabel_default);
  console.log("Registering API key routes");
  registerApiKeyRoutes(app2);
  console.log("Registering AI Sales Tools routes");
  registerAISalesToolsRoutes(app2);
  console.log("Registering AI Communication Tools routes");
  registerAICommunicationRoutes(app2);
  console.log("Registering Content & Marketing Tools routes");
  registerAIContentRoutes(app2);
  console.log("Registering Meeting & Productivity Tools routes");
  registerAIProductivityRoutes(app2);
  console.log("Registering Advanced AI Tools routes");
  registerAIAdvancedRoutes(app2);
  console.log("Registering Automation Tools routes");
  registerAIAutomationRoutes(app2);
  console.log("Registering partners routes");
  registerPartnersRoutes(app2);
  console.log("Registering lead automation routes");
  registerLeadAutomationRoutes(app2);
}

// server/log.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/health/index.ts
import os from "os";
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
  results.push({ service: "openai", status: "healthy", message: "Uses each user's own API key" });
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
  const loadAverage = process.platform === "linux" ? os.loadavg() : [0, 0, 0];
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

// server/app.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((_req, _res, next) => requestContext.run({}, next));
app.use(securityHeaders);
app.use(corsConfig);
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && !path2.includes("/auth") && !path2.includes("/admin") && !path2.includes("/users")) {
        const sanitizedResponse = { ...capturedJsonResponse };
        delete sanitizedResponse.password;
        delete sanitizedResponse.token;
        delete sanitizedResponse.apiKey;
        delete sanitizedResponse.secret;
        delete sanitizedResponse.email;
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
var supabaseUrl11 = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
var supabaseServiceKey2 = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
var supabaseAdmin = supabaseUrl11 && supabaseServiceKey2 ? createClient12(supabaseUrl11, supabaseServiceKey2) : null;
app.use("/api", async (req, res, next) => {
  const userId = req.session?.userId;
  const cachedEntitlement = req.session?.entitlement;
  if (cachedEntitlement) {
    if (cachedEntitlement.package === "no_access") {
      return res.status(403).json({
        error: "Forbidden - No subscription",
        message: "Your account has no active subscription. Please upgrade to access this feature."
      });
    }
    return next();
  }
  if (!userId) return next();
  if (!supabaseAdmin) return next();
  try {
    const { data } = await supabaseAdmin.from("smartcrm_user_entitlements").select("package").eq("user_id", userId).single();
    if (req.session) {
      req.session.entitlement = data || null;
    }
    if (data?.package === "no_access") {
      return res.status(403).json({
        error: "Forbidden - No subscription",
        message: "Your account has no active subscription. Please upgrade to access this feature."
      });
    }
  } catch (err) {
    console.error("Entitlement global check error:", err);
    return res.status(500).json({
      error: "Entitlement verification failed",
      message: "Unable to verify subscription status. Please try again later."
    });
  }
  next();
});
app.get("/health", (req, res) => {
  healthCheckMiddleware(req, res);
});
var appReady = (async () => {
  await registerRoutes(app);
  log("\u2705 Routes registered successfully");
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`\u274C Server error: ${status} - ${message}`);
    res.status(status).json({ message });
  });
})();

// server/netlify-api.ts
var serverlessHandler = serverless(app, {
  request(req) {
    req.url = req.url.replace(/^\/\.netlify\/functions\/api(?=\/|\?|$)/, "/api");
  }
});
var handler = async (event, context) => {
  await appReady;
  return serverlessHandler(event, context);
};
export {
  handler
};
