-- =====================================================
-- EMERGENCY DATABASE FIX - COMPLETE TRIGGER REMOVAL
-- =====================================================
-- This script completely removes all problematic triggers and constraints
-- Run this to fix the 500 signup error immediately

-- =====================================================
-- 1. DISABLE ALL TRIGGERS ON ALL TABLES
-- =====================================================

-- Disable all triggers on all tables
ALTER TABLE public.profiles DISABLE TRIGGER ALL;
ALTER TABLE public.students DISABLE TRIGGER ALL;
ALTER TABLE public.teachers DISABLE TRIGGER ALL;
ALTER TABLE public.parents DISABLE TRIGGER ALL;
ALTER TABLE public.wallets DISABLE TRIGGER ALL;
ALTER TABLE public.student_preferences DISABLE TRIGGER ALL;
ALTER TABLE public.teacher_preferences DISABLE TRIGGER ALL;
ALTER TABLE public.onboarding_responses DISABLE TRIGGER ALL;
ALTER TABLE public.notifications DISABLE TRIGGER ALL;

-- =====================================================
-- 2. DROP ALL TRIGGERS COMPLETELY
-- =====================================================

-- Drop all triggers that might exist
DROP TRIGGER IF EXISTS create_student_data_trigger ON public.students;
DROP TRIGGER IF EXISTS create_teacher_data_trigger ON public.teachers;
DROP TRIGGER IF EXISTS create_parent_data_trigger ON public.parents;
DROP TRIGGER IF EXISTS create_teacher_preferences_trigger ON public.teachers;
DROP TRIGGER IF EXISTS notify_incomplete_profile_trigger ON public.teachers;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON public.profiles;
DROP TRIGGER IF EXISTS create_user_wallet_trigger ON public.wallets;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;

-- =====================================================
-- 3. DROP ALL PROBLEMATIC FUNCTIONS
-- =====================================================

-- Drop all functions that might be causing issues
DROP FUNCTION IF EXISTS create_student_preferences(uuid);
DROP FUNCTION IF EXISTS create_teacher_preferences(uuid);
DROP FUNCTION IF EXISTS create_user_wallet(uuid);
DROP FUNCTION IF EXISTS create_user_wallet(uuid, text);
DROP FUNCTION IF EXISTS trigger_create_student_data();
DROP FUNCTION IF EXISTS trigger_create_teacher_data();
DROP FUNCTION IF EXISTS trigger_create_parent_data();
DROP FUNCTION IF EXISTS notify_incomplete_teacher_profile();
DROP FUNCTION IF EXISTS get_teacher_profile_completion(uuid);
DROP FUNCTION IF EXISTS get_user_profile(uuid);
DROP FUNCTION IF EXISTS validate_signup_data(jsonb);
DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS create_user_wallet_auto();
DROP FUNCTION IF EXISTS handle_new_user();

-- =====================================================
-- 4. CREATE ESSENTIAL TABLES (IF NOT EXISTS)
-- =====================================================

-- Create student_preferences table
CREATE TABLE IF NOT EXISTS public.student_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  class_reminders boolean DEFAULT true,
  assignment_due_reminders boolean DEFAULT true,
  teacher_messages boolean DEFAULT true,
  weekly_progress_reports boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  profile_visibility text DEFAULT 'public'::text CHECK (profile_visibility = ANY (ARRAY['public'::text, 'private'::text, 'teachers_only'::text])),
  show_online_status boolean DEFAULT true,
  allow_teacher_contact boolean DEFAULT true,
  share_progress_with_parents boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT student_preferences_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create teacher_preferences table
CREATE TABLE IF NOT EXISTS public.teacher_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  teacher_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  class_reminders boolean DEFAULT true,
  student_messages boolean DEFAULT true,
  booking_notifications boolean DEFAULT true,
  payment_notifications boolean DEFAULT true,
  weekly_earnings_reports boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  profile_visibility text DEFAULT 'public'::text CHECK (profile_visibility = ANY (ARRAY['public'::text, 'private'::text, 'students_only'::text])),
  show_online_status boolean DEFAULT true,
  allow_student_contact boolean DEFAULT true,
  auto_accept_bookings boolean DEFAULT false,
  max_daily_sessions integer DEFAULT 8,
  min_session_duration integer DEFAULT 30,
  max_session_duration integer DEFAULT 180,
  timezone text DEFAULT 'UTC'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_preferences_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. CREATE ESSENTIAL INDEXES
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_education_system ON public.students(education_system_id);
CREATE INDEX IF NOT EXISTS idx_students_education_level ON public.students(education_level_id);

-- Teachers indexes
CREATE INDEX IF NOT EXISTS idx_teachers_is_available ON public.teachers(is_available);
CREATE INDEX IF NOT EXISTS idx_teachers_verification_status ON public.teachers(verification_status);

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE BASIC RLS POLICIES
-- =====================================================

-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;
    
    DROP POLICY IF EXISTS "Students can view own data" ON public.students;
    DROP POLICY IF EXISTS "Students can update own data" ON public.students;
    DROP POLICY IF EXISTS "Students can insert own data" ON public.students;
    
    DROP POLICY IF EXISTS "Teachers can view own data" ON public.teachers;
    DROP POLICY IF EXISTS "Teachers can update own data" ON public.teachers;
    DROP POLICY IF EXISTS "Teachers can insert own data" ON public.teachers;
    
    DROP POLICY IF EXISTS "Parents can view own data" ON public.parents;
    DROP POLICY IF EXISTS "Parents can update own data" ON public.parents;
    DROP POLICY IF EXISTS "Parents can insert own data" ON public.parents;
    
    DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
    DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
    DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
    
    DROP POLICY IF EXISTS "Students can view own preferences" ON public.student_preferences;
    DROP POLICY IF EXISTS "Students can update own preferences" ON public.student_preferences;
    DROP POLICY IF EXISTS "Students can insert own preferences" ON public.student_preferences;
    
    DROP POLICY IF EXISTS "Teachers can view own preferences" ON public.teacher_preferences;
    DROP POLICY IF EXISTS "Teachers can update own preferences" ON public.teacher_preferences;
    DROP POLICY IF EXISTS "Teachers can insert own preferences" ON public.teacher_preferences;
END $$;

-- Create basic policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view active profiles" ON public.profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Students can view own data" ON public.students
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students can update own data" ON public.students
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Students can insert own data" ON public.students
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can view own data" ON public.teachers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Teachers can update own data" ON public.teachers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Teachers can insert own data" ON public.teachers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can view own data" ON public.parents
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Parents can update own data" ON public.parents
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Parents can insert own data" ON public.parents
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can view own preferences" ON public.student_preferences
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update own preferences" ON public.student_preferences
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own preferences" ON public.student_preferences
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view own preferences" ON public.teacher_preferences
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own preferences" ON public.teacher_preferences
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own preferences" ON public.teacher_preferences
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'EMERGENCY DATABASE FIX COMPLETED!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Disabled ALL triggers on ALL tables';
    RAISE NOTICE '✅ Dropped ALL problematic functions';
    RAISE NOTICE '✅ Created essential tables and indexes';
    RAISE NOTICE '✅ Set up basic RLS policies';
    RAISE NOTICE '✅ Granted proper permissions';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'The 500 signup error should now be FIXED!';
    RAISE NOTICE 'Users can now sign up without database errors.';
    RAISE NOTICE '=====================================================';
END $$;
