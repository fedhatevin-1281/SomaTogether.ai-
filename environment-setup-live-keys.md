# Environment Variables Setup for Live Paystack Keys

## Required Environment Variables

Add these to your `.env` file:

```bash
# Paystack Live Configuration
VITE_PAYSTACK_PUBLIC_KEY=your_live_public_key_here
VITE_PAYSTACK_SECRET_KEY=your_live_secret_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Database Setup

1. Run the `live-paystack-token-purchase-setup.sql` script in your Supabase SQL editor
2. This will create all necessary tables and functions for live token purchases

## Webhook Configuration

1. Set up a webhook endpoint in your Paystack dashboard
2. Point it to: `https://yourdomain.com/api/paystack-webhook`
3. Enable the following events:
   - `charge.success`
   - `charge.failed`

## Security Notes

- Never commit the `.env` file to version control
- Use environment variables for all sensitive keys
- Implement webhook signature verification in production
- Monitor webhook events for security

## Testing

- Use real payment methods for testing with live keys
- Monitor the `paystack_payment_sessions` table for payment status
- Check the `token_transactions` table for successful purchases
