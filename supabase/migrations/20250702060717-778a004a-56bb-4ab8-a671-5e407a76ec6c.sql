
-- First, let's ensure the app_role enum exists and is properly configured
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'viewer');

-- Update the profiles table to ensure it's properly configured
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'viewer'::app_role;

-- Update the handle_new_user function to work correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'viewer'::app_role
  );
  RETURN NEW;
END;
$$;

-- Create a Super Admin account by inserting directly into auth.users and profiles
-- First, create the auth user (this simulates what Supabase would do)
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
) ON CONFLICT (email) DO NOTHING;

-- Now create the corresponding profile with admin role
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  u.email,
  'Super Admin',
  'admin'::app_role,
  true,
  now(),
  now()
FROM auth.users u 
WHERE u.email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::app_role,
  full_name = 'Super Admin',
  is_active = true;
