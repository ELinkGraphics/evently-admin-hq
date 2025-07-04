
-- First, ensure we have a clean state by dropping problematic objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the app_role enum (this might already exist, but we need to ensure it's there)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'viewer');
    END IF;
END $$;

-- Ensure the profiles table has the correct structure
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE app_role USING COALESCE(role::text::app_role, 'viewer'::app_role),
ALTER COLUMN role SET DEFAULT 'viewer'::app_role,
ALTER COLUMN role SET NOT NULL;

-- Create the corrected trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean up any existing admin user data
DELETE FROM public.profiles WHERE email = 'admin@example.com';
DELETE FROM auth.users WHERE email = 'admin@example.com';

-- Create the Super Admin user with a specific UUID for consistency
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

-- Create the corresponding profile
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
