-- Final RLS fix with correct type casting
-- This addresses the "operator does not exist: text = uuid" error

-- ==============================================
-- CONVERSATIONS TABLE - Fix type casting
-- ==============================================

-- Drop existing policies that have type casting issues
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- Create policies with correct type casting
-- The participants field is ARRAY NOT NULL, and based on the schema pattern, it should be uuid[]
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (
        auth.uid() = ANY(participants)
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        auth.uid() = ANY(participants)
    );

CREATE POLICY "Users can update conversations they participate in" ON public.conversations
    FOR UPDATE USING (
        auth.uid() = ANY(participants)
    );

-- ==============================================
-- MESSAGES TABLE - Fix type casting
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create policies with correct type casting
CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid() = ANY(participants)
        )
    );

CREATE POLICY "Users can create messages in conversations they participate in" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid() = ANY(participants)
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id
    );

-- ==============================================
-- TEACHER ONBOARDING TABLES - Fix type casting
-- ==============================================

-- teacher_onboarding_responses
ALTER TABLE public.teacher_onboarding_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view teacher onboarding responses" ON public.teacher_onboarding_responses;
DROP POLICY IF EXISTS "Teachers can create their own onboarding responses" ON public.teacher_onboarding_responses;
DROP POLICY IF EXISTS "Teachers can update their own onboarding responses" ON public.teacher_onboarding_responses;

CREATE POLICY "Anyone can view teacher onboarding responses" ON public.teacher_onboarding_responses
    FOR SELECT USING (true);

CREATE POLICY "Teachers can create their own onboarding responses" ON public.teacher_onboarding_responses
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id
    );

CREATE POLICY "Teachers can update their own onboarding responses" ON public.teacher_onboarding_responses
    FOR UPDATE USING (
        auth.uid() = teacher_id
    );

-- teacher_preferred_curriculums
ALTER TABLE public.teacher_preferred_curriculums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view teacher preferred curriculums" ON public.teacher_preferred_curriculums;
DROP POLICY IF EXISTS "Teachers can manage their preferred curriculums" ON public.teacher_preferred_curriculums;

CREATE POLICY "Anyone can view teacher preferred curriculums" ON public.teacher_preferred_curriculums
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their preferred curriculums" ON public.teacher_preferred_curriculums
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teacher_onboarding_responses 
            WHERE id = onboarding_id 
            AND auth.uid() = teacher_id
        )
    );

-- teacher_preferred_subjects
ALTER TABLE public.teacher_preferred_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view teacher preferred subjects" ON public.teacher_preferred_subjects;
DROP POLICY IF EXISTS "Teachers can manage their preferred subjects" ON public.teacher_preferred_subjects;

CREATE POLICY "Anyone can view teacher preferred subjects" ON public.teacher_preferred_subjects
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their preferred subjects" ON public.teacher_preferred_subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teacher_onboarding_responses 
            WHERE id = onboarding_id 
            AND auth.uid() = teacher_id
        )
    );

-- teacher_onboarding_availability
ALTER TABLE public.teacher_onboarding_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view teacher onboarding availability" ON public.teacher_onboarding_availability;
DROP POLICY IF EXISTS "Teachers can manage their onboarding availability" ON public.teacher_onboarding_availability;

CREATE POLICY "Anyone can view teacher onboarding availability" ON public.teacher_onboarding_availability
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their onboarding availability" ON public.teacher_onboarding_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teacher_onboarding_responses 
            WHERE id = onboarding_id 
            AND auth.uid() = teacher_id
        )
    );

-- teacher_preferences
ALTER TABLE public.teacher_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view teacher preferences" ON public.teacher_preferences;
DROP POLICY IF EXISTS "Teachers can manage their own preferences" ON public.teacher_preferences;

CREATE POLICY "Anyone can view teacher preferences" ON public.teacher_preferences
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their own preferences" ON public.teacher_preferences
    FOR ALL USING (
        auth.uid() = teacher_id
    );

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================

-- Grant permissions on main tables
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.teacher_onboarding_responses TO authenticated;
GRANT ALL ON public.teacher_preferred_curriculums TO authenticated;
GRANT ALL ON public.teacher_preferred_subjects TO authenticated;
GRANT ALL ON public.teacher_onboarding_availability TO authenticated;
GRANT ALL ON public.teacher_preferences TO authenticated;

-- Grant select on related tables
GRANT SELECT ON public.education_systems TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.teachers TO authenticated;
GRANT SELECT ON public.students TO authenticated;
GRANT SELECT ON public.parents TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
