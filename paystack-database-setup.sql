-- Paystack Integration Database Setup
-- Run this script in your Supabase SQL editor to enable Paystack payments

-- 1. Update payment_methods table to include Paystack
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS paystack_customer_id text,
ADD COLUMN IF NOT EXISTS paystack_authorization_code text,
ADD COLUMN IF NOT EXISTS paystack_card_type text,
ADD COLUMN IF NOT EXISTS paystack_bank text,
ADD COLUMN IF NOT EXISTS paystack_country_code text;

-- 2. Update the provider check constraint to include Paystack
ALTER TABLE public.payment_methods 
DROP CONSTRAINT IF EXISTS payment_methods_provider_check;

ALTER TABLE public.payment_methods 
ADD CONSTRAINT payment_methods_provider_check 
CHECK (provider = ANY (ARRAY[
  'stripe'::text, 
  'paypal'::text, 
  'wise'::text, 
  'binance'::text, 
  'mpesa'::text, 
  'bank_transfer'::text,
  'paystack'::text
]));

-- 3. Add Paystack-specific columns to token_transactions
ALTER TABLE public.token_transactions 
ADD COLUMN IF NOT EXISTS paystack_transaction_id text,
ADD COLUMN IF NOT EXISTS paystack_reference text,
ADD COLUMN IF NOT EXISTS paystack_authorization_code text,
ADD COLUMN IF NOT EXISTS paystack_channel text,
ADD COLUMN IF NOT EXISTS paystack_gateway_response text;

-- 4. Create Paystack webhook events table for tracking
CREATE TABLE IF NOT EXISTS public.paystack_webhook_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  paystack_event_id text NOT NULL UNIQUE,
  transaction_reference text,
  user_id uuid,
  amount numeric,
  currency text,
  status text,
  raw_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paystack_webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT paystack_webhook_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 5. Create index for efficient webhook processing
CREATE INDEX IF NOT EXISTS idx_paystack_webhook_events_processed 
ON public.paystack_webhook_events(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_paystack_webhook_events_reference 
ON public.paystack_webhook_events(transaction_reference);

-- 6. Create Paystack payment sessions table for tracking payment flows
CREATE TABLE IF NOT EXISTS public.paystack_payment_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  reference text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  tokens integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'processing'::text, 
    'completed'::text, 
    'failed'::text, 
    'cancelled'::text
  ])),
  authorization_url text,
  access_code text,
  paystack_transaction_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone DEFAULT (now() + interval '30 minutes'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paystack_payment_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT paystack_payment_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 7. Create index for payment session lookups
CREATE INDEX IF NOT EXISTS idx_paystack_payment_sessions_reference 
ON public.paystack_payment_sessions(reference);

CREATE INDEX IF NOT EXISTS idx_paystack_payment_sessions_user_status 
ON public.paystack_payment_sessions(user_id, status);

-- 8. Add RLS policies for Paystack tables
ALTER TABLE public.paystack_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_payment_sessions ENABLE ROW LEVEL SECURITY;

-- Webhook events - only service role can access
CREATE POLICY "Service role can manage webhook events" ON public.paystack_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Payment sessions - users can only see their own
CREATE POLICY "Users can view own payment sessions" ON public.paystack_payment_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment sessions" ON public.paystack_payment_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment sessions" ON public.paystack_payment_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all payment sessions
CREATE POLICY "Service role can manage all payment sessions" ON public.paystack_payment_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- 9. Create function to clean up expired payment sessions
CREATE OR REPLACE FUNCTION cleanup_expired_paystack_sessions()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.paystack_payment_sessions 
  WHERE expires_at < now() 
    AND status IN ('pending', 'processing');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to process Paystack webhook events
CREATE OR REPLACE FUNCTION process_paystack_webhook_event(
  event_data jsonb
)
RETURNS boolean AS $$
DECLARE
  event_type text;
  transaction_data jsonb;
  user_id uuid;
  reference text;
  amount numeric;
  tokens integer;
BEGIN
  event_type := event_data->>'event';
  transaction_data := event_data->'data';
  
  -- Only process charge.success events
  IF event_type != 'charge.success' THEN
    RETURN false;
  END IF;
  
  -- Extract transaction details
  reference := transaction_data->>'reference';
  amount := (transaction_data->>'amount')::numeric / 100; -- Convert from kobo
  user_id := (transaction_data->'metadata'->>'user_id')::uuid;
  tokens := (transaction_data->'metadata'->>'tokens')::integer;
  
  -- Update payment session status
  UPDATE public.paystack_payment_sessions 
  SET status = 'completed',
      paystack_transaction_id = transaction_data->>'id',
      updated_at = now()
  WHERE reference = process_paystack_webhook_event.reference;
  
  -- Add tokens to user wallet
  UPDATE public.wallets 
  SET tokens = tokens + process_paystack_webhook_event.tokens,
      updated_at = now()
  WHERE user_id = process_paystack_webhook_event.user_id;
  
  -- Create transaction record
  INSERT INTO public.token_transactions (
    user_id,
    type,
    amount_tokens,
    amount_usd,
    token_rate,
    description,
    related_entity_type,
    status,
    reference_id,
    paystack_transaction_id,
    paystack_reference,
    paystack_channel,
    paystack_gateway_response,
    metadata
  ) VALUES (
    process_paystack_webhook_event.user_id,
    'purchase',
    process_paystack_webhook_event.tokens,
    process_paystack_webhook_event.amount,
    process_paystack_webhook_event.amount / process_paystack_webhook_event.tokens,
    'Token purchase via Paystack - ' || process_paystack_webhook_event.tokens || ' tokens',
    'purchase',
    'completed',
    process_paystack_webhook_event.reference,
    transaction_data->>'id',
    process_paystack_webhook_event.reference,
    transaction_data->>'channel',
    transaction_data->>'gateway_response',
    jsonb_build_object(
      'paystack_event_id', event_data->>'id',
      'currency', transaction_data->>'currency',
      'payment_method', 'paystack'
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_paystack_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION process_paystack_webhook_event(jsonb) TO service_role;

-- 12. Create view for Paystack payment analytics
CREATE OR REPLACE VIEW public.paystack_payment_analytics AS
SELECT 
  DATE(pps.created_at) as payment_date,
  COUNT(*) as total_payments,
  SUM(pps.amount) as total_amount,
  SUM(pps.tokens) as total_tokens,
  COUNT(CASE WHEN pps.status = 'completed' THEN 1 END) as successful_payments,
  COUNT(CASE WHEN pps.status = 'failed' THEN 1 END) as failed_payments,
  AVG(pps.amount) as average_payment_amount
FROM public.paystack_payment_sessions pps
GROUP BY DATE(pps.created_at)
ORDER BY payment_date DESC;

-- Grant access to analytics view
GRANT SELECT ON public.paystack_payment_analytics TO authenticated;

-- 13. Insert sample education systems and levels for testing
INSERT INTO public.education_systems (id, name, description, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Kenyan CBC', 'Competency Based Curriculum', true),
  ('550e8400-e29b-41d4-a716-446655440002', '8-4-4 System', 'Traditional 8-4-4 Education System', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'International', 'International Curriculum (IB, Cambridge, etc.)', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.education_levels (id, system_id, level_name, description, order_index) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Grade 1', 'CBC Grade 1', 1),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Grade 2', 'CBC Grade 2', 2),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Grade 3', 'CBC Grade 3', 3),
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Grade 4', 'CBC Grade 4', 4),
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Grade 5', 'CBC Grade 5', 5),
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Grade 6', 'CBC Grade 6', 6),
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'Grade 7', 'CBC Grade 7', 7),
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 'Grade 8', 'CBC Grade 8', 8),
  ('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 'Grade 9', 'CBC Grade 9', 9),
  ('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Grade 10', 'CBC Grade 10', 10),
  ('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Grade 11', 'CBC Grade 11', 11),
  ('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Grade 12', 'CBC Grade 12', 12)
ON CONFLICT (id) DO NOTHING;

-- 14. Insert sample subjects for testing
INSERT INTO public.subjects (id, name, description, category, is_active) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', 'Mathematics', 'Mathematics and Statistics', 'Core', true),
  ('750e8400-e29b-41d4-a716-446655440002', 'English', 'English Language and Literature', 'Core', true),
  ('750e8400-e29b-41d4-a716-446655440003', 'Kiswahili', 'Kiswahili Language and Literature', 'Core', true),
  ('750e8400-e29b-41d4-a716-446655440004', 'Science', 'General Science', 'Core', true),
  ('750e8400-e29b-41d4-a716-446655440005', 'Social Studies', 'Social Studies and Citizenship', 'Core', true),
  ('750e8400-e29b-41d4-a716-446655440006', 'Physics', 'Physics', 'Sciences', true),
  ('750e8400-e29b-41d4-a716-446655440007', 'Chemistry', 'Chemistry', 'Sciences', true),
  ('750e8400-e29b-41d4-a716-446655440008', 'Biology', 'Biology', 'Sciences', true),
  ('750e8400-e29b-41d4-a716-446655440009', 'History', 'History', 'Humanities', true),
  ('750e8400-e29b-41d4-a716-446655440010', 'Geography', 'Geography', 'Humanities', true),
  ('750e8400-e29b-41d4-a716-446655440011', 'Computer Studies', 'Computer Studies and ICT', 'Technology', true),
  ('750e8400-e29b-41d4-a716-446655440012', 'Business Studies', 'Business Studies', 'Commerce', true)
ON CONFLICT (id) DO NOTHING;

-- 15. Insert token pricing for students and teachers
INSERT INTO public.token_pricing (id, user_type, tokens_per_dollar, dollars_per_token, is_active) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', 'student', 10.0, 0.10, true),
  ('850e8400-e29b-41d4-a716-446655440002', 'teacher', 25.0, 0.04, true)
ON CONFLICT (id) DO NOTHING;

-- 16. Create student preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.student_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  class_reminders boolean DEFAULT true,
  assignment_due_reminders boolean DEFAULT true,
  teacher_messages boolean DEFAULT true,
  weekly_progress_reports boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility = ANY (ARRAY['public', 'private', 'teachers_only'])),
  show_online_status boolean DEFAULT true,
  allow_teacher_contact boolean DEFAULT true,
  share_progress_with_parents boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT student_preferences_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

-- 17. Enable RLS on student_preferences
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;

-- 18. Create RLS policies for student_preferences
CREATE POLICY "Students can view own preferences" ON public.student_preferences
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update own preferences" ON public.student_preferences
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own preferences" ON public.student_preferences
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 19. Create teacher preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teacher_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  teacher_id uuid NOT NULL UNIQUE,
  preferred_student_ages text[] DEFAULT '{}',
  preferred_class_duration integer DEFAULT 60,
  max_students_per_class integer DEFAULT 1,
  auto_accept_bookings boolean DEFAULT false,
  require_student_approval boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  timezone text DEFAULT 'UTC',
  working_hours jsonb DEFAULT '{}',
  vacation_mode boolean DEFAULT false,
  vacation_start_date date,
  vacation_end_date date,
  preferred_payment_method text DEFAULT 'stripe' CHECK (preferred_payment_method = ANY (ARRAY['stripe', 'mpesa', 'bank_transfer', 'paystack'])),
  auto_withdraw boolean DEFAULT false,
  withdraw_threshold numeric DEFAULT 100.00,
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility = ANY (ARRAY['public', 'private', 'students_only'])),
  show_contact_info boolean DEFAULT false,
  show_social_links boolean DEFAULT true,
  show_verification_badges boolean DEFAULT true,
  language text DEFAULT 'en',
  date_format text DEFAULT 'MM/DD/YYYY',
  time_format text DEFAULT '12h',
  currency text DEFAULT 'USD',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_preferences_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);

-- 20. Enable RLS on teacher_preferences
ALTER TABLE public.teacher_preferences ENABLE ROW LEVEL SECURITY;

-- 21. Create RLS policies for teacher_preferences
CREATE POLICY "Teachers can view own preferences" ON public.teacher_preferences
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own preferences" ON public.teacher_preferences
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own preferences" ON public.teacher_preferences
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- 22. Update withdrawal_requests to include Paystack
ALTER TABLE public.withdrawal_requests 
DROP CONSTRAINT IF EXISTS withdrawal_requests_provider_check;

ALTER TABLE public.withdrawal_requests 
ADD CONSTRAINT withdrawal_requests_provider_check 
CHECK (provider = ANY (ARRAY['stripe'::text, 'mpesa'::text, 'bank_transfer'::text, 'paystack'::text]));

-- 23. Create function to automatically create user preferences on signup
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Create student preferences if user is a student
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_preferences (student_id)
    VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;
  END IF;
  
  -- Create teacher preferences if user is a teacher
  IF NEW.role = 'teacher' THEN
    INSERT INTO public.teacher_preferences (teacher_id)
    VALUES (NEW.id)
    ON CONFLICT (teacher_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 24. Create trigger to automatically create preferences
DROP TRIGGER IF EXISTS create_user_preferences_trigger ON public.profiles;
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- 25. Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_preferences() TO service_role;

-- Success message
SELECT 'Paystack integration database setup completed successfully!' as message;
