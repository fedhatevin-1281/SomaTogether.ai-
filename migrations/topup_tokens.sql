-- Script to add testing tokens to the student account: fedhatevin@gmail.com
-- This updates the account balance and inserts a transaction log so it shows up in the Student Wallet UI.

DO $$
DECLARE
    -- The user UUID for fedhatevin@gmail.com
    target_user_id uuid := '6866a752-f63f-4b73-87b9-38338917ad1a';
    target_wallet_id uuid;
    topup_amount integer := 1000;
BEGIN
    -- 1. Ensure the student record exists in the students table
    -- Some students might only have a profile record but not a student record yet
    INSERT INTO public.students (id, tokens)
    VALUES (target_user_id, 0)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Ensure the wallet record exists and get its ID
    INSERT INTO public.wallets (user_id, tokens, balance)
    VALUES (target_user_id, 0, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT id INTO target_wallet_id FROM public.wallets WHERE user_id = target_user_id;

    -- 3. Add tokens to the student's available balance in both tables for consistency
    UPDATE public.students
    SET tokens = COALESCE(tokens, 0) + topup_amount
    WHERE id = target_user_id;

    UPDATE public.wallets
    SET tokens = COALESCE(tokens, 0) + topup_amount
    WHERE id = target_wallet_id;

    -- 4. Insert transaction logs so it successfully appears in the UI
    INSERT INTO public.token_transactions (
        user_id,
        type,
        amount_tokens,
        amount_usd,
        token_rate,
        description,
        status
    )
    VALUES (
        target_user_id,
        'bonus',
        topup_amount,
        0.00,
        0.00,
        'Manual top-up for testing session request functionality',
        'completed'
    );

    -- Also insert into transactions table for the wallet UI
    INSERT INTO public.transactions (
        wallet_id,
        user_id,
        type,
        amount,
        currency,
        description,
        status
    )
    VALUES (
        target_wallet_id,
        target_user_id,
        'bonus',
        0.00,
        'USD',
        'Manual token top-up (1000 tokens)',
        'completed'
    );
    
    RAISE NOTICE 'Successfully topped up 1000 tokens for user %', target_user_id;
END $$;

