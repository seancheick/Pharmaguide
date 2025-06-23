-- PharmaGuide Critical Interactions Migration (Hybrid Approach)
-- This migration adds the new critical interaction rules system alongside existing interactions table
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Create enum types for new system
CREATE TYPE severity_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
CREATE TYPE interaction_status AS ENUM ('VERIFIED', 'PENDING', 'AI_GENERATED');
CREATE TYPE source_type AS ENUM ('FDA', 'NIH', 'PUBMED', 'CLINICAL_STUDY', 'MANUFACTURER', 'AI');
CREATE TYPE product_category AS ENUM ('MEDICATION', 'SUPPLEMENT', 'HERB', 'VITAMIN', 'MINERAL', 'OTHER');
CREATE TYPE evidence_quality AS ENUM ('A', 'B', 'C', 'D', 'EXPERT_OPINION');

-- 1. Critical interaction rules table (NEW - for rule-based system)
CREATE TABLE critical_interaction_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item1_type VARCHAR(50) NOT NULL, -- 'medication', 'supplement', 'condition', 'food'
    item1_identifier VARCHAR(255) NOT NULL, -- generic name or category
    item2_type VARCHAR(50) NOT NULL,
    item2_identifier VARCHAR(255) NOT NULL,
    severity severity_level NOT NULL,
    mechanism TEXT NOT NULL,
    clinical_significance TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    contraindicated BOOLEAN DEFAULT FALSE,
    monitoring_required BOOLEAN DEFAULT FALSE,
    source source_type NOT NULL,
    source_url TEXT,
    evidence_quality evidence_quality,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE
);

-- 2. Interaction sources (evidence for each interaction)
CREATE TABLE interaction_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID REFERENCES critical_interaction_rules(id) ON DELETE CASCADE,
    source_type source_type NOT NULL,
    source_name TEXT NOT NULL,
    source_url TEXT,
    publication_date DATE,
    study_type VARCHAR(100), -- 'RCT', 'Meta-analysis', 'Case Report', etc.
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes TEXT
);

-- 3. Nutrient upper limits table
CREATE TABLE nutrient_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nutrient_name VARCHAR(100) NOT NULL,
    upper_limit DECIMAL(10,2),
    unit VARCHAR(20) NOT NULL,
    age_group VARCHAR(50),
    gender VARCHAR(20),
    pregnancy_limit DECIMAL(10,2),
    lactation_limit DECIMAL(10,2),
    health_risks TEXT,
    toxicity_symptoms TEXT[],
    source VARCHAR(50) NOT NULL, -- 'FDA', 'NIH', 'IOM'
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update existing ai_response_cache table to match new schema
-- (Keep existing table but add new fields for compatibility)
ALTER TABLE ai_response_cache ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE ai_response_cache ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE ai_response_cache ADD COLUMN IF NOT EXISTS token_count INTEGER;
ALTER TABLE ai_response_cache ADD COLUMN IF NOT EXISTS cost DECIMAL(10,6);
ALTER TABLE ai_response_cache ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2);
ALTER TABLE ai_response_cache ADD COLUMN IF NOT EXISTS hit_count INTEGER DEFAULT 0;
ALTER TABLE ai_response_cache ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Anonymous scan history updates (remove user linkage for HIPAA compliance)
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0;
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS severity_max severity_level;

-- 6. User submissions table (community data)
CREATE TABLE user_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(100) UNIQUE NOT NULL, -- Anonymous ID
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(50),
    brand VARCHAR(255),
    front_image_url TEXT,
    back_image_url TEXT,
    ingredients_image_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    rejection_reason TEXT,
    approved_product_id UUID REFERENCES products(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT
);

-- 7. AI model performance metrics
CREATE TABLE ai_model_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255),
    request_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    avg_response_time_ms INTEGER,
    avg_quality_score DECIMAL(3,2),
    error_rate DECIMAL(5,4),
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Interaction check logs (anonymous)
CREATE TABLE interaction_check_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    items_checked JSONB NOT NULL, -- Array of items checked
    interaction_count INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    moderate_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    tier_used VARCHAR(20), -- 'RULES', 'CACHE', 'AI'
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Feedback and reports (anonymous)
CREATE TABLE feedback_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL, -- 'INTERACTION', 'PRODUCT', 'GENERAL'
    related_product_id UUID REFERENCES products(id),
    related_interaction_id UUID REFERENCES critical_interaction_rules(id),
    description TEXT NOT NULL,
    severity VARCHAR(20),
    status VARCHAR(50) DEFAULT 'NEW', -- 'NEW', 'REVIEWING', 'RESOLVED'
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_critical_interactions_item1 ON critical_interaction_rules(item1_type, item1_identifier) WHERE active = TRUE;
CREATE INDEX idx_critical_interactions_item2 ON critical_interaction_rules(item2_type, item2_identifier) WHERE active = TRUE;
CREATE INDEX idx_critical_interactions_severity ON critical_interaction_rules(severity) WHERE active = TRUE;

CREATE INDEX idx_ai_cache_provider ON ai_response_cache(provider);
CREATE INDEX idx_ai_cache_quality ON ai_response_cache(quality_score DESC);
CREATE INDEX idx_ai_cache_last_accessed ON ai_response_cache(last_accessed DESC);

CREATE INDEX idx_scan_history_session ON scan_history(session_id, scanned_at DESC);
CREATE INDEX idx_submissions_status ON user_submissions(status);
CREATE INDEX idx_interaction_logs_session ON interaction_check_logs(session_id, checked_at DESC);
CREATE INDEX idx_interaction_logs_tier ON interaction_check_logs(tier_used);

-- Create functions for three-tier architecture support
CREATE OR REPLACE FUNCTION get_interaction_tier(
    p_item1_type VARCHAR,
    p_item1_identifier VARCHAR,
    p_item2_type VARCHAR,
    p_item2_identifier VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_rule_exists BOOLEAN;
    v_cache_exists BOOLEAN;
    v_cache_fresh BOOLEAN;
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

-- Create view for interaction statistics
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
    COUNT(CASE WHEN tier_used = 'AI' THEN 1 END) as ai_count
FROM interaction_check_logs
GROUP BY DATE_TRUNC('day', checked_at);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_model_metrics_updated_at BEFORE UPDATE ON ai_model_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE critical_interaction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Public read access to critical interactions and nutrient limits
CREATE POLICY "Public read access to critical interactions" ON critical_interaction_rules
    FOR SELECT USING (active = true);

CREATE POLICY "Public read access to nutrient limits" ON nutrient_limits
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT ON critical_interaction_rules TO anon;
GRANT SELECT ON nutrient_limits TO anon;
GRANT SELECT, INSERT ON scan_history TO anon;
GRANT SELECT, INSERT ON interaction_check_logs TO anon;
GRANT SELECT, INSERT ON user_submissions TO anon;
GRANT SELECT, INSERT ON feedback_reports TO anon;

-- Add comment for documentation
COMMENT ON TABLE critical_interaction_rules IS 'FDA/NIH validated critical drug interaction rules for rule-based engine (Tier 1)';
COMMENT ON TABLE interaction_sources IS 'Evidence sources and citations for each interaction rule';
COMMENT ON TABLE nutrient_limits IS 'FDA/NIH upper limits for nutrients and vitamins';
COMMENT ON FUNCTION get_interaction_tier IS 'Determines which tier (RULES/CACHE/AI) should handle an interaction query';
