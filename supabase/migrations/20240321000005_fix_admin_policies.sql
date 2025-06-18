-- First, let's check and drop existing policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users SELECT" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users INSERT" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users UPDATE" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users DELETE" ON public.users;

-- Create comprehensive policies for users table
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (
        auth.uid() = auth_id 
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "Users can insert their own data" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid() = auth_id
    );

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (
        auth.uid() = auth_id 
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "Users can delete their own data" ON public.users
    FOR DELETE USING (
        auth.uid() = auth_id 
        AND (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'admin')
    );

-- Admin policies with proper role check
CREATE POLICY "Admins can manage users" ON public.users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    ) WITH CHECK (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Test the policies
DO $$
DECLARE
    test_admin_id UUID;
    test_admin_auth_id UUID;
    test_user_id UUID;
    test_user_auth_id UUID;
BEGIN
    -- Generate test IDs
    test_admin_auth_id := gen_random_uuid();
    test_user_auth_id := gen_random_uuid();
    
    -- Create test admin user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        test_admin_auth_id,
        'authenticated',
        'authenticated',
        'test-admin-' || test_admin_auth_id || '@example.com',
        crypt('test-password', gen_salt('bf')),
        now(),
        now(),
        now(),
        jsonb_build_object(
            'is_admin', true,
            'role', 'admin'
        ),
        '{}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO test_admin_id;

    -- Create test regular user
    INSERT INTO public.users (
        auth_id,
        email,
        is_anonymous
    ) VALUES (
        test_user_auth_id,
        'test-user-' || test_user_auth_id || '@example.com',
        false
    ) RETURNING id INTO test_user_id;

    -- Test admin access
    ASSERT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth.jwt() ->> 'role' = 'admin'
    ), 'Admin should have access to all users';

    -- Test user access
    ASSERT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth.uid() = test_user_auth_id
    ), 'User should have access to their own data';

    -- Test user cannot access other users
    ASSERT NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth.uid() = test_user_auth_id
        AND id != test_user_id
    ), 'User should not have access to other users data';

    -- Clean up
    DELETE FROM public.users WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_admin_id;
END;
$$; 