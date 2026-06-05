# 📋 Environment Variables Configuration Guide

## Overview

This guide explains all environment variables used in SomaTogether.ai and how to configure them for different environments.

---

## 📁 Environment Files

| File | Purpose | Usage |
|------|---------|-------|
| `.env` | Template with all variables | Reference |
| `.env.local` | Local development values | Development |
| `.env.production` | Production values | Production |

---

## 🔑 Environment Variables by Category

### **NODE ENVIRONMENT**

```env
NODE_ENV=development          # development, production, staging
PORT=5000                     # Server port
API_URL=http://localhost:5000 # API base URL
```

**Notes:**
- `NODE_ENV` determines which configurations are used
- `PORT` must not be in use on your machine
- `API_URL` should match your frontend's API calls

---

### **SUPABASE CONFIGURATION**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to get:**
1. Go to https://supabase.com/
2. Create/select your project
3. Go to Settings → API
4. Copy Project URL, Anon Key, and Service Role Key

**Notes:**
- `VITE_` prefix = Available to frontend (safe, limited permissions)
- Service Role Key = Kept secret on backend (full permissions)
- Never expose Service Role Key in frontend code

---

### **ZOOM OAUTH 2.0**

```env
ZOOM_OAUTH_CLIENT_ID=krrTrMonQLKtx9SLmxJMDQ
ZOOM_OAUTH_CLIENT_SECRET=FQr4jxJfWcG9GW4zv2LcNuNdU6ZmUxId
ZOOM_ACCOUNT_ID=dKp06igqSOaKu98cve0vBA
ZOOM_WEBHOOK_SECRET_TOKEN=5EhrGFt9QOm9hwnPxPRu9Q
ZOOM_WEBHOOK_URL=https://yourdomain.com/api/zoom/webhook
```

**Already Provided:**
- All values are filled in
- These are your production OAuth 2.0 credentials
- Keep them secret!

**How to verify:**
1. Go to https://marketplace.zoom.us/
2. Select your app
3. Check "Account ID" matches `ZOOM_ACCOUNT_ID`
4. Verify OAuth credentials match

---

### **STRIPE PAYMENT**

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_secret_here
```

**How to get:**
1. Go to https://stripe.com/
2. Create account and go to Dashboard
3. Settings → API Keys
4. Copy Publishable and Secret keys

**Important:**
- Use `pk_test_` and `sk_test_` for development
- Switch to `pk_live_` and `sk_live_` for production
- Webhook secret from Webhooks section

---

### **PAYSTACK PAYMENT**

```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

**How to get:**
1. Go to https://paystack.com/
2. Create account and go to Dashboard
3. Settings → API Keys & Webhooks
4. Copy Public and Secret keys

**Important:**
- Use test keys for development (testing mode)
- Switch to live keys for production
- Webhook secret from your webhook settings

---

### **GOOGLE GEMINI API**

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
GEMINI_TEMPERATURE=0.7
```

**How to get:**
1. Go to https://makersuite.google.com/
2. Create API key
3. Copy and paste here

**Settings:**
- `GEMINI_MODEL`: Model to use (gemini-pro, gemini-pro-vision)
- `GEMINI_TEMPERATURE`: Creativity (0.0 = logical, 1.0 = creative)

---

### **EMAIL CONFIGURATION**

```env
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@somatogether.ai
SENDGRID_FROM_NAME=SomaTogether.ai
```

**How to get SendGrid API Key:**
1. Go to https://sendgrid.com/
2. Create account
3. Settings → API Keys
4. Create a new API key with "Mail Send" permission

**Notes:**
- `SENDGRID_FROM_EMAIL`: Email address that sends notifications
- `SENDGRID_FROM_NAME`: Display name in emails
- Verify sender identity in SendGrid

---

### **JWT & AUTHENTICATION**

```env
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_min_32_chars
```

**How to generate:**
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Notes:**
- Minimum 32 characters
- Use different secrets for each environment
- Keep them absolutely secret
- If compromised, regenerate and update all deployed instances

---

### **SESSION CONFIGURATION**

```env
SESSION_SECRET=your_session_secret_key_here
SESSION_MAX_AGE=86400000  # 24 hours in milliseconds
```

**Notes:**
- `SESSION_SECRET`: Key for encrypting session data
- `SESSION_MAX_AGE`: How long session lasts (in milliseconds)
- 86400000 = 24 hours

---

### **LOGGING**

```env
LOG_LEVEL=info  # debug, info, warn, error
LOG_FILE=logs/app.log
```

**Log Levels:**
- `debug`: Detailed information (development only)
- `info`: General information
- `warn`: Warnings (default for production)
- `error`: Errors only

---

### **CORS (Cross-Origin Resource Sharing)**

```env
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true
```

**Important:**
- Set to your frontend URL
- Development: `http://localhost:5173` or `http://localhost:3000`
- Production: `https://somatogether.ai` (no trailing slash)
- Multiple origins: `http://localhost:5173,https://somatogether.ai`

---

### **FILE UPLOAD**

```env
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=uploads/
ALLOWED_EXTENSIONS=pdf,doc,docx,jpg,jpeg,png,gif
```

**Notes:**
- 52428800 bytes = 50 MB
- UPLOAD_DIR: Where files are stored
- ALLOWED_EXTENSIONS: Comma-separated file types

---

### **FEATURE FLAGS**

```env
FEATURE_ZOOM_INTEGRATION=true
FEATURE_STRIPE_PAYMENTS=true
FEATURE_PAYSTACK_PAYMENTS=true
FEATURE_GEMINI_AI=true
FEATURE_MESSAGING=true
FEATURE_STORAGE_UPLOAD=true
```

**Usage:**
- Enable/disable features without code changes
- Set to `true` to enable, `false` to disable
- Useful for testing or rolling out features gradually

---

### **SECURITY & RATE LIMITING**

```env
RATE_LIMIT_WINDOW=15           # Minutes
RATE_LIMIT_MAX_REQUESTS=100    # Per window
BCRYPT_ROUNDS=10               # Password hashing strength
```

**Notes:**
- Rate limiting prevents abuse
- Higher `RATE_LIMIT_MAX_REQUESTS` = more lenient
- `BCRYPT_ROUNDS`: Higher = slower but more secure (10-12 recommended)

---

### **CACHING (Redis)**

```env
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600  # Time-to-live in seconds
```

**Notes:**
- Optional: Redis improves performance
- CACHE_TTL: How long to cache data (3600 = 1 hour)
- For development: Can skip if Redis not available
- For production: Highly recommended

---

### **ERROR TRACKING (Sentry)**

```env
SENTRY_DSN=https://your-sentry-key@sentry.io/project-id
```

**How to set up:**
1. Go to https://sentry.io/
2. Create account and project
3. Copy DSN
4. Sentry automatically tracks errors in production

---

### **DEMO & DEVELOPMENT MODE**

```env
VITE_DEMO_MODE=false
VITE_SKIP_EMAIL_VERIFICATION=false
DEBUG_LOGGING=true
```

**Settings:**
- `VITE_DEMO_MODE=true`: Show demo data, disable real payments
- `VITE_SKIP_EMAIL_VERIFICATION=true`: Users don't need email verification
- `DEBUG_LOGGING=true`: More detailed logs

---

## 🚀 Quick Setup Guide

### **For Local Development**

1. **Copy `.env.local` template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Update these values:**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   
   VITE_GEMINI_API_KEY=your_gemini_key
   SENDGRID_API_KEY=SG...
   ```

3. **Generate JWT secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

### **For Production**

1. **Use `.env.production` as template**

2. **Set in your hosting provider:**
   - Vercel: Dashboard → Settings → Environment Variables
   - Heroku: Dashboard → Config Vars
   - AWS: Parameter Store or Secrets Manager
   - Docker: Pass via `docker run -e KEY=value`

3. **Verify all secrets are strong:**
   ```bash
   # Secrets should be 32+ characters
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Never commit `.env` files to git!**
   ```bash
   echo ".env*" >> .gitignore
   ```

---

## ⚠️ Important Security Notes

### **DO ✅**
- Keep all `.env` files out of git (add to `.gitignore`)
- Use strong, randomly generated secrets (32+ characters)
- Rotate secrets periodically
- Use different keys for each environment
- Store in secure environment variable manager
- Use `VITE_` prefix only for frontend-safe variables

### **DON'T ❌**
- Commit `.env` files to git
- Share secrets via email or chat
- Use weak/predictable secrets
- Expose secrets in frontend code
- Use same secrets across environments
- Log secrets (service should filter them)

---

## 🔄 Environment Variable Precedence

```
Command Line Arguments
    ↓
.env.{NODE_ENV}.local  (e.g., .env.development.local)
    ↓
.env.local
    ↓
.env.{NODE_ENV}  (e.g., .env.development)
    ↓
.env
    ↓
System Environment Variables
```

**Example:** If you set `PORT=3000` in `.env.local`, it overrides `.env`

---

## 🧪 Testing Your Configuration

```bash
# Test if all required variables are set
node -e "
const required = ['ZOOM_OAUTH_CLIENT_ID', 'VITE_SUPABASE_URL'];
required.forEach(key => {
  console.log(key + ': ' + (process.env[key] ? '✓' : '✗'));
});
"

# Test database connection
npm run test:db

# Test email configuration
npm run test:email

# Test Stripe webhook
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{}'
```

---

## 📝 Checklist

### **Before Development**
- [ ] `.env.local` created
- [ ] Supabase credentials added
- [ ] Zoom OAuth credentials (already provided)
- [ ] Stripe test keys added
- [ ] Gemini API key added
- [ ] SendGrid API key added
- [ ] JWT secrets generated and added
- [ ] Redis configured (optional)
- [ ] Server starts without errors

### **Before Production**
- [ ] All credentials are production keys
- [ ] All secrets are strong (32+ chars)
- [ ] `LOG_LEVEL=warn` (not debug)
- [ ] `DEBUG_LOGGING=false`
- [ ] `VITE_DEMO_MODE=false`
- [ ] Rate limiting enabled
- [ ] CORS restricted to production domain
- [ ] Webhook URLs point to production
- [ ] Error tracking (Sentry) configured
- [ ] Backups configured
- [ ] SSL certificate valid
- [ ] All variables set in hosting provider

---

## 🆘 Troubleshooting

### **"Error: Missing environment variable X"**

**Solution:**
1. Check if variable is in `.env.local`
2. Verify variable name (case-sensitive)
3. Restart development server
4. Check `.env` for defaults

### **"Cannot connect to Supabase"**

**Solution:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Check `VITE_SUPABASE_ANON_KEY` is valid
3. Ensure Supabase project is active
4. Check internet connection

### **"Stripe webhook failed"**

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check webhook endpoint is registered in Stripe Dashboard
3. Ensure `API_URL` is publicly accessible
4. For ngrok: Update webhook URL with latest ngrok URL

### **"JWT token invalid"**

**Solution:**
1. Verify `JWT_SECRET` hasn't changed
2. Clear cookies in browser
3. Logout and login again
4. If `JWT_SECRET` was changed, all sessions become invalid

---

## 📚 Additional Resources

- [Environment Variables Best Practices](https://12factor.net/config)
- [Dotenv Documentation](https://github.com/motdotla/dotenv)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)

---

**Last Updated:** June 4, 2026
**Status:** ✅ Complete
