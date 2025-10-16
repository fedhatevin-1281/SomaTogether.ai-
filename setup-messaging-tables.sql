-- Setup messaging tables with proper relationships and indexes
-- This script ensures the messaging functionality works correctly

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type text DEFAULT 'direct'::text CHECK (type = ANY (ARRAY['direct'::text, 'group'::text, 'class'::text])),
  title text,
  class_id uuid,
  created_by uuid,
  participants uuid[] NOT NULL DEFAULT '{}',
  last_message_at timestamp with time zone DEFAULT now(),
  is_archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT conversations_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'assignment'::text, 'system'::text])),
  attachments jsonb DEFAULT '[]'::jsonb,
  reply_to_id uuid,
  is_edited boolean DEFAULT false,
  edited_at timestamp with time zone,
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id)
);

-- Create message_reads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamp with time zone DEFAULT now(),
  CONSTRAINT message_reads_pkey PRIMARY KEY (id),
  CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id),
  CONSTRAINT message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations (type);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON public.messages (is_deleted);

CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads (message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads (user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_read_at ON public.message_reads (read_at);

-- Create unique constraint for message_reads to prevent duplicate reads
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_reads_unique ON public.message_reads (message_id, user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
    DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;
    
    -- Create new policies
    CREATE POLICY "Users can view conversations they participate in" ON public.conversations
      FOR SELECT USING (auth.uid() = ANY(participants));

    CREATE POLICY "Users can create conversations" ON public.conversations
      FOR INSERT WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "Users can update conversations they participate in" ON public.conversations
      FOR UPDATE USING (auth.uid() = ANY(participants));
EXCEPTION
    WHEN undefined_object THEN
        -- Policies don't exist, create them
        CREATE POLICY "Users can view conversations they participate in" ON public.conversations
          FOR SELECT USING (auth.uid() = ANY(participants));

        CREATE POLICY "Users can create conversations" ON public.conversations
          FOR INSERT WITH CHECK (auth.uid() = created_by);

        CREATE POLICY "Users can update conversations they participate in" ON public.conversations
          FOR UPDATE USING (auth.uid() = ANY(participants));
END $$;

-- Create RLS policies for messages
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages to conversations they participate in" ON public.messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
    
    -- Create new policies
    CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.conversations 
          WHERE id = conversation_id 
          AND auth.uid() = ANY(participants)
        )
      );

    CREATE POLICY "Users can send messages to conversations they participate in" ON public.messages
      FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
          SELECT 1 FROM public.conversations 
          WHERE id = conversation_id 
          AND auth.uid() = ANY(participants)
        )
      );

    CREATE POLICY "Users can update their own messages" ON public.messages
      FOR UPDATE USING (auth.uid() = sender_id);
EXCEPTION
    WHEN undefined_object THEN
        -- Policies don't exist, create them
        CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.conversations 
              WHERE id = conversation_id 
              AND auth.uid() = ANY(participants)
            )
          );

        CREATE POLICY "Users can send messages to conversations they participate in" ON public.messages
          FOR INSERT WITH CHECK (
            auth.uid() = sender_id AND
            EXISTS (
              SELECT 1 FROM public.conversations 
              WHERE id = conversation_id 
              AND auth.uid() = ANY(participants)
            )
          );

        CREATE POLICY "Users can update their own messages" ON public.messages
          FOR UPDATE USING (auth.uid() = sender_id);
END $$;

-- Create RLS policies for message_reads
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own message reads" ON public.message_reads;
    DROP POLICY IF EXISTS "Users can create their own message reads" ON public.message_reads;
    DROP POLICY IF EXISTS "Users can update their own message reads" ON public.message_reads;
    
    -- Create new policies
    CREATE POLICY "Users can view their own message reads" ON public.message_reads
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own message reads" ON public.message_reads
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own message reads" ON public.message_reads
      FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN
        -- Policies don't exist, create them
        CREATE POLICY "Users can view their own message reads" ON public.message_reads
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can create their own message reads" ON public.message_reads
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own message reads" ON public.message_reads
          FOR UPDATE USING (auth.uid() = user_id);
END $$;

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update conversation's last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update last_message_at
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;
CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Insert some sample data for testing (optional)
-- This will only insert if no conversations exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.conversations LIMIT 1) THEN
        -- Insert sample conversations only if the table is empty
        INSERT INTO public.conversations (id, type, participants, created_by, title)
        VALUES 
            (
                uuid_generate_v4(),
                'direct',
                ARRAY[
                    (SELECT id FROM public.profiles WHERE role = 'student' LIMIT 1),
                    (SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1)
                ],
                (SELECT id FROM public.profiles WHERE role = 'student' LIMIT 1),
                'Sample Student-Teacher Chat'
            )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
