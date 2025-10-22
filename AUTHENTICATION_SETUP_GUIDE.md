# 🔐 SomaTogether.ai Authentication Setup Guide

## ✅ **Complete Authentication System Ready!**

This guide will help you set up the complete authentication system for SomaTogether.ai, ensuring smooth sign-up for all users and proper database integration.

## 🚀 **Quick Setup (5 minutes)**

### **Step 1: Database Setup**
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the `setup-database.sql` file
4. Verify all functions and policies are created successfully

### **Step 2: Environment Variables**
Ensure your `.env` file contains:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 3: Test Authentication**
1. Run `npm run dev`
2. Visit `/app?screen=login`
3. Try creating a new account
4. Verify the user is created with proper profile data

## 📋 **What's Included**

### **🔧 Database Functions**
- `check_profile_exists(user_id)` - Check if user profile exists
- `create_user_profile(...)` - Create complete user profile with role-specific data
- `get_user_profile(user_id)` - Get user profile with role data
- `handle_new_user()` - Trigger function for new user creation

### **🛡️ Row Level Security (RLS)**
- **Profiles**: Users can view/edit their own profiles
- **Students**: Can manage their own data, teachers can view their students
- **Teachers**: Can manage their own data, students can view their teachers
- **Parents**: Can view their children's data
- **Classes**: Teachers and students can view their classes
- **Messages**: Users can view messages in their conversations
- **Materials**: Teachers can manage their materials, students can view class materials

### **⚡ Automatic Triggers**
- **New User Creation**: Automatically creates profile, wallet, and role-specific records
- **Profile Creation**: Handles student, teacher, and parent profiles
- **Wallet Creation**: Creates wallet with default balance and tokens

## 🎯 **User Registration Flow**

### **1. Student Registration**
```typescript
// Student signs up with basic info
const { error } = await signUp({
  email: 'student@example.com',
  password: 'password123',
  full_name: 'John Doe',
  role: 'student',
  education_system_id: 'uuid',
  education_level_id: 'uuid',
  interests: ['math', 'science'],
  preferred_subjects: ['mathematics', 'physics']
});
```

### **2. Teacher Registration**
```typescript
// Teacher signs up with comprehensive info
const { error } = await signUp({
  email: 'teacher@example.com',
  password: 'password123',
  full_name: 'Jane Smith',
  role: 'teacher',
  max_children: 10,
  preferred_subjects: ['mathematics', 'physics'],
  availability: [
    { day_of_week: 1, start_time: '09:00', end_time: '17:00', timezone: 'UTC' }
  ]
});
```

### **3. Parent Registration**
```typescript
// Parent signs up
const { error } = await signUp({
  email: 'parent@example.com',
  password: 'password123',
  full_name: 'Parent Name',
  role: 'parent'
});
```

## 🔄 **Authentication States**

### **Loading States**
- `loading: true` - Authentication is in progress
- `user: null` - No user logged in
- `profile: null` - User logged in but profile not loaded

### **Success States**
- `user: User` - User authenticated
- `profile: UserProfile` - User profile loaded
- `currentRole: 'student' | 'teacher' | 'parent' | 'admin'` - User role

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Profile Not Created**
**Problem**: User created but profile doesn't exist
**Solution**: The trigger should handle this automatically, but if it fails, the fallback function will create the profile

#### **2. RLS Policy Errors**
**Problem**: "Row Level Security policy" errors
**Solution**: Ensure all RLS policies are properly created by running the setup script

#### **3. Role-Specific Data Missing**
**Problem**: User created but student/teacher/parent data missing
**Solution**: The `create_user_profile` function creates all necessary role-specific records

### **Debug Steps**
1. Check browser console for errors
2. Verify database functions exist in Supabase
3. Check RLS policies are enabled
4. Test with a fresh user account

## 📊 **Database Schema Overview**

### **Core Tables**
- `profiles` - User basic information
- `students` - Student-specific data
- `teachers` - Teacher-specific data
- `parents` - Parent-specific data
- `wallets` - User financial data

### **Relationship Tables**
- `classes` - Teacher-student relationships
- `class_sessions` - Individual learning sessions
- `assignments` - Teacher-created assignments
- `messages` - Communication between users

### **Supporting Tables**
- `subjects` - Available subjects
- `education_systems` - Curriculum systems
- `education_levels` - Grade levels
- `materials_library` - Teaching materials

## 🔒 **Security Features**

### **Authentication**
- Email/password authentication via Supabase Auth
- Session management with automatic refresh
- Secure token handling

### **Authorization**
- Role-based access control (RBAC)
- Row Level Security (RLS) for data isolation
- User can only access their own data

### **Data Protection**
- All user data is encrypted at rest
- API calls are authenticated
- Sensitive operations require proper permissions

## 🚀 **Deployment Checklist**

### **Before Deployment**
- [ ] Database functions created
- [ ] RLS policies enabled
- [ ] Environment variables set
- [ ] Authentication flow tested
- [ ] All user roles tested

### **After Deployment**
- [ ] Test user registration
- [ ] Test user login
- [ ] Test role-based navigation
- [ ] Test data access permissions
- [ ] Monitor for authentication errors

## 📈 **Performance Optimizations**

### **Database Indexes**
- Profile lookups by ID
- Class queries by teacher/student
- Message queries by conversation
- Notification queries by user

### **Caching**
- User profile caching
- Session state management
- Role-based navigation caching

## 🎉 **Success Indicators**

### **✅ Authentication Working**
- Users can sign up successfully
- Users can log in and out
- Profiles are created automatically
- Role-based navigation works
- Data access is properly restricted

### **✅ Database Integration**
- All tables have proper RLS policies
- Triggers create necessary records
- Functions handle edge cases
- Performance is optimized

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for errors
2. Verify database setup is complete
3. Test with a fresh user account
4. Check Supabase logs for database errors

The authentication system is now fully integrated and ready for production use! 🌟
