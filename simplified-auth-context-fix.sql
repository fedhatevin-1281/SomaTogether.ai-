-- =====================================================
-- SIMPLIFIED AUTH CONTEXT FIX
-- =====================================================
-- This script provides the SQL to run after updating the AuthContext
-- to remove manual profile creation since the trigger will handle it

-- =====================================================
-- 1. DISABLE RLS TEMPORARILY
-- =====================================================

-- Disable RLS on all tables to allow the trigger to work
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
-- 2. GRANT PERMISSIONS TO POSTGRES ROLE
-- =====================================================

-- Grant permissions to postgres role (used by triggers)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- =====================================================
-- 3. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DATABASE READY FOR TRIGGER-BASED SIGNUP!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Disabled RLS on all tables';
    RAISE NOTICE '✅ Granted permissions to postgres role';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Now run the create-signup-trigger.sql script!';
    RAISE NOTICE 'Then update your AuthContext to remove manual profile creation.';
    RAISE NOTICE '=====================================================';
END $$;
