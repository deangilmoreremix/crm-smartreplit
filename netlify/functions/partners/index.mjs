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
  aiQueries: () => aiQueries,
  aiQueriesRelations: () => aiQueriesRelations,
  appointments: () => appointments,
  appointmentsRelations: () => appointmentsRelations,
  automationRules: () => automationRules,
  automationRulesRelations: () => automationRulesRelations,
  automations: () => automations,
  commissions: () => commissions,
  commissionsRelations: () => commissionsRelations,
  communications: () => communications,
  communicationsRelations: () => communicationsRelations,
  contacts: () => contacts,
  contactsRelations: () => contactsRelations,
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
  insertCommissionSchema: () => insertCommissionSchema,
  insertCommunicationSchema: () => insertCommunicationSchema,
  insertContactSchema: () => insertContactSchema,
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
  insertUserAiTokensSchema: () => insertUserAiTokensSchema,
  insertUserFeatureSchema: () => insertUserFeatureSchema,
  insertUserGeneratedImageSchema: () => insertUserGeneratedImageSchema,
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
  userAiTokens: () => userAiTokens,
  userFeatures: () => userFeatures,
  userGeneratedImages: () => userGeneratedImages,
  userGeneratedImagesRelations: () => userGeneratedImagesRelations,
  userRoles: () => userRoles,
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

// server/storage.ts
import { eq, desc, sql as sql2, and } from "drizzle-orm";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
var DatabaseStorage = class {
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
    const totalCommissions = partners2.reduce((sum, p) => sum + parseFloat(p.totalCommissions || "0"), 0);
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
    console.log(`Initialized ${this.partnerTiers.size} partner tiers, ${this.partners.size} partners, ${this.featurePackages.size} feature packages`);
  }
  async getProfile(id) {
    return this.profiles.get(id);
  }
  async getProfileByUsername(username) {
    return Array.from(this.profiles.values()).find(
      (profile) => profile.username === username
    );
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
    return Array.from(this.partnerTiers.values()).sort((a, b) => (a.priority || 0) - (b.priority || 0));
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
    const totalCommissions = partners2.reduce((sum, p) => sum + parseFloat(p.totalCommissions || "0"), 0);
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
