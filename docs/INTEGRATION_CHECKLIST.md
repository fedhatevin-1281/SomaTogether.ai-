# 🚀 Integration Checklist - Group Classes with Existing System

**Date**: June 4, 2026  
**Status**: Ready for Phase 2 - Backend Integration

---

## ✅ Phase 1: Database (COMPLETE)

- [x] Create `group_classes` table
- [x] Create `group_class_enrollments` table
- [x] Create `group_class_attendance` table
- [x] Create `group_class_recordings` table
- [x] Create `group_class_certificates` table
- [x] Create `group_class_reviews` table
- [x] Add RLS policies for all tables
- [x] Add helper functions:
  - [x] `update_group_class_enrollment_count()`
  - [x] `check_group_class_status()`
  - [x] `calculate_attendance_percentage()`
  - [x] `auto_generate_certificates()`
  - [x] `get_class_attendance_stats()`
- [x] Add indexes for performance
- [x] Integrate with existing auth model (teachers/students)
- [x] Integrate with existing notification system
- [x] Integrate with existing payment system

---

## ⏳ Phase 2: Backend Services

### Step 1: Update `classroomService.ts`

**Update Method Signatures:**
```typescript
// FROM: references classes table
classroomService.createClass(teacherId, classData)
// TO: references group_classes table
classroomService.createGroupClass(teacherId, classData)

// FROM: references enrollments table
classroomService.enrollStudent(classId, studentId, paymentData)
// TO: references group_class_enrollments table
classroomService.enrollStudentInGroupClass(classId, studentId, paymentData)

// Similar updates for other methods...
```

**Key Changes Needed:**
```typescript
// Use teachers table instead of auth.users
const teacher = await supabase
  .from('teachers')
  .select('*')
  .eq('id', teacherId)
  .single();

// Use students table instead of auth.users
const student = await supabase
  .from('students')
  .select('*')
  .eq('id', studentId)
  .single();

// Ensure payment integrates with wallet system
const wallet = await supabase
  .from('wallets')
  .select('*')
  .eq('user_id', studentId)
  .single();
```

**Methods to Add:**
```typescript
✅ createGroupClass()
✅ startGroupClass()
✅ endGroupClass()
✅ enrollStudentInGroupClass()
✅ recordStudentJoinGroupClass()
✅ recordStudentLeaveGroupClass()
✅ generateGroupClassCertificates()
✅ sendGroupClassReminders()
✅ getGroupClassAttendanceReport()
✅ submitGroupClassReview()
✅ getGroupClassRecordings()
```

### Step 2: Add Group Class API Endpoints

**File**: `classroom-api-endpoints.js` or `group-classroom-endpoints.js`

**Teacher Endpoints:**
```javascript
// Create group class
POST /api/group-classes/create
Body: {
  title, description, subject_id, category,
  max_students, price, start_time, duration_minutes,
  learning_objectives, zoom_settings
}

// Get teacher's group classes
GET /api/group-classes/teacher/:teacherId

// Update group class
PUT /api/group-classes/:classId
Body: { title, description, price, max_students, ... }

// Cancel group class
DELETE /api/group-classes/:classId

// Start group class (go live)
POST /api/group-classes/:classId/start

// End group class
POST /api/group-classes/:classId/end

// Get attendance
GET /api/group-classes/:classId/attendance
```

**Student Endpoints:**
```javascript
// Browse group classes
GET /api/group-classes
Query: { subject_id, search, rating_min, price_max, limit, offset }

// Get class details
GET /api/group-classes/:classId

// Enroll in class
POST /api/group-classes/:classId/enroll
Body: { payment_method_id, amount_paid }

// Join live class
POST /api/group-classes/:classId/join

// Get my enrollments
GET /api/group-classes/student/:studentId
Query: { status, sort }

// Submit review
POST /api/group-classes/:classId/review
Body: { rating, title, comment }

// Get class recordings
GET /api/group-classes/:classId/recordings

// Get my certificates
GET /api/certificates/group-classes
```

### Step 3: Integrate Payment Processing

**Payment Flow:**
```
1. Student clicks "Enroll"
2. Check wallet balance OR show payment modal
3. Process payment through Stripe/Paystack/Wallet
4. Create transaction in `transactions` table
5. Create enrollment in `group_class_enrollments`
6. Update wallet balance
7. Send confirmation notification
```

**Code Location**: Add to `classroomService.ts`
```typescript
async enrollStudentInGroupClass(classId, studentId, paymentData) {
  // 1. Get class price
  const groupClass = await supabase
    .from('group_classes')
    .select('*')
    .eq('id', classId)
    .single();
    
  // 2. Process payment (if not free)
  if (groupClass.price > 0) {
    // Call payment service or Stripe API
    const payment = await processPayment(studentId, groupClass.price, paymentData);
    if (!payment.success) throw new Error('Payment failed');
  }
  
  // 3. Create enrollment
  const enrollment = await supabase
    .from('group_class_enrollments')
    .insert({
      group_class_id: classId,
      student_id: studentId,
      payment_status: 'completed',
      amount_paid: groupClass.price
    })
    .select()
    .single();
    
  // 4. Update group class enrollment count (automatic via trigger)
  
  // 5. Send notification
  await sendNotification(studentId, 'group_enrollment_confirmation', {...});
  
  return enrollment;
}
```

### Step 4: Integrate Email Notifications

**Using Existing SendGrid:**
```typescript
// Leverage existing sendgrid configuration
import { sendEmail } from './services/emailService';

// Send enrollment confirmation
await sendEmail(studentEmail, 'enrollment-confirmation', {
  className: groupClass.title,
  startTime: groupClass.start_time,
  joinUrl: classRoomJoinUrl
});

// Send class reminder (24 hours before)
await sendEmail(studentEmail, 'class-reminder-24h', {
  className: groupClass.title,
  startTime: groupClass.start_time
});

// Send certificate notification
await sendEmail(studentEmail, 'certificate-earned', {
  className: groupClass.title,
  certificateUrl: certificatePdfUrl
});
```

---

## ⏳ Phase 2: Backend Services (Detailed Tasks)

- [ ] Update `src/services/classroomService.ts`:
  - [ ] Change `createClass()` → `createGroupClass()`
  - [ ] Update to use `group_classes` table
  - [ ] Update to use `students` table (not auth.users)
  - [ ] Update to use `teachers` table (not auth.users)
  - [ ] Update to use existing wallet system for payments
  - [ ] Add logging and error handling

- [ ] Create new file `group-classroom-api-endpoints.js`:
  - [ ] Teacher endpoints (create, read, update, delete)
  - [ ] Student endpoints (discover, enroll, join)
  - [ ] Attendance endpoints
  - [ ] Certificate endpoints
  - [ ] Review endpoints

- [ ] Integration with existing systems:
  - [ ] Integrate with wallets/transactions for payment
  - [ ] Integrate with notifications for alerts
  - [ ] Integrate with Zoom OAuth for meeting creation
  - [ ] Integrate with SendGrid for emails
  - [ ] Test with existing teacher/student profiles

- [ ] Error Handling:
  - [ ] Class not found (404)
  - [ ] Student not enrolled (403)
  - [ ] Class full (400)
  - [ ] Payment failed (402)
  - [ ] Invalid enrollment status (400)

---

## ⏳ Phase 3: Frontend Components

**Teacher Dashboard:**
- [ ] GroupClassCreation.tsx
- [ ] GroupClassList.tsx
- [ ] GroupClassEditor.tsx
- [ ] LiveGroupClassroom.tsx
- [ ] GroupClassAttendeeList.tsx
- [ ] GroupClassAttendanceReport.tsx
- [ ] GroupClassAnalytics.tsx

**Student Pages:**
- [ ] GroupClassDiscovery.tsx
- [ ] GroupClassSearch.tsx
- [ ] GroupClassDetails.tsx
- [ ] GroupEnrollmentModal.tsx
- [ ] GroupClassroomViewer.tsx
- [ ] MyGroupClasses.tsx
- [ ] CertificatesView.tsx
- [ ] GroupClassReview.tsx

**Shared Components:**
- [ ] GroupClassCard.tsx
- [ ] RatingDisplay.tsx
- [ ] NotificationCenter.tsx (update existing)
- [ ] RecordingPlayer.tsx

---

## ⏳ Phase 3: Testing

**Unit Tests:**
- [ ] classroomService.createGroupClass()
- [ ] classroomService.enrollStudentInGroupClass()
- [ ] classroomService.recordStudentJoin()
- [ ] classroomService.recordStudentLeave()
- [ ] classroomService.generateCertificates()

**Integration Tests:**
- [ ] Create class → Zoom meeting created ✓
- [ ] Enroll student → Payment processed ✓
- [ ] Join class → Attendance recorded ✓
- [ ] Leave class → Duration calculated ✓
- [ ] Complete class → Certificates generated ✓

**E2E Tests:**
- [ ] Teacher creates group class
- [ ] Student discovers class
- [ ] Student enrolls (free)
- [ ] Student joins class
- [ ] Attendance tracked
- [ ] Certificate earned
- [ ] Review submitted

**Load Testing:**
- [ ] 100 concurrent students joining
- [ ] Attendance tracking under load
- [ ] Certificate generation batch

---

## ⏳ Phase 4: Deployment

- [ ] Code review
- [ ] Security audit
- [ ] Database backup
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Deploy to production
- [ ] Monitor for errors

---

## 📊 Success Criteria

### Phase 2 Completion:
- ✅ All API endpoints working
- ✅ Payments processing correctly
- ✅ Notifications sending
- ✅ Attendance tracking
- ✅ Certificates generating

### Phase 3 Completion:
- ✅ UI components rendering
- ✅ Teacher can create group class
- ✅ Student can discover and enroll
- ✅ Student can join and attend
- ✅ Certificates display

### Phase 4 Completion:
- ✅ System live in production
- ✅ No critical errors
- ✅ Performance meets targets
- ✅ User feedback positive

---

## 📋 Reference Links

- **Schema Design**: [CLASSROOM_SCHEMA_INTEGRATION.md](CLASSROOM_SCHEMA_INTEGRATION.md)
- **Implementation Guide**: [VIRTUAL_CLASSROOM_SYSTEM_GUIDE.md](VIRTUAL_CLASSROOM_SYSTEM_GUIDE.md)
- **Quick Reference**: [CLASSROOM_QUICK_REFERENCE.md](../CLASSROOM_QUICK_REFERENCE.md)
- **Database Migration**: [classroom_schema.sql](../migrations/classroom_schema.sql)

---

## 🔑 Key Points

1. **Use Existing Tables** - Don't duplicate teacher/student/subject/wallet tables
2. **Maintain RLS** - Ensure security policies are enforced
3. **Integrate Payment** - Use existing wallet system
4. **Send Notifications** - Use existing notification system
5. **Zoom OAuth Ready** - OAuth service already integrated
6. **Test Thoroughly** - Unit → Integration → E2E
7. **Monitor Performance** - Check query performance on attendance/certificates

---

## 📞 Questions?

Refer to:
- Schema integration: `docs/CLASSROOM_SCHEMA_INTEGRATION.md`
- API design: `docs/VIRTUAL_CLASSROOM_SYSTEM_GUIDE.md`
- Quick lookup: `CLASSROOM_QUICK_REFERENCE.md`

---

**Status**: 🟢 Phase 2 Ready to Begin  
**Estimated Completion**: 2-3 weeks  
**Version**: 1.0.0
