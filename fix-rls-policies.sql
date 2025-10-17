-- =====================================================
-- FIX RLS POLICIES FOR SIGNUP
-- =====================================================
-- This script fixes the RLS policies to allow proper signup flow
-- Run this to fix the 401 Unauthorized errors during signup

-- =====================================================
-- 1. DROP ALL EXISTING RLS POLICIES
-- =====================================================

-- Drop all existing policies to start fresh
DO $$ 
BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
    
    -- Students policies
    DROP POLICY IF EXISTS "Students can view own data" ON public.students;
    DROP POLICY IF EXISTS "Students can update own data" ON public.students;
    DROP POLICY IF EXISTS "Students can insert own data" ON public.students;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.students;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.students;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.students;
    
    -- Teachers policies
    DROP POLICY IF EXISTS "Teachers can view own data" ON public.teachers;
    DROP POLICY IF EXISTS "Teachers can update own data" ON public.teachers;
    DROP POLICY IF EXISTS "Teachers can insert own data" ON public.teachers;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.teachers;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.teachers;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.teachers;
    
    -- Parents policies
    DROP POLICY IF EXISTS "Parents can view own data" ON public.parents;
    DROP POLICY IF EXISTS "Parents can update own data" ON public.parents;
    DROP POLICY IF EXISTS "Parents can insert own data" ON public.parents;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.parents;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.parents;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.parents;
    
    -- Wallets policies
    DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
    DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
    DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.wallets;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.wallets;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.wallets;
    
    -- Student preferences policies
    DROP POLICY IF EXISTS "Students can view own preferences" ON public.student_preferences;
    DROP POLICY IF EXISTS "Students can update own preferences" ON public.student_preferences;
    DROP POLICY IF EXISTS "Students can insert own preferences" ON public.student_preferences;
    
    -- Teacher preferences policies
    DROP POLICY IF EXISTS "Teachers can view own preferences" ON public.teacher_preferences;
    DROP POLICY IF EXISTS "Teachers can update own preferences" ON public.teacher_preferences;
    DROP POLICY IF EXISTS "Teachers can insert own preferences" ON public.teacher_preferences;
    
    -- Onboarding responses policies
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.teacher_onboarding_responses;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.teacher_onboarding_responses;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.teacher_onboarding_responses;
    
    -- Notifications policies
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notifications;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.notifications;
END $$;

-- =====================================================
-- 2. CREATE PROPER RLS POLICIES FOR SIGNUP
-- =====================================================

-- Profiles policies
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Students policies
CREATE POLICY "Enable insert for authenticated users only" ON public.students
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.students
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.students
    FOR UPDATE USING (auth.uid() = id);

-- Teachers policies
CREATE POLICY "Enable insert for authenticated users only" ON public.teachers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.teachers
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.teachers
    FOR UPDATE USING (auth.uid() = id);

-- Parents policies
CREATE POLICY "Enable insert for authenticated users only" ON public.parents
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.parents
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.parents
    FOR UPDATE USING (auth.uid() = id);

-- Wallets policies
CREATE POLICY "Enable insert for authenticated users only" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON public.wallets
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Student preferences policies
CREATE POLICY "Enable insert for authenticated users only" ON public.student_preferences
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Enable read access for all users" ON public.student_preferences
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.student_preferences
    FOR UPDATE USING (auth.uid() = student_id);

-- Teacher preferences policies
CREATE POLICY "Enable insert for authenticated users only" ON public.teacher_preferences
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable read access for all users" ON public.teacher_preferences
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.teacher_preferences
    FOR UPDATE USING (auth.uid() = teacher_id);

-- Onboarding responses policies
CREATE POLICY "Enable insert for authenticated users only" ON public.teacher_onboarding_responses
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Enable read access for all users" ON public.teacher_onboarding_responses
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.teacher_onboarding_responses
    FOR UPDATE USING (auth.uid() = teacher_id);

-- Notifications policies
CREATE POLICY "Enable insert for authenticated users only" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON public.notifications
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on email" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 3. GRANT ADDITIONAL PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for signup
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.profiles TO anon;
GRANT INSERT ON public.students TO anon;
GRANT INSERT ON public.teachers TO anon;
GRANT INSERT ON public.parents TO anon;
GRANT INSERT ON public.wallets TO anon;
GRANT INSERT ON public.student_preferences TO anon;
GRANT INSERT ON public.teacher_preferences TO anon;
GRANT INSERT ON public.teacher_onboarding_responses TO anon;
GRANT INSERT ON public.notifications TO anon;

-- =====================================================
-- 4. SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'RLS POLICIES FIXED FOR SIGNUP!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Dropped all existing RLS policies';
    RAISE NOTICE '✅ Created proper signup-friendly policies';
    RAISE NOTICE '✅ Granted permissions to authenticated users';
    RAISE NOTICE '✅ Granted permissions to anon users for signup';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'The 401 Unauthorized errors should now be FIXED!';
    RAISE NOTICE 'Users can now sign up and create profiles/wallets.';
    RAISE NOTICE '=====================================================';
END $$;
