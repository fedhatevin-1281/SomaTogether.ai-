-- Paystack Integration Database Updates
-- This script adds Paystack support to the existing payment system

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
