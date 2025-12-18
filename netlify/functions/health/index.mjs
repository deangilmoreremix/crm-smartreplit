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
  aiQueries: () => aiQueries,
  aiQueriesRelations: () => aiQueriesRelations,
  appointments: () => appointments,
  appointmentsRelations: () => appointmentsRelations,
  automationRules: () => automationRules,
  automationRulesRelations: () => automationRulesRelations,
  automations: () => automations,
  billingCycles: () => billingCycles,
  billingCyclesRelations: () => billingCyclesRelations,
  billingNotifications: () => billingNotifications,
  commissions: () => commissions,
  commissionsRelations: () => commissionsRelations,
  communications: () => communications,
  communicationsRelations: () => communicationsRelations,
  contacts: () => contacts,
  contactsRelations: () => contactsRelations,
  creditTransactions: () => creditTransactions,
  creditTransactionsRelations: () => creditTransactionsRelations,
  deals: () => deals,
  dealsRelations: () => dealsRelations,
  documents: () => documents,
  documentsRelations: () => documentsRelations,
  entitlements: () => entitlements,
  entitlementsRelations: () => entitlementsRelations,
  featurePackages: () => featurePackages,
  featureUsage: () => featureUsage,
  features: () => features,
  insertAiQuerySchema: () => insertAiQuerySchema,
  insertAppointmentSchema: () => insertAppointmentSchema,
  insertAutomationRuleSchema: () => insertAutomationRuleSchema,
  insertAutomationSchema: () => insertAutomationSchema,
  insertBillingCycleSchema: () => insertBillingCycleSchema,
  insertBillingNotificationSchema: () => insertBillingNotificationSchema,
  insertCommissionSchema: () => insertCommissionSchema,
  insertCommunicationSchema: () => insertCommunicationSchema,
  insertContactSchema: () => insertContactSchema,
  insertCreditTransactionSchema: () => insertCreditTransactionSchema,
  insertDealSchema: () => insertDealSchema,
  insertDocumentSchema: () => insertDocumentSchema,
  insertEntitlementSchema: () => insertEntitlementSchema,
  insertFeaturePackageSchema: () => insertFeaturePackageSchema,
  insertFeatureSchema: () => insertFeatureSchema,
  insertFeatureUsageSchema: () => insertFeatureUsageSchema,
  insertNoteSchema: () => insertNoteSchema,
  insertPartnerCustomerSchema: () => insertPartnerCustomerSchema,
  insertPartnerMetricsSchema: () => insertPartnerMetricsSchema,
  insertPartnerSchema: () => insertPartnerSchema,
  insertPartnerTierSchema: () => insertPartnerTierSchema,
  insertPartnerWLConfigSchema: () => insertPartnerWLConfigSchema,
  insertPayoutSchema: () => insertPayoutSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertTaskSchema: () => insertTaskSchema,
  insertTenantConfigSchema: () => insertTenantConfigSchema,
  insertTierFeatureSchema: () => insertTierFeatureSchema,
  insertTokenTransactionSchema: () => insertTokenTransactionSchema,
  insertUsageEventSchema: () => insertUsageEventSchema,
  insertUsagePlanSchema: () => insertUsagePlanSchema,
  insertUserAiTokensSchema: () => insertUserAiTokensSchema,
  insertUserCreditsSchema: () => insertUserCreditsSchema,
  insertUserFeatureSchema: () => insertUserFeatureSchema,
  insertUserGeneratedImageSchema: () => insertUserGeneratedImageSchema,
  insertUserUsageLimitSchema: () => insertUserUsageLimitSchema,
  insertUserWLSettingsSchema: () => insertUserWLSettingsSchema,
  insertWhiteLabelPackageSchema: () => insertWhiteLabelPackageSchema,
  notes: () => notes,
  notesRelations: () => notesRelations,
  partnerCustomers: () => partnerCustomers,
  partnerCustomersRelations: () => partnerCustomersRelations,
  partnerMetrics: () => partnerMetrics,
  partnerMetricsRelations: () => partnerMetricsRelations,
  partnerTiers: () => partnerTiers,
  partnerTiersRelations: () => partnerTiersRelations,
  partnerWLConfigs: () => partnerWLConfigs,
  partners: () => partners,
  partnersRelations: () => partnersRelations,
  payouts: () => payouts,
  payoutsRelations: () => payoutsRelations,
  productTiers: () => productTiers,
  profiles: () => profiles,
  profilesRelations: () => profilesRelations,
  tasks: () => tasks,
  tasksRelations: () => tasksRelations,
  tenantConfigs: () => tenantConfigs,
  tierFeatures: () => tierFeatures,
  tokenTransactions: () => tokenTransactions,
  updateAppointmentSchema: () => updateAppointmentSchema,
  updateNoteSchema: () => updateNoteSchema,
  updateTaskSchema: () => updateTaskSchema,
  usageEvents: () => usageEvents,
  usageEventsRelations: () => usageEventsRelations,
  usagePlans: () => usagePlans,
  usagePlansRelations: () => usagePlansRelations,
  userAiTokens: () => userAiTokens,
  userCredits: () => userCredits,
  userCreditsRelations: () => userCreditsRelations,
  userFeatures: () => userFeatures,
  userGeneratedImages: () => userGeneratedImages,
  userGeneratedImagesRelations: () => userGeneratedImagesRelations,
  userRoles: () => userRoles,
  userUsageLimits: () => userUsageLimits,
  userUsageLimitsRelations: () => userUsageLimitsRelations,
  userWLSettings: () => userWLSettings,
  whiteLabelPackages: () => whiteLabelPackages
});
import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
var userRoles, productTiers, profiles, contacts, deals, tasks, appointments, communications, notes, documents, automationRules, aiQueries, userAiTokens, tokenTransactions, entitlements, profilesRelations, contactsRelations, dealsRelations, tasksRelations, appointmentsRelations, communicationsRelations, notesRelations, documentsRelations, automationRulesRelations, aiQueriesRelations, entitlementsRelations, insertProfileSchema, insertContactSchema, insertDealSchema, insertTaskSchema, updateTaskSchema, insertAppointmentSchema, updateAppointmentSchema, insertCommunicationSchema, insertNoteSchema, updateNoteSchema, insertDocumentSchema, insertAutomationRuleSchema, insertAiQuerySchema, insertEntitlementSchema, partners, partnerTiers, commissions, payouts, partnerCustomers, featurePackages, partnerMetrics, partnersRelations, partnerTiersRelations, commissionsRelations, payoutsRelations, partnerCustomersRelations, partnerMetricsRelations, insertPartnerSchema, insertPartnerTierSchema, insertCommissionSchema, insertPayoutSchema, insertPartnerCustomerSchema, insertFeaturePackageSchema, insertPartnerMetricsSchema, tenantConfigs, whiteLabelPackages, userWLSettings, partnerWLConfigs, insertTenantConfigSchema, insertWhiteLabelPackageSchema, insertUserWLSettingsSchema, insertPartnerWLConfigSchema, userGeneratedImages, userGeneratedImagesRelations, insertUserGeneratedImageSchema, automations, insertAutomationSchema, features, userFeatures, tierFeatures, featureUsage, insertFeatureSchema, insertUserFeatureSchema, insertTierFeatureSchema, insertFeatureUsageSchema, insertUserAiTokensSchema, insertTokenTransactionSchema, usagePlans, usageEvents, billingCycles, userUsageLimits, billingNotifications, usagePlansRelations, usageEventsRelations, billingCyclesRelations, userUsageLimitsRelations, insertUsagePlanSchema, insertUsageEventSchema, insertBillingCycleSchema, insertUserUsageLimitSchema, insertBillingNotificationSchema, userCredits, creditTransactions, userCreditsRelations, creditTransactionsRelations, insertUserCreditsSchema, insertCreditTransactionSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    userRoles = ["super_admin", "wl_user", "regular_user"];
    productTiers = [
      "super_admin",
      // All features including admin
      "whitelabel",
      // All features including whitelabel (excluding admin)
      "smartcrm_bundle",
      // All tools except whitelabel
      "smartcrm",
      // Dashboard, Contacts, Pipeline, Calendar
      "sales_maximizer",
      // AI Goals and AI Tools
      "ai_boost_unlimited",
      // Unlimited AI credits
      "ai_communication"
      // Video Email, SMS, VoIP, Invoicing, Lead Automation, Circle Prospecting
    ];
    profiles = pgTable("profiles", {
      id: uuid("id").primaryKey(),
      username: text("username").unique(),
      firstName: text("first_name"),
      lastName: text("last_name"),
      role: text("role").default("regular_user"),
      productTier: text("product_tier"),
      // Product tier for access control - null until user purchases a tier
      avatar: text("avatar_url"),
      appContext: text("app_context").default("smartcrm"),
      // Track which app the user came from
      emailTemplateSet: text("email_template_set").default("smartcrm"),
      // Control which email templates to use
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
      position: text("position"),
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
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      profileId: uuid("profile_id").references(() => profiles.id)
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
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      contactId: integer("contact_id").references(() => contacts.id),
      dealId: integer("deal_id").references(() => deals.id),
      profileId: uuid("profile_id").references(() => profiles.id)
    });
    appointments = pgTable("appointments", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description"),
      startTime: timestamp("start_time").notNull(),
      endTime: timestamp("end_time").notNull(),
      location: text("location"),
      type: text("type").default("meeting"),
      status: text("status").default("scheduled"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      contactId: integer("contact_id").references(() => contacts.id),
      profileId: uuid("profile_id").references(() => profiles.id)
    });
    communications = pgTable("communications", {
      id: serial("id").primaryKey(),
      type: text("type").notNull(),
      // email, call, sms, meeting
      subject: text("subject"),
      content: text("content"),
      direction: text("direction").notNull(),
      // inbound, outbound
      status: text("status").default("sent"),
      sentAt: timestamp("sent_at"),
      createdAt: timestamp("created_at").defaultNow(),
      contactId: integer("contact_id").references(() => contacts.id),
      profileId: uuid("profile_id").references(() => profiles.id)
    });
    notes = pgTable("notes", {
      id: serial("id").primaryKey(),
      content: text("content").notNull(),
      type: text("type").default("general"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      contactId: integer("contact_id").references(() => contacts.id),
      dealId: integer("deal_id").references(() => deals.id),
      profileId: uuid("profile_id").references(() => profiles.id)
    });
    documents = pgTable("documents", {
      id: serial("id").primaryKey(),
      fileName: text("file_name").notNull(),
      filePath: text("file_path").notNull(),
      fileSize: integer("file_size"),
      mimeType: text("mime_type"),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow(),
      contactId: integer("contact_id").references(() => contacts.id),
      dealId: integer("deal_id").references(() => deals.id),
      profileId: uuid("profile_id").references(() => profiles.id)
    });
    automationRules = pgTable("automation_rules", {
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
    aiQueries = pgTable("ai_queries", {
      id: serial("id").primaryKey(),
      query: text("query").notNull(),
      response: text("response"),
      type: text("type").notNull(),
      // natural_language, sentiment, sales_pitch, email_draft
      model: text("model"),
      createdAt: timestamp("created_at").defaultNow(),
      profileId: uuid("profile_id").references(() => profiles.id)
    });
    userAiTokens = pgTable("user_ai_tokens", {
      id: serial("id").primaryKey(),
      profileId: uuid("profile_id").notNull().references(() => profiles.id),
      totalTokens: integer("total_tokens").default(0),
      // Total tokens purchased
      usedTokens: integer("used_tokens").default(0),
      // Tokens used
      availableTokens: integer("available_tokens").default(0),
      // totalTokens - usedTokens
      lastPurchaseAt: timestamp("last_purchase_at"),
      lastResetAt: timestamp("last_reset_at").defaultNow(),
      expiresAt: timestamp("expires_at"),
      // Optional: tokens can expire
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    tokenTransactions = pgTable("token_transactions", {
      id: serial("id").primaryKey(),
      profileId: uuid("profile_id").notNull().references(() => profiles.id),
      type: text("type").notNull(),
      // purchase, usage, refund, admin_grant
      amount: integer("amount").notNull(),
      // Positive for purchases/grants, negative for usage
      description: text("description"),
      // "Purchased 1000 tokens", "GPT-5 query", etc.
      balanceBefore: integer("balance_before"),
      balanceAfter: integer("balance_after"),
      stripeTransactionId: text("stripe_transaction_id"),
      // Link to Stripe if purchased
      createdAt: timestamp("created_at").defaultNow()
    });
    entitlements = pgTable("entitlements", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => profiles.id),
      // Link to Supabase user
      status: text("status").notNull().default("active"),
      // active, past_due, canceled, refunded, inactive
      productType: text("product_type"),
      // lifetime, monthly, yearly, payment_plan
      revokeAt: timestamp("revoke_at", { withTimezone: true }),
      // When access should flip off (UTC)
      lastInvoiceStatus: text("last_invoice_status"),
      // paid, open, uncollectible, void, failed
      delinquencyCount: integer("delinquency_count").default(0),
      // For payment plan misses
      stripeSubscriptionId: text("stripe_subscription_id"),
      stripeCustomerId: text("stripe_customer_id"),
      zaxaaSubscriptionId: text("zaxaa_subscription_id"),
      planName: text("plan_name"),
      planAmount: decimal("plan_amount", { precision: 10, scale: 2 }),
      currency: text("currency").default("USD"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    profilesRelations = relations(profiles, ({ many, one }) => ({
      contacts: many(contacts),
      deals: many(deals),
      tasks: many(tasks),
      appointments: many(appointments),
      communications: many(communications),
      notes: many(notes),
      documents: many(documents),
      automationRules: many(automationRules),
      aiQueries: many(aiQueries),
      generatedImages: many(userGeneratedImages),
      // Add generated images relation
      aiTokens: one(userAiTokens, {
        fields: [profiles.id],
        references: [userAiTokens.profileId]
      }),
      tokenTransactions: many(tokenTransactions),
      entitlement: one(entitlements, {
        fields: [profiles.id],
        references: [entitlements.userId]
      })
    }));
    contactsRelations = relations(contacts, ({ one, many }) => ({
      profile: one(profiles, {
        fields: [contacts.profileId],
        references: [profiles.id]
      }),
      deals: many(deals),
      tasks: many(tasks),
      appointments: many(appointments),
      communications: many(communications),
      notes: many(notes),
      documents: many(documents)
    }));
    dealsRelations = relations(deals, ({ one, many }) => ({
      contact: one(contacts, {
        fields: [deals.contactId],
        references: [contacts.id]
      }),
      profile: one(profiles, {
        fields: [deals.profileId],
        references: [profiles.id]
      }),
      tasks: many(tasks),
      notes: many(notes),
      documents: many(documents)
    }));
    tasksRelations = relations(tasks, ({ one }) => ({
      contact: one(contacts, {
        fields: [tasks.contactId],
        references: [contacts.id]
      }),
      deal: one(deals, {
        fields: [tasks.dealId],
        references: [deals.id]
      }),
      profile: one(profiles, {
        fields: [tasks.profileId],
        references: [profiles.id]
      })
    }));
    appointmentsRelations = relations(appointments, ({ one }) => ({
      contact: one(contacts, {
        fields: [appointments.contactId],
        references: [contacts.id]
      }),
      profile: one(profiles, {
        fields: [appointments.profileId],
        references: [profiles.id]
      })
    }));
    communicationsRelations = relations(communications, ({ one }) => ({
      contact: one(contacts, {
        fields: [communications.contactId],
        references: [contacts.id]
      }),
      profile: one(profiles, {
        fields: [communications.profileId],
        references: [profiles.id]
      })
    }));
    notesRelations = relations(notes, ({ one }) => ({
      contact: one(contacts, {
        fields: [notes.contactId],
        references: [contacts.id]
      }),
      deal: one(deals, {
        fields: [notes.dealId],
        references: [deals.id]
      }),
      profile: one(profiles, {
        fields: [notes.profileId],
        references: [profiles.id]
      })
    }));
    documentsRelations = relations(documents, ({ one }) => ({
      contact: one(contacts, {
        fields: [documents.contactId],
        references: [contacts.id]
      }),
      deal: one(deals, {
        fields: [documents.dealId],
        references: [deals.id]
      }),
      profile: one(profiles, {
        fields: [documents.profileId],
        references: [profiles.id]
      })
    }));
    automationRulesRelations = relations(automationRules, ({ one }) => ({
      profile: one(profiles, {
        fields: [automationRules.profileId],
        references: [profiles.id]
      })
    }));
    aiQueriesRelations = relations(aiQueries, ({ one }) => ({
      profile: one(profiles, {
        fields: [aiQueries.profileId],
        references: [profiles.id]
      })
    }));
    entitlementsRelations = relations(entitlements, ({ one }) => ({
      user: one(profiles, {
        fields: [entitlements.userId],
        references: [profiles.id]
      })
    }));
    insertProfileSchema = createInsertSchema(profiles).pick({
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true
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
    updateTaskSchema = insertTaskSchema.partial().omit({
      profileId: true
      // Never allow updating profileId
    });
    insertAppointmentSchema = createInsertSchema(appointments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateAppointmentSchema = insertAppointmentSchema.partial().omit({
      profileId: true
      // Never allow updating profileId
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
    insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAiQuerySchema = createInsertSchema(aiQueries).omit({
      id: true,
      createdAt: true
    });
    insertEntitlementSchema = createInsertSchema(entitlements).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    partners = pgTable("partners", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      companyName: text("company_name").notNull(),
      contactName: text("contact_name"),
      // Made nullable to fix the constraint error
      contactEmail: text("contact_email").notNull().unique(),
      phone: text("phone"),
      website: text("website"),
      businessType: text("business_type"),
      status: text("status").default("pending"),
      // pending, active, suspended, terminated
      tier: text("tier").default("bronze"),
      // bronze, silver, gold, platinum
      commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("15.00"),
      totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
      totalCommissions: decimal("total_commissions", { precision: 12, scale: 2 }).default("0.00"),
      customerCount: integer("customer_count").default(0),
      brandingConfig: json("branding_config"),
      // Logo, colors, custom domain
      contractDetails: json("contract_details"),
      // Terms, conditions, etc.
      payoutSettings: json("payout_settings"),
      // Payment method, schedule, etc.
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      profileId: uuid("profile_id").references(() => profiles.id)
      // Partner owner
    });
    partnerTiers = pgTable("partner_tiers", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull().unique(),
      // Bronze Partner, Silver Partner, etc.
      slug: text("slug").notNull().unique(),
      // bronze, silver, gold, platinum
      commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
      minimumRevenue: decimal("minimum_revenue", { precision: 10, scale: 2 }).default("0.00"),
      features: text("features").array(),
      // Array of feature names
      benefits: text("benefits").array(),
      // Array of benefit descriptions
      color: text("color"),
      // UI color scheme
      priority: integer("priority").default(1),
      // For ordering
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    commissions = pgTable("commissions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      partnerId: uuid("partner_id").references(() => partners.id).notNull(),
      dealId: integer("deal_id").references(() => deals.id),
      customerId: integer("customer_id").references(() => contacts.id),
      type: text("type").notNull(),
      // one_time, recurring, bonus
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      rate: decimal("rate", { precision: 5, scale: 2 }),
      // Commission rate used
      baseAmount: decimal("base_amount", { precision: 10, scale: 2 }),
      // Original amount before commission
      status: text("status").default("pending"),
      // pending, approved, paid, cancelled
      description: text("description"),
      periodStart: timestamp("period_start"),
      periodEnd: timestamp("period_end"),
      createdAt: timestamp("created_at").defaultNow(),
      approvedAt: timestamp("approved_at"),
      paidAt: timestamp("paid_at"),
      profileId: uuid("profile_id").references(() => profiles.id)
      // System user who created
    });
    payouts = pgTable("payouts", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      partnerId: uuid("partner_id").references(() => partners.id).notNull(),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      commissionsCount: integer("commissions_count").default(0),
      paymentMethod: text("payment_method"),
      // stripe, paypal, bank_transfer, check
      paymentDetails: json("payment_details"),
      // Payment-specific information
      status: text("status").default("pending"),
      // pending, processing, completed, failed, cancelled
      scheduledDate: timestamp("scheduled_date"),
      processedAt: timestamp("processed_at"),
      failureReason: text("failure_reason"),
      externalTransactionId: text("external_transaction_id"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      processedBy: uuid("processed_by").references(() => profiles.id)
    });
    partnerCustomers = pgTable("partner_customers", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      partnerId: uuid("partner_id").references(() => partners.id).notNull(),
      customerId: integer("customer_id").references(() => contacts.id).notNull(),
      referralCode: text("referral_code"),
      acquisitionDate: timestamp("acquisition_date").defaultNow(),
      lifetime_value: decimal("lifetime_value", { precision: 10, scale: 2 }).default("0.00"),
      status: text("status").default("active"),
      // active, churned, suspended
      source: text("source"),
      // How customer was acquired
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    featurePackages = pgTable("feature_packages", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      features: text("features").array(),
      price: decimal("price", { precision: 8, scale: 2 }),
      billingCycle: text("billing_cycle"),
      // monthly, yearly, one_time
      isActive: boolean("is_active").default(true),
      targetTier: text("target_tier"),
      // Which partner tier this is for
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    partnerMetrics = pgTable("partner_metrics", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      partnerId: uuid("partner_id").references(() => partners.id).notNull(),
      month: integer("month").notNull(),
      year: integer("year").notNull(),
      newCustomers: integer("new_customers").default(0),
      totalCustomers: integer("total_customers").default(0),
      monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }).default("0.00"),
      totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
      commissionsEarned: decimal("commissions_earned", { precision: 10, scale: 2 }).default("0.00"),
      conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
      churnRate: decimal("churn_rate", { precision: 5, scale: 2 }).default("0.00"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      partnerMonthYearIdx: sql`CREATE UNIQUE INDEX IF NOT EXISTS partner_month_year_idx ON ${table} (partner_id, month, year)`
    }));
    partnersRelations = relations(partners, ({ one, many }) => ({
      profile: one(profiles, {
        fields: [partners.profileId],
        references: [profiles.id]
      }),
      tier: one(partnerTiers, {
        fields: [partners.tier],
        references: [partnerTiers.slug]
      }),
      commissions: many(commissions),
      payouts: many(payouts),
      customers: many(partnerCustomers),
      metrics: many(partnerMetrics)
    }));
    partnerTiersRelations = relations(partnerTiers, ({ many }) => ({
      partners: many(partners)
    }));
    commissionsRelations = relations(commissions, ({ one }) => ({
      partner: one(partners, {
        fields: [commissions.partnerId],
        references: [partners.id]
      }),
      deal: one(deals, {
        fields: [commissions.dealId],
        references: [deals.id]
      }),
      customer: one(contacts, {
        fields: [commissions.customerId],
        references: [contacts.id]
      }),
      profile: one(profiles, {
        fields: [commissions.profileId],
        references: [profiles.id]
      })
    }));
    payoutsRelations = relations(payouts, ({ one, many }) => ({
      partner: one(partners, {
        fields: [payouts.partnerId],
        references: [partners.id]
      }),
      processedBy: one(profiles, {
        fields: [payouts.processedBy],
        references: [profiles.id]
      })
    }));
    partnerCustomersRelations = relations(partnerCustomers, ({ one }) => ({
      partner: one(partners, {
        fields: [partnerCustomers.partnerId],
        references: [partners.id]
      }),
      customer: one(contacts, {
        fields: [partnerCustomers.customerId],
        references: [contacts.id]
      })
    }));
    partnerMetricsRelations = relations(partnerMetrics, ({ one }) => ({
      partner: one(partners, {
        fields: [partnerMetrics.partnerId],
        references: [partners.id]
      })
    }));
    insertPartnerSchema = createInsertSchema(partners).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPartnerTierSchema = createInsertSchema(partnerTiers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCommissionSchema = createInsertSchema(commissions).omit({
      id: true,
      createdAt: true,
      approvedAt: true,
      paidAt: true
    });
    insertPayoutSchema = createInsertSchema(payouts).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      processedAt: true
    });
    insertPartnerCustomerSchema = createInsertSchema(partnerCustomers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertFeaturePackageSchema = createInsertSchema(featurePackages).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPartnerMetricsSchema = createInsertSchema(partnerMetrics).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    tenantConfigs = pgTable("tenant_configs", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      tenantId: text("tenant_id").notNull().unique(),
      // Unique identifier for tenant
      companyName: text("company_name"),
      logo: text("logo"),
      // Logo URL
      favicon: text("favicon"),
      // Favicon URL
      primaryColor: text("primary_color").default("#3B82F6"),
      secondaryColor: text("secondary_color").default("#1E40AF"),
      accentColor: text("accent_color").default("#10B981"),
      backgroundColor: text("background_color").default("#FFFFFF"),
      textColor: text("text_color").default("#1F2937"),
      customDomain: text("custom_domain"),
      customCSS: text("custom_css"),
      emailFromName: text("email_from_name"),
      emailReplyTo: text("email_reply_to"),
      emailSignature: text("email_signature"),
      features: json("features"),
      // Feature toggles and settings
      brandingConfig: json("branding_config"),
      // Complete branding configuration
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      profileId: uuid("profile_id").references(() => profiles.id)
      // Tenant owner
    });
    whiteLabelPackages = pgTable("white_label_packages", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      features: text("features").array(),
      // Array of enabled features
      pricing: json("pricing"),
      // Pricing configuration
      customizations: json("customizations"),
      // Available customization options
      restrictions: json("restrictions"),
      // Feature restrictions
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userWLSettings = pgTable("user_wl_settings", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").references(() => profiles.id).notNull(),
      packageId: uuid("package_id").references(() => whiteLabelPackages.id),
      customBranding: json("custom_branding"),
      // User's custom branding settings
      enabledFeatures: text("enabled_features").array(),
      // User's enabled WL features
      preferences: json("preferences"),
      // User interface preferences
      settings: json("settings"),
      // Additional settings storage
      lastSyncAt: timestamp("last_sync_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    partnerWLConfigs = pgTable("partner_wl_configs", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      partnerId: uuid("partner_id").references(() => partners.id).notNull().unique(),
      brandingActive: boolean("branding_active").default(false),
      logoUrl: text("logo_url"),
      primaryColor: text("primary_color"),
      secondaryColor: text("secondary_color"),
      customDomain: text("custom_domain"),
      emailBranding: json("email_branding"),
      // Email template customizations
      uiCustomizations: json("ui_customizations"),
      // UI theme customizations
      featureOverrides: json("feature_overrides"),
      // Feature availability overrides
      apiSettings: json("api_settings"),
      // API configuration for partner
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertTenantConfigSchema = createInsertSchema(tenantConfigs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertWhiteLabelPackageSchema = createInsertSchema(whiteLabelPackages).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserWLSettingsSchema = createInsertSchema(userWLSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPartnerWLConfigSchema = createInsertSchema(partnerWLConfigs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    userGeneratedImages = pgTable("user_generated_images", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").references(() => profiles.id).notNull(),
      filename: text("filename").notNull(),
      storagePath: text("storage_path").notNull(),
      publicUrl: text("public_url").notNull(),
      promptText: text("prompt_text"),
      feature: text("feature"),
      // SmartCRM feature: 'Enhanced Contacts', 'Pipeline Deals', etc.
      format: text("format"),
      // Format: 'Poster', 'Flyer', 'Product Mock', etc.
      aspectRatio: text("aspect_ratio"),
      // Aspect ratio: '1:1', '16:9', etc.
      createdAt: timestamp("created_at").defaultNow(),
      metadata: json("metadata")
      // Additional metadata like seeds, variants, etc.
    });
    userGeneratedImagesRelations = relations(userGeneratedImages, ({ one }) => ({
      user: one(profiles, {
        fields: [userGeneratedImages.userId],
        references: [profiles.id]
      })
    }));
    insertUserGeneratedImageSchema = createInsertSchema(userGeneratedImages).omit({
      id: true,
      createdAt: true
    });
    automations = pgTable("automations", {
      id: serial("id").primaryKey(),
      automationId: text("automation_id").notNull().unique(),
      // e.g., 'email-followup', 'sms-reminder'
      enabled: boolean("enabled").default(false),
      schedule: text("schedule"),
      // cron expression or schedule config (JSON string)
      config: json("config"),
      // Automation-specific configuration
      lastRun: timestamp("last_run"),
      nextRun: timestamp("next_run"),
      runCount: integer("run_count").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      profileId: uuid("profile_id").references(() => profiles.id)
    });
    insertAutomationSchema = createInsertSchema(automations).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      runCount: true
    });
    features = pgTable("features", {
      id: serial("id").primaryKey(),
      featureKey: text("feature_key").notNull().unique(),
      // e.g., 'ai_goals', 'phone_system', 'video_email'
      name: text("name").notNull(),
      // Display name
      description: text("description"),
      category: text("category").notNull(),
      // 'core_crm', 'communication', 'ai', 'business_tools', 'advanced', 'admin', 'remote_apps', 'white_label'
      parentId: integer("parent_id").references(() => features.id),
      // For hierarchical features
      deliveryType: text("delivery_type"),
      // 'native', 'module_federation', 'iframe'
      isEnabled: boolean("is_enabled").default(true),
      // Global feature toggle
      dependsOn: text("depends_on").array(),
      // Array of feature keys this feature depends on
      metadata: json("metadata"),
      // Additional config like limits, options, etc.
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userFeatures = pgTable("user_features", {
      id: serial("id").primaryKey(),
      profileId: uuid("profile_id").references(() => profiles.id).notNull(),
      featureId: integer("feature_id").references(() => features.id).notNull(),
      enabled: boolean("enabled").notNull().default(true),
      expiresAt: timestamp("expires_at"),
      // Optional expiration for temporary access
      grantedBy: uuid("granted_by").references(() => profiles.id),
      // Admin who granted access
      grantedAt: timestamp("granted_at").defaultNow(),
      metadata: json("metadata")
      // Feature-specific metadata like usage limits
    }, (table) => {
      return {
        // Unique constraint: one record per user per feature
        uniqueUserFeature: {
          name: "unique_user_feature",
          columns: [table.profileId, table.featureId]
        }
      };
    });
    tierFeatures = pgTable("tier_features", {
      id: serial("id").primaryKey(),
      productTier: text("product_tier").notNull(),
      // 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited'
      featureId: integer("feature_id").references(() => features.id).notNull(),
      includedByDefault: boolean("included_by_default").default(true),
      metadata: json("metadata"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => {
      return {
        // Unique constraint: one record per tier per feature
        uniqueTierFeature: {
          name: "unique_tier_feature",
          columns: [table.productTier, table.featureId]
        }
      };
    });
    featureUsage = pgTable("feature_usage", {
      id: serial("id").primaryKey(),
      profileId: uuid("profile_id").references(() => profiles.id).notNull(),
      featureId: integer("feature_id").references(() => features.id).notNull(),
      lastAccessed: timestamp("last_accessed").defaultNow(),
      accessCount: integer("access_count").default(1),
      metadata: json("metadata")
      // Additional usage data
    });
    insertFeatureSchema = createInsertSchema(features).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserFeatureSchema = createInsertSchema(userFeatures).omit({
      id: true,
      grantedAt: true
    });
    insertTierFeatureSchema = createInsertSchema(tierFeatures).omit({
      id: true,
      createdAt: true
    });
    insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
      id: true,
      lastAccessed: true
    });
    insertUserAiTokensSchema = createInsertSchema(userAiTokens).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
      id: true,
      createdAt: true
    });
    usagePlans = pgTable("usage_plans", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      planName: text("plan_name").notNull().unique(),
      displayName: text("display_name").notNull(),
      description: text("description"),
      billingType: text("billing_type").notNull(),
      // 'subscription', 'pay_per_use', 'hybrid'
      basePriceCents: integer("base_price_cents").default(0),
      currency: text("currency").default("USD"),
      billingInterval: text("billing_interval"),
      // 'month', 'year', null
      isActive: boolean("is_active").default(true),
      stripeProductId: text("stripe_product_id"),
      stripePriceId: text("stripe_price_id"),
      features: json("features").default("{}"),
      limits: json("limits").default("{}"),
      pricingTiers: json("pricing_tiers").default("[]"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    usageEvents = pgTable("usage_events", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull(),
      tenantId: uuid("tenant_id"),
      eventType: text("event_type").notNull(),
      // 'api_call', 'ai_generation', 'storage', 'bandwidth', etc.
      featureName: text("feature_name").notNull(),
      // 'openai_api', 'content_generation', 'storage_gb', etc.
      quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull().default("1"),
      unit: text("unit").notNull(),
      // 'requests', 'tokens', 'gb', 'minutes', etc.
      costCents: integer("cost_cents").default(0),
      metadata: json("metadata").default("{}"),
      billingCycleId: uuid("billing_cycle_id"),
      stripeSubscriptionItemId: text("stripe_subscription_item_id"),
      createdAt: timestamp("created_at").defaultNow()
    });
    billingCycles = pgTable("billing_cycles", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull(),
      tenantId: uuid("tenant_id"),
      stripeSubscriptionId: text("stripe_subscription_id"),
      billingPlanId: uuid("billing_plan_id").references(() => usagePlans.id),
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      status: text("status").notNull().default("active"),
      // 'active', 'completed', 'failed', 'cancelled'
      totalUsage: json("total_usage").default("{}"),
      totalCostCents: integer("total_cost_cents").default(0),
      stripeInvoiceId: text("stripe_invoice_id"),
      invoicePdfUrl: text("invoice_pdf_url"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userUsageLimits = pgTable("user_usage_limits", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull(),
      tenantId: uuid("tenant_id"),
      featureName: text("feature_name").notNull(),
      limitValue: decimal("limit_value", { precision: 12, scale: 4 }),
      usedValue: decimal("used_value", { precision: 12, scale: 4 }).default("0"),
      resetDate: timestamp("reset_date"),
      billingCycleId: uuid("billing_cycle_id").references(() => billingCycles.id),
      isHardLimit: boolean("is_hard_limit").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      uniqueUserFeature: {
        name: "unique_user_feature_limit",
        columns: [table.userId, table.featureName, table.billingCycleId]
      }
    }));
    billingNotifications = pgTable("billing_notifications", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull(),
      tenantId: uuid("tenant_id"),
      notificationType: text("notification_type").notNull(),
      // 'limit_warning', 'limit_exceeded', 'billing_cycle_end', 'payment_failed', 'subscription_cancelled'
      title: text("title").notNull(),
      message: text("message").notNull(),
      metadata: json("metadata").default("{}"),
      isRead: boolean("is_read").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    usagePlansRelations = relations(usagePlans, ({ many }) => ({
      billingCycles: many(billingCycles)
    }));
    usageEventsRelations = relations(usageEvents, ({ one }) => ({
      billingCycle: one(billingCycles, {
        fields: [usageEvents.billingCycleId],
        references: [billingCycles.id]
      })
    }));
    billingCyclesRelations = relations(billingCycles, ({ one, many }) => ({
      usagePlan: one(usagePlans, {
        fields: [billingCycles.billingPlanId],
        references: [usagePlans.id]
      }),
      usageEvents: many(usageEvents),
      userLimits: many(userUsageLimits)
    }));
    userUsageLimitsRelations = relations(userUsageLimits, ({ one }) => ({
      billingCycle: one(billingCycles, {
        fields: [userUsageLimits.billingCycleId],
        references: [billingCycles.id]
      })
    }));
    insertUsagePlanSchema = createInsertSchema(usagePlans).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUsageEventSchema = createInsertSchema(usageEvents).omit({
      id: true,
      createdAt: true
    });
    insertBillingCycleSchema = createInsertSchema(billingCycles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserUsageLimitSchema = createInsertSchema(userUsageLimits).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertBillingNotificationSchema = createInsertSchema(billingNotifications).omit({
      id: true,
      createdAt: true
    });
    userCredits = pgTable("user_credits", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => profiles.id),
      tenantId: uuid("tenant_id"),
      totalCredits: decimal("total_credits", { precision: 12, scale: 4 }).default("0"),
      usedCredits: decimal("used_credits", { precision: 12, scale: 4 }).default("0"),
      availableCredits: decimal("available_credits", { precision: 12, scale: 4 }).default("0"),
      lastPurchaseAt: timestamp("last_purchase_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    creditTransactions = pgTable("credit_transactions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => profiles.id),
      tenantId: uuid("tenant_id"),
      type: text("type").notNull(),
      // 'purchase', 'usage', 'refund', 'admin_grant'
      amount: decimal("amount", { precision: 12, scale: 4 }).notNull(),
      // Positive for purchases/grants, negative for usage
      description: text("description"),
      balanceBefore: decimal("balance_before", { precision: 12, scale: 4 }),
      balanceAfter: decimal("balance_after", { precision: 12, scale: 4 }),
      stripeTransactionId: text("stripe_transaction_id"),
      // Link to Stripe if purchased
      usageEventId: uuid("usage_event_id"),
      // Link to usage event if deducted for usage
      createdAt: timestamp("created_at").defaultNow()
    });
    userCreditsRelations = relations(userCredits, ({ one, many }) => ({
      user: one(profiles, {
        fields: [userCredits.userId],
        references: [profiles.id]
      }),
      transactions: many(creditTransactions)
    }));
    creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
      user: one(profiles, {
        fields: [creditTransactions.userId],
        references: [profiles.id]
      }),
      usageEvent: one(usageEvents, {
        fields: [creditTransactions.usageEventId],
        references: [usageEvents.id]
      })
    }));
    insertUserCreditsSchema = createInsertSchema(userCredits).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
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
export {
  healthCheckMiddleware,
  performHealthCheck
};
