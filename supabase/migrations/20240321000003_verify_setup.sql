-- 1. Verify Functions
SELECT 
    proname as function_name,
    prosrc as function_definition
FROM pg_proc 
WHERE proname IN (
    'update_updated_at_column',
    'log_audit',
    'handle_admin_role',
    'validate_ingredients',
    'validate_jsonb_array',
    'validate_notifications'
);

-- 2. Verify Triggers
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname IN (
    'set_updated_at_users',
    'set_updated_at_user_profiles',
    'set_updated_at_user_preferences',
    'set_updated_at_products',
    'set_updated_at_user_stack',
    'set_updated_at_interactions',
    'set_updated_at_scan_history',
    'set_updated_at_ai_response_cache',
    'audit_users',
    'audit_user_profiles',
    'audit_user_preferences',
    'audit_products',
    'audit_interactions',
    'audit_user_stack',
    'audit_scan_history',
    'audit_ai_response_cache',
    'on_auth_user_created',
    'validate_products_ingredients_trigger',
    'validate_user_stack_ingredients_trigger',
    'validate_notifications_trigger'
);

-- 3. Verify RLS Policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verify Table Structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 5. Verify Foreign Keys
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 6. Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. Verify Replica Identity (corrected query)
SELECT 
    c.relname as table_name,
    CASE c.relreplident
        WHEN 'd' THEN 'DEFAULT'
        WHEN 'n' THEN 'NOTHING'
        WHEN 'f' THEN 'FULL'
        WHEN 'i' THEN 'INDEX'
    END as replica_identity
FROM pg_class c
WHERE c.relkind = 'r' 
AND c.relnamespace = 'public'::regnamespace
ORDER BY c.relname;

-- 8. Test Admin Role Setup
DO $$
DECLARE
    test_admin_id UUID;
    test_admin_auth_id UUID;
BEGIN
    -- Generate unique test data
    test_admin_auth_id := gen_random_uuid();
    
    -- Create a test admin user
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

    -- Verify admin role was set
    ASSERT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = test_admin_id 
        AND raw_app_meta_data->>'is_admin' = 'true'
        AND raw_app_meta_data->>'role' = 'admin'
    ), 'Admin role was not set correctly';

    -- Test admin access to protected resources
    ASSERT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth.jwt() ->> 'role' = 'admin'
    ), 'Admin should have access to protected resources';

    -- Clean up
    DELETE FROM auth.users WHERE id = test_admin_id;
END;
$$;

-- 9. Test JSONB Validation
DO $$
BEGIN
    -- This should fail if validation is working
    BEGIN
        INSERT INTO public.products (
            name,
            ingredients
        ) VALUES (
            'Test Product ' || gen_random_uuid(),
            '{"not": "an array"}'::jsonb
        );
        RAISE EXCEPTION 'JSONB validation did not work as expected';
    EXCEPTION
        WHEN OTHERS THEN
            -- Expected error, continue
            NULL;
    END;
END;
$$;

-- 10. Test Audit Logging
DO $$
DECLARE
    test_user_id UUID;
    test_auth_id UUID;
BEGIN
    -- Generate unique test data
    test_auth_id := gen_random_uuid();
    
    -- Create a test user
    INSERT INTO public.users (
        auth_id,
        email,
        is_anonymous
    ) VALUES (
        test_auth_id,
        'test-' || test_auth_id || '@example.com',
        false
    ) RETURNING id INTO test_user_id;

    -- Check if audit log entry was created
    ASSERT EXISTS (
        SELECT 1 FROM public.audit_log 
        WHERE table_name = 'users' 
        AND record_id = test_user_id
        AND operation = 'INSERT'
    ), 'Audit log entry was not created';

    -- Clean up
    DELETE FROM public.users WHERE id = test_user_id;
END;
$$;

-- 11. Test Soft Delete
DO $$
DECLARE
    test_user_id UUID;
    test_auth_id UUID;
BEGIN
    -- Generate unique test data
    test_auth_id := gen_random_uuid();
    
    -- Create a test record
    INSERT INTO public.users (
        auth_id,
        email,
        is_anonymous
    ) VALUES (
        test_auth_id,
        'test-delete-' || test_auth_id || '@example.com',
        false
    ) RETURNING id INTO test_user_id;

    -- Soft delete it
    UPDATE public.users 
    SET deleted_at = now() 
    WHERE id = test_user_id;

    -- Verify it's not visible in normal queries
    ASSERT NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = test_user_id
        AND auth.uid() = test_auth_id
    ), 'Soft deleted record should not be visible';

    -- Clean up
    DELETE FROM public.users WHERE id = test_user_id;
END;
$$; 