-- Fix the profiles table schema and authentication system
-- First, add the role column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role app_role DEFAULT 'viewer'::app_role;

-- Drop existing problematic objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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

-- Create the Super Admin user
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

-- Create the profile
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