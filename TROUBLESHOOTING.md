# 🚨 SomaTogether.ai Troubleshooting Guide

## 🔍 **Common Issues & Solutions**

### **❌ Issue 1: "Failed to fetch data" Error**

**Symptoms:**
- Console shows "Failed to fetch" errors
- Authentication not working
- Network errors in browser console

**Root Cause:**
- Missing or incorrect environment variables
- Supabase project not configured properly

**✅ Solution:**

1. **Check Environment Variables:**
   ```bash
   # Verify .env.local exists and has correct values
   cat .env.local
   ```

2. **Update .env.local with your actual credentials:**
   ```bash
   # Get these from your Supabase project settings -> API
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
   VITE_GEMINI_API_KEY=your_actual_gemini_key_here
   ```

3. **Restart development server:**
   ```bash
   npm run dev
   ```

### **❌ Issue 2: Demo Accounts Not Working**

**Symptoms:**
- Demo buttons don't work
- "Demo account not found" errors
- Demo accounts not created

**✅ Solution:**

1. **Use the improved demo system:**
   - Demo buttons now automatically create accounts if they don't exist
   - First click creates the demo account
   - Second click signs you in

2. **Manual demo account creation:**
   ```bash
   # Go to your Supabase project
   # Navigate to Authentication -> Users
   # Create users manually with these credentials:
   
   Student Demo:
   Email: student@demo.com
   Password: demo123
   
   Teacher Demo:
   Email: teacher@demo.com
   Password: demo123
   
   Parent Demo:
   Email: parent@demo.com
   Password: demo123
   ```

### **❌ Issue 3: Database Schema Errors**

**Symptoms:**
- "Policy already exists" errors
- "Column already exists" errors
- SQL execution failures

**✅ Solution:**

1. **Use the clean schema:**
   ```bash
   # Run database-schema-clean.sql in Supabase SQL Editor
   # This handles existing objects gracefully
   ```

2. **Reset database (if needed):**
   ```bash
   # In Supabase Dashboard:
   # 1. Go to Settings -> Database
   # 2. Click "Reset Database" (WARNING: This deletes all data)
   # 3. Run the clean schema again
   ```

### **❌ Issue 4: Authentication Context Errors**

**Symptoms:**
- "useAuth must be used within AuthProvider" errors
- Profile not loading
- User data not available

**✅ Solution:**

1. **Check App.tsx structure:**
   ```tsx
   // Make sure AuthProvider wraps your app
   export default function App() {
     return (
       <AuthProvider>
         <AppContent />
       </AuthProvider>
     );
   }
   ```

2. **Verify AuthContext import:**
   ```tsx
   import { AuthProvider } from './contexts/AuthContext';
   ```

### **❌ Issue 5: RLS Policy Errors**

**Symptoms:**
- "Permission denied" errors
- Data not loading for authenticated users
- RLS policy violations

**✅ Solution:**

1. **Check RLS is enabled:**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Verify user authentication:**
   ```tsx
   // Check if user is authenticated
   const { user, loading } = useAuth();
   console.log('User:', user, 'Loading:', loading);
   ```

## 🔧 **Step-by-Step Fix Process**

### **Step 1: Environment Setup**
```bash
# 1. Create .env.local file
touch .env.local

# 2. Add your Supabase credentials
echo "VITE_SUPABASE_URL=https://your-project-id.supabase.co" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=your_anon_key_here" >> .env.local
echo "VITE_GEMINI_API_KEY=your_gemini_key_here" >> .env.local

# 3. Restart dev server
npm run dev
```

### **Step 2: Database Setup**
```bash
# 1. Go to Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Run database-schema-clean.sql
# 4. Verify success messages
```

### **Step 3: Test Authentication**
```bash
# 1. Open browser console (F12)
# 2. Try to sign up a new account
# 3. Check for any console errors
# 4. Verify profile creation
```

### **Step 4: Test Demo Accounts**
```bash
# 1. Click demo buttons (they'll create accounts automatically)
# 2. Check if sign-in works
# 3. Verify role-based navigation
```

## 🐛 **Debug Commands**

### **Check Environment Variables:**
```bash
# In browser console
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### **Check Authentication State:**
```tsx
// In any component
const { user, profile, loading } = useAuth();
console.log('Auth State:', { user, profile, loading });
```

### **Check Database Connection:**
```tsx
// Test database connection
const testConnection = async () => {
  const { data, error } = await supabase.from('profiles').select('count');
  console.log('DB Connection:', { data, error });
};
```

### **Check RLS Policies:**
```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🎯 **Success Indicators**

When everything is working correctly, you should see:

✅ **No console errors**
✅ **Environment variables loaded**
✅ **User registration successful**
✅ **Profile creation automatic**
✅ **Demo accounts working**
✅ **Role-based navigation**
✅ **Database queries successful**

## 🆘 **Still Having Issues?**

### **Check These Common Problems:**

1. **Supabase Project Status:**
   - Is your project active?
   - Are you using the correct URL and keys?

2. **Network Issues:**
   - Check internet connection
   - Try different browser
   - Clear browser cache

3. **Code Issues:**
   - Check for typos in environment variables
   - Verify all imports are correct
   - Make sure all files are saved

4. **Database Issues:**
   - Check if schema was applied correctly
   - Verify RLS policies are enabled
   - Check if tables exist

### **Get Help:**

1. **Check browser console** for specific error messages
2. **Check Supabase logs** in your project dashboard
3. **Verify environment variables** are correct
4. **Test with a fresh browser session**

---

**🎯 Most issues are resolved by setting up the environment variables correctly!**










