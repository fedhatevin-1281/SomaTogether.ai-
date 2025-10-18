-- Simple fix for array type issues in conversations table
-- This works with the existing schema without altering table structure

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- Create policies that work with the existing ARRAY type
-- We'll cast the array elements to uuid for comparison
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (
        auth.uid()::text = ANY(SELECT unnest(participants)::text)
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        auth.uid()::text = ANY(SELECT unnest(participants)::text)
    );

CREATE POLICY "Users can update conversations they participate in" ON public.conversations
    FOR UPDATE USING (
        auth.uid()::text = ANY(SELECT unnest(participants)::text)
    );

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on messages table
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create policies for messages table
CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid()::text = ANY(SELECT unnest(participants)::text)
        )
    );

CREATE POLICY "Users can create messages in conversations they participate in" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND auth.uid()::text = ANY(SELECT unnest(participants)::text)
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id
    );

-- Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
