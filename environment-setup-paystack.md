# 🔧 Environment Setup for Paystack Integration

## Required Environment Variables

Add these variables to your `.env` file:

```bash
# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
VITE_PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

## Getting Your Paystack Keys

### 1. Create Paystack Account
- Go to [paystack.com](https://paystack.com)
- Sign up for a developer account
- Complete business verification

### 2. Get API Keys
- Go to Settings > API Keys & Webhooks
- Copy your Test/Live public and secret keys
- Add them to your environment variables

### 3. Configure Webhooks
- Go to Settings > API Keys & Webhooks
- Add webhook URL: `https://yourdomain.com/api/paystack/webhook`
- Select events: `charge.success`, `charge.failed`, `transfer.success`, `transfer.failed`

## Test Keys (Development)

For testing, you can use these test keys:

```bash
# Test Public Key (Nigeria)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_51234567890abcdef

# Test Secret Key (Nigeria)  
VITE_PAYSTACK_SECRET_KEY=sk_test_51234567890abcdef

# Webhook Secret (generate your own)
PAYSTACK_WEBHOOK_SECRET=your_custom_webhook_secret_here
```

## Production Keys

For production, replace with your live keys:

```bash
# Live Public Key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key

# Live Secret Key
VITE_PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
```

## Verification

After adding the keys, restart your development server and check the console for:

```
✅ Paystack API key found. Payment processing is ready.
```

If you see this message, your Paystack integration is properly configured!
