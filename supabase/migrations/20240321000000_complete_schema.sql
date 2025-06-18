-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit logging function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
        CASE 
            WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW)
            ELSE NULL
        END,
        auth.uid()
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create JSONB validation functions
CREATE OR REPLACE FUNCTION validate_notifications()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.notifications->>'push_enabled' IS NULL OR
       jsonb_typeof(NEW.notifications->'push_enabled') != 'boolean' THEN
        RAISE EXCEPTION 'notifications.push_enabled must be a boolean';
    END IF;
    IF NEW.notifications->>'email_enabled' IS NULL OR
       jsonb_typeof(NEW.notifications->'email_enabled') != 'boolean' THEN
        RAISE EXCEPTION 'notifications.email_enabled must be a boolean';
    END IF;
    IF NEW.notifications->>'reminder_frequency' IS NULL OR
       NEW.notifications->>'reminder_frequency' NOT IN ('daily', 'weekly', 'monthly') THEN
        RAISE EXCEPTION 'notifications.reminder_frequency must be one of: daily, weekly, monthly';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (updated version)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE NOT NULL,
    email VARCHAR UNIQUE,
    is_anonymous BOOLEAN DEFAULT false,
    display_name VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT email_required_for_non_anonymous CHECK (is_anonymous = true OR email IS NOT NULL)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name VARCHAR,
    last_name VARCHAR,
    age INTEGER,
    gender VARCHAR, -- Removed restrictive check for inclusivity
    health_goals JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    -- Removed medications field to avoid duplication with user_stack
    allergies JSONB DEFAULT '[]'::jsonb,
    genetics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ai_response_style VARCHAR DEFAULT 'concise' CHECK (ai_response_style IN ('concise', 'detailed', 'technical')),
    budget_range VARCHAR DEFAULT 'mid' CHECK (budget_range IN ('budget', 'mid', 'premium')),
    primary_focus VARCHAR DEFAULT 'safety' CHECK (primary_focus IN ('safety', 'efficacy', 'value', 'naturalness')),
    notifications JSONB DEFAULT '{"push_enabled": true, "email_enabled": true, "reminder_frequency": "daily"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode VARCHAR UNIQUE,
    name VARCHAR NOT NULL,
    brand VARCHAR,
    category VARCHAR,
    image_url TEXT,
    ingredients JSONB,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item1_id UUID NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
    item2_id UUID NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
    severity VARCHAR CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    mechanism TEXT,
    evidence TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create user_stack table
CREATE TABLE IF NOT EXISTS public.user_stack (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name VARCHAR,
    type VARCHAR CHECK (type IN ('medication', 'supplement')),
    dosage VARCHAR,
    frequency VARCHAR,
    active BOOLEAN DEFAULT true,
    brand VARCHAR,
    image_url TEXT,
    ingredients JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create scan_history table
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    scan_type VARCHAR,
    analysis_score INTEGER,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create AI response cache table
CREATE TABLE IF NOT EXISTS public.ai_response_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR UNIQUE,
    response JSONB,
    model_used VARCHAR,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view their own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own data"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update their own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can delete their own data"
    ON public.users
    FOR DELETE
    USING (auth.uid() = auth_id);

-- User profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own profile"
    ON public.user_profiles
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    ));

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_preferences.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_preferences.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_preferences.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own preferences"
    ON public.user_preferences
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_preferences.user_id
        AND users.auth_id = auth.uid()
    ));

-- User stack policies
CREATE POLICY "Users can view their own stack"
    ON public.user_stack
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_stack.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can insert into their own stack"
    ON public.user_stack
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_stack.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can update their own stack"
    ON public.user_stack
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_stack.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can delete from their own stack"
    ON public.user_stack
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_stack.user_id
        AND users.auth_id = auth.uid()
    ));

-- Scan history policies
CREATE POLICY "Users can view their own scan history"
    ON public.scan_history
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = scan_history.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own scan history"
    ON public.scan_history
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = scan_history.user_id
        AND users.auth_id = auth.uid()
    ));

-- Products policies
CREATE POLICY "Anyone can view verified products"
    ON public.products
    FOR SELECT
    USING (verified = true);

CREATE POLICY "Only admins can manage products"
    ON public.products
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Interactions policies
CREATE POLICY "Anyone can view interactions"
    ON public.interactions
    FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage interactions"
    ON public.interactions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- AI response cache policies
CREATE POLICY "Users can view their own cache entries"
    ON public.ai_response_cache
    FOR SELECT
    USING (user_id IS NULL OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = ai_response_cache.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own cache entries"
    ON public.ai_response_cache
    FOR INSERT
    WITH CHECK (user_id IS NULL OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = ai_response_cache.user_id
        AND users.auth_id = auth.uid()
    ));

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_profiles
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_preferences
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_stack
    BEFORE UPDATE ON public.user_stack
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_interactions
    BEFORE UPDATE ON public.interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_scan_history
    BEFORE UPDATE ON public.scan_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_ai_response_cache
    BEFORE UPDATE ON public.ai_response_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for audit logging
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_user_preferences
    AFTER INSERT OR UPDATE OR DELETE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_user_stack
    AFTER INSERT OR UPDATE OR DELETE ON public.user_stack
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_scan_history
    AFTER INSERT OR UPDATE OR DELETE ON public.scan_history
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

-- Create trigger for notifications validation
CREATE TRIGGER validate_notifications_trigger
    BEFORE INSERT OR UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION validate_notifications();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stack_user_id ON public.user_stack(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stack_item_id ON public.user_stack(item_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_product_id ON public.scan_history(product_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_verified ON public.products(verified);
CREATE INDEX IF NOT EXISTS idx_interactions_items ON public.interactions(item1_id, item2_id);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_key ON public.ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON public.ai_response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_user_id ON public.ai_response_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON public.audit_log(changed_at);

-- Enable replication for realtime
ALTER TABLE public.scan_history REPLICA IDENTITY FULL;
ALTER TABLE public.user_stack REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- Check JWT claims
SELECT auth.jwt() ->> 'role' as role; 