-- Fix the database schema completely
-- First, drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the enum to ensure it exists
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'viewer');

-- Ensure profiles table has the correct structure
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE app_role USING role::app_role,
ALTER COLUMN role SET DEFAULT 'viewer'::app_role;

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
    'viewer'::public.app_role
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now create the Super Admin user directly
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
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = now();

-- Create the profile manually to avoid trigger issues
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
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::app_role,
  full_name = 'Super Admin',
  is_active = true;