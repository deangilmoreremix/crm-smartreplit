CREATE TABLE "ai_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"response" text,
	"type" text NOT NULL,
	"model" text,
	"created_at" timestamp DEFAULT now(),
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location" text,
	"type" text DEFAULT 'meeting',
	"status" text DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"contact_id" integer,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger" json,
	"actions" json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_id" text NOT NULL,
	"enabled" boolean DEFAULT false,
	"schedule" text,
	"config" json,
	"last_run" timestamp,
	"next_run" timestamp,
	"run_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid,
	CONSTRAINT "automations_automation_id_unique" UNIQUE("automation_id")
);
--> statement-breakpoint
CREATE TABLE "billing_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"stripe_subscription_id" text,
	"billing_plan_id" uuid,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"total_usage" json DEFAULT '{}',
	"total_cost_cents" integer DEFAULT 0,
	"stripe_invoice_id" text,
	"invoice_pdf_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "billing_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"notification_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" json DEFAULT '{}',
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"deal_id" integer,
	"customer_id" integer,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"rate" numeric(5, 2),
	"base_amount" numeric(10, 2),
	"status" text DEFAULT 'pending',
	"description" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"paid_at" timestamp,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"subject" text,
	"content" text,
	"direction" text NOT NULL,
	"status" text DEFAULT 'sent',
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"contact_id" integer,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
	"position" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text,
	"industry" text,
	"source" text,
	"tags" text[],
	"notes" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"type" text NOT NULL,
	"amount" numeric(12, 4) NOT NULL,
	"description" text,
	"balance_before" numeric(12, 4),
	"balance_after" numeric(12, 4),
	"stripe_transaction_id" text,
	"usage_event_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"value" numeric(10, 2),
	"stage" text NOT NULL,
	"probability" integer DEFAULT 0,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"description" text,
	"status" text DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"contact_id" integer,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"contact_id" integer,
	"deal_id" integer,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"product_type" text,
	"revoke_at" timestamp with time zone,
	"last_invoice_status" text,
	"delinquency_count" integer DEFAULT 0,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"zaxaa_subscription_id" text,
	"plan_name" text,
	"plan_amount" numeric(10, 2),
	"currency" text DEFAULT 'USD',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feature_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"features" text[],
	"price" numeric(8, 2),
	"billing_cycle" text,
	"is_active" boolean DEFAULT true,
	"target_tier" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feature_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"feature_id" integer NOT NULL,
	"last_accessed" timestamp DEFAULT now(),
	"access_count" integer DEFAULT 1,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"parent_id" integer,
	"delivery_type" text,
	"is_enabled" boolean DEFAULT true,
	"depends_on" text[],
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "features_feature_key_unique" UNIQUE("feature_key")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'general',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"contact_id" integer,
	"deal_id" integer,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "partner_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"customer_id" integer NOT NULL,
	"referral_code" text,
	"acquisition_date" timestamp DEFAULT now(),
	"lifetime_value" numeric(10, 2) DEFAULT '0.00',
	"status" text DEFAULT 'active',
	"source" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"new_customers" integer DEFAULT 0,
	"total_customers" integer DEFAULT 0,
	"monthly_revenue" numeric(10, 2) DEFAULT '0.00',
	"total_revenue" numeric(12, 2) DEFAULT '0.00',
	"commissions_earned" numeric(10, 2) DEFAULT '0.00',
	"conversion_rate" numeric(5, 2) DEFAULT '0.00',
	"churn_rate" numeric(5, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"minimum_revenue" numeric(10, 2) DEFAULT '0.00',
	"features" text[],
	"benefits" text[],
	"color" text,
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partner_tiers_name_unique" UNIQUE("name"),
	CONSTRAINT "partner_tiers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "partner_wl_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"branding_active" boolean DEFAULT false,
	"logo_url" text,
	"primary_color" text,
	"secondary_color" text,
	"custom_domain" text,
	"email_branding" json,
	"ui_customizations" json,
	"feature_overrides" json,
	"api_settings" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partner_wl_configs_partner_id_unique" UNIQUE("partner_id")
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text,
	"contact_email" text NOT NULL,
	"phone" text,
	"website" text,
	"business_type" text,
	"status" text DEFAULT 'pending',
	"tier" text DEFAULT 'bronze',
	"commission_rate" numeric(5, 2) DEFAULT '15.00',
	"total_revenue" numeric(12, 2) DEFAULT '0.00',
	"total_commissions" numeric(12, 2) DEFAULT '0.00',
	"customer_count" integer DEFAULT 0,
	"branding_config" json,
	"contract_details" json,
	"payout_settings" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid,
	CONSTRAINT "partners_contact_email_unique" UNIQUE("contact_email")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"commissions_count" integer DEFAULT 0,
	"payment_method" text,
	"payment_details" json,
	"status" text DEFAULT 'pending',
	"scheduled_date" timestamp,
	"processed_at" timestamp,
	"failure_reason" text,
	"external_transaction_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"processed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'regular_user',
	"product_tier" text,
	"avatar_url" text,
	"app_context" text DEFAULT 'smartcrm',
	"email_template_set" text DEFAULT 'smartcrm',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"contact_id" integer,
	"deal_id" integer,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tenant_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"company_name" text,
	"logo" text,
	"favicon" text,
	"primary_color" text DEFAULT '#3B82F6',
	"secondary_color" text DEFAULT '#1E40AF',
	"accent_color" text DEFAULT '#10B981',
	"background_color" text DEFAULT '#FFFFFF',
	"text_color" text DEFAULT '#1F2937',
	"custom_domain" text,
	"custom_css" text,
	"email_from_name" text,
	"email_reply_to" text,
	"email_signature" text,
	"features" json,
	"branding_config" json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid,
	CONSTRAINT "tenant_configs_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "tier_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_tier" text NOT NULL,
	"feature_id" integer NOT NULL,
	"included_by_default" boolean DEFAULT true,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "token_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"balance_before" integer,
	"balance_after" integer,
	"stripe_transaction_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"event_type" text NOT NULL,
	"feature_name" text NOT NULL,
	"quantity" numeric(10, 4) DEFAULT '1' NOT NULL,
	"unit" text NOT NULL,
	"cost_cents" integer DEFAULT 0,
	"metadata" json DEFAULT '{}',
	"billing_cycle_id" uuid,
	"stripe_subscription_item_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"billing_type" text NOT NULL,
	"base_price_cents" integer DEFAULT 0,
	"currency" text DEFAULT 'USD',
	"billing_interval" text,
	"is_active" boolean DEFAULT true,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"features" json DEFAULT '{}',
	"limits" json DEFAULT '{}',
	"pricing_tiers" json DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "usage_plans_plan_name_unique" UNIQUE("plan_name")
);
--> statement-breakpoint
CREATE TABLE "user_ai_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"total_tokens" integer DEFAULT 0,
	"used_tokens" integer DEFAULT 0,
	"available_tokens" integer DEFAULT 0,
	"last_purchase_at" timestamp,
	"last_reset_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"total_credits" numeric(12, 4) DEFAULT '0',
	"used_credits" numeric(12, 4) DEFAULT '0',
	"available_credits" numeric(12, 4) DEFAULT '0',
	"last_purchase_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"feature_id" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"granted_by" uuid,
	"granted_at" timestamp DEFAULT now(),
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "user_generated_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"prompt_text" text,
	"feature" text,
	"format" text,
	"aspect_ratio" text,
	"created_at" timestamp DEFAULT now(),
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "user_usage_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"feature_name" text NOT NULL,
	"limit_value" numeric(12, 4),
	"used_value" numeric(12, 4) DEFAULT '0',
	"reset_date" timestamp,
	"billing_cycle_id" uuid,
	"is_hard_limit" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_wl_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"package_id" uuid,
	"custom_branding" json,
	"enabled_features" text[],
	"preferences" json,
	"settings" json,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "white_label_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"features" text[],
	"pricing" json,
	"customizations" json,
	"restrictions" json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_billing_plan_id_usage_plans_id_fk" FOREIGN KEY ("billing_plan_id") REFERENCES "public"."usage_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "features" ADD CONSTRAINT "features_parent_id_features_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_customers" ADD CONSTRAINT "partner_customers_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_customers" ADD CONSTRAINT "partner_customers_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_metrics" ADD CONSTRAINT "partner_metrics_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_wl_configs" ADD CONSTRAINT "partner_wl_configs_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_processed_by_profiles_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_configs" ADD CONSTRAINT "tenant_configs_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_features" ADD CONSTRAINT "tier_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ai_tokens" ADD CONSTRAINT "user_ai_tokens_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_granted_by_profiles_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_generated_images" ADD CONSTRAINT "user_generated_images_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_usage_limits" ADD CONSTRAINT "user_usage_limits_billing_cycle_id_billing_cycles_id_fk" FOREIGN KEY ("billing_cycle_id") REFERENCES "public"."billing_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wl_settings" ADD CONSTRAINT "user_wl_settings_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wl_settings" ADD CONSTRAINT "user_wl_settings_package_id_white_label_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."white_label_packages"("id") ON DELETE no action ON UPDATE no action;