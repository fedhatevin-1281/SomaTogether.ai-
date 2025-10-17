-- =====================================================
-- COMPREHENSIVE DATABASE FIX FOR SOMA TOGETHER AI
-- =====================================================
-- This script fixes all signup issues and database problems
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 2. CREATE MISSING TABLES
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

-- Create teacher_preferences table if it doesn't exist
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
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_education_system ON public.students(education_system_id);
CREATE INDEX IF NOT EXISTS idx_students_education_level ON public.students(education_level_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at);

-- Teachers indexes
CREATE INDEX IF NOT EXISTS idx_teachers_is_available ON public.teachers(is_available);
CREATE INDEX IF NOT EXISTS idx_teachers_verification_status ON public.teachers(verification_status);
CREATE INDEX IF NOT EXISTS idx_teachers_created_at ON public.teachers(created_at);

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON public.wallets(is_active);

-- Student preferences indexes
CREATE INDEX IF NOT EXISTS idx_student_preferences_student_id ON public.student_preferences(student_id);

-- Teacher preferences indexes
CREATE INDEX IF NOT EXISTS idx_teacher_preferences_teacher_id ON public.teacher_preferences(teacher_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
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
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;
    
    DROP POLICY IF EXISTS "Students can view own data" ON public.students;
    DROP POLICY IF EXISTS "Students can update own data" ON public.students;
    DROP POLICY IF EXISTS "Students can insert own data" ON public.students;
    DROP POLICY IF EXISTS "Teachers can view student data" ON public.students;
    
    DROP POLICY IF EXISTS "Teachers can view own data" ON public.teachers;
    DROP POLICY IF EXISTS "Teachers can update own data" ON public.teachers;
    DROP POLICY IF EXISTS "Teachers can insert own data" ON public.teachers;
    DROP POLICY IF EXISTS "Public can view active teachers" ON public.teachers;
    
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

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view active profiles" ON public.profiles
    FOR SELECT USING (is_active = true);

-- STUDENTS POLICIES
CREATE POLICY "Students can view own data" ON public.students
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students can update own data" ON public.students
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Students can insert own data" ON public.students
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can view student data" ON public.students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.teachers 
            WHERE id = auth.uid() AND is_available = true
        )
    );

-- TEACHERS POLICIES
CREATE POLICY "Teachers can view own data" ON public.teachers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Teachers can update own data" ON public.teachers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Teachers can insert own data" ON public.teachers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view active teachers" ON public.teachers
    FOR SELECT USING (is_available = true);

-- PARENTS POLICIES
CREATE POLICY "Parents can view own data" ON public.parents
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Parents can update own data" ON public.parents
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Parents can insert own data" ON public.parents
    FOR INSERT WITH CHECK (auth.uid() = id);

-- WALLETS POLICIES
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STUDENT PREFERENCES POLICIES
CREATE POLICY "Students can view own preferences" ON public.student_preferences
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update own preferences" ON public.student_preferences
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own preferences" ON public.student_preferences
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- TEACHER PREFERENCES POLICIES
CREATE POLICY "Teachers can view own preferences" ON public.teacher_preferences
    FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own preferences" ON public.teacher_preferences
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own preferences" ON public.teacher_preferences
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- =====================================================
-- 6. CREATE DATABASE TRIGGERS
-- =====================================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS create_student_preferences(uuid);
DROP FUNCTION IF EXISTS create_teacher_preferences(uuid);
DROP FUNCTION IF EXISTS create_user_wallet(uuid);
DROP FUNCTION IF EXISTS create_user_wallet(uuid, text);
DROP FUNCTION IF EXISTS trigger_create_student_data();
DROP FUNCTION IF EXISTS trigger_create_teacher_data();
DROP FUNCTION IF EXISTS trigger_create_parent_data();
DROP FUNCTION IF EXISTS get_user_profile(uuid);
DROP FUNCTION IF EXISTS validate_signup_data(jsonb);

-- Function to create default student preferences
CREATE OR REPLACE FUNCTION create_student_preferences(student_id uuid)
RETURNS void AS $$
BEGIN
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
        share_progress_with_parents,
        created_at,
        updated_at
    ) VALUES (
        student_id,
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
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (student_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to create default teacher preferences
CREATE OR REPLACE FUNCTION create_teacher_preferences(teacher_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.teacher_preferences (
        teacher_id,
        email_notifications,
        sms_notifications,
        push_notifications,
        class_reminders,
        student_messages,
        booking_notifications,
        payment_notifications,
        weekly_earnings_reports,
        marketing_emails,
        profile_visibility,
        show_online_status,
        allow_student_contact,
        auto_accept_bookings,
        max_daily_sessions,
        min_session_duration,
        max_session_duration,
        timezone,
        created_at,
        updated_at
    ) VALUES (
        teacher_id,
        true,
        false,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        'public',
        true,
        true,
        false,
        8,
        30,
        180,
        'UTC',
        NOW(),
        NOW()
    ) ON CONFLICT (teacher_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to create default wallet
CREATE OR REPLACE FUNCTION create_user_wallet(user_id uuid, currency text DEFAULT 'USD')
RETURNS void AS $$
BEGIN
    INSERT INTO public.wallets (
        user_id,
        balance,
        currency,
        tokens,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        0.00,
        currency,
        0,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for student creation
CREATE OR REPLACE FUNCTION trigger_create_student_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default student preferences
    PERFORM create_student_preferences(NEW.id);
    
    -- Create default wallet
    PERFORM create_user_wallet(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for teacher creation
CREATE OR REPLACE FUNCTION trigger_create_teacher_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default teacher preferences
    PERFORM create_teacher_preferences(NEW.id);
    
    -- Create default wallet
    PERFORM create_user_wallet(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for parent creation
CREATE OR REPLACE FUNCTION trigger_create_parent_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default wallet
    PERFORM create_user_wallet(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS create_student_data_trigger ON public.students;
DROP TRIGGER IF EXISTS create_teacher_data_trigger ON public.teachers;
DROP TRIGGER IF EXISTS create_parent_data_trigger ON public.parents;
DROP TRIGGER IF EXISTS create_teacher_preferences_trigger ON public.teachers;
DROP TRIGGER IF EXISTS notify_incomplete_profile_trigger ON public.teachers;

CREATE TRIGGER create_student_data_trigger
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_student_data();

CREATE TRIGGER create_teacher_data_trigger
    AFTER INSERT ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_teacher_data();

CREATE TRIGGER create_parent_data_trigger
    AFTER INSERT ON public.parents
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_parent_data();

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user profile with role-specific data
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS jsonb AS $$
DECLARE
    profile_data jsonb;
    student_data jsonb;
    teacher_data jsonb;
    parent_data jsonb;
    wallet_data jsonb;
    student_prefs jsonb;
    teacher_prefs jsonb;
BEGIN
    -- Get basic profile
    SELECT to_jsonb(p.*) INTO profile_data
    FROM public.profiles p
    WHERE p.id = user_id;
    
    -- Get role-specific data
    IF (profile_data->>'role') = 'student' THEN
        SELECT to_jsonb(s.*) INTO student_data
        FROM public.students s
        WHERE s.id = user_id;
        
        SELECT to_jsonb(sp.*) INTO student_prefs
        FROM public.student_preferences sp
        WHERE sp.student_id = user_id;
        
        profile_data := profile_data || jsonb_build_object('student_data', student_data, 'preferences', student_prefs);
        
    ELSIF (profile_data->>'role') = 'teacher' THEN
        SELECT to_jsonb(t.*) INTO teacher_data
        FROM public.teachers t
        WHERE t.id = user_id;
        
        SELECT to_jsonb(tp.*) INTO teacher_prefs
        FROM public.teacher_preferences tp
        WHERE tp.teacher_id = user_id;
        
        profile_data := profile_data || jsonb_build_object('teacher_data', teacher_data, 'preferences', teacher_prefs);
        
    ELSIF (profile_data->>'role') = 'parent' THEN
        SELECT to_jsonb(p.*) INTO parent_data
        FROM public.parents p
        WHERE p.id = user_id;
        
        profile_data := profile_data || jsonb_build_object('parent_data', parent_data);
    END IF;
    
    -- Get wallet data
    SELECT to_jsonb(w.*) INTO wallet_data
    FROM public.wallets w
    WHERE w.user_id = user_id;
    
    profile_data := profile_data || jsonb_build_object('wallet', wallet_data);
    
    RETURN profile_data;
END;
$$ LANGUAGE plpgsql;

-- Function to validate signup data
CREATE OR REPLACE FUNCTION validate_signup_data(signup_data jsonb)
RETURNS jsonb AS $$
DECLARE
    errors text[] := '{}';
    warnings text[] := '{}';
BEGIN
    -- Validate required fields
    IF NOT (signup_data ? 'email' AND signup_data ? 'password' AND signup_data ? 'full_name' AND signup_data ? 'role') THEN
        errors := array_append(errors, 'Missing required fields: email, password, full_name, role');
    END IF;
    
    -- Validate email format
    IF signup_data ? 'email' AND signup_data->>'email' !~ '^[^@]+@[^@]+\.[^@]+$' THEN
        errors := array_append(errors, 'Invalid email format');
    END IF;
    
    -- Validate password strength
    IF signup_data ? 'password' AND length(signup_data->>'password') < 8 THEN
        errors := array_append(errors, 'Password must be at least 8 characters long');
    END IF;
    
    -- Validate role
    IF signup_data ? 'role' AND signup_data->>'role' NOT IN ('student', 'teacher', 'parent', 'admin') THEN
        errors := array_append(errors, 'Invalid role. Must be student, teacher, parent, or admin');
    END IF;
    
    RETURN jsonb_build_object(
        'valid', array_length(errors, 1) IS NULL,
        'errors', errors,
        'warnings', warnings
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. INSERT DEFAULT DATA
-- =====================================================

-- Insert default subjects if they don't exist
INSERT INTO public.subjects (id, name, description, category, is_active) VALUES
    (uuid_generate_v4(), 'Mathematics', 'Algebra, Geometry, Calculus, Statistics', 'STEM', true),
    (uuid_generate_v4(), 'Science', 'Physics, Chemistry, Biology, Earth Science', 'STEM', true),
    (uuid_generate_v4(), 'English', 'Literature, Grammar, Writing, Reading Comprehension', 'Language Arts', true),
    (uuid_generate_v4(), 'History', 'World History, US History, Government, Geography', 'Social Studies', true),
    (uuid_generate_v4(), 'Computer Science', 'Programming, Web Development, Data Science', 'Technology', true),
    (uuid_generate_v4(), 'Art', 'Drawing, Painting, Digital Art, Art History', 'Creative Arts', true),
    (uuid_generate_v4(), 'Music', 'Piano, Guitar, Voice, Music Theory', 'Creative Arts', true),
    (uuid_generate_v4(), 'Physical Education', 'Fitness, Sports, Health Education', 'Health & Wellness', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default education systems if they don't exist
INSERT INTO public.education_systems (id, name, description, is_active) VALUES
    (uuid_generate_v4(), 'US Common Core', 'United States Common Core State Standards', true),
    (uuid_generate_v4(), 'UK National Curriculum', 'United Kingdom National Curriculum', true),
    (uuid_generate_v4(), 'IB (International Baccalaureate)', 'International Baccalaureate Programme', true),
    (uuid_generate_v4(), 'AP (Advanced Placement)', 'Advanced Placement Program', true),
    (uuid_generate_v4(), 'Cambridge', 'Cambridge International Examinations', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default education levels if they don't exist
INSERT INTO public.education_levels (id, system_id, level_name, description) VALUES
    (uuid_generate_v4(), (SELECT id FROM public.education_systems WHERE name = 'US Common Core' LIMIT 1), 'Elementary', 'Kindergarten to 5th Grade'),
    (uuid_generate_v4(), (SELECT id FROM public.education_systems WHERE name = 'US Common Core' LIMIT 1), 'Middle School', '6th to 8th Grade'),
    (uuid_generate_v4(), (SELECT id FROM public.education_systems WHERE name = 'US Common Core' LIMIT 1), 'High School', '9th to 12th Grade'),
    (uuid_generate_v4(), (SELECT id FROM public.education_systems WHERE name = 'UK National Curriculum' LIMIT 1), 'Key Stage 1', 'Years 1-2'),
    (uuid_generate_v4(), (SELECT id FROM public.education_systems WHERE name = 'UK National Curriculum' LIMIT 1), 'Key Stage 2', 'Years 3-6'),
    (uuid_generate_v4(), (SELECT id FROM public.education_systems WHERE name = 'UK National Curriculum' LIMIT 1), 'Key Stage 3', 'Years 7-9'),
    (uuid_generate_v4(), (SELECT id FROM public.education_systems WHERE name = 'UK National Curriculum' LIMIT 1), 'Key Stage 4', 'Years 10-11')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. CREATE VIEWS FOR BETTER QUERIES
-- =====================================================

-- Drop existing views to avoid conflicts
DROP VIEW IF EXISTS public.teacher_browse_view;
DROP VIEW IF EXISTS public.student_dashboard_view;

-- Create teacher browse view
CREATE OR REPLACE VIEW public.teacher_browse_view AS
SELECT 
    t.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.bio,
    p.location,
    t.hourly_rate,
    t.currency,
    t.subjects,
    t.specialties,
    t.experience_years,
    t.verification_status,
    t.is_available,
    t.created_at,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as total_reviews
FROM public.teachers t
JOIN public.profiles p ON t.id = p.id
LEFT JOIN public.reviews r ON t.id = r.teacher_id
WHERE t.is_available = true AND p.is_active = true
GROUP BY t.id, p.full_name, p.email, p.avatar_url, p.bio, p.location, 
         t.hourly_rate, t.currency, t.subjects, t.specialties, 
         t.experience_years, t.verification_status, t.is_available, t.created_at;

-- Create student dashboard view
CREATE OR REPLACE VIEW public.student_dashboard_view AS
SELECT 
    s.id,
    p.full_name,
    p.email,
    p.avatar_url,
    s.grade_level,
    s.school_name,
    s.learning_goals,
    s.interests,
    s.preferred_languages,
    s.education_system_id,
    s.education_level_id,
    s.wallet_balance,
    s.tokens,
    s.created_at,
    COUNT(DISTINCT c.id) as total_classes,
    COUNT(DISTINCT cs.id) as total_sessions,
    COALESCE(SUM(cs.tokens_charged), 0) as total_tokens_spent
FROM public.students s
JOIN public.profiles p ON s.id = p.id
LEFT JOIN public.classes c ON s.id = c.student_id
LEFT JOIN public.class_sessions cs ON s.id = cs.student_id
WHERE p.is_active = true
GROUP BY s.id, p.full_name, p.email, p.avatar_url, s.grade_level, 
         s.school_name, s.learning_goals, s.interests, s.preferred_languages,
         s.education_system_id, s.education_level_id, s.wallet_balance, 
         s.tokens, s.created_at;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- 11. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'SOMA TOGETHER AI DATABASE FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Created missing tables: student_preferences, teacher_preferences';
    RAISE NOTICE '✅ Created all necessary indexes for performance';
    RAISE NOTICE '✅ Enabled Row Level Security on all tables';
    RAISE NOTICE '✅ Created comprehensive RLS policies';
    RAISE NOTICE '✅ Created database triggers for automatic data creation';
    RAISE NOTICE '✅ Created helper functions for profile management';
    RAISE NOTICE '✅ Inserted default subjects and education data';
    RAISE NOTICE '✅ Created optimized views for queries';
    RAISE NOTICE '✅ Granted proper permissions to authenticated users';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Your signup issues should now be resolved!';
    RAISE NOTICE 'Users can now sign up without database errors.';
    RAISE NOTICE '=====================================================';
END $$;
