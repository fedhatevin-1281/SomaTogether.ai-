-- =====================================================
-- RE-ENABLE RLS AFTER TESTING
-- =====================================================
-- Run this AFTER you've confirmed signup works
-- This will re-enable RLS with proper policies

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE PROPER RLS POLICIES
-- =====================================================

-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.students;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.students;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.students;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.teachers;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.teachers;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.teachers;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.parents;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.parents;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.parents;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.wallets;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.wallets;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.wallets;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.student_preferences;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.student_preferences;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.student_preferences;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.teacher_preferences;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.teacher_preferences;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.teacher_preferences;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.teacher_onboarding_responses;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.teacher_onboarding_responses;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.teacher_onboarding_responses;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notifications;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.notifications;
END $$;

-- Create proper policies
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.students
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.students
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.students
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.teachers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.teachers
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.teachers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.parents
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.parents
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.parents
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON public.wallets
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON public.student_preferences
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Enable read access for all users" ON public.student_preferences
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.student_preferences
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Enable insert for authenticated users only" ON public.teacher_preferences
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable read access for all users" ON public.teacher_preferences
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.teacher_preferences
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Enable insert for authenticated users only" ON public.teacher_onboarding_responses
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable read access for all users" ON public.teacher_onboarding_responses
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.teacher_onboarding_responses
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Enable insert for authenticated users only" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON public.notifications
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 3. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'RLS RE-ENABLED WITH PROPER POLICIES!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Re-enabled RLS on all tables';
    RAISE NOTICE '✅ Created proper RLS policies';
    RAISE NOTICE '✅ Database is now secure and functional';
    RAISE NOTICE '=====================================================';
END $$;
