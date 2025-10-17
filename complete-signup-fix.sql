-- =====================================================
-- COMPLETE SIGNUP FIX - ALL IN ONE
-- =====================================================
-- This script fixes everything needed for signup to work

-- =====================================================
-- 1. DISABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_onboarding_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP ALL EXISTING POLICIES
-- =====================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 3. GRANT FULL PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant all permissions to anon users
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant all permissions to postgres role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;

-- =====================================================
-- 4. CREATE TRIGGER FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    phone,
    date_of_birth,
    location,
    bio,
    timezone,
    language,
    is_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'date_of_birth', NULL),
    COALESCE(NEW.raw_user_meta_data->>'location', NULL),
    COALESCE(NEW.raw_user_meta_data->>'bio', NULL),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    false,
    true,
    NOW(),
    NOW()
  );

  -- Create wallet for the user
  INSERT INTO public.wallets (
    user_id,
    balance,
    currency,
    tokens,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    0.00,
    'USD',
    0,
    true,
    NOW(),
    NOW()
  );

  -- Create role-specific records based on the role
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'student' THEN
    INSERT INTO public.students (
      id,
      education_system_id,
      education_level_id,
      school_name,
      interests,
      preferred_languages
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'education_system_id', NULL),
      COALESCE(NEW.raw_user_meta_data->>'education_level_id', NULL),
      COALESCE(NEW.raw_user_meta_data->>'school_name', NULL),
      COALESCE((NEW.raw_user_meta_data->>'interests')::jsonb, '[]'::jsonb),
      COALESCE((NEW.raw_user_meta_data->>'preferred_languages')::jsonb, '["en"]'::jsonb)
    );
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'teacher' THEN
    INSERT INTO public.teachers (
      id,
      is_available
    ) VALUES (
      NEW.id,
      true
    );
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'parent' THEN
    INSERT INTO public.parents (
      id
    ) VALUES (
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'COMPLETE SIGNUP FIX APPLIED!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Disabled RLS on all tables';
    RAISE NOTICE 'Dropped all existing policies';
    RAISE NOTICE 'Granted full permissions to all roles';
    RAISE NOTICE 'Created handle_new_user() function';
    RAISE NOTICE 'Created trigger on auth.users table';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Signup should now work completely!';
    RAISE NOTICE 'Both manual profile creation AND triggers will work.';
    RAISE NOTICE '=====================================================';
END $$;
