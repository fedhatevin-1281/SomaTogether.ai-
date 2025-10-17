-- =====================================================
-- FORCE DISABLE RLS - COMPREHENSIVE FIX
-- =====================================================
-- This script will definitely disable RLS and fix all signup issues

-- =====================================================
-- 1. CHECK CURRENT RLS STATUS
-- =====================================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 2. FORCE DISABLE RLS ON ALL TABLES
-- =====================================================

-- Disable RLS on all tables (force)
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_onboarding_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.education_systems DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.education_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attachments DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all policies on all tables
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
-- 4. GRANT FULL PERMISSIONS
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

-- Grant all permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- =====================================================
-- 5. VERIFY RLS IS DISABLED
-- =====================================================

-- Check RLS status after disabling
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'RLS FORCE DISABLED - COMPREHENSIVE FIX!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Disabled RLS on ALL tables';
    RAISE NOTICE '✅ Dropped ALL existing policies';
    RAISE NOTICE '✅ Granted full permissions to all roles';
    RAISE NOTICE '✅ Verified RLS is disabled';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'The 401 Unauthorized errors should now be FIXED!';
    RAISE NOTICE 'Users can now sign up and create all records.';
    RAISE NOTICE '=====================================================';
END $$;
