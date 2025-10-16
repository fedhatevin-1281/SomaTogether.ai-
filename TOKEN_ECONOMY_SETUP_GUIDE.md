# Token Economy Setup Guide - SomaTogether.ai

## Overview

This guide will help you set up the integrated token economy system that works with your existing Supabase schema. The system has been designed to enhance your current tables rather than replace them, ensuring no data loss and seamless integration.

## 🚀 Quick Setup

### Step 1: Run the Database Schema

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `token-economy-integrated-schema.sql`
3. Execute the script
4. Verify the setup with the verification queries at the bottom of the script

### Step 2: Verify Installation

Run these queries in Supabase to verify everything is working:

```sql
-- Check if new columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallets' 
AND column_name IN ('token_balance', 'locked_balance');

-- Check token pricing
SELECT * FROM public.token_pricing WHERE is_active = true;

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_user_token_wallet', 'start_class_session', 'complete_class_session');
```

## 📊 Token Economy Structure

### Pricing Configuration
- **Students**: 10 tokens = $1.00 USD
- **Teachers**: 10 tokens = $0.40 USD (earnings)
- **Platform**: $0.60 USD per 10-token class (60% commission)

### Enhanced Tables

#### `wallets` (Enhanced)
- ✅ `token_balance` - User's available tokens
- ✅ `locked_balance` - Tokens locked for ongoing sessions
- ✅ Existing `balance` column remains for USD amounts

#### `class_sessions` (Enhanced)
- ✅ `tokens_charged` - Tokens required for session (default: 10)
- ✅ `tokens_deducted_at` - When tokens were deducted from student
- ✅ `tokens_credited_at` - When tokens were credited to teacher
- ✅ `teacher_earning_usd` - USD amount teacher earned
- ✅ `student_cost_usd` - USD amount student paid

#### `token_transactions` (Enhanced)
- ✅ `wallet_id` - Links to wallet
- ✅ `balance_after` - Balance after transaction
- ✅ `transaction_type` - Specific transaction type
- ✅ Works with existing `type`, `amount_tokens`, `amount_usd` columns

#### `payment_methods` (Enhanced)
- ✅ `phone_number` - For M-Pesa integration
- ✅ `mpesa_account_name` - M-Pesa account details
- ✅ `stripe_payment_method_id` - Stripe integration
- ✅ `stripe_account_id` - Stripe account linking

#### `withdrawal_requests` (Enhanced)
- ✅ `wallet_id` - Links to wallet
- ✅ `tokens_to_convert` - Tokens being converted
- ✅ `conversion_rate` - Rate used for conversion
- ✅ `provider` - Payment provider (stripe, mpesa, bank_transfer)

### New Tables

#### `token_pricing`
- Configuration for token rates
- Supports different rates for students vs teachers

#### `session_time_tracker`
- Live session timing
- Pause/resume functionality
- Accurate duration tracking

## 🔧 API Functions

### Core Functions

#### `create_user_token_wallet(user_uuid)`
- Creates or enhances user wallet
- Adds token_balance and locked_balance columns
- Returns wallet ID

#### `start_class_session(session_uuid, teacher_uuid, student_uuid, class_uuid)`
- Deducts 10 tokens from student
- Locks tokens in student wallet
- Starts time tracking
- Updates session status to 'in_progress'

#### `complete_class_session(session_uuid)`
- Credits 10 tokens to teacher
- Unlocks tokens from student wallet
- Stops time tracking
- Updates session status to 'completed'
- Records platform earnings

#### `get_token_pricing(user_type_param)`
- Returns current token pricing
- Supports 'student' and 'teacher' types

## 💻 Frontend Integration

### Updated Services

#### `TokenService` (`src/services/tokenService.ts`)
- Works with existing `wallets` table
- Uses enhanced `token_transactions` table
- Integrates with `class_sessions` for token flow

#### `TeacherWalletService` (`src/services/teacherWalletService.ts`)
- Displays token balance and USD equivalent
- Shows real transaction history
- Handles withdrawal requests

#### `StudentWalletService` (`src/services/studentWalletService.ts`)
- Manages student token purchases
- Tracks class affordability
- Shows spending analytics

### Updated Components

#### `TeacherWallet` (`src/components/teacher/TeacherWallet.tsx`)
- ✅ All mock data removed
- ✅ Real Supabase integration
- ✅ Token balance display
- ✅ USD conversion for earnings
- ✅ Real transaction history

#### `ClassTimeTracker` (`src/components/shared/ClassTimeTracker.tsx`)
- ✅ Live session timing
- ✅ Automatic token deduction/credit
- ✅ Pause/resume functionality
- ✅ Visual progress indicators

## 🔄 Token Flow Example

### Starting a Class Session

```typescript
// 1. Student initiates class
const success = await tokenService.startClassSession(
  sessionId, 
  teacherId, 
  studentId, 
  classId
);

// This will:
// - Deduct 10 tokens from student
// - Lock tokens in student wallet
// - Start time tracking
// - Update session status
```

### Completing a Class Session

```typescript
// 2. After 1 hour, complete session
const success = await tokenService.completeClassSession(sessionId);

// This will:
// - Credit 10 tokens to teacher ($0.40)
// - Unlock tokens from student wallet
// - Record platform earnings ($0.60)
// - Update session status
```

### Withdrawal Request

```typescript
// 3. Teacher requests withdrawal
const result = await TeacherWalletService.createWithdrawalRequest(
  teacherId,
  100, // $100 USD
  paymentMethodId,
  'stripe'
);

// This will:
// - Convert tokens to USD at teacher rate
// - Create withdrawal request
// - Integrate with Stripe for processing
```

## 🎯 Key Features

### Real-time Balance Updates
- Token balances update immediately
- USD conversions show current rates
- Locked balances prevent double-spending

### Comprehensive Tracking
- Complete audit trail of all token movements
- Platform earnings automatically calculated
- Session timing with pause/resume

### Multi-provider Payments
- Stripe integration ready
- M-Pesa support prepared
- Bank transfer capability

### Security & Validation
- Row-level security on all tables
- Balance checks prevent overdrafts
- Session validation ensures proper flow

## 🔍 Testing the System

### Test User Setup

1. Create test users in Supabase
2. Run wallet creation function
3. Add test tokens to wallets
4. Test class session flow

### Sample Test Data

```sql
-- Create test wallets with tokens
INSERT INTO public.wallets (user_id, balance, token_balance, locked_balance) 
VALUES 
  ('test-student-id', 0.00, 100.00, 0.00),
  ('test-teacher-id', 0.00, 50.00, 0.00);

-- Test token pricing
SELECT * FROM public.get_token_pricing('student');
SELECT * FROM public.get_token_pricing('teacher');
```

### Frontend Testing

1. Navigate to Teacher Wallet
2. Verify real data display
3. Test transaction history
4. Check withdrawal interface
5. Test class session tracker

## 🚨 Troubleshooting

### Common Issues

#### "Wallet not found" Error
- Run `create_user_token_wallet` function
- Check user_id exists in profiles table

#### "Insufficient balance" Error
- Verify student has enough tokens
- Check locked_balance vs token_balance

#### Transaction Not Appearing
- Verify RLS policies are correct
- Check user authentication
- Confirm transaction was actually created

### Debug Queries

```sql
-- Check wallet status
SELECT * FROM public.wallets WHERE user_id = 'your-user-id';

-- Check recent transactions
SELECT * FROM public.token_transactions 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check session status
SELECT id, status, tokens_charged, tokens_deducted_at, tokens_credited_at 
FROM public.class_sessions 
WHERE student_id = 'your-user-id' 
ORDER BY created_at DESC;
```

## 📈 Analytics & Monitoring

### Key Metrics to Track

1. **Token Circulation**
   - Total tokens in system
   - Average wallet balance
   - Token velocity (transactions per day)

2. **Revenue Tracking**
   - Platform commission per session
   - Monthly platform earnings
   - Teacher earnings distribution

3. **User Engagement**
   - Active wallets
   - Transaction frequency
   - Session completion rates

### Monitoring Queries

```sql
-- Platform earnings summary
SELECT 
  COUNT(*) as total_sessions,
  SUM(student_cost_usd) as total_student_payments,
  SUM(teacher_earning_usd) as total_teacher_earnings,
  SUM(student_cost_usd - teacher_earning_usd) as platform_commission
FROM public.class_sessions 
WHERE status = 'completed' 
AND tokens_credited_at IS NOT NULL;

-- Token distribution
SELECT 
  COUNT(*) as total_wallets,
  SUM(token_balance) as total_tokens,
  AVG(token_balance) as average_balance,
  SUM(locked_balance) as locked_tokens
FROM public.wallets;
```

## 🎉 Success Criteria

Your token economy system is successfully set up when:

- ✅ All database tables are created and enhanced
- ✅ Functions execute without errors
- ✅ Teacher wallet shows real data
- ✅ Class sessions deduct/credit tokens correctly
- ✅ Time tracker works with live sessions
- ✅ Transaction history displays properly
- ✅ Withdrawal requests can be created
- ✅ RLS policies protect user data

## 🔮 Next Steps

1. **Payment Integration**: Connect Stripe and M-Pesa APIs
2. **Advanced Analytics**: Build comprehensive dashboards
3. **Mobile Support**: Optimize for mobile token management
4. **Automated Testing**: Create test suites for token flows
5. **Performance Optimization**: Monitor and optimize queries

The token economy system is now ready for production use with your existing Supabase setup! 🚀
