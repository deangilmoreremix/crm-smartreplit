export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
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
  // AI contact enhancements
  score: decimal('score', { precision: 3, scale: 2 }).default('0.50'), // AI lead score (0.00-1.00)
  healthScore: integer('health_score'), // AI-calculated contact health (0-100)
  enrichmentData: jsonb('enrichment_data'), // AI enrichment data
  lastEnrichedAt: timestamp('last_enriched_at', { withTimezone: true }), // Last AI enrichment timestamp
  // LinkedIn integration
  linkedinUrl: text('linkedin_url'),
  linkedinData: jsonb('linkedin_data'), // Full LinkedIn profile data
  linkedinSyncedAt: timestamp('linkedin_synced_at'), // Last sync timestamp
  // Mailchimp integration
  mailchimpId: text('mailchimp_id'), // Mailchimp subscriber ID
  mailchimpEmailId: text('mailchimp_email_id'), // Mailchimp email ID
  mailchimpTags: text('mailchimp_tags').array(), // Tags applied to subscriber
  mailchimpStatus: text('mailchimp_status'), // subscribed, unsubscribed, cleaned, pending
  mailchimpMergeFields: jsonb('mailchimp_merge_fields'), // Merge fields (FNAME, LNAME, etc.)
  mailchimpStats: jsonb('mailchimp_stats'), // Open/click stats
  mailchimpSyncedAt: timestamp('mailchimp_synced_at'), // Last sync timestamp
  // Custom fields
  customFields: json('custom_fields'), // Custom field values (EAV pattern)
  position: integer('position').default(0), // For drag-drop ordering in Kanban
  idempotencyKey: varchar('idempotency_key', { length: 64 }), // For duplicate prevention
  version: integer('version').default(1), // Optimistic locking version
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  profileId: uuid('profile_id').references(() => profiles.id),
});