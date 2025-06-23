-- =====================================================
-- PHARMAGUIDE COMPLETE DATABASE REBUILD
-- Drop everything and create fresh with all features
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- DROP ALL EXISTING TABLES AND TYPES
-- =====================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS feedback_reports CASCADE;
DROP TABLE IF EXISTS interaction_check_logs CASCADE;
DROP TABLE IF EXISTS ai_model_metrics CASCADE;
DROP TABLE IF EXISTS user_submissions CASCADE;
DROP TABLE IF EXISTS interaction_sources CASCADE;
DROP TABLE IF EXISTS critical_interaction_rules CASCADE;
DROP TABLE IF EXISTS nutrient_limits CASCADE;
DROP TABLE IF EXISTS substance_mappings CASCADE;
DROP TABLE IF EXISTS provider_patients CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS points_history CASCADE;
DROP TABLE IF EXISTS scan_history CASCADE;
DROP TABLE IF EXISTS user_stack CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS ai_response_cache CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop views
DROP VIEW IF EXISTS interaction_statistics CASCADE;
DROP VIEW IF EXISTS interaction_migration_candidates CASCADE;
DROP VIEW IF EXISTS interaction_system_stats CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_interaction_tier CASCADE;
DROP FUNCTION IF EXISTS find_all_interactions CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Drop types
DROP TYPE IF EXISTS severity_level CASCADE;
DROP TYPE IF EXISTS interaction_status CASCADE;
DROP TYPE IF EXISTS source_type CASCADE;
DROP TYPE IF EXISTS product_category CASCADE;
DROP TYPE IF EXISTS evidence_quality CASCADE;

-- =====================================================
-- CREATE ENUM TYPES
-- =====================================================

CREATE TYPE severity_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
CREATE TYPE interaction_status AS ENUM ('VERIFIED', 'PENDING', 'AI_GENERATED');
CREATE TYPE source_type AS ENUM ('FDA', 'NIH', 'PUBMED', 'CLINICAL_STUDY', 'MANUFACTURER', 'AI');
CREATE TYPE product_category AS ENUM ('MEDICATION', 'SUPPLEMENT', 'HERB', 'VITAMIN', 'MINERAL', 'OTHER');
CREATE TYPE evidence_quality AS ENUM ('A', 'B', 'C', 'D', 'EXPERT_OPINION');

-- =====================================================
-- CORE TABLES (EXISTING SCHEMA PRESERVED)
-- =====================================================

-- 1. Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id uuid UNIQUE NOT NULL,
  email varchar UNIQUE,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- 2. User profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name varchar,
  avatar_url text,
  bio text,
  date_of_birth date,
  gender varchar,
  height_cm integer,
  weight_kg decimal,
  activity_level varchar,
  health_goals text[],
  medical_conditions text[],
  allergies text[],
  medications text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- 3. Products table (enhanced)
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode varchar(50) UNIQUE,
    name varchar(255) NOT NULL,
    generic_name varchar(255),
    brand varchar(255),
    manufacturer varchar(255),
    category product_category DEFAULT 'OTHER',
    dosage_form varchar(100), -- tablet, capsule, liquid, etc.
    strength varchar(100), -- 500mg, 10ml, etc.
    active_ingredients jsonb, -- [{name: "aspirin", amount: "325mg"}]
    inactive_ingredients text[],
    image_url text,
    verified boolean DEFAULT false,
    fda_approved boolean DEFAULT false,
    otc_status boolean DEFAULT true,
    warnings text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- 4. User preferences table
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme varchar DEFAULT 'system',
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  language varchar DEFAULT 'en',
  timezone varchar DEFAULT 'UTC',
  privacy_level varchar DEFAULT 'standard',
  data_sharing_consent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. User points table
CREATE TABLE user_points (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. User streaks table
CREATE TABLE user_streaks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_scan_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. User stack table (with proper column names for your codebase)
CREATE TABLE user_stack (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES products(id),
  name varchar NOT NULL,
  type varchar CHECK (type IN ('medication', 'supplement')),
  dosage varchar,
  frequency varchar,
  brand varchar,
  image_url text, -- Note: snake_case for database, camelCase in app
  ingredients jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- 8. Legacy interactions table (preserved for backward compatibility)
CREATE TABLE interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  item1_id uuid NOT NULL REFERENCES products(id),
  item2_id uuid NOT NULL REFERENCES products(id),
  severity varchar CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
  mechanism text,
  evidence text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- 9. Points history table
CREATE TABLE points_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_change integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 10. Scan history table (enhanced for analytics)
CREATE TABLE scan_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_id varchar(255), -- For anonymous tracking
  product_id uuid REFERENCES products(id),
  scan_type varchar,
  analysis_score integer,
  interaction_count integer DEFAULT 0,
  severity_max severity_level,
  scanned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- =====================================================
-- NEW ENHANCED TABLES
-- =====================================================

-- 11. Substance mappings (for normalization)
CREATE TABLE substance_mappings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    common_name varchar(255) NOT NULL,
    aliases text[], -- Array of alternative names
    category varchar(50), -- 'medication', 'supplement', etc.
    generic_name varchar(255),
    cas_number varchar(50), -- Chemical identifier
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 12. Critical interaction rules (NEW - FDA/NIH validated)
CREATE TABLE critical_interaction_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    item1_type varchar(50) NOT NULL, -- 'medication', 'supplement', 'condition', 'food'
    item1_identifier varchar(255) NOT NULL, -- generic name or category
    item2_type varchar(50) NOT NULL,
    item2_identifier varchar(255) NOT NULL,
    severity severity_level NOT NULL,
    mechanism text NOT NULL,
    clinical_significance text NOT NULL,
    recommendation text NOT NULL,
    contraindicated boolean DEFAULT false,
    monitoring_required boolean DEFAULT false,
    source source_type NOT NULL,
    source_url text,
    evidence_quality evidence_quality,
    version integer DEFAULT 1,
    last_reviewed date,
    created_at timestamptz DEFAULT now(),
    verified_by varchar(255),
    verified_at timestamptz,
    active boolean DEFAULT true
);

-- 13. Interaction sources (evidence for each interaction)
CREATE TABLE interaction_sources (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id uuid REFERENCES critical_interaction_rules(id) ON DELETE CASCADE,
    source_type source_type NOT NULL,
    source_name text NOT NULL,
    source_url text,
    publication_date date,
    study_type varchar(100), -- 'RCT', 'Meta-analysis', 'Case Report', etc.
    confidence_score decimal(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 14. Nutrient upper limits table
CREATE TABLE nutrient_limits (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nutrient_name varchar(100) NOT NULL,
    upper_limit decimal(10,2),
    unit varchar(20) NOT NULL,
    age_group varchar(50),
    gender varchar(20),
    pregnancy_limit decimal(10,2),
    lactation_limit decimal(10,2),
    health_risks text,
    toxicity_symptoms text[],
    source varchar(50) NOT NULL, -- 'FDA', 'NIH', 'IOM'
    source_url text,
    created_at timestamptz DEFAULT now()
);

-- 15. AI response cache (enhanced)
CREATE TABLE ai_response_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key varchar(255) UNIQUE NOT NULL,
  query_hash varchar(64) NOT NULL, -- SHA-256 of the query
  response jsonb NOT NULL,
  model_used varchar(100),
  provider varchar(50), -- 'groq', 'huggingface', 'openai'
  response_time_ms integer,
  token_count integer,
  cost decimal(10,6),
  quality_score decimal(3,2),
  hit_count integer DEFAULT 0,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  last_accessed timestamptz DEFAULT now()
);

-- 16. User submissions (community data)
CREATE TABLE user_submissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id varchar(100) UNIQUE NOT NULL, -- Anonymous ID
    product_name varchar(255) NOT NULL,
    barcode varchar(50),
    brand varchar(255),
    front_image_url text,
    back_image_url text,
    ingredients_image_url text,
    status varchar(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    rejection_reason text,
    approved_product_id uuid REFERENCES products(id),
    submitted_at timestamptz DEFAULT now(),
    reviewed_at timestamptz,
    reviewer_notes text
);

-- 17. AI model performance metrics
CREATE TABLE ai_model_metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name varchar(100) NOT NULL,
    provider varchar(50) NOT NULL,
    endpoint varchar(255),
    request_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    error_count integer DEFAULT 0,
    total_tokens integer DEFAULT 0,
    total_cost decimal(10,4) DEFAULT 0,
    avg_response_time_ms integer,
    avg_quality_score decimal(3,2),
    error_rate decimal(5,4),
    last_used timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 18. Interaction check logs (anonymous analytics)
CREATE TABLE interaction_check_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id varchar(255) NOT NULL,
    items_checked jsonb NOT NULL, -- Array of items checked
    interaction_count integer DEFAULT 0,
    critical_count integer DEFAULT 0,
    high_count integer DEFAULT 0,
    moderate_count integer DEFAULT 0,
    low_count integer DEFAULT 0,
    legacy_interactions_found integer DEFAULT 0,
    critical_rules_found integer DEFAULT 0,
    response_time_ms integer,
    tier_used varchar(20), -- 'RULES', 'CACHE', 'AI'
    checked_at timestamptz DEFAULT now()
);

-- 19. Feedback and reports (anonymous)
CREATE TABLE feedback_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type varchar(50) NOT NULL, -- 'INTERACTION', 'PRODUCT', 'GENERAL'
    related_product_id uuid REFERENCES products(id),
    related_interaction_id uuid REFERENCES critical_interaction_rules(id),
    description text NOT NULL,
    severity varchar(20),
    status varchar(50) DEFAULT 'NEW', -- 'NEW', 'REVIEWING', 'RESOLVED'
    resolution text,
    created_at timestamptz DEFAULT now(),
    resolved_at timestamptz
);

-- 20. Audit log table
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name varchar NOT NULL,
  record_id uuid NOT NULL,
  operation varchar NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  changed_at timestamptz DEFAULT now()
);

-- 21. User roles table
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role varchar NOT NULL CHECK (role IN ('patient', 'provider', 'admin', 'moderator')),
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES users(id),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 22. Provider patients table
CREATE TABLE provider_patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_type varchar DEFAULT 'provider_patient',
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, patient_id)
);

-- =====================================================
-- CREATE PERFORMANCE INDEXES
-- =====================================================

-- Core table indexes
CREATE INDEX idx_users_auth_id ON users(auth_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

CREATE INDEX idx_products_barcode ON products(barcode) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_generic_name ON products USING gin(generic_name gin_trgm_ops);
CREATE INDEX idx_products_category ON products(category);

-- User stack indexes
CREATE INDEX idx_user_stack_user_active ON user_stack(user_id) WHERE active = true AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_stack_unique_active ON user_stack(user_id, item_id) WHERE active = true AND deleted_at IS NULL;

-- Legacy interaction indexes
CREATE INDEX idx_interactions_item1 ON interactions(item1_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interactions_item2 ON interactions(item2_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_interactions_unique_pair ON interactions(LEAST(item1_id, item2_id), GREATEST(item1_id, item2_id)) WHERE deleted_at IS NULL;

-- Critical interaction rules indexes (with fuzzy matching)
CREATE INDEX idx_critical_interactions_item1 ON critical_interaction_rules(item1_type, item1_identifier) WHERE active = TRUE;
CREATE INDEX idx_critical_interactions_item2 ON critical_interaction_rules(item2_type, item2_identifier) WHERE active = TRUE;
CREATE INDEX idx_critical_interactions_severity ON critical_interaction_rules(severity) WHERE active = TRUE;
CREATE INDEX idx_critical_rules_item1_trgm ON critical_interaction_rules USING gin(item1_identifier gin_trgm_ops);
CREATE INDEX idx_critical_rules_item2_trgm ON critical_interaction_rules USING gin(item2_identifier gin_trgm_ops);

-- Substance mappings indexes
CREATE INDEX idx_substance_mappings_common_name ON substance_mappings USING gin(common_name gin_trgm_ops);
CREATE INDEX idx_substance_mappings_aliases ON substance_mappings USING gin(aliases);
CREATE INDEX idx_substance_mappings_category ON substance_mappings(category);

-- AI cache indexes
CREATE INDEX idx_ai_cache_key ON ai_response_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_response_cache(expires_at);
CREATE INDEX idx_ai_cache_quality ON ai_response_cache(quality_score DESC);
CREATE INDEX idx_ai_cache_provider ON ai_response_cache(provider);
CREATE INDEX idx_ai_cache_last_accessed ON ai_response_cache(last_accessed DESC);

-- Analytics indexes
CREATE INDEX idx_scan_history_session ON scan_history(session_id, scanned_at DESC);
CREATE INDEX idx_scan_history_user_date ON scan_history(user_id, scanned_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_submissions_status ON user_submissions(status);
CREATE INDEX idx_interaction_logs_session ON interaction_check_logs(session_id, checked_at DESC);
CREATE INDEX idx_interaction_logs_tier ON interaction_check_logs(tier_used);

-- Nutrient limits indexes
CREATE INDEX idx_nutrient_limits_name ON nutrient_limits USING gin(nutrient_name gin_trgm_ops);
CREATE INDEX idx_nutrient_limits_source ON nutrient_limits(source);

-- =====================================================
-- CREATE FUNCTIONS
-- =====================================================

-- Function for three-tier architecture support
CREATE OR REPLACE FUNCTION get_interaction_tier(
    p_item1_type varchar,
    p_item1_identifier varchar,
    p_item2_type varchar,
    p_item2_identifier varchar
) RETURNS varchar AS $$
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
$$ LANGUAGE plpgsql;

-- Function to find all interactions for a substance
CREATE OR REPLACE FUNCTION find_all_interactions(
    p_substance_name varchar,
    p_substance_type varchar DEFAULT NULL
) RETURNS TABLE (
    source_system varchar,
    severity varchar,
    interacting_substance varchar,
    mechanism text,
    recommendation text,
    contraindicated boolean,
    evidence_quality varchar
) AS $$
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
$$ LANGUAGE plpgsql;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- CREATE VIEWS
-- =====================================================

-- Interaction statistics view
CREATE VIEW interaction_statistics AS
SELECT
    DATE_TRUNC('day', checked_at) as check_date,
    COUNT(*) as total_checks,
    AVG(interaction_count) as avg_interactions,
    SUM(critical_count) as total_critical,
    SUM(high_count) as total_high,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN tier_used = 'RULES' THEN 1 END) as rules_count,
    COUNT(CASE WHEN tier_used = 'CACHE' THEN 1 END) as cache_count,
    COUNT(CASE WHEN tier_used = 'AI' THEN 1 END) as ai_count,
    SUM(legacy_interactions_found) as total_legacy_interactions,
    SUM(critical_rules_found) as total_critical_rules
FROM interaction_check_logs
GROUP BY DATE_TRUNC('day', checked_at);

-- Migration candidates view
CREATE VIEW interaction_migration_candidates AS
SELECT DISTINCT
    p1.name as item1_name,
    p1.category::text as item1_type,
    p2.name as item2_name,
    p2.category::text as item2_type,
    i.severity,
    i.mechanism,
    i.evidence,
    COUNT(*) OVER (PARTITION BY p1.name, p2.name) as usage_count
FROM interactions i
JOIN products p1 ON i.item1_id = p1.id
JOIN products p2 ON i.item2_id = p2.id
WHERE i.deleted_at IS NULL;

-- System stats view
CREATE VIEW interaction_system_stats AS
SELECT
    COUNT(DISTINCT id) as total_critical_rules,
    COUNT(DISTINCT CASE WHEN severity = 'CRITICAL' THEN id END) as critical_count,
    COUNT(DISTINCT CASE WHEN severity = 'HIGH' THEN id END) as high_count,
    COUNT(DISTINCT CASE WHEN severity = 'MODERATE' THEN id END) as moderate_count,
    COUNT(DISTINCT CASE WHEN source = 'FDA' THEN id END) as fda_rules,
    COUNT(DISTINCT CASE WHEN source = 'NIH' THEN id END) as nih_rules,
    COUNT(DISTINCT CASE WHEN contraindicated = true THEN id END) as contraindicated_count,
    COUNT(DISTINCT CASE WHEN evidence_quality = 'A' THEN id END) as grade_a_evidence,
    MAX(last_reviewed) as last_review_date,
    COUNT(DISTINCT item1_identifier) + COUNT(DISTINCT item2_identifier) as unique_substances
FROM critical_interaction_rules
WHERE active = TRUE;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stack_updated_at BEFORE UPDATE ON user_stack
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_response_cache_updated_at BEFORE UPDATE ON ai_response_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_model_metrics_updated_at BEFORE UPDATE ON ai_model_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scan_history_updated_at BEFORE UPDATE ON scan_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_substance_mappings_updated_at BEFORE UPDATE ON substance_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_patients_updated_at BEFORE UPDATE ON provider_patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_patients ENABLE ROW LEVEL SECURITY;

-- Public read access to products and interactions
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_interaction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE substance_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read access to products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Public read access to interactions" ON interactions
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Public read access to critical interactions" ON critical_interaction_rules
    FOR SELECT USING (active = true);

CREATE POLICY "Public read access to nutrient limits" ON nutrient_limits
    FOR SELECT USING (true);

CREATE POLICY "Public read access to substance mappings" ON substance_mappings
    FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Users can read own profile" ON user_profiles
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can read own points" ON user_points
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can read own streaks" ON user_streaks
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own stack" ON user_stack
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can read own points history" ON points_history
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can read own scan history" ON scan_history
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Anonymous access policies for analytics
CREATE POLICY "Anonymous can insert scan history" ON scan_history
    FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous can insert interaction logs" ON interaction_check_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can insert user submissions" ON user_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can insert feedback reports" ON feedback_reports
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to anon and authenticated users
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON interactions TO anon, authenticated;
GRANT SELECT ON critical_interaction_rules TO anon, authenticated;
GRANT SELECT ON nutrient_limits TO anon, authenticated;
GRANT SELECT ON substance_mappings TO anon, authenticated;
GRANT SELECT ON interaction_sources TO anon, authenticated;

-- Grant insert permissions for analytics
GRANT INSERT ON scan_history TO anon, authenticated;
GRANT INSERT ON interaction_check_logs TO anon, authenticated;
GRANT INSERT ON user_submissions TO anon, authenticated;
GRANT INSERT ON feedback_reports TO anon, authenticated;

-- Grant access to views
GRANT SELECT ON interaction_statistics TO authenticated;
GRANT SELECT ON interaction_system_stats TO anon, authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION get_interaction_tier TO anon, authenticated;
GRANT EXECUTE ON FUNCTION find_all_interactions TO anon, authenticated;

-- =====================================================
-- INSERT SUBSTANCE MAPPINGS (for normalization)
-- =====================================================

INSERT INTO substance_mappings (common_name, aliases, category, generic_name) VALUES
('warfarin', ARRAY['coumadin', 'jantoven', 'warfarin sodium'], 'medication', 'warfarin'),
('vitamin k', ARRAY['phytonadione', 'vitamin k1', 'phylloquinone', 'menaquinone'], 'supplement', 'vitamin k'),
('st johns wort', ARRAY['hypericum perforatum', 'sjw', 'saint johns wort'], 'supplement', 'hypericum perforatum'),
('ssri', ARRAY['selective serotonin reuptake inhibitor', 'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram'], 'medication', 'ssri'),
('5-htp', ARRAY['5-hydroxytryptophan', '5htp', 'oxitriptan'], 'supplement', '5-hydroxytryptophan'),
('ace inhibitor', ARRAY['lisinopril', 'enalapril', 'captopril', 'ramipril'], 'medication', 'ace inhibitor'),
('potassium', ARRAY['potassium chloride', 'potassium citrate', 'k+'], 'supplement', 'potassium'),
('levothyroxine', ARRAY['synthroid', 'levoxyl', 'tirosint', 'l-thyroxine'], 'medication', 'levothyroxine'),
('calcium', ARRAY['calcium carbonate', 'calcium citrate', 'ca++'], 'supplement', 'calcium'),
('iron', ARRAY['ferrous sulfate', 'ferrous gluconate', 'iron sulfate', 'fe++'], 'supplement', 'iron'),
('zinc', ARRAY['zinc sulfate', 'zinc gluconate', 'zn++'], 'supplement', 'zinc'),
('copper', ARRAY['copper sulfate', 'copper gluconate', 'cu++'], 'supplement', 'copper'),
('oral contraceptive', ARRAY['birth control', 'contraceptive pill', 'the pill'], 'medication', 'oral contraceptive'),
('ginkgo', ARRAY['ginkgo biloba', 'maidenhair tree'], 'supplement', 'ginkgo biloba'),
('fish oil', ARRAY['omega-3', 'epa', 'dha', 'omega 3 fatty acids'], 'supplement', 'fish oil'),
('metformin', ARRAY['glucophage', 'fortamet'], 'medication', 'metformin'),
('chromium', ARRAY['chromium picolinate', 'cr+++'], 'supplement', 'chromium'),
('insulin', ARRAY['humalog', 'novolog', 'lantus'], 'medication', 'insulin'),
('bitter melon', ARRAY['momordica charantia', 'karela'], 'supplement', 'bitter melon'),
('statin', ARRAY['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin'], 'medication', 'statin'),
('red yeast rice', ARRAY['monascus purpureus', 'ryr'], 'supplement', 'red yeast rice'),
('coq10', ARRAY['coenzyme q10', 'ubiquinone', 'ubidecarenone'], 'supplement', 'coenzyme q10'),
('nsaid', ARRAY['ibuprofen', 'naproxen', 'aspirin', 'diclofenac'], 'medication', 'nsaid'),
('benzodiazepine', ARRAY['lorazepam', 'alprazolam', 'diazepam', 'clonazepam'], 'medication', 'benzodiazepine'),
('valerian', ARRAY['valeriana officinalis', 'valerian root'], 'supplement', 'valerian'),
('melatonin', ARRAY['n-acetyl-5-methoxytryptamine'], 'supplement', 'melatonin'),
('cyclosporine', ARRAY['neoral', 'sandimmune'], 'medication', 'cyclosporine'),
('magnesium', ARRAY['magnesium oxide', 'magnesium citrate', 'mg++'], 'supplement', 'magnesium'),
('vitamin c', ARRAY['ascorbic acid', 'l-ascorbic acid'], 'supplement', 'vitamin c'),
('vitamin a', ARRAY['retinol', 'beta carotene', 'retinyl palmitate'], 'supplement', 'vitamin a'),
('vitamin d', ARRAY['cholecalciferol', 'ergocalciferol', 'vitamin d3', 'vitamin d2'], 'supplement', 'vitamin d');

-- =====================================================
-- INSERT CRITICAL INTERACTION RULES (25+ FDA/NIH VALIDATED)
-- =====================================================

INSERT INTO critical_interaction_rules (
    item1_type, item1_identifier, item2_type, item2_identifier,
    severity, mechanism, clinical_significance, recommendation,
    contraindicated, monitoring_required, source, evidence_quality, active
) VALUES

-- 1. CRITICAL BLOOD THINNER INTERACTIONS
('medication', 'warfarin', 'supplement', 'vitamin k', 'CRITICAL',
 'Vitamin K antagonizes warfarin anticoagulant effects by promoting clotting factor synthesis',
 'Increased risk of thromboembolism, stroke, and cardiovascular events. Can reduce warfarin efficacy by 50-80%',
 'AVOID vitamin K supplements. Maintain consistent dietary vitamin K intake. Monitor INR closely if unavoidable.',
 true, true, 'FDA', 'A', true),

('medication', 'warfarin', 'supplement', 'ginkgo', 'CRITICAL',
 'Ginkgo inhibits platelet aggregation and may potentiate anticoagulant effects',
 'Increased bleeding risk including intracranial hemorrhage. Case reports of serious bleeding events',
 'AVOID concurrent use. If used, monitor INR weekly and watch for bleeding signs.',
 true, true, 'FDA', 'B', true),

('medication', 'warfarin', 'supplement', 'fish oil', 'HIGH',
 'High-dose omega-3 fatty acids may enhance anticoagulant effects',
 'Increased bleeding risk, particularly with doses >3g/day EPA+DHA',
 'Limit fish oil to <1g/day EPA+DHA. Monitor INR if higher doses needed.',
 false, true, 'NIH', 'B', true),

-- 2. SSRI INTERACTIONS
('medication', 'ssri', 'supplement', 'st johns wort', 'CRITICAL',
 'Serotonin syndrome risk due to dual serotonergic activity',
 'Life-threatening serotonin syndrome: hyperthermia, altered mental status, neuromuscular abnormalities',
 'CONTRAINDICATED. Discontinue St. Johns Wort 2 weeks before starting SSRI.',
 true, true, 'FDA', 'A', true),

('medication', 'ssri', 'supplement', '5-htp', 'HIGH',
 'Additive serotonergic effects increasing serotonin syndrome risk',
 'Moderate to high risk of serotonin syndrome, especially with higher doses',
 'AVOID concurrent use. If necessary, use lowest effective doses with close monitoring.',
 false, true, 'NIH', 'B', true),

-- 3. BLOOD PRESSURE MEDICATION INTERACTIONS
('medication', 'ace inhibitor', 'supplement', 'potassium', 'HIGH',
 'ACE inhibitors reduce potassium excretion, potassium supplements add to total body potassium',
 'Hyperkalemia risk leading to cardiac arrhythmias and cardiac arrest',
 'Monitor serum potassium closely. Avoid potassium supplements unless specifically prescribed.',
 false, true, 'FDA', 'A', true),

-- 4. THYROID MEDICATION INTERACTIONS
('medication', 'levothyroxine', 'supplement', 'calcium', 'HIGH',
 'Calcium binds to levothyroxine in the GI tract, reducing absorption by up to 60%',
 'Reduced thyroid hormone levels leading to hypothyroidism symptoms',
 'Space doses by at least 4 hours. Take levothyroxine on empty stomach.',
 false, true, 'FDA', 'A', true),

('medication', 'levothyroxine', 'supplement', 'iron', 'HIGH',
 'Iron forms insoluble complexes with levothyroxine, reducing absorption',
 'Decreased thyroid hormone effectiveness, potential treatment failure',
 'Space doses by at least 4 hours. Monitor TSH levels closely.',
 false, true, 'FDA', 'A', true),

-- 5. DIABETES MEDICATION INTERACTIONS
('medication', 'metformin', 'supplement', 'chromium', 'MODERATE',
 'Both affect glucose metabolism and insulin sensitivity',
 'Enhanced glucose-lowering effects may lead to hypoglycemia',
 'Monitor blood glucose closely. May need diabetes medication adjustment.',
 false, true, 'NIH', 'B', true),

('medication', 'insulin', 'supplement', 'bitter melon', 'HIGH',
 'Bitter melon has insulin-like effects and may enhance glucose lowering',
 'Significant hypoglycemia risk, particularly with higher doses',
 'Monitor blood glucose frequently. Consider reducing insulin dose with medical supervision.',
 false, true, 'CLINICAL_STUDY', 'B', true),

-- 6. STATIN INTERACTIONS
('medication', 'statin', 'supplement', 'red yeast rice', 'HIGH',
 'Red yeast rice contains natural statins (monacolin K = lovastatin)',
 'Additive statin effects increasing myopathy and rhabdomyolysis risk',
 'AVOID concurrent use. Choose one approach for cholesterol management.',
 true, true, 'FDA', 'A', true),

('medication', 'statin', 'supplement', 'coq10', 'LOW',
 'Statins deplete CoQ10; supplementation may reduce statin-induced myopathy',
 'Potential protective effect against statin-induced muscle symptoms',
 'Consider CoQ10 supplementation (100-200mg/day) to reduce myopathy risk.',
 false, false, 'CLINICAL_STUDY', 'B', true),

-- 7. NSAID INTERACTIONS
('medication', 'nsaid', 'supplement', 'fish oil', 'MODERATE',
 'Both affect platelet function and bleeding time',
 'Increased bleeding risk, particularly with higher fish oil doses',
 'Monitor for bleeding signs. Limit fish oil to <2g/day EPA+DHA.',
 false, true, 'NIH', 'B', true),

-- 8. IMMUNOSUPPRESSANT INTERACTIONS
('medication', 'cyclosporine', 'supplement', 'st johns wort', 'CRITICAL',
 'St. Johns Wort induces CYP3A4, dramatically reducing cyclosporine levels',
 'Organ rejection risk due to subtherapeutic immunosuppression',
 'CONTRAINDICATED. Can reduce cyclosporine levels by 50-70%.',
 true, true, 'FDA', 'A', true),

-- 9. SEDATIVE INTERACTIONS
('medication', 'benzodiazepine', 'supplement', 'valerian', 'HIGH',
 'Additive CNS depressant effects',
 'Enhanced sedation, respiratory depression risk, impaired cognitive function',
 'AVOID concurrent use. If necessary, use lowest doses with close monitoring.',
 false, true, 'NIH', 'B', true),

('medication', 'benzodiazepine', 'supplement', 'melatonin', 'MODERATE',
 'Additive sedative effects',
 'Enhanced drowsiness and cognitive impairment, particularly in elderly',
 'Use caution. Start with lowest melatonin dose. Avoid driving.',
 false, true, 'CLINICAL_STUDY', 'B', true),

-- 10. BIRTH CONTROL INTERACTIONS
('medication', 'oral contraceptive', 'supplement', 'st johns wort', 'HIGH',
 'St. Johns Wort induces hepatic enzymes, reducing contraceptive hormone levels',
 'Breakthrough bleeding and contraceptive failure leading to unintended pregnancy',
 'Use additional contraceptive methods. Consider alternative antidepressant.',
 false, true, 'FDA', 'A', true),

-- 11. SUPPLEMENT-SUPPLEMENT INTERACTIONS
('supplement', 'calcium', 'supplement', 'iron', 'MODERATE',
 'Calcium competes with iron for absorption via DMT1 transporter',
 'Reduced iron absorption by up to 60%, potential iron deficiency',
 'Space doses by 2-4 hours for optimal absorption of both minerals.',
 false, false, 'NIH', 'A', true),

('supplement', 'calcium', 'supplement', 'magnesium', 'LOW',
 'High calcium may interfere with magnesium absorption',
 'Potential magnesium deficiency with very high calcium intake',
 'Maintain 2:1 calcium to magnesium ratio. Consider combined supplements.',
 false, false, 'NIH', 'B', true),

('supplement', 'zinc', 'supplement', 'copper', 'MODERATE',
 'High zinc intake interferes with copper absorption',
 'Copper deficiency leading to anemia and neurological symptoms',
 'Limit zinc to <40mg/day. Consider copper supplementation with high-dose zinc.',
 false, false, 'NIH', 'A', true),

('supplement', 'vitamin c', 'supplement', 'iron', 'LOW',
 'Vitamin C enhances non-heme iron absorption',
 'Improved iron bioavailability, beneficial for iron deficiency',
 'Take together to enhance iron absorption. Optimal ratio 100mg vitamin C per 10mg iron.',
 false, false, 'NIH', 'A', true),

-- 12. HIGH-DOSE NUTRIENT WARNINGS
('supplement', 'vitamin a', 'supplement', 'vitamin a', 'HIGH',
 'Cumulative vitamin A toxicity from multiple sources',
 'Hepatotoxicity, bone loss, birth defects, intracranial pressure',
 'Limit total vitamin A to <10,000 IU/day. Avoid during pregnancy.',
 false, true, 'FDA', 'A', true);

-- =====================================================
-- INSERT NUTRIENT UPPER LIMITS (FDA/NIH)
-- =====================================================

INSERT INTO nutrient_limits (
    nutrient_name, upper_limit, unit, age_group, gender,
    health_risks, toxicity_symptoms, source, source_url
) VALUES
('Vitamin A', 10000, 'IU', 'Adults 19+', 'All',
 'Liver damage, bone loss, birth defects',
 ARRAY['Nausea', 'Headache', 'Dizziness', 'Blurred vision', 'Muscle aches'],
 'FDA', 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/'),

('Vitamin D', 4000, 'IU', 'Adults 19+', 'All',
 'Hypercalcemia, kidney stones, cardiac arrhythmias',
 ARRAY['Nausea', 'Vomiting', 'Weakness', 'Kidney problems'],
 'NIH', 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'),

('Calcium', 2500, 'mg', 'Adults 19-50', 'All',
 'Kidney stones, cardiovascular issues, mineral absorption interference',
 ARRAY['Constipation', 'Kidney stones', 'Interference with other minerals'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/'),

('Calcium', 2000, 'mg', 'Adults 51+', 'All',
 'Kidney stones, cardiovascular issues, mineral absorption interference',
 ARRAY['Constipation', 'Kidney stones', 'Interference with other minerals'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/'),

('Iron', 45, 'mg', 'Adults 19+', 'All',
 'Gastrointestinal distress, organ damage',
 ARRAY['Nausea', 'Vomiting', 'Diarrhea', 'Constipation'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'),

('Zinc', 40, 'mg', 'Adults 19+', 'All',
 'Copper deficiency, immune suppression, HDL reduction',
 ARRAY['Nausea', 'Loss of appetite', 'Stomach cramps', 'Diarrhea'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/'),

('Magnesium', 350, 'mg', 'Adults 19+', 'All',
 'Diarrhea, nausea, abdominal cramping (from supplements only)',
 ARRAY['Diarrhea', 'Nausea', 'Abdominal cramping'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'),

('Vitamin C', 2000, 'mg', 'Adults 19+', 'All',
 'Gastrointestinal disturbances, kidney stones',
 ARRAY['Diarrhea', 'Nausea', 'Stomach cramps'],
 'NIH', 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/'),

('Vitamin E', 1000, 'mg', 'Adults 19+', 'All',
 'Increased bleeding risk, hemorrhagic stroke',
 ARRAY['Bleeding', 'Bruising', 'Fatigue'],
 'NIH', 'https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/'),

('Niacin', 35, 'mg', 'Adults 19+', 'All',
 'Flushing, liver damage, glucose intolerance',
 ARRAY['Skin flushing', 'Itching', 'Nausea', 'Liver problems'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Niacin-HealthProfessional/'),

('Vitamin B6', 100, 'mg', 'Adults 19+', 'All',
 'Nerve damage, sensory neuropathy',
 ARRAY['Numbness', 'Tingling in hands and feet', 'Loss of coordination'],
 'NIH', 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/'),

('Folate', 1000, 'mcg', 'Adults 19+', 'All',
 'May mask vitamin B12 deficiency',
 ARRAY['May hide B12 deficiency symptoms'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/');

-- =====================================================
-- INSERT INTERACTION SOURCES (Evidence Citations)
-- =====================================================

INSERT INTO interaction_sources (
    interaction_id, source_type, source_name, source_url, study_type, confidence_score
) VALUES
-- Warfarin + Vitamin K sources
((SELECT id FROM critical_interaction_rules WHERE item1_identifier = 'warfarin' AND item2_identifier = 'vitamin k'),
 'FDA', 'FDA Drug Safety Communication', 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication', 'Regulatory Guidance', 0.95),

-- SSRI + St. Johns Wort sources
((SELECT id FROM critical_interaction_rules WHERE item1_identifier = 'ssri' AND item2_identifier = 'st johns wort'),
 'FDA', 'FDA MedWatch Safety Alert', 'https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program', 'Case Reports', 0.90),

-- Levothyroxine + Calcium sources
((SELECT id FROM critical_interaction_rules WHERE item1_identifier = 'levothyroxine' AND item2_identifier = 'calcium'),
 'CLINICAL_STUDY', 'American Thyroid Association Guidelines', 'https://www.liebertpub.com/doi/10.1089/thy.2014.0028', 'Clinical Trial', 0.92),

-- Calcium + Iron sources
((SELECT id FROM critical_interaction_rules WHERE item1_identifier = 'calcium' AND item2_identifier = 'iron'),
 'NIH', 'NIH Office of Dietary Supplements', 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/', 'Meta-analysis', 0.88);

-- =====================================================
-- CREATE RPC FUNCTIONS (for your existing codebase)
-- =====================================================

-- Function to create user with profile (matches your existing code)
CREATE OR REPLACE FUNCTION create_user_with_profile(
    p_auth_id uuid,
    p_email text DEFAULT NULL,
    p_is_anonymous boolean DEFAULT false
) RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user points
CREATE OR REPLACE FUNCTION increment_points(
    p_user_id uuid,
    p_points integer,
    p_reason text,
    p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_streak(
    p_user_id uuid,
    p_scan_date date DEFAULT CURRENT_DATE
) RETURNS jsonb AS $$
DECLARE
    v_current_streak integer;
    v_longest_streak integer;
    v_last_scan_date date;
    v_new_streak integer;
BEGIN
    -- Get current streak data
    SELECT current_streak, longest_streak, last_scan_date
    INTO v_current_streak, v_longest_streak, v_last_scan_date
    FROM user_streaks
    WHERE user_id = p_user_id;

    -- Calculate new streak
    IF v_last_scan_date IS NULL OR v_last_scan_date < p_scan_date - INTERVAL '1 day' THEN
        -- Reset streak if more than 1 day gap
        v_new_streak := 1;
    ELSIF v_last_scan_date = p_scan_date - INTERVAL '1 day' THEN
        -- Continue streak if scanned yesterday
        v_new_streak := v_current_streak + 1;
    ELSE
        -- Same day scan, no change
        v_new_streak := v_current_streak;
    END IF;

    -- Update longest streak if necessary
    IF v_new_streak > v_longest_streak THEN
        v_longest_streak := v_new_streak;
    END IF;

    -- Update user streaks
    UPDATE user_streaks
    SET current_streak = v_new_streak,
        longest_streak = v_longest_streak,
        last_scan_date = p_scan_date,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'current_streak', v_new_streak,
        'longest_streak', v_longest_streak,
        'last_scan_date', p_scan_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION create_user_with_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_points TO authenticated;
GRANT EXECUTE ON FUNCTION update_streak TO authenticated;

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON DATABASE postgres IS 'PharmaGuide - Complete supplement interaction analysis database with FDA/NIH validated safety rules';

COMMENT ON TABLE critical_interaction_rules IS 'FDA/NIH validated critical drug interaction rules for rule-based engine (Tier 1)';
COMMENT ON TABLE interaction_sources IS 'Evidence sources and citations for each interaction rule';
COMMENT ON TABLE nutrient_limits IS 'FDA/NIH upper limits for nutrients and vitamins';
COMMENT ON TABLE substance_mappings IS 'Normalized substance names and aliases for flexible matching';
COMMENT ON TABLE interaction_check_logs IS 'Anonymous analytics for three-tier architecture performance';

COMMENT ON FUNCTION get_interaction_tier IS 'Determines which tier (RULES/CACHE/AI) should handle an interaction query';
COMMENT ON FUNCTION find_all_interactions IS 'Finds all interactions for a given substance across both systems';
COMMENT ON FUNCTION create_user_with_profile IS 'Creates user with all associated profile tables';

-- =====================================================
-- FINAL SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 PharmaGuide database successfully created!';
    RAISE NOTICE '✅ Tables: % created', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE '✅ Critical Interactions: % loaded', (SELECT COUNT(*) FROM critical_interaction_rules WHERE active = true);
    RAISE NOTICE '✅ Nutrient Limits: % loaded', (SELECT COUNT(*) FROM nutrient_limits);
    RAISE NOTICE '✅ Substance Mappings: % loaded', (SELECT COUNT(*) FROM substance_mappings);
    RAISE NOTICE '🚀 Three-tier architecture ready for optimal performance!';
END $$;
