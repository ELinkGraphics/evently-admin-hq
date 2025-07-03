-- Disable the problematic trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Delete any existing admin user
DELETE FROM auth.users WHERE email = 'admin@example.com';
DELETE FROM public.profiles WHERE email = 'admin@example.com';

-- Insert the Super Admin user (trigger is disabled)
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
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@example.com',
  crypt('Admin@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Super Admin"}',
  false,
  'authenticated'
);

-- Insert the profile manually
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@example.com',
  'Super Admin',
  'admin'::app_role,
  true,
  now(),
  now()
);

-- Re-enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;