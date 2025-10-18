-- Efficient fix for array type issues using PostgreSQL array operators
-- This is the most efficient approach for handling the participants array

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- Create policies using array contains operator (@>)
-- This is more efficient than using ANY() with unnest()
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

-- Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
