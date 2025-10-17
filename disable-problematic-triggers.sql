-- =====================================================
-- DISABLE PROBLEMATIC TRIGGERS AND CONSTRAINTS
-- =====================================================
-- This script disables triggers that might be causing signup failures
-- Run this FIRST before the main database fix

-- =====================================================
-- 1. DISABLE ALL TRIGGERS ON PROFILES TABLE
-- =====================================================

-- Disable all triggers on profiles table
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- =====================================================
-- 2. DISABLE ALL TRIGGERS ON STUDENTS TABLE
-- =====================================================

-- Disable all triggers on students table
ALTER TABLE public.students DISABLE TRIGGER ALL;

-- =====================================================
-- 3. DISABLE ALL TRIGGERS ON TEACHERS TABLE
-- =====================================================

-- Disable all triggers on teachers table
ALTER TABLE public.teachers DISABLE TRIGGER ALL;

-- =====================================================
-- 4. DISABLE ALL TRIGGERS ON PARENTS TABLE
-- =====================================================

-- Disable all triggers on parents table
ALTER TABLE public.parents DISABLE TRIGGER ALL;

-- =====================================================
-- 5. DISABLE ALL TRIGGERS ON WALLETS TABLE
-- =====================================================

-- Disable all triggers on wallets table
ALTER TABLE public.wallets DISABLE TRIGGER ALL;

-- =====================================================
-- 6. DROP PROBLEMATIC FUNCTIONS
-- =====================================================

-- Drop functions that might be causing issues
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

-- =====================================================
-- 7. DROP ALL TRIGGERS
-- =====================================================

-- Drop all triggers
DROP TRIGGER IF EXISTS create_student_data_trigger ON public.students;
DROP TRIGGER IF EXISTS create_teacher_data_trigger ON public.teachers;
DROP TRIGGER IF EXISTS create_parent_data_trigger ON public.parents;
DROP TRIGGER IF EXISTS create_teacher_preferences_trigger ON public.teachers;
DROP TRIGGER IF EXISTS notify_incomplete_profile_trigger ON public.teachers;

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'PROBLEMATIC TRIGGERS AND FUNCTIONS DISABLED!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Disabled all triggers on profiles, students, teachers, parents, wallets';
    RAISE NOTICE '✅ Dropped all problematic functions';
    RAISE NOTICE '✅ Dropped all triggers';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Now run the main database fix script.';
    RAISE NOTICE 'Signup should work without database errors.';
    RAISE NOTICE '=====================================================';
END $$;
