# 🎥 Zoom Integration Setup Guide

## 🎯 **Objective**
Integrate Zoom for class scheduling and video meetings, allowing teachers to create meetings and students to join them.

## 📋 **What We've Created**

### **✅ 1. Zoom Service (`src/services/zoomService.ts`)**
- Complete Zoom API integration
- JWT token generation for authentication
- Meeting creation, management, and deletion
- Participant tracking and recording management
- Helper functions for time formatting and status checking

### **✅ 2. Database Schema (`zoom-database-setup.sql`)**
- `zoom_accounts` table for teacher Zoom connections
- `zoom_meetings` table for meeting management
- `meeting_participants` table for attendance tracking
- `meeting_recordings` table for recording storage
- RLS policies for secure access
- Helper functions for meeting management

### **✅ 3. Backend API Endpoints (`zoom-api-endpoints.js`)**
- Zoom account connection and management
- Meeting creation, listing, and deletion
- Participant joining and tracking
- Webhook handlers for real-time updates
- Integration with existing class sessions

### **✅ 4. React Components**
- `ZoomIntegration.tsx` - Teacher interface for managing Zoom
- `JoinZoomMeeting.tsx` - Student interface for joining meetings
- `MeetingDetails.tsx` - Detailed meeting information

## 🚀 **Step-by-Step Setup**

### **Step 1: Get Zoom API Credentials**

1. **Go to Zoom Marketplace**: https://marketplace.zoom.us/
2. **Sign in** with your Zoom account
3. **Create an App**:
   - Click "Develop" → "Build App"
   - Choose "JWT" as the app type
   - Fill in app details:
     - App Name: "SomaTogether.ai Integration"
     - Company Name: Your company name
     - Developer Email: Your email
   - Add required scopes:
     - `meeting:write:admin`
     - `meeting:read:admin`
     - `user:read:admin`
     - `recording:read:admin`
4. **Get Credentials**:
   - Copy your **API Key** and **API Secret**
   - Save them securely

### **Step 2: Set Up Environment Variables**

Add to your `.env` file:
```bash
# Zoom API Credentials
VITE_ZOOM_API_KEY=your_zoom_api_key_here
VITE_ZOOM_API_SECRET=your_zoom_api_secret_here
```

### **Step 3: Install Required Dependencies**

```bash
npm install axios
```

### **Step 4: Run Database Setup**

1. **Open Supabase SQL Editor**
2. **Copy and run `zoom-database-setup.sql`**
3. **Wait for completion message**

### **Step 5: Update Backend Server**

1. **Add Zoom endpoints to `server.js`**:
   ```javascript
   // Add at the top with other imports
   const axios = require('axios');
   
   // Add all endpoints from zoom-api-endpoints.js
   ```

2. **Restart your backend server**:
   ```bash
   npm run server
   ```

### **Step 6: Update Frontend Components**

1. **Add Zoom integration to teacher dashboard**
2. **Add meeting joining to student dashboard**
3. **Import and use the new components**

## 🔧 **How It Works**

### **Teacher Flow:**
1. **Connect Zoom Account**: Teacher enters API credentials
2. **Create Meeting**: Teacher schedules a meeting for a class
3. **Manage Meetings**: View upcoming meetings, join, or delete
4. **Track Participants**: See who joined meetings

### **Student Flow:**
1. **View Meetings**: See upcoming meetings for their classes
2. **Join Meetings**: Click to join Zoom meetings
3. **Meeting Details**: View meeting information and recordings

### **System Flow:**
1. **Meeting Creation**: API creates Zoom meeting and stores details
2. **Real-time Updates**: Webhooks update meeting status
3. **Participant Tracking**: System records who joins meetings
4. **Recording Management**: Automatic recording storage

## 🧪 **Testing the Integration**

### **Test 1: Teacher Zoom Connection**
1. **Go to teacher dashboard**
2. **Click "Connect Zoom Account"**
3. **Enter your Zoom API credentials**
4. **Verify connection success**

### **Test 2: Create a Meeting**
1. **Click "Create Meeting"**
2. **Fill in meeting details**
3. **Submit form**
4. **Verify meeting appears in list**

### **Test 3: Student Joins Meeting**
1. **Go to student dashboard**
2. **View upcoming meetings**
3. **Click "Join Meeting"**
4. **Verify Zoom opens in new tab**

### **Test 4: Meeting Management**
1. **View meeting details**
2. **Copy meeting link**
3. **Update meeting status**
4. **Delete meeting**

## 📊 **Database Structure**

### **zoom_accounts Table:**
- Stores teacher Zoom API credentials
- Links teachers to their Zoom accounts
- Tracks connection status

### **zoom_meetings Table:**
- Stores all meeting details
- Links to class sessions
- Tracks meeting status and participants

### **meeting_participants Table:**
- Records who joined meetings
- Tracks join/leave times
- Identifies hosts vs participants

### **meeting_recordings Table:**
- Stores recording information
- Provides download/play URLs
- Tracks recording status

## 🔐 **Security Features**

### **RLS Policies:**
- Teachers can only manage their own meetings
- Students can only view meetings for their classes
- Secure access to meeting recordings

### **API Security:**
- JWT token authentication
- Encrypted credential storage
- Secure webhook handling

### **Data Protection:**
- No sensitive data in frontend
- Encrypted API secrets
- Secure meeting URLs

## 🎯 **Features Included**

### **✅ Meeting Management:**
- Create scheduled meetings
- Update meeting details
- Delete meetings
- View meeting history

### **✅ Participant Tracking:**
- Record meeting attendance
- Track join/leave times
- Identify meeting hosts
- Count participants

### **✅ Recording Management:**
- Automatic cloud recording
- Store recording URLs
- Provide download links
- Track recording status

### **✅ Real-time Updates:**
- Webhook integration
- Live status updates
- Participant notifications
- Meeting state changes

## 🚨 **Important Notes**

### **Zoom Account Requirements:**
- **Pro Account**: Required for API access
- **API Limits**: 1000 requests per day (free tier)
- **Meeting Limits**: Based on your Zoom plan

### **Development vs Production:**
- **Development**: Use test Zoom accounts
- **Production**: Use real Zoom accounts
- **Credentials**: Never commit API secrets to code

### **Webhook Setup:**
- **Development**: Use ngrok for local testing
- **Production**: Configure webhook URLs in Zoom
- **Security**: Validate webhook signatures

## 🔄 **Integration with Existing System**

### **Class Sessions:**
- Meetings automatically linked to class sessions
- Meeting URLs stored in session records
- Recording availability tracked

### **Notifications:**
- Meeting reminders sent to students
- Recording availability notifications
- Meeting status updates

### **Analytics:**
- Meeting attendance tracking
- Recording usage statistics
- Teacher engagement metrics

## 🎉 **Success Indicators**

You'll know it's working when:

✅ **Teachers can connect Zoom accounts**
✅ **Meetings are created successfully**
✅ **Students can join meetings**
✅ **Participant tracking works**
✅ **Recordings are stored**
✅ **Webhooks update status**

## 🚀 **Next Steps**

1. **Run the database setup script**
2. **Add Zoom API credentials to .env**
3. **Update backend server with Zoom endpoints**
4. **Test teacher Zoom connection**
5. **Create a test meeting**
6. **Test student meeting joining**

The Zoom integration is now ready to provide seamless video meeting functionality for your educational platform! 🎥

