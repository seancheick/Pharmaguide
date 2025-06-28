

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



CREATE TYPE "public"."evidence_quality" AS ENUM (
    'A',
    'B',
    'C',
    'D',
    'EXPERT_OPINION'
);


ALTER TYPE "public"."evidence_quality" OWNER TO "postgres";


CREATE TYPE "public"."interaction_status" AS ENUM (
    'VERIFIED',
    'PENDING',
    'AI_GENERATED'
);


ALTER TYPE "public"."interaction_status" OWNER TO "postgres";


CREATE TYPE "public"."product_category" AS ENUM (
    'MEDICATION',
    'SUPPLEMENT',
    'HERB',
    'VITAMIN',
    'MINERAL',
    'OTHER'
);


ALTER TYPE "public"."product_category" OWNER TO "postgres";


CREATE TYPE "public"."severity_level" AS ENUM (
    'LOW',
    'MODERATE',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE "public"."severity_level" OWNER TO "postgres";


CREATE TYPE "public"."source_type" AS ENUM (
    'FDA',
    'NIH',
    'PUBMED',
    'CLINICAL_STUDY',
    'MANUFACTURER',
    'AI'
);


ALTER TYPE "public"."source_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."anonymize_age_from_birth_date"("birth_date" "date") RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF birth_date IS NULL THEN
        RETURN 'unknown'; -- Handle NULL birth dates
    END IF;

    CASE
        WHEN age(birth_date) < interval '18 years' THEN RETURN 'under_18'; -- Adjusted from 13-18 to capture below 18
        WHEN age(birth_date) < interval '31 years' THEN RETURN '19-30';
        WHEN age(birth_date) < interval '51 years' THEN RETURN '31-50';
        WHEN age(birth_date) < interval '66 years' THEN RETURN '51-65';
        ELSE RETURN '66+';
    END CASE;
END;
$$;


ALTER FUNCTION "public"."anonymize_age_from_birth_date"("birth_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_ai_cache"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  deleted_count INTEGER := 0;
  batch_size INTEGER := 50;
BEGIN
  LOOP
    WITH deleted AS (
      DELETE FROM ai_cache
      WHERE id IN (SELECT id FROM ai_cache WHERE expires_at < NOW() LIMIT batch_size)
      RETURNING 1
    )
    SELECT COUNT(*) INTO batch_size FROM deleted;
    deleted_count := deleted_count + batch_size;
    EXIT WHEN batch_size = 0;
  END LOOP;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_ai_cache"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_ai_cache"() IS 'Removes AI cache entries older than 7 days. Schedule weekly.';



CREATE OR REPLACE FUNCTION "public"."create_user_with_profile"("p_auth_id" "uuid", "p_email" "text" DEFAULT NULL::"text", "p_is_anonymous" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id FROM users WHERE auth_id = p_auth_id;

    IF v_user_id IS NOT NULL THEN
        RETURN v_user_id;
    END IF;

    -- Create new user
    INSERT INTO users (auth_id, email, is_anonymous)
    VALUES (p_auth_id, p_email, p_is_anonymous)
    RETURNING id INTO v_user_id;

    -- Create user profile
    INSERT INTO user_profiles (user_id) VALUES (v_user_id);

    -- Create user preferences
    INSERT INTO user_preferences (user_id) VALUES (v_user_id);

    -- Create user points
    INSERT INTO user_points (user_id) VALUES (v_user_id);

    -- Create user streaks
    INSERT INTO user_streaks (user_id) VALUES (v_user_id);

    RETURN v_user_id;
END;
$$;


ALTER FUNCTION "public"."create_user_with_profile"("p_auth_id" "uuid", "p_email" "text", "p_is_anonymous" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_user_with_profile"("p_auth_id" "uuid", "p_email" "text", "p_is_anonymous" boolean) IS 'Creates user with all associated profile tables';



CREATE OR REPLACE FUNCTION "public"."find_all_interactions"("p_substance_name" character varying, "p_substance_type" character varying DEFAULT NULL::character varying) RETURNS TABLE("source_system" character varying, "severity" character varying, "interacting_substance" character varying, "mechanism" "text", "recommendation" "text", "contraindicated" boolean, "evidence_quality" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check critical rules
    RETURN QUERY
    SELECT
        'RULES'::varchar as source_system,
        cir.severity::varchar,
        CASE
            WHEN cir.item1_identifier ILIKE '%' || p_substance_name || '%' THEN cir.item2_identifier
            ELSE cir.item1_identifier
        END as interacting_substance,
        cir.mechanism,
        cir.recommendation,
        cir.contraindicated,
        cir.evidence_quality::varchar
    FROM critical_interaction_rules cir
    WHERE cir.active = TRUE
    AND (
        cir.item1_identifier ILIKE '%' || p_substance_name || '%' OR
        cir.item2_identifier ILIKE '%' || p_substance_name || '%'
    )
    AND (p_substance_type IS NULL OR cir.item1_type = p_substance_type OR cir.item2_type = p_substance_type);

    -- Check legacy interactions (join with products)
    RETURN QUERY
    SELECT
        'LEGACY'::varchar as source_system,
        i.severity::varchar,
        CASE
            WHEN p1.name ILIKE '%' || p_substance_name || '%' THEN p2.name
            ELSE p1.name
        END as interacting_substance,
        i.mechanism,
        'See mechanism for details'::text as recommendation,
        false as contraindicated,
        'C'::varchar as evidence_quality
    FROM interactions i
    JOIN products p1 ON i.item1_id = p1.id
    JOIN products p2 ON i.item2_id = p2.id
    WHERE i.deleted_at IS NULL
    AND (
        p1.name ILIKE '%' || p_substance_name || '%' OR
        p2.name ILIKE '%' || p_substance_name || '%'
    );
END;
$$;


ALTER FUNCTION "public"."find_all_interactions"("p_substance_name" character varying, "p_substance_type" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_all_interactions"("p_substance_name" character varying, "p_substance_type" character varying) IS 'Finds all interactions for a given substance across both systems';



CREATE OR REPLACE FUNCTION "public"."get_interaction_tier"("p_item1_type" character varying, "p_item1_identifier" character varying, "p_item2_type" character varying, "p_item2_identifier" character varying) RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_rule_exists boolean;
    v_cache_exists boolean;
    v_cache_fresh boolean;
BEGIN
    -- Check Tier 1: Rules
    SELECT EXISTS(
        SELECT 1 FROM critical_interaction_rules
        WHERE active = TRUE
        AND (
            (item1_type = p_item1_type AND item1_identifier ILIKE '%' || p_item1_identifier || '%'
             AND item2_type = p_item2_type AND item2_identifier ILIKE '%' || p_item2_identifier || '%')
            OR
            (item1_type = p_item2_type AND item1_identifier ILIKE '%' || p_item2_identifier || '%'
             AND item2_type = p_item1_type AND item2_identifier ILIKE '%' || p_item1_identifier || '%')
        )
    ) INTO v_rule_exists;

    IF v_rule_exists THEN
        RETURN 'RULES';
    END IF;

    -- Check Tier 2: Cache
    SELECT EXISTS(
        SELECT 1 FROM ai_response_cache
        WHERE cache_key = MD5(p_item1_identifier || p_item2_identifier)
        AND expires_at > NOW()
    ) INTO v_cache_fresh;

    IF v_cache_fresh THEN
        RETURN 'CACHE';
    END IF;

    -- Default to Tier 3: AI
    RETURN 'AI';
END;
$$;


ALTER FUNCTION "public"."get_interaction_tier"("p_item1_type" character varying, "p_item1_identifier" character varying, "p_item2_type" character varying, "p_item2_identifier" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_interaction_tier"("p_item1_type" character varying, "p_item1_identifier" character varying, "p_item2_type" character varying, "p_item2_identifier" character varying) IS 'Determines which tier (RULES/CACHE/AI) should handle an interaction query';



CREATE OR REPLACE FUNCTION "public"."increment_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_new_total integer;
    v_new_level integer;
BEGIN
    -- Update user points
    UPDATE user_points
    SET total_points = total_points + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_points INTO v_new_total;

    -- Calculate new level (every 1000 points = 1 level)
    v_new_level := FLOOR(v_new_total / 1000) + 1;

    -- Update level if changed
    UPDATE user_points
    SET level = v_new_level
    WHERE user_id = p_user_id AND level != v_new_level;

    -- Record points history
    INSERT INTO points_history (user_id, points_change, reason, metadata)
    VALUES (p_user_id, p_points, p_reason, p_metadata);

    RETURN jsonb_build_object(
        'total_points', v_new_total,
        'level', v_new_level,
        'points_added', p_points
    );
END;
$$;


ALTER FUNCTION "public"."increment_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_soft_deleted"("deleted_at" timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN deleted_at IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."is_soft_deleted"("deleted_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_interaction_check"("p_item1_name" character varying, "p_item2_name" character varying) RETURNS TABLE("normalized_item1" character varying, "normalized_item2" character varying, "item1_type" character varying, "item2_type" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH normalized AS (
        SELECT 
            COALESCE(sm1.generic_name, LOWER(TRIM(p_item1_name))) as norm_item1,
            COALESCE(sm2.generic_name, LOWER(TRIM(p_item2_name))) as norm_item2,
            COALESCE(sm1.category, 'unknown') as cat1,
            COALESCE(sm2.category, 'unknown') as cat2
        FROM 
            (SELECT 1) dummy
        LEFT JOIN substance_mappings sm1 
            ON p_item1_name ILIKE ANY(sm1.aliases) 
            OR LOWER(p_item1_name) = LOWER(sm1.common_name)
        LEFT JOIN substance_mappings sm2 
            ON p_item2_name ILIKE ANY(sm2.aliases) 
            OR LOWER(p_item2_name) = LOWER(sm2.common_name)
    )
    SELECT 
        CASE WHEN norm_item1 < norm_item2 THEN norm_item1 ELSE norm_item2 END,
        CASE WHEN norm_item1 < norm_item2 THEN norm_item2 ELSE norm_item1 END,
        CASE WHEN norm_item1 < norm_item2 THEN cat1 ELSE cat2 END,
        CASE WHEN norm_item1 < norm_item2 THEN cat2 ELSE cat1 END
    FROM normalized;
END;
$$;


ALTER FUNCTION "public"."normalize_interaction_check"("p_item1_name" character varying, "p_item2_name" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."normalize_interaction_check"("p_item1_name" character varying, "p_item2_name" character varying) IS 'Normalizes substance names for consistent interaction checking.';



CREATE OR REPLACE FUNCTION "public"."rollup_daily_analytics"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Archive old detailed logs (older than 30 days)
    INSERT INTO interaction_check_logs_archive 
    SELECT * FROM interaction_check_logs 
    WHERE checked_at < NOW() - INTERVAL '30 days';
    
    -- Delete archived logs from main table
    DELETE FROM interaction_check_logs 
    WHERE checked_at < NOW() - INTERVAL '30 days';
    
    -- Update materialized view for faster analytics
    REFRESH MATERIALIZED VIEW CONCURRENTLY interaction_statistics_daily;
END;
$$;


ALTER FUNCTION "public"."rollup_daily_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rollup_hourly_analytics"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  INSERT INTO analytics_rollup (period, user_id, scans, interactions_checked)
  SELECT
    TO_CHAR(DATE_TRUNC('hour', created_at), 'YYYY-MM-DD HH24:00') AS period,
    user_id,
    COUNT(*) FILTER (WHERE action = 'scan') AS scans,
    COUNT(*) FILTER (WHERE action = 'interaction_check') AS interactions_checked
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY period, user_id
  ON CONFLICT (period, user_id) DO UPDATE
  SET
    scans = EXCLUDED.scans, -- Assuming this replaces the count for the hour, not increments it.
    interactions_checked = EXCLUDED.interactions_checked; -- Adjust if you need to increment instead.
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;


ALTER FUNCTION "public"."rollup_hourly_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_products"("search_query" "text") RETURNS TABLE("id" "uuid", "name" "text", "rank" real)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, ts_rank(p.search_vector, query) AS rank
  FROM products p, websearch_to_tsquery('english', search_query) query
  WHERE p.search_vector @@ query
  ORDER BY rank DESC
  LIMIT 5;
END;
$$;


ALTER FUNCTION "public"."search_products"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_model_performance"("p_model_name" character varying, "p_provider" character varying, "p_success" boolean, "p_response_time_ms" integer, "p_tokens" integer DEFAULT 0, "p_cost" numeric DEFAULT 0, "p_quality_score" numeric DEFAULT NULL::numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO ai_model_metrics (
        model_name, provider, request_count, success_count, 
        error_count, total_tokens, total_cost, last_used
    ) VALUES (
        p_model_name, p_provider, 1, 
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN NOT p_success THEN 1 ELSE 0 END,
        p_tokens, p_cost, NOW()
    )
    ON CONFLICT (model_name, provider) 
    DO UPDATE SET
        request_count = ai_model_metrics.request_count + 1,
        success_count = ai_model_metrics.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
        error_count = ai_model_metrics.error_count + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
        total_tokens = ai_model_metrics.total_tokens + EXCLUDED.total_tokens,
        total_cost = ai_model_metrics.total_cost + EXCLUDED.total_cost,
        avg_response_time_ms = (
            (COALESCE(ai_model_metrics.avg_response_time_ms, 0) * ai_model_metrics.request_count + p_response_time_ms) 
            / (ai_model_metrics.request_count + 1)
        )::integer,
        avg_quality_score = CASE 
            WHEN p_quality_score IS NOT NULL THEN
                (
                    (COALESCE(ai_model_metrics.avg_quality_score, 0) * ai_model_metrics.request_count + p_quality_score) 
                    / (ai_model_metrics.request_count + 1)
                )::decimal(3,2)
            ELSE ai_model_metrics.avg_quality_score
        END,
        error_rate = (ai_model_metrics.error_count + CASE WHEN NOT p_success THEN 1 ELSE 0 END)::decimal / (ai_model_metrics.request_count + 1),
        last_used = NOW(),
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_ai_model_performance"("p_model_name" character varying, "p_provider" character varying, "p_success" boolean, "p_response_time_ms" integer, "p_tokens" integer, "p_cost" numeric, "p_quality_score" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_ai_model_performance"("p_model_name" character varying, "p_provider" character varying, "p_success" boolean, "p_response_time_ms" integer, "p_tokens" integer, "p_cost" numeric, "p_quality_score" numeric) IS 'Tracks AI provider performance metrics for optimization.';



CREATE OR REPLACE FUNCTION "public"."update_streak"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_last_activity date;
  v_current_streak integer;
  v_longest_streak integer;
BEGIN
  -- Get current data
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  -- Update streak
  IF v_last_activity = CURRENT_DATE THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already updated today');
  ELSIF v_last_activity = CURRENT_DATE - 1 THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    v_current_streak := 1;
  END IF;
  
  -- Update longest
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;
  
  -- Save
  UPDATE user_streaks
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_activity_date = CURRENT_DATE
  WHERE user_id = p_user_id;
  
  -- Award points for streaks
  IF v_current_streak IN (7, 30, 100) THEN
    PERFORM increment_points(p_user_id, v_current_streak * 10, 'streak_milestone');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak
  );
END;
$$;


ALTER FUNCTION "public"."update_streak"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."warm_interaction_cache"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  INSERT INTO ai_cache (cache_key, analysis_type, result, expires_at, id, created_at)
  SELECT
    CONCAT('groq:', p.name, ':', p.active_ingredients::TEXT),
    'groq',
    '{}',
    NOW() + INTERVAL '24 hours',
    uuid_generate_v4(),
    NOW()
  FROM products p
  JOIN user_stack us ON p.id = us.item_id
  GROUP BY p.id, p.name, p.active_ingredients
  ORDER BY COUNT(*) DESC
  LIMIT 100
  ON CONFLICT ON CONSTRAINT unique_cache_entry DO NOTHING;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;


ALTER FUNCTION "public"."warm_interaction_cache"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "analysis_type" "text",
    "result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."ai_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_model_metrics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "model_name" character varying(100) NOT NULL,
    "provider" character varying(50) NOT NULL,
    "endpoint" character varying(255),
    "request_count" integer DEFAULT 0,
    "success_count" integer DEFAULT 0,
    "error_count" integer DEFAULT 0,
    "total_tokens" integer DEFAULT 0,
    "total_cost" numeric(10,4) DEFAULT 0,
    "avg_response_time_ms" integer,
    "avg_quality_score" numeric(3,2),
    "error_rate" numeric(5,4),
    "last_used" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_model_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_response_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cache_key" character varying(255) NOT NULL,
    "query_hash" character varying(64) NOT NULL,
    "response" "jsonb" NOT NULL,
    "model_used" character varying(100),
    "provider" character varying(50),
    "response_time_ms" integer,
    "token_count" integer,
    "cost" numeric(10,6),
    "quality_score" numeric(3,2),
    "hit_count" integer DEFAULT 0,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "last_accessed" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_response_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_rollup" (
    "period" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scans" integer DEFAULT 0,
    "interactions_checked" integer DEFAULT 0
);


ALTER TABLE "public"."analytics_rollup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "table_name" character varying NOT NULL,
    "record_id" "uuid" NOT NULL,
    "operation" character varying NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "user_id" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audit_log_operation_check" CHECK ((("operation")::"text" = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::"text"[])))
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."critical_interaction_rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "item1_type" character varying(50) NOT NULL,
    "item1_identifier" character varying(255) NOT NULL,
    "item2_type" character varying(50) NOT NULL,
    "item2_identifier" character varying(255) NOT NULL,
    "severity" "public"."severity_level" NOT NULL,
    "mechanism" "text" NOT NULL,
    "clinical_significance" "text" NOT NULL,
    "recommendation" "text" NOT NULL,
    "contraindicated" boolean DEFAULT false,
    "monitoring_required" boolean DEFAULT false,
    "source" "public"."source_type" NOT NULL,
    "source_url" "text",
    "evidence_quality" "public"."evidence_quality",
    "version" integer DEFAULT 1,
    "last_reviewed" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "verified_by" character varying(255),
    "verified_at" timestamp with time zone,
    "active" boolean DEFAULT true,
    "superseded_by" "uuid",
    "version_notes" "text"
);


ALTER TABLE "public"."critical_interaction_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."critical_interaction_rules" IS 'FDA/NIH validated critical drug interaction rules for rule-based engine (Tier 1)';



COMMENT ON COLUMN "public"."critical_interaction_rules"."superseded_by" IS 'References newer version of this rule if updated.';



CREATE TABLE IF NOT EXISTS "public"."feedback_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "report_type" character varying(50) NOT NULL,
    "related_product_id" "uuid",
    "related_interaction_id" "uuid",
    "description" "text" NOT NULL,
    "severity" character varying(20),
    "status" character varying(50) DEFAULT 'NEW'::character varying,
    "resolution" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resulted_in_rule_id" "uuid",
    "implemented_at" timestamp with time zone,
    "implementation_notes" "text"
);


ALTER TABLE "public"."feedback_reports" OWNER TO "postgres";


COMMENT ON COLUMN "public"."feedback_reports"."resulted_in_rule_id" IS 'Links user feedback to implemented interaction rules.';



CREATE TABLE IF NOT EXISTS "public"."interaction_check_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "items_checked" "jsonb" NOT NULL,
    "interaction_count" integer DEFAULT 0,
    "critical_count" integer DEFAULT 0,
    "high_count" integer DEFAULT 0,
    "moderate_count" integer DEFAULT 0,
    "low_count" integer DEFAULT 0,
    "legacy_interactions_found" integer DEFAULT 0,
    "critical_rules_found" integer DEFAULT 0,
    "response_time_ms" integer,
    "tier_used" character varying(20),
    "checked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interaction_check_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."interaction_check_logs" IS 'Anonymous analytics for three-tier architecture performance';



CREATE TABLE IF NOT EXISTS "public"."interaction_check_logs_archive" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "items_checked" "jsonb" NOT NULL,
    "interaction_count" integer DEFAULT 0,
    "critical_count" integer DEFAULT 0,
    "high_count" integer DEFAULT 0,
    "moderate_count" integer DEFAULT 0,
    "low_count" integer DEFAULT 0,
    "legacy_interactions_found" integer DEFAULT 0,
    "critical_rules_found" integer DEFAULT 0,
    "response_time_ms" integer,
    "tier_used" character varying(20),
    "checked_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interaction_check_logs_archive" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "item1_id" "uuid" NOT NULL,
    "item2_id" "uuid" NOT NULL,
    "severity" character varying,
    "mechanism" "text",
    "evidence" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "interactions_severity_check" CHECK ((("severity")::"text" = ANY ((ARRAY['LOW'::character varying, 'MODERATE'::character varying, 'HIGH'::character varying, 'CRITICAL'::character varying])::"text"[])))
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "barcode" character varying(50),
    "name" character varying(255) NOT NULL,
    "generic_name" character varying(255),
    "brand" character varying(255),
    "manufacturer" character varying(255),
    "category" "public"."product_category" DEFAULT 'OTHER'::"public"."product_category",
    "dosage_form" character varying(100),
    "strength" character varying(100),
    "active_ingredients" "jsonb",
    "inactive_ingredients" "text"[],
    "image_url" "text",
    "verified" boolean DEFAULT false,
    "fda_approved" boolean DEFAULT false,
    "otc_status" boolean DEFAULT true,
    "warnings" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "search_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", (((((COALESCE("name", ''::character varying))::"text" || ' '::"text") || (COALESCE("generic_name", ''::character varying))::"text") || ' '::"text") || COALESCE(("active_ingredients")::"text", ''::"text")))) STORED,
    CONSTRAINT "chk_products_category" CHECK ((("category")::"text" = ANY (ARRAY['supplement'::"text", 'medication'::"text", 'vitamin'::"text", 'mineral'::"text", 'herb'::"text", 'specialty'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."active_ingredients" IS 'JSONB array of active ingredients with amounts';



COMMENT ON COLUMN "public"."products"."inactive_ingredients" IS 'Text array of inactive ingredients';



COMMENT ON COLUMN "public"."products"."fda_approved" IS 'FDA approval status for medications';



COMMENT ON COLUMN "public"."products"."otc_status" IS 'Over-the-counter availability status';



COMMENT ON COLUMN "public"."products"."warnings" IS 'Text array of safety warnings';



CREATE OR REPLACE VIEW "public"."interaction_migration_candidates" AS
 SELECT DISTINCT "p1"."name" AS "item1_name",
    ("p1"."category")::"text" AS "item1_type",
    "p2"."name" AS "item2_name",
    ("p2"."category")::"text" AS "item2_type",
    "i"."severity",
    "i"."mechanism",
    "i"."evidence",
    "count"(*) OVER (PARTITION BY "p1"."name", "p2"."name") AS "usage_count"
   FROM (("public"."interactions" "i"
     JOIN "public"."products" "p1" ON (("i"."item1_id" = "p1"."id")))
     JOIN "public"."products" "p2" ON (("i"."item2_id" = "p2"."id")))
  WHERE ("i"."deleted_at" IS NULL);


ALTER TABLE "public"."interaction_migration_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interaction_sources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "interaction_id" "uuid",
    "source_type" "public"."source_type" NOT NULL,
    "source_name" "text" NOT NULL,
    "source_url" "text",
    "publication_date" "date",
    "study_type" character varying(100),
    "confidence_score" numeric(3,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interaction_sources_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric)))
);


ALTER TABLE "public"."interaction_sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."interaction_sources" IS 'Evidence sources and citations for each interaction rule';



CREATE OR REPLACE VIEW "public"."interaction_statistics" AS
 SELECT "date_trunc"('day'::"text", "interaction_check_logs"."checked_at") AS "check_date",
    "count"(*) AS "total_checks",
    "avg"("interaction_check_logs"."interaction_count") AS "avg_interactions",
    "sum"("interaction_check_logs"."critical_count") AS "total_critical",
    "sum"("interaction_check_logs"."high_count") AS "total_high",
    "avg"("interaction_check_logs"."response_time_ms") AS "avg_response_time",
    "count"(
        CASE
            WHEN (("interaction_check_logs"."tier_used")::"text" = 'RULES'::"text") THEN 1
            ELSE NULL::integer
        END) AS "rules_count",
    "count"(
        CASE
            WHEN (("interaction_check_logs"."tier_used")::"text" = 'CACHE'::"text") THEN 1
            ELSE NULL::integer
        END) AS "cache_count",
    "count"(
        CASE
            WHEN (("interaction_check_logs"."tier_used")::"text" = 'AI'::"text") THEN 1
            ELSE NULL::integer
        END) AS "ai_count",
    "sum"("interaction_check_logs"."legacy_interactions_found") AS "total_legacy_interactions",
    "sum"("interaction_check_logs"."critical_rules_found") AS "total_critical_rules"
   FROM "public"."interaction_check_logs"
  GROUP BY ("date_trunc"('day'::"text", "interaction_check_logs"."checked_at"));


ALTER TABLE "public"."interaction_statistics" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."interaction_statistics_daily" AS
 SELECT "date_trunc"('day'::"text", "interaction_check_logs"."checked_at") AS "check_date",
    "count"(*) AS "total_checks",
    "count"(DISTINCT "interaction_check_logs"."session_id") AS "unique_sessions",
    "avg"("interaction_check_logs"."interaction_count") AS "avg_interactions_per_check",
    "sum"("interaction_check_logs"."critical_count") AS "total_critical",
    "sum"("interaction_check_logs"."high_count") AS "total_high",
    "avg"("interaction_check_logs"."response_time_ms") AS "avg_response_time",
    "count"(
        CASE
            WHEN (("interaction_check_logs"."tier_used")::"text" = 'RULES'::"text") THEN 1
            ELSE NULL::integer
        END) AS "rules_count",
    "count"(
        CASE
            WHEN (("interaction_check_logs"."tier_used")::"text" = 'CACHE'::"text") THEN 1
            ELSE NULL::integer
        END) AS "cache_count",
    "count"(
        CASE
            WHEN (("interaction_check_logs"."tier_used")::"text" = 'AI'::"text") THEN 1
            ELSE NULL::integer
        END) AS "ai_count",
    (("count"(
        CASE
            WHEN (("interaction_check_logs"."tier_used")::"text" = 'CACHE'::"text") THEN 1
            ELSE NULL::integer
        END))::double precision / (NULLIF("count"(*), 0))::double precision) AS "cache_hit_rate"
   FROM "public"."interaction_check_logs"
  GROUP BY ("date_trunc"('day'::"text", "interaction_check_logs"."checked_at"))
  WITH NO DATA;


ALTER TABLE "public"."interaction_statistics_daily" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."interaction_system_stats" AS
 SELECT "count"(DISTINCT "critical_interaction_rules"."id") AS "total_critical_rules",
    "count"(DISTINCT
        CASE
            WHEN ("critical_interaction_rules"."severity" = 'CRITICAL'::"public"."severity_level") THEN "critical_interaction_rules"."id"
            ELSE NULL::"uuid"
        END) AS "critical_count",
    "count"(DISTINCT
        CASE
            WHEN ("critical_interaction_rules"."severity" = 'HIGH'::"public"."severity_level") THEN "critical_interaction_rules"."id"
            ELSE NULL::"uuid"
        END) AS "high_count",
    "count"(DISTINCT
        CASE
            WHEN ("critical_interaction_rules"."severity" = 'MODERATE'::"public"."severity_level") THEN "critical_interaction_rules"."id"
            ELSE NULL::"uuid"
        END) AS "moderate_count",
    "count"(DISTINCT
        CASE
            WHEN ("critical_interaction_rules"."source" = 'FDA'::"public"."source_type") THEN "critical_interaction_rules"."id"
            ELSE NULL::"uuid"
        END) AS "fda_rules",
    "count"(DISTINCT
        CASE
            WHEN ("critical_interaction_rules"."source" = 'NIH'::"public"."source_type") THEN "critical_interaction_rules"."id"
            ELSE NULL::"uuid"
        END) AS "nih_rules",
    "count"(DISTINCT
        CASE
            WHEN ("critical_interaction_rules"."contraindicated" = true) THEN "critical_interaction_rules"."id"
            ELSE NULL::"uuid"
        END) AS "contraindicated_count",
    "count"(DISTINCT
        CASE
            WHEN ("critical_interaction_rules"."evidence_quality" = 'A'::"public"."evidence_quality") THEN "critical_interaction_rules"."id"
            ELSE NULL::"uuid"
        END) AS "grade_a_evidence",
    "max"("critical_interaction_rules"."last_reviewed") AS "last_review_date",
    ("count"(DISTINCT "critical_interaction_rules"."item1_identifier") + "count"(DISTINCT "critical_interaction_rules"."item2_identifier")) AS "unique_substances"
   FROM "public"."critical_interaction_rules"
  WHERE ("critical_interaction_rules"."active" = true);


ALTER TABLE "public"."interaction_system_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nutrient_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nutrient_name" character varying(100) NOT NULL,
    "upper_limit" numeric(10,2),
    "unit" character varying(20) NOT NULL,
    "age_group" character varying(50),
    "gender" character varying(20),
    "pregnancy_limit" numeric(10,2),
    "lactation_limit" numeric(10,2),
    "health_risks" "text",
    "toxicity_symptoms" "text"[],
    "source" character varying(50) NOT NULL,
    "source_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."nutrient_limits" OWNER TO "postgres";


COMMENT ON TABLE "public"."nutrient_limits" IS 'FDA/NIH upper limits for nutrients and vitamins';



CREATE TABLE IF NOT EXISTS "public"."points_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "points_change" integer NOT NULL,
    "reason" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."points_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_analytics_rollup" (
    "date_period" "date" NOT NULL,
    "product_category" character varying NOT NULL,
    "scan_count" integer DEFAULT 0,
    "avg_analysis_score" numeric,
    "interaction_frequency" integer DEFAULT 0
);


ALTER TABLE "public"."product_analytics_rollup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_patients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "relationship_type" character varying DEFAULT 'provider_patient'::character varying,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."provider_patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scan_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "session_id" character varying(255),
    "product_id" "uuid",
    "scan_type" character varying,
    "analysis_score" integer,
    "interaction_count" integer DEFAULT 0,
    "severity_max" "public"."severity_level",
    "scanned_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_scan_analysis_score" CHECK ((("analysis_score" IS NULL) OR (("analysis_score" >= 0) AND ("analysis_score" <= 100))))
);


ALTER TABLE "public"."scan_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."substance_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "common_name" character varying(255) NOT NULL,
    "aliases" "text"[],
    "category" character varying(50),
    "generic_name" character varying(255),
    "cas_number" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."substance_mappings" OWNER TO "postgres";


COMMENT ON TABLE "public"."substance_mappings" IS 'Normalized substance names and aliases for flexible matching';



CREATE TABLE IF NOT EXISTS "public"."user_behavior_analytics" (
    "date_period" "date" NOT NULL,
    "age_range" character varying NOT NULL,
    "usage_pattern" character varying NOT NULL,
    "feature_usage" "jsonb",
    "session_duration_avg" integer
);


ALTER TABLE "public"."user_behavior_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_points" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_points" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "theme" character varying DEFAULT 'system'::character varying,
    "notifications_enabled" boolean DEFAULT true,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "language" character varying DEFAULT 'en'::character varying,
    "timezone" character varying DEFAULT 'UTC'::character varying,
    "privacy_level" character varying DEFAULT 'standard'::character varying,
    "data_sharing_consent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" character varying,
    "avatar_url" "text",
    "bio" "text",
    "date_of_birth" "date",
    "gender" character varying,
    "height_cm" integer,
    "weight_kg" numeric,
    "activity_level" character varying,
    "health_goals" "text"[],
    "medical_conditions" "text"[],
    "allergies" "text"[],
    "medications" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_user_height" CHECK ((("height_cm" IS NULL) OR (("height_cm" >= 50) AND ("height_cm" <= 300)))),
    CONSTRAINT "chk_user_weight" CHECK ((("weight_kg" IS NULL) OR (("weight_kg" >= (20)::numeric) AND ("weight_kg" <= (500)::numeric))))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_profiles"."medical_conditions" IS 'Anonymized medical conditions for analytics only';



COMMENT ON COLUMN "public"."user_profiles"."allergies" IS 'Anonymized allergies for interaction checking';



COMMENT ON COLUMN "public"."user_profiles"."medications" IS 'Anonymized medications for interaction checking';



CREATE MATERIALIZED VIEW "public"."user_profile_summary" AS
 SELECT "user_profiles"."user_id",
    "user_profiles"."display_name",
    COALESCE("jsonb_agg"(DISTINCT "goal"."goal") FILTER (WHERE ("goal"."goal" IS NOT NULL)), '[]'::"jsonb") AS "health_goals",
    COALESCE("jsonb_agg"(DISTINCT "condition"."condition") FILTER (WHERE ("condition"."condition" IS NOT NULL)), '[]'::"jsonb") AS "medical_conditions",
    COALESCE("jsonb_agg"(DISTINCT "allergy"."allergy") FILTER (WHERE ("allergy"."allergy" IS NOT NULL)), '[]'::"jsonb") AS "allergies",
    COALESCE("jsonb_agg"(DISTINCT "medication"."medication") FILTER (WHERE ("medication"."medication" IS NOT NULL)), '[]'::"jsonb") AS "medications"
   FROM "public"."user_profiles",
    LATERAL "unnest"("user_profiles"."health_goals") "goal"("goal"),
    LATERAL "unnest"("user_profiles"."medical_conditions") "condition"("condition"),
    LATERAL "unnest"("user_profiles"."allergies") "allergy"("allergy"),
    LATERAL "unnest"("user_profiles"."medications") "medication"("medication")
  WHERE ("user_profiles"."user_id" IS NOT NULL)
  GROUP BY "user_profiles"."user_id", "user_profiles"."display_name"
  WITH NO DATA;


ALTER TABLE "public"."user_profile_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "granted_by" "uuid",
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "verification_document_url" "text",
    "verification_status" character varying(50) DEFAULT 'PENDING'::character varying,
    "verified_at" timestamp with time zone,
    "verification_expires_at" timestamp with time zone,
    "license_number" character varying(100),
    "license_state" character varying(2),
    CONSTRAINT "user_roles_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['patient'::character varying, 'provider'::character varying, 'admin'::character varying, 'moderator'::character varying])::"text"[]))),
    CONSTRAINT "user_roles_verification_status_check" CHECK ((("verification_status")::"text" = ANY ((ARRAY['PENDING'::character varying, 'VERIFIED'::character varying, 'REJECTED'::character varying, 'EXPIRED'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stack" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "uuid",
    "name" character varying NOT NULL,
    "type" character varying,
    "dosage" character varying,
    "frequency" character varying,
    "brand" character varying,
    "image_url" "text",
    "ingredients" "jsonb",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "user_stack_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['medication'::character varying, 'supplement'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_stack" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_streaks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_scan_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "submission_id" character varying(100) NOT NULL,
    "product_name" character varying(255) NOT NULL,
    "barcode" character varying(50),
    "brand" character varying(255),
    "front_image_url" "text",
    "back_image_url" "text",
    "ingredients_image_url" "text",
    "status" character varying(50) DEFAULT 'PENDING'::character varying,
    "rejection_reason" "text",
    "approved_product_id" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "reviewer_notes" "text"
);


ALTER TABLE "public"."user_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_id" "uuid" NOT NULL,
    "email" character varying,
    "is_anonymous" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_cache"
    ADD CONSTRAINT "ai_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_model_metrics"
    ADD CONSTRAINT "ai_model_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_response_cache"
    ADD CONSTRAINT "ai_response_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."ai_response_cache"
    ADD CONSTRAINT "ai_response_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_rollup"
    ADD CONSTRAINT "analytics_rollup_pkey" PRIMARY KEY ("period", "user_id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."critical_interaction_rules"
    ADD CONSTRAINT "critical_interaction_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_reports"
    ADD CONSTRAINT "feedback_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_check_logs_archive"
    ADD CONSTRAINT "interaction_check_logs_archive_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_check_logs"
    ADD CONSTRAINT "interaction_check_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_sources"
    ADD CONSTRAINT "interaction_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrient_limits"
    ADD CONSTRAINT "nutrient_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."points_history"
    ADD CONSTRAINT "points_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_analytics_rollup"
    ADD CONSTRAINT "product_analytics_rollup_pkey" PRIMARY KEY ("date_period", "product_category");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_barcode_key" UNIQUE ("barcode");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_patients"
    ADD CONSTRAINT "provider_patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_patients"
    ADD CONSTRAINT "provider_patients_provider_id_patient_id_key" UNIQUE ("provider_id", "patient_id");



ALTER TABLE ONLY "public"."scan_history"
    ADD CONSTRAINT "scan_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."substance_mappings"
    ADD CONSTRAINT "substance_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_cache"
    ADD CONSTRAINT "unique_cache_entry" UNIQUE ("cache_key", "analysis_type", "expires_at");



ALTER TABLE ONLY "public"."ai_model_metrics"
    ADD CONSTRAINT "unique_model_provider" UNIQUE ("model_name", "provider");



ALTER TABLE ONLY "public"."user_behavior_analytics"
    ADD CONSTRAINT "user_behavior_analytics_pkey" PRIMARY KEY ("date_period", "age_range", "usage_pattern");



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_stack"
    ADD CONSTRAINT "user_stack_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_submissions"
    ADD CONSTRAINT "user_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_submissions"
    ADD CONSTRAINT "user_submissions_submission_id_key" UNIQUE ("submission_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "ai_cache_key_idx" ON "public"."ai_cache" USING "btree" ("cache_key", "analysis_type");



CREATE INDEX "idx_ai_cache_expires" ON "public"."ai_response_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_ai_cache_key" ON "public"."ai_response_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_ai_cache_last_accessed" ON "public"."ai_response_cache" USING "btree" ("last_accessed" DESC);



CREATE INDEX "idx_ai_cache_provider" ON "public"."ai_response_cache" USING "btree" ("provider");



CREATE INDEX "idx_ai_cache_quality" ON "public"."ai_response_cache" USING "btree" ("quality_score" DESC);



CREATE INDEX "idx_critical_interactions_item1" ON "public"."critical_interaction_rules" USING "btree" ("item1_type", "item1_identifier") WHERE ("active" = true);



CREATE INDEX "idx_critical_interactions_item2" ON "public"."critical_interaction_rules" USING "btree" ("item2_type", "item2_identifier") WHERE ("active" = true);



CREATE INDEX "idx_critical_interactions_severity" ON "public"."critical_interaction_rules" USING "btree" ("severity") WHERE ("active" = true);



CREATE INDEX "idx_critical_rules_exact" ON "public"."critical_interaction_rules" USING "btree" ("lower"(("item1_identifier")::"text"), "lower"(("item2_identifier")::"text")) WHERE ("active" = true);



CREATE INDEX "idx_critical_rules_exact_reverse" ON "public"."critical_interaction_rules" USING "btree" ("lower"(("item2_identifier")::"text"), "lower"(("item1_identifier")::"text")) WHERE ("active" = true);



CREATE INDEX "idx_critical_rules_item1_trgm" ON "public"."critical_interaction_rules" USING "gin" ("item1_identifier" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_critical_rules_item2_trgm" ON "public"."critical_interaction_rules" USING "gin" ("item2_identifier" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_critical_rules_superseded" ON "public"."critical_interaction_rules" USING "btree" ("superseded_by") WHERE ("superseded_by" IS NOT NULL);



CREATE INDEX "idx_feedback_implemented" ON "public"."feedback_reports" USING "btree" ("resulted_in_rule_id") WHERE ("resulted_in_rule_id" IS NOT NULL);



CREATE INDEX "idx_interaction_logs_session" ON "public"."interaction_check_logs" USING "btree" ("session_id", "checked_at" DESC);



CREATE INDEX "idx_interaction_logs_tier" ON "public"."interaction_check_logs" USING "btree" ("tier_used");



CREATE INDEX "idx_interaction_stats_daily_date" ON "public"."interaction_statistics_daily" USING "btree" ("check_date" DESC);



CREATE INDEX "idx_interactions_item1" ON "public"."interactions" USING "btree" ("item1_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_interactions_item2" ON "public"."interactions" USING "btree" ("item2_id") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "idx_interactions_unique_pair" ON "public"."interactions" USING "btree" (LEAST("item1_id", "item2_id"), GREATEST("item1_id", "item2_id")) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_nutrient_limits_name" ON "public"."nutrient_limits" USING "gin" ("nutrient_name" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_nutrient_limits_source" ON "public"."nutrient_limits" USING "btree" ("source");



CREATE INDEX "idx_products_active_ingredients_gin" ON "public"."products" USING "gin" ("active_ingredients");



CREATE INDEX "idx_products_barcode" ON "public"."products" USING "btree" ("barcode") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_dosage_form" ON "public"."products" USING "btree" ("dosage_form") WHERE ("dosage_form" IS NOT NULL);



CREATE INDEX "idx_products_fda_approved" ON "public"."products" USING "btree" ("fda_approved") WHERE ("fda_approved" = true);



CREATE INDEX "idx_products_generic_name" ON "public"."products" USING "gin" ("generic_name" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_products_inactive_ingredients_gin" ON "public"."products" USING "gin" ("inactive_ingredients");



CREATE INDEX "idx_products_name" ON "public"."products" USING "gin" ("name" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_products_search_vector" ON "public"."products" USING "gin" ("search_vector");



CREATE INDEX "idx_products_strength" ON "public"."products" USING "btree" ("strength") WHERE ("strength" IS NOT NULL);



CREATE INDEX "idx_scan_history_analysis_score" ON "public"."scan_history" USING "btree" ("analysis_score") WHERE ("analysis_score" IS NOT NULL);



CREATE INDEX "idx_scan_history_interaction_count" ON "public"."scan_history" USING "btree" ("interaction_count") WHERE ("interaction_count" > 0);



CREATE INDEX "idx_scan_history_session" ON "public"."scan_history" USING "btree" ("session_id", "scanned_at" DESC);



CREATE INDEX "idx_scan_history_user_date" ON "public"."scan_history" USING "btree" ("user_id", "scanned_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_scan_history_user_id" ON "public"."scan_history" USING "btree" ("user_id");



CREATE INDEX "idx_submissions_status" ON "public"."user_submissions" USING "btree" ("status");



CREATE INDEX "idx_substance_mappings_aliases" ON "public"."substance_mappings" USING "gin" ("aliases");



CREATE INDEX "idx_substance_mappings_category" ON "public"."substance_mappings" USING "btree" ("category");



CREATE INDEX "idx_substance_mappings_common_name" ON "public"."substance_mappings" USING "gin" ("common_name" "extensions"."gin_trgm_ops");



CREATE UNIQUE INDEX "idx_unique_interaction_pair" ON "public"."interactions" USING "btree" (LEAST("item1_id", "item2_id"), GREATEST("item1_id", "item2_id"));



CREATE INDEX "idx_user_profiles_allergies_gin" ON "public"."user_profiles" USING "gin" ("allergies");



CREATE INDEX "idx_user_profiles_conditions_gin" ON "public"."user_profiles" USING "gin" ("medical_conditions");



CREATE INDEX "idx_user_profiles_display_name" ON "public"."user_profiles" USING "btree" ("display_name") WHERE ("display_name" IS NOT NULL);



CREATE INDEX "idx_user_profiles_health_goals_gin" ON "public"."user_profiles" USING "gin" ("health_goals");



CREATE INDEX "idx_user_roles_verified_providers" ON "public"."user_roles" USING "btree" ("role", "verification_status") WHERE ((("role")::"text" = 'provider'::"text") AND (("verification_status")::"text" = 'VERIFIED'::"text"));



CREATE UNIQUE INDEX "idx_user_stack_unique_active" ON "public"."user_stack" USING "btree" ("user_id", "item_id") WHERE (("active" = true) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_user_stack_user_active" ON "public"."user_stack" USING "btree" ("user_id") WHERE (("active" = true) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_users_auth_id" ON "public"."users" USING "btree" ("auth_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email") WHERE ("deleted_at" IS NULL);



CREATE INDEX "interaction_check_logs_archive_session_id_checked_at_idx" ON "public"."interaction_check_logs_archive" USING "btree" ("session_id", "checked_at" DESC);



CREATE INDEX "interaction_check_logs_archive_tier_used_idx" ON "public"."interaction_check_logs_archive" USING "btree" ("tier_used");



CREATE INDEX "products_search_idx" ON "public"."products" USING "gin" ("search_vector");



CREATE UNIQUE INDEX "user_profile_summary_idx" ON "public"."user_profile_summary" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_ai_model_metrics_updated_at" BEFORE UPDATE ON "public"."ai_model_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_response_cache_updated_at" BEFORE UPDATE ON "public"."ai_response_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_interactions_updated_at" BEFORE UPDATE ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_provider_patients_updated_at" BEFORE UPDATE ON "public"."provider_patients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scan_history_updated_at" BEFORE UPDATE ON "public"."scan_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_substance_mappings_updated_at" BEFORE UPDATE ON "public"."substance_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_points_updated_at" BEFORE UPDATE ON "public"."user_points" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_stack_updated_at" BEFORE UPDATE ON "public"."user_stack" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_streaks_updated_at" BEFORE UPDATE ON "public"."user_streaks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ai_response_cache"
    ADD CONSTRAINT "ai_response_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."critical_interaction_rules"
    ADD CONSTRAINT "critical_interaction_rules_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."critical_interaction_rules"("id");



ALTER TABLE ONLY "public"."feedback_reports"
    ADD CONSTRAINT "feedback_reports_related_interaction_id_fkey" FOREIGN KEY ("related_interaction_id") REFERENCES "public"."critical_interaction_rules"("id");



ALTER TABLE ONLY "public"."feedback_reports"
    ADD CONSTRAINT "feedback_reports_related_product_id_fkey" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."feedback_reports"
    ADD CONSTRAINT "feedback_reports_resulted_in_rule_id_fkey" FOREIGN KEY ("resulted_in_rule_id") REFERENCES "public"."critical_interaction_rules"("id");



ALTER TABLE ONLY "public"."interaction_sources"
    ADD CONSTRAINT "interaction_sources_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "public"."critical_interaction_rules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_item1_id_fkey" FOREIGN KEY ("item1_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_item2_id_fkey" FOREIGN KEY ("item2_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."points_history"
    ADD CONSTRAINT "points_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_patients"
    ADD CONSTRAINT "provider_patients_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_patients"
    ADD CONSTRAINT "provider_patients_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scan_history"
    ADD CONSTRAINT "scan_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."scan_history"
    ADD CONSTRAINT "scan_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stack"
    ADD CONSTRAINT "user_stack_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."user_stack"
    ADD CONSTRAINT "user_stack_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_submissions"
    ADD CONSTRAINT "user_submissions_approved_product_id_fkey" FOREIGN KEY ("approved_product_id") REFERENCES "public"."products"("id");



CREATE POLICY "Anonymous can insert feedback reports" ON "public"."feedback_reports" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anonymous can insert interaction logs" ON "public"."interaction_check_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anonymous can insert scan history" ON "public"."scan_history" FOR INSERT WITH CHECK (("user_id" IS NULL));



CREATE POLICY "Anonymous can insert user submissions" ON "public"."user_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public read access to critical interactions" ON "public"."critical_interaction_rules" FOR SELECT USING (("active" = true));



CREATE POLICY "Public read access to interactions" ON "public"."interactions" FOR SELECT USING (("deleted_at" IS NULL));



CREATE POLICY "Public read access to nutrient limits" ON "public"."nutrient_limits" FOR SELECT USING (true);



CREATE POLICY "Public read access to product analytics" ON "public"."product_analytics_rollup" FOR SELECT USING (true);



CREATE POLICY "Public read access to products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Public read access to substance mappings" ON "public"."substance_mappings" FOR SELECT USING (true);



CREATE POLICY "Public read access to user behavior analytics" ON "public"."user_behavior_analytics" FOR SELECT USING (true);



CREATE POLICY "Users can manage own preferences" ON "public"."user_preferences" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage own stack" ON "public"."user_stack" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own data" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "auth_id"));



CREATE POLICY "Users can read own points" ON "public"."user_points" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own points history" ON "public"."points_history" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own profile" ON "public"."user_profiles" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own scan history" ON "public"."scan_history" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own streaks" ON "public"."user_streaks" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own data" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "auth_id"));



ALTER TABLE "public"."ai_response_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analytics_access" ON "public"."analytics_events" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."critical_interaction_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nutrient_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."points_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_analytics_rollup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_patients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scan_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."substance_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_behavior_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stack" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_streaks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."anonymize_age_from_birth_date"("birth_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."anonymize_age_from_birth_date"("birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."anonymize_age_from_birth_date"("birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_ai_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_ai_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_ai_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_with_profile"("p_auth_id" "uuid", "p_email" "text", "p_is_anonymous" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_with_profile"("p_auth_id" "uuid", "p_email" "text", "p_is_anonymous" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_with_profile"("p_auth_id" "uuid", "p_email" "text", "p_is_anonymous" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_all_interactions"("p_substance_name" character varying, "p_substance_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."find_all_interactions"("p_substance_name" character varying, "p_substance_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_all_interactions"("p_substance_name" character varying, "p_substance_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_interaction_tier"("p_item1_type" character varying, "p_item1_identifier" character varying, "p_item2_type" character varying, "p_item2_identifier" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_interaction_tier"("p_item1_type" character varying, "p_item1_identifier" character varying, "p_item2_type" character varying, "p_item2_identifier" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_interaction_tier"("p_item1_type" character varying, "p_item1_identifier" character varying, "p_item2_type" character varying, "p_item2_identifier" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_soft_deleted"("deleted_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."is_soft_deleted"("deleted_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_soft_deleted"("deleted_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_interaction_check"("p_item1_name" character varying, "p_item2_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_interaction_check"("p_item1_name" character varying, "p_item2_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_interaction_check"("p_item1_name" character varying, "p_item2_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."rollup_daily_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."rollup_daily_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rollup_daily_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rollup_hourly_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."rollup_hourly_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rollup_hourly_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_products"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_products"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_products"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_model_performance"("p_model_name" character varying, "p_provider" character varying, "p_success" boolean, "p_response_time_ms" integer, "p_tokens" integer, "p_cost" numeric, "p_quality_score" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_model_performance"("p_model_name" character varying, "p_provider" character varying, "p_success" boolean, "p_response_time_ms" integer, "p_tokens" integer, "p_cost" numeric, "p_quality_score" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_model_performance"("p_model_name" character varying, "p_provider" character varying, "p_success" boolean, "p_response_time_ms" integer, "p_tokens" integer, "p_cost" numeric, "p_quality_score" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_streak"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_streak"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_streak"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."warm_interaction_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."warm_interaction_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."warm_interaction_cache"() TO "service_role";



GRANT ALL ON TABLE "public"."ai_cache" TO "anon";
GRANT ALL ON TABLE "public"."ai_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_cache" TO "service_role";



GRANT ALL ON TABLE "public"."ai_model_metrics" TO "anon";
GRANT ALL ON TABLE "public"."ai_model_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_model_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."ai_response_cache" TO "anon";
GRANT ALL ON TABLE "public"."ai_response_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_response_cache" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_rollup" TO "anon";
GRANT ALL ON TABLE "public"."analytics_rollup" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_rollup" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."critical_interaction_rules" TO "anon";
GRANT ALL ON TABLE "public"."critical_interaction_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."critical_interaction_rules" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_reports" TO "anon";
GRANT ALL ON TABLE "public"."feedback_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_reports" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_check_logs" TO "anon";
GRANT ALL ON TABLE "public"."interaction_check_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_check_logs" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_check_logs_archive" TO "anon";
GRANT ALL ON TABLE "public"."interaction_check_logs_archive" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_check_logs_archive" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_migration_candidates" TO "anon";
GRANT ALL ON TABLE "public"."interaction_migration_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_migration_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_sources" TO "anon";
GRANT ALL ON TABLE "public"."interaction_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_sources" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_statistics" TO "anon";
GRANT ALL ON TABLE "public"."interaction_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_statistics_daily" TO "anon";
GRANT ALL ON TABLE "public"."interaction_statistics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_statistics_daily" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_system_stats" TO "anon";
GRANT ALL ON TABLE "public"."interaction_system_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_system_stats" TO "service_role";



GRANT ALL ON TABLE "public"."nutrient_limits" TO "anon";
GRANT ALL ON TABLE "public"."nutrient_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrient_limits" TO "service_role";



GRANT ALL ON TABLE "public"."points_history" TO "anon";
GRANT ALL ON TABLE "public"."points_history" TO "authenticated";
GRANT ALL ON TABLE "public"."points_history" TO "service_role";



GRANT ALL ON TABLE "public"."product_analytics_rollup" TO "anon";
GRANT ALL ON TABLE "public"."product_analytics_rollup" TO "authenticated";
GRANT ALL ON TABLE "public"."product_analytics_rollup" TO "service_role";



GRANT ALL ON TABLE "public"."provider_patients" TO "anon";
GRANT ALL ON TABLE "public"."provider_patients" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_patients" TO "service_role";



GRANT ALL ON TABLE "public"."scan_history" TO "anon";
GRANT ALL ON TABLE "public"."scan_history" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_history" TO "service_role";



GRANT ALL ON TABLE "public"."substance_mappings" TO "anon";
GRANT ALL ON TABLE "public"."substance_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."substance_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."user_behavior_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_behavior_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_behavior_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_points" TO "anon";
GRANT ALL ON TABLE "public"."user_points" TO "authenticated";
GRANT ALL ON TABLE "public"."user_points" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_profile_summary" TO "anon";
GRANT ALL ON TABLE "public"."user_profile_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profile_summary" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_stack" TO "anon";
GRANT ALL ON TABLE "public"."user_stack" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stack" TO "service_role";



GRANT ALL ON TABLE "public"."user_streaks" TO "anon";
GRANT ALL ON TABLE "public"."user_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_streaks" TO "service_role";



GRANT ALL ON TABLE "public"."user_submissions" TO "anon";
GRANT ALL ON TABLE "public"."user_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



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






RESET ALL;
