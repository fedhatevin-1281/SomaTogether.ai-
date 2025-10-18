-- Fix RLS policies for message_reads table
-- This addresses the 403 Forbidden error when marking messages as read

-- Enable RLS on message_reads table
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own message reads" ON public.message_reads;
DROP POLICY IF EXISTS "Users can create their own message reads" ON public.message_reads;
DROP POLICY IF EXISTS "Users can update their own message reads" ON public.message_reads;

-- Create policies for message_reads table
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

-- Grant permissions
GRANT ALL ON public.message_reads TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
