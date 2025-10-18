-- Fix teacher onboarding queries 406 errors
-- This script fixes the RLS policies for teacher onboarding related tables

-- Enable RLS on teacher_onboarding_responses
ALTER TABLE public.teacher_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can view their own onboarding responses" ON public.teacher_onboarding_responses;
DROP POLICY IF EXISTS "Teachers can create their own onboarding responses" ON public.teacher_onboarding_responses;
DROP POLICY IF EXISTS "Teachers can update their own onboarding responses" ON public.teacher_onboarding_responses;
DROP POLICY IF EXISTS "Anyone can view teacher onboarding responses" ON public.teacher_onboarding_responses;

-- Create policies - allow anyone to view for teacher browsing
CREATE POLICY "Anyone can view teacher onboarding responses" ON public.teacher_onboarding_responses
    FOR SELECT USING (true);

CREATE POLICY "Teachers can create their own onboarding responses" ON public.teacher_onboarding_responses
    FOR INSERT WITH CHECK (
        auth.uid()::text = teacher_id::text
    );

CREATE POLICY "Teachers can update their own onboarding responses" ON public.teacher_onboarding_responses
    FOR UPDATE USING (
        auth.uid()::text = teacher_id::text
    );

-- Enable RLS on teacher_preferred_curriculums
ALTER TABLE public.teacher_preferred_curriculums ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view teacher preferred curriculums" ON public.teacher_preferred_curriculums;
DROP POLICY IF EXISTS "Teachers can manage their preferred curriculums" ON public.teacher_preferred_curriculums;

-- Create policies
CREATE POLICY "Anyone can view teacher preferred curriculums" ON public.teacher_preferred_curriculums
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their preferred curriculums" ON public.teacher_preferred_curriculums
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teacher_onboarding_responses 
            WHERE id = onboarding_id 
            AND auth.uid()::text = teacher_id::text
        )
    );

-- Enable RLS on teacher_preferred_subjects
ALTER TABLE public.teacher_preferred_subjects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view teacher preferred subjects" ON public.teacher_preferred_subjects;
DROP POLICY IF EXISTS "Teachers can manage their preferred subjects" ON public.teacher_preferred_subjects;

-- Create policies
CREATE POLICY "Anyone can view teacher preferred subjects" ON public.teacher_preferred_subjects
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their preferred subjects" ON public.teacher_preferred_subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teacher_onboarding_responses 
            WHERE id = onboarding_id 
            AND auth.uid()::text = teacher_id::text
        )
    );

-- Enable RLS on teacher_onboarding_availability
ALTER TABLE public.teacher_onboarding_availability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view teacher onboarding availability" ON public.teacher_onboarding_availability;
DROP POLICY IF EXISTS "Teachers can manage their onboarding availability" ON public.teacher_onboarding_availability;

-- Create policies
CREATE POLICY "Anyone can view teacher onboarding availability" ON public.teacher_onboarding_availability
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their onboarding availability" ON public.teacher_onboarding_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teacher_onboarding_responses 
            WHERE id = onboarding_id 
            AND auth.uid()::text = teacher_id::text
        )
    );

-- Grant permissions
GRANT ALL ON public.teacher_onboarding_responses TO authenticated;
GRANT ALL ON public.teacher_preferred_curriculums TO authenticated;
GRANT ALL ON public.teacher_preferred_subjects TO authenticated;
GRANT ALL ON public.teacher_onboarding_availability TO authenticated;

-- Grant select on related tables
GRANT SELECT ON public.education_systems TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.teachers TO authenticated;
