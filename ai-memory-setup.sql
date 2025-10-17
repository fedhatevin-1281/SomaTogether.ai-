-- AI Memory Setup using existing tables
-- This script sets up AI memory functionality using conversations and messages tables

-- 1. Create a function to get or create AI conversation for a student
CREATE OR REPLACE FUNCTION get_or_create_ai_conversation(student_id uuid)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
  expires_at timestamp with time zone;
BEGIN
  -- Set expiration to 1 hour from now
  expires_at := now() + interval '1 hour';
  
  -- Try to find existing active AI conversation
  SELECT id INTO conversation_id
  FROM conversations 
  WHERE created_by = student_id 
    AND type = 'direct'
    AND metadata->>'ai_session' = 'true'
    AND (metadata->>'expires_at')::timestamp with time zone > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active conversation found, create new one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (
      type, 
      title, 
      created_by, 
      participants,
      metadata
    ) VALUES (
      'direct',
      'AI Assistant Chat',
      student_id,
      ARRAY[student_id],
      jsonb_build_object(
        'ai_session', true,
        'expires_at', expires_at,
        'created_at', now()
      )
    ) RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Create function to store AI Q&A pair
CREATE OR REPLACE FUNCTION store_ai_qa(
  student_id uuid,
  question text,
  answer text,
  subject text DEFAULT NULL,
  context text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
  question_id uuid;
  answer_id uuid;
  expires_at timestamp with time zone;
BEGIN
  -- Get or create conversation
  conversation_id := get_or_create_ai_conversation(student_id);
  
  -- Set expiration
  expires_at := now() + interval '1 hour';
  
  -- Store question
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    metadata
  ) VALUES (
    conversation_id,
    student_id,
    question,
    'text',
    jsonb_build_object(
      'role', 'user',
      'subject', subject,
      'context', context,
      'timestamp', now(),
      'expires_at', expires_at
    )
  ) RETURNING id INTO question_id;
  
  -- Store answer (using a special AI user ID - you can create this in auth.users)
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    metadata
  ) VALUES (
    conversation_id,
    '00000000-0000-0000-0000-000000000000', -- AI user ID
    answer,
    'text',
    jsonb_build_object(
      'role', 'ai',
      'subject', subject,
      'context', context,
      'timestamp', now(),
      'expires_at', expires_at,
      'question_id', question_id
    )
  ) RETURNING id INTO answer_id;
  
  -- Update conversation metadata with new expiration
  UPDATE conversations 
  SET metadata = metadata || jsonb_build_object('expires_at', expires_at),
      last_message_at = now()
  WHERE id = conversation_id;
  
  RETURN answer_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to get recent AI conversation context
CREATE OR REPLACE FUNCTION get_ai_conversation_context(student_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(
  question text,
  answer text,
  subject text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  WITH ai_messages AS (
    SELECT 
      m.content,
      m.metadata,
      m.created_at,
      ROW_NUMBER() OVER (ORDER BY m.created_at DESC) as rn
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.created_by = student_id 
      AND c.type = 'direct'
      AND c.metadata->>'ai_session' = 'true'
      AND (c.metadata->>'expires_at')::timestamp with time zone > now()
      AND m.created_at > (now() - interval '1 hour')
    ORDER BY m.created_at DESC
    LIMIT limit_count * 2 -- Get both questions and answers
  ),
  paired_messages AS (
    SELECT 
      q.content as question,
      a.content as answer,
      COALESCE(q.metadata->>'subject', '') as subject,
      q.created_at
    FROM ai_messages q
    JOIN ai_messages a ON a.rn = q.rn - 1
    WHERE q.metadata->>'role' = 'user'
      AND a.metadata->>'role' = 'ai'
      AND a.metadata->>'question_id' = q.id::text
  )
  SELECT * FROM paired_messages
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to clean up expired AI conversations
CREATE OR REPLACE FUNCTION cleanup_expired_ai_conversations()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete expired AI conversations and their messages
  WITH expired_conversations AS (
    SELECT id 
    FROM conversations 
    WHERE type = 'direct'
      AND metadata->>'ai_session' = 'true'
      AND (metadata->>'expires_at')::timestamp with time zone <= now()
  )
  DELETE FROM messages 
  WHERE conversation_id IN (SELECT id FROM expired_conversations);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM conversations 
  WHERE type = 'direct'
    AND metadata->>'ai_session' = 'true'
    AND (metadata->>'expires_at')::timestamp with time zone <= now();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a scheduled job to clean up expired conversations (if using pg_cron)
-- This would run every 15 minutes to clean up expired AI conversations
-- SELECT cron.schedule('cleanup-ai-memory', '*/15 * * * *', 'SELECT cleanup_expired_ai_conversations();');

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_or_create_ai_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION store_ai_qa(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_conversation_context(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_ai_conversations() TO service_role;
