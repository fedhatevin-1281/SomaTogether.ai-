-- Quick fix for type casting issues in conversations table
-- This fixes the immediate "operator does not exist: text = uuid" error

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- Create corrected policies with proper type casting
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (
        auth.uid() = ANY(participants::uuid[])
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        auth.uid() = ANY(participants::uuid[])
    );

CREATE POLICY "Users can update conversations they participate in" ON public.conversations
    FOR UPDATE USING (
        auth.uid() = ANY(participants::uuid[])
    );

-- Fix messages table policies as well
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid() = ANY(participants::uuid[])
        )
    );

CREATE POLICY "Users can create messages in conversations they participate in" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid() = ANY(participants::uuid[])
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id
    );
