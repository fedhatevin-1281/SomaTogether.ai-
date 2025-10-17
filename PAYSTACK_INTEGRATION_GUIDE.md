# 🚀 Paystack Integration Guide for SomaTogether.ai

## 📋 **Overview**

This guide explains how to integrate Paystack payment processing into your SomaTogether.ai platform. Paystack provides excellent payment solutions for African markets with support for cards, bank transfers, and mobile money.

## 🔧 **Setup Instructions**

### **1. Environment Variables**

Add these environment variables to your `.env` file:

```bash
# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
VITE_PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

### **2. Database Setup**

Run the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the content from paystack-database-update.sql
```

This will:
- ✅ Add Paystack support to existing tables
- ✅ Create new Paystack-specific tables
- ✅ Set up RLS policies
- ✅ Create helper functions

### **3. Paystack Account Setup**

1. **Create Paystack Account**
   - Go to [paystack.com](https://paystack.com)
   - Sign up for a developer account
   - Complete business verification

2. **Get API Keys**
   - Go to Settings > API Keys & Webhooks
   - Copy your Test/Live public and secret keys
   - Add them to your environment variables

3. **Configure Webhooks**
   - Go to Settings > API Keys & Webhooks
   - Add webhook URL: `https://yourdomain.com/api/paystack/webhook`
   - Select events: `charge.success`, `charge.failed`, `transfer.success`, `transfer.failed`

## 🎯 **Features Implemented**

### **✅ Payment Processing**
- **Multi-currency Support**: NGN, GHS, ZAR, KES, USD
- **Multiple Payment Methods**: Cards, Bank Transfer, Mobile Money
- **Real-time Verification**: Automatic payment confirmation
- **Secure Processing**: PCI DSS compliant

### **✅ User Experience**
- **Payment Method Selection**: Choose between Paystack, Stripe, M-Pesa
- **Currency Conversion**: Automatic USD to local currency conversion
- **Payment Status Tracking**: Real-time payment status updates
- **Error Handling**: Comprehensive error messages and fallbacks

### **✅ Backend Integration**
- **Webhook Processing**: Automatic payment confirmation
- **Database Integration**: Complete transaction tracking
- **Session Management**: Payment session tracking with expiration
- **Analytics**: Payment statistics and reporting

## 🔄 **Payment Flow**

### **1. Student Token Purchase**
```
Student selects Paystack → Payment form → Paystack checkout → 
Webhook confirmation → Tokens added to wallet
```

### **2. Payment Verification**
```
Payment initiated → Paystack processes → Webhook received → 
Database updated → Student notified
```

## 📱 **Usage Examples**

### **Frontend Integration**
```typescript
import { PaymentMethodSelector } from './components/payment/PaymentMethodSelector';

function TokenPurchase() {
  const handlePaymentSuccess = (reference: string, method: string) => {
    console.log('Payment successful:', reference, method);
    // Handle success
  };

  return (
    <PaymentMethodSelector
      amount={10.00}
      tokens={100}
      onSuccess={handlePaymentSuccess}
      onError={(error) => console.error(error)}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

### **Backend API Usage**
```typescript
import { PaymentService } from './services/paymentService';

// Initialize payment
const result = await PaymentService.initializePaystackPayment(
  userId,
  userEmail,
  amount,
  tokens,
  'NGN'
);

// Verify payment
const verification = await PaymentService.verifyPaystackPayment(reference);
```

## 🌍 **Supported Countries & Currencies**

| Country | Currency | Code | Status |
|---------|----------|------|--------|
| Nigeria | Naira | NGN | ✅ Active |
| Ghana | Cedi | GHS | ✅ Active |
| South Africa | Rand | ZAR | ✅ Active |
| Kenya | Shilling | KES | ✅ Active |
| Global | US Dollar | USD | ✅ Active |

## 💳 **Payment Methods Supported**

### **Cards**
- Visa
- Mastercard
- Verve (Nigeria)
- Local bank cards

### **Bank Transfer**
- Direct bank transfer
- USSD codes
- Internet banking

### **Mobile Money**
- MTN Mobile Money
- Airtel Money
- Vodafone Cash
- M-Pesa (Kenya)

## 🔒 **Security Features**

### **Webhook Security**
- Signature verification
- Event validation
- Duplicate prevention
- Error handling

### **Data Protection**
- PCI DSS compliance
- Encrypted data transmission
- Secure API keys
- RLS policies

## 📊 **Analytics & Monitoring**

### **Payment Analytics**
```sql
-- View payment statistics
SELECT * FROM paystack_payment_analytics;

-- Check webhook processing
SELECT * FROM paystack_webhook_events 
WHERE processed = false;
```

### **Monitoring Endpoints**
- `GET /api/paystack/stats` - Payment statistics
- `GET /api/paystack/webhook-stats` - Webhook processing stats
- `GET /api/paystack/currencies` - Supported currencies

## 🚨 **Error Handling**

### **Common Errors**
- **Invalid API Keys**: Check environment variables
- **Webhook Failures**: Verify webhook URL and secret
- **Currency Issues**: Ensure supported currency
- **Network Errors**: Check internet connection

### **Debugging**
```typescript
// Enable debug logging
console.log('Paystack Debug:', {
  publicKey: process.env.VITE_PAYSTACK_PUBLIC_KEY,
  baseUrl: 'https://api.paystack.co',
  environment: 'test' // or 'live'
});
```

## 🧪 **Testing**

### **Test Cards (Nigeria)**
- **Success**: 4084084084084081
- **Declined**: 4084084084084085
- **Insufficient Funds**: 4084084084084082

### **Test Bank Accounts**
- **Success**: 0000000000
- **Declined**: 0000000001

## 📈 **Performance Optimization**

### **Database Indexes**
- Payment session lookups
- Webhook event processing
- Transaction history queries

### **Caching**
- Currency conversion rates
- Payment method availability
- User payment preferences

## 🔄 **Migration from Stripe**

### **Gradual Migration**
1. Deploy Paystack alongside Stripe
2. Allow users to choose payment method
3. Monitor Paystack performance
4. Gradually increase Paystack usage
5. Eventually phase out Stripe (optional)

### **Data Migration**
```sql
-- Migrate existing payment methods
UPDATE payment_methods 
SET provider = 'paystack' 
WHERE provider = 'stripe' 
AND user_id IN (SELECT id FROM profiles WHERE location LIKE '%Nigeria%');
```

## 🎉 **Benefits of Paystack Integration**

### **For Students**
- ✅ **Local Payment Methods**: Use familiar payment options
- ✅ **Lower Fees**: Competitive transaction fees
- ✅ **Faster Processing**: Quick payment confirmation
- ✅ **Better UX**: Optimized for African users

### **For Platform**
- ✅ **Higher Conversion**: Local payment methods increase success rates
- ✅ **Reduced Support**: Fewer payment-related issues
- ✅ **Better Analytics**: Detailed payment insights
- ✅ **Compliance**: Local regulatory compliance

## 🚀 **Next Steps**

1. **Set up Paystack account** and get API keys
2. **Run database migration** script
3. **Add environment variables** to your `.env` file
4. **Deploy webhook endpoint** to your server
5. **Test payment flow** with test cards
6. **Go live** with production keys

## 📞 **Support**

- **Paystack Documentation**: [developers.paystack.com](https://developers.paystack.com)
- **Paystack Support**: support@paystack.com
- **Platform Issues**: Check logs and webhook events

---

**🎯 Your SomaTogether.ai platform now supports Paystack payments!** 

Students can now pay using their preferred local payment methods, leading to higher conversion rates and better user experience across African markets.
