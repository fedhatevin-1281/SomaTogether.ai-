-- =====================================================
-- CREATE SIGNUP TRIGGER - AUTOMATIC PROFILE CREATION
-- =====================================================
-- This script creates a trigger that automatically creates profiles
-- when users sign up, bypassing RLS issues

-- =====================================================
-- 1. CREATE FUNCTION TO HANDLE NEW USER SIGNUP
-- =====================================================

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
-- 2. CREATE TRIGGER ON AUTH.USERS
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions to the function
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- =====================================================
-- 4. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'SIGNUP TRIGGER CREATED SUCCESSFULLY!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Created handle_new_user() function';
    RAISE NOTICE '✅ Created trigger on auth.users table';
    RAISE NOTICE '✅ Granted necessary permissions';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Now when users sign up, profiles will be created automatically!';
    RAISE NOTICE 'This bypasses RLS issues during signup.';
    RAISE NOTICE '=====================================================';
END $$;
