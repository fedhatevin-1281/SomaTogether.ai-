# 🔧 Stripe Integration Setup Guide

## 📋 **Environment Variables Setup**

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🚀 **Backend Setup**

### **1. Install Dependencies**
```bash
npm install stripe express cors dotenv
```

### **2. Create Backend Server (Express.js)**
Create a `server.js` file in your project root:

```javascript
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import your Stripe endpoints
const stripeEndpoints = require('./api/stripe-endpoints');
app.use('/api', stripeEndpoints);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### **3. Update Stripe Service**
Update `src/services/stripeService.ts` to use environment variables:

```typescript
// Replace the hardcoded key with environment variable
const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

## 🔑 **Getting Your Stripe Keys**

1. **Sign up for Stripe**: Visit [stripe.com](https://stripe.com)
2. **Get Test Keys**: 
   - Go to Developers → API Keys
   - Copy your Publishable key (starts with `pk_test_`)
   - Copy your Secret key (starts with `sk_test_`)
3. **Set up Webhooks**: 
   - Go to Developers → Webhooks
   - Add endpoint for your server
   - Copy the webhook secret (starts with `whsec_`)

## 🛡️ **Security Notes**

- **Never commit real API keys** to version control
- Use environment variables for all sensitive data
- Test keys are safe to use in development
- Switch to live keys only in production

## 🚀 **Deployment**

When deploying to Vercel or other platforms:

1. Add environment variables in your hosting platform
2. Never include `.env` files in your repository
3. Use the hosting platform's environment variable settings

## 📚 **Next Steps**

1. Set up your Stripe account
2. Add the environment variables
3. Test the integration
4. Deploy to production with live keys
