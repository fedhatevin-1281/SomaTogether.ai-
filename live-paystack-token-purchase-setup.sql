-- Live Paystack Token Purchase Setup
-- This script ensures the token purchase process works correctly with live Paystack keys

-- 1. Update token_transactions table to support Paystack live payments
ALTER TABLE public.token_transactions 
ADD COLUMN IF NOT EXISTS paystack_transaction_id text,
ADD COLUMN IF NOT EXISTS paystack_reference text,
ADD COLUMN IF NOT EXISTS paystack_authorization_code text,
ADD COLUMN IF NOT EXISTS paystack_channel text,
ADD COLUMN IF NOT EXISTS paystack_gateway_response text,
ADD COLUMN IF NOT EXISTS paystack_currency text DEFAULT 'NGN',
ADD COLUMN IF NOT EXISTS paystack_amount_kobo integer;

-- 2. Update payment_methods table to support Paystack
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS paystack_customer_id text,
ADD COLUMN IF NOT EXISTS paystack_authorization_code text,
ADD COLUMN IF NOT EXISTS paystack_card_type text,
ADD COLUMN IF NOT EXISTS paystack_bank text,
ADD COLUMN IF NOT EXISTS paystack_country_code text;

-- 3. Update provider constraint to include Paystack
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

-- 4. Create Paystack payment sessions table
CREATE TABLE IF NOT EXISTS public.paystack_payment_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  reference text NOT NULL UNIQUE,
  amount_usd numeric NOT NULL,
  amount_ngn numeric NOT NULL,
  tokens integer NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
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

-- 5. Create Paystack webhook events table
CREATE TABLE IF NOT EXISTS public.paystack_webhook_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  paystack_event_id text NOT NULL UNIQUE,
  transaction_reference text,
  user_id uuid,
  amount_usd numeric,
  amount_ngn numeric,
  tokens integer,
  currency text,
  status text,
  raw_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paystack_webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT paystack_webhook_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_paystack_payment_sessions_reference 
ON public.paystack_payment_sessions(reference);

CREATE INDEX IF NOT EXISTS idx_paystack_payment_sessions_user_status 
ON public.paystack_payment_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_paystack_webhook_events_processed 
ON public.paystack_webhook_events(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_paystack_webhook_events_reference 
ON public.paystack_webhook_events(transaction_reference);

-- 7. Enable RLS on new tables
ALTER TABLE public.paystack_payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_webhook_events ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
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

-- Webhook events - only service role can access
CREATE POLICY "Service role can manage webhook events" ON public.paystack_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- 9. Create function to process Paystack payments
CREATE OR REPLACE FUNCTION process_paystack_payment(
  p_user_id uuid,
  p_reference text,
  p_amount_usd numeric,
  p_amount_ngn numeric,
  p_tokens integer,
  p_paystack_transaction_id text,
  p_currency text DEFAULT 'NGN'
)
RETURNS boolean AS $$
DECLARE
  v_wallet_id uuid;
  v_new_balance numeric;
  v_token_rate numeric;
BEGIN
  -- Get user's wallet
  SELECT id INTO v_wallet_id 
  FROM public.wallets 
  WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;
  
  -- Calculate token rate
  v_token_rate := p_amount_usd / p_tokens;
  
  -- Update wallet with new tokens
  UPDATE public.wallets 
  SET 
    tokens = tokens + p_tokens,
    balance = balance + p_amount_usd,
    updated_at = now()
  WHERE id = v_wallet_id;
  
  -- Get new balance
  SELECT balance INTO v_new_balance 
  FROM public.wallets 
  WHERE id = v_wallet_id;
  
  -- Create token transaction record
  INSERT INTO public.token_transactions (
    user_id,
    wallet_id,
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
    paystack_currency,
    paystack_amount_kobo,
    balance_after,
    transaction_type,
    metadata
  ) VALUES (
    p_user_id,
    v_wallet_id,
    'purchase',
    p_tokens,
    p_amount_usd,
    v_token_rate,
    'Token purchase via Paystack - ' || p_tokens || ' tokens',
    'purchase',
    'completed',
    p_reference,
    p_paystack_transaction_id,
    p_reference,
    p_currency,
    (p_amount_ngn * 100)::integer, -- Convert to kobo
    v_new_balance,
    'purchase',
    jsonb_build_object(
      'currency', p_currency,
      'amount_ngn', p_amount_ngn,
      'payment_method', 'paystack'
    )
  );
  
  -- Update payment session status
  UPDATE public.paystack_payment_sessions 
  SET 
    status = 'completed',
    paystack_transaction_id = p_paystack_transaction_id,
    updated_at = now()
  WHERE reference = p_reference;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to handle Paystack webhooks
CREATE OR REPLACE FUNCTION handle_paystack_webhook(
  p_event_data jsonb
)
RETURNS boolean AS $$
DECLARE
  v_event_type text;
  v_transaction_data jsonb;
  v_user_id uuid;
  v_reference text;
  v_amount_usd numeric;
  v_amount_ngn numeric;
  v_tokens integer;
  v_paystack_transaction_id text;
  v_currency text;
  v_status text;
BEGIN
  v_event_type := p_event_data->>'event';
  v_transaction_data := p_event_data->'data';
  
  -- Only process charge.success events
  IF v_event_type != 'charge.success' THEN
    RETURN false;
  END IF;
  
  -- Extract transaction details
  v_reference := v_transaction_data->>'reference';
  v_amount_ngn := (v_transaction_data->>'amount')::numeric / 100; -- Convert from kobo
  v_amount_usd := v_amount_ngn * 0.0007; -- Approximate USD conversion (adjust as needed)
  v_user_id := (v_transaction_data->'metadata'->>'user_id')::uuid;
  v_tokens := (v_transaction_data->'metadata'->>'tokens')::integer;
  v_paystack_transaction_id := v_transaction_data->>'id';
  v_currency := v_transaction_data->>'currency';
  v_status := v_transaction_data->>'status';
  
  -- Log webhook event
  INSERT INTO public.paystack_webhook_events (
    event_type,
    paystack_event_id,
    transaction_reference,
    user_id,
    amount_usd,
    amount_ngn,
    tokens,
    currency,
    status,
    raw_data
  ) VALUES (
    v_event_type,
    p_event_data->>'id',
    v_reference,
    v_user_id,
    v_amount_usd,
    v_amount_ngn,
    v_tokens,
    v_currency,
    v_status,
    p_event_data
  );
  
  -- Process the payment
  PERFORM process_paystack_payment(
    v_user_id,
    v_reference,
    v_amount_usd,
    v_amount_ngn,
    v_tokens,
    v_paystack_transaction_id,
    v_currency
  );
  
  -- Mark webhook as processed
  UPDATE public.paystack_webhook_events 
  SET processed = true, processed_at = now()
  WHERE paystack_event_id = p_event_data->>'id';
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to initialize Paystack payment
CREATE OR REPLACE FUNCTION initialize_paystack_payment(
  p_user_id uuid,
  p_amount_usd numeric,
  p_tokens integer,
  p_currency text DEFAULT 'NGN'
)
RETURNS jsonb AS $$
DECLARE
  v_reference text;
  v_amount_ngn numeric;
  v_session_id uuid;
  v_result jsonb;
BEGIN
  -- Generate unique reference
  v_reference := 'SOMA_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
  
  -- Convert USD to NGN (approximate rate, adjust as needed)
  v_amount_ngn := p_amount_usd * 1500; -- 1 USD = 1500 NGN (adjust as needed)
  
  -- Create payment session
  INSERT INTO public.paystack_payment_sessions (
    user_id,
    reference,
    amount_usd,
    amount_ngn,
    tokens,
    currency
  ) VALUES (
    p_user_id,
    v_reference,
    p_amount_usd,
    v_amount_ngn,
    p_tokens,
    p_currency
  ) RETURNING id INTO v_session_id;
  
  -- Return session data
  v_result := jsonb_build_object(
    'session_id', v_session_id,
    'reference', v_reference,
    'amount_usd', p_amount_usd,
    'amount_ngn', v_amount_ngn,
    'tokens', p_tokens,
    'currency', p_currency
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to verify Paystack payment
CREATE OR REPLACE FUNCTION verify_paystack_payment(
  p_reference text
)
RETURNS jsonb AS $$
DECLARE
  v_session record;
  v_result jsonb;
BEGIN
  -- Get payment session
  SELECT * INTO v_session
  FROM public.paystack_payment_sessions
  WHERE reference = p_reference;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Payment session not found');
  END IF;
  
  -- Return session status
  v_result := jsonb_build_object(
    'success', true,
    'status', v_session.status,
    'amount_usd', v_session.amount_usd,
    'amount_ngn', v_session.amount_ngn,
    'tokens', v_session.tokens,
    'currency', v_session.currency,
    'created_at', v_session.created_at
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 13. Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_paystack_payment(uuid, text, numeric, numeric, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION handle_paystack_webhook(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION initialize_paystack_payment(uuid, numeric, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION verify_paystack_payment(text) TO service_role;

-- 14. Create cleanup function for expired sessions
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

-- 15. Grant cleanup function permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_paystack_sessions() TO service_role;

-- 16. Insert live token pricing
INSERT INTO public.token_pricing (id, user_type, tokens_per_dollar, dollars_per_token, is_active) VALUES
  ('live-student-pricing', 'student', 10.0, 0.10, true),
  ('live-teacher-pricing', 'teacher', 25.0, 0.04, true)
ON CONFLICT (id) DO UPDATE SET
  tokens_per_dollar = EXCLUDED.tokens_per_dollar,
  dollars_per_token = EXCLUDED.dollars_per_token,
  is_active = EXCLUDED.is_active;

-- 17. Create view for payment analytics
CREATE OR REPLACE VIEW public.paystack_payment_analytics AS
SELECT 
  DATE(pps.created_at) as payment_date,
  COUNT(*) as total_payments,
  SUM(pps.amount_usd) as total_amount_usd,
  SUM(pps.amount_ngn) as total_amount_ngn,
  SUM(pps.tokens) as total_tokens,
  COUNT(CASE WHEN pps.status = 'completed' THEN 1 END) as successful_payments,
  COUNT(CASE WHEN pps.status = 'failed' THEN 1 END) as failed_payments,
  AVG(pps.amount_usd) as average_payment_amount_usd,
  AVG(pps.amount_ngn) as average_payment_amount_ngn
FROM public.paystack_payment_sessions pps
GROUP BY DATE(pps.created_at)
ORDER BY payment_date DESC;

-- Grant access to analytics view
GRANT SELECT ON public.paystack_payment_analytics TO authenticated;

-- Success message
SELECT 'Live Paystack token purchase setup completed successfully!' as message;
