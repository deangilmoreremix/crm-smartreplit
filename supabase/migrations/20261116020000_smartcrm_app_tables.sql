-- SmartCRM (deangilmoreremix/crm-smartreplit) application tables.
--
-- This Supabase project is shared by several products, so every table that belongs only to SmartCRM is
-- prefixed `smartcrm_` and carries a COMMENT naming the app. Several unprefixed names already belong to
-- other products here (notes, tasks, workflows, workflow_runs, user_roles, user_entitlements), which is
-- why SmartCRM no longer uses them. Shared identity/account tables (profiles, roles, user_api_keys, ...)
-- are referenced, never altered.
--
-- Table definitions are generated from shared/schema.ts (drizzle-kit export) and made idempotent.
-- Supersedes the unapplied 20261116000100_restore_ai_feature_pricing_tables.sql and
-- 20261116010000_twenty_metadata_tables.sql, which used unprefixed names.

CREATE TABLE IF NOT EXISTS public."smartcrm_ai_feature_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_key" text NOT NULL,
	"feature_name" text NOT NULL,
	"description" text,
	"category" text,
	"base_credit_cost" integer DEFAULT 10 NOT NULL,
	"min_credit_cost" integer DEFAULT 1,
	"max_credit_cost" integer DEFAULT 1000,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "smartcrm_ai_feature_definitions_feature_key_unique" UNIQUE("feature_key")
);

CREATE TABLE IF NOT EXISTS public."smartcrm_ai_feature_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reseller_id" uuid,
	"feature_key" text NOT NULL,
	"credits_charged" integer NOT NULL,
	"credits_paid_to_platform" integer NOT NULL,
	"reseller_profit_credits" integer DEFAULT 0,
	"context" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_ai_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"response" text,
	"model" text,
	"tokens_used" integer,
	"cost" numeric(10, 4),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"profile_id" uuid
);

CREATE TABLE IF NOT EXISTS public."smartcrm_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" text,
	"location" text,
	"status" text DEFAULT 'scheduled',
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"recurrence" jsonb,
	"reminders" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid,
	"contact_id" integer
);

CREATE TABLE IF NOT EXISTS public."smartcrm_automation_rules" (
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

CREATE TABLE IF NOT EXISTS public."smartcrm_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"direction" text DEFAULT 'outbound',
	"subject" text,
	"content" text,
	"status" text DEFAULT 'sent',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid,
	"contact_id" integer
);

CREATE TABLE IF NOT EXISTS public."smartcrm_contact_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" integer,
	"activity_type" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_contact_custom_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" integer,
	"field_key" text NOT NULL,
	"field_value" jsonb,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
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
	"score" numeric(3, 2) DEFAULT '0.50',
	"health_score" integer,
	"enrichment_data" jsonb,
	"last_enriched_at" timestamp with time zone,
	"linkedin_url" text,
	"linkedin_data" jsonb,
	"linkedin_synced_at" timestamp,
	"mailchimp_id" text,
	"mailchimp_email_id" text,
	"mailchimp_tags" text[],
	"mailchimp_status" text,
	"mailchimp_merge_fields" jsonb,
	"mailchimp_stats" jsonb,
	"mailchimp_synced_at" timestamp,
	"custom_fields" json,
	"position" integer DEFAULT 0,
	"idempotency_key" varchar(64),
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid
);

CREATE TABLE IF NOT EXISTS public."smartcrm_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"value" numeric(10, 2),
	"stage" text NOT NULL,
	"probability" integer DEFAULT 0,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"description" text,
	"status" text DEFAULT 'open',
	"health_score" integer,
	"win_probability" integer,
	"last_activity_at" timestamp,
	"days_in_stage" integer DEFAULT 0,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"position" integer DEFAULT 0,
	"idempotency_key" varchar(64),
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"contact_id" integer,
	"profile_id" uuid
);

CREATE TABLE IF NOT EXISTS public."smartcrm_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"size" integer,
	"mime_type" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid,
	"contact_id" integer
);

CREATE TABLE IF NOT EXISTS public."smartcrm_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_tier" text NOT NULL,
	"status" text DEFAULT 'active',
	"started_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"is_enabled" boolean DEFAULT true,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "smartcrm_features_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS public."smartcrm_field_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_metadata_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"icon" text,
	"options" jsonb,
	"default_value" jsonb,
	"settings" jsonb,
	"is_custom" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"is_nullable" boolean DEFAULT true,
	"is_unique" boolean DEFAULT false,
	"workspace_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"type" text DEFAULT 'general',
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid,
	"contact_id" integer
);

CREATE TABLE IF NOT EXISTS public."smartcrm_object_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"label_plural" text,
	"description" text,
	"icon" text,
	"is_custom" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"workspace_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_relation_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_object_metadata_id" uuid NOT NULL,
	"target_object_metadata_id" uuid NOT NULL,
	"source_field_metadata_id" uuid NOT NULL,
	"target_field_metadata_id" uuid,
	"relation_type" text NOT NULL,
	"is_custom" boolean DEFAULT false,
	"workspace_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"due_date" timestamp,
	"completed_at" timestamp,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"position" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"contact_id" integer,
	"deal_id" integer,
	"profile_id" uuid,
	"assigned_to" uuid
);

CREATE TABLE IF NOT EXISTS public."smartcrm_token_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance" integer NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"profile_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public."smartcrm_user_ai_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"total_tokens" integer DEFAULT 0,
	"used_tokens" integer DEFAULT 0,
	"purchased_tokens" integer DEFAULT 0,
	"free_tier_tokens" integer DEFAULT 0,
	"reset_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public."smartcrm_user_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"feature_id" integer NOT NULL,
	"is_enabled" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_user_generated_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt" text NOT NULL,
	"image_url" text,
	"model" text,
	"size" text,
	"style" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"profile_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public."smartcrm_user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"tenant_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_metadata_id" uuid,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"kanban_field_metadata_id" uuid,
	"filters" jsonb DEFAULT '[]'::jsonb,
	"sorts" jsonb DEFAULT '[]'::jsonb,
	"visible_fields" jsonb DEFAULT '[]'::jsonb,
	"hidden_fields" jsonb DEFAULT '[]'::jsonb,
	"aggregations" jsonb DEFAULT '[]'::jsonb,
	"visibility" text DEFAULT 'personal',
	"is_default" boolean DEFAULT false,
	"user_id" uuid,
	"workspace_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_workflow_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"type" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"condition" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_workflow_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"total_credits" integer DEFAULT 0,
	"used_credits" integer DEFAULT 0,
	"reset_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_workflow_run_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"action_sequence" integer,
	"status" text DEFAULT 'pending',
	"input_data" jsonb DEFAULT '{}'::jsonb,
	"output_data" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_workflow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"trigger_data" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."smartcrm_workflow_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"trigger_type" text NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb,
	"is_public" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid
);

CREATE TABLE IF NOT EXISTS public."smartcrm_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"actions" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'active',
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_id" uuid
);

CREATE TABLE IF NOT EXISTS public."smartcrm_ai_reseller_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" uuid NOT NULL REFERENCES public.profiles(id),
	"feature_key" text NOT NULL,
	"retail_credit_cost" integer NOT NULL,
	"wholesale_credit_cost" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "smartcrm_unique_reseller_feature" UNIQUE("reseller_id","feature_key")
);

-- Foreign keys (skipped when already present)
DO $$
BEGIN
  BEGIN
    ALTER TABLE "smartcrm_ai_feature_usage" ADD CONSTRAINT "smartcrm_ai_feature_usage_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_ai_feature_usage" ADD CONSTRAINT "smartcrm_ai_feature_usage_reseller_id_profiles_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_ai_queries" ADD CONSTRAINT "smartcrm_ai_queries_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_appointments" ADD CONSTRAINT "smartcrm_appointments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_appointments" ADD CONSTRAINT "smartcrm_appointments_contact_id_smartcrm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."smartcrm_contacts"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_automation_rules" ADD CONSTRAINT "smartcrm_automation_rules_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_communications" ADD CONSTRAINT "smartcrm_communications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_communications" ADD CONSTRAINT "smartcrm_communications_contact_id_smartcrm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."smartcrm_contacts"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_contact_activities" ADD CONSTRAINT "smartcrm_contact_activities_contact_id_smartcrm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."smartcrm_contacts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_contact_custom_fields" ADD CONSTRAINT "smartcrm_contact_custom_fields_contact_id_smartcrm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."smartcrm_contacts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_contacts" ADD CONSTRAINT "smartcrm_contacts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_deals" ADD CONSTRAINT "smartcrm_deals_contact_id_smartcrm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."smartcrm_contacts"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_deals" ADD CONSTRAINT "smartcrm_deals_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_documents" ADD CONSTRAINT "smartcrm_documents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_documents" ADD CONSTRAINT "smartcrm_documents_contact_id_smartcrm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."smartcrm_contacts"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_entitlements" ADD CONSTRAINT "smartcrm_entitlements_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_field_metadata" ADD CONSTRAINT "smartcrm_field_metadata_object_metadata_id_smartcrm_object_metadata_id_fk" FOREIGN KEY ("object_metadata_id") REFERENCES "public"."smartcrm_object_metadata"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_field_metadata" ADD CONSTRAINT "smartcrm_field_metadata_workspace_id_profiles_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_notes" ADD CONSTRAINT "smartcrm_notes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_notes" ADD CONSTRAINT "smartcrm_notes_contact_id_smartcrm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."smartcrm_contacts"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_object_metadata" ADD CONSTRAINT "smartcrm_object_metadata_workspace_id_profiles_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_relation_metadata" ADD CONSTRAINT "smartcrm_relation_metadata_source_object_metadata_id_smartcrm_object_metadata_id_fk" FOREIGN KEY ("source_object_metadata_id") REFERENCES "public"."smartcrm_object_metadata"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_relation_metadata" ADD CONSTRAINT "smartcrm_relation_metadata_target_object_metadata_id_smartcrm_object_metadata_id_fk" FOREIGN KEY ("target_object_metadata_id") REFERENCES "public"."smartcrm_object_metadata"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_relation_metadata" ADD CONSTRAINT "smartcrm_relation_metadata_source_field_metadata_id_smartcrm_field_metadata_id_fk" FOREIGN KEY ("source_field_metadata_id") REFERENCES "public"."smartcrm_field_metadata"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_relation_metadata" ADD CONSTRAINT "smartcrm_relation_metadata_target_field_metadata_id_smartcrm_field_metadata_id_fk" FOREIGN KEY ("target_field_metadata_id") REFERENCES "public"."smartcrm_field_metadata"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_relation_metadata" ADD CONSTRAINT "smartcrm_relation_metadata_workspace_id_profiles_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_tasks" ADD CONSTRAINT "smartcrm_tasks_contact_id_smartcrm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."smartcrm_contacts"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_tasks" ADD CONSTRAINT "smartcrm_tasks_deal_id_smartcrm_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."smartcrm_deals"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_tasks" ADD CONSTRAINT "smartcrm_tasks_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_tasks" ADD CONSTRAINT "smartcrm_tasks_assigned_to_profiles_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_token_transactions" ADD CONSTRAINT "smartcrm_token_transactions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_user_ai_tokens" ADD CONSTRAINT "smartcrm_user_ai_tokens_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_user_features" ADD CONSTRAINT "smartcrm_user_features_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_user_features" ADD CONSTRAINT "smartcrm_user_features_feature_id_smartcrm_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."smartcrm_features"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_user_generated_images" ADD CONSTRAINT "smartcrm_user_generated_images_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_user_roles" ADD CONSTRAINT "smartcrm_user_roles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_user_roles" ADD CONSTRAINT "smartcrm_user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_views" ADD CONSTRAINT "smartcrm_views_object_metadata_id_smartcrm_object_metadata_id_fk" FOREIGN KEY ("object_metadata_id") REFERENCES "public"."smartcrm_object_metadata"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_views" ADD CONSTRAINT "smartcrm_views_kanban_field_metadata_id_smartcrm_field_metadata_id_fk" FOREIGN KEY ("kanban_field_metadata_id") REFERENCES "public"."smartcrm_field_metadata"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_views" ADD CONSTRAINT "smartcrm_views_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_views" ADD CONSTRAINT "smartcrm_views_workspace_id_profiles_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_workflow_actions" ADD CONSTRAINT "smartcrm_workflow_actions_workflow_id_smartcrm_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."smartcrm_workflows"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_workflow_credits" ADD CONSTRAINT "smartcrm_workflow_credits_tenant_id_profiles_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_workflow_run_logs" ADD CONSTRAINT "smartcrm_workflow_run_logs_run_id_smartcrm_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."smartcrm_workflow_runs"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_workflow_runs" ADD CONSTRAINT "smartcrm_workflow_runs_workflow_id_smartcrm_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."smartcrm_workflows"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_workflow_templates" ADD CONSTRAINT "smartcrm_workflow_templates_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE "smartcrm_workflows" ADD CONSTRAINT "smartcrm_workflows_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
-- ---------------------------------------------------------------------------------------------------
-- Entitlements (SmartCRM's own copy; the unprefixed user_entitlements belongs to another product)
-- ---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.smartcrm_user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  package text NOT NULL DEFAULT 'regular',
  product_tier text,
  role text,
  openclaw_enabled boolean NOT NULL DEFAULT false,
  admin_enabled boolean NOT NULL DEFAULT false,
  source text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS smartcrm_user_entitlements_email_idx ON public.smartcrm_user_entitlements (lower(email));
CREATE INDEX IF NOT EXISTS smartcrm_user_entitlements_user_id_idx ON public.smartcrm_user_entitlements (user_id);

CREATE TABLE IF NOT EXISTS public.smartcrm_package_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package text NOT NULL,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (package, feature_key)
);

CREATE OR REPLACE FUNCTION public.smartcrm_user_has_feature(input_email text, input_feature_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.smartcrm_user_entitlements ue
    LEFT JOIN public.smartcrm_package_features pf ON pf.package = ue.package AND pf.enabled
    WHERE lower(ue.email) = lower(input_email)
      AND ue.package <> 'no_access'
      AND (
        ue.package = 'super_admin'
        OR pf.feature_key = '*'
        OR pf.feature_key = input_feature_key
        OR (input_feature_key = 'openclaw' AND ue.openclaw_enabled)
        OR (input_feature_key IN ('admin_panel', 'feature_management', 'user_management') AND ue.admin_enabled)
      )
  );
$$;
REVOKE ALL ON FUNCTION public.smartcrm_user_has_feature(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.smartcrm_user_has_feature(text, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------
-- Indexes on owner / lookup columns
-- ---------------------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS smartcrm_contacts_profile_idx ON public.smartcrm_contacts (profile_id);
CREATE INDEX IF NOT EXISTS smartcrm_deals_profile_idx ON public.smartcrm_deals (profile_id);
CREATE INDEX IF NOT EXISTS smartcrm_deals_contact_idx ON public.smartcrm_deals (contact_id);
CREATE INDEX IF NOT EXISTS smartcrm_tasks_profile_idx ON public.smartcrm_tasks (profile_id);
CREATE INDEX IF NOT EXISTS smartcrm_notes_profile_idx ON public.smartcrm_notes (profile_id);
CREATE INDEX IF NOT EXISTS smartcrm_communications_profile_type_idx ON public.smartcrm_communications (profile_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS smartcrm_appointments_profile_idx ON public.smartcrm_appointments (profile_id, start_time);
CREATE INDEX IF NOT EXISTS smartcrm_documents_profile_idx ON public.smartcrm_documents (profile_id);
CREATE INDEX IF NOT EXISTS smartcrm_contact_activities_contact_idx ON public.smartcrm_contact_activities (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS smartcrm_contact_custom_fields_contact_idx ON public.smartcrm_contact_custom_fields (contact_id);
CREATE INDEX IF NOT EXISTS smartcrm_ai_feature_usage_user_idx ON public.smartcrm_ai_feature_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS smartcrm_ai_feature_usage_reseller_idx ON public.smartcrm_ai_feature_usage (reseller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS smartcrm_workflows_profile_idx ON public.smartcrm_workflows (profile_id);
CREATE INDEX IF NOT EXISTS smartcrm_workflow_runs_workflow_idx ON public.smartcrm_workflow_runs (workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS smartcrm_workflow_run_logs_run_idx ON public.smartcrm_workflow_run_logs (run_id);
CREATE INDEX IF NOT EXISTS smartcrm_workflow_actions_workflow_idx ON public.smartcrm_workflow_actions (workflow_id, sequence);
CREATE INDEX IF NOT EXISTS smartcrm_field_metadata_object_idx ON public.smartcrm_field_metadata (object_metadata_id);
CREATE INDEX IF NOT EXISTS smartcrm_views_user_idx ON public.smartcrm_views (user_id);

-- ---------------------------------------------------------------------------------------------------
-- Labels
-- ---------------------------------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('smartcrm_contacts', 'CRM contacts, owned by profile_id'),
    ('smartcrm_deals', 'sales pipeline deals, owned by profile_id'),
    ('smartcrm_tasks', 'CRM tasks, owned by profile_id'),
    ('smartcrm_notes', 'contact notes, owned by profile_id'),
    ('smartcrm_appointments', 'calendar appointments, owned by profile_id'),
    ('smartcrm_communications', 'calls, SMS and emails (type), owned by profile_id'),
    ('smartcrm_documents', 'uploaded documents, owned by profile_id'),
    ('smartcrm_contact_activities', 'activity timeline per contact'),
    ('smartcrm_contact_custom_fields', 'custom field values per contact'),
    ('smartcrm_automation_rules', 'automation rules, owned by profile_id'),
    ('smartcrm_ai_queries', 'AI request log, owned by profile_id'),
    ('smartcrm_ai_feature_definitions', 'catalog of AI features and their credit cost'),
    ('smartcrm_ai_feature_usage', 'AI feature credit usage per user'),
    ('smartcrm_ai_reseller_pricing', 'white-label reseller prices per AI feature'),
    ('smartcrm_user_ai_tokens', 'AI token balance per user'),
    ('smartcrm_token_transactions', 'AI token ledger per user'),
    ('smartcrm_user_generated_images', 'images generated by users'),
    ('smartcrm_entitlements', 'product tier subscriptions (server/entitlements)'),
    ('smartcrm_user_entitlements', 'package / feature access per user email, written by payment webhooks'),
    ('smartcrm_package_features', 'features included in each SmartCRM package'),
    ('smartcrm_features', 'feature flag catalog'),
    ('smartcrm_user_features', 'feature flags per user'),
    ('smartcrm_user_roles', 'role assignments (references shared roles)'),
    ('smartcrm_object_metadata', 'Twenty-style object metadata'),
    ('smartcrm_field_metadata', 'Twenty-style field metadata'),
    ('smartcrm_relation_metadata', 'Twenty-style relation metadata'),
    ('smartcrm_views', 'saved table/kanban views'),
    ('smartcrm_workflows', 'workflow definitions, owned by profile_id'),
    ('smartcrm_workflow_actions', 'workflow steps'),
    ('smartcrm_workflow_runs', 'workflow executions'),
    ('smartcrm_workflow_run_logs', 'workflow step logs'),
    ('smartcrm_workflow_credits', 'workflow credit balance per tenant'),
    ('smartcrm_workflow_templates', 'workflow templates (public or owned)')
  ) AS t(name, purpose) LOOP
    EXECUTE format('COMMENT ON TABLE public.%I IS %L', r.name, 'SmartCRM (deangilmoreremix/crm-smartreplit): ' || r.purpose);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.name);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------------------------------
-- Row level security. The server uses the service role / direct DB connection (bypasses RLS); these
-- policies cover browser access with a user's JWT.
-- ---------------------------------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  -- Tables owned by profile_id: full access to own rows
  FOREACH t IN ARRAY ARRAY['smartcrm_contacts','smartcrm_deals','smartcrm_tasks','smartcrm_notes',
    'smartcrm_appointments','smartcrm_communications','smartcrm_documents','smartcrm_automation_rules',
    'smartcrm_ai_queries','smartcrm_user_generated_images','smartcrm_workflows'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "smartcrm owner access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "smartcrm owner access" ON public.%I FOR ALL TO authenticated '
      'USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()))', t);
  END LOOP;

  -- Balances / ledgers / grants: read own rows only (written by the server)
  FOREACH t IN ARRAY ARRAY['smartcrm_user_ai_tokens','smartcrm_token_transactions'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "smartcrm owner read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "smartcrm owner read" ON public.%I FOR SELECT TO authenticated '
      'USING (profile_id = (select auth.uid()))', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['smartcrm_entitlements','smartcrm_user_features','smartcrm_user_roles'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "smartcrm owner read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "smartcrm owner read" ON public.%I FOR SELECT TO authenticated '
      'USING (user_id = (select auth.uid()))', t);
  END LOOP;

  -- Catalogs: readable by signed-in users
  FOREACH t IN ARRAY ARRAY['smartcrm_features','smartcrm_ai_feature_definitions','smartcrm_package_features'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "smartcrm catalog read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "smartcrm catalog read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- Children of contacts: access follows the contact's owner
DROP POLICY IF EXISTS "smartcrm owner access" ON public.smartcrm_contact_activities;
CREATE POLICY "smartcrm owner access" ON public.smartcrm_contact_activities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.smartcrm_contacts c WHERE c.id = contact_id AND c.profile_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.smartcrm_contacts c WHERE c.id = contact_id AND c.profile_id = (select auth.uid())));
DROP POLICY IF EXISTS "smartcrm owner access" ON public.smartcrm_contact_custom_fields;
CREATE POLICY "smartcrm owner access" ON public.smartcrm_contact_custom_fields FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.smartcrm_contacts c WHERE c.id = contact_id AND c.profile_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.smartcrm_contacts c WHERE c.id = contact_id AND c.profile_id = (select auth.uid())));

-- Children of workflows: access follows the workflow's owner
DROP POLICY IF EXISTS "smartcrm owner access" ON public.smartcrm_workflow_actions;
CREATE POLICY "smartcrm owner access" ON public.smartcrm_workflow_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.smartcrm_workflows w WHERE w.id = workflow_id AND w.profile_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.smartcrm_workflows w WHERE w.id = workflow_id AND w.profile_id = (select auth.uid())));
DROP POLICY IF EXISTS "smartcrm owner read" ON public.smartcrm_workflow_runs;
CREATE POLICY "smartcrm owner read" ON public.smartcrm_workflow_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.smartcrm_workflows w WHERE w.id = workflow_id AND w.profile_id = (select auth.uid())));
DROP POLICY IF EXISTS "smartcrm owner read" ON public.smartcrm_workflow_run_logs;
CREATE POLICY "smartcrm owner read" ON public.smartcrm_workflow_run_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.smartcrm_workflow_runs r JOIN public.smartcrm_workflows w ON w.id = r.workflow_id
                 WHERE r.id = run_id AND w.profile_id = (select auth.uid())));
DROP POLICY IF EXISTS "smartcrm owner read" ON public.smartcrm_workflow_credits;
CREATE POLICY "smartcrm owner read" ON public.smartcrm_workflow_credits FOR SELECT TO authenticated
  USING (tenant_id = (select auth.uid()));

-- Templates: public ones readable by everyone signed in; own ones fully editable
DROP POLICY IF EXISTS "smartcrm template read" ON public.smartcrm_workflow_templates;
CREATE POLICY "smartcrm template read" ON public.smartcrm_workflow_templates FOR SELECT TO authenticated
  USING (is_public OR profile_id = (select auth.uid()));
DROP POLICY IF EXISTS "smartcrm owner write" ON public.smartcrm_workflow_templates;
CREATE POLICY "smartcrm owner write" ON public.smartcrm_workflow_templates FOR ALL TO authenticated
  USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- Twenty metadata: system rows (no workspace) readable; own workspace fully editable
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['smartcrm_object_metadata','smartcrm_field_metadata','smartcrm_relation_metadata'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "smartcrm metadata read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "smartcrm metadata read" ON public.%I FOR SELECT TO authenticated '
      'USING (workspace_id IS NULL OR workspace_id = (select auth.uid()))', t);
    EXECUTE format('DROP POLICY IF EXISTS "smartcrm metadata write" ON public.%I', t);
    EXECUTE format('CREATE POLICY "smartcrm metadata write" ON public.%I FOR ALL TO authenticated '
      'USING (workspace_id = (select auth.uid())) WITH CHECK (workspace_id = (select auth.uid()))', t);
  END LOOP;
END $$;
DROP POLICY IF EXISTS "smartcrm owner access" ON public.smartcrm_views;
CREATE POLICY "smartcrm owner access" ON public.smartcrm_views FOR ALL TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- AI usage and reseller pricing
DROP POLICY IF EXISTS "smartcrm owner read" ON public.smartcrm_ai_feature_usage;
CREATE POLICY "smartcrm owner read" ON public.smartcrm_ai_feature_usage FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR reseller_id = (select auth.uid()));
DROP POLICY IF EXISTS "smartcrm owner access" ON public.smartcrm_ai_reseller_pricing;
CREATE POLICY "smartcrm owner access" ON public.smartcrm_ai_reseller_pricing FOR ALL TO authenticated
  USING (reseller_id = (select auth.uid())) WITH CHECK (reseller_id = (select auth.uid()));

-- Entitlements: users read their own row and may create only a default 'regular' row for themselves
-- (packages are granted by the payment webhooks with the service role).
DROP POLICY IF EXISTS "smartcrm own entitlement read" ON public.smartcrm_user_entitlements;
CREATE POLICY "smartcrm own entitlement read" ON public.smartcrm_user_entitlements FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR lower(email) = lower((select auth.jwt()) ->> 'email'));
DROP POLICY IF EXISTS "smartcrm own default entitlement insert" ON public.smartcrm_user_entitlements;
CREATE POLICY "smartcrm own default entitlement insert" ON public.smartcrm_user_entitlements FOR INSERT TO authenticated
  WITH CHECK (
    lower(email) = lower((select auth.jwt()) ->> 'email')
    AND (user_id IS NULL OR user_id = (select auth.uid()))
    AND package = 'regular' AND NOT openclaw_enabled AND NOT admin_enabled
    AND product_tier IS NULL AND (role IS NULL OR role = 'regular_user')
  );

-- ---------------------------------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------------------------------
INSERT INTO public.smartcrm_package_features (package, feature_key) VALUES
  ('regular','core_crm'),('regular','dashboard'),('regular','contacts'),
  ('regular','pipeline'),('regular','calendar'),
  ('smartmarketer','core_crm'),('smartmarketer','dashboard'),('smartmarketer','contacts'),
  ('smartmarketer','pipeline'),('smartmarketer','calendar'),
  ('smartmarketer','ai_tools'),('smartmarketer','ai_goals'),('smartmarketer','analytics'),
  ('smartmarketer','business_intelligence'),('smartmarketer','communication_hub'),
  ('smartmarketer','appointments'),('smartmarketer','video_email'),
  ('smartmarketer','text_messages'),('smartmarketer','phone_system'),
  ('smartmarketer','voice_profiles'),('smartmarketer','invoicing'),
  ('smartmarketer','lead_automation'),('smartmarketer','forms_surveys'),
  ('smartmarketer','business_analyzer'),('smartmarketer','content_library'),
  ('smartmarketer','circle_prospecting'),('smartmarketer','connected_apps'),
  ('smartmarketer','funnelcraft_ai'),('smartmarketer','smartcrm_closer'),
  ('smartmarketer','content_ai'),('smartmarketer','billing_credits'),
  ('smartmarketer','buy_credits'),
  ('super_admin','*')
ON CONFLICT (package, feature_key) DO NOTHING;

INSERT INTO public.smartcrm_package_features (package, feature_key)
SELECT 'whitelabel', feature_key FROM public.smartcrm_package_features WHERE package = 'smartmarketer'
ON CONFLICT (package, feature_key) DO NOTHING;

INSERT INTO public.smartcrm_package_features (package, feature_key) VALUES
  ('whitelabel','white_label'),('whitelabel','white_label_customization'),
  ('whitelabel','white_label_management'),('whitelabel','multi_tenant_features'),
  ('whitelabel','custom_branding'),('whitelabel','domain_management'),
  ('whitelabel','package_builder'),('whitelabel','revenue_sharing'),
  ('whitelabel','partner_dashboard'),('whitelabel','partner_onboarding'),
  ('whitelabel','brand_asset_management'),('whitelabel','theme_customization'),
  ('whitelabel','custom_domain_setup'),('whitelabel','feature_package_configuration')
ON CONFLICT (package, feature_key) DO NOTHING;

-- Existing whitelabel customer from 20260523223000 (only if the account exists in this project)
INSERT INTO public.smartcrm_user_entitlements (email, user_id, package, source, notes)
SELECT 'keith@beappsolute.com', u.id, 'whitelabel', 'Migration 20261116020000',
       'Carried over from 20260523223000_fix_missing_entitlements_system.sql'
FROM auth.users u WHERE u.id = '56b75547-1797-41d5-999c-1fed03dd55de'
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.smartcrm_ai_feature_definitions (feature_key, feature_name, description, category, base_credit_cost) VALUES
  ('gpt5_chat', 'AI Chat', 'General AI chat conversation', 'communication', 5),
  ('script_generation', 'Video Script Generation', 'AI-generated video scripts', 'content', 15),
  ('meeting_summary', 'Meeting Summary', 'Summarize meeting transcripts', 'analysis', 10),
  ('email_draft', 'Email Draft', 'AI-assisted email composition', 'communication', 8),
  ('contact_enrichment', 'Contact Enrichment', 'Enrich contact data with AI', 'analysis', 20),
  ('pipeline_analysis', 'Pipeline Analysis', 'AI insights on sales pipeline', 'analysis', 12),
  ('content_generation', 'Content Generation', 'Generate marketing content', 'content', 25),
  ('image_generation', 'Image Generation', 'Generate images with AI', 'content', 30),
  ('voice_synthesis', 'Voice Synthesis', 'Text-to-speech generation', 'content', 15),
  ('video_generation', 'Video Generation', 'AI video creation', 'content', 50)
ON CONFLICT (feature_key) DO NOTHING;
