-- Add missing constraint to users table
ALTER TABLE public.users
ADD CONSTRAINT email_required_for_non_anonymous 
CHECK (is_anonymous = true OR email IS NOT NULL);

-- Update foreign key behaviors
ALTER TABLE public.user_stack
DROP CONSTRAINT user_stack_user_id_fkey,
ADD CONSTRAINT user_stack_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.user_stack
DROP CONSTRAINT user_stack_item_id_fkey,
ADD CONSTRAINT user_stack_item_id_fkey 
FOREIGN KEY (item_id) 
REFERENCES public.products(id) 
ON DELETE SET NULL;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit logging function if not exists
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

-- Create admin role handler if not exists
CREATE OR REPLACE FUNCTION handle_admin_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.raw_app_meta_data->>'is_admin' = 'true' THEN
        NEW.raw_app_meta_data = NEW.raw_app_meta_data || 
            jsonb_build_object('role', 'admin');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create ingredients validation function if not exists
CREATE OR REPLACE FUNCTION validate_ingredients()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ingredients IS NOT NULL AND jsonb_typeof(NEW.ingredients) != 'array' THEN
        RAISE EXCEPTION 'ingredients must be a JSONB array';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER audit_products
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_interactions
    AFTER INSERT OR UPDATE OR DELETE ON public.interactions
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

CREATE TRIGGER audit_ai_response_cache
    AFTER INSERT OR UPDATE OR DELETE ON public.ai_response_cache
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

-- Create trigger for admin role
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_admin_role();

-- Create triggers for ingredients validation
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

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Admins can manage users"
    ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = auth_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own data"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update their own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = auth_id AND deleted_at IS NULL);

CREATE POLICY "Users can delete their own data"
    ON public.users
    FOR DELETE
    USING (auth.uid() = auth_id AND deleted_at IS NULL);

-- Create RLS policies for user_profiles
CREATE POLICY "Admins can manage user_profiles"
    ON public.user_profiles
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own profile"
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
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_profiles.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own profile"
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

-- Create RLS policies for user_preferences
CREATE POLICY "Admins can manage user_preferences"
    ON public.user_preferences
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own preferences"
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
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_preferences.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own preferences"
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

-- Create RLS policies for products
CREATE POLICY "Anyone can view verified products"
    ON public.products
    FOR SELECT
    USING (verified = true AND deleted_at IS NULL);

CREATE POLICY "Only admins can manage products"
    ON public.products
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for interactions
CREATE POLICY "Anyone can view interactions"
    ON public.interactions
    FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY "Only admins can manage interactions"
    ON public.interactions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for user_stack
CREATE POLICY "Admins can manage user_stack"
    ON public.user_stack
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own stack"
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
    USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_stack.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete from their own stack"
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

-- Create RLS policies for scan_history
CREATE POLICY "Admins can manage scan_history"
    ON public.scan_history
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own scan history"
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

CREATE POLICY "Users can insert their own scan history"
    ON public.scan_history
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = scan_history.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own scan history"
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

-- Create RLS policies for ai_response_cache
CREATE POLICY "Admins can manage cache"
    ON public.ai_response_cache
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own cache entries"
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

CREATE POLICY "Users can insert their own cache entries"
    ON public.ai_response_cache
    FOR INSERT
    WITH CHECK (user_id IS NULL OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = ai_response_cache.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can update their own cache entries"
    ON public.ai_response_cache
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = ai_response_cache.user_id
            AND users.auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own cache entries"
    ON public.ai_response_cache
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = ai_response_cache.user_id
            AND users.auth_id = auth.uid()
        )
    );

-- Create RLS policy for audit_log
CREATE POLICY "Admins can view audit logs"
    ON public.audit_log
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Enable replication for realtime
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_preferences REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL; 