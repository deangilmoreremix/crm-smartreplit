var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/entitlements/index.ts
import { createClient } from "@supabase/supabase-js";

// server/entitlements-utils.ts
import { DateTime } from "luxon";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiFeatureDefinitions: () => aiFeatureDefinitions,
  aiFeatureDefinitionsRelations: () => aiFeatureDefinitionsRelations,
  aiFeatureUsage: () => aiFeatureUsage,
  aiFeatureUsageRelations: () => aiFeatureUsageRelations,
  aiQueries: () => aiQueries,
  aiQueriesRelations: () => aiQueriesRelations,
  aiResellerPricing: () => aiResellerPricing,
  aiResellerPricingRelations: () => aiResellerPricingRelations,
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
  insertAIFeatureDefinitionSchema: () => insertAIFeatureDefinitionSchema,
  insertAIFeatureUsageSchema: () => insertAIFeatureUsageSchema,
  insertAIResellerPricingSchema: () => insertAIResellerPricingSchema,
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
  insertResellerCreditTransactionSchema: () => insertResellerCreditTransactionSchema,
  insertResellerCreditsSchema: () => insertResellerCreditsSchema,
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
  resellerCreditTransactions: () => resellerCreditTransactions,
  resellerCreditTransactionsRelations: () => resellerCreditTransactionsRelations,
  resellerCredits: () => resellerCredits,
  resellerCreditsRelations: () => resellerCreditsRelations,
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
var userRoles = ["super_admin", "wl_user", "regular_user"];
var productTiers = [
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
var profiles = pgTable("profiles", {
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
var contacts = pgTable("contacts", {
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  contactId: integer("contact_id").references(() => contacts.id),
  dealId: integer("deal_id").references(() => deals.id),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var appointments = pgTable("appointments", {
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
var communications = pgTable("communications", {
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
var notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  type: text("type").default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  contactId: integer("contact_id").references(() => contacts.id),
  dealId: integer("deal_id").references(() => deals.id),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var documents = pgTable("documents", {
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
var automationRules = pgTable("automation_rules", {
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
var aiQueries = pgTable("ai_queries", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  response: text("response"),
  type: text("type").notNull(),
  // natural_language, sentiment, sales_pitch, email_draft
  model: text("model"),
  createdAt: timestamp("created_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id)
});
var userAiTokens = pgTable("user_ai_tokens", {
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
var tokenTransactions = pgTable("token_transactions", {
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
var entitlements = pgTable("entitlements", {
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
var profilesRelations = relations(profiles, ({ many, one }) => ({
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
var contactsRelations = relations(contacts, ({ one, many }) => ({
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
var dealsRelations = relations(deals, ({ one, many }) => ({
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
var tasksRelations = relations(tasks, ({ one }) => ({
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
var appointmentsRelations = relations(appointments, ({ one }) => ({
  contact: one(contacts, {
    fields: [appointments.contactId],
    references: [contacts.id]
  }),
  profile: one(profiles, {
    fields: [appointments.profileId],
    references: [profiles.id]
  })
}));
var communicationsRelations = relations(communications, ({ one }) => ({
  contact: one(contacts, {
    fields: [communications.contactId],
    references: [contacts.id]
  }),
  profile: one(profiles, {
    fields: [communications.profileId],
    references: [profiles.id]
  })
}));
var notesRelations = relations(notes, ({ one }) => ({
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
var documentsRelations = relations(documents, ({ one }) => ({
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
var automationRulesRelations = relations(automationRules, ({ one }) => ({
  profile: one(profiles, {
    fields: [automationRules.profileId],
    references: [profiles.id]
  })
}));
var aiQueriesRelations = relations(aiQueries, ({ one }) => ({
  profile: one(profiles, {
    fields: [aiQueries.profileId],
    references: [profiles.id]
  })
}));
var entitlementsRelations = relations(entitlements, ({ one }) => ({
  user: one(profiles, {
    fields: [entitlements.userId],
    references: [profiles.id]
  })
}));
var insertProfileSchema = createInsertSchema(profiles).pick({
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  avatar: true
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
var updateTaskSchema = insertTaskSchema.partial().omit({
  profileId: true
  // Never allow updating profileId
});
var insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateAppointmentSchema = insertAppointmentSchema.partial().omit({
  profileId: true
  // Never allow updating profileId
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
var insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAiQuerySchema = createInsertSchema(aiQueries).omit({
  id: true,
  createdAt: true
});
var insertEntitlementSchema = createInsertSchema(entitlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var partners = pgTable("partners", {
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
var partnerTiers = pgTable("partner_tiers", {
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
var commissions = pgTable("commissions", {
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
var payouts = pgTable("payouts", {
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
var partnerCustomers = pgTable("partner_customers", {
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
var featurePackages = pgTable("feature_packages", {
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
var partnerMetrics = pgTable("partner_metrics", {
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
var partnersRelations = relations(partners, ({ one, many }) => ({
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
var partnerTiersRelations = relations(partnerTiers, ({ many }) => ({
  partners: many(partners)
}));
var commissionsRelations = relations(commissions, ({ one }) => ({
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
var payoutsRelations = relations(payouts, ({ one, many }) => ({
  partner: one(partners, {
    fields: [payouts.partnerId],
    references: [partners.id]
  }),
  processedBy: one(profiles, {
    fields: [payouts.processedBy],
    references: [profiles.id]
  })
}));
var partnerCustomersRelations = relations(partnerCustomers, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerCustomers.partnerId],
    references: [partners.id]
  }),
  customer: one(contacts, {
    fields: [partnerCustomers.customerId],
    references: [contacts.id]
  })
}));
var partnerMetricsRelations = relations(partnerMetrics, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerMetrics.partnerId],
    references: [partners.id]
  })
}));
var insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPartnerTierSchema = createInsertSchema(partnerTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  paidAt: true
});
var insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true
});
var insertPartnerCustomerSchema = createInsertSchema(partnerCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertFeaturePackageSchema = createInsertSchema(featurePackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPartnerMetricsSchema = createInsertSchema(partnerMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var tenantConfigs = pgTable("tenant_configs", {
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
var whiteLabelPackages = pgTable("white_label_packages", {
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
var userWLSettings = pgTable("user_wl_settings", {
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
var partnerWLConfigs = pgTable("partner_wl_configs", {
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
var insertTenantConfigSchema = createInsertSchema(tenantConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWhiteLabelPackageSchema = createInsertSchema(whiteLabelPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserWLSettingsSchema = createInsertSchema(userWLSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPartnerWLConfigSchema = createInsertSchema(partnerWLConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var userGeneratedImages = pgTable("user_generated_images", {
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
var userGeneratedImagesRelations = relations(userGeneratedImages, ({ one }) => ({
  user: one(profiles, {
    fields: [userGeneratedImages.userId],
    references: [profiles.id]
  })
}));
var insertUserGeneratedImageSchema = createInsertSchema(userGeneratedImages).omit({
  id: true,
  createdAt: true
});
var automations = pgTable("automations", {
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
var insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  runCount: true
});
var features = pgTable("features", {
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
var userFeatures = pgTable("user_features", {
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
var tierFeatures = pgTable("tier_features", {
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
var featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(),
  featureId: integer("feature_id").references(() => features.id).notNull(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  accessCount: integer("access_count").default(1),
  metadata: json("metadata")
  // Additional usage data
});
var insertFeatureSchema = createInsertSchema(features).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserFeatureSchema = createInsertSchema(userFeatures).omit({
  id: true,
  grantedAt: true
});
var insertTierFeatureSchema = createInsertSchema(tierFeatures).omit({
  id: true,
  createdAt: true
});
var insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
  id: true,
  lastAccessed: true
});
var insertUserAiTokensSchema = createInsertSchema(userAiTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
  id: true,
  createdAt: true
});
var usagePlans = pgTable("usage_plans", {
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
var usageEvents = pgTable("usage_events", {
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
var billingCycles = pgTable("billing_cycles", {
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
var userUsageLimits = pgTable("user_usage_limits", {
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
var billingNotifications = pgTable("billing_notifications", {
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
var usagePlansRelations = relations(usagePlans, ({ many }) => ({
  billingCycles: many(billingCycles)
}));
var usageEventsRelations = relations(usageEvents, ({ one }) => ({
  billingCycle: one(billingCycles, {
    fields: [usageEvents.billingCycleId],
    references: [billingCycles.id]
  })
}));
var billingCyclesRelations = relations(billingCycles, ({ one, many }) => ({
  usagePlan: one(usagePlans, {
    fields: [billingCycles.billingPlanId],
    references: [usagePlans.id]
  }),
  usageEvents: many(usageEvents),
  userLimits: many(userUsageLimits)
}));
var userUsageLimitsRelations = relations(userUsageLimits, ({ one }) => ({
  billingCycle: one(billingCycles, {
    fields: [userUsageLimits.billingCycleId],
    references: [billingCycles.id]
  })
}));
var insertUsagePlanSchema = createInsertSchema(usagePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUsageEventSchema = createInsertSchema(usageEvents).omit({
  id: true,
  createdAt: true
});
var insertBillingCycleSchema = createInsertSchema(billingCycles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserUsageLimitSchema = createInsertSchema(userUsageLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBillingNotificationSchema = createInsertSchema(billingNotifications).omit({
  id: true,
  createdAt: true
});
var userCredits = pgTable("user_credits", {
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
var creditTransactions = pgTable("credit_transactions", {
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
var userCreditsRelations = relations(userCredits, ({ one, many }) => ({
  user: one(profiles, {
    fields: [userCredits.userId],
    references: [profiles.id]
  }),
  transactions: many(creditTransactions)
}));
var creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(profiles, {
    fields: [creditTransactions.userId],
    references: [profiles.id]
  }),
  usageEvent: one(usageEvents, {
    fields: [creditTransactions.usageEventId],
    references: [usageEvents.id]
  })
}));
var insertUserCreditsSchema = createInsertSchema(userCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true
});
var aiFeatureDefinitions = pgTable("ai_feature_definitions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  featureKey: text("feature_key").unique().notNull(),
  featureName: text("feature_name").notNull(),
  description: text("description"),
  category: text("category"),
  baseCreditCost: integer("base_credit_cost").default(10),
  minCreditCost: integer("min_credit_cost").default(1),
  maxCreditCost: integer("max_credit_cost").default(1e3),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var aiResellerPricing = pgTable("ai_reseller_pricing", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: uuid("reseller_id").references(() => profiles.id).notNull(),
  featureKey: text("feature_key").notNull(),
  retailCreditCost: integer("retail_credit_cost").notNull(),
  wholesaleCreditCost: integer("wholesale_credit_cost").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  uniqueResellerFeature: {
    name: "unique_reseller_feature",
    columns: [table.resellerId, table.featureKey]
  }
}));
var aiFeatureUsage = pgTable("ai_feature_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  resellerId: uuid("reseller_id").references(() => profiles.id),
  featureKey: text("feature_key").notNull(),
  creditsCharged: integer("credits_charged").notNull(),
  creditsPaidToPlatform: integer("credits_paid_to_platform").notNull(),
  resellerProfitCredits: integer("reseller_profit_credits").default(0),
  context: json("context").default("{}"),
  createdAt: timestamp("created_at").defaultNow()
});
var resellerCredits = pgTable("reseller_credits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: uuid("reseller_id").references(() => profiles.id).notNull().unique(),
  wholesaleCreditsPurchased: integer("wholesale_credits_purchased").default(0),
  wholesaleCreditsUsed: integer("wholesale_credits_used").default(0),
  wholesaleCreditsAvailable: integer("wholesale_credits_available").default(0),
  totalRevenueCents: integer("total_revenue_cents").default(0),
  totalProfitCents: integer("total_profit_cents").default(0),
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
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow()
});
var aiFeatureDefinitionsRelations = relations(aiFeatureDefinitions, ({ many }) => ({
  resellerPricing: many(aiResellerPricing),
  usage: many(aiFeatureUsage)
}));
var aiResellerPricingRelations = relations(aiResellerPricing, ({ one }) => ({
  reseller: one(profiles, {
    fields: [aiResellerPricing.resellerId],
    references: [profiles.id]
  }),
  feature: one(aiFeatureDefinitions, {
    fields: [aiResellerPricing.featureKey],
    references: [aiFeatureDefinitions.featureKey]
  })
}));
var aiFeatureUsageRelations = relations(aiFeatureUsage, ({ one }) => ({
  user: one(profiles, {
    fields: [aiFeatureUsage.userId],
    references: [profiles.id]
  }),
  reseller: one(profiles, {
    fields: [aiFeatureUsage.resellerId],
    references: [profiles.id]
  })
}));
var resellerCreditsRelations = relations(resellerCredits, ({ one, many }) => ({
  reseller: one(profiles, {
    fields: [resellerCredits.resellerId],
    references: [profiles.id]
  }),
  transactions: many(resellerCreditTransactions)
}));
var resellerCreditTransactionsRelations = relations(resellerCreditTransactions, ({ one }) => ({
  reseller: one(profiles, {
    fields: [resellerCreditTransactions.resellerId],
    references: [profiles.id]
  }),
  endUser: one(profiles, {
    fields: [resellerCreditTransactions.endUserId],
    references: [profiles.id]
  })
}));
var insertAIFeatureDefinitionSchema = createInsertSchema(aiFeatureDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAIResellerPricingSchema = createInsertSchema(aiResellerPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAIFeatureUsageSchema = createInsertSchema(aiFeatureUsage).omit({
  id: true,
  createdAt: true
});
var insertResellerCreditsSchema = createInsertSchema(resellerCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertResellerCreditTransactionSchema = createInsertSchema(resellerCreditTransactions).omit({
  id: true,
  createdAt: true
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/entitlements-utils.ts
import { eq } from "drizzle-orm";
var ZONE = "America/New_York";
function startOfNextMonthUTC(nowISO) {
  const dt = DateTime.fromISO(nowISO, { zone: ZONE }).startOf("month").plus({ months: 1 });
  return dt.toUTC().toISO();
}
function startOfNextYearUTC(nowISO) {
  const dt = DateTime.fromISO(nowISO, { zone: ZONE }).startOf("year").plus({ years: 1 });
  return dt.toUTC().toISO();
}
async function upsertEntitlement(params) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existing = await db.select().from(entitlements).where(eq(entitlements.userId, params.userId)).limit(1);
  if (existing.length > 0) {
    const [updated] = await db.update(entitlements).set({
      status: params.status,
      productType: params.productType,
      revokeAt: params.revokeAt ? new Date(params.revokeAt) : null,
      lastInvoiceStatus: params.lastInvoiceStatus,
      delinquencyCount: params.delinquencyCount ?? existing[0].delinquencyCount,
      stripeSubscriptionId: params.stripeSubscriptionId ?? existing[0].stripeSubscriptionId,
      stripeCustomerId: params.stripeCustomerId ?? existing[0].stripeCustomerId,
      zaxaaSubscriptionId: params.zaxaaSubscriptionId ?? existing[0].zaxaaSubscriptionId,
      planName: params.planName ?? existing[0].planName,
      planAmount: params.planAmount ?? existing[0].planAmount,
      currency: params.currency ?? existing[0].currency,
      updatedAt: new Date(now)
    }).where(eq(entitlements.userId, params.userId)).returning();
    return updated;
  } else {
    const [created] = await db.insert(entitlements).values({
      userId: params.userId,
      status: params.status,
      productType: params.productType,
      revokeAt: params.revokeAt ? new Date(params.revokeAt) : null,
      lastInvoiceStatus: params.lastInvoiceStatus,
      delinquencyCount: params.delinquencyCount ?? 0,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripeCustomerId: params.stripeCustomerId,
      zaxaaSubscriptionId: params.zaxaaSubscriptionId,
      planName: params.planName,
      planAmount: params.planAmount,
      currency: params.currency ?? "USD"
    }).returning();
    return created;
  }
}
function calculateRevokeDate(productType, nowISO) {
  switch (productType) {
    case "lifetime":
      return null;
    // never revoke
    case "monthly":
      return startOfNextMonthUTC(nowISO);
    // revoke at 12:00am ET next month
    case "yearly":
      return startOfNextYearUTC(nowISO);
    // revoke at 12:00am ET next year
    case "payment_plan":
      return startOfNextMonthUTC(nowISO);
    // default rolling window; only enforced on miss
    default:
      return null;
  }
}
async function handleSuccessfulPurchase(userId, productType, metadata = {}) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const revokeAt = calculateRevokeDate(productType, now);
  return await upsertEntitlement({
    userId,
    status: "active",
    productType,
    revokeAt,
    lastInvoiceStatus: "paid",
    delinquencyCount: 0,
    ...metadata
  });
}
async function getUserEntitlement(userId) {
  const result = await db.select().from(entitlements).where(eq(entitlements.userId, userId)).limit(1);
  return result[0] || null;
}
function isUserActive(entitlement) {
  if (!entitlement) return false;
  const now = Date.now();
  const isActive = entitlement.status === "active" && (!entitlement.revokeAt || new Date(entitlement.revokeAt).getTime() > now);
  return isActive;
}

// server/entitlements/index.ts
import { pgTable as pgTable2, text as text2, serial as serial2, integer as integer2, timestamp as timestamp2, decimal as decimal2, uuid as uuid2 } from "drizzle-orm/pg-core";
var entitlements2 = pgTable2("entitlements", {
  id: serial2("id").primaryKey(),
  userId: uuid2("user_id").notNull(),
  status: text2("status").notNull().default("active"),
  productType: text2("product_type"),
  revokeAt: timestamp2("revoke_at", { withTimezone: true }),
  lastInvoiceStatus: text2("last_invoice_status"),
  delinquencyCount: integer2("delinquency_count").default(0),
  stripeSubscriptionId: text2("stripe_subscription_id"),
  stripeCustomerId: text2("stripe_customer_id"),
  zaxaaSubscriptionId: text2("zaxaa_subscription_id"),
  planName: text2("plan_name"),
  planAmount: decimal2("plan_amount", { precision: 10, scale: 2 }),
  currency: text2("currency").default("USD"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
var handler = async (event, context) => {
  const { httpMethod, path, body } = event;
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
    if (pathParts.length >= 2 && pathParts[0] === "entitlements" && pathParts[1] === "check" && httpMethod === "GET") {
      const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
      let userId = null;
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const tokenParts = token.split(".");
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
            userId = payload.sub;
          }
        } catch (e) {
          console.error("Failed to parse JWT token:", e);
        }
      }
      if (!userId && process.env.NODE_ENV === "development") {
        userId = "dev-user-12345";
      }
      if (!userId) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized - Valid JWT token required" }) };
      }
      const entitlement = await getUserEntitlement(userId);
      const isActive = isUserActive(entitlement);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          entitlement,
          isActive,
          hasAccess: isActive
        })
      };
    }
    if (pathParts.length >= 2 && pathParts[0] === "entitlements" && pathParts[1] === "list" && httpMethod === "GET") {
      const entitlementsList = await db.select().from(entitlements2).limit(100);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          entitlements: entitlementsList || [],
          total: entitlementsList?.length || 0
        })
      };
    }
    if (pathParts.length >= 2 && pathParts[0] === "entitlements" && pathParts[1] === "create" && httpMethod === "POST") {
      const { userId, productType, planName, planAmount, currency } = JSON.parse(body);
      if (!userId || !productType || !planName) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
      }
      const entitlement = await handleSuccessfulPurchase(
        userId,
        productType,
        {
          planName,
          planAmount: planAmount?.toString(),
          currency: currency || "USD"
        }
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, entitlement })
      };
    }
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Entitlements endpoint not found" })
    };
  } catch (error) {
    console.error("Entitlements function error:", error);
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
