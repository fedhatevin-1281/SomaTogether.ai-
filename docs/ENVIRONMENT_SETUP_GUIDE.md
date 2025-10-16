# 🔧 Environment Setup Guide

## **SomaTogether.ai - Environment Variables Configuration**

This guide explains how to properly configure environment variables for the SomaTogether.ai platform.

---

## 🚀 **Quick Setup**

### **Required Environment Variables (Minimum)**
```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **Optional Environment Variables (Enhanced Features)**
```env
# AI Integration (Optional - for AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Video Conferencing (Optional - for Zoom integration)
VITE_ZOOM_API_KEY=your_zoom_api_key_here
VITE_ZOOM_API_SECRET=your_zoom_api_secret_here
VITE_ZOOM_ACCOUNT_ID=your_zoom_account_id_here

# Payment Processing (Optional - for Stripe integration)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

---

## 📋 **Environment Variable Details**

### **✅ Required Variables**

| Variable | Description | Where to Get | Required |
|----------|-------------|--------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Supabase Dashboard → Settings → API | ✅ Yes |

### **🔧 Optional Variables**

| Variable | Description | Where to Get | Required |
|----------|-------------|--------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI features | [Google AI Studio](https://aistudio.google.com/) | ❌ No |
| `VITE_ZOOM_API_KEY` | Zoom API key for video conferencing | [Zoom Marketplace](https://marketplace.zoom.us/) | ❌ No |
| `VITE_ZOOM_API_SECRET` | Zoom API secret | [Zoom Marketplace](https://marketplace.zoom.us/) | ❌ No |
| `VITE_ZOOM_ACCOUNT_ID` | Zoom account ID | [Zoom Marketplace](https://marketplace.zoom.us/) | ❌ No |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for payments | [Stripe Dashboard](https://dashboard.stripe.com/) | ❌ No |

---

## 🛠️ **Setup Instructions**

### **1. Local Development Setup**

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your values:**
   ```env
   # Supabase (Required)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   
   # AI Features (Optional)
   VITE_GEMINI_API_KEY=your_gemini_key_here
   
   # Video Conferencing (Optional)
   VITE_ZOOM_API_KEY=your_zoom_key_here
   VITE_ZOOM_API_SECRET=your_zoom_secret_here
   VITE_ZOOM_ACCOUNT_ID=your_zoom_account_id_here
   
   # Payments (Optional)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### **2. Vercel Deployment Setup**

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add each environment variable:**
   - Click "Add New"
   - Enter the variable name (e.g., `VITE_SUPABASE_URL`)
   - Enter the variable value
   - Select environment (Production, Preview, Development)
   - Click "Save"

4. **Redeploy your project:**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment

---

## 🤖 **AI Features Configuration**

### **Gemini API Setup (Optional)**

The AI Assistant works in **mock mode** by default, providing helpful responses even without the Gemini API key. To enable full AI capabilities:

1. **Get Gemini API Key:**
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Sign in with your Google account
   - Click "Get API Key"
   - Create a new API key
   - Copy the key

2. **Add to Environment:**
   ```env
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Features Enabled with Gemini API:**
   - Real AI responses instead of mock responses
   - Advanced tutoring capabilities
   - Context-aware learning assistance
   - Multilingual support (English, Swahili, Sheng)

### **AI Assistant Behavior**

- **With API Key**: Full AI capabilities with real Gemini responses
- **Without API Key**: Mock mode with helpful educational responses
- **Fallback**: Always provides useful guidance even in mock mode

---

## 🔒 **Security Best Practices**

### **Environment Variable Security**

1. **Never commit `.env.local` to version control**
2. **Use different keys for development and production**
3. **Rotate API keys regularly**
4. **Use environment-specific configurations**

### **Vercel Secrets (Recommended)**

For production deployments, use Vercel's secret management:

1. **Go to Vercel Dashboard → Settings → Environment Variables**
2. **Add variables as "Secret" type**
3. **Reference them in your code as needed**

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. "VITE_GEMINI_API_KEY references Secret which does not exist"**
- **Solution**: Remove environment variable references from `vercel.json`
- **Fix**: Environment variables should be set in Vercel dashboard, not in `vercel.json`

#### **2. "AI Assistant not working"**
- **Check**: Verify `VITE_GEMINI_API_KEY` is set correctly
- **Fallback**: AI Assistant works in mock mode without API key
- **Debug**: Check browser console for error messages

#### **3. "Supabase connection failed"**
- **Check**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Test**: Check Supabase dashboard for project status
- **Debug**: Check browser network tab for API calls

#### **4. "Environment variables not loading"**
- **Check**: Variable names start with `VITE_`
- **Restart**: Restart development server after adding variables
- **Verify**: Check `.env.local` file exists and is properly formatted

---

## 📚 **Feature Status by Environment**

| Feature | Without API Key | With API Key |
|---------|----------------|--------------|
| **Basic Platform** | ✅ Full functionality | ✅ Full functionality |
| **User Authentication** | ✅ Full functionality | ✅ Full functionality |
| **Messaging System** | ✅ Full functionality | ✅ Full functionality |
| **Video Conferencing** | ✅ Full functionality | ✅ Full functionality |
| **Payment Processing** | ✅ Full functionality | ✅ Full functionality |
| **AI Assistant (Mock)** | ✅ Helpful responses | ❌ Disabled |
| **AI Assistant (Real)** | ❌ Not available | ✅ Full AI capabilities |

---

## 🎯 **Recommended Setup**

### **For Development**
```env
# Minimum required
VITE_SUPABASE_URL=your_dev_supabase_url
VITE_SUPABASE_ANON_KEY=your_dev_anon_key

# Optional for testing
VITE_GEMINI_API_KEY=your_dev_gemini_key
```

### **For Production**
```env
# All required variables
VITE_SUPABASE_URL=your_prod_supabase_url
VITE_SUPABASE_ANON_KEY=your_prod_anon_key

# All optional variables for full features
VITE_GEMINI_API_KEY=your_prod_gemini_key
VITE_ZOOM_API_KEY=your_prod_zoom_key
VITE_ZOOM_API_SECRET=your_prod_zoom_secret
VITE_ZOOM_ACCOUNT_ID=your_prod_zoom_account_id
VITE_STRIPE_PUBLISHABLE_KEY=your_prod_stripe_key
```

---

**Status**: ✅ **Environment Setup Complete**  
**Last Updated**: January 2025  
**Version**: 1.0.0
