# Paystack Environment Setup Guide

## Quick Fix for 401 Error

The 401 error you're seeing is because the Paystack API keys are not properly configured. Follow these steps:

### 1. Create a `.env` file in your project root

Create a file named `.env` in the root directory of your project (same level as `package.json`) with the following content:

```bash
# SomaTogether.ai Environment Variables

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Paystack Live Configuration
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here
VITE_PAYSTACK_SECRET_KEY=your_paystack_secret_key_here

# Paystack Webhook Secret (for server-side verification)
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Restart your development server

After creating the `.env` file, restart your development server:

```bash
npm run dev
# or
yarn dev
```

### 3. Verify the setup

The console should now show:
```
Paystack Service initialized: {
  hasPublicKey: true,
  hasSecretKey: true,
  baseUrl: "https://api.paystack.co"
}
```

### 4. Test the payment flow

Try adding funds to your wallet again. The 401 error should be resolved.

## Important Notes

- **Never commit the `.env` file** to version control
- The `.env` file should be in your project root directory
- Make sure there are no spaces around the `=` sign
- Restart your dev server after making changes to `.env`

## Troubleshooting

If you still get 401 errors:

1. Check that the `.env` file is in the correct location
2. Verify the API keys are correct (no extra spaces or characters)
3. Restart your development server
4. Check the browser console for the "Paystack Service initialized" message

## Security

- These are live Paystack keys, so be careful with them
- In production, use environment variables on your hosting platform
- Never expose secret keys in client-side code



