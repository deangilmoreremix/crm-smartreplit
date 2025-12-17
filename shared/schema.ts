import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// User role enum
export const userRoles = ['super_admin', 'wl_user', 'regular_user'] as const;
export type UserRole = typeof userRoles[number];

// Product tier enum - 7 tiers with distinct feature access
export const productTiers = [
  'super_admin',           // All features including admin
  'whitelabel',            // All features including whitelabel (excluding admin)
  'smartcrm_bundle',       // All tools except whitelabel
  'smartcrm',              // Dashboard, Contacts, Pipeline, Calendar
  'sales_maximizer',       // AI Goals and AI Tools
  'ai_boost_unlimited',    // Unlimited AI credits
  'ai_communication'       // Video Email, SMS, VoIP, Invoicing, Lead Automation, Circle Prospecting
] as const;
export type ProductTier = typeof productTiers[number];

// Profiles table (links to Supabase auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("regular_user"),
  productTier: text("product_tier"), // Product tier for access control - null until user purchases a tier
  avatar: text("avatar_url"),
  appContext: text("app_context").default("smartcrm"), // Track which app the user came from
  emailTemplateSet: text("email_template_set").default("smartcrm"), // Control which email templates to use
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts table
export const contacts = pgTable("contacts", {
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
  profileId: uuid("profile_id").references(() => profiles.id),
});

// Deals table
export const deals = pgTable("deals", {
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
  profileId: uuid("profile_id").references(() => profiles.id),
});

// Tasks table
export const tasks = pgTable("tasks", {
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
  profileId: uuid("profile_id").references(() => profiles.id),
});

// Appointments table
export const appointments = pgTable("appointments", {
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
  profileId: uuid("profile_id").references(() => profiles.id),
});

// Communications table (emails, calls, etc.)
export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // email, call, sms, meeting
  subject: text("subject"),
  content: text("content"),
  direction: text("direction").notNull(), // inbound, outbound
  status: text("status").default("sent"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  contactId: integer("contact_id").references(() => contacts.id),
  profileId: uuid("profile_id").references(() => profiles.id),
});

// Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  type: text("type").default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  contactId: integer("contact_id").references(() => contacts.id),
  dealId: integer("deal_id").references(() => deals.id),
  profileId: uuid("profile_id").references(() => profiles.id),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  contactId: integer("contact_id").references(() => contacts.id),
  dealId: integer("deal_id").references(() => deals.id),
  profileId: uuid("profile_id").references(() => profiles.id),
});

// Lead automation rules table
export const automationRules = pgTable("automation_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: json("trigger"), // JSON object defining trigger conditions
  actions: json("actions"), // JSON array of actions to perform
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id),
});

// AI query history table
export const aiQueries = pgTable("ai_queries", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  response: text("response"),
  type: text("type").notNull(), // natural_language, sentiment, sales_pitch, email_draft
  model: text("model"),
  createdAt: timestamp("created_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id),
});

// User AI Tokens table - tracks token balance for AI usage
export const userAiTokens = pgTable("user_ai_tokens", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id),
  totalTokens: integer("total_tokens").default(0), // Total tokens purchased
  usedTokens: integer("used_tokens").default(0), // Tokens used
  availableTokens: integer("available_tokens").default(0), // totalTokens - usedTokens
  lastPurchaseAt: timestamp("last_purchase_at"),
  lastResetAt: timestamp("last_reset_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional: tokens can expire
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Token Transactions table - tracks all token purchases and usage
export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id),
  type: text("type").notNull(), // purchase, usage, refund, admin_grant
  amount: integer("amount").notNull(), // Positive for purchases/grants, negative for usage
  description: text("description"), // "Purchased 1000 tokens", "GPT-5 query", etc.
  balanceBefore: integer("balance_before"),
  balanceAfter: integer("balance_after"),
  stripeTransactionId: text("stripe_transaction_id"), // Link to Stripe if purchased
  createdAt: timestamp("created_at").defaultNow(),
});

// Entitlements table for subscription and payment management
export const entitlements = pgTable("entitlements", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id), // Link to Supabase user
  status: text("status").notNull().default("active"), // active, past_due, canceled, refunded, inactive
  productType: text("product_type"), // lifetime, monthly, yearly, payment_plan
  revokeAt: timestamp("revoke_at", { withTimezone: true }), // When access should flip off (UTC)
  lastInvoiceStatus: text("last_invoice_status"), // paid, open, uncollectible, void, failed
  delinquencyCount: integer("delinquency_count").default(0), // For payment plan misses
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  zaxaaSubscriptionId: text("zaxaa_subscription_id"),
  planName: text("plan_name"),
  planAmount: decimal("plan_amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relations
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  contacts: many(contacts),
  deals: many(deals),
  tasks: many(tasks),
  appointments: many(appointments),
  communications: many(communications),
  notes: many(notes),
  documents: many(documents),
  automationRules: many(automationRules),
  aiQueries: many(aiQueries),
  generatedImages: many(userGeneratedImages), // Add generated images relation
  aiTokens: one(userAiTokens, {
    fields: [profiles.id],
    references: [userAiTokens.profileId],
  }),
  tokenTransactions: many(tokenTransactions),
  entitlement: one(entitlements, {
    fields: [profiles.id],
    references: [entitlements.userId],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [contacts.profileId],
    references: [profiles.id],
  }),
  deals: many(deals),
  tasks: many(tasks),
  appointments: many(appointments),
  communications: many(communications),
  notes: many(notes),
  documents: many(documents),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  profile: one(profiles, {
    fields: [deals.profileId],
    references: [profiles.id],
  }),
  tasks: many(tasks),
  notes: many(notes),
  documents: many(documents),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id],
  }),
  deal: one(deals, {
    fields: [tasks.dealId],
    references: [deals.id],
  }),
  profile: one(profiles, {
    fields: [tasks.profileId],
    references: [profiles.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  contact: one(contacts, {
    fields: [appointments.contactId],
    references: [contacts.id],
  }),
  profile: one(profiles, {
    fields: [appointments.profileId],
    references: [profiles.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  contact: one(contacts, {
    fields: [communications.contactId],
    references: [contacts.id],
  }),
  profile: one(profiles, {
    fields: [communications.profileId],
    references: [profiles.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  contact: one(contacts, {
    fields: [notes.contactId],
    references: [contacts.id],
  }),
  deal: one(deals, {
    fields: [notes.dealId],
    references: [deals.id],
  }),
  profile: one(profiles, {
    fields: [notes.profileId],
    references: [profiles.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  contact: one(contacts, {
    fields: [documents.contactId],
    references: [contacts.id],
  }),
  deal: one(deals, {
    fields: [documents.dealId],
    references: [deals.id],
  }),
  profile: one(profiles, {
    fields: [documents.profileId],
    references: [profiles.id],
  }),
}));

export const automationRulesRelations = relations(automationRules, ({ one }) => ({
  profile: one(profiles, {
    fields: [automationRules.profileId],
    references: [profiles.id],
  }),
}));

export const aiQueriesRelations = relations(aiQueries, ({ one }) => ({
  profile: one(profiles, {
    fields: [aiQueries.profileId],
    references: [profiles.id],
  }),
}));

export const entitlementsRelations = relations(entitlements, ({ one }) => ({
  user: one(profiles, {
    fields: [entitlements.userId],
    references: [profiles.id],
  }),
}));

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).pick({
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  avatar: true,
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
  completedAt: true,
});

export const updateTaskSchema = insertTaskSchema.partial().omit({
  profileId: true, // Never allow updating profileId
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAppointmentSchema = insertAppointmentSchema.partial().omit({
  profileId: true, // Never allow updating profileId
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNoteSchema = insertNoteSchema.partial().omit({
  profileId: true, // Never allow updating profileId
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiQuerySchema = createInsertSchema(aiQueries).omit({
  id: true,
  createdAt: true,
});

export const insertEntitlementSchema = createInsertSchema(entitlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type AiQuery = typeof aiQueries.$inferSelect;
export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
export type Entitlement = typeof entitlements.$inferSelect;
export type InsertEntitlement = z.infer<typeof insertEntitlementSchema>;

// Partner-related tables for Revenue Sharing & Partner Management

// Partners table
export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"), // Made nullable to fix the constraint error
  contactEmail: text("contact_email").notNull().unique(),
  phone: text("phone"),
  website: text("website"),
  businessType: text("business_type"),
  status: text("status").default("pending"), // pending, active, suspended, terminated
  tier: text("tier").default("bronze"), // bronze, silver, gold, platinum
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("15.00"),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissions: decimal("total_commissions", { precision: 12, scale: 2 }).default("0.00"),
  customerCount: integer("customer_count").default(0),
  brandingConfig: json("branding_config"), // Logo, colors, custom domain
  contractDetails: json("contract_details"), // Terms, conditions, etc.
  payoutSettings: json("payout_settings"), // Payment method, schedule, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id), // Partner owner
});

// Partner Tiers configuration
export const partnerTiers = pgTable("partner_tiers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // Bronze Partner, Silver Partner, etc.
  slug: text("slug").notNull().unique(), // bronze, silver, gold, platinum
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  minimumRevenue: decimal("minimum_revenue", { precision: 10, scale: 2 }).default("0.00"),
  features: text("features").array(), // Array of feature names
  benefits: text("benefits").array(), // Array of benefit descriptions
  color: text("color"), // UI color scheme
  priority: integer("priority").default(1), // For ordering
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Commission tracking
export const commissions = pgTable("commissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id),
  customerId: integer("customer_id").references(() => contacts.id),
  type: text("type").notNull(), // one_time, recurring, bonus
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }), // Commission rate used
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }), // Original amount before commission
  status: text("status").default("pending"), // pending, approved, paid, cancelled
  description: text("description"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  profileId: uuid("profile_id").references(() => profiles.id), // System user who created
});

// Payout management
export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  commissionsCount: integer("commissions_count").default(0),
  paymentMethod: text("payment_method"), // stripe, paypal, bank_transfer, check
  paymentDetails: json("payment_details"), // Payment-specific information
  status: text("status").default("pending"), // pending, processing, completed, failed, cancelled
  scheduledDate: timestamp("scheduled_date"),
  processedAt: timestamp("processed_at"),
  failureReason: text("failure_reason"),
  externalTransactionId: text("external_transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  processedBy: uuid("processed_by").references(() => profiles.id),
});

// Partner customers - tracks customer attribution
export const partnerCustomers = pgTable("partner_customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull(),
  customerId: integer("customer_id").references(() => contacts.id).notNull(),
  referralCode: text("referral_code"),
  acquisitionDate: timestamp("acquisition_date").defaultNow(),
  lifetime_value: decimal("lifetime_value", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").default("active"), // active, churned, suspended
  source: text("source"), // How customer was acquired
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feature packages for partner tiers
export const featurePackages = pgTable("feature_packages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  features: text("features").array(),
  price: decimal("price", { precision: 8, scale: 2 }),
  billingCycle: text("billing_cycle"), // monthly, yearly, one_time
  isActive: boolean("is_active").default(true),
  targetTier: text("target_tier"), // Which partner tier this is for
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partner performance metrics
export const partnerMetrics = pgTable("partner_metrics", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  partnerMonthYearIdx: sql`CREATE UNIQUE INDEX IF NOT EXISTS partner_month_year_idx ON ${table} (partner_id, month, year)`,
}));

// Relations for partner tables
export const partnersRelations = relations(partners, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [partners.profileId],
    references: [profiles.id],
  }),
  tier: one(partnerTiers, {
    fields: [partners.tier],
    references: [partnerTiers.slug],
  }),
  commissions: many(commissions),
  payouts: many(payouts),
  customers: many(partnerCustomers),
  metrics: many(partnerMetrics),
}));

export const partnerTiersRelations = relations(partnerTiers, ({ many }) => ({
  partners: many(partners),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  partner: one(partners, {
    fields: [commissions.partnerId],
    references: [partners.id],
  }),
  deal: one(deals, {
    fields: [commissions.dealId],
    references: [deals.id],
  }),
  customer: one(contacts, {
    fields: [commissions.customerId],
    references: [contacts.id],
  }),
  profile: one(profiles, {
    fields: [commissions.profileId],
    references: [profiles.id],
  }),
}));

export const payoutsRelations = relations(payouts, ({ one, many }) => ({
  partner: one(partners, {
    fields: [payouts.partnerId],
    references: [partners.id],
  }),
  processedBy: one(profiles, {
    fields: [payouts.processedBy],
    references: [profiles.id],
  }),
}));

export const partnerCustomersRelations = relations(partnerCustomers, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerCustomers.partnerId],
    references: [partners.id],
  }),
  customer: one(contacts, {
    fields: [partnerCustomers.customerId],
    references: [contacts.id],
  }),
}));

export const partnerMetricsRelations = relations(partnerMetrics, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerMetrics.partnerId],
    references: [partners.id],
  }),
}));

// Insert schemas for partner tables
export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerTierSchema = createInsertSchema(partnerTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  paidAt: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
});

export const insertPartnerCustomerSchema = createInsertSchema(partnerCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeaturePackageSchema = createInsertSchema(featurePackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerMetricsSchema = createInsertSchema(partnerMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// White Label Configuration Tables

// Tenant configurations (for multi-tenancy and white-labeling)
export const tenantConfigs = pgTable("tenant_configs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text("tenant_id").notNull().unique(), // Unique identifier for tenant
  companyName: text("company_name"),
  logo: text("logo"), // Logo URL
  favicon: text("favicon"), // Favicon URL
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
  features: json("features"), // Feature toggles and settings
  brandingConfig: json("branding_config"), // Complete branding configuration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id), // Tenant owner
});

// White Label Package Configurations
export const whiteLabelPackages = pgTable("white_label_packages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  features: text("features").array(), // Array of enabled features
  pricing: json("pricing"), // Pricing configuration
  customizations: json("customizations"), // Available customization options
  restrictions: json("restrictions"), // Feature restrictions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User White Label Settings (per user customizations)
export const userWLSettings = pgTable("user_wl_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  packageId: uuid("package_id").references(() => whiteLabelPackages.id),
  customBranding: json("custom_branding"), // User's custom branding settings
  enabledFeatures: text("enabled_features").array(), // User's enabled WL features
  preferences: json("preferences"), // User interface preferences
  settings: json("settings"), // Additional settings storage
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partner White Label Configurations (extends partners table)
export const partnerWLConfigs = pgTable("partner_wl_configs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid("partner_id").references(() => partners.id).notNull().unique(),
  brandingActive: boolean("branding_active").default(false),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  customDomain: text("custom_domain"),
  emailBranding: json("email_branding"), // Email template customizations
  uiCustomizations: json("ui_customizations"), // UI theme customizations
  featureOverrides: json("feature_overrides"), // Feature availability overrides
  apiSettings: json("api_settings"), // API configuration for partner
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// White Label insert schemas
export const insertTenantConfigSchema = createInsertSchema(tenantConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhiteLabelPackageSchema = createInsertSchema(whiteLabelPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserWLSettingsSchema = createInsertSchema(userWLSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerWLConfigSchema = createInsertSchema(partnerWLConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Backward compatibility - keep User types but make them reference Profile
export type User = Profile;
export type InsertUser = InsertProfile;

// User Generated Images table for AI image storage
export const userGeneratedImages = pgTable("user_generated_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  publicUrl: text("public_url").notNull(),
  promptText: text("prompt_text"),
  feature: text("feature"), // SmartCRM feature: 'Enhanced Contacts', 'Pipeline Deals', etc.
  format: text("format"), // Format: 'Poster', 'Flyer', 'Product Mock', etc.
  aspectRatio: text("aspect_ratio"), // Aspect ratio: '1:1', '16:9', etc.
  createdAt: timestamp("created_at").defaultNow(),
  metadata: json("metadata"), // Additional metadata like seeds, variants, etc.
});

// Relations for user generated images
export const userGeneratedImagesRelations = relations(userGeneratedImages, ({ one }) => ({
  user: one(profiles, {
    fields: [userGeneratedImages.userId],
    references: [profiles.id],
  }),
}));

// Insert schema for user generated images
export const insertUserGeneratedImageSchema = createInsertSchema(userGeneratedImages).omit({
  id: true,
  createdAt: true,
});

// White Label types
export type TenantConfig = typeof tenantConfigs.$inferSelect;
export type InsertTenantConfig = z.infer<typeof insertTenantConfigSchema>;
export type WhiteLabelPackage = typeof whiteLabelPackages.$inferSelect;
export type InsertWhiteLabelPackage = z.infer<typeof insertWhiteLabelPackageSchema>;
export type UserWLSettings = typeof userWLSettings.$inferSelect;
export type InsertUserWLSettings = z.infer<typeof insertUserWLSettingsSchema>;
export type PartnerWLConfig = typeof partnerWLConfigs.$inferSelect;
export type InsertPartnerWLConfig = z.infer<typeof insertPartnerWLConfigSchema>;

// User Generated Images types
export type UserGeneratedImage = typeof userGeneratedImages.$inferSelect;
export type InsertUserGeneratedImage = z.infer<typeof insertUserGeneratedImageSchema>;

// Automations table
export const automations = pgTable("automations", {
  id: serial("id").primaryKey(),
  automationId: text("automation_id").notNull().unique(), // e.g., 'email-followup', 'sms-reminder'
  enabled: boolean("enabled").default(false),
  schedule: text("schedule"), // cron expression or schedule config (JSON string)
  config: json("config"), // Automation-specific configuration
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  runCount: integer("run_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileId: uuid("profile_id").references(() => profiles.id),
});

// Automation schema
export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  runCount: true,
});

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;

// Features table - stores all available features in the system
export const features: any = pgTable("features", {
  id: serial("id").primaryKey(),
  featureKey: text("feature_key").notNull().unique(), // e.g., 'ai_goals', 'phone_system', 'video_email'
  name: text("name").notNull(), // Display name
  description: text("description"),
  category: text("category").notNull(), // 'core_crm', 'communication', 'ai', 'business_tools', 'advanced', 'admin', 'remote_apps', 'white_label'
  parentId: integer("parent_id").references(() => (features as any).id), // For hierarchical features
  deliveryType: text("delivery_type"), // 'native', 'module_federation', 'iframe'
  isEnabled: boolean("is_enabled").default(true), // Global feature toggle
  dependsOn: text("depends_on").array(), // Array of feature keys this feature depends on
  metadata: json("metadata"), // Additional config like limits, options, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Features table - user-specific feature overrides
export const userFeatures = pgTable("user_features", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(),
  featureId: integer("feature_id").references(() => features.id).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration for temporary access
  grantedBy: uuid("granted_by").references(() => profiles.id), // Admin who granted access
  grantedAt: timestamp("granted_at").defaultNow(),
  metadata: json("metadata"), // Feature-specific metadata like usage limits
}, (table) => {
  return {
    // Unique constraint: one record per user per feature
    uniqueUserFeature: {
      name: 'unique_user_feature',
      columns: [table.profileId, table.featureId]
    }
  };
});

// Tier Features table - defines which features are included in each product tier
export const tierFeatures = pgTable("tier_features", {
  id: serial("id").primaryKey(),
  productTier: text("product_tier").notNull(), // 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited'
  featureId: integer("feature_id").references(() => features.id).notNull(),
  includedByDefault: boolean("included_by_default").default(true),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Unique constraint: one record per tier per feature
    uniqueTierFeature: {
      name: 'unique_tier_feature',
      columns: [table.productTier, table.featureId]
    }
  };
});

// Feature Usage table - tracks feature usage analytics
export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).notNull(),
  featureId: integer("feature_id").references(() => features.id).notNull(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  accessCount: integer("access_count").default(1),
  metadata: json("metadata"), // Additional usage data
});

// Insert schemas for feature tables
export const insertFeatureSchema = createInsertSchema(features).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserFeatureSchema = createInsertSchema(userFeatures).omit({
  id: true,
  grantedAt: true,
});

export const insertTierFeatureSchema = createInsertSchema(tierFeatures).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
  id: true,
  lastAccessed: true,
});

// Insert schemas for token tables
export const insertUserAiTokensSchema = createInsertSchema(userAiTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
  id: true,
  createdAt: true,
});

// Types for feature tables
export type Feature = typeof features.$inferSelect;
export type UserAiTokens = typeof userAiTokens.$inferSelect;
export type InsertUserAiTokens = z.infer<typeof insertUserAiTokensSchema>;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type UserFeature = typeof userFeatures.$inferSelect;
export type InsertUserFeature = z.infer<typeof insertUserFeatureSchema>;
export type TierFeature = typeof tierFeatures.$inferSelect;
export type InsertTierFeature = z.infer<typeof insertTierFeatureSchema>;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;

// Usage Billing System Tables

// Usage Plans table - defines pricing plans for different features
export const usagePlans = pgTable("usage_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  planName: text("plan_name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  billingType: text("billing_type").notNull(), // 'subscription', 'pay_per_use', 'hybrid'
  basePriceCents: integer("base_price_cents").default(0),
  currency: text("currency").default("USD"),
  billingInterval: text("billing_interval"), // 'month', 'year', null
  isActive: boolean("is_active").default(true),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  features: json("features").default("{}"),
  limits: json("limits").default("{}"),
  pricingTiers: json("pricing_tiers").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage Events table - tracks individual usage events
export const usageEvents = pgTable("usage_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  tenantId: uuid("tenant_id"),
  eventType: text("event_type").notNull(), // 'api_call', 'ai_generation', 'storage', 'bandwidth', etc.
  featureName: text("feature_name").notNull(), // 'openai_api', 'content_generation', 'storage_gb', etc.
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull().default("1"),
  unit: text("unit").notNull(), // 'requests', 'tokens', 'gb', 'minutes', etc.
  costCents: integer("cost_cents").default(0),
  metadata: json("metadata").default("{}"),
  billingCycleId: uuid("billing_cycle_id"),
  stripeSubscriptionItemId: text("stripe_subscription_item_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Billing Cycles table - tracks billing periods
export const billingCycles = pgTable("billing_cycles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  tenantId: uuid("tenant_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  billingPlanId: uuid("billing_plan_id").references(() => usagePlans.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'failed', 'cancelled'
  totalUsage: json("total_usage").default("{}"),
  totalCostCents: integer("total_cost_cents").default(0),
  stripeInvoiceId: text("stripe_invoice_id"),
  invoicePdfUrl: text("invoice_pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Usage Limits table - tracks user quotas and limits
export const userUsageLimits = pgTable("user_usage_limits", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserFeature: {
    name: 'unique_user_feature_limit',
    columns: [table.userId, table.featureName, table.billingCycleId]
  }
}));

// Billing Notifications table - tracks billing alerts and notifications
export const billingNotifications = pgTable("billing_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  tenantId: uuid("tenant_id"),
  notificationType: text("notification_type").notNull(), // 'limit_warning', 'limit_exceeded', 'billing_cycle_end', 'payment_failed', 'subscription_cancelled'
  title: text("title").notNull(),
  message: text("message").notNull(),
  metadata: json("metadata").default("{}"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for usage billing tables
export const usagePlansRelations = relations(usagePlans, ({ many }) => ({
  billingCycles: many(billingCycles),
}));

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
  billingCycle: one(billingCycles, {
    fields: [usageEvents.billingCycleId],
    references: [billingCycles.id],
  }),
}));

export const billingCyclesRelations = relations(billingCycles, ({ one, many }) => ({
  usagePlan: one(usagePlans, {
    fields: [billingCycles.billingPlanId],
    references: [usagePlans.id],
  }),
  usageEvents: many(usageEvents),
  userLimits: many(userUsageLimits),
}));

export const userUsageLimitsRelations = relations(userUsageLimits, ({ one }) => ({
  billingCycle: one(billingCycles, {
    fields: [userUsageLimits.billingCycleId],
    references: [billingCycles.id],
  }),
}));

// Insert schemas for usage billing tables
export const insertUsagePlanSchema = createInsertSchema(usagePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageEventSchema = createInsertSchema(usageEvents).omit({
  id: true,
  createdAt: true,
});

export const insertBillingCycleSchema = createInsertSchema(billingCycles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserUsageLimitSchema = createInsertSchema(userUsageLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingNotificationSchema = createInsertSchema(billingNotifications).omit({
  id: true,
  createdAt: true,
});

// User Credits table - tracks credit balances for credit-based billing
export const userCredits = pgTable("user_credits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  tenantId: uuid("tenant_id"),
  totalCredits: decimal("total_credits", { precision: 12, scale: 4 }).default("0"),
  usedCredits: decimal("used_credits", { precision: 12, scale: 4 }).default("0"),
  availableCredits: decimal("available_credits", { precision: 12, scale: 4 }).default("0"),
  lastPurchaseAt: timestamp("last_purchase_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit Transactions table - tracks credit purchases and usage
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  tenantId: uuid("tenant_id"),
  type: text("type").notNull(), // 'purchase', 'usage', 'refund', 'admin_grant'
  amount: decimal("amount", { precision: 12, scale: 4 }).notNull(), // Positive for purchases/grants, negative for usage
  description: text("description"),
  balanceBefore: decimal("balance_before", { precision: 12, scale: 4 }),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 4 }),
  stripeTransactionId: text("stripe_transaction_id"), // Link to Stripe if purchased
  usageEventId: uuid("usage_event_id"), // Link to usage event if deducted for usage
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for credit tables
export const userCreditsRelations = relations(userCredits, ({ one, many }) => ({
  user: one(profiles, {
    fields: [userCredits.userId],
    references: [profiles.id],
  }),
  transactions: many(creditTransactions),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(profiles, {
    fields: [creditTransactions.userId],
    references: [profiles.id],
  }),
  usageEvent: one(usageEvents, {
    fields: [creditTransactions.usageEventId],
    references: [usageEvents.id],
  }),
}));

// Insert schemas for credit tables
export const insertUserCreditsSchema = createInsertSchema(userCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

// Types for credit tables
export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

// Types for usage billing tables
export type UsagePlan = typeof usagePlans.$inferSelect;
export type InsertUsagePlan = z.infer<typeof insertUsagePlanSchema>;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type BillingCycle = typeof billingCycles.$inferSelect;
export type InsertBillingCycle = z.infer<typeof insertBillingCycleSchema>;
export type UserUsageLimit = typeof userUsageLimits.$inferSelect;
export type InsertUserUsageLimit = z.infer<typeof insertUserUsageLimitSchema>;
export type BillingNotification = typeof billingNotifications.$inferSelect;
export type InsertBillingNotification = z.infer<typeof insertBillingNotificationSchema>;

// Export partner types
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type PartnerTier = typeof partnerTiers.$inferSelect;
export type InsertPartnerTier = z.infer<typeof insertPartnerTierSchema>;
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type PartnerCustomer = typeof partnerCustomers.$inferSelect;
export type InsertPartnerCustomer = z.infer<typeof insertPartnerCustomerSchema>;
export type FeaturePackage = typeof featurePackages.$inferSelect;
export type InsertFeaturePackage = z.infer<typeof insertFeaturePackageSchema>;
export type PartnerMetrics = typeof partnerMetrics.$inferSelect;
export type InsertPartnerMetrics = z.infer<typeof insertPartnerMetricsSchema>;