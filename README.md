
# SomaTogether.ai - Educational Platform

A comprehensive educational platform connecting students, teachers, and parents with AI-powered learning tools and real-time collaboration features.

## 🚀 Production Ready

This repository contains the production-ready version of SomaTogether.ai with optimized performance and deployment configurations.

### Features
- **Step-by-step signup** with role-based onboarding
- **AI-powered learning assistant** with Gemini integration
- **Real-time messaging** and collaboration tools
- **Teacher-student matching** system
- **Payment processing** with Stripe integration
- **Zoom integration** for virtual classes
- **Comprehensive dashboard** for all user roles

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fedhatevin-1281/SomaTogether.ai-.git
cd SomaTogether.ai-
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. Start development server:
```bash
npm run dev
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Required Environment Variables
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_GEMINI_API_KEY` - Google Gemini API key (optional)

## 📦 Build

```bash
npm run build
```

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Backend**: Supabase (Database + Auth + Storage)
- **AI Integration**: Google Gemini API
- **Payments**: Stripe
- **Video**: Zoom API

## 📄 License

This project is licensed under the MIT License.
  