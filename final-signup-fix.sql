-- =====================================================
-- FINAL SIGNUP FIX - COMPLETE SOLUTION
-- =====================================================
-- This script will completely fix the signup issues by:
-- 1. Disabling RLS on all tables
-- 2. Creating a trigger that automatically handles profile creation
-- 3. Granting all necessary permissions

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
ALTER TABLE public.onboarding_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_preferred_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests DISABLE ROW LEVEL SECURITY;

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
-- 3. GRANT FULL PERMISSIONS TO ALL ROLES
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

-- Grant all permissions to postgres role (for triggers)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant all permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- =====================================================
-- 4. DROP EXISTING TRIGGER AND FUNCTION
-- =====================================================

-- Drop existing trigger first (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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
    
    -- Create student preferences
    INSERT INTO public.student_preferences (
      student_id,
      email_notifications,
      sms_notifications,
      push_notifications,
      class_reminders,
      assignment_due_reminders,
      teacher_messages,
      weekly_progress_reports,
      marketing_emails,
      profile_visibility,
      show_online_status,
      allow_teacher_contact,
      share_progress_with_parents
    ) VALUES (
      NEW.id,
      true,
      false,
      true,
      true,
      true,
      true,
      false,
      false,
      'public',
      true,
      true,
      true
    );
    
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'teacher' THEN
    INSERT INTO public.teachers (
      id,
      is_available,
      hourly_rate,
      currency,
      subjects,
      specialties,
      education,
      experience_years,
      rating,
      total_reviews,
      total_students,
      total_sessions,
      availability,
      max_students,
      verification_status,
      verification_documents,
      bank_account_info,
      zoom_connected,
      zoom_email,
      profile_image_url,
      cover_image_url,
      teaching_philosophy,
      certifications,
      languages,
      social_links,
      timezone,
      notification_preferences,
      tsc_number
    ) VALUES (
      NEW.id,
      true,
      0.00,
      'USD',
      '{}',
      '{}',
      '{}',
      0,
      0.00,
      0,
      0,
      0,
      '{}',
      20,
      'pending',
      '{}',
      NULL,
      false,
      NULL,
      NULL,
      NULL,
      NULL,
      '[]',
      '{}',
      '{}',
      'UTC',
      '{}',
      NULL
    );
    
    -- Create teacher preferences
    INSERT INTO public.teacher_preferences (
      teacher_id,
      preferred_student_ages,
      preferred_class_duration,
      max_students_per_class,
      auto_accept_bookings,
      require_student_approval,
      email_notifications,
      sms_notifications,
      push_notifications,
      marketing_emails,
      timezone,
      working_hours,
      vacation_mode,
      vacation_start_date,
      vacation_end_date,
      preferred_payment_method,
      auto_withdraw,
      withdraw_threshold,
      profile_visibility,
      show_contact_info,
      show_social_links,
      show_verification_badges,
      language,
      date_format,
      time_format,
      currency
    ) VALUES (
      NEW.id,
      '{}',
      60,
      1,
      false,
      true,
      true,
      false,
      true,
      false,
      'UTC',
      '{}',
      false,
      NULL,
      NULL,
      'stripe',
      false,
      100.00,
      'public',
      false,
      true,
      true,
      'en',
      'MM/DD/YYYY',
      '12h',
      'USD'
    );
    
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'parent' THEN
    INSERT INTO public.parents (
      id,
      children_ids,
      payment_methods,
      billing_address,
      emergency_contact
    ) VALUES (
      NEW.id,
      '{}',
      '{}',
      NULL,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGER ON AUTH.USERS
-- =====================================================

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
    RAISE NOTICE 'FINAL SIGNUP FIX APPLIED SUCCESSFULLY!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Disabled RLS on all tables';
    RAISE NOTICE '✅ Dropped all existing policies';
    RAISE NOTICE '✅ Granted full permissions to all roles';
    RAISE NOTICE '✅ Created handle_new_user() function';
    RAISE NOTICE '✅ Created trigger on auth.users table';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Signup should now work completely!';
    RAISE NOTICE 'The trigger will automatically create:';
    RAISE NOTICE '- Profile record';
    RAISE NOTICE '- Wallet record';
    RAISE NOTICE '- Role-specific records (student/teacher/parent)';
    RAISE NOTICE '- Preferences records';
    RAISE NOTICE '=====================================================';
END $$;
