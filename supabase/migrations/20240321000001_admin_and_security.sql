-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to validate JSONB arrays
CREATE OR REPLACE FUNCTION validate_jsonb_array(jsonb_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN jsonb_typeof(jsonb_data) = 'array';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to validate ingredients
CREATE OR REPLACE FUNCTION validate_ingredients()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ingredients IS NOT NULL AND NOT validate_jsonb_array(NEW.ingredients) THEN
        RAISE EXCEPTION 'ingredients must be a JSONB array';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle admin role claims
CREATE OR REPLACE FUNCTION handle_admin_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Set admin role in raw_app_meta_data if is_admin is true
    IF NEW.raw_app_meta_data->>'is_admin' = 'true' THEN
        NEW.raw_app_meta_data = NEW.raw_app_meta_data || 
            jsonb_build_object('role', 'admin');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin role
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_admin_role();

-- Update RLS policies for users table
CREATE OR REPLACE POLICY "Admins can manage users"
    ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE OR REPLACE POLICY "Users can view their own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = auth_id AND deleted_at IS NULL);

CREATE OR REPLACE POLICY "Users can insert their own data"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

CREATE OR REPLACE POLICY "Users can update their own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = auth_id AND deleted_at IS NULL);

CREATE OR REPLACE POLICY "Users can delete their own data"
    ON public.users
    FOR DELETE
    USING (auth.uid() = auth_id AND deleted_at IS NULL);

-- Update RLS policies for user_profiles table
CREATE OR REPLACE POLICY "Admins can manage user_profiles"
    ON public.user_profiles
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE OR REPLACE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_profiles.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can insert their own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE OR REPLACE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_profiles.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can delete their own profile"
    ON public.user_profiles
    FOR DELETE
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_profiles.user_id
            AND users.auth_id = auth.uid()
        )
    );

-- Update RLS policies for user_preferences table
CREATE OR REPLACE POLICY "Admins can manage user_preferences"
    ON public.user_preferences
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE OR REPLACE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_preferences.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_preferences.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE OR REPLACE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_preferences.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can delete their own preferences"
    ON public.user_preferences
    FOR DELETE
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_preferences.user_id
            AND users.auth_id = auth.uid()
        )
    );

-- Update RLS policies for products table
CREATE OR REPLACE POLICY "Anyone can view verified products"
    ON public.products
    FOR SELECT
    USING (verified = true AND deleted_at IS NULL);

CREATE OR REPLACE POLICY "Only admins can manage products"
    ON public.products
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Update RLS policies for interactions table
CREATE OR REPLACE POLICY "Anyone can view interactions"
    ON public.interactions
    FOR SELECT
    USING (deleted_at IS NULL);

CREATE OR REPLACE POLICY "Only admins can manage interactions"
    ON public.interactions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Update RLS policies for user_stack table
CREATE OR REPLACE POLICY "Admins can manage user_stack"
    ON public.user_stack
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE OR REPLACE POLICY "Users can view their own stack"
    ON public.user_stack
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_stack.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can insert into their own stack"
    ON public.user_stack
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_stack.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE OR REPLACE POLICY "Users can update their own stack"
    ON public.user_stack
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_stack.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can delete from their own stack"
    ON public.user_stack
    FOR DELETE
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_stack.user_id
            AND users.auth_id = auth.uid()
        )
    );

-- Update RLS policies for scan_history table
CREATE OR REPLACE POLICY "Admins can manage scan_history"
    ON public.scan_history
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE OR REPLACE POLICY "Users can view their own scan history"
    ON public.scan_history
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = scan_history.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can insert their own scan history"
    ON public.scan_history
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = scan_history.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE OR REPLACE POLICY "Users can delete their own scan history"
    ON public.scan_history
    FOR DELETE
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = scan_history.user_id
            AND users.auth_id = auth.uid()
        )
    );

-- Update RLS policies for ai_response_cache table
CREATE OR REPLACE POLICY "Admins can manage cache"
    ON public.ai_response_cache
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE OR REPLACE POLICY "Users can view their own cache entries"
    ON public.ai_response_cache
    FOR SELECT
    USING (
        user_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = ai_response_cache.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can insert their own cache entries"
    ON public.ai_response_cache
    FOR INSERT
    WITH CHECK (user_id IS NULL OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = ai_response_cache.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE OR REPLACE POLICY "Users can update their own cache entries"
    ON public.ai_response_cache
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = ai_response_cache.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Users can delete their own cache entries"
    ON public.ai_response_cache
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = ai_response_cache.user_id
            AND users.auth_id = auth.uid()
        )
    );

-- Create RLS policy for audit_log table
CREATE POLICY "Admins can view audit logs"
    ON public.audit_log
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create triggers for JSONB validation
CREATE TRIGGER validate_products_ingredients_trigger
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    WHEN (NEW.ingredients IS NOT NULL)
    EXECUTE FUNCTION validate_ingredients();

CREATE TRIGGER validate_user_stack_ingredients_trigger
    BEFORE INSERT OR UPDATE ON public.user_stack
    FOR EACH ROW
    WHEN (NEW.ingredients IS NOT NULL)
    EXECUTE FUNCTION validate_ingredients();

-- Enable replication for realtime
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_preferences REPLICA IDENTITY FULL;

-- Remove redundant created_at from scan_history
ALTER TABLE public.scan_history DROP COLUMN created_at; 