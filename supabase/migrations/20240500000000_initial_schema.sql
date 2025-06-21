-- =====================================================
-- PharmaGuide Fresh Database Setup
-- Version: 2.0.0 (Clean Install)
-- =====================================================

-- STEP 1: COMPLETELY RESET DATABASE (OPTIONAL - ONLY IF YOU WANT TO START FRESH)
-- WARNING: This will DELETE ALL DATA! Only run if you're sure!
-- =====================================================

-- Drop all existing tables in reverse dependency order
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

-- Drop all functions
DROP FUNCTION IF EXISTS create_user_with_profile CASCADE;
DROP FUNCTION IF EXISTS increment_points CASCADE;
DROP FUNCTION IF EXISTS update_streak CASCADE;
DROP FUNCTION IF EXISTS is_soft_deleted CASCADE;
DROP FUNCTION IF EXISTS is_user_soft_deleted CASCADE;
DROP FUNCTION IF EXISTS log_audit CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS validate_notifications CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_cache CASCADE;
DROP FUNCTION IF EXISTS archive_soft_deleted CASCADE;
DROP FUNCTION IF EXISTS verify_database_setup CASCADE;

-- Drop views
DROP VIEW IF EXISTS user_engagement_metrics CASCADE;
DROP VIEW IF EXISTS product_analytics CASCADE;

-- =====================================================
-- STEP 2: CREATE CLEAN SCHEMA WITH FIXED INDEXES
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create update timestamp function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create soft delete check function
CREATE OR REPLACE FUNCTION is_soft_deleted(deleted_at timestamp with time zone)
RETURNS boolean AS $$
BEGIN
    RETURN deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create tables in dependency order
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id uuid NOT NULL UNIQUE,
  email varchar UNIQUE,
  is_anonymous boolean DEFAULT false,
  display_name varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode varchar UNIQUE,
  name varchar NOT NULL,
  brand varchar,
  category varchar,
  image_url text,
  ingredients jsonb,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name varchar,
  last_name varchar,
  age integer CHECK (age >= 0 AND age <= 150),
  gender varchar,
  health_goals jsonb DEFAULT '[]'::jsonb,
  conditions jsonb DEFAULT '[]'::jsonb,
  allergies jsonb DEFAULT '[]'::jsonb,
  medications jsonb DEFAULT '[]'::jsonb,
  genetics jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  ai_response_style varchar DEFAULT 'concise' CHECK (ai_response_style IN ('concise', 'detailed', 'technical')),
  budget_range varchar DEFAULT 'mid' CHECK (budget_range IN ('budget', 'mid', 'premium')),
  primary_focus varchar DEFAULT 'safety' CHECK (primary_focus IN ('safety', 'efficacy', 'value', 'naturalness')),
  notifications jsonb DEFAULT '{"push_enabled": true, "email_enabled": true, "reminder_frequency": "daily"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE user_points (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE user_streaks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE points_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_change integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE scan_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  scan_type varchar,
  analysis_score integer,
  scanned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE user_stack (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES products(id),
  name varchar,
  type varchar CHECK (type IN ('medication', 'supplement')),
  dosage varchar,
  frequency varchar,
  active boolean DEFAULT true,
  brand varchar,
  image_url text,
  ingredients jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

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

CREATE TABLE ai_response_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key varchar UNIQUE,
  response jsonb,
  model_used varchar,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

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

CREATE TABLE provider_patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id uuid NOT NULL REFERENCES users(id),
  patient_id uuid NOT NULL REFERENCES users(id),
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  shared_data jsonb DEFAULT '{"stack": false, "history": false, "profile": false}',
  invitation_code varchar(8) UNIQUE,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, patient_id)
);

-- =====================================================
-- STEP 3: CREATE INDEXES (FIXED - NO now() IN PREDICATES)
-- =====================================================

-- User indexes
CREATE INDEX idx_users_auth_id ON users(auth_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Product indexes
CREATE INDEX idx_products_barcode ON products(barcode) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name_search ON products USING gin(name gin_trgm_ops);

-- Scan history indexes
CREATE INDEX idx_scan_history_user_date ON scan_history(user_id, scanned_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_scan_history_product ON scan_history(product_id) WHERE deleted_at IS NULL;

-- User stack indexes
CREATE INDEX idx_user_stack_user_active ON user_stack(user_id) WHERE active = true AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_stack_unique_active ON user_stack(user_id, item_id) WHERE active = true AND deleted_at IS NULL;

-- Interaction indexes
CREATE INDEX idx_interactions_item1 ON interactions(item1_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interactions_item2 ON interactions(item2_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_interactions_unique_pair ON interactions(LEAST(item1_id, item2_id), GREATEST(item1_id, item2_id)) WHERE deleted_at IS NULL;

-- Points and streaks indexes
CREATE INDEX idx_user_points_level ON user_points(level DESC, total_points DESC);
CREATE INDEX idx_points_history_user ON points_history(user_id, created_at DESC);

-- AI cache index (without now() function)
CREATE INDEX idx_ai_cache_key ON ai_response_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_response_cache(expires_at);
CREATE INDEX idx_ai_cache_user ON ai_response_cache(user_id);

-- Audit log indexes
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at DESC);

-- =====================================================
-- STEP 4: CREATE TRIGGERS
-- =====================================================

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stack_updated_at BEFORE UPDATE ON user_stack
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_response_cache_updated_at BEFORE UPDATE ON ai_response_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 5: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_patients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- Users table policies
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Products table (public read, authenticated write)
CREATE POLICY "products_select_all" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_authenticated" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "products_update_authenticated" ON products
  FOR UPDATE TO authenticated USING (true);

-- User profiles policies
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- User preferences policies
CREATE POLICY "user_preferences_select_own" ON user_preferences
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "user_preferences_insert_own" ON user_preferences
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "user_preferences_update_own" ON user_preferences
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- User points policies (read own, system update only)
CREATE POLICY "user_points_select_own" ON user_points
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- User streaks policies (read own, system update only)
CREATE POLICY "user_streaks_select_own" ON user_streaks
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Points history policies
CREATE POLICY "points_history_select_own" ON points_history
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Scan history policies (allow anonymous)
CREATE POLICY "scan_history_select_own" ON scan_history
  FOR SELECT USING (
    user_id IS NULL OR 
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "scan_history_insert_own" ON scan_history
  FOR INSERT WITH CHECK (
    user_id IS NULL OR 
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "scan_history_update_own" ON scan_history
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- User stack policies
CREATE POLICY "user_stack_select_own" ON user_stack
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "user_stack_insert_own" ON user_stack
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "user_stack_update_own" ON user_stack
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "user_stack_delete_own" ON user_stack
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Interactions policies (public read)
CREATE POLICY "interactions_select_all" ON interactions
  FOR SELECT USING (true);

CREATE POLICY "interactions_insert_authenticated" ON interactions
  FOR INSERT TO authenticated WITH CHECK (true);

-- AI cache policies
CREATE POLICY "ai_cache_select_own" ON ai_response_cache
  FOR SELECT USING (
    user_id IS NULL OR 
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "ai_cache_insert_own" ON ai_response_cache
  FOR INSERT WITH CHECK (
    user_id IS NULL OR 
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Audit log policies (admin only)
CREATE POLICY "audit_log_admin_all" ON audit_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE u.auth_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- User roles policies
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "user_roles_admin_manage" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE u.auth_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Provider patients policies
CREATE POLICY "provider_patients_select_involved" ON provider_patients
  FOR SELECT USING (
    provider_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    patient_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "provider_patients_insert_provider" ON provider_patients
  FOR INSERT WITH CHECK (
    provider_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = provider_id AND ur.role = 'provider'
    )
  );

CREATE POLICY "provider_patients_update_involved" ON provider_patients
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    patient_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- STEP 7: CREATE FUNCTIONS
-- =====================================================

-- Create user with profile function
CREATE OR REPLACE FUNCTION create_user_with_profile(
  p_auth_id uuid,
  p_email text DEFAULT NULL,
  p_is_anonymous boolean DEFAULT false
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM users WHERE auth_id = p_auth_id;
  
  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO users (auth_id, email, is_anonymous)
    VALUES (p_auth_id, p_email, p_is_anonymous)
    RETURNING id INTO v_user_id;
    
    -- Create related records
    INSERT INTO user_profiles (user_id) VALUES (v_user_id);
    INSERT INTO user_preferences (user_id) VALUES (v_user_id);
    INSERT INTO user_points (user_id) VALUES (v_user_id);
    INSERT INTO user_streaks (user_id) VALUES (v_user_id);
    INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'patient');
  ELSE
    -- Update if converting from anonymous
    IF p_is_anonymous = false AND p_email IS NOT NULL THEN
      UPDATE users 
      SET email = p_email, is_anonymous = false
      WHERE id = v_user_id AND is_anonymous = true;
    END IF;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment points function
CREATE OR REPLACE FUNCTION increment_points(
  p_user_id uuid,
  p_points integer,
  p_reason text DEFAULT 'manual',
  p_metadata jsonb DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_old_level integer;
  v_new_level integer;
  v_new_total integer;
BEGIN
  -- Update points
  UPDATE user_points
  SET total_points = total_points + p_points
  WHERE user_id = p_user_id
  RETURNING total_points INTO v_new_total;
  
  -- Calculate new level
  v_new_level := FLOOR(v_new_total / 100) + 1;
  
  -- Update level
  UPDATE user_points
  SET level = v_new_level
  WHERE user_id = p_user_id AND level != v_new_level;
  
  -- Log history
  INSERT INTO points_history (user_id, points_change, reason, metadata)
  VALUES (p_user_id, p_points, p_reason, p_metadata);
  
  RETURN jsonb_build_object(
    'success', true,
    'new_total', v_new_total,
    'new_level', v_new_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update streak function
CREATE OR REPLACE FUNCTION update_streak(p_user_id uuid) RETURNS jsonb AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: CREATE STORAGE BUCKETS
-- =====================================================

-- Run this in Supabase Dashboard SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('user-uploads', 'user-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- STEP 9: GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- STEP 10: VERIFICATION
-- =====================================================

-- Simple verification
DO $$
BEGIN
  RAISE NOTICE 'Database setup complete!';
  RAISE NOTICE 'Tables created: %', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public');
  RAISE NOTICE 'Policies created: %', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public');
  RAISE NOTICE 'Indexes created: %', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
END $$;