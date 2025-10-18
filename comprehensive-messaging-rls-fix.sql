-- Comprehensive RLS fix for all messaging-related tables
-- This addresses all the RLS policy issues in the messaging system

-- ==============================================
-- CONVERSATIONS TABLE
-- ==============================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- Create policies using array contains operator
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (
        participants @> ARRAY[auth.uid()::text]
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        participants @> ARRAY[auth.uid()::text]
    );

CREATE POLICY "Users can update conversations they participate in" ON public.conversations
    FOR UPDATE USING (
        participants @> ARRAY[auth.uid()::text]
    );

-- ==============================================
-- MESSAGES TABLE
-- ==============================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create policies
CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND participants @> ARRAY[auth.uid()::text]
        )
    );

CREATE POLICY "Users can create messages in conversations they participate in" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND participants @> ARRAY[auth.uid()::text]
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id
    );

-- ==============================================
-- MESSAGE_READS TABLE
-- ==============================================
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own message reads" ON public.message_reads;
DROP POLICY IF EXISTS "Users can create their own message reads" ON public.message_reads;
DROP POLICY IF EXISTS "Users can update their own message reads" ON public.message_reads;

-- Create policies
CREATE POLICY "Users can view their own message reads" ON public.message_reads
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can create their own message reads" ON public.message_reads
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update their own message reads" ON public.message_reads
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================

-- Grant permissions on main tables
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.message_reads TO authenticated;

-- Grant select on related tables
GRANT SELECT ON public.profiles TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
