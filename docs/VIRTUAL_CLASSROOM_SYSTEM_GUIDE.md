# 🎓 Virtual Classroom System Implementation Guide

**Status**: ✅ Complete Framework Created  
**Date**: June 4, 2026  
**Version**: 1.0.0

---

## 📋 Overview

A complete Zoom-powered virtual classroom system for SomaTogether.ai that enables:

- ✅ Teachers to create, schedule, and manage live classes
- ✅ Students to discover, enroll, and join classes
- ✅ Automatic attendance tracking
- ✅ Certificate generation upon completion
- ✅ Class reviews and ratings
- ✅ Real-time notifications
- ✅ Recording management
- ✅ Revenue tracking

---

## 🗂️ Files Created

### **Database Schema**
- `migrations/classroom_schema.sql` - Complete database setup with RLS policies

### **Backend Services**
- `src/services/classroomService.ts` - Core business logic
- `src/services/zoomOAuthService.ts` - Zoom API integration (OAuth 2.0)

### **API Endpoints**
- `classroom-api-endpoints.js` - All REST endpoints
- `zoom-oauth-api-endpoints.js` - Zoom webhook handling

---

## 🚀 Quick Start Implementation

### **Step 1: Set Up Database**

Run the migration in Supabase:

```bash
# In Supabase Dashboard → SQL Editor
# Copy and run the entire content of:
migrations/classroom_schema.sql
```

This creates:
- `classes` table
- `enrollments` table
- `attendance` table
- `recordings` table
- `certificates` table
- `notifications` table
- `class_reviews` table
- RLS policies for security

### **Step 2: Add Backend Endpoints**

Copy all endpoints from `classroom-api-endpoints.js` to your `server.js`:

```javascript
// In server.js
const ClassroomService = require('./src/services/classroomService');

// Add all endpoints from classroom-api-endpoints.js
// Include: Class creation, student enrollment, attendance tracking, etc.
```

### **Step 3: Integrate Classroom Service**

```javascript
// In server.js
const classroomService = require('./src/services/classroomService');

// Call as needed for business logic
await classroomService.createClass(teacherId, classData);
await classroomService.enrollStudent(classId, studentId);
```

### **Step 4: Configure Webhooks**

Zoom sends webhooks for real-time updates:

```
POST /api/zoom/webhook
```

Events handled:
- `meeting.started` - Update class status to "live"
- `meeting.ended` - Update class status to "completed"
- `participant.joined` - Record attendance
- `participant.left` - Update attendance duration
- `recording.completed` - Store recording data

---

## 📊 Database Schema

### **Classes Table**
```typescript
{
  id: UUID;
  teacher_id: UUID;
  title: string;
  description?: string;
  subject?: string;
  category?: string;
  class_type: 'one-on-one' | 'group';
  max_students: number;
  price: decimal;
  
  // Zoom Integration
  zoom_meeting_id: string;
  zoom_join_url: string;
  zoom_host_url: string;
  zoom_password?: string;
  
  // Scheduling
  start_time: timestamp;
  duration_minutes: number;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  
  // Status
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  enrollment_count: number;
  total_revenue: decimal;
}
```

### **Enrollments Table**
```typescript
{
  id: UUID;
  class_id: UUID;
  student_id: UUID;
  
  // Payment
  payment_status: 'pending' | 'completed' | 'refunded';
  amount_paid: decimal;
  transaction_id?: string;
  
  // Attendance
  attendance_duration: number; // in minutes
  is_attended: boolean;
  joined_at: timestamp;
  left_at: timestamp;
}
```

### **Attendance Table**
```typescript
{
  id: UUID;
  class_id: UUID;
  student_id: UUID;
  
  // Times
  join_time: timestamp;
  leave_time?: timestamp;
  duration_minutes?: number;
  
  // Metadata
  participant_id: string; // Zoom ID
  is_host: boolean;
}
```

---

## 🔌 API Endpoints

### **Teacher: Class Management**

```bash
# Create class
POST /api/classes/create
{
  "title": "React Basics",
  "description": "Learn React from scratch",
  "subject": "Web Development",
  "class_type": "group",
  "max_students": 30,
  "price": 29.99,
  "start_time": "2024-01-15T10:00:00Z",
  "duration_minutes": 60,
  "timezone": "UTC"
}

# Get teacher's classes
GET /api/classes/teacher/:teacherId

# Update class
PUT /api/classes/:classId
{ "title": "Updated Title", "price": 39.99 }

# Delete/Cancel class
DELETE /api/classes/:classId

# Start class/meeting
POST /api/classes/:classId/start

# Get class attendees
GET /api/classes/:classId/attendees
```

### **Student: Discovery & Enrollment**

```bash
# Browse all classes
GET /api/classes?subject=web-development&limit=20

# Get class details
GET /api/classes/:classId

# Enroll in class
POST /api/classes/:classId/enroll
{
  "payment_intent_id": "pi_xyz...",
  "payment_method": "card"
}

# Join live class
POST /api/classes/:classId/join

# Get my enrollments
GET /api/classes/student/:studentId?status=upcoming
```

### **Attendance & Tracking**

```bash
# Record student leaving class
POST /api/attendance/end
{
  "attendance_id": "uuid..."
}

# Get attendance report
GET /api/attendance/:classId

# Generate certificate
POST /api/certificates/generate
{
  "class_id": "uuid...",
  "student_id": "uuid..."
}
```

### **Reviews**

```bash
# Submit class review
POST /api/classes/:classId/review
{
  "rating": 4.5,
  "comment": "Great class!"
}
```

### **Recordings**

```bash
# Get class recordings
GET /api/classes/:classId/recordings
```

---

## 🔔 Real-Time Notifications

Automatically sent to users:

### **Teacher Notifications**
- ✅ Class Created
- ✅ Student Enrolled
- ✅ Class Starting in 30 Minutes
- ✅ Class Started

### **Student Notifications**
- ✅ Enrollment Confirmation
- ✅ Class Reminder (24 Hours Before)
- ✅ Class Reminder (30 Minutes Before)
- ✅ Class Started
- ✅ Certificate Earned

**Sent via**: `notifications` table → Real-time Supabase subscription

---

## 💰 Payment Integration

### **For Paid Classes**

```typescript
// Student enrollment with payment
POST /api/classes/:classId/enroll
{
  payment_intent_id: "pi_...", // Stripe or Paystack
  payment_method: "card",
  amount_paid: 29.99
}
```

**Supports:**
- ✅ Stripe (configured in .env)
- ✅ Paystack (configured in .env)
- ✅ Free classes (price = 0)

**Payment Flow:**
1. Student clicks enroll → Payment modal
2. User completes payment
3. Payment status updated to "completed"
4. Enrollment activated
5. Student can now join class

---

## 🔐 Security & RLS Policies

### **Classes**
- Teachers can only CRUD their own classes
- Students can read all published classes
- Public class discovery enabled

### **Enrollments**
- Students can only read their own enrollments
- Teachers can read enrollments in their classes
- System updates payments/status

### **Attendance**
- Students can read their own attendance
- Teachers can read attendance for their classes
- System auto-inserts attendance records

### **Notifications**
- Users can only read their own notifications
- System auto-inserts notifications

---

## 📱 Frontend Components Needed

### **Teacher Dashboard Components**
```
TeacherDashboard/
├── ClassCreation.tsx          # Form to create class
├── ClassList.tsx               # List of teacher's classes
├── ClassEditor.tsx             # Edit class details
├── LiveClassRoom.tsx           # View for teaching
├── AttendeeList.tsx            # Show who's in class
├── AttendanceReport.tsx        # View/download attendance
└── RevenueOverview.tsx         # Revenue tracking
```

### **Student Dashboard Components**
```
StudentDashboard/
├── ClassDiscovery.tsx          # Browse available classes
├── ClassSearch.tsx             # Search & filter
├── ClassDetails.tsx            # Full class info
├── EnrollmentModal.tsx         # Enroll & pay
├── ClassroomViewer.tsx         # Join class
├── MyClasses.tsx               # Enrolled classes
├── CertificatesView.tsx        # Earned certificates
└── ClassReview.tsx             # Rate & review class
```

### **Shared Components**
```
Classroom/
├── ClassCard.tsx               # Preview card
├── RatingDisplay.tsx           # Star rating
├── NotificationCenter.tsx      # Real-time notifications
└── RecordingPlayer.tsx         # Play recordings
```

---

## 🧪 Testing Checklist

### **Teacher Features**
- [ ] Create class with Zoom meeting
- [ ] Edit class details
- [ ] Cancel class (deletes Zoom meeting)
- [ ] View upcoming/live/completed classes
- [ ] Start class meeting (updates status to "live")
- [ ] View class attendees
- [ ] Download attendance report
- [ ] View revenue generated
- [ ] See student enrollments

### **Student Features**
- [ ] Browse available classes
- [ ] Search by subject/teacher
- [ ] View class details
- [ ] Enroll in free class (instant)
- [ ] Enroll in paid class (with payment)
- [ ] View my enrolled classes
- [ ] Join live class
- [ ] Automatic attendance tracking
- [ ] View earned certificates
- [ ] Rate/review completed classes

### **Attendance & Certificates**
- [ ] Join time recorded
- [ ] Leave time recorded
- [ ] Duration calculated correctly
- [ ] 75%+ attendance verified
- [ ] Certificate generated automatically
- [ ] Certificate notification sent

### **Webhooks**
- [ ] meeting.started → class status updated
- [ ] participant.joined → attendance recorded
- [ ] participant.left → duration calculated
- [ ] recording.completed → stored in DB

---

## 📅 Scheduled Tasks

Implement these as cron jobs or using a scheduler:

```typescript
// Every minute - check and update class statuses
await classroomService.updateClassStatuses();

// Every 5 minutes - send class reminders
await classroomService.sendClassReminders();

// Every hour - process webhook events
await classroomService.processWebhookQueue();

// Daily - generate analytics and reports
await classroomService.generateDailyAnalytics();
```

---

## 🔗 Integration Points

### **With Zoom OAuth Service**
```typescript
import { zoomOAuthService } from './src/services/zoomOAuthService';

// Create Zoom meeting
const meeting = await zoomOAuthService.createMeeting(userId, {
  topic: 'Class Title',
  start_time: '2024-01-15T10:00:00Z',
  duration: 60
});

// Delete Zoom meeting
await zoomOAuthService.deleteMeeting(meetingId);

// Get meeting details
const details = await zoomOAuthService.getMeeting(meetingId);
```

### **With Payment Systems**
```typescript
// After successful payment with Stripe/Paystack
await classroomService.enrollStudent(classId, studentId, {
  payment_intent_id: 'pi_xyz...',
  amount_paid: 29.99
});
```

### **With Notification System**
```typescript
// Automatic notifications sent for:
- Class created
- Student enrolled
- Class reminder (24h, 30min)
- Class started
- Certificate earned
```

---

## 📊 Analytics & Reporting

### **Teacher Analytics**
- Total classes created
- Total students enrolled
- Total revenue generated
- Average student rating
- Popular subjects/topics
- Attendance statistics

### **Student Analytics**
- Classes completed
- Total learning hours
- Certificates earned
- Average rating given
- Learning progress

### **Platform Analytics**
- Total classes
- Total enrollments
- Revenue by subject
- Popular teachers
- Platform growth metrics

---

## 🚨 Error Handling

### **Common Errors**

```typescript
// Class not found
404: "Class not found"

// Not authorized (student not enrolled)
403: "Not enrolled in this class"

// Class is full
400: "Class is full"

// Invalid payment
400: "Payment failed"

// Zoom API error
500: "Failed to create Zoom meeting"

// Already enrolled
400: "Already enrolled in this class"

// Insufficient attendance for certificate
400: "Minimum attendance (75%) required"
```

---

## 🔄 Deployment Checklist

- [ ] Database schema migrated (classroom_schema.sql)
- [ ] All API endpoints added to server.js
- [ ] Classroom service integrated
- [ ] Zoom OAuth configured (.env variables)
- [ ] Payment systems configured (Stripe/Paystack)
- [ ] Email notifications setup (SendGrid)
- [ ] Webhooks configured in Zoom Marketplace
- [ ] Frontend components created
- [ ] Tested all teacher features
- [ ] Tested all student features
- [ ] Tested payment flow
- [ ] Tested attendance tracking
- [ ] Tested certificate generation
- [ ] Tested notifications
- [ ] Scheduled tasks configured
- [ ] Error handling implemented
- [ ] Logging setup
- [ ] Security audit done
- [ ] Load testing completed
- [ ] Deployed to staging
- [ ] User testing feedback
- [ ] Deployed to production

---

## 📚 API Documentation

### **Complete Endpoint Reference**

See `classroom-api-endpoints.js` for:
- Detailed request/response examples
- Error codes and handling
- Authentication requirements
- Request validation

See `zoom-oauth-api-endpoints.js` for:
- Zoom webhook setup
- Token management
- Meeting operations

---

## 🎯 Future Enhancements

- [ ] AI-generated lesson plans
- [ ] AI class summaries after meeting
- [ ] In-platform video chat (Zoom alternative)
- [ ] Classroom whiteboard & screen sharing
- [ ] Real-time chat/Q&A during class
- [ ] Automatic assignment grading
- [ ] Peer-to-peer learning groups
- [ ] Gamification (badges, leaderboards)
- [ ] Class moderation tools
- [ ] Advanced reporting & analytics

---

## 📞 Support

For questions or issues:

1. Check the error codes in the API responses
2. Review Zoom OAuth service documentation
3. Check Supabase RLS policies
4. Verify .env variables are set correctly
5. Check server logs for detailed errors

---

## 📄 Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `migrations/classroom_schema.sql` | Database setup | ✅ Created |
| `src/services/classroomService.ts` | Business logic | ✅ Created |
| `src/services/zoomOAuthService.ts` | Zoom integration | ✅ Already existed |
| `classroom-api-endpoints.js` | API routes | ✅ Created |
| `zoom-oauth-api-endpoints.js` | Webhooks | ✅ Already existed |

---

## 🎉 Ready to Build!

Your virtual classroom system framework is complete. Next steps:

1. ✅ Run the database migration
2. ✅ Add API endpoints to server.js
3. ✅ Create React components for UI
4. ✅ Test all features
5. ✅ Deploy to production

**Everything is ready for implementation!** 🚀

---

**Created**: June 4, 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete Framework
