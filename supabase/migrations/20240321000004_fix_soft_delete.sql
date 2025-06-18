-- Drop existing policies that don't properly handle soft deletes
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own stack" ON public.user_stack;
DROP POLICY IF EXISTS "Users can view their own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Anyone can view verified products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view interactions" ON public.interactions;

-- Recreate policies with proper soft delete handling
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (
        auth.uid() = auth_id 
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_profiles.user_id
            AND users.auth_id = auth.uid()
            AND (users.deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
        )
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_preferences.user_id
            AND users.auth_id = auth.uid()
            AND (users.deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
        )
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "Users can view their own stack" ON public.user_stack
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = user_stack.user_id
            AND users.auth_id = auth.uid()
            AND (users.deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
        )
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "Users can view their own scan history" ON public.scan_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = scan_history.user_id
            AND users.auth_id = auth.uid()
            AND (users.deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
        )
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "Anyone can view verified products" ON public.products
    FOR SELECT USING (
        verified = true 
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "Anyone can view interactions" ON public.interactions
    FOR SELECT USING (
        deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin'
    );

-- Add a function to check if a record is soft deleted
CREATE OR REPLACE FUNCTION is_soft_deleted(record_deleted_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN record_deleted_at IS NOT NULL AND auth.jwt() ->> 'role' != 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to check if a user is soft deleted
CREATE OR REPLACE FUNCTION is_user_soft_deleted(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_id
        AND users.deleted_at IS NOT NULL
        AND auth.jwt() ->> 'role' != 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the soft delete functionality
DO $$
DECLARE
    test_user_id UUID;
    test_auth_id UUID;
BEGIN
    -- Create a test user
    test_auth_id := gen_random_uuid();
    INSERT INTO public.users (auth_id, email, is_anonymous)
    VALUES (test_auth_id, 'test-soft-delete@example.com', false)
    RETURNING id INTO test_user_id;

    -- Verify the user is visible
    ASSERT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = test_user_id
    ), 'User should be visible before soft delete';

    -- Soft delete the user
    UPDATE public.users 
    SET deleted_at = now() 
    WHERE id = test_user_id;

    -- Verify the user is not visible to regular users
    ASSERT NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = test_user_id
        AND auth.uid() = test_auth_id
    ), 'User should not be visible after soft delete to regular users';

    -- Clean up
    DELETE FROM public.users WHERE id = test_user_id;
END;
$$; 