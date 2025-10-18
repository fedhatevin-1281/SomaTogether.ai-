-- Fix RLS policies for messaging system
-- This script enables proper messaging functionality by setting up RLS policies

-- First, let's check if RLS is enabled on conversations table
-- If it's not enabled, we need to enable it
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- Create policies for conversations table
-- Policy 1: Users can view conversations where they are participants
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (
        auth.uid()::text = ANY(participants)
    );

-- Policy 2: Users can create conversations where they are the creator
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid()::text = created_by AND
        auth.uid()::text = ANY(participants)
    );

-- Policy 3: Users can update conversations they participate in
CREATE POLICY "Users can update conversations they participate in" ON public.conversations
    FOR UPDATE USING (
        auth.uid()::text = ANY(participants)
    );

-- Enable RLS on messages table if not already enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create policies for messages table
-- Policy 1: Users can view messages in conversations they participate in
CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid()::text = ANY(participants)
        )
    );

-- Policy 2: Users can create messages in conversations they participate in
CREATE POLICY "Users can create messages in conversations they participate in" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid()::text = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid()::text = ANY(participants)
        )
    );

-- Policy 3: Users can update their own messages
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid()::text = sender_id
    );

-- Also need to fix the teacher_onboarding_responses table RLS policies
-- This is causing the 406 errors
ALTER TABLE public.teacher_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can view their own onboarding responses" ON public.teacher_onboarding_responses;
DROP POLICY IF EXISTS "Teachers can create their own onboarding responses" ON public.teacher_onboarding_responses;
DROP POLICY IF EXISTS "Teachers can update their own onboarding responses" ON public.teacher_onboarding_responses;

-- Create policies for teacher_onboarding_responses table
CREATE POLICY "Teachers can view their own onboarding responses" ON public.teacher_onboarding_responses
    FOR SELECT USING (
        auth.uid()::text = teacher_id::text
    );

CREATE POLICY "Teachers can create their own onboarding responses" ON public.teacher_onboarding_responses
    FOR INSERT WITH CHECK (
        auth.uid()::text = teacher_id::text
    );

CREATE POLICY "Teachers can update their own onboarding responses" ON public.teacher_onboarding_responses
    FOR UPDATE USING (
        auth.uid()::text = teacher_id::text
    );

-- Also need to fix the related tables
-- teacher_preferred_curriculums
ALTER TABLE public.teacher_preferred_curriculums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view teacher preferred curriculums" ON public.teacher_preferred_curriculums;
CREATE POLICY "Users can view teacher preferred curriculums" ON public.teacher_preferred_curriculums
    FOR SELECT USING (true);

-- teacher_preferred_subjects
ALTER TABLE public.teacher_preferred_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view teacher preferred subjects" ON public.teacher_preferred_subjects;
CREATE POLICY "Users can view teacher preferred subjects" ON public.teacher_preferred_subjects
    FOR SELECT USING (true);

-- teacher_onboarding_availability
ALTER TABLE public.teacher_onboarding_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view teacher onboarding availability" ON public.teacher_onboarding_availability;
CREATE POLICY "Users can view teacher onboarding availability" ON public.teacher_onboarding_availability
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.teacher_onboarding_responses TO authenticated;
GRANT ALL ON public.teacher_preferred_curriculums TO authenticated;
GRANT ALL ON public.teacher_preferred_subjects TO authenticated;
GRANT ALL ON public.teacher_onboarding_availability TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select on related tables that are referenced
GRANT SELECT ON public.education_systems TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.teachers TO authenticated;
GRANT SELECT ON public.students TO authenticated;
GRANT SELECT ON public.parents TO authenticated;
