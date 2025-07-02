-- Check if the Super Admin user was created successfully and fix if needed
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- First, check if the user exists in auth.users
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com';
    
    IF admin_user_id IS NULL THEN
        -- Create the admin user if it doesn't exist
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            gen_random_uuid(),
            'admin@example.com',
            crypt('Admin@123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"full_name": "Super Admin"}',
            false,
            'authenticated'
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE 'Created new admin user with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- Now ensure the profile exists and is correct
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin@example.com',
        'Super Admin',
        'admin'::app_role,
        true,
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'admin'::app_role,
        full_name = 'Super Admin',
        is_active = true,
        email = 'admin@example.com';
    
    RAISE NOTICE 'Profile created/updated for admin user';
END $$;