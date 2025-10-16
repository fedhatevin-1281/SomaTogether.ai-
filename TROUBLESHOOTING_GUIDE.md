# 🔧 Troubleshooting Guide

## ❌ **Common Issues and Solutions**

### **Issue: ERR_CONNECTION_REFUSED**

**Error Message:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**Cause:** Backend server is not running

**Solution:**
```bash
# Start the backend server
npm run server

# Or start both servers together
npm run dev:full

# Or use the new start script
npm start
```

### **Issue: Dashboard Shows Loading Forever**

**Cause:** Backend server not running or API endpoints not responding

**Solution:**
1. **Check if backend is running:**
   ```bash
   # Test backend health
   curl http://localhost:3001/api/health
   ```

2. **Start backend server:**
   ```bash
   npm run server
   ```

3. **Check console for errors:**
   - Open browser Developer Tools (F12)
   - Go to Console tab
   - Look for error messages

### **Issue: "Failed to fetch" Errors**

**Cause:** Network connectivity issues or server not running

**Solution:**
1. **Verify backend server is running:**
   ```bash
   # Check if port 3001 is in use
   netstat -an | findstr :3001
   ```

2. **Restart backend server:**
   ```bash
   # Kill existing processes
   taskkill /f /im node.exe
   
   # Start server again
   npm run server
   ```

3. **Check firewall settings:**
   - Ensure port 3001 is not blocked
   - Check Windows Firewall settings

### **Issue: Database Connection Errors**

**Cause:** Supabase connection issues or missing data

**Solution:**
1. **Check Supabase connection:**
   - Verify `.env.local` has correct Supabase URL and key
   - Test connection in Supabase dashboard

2. **Run database setup:**
   ```sql
   -- Run setup-database.sql in Supabase SQL editor
   ```

3. **Check RLS policies:**
   - Ensure Row Level Security policies are set up
   - Verify user has proper permissions

## 🚀 **Quick Start Commands**

### **Start Everything:**
```bash
# Option 1: Start both servers
npm run dev:full

# Option 2: Use the new start script
npm start

# Option 3: Start individually
npm run server  # Terminal 1
npm run dev     # Terminal 2
```

### **Test Backend:**
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test dashboard stats
curl "http://localhost:3001/api/student/dashboard/stats?userId=YOUR_USER_ID"
```

### **Check Server Status:**
```bash
# Check if ports are in use
netstat -an | findstr :3000  # Frontend
netstat -an | findstr :3001  # Backend
```

## 🔍 **Debugging Steps**

### **Step 1: Check Server Status**
```bash
# Check if backend is running
Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET

# Check if frontend is running
Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
```

### **Step 2: Check Console Logs**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

### **Step 3: Verify Environment Variables**
Check `.env.local` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **Step 4: Test API Endpoints**
```bash
# Test all endpoints
node test-dashboard-api.js
```

## 🛠️ **Development Workflow**

### **Daily Development:**
1. **Start both servers:**
   ```bash
   npm run dev:full
   ```

2. **Access application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

3. **Check logs:**
   - Backend logs in terminal
   - Frontend logs in browser console

### **When Things Break:**
1. **Check if servers are running**
2. **Restart both servers**
3. **Check console for errors**
4. **Verify database connection**
5. **Test API endpoints manually**

## 📊 **Server Status Indicators**

### **Backend Server (Port 3001):**
- ✅ **Running:** `{"status":"OK","message":"Server is running"}`
- ❌ **Not Running:** `ERR_CONNECTION_REFUSED`

### **Frontend Server (Port 3000):**
- ✅ **Running:** Vite development server page loads
- ❌ **Not Running:** Page won't load

### **Database Connection:**
- ✅ **Connected:** No database errors in console
- ❌ **Disconnected:** Database connection errors

## 🎯 **Quick Fixes**

### **Fix 1: Restart Everything**
```bash
# Kill all Node processes
taskkill /f /im node.exe

# Start fresh
npm run dev:full
```

### **Fix 2: Clear Browser Cache**
1. Press `Ctrl + Shift + R` (hard refresh)
2. Or clear browser cache completely

### **Fix 3: Check Ports**
```bash
# Check if ports are free
netstat -an | findstr :3000
netstat -an | findstr :3001

# If ports are in use, kill processes
taskkill /f /im node.exe
```

### **Fix 4: Verify Environment**
1. Check `.env.local` exists
2. Verify Supabase credentials
3. Test database connection

## 🆘 **Still Having Issues?**

If you're still experiencing problems:

1. **Check the console logs** for specific error messages
2. **Verify both servers are running** on the correct ports
3. **Test the API endpoints** manually
4. **Check your database setup** in Supabase
5. **Restart your development environment** completely

The most common issue is simply that the backend server isn't running. Make sure to start it with `npm run server` or `npm run dev:full`! 🚀

