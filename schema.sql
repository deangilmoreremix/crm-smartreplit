


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."agent_category_enum" AS ENUM (
    'Specialized Sales & Marketing',
    'Customer Support',
    'Data Analysis',
    'General Productivity',
    'Content Generation',
    'Automation',
    'Other'
);


ALTER TYPE "public"."agent_category_enum" OWNER TO "postgres";


CREATE TYPE "public"."communication_direction" AS ENUM (
    'inbound',
    'outbound'
);


ALTER TYPE "public"."communication_direction" OWNER TO "postgres";


CREATE TYPE "public"."communication_status" AS ENUM (
    'sent',
    'delivered',
    'read',
    'replied',
    'failed'
);


ALTER TYPE "public"."communication_status" OWNER TO "postgres";


CREATE TYPE "public"."communication_type" AS ENUM (
    'email',
    'call',
    'sms',
    'video',
    'social',
    'meeting'
);


ALTER TYPE "public"."communication_type" OWNER TO "postgres";


CREATE TYPE "public"."contact_status" AS ENUM (
    'lead',
    'prospect',
    'customer',
    'inactive'
);


ALTER TYPE "public"."contact_status" OWNER TO "postgres";


CREATE TYPE "public"."crm_method_enum" AS ENUM (
    'function_call',
    'webhook',
    'direct_api',
    'none'
);


ALTER TYPE "public"."crm_method_enum" OWNER TO "postgres";


CREATE TYPE "public"."execution_status" AS ENUM (
    'success',
    'failed',
    'pending'
);


ALTER TYPE "public"."execution_status" OWNER TO "postgres";


CREATE TYPE "public"."goal_category_enum" AS ENUM (
    'Sales',
    'Marketing',
    'Customer Service',
    'Operations',
    'Analytics',
    'Product Development',
    'General'
);


ALTER TYPE "public"."goal_category_enum" OWNER TO "postgres";


CREATE TYPE "public"."impact_level" AS ENUM (
    'high',
    'medium',
    'low'
);


ALTER TYPE "public"."impact_level" OWNER TO "postgres";


CREATE TYPE "public"."insight_type" AS ENUM (
    'opportunity',
    'risk',
    'recommendation',
    'prediction',
    'pattern'
);


ALTER TYPE "public"."insight_type" OWNER TO "postgres";


CREATE TYPE "public"."interest_level" AS ENUM (
    'hot',
    'medium',
    'low',
    'cold'
);


ALTER TYPE "public"."interest_level" OWNER TO "postgres";


CREATE TYPE "public"."journey_event_status" AS ENUM (
    'completed',
    'pending',
    'in_progress'
);


ALTER TYPE "public"."journey_event_status" OWNER TO "postgres";


CREATE TYPE "public"."journey_event_type" AS ENUM (
    'interaction',
    'milestone',
    'status_change',
    'ai_insight',
    'file_upload'
);


ALTER TYPE "public"."journey_event_type" OWNER TO "postgres";


CREATE TYPE "public"."llm_type_enum" AS ENUM (
    'openai',
    'gemini',
    'anthropic',
    'mistral',
    'other'
);


ALTER TYPE "public"."llm_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."pattern_trend" AS ENUM (
    'increasing',
    'stable',
    'decreasing'
);


ALTER TYPE "public"."pattern_trend" OWNER TO "postgres";


CREATE TYPE "public"."relationship_type" AS ENUM (
    'colleague',
    'competitor',
    'partner',
    'client',
    'vendor'
);


ALTER TYPE "public"."relationship_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."anonymize_user_data"("target_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
IF target_user_id != auth.uid() THEN
RAISE EXCEPTION 'Unauthorized';
END IF;

UPDATE public.profiles
SET 
username = 'deleted_user_' || gen_random_uuid()::text,
first_name = NULL,
last_name = NULL,
avatar_url = NULL
WHERE id = target_user_id;

RETURN true;
END;
$$;


ALTER FUNCTION "public"."anonymize_user_data"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_blacklist_abusive_ips"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
INSERT INTO public.ip_blacklist (ip_address, reason, expires_at)
SELECT 
se.ip_address,
'Auto-blacklisted: Multiple security events',
now() + interval '24 hours'
FROM public.security_events se
WHERE se.created_at >= now() - interval '1 hour'
AND se.ip_address IS NOT NULL
GROUP BY se.ip_address
HAVING count(*) >= 10
ON CONFLICT (ip_address) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."auto_blacklist_abusive_ips"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_import_contacts"("p_contact_data" "jsonb"[], "p_admin_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result JSONB;
  v_record JSONB;
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_error TEXT;
BEGIN
  -- For each record in the array
  FOREACH v_record IN ARRAY p_contact_data
  LOOP
    BEGIN
      -- Validate record
      IF NOT public.validate_contact_import_data(v_record) THEN
        v_failed := v_failed + 1;
        v_errors := array_append(v_errors, 'Invalid data format for contact: ' || v_record->>'name');
        CONTINUE;
      END IF;
      
      -- Insert contact
      INSERT INTO public.contacts (
        user_id,
        name,
        email,
        phone,
        notes,
        favorite,
        status,
        industry,
        location
      ) VALUES (
        COALESCE(
          (v_record->>'user_id')::UUID, 
          p_admin_user_id
        ),
        v_record->>'name',
        v_record->>'email',
        v_record->>'phone',
        v_record->>'notes',
        CASE
          WHEN v_record->>'favorite' IN ('true', 'yes', '1') THEN TRUE
          ELSE FALSE
        END,
        COALESCE(v_record->>'status', 'lead'),
        v_record->>'industry',
        v_record->>'location'
      );
      
      v_successful := v_successful + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_failed := v_failed + 1;
        GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
        v_errors := array_append(v_errors, 'Error creating contact: ' || v_error);
    END;
  END LOOP;

  -- Log the import
  PERFORM public.log_import(
    p_admin_user_id,
    'contacts',
    'bulk_import',
    array_length(p_contact_data, 1),
    v_successful,
    v_failed,
    jsonb_build_object('errors', to_jsonb(v_errors))
  );

  -- Return result
  v_result := jsonb_build_object(
    'successful', v_successful,
    'failed', v_failed,
    'errors', v_errors
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."bulk_import_contacts"("p_contact_data" "jsonb"[], "p_admin_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_import_deals"("p_deal_data" "jsonb"[], "p_admin_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result JSONB;
  v_record JSONB;
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_error TEXT;
BEGIN
  -- For each record in the array
  FOREACH v_record IN ARRAY p_deal_data
  LOOP
    BEGIN
      -- Validate record
      IF NOT public.validate_deal_import_data(v_record) THEN
        v_failed := v_failed + 1;
        v_errors := array_append(v_errors, 'Invalid data format for deal: ' || v_record->>'title');
        CONTINUE;
      END IF;
      
      -- Insert deal
      INSERT INTO public.deals (
        title,
        value,
        stage,
        company,
        contact,
        contact_id,
        probability,
        notes,
        expected_close_date,
        user_id
      ) VALUES (
        v_record->>'title',
        (v_record->>'value')::NUMERIC,
        COALESCE(v_record->>'stage', 'qualification'),
        COALESCE(v_record->>'company', ''),
        COALESCE(v_record->>'contact', ''),
        (v_record->>'contact_id')::UUID,
        COALESCE((v_record->>'probability')::NUMERIC, 0),
        v_record->>'notes',
        NULLIF(v_record->>'expected_close_date', '')::DATE,
        COALESCE(
          (v_record->>'user_id')::UUID, 
          p_admin_user_id
        )
      );
      
      v_successful := v_successful + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_failed := v_failed + 1;
        GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
        v_errors := array_append(v_errors, 'Error creating deal: ' || v_error);
    END;
  END LOOP;

  -- Log the import
  PERFORM public.log_import(
    p_admin_user_id,
    'deals',
    'bulk_import',
    array_length(p_deal_data, 1),
    v_successful,
    v_failed,
    jsonb_build_object('errors', to_jsonb(v_errors))
  );

  -- Return result
  v_result := jsonb_build_object(
    'successful', v_successful,
    'failed', v_failed,
    'errors', v_errors
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."bulk_import_deals"("p_deal_data" "jsonb"[], "p_admin_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_import_users"("p_user_data" "jsonb"[], "p_admin_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result JSONB;
  v_record JSONB;
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_user_id UUID;
  v_error TEXT;
BEGIN
  -- For each record in the array
  FOREACH v_record IN ARRAY p_user_data
  LOOP
    BEGIN
      -- Validate record
      IF NOT public.validate_user_import_data(v_record) THEN
        v_failed := v_failed + 1;
        v_errors := array_append(v_errors, 'Invalid data format for user: ' || v_record->>'email');
        CONTINUE;
      END IF;
      
      -- Create user
      -- Note: In a real implementation, this would call auth.create_user
      -- but for security reasons, this operation is handled by the edge function
      -- that has access to the service role key
      
      v_successful := v_successful + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_failed := v_failed + 1;
        GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
        v_errors := array_append(v_errors, 'Error creating user: ' || v_error);
    END;
  END LOOP;

  -- Log the import
  PERFORM public.log_import(
    p_admin_user_id,
    'users',
    'bulk_import',
    array_length(p_user_data, 1),
    v_successful,
    v_failed,
    jsonb_build_object('errors', to_jsonb(v_errors))
  );

  -- Return result
  v_result := jsonb_build_object(
    'successful', v_successful,
    'failed', v_failed,
    'errors', v_errors
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."bulk_import_users"("p_user_data" "jsonb"[], "p_admin_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_gpt5_cost"("model_variant" "text", "input_tokens" integer, "output_tokens" integer, "reasoning_tokens" integer DEFAULT 0, "cached_tokens" integer DEFAULT 0) RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
input_cost_per_million decimal(10,2);
output_cost_per_million decimal(10,2);
total_cost_cents integer;
BEGIN
CASE model_variant
WHEN 'gpt-5' THEN
input_cost_per_million := 1.25;
output_cost_per_million := 10.00;
WHEN 'gpt-5-mini' THEN
input_cost_per_million := 0.25;
output_cost_per_million := 2.00;
WHEN 'gpt-5-nano' THEN
input_cost_per_million := 0.05;
output_cost_per_million := 0.40;
WHEN 'gpt-4o' THEN
input_cost_per_million := 2.50;
output_cost_per_million := 10.00;
ELSE
input_cost_per_million := 1.25;
output_cost_per_million := 10.00;
END CASE;

total_cost_cents := 
((input_tokens - cached_tokens) * input_cost_per_million / 1000000.0 * 100)::integer +
(cached_tokens * input_cost_per_million * 0.5 / 1000000.0 * 100)::integer +
((output_tokens + reasoning_tokens) * output_cost_per_million / 1000000.0 * 100)::integer;

RETURN total_cost_cents;
END;
$$;


ALTER FUNCTION "public"."calculate_gpt5_cost"("model_variant" "text", "input_tokens" integer, "output_tokens" integer, "reasoning_tokens" integer, "cached_tokens" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_api_rate_limit"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_max_requests integer;
  v_current_requests integer;
BEGIN
  -- Get max requests from settings
  SELECT max_api_requests_per_day INTO v_max_requests
  FROM settings
  WHERE id = 1;
  
  -- Default to 1000 if not set
  v_max_requests := COALESCE(v_max_requests, 1000);
  
  -- Count requests in the last 24 hours
  SELECT COUNT(*) INTO v_current_requests
  FROM api_usage
  WHERE user_id = p_user_id
    AND created_at > now() - interval '24 hours';
  
  -- Return true if user is within limits
  RETURN v_current_requests < v_max_requests;
END;
$$;


ALTER FUNCTION "public"."check_api_rate_limit"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("ip" "inet", "endpoint_path" "text", "max_requests" integer DEFAULT 100, "window_minutes" integer DEFAULT 60) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
request_count integer;
window_start timestamptz;
BEGIN
window_start := now() - (window_minutes || ' minutes')::interval;

SELECT count(*)
INTO request_count
FROM public.rate_limit_logs
WHERE ip_address = host(ip)::text
AND endpoint = endpoint_path
AND created_at >= window_start;

IF request_count >= max_requests THEN
RETURN false;
END IF;

INSERT INTO public.rate_limit_logs (ip_address, endpoint)
VALUES (host(ip)::text, endpoint_path);

RETURN true;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("ip" "inet", "endpoint_path" "text", "max_requests" integer, "window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("user_ip" "text", "endpoint_path" "text", "max_requests" integer DEFAULT 100, "window_minutes" integer DEFAULT 60) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
request_count integer;
window_start timestamptz;
BEGIN
window_start := now() - (window_minutes || ' minutes')::interval;

SELECT count(*)
INTO request_count
FROM public.rate_limit_logs
WHERE ip_address = user_ip
AND endpoint = endpoint_path
AND created_at >= window_start;

IF request_count >= max_requests THEN
RETURN false;
END IF;

INSERT INTO public.rate_limit_logs (ip_address, endpoint)
VALUES (user_ip, endpoint_path);

RETURN true;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("user_ip" "text", "endpoint_path" "text", "max_requests" integer, "window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_blacklist"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
DELETE FROM public.ip_blacklist
WHERE expires_at IS NOT NULL
AND expires_at < now();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_blacklist"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_cache"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
deleted_count INTEGER;
BEGIN
DELETE FROM cached_ai_responses 
WHERE expires_at < now();

GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_context"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
DELETE FROM public.ai_context_state
WHERE expires_at < now();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_snapshots"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
UPDATE public.ai_undo_snapshots
SET can_restore = false
WHERE can_restore = true
AND expires_at < now();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_snapshots"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_rate_limit_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
DELETE FROM public.rate_limit_logs
WHERE created_at < now() - interval '7 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_rate_limit_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_api_key"("p_key_name" "text", "p_permissions" "text"[], "p_expires_days" integer DEFAULT 90) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_key_value text;
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create an API key';
  END IF;
  
  -- Generate the key
  v_key_value := generate_api_key();
  
  -- Calculate expiration date
  INSERT INTO api_keys (
    user_id,
    key_name,
    key_value,
    permissions,
    expires_at
  )
  VALUES (
    v_user_id,
    p_key_name,
    v_key_value,
    p_permissions,
    CASE WHEN p_expires_days > 0 THEN
      now() + (p_expires_days || ' days')::interval
    ELSE
      NULL
    END
  )
  RETURNING id, key_name, key_value, permissions, expires_at
  INTO v_result;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."create_api_key"("p_key_name" "text", "p_permissions" "text"[], "p_expires_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_ai_permissions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
INSERT INTO public.ai_user_permissions (user_id, automation_level)
VALUES (NEW.id, 'confirm_destructive')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_ai_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_deal_stages"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO deal_stages (customer_id, name, stage_order, default_probability, color)
  VALUES 
    (NEW.id, 'Lead', 1, 10, '#ef4444'),
    (NEW.id, 'Qualified', 2, 25, '#f59e0b'),
    (NEW.id, 'Proposal', 3, 50, '#3b82f6'),
    (NEW.id, 'Negotiation', 4, 75, '#8b5cf6'),
    (NEW.id, 'Closed Won', 5, 100, '#10b981'),
    (NEW.id, 'Closed Lost', 6, 0, '#6b7280');
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_deal_stages"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_pending_actions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
UPDATE public.ai_pending_actions
SET status = 'expired',
updated_at = now()
WHERE status = 'pending'
AND expires_at < now();
END;
$$;


ALTER FUNCTION "public"."expire_pending_actions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."export_user_data"("target_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
user_data jsonb;
BEGIN
IF target_user_id != auth.uid() THEN
RAISE EXCEPTION 'Unauthorized';
END IF;

SELECT jsonb_build_object(
'profile', (SELECT to_jsonb(p.*) FROM public.profiles p WHERE p.id = target_user_id),
'generated_content', (SELECT jsonb_agg(gc.*) FROM public.generated_content gc WHERE gc.user_id = target_user_id),
'campaigns', (SELECT jsonb_agg(c.*) FROM public.campaigns c WHERE c.user_id = target_user_id)
) INTO user_data;

RETURN user_data;
END;
$$;


ALTER FUNCTION "public"."export_user_data"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_api_key"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  key_value text;
BEGIN
  -- Generate a random UUID and encode it as base64
  key_value := encode(gen_random_bytes(24), 'base64');
  -- Replace any non-alphanumeric characters
  key_value := replace(replace(replace(key_value, '/', '_'), '+', '-'), '=', '');
  -- Add a prefix for easy identification
  key_value := 'insightai_' || key_value;
  
  RETURN key_value;
END;
$$;


ALTER FUNCTION "public"."generate_api_key"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_popular_content_types"("limit_param" integer DEFAULT 10, "category_filter" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "name" "text", "category" "text", "usage_count" bigint, "unique_users" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF category_filter IS NULL THEN
    RETURN QUERY
    SELECT 
      ct.id, 
      ct.name, 
      ct.category, 
      COUNT(gc.id) AS usage_count,
      COUNT(DISTINCT gc.user_id) AS unique_users
    FROM content_types ct
    LEFT JOIN generated_content gc ON ct.id = gc.content_type_id
    GROUP BY ct.id, ct.name, ct.category
    ORDER BY COUNT(gc.id) DESC
    LIMIT limit_param;
  ELSE
    RETURN QUERY
    SELECT 
      ct.id, 
      ct.name, 
      ct.category, 
      COUNT(gc.id) AS usage_count,
      COUNT(DISTINCT gc.user_id) AS unique_users
    FROM content_types ct
    LEFT JOIN generated_content gc ON ct.id = gc.content_type_id
    WHERE ct.category = category_filter
    GROUP BY ct.id, ct.name, ct.category
    ORDER BY COUNT(gc.id) DESC
    LIMIT limit_param;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_popular_content_types"("limit_param" integer, "category_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_published_funnel"("funnel_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
result jsonb;
BEGIN
SELECT to_jsonb(pf.*)
INTO result
FROM public.published_funnels pf
WHERE pf.slug = funnel_slug
AND pf.is_active = true;

RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_published_funnel"("funnel_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_action_counts"("user_id_param" "uuid", "time_filter" "text" DEFAULT NULL::"text") RETURNS TABLE("action" "text", "count" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF time_filter IS NULL THEN
    RETURN QUERY
    SELECT ul.action, COUNT(*) as count
    FROM usage_logs ul
    WHERE ul.user_id = user_id_param
    GROUP BY ul.action
    ORDER BY count DESC;
  ELSE
    RETURN QUERY
    SELECT ul.action, COUNT(*) as count
    FROM usage_logs ul
    WHERE ul.user_id = user_id_param
      AND ul.created_at >= NOW() - time_filter::INTERVAL
    GROUP BY ul.action
    ORDER BY count DESC;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_user_action_counts"("user_id_param" "uuid", "time_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_analytics_data"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result jsonb;
  v_users_data jsonb;
  v_revenue_data jsonb;
  v_engagement_data jsonb;
  v_conversion_data jsonb;
BEGIN
  -- Get users data
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT value FROM user_analytics
                      WHERE user_id = p_user_id AND metric_type = 'users'
                      ORDER BY date_recorded DESC LIMIT 1), 0),
    'change', COALESCE((SELECT change_percentage FROM user_analytics
                       WHERE user_id = p_user_id AND metric_type = 'users'
                       ORDER BY date_recorded DESC LIMIT 1), 0),
    'timeData', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date_value,
          'value', value,
          'avatar', metadata->>'avatar',
          'name', metadata->>'name',
          'company', metadata->>'company'
        )
      )
      FROM analytics_time_series
      WHERE user_id = p_user_id AND metric_type = 'users'
      ORDER BY date_value DESC
      LIMIT 6
    ), '[]'::jsonb)
  ) INTO v_users_data;

  -- Get revenue data
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT value FROM user_analytics
                      WHERE user_id = p_user_id AND metric_type = 'revenue'
                      ORDER BY date_recorded DESC LIMIT 1), 0),
    'change', COALESCE((SELECT change_percentage FROM user_analytics
                       WHERE user_id = p_user_id AND metric_type = 'revenue'
                       ORDER BY date_recorded DESC LIMIT 1), 0),
    'timeData', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date_value,
          'value', value,
          'avatar', metadata->>'avatar',
          'name', metadata->>'name',
          'company', metadata->>'company'
        )
      )
      FROM analytics_time_series
      WHERE user_id = p_user_id AND metric_type = 'revenue'
      ORDER BY date_value DESC
      LIMIT 6
    ), '[]'::jsonb)
  ) INTO v_revenue_data;

  -- Get engagement data
  SELECT jsonb_build_object(
    'avgSessionMinutes', COALESCE((SELECT value FROM user_analytics
                                  WHERE user_id = p_user_id AND metric_type = 'engagement'
                                  ORDER BY date_recorded DESC LIMIT 1), 0),
    'change', COALESCE((SELECT change_percentage FROM user_analytics
                       WHERE user_id = p_user_id AND metric_type = 'engagement'
                       ORDER BY date_recorded DESC LIMIT 1), 0),
    'categoryData', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'category', category,
          'percentage', percentage,
          'avatar', null,
          'name', null,
          'company', null
        )
      )
      FROM engagement_categories
      WHERE user_id = p_user_id
      ORDER BY percentage DESC
    ), '[]'::jsonb)
  ) INTO v_engagement_data;

  -- Get conversion data
  SELECT jsonb_build_object(
    'rate', COALESCE((SELECT value FROM user_analytics
                     WHERE user_id = p_user_id AND metric_type = 'conversion'
                     ORDER BY date_recorded DESC LIMIT 1), 0),
    'change', COALESCE((SELECT change_percentage FROM user_analytics
                       WHERE user_id = p_user_id AND metric_type = 'conversion'
                       ORDER BY date_recorded DESC LIMIT 1), 0),
    'funnelData', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'stage', stage,
          'count', count,
          'avatar', null,
          'name', null,
          'company', null
        )
      )
      FROM conversion_funnel
      WHERE user_id = p_user_id
      ORDER BY count DESC
    ), '[]'::jsonb)
  ) INTO v_conversion_data;

  -- Combine all data
  v_result := jsonb_build_object(
    'users', v_users_data,
    'revenue', v_revenue_data,
    'engagement', v_engagement_data,
    'conversion', v_conversion_data
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_analytics_data"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
BEGIN
  user_email := NEW.email;
  
  IF user_email IN ('dean@videoremix.io', 'victor@videoremix.io', 'samuel@videoremix.io', 'jvzoo@gmail.com') THEN
    user_role := 'super_admin';
  ELSE
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'regular_user');
  END IF;
  
  INSERT INTO public.profiles (
    id, username, first_name, last_name, role, avatar_url,
    app_context, email_template_set, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'app_context', 'smartcrm'),
    COALESCE(NEW.raw_user_meta_data->>'email_template_set', 'smartcrm'),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_sample_analytics_data"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Insert current metrics
  INSERT INTO user_analytics (user_id, metric_type, value, change_percentage, date_recorded)
  VALUES
    (p_user_id, 'users', 12458, 12.3, CURRENT_DATE),
    (p_user_id, 'revenue', 85670, 8.7, CURRENT_DATE),
    (p_user_id, 'engagement', 18, -2.3, CURRENT_DATE),
    (p_user_id, 'conversion', 3.8, 0.5, CURRENT_DATE);

  -- Insert time series data for users
  INSERT INTO analytics_time_series (user_id, metric_type, date_value, value, metadata)
  SELECT
    p_user_id,
    'users',
    CURRENT_DATE - (i || ' days')::interval,
    9500 + (i * 600),
    jsonb_build_object(
      'avatar', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      'name', 'Sample User ' || i,
      'company', 'Sample Company ' || i
    )
  FROM generate_series(0, 5) AS i;

  -- Insert time series data for revenue
  INSERT INTO analytics_time_series (user_id, metric_type, date_value, value, metadata)
  SELECT
    p_user_id,
    'revenue',
    CURRENT_DATE - (i || ' days')::interval,
    65000 + (i * 4000),
    jsonb_build_object(
      'avatar', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      'name', 'Sample User ' || i,
      'company', 'Sample Company ' || i
    )
  FROM generate_series(0, 5) AS i;

  -- Insert engagement categories
  INSERT INTO engagement_categories (user_id, category, percentage)
  VALUES
    (p_user_id, 'Dashboard', 45),
    (p_user_id, 'Reports', 25),
    (p_user_id, 'Settings', 10),
    (p_user_id, 'Profile', 20);

  -- Insert conversion funnel
  INSERT INTO conversion_funnel (user_id, stage, count)
  VALUES
    (p_user_id, 'Visit', 100000),
    (p_user_id, 'Signup', 25000),
    (p_user_id, 'Trial', 8000),
    (p_user_id, 'Purchase', 3800);
END;
$$;


ALTER FUNCTION "public"."insert_sample_analytics_data"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  is_admin_user BOOLEAN := FALSE;
BEGIN
  -- Check if user_roles table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    -- Check if user has admin role in user_roles table
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = $1 AND role = 'admin'
    ) INTO is_admin_user;
  END IF;
  
  -- If not found in user_roles, check app_metadata
  IF NOT is_admin_user THEN
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = $1 AND raw_app_meta_data->>'role' = 'admin'
    ) INTO is_admin_user;
  END IF;
  
  RETURN is_admin_user;
END;
$_$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_action"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_admin_action"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_api_access"("p_api_key_id" "uuid", "p_user_id" "uuid", "p_endpoint" "text", "p_method" "text", "p_ip_address" "text", "p_user_agent" "text", "p_status_code" integer, "p_response_time" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO api_access_logs (
    api_key_id,
    user_id,
    endpoint,
    method,
    ip_address,
    user_agent,
    status_code,
    response_time
  )
  VALUES (
    p_api_key_id,
    p_user_id,
    p_endpoint,
    p_method,
    p_ip_address,
    p_user_agent,
    p_status_code,
    p_response_time
  );
END;
$$;


ALTER FUNCTION "public"."log_api_access"("p_api_key_id" "uuid", "p_user_id" "uuid", "p_endpoint" "text", "p_method" "text", "p_ip_address" "text", "p_user_agent" "text", "p_status_code" integer, "p_response_time" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_api_request"("p_user_id" "uuid", "p_request_type" "text", "p_provider" "text", "p_model" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT 'success'::"text", "p_request_path" "text" DEFAULT NULL::"text", "p_request_body" "jsonb" DEFAULT NULL::"jsonb", "p_response_status" integer DEFAULT NULL::integer, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO api_usage (
    user_id,
    request_type,
    provider,
    model,
    status,
    request_path,
    request_body,
    response_status,
    error_message
  ) VALUES (
    p_user_id,
    p_request_type,
    p_provider,
    p_model,
    p_status,
    p_request_path,
    p_request_body,
    p_response_status,
    p_error_message
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."log_api_request"("p_user_id" "uuid", "p_request_type" "text", "p_provider" "text", "p_model" "text", "p_status" "text", "p_request_path" "text", "p_request_body" "jsonb", "p_response_status" integer, "p_error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_import"("p_user_id" "uuid", "p_entity_type" "text", "p_filename" "text", "p_record_count" integer, "p_successful_count" integer, "p_failed_count" integer, "p_error_details" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_import_id UUID;
BEGIN
  INSERT INTO public.import_logs (
    user_id, 
    entity_type, 
    filename, 
    record_count, 
    successful_count, 
    failed_count, 
    error_details
  ) 
  VALUES (
    p_user_id, 
    p_entity_type, 
    p_filename, 
    p_record_count, 
    p_successful_count, 
    p_failed_count, 
    p_error_details
  )
  RETURNING id INTO v_import_id;
  
  RETURN v_import_id;
END;
$$;


ALTER FUNCTION "public"."log_import"("p_user_id" "uuid", "p_entity_type" "text", "p_filename" "text", "p_record_count" integer, "p_successful_count" integer, "p_failed_count" integer, "p_error_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_response_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
IF OLD.status IS DISTINCT FROM NEW.status THEN
INSERT INTO response_activities (
response_id,
user_id,
activity_type,
description,
metadata
) VALUES (
NEW.id,
auth.uid(),
'status_changed',
'Status changed from ' || OLD.status || ' to ' || NEW.status,
jsonb_build_object(
'old_status', OLD.status,
'new_status', NEW.status
)
);
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_response_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("event_type" "text", "event_details" "jsonb", "user_ip" "text" DEFAULT NULL::"text", "target_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
event_id uuid;
BEGIN
INSERT INTO public.security_events (
event_type,
details,
ip_address,
user_id
)
VALUES (
event_type,
event_details,
user_ip,
COALESCE(target_user_id, auth.uid())
)
RETURNING id INTO event_id;

RETURN event_id;
END;
$$;


ALTER FUNCTION "public"."log_security_event"("event_type" "text", "event_details" "jsonb", "user_ip" "text", "target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("event_type_param" "text", "ip_param" "inet", "user_id_param" "uuid", "endpoint_param" "text", "details_param" "jsonb", "severity_param" "text" DEFAULT 'info'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
event_id uuid;
BEGIN
INSERT INTO public.security_events (
event_type,
ip_address,
user_id,
endpoint,
details,
severity
)
VALUES (
event_type_param,
host(ip_param)::text,
user_id_param,
endpoint_param,
details_param,
severity_param
)
RETURNING id INTO event_id;

RETURN event_id;
END;
$$;


ALTER FUNCTION "public"."log_security_event"("event_type_param" "text", "ip_param" "inet", "user_id_param" "uuid", "endpoint_param" "text", "details_param" "jsonb", "severity_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_all_materialized_views"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  view_count INTEGER := 0;
  view_record RECORD;
BEGIN
  FOR view_record IN 
    SELECT matviewname 
    FROM pg_matviews 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'REFRESH MATERIALIZED VIEW ' || view_record.matviewname;
    view_count := view_count + 1;
  END LOOP;
  
  RETURN view_count;
END;
$$;


ALTER FUNCTION "public"."refresh_all_materialized_views"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_analytics_views"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'contact_performance_summary') THEN
REFRESH MATERIALIZED VIEW CONCURRENTLY contact_performance_summary;
END IF;

IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'deal_pipeline_summary') THEN
REFRESH MATERIALIZED VIEW CONCURRENTLY deal_pipeline_summary;
END IF;
END;
$$;


ALTER FUNCTION "public"."refresh_analytics_views"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_tenant_claims"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  is_primary boolean;
BEGIN
  -- Check if this is the primary tenant for the user
  SELECT EXISTS (
    SELECT 1 FROM user_tenant_roles 
    WHERE user_id = NEW.user_id 
    AND is_primary = true
    AND tenant_id = NEW.tenant_id
  ) INTO is_primary;

  -- If primary, update JWT claims to include tenant_id
  IF is_primary THEN
    -- Update auth.users to set the tenant_id in the JWT claims
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('tenant_id', NEW.tenant_id)
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_tenant_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end; $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE PROCEDURE "public"."sp_get_import_status"(IN "p_upload_id" "text", OUT "p_status" "json")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_log record;
  v_success_items json;
  v_error_items json;
BEGIN
  -- Get the log entry
  SELECT * INTO v_log
  FROM user_upload_logs
  WHERE upload_id = p_upload_id;
  
  IF NOT FOUND THEN
    p_status := json_build_object(
      'success', false,
      'message', 'Import not found',
      'upload_id', p_upload_id
    );
    RETURN;
  END IF;
  
  -- Get success items
  SELECT json_agg(json_build_object(
    'email', email,
    'full_name', full_name,
    'username', username,
    'processed_at', processed_at
  ))
  INTO v_success_items
  FROM user_import_staging
  WHERE status = 'success'
    AND created_by = v_log.user_id
    AND processed_at >= v_log.created_at - interval '1 hour'
    AND processed_at <= v_log.created_at + interval '1 hour'
  LIMIT 100;  -- Limit to prevent large result sets
  
  -- Get error items
  SELECT json_agg(json_build_object(
    'email', email,
    'error_message', error_message,
    'processed_at', processed_at
  ))
  INTO v_error_items
  FROM user_import_staging
  WHERE status = 'error'
    AND created_by = v_log.user_id
    AND processed_at >= v_log.created_at - interval '1 hour'
    AND processed_at <= v_log.created_at + interval '1 hour'
  LIMIT 100;  -- Limit to prevent large result sets
  
  -- Return status
  p_status := json_build_object(
    'success', true,
    'message', format('Processed %s users: %s succeeded, %s failed', 
                      v_log.users_count, v_log.success_count, v_log.error_count),
    'upload_id', p_upload_id,
    'users_processed', v_log.users_count,
    'users_succeeded', v_log.success_count,
    'users_failed', v_log.error_count,
    'created_at', v_log.created_at,
    'filename', v_log.filename,
    'details', v_log.details,
    'success_items', COALESCE(v_success_items, '[]'::json),
    'error_items', COALESCE(v_error_items, '[]'::json)
  );
END;
$$;


ALTER PROCEDURE "public"."sp_get_import_status"(IN "p_upload_id" "text", OUT "p_status" "json") OWNER TO "postgres";


COMMENT ON PROCEDURE "public"."sp_get_import_status"(IN "p_upload_id" "text", OUT "p_status" "json") IS '
Example usage:

```sql
CALL sp_get_import_status(
''import_123abc456def'',  -- Replace with your import ID
NULL
);
```
';



CREATE PROCEDURE "public"."sp_import_users_from_csv"(IN "p_csv_content" "text", IN "p_admin_user_id" "uuid", OUT "p_result" "json")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  p_result := process_user_import(p_csv_content, p_admin_user_id);
END;
$$;


ALTER PROCEDURE "public"."sp_import_users_from_csv"(IN "p_csv_content" "text", IN "p_admin_user_id" "uuid", OUT "p_result" "json") OWNER TO "postgres";


COMMENT ON PROCEDURE "public"."sp_import_users_from_csv"(IN "p_csv_content" "text", IN "p_admin_user_id" "uuid", OUT "p_result" "json") IS '
Example usage:

```sql
CALL sp_import_users_from_csv(
$$email,full_name,username
user1@example.com,John Smith,johnsmith
user2@example.com,Jane Doe,janedoe
user3@example.com,Bob Johnson,bjohnson$$,
''YOUR-ADMIN-USER-ID-HERE''::uuid,
NULL
);
```
';



CREATE OR REPLACE FUNCTION "public"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT auth.uid();
$$;


ALTER FUNCTION "public"."uid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_models_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_models_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_app_content_metadata_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_app_content_metadata_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_app_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_app_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_billing_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_billing_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_contexts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_contexts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_dashboard_layouts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_dashboard_layouts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_demo_apps_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_demo_apps_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_enhanced_task_executions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_enhanced_task_executions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_funnel_responses_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_funnel_responses_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_funnel_sessions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_funnel_sessions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_model_metrics"("p_model_name" "text", "p_task_type" "text", "p_response_time_ms" integer, "p_tokens_used" integer, "p_cost_cents" integer, "p_success" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
metric_record model_performance_metrics;
period_start_time timestamptz;
period_end_time timestamptz;
BEGIN
period_start_time := date_trunc('hour', now());
period_end_time := period_start_time + interval '1 hour';

SELECT * INTO metric_record
FROM model_performance_metrics
WHERE model_name = p_model_name
AND task_type = p_task_type
AND period_start = period_start_time;

IF FOUND THEN
UPDATE model_performance_metrics
SET 
avg_response_time_ms = ((avg_response_time_ms * total_requests) + p_response_time_ms) / (total_requests + 1),
avg_tokens_used = ((avg_tokens_used * total_requests) + p_tokens_used) / (total_requests + 1),
avg_cost_cents = ((avg_cost_cents * total_requests) + p_cost_cents) / (total_requests + 1),
success_rate = ((success_rate * total_requests) + CASE WHEN p_success THEN 100.0 ELSE 0.0 END) / (total_requests + 1),
total_requests = total_requests + 1,
updated_at = now()
WHERE id = metric_record.id;
ELSE
INSERT INTO model_performance_metrics (
model_name,
task_type,
avg_response_time_ms,
avg_tokens_used,
avg_cost_cents,
success_rate,
total_requests,
period_start,
period_end
) VALUES (
p_model_name,
p_task_type,
p_response_time_ms,
p_tokens_used,
p_cost_cents,
CASE WHEN p_success THEN 100.0 ELSE 0.0 END,
1,
period_start_time,
period_end_time
);
END IF;
END;
$$;


ALTER FUNCTION "public"."update_model_metrics"("p_model_name" "text", "p_task_type" "text", "p_response_time_ms" integer, "p_tokens_used" integer, "p_cost_cents" integer, "p_success" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_personalized_goal_recommendations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_personalized_goal_recommendations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_analyses_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_product_analyses_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_storage_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Update user storage usage when files are added or removed
  -- This is a simplified example - in practice you would compute actual file sizes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO storage_usage (user_id, bucket_id, total_size, file_count)
    VALUES (NEW.owner, NEW.bucket_id, COALESCE(NEW.metadata->>'size', '0')::bigint, 1)
    ON CONFLICT (user_id, bucket_id) DO UPDATE
    SET total_size = storage_usage.total_size + COALESCE(NEW.metadata->>'size', '0')::bigint,
        file_count = storage_usage.file_count + 1,
        last_updated = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE storage_usage
    SET total_size = greatest(0, total_size - COALESCE(OLD.metadata->>'size', '0')::bigint),
        file_count = greatest(0, file_count - 1),
        last_updated = now()
    WHERE user_id = OLD.owner AND bucket_id = OLD.bucket_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_storage_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_business_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_business_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_view_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_view_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_api_key"("p_api_key" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Return the user ID associated with the API key if valid
  -- Also update the last_used_at timestamp
  UPDATE api_keys
  SET last_used_at = now()
  WHERE key = p_api_key
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING user_id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;


ALTER FUNCTION "public"."validate_api_key"("p_api_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_api_key"("p_key_value" "text", "p_required_permission" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_key_record api_keys%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Look up the key
  SELECT * INTO v_key_record
  FROM api_keys
  WHERE key_value = p_key_value;
  
  -- Check if key exists
  IF v_key_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'invalid_key'
    );
  END IF;
  
  -- Check if key has expired
  IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'expired_key'
    );
  END IF;
  
  -- Check if key has the required permission
  IF p_required_permission IS NOT NULL AND NOT (p_required_permission = ANY(v_key_record.permissions)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'insufficient_permissions'
    );
  END IF;
  
  -- Update last used timestamp
  UPDATE api_keys
  SET last_used_at = now()
  WHERE id = v_key_record.id;
  
  -- Record is valid
  RETURN jsonb_build_object(
    'valid', true,
    'user_id', v_key_record.user_id,
    'permissions', v_key_record.permissions,
    'key_name', v_key_record.key_name
  );
END;
$$;


ALTER FUNCTION "public"."validate_api_key"("p_key_value" "text", "p_required_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_contact_import_data"("data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  is_valid BOOLEAN := TRUE;
BEGIN
  -- Check required fields (name)
  IF NOT (data ? 'name') THEN
    is_valid := FALSE;
  END IF;
  
  -- Check email format if provided
  IF data->>'email' IS NOT NULL AND data->>'email' !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    is_valid := FALSE;
  END IF;
  
  RETURN is_valid;
END;
$_$;


ALTER FUNCTION "public"."validate_contact_import_data"("data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_deal_import_data"("data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  is_valid BOOLEAN := TRUE;
  valid_stages TEXT[] := ARRAY['qualification', 'initial', 'negotiation', 'proposal', 'closed-won', 'closed-lost'];
BEGIN
  -- Check required fields (title, value)
  IF NOT (data ? 'title' AND data ? 'value') THEN
    is_valid := FALSE;
  END IF;
  
  -- Check value is numeric
  BEGIN
    IF data->>'value' IS NOT NULL THEN
      PERFORM data->>'value'::NUMERIC;
    END IF;
  EXCEPTION WHEN others THEN
    is_valid := FALSE;
  END;
  
  -- Check stage is valid
  IF data->>'stage' IS NOT NULL AND NOT (data->>'stage' = ANY(valid_stages)) THEN
    is_valid := FALSE;
  END IF;
  
  RETURN is_valid;
END;
$$;


ALTER FUNCTION "public"."validate_deal_import_data"("data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_jwt_token"("p_token" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- This is a placeholder. In Supabase, JWT validation is handled by the auth API
  -- This function would normally use the auth.uid() function or similar
  -- For custom JWT validation, you'd need to implement JWT verification logic here
  
  RETURN auth.uid();
END;
$$;


ALTER FUNCTION "public"."validate_jwt_token"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_user_import_data"("data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  is_valid BOOLEAN := TRUE;
BEGIN
  -- Check required fields (email and password)
  IF NOT (data ? 'email' AND data ? 'password') THEN
    is_valid := FALSE;
  END IF;
  
  -- Check email format
  IF data->>'email' IS NOT NULL AND data->>'email' !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    is_valid := FALSE;
  END IF;
  
  -- Check password length
  IF data->>'password' IS NOT NULL AND length(data->>'password') < 8 THEN
    is_valid := FALSE;
  END IF;
  
  RETURN is_valid;
END;
$_$;


ALTER FUNCTION "public"."validate_user_import_data"("data" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "points" integer DEFAULT 0,
    "rarity" "text" DEFAULT 'common'::"text",
    "category" "text" DEFAULT 'sales'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "achievements_category_check" CHECK (("category" = ANY (ARRAY['sales'::"text", 'engagement'::"text", 'growth'::"text", 'teamwork'::"text"]))),
    CONSTRAINT "achievements_rarity_check" CHECK (("rarity" = ANY (ARRAY['common'::"text", 'rare'::"text", 'epic'::"text", 'legendary'::"text"])))
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


COMMENT ON TABLE "public"."achievements" IS 'Gamification achievements that users can unlock';



CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid",
    "action" character varying(255) NOT NULL,
    "resource_type" character varying(100) NOT NULL,
    "resource_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "role" character varying(50) DEFAULT 'admin'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_overview" WITH ("security_invoker"='true') AS
 SELECT "au"."id",
    "au"."email",
    "au"."role",
    "au"."is_active",
    "au"."permissions",
    "au"."created_at",
    "au"."last_login",
    "count"("al"."id") AS "audit_count",
    "max"("al"."created_at") AS "last_audit_at"
   FROM ("public"."admin_users" "au"
     LEFT JOIN "public"."admin_audit_log" "al" ON (("au"."id" = "al"."admin_user_id")))
  GROUP BY "au"."id", "au"."email", "au"."role", "au"."is_active", "au"."permissions", "au"."created_at", "au"."last_login"
  ORDER BY "au"."created_at" DESC;


ALTER TABLE "public"."admin_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_coordination_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_execution_id" "uuid",
    "event_type" "text" NOT NULL,
    "agent_name" "text" NOT NULL,
    "event_description" "text" NOT NULL,
    "coordination_data" "jsonb" DEFAULT '{}'::"jsonb",
    "gpt5_reasoning" "text",
    "business_impact" "text",
    "tools_involved" "text"[] DEFAULT ARRAY[]::"text"[],
    "execution_time_ms" integer,
    "confidence_score" numeric(3,2),
    "timestamp" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_coordination_events_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric))),
    CONSTRAINT "agent_coordination_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['coordination'::"text", 'execution'::"text", 'completion'::"text", 'error'::"text", 'optimization'::"text"])))
);


ALTER TABLE "public"."agent_coordination_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_coordination_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_execution_id" "uuid",
    "coordination_type" "text" NOT NULL,
    "gpt5_decision_reasoning" "text" NOT NULL,
    "input_context" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output_decision" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "agents_involved" "text"[] DEFAULT ARRAY[]::"text"[],
    "execution_time_ms" integer,
    "confidence_score" numeric(3,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_coordination_logs_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric))),
    CONSTRAINT "agent_coordination_logs_coordination_type_check" CHECK (("coordination_type" = ANY (ARRAY['planning'::"text", 'execution'::"text", 'error_recovery'::"text", 'optimization'::"text"])))
);


ALTER TABLE "public"."agent_coordination_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "tools" "jsonb" NOT NULL,
    "steps" "jsonb" NOT NULL,
    "llm" "text",
    "uses_crm" boolean,
    "crm_method" "text"
);


ALTER TABLE "public"."agent_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_task_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_execution_id" "uuid",
    "agent_name" "text" NOT NULL,
    "step_number" integer NOT NULL,
    "action_description" "text" NOT NULL,
    "tools_used" "text"[] DEFAULT ARRAY[]::"text"[],
    "input_parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "execution_start" timestamp with time zone DEFAULT "now"(),
    "execution_end" timestamp with time zone,
    "execution_time_seconds" integer,
    "success" boolean DEFAULT true,
    "result_data" "jsonb" DEFAULT '{}'::"jsonb",
    "gpt5_reasoning" "text",
    "error_message" "text",
    "crm_changes" "jsonb" DEFAULT '{}'::"jsonb",
    "business_value_generated" numeric(12,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_task_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_automation_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "last_run" timestamp with time zone,
    "next_run" timestamp with time zone,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "results" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_automation_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_context_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "session_id" "text" NOT NULL,
    "current_funnel_id" "uuid",
    "current_step_id" "uuid",
    "workspace_state" "jsonb" DEFAULT '{}'::"jsonb",
    "entity_references" "jsonb" DEFAULT '{}'::"jsonb",
    "conversation_memory" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "last_action" "text",
    "last_action_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_context_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_enrichment_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "ai_provider" "text" NOT NULL,
    "enrichment_type" "text" NOT NULL,
    "confidence_score" numeric(3,2) DEFAULT NULL::numeric,
    "data" "jsonb" NOT NULL,
    "tokens_used" integer,
    "cost" numeric(10,4) DEFAULT NULL::numeric,
    "processing_time" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    CONSTRAINT "ai_enrichment_history_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['contact'::"text", 'deal'::"text"])))
);


ALTER TABLE "public"."ai_enrichment_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_enrichment_history" IS 'Audit trail of all AI enrichments performed';



CREATE TABLE IF NOT EXISTS "public"."ai_execution_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "function_call_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "operation_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "before_snapshot" "jsonb",
    "after_snapshot" "jsonb",
    "changes_summary" "jsonb",
    "rollback_data" "jsonb",
    "can_undo" boolean DEFAULT true,
    "undo_expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_execution_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_function_calls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "session_id" "text" NOT NULL,
    "function_name" "text" NOT NULL,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "result" "jsonb",
    "status" "text" NOT NULL,
    "error_message" "text",
    "execution_time_ms" integer,
    "cost_cents" integer DEFAULT 0,
    "danger_level" "text" NOT NULL,
    "requires_confirmation" boolean DEFAULT false,
    "confirmed_at" timestamp with time zone,
    "executed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_function_calls_danger_level_check" CHECK (("danger_level" = ANY (ARRAY['safe'::"text", 'caution'::"text", 'destructive'::"text"]))),
    CONSTRAINT "ai_function_calls_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'executing'::"text", 'success'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."ai_function_calls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "content_type" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "result" "jsonb" NOT NULL,
    "model" "text" NOT NULL,
    "cost" numeric(10,6),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reasoning_data" "jsonb",
    "tool_calls" "jsonb",
    "model_variant" "text",
    "verbosity" "text" DEFAULT 'medium'::"text",
    "reasoning_effort" "text" DEFAULT 'medium'::"text",
    "streaming_enabled" boolean DEFAULT false,
    "cost_cents" integer DEFAULT 0,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "reasoning_tokens" integer DEFAULT 0,
    "cached_tokens" integer DEFAULT 0
);


ALTER TABLE "public"."ai_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "type" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "is_applied" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_insights_enhanced" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "insight_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "confidence_score" numeric(5,2),
    "data_sources" "text"[],
    "relevance_score" numeric(5,2),
    "actionable_recommendations" "text"[],
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_insights_enhanced_insight_type_check" CHECK (("insight_type" = ANY (ARRAY['business'::"text", 'performance'::"text", 'optimization'::"text", 'prediction'::"text", 'trend'::"text"])))
);


ALTER TABLE "public"."ai_insights_enhanced" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_model_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "preferred_model" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_model_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_models" (
    "id" "text" NOT NULL,
    "provider" "public"."llm_type_enum" NOT NULL,
    "model_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "endpoint_url" "text",
    "pricing" "jsonb",
    "capabilities" "text"[] DEFAULT '{}'::"text"[],
    "context_window" integer DEFAULT 8192 NOT NULL,
    "max_tokens" integer DEFAULT 4096 NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_recommended" boolean DEFAULT false,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_pending_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "function_call_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "action_type" "text" NOT NULL,
    "action_description" "text" NOT NULL,
    "preview_data" "jsonb",
    "status" "text" NOT NULL,
    "approved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '01:00:00'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_pending_actions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."ai_pending_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "prompt" "text" NOT NULL,
    "category" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_undo_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "execution_history_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "snapshot_data" "jsonb" NOT NULL,
    "operation_description" "text" NOT NULL,
    "can_restore" boolean DEFAULT true,
    "restored_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_undo_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "user_id" "uuid",
    "model_id" "text",
    "feature_used" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "cost" numeric(10,6) DEFAULT 0,
    "response_time_ms" integer DEFAULT 0,
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "model_variant" "text",
    "reasoning_tokens" integer DEFAULT 0,
    "cached_tokens" integer DEFAULT 0,
    "streaming_enabled" boolean DEFAULT false
);


ALTER TABLE "public"."ai_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_date" "date" NOT NULL,
    "ai_provider" "text" NOT NULL,
    "model_name" "text" NOT NULL,
    "total_requests" integer DEFAULT 0,
    "successful_requests" integer DEFAULT 0,
    "failed_requests" integer DEFAULT 0,
    "total_tokens" integer DEFAULT 0,
    "total_cost" numeric(10,4) DEFAULT 0,
    "avg_response_time" integer DEFAULT 0,
    "cache_hits" integer DEFAULT 0,
    "cache_misses" integer DEFAULT 0,
    "enrichments_performed" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_usage_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_user_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "automation_level" "text" DEFAULT 'confirm_destructive'::"text" NOT NULL,
    "enabled_functions" "text"[] DEFAULT ARRAY[]::"text"[],
    "disabled_functions" "text"[] DEFAULT ARRAY[]::"text"[],
    "function_overrides" "jsonb" DEFAULT '{}'::"jsonb",
    "max_operations_per_hour" integer DEFAULT 100,
    "max_cost_per_day_cents" integer DEFAULT 1000,
    "allow_destructive_operations" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_user_permissions_automation_level_check" CHECK (("automation_level" = ANY (ARRAY['automatic'::"text", 'confirm_destructive'::"text", 'confirm_all'::"text"])))
);


ALTER TABLE "public"."ai_user_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "session_id" "text" NOT NULL,
    "workflow_type" "text" NOT NULL,
    "workflow_name" "text" NOT NULL,
    "total_steps" integer NOT NULL,
    "completed_steps" integer DEFAULT 0,
    "current_step" integer DEFAULT 0,
    "status" "text" NOT NULL,
    "function_call_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "workflow_state" "jsonb" DEFAULT '{}'::"jsonb",
    "checkpoints" "jsonb"[] DEFAULT ARRAY[]::"jsonb"[],
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_workflows_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'paused'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."ai_workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_time_series" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_type" "text" NOT NULL,
    "date_value" "date" NOT NULL,
    "value" numeric NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_time_series" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analyzed_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint,
    "analysis_results" "jsonb" NOT NULL,
    "extraction_method" "text" DEFAULT 'edge_function'::"text",
    "processing_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analyzed_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_access_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "api_key_id" "uuid",
    "user_id" "uuid",
    "endpoint" "text" NOT NULL,
    "method" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "status_code" integer,
    "response_time" integer,
    "accessed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_access_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "key_name" "text" NOT NULL,
    "key_value" "text" NOT NULL,
    "permissions" "text"[] NOT NULL,
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "endpoint" "text" NOT NULL,
    "method" "text" NOT NULL,
    "status_code" integer NOT NULL,
    "duration_ms" integer NOT NULL,
    "error_message" "text",
    "user_ip" "text",
    "user_agent" "text",
    "request_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."api_metrics" IS 'Tracks all API requests with performance metrics';



CREATE TABLE IF NOT EXISTS "public"."api_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "provider" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "cost_cents" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."api_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_access" (
    "customer_id" "uuid" NOT NULL,
    "app_id" "text" NOT NULL,
    "access_level" "text" DEFAULT 'standard'::"text",
    "is_active" boolean DEFAULT true,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb",
    "connection_details" "jsonb" DEFAULT '{}'::"jsonb",
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_content_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "file_path" "text" NOT NULL,
    "original_filename" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "bucket_name" "text" DEFAULT 'app-content'::"text" NOT NULL,
    "uploaded_by" "uuid",
    "customer_id" "uuid",
    "content_type" "text" DEFAULT 'user_upload'::"text",
    "description" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_public" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_content_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_definitions" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "base_url" "text" NOT NULL,
    "icon" "text",
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "config_schema" "jsonb" DEFAULT '{}'::"jsonb",
    "version" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_id" "uuid",
    "feature_id" "uuid",
    "is_enabled" boolean DEFAULT true,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "app_slug" character varying(255)
);


ALTER TABLE "public"."app_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_sync_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "app_id" "text",
    "sync_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "synced_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_sync_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(255),
    "role" character varying(50) DEFAULT 'user'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone DEFAULT "now"(),
    "first_name" character varying(255),
    "last_name" character varying(255)
);


ALTER TABLE "public"."app_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "timezone" "text" DEFAULT 'UTC'::"text",
    "appointment_type" "text" NOT NULL,
    "meeting_type" "text",
    "location" "text",
    "video_link" "text",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "assigned_to" "uuid",
    "created_by" "uuid",
    "attendees" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'scheduled'::"text",
    "outcome" "text",
    "follow_up_required" boolean DEFAULT false,
    "reminder_sent" boolean DEFAULT false,
    "confirmation_sent" boolean DEFAULT false,
    "calendar_event_id" "text",
    "meeting_platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_appointment_type" CHECK (("appointment_type" = ANY (ARRAY['call'::"text", 'meeting'::"text", 'demo'::"text", 'consultation'::"text", 'follow_up'::"text"]))),
    CONSTRAINT "valid_meeting_type" CHECK (("meeting_type" = ANY (ARRAY['in_person'::"text", 'video_call'::"text", 'phone_call'::"text"]))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"]))),
    CONSTRAINT "valid_time_range" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100),
    "icon_url" character varying(500),
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "domain" character varying(500),
    "deployment_url" character varying(500)
);


ALTER TABLE "public"."apps" OWNER TO "postgres";


COMMENT ON TABLE "public"."apps" IS 'Multiple policies are intentional: Admin users need full CRUD access while regular users need read-only access to active apps';



CREATE TABLE IF NOT EXISTS "public"."assistant_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "thread_id" "text" NOT NULL,
    "report_content" "text" NOT NULL,
    "focus_area" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assistant_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "automation_rule_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."execution_status" DEFAULT 'pending'::"public"."execution_status" NOT NULL,
    "error_message" "text",
    "actions_completed" "jsonb" DEFAULT '[]'::"jsonb",
    "user_id" "uuid"
);


ALTER TABLE "public"."automation_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "trigger" "jsonb" NOT NULL,
    "actions" "jsonb" NOT NULL,
    "executions" integer DEFAULT 0,
    "success_rate" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_run" timestamp with time zone
);


ALTER TABLE "public"."automation_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."builds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" NOT NULL,
    "details" "text",
    "commit_id" "text",
    "branch" "text",
    "site_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."builds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_analyzer" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "business_name" "text",
    "industry" "text",
    "analysis_data" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_analyzer" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cached_ai_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "ai_provider" "text" NOT NULL,
    "response_data" "jsonb" NOT NULL,
    "metadata" "jsonb",
    "tokens_saved" integer DEFAULT 0,
    "hit_count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "last_accessed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cached_ai_responses" OWNER TO "postgres";


COMMENT ON TABLE "public"."cached_ai_responses" IS 'Cached AI responses to reduce API costs';



CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "channel" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "target_contacts" "jsonb" DEFAULT '[]'::"jsonb",
    "content_template" "text",
    "scheduled_start" timestamp with time zone,
    "scheduled_end" timestamp with time zone,
    "actual_start" timestamp with time zone,
    "actual_end" timestamp with time zone,
    "stats" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "type" "text" DEFAULT 'revenue'::"text",
    "target" numeric(10,2) DEFAULT 0,
    "reward" "text" NOT NULL,
    "start_date" timestamp with time zone DEFAULT "now"(),
    "end_date" timestamp with time zone NOT NULL,
    "participants" "text"[] DEFAULT '{}'::"text"[],
    "current_progress" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "challenges_type_check" CHECK (("type" = ANY (ARRAY['revenue'::"text", 'deals'::"text", 'streak'::"text", 'conversion'::"text"])))
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


COMMENT ON TABLE "public"."challenges" IS 'Team challenges with targets and rewards';



CREATE TABLE IF NOT EXISTS "public"."code_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "language" "text" NOT NULL,
    "output" "text",
    "error" "text",
    "executed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."code_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "channel" "text" NOT NULL,
    "recipient_info" "jsonb" NOT NULL,
    "content" "text" NOT NULL,
    "status" "text" NOT NULL,
    "external_id" "text",
    "cost_cents" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."communication_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_date" "date" NOT NULL,
    "communication_type" "text" NOT NULL,
    "total_sent" integer DEFAULT 0,
    "total_delivered" integer DEFAULT 0,
    "total_opened" integer DEFAULT 0,
    "total_clicked" integer DEFAULT 0,
    "total_replied" integer DEFAULT 0,
    "response_rate" numeric(5,2) DEFAULT 0,
    "avg_response_time" integer DEFAULT 0,
    "successful_outcomes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "communication_metrics_communication_type_check" CHECK (("communication_type" = ANY (ARRAY['email'::"text", 'call'::"text", 'meeting'::"text", 'message'::"text"])))
);


ALTER TABLE "public"."communication_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "communication_type" "public"."communication_type" NOT NULL,
    "direction" "public"."communication_direction" NOT NULL,
    "subject" "text",
    "content" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "status" "public"."communication_status" DEFAULT 'sent'::"public"."communication_status",
    "participants" "text"[] DEFAULT ARRAY[]::"text"[],
    "attachments" "text"[] DEFAULT ARRAY[]::"text"[],
    "platform" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."communication_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communication_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "category" "text",
    "subject" "text",
    "content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "usage_count" integer DEFAULT 0,
    "last_used" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_template_type" CHECK (("type" = ANY (ARRAY['email'::"text", 'sms'::"text"])))
);


ALTER TABLE "public"."communication_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "subject" "text",
    "content" "text",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "created_by" "uuid",
    "from_address" "text",
    "to_addresses" "text"[],
    "cc_addresses" "text"[],
    "bcc_addresses" "text"[],
    "duration_seconds" integer,
    "call_outcome" "text",
    "recording_url" "text",
    "status" "text" DEFAULT 'completed'::"text",
    "scheduled_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_direction" CHECK (("direction" = ANY (ARRAY['inbound'::"text", 'outbound'::"text"]))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_type" CHECK (("type" = ANY (ARRAY['email'::"text", 'sms'::"text", 'call'::"text", 'meeting'::"text", 'note'::"text", 'task'::"text"])))
);


ALTER TABLE "public"."communications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "consent_type" "text" NOT NULL,
    "consent_given" boolean NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consent_logs_consent_type_check" CHECK (("consent_type" = ANY (ARRAY['cookies'::"text", 'analytics'::"text", 'marketing'::"text", 'essential'::"text"])))
);


ALTER TABLE "public"."consent_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "direction" "text",
    "outcome" "text",
    "duration_minutes" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "activity_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    CONSTRAINT "contact_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['email'::"text", 'call'::"text", 'meeting'::"text", 'note'::"text", 'task'::"text", 'deal'::"text", 'message'::"text", 'other'::"text"]))),
    CONSTRAINT "contact_activities_direction_check" CHECK (("direction" = ANY (ARRAY['inbound'::"text", 'outbound'::"text"])))
);


ALTER TABLE "public"."contact_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "time_period" "text" NOT NULL,
    "engagement_score" numeric(5,2) DEFAULT 0.0,
    "response_rate" numeric(5,2) DEFAULT 0.0,
    "avg_response_time_hours" numeric(10,2) DEFAULT 0.0,
    "total_interactions" integer DEFAULT 0,
    "email_count" integer DEFAULT 0,
    "call_count" integer DEFAULT 0,
    "meeting_count" integer DEFAULT 0,
    "sms_count" integer DEFAULT 0,
    "channel_performance" "jsonb" DEFAULT '{}'::"jsonb",
    "sentiment_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "conversion_probability" numeric(5,2) DEFAULT 0.0,
    "predictions" "jsonb" DEFAULT '[]'::"jsonb",
    "risk_assessment" "jsonb" DEFAULT '{}'::"jsonb",
    "trend_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contact_analytics_conversion_probability_check" CHECK ((("conversion_probability" >= (0)::numeric) AND ("conversion_probability" <= (100)::numeric))),
    CONSTRAINT "contact_analytics_engagement_score_check" CHECK ((("engagement_score" >= (0)::numeric) AND ("engagement_score" <= (100)::numeric))),
    CONSTRAINT "contact_analytics_response_rate_check" CHECK ((("response_rate" >= (0)::numeric) AND ("response_rate" <= (100)::numeric)))
);


ALTER TABLE "public"."contact_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "filename" "text" NOT NULL,
    "original_filename" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_url" "text",
    "uploaded_by" "text" NOT NULL,
    "file_type" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "insight_type" "public"."insight_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "confidence" numeric(5,2) DEFAULT 50.0,
    "impact" "public"."impact_level" DEFAULT 'medium'::"public"."impact_level",
    "category" "text" NOT NULL,
    "is_actionable" boolean DEFAULT false,
    "suggested_actions" "text"[] DEFAULT ARRAY[]::"text"[],
    "related_contacts" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "data_points" "text"[] DEFAULT ARRAY[]::"text"[],
    "web_sources" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_provider" "text",
    "ai_model" "text",
    "is_active" boolean DEFAULT true,
    "acted_upon" boolean DEFAULT false,
    "acted_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contact_insights_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (100)::numeric)))
);


ALTER TABLE "public"."contact_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_date" "date" NOT NULL,
    "engagement_score" integer DEFAULT 0,
    "email_opens" integer DEFAULT 0,
    "email_clicks" integer DEFAULT 0,
    "calls_made" integer DEFAULT 0,
    "meetings_held" integer DEFAULT 0,
    "response_rate" numeric(5,2) DEFAULT 0,
    "deal_value" numeric(10,2) DEFAULT 0,
    "activities_count" integer DEFAULT 0,
    "last_activity_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_segments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "criteria" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_dynamic" boolean DEFAULT false,
    "contact_count" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_segments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "company" "text" NOT NULL,
    "position" "text",
    "status" "public"."contact_status" DEFAULT 'lead'::"public"."contact_status",
    "source" "text",
    "lead_score" integer DEFAULT 0,
    "engagement_score" integer DEFAULT 0,
    "last_contacted" timestamp with time zone,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "social_profiles" "jsonb" DEFAULT '{}'::"jsonb",
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "activity_log" "jsonb" DEFAULT '[]'::"jsonb",
    "next_send_date" timestamp with time zone,
    "is_team_member" boolean DEFAULT false,
    "role" "text",
    "gamification_stats" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_score" integer,
    "name" "text" NOT NULL,
    "title" "text" NOT NULL,
    "avatar_src" "text",
    "industry" "text",
    "department" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "country" "text",
    "zip_code" "text",
    "timezone" "text",
    "sources" "text"[] DEFAULT ARRAY[]::"text"[],
    "interest_level" "text" DEFAULT 'medium'::"text" NOT NULL,
    "last_connected" timestamp with time zone,
    "is_favorite" boolean DEFAULT false,
    "birthday" "date",
    "preferred_contact" "text" DEFAULT 'email'::"text",
    "is_mock_data" boolean DEFAULT false,
    "is_example" boolean DEFAULT false,
    "data_source" "text",
    "created_by" "text" DEFAULT 'user'::"text",
    "mock_data_type" "text",
    "user_id" "uuid",
    "psychological_profile" "jsonb",
    "ai_score_rationale" "jsonb",
    "behavioral_insights" "jsonb",
    "last_enrichment" "jsonb",
    CONSTRAINT "check_created_by" CHECK (("created_by" = ANY (ARRAY['system'::"text", 'user'::"text", 'demo'::"text"]))),
    CONSTRAINT "check_data_source" CHECK (("data_source" = ANY (ARRAY['mock'::"text", 'real'::"text", 'imported'::"text", 'manual'::"text"]))),
    CONSTRAINT "check_interest_level" CHECK (("interest_level" = ANY (ARRAY['hot'::"text", 'medium'::"text", 'low'::"text", 'cold'::"text"]))),
    CONSTRAINT "check_mock_data_type" CHECK (("mock_data_type" = ANY (ARRAY['sample'::"text", 'demo'::"text", 'test'::"text"]))),
    CONSTRAINT "contacts_ai_score_check" CHECK ((("ai_score" IS NULL) OR (("ai_score" >= 0) AND ("ai_score" <= 100)))),
    CONSTRAINT "contacts_engagement_score_check" CHECK ((("engagement_score" >= 0) AND ("engagement_score" <= 100))),
    CONSTRAINT "contacts_lead_score_check" CHECK ((("lead_score" >= 0) AND ("lead_score" <= 100))),
    CONSTRAINT "contacts_role_check" CHECK ((("role" IS NULL) OR ("role" = ANY (ARRAY['sales-rep'::"text", 'manager'::"text", 'executive'::"text", 'admin'::"text"])))),
    CONSTRAINT "valid_email" CHECK (("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contacts"."ai_score" IS 'AI-generated score (0-100) indicating contact conversion likelihood. NULL means not yet analyzed.';



COMMENT ON COLUMN "public"."contacts"."psychological_profile" IS 'AI-generated psychological profile with personality traits and decision-making style';



COMMENT ON COLUMN "public"."contacts"."ai_score_rationale" IS 'Detailed explanation of AI scoring with factors and reasoning';



COMMENT ON COLUMN "public"."contacts"."behavioral_insights" IS 'AI-analyzed behavioral patterns and engagement preferences';



COMMENT ON COLUMN "public"."contacts"."last_enrichment" IS 'Metadata about the last AI enrichment including confidence and timestamp';



CREATE TABLE IF NOT EXISTS "public"."content_generator_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "model" "text" NOT NULL,
    "industry" "text" DEFAULT ''::"text",
    "target_audience" "text" DEFAULT ''::"text",
    "business_size" "text" DEFAULT ''::"text",
    "uploaded_files" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_generator_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_generator_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "industry" "text" DEFAULT ''::"text",
    "target_audience" "text" DEFAULT ''::"text",
    "business_size" "text" DEFAULT ''::"text",
    "special_requirements" "text" DEFAULT ''::"text",
    "default_model" "text" DEFAULT 'gpt-5-mini'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_generator_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" NOT NULL,
    "platforms" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "scheduled_for" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "ai_generated" boolean DEFAULT false,
    "image_url" "text",
    CONSTRAINT "content_items_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'published'::"text"]))),
    CONSTRAINT "content_items_type_check" CHECK (("type" = ANY (ARRAY['post'::"text", 'image'::"text", 'video'::"text", 'article'::"text", 'story'::"text"])))
);


ALTER TABLE "public"."content_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "content_type" "text" NOT NULL,
    "template_content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "is_public" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "has_multiple_days" boolean DEFAULT false,
    "total_days" integer DEFAULT 1,
    "export_options" "text"[] DEFAULT ARRAY['pdf'::"text"],
    "prompt_template" "text" NOT NULL,
    "estimated_generation_time" integer DEFAULT 30,
    "popularity_score" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "context_id" "uuid" NOT NULL,
    "message_id" "uuid",
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_context_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "cache_key" "text" NOT NULL,
    "context_data" "jsonb" NOT NULL,
    "token_count" integer DEFAULT 0,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_context_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_contexts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "text" NOT NULL,
    "crm_context" "jsonb" DEFAULT '{}'::"jsonb",
    "user_profile" "jsonb" DEFAULT '{}'::"jsonb",
    "business_context" "text",
    "current_intent" "text",
    "conversation_summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_contexts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "context_id" "uuid",
    "message_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "agent_name" "text",
    "actions" "text"[],
    "crm_entities" "jsonb" DEFAULT '[]'::"jsonb",
    "confidence_score" numeric(5,2),
    "emotional_tone" "text",
    "audio_url" "text",
    "tools_used" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reasoning" "text",
    "quality_score" numeric(5,2),
    "has_web_search" boolean DEFAULT false,
    "has_file_attachment" boolean DEFAULT false,
    "has_image_generation" boolean DEFAULT false,
    "has_code_execution" boolean DEFAULT false,
    CONSTRAINT "check_quality_score" CHECK ((("quality_score" >= (0)::numeric) AND ("quality_score" <= (100)::numeric))),
    CONSTRAINT "conversation_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['user'::"text", 'ai'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."conversation_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversion_funnel" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stage" "text" NOT NULL,
    "count" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversion_funnel" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cost_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "tenant_id" "uuid",
    "generation_id" "uuid",
    "model_name" "text" NOT NULL,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "reasoning_tokens" integer DEFAULT 0,
    "cached_tokens" integer DEFAULT 0,
    "total_cost_cents" integer NOT NULL,
    "request_type" "text",
    "feature_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cost_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_bundles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bundle_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "stripe_product_id" "text",
    "stripe_price_id" "text",
    "credits" integer NOT NULL,
    "price_cents" integer NOT NULL,
    "bonus_percentage" integer DEFAULT 0,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credit_bundles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount" integer NOT NULL,
    "balance_before" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "description" "text" NOT NULL,
    "stripe_payment_intent_id" "text",
    "stripe_invoice_id" "text",
    "related_entity_type" "text",
    "related_entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['purchase'::"text", 'usage'::"text", 'refund'::"text", 'bonus'::"text", 'subscription_renewal'::"text"])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_id" "uuid",
    "feature_type" "text" NOT NULL,
    "credits_cost" integer NOT NULL,
    "ai_provider" "text",
    "ai_model" "text",
    "success" boolean DEFAULT true,
    "error_message" "text",
    "input_data" "jsonb" DEFAULT '{}'::"jsonb",
    "output_data" "jsonb" DEFAULT '{}'::"jsonb",
    "processing_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_usage_logs_feature_type_check" CHECK (("feature_type" = ANY (ARRAY['content_generation'::"text", 'image_generation'::"text", 'video_generation'::"text", 'ai_analysis'::"text", 'hashtag_generation'::"text", 'calendar_generation'::"text"])))
);


ALTER TABLE "public"."credit_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "contact_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "plan" "text" DEFAULT 'Basic'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "domain" "text",
    "subdomain" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_active" timestamp with time zone DEFAULT "now"(),
    "billing_info" "jsonb" DEFAULT '{}'::"jsonb",
    "usage" "jsonb" DEFAULT '{"storage": 0, "apiCalls": 0, "bandwidth": 0}'::"jsonb",
    "limits" "jsonb" DEFAULT '{"storage": 50, "apiCalls": 10000, "bandwidth": 100}'::"jsonb",
    "customization" "jsonb" DEFAULT '{"logo": "", "colors": {"primary": "#1f2937", "secondary": "#3b82f6"}, "favicon": ""}'::"jsonb",
    "features" "text"[] DEFAULT ARRAY['basic-analytics'::"text"],
    "analytics" "jsonb" DEFAULT '{}'::"jsonb",
    "customer_success" "jsonb" DEFAULT '{}'::"jsonb",
    "security" "jsonb" DEFAULT '{"ssoEnabled": false, "mfaRequired": false}'::"jsonb",
    "integrations" "jsonb" DEFAULT '{"active": [], "available": []}'::"jsonb",
    "workflows" "jsonb" DEFAULT '{"active": 0, "automated": 0, "completed": 0}'::"jsonb",
    "ai_features" "jsonb" DEFAULT '{"usage": {"insights": 0, "automations": 0, "predictions": 0}, "enabled": false}'::"jsonb",
    "lifecycle" "jsonb" DEFAULT '{"stage": "onboarding", "daysActive": 0}'::"jsonb"
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_layouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "layout_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dashboard_layouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_widget_layouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "widgets" "jsonb" DEFAULT '[]'::"jsonb",
    "date_range" "text" DEFAULT 'last_30_days'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dashboard_widget_layouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_deletion_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reason" "text",
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "scheduled_for" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    CONSTRAINT "data_deletion_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."data_deletion_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_export_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "export_data" "jsonb",
    "download_url" "text",
    "expires_at" timestamp with time zone,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "error_message" "text",
    CONSTRAINT "data_export_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."data_export_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "file_type" "text" NOT NULL,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."deal_attachments" OWNER TO "postgres";


COMMENT ON TABLE "public"."deal_attachments" IS 'File attachments associated with deals';



CREATE TABLE IF NOT EXISTS "public"."deal_pipeline_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_date" "date" NOT NULL,
    "stage" "text" NOT NULL,
    "deal_count" integer DEFAULT 0,
    "total_value" numeric(12,2) DEFAULT 0,
    "avg_deal_size" numeric(10,2) DEFAULT 0,
    "conversion_rate" numeric(5,2) DEFAULT 0,
    "avg_time_in_stage" integer DEFAULT 0,
    "deals_won" integer DEFAULT 0,
    "deals_lost" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deal_pipeline_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "stage_order" integer NOT NULL,
    "default_probability" integer DEFAULT 0,
    "color" "text" DEFAULT '#3b82f6'::"text",
    "is_active" boolean DEFAULT true,
    "is_closed_stage" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deal_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "value" numeric(12,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "stage_id" "uuid" NOT NULL,
    "probability" integer DEFAULT 0,
    "expected_close_date" "date",
    "actual_close_date" "date",
    "contact_id" "uuid",
    "assigned_to" "uuid",
    "created_by" "uuid",
    "status" "text" DEFAULT 'open'::"text",
    "deal_type" "text",
    "lead_source" "text",
    "competitors" "text"[],
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "company" "text" DEFAULT ''::"text",
    "contact" "text" DEFAULT ''::"text",
    "stage" "text" DEFAULT 'qualification'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "due_date" timestamp with time zone,
    "notes" "text",
    "ai_score" numeric(5,2) DEFAULT NULL::numeric,
    "social_profiles" "jsonb",
    "links" "jsonb",
    "last_enrichment" "jsonb",
    "next_follow_up" timestamp with time zone,
    "is_favorite" boolean DEFAULT false,
    "contact_avatar" "text",
    "company_avatar" "text",
    "last_activity" "text",
    "user_id" "uuid",
    CONSTRAINT "deals_probability_check" CHECK ((("probability" >= 0) AND ("probability" <= 100))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['open'::"text", 'won'::"text", 'lost'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."deals"."ai_score" IS 'AI-calculated probability of deal success (0-100)';



COMMENT ON COLUMN "public"."deals"."social_profiles" IS 'Social media and web profiles for the company';



COMMENT ON COLUMN "public"."deals"."links" IS 'Related links and resources for the deal';



COMMENT ON COLUMN "public"."deals"."next_follow_up" IS 'Recommended next follow-up date based on AI analysis';



CREATE TABLE IF NOT EXISTS "public"."demo_apps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "app_key" "text" NOT NULL,
    "url" "text" NOT NULL,
    "description" "text",
    "bullets" "jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "last_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sort_order" integer DEFAULT 0,
    CONSTRAINT "demo_apps_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'checking'::"text"])))
);


ALTER TABLE "public"."demo_apps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deployments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" NOT NULL,
    "url" "text" NOT NULL,
    "site_id" "text",
    "claimed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deployments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "user_id" "uuid",
    "email_subject" "text" NOT NULL,
    "email_body" "text" NOT NULL,
    "analysis_type" "text" DEFAULT 'comprehensive'::"text",
    "quality_score" integer DEFAULT 0,
    "response_likelihood" integer DEFAULT 0,
    "sentiment" "jsonb" DEFAULT '{}'::"jsonb",
    "tone_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "improvements" "jsonb" DEFAULT '[]'::"jsonb",
    "assessment" "text",
    "model" "text" DEFAULT 'gpt-4o'::"text",
    "confidence" integer DEFAULT 85,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_analyses_confidence_check" CHECK ((("confidence" >= 0) AND ("confidence" <= 100))),
    CONSTRAINT "email_analyses_quality_score_check" CHECK ((("quality_score" >= 0) AND ("quality_score" <= 100))),
    CONSTRAINT "email_analyses_response_likelihood_check" CHECK ((("response_likelihood" >= 0) AND ("response_likelihood" <= 100)))
);


ALTER TABLE "public"."email_analyses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_compositions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "user_id" "uuid",
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "purpose" "text" DEFAULT 'general'::"text",
    "tone" "text" DEFAULT 'professional'::"text",
    "length" "text" DEFAULT 'medium'::"text",
    "model" "text" DEFAULT 'gpt-4o'::"text",
    "confidence" integer DEFAULT 85,
    "web_research_used" boolean DEFAULT false,
    "sources" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_compositions_confidence_check" CHECK ((("confidence" >= 0) AND ("confidence" <= 100)))
);


ALTER TABLE "public"."email_compositions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text",
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "is_default" boolean DEFAULT false,
    "is_ai_generated" boolean DEFAULT false,
    "model" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_unsubscribes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "reason" "text",
    "unsubscribed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_unsubscribes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engagement_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "percentage" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."engagement_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engagement_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pattern_type" "text" NOT NULL,
    "pattern_frequency" "text",
    "trend" "public"."pattern_trend" DEFAULT 'stable'::"public"."pattern_trend",
    "pattern_insights" "text"[] DEFAULT ARRAY[]::"text"[],
    "optimal_day_of_week" "text",
    "optimal_time_of_day" "text",
    "response_window_hours" numeric(10,2),
    "preferred_channel" "text",
    "communication_style" "text",
    "content_preferences" "text"[] DEFAULT ARRAY[]::"text"[],
    "engagement_score" numeric(5,2) DEFAULT 50.0,
    "confidence_score" numeric(5,2) DEFAULT 50.0,
    "recommendations" "text"[] DEFAULT ARRAY[]::"text"[],
    "last_analyzed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "engagement_patterns_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (100)::numeric))),
    CONSTRAINT "engagement_patterns_engagement_score_check" CHECK ((("engagement_score" >= (0)::numeric) AND ("engagement_score" <= (100)::numeric)))
);


ALTER TABLE "public"."engagement_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enhanced_task_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "task_title" "text" NOT NULL,
    "task_description" "text",
    "task_type" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "complexity" "text" DEFAULT 'intermediate'::"text" NOT NULL,
    "required_agents" "text"[] DEFAULT ARRAY[]::"text"[],
    "user_provided_data" "jsonb" DEFAULT '{}'::"jsonb",
    "crm_context" "jsonb" DEFAULT '{}'::"jsonb",
    "expected_outcome" "text",
    "success_criteria" "text"[] DEFAULT ARRAY[]::"text"[],
    "deadline" timestamp with time zone,
    "estimated_duration" integer DEFAULT 15,
    "business_value" numeric(12,2) DEFAULT 0,
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "execution_status" "text" DEFAULT 'pending'::"text",
    "start_time" timestamp with time zone,
    "completion_time" timestamp with time zone,
    "actual_duration" integer,
    "results" "jsonb" DEFAULT '{}'::"jsonb",
    "business_outcome" "jsonb" DEFAULT '{}'::"jsonb",
    "gpt5_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "agent_performance" "jsonb" DEFAULT '[]'::"jsonb",
    "generated_assets" "jsonb" DEFAULT '[]'::"jsonb",
    "lessons_learned" "text"[] DEFAULT ARRAY[]::"text"[],
    "next_recommended_actions" "text"[] DEFAULT ARRAY[]::"text"[],
    "error_message" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "enhanced_task_executions_complexity_check" CHECK (("complexity" = ANY (ARRAY['simple'::"text", 'intermediate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "enhanced_task_executions_execution_status_check" CHECK (("execution_status" = ANY (ARRAY['pending'::"text", 'analyzing'::"text", 'executing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "enhanced_task_executions_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "enhanced_task_executions_task_type_check" CHECK (("task_type" = ANY (ARRAY['sales'::"text", 'marketing'::"text", 'customer_service'::"text", 'analytics'::"text", 'automation'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."enhanced_task_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enhanced_task_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "template_name" "text" NOT NULL,
    "template_description" "text",
    "task_type" "text" NOT NULL,
    "template_data" "jsonb" NOT NULL,
    "required_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "default_values" "jsonb" DEFAULT '{}'::"jsonb",
    "agent_workflow" "jsonb" DEFAULT '[]'::"jsonb",
    "business_impact_template" "text",
    "success_metrics_template" "text"[] DEFAULT ARRAY[]::"text"[],
    "usage_count" integer DEFAULT 0,
    "average_success_rate" numeric(5,2) DEFAULT 0,
    "average_business_value" numeric(12,2) DEFAULT 0,
    "last_used" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."enhanced_task_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entitlements" (
    "user_id" "uuid" NOT NULL,
    "product_name" "text" NOT NULL,
    "source_purchase_id" "uuid" NOT NULL,
    "is_active" boolean NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "error_type" "text" NOT NULL,
    "error_message" "text" NOT NULL,
    "stack_trace" "text",
    "endpoint" "text" NOT NULL,
    "method" "text" NOT NULL,
    "user_ip" "text",
    "request_id" "text",
    "context" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."error_logs" IS 'Stores detailed error information for debugging';



CREATE TABLE IF NOT EXISTS "public"."feature_access" (
    "role" "text" NOT NULL,
    "feature_name" "text" NOT NULL,
    "route" "text" NOT NULL,
    "external" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "is_enabled" boolean DEFAULT true,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "app_slug" character varying(255)
);


ALTER TABLE "public"."features" OWNER TO "postgres";


COMMENT ON TABLE "public"."features" IS 'Multiple policies are intentional: Admin users need full CRUD access while regular users need read-only access to enabled features';



CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid",
    "step_id" "uuid",
    "published_funnel_id" "uuid",
    "data" "jsonb" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "referrer" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "processed" boolean DEFAULT false,
    "webhook_sent" boolean DEFAULT false,
    "webhook_response" "jsonb"
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnel_conversions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "step_id" "text" NOT NULL,
    "visitor_id" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text" NOT NULL,
    "conversion_type" "text" DEFAULT 'opt_in'::"text" NOT NULL,
    "conversion_value" numeric(10,2),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."funnel_conversions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnel_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "step_id" "text" NOT NULL,
    "visitor_id" "text" NOT NULL,
    "session_id" "text" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "element_id" "text",
    "element_type" "text",
    "value" "text",
    "position_x" integer,
    "position_y" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."funnel_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnel_metrics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "total_views" integer DEFAULT 0,
    "unique_visitors" integer DEFAULT 0,
    "total_conversions" integer DEFAULT 0,
    "conversion_rate" numeric(5,2) DEFAULT 0,
    "total_revenue" numeric(10,2) DEFAULT 0,
    "avg_session_duration" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."funnel_metrics_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnel_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "step_id" "text" NOT NULL,
    "visitor_id" "text" NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "form_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "email" "text",
    "name" "text",
    "phone" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "score" integer DEFAULT 0,
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_term" "text",
    "utm_content" "text",
    "referrer" "text",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "funnel_responses_score_check" CHECK ((("score" >= 0) AND ("score" <= 100)))
);


ALTER TABLE "public"."funnel_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnel_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "visitor_id" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "total_time_seconds" integer DEFAULT 0,
    "steps_viewed" "text"[] DEFAULT '{}'::"text"[],
    "converted" boolean DEFAULT false,
    "device_type" "text" DEFAULT 'desktop'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."funnel_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnel_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "cta" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{"bgColor": "#ffffff", "ctaColor": "#3B82F6", "textColor": "#000000", "ctaTextColor": "#ffffff"}'::"jsonb" NOT NULL,
    "ai_analysis" "jsonb",
    "media" "jsonb",
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "funnel_steps_type_check" CHECK (("type" = ANY (ARRAY['landing'::"text", 'optin'::"text", 'sales'::"text", 'thankyou'::"text"])))
);


ALTER TABLE "public"."funnel_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnel_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "step_id" "text" NOT NULL,
    "visitor_id" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text" NOT NULL,
    "referrer" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_term" "text",
    "utm_content" "text",
    "device_type" "text" DEFAULT 'desktop'::"text" NOT NULL,
    "browser" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."funnel_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "target_audience" "text"[],
    "goal" "text",
    "ai_generated" boolean DEFAULT false,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."funnels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content_type_id" "uuid",
    "content" "text" NOT NULL,
    "ai_model" "text" NOT NULL,
    "generation_time_ms" integer,
    "revision_count" integer DEFAULT 0,
    "personalization_data" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_favorite" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."generated_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "prompt" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "provider" "text" NOT NULL,
    "model" "text",
    "category" "text",
    "tokens_used" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."generated_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generated_videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "image_id" "uuid",
    "video_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "duration" integer,
    "prompt" "text",
    "provider" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."generated_videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "style" "text",
    "source" "text" DEFAULT 'dalle-3'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "entity_type" "text" NOT NULL,
    "filename" "text",
    "record_count" integer NOT NULL,
    "successful_count" integer NOT NULL,
    "failed_count" integer NOT NULL,
    "error_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."import_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ip_blacklist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "inet" NOT NULL,
    "reason" "text" NOT NULL,
    "automatic" boolean DEFAULT false,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."ip_blacklist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journey_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "event_type" "public"."journey_event_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "status" "public"."journey_event_status" DEFAULT 'completed'::"public"."journey_event_status",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."journey_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kanban_column_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "column_field" "text" DEFAULT 'status'::"text" NOT NULL,
    "columns" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kanban_column_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."linkedin_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "linkedin_url" "text" NOT NULL,
    "profile_data" "jsonb" NOT NULL,
    "analysis_enhanced" boolean DEFAULT false,
    "last_scraped_at" timestamp with time zone DEFAULT "now"(),
    "scraping_method" "text" DEFAULT 'edge_function'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."linkedin_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "channel" "text" NOT NULL,
    "status" "text" NOT NULL,
    "recipient" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "cost" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."model_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_name" "text" NOT NULL,
    "task_type" "text" NOT NULL,
    "avg_response_time_ms" integer,
    "avg_tokens_used" integer,
    "avg_cost_cents" integer,
    "success_rate" numeric(5,2),
    "user_satisfaction_score" numeric(3,2),
    "total_requests" integer DEFAULT 0,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."model_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."openai_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."openai_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."openai_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model" "text" NOT NULL,
    "prompt_tokens" integer DEFAULT 0 NOT NULL,
    "completion_tokens" integer DEFAULT 0 NOT NULL,
    "total_tokens" integer DEFAULT 0 NOT NULL,
    "cost_estimate" numeric(10,6) DEFAULT 0,
    "endpoint" "text" NOT NULL,
    "request_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."openai_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."openai_usage" IS 'Tracks OpenAI API usage and costs';



CREATE TABLE IF NOT EXISTS "public"."partner_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid",
    "application_data" "jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "reviewer_id" "uuid"
);


ALTER TABLE "public"."partner_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid",
    "tenant_id" "uuid",
    "customer_name" "text" NOT NULL,
    "subdomain" "text",
    "status" "text" DEFAULT 'active'::"text",
    "plan" "text" DEFAULT 'basic'::"text",
    "monthly_revenue" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_active" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."partner_customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid",
    "total_customers" integer DEFAULT 0,
    "active_customers" integer DEFAULT 0,
    "total_revenue" numeric(10,2) DEFAULT 0,
    "monthly_revenue" numeric(10,2) DEFAULT 0,
    "customer_growth_rate" numeric(5,2) DEFAULT 0,
    "period_start" "date",
    "period_end" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."partner_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contact_email" "text" NOT NULL,
    "subdomain" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "company_description" "text",
    "website_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


COMMENT ON TABLE "public"."partners" IS 'RLS policies optimized for performance - auth calls use SELECT pattern';



CREATE TABLE IF NOT EXISTS "public"."pending_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchaser_email" "text" NOT NULL,
    "product_sku" "text",
    "source_provider" "text" NOT NULL,
    "source_txn_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "purchase_event_id" "uuid",
    "claimed_by" "uuid",
    "claimed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pending_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personalization_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "industry" "text",
    "target_audience" "text",
    "business_size" "text",
    "special_requirements" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personalization_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personalization_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_key" "text" NOT NULL,
    "token_value" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."personalization_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personalized_goal_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_id" "text" NOT NULL,
    "relevance_score" numeric(5,2) NOT NULL,
    "reasoning" "text" NOT NULL,
    "expected_impact" "text" NOT NULL,
    "setup_priority" integer NOT NULL,
    "personalized_description" "text" NOT NULL,
    "estimated_roi" numeric(12,2),
    "time_to_value" "text",
    "prerequisites" "text"[],
    "customization_suggestions" "text"[],
    "status" "text" DEFAULT 'recommended'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "personalized_goal_recommendations_status_check" CHECK (("status" = ANY (ARRAY['recommended'::"text", 'selected'::"text", 'completed'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."personalized_goal_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_key" "text" NOT NULL,
    "metric_value" integer NOT NULL,
    "display_label" "text" NOT NULL,
    "suffix" "text" DEFAULT ''::"text",
    "color_theme" "text" DEFAULT 'blue'::"text",
    "animation_duration" integer DEFAULT 2000,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proactive_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "suggestion_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "confidence_score" numeric(5,2) NOT NULL,
    "category" "text" NOT NULL,
    "is_actionable" boolean DEFAULT true,
    "suggested_command" "text",
    "estimated_value" numeric(12,2),
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "expires_at" timestamp with time zone,
    "executed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "proactive_suggestions_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "proactive_suggestions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'executed'::"text", 'dismissed'::"text", 'expired'::"text"]))),
    CONSTRAINT "proactive_suggestions_suggestion_type_check" CHECK (("suggestion_type" = ANY (ARRAY['action'::"text", 'insight'::"text", 'goal'::"text", 'optimization'::"text", 'warning'::"text"])))
);


ALTER TABLE "public"."proactive_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "crm_account_id" "text",
    "product_name" "text" NOT NULL,
    "product_description" "text" DEFAULT ''::"text",
    "insights" "jsonb" NOT NULL,
    "searchable_text" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text"
);


ALTER TABLE "public"."product_analyses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "provider_product_id" "text" NOT NULL,
    "product_sku" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_mappings_provider_check" CHECK (("provider" = ANY (ARRAY['stripe'::"text", 'paypal'::"text", 'zaxaa'::"text", 'paykickstart'::"text"])))
);


ALTER TABLE "public"."product_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "name" "text" NOT NULL,
    "slug" "text" GENERATED ALWAYS AS ("lower"("regexp_replace"("name", '[^a-zA-Z0-9]+'::"text", '-'::"text", 'g'::"text"))) STORED,
    "description" "text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Multiple policies are intentional: Admin users need full CRUD access while all authenticated users need read-only access to products';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "first_name" "text",
    "last_name" "text",
    "role" "text" DEFAULT 'regular_user'::"text",
    "avatar_url" "text",
    "app_context" "text" DEFAULT 'smartcrm'::"text",
    "email_template_set" "text" DEFAULT 'smartcrm'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "image_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."published_funnels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid",
    "tenant_id" "uuid",
    "slug" "text" NOT NULL,
    "custom_domain" "text",
    "is_active" boolean DEFAULT true,
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[],
    "og_image" "text",
    "favicon" "text",
    "analytics_id" "text",
    "published_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."published_funnels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "provider_event_id" "text" NOT NULL,
    "provider_order_id" "text",
    "purchaser_email" "text" NOT NULL,
    "amount_cents" integer,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text" NOT NULL,
    "raw" "jsonb" NOT NULL,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "purchase_events_provider_check" CHECK (("provider" = ANY (ARRAY['stripe'::"text", 'paypal'::"text", 'zaxaa'::"text", 'paykickstart'::"text"]))),
    CONSTRAINT "purchase_events_status_check" CHECK (("status" = ANY (ARRAY['paid'::"text", 'refunded'::"text", 'chargeback'::"text", 'cancelled'::"text", 'trial'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."purchase_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_customer_id" "text",
    "provider_purchase_id" "text",
    "product_name" "text" NOT NULL,
    "quantity" integer DEFAULT 1,
    "price_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text" NOT NULL,
    "purchased_at" timestamp with time zone NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    "stripe_payment_intent_id" "text",
    "stripe_invoice_id" "text",
    "stripe_customer_id" "text",
    "synced_from_stripe" boolean DEFAULT false,
    CONSTRAINT "purchases_status_check" CHECK (("status" = ANY (ARRAY['paid'::"text", 'active'::"text", 'refunded'::"text", 'failed'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "inet" NOT NULL,
    "endpoint" "text" NOT NULL,
    "request_count" integer DEFAULT 1,
    "window_start" timestamp with time zone DEFAULT "now"(),
    "blocked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reasoning_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "generation_id" "uuid",
    "user_id" "uuid",
    "reasoning_steps" "jsonb" NOT NULL,
    "conclusion" "text",
    "confidence_score" numeric(3,2),
    "citations" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reasoning_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reference_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "filename" "text" NOT NULL,
    "original_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "category" "text",
    "file_size" integer,
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reference_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."relationship_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_contact_id" "uuid" NOT NULL,
    "target_contact_id" "uuid" NOT NULL,
    "relationship_type" "public"."relationship_type" NOT NULL,
    "relationship_strength" numeric(5,2) DEFAULT 50.0,
    "confidence_score" numeric(5,2) DEFAULT 50.0,
    "discovered_through" "text"[] DEFAULT ARRAY[]::"text"[],
    "network_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "influence_score" numeric(5,2) DEFAULT 0.0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "relationship_mappings_check" CHECK (("source_contact_id" <> "target_contact_id")),
    CONSTRAINT "relationship_mappings_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (100)::numeric))),
    CONSTRAINT "relationship_mappings_influence_score_check" CHECK ((("influence_score" >= (0)::numeric) AND ("influence_score" <= (100)::numeric))),
    CONSTRAINT "relationship_mappings_relationship_strength_check" CHECK ((("relationship_strength" >= (0)::numeric) AND ("relationship_strength" <= (100)::numeric)))
);


ALTER TABLE "public"."relationship_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."response_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "response_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "activity_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."response_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "contact_id" "uuid",
    "deal_id" "uuid",
    "communication_id" "uuid",
    "appointment_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_activity_type" CHECK (("type" = ANY (ARRAY['task'::"text", 'call'::"text", 'email'::"text", 'meeting'::"text", 'follow_up'::"text", 'demo'::"text", 'proposal'::"text"]))),
    CONSTRAINT "valid_priority" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."sales_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "metric_type" "text" NOT NULL,
    "target_value" numeric(12,2) NOT NULL,
    "current_value" numeric(12,2) DEFAULT 0,
    "period_type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "assigned_to" "uuid",
    "team_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_goal_status" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'paused'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_metric_type" CHECK (("metric_type" = ANY (ARRAY['revenue'::"text", 'deals_closed'::"text", 'calls_made'::"text", 'emails_sent'::"text", 'meetings_booked'::"text"]))),
    CONSTRAINT "valid_period_type" CHECK (("period_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'yearly'::"text"])))
);


ALTER TABLE "public"."sales_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_sequences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "trigger_event" "text",
    "trigger_conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "steps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_enrolled" integer DEFAULT 0,
    "total_completed" integer DEFAULT 0,
    "success_rate" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_audit_documentation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issue_type" "text" NOT NULL,
    "issue_description" "text" NOT NULL,
    "resolution_status" "text" NOT NULL,
    "resolution_notes" "text" NOT NULL,
    "is_intentional" boolean DEFAULT false,
    "requires_dashboard_config" boolean DEFAULT false,
    "documented_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_audit_documentation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "endpoint" "text",
    "details" "jsonb",
    "severity" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "security_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['failed_login'::"text", 'suspicious_activity'::"text", 'rate_limit_exceeded'::"text", 'invalid_token'::"text", 'sql_injection_attempt'::"text", 'xss_attempt'::"text", 'brute_force_detected'::"text"]))),
    CONSTRAINT "security_events_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_deployment_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_item_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "scheduled_for" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "make_scenario_id" "text",
    "platform_post_id" "text",
    "error_message" "text",
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 3 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "social_deployment_queue_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'twitter'::"text", 'facebook'::"text", 'linkedin'::"text", 'tiktok'::"text", 'pinterest'::"text"]))),
    CONSTRAINT "social_deployment_queue_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."social_deployment_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_platform_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "is_connected" boolean DEFAULT false NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "platform_user_id" "text",
    "platform_username" "text",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "make_webhook_url" "text",
    "error_message" "text",
    "last_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "social_platform_connections_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'twitter'::"text", 'facebook'::"text", 'linkedin'::"text", 'tiktok'::"text", 'pinterest'::"text"])))
);


ALTER TABLE "public"."social_platform_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "request_payload" "jsonb" NOT NULL,
    "response_payload" "jsonb",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "social_webhook_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['deployment'::"text", 'status_update'::"text", 'analytics'::"text"]))),
    CONSTRAINT "social_webhook_events_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'twitter'::"text", 'facebook'::"text", 'linkedin'::"text", 'tiktok'::"text", 'pinterest'::"text"]))),
    CONSTRAINT "social_webhook_events_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."social_webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."storage_bucket_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_name" "text" NOT NULL,
    "purpose" "text" NOT NULL,
    "max_file_size" bigint DEFAULT 5242880,
    "allowed_mime_types" "text"[] DEFAULT '{}'::"text"[],
    "is_public" boolean DEFAULT false,
    "retention_days" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."storage_bucket_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."storage_bucket_config" IS 'Configuration metadata for storage buckets';



CREATE TABLE IF NOT EXISTS "public"."storage_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "total_size" bigint DEFAULT 0,
    "file_count" integer DEFAULT 0,
    "quota_limit" bigint,
    "last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."storage_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."storage_usage" IS 'Multiple policies are intentional: Service role needs full management access while users need read-only access to their own usage';



CREATE TABLE IF NOT EXISTS "public"."streaming_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_type" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "metadata" "jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "total_tokens" integer DEFAULT 0,
    "total_cost_cents" integer DEFAULT 0
);


ALTER TABLE "public"."streaming_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_charges" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" bigint,
    "amount_refunded" bigint,
    "application" "text",
    "application_fee" "text",
    "balance_transaction" "text",
    "balance_transaction_details" "jsonb",
    "captured" boolean,
    "created" bigint,
    "currency" "text",
    "customer" "text",
    "customer_details" "jsonb",
    "description" "text",
    "destination" "text",
    "dispute" "text",
    "disputed" boolean,
    "failure_code" "text",
    "failure_message" "text",
    "fraud_details" "jsonb",
    "invoice" "text",
    "invoice_details" "jsonb",
    "livemode" boolean,
    "metadata" "jsonb",
    "outcome" "jsonb",
    "paid" boolean,
    "payment_intent" "text",
    "payment_method" "text",
    "payment_method_details" "jsonb",
    "receipt_email" "text",
    "receipt_number" "text",
    "receipt_url" "text",
    "refunded" boolean,
    "review" "text",
    "shipping" "jsonb",
    "source" "jsonb",
    "source_transfer" "text",
    "statement_descriptor" "text",
    "status" "text",
    "transfer_data" "jsonb",
    "transfer_group" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_checkout_sessions" (
    "id" "text" NOT NULL,
    "object" "text",
    "after_expiration" "jsonb",
    "allow_promotion_codes" boolean,
    "amount_subtotal" bigint,
    "amount_total" bigint,
    "automatic_tax" "jsonb",
    "billing_address_collection" "text",
    "cancel_url" "text",
    "client_reference_id" "text",
    "consent" "jsonb",
    "consent_collection" "jsonb",
    "created" bigint,
    "currency" "text",
    "custom_fields" "jsonb",
    "custom_text" "jsonb",
    "customer" "text",
    "customer_creation" "text",
    "customer_details" "jsonb",
    "customer_email" "text",
    "expires_at" bigint,
    "invoice" "text",
    "invoice_creation" "jsonb",
    "line_items" "jsonb",
    "livemode" boolean,
    "locale" "text",
    "metadata" "jsonb",
    "mode" "text",
    "payment_intent" "text",
    "payment_link" "text",
    "payment_method_collection" "text",
    "payment_method_options" "jsonb",
    "payment_method_types" "text"[],
    "payment_status" "text",
    "phone_number_collection" "jsonb",
    "recovered_from" "text",
    "setup_intent" "text",
    "shipping_address_collection" "jsonb",
    "shipping_cost" "jsonb",
    "shipping_details" "jsonb",
    "shipping_options" "jsonb",
    "status" "text",
    "submit_type" "text",
    "subscription" "text",
    "success_url" "text",
    "total_details" "jsonb",
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_checkout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" "text" NOT NULL,
    "object" "text",
    "email" "text",
    "name" "text",
    "phone" "text",
    "address" "jsonb",
    "description" "text",
    "created" bigint,
    "delinquent" boolean,
    "discount" "jsonb",
    "invoice_prefix" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "preferred_locales" "text"[],
    "shipping" "jsonb",
    "tax_exempt" "text",
    "tax_ids" "jsonb",
    "sources" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "feature_id" "text" NOT NULL,
    "lookup_key" "text",
    "entitlement_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_entitlements" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_entitlements" IS 'Multiple policies are intentional: Super admins need full access while users need read-only access to their own entitlements';



CREATE TABLE IF NOT EXISTS "public"."stripe_invoices" (
    "id" "text" NOT NULL,
    "object" "text",
    "account_country" "text",
    "account_name" "text",
    "amount_due" bigint,
    "amount_paid" bigint,
    "amount_remaining" bigint,
    "application_fee_amount" bigint,
    "attempt_count" integer,
    "attempted" boolean,
    "auto_advance" boolean,
    "billing_reason" "text",
    "charge" "text",
    "collection_method" "text",
    "created" bigint,
    "currency" "text",
    "custom_fields" "jsonb",
    "customer" "text",
    "customer_address" "jsonb",
    "customer_email" "text",
    "customer_name" "text",
    "customer_phone" "text",
    "customer_shipping" "jsonb",
    "customer_tax_exempt" "text",
    "customer_tax_ids" "jsonb",
    "default_payment_method" "text",
    "default_source" "text",
    "default_tax_rates" "jsonb",
    "description" "text",
    "discount" "jsonb",
    "discounts" "jsonb",
    "due_date" bigint,
    "ending_balance" bigint,
    "footer" "text",
    "hosted_invoice_url" "text",
    "invoice_pdf" "text",
    "last_finalization_error" "jsonb",
    "lines" "jsonb",
    "livemode" boolean,
    "metadata" "jsonb",
    "next_payment_attempt" bigint,
    "number" "text",
    "on_behalf_of" "text",
    "paid" boolean,
    "payment_settings" "jsonb",
    "period_end" bigint,
    "period_start" bigint,
    "post_payment_credit_notes_amount" bigint,
    "pre_payment_credit_notes_amount" bigint,
    "receipt_number" "text",
    "starting_balance" bigint,
    "statement_descriptor" "text",
    "status" "text",
    "status_transitions" "jsonb",
    "subscription" "text",
    "subtotal" bigint,
    "tax" "jsonb",
    "total" bigint,
    "total_tax_amounts" "jsonb",
    "transfer_data" "jsonb",
    "webhooks_delivered_at" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_payment_intents" (
    "id" "text" NOT NULL,
    "object" "text",
    "amount" bigint,
    "amount_capturable" bigint,
    "amount_details" "jsonb",
    "amount_received" bigint,
    "application" "text",
    "application_fee_amount" bigint,
    "automatic_payment_methods" "jsonb",
    "canceled_at" bigint,
    "cancellation_reason" "text",
    "capture_method" "text",
    "client_secret" "text",
    "confirmation_method" "text",
    "created" bigint,
    "currency" "text",
    "customer" "text",
    "description" "text",
    "invoice" "text",
    "last_payment_error" "jsonb",
    "livemode" boolean,
    "metadata" "jsonb",
    "next_action" "jsonb",
    "on_behalf_of" "text",
    "payment_method" "text",
    "payment_method_options" "jsonb",
    "payment_method_types" "text"[],
    "processing" "jsonb",
    "receipt_email" "text",
    "review" "text",
    "setup_future_usage" "text",
    "shipping" "jsonb",
    "source" "text",
    "statement_descriptor" "text",
    "statement_descriptor_suffix" "text",
    "status" "text",
    "transfer_data" "jsonb",
    "transfer_group" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_payment_intents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_payment_methods" (
    "id" "text" NOT NULL,
    "customer_id" "text",
    "type" "text",
    "billing_details" "jsonb",
    "card" "jsonb",
    "created" bigint,
    "livemode" boolean,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_prices" (
    "id" "text" NOT NULL,
    "object" "text",
    "active" boolean,
    "billing_scheme" "text",
    "created" bigint,
    "currency" "text",
    "custom_unit_amount" bigint,
    "livemode" boolean,
    "lookup_key" "text",
    "metadata" "jsonb",
    "nickname" "text",
    "product" "text",
    "recurring" "jsonb",
    "tax_behavior" "text",
    "tiers" "jsonb",
    "tiers_mode" "text",
    "transform_quantity" "jsonb",
    "type" "text",
    "unit_amount" bigint,
    "unit_amount_decimal" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_products" (
    "id" "text" NOT NULL,
    "object" "text",
    "active" boolean,
    "created" bigint,
    "default_price" "text",
    "description" "text",
    "images" "text"[],
    "livemode" boolean,
    "metadata" "jsonb",
    "name" "text",
    "package_dimensions" "jsonb",
    "shippable" boolean,
    "statement_descriptor" "text",
    "tax_code" "text",
    "type" "text",
    "unit_label" "text",
    "updated" bigint,
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_subscriptions" (
    "id" "text" NOT NULL,
    "object" "text",
    "application_fee_percent" numeric,
    "billing_cycle_anchor" bigint,
    "billing_thresholds" "jsonb",
    "cancel_at" bigint,
    "cancel_at_period_end" boolean,
    "canceled_at" bigint,
    "collection_method" "text",
    "created" bigint,
    "current_period_end" bigint,
    "current_period_start" bigint,
    "customer" "text",
    "days_until_due" integer,
    "default_payment_method" "text",
    "default_source" "text",
    "default_tax_rates" "jsonb",
    "discount" "jsonb",
    "ended_at" bigint,
    "items" "jsonb",
    "latest_invoice" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "next_pending_invoice_item_invoice" bigint,
    "pause_collection" "jsonb",
    "payment_settings" "jsonb",
    "pending_invoice_item_interval" "jsonb",
    "pending_setup_intent" "text",
    "pending_update" "jsonb",
    "schedule" "text",
    "start_date" bigint,
    "status" "text",
    "transfer_data" "jsonb",
    "trial_end" bigint,
    "trial_start" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "stripe_product_id" "text",
    "stripe_price_id_monthly" "text",
    "stripe_price_id_annual" "text",
    "price_monthly_cents" integer NOT NULL,
    "price_annual_cents" integer NOT NULL,
    "monthly_credits" integer NOT NULL,
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "limits" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "total_records" integer DEFAULT 0,
    "processed_records" integer DEFAULT 0,
    "successful_records" integer DEFAULT 0,
    "failed_records" integer DEFAULT 0,
    "error_log" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "started_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sync_jobs_job_type_check" CHECK (("job_type" = ANY (ARRAY['stripe_customers'::"text", 'stripe_entitlements'::"text", 'paykickstart_customers'::"text", 'zaxxa_customers'::"text", 'manual_import'::"text"]))),
    CONSTRAINT "sync_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."sync_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."sync_jobs" IS 'RLS policies optimized for performance - auth calls use SELECT pattern';



CREATE TABLE IF NOT EXISTS "public"."table_column_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "visible_columns" "jsonb" DEFAULT '["name", "email", "company", "title", "status", "interestLevel", "aiScore"]'::"jsonb",
    "column_order" "jsonb" DEFAULT '["name", "email", "company", "title", "status", "interestLevel", "aiScore", "lastConnected"]'::"jsonb",
    "column_widths" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."table_column_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_business_outcomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_execution_id" "uuid",
    "outcome_type" "text" NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric(12,2) NOT NULL,
    "measurement_unit" "text",
    "impact_description" "text",
    "confidence_level" numeric(3,2),
    "measurement_method" "text",
    "baseline_value" numeric(12,2),
    "improvement_percentage" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "task_business_outcomes_confidence_level_check" CHECK ((("confidence_level" >= (0)::numeric) AND ("confidence_level" <= (1)::numeric))),
    CONSTRAINT "task_business_outcomes_outcome_type_check" CHECK (("outcome_type" = ANY (ARRAY['revenue'::"text", 'efficiency'::"text", 'quality'::"text", 'satisfaction'::"text", 'cost_saving'::"text", 'time_saving'::"text"])))
);


ALTER TABLE "public"."task_business_outcomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "task_type" "text" NOT NULL,
    "task_title" "text" NOT NULL,
    "task_description" "text",
    "user_input" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "agent_workflow" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "execution_status" "text" DEFAULT 'pending'::"text",
    "start_time" timestamp with time zone DEFAULT "now"(),
    "completion_time" timestamp with time zone,
    "estimated_duration_minutes" integer DEFAULT 15,
    "actual_duration_seconds" integer,
    "results" "jsonb" DEFAULT '{}'::"jsonb",
    "business_impact" "jsonb" DEFAULT '{}'::"jsonb",
    "success_metrics" "jsonb" DEFAULT '[]'::"jsonb",
    "gpt5_reasoning" "text",
    "error_message" "text",
    "created_by" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "complexity" "text" DEFAULT 'intermediate'::"text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "task_executions_complexity_check" CHECK (("complexity" = ANY (ARRAY['simple'::"text", 'intermediate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "task_executions_execution_status_check" CHECK (("execution_status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "task_executions_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."task_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "template_name" "text" NOT NULL,
    "template_description" "text",
    "task_type" "text" NOT NULL,
    "input_schema" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "default_values" "jsonb" DEFAULT '{}'::"jsonb",
    "agent_workflow" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "required_tools" "text"[] DEFAULT ARRAY[]::"text"[],
    "estimated_setup_time" "text" DEFAULT '15 minutes'::"text",
    "business_impact_description" "text",
    "success_metrics" "text"[] DEFAULT ARRAY[]::"text"[],
    "usage_count" integer DEFAULT 0,
    "last_used" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" timestamp with time zone,
    "completed" boolean DEFAULT false,
    "priority" "text",
    "related_to_type" "text",
    "related_to_id" "text",
    "related_to_name" "text",
    "assigned_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "tasks_related_to_type_check" CHECK (("related_to_type" = ANY (ARRAY['deal'::"text", 'contact'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "subdomain" "text" NOT NULL,
    "custom_domain" "text",
    "logo_url" "text",
    "color_scheme" "jsonb" DEFAULT '{"accent": "#8b5cf6", "primary": "#3b82f6"}'::"jsonb",
    "theme_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "app_name" "text",
    "tagline" "text",
    "support_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


COMMENT ON TABLE "public"."tenants" IS 'RLS policies optimized for performance - auth calls use SELECT pattern';



CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "company" "text" NOT NULL,
    "industry" "text" NOT NULL,
    "avatar" "text" NOT NULL,
    "quote" "text" NOT NULL,
    "time_reduction" integer DEFAULT 0,
    "quality_improvement" integer DEFAULT 1,
    "rating" integer DEFAULT 5,
    "verified" boolean DEFAULT true,
    "joined_date" "text",
    "location" "text",
    "additional_metrics" "jsonb" DEFAULT '[]'::"jsonb",
    "is_verified" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timeline_view_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "time_scale" "text" DEFAULT 'week'::"text",
    "visible_event_types" "jsonb" DEFAULT '["email", "call", "meeting", "note", "status_change", "ai_analysis"]'::"jsonb",
    "selected_contacts" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "timeline_view_preferences_time_scale_check" CHECK (("time_scale" = ANY (ARRAY['day'::"text", 'week'::"text", 'month'::"text", 'quarter'::"text"])))
);


ALTER TABLE "public"."timeline_view_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tool_execution_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "generation_id" "uuid",
    "user_id" "uuid",
    "tool_name" "text" NOT NULL,
    "tool_parameters" "jsonb",
    "execution_result" "jsonb",
    "execution_time_ms" integer,
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tool_execution_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tooltip_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tooltip_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tooltip_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "element_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "placement" "text" DEFAULT 'top'::"text" NOT NULL,
    "trigger_type" "text" DEFAULT 'hover'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tooltip_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "text",
    "ai_model" "text",
    "generation_time_ms" integer,
    "success" boolean DEFAULT true,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "achievement_id" "uuid" NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_achievements" IS 'Tracks which achievements each user has unlocked';



CREATE TABLE IF NOT EXISTS "public"."user_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_type" "text" NOT NULL,
    "value" numeric NOT NULL,
    "change_percentage" numeric,
    "date_recorded" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_billing_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "subscription_plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "subscription_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "credits_available" integer DEFAULT 0 NOT NULL,
    "credits_lifetime_purchased" integer DEFAULT 0 NOT NULL,
    "credits_lifetime_used" integer DEFAULT 0 NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "billing_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_billing_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_business_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "industry" "text",
    "company_size" "text",
    "sales_process_maturity" "text",
    "current_challenges" "text"[],
    "technical_skill" "text" DEFAULT 'intermediate'::"text",
    "business_priorities" "text"[],
    "crm_usage" "jsonb" DEFAULT '{}'::"jsonb",
    "goal_history" "text"[],
    "preferred_communication" "text" DEFAULT 'both'::"text",
    "working_hours" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_business_profiles_company_size_check" CHECK (("company_size" = ANY (ARRAY['startup'::"text", 'smb'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "user_business_profiles_preferred_communication_check" CHECK (("preferred_communication" = ANY (ARRAY['text'::"text", 'voice'::"text", 'both'::"text"]))),
    CONSTRAINT "user_business_profiles_sales_process_maturity_check" CHECK (("sales_process_maturity" = ANY (ARRAY['basic'::"text", 'intermediate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "user_business_profiles_technical_skill_check" CHECK (("technical_skill" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"])))
);


ALTER TABLE "public"."user_business_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "messages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "product_sku" "text",
    "source_provider" "text" NOT NULL,
    "source_txn_id" "text",
    "status" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_entitlements_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'refunded'::"text", 'chargeback'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."user_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_fonts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "font_family" "text" NOT NULL,
    "font_url" "text",
    "category" "text" DEFAULT 'custom'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_fonts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_goals" (
    "id" bigint NOT NULL,
    "goal_name" "text" NOT NULL,
    "category" "public"."goal_category_enum" NOT NULL,
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_goals" OWNER TO "postgres";


ALTER TABLE "public"."user_goals" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_goals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_identities" (
    "internal_user_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "clerk_user_id" "text",
    "app_specific_ids" "jsonb" DEFAULT '{}'::"jsonb",
    "clerk_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_identities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "service_name" "text" NOT NULL,
    "encrypted_credentials" "text",
    "is_active" boolean DEFAULT true,
    "last_sync_at" timestamp with time zone,
    "sync_status" "text" DEFAULT 'pending'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "industry" "text",
    "target_audience" "text",
    "business_size" "text" DEFAULT 'medium'::"text",
    "special_requirements" "text",
    "default_ai_model" "text" DEFAULT 'gpt-5'::"text",
    "relationship_type" "text",
    "dismissed_tooltips" "text"[] DEFAULT ARRAY[]::"text"[],
    "onboarding_completed" boolean DEFAULT false,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "plan_name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_templates_type_check" CHECK (("type" = ANY (ARRAY['sms'::"text", 'voice'::"text", 'whatsapp'::"text", 'messenger'::"text"])))
);


ALTER TABLE "public"."user_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tenant_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_tenant_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_tenant_roles" IS 'Multiple policies are intentional: Tenant admins can add users while users can self-register as tenant owners';



CREATE TABLE IF NOT EXISTS "public"."user_upload_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "upload_id" "text" NOT NULL,
    "filename" "text",
    "users_count" integer DEFAULT 0 NOT NULL,
    "success_count" integer DEFAULT 0 NOT NULL,
    "error_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "details" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."user_upload_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_view_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "view_type" "text" DEFAULT 'list'::"text" NOT NULL,
    "last_used_view" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_view_preferences_last_used_view_check" CHECK (("last_used_view" = ANY (ARRAY['list'::"text", 'table'::"text", 'kanban'::"text", 'calendar'::"text", 'dashboard'::"text", 'timeline'::"text"]))),
    CONSTRAINT "user_view_preferences_view_type_check" CHECK (("view_type" = ANY (ARRAY['list'::"text", 'table'::"text", 'kanban'::"text", 'calendar'::"text", 'dashboard'::"text", 'timeline'::"text"])))
);


ALTER TABLE "public"."user_view_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_customer_profiles" WITH ("security_invoker"='true') AS
 SELECT "c"."id",
    "c"."email",
    "c"."name",
    "c"."phone",
    "c"."created" AS "stripe_created_at",
    "c"."livemode",
    "c"."metadata",
    COALESCE("pm_count"."count", (0)::bigint) AS "payment_methods_count",
    COALESCE("lv"."lifetime_value", (0)::numeric) AS "lifetime_value_cents",
    COALESCE("pc"."payment_count", (0)::bigint) AS "total_payments",
    "fp"."first_purchase_date",
    "lp"."latest_purchase_date",
    COALESCE("subs"."active_subscriptions", (0)::bigint) AS "active_subscriptions",
    COALESCE("inv"."invoice_count", (0)::bigint) AS "total_invoices"
   FROM ((((((("public"."stripe_customers" "c"
     LEFT JOIN ( SELECT "stripe_payment_methods"."customer_id",
            "count"(*) AS "count"
           FROM "public"."stripe_payment_methods"
          GROUP BY "stripe_payment_methods"."customer_id") "pm_count" ON (("c"."id" = "pm_count"."customer_id")))
     LEFT JOIN ( SELECT "stripe_charges"."customer",
            "sum"("stripe_charges"."amount") AS "lifetime_value"
           FROM "public"."stripe_charges"
          WHERE ("stripe_charges"."status" = 'succeeded'::"text")
          GROUP BY "stripe_charges"."customer") "lv" ON (("c"."id" = "lv"."customer")))
     LEFT JOIN ( SELECT "stripe_charges"."customer",
            "count"(*) AS "payment_count"
           FROM "public"."stripe_charges"
          WHERE ("stripe_charges"."status" = 'succeeded'::"text")
          GROUP BY "stripe_charges"."customer") "pc" ON (("c"."id" = "pc"."customer")))
     LEFT JOIN ( SELECT "stripe_charges"."customer",
            "min"("stripe_charges"."created") AS "first_purchase_date"
           FROM "public"."stripe_charges"
          WHERE ("stripe_charges"."status" = 'succeeded'::"text")
          GROUP BY "stripe_charges"."customer") "fp" ON (("c"."id" = "fp"."customer")))
     LEFT JOIN ( SELECT "stripe_charges"."customer",
            "max"("stripe_charges"."created") AS "latest_purchase_date"
           FROM "public"."stripe_charges"
          WHERE ("stripe_charges"."status" = 'succeeded'::"text")
          GROUP BY "stripe_charges"."customer") "lp" ON (("c"."id" = "lp"."customer")))
     LEFT JOIN ( SELECT "stripe_subscriptions"."customer",
            "count"(*) AS "active_subscriptions"
           FROM "public"."stripe_subscriptions"
          WHERE ("stripe_subscriptions"."status" = 'active'::"text")
          GROUP BY "stripe_subscriptions"."customer") "subs" ON (("c"."id" = "subs"."customer")))
     LEFT JOIN ( SELECT "stripe_invoices"."customer",
            "count"(*) AS "invoice_count"
           FROM "public"."stripe_invoices"
          GROUP BY "stripe_invoices"."customer") "inv" ON (("c"."id" = "inv"."customer")));


ALTER TABLE "public"."v_customer_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_customer_purchase_history" WITH ("security_invoker"='true') AS
 SELECT "c"."id" AS "customer_id",
    "c"."email",
    "c"."name",
    "ch"."id" AS "charge_id",
    "ch"."amount",
    "ch"."currency",
    "ch"."status",
    "ch"."description",
    "ch"."created" AS "charge_date",
    "ch"."receipt_url",
    "ch"."payment_method_details",
    "i"."id" AS "invoice_id",
    "i"."number" AS "invoice_number",
    "i"."hosted_invoice_url",
    "p"."name" AS "product_name",
    "pr"."nickname" AS "price_nickname",
    "pr"."unit_amount",
    "pr"."currency" AS "price_currency"
   FROM (((("public"."stripe_customers" "c"
     JOIN "public"."stripe_charges" "ch" ON (("c"."id" = "ch"."customer")))
     LEFT JOIN "public"."stripe_invoices" "i" ON (("ch"."invoice" = "i"."id")))
     LEFT JOIN "public"."stripe_prices" "pr" ON (((("i"."lines" -> 0) ->> 'price'::"text") = "pr"."id")))
     LEFT JOIN "public"."stripe_products" "p" ON (("pr"."product" = "p"."id")))
  ORDER BY "c"."id", "ch"."created" DESC;


ALTER TABLE "public"."v_customer_purchase_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."video_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "video_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "views" integer DEFAULT 0,
    "downloads" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "avg_watch_time" integer DEFAULT 0,
    "completion_rate" numeric DEFAULT 0,
    "feedback_score" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."video_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."video_sharing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "video_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "recipient_email" "text",
    "recipient_id" "uuid",
    "access_level" "text" NOT NULL,
    "access_key" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "video_sharing_access_level_check" CHECK (("access_level" = ANY (ARRAY['view'::"text", 'edit'::"text", 'download'::"text"])))
);


ALTER TABLE "public"."video_sharing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "url" character varying(500) NOT NULL,
    "thumbnail_url" character varying(500),
    "duration" integer,
    "views" integer DEFAULT 0,
    "status" character varying(50) DEFAULT 'active'::character varying,
    "app_id" "uuid",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."videos" OWNER TO "postgres";


COMMENT ON TABLE "public"."videos" IS 'Multiple policies are intentional: Admin users need full access while regular users can only view their own videos';



CREATE TABLE IF NOT EXISTS "public"."view_filters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "view_type" "text" NOT NULL,
    "filter_config" "jsonb" DEFAULT '{}'::"jsonb",
    "sort_config" "jsonb" DEFAULT '{"field": "createdAt", "direction": "desc"}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "view_filters_view_type_check" CHECK (("view_type" = ANY (ARRAY['list'::"text", 'table'::"text", 'kanban'::"text", 'calendar'::"text", 'dashboard'::"text", 'timeline'::"text"])))
);


ALTER TABLE "public"."view_filters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."web_search_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "query" "text" NOT NULL,
    "results" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "searched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."web_search_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid",
    "tenant_id" "uuid",
    "name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "method" "text" DEFAULT 'POST'::"text",
    "headers" "jsonb" DEFAULT '{}'::"jsonb",
    "auth_type" "text",
    "auth_config" "jsonb" DEFAULT '{}'::"jsonb",
    "retry_count" integer DEFAULT 3,
    "retry_delay" integer DEFAULT 5,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "webhook_configs_auth_type_check" CHECK (("auth_type" = ANY (ARRAY['none'::"text", 'basic'::"text", 'bearer'::"text", 'api_key'::"text"]))),
    CONSTRAINT "webhook_configs_method_check" CHECK (("method" = ANY (ARRAY['POST'::"text", 'PUT'::"text", 'PATCH'::"text"])))
);


ALTER TABLE "public"."webhook_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "status_code" integer,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_config_id" "uuid",
    "form_submission_id" "uuid",
    "status_code" integer,
    "response_body" "text",
    "error_message" "text",
    "attempt_number" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."white_label_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "company_name" "text",
    "logo_url" "text",
    "primary_color" "text" DEFAULT '#3B82F6'::"text",
    "secondary_color" "text" DEFAULT '#6366F1'::"text",
    "hero_title" "text",
    "hero_subtitle" "text",
    "cta_buttons" "jsonb" DEFAULT '[]'::"jsonb",
    "redirect_mappings" "jsonb" DEFAULT '{}'::"jsonb",
    "show_pricing" boolean DEFAULT true,
    "show_testimonials" boolean DEFAULT true,
    "show_features" boolean DEFAULT true,
    "support_email" "text",
    "support_phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."white_label_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "trigger_data" "jsonb" NOT NULL,
    "execution_results" "jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "executed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_executions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_coordination_events"
    ADD CONSTRAINT "agent_coordination_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_coordination_logs"
    ADD CONSTRAINT "agent_coordination_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_metadata"
    ADD CONSTRAINT "agent_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_task_logs"
    ADD CONSTRAINT "agent_task_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_automation_settings"
    ADD CONSTRAINT "ai_automation_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_context_state"
    ADD CONSTRAINT "ai_context_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_context_state"
    ADD CONSTRAINT "ai_context_state_user_id_session_id_key" UNIQUE ("user_id", "session_id");



ALTER TABLE ONLY "public"."ai_enrichment_history"
    ADD CONSTRAINT "ai_enrichment_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_execution_history"
    ADD CONSTRAINT "ai_execution_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_function_calls"
    ADD CONSTRAINT "ai_function_calls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_generations"
    ADD CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_insights_enhanced"
    ADD CONSTRAINT "ai_insights_enhanced_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_model_preferences"
    ADD CONSTRAINT "ai_model_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_model_preferences"
    ADD CONSTRAINT "ai_model_preferences_user_id_content_type_key" UNIQUE ("user_id", "content_type");



ALTER TABLE ONLY "public"."ai_models"
    ADD CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_pending_actions"
    ADD CONSTRAINT "ai_pending_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_prompts"
    ADD CONSTRAINT "ai_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_undo_snapshots"
    ADD CONSTRAINT "ai_undo_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_metrics"
    ADD CONSTRAINT "ai_usage_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_metrics"
    ADD CONSTRAINT "ai_usage_metrics_user_id_metric_date_ai_provider_model_name_key" UNIQUE ("user_id", "metric_date", "ai_provider", "model_name");



ALTER TABLE ONLY "public"."ai_user_permissions"
    ADD CONSTRAINT "ai_user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_user_permissions"
    ADD CONSTRAINT "ai_user_permissions_user_id_tenant_id_key" UNIQUE ("user_id", "tenant_id");



ALTER TABLE ONLY "public"."ai_workflows"
    ADD CONSTRAINT "ai_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_time_series"
    ADD CONSTRAINT "analytics_time_series_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analyzed_documents"
    ADD CONSTRAINT "analyzed_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_access_logs"
    ADD CONSTRAINT "api_access_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_metrics"
    ADD CONSTRAINT "api_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_access"
    ADD CONSTRAINT "app_access_pkey" PRIMARY KEY ("customer_id", "app_id");



ALTER TABLE ONLY "public"."app_content"
    ADD CONSTRAINT "app_content_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."app_content_metadata"
    ADD CONSTRAINT "app_content_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_content"
    ADD CONSTRAINT "app_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_definitions"
    ADD CONSTRAINT "app_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_features"
    ADD CONSTRAINT "app_features_app_id_feature_id_key" UNIQUE ("app_id", "feature_id");



ALTER TABLE ONLY "public"."app_features"
    ADD CONSTRAINT "app_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_sync_history"
    ADD CONSTRAINT "app_sync_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apps"
    ADD CONSTRAINT "apps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apps"
    ADD CONSTRAINT "apps_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."assistant_reports"
    ADD CONSTRAINT "assistant_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_executions"
    ADD CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."builds"
    ADD CONSTRAINT "builds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_analyzer"
    ADD CONSTRAINT "business_analyzer_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cached_ai_responses"
    ADD CONSTRAINT "cached_ai_responses_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."cached_ai_responses"
    ADD CONSTRAINT "cached_ai_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."code_executions"
    ADD CONSTRAINT "code_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communication_logs"
    ADD CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communication_metrics"
    ADD CONSTRAINT "communication_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communication_metrics"
    ADD CONSTRAINT "communication_metrics_user_id_metric_date_communication_typ_key" UNIQUE ("user_id", "metric_date", "communication_type");



ALTER TABLE ONLY "public"."communication_records"
    ADD CONSTRAINT "communication_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communication_templates"
    ADD CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_logs"
    ADD CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_activities"
    ADD CONSTRAINT "contact_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_analytics"
    ADD CONSTRAINT "contact_analytics_contact_id_time_period_key" UNIQUE ("contact_id", "time_period");



ALTER TABLE ONLY "public"."contact_analytics"
    ADD CONSTRAINT "contact_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_files"
    ADD CONSTRAINT "contact_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_insights"
    ADD CONSTRAINT "contact_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_performance_metrics"
    ADD CONSTRAINT "contact_performance_metrics_contact_id_metric_date_key" UNIQUE ("contact_id", "metric_date");



ALTER TABLE ONLY "public"."contact_performance_metrics"
    ADD CONSTRAINT "contact_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_segments"
    ADD CONSTRAINT "contact_segments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_email_user_unique" UNIQUE ("email", "user_id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_generator_history"
    ADD CONSTRAINT "content_generator_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_generator_preferences"
    ADD CONSTRAINT "content_generator_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_generator_preferences"
    ADD CONSTRAINT "content_generator_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_templates"
    ADD CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_types"
    ADD CONSTRAINT "content_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_attachments"
    ADD CONSTRAINT "conversation_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_context_cache"
    ADD CONSTRAINT "conversation_context_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_contexts"
    ADD CONSTRAINT "conversation_contexts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_contexts"
    ADD CONSTRAINT "conversation_contexts_user_id_session_id_key" UNIQUE ("user_id", "session_id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversion_funnel"
    ADD CONSTRAINT "conversion_funnel_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_tracking"
    ADD CONSTRAINT "cost_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_bundles"
    ADD CONSTRAINT "credit_bundles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_usage_logs"
    ADD CONSTRAINT "credit_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_subdomain_key" UNIQUE ("subdomain");



ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_widget_layouts"
    ADD CONSTRAINT "dashboard_widget_layouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_deletion_requests"
    ADD CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_export_requests"
    ADD CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_attachments"
    ADD CONSTRAINT "deal_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_pipeline_metrics"
    ADD CONSTRAINT "deal_pipeline_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_pipeline_metrics"
    ADD CONSTRAINT "deal_pipeline_metrics_user_id_metric_date_stage_key" UNIQUE ("user_id", "metric_date", "stage");



ALTER TABLE ONLY "public"."deal_stages"
    ADD CONSTRAINT "deal_stages_customer_id_stage_order_key" UNIQUE ("customer_id", "stage_order");



ALTER TABLE ONLY "public"."deal_stages"
    ADD CONSTRAINT "deal_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_apps"
    ADD CONSTRAINT "demo_apps_app_key_key" UNIQUE ("app_key");



ALTER TABLE ONLY "public"."demo_apps"
    ADD CONSTRAINT "demo_apps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deployments"
    ADD CONSTRAINT "deployments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_analyses"
    ADD CONSTRAINT "email_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_compositions"
    ADD CONSTRAINT "email_compositions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_unsubscribes"
    ADD CONSTRAINT "email_unsubscribes_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."email_unsubscribes"
    ADD CONSTRAINT "email_unsubscribes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engagement_categories"
    ADD CONSTRAINT "engagement_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engagement_patterns"
    ADD CONSTRAINT "engagement_patterns_contact_id_pattern_type_key" UNIQUE ("contact_id", "pattern_type");



ALTER TABLE ONLY "public"."engagement_patterns"
    ADD CONSTRAINT "engagement_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enhanced_task_executions"
    ADD CONSTRAINT "enhanced_task_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enhanced_task_templates"
    ADD CONSTRAINT "enhanced_task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_pkey" PRIMARY KEY ("user_id", "product_name", "source_purchase_id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_access"
    ADD CONSTRAINT "feature_access_pkey" PRIMARY KEY ("role", "feature_name");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_conversions"
    ADD CONSTRAINT "funnel_conversions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_interactions"
    ADD CONSTRAINT "funnel_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_metrics_daily"
    ADD CONSTRAINT "funnel_metrics_daily_funnel_id_date_key" UNIQUE ("funnel_id", "date");



ALTER TABLE ONLY "public"."funnel_metrics_daily"
    ADD CONSTRAINT "funnel_metrics_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_responses"
    ADD CONSTRAINT "funnel_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_sessions"
    ADD CONSTRAINT "funnel_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_sessions"
    ADD CONSTRAINT "funnel_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."funnel_steps"
    ADD CONSTRAINT "funnel_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_views"
    ADD CONSTRAINT "funnel_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnels"
    ADD CONSTRAINT "funnels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_content"
    ADD CONSTRAINT "generated_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_videos"
    ADD CONSTRAINT "generated_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."image_assets"
    ADD CONSTRAINT "image_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_logs"
    ADD CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ip_blacklist"
    ADD CONSTRAINT "ip_blacklist_ip_address_key" UNIQUE ("ip_address");



ALTER TABLE ONLY "public"."ip_blacklist"
    ADD CONSTRAINT "ip_blacklist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journey_events"
    ADD CONSTRAINT "journey_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kanban_column_configs"
    ADD CONSTRAINT "kanban_column_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."linkedin_profiles"
    ADD CONSTRAINT "linkedin_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."linkedin_profiles"
    ADD CONSTRAINT "linkedin_profiles_user_id_linkedin_url_key" UNIQUE ("user_id", "linkedin_url");



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_performance_metrics"
    ADD CONSTRAINT "model_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."openai_embeddings"
    ADD CONSTRAINT "openai_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."openai_usage"
    ADD CONSTRAINT "openai_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_applications"
    ADD CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_customers"
    ADD CONSTRAINT "partner_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_stats"
    ADD CONSTRAINT "partner_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_subdomain_key" UNIQUE ("subdomain");



ALTER TABLE ONLY "public"."pending_entitlements"
    ADD CONSTRAINT "pending_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personalization_settings"
    ADD CONSTRAINT "personalization_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personalization_settings"
    ADD CONSTRAINT "personalization_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."personalization_tokens"
    ADD CONSTRAINT "personalization_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personalization_tokens"
    ADD CONSTRAINT "personalization_tokens_user_id_token_key_key" UNIQUE ("user_id", "token_key");



ALTER TABLE ONLY "public"."personalized_goal_recommendations"
    ADD CONSTRAINT "personalized_goal_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_statistics"
    ADD CONSTRAINT "platform_statistics_metric_key_key" UNIQUE ("metric_key");



ALTER TABLE ONLY "public"."platform_statistics"
    ADD CONSTRAINT "platform_statistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proactive_suggestions"
    ADD CONSTRAINT "proactive_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_analyses"
    ADD CONSTRAINT "product_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_mappings"
    ADD CONSTRAINT "product_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_mappings"
    ADD CONSTRAINT "product_mappings_provider_provider_product_id_key" UNIQUE ("provider", "provider_product_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."project_images"
    ADD CONSTRAINT "project_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."published_funnels"
    ADD CONSTRAINT "published_funnels_custom_domain_key" UNIQUE ("custom_domain");



ALTER TABLE ONLY "public"."published_funnels"
    ADD CONSTRAINT "published_funnels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."published_funnels"
    ADD CONSTRAINT "published_funnels_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."purchase_events"
    ADD CONSTRAINT "purchase_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_events"
    ADD CONSTRAINT "purchase_events_provider_provider_event_id_key" UNIQUE ("provider", "provider_event_id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_provider_purchase_id_key" UNIQUE ("provider_purchase_id");



ALTER TABLE ONLY "public"."rate_limit_logs"
    ADD CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reasoning_history"
    ADD CONSTRAINT "reasoning_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reference_images"
    ADD CONSTRAINT "reference_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relationship_mappings"
    ADD CONSTRAINT "relationship_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relationship_mappings"
    ADD CONSTRAINT "relationship_mappings_source_contact_id_target_contact_id_key" UNIQUE ("source_contact_id", "target_contact_id");



ALTER TABLE ONLY "public"."response_activities"
    ADD CONSTRAINT "response_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_activities"
    ADD CONSTRAINT "sales_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_goals"
    ADD CONSTRAINT "sales_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_sequences"
    ADD CONSTRAINT "sales_sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_documentation"
    ADD CONSTRAINT "security_audit_documentation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_deployment_queue"
    ADD CONSTRAINT "social_deployment_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_platform_connections"
    ADD CONSTRAINT "social_platform_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_platform_connections"
    ADD CONSTRAINT "social_platform_connections_user_id_platform_key" UNIQUE ("user_id", "platform");



ALTER TABLE ONLY "public"."social_webhook_events"
    ADD CONSTRAINT "social_webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."storage_bucket_config"
    ADD CONSTRAINT "storage_bucket_config_bucket_name_key" UNIQUE ("bucket_name");



ALTER TABLE ONLY "public"."storage_bucket_config"
    ADD CONSTRAINT "storage_bucket_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."storage_usage"
    ADD CONSTRAINT "storage_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."streaming_sessions"
    ADD CONSTRAINT "streaming_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_charges"
    ADD CONSTRAINT "stripe_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_checkout_sessions"
    ADD CONSTRAINT "stripe_checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_entitlements"
    ADD CONSTRAINT "stripe_entitlements_entitlement_id_key" UNIQUE ("entitlement_id");



ALTER TABLE ONLY "public"."stripe_entitlements"
    ADD CONSTRAINT "stripe_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_invoices"
    ADD CONSTRAINT "stripe_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_payment_intents"
    ADD CONSTRAINT "stripe_payment_intents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_payment_methods"
    ADD CONSTRAINT "stripe_payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_prices"
    ADD CONSTRAINT "stripe_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_products"
    ADD CONSTRAINT "stripe_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_plan_name_key" UNIQUE ("plan_name");



ALTER TABLE ONLY "public"."sync_jobs"
    ADD CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."table_column_preferences"
    ADD CONSTRAINT "table_column_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_business_outcomes"
    ADD CONSTRAINT "task_business_outcomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_executions"
    ADD CONSTRAINT "task_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_custom_domain_key" UNIQUE ("custom_domain");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_subdomain_key" UNIQUE ("subdomain");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timeline_view_preferences"
    ADD CONSTRAINT "timeline_view_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tool_execution_logs"
    ADD CONSTRAINT "tool_execution_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tooltip_categories"
    ADD CONSTRAINT "tooltip_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tooltip_configurations"
    ADD CONSTRAINT "tooltip_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_achievement_id_key" UNIQUE ("user_id", "achievement_id");



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_billing_profiles"
    ADD CONSTRAINT "user_billing_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_billing_profiles"
    ADD CONSTRAINT "user_billing_profiles_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."user_billing_profiles"
    ADD CONSTRAINT "user_billing_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_business_profiles"
    ADD CONSTRAINT "user_business_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_business_profiles"
    ADD CONSTRAINT "user_business_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_campaigns"
    ADD CONSTRAINT "user_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_user_id_product_sku_key" UNIQUE ("user_id", "product_sku");



ALTER TABLE ONLY "public"."user_fonts"
    ADD CONSTRAINT "user_fonts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_goals"
    ADD CONSTRAINT "user_goals_goal_name_key" UNIQUE ("goal_name");



ALTER TABLE ONLY "public"."user_goals"
    ADD CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_identities"
    ADD CONSTRAINT "user_identities_clerk_user_id_key" UNIQUE ("clerk_user_id");



ALTER TABLE ONLY "public"."user_identities"
    ADD CONSTRAINT "user_identities_pkey" PRIMARY KEY ("internal_user_id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_service_name_key" UNIQUE ("user_id", "service_name");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_projects"
    ADD CONSTRAINT "user_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."user_templates"
    ADD CONSTRAINT "user_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tenant_roles"
    ADD CONSTRAINT "user_tenant_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tenant_roles"
    ADD CONSTRAINT "user_tenant_roles_user_id_tenant_id_key" UNIQUE ("user_id", "tenant_id");



ALTER TABLE ONLY "public"."user_upload_logs"
    ADD CONSTRAINT "user_upload_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_view_preferences"
    ADD CONSTRAINT "user_view_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."video_analytics"
    ADD CONSTRAINT "video_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."video_sharing"
    ADD CONSTRAINT "video_sharing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."view_filters"
    ADD CONSTRAINT "view_filters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."view_filters"
    ADD CONSTRAINT "view_filters_user_id_view_type_key" UNIQUE ("user_id", "view_type");



ALTER TABLE ONLY "public"."web_search_results"
    ADD CONSTRAINT "web_search_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_configs"
    ADD CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."white_label_configs"
    ADD CONSTRAINT "white_label_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "app_settings_user_key_unique" ON "public"."app_settings" USING "btree" (COALESCE("user_id", '00000000-0000-0000-0000-000000000000'::"uuid"), "setting_key");



CREATE UNIQUE INDEX "dashboard_layouts_user_id_is_default_idx" ON "public"."dashboard_layouts" USING "btree" ("user_id") WHERE ("is_default" = true);



CREATE INDEX "idx_admin_audit_log_admin_user_id" ON "public"."admin_audit_log" USING "btree" ("admin_user_id");



CREATE INDEX "idx_agent_coordination_events_task_execution_id" ON "public"."agent_coordination_events" USING "btree" ("task_execution_id");



CREATE INDEX "idx_agent_coordination_logs_task_execution_id" ON "public"."agent_coordination_logs" USING "btree" ("task_execution_id");



CREATE INDEX "idx_agent_task_logs_task_execution_id" ON "public"."agent_task_logs" USING "btree" ("task_execution_id");



CREATE INDEX "idx_ai_context_state_current_funnel_id" ON "public"."ai_context_state" USING "btree" ("current_funnel_id");



CREATE INDEX "idx_ai_context_state_tenant_id" ON "public"."ai_context_state" USING "btree" ("tenant_id");



CREATE INDEX "idx_ai_execution_history_function_call_id" ON "public"."ai_execution_history" USING "btree" ("function_call_id");



CREATE INDEX "idx_ai_execution_history_tenant_id" ON "public"."ai_execution_history" USING "btree" ("tenant_id");



CREATE INDEX "idx_ai_execution_history_user_id" ON "public"."ai_execution_history" USING "btree" ("user_id");



CREATE INDEX "idx_ai_function_calls_tenant_id" ON "public"."ai_function_calls" USING "btree" ("tenant_id");



CREATE INDEX "idx_ai_function_calls_user_id" ON "public"."ai_function_calls" USING "btree" ("user_id");



CREATE INDEX "idx_ai_generations_user_id" ON "public"."ai_generations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_insights_created_at" ON "public"."ai_insights" USING "btree" ("created_at");



CREATE INDEX "idx_ai_insights_customer_id" ON "public"."ai_insights" USING "btree" ("customer_id");



CREATE INDEX "idx_ai_models_provider" ON "public"."ai_models" USING "btree" ("provider");



CREATE INDEX "idx_ai_pending_actions_function_call_id" ON "public"."ai_pending_actions" USING "btree" ("function_call_id");



CREATE INDEX "idx_ai_pending_actions_tenant_id" ON "public"."ai_pending_actions" USING "btree" ("tenant_id");



CREATE INDEX "idx_ai_pending_actions_user_id" ON "public"."ai_pending_actions" USING "btree" ("user_id");



CREATE INDEX "idx_ai_prompts_user_id" ON "public"."ai_prompts" USING "btree" ("user_id");



CREATE INDEX "idx_ai_undo_snapshots_execution_history_id" ON "public"."ai_undo_snapshots" USING "btree" ("execution_history_id");



CREATE INDEX "idx_ai_undo_snapshots_tenant_id" ON "public"."ai_undo_snapshots" USING "btree" ("tenant_id");



CREATE INDEX "idx_ai_undo_snapshots_user_id" ON "public"."ai_undo_snapshots" USING "btree" ("user_id");



CREATE INDEX "idx_ai_usage_logs_created_at" ON "public"."ai_usage_logs" USING "btree" ("created_at");



CREATE INDEX "idx_ai_usage_logs_customer_id" ON "public"."ai_usage_logs" USING "btree" ("customer_id");



CREATE INDEX "idx_ai_usage_logs_model_id" ON "public"."ai_usage_logs" USING "btree" ("model_id");



CREATE INDEX "idx_ai_user_permissions_tenant_id" ON "public"."ai_user_permissions" USING "btree" ("tenant_id");



CREATE INDEX "idx_ai_workflows_tenant_id" ON "public"."ai_workflows" USING "btree" ("tenant_id");



CREATE INDEX "idx_ai_workflows_user_id" ON "public"."ai_workflows" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_time_series_user_id" ON "public"."analytics_time_series" USING "btree" ("user_id");



CREATE INDEX "idx_analyzed_documents_user_id" ON "public"."analyzed_documents" USING "btree" ("user_id");



CREATE INDEX "idx_api_access_logs_api_key_id" ON "public"."api_access_logs" USING "btree" ("api_key_id");



CREATE INDEX "idx_api_access_logs_user_id" ON "public"."api_access_logs" USING "btree" ("user_id");



CREATE INDEX "idx_api_keys_user_id" ON "public"."api_keys" USING "btree" ("user_id");



CREATE INDEX "idx_api_metrics_created_at" ON "public"."api_metrics" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_api_metrics_endpoint" ON "public"."api_metrics" USING "btree" ("endpoint");



CREATE INDEX "idx_api_metrics_status_code" ON "public"."api_metrics" USING "btree" ("status_code");



CREATE INDEX "idx_api_usage_user_id" ON "public"."api_usage" USING "btree" ("user_id");



CREATE INDEX "idx_app_access_app_id" ON "public"."app_access" USING "btree" ("app_id");



CREATE INDEX "idx_app_content_key" ON "public"."app_content" USING "btree" ("key");



CREATE INDEX "idx_app_content_metadata_customer_id" ON "public"."app_content_metadata" USING "btree" ("customer_id");



CREATE INDEX "idx_app_content_metadata_uploaded_by" ON "public"."app_content_metadata" USING "btree" ("uploaded_by");



CREATE INDEX "idx_app_content_user_id" ON "public"."app_content" USING "btree" ("user_id");



CREATE INDEX "idx_app_features_feature_id" ON "public"."app_features" USING "btree" ("feature_id");



CREATE INDEX "idx_app_settings_user_id" ON "public"."app_settings" USING "btree" ("user_id");



CREATE INDEX "idx_app_sync_history_app_id" ON "public"."app_sync_history" USING "btree" ("app_id");



CREATE INDEX "idx_app_sync_history_customer_id" ON "public"."app_sync_history" USING "btree" ("customer_id");



CREATE INDEX "idx_appointments_customer_id" ON "public"."appointments" USING "btree" ("customer_id");



CREATE INDEX "idx_appointments_deal_id" ON "public"."appointments" USING "btree" ("deal_id");



CREATE INDEX "idx_assistant_reports_user_id" ON "public"."assistant_reports" USING "btree" ("user_id");



CREATE INDEX "idx_automation_executions_automation_rule_id" ON "public"."automation_executions" USING "btree" ("automation_rule_id");



CREATE INDEX "idx_automation_executions_contact_id" ON "public"."automation_executions" USING "btree" ("contact_id");



CREATE INDEX "idx_automation_rules_customer_id" ON "public"."automation_rules" USING "btree" ("customer_id");



CREATE INDEX "idx_campaigns_user_id" ON "public"."campaigns" USING "btree" ("user_id");



CREATE INDEX "idx_communication_logs_user_id" ON "public"."communication_logs" USING "btree" ("user_id");



CREATE INDEX "idx_communication_records_contact_id" ON "public"."communication_records" USING "btree" ("contact_id");



CREATE INDEX "idx_communication_records_user_id" ON "public"."communication_records" USING "btree" ("user_id");



CREATE INDEX "idx_communication_templates_customer_id" ON "public"."communication_templates" USING "btree" ("customer_id");



CREATE INDEX "idx_communications_customer_id" ON "public"."communications" USING "btree" ("customer_id");



CREATE INDEX "idx_communications_deal_id" ON "public"."communications" USING "btree" ("deal_id");



CREATE INDEX "idx_consent_logs_user_id" ON "public"."consent_logs" USING "btree" ("user_id");



CREATE INDEX "idx_contact_activities_contact_id" ON "public"."contact_activities" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_activities_user_id" ON "public"."contact_activities" USING "btree" ("user_id");



CREATE INDEX "idx_contact_analytics_user_id" ON "public"."contact_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_contact_files_contact_id" ON "public"."contact_files" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_files_user_id" ON "public"."contact_files" USING "btree" ("user_id");



CREATE INDEX "idx_contact_insights_contact_id" ON "public"."contact_insights" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_insights_user_id" ON "public"."contact_insights" USING "btree" ("user_id");



CREATE INDEX "idx_contact_segments_customer_id" ON "public"."contact_segments" USING "btree" ("customer_id");



CREATE INDEX "idx_content_generator_history_created_at" ON "public"."content_generator_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_content_generator_history_user_id" ON "public"."content_generator_history" USING "btree" ("user_id");



CREATE INDEX "idx_content_generator_preferences_user_id" ON "public"."content_generator_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_content_items_user_id" ON "public"."content_items" USING "btree" ("user_id");



CREATE INDEX "idx_content_templates_user_id" ON "public"."content_templates" USING "btree" ("user_id");



CREATE INDEX "idx_conversation_context_cache_user_id" ON "public"."conversation_context_cache" USING "btree" ("user_id");



CREATE INDEX "idx_conversation_messages_context_id" ON "public"."conversation_messages" USING "btree" ("context_id");



CREATE INDEX "idx_conversion_funnel_user_id" ON "public"."conversion_funnel" USING "btree" ("user_id");



CREATE INDEX "idx_cost_tracking_generation_id" ON "public"."cost_tracking" USING "btree" ("generation_id");



CREATE INDEX "idx_cost_tracking_tenant_id" ON "public"."cost_tracking" USING "btree" ("tenant_id");



CREATE INDEX "idx_cost_tracking_user_id" ON "public"."cost_tracking" USING "btree" ("user_id");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_credit_usage_logs_created_at" ON "public"."credit_usage_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_credit_usage_logs_feature_type" ON "public"."credit_usage_logs" USING "btree" ("feature_type");



CREATE INDEX "idx_credit_usage_logs_transaction_id" ON "public"."credit_usage_logs" USING "btree" ("transaction_id");



CREATE INDEX "idx_credit_usage_logs_user_id" ON "public"."credit_usage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_data_deletion_requests_user_id" ON "public"."data_deletion_requests" USING "btree" ("user_id");



CREATE INDEX "idx_data_export_requests_user_id" ON "public"."data_export_requests" USING "btree" ("user_id");



CREATE INDEX "idx_deal_attachments_deal_id" ON "public"."deal_attachments" USING "btree" ("deal_id");



CREATE INDEX "idx_deals_customer_id" ON "public"."deals" USING "btree" ("customer_id");



CREATE INDEX "idx_engagement_categories_user_id" ON "public"."engagement_categories" USING "btree" ("user_id");



CREATE INDEX "idx_engagement_patterns_user_id" ON "public"."engagement_patterns" USING "btree" ("user_id");



CREATE INDEX "idx_enhanced_task_executions_customer_id" ON "public"."enhanced_task_executions" USING "btree" ("customer_id");



CREATE INDEX "idx_enhanced_task_templates_customer_id" ON "public"."enhanced_task_templates" USING "btree" ("customer_id");



CREATE INDEX "idx_entitlements_product_name" ON "public"."entitlements" USING "btree" ("product_name");



CREATE INDEX "idx_entitlements_source_purchase_id" ON "public"."entitlements" USING "btree" ("source_purchase_id");



CREATE INDEX "idx_error_logs_created_at" ON "public"."error_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_error_logs_error_type" ON "public"."error_logs" USING "btree" ("error_type");



CREATE INDEX "idx_form_submissions_funnel_id" ON "public"."form_submissions" USING "btree" ("funnel_id");



CREATE INDEX "idx_form_submissions_published_funnel_id" ON "public"."form_submissions" USING "btree" ("published_funnel_id");



CREATE INDEX "idx_form_submissions_step_id" ON "public"."form_submissions" USING "btree" ("step_id");



CREATE INDEX "idx_funnel_conversions_funnel_id" ON "public"."funnel_conversions" USING "btree" ("funnel_id");



CREATE INDEX "idx_funnel_conversions_user_id" ON "public"."funnel_conversions" USING "btree" ("user_id");



CREATE INDEX "idx_funnel_interactions_funnel_id" ON "public"."funnel_interactions" USING "btree" ("funnel_id");



CREATE INDEX "idx_funnel_responses_funnel_id" ON "public"."funnel_responses" USING "btree" ("funnel_id");



CREATE INDEX "idx_funnel_responses_user_id" ON "public"."funnel_responses" USING "btree" ("user_id");



CREATE INDEX "idx_funnel_sessions_funnel_id" ON "public"."funnel_sessions" USING "btree" ("funnel_id");



CREATE INDEX "idx_funnel_sessions_user_id" ON "public"."funnel_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_funnel_steps_funnel_id" ON "public"."funnel_steps" USING "btree" ("funnel_id");



CREATE INDEX "idx_funnel_views_funnel_id" ON "public"."funnel_views" USING "btree" ("funnel_id");



CREATE INDEX "idx_funnel_views_user_id" ON "public"."funnel_views" USING "btree" ("user_id");



CREATE INDEX "idx_funnels_tenant_id" ON "public"."funnels" USING "btree" ("tenant_id");



CREATE INDEX "idx_funnels_user_id" ON "public"."funnels" USING "btree" ("user_id");



CREATE INDEX "idx_generated_content_content_type_id" ON "public"."generated_content" USING "btree" ("content_type_id");



CREATE INDEX "idx_generated_content_user_id" ON "public"."generated_content" USING "btree" ("user_id");



CREATE INDEX "idx_generated_images_user_id" ON "public"."generated_images" USING "btree" ("user_id");



CREATE INDEX "idx_generated_videos_image_id" ON "public"."generated_videos" USING "btree" ("image_id");



CREATE INDEX "idx_generated_videos_user_id" ON "public"."generated_videos" USING "btree" ("user_id");



CREATE INDEX "idx_image_assets_user_id" ON "public"."image_assets" USING "btree" ("user_id");



CREATE INDEX "idx_import_logs_user_id" ON "public"."import_logs" USING "btree" ("user_id");



CREATE INDEX "idx_ip_blacklist_created_by" ON "public"."ip_blacklist" USING "btree" ("created_by");



CREATE INDEX "idx_journey_events_contact_id" ON "public"."journey_events" USING "btree" ("contact_id");



CREATE INDEX "idx_journey_events_user_id" ON "public"."journey_events" USING "btree" ("user_id");



CREATE INDEX "idx_message_logs_user_id" ON "public"."message_logs" USING "btree" ("user_id");



CREATE INDEX "idx_openai_embeddings_user_id" ON "public"."openai_embeddings" USING "btree" ("user_id");



CREATE INDEX "idx_openai_usage_created_at" ON "public"."openai_usage" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_openai_usage_model" ON "public"."openai_usage" USING "btree" ("model");



CREATE INDEX "idx_partner_applications_partner_id" ON "public"."partner_applications" USING "btree" ("partner_id");



CREATE INDEX "idx_partner_customers_partner_id" ON "public"."partner_customers" USING "btree" ("partner_id");



CREATE INDEX "idx_partner_customers_tenant_id" ON "public"."partner_customers" USING "btree" ("tenant_id");



CREATE INDEX "idx_partner_stats_partner_id" ON "public"."partner_stats" USING "btree" ("partner_id");



CREATE INDEX "idx_pending_entitlements_claimed_by" ON "public"."pending_entitlements" USING "btree" ("claimed_by");



CREATE INDEX "idx_pending_entitlements_purchase_event_id" ON "public"."pending_entitlements" USING "btree" ("purchase_event_id");



CREATE INDEX "idx_product_analyses_user_id" ON "public"."product_analyses" USING "btree" ("user_id");



CREATE INDEX "idx_project_images_image_id" ON "public"."project_images" USING "btree" ("image_id");



CREATE INDEX "idx_project_images_project_id" ON "public"."project_images" USING "btree" ("project_id");



CREATE INDEX "idx_published_funnels_funnel_id" ON "public"."published_funnels" USING "btree" ("funnel_id");



CREATE INDEX "idx_published_funnels_tenant_id" ON "public"."published_funnels" USING "btree" ("tenant_id");



CREATE INDEX "idx_purchases_product_name" ON "public"."purchases" USING "btree" ("product_name");



CREATE INDEX "idx_reasoning_history_generation_id" ON "public"."reasoning_history" USING "btree" ("generation_id");



CREATE INDEX "idx_reasoning_history_user_id" ON "public"."reasoning_history" USING "btree" ("user_id");



CREATE INDEX "idx_reference_images_user_id" ON "public"."reference_images" USING "btree" ("user_id");



CREATE INDEX "idx_relationship_mappings_target_contact_id" ON "public"."relationship_mappings" USING "btree" ("target_contact_id");



CREATE INDEX "idx_relationship_mappings_user_id" ON "public"."relationship_mappings" USING "btree" ("user_id");



CREATE INDEX "idx_response_activities_response_id" ON "public"."response_activities" USING "btree" ("response_id");



CREATE INDEX "idx_response_activities_user_id" ON "public"."response_activities" USING "btree" ("user_id");



CREATE INDEX "idx_sales_activities_appointment_id" ON "public"."sales_activities" USING "btree" ("appointment_id");



CREATE INDEX "idx_sales_activities_communication_id" ON "public"."sales_activities" USING "btree" ("communication_id");



CREATE INDEX "idx_sales_activities_customer_id" ON "public"."sales_activities" USING "btree" ("customer_id");



CREATE INDEX "idx_sales_activities_deal_id" ON "public"."sales_activities" USING "btree" ("deal_id");



CREATE INDEX "idx_sales_goals_customer_id" ON "public"."sales_goals" USING "btree" ("customer_id");



CREATE INDEX "idx_sales_sequences_customer_id" ON "public"."sales_sequences" USING "btree" ("customer_id");



CREATE INDEX "idx_security_events_user_id" ON "public"."security_events" USING "btree" ("user_id");



CREATE INDEX "idx_social_deployment_queue_content_item_id" ON "public"."social_deployment_queue" USING "btree" ("content_item_id");



CREATE INDEX "idx_storage_usage_user_id" ON "public"."storage_usage" USING "btree" ("user_id");



CREATE INDEX "idx_streaming_sessions_user_id" ON "public"."streaming_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_stripe_charges_customer" ON "public"."stripe_charges" USING "btree" ("customer");



CREATE INDEX "idx_stripe_entitlements_user_id" ON "public"."stripe_entitlements" USING "btree" ("user_id");



CREATE INDEX "idx_stripe_payment_methods_customer_id" ON "public"."stripe_payment_methods" USING "btree" ("customer_id");



CREATE INDEX "idx_stripe_prices_product" ON "public"."stripe_prices" USING "btree" ("product");



CREATE INDEX "idx_sync_jobs_started_by" ON "public"."sync_jobs" USING "btree" ("started_by");



CREATE INDEX "idx_task_business_outcomes_task_execution_id" ON "public"."task_business_outcomes" USING "btree" ("task_execution_id");



CREATE INDEX "idx_task_executions_customer_id" ON "public"."task_executions" USING "btree" ("customer_id");



CREATE INDEX "idx_task_templates_customer_id" ON "public"."task_templates" USING "btree" ("customer_id");



CREATE INDEX "idx_tool_execution_logs_generation_id" ON "public"."tool_execution_logs" USING "btree" ("generation_id");



CREATE INDEX "idx_tool_execution_logs_user_id" ON "public"."tool_execution_logs" USING "btree" ("user_id");



CREATE INDEX "idx_usage_logs_user_id" ON "public"."usage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_achievements_achievement_id" ON "public"."user_achievements" USING "btree" ("achievement_id");



CREATE INDEX "idx_user_analytics_user_id" ON "public"."user_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_user_billing_profiles_stripe_customer" ON "public"."user_billing_profiles" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_user_billing_profiles_user_id" ON "public"."user_billing_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_campaigns_user_id" ON "public"."user_campaigns" USING "btree" ("user_id");



CREATE INDEX "idx_user_fonts_user_id" ON "public"."user_fonts" USING "btree" ("user_id");



CREATE INDEX "idx_user_identities_customer_id" ON "public"."user_identities" USING "btree" ("customer_id");



CREATE INDEX "idx_user_projects_user_id" ON "public"."user_projects" USING "btree" ("user_id");



CREATE INDEX "idx_user_subscriptions_stripe_id" ON "public"."user_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_user_subscriptions_user_id" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_user_templates_user_id" ON "public"."user_templates" USING "btree" ("user_id");



CREATE INDEX "idx_user_tenant_roles_tenant_id" ON "public"."user_tenant_roles" USING "btree" ("tenant_id");



CREATE INDEX "idx_user_upload_logs_user_id" ON "public"."user_upload_logs" USING "btree" ("user_id");



CREATE INDEX "idx_video_analytics_user_id" ON "public"."video_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_video_sharing_owner_id" ON "public"."video_sharing" USING "btree" ("owner_id");



CREATE INDEX "idx_video_sharing_recipient_id" ON "public"."video_sharing" USING "btree" ("recipient_id");



CREATE INDEX "idx_videos_app_id" ON "public"."videos" USING "btree" ("app_id");



CREATE INDEX "idx_videos_user_id" ON "public"."videos" USING "btree" ("user_id");



CREATE INDEX "idx_web_search_results_message_id" ON "public"."web_search_results" USING "btree" ("message_id");



CREATE INDEX "idx_webhook_configs_funnel_id" ON "public"."webhook_configs" USING "btree" ("funnel_id");



CREATE INDEX "idx_webhook_configs_tenant_id" ON "public"."webhook_configs" USING "btree" ("tenant_id");



CREATE INDEX "idx_webhook_deliveries_tenant_id" ON "public"."webhook_deliveries" USING "btree" ("tenant_id");



CREATE INDEX "idx_webhook_logs_form_submission_id" ON "public"."webhook_logs" USING "btree" ("form_submission_id");



CREATE INDEX "idx_webhook_logs_webhook_config_id" ON "public"."webhook_logs" USING "btree" ("webhook_config_id");



CREATE INDEX "idx_white_label_configs_tenant_id" ON "public"."white_label_configs" USING "btree" ("tenant_id");



CREATE INDEX "idx_workflow_executions_customer_id" ON "public"."workflow_executions" USING "btree" ("customer_id");



CREATE INDEX "idx_workflow_executions_workflow_id" ON "public"."workflow_executions" USING "btree" ("workflow_id");



CREATE INDEX "social_deployment_queue_scheduled_for_idx" ON "public"."social_deployment_queue" USING "btree" ("scheduled_for");



CREATE INDEX "social_deployment_queue_status_idx" ON "public"."social_deployment_queue" USING "btree" ("status");



CREATE INDEX "social_deployment_queue_user_id_idx" ON "public"."social_deployment_queue" USING "btree" ("user_id");



CREATE INDEX "social_platform_connections_platform_idx" ON "public"."social_platform_connections" USING "btree" ("platform");



CREATE INDEX "social_platform_connections_user_id_idx" ON "public"."social_platform_connections" USING "btree" ("user_id");



CREATE INDEX "social_webhook_events_status_idx" ON "public"."social_webhook_events" USING "btree" ("status");



CREATE INDEX "social_webhook_events_user_id_idx" ON "public"."social_webhook_events" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "audit_admin_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();



CREATE OR REPLACE TRIGGER "audit_app_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."app_users" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();



CREATE OR REPLACE TRIGGER "audit_apps" AFTER INSERT OR DELETE OR UPDATE ON "public"."apps" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();



CREATE OR REPLACE TRIGGER "audit_features" AFTER INSERT OR DELETE OR UPDATE ON "public"."features" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();



CREATE OR REPLACE TRIGGER "audit_videos" AFTER INSERT OR DELETE OR UPDATE ON "public"."videos" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();



CREATE OR REPLACE TRIGGER "create_default_deal_stages_trigger" AFTER INSERT ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_deal_stages"();



CREATE OR REPLACE TRIGGER "demo_apps_updated_at" BEFORE UPDATE ON "public"."demo_apps" FOR EACH ROW EXECUTE FUNCTION "public"."update_demo_apps_updated_at"();



CREATE OR REPLACE TRIGGER "log_response_status_change_trigger" AFTER UPDATE ON "public"."funnel_responses" FOR EACH ROW EXECUTE FUNCTION "public"."log_response_status_change"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_ai_models_updated_at_trigger" BEFORE UPDATE ON "public"."ai_models" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_models_updated_at"();



CREATE OR REPLACE TRIGGER "update_app_content_metadata_updated_at_trigger" BEFORE UPDATE ON "public"."app_content_metadata" FOR EACH ROW EXECUTE FUNCTION "public"."update_app_content_metadata_updated_at"();



CREATE OR REPLACE TRIGGER "update_app_settings_updated_at_trigger" BEFORE UPDATE ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_app_settings_updated_at"();



CREATE OR REPLACE TRIGGER "update_content_generator_preferences_updated_at" BEFORE UPDATE ON "public"."content_generator_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversation_contexts_updated_at_trigger" BEFORE UPDATE ON "public"."conversation_contexts" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_contexts_updated_at"();



CREATE OR REPLACE TRIGGER "update_credit_bundles_updated_at" BEFORE UPDATE ON "public"."credit_bundles" FOR EACH ROW EXECUTE FUNCTION "public"."update_billing_updated_at"();



CREATE OR REPLACE TRIGGER "update_dashboard_layouts_updated_at" BEFORE UPDATE ON "public"."dashboard_layouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_dashboard_layouts_updated_at"();



CREATE OR REPLACE TRIGGER "update_funnel_metrics_daily_updated_at_trigger" BEFORE UPDATE ON "public"."funnel_metrics_daily" FOR EACH ROW EXECUTE FUNCTION "public"."update_funnel_sessions_updated_at"();



CREATE OR REPLACE TRIGGER "update_funnel_responses_updated_at_trigger" BEFORE UPDATE ON "public"."funnel_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_funnel_responses_updated_at"();



CREATE OR REPLACE TRIGGER "update_funnel_sessions_updated_at_trigger" BEFORE UPDATE ON "public"."funnel_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_funnel_sessions_updated_at"();



CREATE OR REPLACE TRIGGER "update_personalized_goal_recommendations_updated_at_trigger" BEFORE UPDATE ON "public"."personalized_goal_recommendations" FOR EACH ROW EXECUTE FUNCTION "public"."update_personalized_goal_recommendations_updated_at"();



CREATE OR REPLACE TRIGGER "update_subscription_plans_updated_at" BEFORE UPDATE ON "public"."subscription_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_billing_updated_at"();



CREATE OR REPLACE TRIGGER "update_tenant_claims" AFTER INSERT OR UPDATE ON "public"."user_tenant_roles" FOR EACH ROW EXECUTE FUNCTION "public"."set_tenant_claims"();



CREATE OR REPLACE TRIGGER "update_user_billing_profiles_updated_at" BEFORE UPDATE ON "public"."user_billing_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_billing_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_business_profiles_updated_at_trigger" BEFORE UPDATE ON "public"."user_business_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_business_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_subscriptions_updated_at" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_billing_updated_at"();



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."agent_coordination_events"
    ADD CONSTRAINT "agent_coordination_events_task_execution_id_fkey" FOREIGN KEY ("task_execution_id") REFERENCES "public"."enhanced_task_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_coordination_logs"
    ADD CONSTRAINT "agent_coordination_logs_task_execution_id_fkey" FOREIGN KEY ("task_execution_id") REFERENCES "public"."task_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_task_logs"
    ADD CONSTRAINT "agent_task_logs_task_execution_id_fkey" FOREIGN KEY ("task_execution_id") REFERENCES "public"."task_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_context_state"
    ADD CONSTRAINT "ai_context_state_current_funnel_id_fkey" FOREIGN KEY ("current_funnel_id") REFERENCES "public"."funnels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_context_state"
    ADD CONSTRAINT "ai_context_state_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_context_state"
    ADD CONSTRAINT "ai_context_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_execution_history"
    ADD CONSTRAINT "ai_execution_history_function_call_id_fkey" FOREIGN KEY ("function_call_id") REFERENCES "public"."ai_function_calls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_execution_history"
    ADD CONSTRAINT "ai_execution_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_execution_history"
    ADD CONSTRAINT "ai_execution_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_function_calls"
    ADD CONSTRAINT "ai_function_calls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_function_calls"
    ADD CONSTRAINT "ai_function_calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_generations"
    ADD CONSTRAINT "ai_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_model_preferences"
    ADD CONSTRAINT "ai_model_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_pending_actions"
    ADD CONSTRAINT "ai_pending_actions_function_call_id_fkey" FOREIGN KEY ("function_call_id") REFERENCES "public"."ai_function_calls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_pending_actions"
    ADD CONSTRAINT "ai_pending_actions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_pending_actions"
    ADD CONSTRAINT "ai_pending_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_prompts"
    ADD CONSTRAINT "ai_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_undo_snapshots"
    ADD CONSTRAINT "ai_undo_snapshots_execution_history_id_fkey" FOREIGN KEY ("execution_history_id") REFERENCES "public"."ai_execution_history"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_undo_snapshots"
    ADD CONSTRAINT "ai_undo_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_undo_snapshots"
    ADD CONSTRAINT "ai_undo_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_user_permissions"
    ADD CONSTRAINT "ai_user_permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_user_permissions"
    ADD CONSTRAINT "ai_user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_workflows"
    ADD CONSTRAINT "ai_workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_workflows"
    ADD CONSTRAINT "ai_workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_time_series"
    ADD CONSTRAINT "analytics_time_series_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analyzed_documents"
    ADD CONSTRAINT "analyzed_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_access_logs"
    ADD CONSTRAINT "api_access_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_access_logs"
    ADD CONSTRAINT "api_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_access"
    ADD CONSTRAINT "app_access_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."app_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_access"
    ADD CONSTRAINT "app_access_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_content_metadata"
    ADD CONSTRAINT "app_content_metadata_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_content_metadata"
    ADD CONSTRAINT "app_content_metadata_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_content"
    ADD CONSTRAINT "app_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_features"
    ADD CONSTRAINT "app_features_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_features"
    ADD CONSTRAINT "app_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_sync_history"
    ADD CONSTRAINT "app_sync_history_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."app_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_sync_history"
    ADD CONSTRAINT "app_sync_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id");



ALTER TABLE ONLY "public"."assistant_reports"
    ADD CONSTRAINT "assistant_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_executions"
    ADD CONSTRAINT "automation_executions_automation_rule_id_fkey" FOREIGN KEY ("automation_rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_executions"
    ADD CONSTRAINT "automation_executions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_logs"
    ADD CONSTRAINT "communication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_records"
    ADD CONSTRAINT "communication_records_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_records"
    ADD CONSTRAINT "communication_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communication_templates"
    ADD CONSTRAINT "communication_templates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id");



ALTER TABLE ONLY "public"."consent_logs"
    ADD CONSTRAINT "consent_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_activities"
    ADD CONSTRAINT "contact_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_activities"
    ADD CONSTRAINT "contact_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_analytics"
    ADD CONSTRAINT "contact_analytics_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_analytics"
    ADD CONSTRAINT "contact_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_files"
    ADD CONSTRAINT "contact_files_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_files"
    ADD CONSTRAINT "contact_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_insights"
    ADD CONSTRAINT "contact_insights_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_insights"
    ADD CONSTRAINT "contact_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_performance_metrics"
    ADD CONSTRAINT "contact_performance_metrics_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_segments"
    ADD CONSTRAINT "contact_segments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_generator_history"
    ADD CONSTRAINT "content_generator_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_generator_preferences"
    ADD CONSTRAINT "content_generator_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_templates"
    ADD CONSTRAINT "content_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_context_cache"
    ADD CONSTRAINT "conversation_context_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "public"."conversation_contexts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversion_funnel"
    ADD CONSTRAINT "conversion_funnel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cost_tracking"
    ADD CONSTRAINT "cost_tracking_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "public"."ai_generations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cost_tracking"
    ADD CONSTRAINT "cost_tracking_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cost_tracking"
    ADD CONSTRAINT "cost_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_usage_logs"
    ADD CONSTRAINT "credit_usage_logs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."credit_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_usage_logs"
    ADD CONSTRAINT "credit_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."data_deletion_requests"
    ADD CONSTRAINT "data_deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."data_export_requests"
    ADD CONSTRAINT "data_export_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_attachments"
    ADD CONSTRAINT "deal_attachments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_stages"
    ADD CONSTRAINT "deal_stages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."engagement_categories"
    ADD CONSTRAINT "engagement_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."engagement_patterns"
    ADD CONSTRAINT "engagement_patterns_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."engagement_patterns"
    ADD CONSTRAINT "engagement_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_task_executions"
    ADD CONSTRAINT "enhanced_task_executions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enhanced_task_templates"
    ADD CONSTRAINT "enhanced_task_templates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "public"."products"("name");



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_source_purchase_id_fkey" FOREIGN KEY ("source_purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_published_funnel_id_fkey" FOREIGN KEY ("published_funnel_id") REFERENCES "public"."published_funnels"("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."funnel_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_conversions"
    ADD CONSTRAINT "funnel_conversions_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_conversions"
    ADD CONSTRAINT "funnel_conversions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_interactions"
    ADD CONSTRAINT "funnel_interactions_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_metrics_daily"
    ADD CONSTRAINT "funnel_metrics_daily_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_responses"
    ADD CONSTRAINT "funnel_responses_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_responses"
    ADD CONSTRAINT "funnel_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_sessions"
    ADD CONSTRAINT "funnel_sessions_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_sessions"
    ADD CONSTRAINT "funnel_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnel_steps"
    ADD CONSTRAINT "funnel_steps_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_views"
    ADD CONSTRAINT "funnel_views_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_views"
    ADD CONSTRAINT "funnel_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnels"
    ADD CONSTRAINT "funnels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funnels"
    ADD CONSTRAINT "funnels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_content"
    ADD CONSTRAINT "generated_content_content_type_id_fkey" FOREIGN KEY ("content_type_id") REFERENCES "public"."content_types"("id");



ALTER TABLE ONLY "public"."generated_content"
    ADD CONSTRAINT "generated_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_videos"
    ADD CONSTRAINT "generated_videos_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."generated_images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_videos"
    ADD CONSTRAINT "generated_videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."image_assets"
    ADD CONSTRAINT "image_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_logs"
    ADD CONSTRAINT "import_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ip_blacklist"
    ADD CONSTRAINT "ip_blacklist_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."journey_events"
    ADD CONSTRAINT "journey_events_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journey_events"
    ADD CONSTRAINT "journey_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."linkedin_profiles"
    ADD CONSTRAINT "linkedin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."openai_embeddings"
    ADD CONSTRAINT "openai_embeddings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_applications"
    ADD CONSTRAINT "partner_applications_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id");



ALTER TABLE ONLY "public"."partner_customers"
    ADD CONSTRAINT "partner_customers_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id");



ALTER TABLE ONLY "public"."partner_customers"
    ADD CONSTRAINT "partner_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."partner_stats"
    ADD CONSTRAINT "partner_stats_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id");



ALTER TABLE ONLY "public"."pending_entitlements"
    ADD CONSTRAINT "pending_entitlements_claimed_by_fkey" FOREIGN KEY ("claimed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pending_entitlements"
    ADD CONSTRAINT "pending_entitlements_purchase_event_id_fkey" FOREIGN KEY ("purchase_event_id") REFERENCES "public"."purchase_events"("id");



ALTER TABLE ONLY "public"."personalization_settings"
    ADD CONSTRAINT "personalization_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personalization_tokens"
    ADD CONSTRAINT "personalization_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_analyses"
    ADD CONSTRAINT "product_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_images"
    ADD CONSTRAINT "project_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."generated_images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_images"
    ADD CONSTRAINT "project_images_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."user_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."published_funnels"
    ADD CONSTRAINT "published_funnels_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."published_funnels"
    ADD CONSTRAINT "published_funnels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "public"."products"("name");



ALTER TABLE ONLY "public"."reasoning_history"
    ADD CONSTRAINT "reasoning_history_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "public"."ai_generations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reasoning_history"
    ADD CONSTRAINT "reasoning_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reference_images"
    ADD CONSTRAINT "reference_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationship_mappings"
    ADD CONSTRAINT "relationship_mappings_source_contact_id_fkey" FOREIGN KEY ("source_contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationship_mappings"
    ADD CONSTRAINT "relationship_mappings_target_contact_id_fkey" FOREIGN KEY ("target_contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationship_mappings"
    ADD CONSTRAINT "relationship_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."response_activities"
    ADD CONSTRAINT "response_activities_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."funnel_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."response_activities"
    ADD CONSTRAINT "response_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_activities"
    ADD CONSTRAINT "sales_activities_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."sales_activities"
    ADD CONSTRAINT "sales_activities_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "public"."communications"("id");



ALTER TABLE ONLY "public"."sales_activities"
    ADD CONSTRAINT "sales_activities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_activities"
    ADD CONSTRAINT "sales_activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id");



ALTER TABLE ONLY "public"."sales_goals"
    ADD CONSTRAINT "sales_goals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_sequences"
    ADD CONSTRAINT "sales_sequences_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."social_deployment_queue"
    ADD CONSTRAINT "social_deployment_queue_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_deployment_queue"
    ADD CONSTRAINT "social_deployment_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_platform_connections"
    ADD CONSTRAINT "social_platform_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_webhook_events"
    ADD CONSTRAINT "social_webhook_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."storage_usage"
    ADD CONSTRAINT "storage_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."streaming_sessions"
    ADD CONSTRAINT "streaming_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_charges"
    ADD CONSTRAINT "stripe_charges_customer_fkey" FOREIGN KEY ("customer") REFERENCES "public"."stripe_customers"("id");



ALTER TABLE ONLY "public"."stripe_entitlements"
    ADD CONSTRAINT "stripe_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_payment_methods"
    ADD CONSTRAINT "stripe_payment_methods_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."stripe_customers"("id");



ALTER TABLE ONLY "public"."stripe_prices"
    ADD CONSTRAINT "stripe_prices_product_fkey" FOREIGN KEY ("product") REFERENCES "public"."stripe_products"("id");



ALTER TABLE ONLY "public"."sync_jobs"
    ADD CONSTRAINT "sync_jobs_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_business_outcomes"
    ADD CONSTRAINT "task_business_outcomes_task_execution_id_fkey" FOREIGN KEY ("task_execution_id") REFERENCES "public"."enhanced_task_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_executions"
    ADD CONSTRAINT "task_executions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_execution_logs"
    ADD CONSTRAINT "tool_execution_logs_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "public"."ai_generations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_execution_logs"
    ADD CONSTRAINT "tool_execution_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tooltip_configurations"
    ADD CONSTRAINT "tooltip_configurations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."tooltip_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "user_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_billing_profiles"
    ADD CONSTRAINT "user_billing_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_campaigns"
    ADD CONSTRAINT "user_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_fonts"
    ADD CONSTRAINT "user_fonts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_identities"
    ADD CONSTRAINT "user_identities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_projects"
    ADD CONSTRAINT "user_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_templates"
    ADD CONSTRAINT "user_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenant_roles"
    ADD CONSTRAINT "user_tenant_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenant_roles"
    ADD CONSTRAINT "user_tenant_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_upload_logs"
    ADD CONSTRAINT "user_upload_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."video_analytics"
    ADD CONSTRAINT "video_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_sharing"
    ADD CONSTRAINT "video_sharing_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_sharing"
    ADD CONSTRAINT "video_sharing_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."web_search_results"
    ADD CONSTRAINT "web_search_results_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."conversation_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_configs"
    ADD CONSTRAINT "webhook_configs_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_configs"
    ADD CONSTRAINT "webhook_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_webhook_config_id_fkey" FOREIGN KEY ("webhook_config_id") REFERENCES "public"."webhook_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."white_label_configs"
    ADD CONSTRAINT "white_label_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."automation_rules"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can manage app features" ON "public"."app_features" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE (("au"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("au"."role")::"text" = 'super_admin'::"text")))));



CREATE POLICY "Admin users can manage app users" ON "public"."app_users" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE (("au"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("au"."role")::"text" = ANY (ARRAY[('super_admin'::character varying)::"text", ('admin'::character varying)::"text"]))))));



CREATE POLICY "Admin users can view audit logs" ON "public"."admin_audit_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE (("au"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("au"."role")::"text" = ANY (ARRAY[('super_admin'::character varying)::"text", ('admin'::character varying)::"text"]))))));



CREATE POLICY "Admins can manage admin users" ON "public"."admin_users" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE (("au"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("au"."role")::"text" = 'super_admin'::"text")))));



CREATE POLICY "Admins can view import logs" ON "public"."import_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE (("au"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("au"."role")::"text" = ANY (ARRAY[('super_admin'::character varying)::"text", ('admin'::character varying)::"text"]))))));



CREATE POLICY "Allow all operations on dashboard_widget_layouts" ON "public"."dashboard_widget_layouts" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on kanban_column_configs" ON "public"."kanban_column_configs" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on table_column_preferences" ON "public"."table_column_preferences" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on timeline_view_preferences" ON "public"."timeline_view_preferences" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on user_view_preferences" ON "public"."user_view_preferences" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on view_filters" ON "public"."view_filters" USING (true) WITH CHECK (true);



CREATE POLICY "Allow anonymous users to manage communications" ON "public"."communications" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow anonymous users to manage deals" ON "public"."deals" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated read access to ai_models" ON "public"."ai_models" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete customers" ON "public"."customers" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert builds" ON "public"."builds" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert customers" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert deployments" ON "public"."deployments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to read builds" ON "public"."builds" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read customers" ON "public"."customers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read deployments" ON "public"."deployments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read feature_access" ON "public"."feature_access" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update customers" ON "public"."customers" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public read access to active platform statistics" ON "public"."platform_statistics" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Allow public read access to active testimonials" ON "public"."testimonials" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Allow public read access to tooltip categories" ON "public"."tooltip_categories" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Allow public read access to tooltip configurations" ON "public"."tooltip_configurations" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Allow public read on agent_metadata" ON "public"."agent_metadata" FOR SELECT USING (true);



CREATE POLICY "Allow read access to app_definitions" ON "public"."app_definitions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow service role to manage feature_access" ON "public"."feature_access" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Allow users to manage communications" ON "public"."communications" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow users to manage deals" ON "public"."deals" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Anonymous users can manage contacts" ON "public"."contacts" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Anonymous users can manage global settings" ON "public"."app_settings" TO "anon" USING (("user_id" IS NULL)) WITH CHECK (("user_id" IS NULL));



CREATE POLICY "Anyone can create consent logs" ON "public"."consent_logs" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert conversions" ON "public"."funnel_conversions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert funnel views" ON "public"."funnel_views" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert interactions" ON "public"."funnel_interactions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert response activities" ON "public"."response_activities" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert sessions" ON "public"."funnel_sessions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can submit form responses" ON "public"."funnel_responses" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can submit forms" ON "public"."form_submissions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can unsubscribe" ON "public"."email_unsubscribes" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can update sessions" ON "public"."funnel_sessions" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can view achievements" ON "public"."achievements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view active credit bundles" ON "public"."credit_bundles" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Anyone can view active subscription plans" ON "public"."subscription_plans" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Anyone can view challenges" ON "public"."challenges" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can create tenants" ON "public"."tenants" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can delete demo apps" ON "public"."demo_apps" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can insert demo apps" ON "public"."demo_apps" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can manage attachments" ON "public"."conversation_attachments" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Authenticated users can manage code executions" ON "public"."code_executions" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Authenticated users can read bucket config" ON "public"."storage_bucket_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read cached responses" ON "public"."cached_ai_responses" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read content types" ON "public"."content_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read model performance metrics" ON "public"."model_performance_metrics" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update demo apps" ON "public"."demo_apps" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can view metrics" ON "public"."ai_usage_metrics" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Authenticated users can view metrics" ON "public"."communication_metrics" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Authenticated users can view metrics" ON "public"."contact_performance_metrics" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Authenticated users can view metrics" ON "public"."deal_pipeline_metrics" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Authenticated users can view partner applications" ON "public"."partner_applications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view partner stats" ON "public"."partner_stats" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users on their own content" ON "public"."app_content" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."app_content" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."app_content" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users on their own content" ON "public"."app_content" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Only admins can manage security documentation" ON "public"."security_audit_documentation" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("admin_users"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("admin_users"."is_active" = true)))));



CREATE POLICY "Only authenticated users can view api metrics" ON "public"."api_metrics" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Only authenticated users can view error logs" ON "public"."error_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Only authenticated users can view openai usage" ON "public"."openai_usage" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Only owners can delete tenants" ON "public"."tenants" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "tenants"."id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_tenant_roles"."role" = 'owner'::"text")))));



CREATE POLICY "Owners and admins can remove users from tenant" ON "public"."user_tenant_roles" FOR DELETE TO "authenticated" USING ((("user_id" <> ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles" "utr"
  WHERE (("utr"."tenant_id" = "user_tenant_roles"."tenant_id") AND ("utr"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("utr"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "Owners and admins can update tenants" ON "public"."tenants" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "tenants"."id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_tenant_roles"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "tenants"."id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_tenant_roles"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Owners and admins can update user roles" ON "public"."user_tenant_roles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles" "utr"
  WHERE (("utr"."tenant_id" = "user_tenant_roles"."tenant_id") AND ("utr"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("utr"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles" "utr"
  WHERE (("utr"."tenant_id" = "user_tenant_roles"."tenant_id") AND ("utr"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("utr"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Partner customers are viewable by authenticated users" ON "public"."partner_customers" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Partner customers can be inserted by authenticated users" ON "public"."partner_customers" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Partners are viewable by authenticated users" ON "public"."partners" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Partners can be inserted by authenticated users" ON "public"."partners" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Partners can be updated by owners" ON "public"."partners" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid"))::"text" = ("id")::"text"));



CREATE POLICY "Product mappings are admin only" ON "public"."product_mappings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Public can view demo apps" ON "public"."demo_apps" FOR SELECT USING (true);



CREATE POLICY "Published funnels are viewable" ON "public"."published_funnels" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "published_funnels"."tenant_id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR ("is_active" = true)));



CREATE POLICY "Purchase events are admin only" ON "public"."purchase_events" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Service role can manage blacklist" ON "public"."ip_blacklist" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage cache" ON "public"."cached_ai_responses" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage config" ON "public"."storage_bucket_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage deletion requests" ON "public"."data_deletion_requests" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage export requests" ON "public"."data_export_requests" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage rate limits" ON "public"."rate_limit_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage security events" ON "public"."security_events" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage submissions" ON "public"."form_submissions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can view unsubscribes" ON "public"."email_unsubscribes" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Stripe charges admin only" ON "public"."stripe_charges" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Stripe checkout sessions admin only" ON "public"."stripe_checkout_sessions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Stripe customers admin only" ON "public"."stripe_customers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Stripe invoices admin only" ON "public"."stripe_invoices" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Stripe payment intents admin only" ON "public"."stripe_payment_intents" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Stripe payment methods admin only" ON "public"."stripe_payment_methods" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Stripe prices admin only" ON "public"."stripe_prices" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Stripe products admin only" ON "public"."stripe_products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Stripe subscriptions admin only" ON "public"."stripe_subscriptions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Super admins can manage sync jobs" ON "public"."sync_jobs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



COMMENT ON POLICY "Super admins can manage sync jobs" ON "public"."sync_jobs" IS 'Super admins have full CRUD access to sync jobs';



CREATE POLICY "System can insert api metrics" ON "public"."api_metrics" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can insert audit logs" ON "public"."admin_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert billing profiles" ON "public"."user_billing_profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "System can insert error logs" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can insert execution history" ON "public"."ai_execution_history" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "System can insert openai usage" ON "public"."openai_usage" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can insert undo snapshots" ON "public"."ai_undo_snapshots" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "System can insert usage logs" ON "public"."usage_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can insert video analytics" ON "public"."video_analytics" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can update video analytics" ON "public"."video_analytics" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Tenant access to AI insights" ON "public"."ai_insights" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "ai_insights"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "ai_insights"."customer_id"))));



CREATE POLICY "Tenant access to agent_coordination_events" ON "public"."agent_coordination_events" TO "authenticated" USING (("task_execution_id" IN ( SELECT "enhanced_task_executions"."id"
   FROM ("public"."enhanced_task_executions"
     JOIN "public"."customers" ON (("customers"."id" = "enhanced_task_executions"."customer_id")))
  WHERE ("customers"."id" = "enhanced_task_executions"."customer_id"))));



CREATE POLICY "Tenant access to ai_usage_logs" ON "public"."ai_usage_logs" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "ai_usage_logs"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "ai_usage_logs"."customer_id"))));



CREATE POLICY "Tenant access to app_access" ON "public"."app_access" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "app_access"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "app_access"."customer_id"))));



CREATE POLICY "Tenant access to app_sync_history" ON "public"."app_sync_history" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "app_sync_history"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "app_sync_history"."customer_id"))));



CREATE POLICY "Tenant access to appointments" ON "public"."appointments" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "appointments"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "appointments"."customer_id"))));



CREATE POLICY "Tenant access to automation rules" ON "public"."automation_rules" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "automation_rules"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "automation_rules"."customer_id"))));



CREATE POLICY "Tenant access to communication_templates" ON "public"."communication_templates" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "communication_templates"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "communication_templates"."customer_id"))));



CREATE POLICY "Tenant access to contact_segments" ON "public"."contact_segments" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "contact_segments"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "contact_segments"."customer_id"))));



CREATE POLICY "Tenant access to deal_stages" ON "public"."deal_stages" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "deal_stages"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "deal_stages"."customer_id"))));



CREATE POLICY "Tenant access to enhanced_task_executions" ON "public"."enhanced_task_executions" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "enhanced_task_executions"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "enhanced_task_executions"."customer_id"))));



CREATE POLICY "Tenant access to enhanced_task_templates" ON "public"."enhanced_task_templates" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "enhanced_task_templates"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "enhanced_task_templates"."customer_id"))));



CREATE POLICY "Tenant access to sales_activities" ON "public"."sales_activities" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "sales_activities"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "sales_activities"."customer_id"))));



CREATE POLICY "Tenant access to sales_goals" ON "public"."sales_goals" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "sales_goals"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "sales_goals"."customer_id"))));



CREATE POLICY "Tenant access to sales_sequences" ON "public"."sales_sequences" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "sales_sequences"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "sales_sequences"."customer_id"))));



CREATE POLICY "Tenant access to task_business_outcomes" ON "public"."task_business_outcomes" TO "authenticated" USING (("task_execution_id" IN ( SELECT "enhanced_task_executions"."id"
   FROM ("public"."enhanced_task_executions"
     JOIN "public"."customers" ON (("customers"."id" = "enhanced_task_executions"."customer_id")))
  WHERE ("customers"."id" = "enhanced_task_executions"."customer_id"))));



CREATE POLICY "Tenant access to user_identities" ON "public"."user_identities" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "user_identities"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "user_identities"."customer_id"))));



CREATE POLICY "Tenant access to webhook_deliveries" ON "public"."webhook_deliveries" TO "authenticated" USING (("tenant_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "webhook_deliveries"."tenant_id")))) WITH CHECK (("tenant_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "webhook_deliveries"."tenant_id"))));



CREATE POLICY "Tenant access to workflow executions" ON "public"."workflow_executions" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "workflow_executions"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "workflow_executions"."customer_id"))));



CREATE POLICY "Tenant members can delete published funnels" ON "public"."published_funnels" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "published_funnels"."tenant_id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Tenant members can manage webhooks" ON "public"."webhook_configs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "webhook_configs"."tenant_id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "webhook_configs"."tenant_id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Tenant members can modify published funnels" ON "public"."published_funnels" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "published_funnels"."tenant_id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Tenant members can update published funnels" ON "public"."published_funnels" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "published_funnels"."tenant_id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "published_funnels"."tenant_id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Tenant members can view submissions" ON "public"."form_submissions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."published_funnels" "pf"
     JOIN "public"."user_tenant_roles" "utr" ON (("utr"."tenant_id" = "pf"."tenant_id")))
  WHERE (("pf"."id" = "form_submissions"."published_funnel_id") AND ("utr"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Tenant members can view webhook logs" ON "public"."webhook_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."webhook_configs" "wc"
     JOIN "public"."user_tenant_roles" "utr" ON (("utr"."tenant_id" = "wc"."tenant_id")))
  WHERE (("wc"."id" = "webhook_logs"."webhook_config_id") AND ("utr"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can access messages in their contexts" ON "public"."conversation_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_contexts" "cc"
  WHERE (("cc"."id" = "conversation_messages"."context_id") AND ("cc"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can access their own AI insights" ON "public"."ai_insights_enhanced" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can access their own goal recommendations" ON "public"."personalized_goal_recommendations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can access their own suggestions" ON "public"."proactive_suggestions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can add tenant roles" ON "public"."user_tenant_roles" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles" "existing"
  WHERE (("existing"."tenant_id" = "user_tenant_roles"."tenant_id") AND ("existing"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("existing"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))) OR (("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role" = 'owner'::"text"))));



CREATE POLICY "Users can create deletion requests" ON "public"."data_deletion_requests" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create export requests" ON "public"."data_export_requests" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create their own API keys" ON "public"."api_keys" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete from own deployment queue" ON "public"."social_deployment_queue" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own AI prompts" ON "public"."ai_prompts" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own automation executions" ON "public"."automation_executions" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own contacts" ON "public"."contacts" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own content items" ON "public"."content_items" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own context state" ON "public"."ai_context_state" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own email analyses" ON "public"."email_analyses" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own email compositions" ON "public"."email_compositions" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own history" ON "public"."content_generator_history" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own image assets" ON "public"."image_assets" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own model preferences" ON "public"."ai_model_preferences" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own non-default templates" ON "public"."email_templates" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("is_default" = false)));



CREATE POLICY "Users can delete own platform connections" ON "public"."social_platform_connections" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own preferences" ON "public"."content_generator_preferences" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete responses from their funnels" ON "public"."funnel_responses" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their analytics" ON "public"."contact_analytics" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their communications" ON "public"."communication_records" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their files" ON "public"."contact_files" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their insights" ON "public"."contact_insights" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their journey events" ON "public"."journey_events" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own API keys" ON "public"."api_keys" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own campaigns" ON "public"."user_campaigns" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own sharing settings" ON "public"."video_sharing" FOR DELETE TO "authenticated" USING (("owner_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete their own templates" ON "public"."user_templates" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their patterns" ON "public"."engagement_patterns" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their relationships" ON "public"."relationship_mappings" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert AI metrics" ON "public"."ai_usage_metrics" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert analytics for their contacts" ON "public"."contact_analytics" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_analytics"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert comm metrics" ON "public"."communication_metrics" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert communications for their contacts" ON "public"."communication_records" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "communication_records"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert contact performance metrics" ON "public"."contact_performance_metrics" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert files for their contacts" ON "public"."contact_files" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_files"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert insights for their contacts" ON "public"."contact_insights" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_insights"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert into deployment queue" ON "public"."social_deployment_queue" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert journey events for their contacts" ON "public"."journey_events" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "journey_events"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert own AI generations" ON "public"."ai_generations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own AI prompts" ON "public"."ai_prompts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own API usage" ON "public"."api_usage" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own automation executions" ON "public"."automation_executions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own contacts" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own content items" ON "public"."content_items" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own context state" ON "public"."ai_context_state" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own cost tracking" ON "public"."cost_tracking" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own email analyses" ON "public"."email_analyses" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own email compositions" ON "public"."email_compositions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own function calls" ON "public"."ai_function_calls" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own history" ON "public"."content_generator_history" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own image assets" ON "public"."image_assets" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own model preferences" ON "public"."ai_model_preferences" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own pending actions" ON "public"."ai_pending_actions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own permissions" ON "public"."ai_user_permissions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own platform connections" ON "public"."social_platform_connections" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own preferences" ON "public"."content_generator_preferences" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own reasoning history" ON "public"."reasoning_history" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own templates" ON "public"."email_templates" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own tool execution logs" ON "public"."tool_execution_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own webhook events" ON "public"."social_webhook_events" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own workflows" ON "public"."ai_workflows" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert patterns for their contacts" ON "public"."engagement_patterns" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "engagement_patterns"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert pipeline metrics" ON "public"."deal_pipeline_metrics" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert relationships for their contacts" ON "public"."relationship_mappings" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "relationship_mappings"."source_contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "relationship_mappings"."target_contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert their own analytics data" ON "public"."user_analytics" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own campaigns" ON "public"."user_campaigns" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own conversion funnel" ON "public"."conversion_funnel" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own engagement categories" ON "public"."engagement_categories" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own message logs" ON "public"."message_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own templates" ON "public"."user_templates" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own time series data" ON "public"."analytics_time_series" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own upload logs" ON "public"."user_upload_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage all tasks" ON "public"."tasks" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can manage automation settings" ON "public"."ai_automation_settings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can manage own LinkedIn profiles" ON "public"."linkedin_profiles" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own business analyses" ON "public"."business_analyzer" TO "authenticated" USING (("user_id" = (( SELECT "auth"."uid"() AS "uid"))::"text")) WITH CHECK (("user_id" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users can manage own contact activities" ON "public"."contact_activities" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own content" ON "public"."generated_content" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own conversation cache" ON "public"."conversation_context_cache" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own documents" ON "public"."analyzed_documents" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own fonts" ON "public"."user_fonts" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own funnels" ON "public"."funnels" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own images" ON "public"."generated_images" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own personalization tokens" ON "public"."personalization_tokens" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own preferences" ON "public"."user_preferences" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own profile" ON "public"."profiles" TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own projects" ON "public"."user_projects" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own reference images" ON "public"."reference_images" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own settings" ON "public"."app_settings" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own storage usage" ON "public"."storage_usage" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own streaming sessions" ON "public"."streaming_sessions" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own videos" ON "public"."generated_videos" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage project images" ON "public"."project_images" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_projects" "up"
  WHERE (("up"."id" = "project_images"."project_id") AND ("up"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can manage their campaigns" ON "public"."campaigns" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their communications" ON "public"."communication_logs" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their funnel steps" ON "public"."funnel_steps" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."funnels"
  WHERE (("funnels"."id" = "funnel_steps"."funnel_id") AND ("funnels"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can manage their integrations" ON "public"."user_integrations" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own analyses" ON "public"."product_analyses" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own business profile" ON "public"."user_business_profiles" TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid"))::"text" = ("user_id")::"text")) WITH CHECK (((( SELECT "auth"."uid"() AS "uid"))::"text" = ("user_id")::"text"));



CREATE POLICY "Users can manage their own conversation contexts" ON "public"."conversation_contexts" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own dashboard layouts" ON "public"."dashboard_layouts" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own embeddings" ON "public"."openai_embeddings" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own file metadata" ON "public"."app_content_metadata" TO "authenticated" USING (("uploaded_by" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("uploaded_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own personalization settings" ON "public"."personalization_settings" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own reports" ON "public"."assistant_reports" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their own task executions" ON "public"."task_executions" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "task_executions"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "task_executions"."customer_id"))));



CREATE POLICY "Users can manage their own task templates" ON "public"."task_templates" TO "authenticated" USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "task_templates"."customer_id")))) WITH CHECK (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "task_templates"."customer_id"))));



CREATE POLICY "Users can manage their templates" ON "public"."content_templates" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read own cost tracking" ON "public"."cost_tracking" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read own data" ON "public"."users" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can read own reasoning history" ON "public"."reasoning_history" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read own tool execution logs" ON "public"."tool_execution_logs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can share their own videos" ON "public"."video_sharing" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can unlock achievements" ON "public"."user_achievements" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own AI prompts" ON "public"."ai_prompts" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own automation executions" ON "public"."automation_executions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own billing profile" ON "public"."user_billing_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own contacts" ON "public"."contacts" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own content items" ON "public"."content_items" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own context state" ON "public"."ai_context_state" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own data" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own deployment queue" ON "public"."social_deployment_queue" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own email compositions" ON "public"."email_compositions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own function calls" ON "public"."ai_function_calls" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own history" ON "public"."content_generator_history" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own image assets" ON "public"."image_assets" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own model preferences" ON "public"."ai_model_preferences" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own non-default templates" ON "public"."email_templates" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("is_default" = false))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("is_default" = false)));



CREATE POLICY "Users can update own pending actions" ON "public"."ai_pending_actions" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own permissions" ON "public"."ai_user_permissions" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own platform connections" ON "public"."social_platform_connections" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own preferences" ON "public"."content_generator_preferences" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own workflows" ON "public"."ai_workflows" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update responses from their funnels" ON "public"."funnel_responses" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their analytics" ON "public"."contact_analytics" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their communications" ON "public"."communication_records" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their files" ON "public"."contact_files" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their insights" ON "public"."contact_insights" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their journey events" ON "public"."journey_events" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own API keys" ON "public"."api_keys" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own analytics data" ON "public"."user_analytics" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own campaigns" ON "public"."user_campaigns" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own conversion funnel" ON "public"."conversion_funnel" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own engagement categories" ON "public"."engagement_categories" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own sharing settings" ON "public"."video_sharing" FOR UPDATE TO "authenticated" USING (("owner_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own templates" ON "public"."user_templates" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their patterns" ON "public"."engagement_patterns" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their relationships" ON "public"."relationship_mappings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can upload attachments to their deals" ON "public"."deal_attachments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."deals"
  WHERE (("deals"."id" = "deal_attachments"."deal_id") AND (("deals"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("deals"."user_id" IS NULL))))));



CREATE POLICY "Users can view activities for their responses" ON "public"."response_activities" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view agent task logs for their executions" ON "public"."agent_task_logs" TO "authenticated" USING (("task_execution_id" IN ( SELECT "task_executions"."id"
   FROM ("public"."task_executions"
     JOIN "public"."customers" ON (("customers"."id" = "task_executions"."customer_id")))
  WHERE ("customers"."id" = "task_executions"."customer_id"))));



CREATE POLICY "Users can view all products" ON "public"."products" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view analytics for their contacts" ON "public"."contact_analytics" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_analytics"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view attachments for their deals" ON "public"."deal_attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."deals"
  WHERE (("deals"."id" = "deal_attachments"."deal_id") AND (("deals"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("deals"."user_id" IS NULL))))));



CREATE POLICY "Users can view communications for their contacts" ON "public"."communication_records" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "communication_records"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view coordination logs for their tasks" ON "public"."agent_coordination_logs" FOR SELECT TO "authenticated" USING (("task_execution_id" IN ( SELECT "task_executions"."id"
   FROM ("public"."task_executions"
     JOIN "public"."customers" ON (("customers"."id" = "task_executions"."customer_id")))
  WHERE ("customers"."id" = "task_executions"."customer_id"))));



CREATE POLICY "Users can view files for their contacts" ON "public"."contact_files" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_files"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view insights for their contacts" ON "public"."contact_insights" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_insights"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view journey events for their contacts" ON "public"."journey_events" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "journey_events"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view own AI generations" ON "public"."ai_generations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own API usage" ON "public"."api_usage" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own and default templates" ON "public"."email_templates" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("is_default" = true)));



CREATE POLICY "Users can view own and public AI prompts" ON "public"."ai_prompts" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("is_public" = true)));



CREATE POLICY "Users can view own automation executions" ON "public"."automation_executions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own billing profile" ON "public"."user_billing_profiles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own consent logs" ON "public"."consent_logs" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own contacts" ON "public"."contacts" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own content items" ON "public"."content_items" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own context state" ON "public"."ai_context_state" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own conversion data" ON "public"."funnel_conversions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own credit transactions" ON "public"."credit_transactions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own credit usage" ON "public"."credit_usage_logs" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own deletion requests" ON "public"."data_deletion_requests" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own deployment queue" ON "public"."social_deployment_queue" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own email analyses" ON "public"."email_analyses" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own email compositions" ON "public"."email_compositions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own entitlements" ON "public"."entitlements" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own entitlements" ON "public"."user_entitlements" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own execution history" ON "public"."ai_execution_history" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own export requests" ON "public"."data_export_requests" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own function calls" ON "public"."ai_function_calls" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own funnel analytics" ON "public"."funnel_views" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own funnel metrics" ON "public"."funnel_metrics_daily" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."funnels"
  WHERE (("funnels"."id" = "funnel_metrics_daily"."funnel_id") AND ("funnels"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view own history" ON "public"."content_generator_history" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own image assets" ON "public"."image_assets" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own interaction data" ON "public"."funnel_interactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."funnels"
  WHERE (("funnels"."id" = "funnel_interactions"."funnel_id") AND ("funnels"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view own model preferences" ON "public"."ai_model_preferences" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own pending actions" ON "public"."ai_pending_actions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own permissions" ON "public"."ai_user_permissions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own platform connections" ON "public"."social_platform_connections" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own preferences" ON "public"."content_generator_preferences" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own purchases" ON "public"."purchases" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own session data" ON "public"."funnel_sessions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own subscriptions" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own undo snapshots" ON "public"."ai_undo_snapshots" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own usage logs" ON "public"."usage_logs" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own webhook events" ON "public"."social_webhook_events" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own workflows" ON "public"."ai_workflows" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view patterns for their contacts" ON "public"."engagement_patterns" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "engagement_patterns"."contact_id") AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view pending entitlements for their email" ON "public"."pending_entitlements" FOR SELECT TO "authenticated" USING ((("purchaser_email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text") AND ("status" = 'pending'::"text") AND ("claimed_by" IS NULL)));



CREATE POLICY "Users can view relationships for their contacts" ON "public"."relationship_mappings" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE ((("contacts"."id" = "relationship_mappings"."source_contact_id") OR ("contacts"."id" = "relationship_mappings"."target_contact_id")) AND ("contacts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view relevant apps" ON "public"."apps" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))) OR ("is_active" = true)));



CREATE POLICY "Users can view relevant entitlements" ON "public"."stripe_entitlements" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'super_admin'::"text")))) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can view relevant features" ON "public"."features" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))) OR ("is_enabled" = true)));



CREATE POLICY "Users can view responses from their funnels" ON "public"."funnel_responses" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view tenants they belong to" ON "public"."tenants" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_roles"
  WHERE (("user_tenant_roles"."tenant_id" = "tenants"."id") AND ("user_tenant_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view their achievements" ON "public"."user_achievements" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their enrichment history" ON "public"."ai_enrichment_history" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("user_id" IS NULL)));



CREATE POLICY "Users can view their own API access logs" ON "public"."api_access_logs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own API keys" ON "public"."api_keys" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own analytics data" ON "public"."user_analytics" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own campaigns" ON "public"."user_campaigns" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own conversion funnel" ON "public"."conversion_funnel" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own engagement categories" ON "public"."engagement_categories" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own message logs" ON "public"."message_logs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own shared videos" ON "public"."video_sharing" FOR SELECT TO "authenticated" USING ((("owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("recipient_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can view their own templates" ON "public"."user_templates" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own tenant roles" ON "public"."user_tenant_roles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own time series data" ON "public"."analytics_time_series" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own upload logs" ON "public"."user_upload_logs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own video analytics" ON "public"."video_analytics" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view web search results" ON "public"."web_search_results" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Videos access policy" ON "public"."videos" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Videos delete policy" ON "public"."videos" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "Videos modification policy" ON "public"."videos" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "Videos update policy" ON "public"."videos" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "White-label configs are viewable by authenticated users" ON "public"."white_label_configs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "White-label configs can be inserted by authenticated users" ON "public"."white_label_configs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "White-label configs can be updated by tenant owners" ON "public"."white_label_configs" FOR UPDATE TO "authenticated" USING (("tenant_id" IN ( SELECT "tenants"."id"
   FROM "public"."tenants"
  WHERE ((( SELECT "auth"."uid"() AS "uid"))::"text" = ("tenants"."id")::"text"))));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_coordination_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_coordination_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_task_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_automation_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_context_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_enrichment_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_execution_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_function_calls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_generations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_insights_enhanced" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_model_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_pending_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_undo_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_user_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_time_series" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analyzed_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anon_select_goals" ON "public"."user_goals" FOR SELECT USING (true);



ALTER TABLE "public"."api_access_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_content_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_sync_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."apps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."builds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_analyzer" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cached_ai_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."code_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communication_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_segments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_generator_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_generator_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_context_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_contexts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversion_funnel" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cost_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_bundles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_layouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_widget_layouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_deletion_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_export_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_pipeline_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deal_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."demo_apps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deployments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_compositions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_unsubscribes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."engagement_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."engagement_patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhanced_task_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enhanced_task_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_conversions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_metrics_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_videos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ip_blacklist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journey_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kanban_column_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."linkedin_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."model_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."openai_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."openai_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pending_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personalization_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personalization_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personalized_goal_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_statistics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proactive_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."published_funnels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reasoning_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reference_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."relationship_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."response_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_sequences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_documentation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_deployment_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_platform_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."storage_bucket_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."storage_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."streaming_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_charges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_checkout_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_payment_intents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."table_column_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_business_outcomes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timeline_view_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tool_execution_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tooltip_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tooltip_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_billing_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_business_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_fonts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tenant_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_upload_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_view_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."video_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."video_sharing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."view_filters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."web_search_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."white_label_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_executions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."anonymize_user_data"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."anonymize_user_data"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."anonymize_user_data"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_blacklist_abusive_ips"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_blacklist_abusive_ips"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_blacklist_abusive_ips"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_import_contacts"("p_contact_data" "jsonb"[], "p_admin_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_import_contacts"("p_contact_data" "jsonb"[], "p_admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_import_contacts"("p_contact_data" "jsonb"[], "p_admin_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_import_deals"("p_deal_data" "jsonb"[], "p_admin_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_import_deals"("p_deal_data" "jsonb"[], "p_admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_import_deals"("p_deal_data" "jsonb"[], "p_admin_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_import_users"("p_user_data" "jsonb"[], "p_admin_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_import_users"("p_user_data" "jsonb"[], "p_admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_import_users"("p_user_data" "jsonb"[], "p_admin_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_gpt5_cost"("model_variant" "text", "input_tokens" integer, "output_tokens" integer, "reasoning_tokens" integer, "cached_tokens" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_gpt5_cost"("model_variant" "text", "input_tokens" integer, "output_tokens" integer, "reasoning_tokens" integer, "cached_tokens" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_gpt5_cost"("model_variant" "text", "input_tokens" integer, "output_tokens" integer, "reasoning_tokens" integer, "cached_tokens" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_api_rate_limit"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_api_rate_limit"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_api_rate_limit"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("ip" "inet", "endpoint_path" "text", "max_requests" integer, "window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("ip" "inet", "endpoint_path" "text", "max_requests" integer, "window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("ip" "inet", "endpoint_path" "text", "max_requests" integer, "window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("user_ip" "text", "endpoint_path" "text", "max_requests" integer, "window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("user_ip" "text", "endpoint_path" "text", "max_requests" integer, "window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("user_ip" "text", "endpoint_path" "text", "max_requests" integer, "window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_blacklist"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_blacklist"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_blacklist"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_snapshots"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_snapshots"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_snapshots"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_rate_limit_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limit_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limit_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_api_key"("p_key_name" "text", "p_permissions" "text"[], "p_expires_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_api_key"("p_key_name" "text", "p_permissions" "text"[], "p_expires_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_api_key"("p_key_name" "text", "p_permissions" "text"[], "p_expires_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_ai_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_ai_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_ai_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_deal_stages"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_deal_stages"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_deal_stages"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_pending_actions"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_pending_actions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_pending_actions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."export_user_data"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."export_user_data"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."export_user_data"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_api_key"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_api_key"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_api_key"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_popular_content_types"("limit_param" integer, "category_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_content_types"("limit_param" integer, "category_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_popular_content_types"("limit_param" integer, "category_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_published_funnel"("funnel_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_published_funnel"("funnel_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_published_funnel"("funnel_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_action_counts"("user_id_param" "uuid", "time_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_action_counts"("user_id_param" "uuid", "time_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_action_counts"("user_id_param" "uuid", "time_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_analytics_data"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_analytics_data"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_analytics_data"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_sample_analytics_data"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_sample_analytics_data"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_sample_analytics_data"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_api_access"("p_api_key_id" "uuid", "p_user_id" "uuid", "p_endpoint" "text", "p_method" "text", "p_ip_address" "text", "p_user_agent" "text", "p_status_code" integer, "p_response_time" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."log_api_access"("p_api_key_id" "uuid", "p_user_id" "uuid", "p_endpoint" "text", "p_method" "text", "p_ip_address" "text", "p_user_agent" "text", "p_status_code" integer, "p_response_time" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_api_access"("p_api_key_id" "uuid", "p_user_id" "uuid", "p_endpoint" "text", "p_method" "text", "p_ip_address" "text", "p_user_agent" "text", "p_status_code" integer, "p_response_time" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_api_request"("p_user_id" "uuid", "p_request_type" "text", "p_provider" "text", "p_model" "text", "p_status" "text", "p_request_path" "text", "p_request_body" "jsonb", "p_response_status" integer, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_api_request"("p_user_id" "uuid", "p_request_type" "text", "p_provider" "text", "p_model" "text", "p_status" "text", "p_request_path" "text", "p_request_body" "jsonb", "p_response_status" integer, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_api_request"("p_user_id" "uuid", "p_request_type" "text", "p_provider" "text", "p_model" "text", "p_status" "text", "p_request_path" "text", "p_request_body" "jsonb", "p_response_status" integer, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_import"("p_user_id" "uuid", "p_entity_type" "text", "p_filename" "text", "p_record_count" integer, "p_successful_count" integer, "p_failed_count" integer, "p_error_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_import"("p_user_id" "uuid", "p_entity_type" "text", "p_filename" "text", "p_record_count" integer, "p_successful_count" integer, "p_failed_count" integer, "p_error_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_import"("p_user_id" "uuid", "p_entity_type" "text", "p_filename" "text", "p_record_count" integer, "p_successful_count" integer, "p_failed_count" integer, "p_error_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_response_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_response_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_response_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "event_details" "jsonb", "user_ip" "text", "target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "event_details" "jsonb", "user_ip" "text", "target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "event_details" "jsonb", "user_ip" "text", "target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("event_type_param" "text", "ip_param" "inet", "user_id_param" "uuid", "endpoint_param" "text", "details_param" "jsonb", "severity_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type_param" "text", "ip_param" "inet", "user_id_param" "uuid", "endpoint_param" "text", "details_param" "jsonb", "severity_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type_param" "text", "ip_param" "inet", "user_id_param" "uuid", "endpoint_param" "text", "details_param" "jsonb", "severity_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_all_materialized_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_all_materialized_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_all_materialized_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_analytics_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_analytics_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_analytics_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_tenant_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_tenant_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tenant_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON PROCEDURE "public"."sp_get_import_status"(IN "p_upload_id" "text", OUT "p_status" "json") TO "anon";
GRANT ALL ON PROCEDURE "public"."sp_get_import_status"(IN "p_upload_id" "text", OUT "p_status" "json") TO "authenticated";
GRANT ALL ON PROCEDURE "public"."sp_get_import_status"(IN "p_upload_id" "text", OUT "p_status" "json") TO "service_role";



GRANT ALL ON PROCEDURE "public"."sp_import_users_from_csv"(IN "p_csv_content" "text", IN "p_admin_user_id" "uuid", OUT "p_result" "json") TO "anon";
GRANT ALL ON PROCEDURE "public"."sp_import_users_from_csv"(IN "p_csv_content" "text", IN "p_admin_user_id" "uuid", OUT "p_result" "json") TO "authenticated";
GRANT ALL ON PROCEDURE "public"."sp_import_users_from_csv"(IN "p_csv_content" "text", IN "p_admin_user_id" "uuid", OUT "p_result" "json") TO "service_role";



GRANT ALL ON FUNCTION "public"."uid"() TO "anon";
GRANT ALL ON FUNCTION "public"."uid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_models_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_models_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_models_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_app_content_metadata_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_app_content_metadata_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_app_content_metadata_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_billing_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_billing_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_billing_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_contexts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_contexts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_contexts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_dashboard_layouts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_dashboard_layouts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_dashboard_layouts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_demo_apps_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_demo_apps_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_demo_apps_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_enhanced_task_executions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_enhanced_task_executions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_enhanced_task_executions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_funnel_responses_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_funnel_responses_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_funnel_responses_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_funnel_sessions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_funnel_sessions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_funnel_sessions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_model_metrics"("p_model_name" "text", "p_task_type" "text", "p_response_time_ms" integer, "p_tokens_used" integer, "p_cost_cents" integer, "p_success" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_model_metrics"("p_model_name" "text", "p_task_type" "text", "p_response_time_ms" integer, "p_tokens_used" integer, "p_cost_cents" integer, "p_success" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_model_metrics"("p_model_name" "text", "p_task_type" "text", "p_response_time_ms" integer, "p_tokens_used" integer, "p_cost_cents" integer, "p_success" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_personalized_goal_recommendations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_personalized_goal_recommendations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_personalized_goal_recommendations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_analyses_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_analyses_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_analyses_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_storage_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_storage_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_storage_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_business_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_business_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_business_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_view_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_view_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_view_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_api_key"("p_api_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_api_key"("p_api_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_api_key"("p_api_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_api_key"("p_key_value" "text", "p_required_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_api_key"("p_key_value" "text", "p_required_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_api_key"("p_key_value" "text", "p_required_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_contact_import_data"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_contact_import_data"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_contact_import_data"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_deal_import_data"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_deal_import_data"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_deal_import_data"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_jwt_token"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_jwt_token"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_jwt_token"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_user_import_data"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_user_import_data"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_user_import_data"("data" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."admin_overview" TO "anon";
GRANT ALL ON TABLE "public"."admin_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_overview" TO "service_role";



GRANT ALL ON TABLE "public"."agent_coordination_events" TO "anon";
GRANT ALL ON TABLE "public"."agent_coordination_events" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_coordination_events" TO "service_role";



GRANT ALL ON TABLE "public"."agent_coordination_logs" TO "anon";
GRANT ALL ON TABLE "public"."agent_coordination_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_coordination_logs" TO "service_role";



GRANT ALL ON TABLE "public"."agent_metadata" TO "anon";
GRANT ALL ON TABLE "public"."agent_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."agent_task_logs" TO "anon";
GRANT ALL ON TABLE "public"."agent_task_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_task_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_automation_settings" TO "anon";
GRANT ALL ON TABLE "public"."ai_automation_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_automation_settings" TO "service_role";



GRANT ALL ON TABLE "public"."ai_context_state" TO "anon";
GRANT ALL ON TABLE "public"."ai_context_state" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_context_state" TO "service_role";



GRANT ALL ON TABLE "public"."ai_enrichment_history" TO "anon";
GRANT ALL ON TABLE "public"."ai_enrichment_history" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_enrichment_history" TO "service_role";



GRANT ALL ON TABLE "public"."ai_execution_history" TO "anon";
GRANT ALL ON TABLE "public"."ai_execution_history" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_execution_history" TO "service_role";



GRANT ALL ON TABLE "public"."ai_function_calls" TO "anon";
GRANT ALL ON TABLE "public"."ai_function_calls" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_function_calls" TO "service_role";



GRANT ALL ON TABLE "public"."ai_generations" TO "anon";
GRANT ALL ON TABLE "public"."ai_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_generations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_insights" TO "anon";
GRANT ALL ON TABLE "public"."ai_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_insights" TO "service_role";



GRANT ALL ON TABLE "public"."ai_insights_enhanced" TO "anon";
GRANT ALL ON TABLE "public"."ai_insights_enhanced" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_insights_enhanced" TO "service_role";



GRANT ALL ON TABLE "public"."ai_model_preferences" TO "anon";
GRANT ALL ON TABLE "public"."ai_model_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_model_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."ai_models" TO "anon";
GRANT ALL ON TABLE "public"."ai_models" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_models" TO "service_role";



GRANT ALL ON TABLE "public"."ai_pending_actions" TO "anon";
GRANT ALL ON TABLE "public"."ai_pending_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_pending_actions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_prompts" TO "anon";
GRANT ALL ON TABLE "public"."ai_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."ai_undo_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."ai_undo_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_undo_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_metrics" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."ai_user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."ai_user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_user_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_workflows" TO "anon";
GRANT ALL ON TABLE "public"."ai_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_time_series" TO "anon";
GRANT ALL ON TABLE "public"."analytics_time_series" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_time_series" TO "service_role";



GRANT ALL ON TABLE "public"."analyzed_documents" TO "anon";
GRANT ALL ON TABLE "public"."analyzed_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."analyzed_documents" TO "service_role";



GRANT ALL ON TABLE "public"."api_access_logs" TO "anon";
GRANT ALL ON TABLE "public"."api_access_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."api_access_logs" TO "service_role";



GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."api_metrics" TO "anon";
GRANT ALL ON TABLE "public"."api_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."api_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage" TO "anon";
GRANT ALL ON TABLE "public"."api_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage" TO "service_role";



GRANT ALL ON TABLE "public"."app_access" TO "anon";
GRANT ALL ON TABLE "public"."app_access" TO "authenticated";
GRANT ALL ON TABLE "public"."app_access" TO "service_role";



GRANT ALL ON TABLE "public"."app_content" TO "anon";
GRANT ALL ON TABLE "public"."app_content" TO "authenticated";
GRANT ALL ON TABLE "public"."app_content" TO "service_role";



GRANT ALL ON TABLE "public"."app_content_metadata" TO "anon";
GRANT ALL ON TABLE "public"."app_content_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."app_content_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."app_definitions" TO "anon";
GRANT ALL ON TABLE "public"."app_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."app_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."app_features" TO "anon";
GRANT ALL ON TABLE "public"."app_features" TO "authenticated";
GRANT ALL ON TABLE "public"."app_features" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."app_sync_history" TO "anon";
GRANT ALL ON TABLE "public"."app_sync_history" TO "authenticated";
GRANT ALL ON TABLE "public"."app_sync_history" TO "service_role";



GRANT ALL ON TABLE "public"."app_users" TO "anon";
GRANT ALL ON TABLE "public"."app_users" TO "authenticated";
GRANT ALL ON TABLE "public"."app_users" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."apps" TO "anon";
GRANT ALL ON TABLE "public"."apps" TO "authenticated";
GRANT ALL ON TABLE "public"."apps" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_reports" TO "anon";
GRANT ALL ON TABLE "public"."assistant_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_reports" TO "service_role";



GRANT ALL ON TABLE "public"."automation_executions" TO "anon";
GRANT ALL ON TABLE "public"."automation_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_executions" TO "service_role";



GRANT ALL ON TABLE "public"."automation_rules" TO "anon";
GRANT ALL ON TABLE "public"."automation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."builds" TO "anon";
GRANT ALL ON TABLE "public"."builds" TO "authenticated";
GRANT ALL ON TABLE "public"."builds" TO "service_role";



GRANT ALL ON TABLE "public"."business_analyzer" TO "anon";
GRANT ALL ON TABLE "public"."business_analyzer" TO "authenticated";
GRANT ALL ON TABLE "public"."business_analyzer" TO "service_role";



GRANT ALL ON TABLE "public"."cached_ai_responses" TO "anon";
GRANT ALL ON TABLE "public"."cached_ai_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."cached_ai_responses" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON TABLE "public"."code_executions" TO "anon";
GRANT ALL ON TABLE "public"."code_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."code_executions" TO "service_role";



GRANT ALL ON TABLE "public"."communication_logs" TO "anon";
GRANT ALL ON TABLE "public"."communication_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."communication_logs" TO "service_role";



GRANT ALL ON TABLE "public"."communication_metrics" TO "anon";
GRANT ALL ON TABLE "public"."communication_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."communication_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."communication_records" TO "anon";
GRANT ALL ON TABLE "public"."communication_records" TO "authenticated";
GRANT ALL ON TABLE "public"."communication_records" TO "service_role";



GRANT ALL ON TABLE "public"."communication_templates" TO "anon";
GRANT ALL ON TABLE "public"."communication_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."communication_templates" TO "service_role";



GRANT ALL ON TABLE "public"."communications" TO "anon";
GRANT ALL ON TABLE "public"."communications" TO "authenticated";
GRANT ALL ON TABLE "public"."communications" TO "service_role";



GRANT ALL ON TABLE "public"."consent_logs" TO "anon";
GRANT ALL ON TABLE "public"."consent_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_logs" TO "service_role";



GRANT ALL ON TABLE "public"."contact_activities" TO "anon";
GRANT ALL ON TABLE "public"."contact_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_activities" TO "service_role";



GRANT ALL ON TABLE "public"."contact_analytics" TO "anon";
GRANT ALL ON TABLE "public"."contact_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."contact_files" TO "anon";
GRANT ALL ON TABLE "public"."contact_files" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_files" TO "service_role";



GRANT ALL ON TABLE "public"."contact_insights" TO "anon";
GRANT ALL ON TABLE "public"."contact_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_insights" TO "service_role";



GRANT ALL ON TABLE "public"."contact_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."contact_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."contact_segments" TO "anon";
GRANT ALL ON TABLE "public"."contact_segments" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_segments" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."content_generator_history" TO "anon";
GRANT ALL ON TABLE "public"."content_generator_history" TO "authenticated";
GRANT ALL ON TABLE "public"."content_generator_history" TO "service_role";



GRANT ALL ON TABLE "public"."content_generator_preferences" TO "anon";
GRANT ALL ON TABLE "public"."content_generator_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."content_generator_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."content_items" TO "anon";
GRANT ALL ON TABLE "public"."content_items" TO "authenticated";
GRANT ALL ON TABLE "public"."content_items" TO "service_role";



GRANT ALL ON TABLE "public"."content_templates" TO "anon";
GRANT ALL ON TABLE "public"."content_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."content_templates" TO "service_role";



GRANT ALL ON TABLE "public"."content_types" TO "anon";
GRANT ALL ON TABLE "public"."content_types" TO "authenticated";
GRANT ALL ON TABLE "public"."content_types" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_attachments" TO "anon";
GRANT ALL ON TABLE "public"."conversation_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_context_cache" TO "anon";
GRANT ALL ON TABLE "public"."conversation_context_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_context_cache" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_contexts" TO "anon";
GRANT ALL ON TABLE "public"."conversation_contexts" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_contexts" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_messages" TO "anon";
GRANT ALL ON TABLE "public"."conversation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_messages" TO "service_role";



GRANT ALL ON TABLE "public"."conversion_funnel" TO "anon";
GRANT ALL ON TABLE "public"."conversion_funnel" TO "authenticated";
GRANT ALL ON TABLE "public"."conversion_funnel" TO "service_role";



GRANT ALL ON TABLE "public"."cost_tracking" TO "anon";
GRANT ALL ON TABLE "public"."cost_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."credit_bundles" TO "anon";
GRANT ALL ON TABLE "public"."credit_bundles" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_bundles" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."credit_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."credit_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_layouts" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_widget_layouts" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_widget_layouts" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_widget_layouts" TO "service_role";



GRANT ALL ON TABLE "public"."data_deletion_requests" TO "anon";
GRANT ALL ON TABLE "public"."data_deletion_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."data_deletion_requests" TO "service_role";



GRANT ALL ON TABLE "public"."data_export_requests" TO "anon";
GRANT ALL ON TABLE "public"."data_export_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."data_export_requests" TO "service_role";



GRANT ALL ON TABLE "public"."deal_attachments" TO "anon";
GRANT ALL ON TABLE "public"."deal_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."deal_pipeline_metrics" TO "anon";
GRANT ALL ON TABLE "public"."deal_pipeline_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_pipeline_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."deal_stages" TO "anon";
GRANT ALL ON TABLE "public"."deal_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_stages" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."demo_apps" TO "anon";
GRANT ALL ON TABLE "public"."demo_apps" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_apps" TO "service_role";



GRANT ALL ON TABLE "public"."deployments" TO "anon";
GRANT ALL ON TABLE "public"."deployments" TO "authenticated";
GRANT ALL ON TABLE "public"."deployments" TO "service_role";



GRANT ALL ON TABLE "public"."email_analyses" TO "anon";
GRANT ALL ON TABLE "public"."email_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."email_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."email_compositions" TO "anon";
GRANT ALL ON TABLE "public"."email_compositions" TO "authenticated";
GRANT ALL ON TABLE "public"."email_compositions" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON TABLE "public"."email_unsubscribes" TO "anon";
GRANT ALL ON TABLE "public"."email_unsubscribes" TO "authenticated";
GRANT ALL ON TABLE "public"."email_unsubscribes" TO "service_role";



GRANT ALL ON TABLE "public"."engagement_categories" TO "anon";
GRANT ALL ON TABLE "public"."engagement_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_categories" TO "service_role";



GRANT ALL ON TABLE "public"."engagement_patterns" TO "anon";
GRANT ALL ON TABLE "public"."engagement_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_patterns" TO "service_role";



GRANT ALL ON TABLE "public"."enhanced_task_executions" TO "anon";
GRANT ALL ON TABLE "public"."enhanced_task_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."enhanced_task_executions" TO "service_role";



GRANT ALL ON TABLE "public"."enhanced_task_templates" TO "anon";
GRANT ALL ON TABLE "public"."enhanced_task_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."enhanced_task_templates" TO "service_role";



GRANT ALL ON TABLE "public"."entitlements" TO "anon";
GRANT ALL ON TABLE "public"."entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."feature_access" TO "anon";
GRANT ALL ON TABLE "public"."feature_access" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_access" TO "service_role";



GRANT ALL ON TABLE "public"."features" TO "anon";
GRANT ALL ON TABLE "public"."features" TO "authenticated";
GRANT ALL ON TABLE "public"."features" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_conversions" TO "anon";
GRANT ALL ON TABLE "public"."funnel_conversions" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_conversions" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_interactions" TO "anon";
GRANT ALL ON TABLE "public"."funnel_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_metrics_daily" TO "anon";
GRANT ALL ON TABLE "public"."funnel_metrics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_metrics_daily" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_responses" TO "anon";
GRANT ALL ON TABLE "public"."funnel_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_responses" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_sessions" TO "anon";
GRANT ALL ON TABLE "public"."funnel_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_steps" TO "anon";
GRANT ALL ON TABLE "public"."funnel_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_steps" TO "service_role";



GRANT ALL ON TABLE "public"."funnel_views" TO "anon";
GRANT ALL ON TABLE "public"."funnel_views" TO "authenticated";
GRANT ALL ON TABLE "public"."funnel_views" TO "service_role";



GRANT ALL ON TABLE "public"."funnels" TO "anon";
GRANT ALL ON TABLE "public"."funnels" TO "authenticated";
GRANT ALL ON TABLE "public"."funnels" TO "service_role";



GRANT ALL ON TABLE "public"."generated_content" TO "anon";
GRANT ALL ON TABLE "public"."generated_content" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_content" TO "service_role";



GRANT ALL ON TABLE "public"."generated_images" TO "anon";
GRANT ALL ON TABLE "public"."generated_images" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_images" TO "service_role";



GRANT ALL ON TABLE "public"."generated_videos" TO "anon";
GRANT ALL ON TABLE "public"."generated_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_videos" TO "service_role";



GRANT ALL ON TABLE "public"."image_assets" TO "anon";
GRANT ALL ON TABLE "public"."image_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."image_assets" TO "service_role";



GRANT ALL ON TABLE "public"."import_logs" TO "anon";
GRANT ALL ON TABLE "public"."import_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."import_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ip_blacklist" TO "anon";
GRANT ALL ON TABLE "public"."ip_blacklist" TO "authenticated";
GRANT ALL ON TABLE "public"."ip_blacklist" TO "service_role";



GRANT ALL ON TABLE "public"."journey_events" TO "anon";
GRANT ALL ON TABLE "public"."journey_events" TO "authenticated";
GRANT ALL ON TABLE "public"."journey_events" TO "service_role";



GRANT ALL ON TABLE "public"."kanban_column_configs" TO "anon";
GRANT ALL ON TABLE "public"."kanban_column_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."kanban_column_configs" TO "service_role";



GRANT ALL ON TABLE "public"."linkedin_profiles" TO "anon";
GRANT ALL ON TABLE "public"."linkedin_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."linkedin_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."message_logs" TO "anon";
GRANT ALL ON TABLE "public"."message_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."message_logs" TO "service_role";



GRANT ALL ON TABLE "public"."model_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."model_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."model_performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."openai_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."openai_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."openai_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."openai_usage" TO "anon";
GRANT ALL ON TABLE "public"."openai_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."openai_usage" TO "service_role";



GRANT ALL ON TABLE "public"."partner_applications" TO "anon";
GRANT ALL ON TABLE "public"."partner_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_applications" TO "service_role";



GRANT ALL ON TABLE "public"."partner_customers" TO "anon";
GRANT ALL ON TABLE "public"."partner_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_customers" TO "service_role";



GRANT ALL ON TABLE "public"."partner_stats" TO "anon";
GRANT ALL ON TABLE "public"."partner_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_stats" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON TABLE "public"."pending_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."pending_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."personalization_settings" TO "anon";
GRANT ALL ON TABLE "public"."personalization_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."personalization_settings" TO "service_role";



GRANT ALL ON TABLE "public"."personalization_tokens" TO "anon";
GRANT ALL ON TABLE "public"."personalization_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."personalization_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."personalized_goal_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."personalized_goal_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."personalized_goal_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."platform_statistics" TO "anon";
GRANT ALL ON TABLE "public"."platform_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."proactive_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."proactive_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."proactive_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."product_analyses" TO "anon";
GRANT ALL ON TABLE "public"."product_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."product_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."product_mappings" TO "anon";
GRANT ALL ON TABLE "public"."product_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."product_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_images" TO "anon";
GRANT ALL ON TABLE "public"."project_images" TO "authenticated";
GRANT ALL ON TABLE "public"."project_images" TO "service_role";



GRANT ALL ON TABLE "public"."published_funnels" TO "anon";
GRANT ALL ON TABLE "public"."published_funnels" TO "authenticated";
GRANT ALL ON TABLE "public"."published_funnels" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_events" TO "anon";
GRANT ALL ON TABLE "public"."purchase_events" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_events" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_logs" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."reasoning_history" TO "anon";
GRANT ALL ON TABLE "public"."reasoning_history" TO "authenticated";
GRANT ALL ON TABLE "public"."reasoning_history" TO "service_role";



GRANT ALL ON TABLE "public"."reference_images" TO "anon";
GRANT ALL ON TABLE "public"."reference_images" TO "authenticated";
GRANT ALL ON TABLE "public"."reference_images" TO "service_role";



GRANT ALL ON TABLE "public"."relationship_mappings" TO "anon";
GRANT ALL ON TABLE "public"."relationship_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."relationship_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."response_activities" TO "anon";
GRANT ALL ON TABLE "public"."response_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."response_activities" TO "service_role";



GRANT ALL ON TABLE "public"."sales_activities" TO "anon";
GRANT ALL ON TABLE "public"."sales_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_activities" TO "service_role";



GRANT ALL ON TABLE "public"."sales_goals" TO "anon";
GRANT ALL ON TABLE "public"."sales_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_goals" TO "service_role";



GRANT ALL ON TABLE "public"."sales_sequences" TO "anon";
GRANT ALL ON TABLE "public"."sales_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_sequences" TO "service_role";



GRANT ALL ON TABLE "public"."security_audit_documentation" TO "anon";
GRANT ALL ON TABLE "public"."security_audit_documentation" TO "authenticated";
GRANT ALL ON TABLE "public"."security_audit_documentation" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON TABLE "public"."social_deployment_queue" TO "anon";
GRANT ALL ON TABLE "public"."social_deployment_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."social_deployment_queue" TO "service_role";



GRANT ALL ON TABLE "public"."social_platform_connections" TO "anon";
GRANT ALL ON TABLE "public"."social_platform_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."social_platform_connections" TO "service_role";



GRANT ALL ON TABLE "public"."social_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."social_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."social_webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."storage_bucket_config" TO "anon";
GRANT ALL ON TABLE "public"."storage_bucket_config" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_bucket_config" TO "service_role";



GRANT ALL ON TABLE "public"."storage_usage" TO "anon";
GRANT ALL ON TABLE "public"."storage_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_usage" TO "service_role";



GRANT ALL ON TABLE "public"."streaming_sessions" TO "anon";
GRANT ALL ON TABLE "public"."streaming_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."streaming_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_charges" TO "anon";
GRANT ALL ON TABLE "public"."stripe_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_charges" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_checkout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."stripe_checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_checkout_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."stripe_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_invoices" TO "anon";
GRANT ALL ON TABLE "public"."stripe_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_payment_intents" TO "anon";
GRANT ALL ON TABLE "public"."stripe_payment_intents" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_payment_intents" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."stripe_payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_prices" TO "anon";
GRANT ALL ON TABLE "public"."stripe_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_prices" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_products" TO "anon";
GRANT ALL ON TABLE "public"."stripe_products" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_products" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."sync_jobs" TO "anon";
GRANT ALL ON TABLE "public"."sync_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."table_column_preferences" TO "anon";
GRANT ALL ON TABLE "public"."table_column_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."table_column_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."task_business_outcomes" TO "anon";
GRANT ALL ON TABLE "public"."task_business_outcomes" TO "authenticated";
GRANT ALL ON TABLE "public"."task_business_outcomes" TO "service_role";



GRANT ALL ON TABLE "public"."task_executions" TO "anon";
GRANT ALL ON TABLE "public"."task_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."task_executions" TO "service_role";



GRANT ALL ON TABLE "public"."task_templates" TO "anon";
GRANT ALL ON TABLE "public"."task_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."task_templates" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



GRANT ALL ON TABLE "public"."timeline_view_preferences" TO "anon";
GRANT ALL ON TABLE "public"."timeline_view_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."timeline_view_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."tool_execution_logs" TO "anon";
GRANT ALL ON TABLE "public"."tool_execution_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_execution_logs" TO "service_role";



GRANT ALL ON TABLE "public"."tooltip_categories" TO "anon";
GRANT ALL ON TABLE "public"."tooltip_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."tooltip_categories" TO "service_role";



GRANT ALL ON TABLE "public"."tooltip_configurations" TO "anon";
GRANT ALL ON TABLE "public"."tooltip_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."tooltip_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_billing_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_billing_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_billing_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_business_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_business_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_business_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."user_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."user_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."user_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."user_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."user_fonts" TO "anon";
GRANT ALL ON TABLE "public"."user_fonts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_fonts" TO "service_role";



GRANT ALL ON TABLE "public"."user_goals" TO "anon";
GRANT ALL ON TABLE "public"."user_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."user_goals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_goals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_goals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_goals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_identities" TO "anon";
GRANT ALL ON TABLE "public"."user_identities" TO "authenticated";
GRANT ALL ON TABLE "public"."user_identities" TO "service_role";



GRANT ALL ON TABLE "public"."user_integrations" TO "anon";
GRANT ALL ON TABLE "public"."user_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_projects" TO "anon";
GRANT ALL ON TABLE "public"."user_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."user_projects" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_templates" TO "anon";
GRANT ALL ON TABLE "public"."user_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."user_templates" TO "service_role";



GRANT ALL ON TABLE "public"."user_tenant_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_tenant_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tenant_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_upload_logs" TO "anon";
GRANT ALL ON TABLE "public"."user_upload_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_upload_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_view_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_view_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_view_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_customer_profiles" TO "anon";
GRANT ALL ON TABLE "public"."v_customer_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."v_customer_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."v_customer_purchase_history" TO "anon";
GRANT ALL ON TABLE "public"."v_customer_purchase_history" TO "authenticated";
GRANT ALL ON TABLE "public"."v_customer_purchase_history" TO "service_role";



GRANT ALL ON TABLE "public"."video_analytics" TO "anon";
GRANT ALL ON TABLE "public"."video_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."video_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."video_sharing" TO "anon";
GRANT ALL ON TABLE "public"."video_sharing" TO "authenticated";
GRANT ALL ON TABLE "public"."video_sharing" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";



GRANT ALL ON TABLE "public"."view_filters" TO "anon";
GRANT ALL ON TABLE "public"."view_filters" TO "authenticated";
GRANT ALL ON TABLE "public"."view_filters" TO "service_role";



GRANT ALL ON TABLE "public"."web_search_results" TO "anon";
GRANT ALL ON TABLE "public"."web_search_results" TO "authenticated";
GRANT ALL ON TABLE "public"."web_search_results" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_configs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_configs" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_deliveries" TO "anon";
GRANT ALL ON TABLE "public"."webhook_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."white_label_configs" TO "anon";
GRANT ALL ON TABLE "public"."white_label_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."white_label_configs" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_executions" TO "anon";
GRANT ALL ON TABLE "public"."workflow_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_executions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";







