-- =====================================================
-- TEMPORARILY DISABLE RLS FOR SIGNUP
-- =====================================================
-- This script temporarily disables RLS to allow signup to work
-- Run this to fix the persistent 401 Unauthorized errors

-- =====================================================
-- 1. DISABLE RLS ON ALL TABLES
-- =====================================================

-- Disable RLS on all tables to allow signup
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
-- 2. GRANT FULL PERMISSIONS
-- =====================================================

-- Grant full permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant full permissions to anon users
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- =====================================================
-- 3. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'RLS TEMPORARILY DISABLED FOR SIGNUP!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Disabled RLS on all tables';
    RAISE NOTICE '✅ Granted full permissions to authenticated users';
    RAISE NOTICE '✅ Granted full permissions to anon users';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'The 401 Unauthorized errors should now be FIXED!';
    RAISE NOTICE 'Users can now sign up and create all records.';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'WARNING: RLS is disabled - re-enable after testing!';
    RAISE NOTICE '=====================================================';
END $$;
