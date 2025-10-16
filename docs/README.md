# 🎓 SomaTogether.ai - Comprehensive Educational Platform

<div align="center">

![SomaTogether.ai Logo](public/logo.svg)

**Connecting Students, Teachers, and Parents in a Unified Learning Ecosystem**

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/fedhatevin-1281/SomaTogether.ai-)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-purple)](https://vitejs.dev/)

[🚀 Live Demo](https://somatogether-ai.vercel.app) • [📚 Documentation](./PROJECT_DOCUMENTATION.md) • [🐛 Report Bug](https://github.com/fedhatevin-1281/SomaTogether.ai-/issues) • [💡 Request Feature](https://github.com/fedhatevin-1281/SomaTogether.ai-/issues)

</div>

---

## 🌟 **Overview**

**SomaTogether.ai** is a cutting-edge educational platform that revolutionizes online learning by creating seamless connections between students, teachers, parents, and administrators. Built with modern web technologies and powered by AI, it provides a comprehensive solution for personalized education, virtual classrooms, and learning management.

### **🎯 Mission Statement**
To democratize education by providing accessible, personalized, and engaging learning experiences that connect all stakeholders in the educational process through innovative technology and AI-powered tools.

---

## ✨ **Key Features**

### **👥 Multi-Role Architecture**
- **🎓 Students**: Interactive learning, AI tutoring, progress tracking
- **👨‍🏫 Teachers**: Class management, content creation, analytics dashboard
- **👨‍👩‍👧‍👦 Parents**: Child progress monitoring, teacher communication
- **⚙️ Administrators**: Platform management, user oversight, analytics

### **🤖 AI-Powered Learning Assistant**
- **Soma AI**: Intelligent tutoring with Gemini integration
- **Personalized Learning**: Adaptive content and study recommendations
- **Multilingual Support**: English, Swahili, and Sheng integration
- **Cultural Context**: Kenyan curriculum and cultural references
- **Smart Analytics**: Learning pattern analysis and progress insights

### **💬 Real-Time Communication**
- **Instant Messaging**: Direct and group conversations
- **Video Conferencing**: Zoom integration for virtual classes
- **Push Notifications**: Real-time updates and reminders
- **File Sharing**: Secure document and media sharing

### **💰 Token Economy System**
- **Gamified Learning**: XP points and achievement badges
- **Flexible Payments**: Stripe integration with multiple currencies
- **Reward System**: Incentives for engagement and progress
- **Financial Transparency**: Detailed transaction history

### **📚 Content Management**
- **Materials Library**: Organized educational resources
- **Assignment System**: Digital homework and grading
- **Progress Tracking**: Comprehensive learning analytics
- **Resource Sharing**: Teacher-student content exchange

---

## 🏗️ **Technical Architecture**

### **Frontend Stack**
```typescript
- React 18.3.1 + TypeScript 5.9.3
- Vite 6.3.5 (Build Tool)
- Tailwind CSS + Radix UI Components
- Framer Motion (Animations)
- React Hook Form (Form Management)
- Recharts (Data Visualization)
```

### **Backend & Database**
```typescript
- Supabase (PostgreSQL + Auth + Storage)
- Express.js (API Server)
- Row Level Security (RLS) Policies
- Real-time Subscriptions
- File Storage & CDN
```

### **Integrations & Services**
```typescript
- Google Gemini AI (Intelligent Tutoring)
- Stripe (Payment Processing)
- Zoom API (Video Conferencing)
- Custom SMTP (Email Services)
- Supabase Auth (Authentication)
```

### **Development Tools**
```typescript
- ESLint + Prettier (Code Quality)
- TypeScript (Type Safety)
- Vite (Fast Development)
- Git (Version Control)
- Vercel (Deployment)
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js** 18.0+ 
- **npm** 9.0+ or **yarn** 1.22+
- **Supabase Account** ([Get Started](https://supabase.com/))
- **Git** (Version Control)

### **Installation**

1. **Clone the Repository**
   ```bash
   git clone https://github.com/fedhatevin-1281/SomaTogether.ai-.git
   cd SomaTogether.ai-
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Integration (Optional)
   VITE_GEMINI_API_KEY=your_gemini_api_key
   
   # Payment Processing (Optional)
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # Video Conferencing (Optional)
   VITE_ZOOM_API_KEY=your_zoom_api_key
   VITE_ZOOM_API_SECRET=your_zoom_api_secret
   VITE_ZOOM_ACCOUNT_ID=your_zoom_account_id
   ```

4. **Database Setup**
   ```bash
   # Run the database schema in your Supabase SQL Editor
   # Copy and paste the contents of database-schema-main.sql
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open Your Browser**
   ```
   http://localhost:3000
   ```

---

## 🎯 **User Roles & Features**

### **🎓 Student Dashboard**
- **Browse Teachers**: Find qualified educators by subject and rating
- **My Classes**: Access enrolled courses and session recordings
- **AI Assistant**: Get personalized help with homework and concepts
- **Progress Tracking**: Monitor learning journey and achievements
- **Wallet**: Manage tokens and payment history
- **Messages**: Communicate with teachers and peers

### **👨‍🏫 Teacher Dashboard**
- **Student Management**: Oversee enrolled students and their progress
- **Content Creation**: Upload assignments and educational materials
- **Analytics Dashboard**: Track student performance and engagement
- **Session Management**: Schedule and conduct virtual classes
- **Payment Processing**: Secure earnings through Stripe integration
- **Materials Library**: Organize and share educational resources

### **👨‍👩‍👧‍👦 Parent Dashboard**
- **Child Progress**: Monitor academic performance and activities
- **Teacher Communication**: Stay connected with educators
- **Payment Management**: Handle tuition and transaction history
- **Reports & Insights**: Detailed learning activity reports
- **Teacher Overview**: Browse and connect with teachers

### **⚙️ Admin Dashboard**
- **User Management**: Oversee all platform users and permissions
- **Content Moderation**: Review and moderate platform content
- **Analytics & Reports**: Platform-wide insights and metrics
- **System Configuration**: Manage platform settings and features
- **Payment Management**: Oversee financial transactions

---

## 🛠️ **Development**

### **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run dev:full     # Start both frontend and backend

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
npm run server       # Start Express server
npm run server:dev   # Start development server
```

### **Project Structure**

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── student/        # Student-specific components
│   ├── teacher/        # Teacher-specific components
│   ├── parent/         # Parent-specific components
│   ├── admin/          # Admin-specific components
│   ├── shared/         # Shared components
│   └── ui/             # UI component library
├── services/           # API services and integrations
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── styles/             # Global styles
```

### **Code Quality**

- **TypeScript**: Full type safety and IntelliSense support
- **ESLint**: Code linting and style enforcement
- **Prettier**: Automatic code formatting
- **Component Architecture**: Modular, reusable components
- **Service Layer**: Clean separation of concerns

---

## 🚀 **Deployment**

### **Vercel Deployment (Recommended)**

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Enable automatic deployments on push to `main`

2. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure all secrets are properly configured

3. **Build Configuration**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

4. **Deploy**
   - Push to `main` branch triggers automatic deployment
   - Monitor build logs for any issues

### **Manual Deployment**

```bash
# Build the application
npm run build

# Deploy to your preferred hosting service
# The build files are in the 'build' directory
```

### **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | ❌ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ❌ |
| `VITE_ZOOM_API_KEY` | Zoom API key | ❌ |
| `VITE_ZOOM_API_SECRET` | Zoom API secret | ❌ |
| `VITE_ZOOM_ACCOUNT_ID` | Zoom account ID | ❌ |

---

## 📊 **Database Schema**

### **Core Tables**
- **`profiles`**: User authentication and basic information
- **`students`**: Student-specific data and preferences
- **`teachers`**: Teacher profiles and qualifications
- **`parents`**: Parent accounts and child connections
- **`classes`**: Course and session management
- **`conversations`**: Messaging system
- **`materials_library`**: Educational content storage
- **`wallets`**: Token economy and payments
- **`transactions`**: Financial transaction history

### **Key Features**
- **Row Level Security (RLS)**: Secure data access
- **Real-time Subscriptions**: Live updates
- **Full-text Search**: Advanced content discovery
- **File Storage**: Secure media and document handling
- **Audit Trails**: Complete activity logging

---

## 🔧 **Configuration**

### **Vite Configuration**
- **Manual Chunking**: Optimized bundle splitting
- **Code Splitting**: Improved loading performance
- **Asset Optimization**: Compressed and optimized assets
- **Development Server**: Hot module replacement

### **Build Optimization**
- **Bundle Analysis**: Detailed size reporting
- **Tree Shaking**: Unused code elimination
- **Minification**: Production-ready code
- **Source Maps**: Debug-friendly builds

---

## 🤝 **Contributing**

We welcome contributions to SomaTogether.ai! Please follow these guidelines:

### **Getting Started**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Code Standards**
- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Supabase** for the amazing backend-as-a-service platform
- **Radix UI** for the accessible component primitives
- **Tailwind CSS** for the utility-first CSS framework
- **Vite** for the lightning-fast build tool
- **React** team for the incredible frontend library
- **Google Gemini** for AI capabilities
- **Stripe** for payment processing
- **Zoom** for video conferencing integration

---

## 📞 **Support & Contact**

- **Documentation**: [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/fedhatevin-1281/SomaTogether.ai-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fedhatevin-1281/SomaTogether.ai-/discussions)
- **Email**: [Contact Us](mailto:support@somatogether.ai)

---

<div align="center">

**Built with ❤️ for the future of education**

[![GitHub stars](https://img.shields.io/github/stars/fedhatevin-1281/SomaTogether.ai-?style=social)](https://github.com/fedhatevin-1281/SomaTogether.ai-/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/fedhatevin-1281/SomaTogether.ai-?style=social)](https://github.com/fedhatevin-1281/SomaTogether.ai-/network)
[![GitHub watchers](https://img.shields.io/github/watchers/fedhatevin-1281/SomaTogether.ai-?style=social)](https://github.com/fedhatevin-1281/SomaTogether.ai-/watchers)

</div>