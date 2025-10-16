# Teacher View System - Complete Setup Guide

## 🎯 Overview
This guide provides step-by-step instructions to set up the complete teacher view system with real data integration, notifications, Zoom integration, payment systems, and time tracking.

## 📋 Prerequisites
- Supabase project with existing schema
- Admin access to Supabase Dashboard
- SQL editor access in Supabase
- Zoom API credentials (optional)
- Stripe API credentials (optional)
- M-Pesa API credentials (optional)

## 🗄️ Step 1: Database Schema Setup

### Run the Integrated Schema
Execute the `teacher-settings-integrated-schema.sql` file in your Supabase SQL editor:

1. **Open Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content** of `teacher-settings-integrated-schema.sql`
4. **Click "Run"**

This will:
- ✅ Enhance your existing `teachers` table with new columns
- ✅ Create new tables for teacher settings
- ✅ Set up RLS policies for security
- ✅ Create helper functions
- ✅ Add performance indexes

## 📁 Step 2: Storage Bucket Setup

### Create Storage Bucket
1. **Go to Supabase Dashboard → Storage**
2. **Click "New Bucket"**
3. **Configure the bucket:**
   - **Name**: `teacher-documents`
   - **Public**: `true` (checked)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: `image/*, application/pdf`

### Set Up Storage Policies
Execute the `teacher-storage-policies.sql` file in your Supabase SQL editor.

## 🔔 Step 3: Notification System Setup

### Enable Real-time
1. **Go to Supabase Dashboard → Database → Replication**
2. **Enable real-time for the `notifications` table**
3. **Click "Enable" next to the notifications table**

### Test Notifications
```sql
-- Test notification creation
INSERT INTO public.notifications (
  user_id, type, title, message, priority
) VALUES (
  'your-user-id', 'test', 'Test Notification', 'This is a test notification', 'normal'
);
```

## 🎥 Step 4: Zoom Integration Setup (Optional)

### Environment Variables
Add to your `.env` file:
```env
REACT_APP_ZOOM_CLIENT_ID=your_zoom_client_id
REACT_APP_ZOOM_CLIENT_SECRET=your_zoom_client_secret
REACT_APP_ZOOM_REDIRECT_URI=http://localhost:3000/auth/zoom/callback
```

### Zoom App Configuration
1. **Go to Zoom Marketplace** (https://marketplace.zoom.us/)
2. **Create a new app** → **OAuth**
3. **Configure redirect URLs:**
   - Development: `http://localhost:3000/auth/zoom/callback`
   - Production: `https://yourdomain.com/auth/zoom/callback`
4. **Add required scopes:**
   - `meeting:write`
   - `meeting:read`
   - `user:read`

### Test Zoom Integration
```javascript
// Test Zoom connection
const isConnected = await ZoomService.isZoomConnected(teacherId);
console.log('Zoom connected:', isConnected);
```

## 💳 Step 5: Payment Integration Setup

### Stripe Setup
1. **Create Stripe Account** (https://stripe.com/)
2. **Get API Keys:**
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

### Environment Variables
Add to your `.env` file:
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
```

### M-Pesa Setup (Optional)
1. **Register for M-Pesa API** (Safaricom Developer Portal)
2. **Get credentials:**
   - Consumer Key
   - Consumer Secret
   - Business Short Code

### Environment Variables for M-Pesa
```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORT_CODE=your_business_code
```

## ⏱️ Step 6: Time Tracking System

### Test Time Tracking
```sql
-- Test session creation
INSERT INTO public.class_sessions (
  class_id, teacher_id, student_id, title, scheduled_start, scheduled_end, tokens_charged
) VALUES (
  'class-uuid', 'teacher-uuid', 'student-uuid', 'Test Session', 
  NOW(), NOW() + INTERVAL '1 hour', 10
);
```

### Test Time Tracker
```javascript
// Test session start
const result = await SessionTimeService.startSession(sessionId, teacherId);
console.log('Session started:', result);
```

## 🧪 Step 7: Testing the Complete System

### Test Teacher Browse
1. **Navigate to Teacher Browse** in student view
2. **Verify teachers are loaded** from database
3. **Test search and filters**
4. **Click on teacher profile**
5. **Verify profile data** is displayed correctly

### Test Notifications
1. **Login as a teacher**
2. **Send a session request** from student view
3. **Verify notification appears** in real-time
4. **Test notification actions** (mark as read, delete)

### Test Profile Management
1. **Go to Teacher Settings**
2. **Upload profile image**
3. **Update profile information**
4. **Save changes**
5. **Verify updates** in public profile

### Test Time Tracking
1. **Start a class session**
2. **Pause and resume** the session
3. **End the session**
4. **Verify time tracking** and token deduction/credit

## 🔧 Step 8: Frontend Integration

### Files Created/Updated
- ✅ `src/services/teacherBrowseService.ts` - Teacher browsing functionality
- ✅ `src/services/notificationService.ts` - Real-time notifications
- ✅ `src/services/zoomService.ts` - Zoom integration
- ✅ `src/services/paymentService.ts` - Payment processing
- ✅ `src/services/sessionTimeService.ts` - Time tracking
- ✅ `src/components/student/TeacherBrowse.tsx` - Teacher browsing UI
- ✅ `src/components/student/TeacherProfileView.tsx` - Teacher profile UI
- ✅ `src/components/shared/NotificationCenter.tsx` - Notification UI
- ✅ `src/components/shared/NotificationBell.tsx` - Notification bell
- ✅ `src/components/Header.tsx` - Updated with notification bell
- ✅ `src/App.tsx` - Updated with new screens
- ✅ `src/components/Sidebar.tsx` - Updated navigation

### Navigation Updates
- **Student View**: "Browse Teachers" now uses real data
- **Notification Bell**: Real-time notifications in header
- **Teacher Settings**: Profile management with file uploads
- **Time Tracking**: Integrated with token economy

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Teachers not loading in browse view"
**Solution**: 
- Check if `teacher-settings-integrated-schema.sql` was run
- Verify RLS policies are applied
- Check console for database errors

#### Issue 2: "Notifications not appearing"
**Solution**:
- Enable real-time for notifications table
- Check browser notification permissions
- Verify user is authenticated

#### Issue 3: "File upload fails"
**Solution**:
- Run `teacher-storage-policies.sql`
- Check storage bucket exists
- Verify file size and type limits

#### Issue 4: "Zoom integration not working"
**Solution**:
- Check environment variables
- Verify Zoom app configuration
- Check API credentials

#### Issue 5: "Payment processing fails"
**Solution**:
- Verify Stripe/M-Pesa credentials
- Check API endpoints
- Review error logs

### Debug Queries

```sql
-- Check teacher data
SELECT t.*, p.full_name, p.is_active 
FROM teachers t 
JOIN profiles p ON t.id = p.id 
WHERE p.role = 'teacher' AND p.is_active = true;

-- Check notifications
SELECT * FROM notifications 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check storage policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check time tracking
SELECT * FROM session_time_tracker 
WHERE session_id = 'your-session-id';
```

## 📊 What's Included

### Real Data Integration
- ✅ **Teacher Browse**: Real teachers from database
- ✅ **Teacher Profiles**: Complete profile information
- ✅ **Search & Filters**: Advanced filtering system
- ✅ **Online Status**: Real-time teacher availability

### Notification System
- ✅ **Real-time Notifications**: Supabase real-time
- ✅ **Browser Notifications**: Native browser notifications
- ✅ **Notification Center**: Full notification management
- ✅ **User Preferences**: Customizable notification settings

### Zoom Integration
- ✅ **Meeting Creation**: Automatic Zoom meeting creation
- ✅ **OAuth Authentication**: Secure Zoom account connection
- ✅ **Meeting Management**: Start, end, cancel meetings
- ✅ **Recording Support**: Automatic recording setup

### Payment Integration
- ✅ **Stripe Integration**: Credit card payments
- ✅ **M-Pesa Integration**: Mobile money payments
- ✅ **Token Economy**: Automated token deduction/credit
- ✅ **Withdrawal System**: Teacher earnings withdrawal

### Time Tracking
- ✅ **Session Management**: Start, pause, resume, end
- ✅ **Automatic Token Flow**: Student deduction, teacher credit
- ✅ **Time Analytics**: Session statistics and reporting
- ✅ **Duration Tracking**: Precise time measurement

## 🎉 Success Checklist

After completing the setup, you should have:

- [ ] All database tables created successfully
- [ ] Teacher browse system working with real data
- [ ] Real-time notifications functioning
- [ ] Teacher profiles displaying correctly
- [ ] File upload system working
- [ ] Zoom integration ready (if configured)
- [ ] Payment systems ready (if configured)
- [ ] Time tracking system operational
- [ ] No console errors in browser
- [ ] All navigation working correctly

## 🚀 Next Steps

Once the setup is complete:

1. **Test all functionality** thoroughly
2. **Configure production environment** variables
3. **Set up monitoring** and logging
4. **Train your team** on the new features
5. **Gather user feedback** for improvements
6. **Plan additional features** like:
   - Advanced analytics
   - Bulk operations
   - Mobile app integration
   - Multi-language support

## 📞 Support

If you encounter any issues:

1. **Check the troubleshooting section** above
2. **Review the console logs** for specific errors
3. **Verify all setup steps** were completed
4. **Check Supabase logs** for database errors
5. **Test with a simple policy** first if RLS is causing issues

The Teacher View System is now ready for production use! 🎉

## 🔗 Related Files

- `teacher-settings-integrated-schema.sql` - Database schema
- `teacher-storage-policies.sql` - Storage policies
- `src/services/teacherBrowseService.ts` - Teacher browsing
- `src/services/notificationService.ts` - Notifications
- `src/services/zoomService.ts` - Zoom integration
- `src/services/paymentService.ts` - Payment processing
- `src/services/sessionTimeService.ts` - Time tracking
- `src/components/student/TeacherBrowse.tsx` - Browse UI
- `src/components/student/TeacherProfileView.tsx` - Profile UI
- `src/components/shared/NotificationCenter.tsx` - Notifications UI
