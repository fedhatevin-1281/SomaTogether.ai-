# 📚 SomaTogether.ai - Complete Project Documentation

## 🎯 **Project Overview**

**SomaTogether.ai** is a comprehensive educational platform that connects students, teachers, parents, and administrators in a unified learning ecosystem. Built as a modern web application using React, TypeScript, and Supabase, it provides a complete solution for online education management, virtual classrooms, and learning coordination.

### **Core Mission**
The platform aims to revolutionize education by creating seamless connections between all stakeholders in the learning process, facilitating personalized learning experiences, and providing comprehensive tools for educational management.

### **Target Audience**
- **Students**: Access to classes, assignments, AI tutoring, and teacher connections
- **Teachers**: Class management, student progress tracking, content creation, and communication tools
- **Parents**: Child progress monitoring, teacher communication, and payment management
- **Administrators**: Platform management, user oversight, analytics, and system configuration

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Context API
- **Icons**: Lucide React

### **Backend & Database**
- **Backend**: Express.js server with Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email verification
- **Real-time**: Supabase real-time subscriptions
- **File Storage**: Supabase Storage

### **Integrations**
- **AI Service**: Google Gemini API for intelligent tutoring
- **Payments**: Stripe integration for token economy
- **Video Conferencing**: Zoom API integration
- **Email**: Custom SMTP configuration

### **Development Tools**
- **Package Manager**: npm
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git
- **Deployment**: Vite build system

## 🎨 **Color Theme System**

### **Primary Color Palette**

The application uses a sophisticated color system built on Tailwind CSS with custom CSS variables for consistent theming across light and dark modes.

#### **Core Brand Colors**
- **Primary**: `#030213` (Deep Navy Blue)
  - Used for: Main buttons, headers, primary actions
  - Represents: Trust, professionalism, education
- **Secondary**: `oklch(0.95 0.0058 264.53)` (Light Blue-Gray)
  - Used for: Secondary buttons, backgrounds, subtle elements
  - Represents: Calm, focus, learning environment

#### **Role-Based Color Coding**

Each user role has a distinct color identity for easy navigation and visual hierarchy:

**🔵 Student Role - Blue Theme**
- Primary: `blue-500` (`oklch(0.623 0.214 259.815)`)
- Light: `blue-50` (`oklch(0.97 0.014 254.604)`)
- Dark: `blue-600` (`oklch(0.546 0.245 262.881)`)
- Usage: Student dashboards, student-specific UI elements, student badges

**🟢 Teacher Role - Green Theme**
- Primary: `green-500` (`oklch(0.723 0.219 149.579)`)
- Light: `green-50` (`oklch(0.982 0.018 155.826)`)
- Dark: `green-600` (`oklch(0.627 0.194 149.214)`)
- Usage: Teacher dashboards, teacher profiles, teaching tools

**🟣 Parent Role - Purple Theme**
- Primary: `purple-500` (`oklch(0.627 0.265 303.9)`)
- Light: `purple-50` (`oklch(0.977 0.014 308.299)`)
- Dark: `purple-600` (`oklch(0.558 0.288 302.321)`)
- Usage: Parent dashboards, parent-specific features, monitoring tools

**🔴 Admin Role - Red Theme**
- Primary: `red-500` (`oklch(0.637 0.237 25.331)`)
- Light: `red-50` (`oklch(0.971 0.013 17.38)`)
- Dark: `red-600` (`oklch(0.577 0.245 27.325)`)
- Usage: Admin panels, system controls, warning states

#### **Semantic Colors**

**Success States**
- Primary: `green-500` (`oklch(0.723 0.219 149.579)`)
- Background: `green-50` (`oklch(0.982 0.018 155.826)`)
- Text: `green-800` (`oklch(0.448 0.119 151.328)`)

**Error/Warning States**
- Primary: `red-500` (`oklch(0.637 0.237 25.331)`)
- Background: `red-50` (`oklch(0.971 0.013 17.38)`)
- Text: `red-800` (`oklch(0.444 0.177 26.899)`)

**Info States**
- Primary: `blue-500` (`oklch(0.623 0.214 259.815)`)
- Background: `blue-50` (`oklch(0.97 0.014 254.604)`)
- Text: `blue-800` (`oklch(0.424 0.199 265.638)`)

#### **Neutral Colors**

**Light Mode Neutrals**
- Background: `#ffffff` (Pure White)
- Foreground: `oklch(0.145 0 0)` (Dark Gray)
- Muted: `#ececf0` (Light Gray)
- Border: `rgba(0, 0, 0, 0.1)` (Subtle Border)
- Input Background: `#f3f3f5` (Input Gray)

**Dark Mode Neutrals**
- Background: `oklch(0.145 0 0)` (Dark Background)
- Foreground: `oklch(0.985 0 0)` (Light Text)
- Muted: `oklch(0.269 0 0)` (Dark Muted)
- Border: `oklch(0.269 0 0)` (Dark Border)

### **UI Component Color Usage**

#### **Buttons**
- **Primary**: Deep navy background with white text
- **Secondary**: Light blue-gray background with dark text
- **Destructive**: Red background with white text
- **Outline**: Transparent with border and hover effects
- **Ghost**: Transparent with hover background changes

#### **Cards & Surfaces**
- **Card Background**: Pure white in light mode, dark in dark mode
- **Card Border**: Subtle gray borders
- **Hover States**: Light background color changes
- **Shadow**: Subtle drop shadows for depth

#### **Form Elements**
- **Input Background**: Light gray (`#f3f3f5`)
- **Focus States**: Blue ring with border color change
- **Error States**: Red border and background
- **Success States**: Green border and background

#### **Navigation**
- **Sidebar**: Light background with role-based accent colors
- **Header**: White background with subtle border
- **Active States**: Role-specific color highlighting
- **Hover States**: Light background changes

### **Accessibility & Color Standards**

The color system follows WCAG 2.1 AA accessibility standards:
- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color Independence**: Information conveyed through color is also available through other means
- **Focus Indicators**: Clear visual focus indicators for keyboard navigation
- **High Contrast Mode**: Support for high contrast preferences

### **Responsive Design Colors**

Colors adapt across different screen sizes:
- **Mobile**: Slightly more vibrant colors for better visibility
- **Tablet**: Balanced color saturation
- **Desktop**: Full color palette with subtle variations
- **Large Screens**: Enhanced contrast and depth

## 🚀 **Key Features**

### **Authentication System**
- Multi-role authentication (Student, Teacher, Parent, Admin)
- Email verification with bounce prevention
- Secure session management
- Demo account system for testing

### **AI-Powered Learning**
- Google Gemini integration for intelligent tutoring
- Subject-specific AI assistance
- Study material generation
- Learning progress tracking

### **Token Economy**
- Stripe-powered payment system
- Digital token purchasing
- Wallet management
- Transaction history

### **Virtual Classrooms**
- Zoom integration for video meetings
- Class scheduling and management
- Attendance tracking
- Recording capabilities

### **Communication Hub**
- Real-time messaging system
- Notification management
- Teacher-student-parent communication
- File sharing capabilities

### **Analytics & Reporting**
- Comprehensive dashboard analytics
- Student progress tracking
- Teacher performance metrics
- Parent monitoring tools

## 📱 **User Interface Design**

### **Design Principles**
- **Clean & Modern**: Minimalist design with clear visual hierarchy
- **Role-Based**: Color-coded interfaces for different user types
- **Responsive**: Seamless experience across all devices
- **Accessible**: WCAG compliant with keyboard navigation support
- **Intuitive**: User-friendly navigation and clear information architecture

### **Component Library**
- **Buttons**: Multiple variants (primary, secondary, outline, ghost)
- **Cards**: Consistent spacing and shadow system
- **Forms**: Accessible input components with validation
- **Navigation**: Collapsible sidebar with role-based styling
- **Modals**: Overlay dialogs with proper focus management
- **Tables**: Sortable, filterable data displays
- **Charts**: Data visualization components using Recharts

### **Layout System**
- **Grid System**: 12-column responsive grid
- **Spacing**: Consistent 4px base unit spacing
- **Typography**: Clear hierarchy with multiple font weights
- **Breakpoints**: Mobile-first responsive design

## 🔧 **Development Workflow**

### **Getting Started**
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Configure Supabase project
5. Run development server: `npm run dev`

### **Project Structure**
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── student/        # Student-specific components
│   ├── teacher/        # Teacher-specific components
│   ├── parent/         # Parent-specific components
│   └── admin/          # Admin-specific components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
├── styles/             # Global styles and CSS
└── utils/              # Utility functions
```

### **Database Schema**
- **User Management**: Profiles, roles, authentication
- **Learning**: Classes, assignments, progress tracking
- **Communication**: Messages, conversations, notifications
- **Payments**: Wallets, transactions, token economy
- **System**: Settings, analytics, admin controls

## 🌟 **Innovation Highlights**

### **AI Integration**
- Intelligent tutoring system with Google Gemini
- Personalized learning recommendations
- Automated content generation
- Smart progress analysis

### **Token Economy**
- Gamified learning experience
- Flexible payment system
- Reward mechanisms for engagement
- Financial transparency for parents

### **Multi-Role Architecture**
- Seamless role switching
- Role-specific dashboards
- Cross-role communication
- Unified data management

### **Real-Time Features**
- Live messaging and notifications
- Real-time progress updates
- Instant payment confirmations
- Live class participation

## 📊 **Performance & Scalability**

### **Frontend Optimization**
- Vite for fast development and builds
- Code splitting and lazy loading
- Optimized bundle sizes
- Efficient state management

### **Backend Architecture**
- Express.js for API endpoints
- Supabase for scalable database
- Real-time subscriptions
- Efficient query optimization

### **Security Measures**
- Row Level Security (RLS) policies
- Input validation and sanitization
- Secure authentication flows
- API rate limiting

## 🎯 **Future Roadmap**

### **Planned Features**
- Mobile application development
- Advanced AI tutoring capabilities
- Enhanced analytics and reporting
- Integration with learning management systems
- Multi-language support

### **Technical Improvements**
- Performance optimization
- Enhanced security measures
- Scalability improvements
- Advanced caching strategies

---

**SomaTogether.ai** represents a comprehensive solution for modern education, combining cutting-edge technology with thoughtful design to create an engaging and effective learning environment for all stakeholders in the educational process.
