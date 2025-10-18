-- Fix conversations table participants array type
-- This addresses the "operator does not exist: text = uuid" error by properly defining the array type

-- First, let's check the current type of the participants column
-- and fix it if needed

-- Step 1: Check if we need to alter the column type
-- The participants field should be uuid[] not just ARRAY
DO $$
BEGIN
    -- Check if the participants column exists and what type it is
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND column_name = 'participants'
    ) THEN
        -- Alter the column to explicitly be uuid[]
        ALTER TABLE public.conversations 
        ALTER COLUMN participants TYPE uuid[] USING participants::uuid[];
        
        -- Add a NOT NULL constraint if it doesn't exist
        ALTER TABLE public.conversations 
        ALTER COLUMN participants SET NOT NULL;
    END IF;
END $$;

-- Step 2: Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies that might have type issues
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- Step 4: Create new policies with correct type handling
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

-- Step 5: Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies on messages table
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Step 7: Create new policies for messages table
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

-- Step 8: Grant necessary permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 9: Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversations' 
AND column_name = 'participants';
