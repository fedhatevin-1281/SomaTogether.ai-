# Comprehensive Logging Guide for Session Request Flow Debugging

## Overview

Complete logging instrumentation has been added to trace the entire flow of session requests from button click through database operations to notifications. This guide explains all logging points and how to use them for debugging.

## Architecture Diagram

```
STUDENT SIDE
├── BrowseTeachers.tsx (handleSendRequest)
│   └── [BrowseTeachers] logs: validation, time parsing, API call dispatch
│
BACKEND SERVICE
├── SessionRequestService.createSessionRequest()
│   └── [createSessionRequest] logs: token check, validation, DB insert, notifications
│
├── SessionRequestService.acceptRequest()
│   └── [acceptRequest] logs: status update, profile fetches, notification creation
│
├── SessionRequestService.declineRequest()
│   └── [declineRequest] logs: status update, refunds, transaction recording, notification
│
├── SessionRequestService.getTeacherRequests(teacherId)
│   └── [getTeacherRequests] logs: request fetching, enrichment, return count
│
└── SessionRequestService.getStudentRequests(studentId)
    └── [getStudentRequests] logs: request fetching, teacher enrichment, return count

TEACHER SIDE
├── TeacherRequests.tsx
│   └── Calls getTeacherRequests(user.id)
└── Shows pending requests with accept/decline buttons
```

## Logging Points by Method

### 1. BrowseTeachers.tsx - handleSendRequest()

**File:** [src/components/student/BrowseTeachers.tsx](src/components/student/BrowseTeachers.tsx)

**Logs with prefix:** `[BrowseTeachers]`

| Log Point | Content | When Logged |
|-----------|---------|------------|
| Start validation | `selectedTeacher && user validation` | Before form validation |
| Form fields | `date, time, duration, message values` | During validation |
| Time parsing | `ISO parsed time, past check result` | After form submission |
| API call | `teacher_id, student_id, requested_start, requested_end` | Before service call |
| Success | `tokens deducted, confirmation message` | After successful call |
| Error | Full error object | On any exception |

**Example console output:**
```
[BrowseTeachers] Validating request form...
[BrowseTeachers] Form fields: {date: "2025-01-20", time: "14:30", duration: 1}
[BrowseTeachers] Parsed time: 2025-01-20T14:30:00Z (not in past ✓)
[BrowseTeachers] Sending request: {teacher_id: "uuid", student_id: "uuid", ...}
[BrowseTeachers] Success! 10 tokens will be deducted from your account
```

---

### 2. SessionRequestService.createSessionRequest()

**File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts)

**Logs with prefix:** `[createSessionRequest]`

This is the main backend entry point. Logs appear in this sequence:

| # | Log Point | Content | Detects |
|---|-----------|---------|---------|
| 1 | Method entry | `studentId, tokens_required, teacher_id` | Wrong parameters |
| 2 | Token fetch | `current tokens, required tokens, check result` | Token balance issues |
| 3 | Token check | `✓ or error message` | Insufficient tokens |
| 4 | Existing request check | `result: none/pending/accepted` | Duplicate requests |
| 5 | Expires at calc | `calculated expiration time` | Time calculation |
| 6 | DB insert attempt | `about to insert into session_requests` | Pre-insert state |
| 7 | DB insert result | `✓ success or error details` | **RLS policies, FK violations, DB errors** |
| 8 | Teacher profile fetch | `teacher full_name retrieved or not found` | Missing teacher profile |
| 9 | Student profile fetch | `student full_name retrieved or not found` | Missing student profile |
| 10 | Notification 1 create | `student notification (confirmation)` | Notification creation |
| 11 | Notification 1 retry | `if first attempt failed` | Temporary notification issues |
| 12 | Notification 2 create | `teacher notification (alert)` | Teacher notification creation |
| 13 | Notification 2 retry | `if first attempt failed` | Temporary notification issues |
| 14 | Success complete | `request_id, final status` | Full flow success |
| 15 | Error catch | Full error with code, message, details, hint | Any exception in flow |

**Example console output - SUCCESS PATH:**
```
[createSessionRequest] Starting session request creation {studentId: "s123", tokens_required: 10, teacher_id: "t456"}
[createSessionRequest] Fetched student tokens: {current_tokens: 25, required_tokens: 10}
[createSessionRequest] Token check passed ✓
[createSessionRequest] Checking for existing requests...
[createSessionRequest] No existing pending/accepted request found ✓
[createSessionRequest] Calculated expires_at: 2025-02-20T14:00:00Z (30 days from now)
[createSessionRequest] Inserting into session_requests table...
[createSessionRequest] ✓ Successfully inserted session_requests record {request_id: "req789"}
[createSessionRequest] Fetched teacher profile: {full_name: "Jane Smith"}
[createSessionRequest] Fetched student profile: {full_name: "John Doe"}
[createSessionRequest] Creating notification 1 (student confirmation)...
[createSessionRequest] ✓ Created notification 1
[createSessionRequest] Creating notification 2 (teacher alert)...
[createSessionRequest] ✓ Created notification 2
[createSessionRequest] ✓✓✓ Session request created successfully! {request_id: "req789"}
```

**Example console output - FAILURE (RLS Policy Block):**
```
[createSessionRequest] Starting session request creation {studentId: "s123", tokens_required: 10, teacher_id: "t456"}
[createSessionRequest] Fetched student tokens: {current_tokens: 25, required_tokens: 10}
[createSessionRequest] Token check passed ✓
[createSessionRequest] No existing pending/accepted request found ✓
[createSessionRequest] Calculated expires_at: 2025-02-20T14:00:00Z
[createSessionRequest] Inserting into session_requests table...
[createSessionRequest] ✗ Failed to insert into session_requests {
  code: "PGRST",
  message: "new row violates row level security policy",
  details: "Failing row contains...",
  hint: "Check RLS policy on session_requests table"
}
[createSessionRequest] Error inserting into session_requests: RLS policy violation
```

**Example console output - FAILURE (Insufficient Tokens):**
```
[createSessionRequest] Starting session request creation {studentId: "s123", tokens_required: 10, teacher_id: "t456"}
[createSessionRequest] Fetched student tokens: {current_tokens: 5, required_tokens: 10}
[createSessionRequest] ✗ Insufficient tokens! Have 5, need 10
```

---

### 3. SessionRequestService.acceptRequest()

**File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts)

**Logs with prefix:** `[acceptRequest]`

Tracks teacher accepting a pending student request.

| # | Log Point | Content | Detects |
|---|-----------|---------|---------|
| 1 | Start | `requestId, teacherResponse presence` | Entry point |
| 2 | DB update | `✓ or error` | **Status update failures** |
| 3 | Fetch details | `student_id, teacher_id retrieved` | Request lookup issues |
| 4 | Get teacher name | `full_name or fallback "the teacher"` | Profile fetch |
| 5 | Create notification | `✓ or error` | Notification creation |
| 6 | Complete | `requestId, status: accepted` | Full success |
| 7 | Error | Full error details | Any exception |

**Example console output - SUCCESS:**
```
[acceptRequest] Starting request acceptance {requestId: "req789", teacherResponse: "(provided)"}
[acceptRequest] Successfully updated session_requests status to accepted {requestId: "req789"}
[acceptRequest] Fetched request details {requestId: "req789", student_id: "s123", teacher_id: "t456"}
[acceptRequest] Retrieved teacher name {teacherName: "Jane Smith"}
[acceptRequest] Creating notification for student {studentProfileId: "s123", requestId: "req789"}
[acceptRequest] Successfully created acceptance notification {studentProfileId: "s123", requestId: "req789"}
[acceptRequest] Request acceptance completed successfully {requestId: "req789", status: "accepted"}
```

---

### 4. SessionRequestService.declineRequest()

**File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts)

**Logs with prefix:** `[declineRequest]`

Tracks teacher declining a pending request (includes token refund).

| # | Log Point | Content | Detects |
|---|-----------|---------|---------|
| 1 | Start | `requestId, declinedReason presence, teacherResponse presence` | Entry point |
| 2 | Status update | `✓ or error` | **Status update failures** |
| 3 | Fetch request | `tokens_required, student_id` | Request lookup |
| 4 | Fetch student | `current tokens balance` | Student lookup |
| 5 | Refund tokens | `tokens_refunded, new_balance calculated` | Token refund calculation |
| 6 | Update balance | `✓ or error` | **DB update failures** |
| 7 | Create transaction | `✓ or error` | Refund recording |
| 8 | Create notification | `✓ or error` | Decline notification |
| 9 | Complete | `requestId, status: declined, tokens_refunded` | Full success |
| 10 | Error | Full error details | Any exception |

**Example console output - SUCCESS:**
```
[declineRequest] Starting request decline process {requestId: "req789", declinedReason: "(provided)", teacherResponse: "(none)"}
[declineRequest] Successfully updated status to declined {requestId: "req789"}
[declineRequest] Fetched request details for refund {requestId: "req789", tokens_required: 10, student_id: "s123"}
[declineRequest] Fetched student token balance {student_id: "s123", current_tokens: 15}
[declineRequest] Successfully refunded tokens {student_id: "s123", tokens_refunded: 10, new_balance: 25}
[declineRequest] Successfully created refund transaction {student_id: "s123", tokens_refunded: 10}
[declineRequest] Creating decline notification for student {student_id: "s123", requestId: "req789"}
[declineRequest] Successfully completed request decline {requestId: "req789", status: "declined", tokens_refunded: 10}
```

---

### 5. SessionRequestService.getTeacherRequests(teacherId)

**File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts)

**Logs with prefix:** `[getTeacherRequests]`

Fetches pending/accepted/declined requests for a teacher (called when teacher opens "Requests" page).

| # | Log Point | Content | Detects |
|---|-----------|---------|---------|
| 1 | Entry | `teacherId` | Entry point |
| 2 | DB query | `✓ or error with code/message/hint` | **RLS policy issues, FK problems** |
| 3 | Return | `count: number of requests` | Results count |
| 4 | Error | Full error details with stack trace | Any exception |

**Example console output - SUCCESS:**
```
[getTeacherRequests] Fetching pending requests for teacher {teacherId: "t456"}
[getTeacherRequests] Returning enriched requests {teacherId: "t456", count: 3}
```

**Example console output - FAILURE:**
```
[getTeacherRequests] Fetching pending requests for teacher {teacherId: "t456"}
[getTeacherRequests] Error fetching teacher requests: {
  code: "PGRST",
  message: "new row violates row level security policy"
}
[getTeacherRequests] Error stack: at fetchRequests (sessionRequestService.ts:750)...
```

---

### 6. SessionRequestService.getStudentRequests(studentId)

**File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts)

**Logs with prefix:** `[getStudentRequests]`

Fetches all requests for a student (used on student's "My Requests" page).

| # | Log Point | Content | Detects |
|---|-----------|---------|---------|
| 1 | Entry | `studentId` | Entry point |
| 2 | DB query result | `✓ count: number of requests` | **RLS policy issues** |
| 3 | Enrichment | `count after enriching teacher data` | Data transformation |
| 4 | Return | `count of final requests` | Results |
| 5 | Error | Full error details | Any exception |

**Example console output - SUCCESS:**
```
[getStudentRequests] Fetching requests for student {studentId: "s123"}
[getStudentRequests] Successfully fetched requests {studentId: "s123", count: 2}
[getStudentRequests] Returning enriched requests {studentId: "s123", count: 2}
```

---

## How to Debug Using These Logs

### Scenario 1: "Send Request" button doesn't work

**Steps:**
1. Open your app in browser
2. Open DevTools: Press F12 → Console tab
3. As a student, go to Browse Teachers
4. Click "Send Request" on any teacher
5. Fill the form and submit
6. **Look for logs starting with `[BrowseTeachers]` and `[createSessionRequest]`**

**If you see:**
```
[BrowseTeachers] Validating request form... ✓
[BrowseTeachers] Parsed time: 2025-01-20T14:30:00Z ✓
[BrowseTeachers] Sending request: {teacher_id: "...", student_id: "...", ...}
[createSessionRequest] Starting session request creation ✓
[createSessionRequest] Fetched student tokens: {current_tokens: 25, ...}
[createSessionRequest] Token check passed ✓
[createSessionRequest] ✗ Failed to insert into session_requests {code: "PGRST", message: "violates row level security policy"}
```

**Diagnosis:** RLS policy on `session_requests` table is blocking the insert. Need to verify RLS policies allow the student's insert.

---

### Scenario 2: Request created but teacher doesn't see it

**Steps:**
1. Send a request as student (see logs showing successful creation)
2. Log in as teacher
3. Open "Requests" page
4. **Check DevTools console for `[getTeacherRequests]` logs**

**If you see:**
```
[getTeacherRequests] Fetching pending requests for teacher {teacherId: "t456"}
[getTeacherRequests] Error fetching teacher requests: {code: "PGRST", ...}
```

**Diagnosis:** RLS policy on `session_requests` table is preventing teacher from reading requests. The teacher needs read permissions on rows where `teacher_id` matches their ID.

---

### Scenario 3: Accept/Decline buttons don't work

**Steps:**
1. With logs visible, teacher clicks "Accept" on a pending request
2. **Check for `[acceptRequest]` or `[declineRequest]` logs**

**If you see:**
```
[acceptRequest] Starting request acceptance {requestId: "req789", ...}
[acceptRequest] Successfully updated session_requests status to accepted ✓
[acceptRequest] ✗ Failed to create notification {error: "RLS policy violation"}
```

**Diagnosis:** Notification creation is blocked by RLS policy. This might be because the teacher's ID doesn't match the notification's user_id.

---

### Scenario 4: Tokens not being deducted

**Steps:**
1. Check student balance before sending request
2. Send request
3. Check logs for token deduction

**If you see:**
```
[createSessionRequest] ✗ Insufficient tokens! Have 5, need 10
```

**Diagnosis:** Student doesn't have enough tokens. They need to buy more.

**If you see:**
```
[createSessionRequest] Fetched student tokens: {current_tokens: 25, required_tokens: 10}
[createSessionRequest] Token check passed ✓
... (request created successfully)
[createSessionRequest] ✓✓✓ Session request created successfully!
```

But student balance didn't decrease, then the tokens are deducted at a different point (possibly during the actual session creation, not request creation).

---

### Scenario 5: Filtering by prefix in DevTools

**To see only request creation logs:**
1. In DevTools Console, type in the filter box at the top: `[createSessionRequest]`
2. All other logs will be hidden
3. Press Escape to clear filter

**To see entire request flow:**
1. Filter by: `[createSessionRequest]|[acceptRequest]|[getTeacherRequests]` (regex enabled)
2. Shows all request-related logs

---

## Common Error Codes & Solutions

| Error Code | Message | Solution |
|------------|---------|----------|
| `PGRST` | `new row violates row level security policy` | Check RLS policies on the table. Likely need to add role check for students/teachers. |
| `23503` | `violates foreign key constraint` | Check that teacher_id or student_id values are valid in their respective tables. |
| `23502` | `violates not-null constraint` | A required column is missing (check tokens_required, requested_start, etc.) |
| `42P01` | `relation does not exist` | Table name typo or table hasn't been created. |

---

## Next Steps for Debugging

1. **Run the app** and test the "Send Request" flow
2. **Check DevTools console** and note ALL logs with `[createSessionRequest]` prefix
3. **Share the console output** showing where it fails
4. **Based on the failure point**, we can:
   - Fix RLS policies if DB insert fails
   - Fix ID mapping if FK constraint fails
   - Fix notification permissions if notification creation fails
   - Fix service logic if logic error fails

---

## Files Modified

- [src/components/student/BrowseTeachers.tsx](src/components/student/BrowseTeachers.tsx) - Added [BrowseTeachers] logs (~60 lines)
- [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts) - Added comprehensive logging to:
  - createSessionRequest() (~170 new lines)
  - acceptRequest() (~100 new lines)
  - declineRequest() (~130 new lines)
  - getTeacherRequests() (~30 new lines)
  - getStudentRequests() (~40 new lines)

**Total logging added:** ~530 lines of instrumentation across the entire request flow
