# Token Economy Implementation for SomaTogether.ai

## Overview

This document outlines the complete token economy system implemented for SomaTogether.ai, replacing the previous mock data system with a real token-based payment system.

## Token Pricing Structure

### Student Pricing
- **10 tokens = $1.00 USD**
- **1 token = $0.10 USD**
- Students pay for classes using tokens

### Teacher Pricing  
- **10 tokens = $0.40 USD** (earnings)
- **1 token = $0.04 USD** (earnings)
- Teachers earn tokens for completed classes

### Class Duration
- **1 hour class = 10 tokens**
- Tokens are deducted from student at class start
- Tokens are credited to teacher after 1 hour completion

## Database Schema

### Core Tables

#### `token_pricing`
- Stores pricing configuration for students and teachers
- Supports different rates for different user types

#### `token_wallets`
- User token balances (available and locked)
- One wallet per user

#### `token_transactions`
- All token movements (purchases, earnings, deductions, refunds)
- Complete audit trail with references to related entities

#### `class_sessions`
- Tracks class sessions with token management
- Records when tokens are deducted and credited
- Links to time tracking

#### `session_time_tracker`
- Live time tracking for active sessions
- Pause/resume functionality
- Accurate duration calculation

#### `payment_methods`
- Supports Stripe, M-Pesa, and bank transfers
- User-specific payment preferences

#### `withdrawal_requests`
- Teacher withdrawal requests
- Multi-provider support (Stripe, M-Pesa, bank transfer)

## Key Services

### TokenService (`src/services/tokenService.ts`)
Core service handling all token operations:

- **Wallet Management**: Create/get user wallets
- **Transaction Management**: Record all token movements
- **Class Session Management**: Start/complete sessions with token handling
- **Time Tracking**: Live session timing with pause/resume
- **Pricing Calculations**: Convert between tokens and USD

### TeacherWalletService (`src/services/teacherWalletService.ts`)
Teacher-specific wallet operations:

- **Earnings Tracking**: Monthly and lifetime earnings
- **Transaction History**: All teacher transactions with filtering
- **Withdrawal Management**: Create and track withdrawal requests
- **Statistics**: Comprehensive earnings analytics

### StudentWalletService (`src/services/studentWalletService.ts`)
Student-specific wallet operations:

- **Balance Management**: Token balance and spending tracking
- **Transaction History**: All student transactions
- **Class Affordability**: Check if student can afford classes
- **Purchase Requests**: Token purchase workflow

## Components

### TeacherWallet (`src/components/teacher/TeacherWallet.tsx`)
Updated teacher wallet interface:

- **Real Data Integration**: All mock data removed
- **Live Balance Display**: Real-time token/USD conversion
- **Transaction History**: Paginated, filterable transaction list
- **Analytics Dashboard**: Monthly earnings, growth tracking
- **Withdrawal Interface**: Multi-provider withdrawal support

### ClassTimeTracker (`src/components/shared/ClassTimeTracker.tsx`)
New component for live class timing:

- **Start/Pause/Resume**: Full session control
- **Live Timer**: Real-time duration tracking
- **Token Integration**: Automatic deduction/credit at start/completion
- **Visual Feedback**: Status indicators and progress tracking
- **Error Handling**: Comprehensive error management

## Token Flow

### Class Session Flow

1. **Session Start**:
   - Student tokens are deducted (10 tokens = $1.00)
   - Tokens are locked in student wallet
   - Session status changes to "started"
   - Time tracking begins

2. **During Session**:
   - Live timer tracks duration
   - Pause/resume functionality available
   - Tokens remain locked until completion

3. **Session Completion** (after 1 hour):
   - Teacher receives tokens (10 tokens = $0.40)
   - Tokens unlocked from student wallet
   - Session marked as "completed"
   - Transaction records created

### Withdrawal Flow

1. **Request Creation**:
   - Teacher requests USD withdrawal
   - Tokens converted to USD at teacher rate
   - Request queued for processing

2. **Processing**:
   - Integration with Stripe/M-Pesa
   - Real-time status updates
   - Automatic wallet updates

## Integration Points

### Stripe Integration
- **Payment Processing**: Token purchases and withdrawals
- **Webhook Handling**: Real-time transaction updates
- **Multi-Currency**: USD primary, expandable

### M-Pesa Integration (Prepared)
- **Mobile Payments**: Kenya and East Africa support
- **Instant Transfers**: Real-time payment processing
- **Phone Number Verification**: Secure transaction handling

### Time Tracking Integration
- **Live Sessions**: Real-time duration tracking
- **Pause/Resume**: Flexible session management
- **Automatic Completion**: 1-hour trigger for token credit

## Security Features

### Row Level Security (RLS)
- **User Isolation**: Users can only access their own data
- **Secure Transactions**: Protected token movements
- **Audit Trail**: Complete transaction history

### Token Validation
- **Balance Checks**: Prevent overdrafts
- **Session Validation**: Ensure proper token flow
- **Fraud Prevention**: Transaction monitoring

## API Endpoints

### Database Functions
- `create_user_token_wallet(user_uuid)`: Initialize user wallet
- `start_class_session(session_uuid, teacher_uuid, student_uuid)`: Begin session
- `complete_class_session(session_uuid)`: End session and credit teacher
- `get_token_pricing(user_type_param)`: Get current pricing

### Service Methods
- **Wallet Operations**: Get balance, transactions, stats
- **Session Management**: Start, pause, resume, complete
- **Payment Processing**: Purchase requests, withdrawals
- **Analytics**: Monthly reports, growth tracking

## Usage Examples

### Starting a Class
```typescript
const success = await tokenService.startClassSession(
  sessionId, 
  teacherId, 
  studentId, 
  classId
);
```

### Completing a Class
```typescript
const success = await tokenService.completeClassSession(sessionId);
```

### Checking Student Balance
```typescript
const affordability = await StudentWalletService.canAffordClass(
  studentId, 
  60 // 60 minutes
);
```

### Creating Withdrawal Request
```typescript
const result = await TeacherWalletService.createWithdrawalRequest(
  teacherId,
  100, // $100 USD
  paymentMethodId,
  'stripe'
);
```

## Migration Notes

### From Mock Data
- All hardcoded values removed
- Real Supabase integration implemented
- Proper error handling and loading states
- Live data updates

### Database Setup
1. Run `token-economy-schema.sql` to create tables
2. Insert initial pricing configuration
3. Enable RLS policies
4. Test with sample data

## Future Enhancements

### Planned Features
- **Bulk Token Purchases**: Discounted rates for large purchases
- **Subscription Plans**: Monthly token allowances
- **Referral System**: Bonus tokens for referrals
- **Gift Tokens**: Transfer tokens between users
- **Analytics Dashboard**: Advanced reporting for admins

### Payment Providers
- **M-Pesa**: Full integration for East Africa
- **Bank Transfers**: Direct bank account integration
- **Cryptocurrency**: Bitcoin/Ethereum support
- **Mobile Money**: Additional regional providers

## Monitoring & Analytics

### Key Metrics
- **Token Circulation**: Total tokens in system
- **Transaction Volume**: Daily/monthly transaction counts
- **User Engagement**: Active wallets and transactions
- **Revenue Tracking**: Platform fee collection

### Alerts
- **Low Balances**: Student wallet warnings
- **Failed Transactions**: Payment processing errors
- **Suspicious Activity**: Fraud detection
- **System Health**: Database and service monitoring

## Conclusion

The token economy system provides a robust, scalable foundation for SomaTogether.ai's payment infrastructure. With proper token pricing, comprehensive tracking, and multi-provider payment support, the system enables seamless transactions between students and teachers while maintaining platform sustainability through appropriate fee structures.

The implementation includes full audit trails, security measures, and real-time tracking capabilities, ensuring transparency and trust in all financial transactions.