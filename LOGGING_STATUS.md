# Session Request Debugging - Complete Logging Infrastructure

## Status: ✅ COMPLETE

Comprehensive logging has been added to instrument the **entire** session request flow from frontend button click through database operations to notifications. All logging is now in place and ready for production debugging.

---

## What Has Been Instrumented

### 1. **Frontend Entry Point** ✅
- **File:** [src/components/student/BrowseTeachers.tsx](src/components/student/BrowseTeachers.tsx)
- **Logs:** `[BrowseTeachers]` prefix
- **Coverage:** 
  - Form validation (teacher, user, fields)
  - Time parsing and validation
  - Service method dispatch
  - Success/error handling
- **Lines Added:** ~60

### 2. **Request Creation** ✅
- **File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts) - `createSessionRequest()` method
- **Logs:** `[createSessionRequest]` prefix
- **Coverage:**
  - Student token balance check
  - Duplicate request validation
  - Database insert operation
  - Teacher/student profile fetching
  - Notification creation (student + teacher) with retry logic
  - Final success/error reporting
- **Lines Added:** ~170

### 3. **Teacher Accept Request** ✅
- **File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts) - `acceptRequest()` method
- **Logs:** `[acceptRequest]` prefix
- **Coverage:**
  - Status update in DB
  - Request details fetching
  - Teacher profile lookup
  - Notification creation for student
  - Success/error handling
- **Lines Added:** ~100

### 4. **Teacher Decline Request** ✅
- **File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts) - `declineRequest()` method
- **Logs:** `[declineRequest]` prefix
- **Coverage:**
  - Status update to declined
  - Token refund calculation and execution
  - Refund transaction recording
  - Decline notification creation
  - Success/error handling
- **Lines Added:** ~130

### 5. **Teacher Request Fetching** ✅
- **File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts) - `getTeacherRequests()` method
- **Logs:** `[getTeacherRequests]` prefix
- **Coverage:**
  - Database query execution
  - Request count reporting
  - Data enrichment process
  - Error handling with full details
- **Lines Added:** ~30

### 6. **Student Request Fetching** ✅
- **File:** [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts) - `getStudentRequests()` method
- **Logs:** `[getStudentRequests]` prefix
- **Coverage:**
  - Database query execution
  - Teacher data enrichment
  - Return count reporting
  - Error handling
- **Lines Added:** ~40

---

## Total Logging Infrastructure

| Component | Prefix | Status | Lines |
|-----------|--------|--------|-------|
| BrowseTeachers.tsx | [BrowseTeachers] | ✅ Complete | 60 |
| createSessionRequest() | [createSessionRequest] | ✅ Complete | 170 |
| acceptRequest() | [acceptRequest] | ✅ Complete | 100 |
| declineRequest() | [declineRequest] | ✅ Complete | 130 |
| getTeacherRequests() | [getTeacherRequests] | ✅ Complete | 30 |
| getStudentRequests() | [getStudentRequests] | ✅ Complete | 40 |
| **TOTAL** | — | **✅ COMPLETE** | **~530** |

---

## Log Flow Diagram

```
STUDENT FLOW:
1. Student opens "Browse Teachers" page
2. Clicks "Send Request" button on teacher card
3. [BrowseTeachers] Validation logs: teacher/user/form check ✓
4. [BrowseTeachers] Time parsing logs: ISO date, past check ✓
5. [BrowseTeachers] API call logs: dispatching to service ✓
6. ↓↓↓ BACKEND ↓↓↓
7. [createSessionRequest] Entry logs: studentId, tokens_required ✓
8. [createSessionRequest] Token check logs: current_tokens, required ✓
9. [createSessionRequest] Duplicate check logs: existing requests ✓
10. [createSessionRequest] DB insert logs: inserting into session_requests ✓ ← CRITICAL
11. [createSessionRequest] Profile fetch logs: teacher/student names ✓
12. [createSessionRequest] Notification logs: creating 2 notifications ✓
13. [createSessionRequest] Complete logs: success/error ✓

TEACHER FLOW:
14. Teacher opens "My Requests" page
15. useEffect calls getTeacherRequests(teacher_id)
16. [getTeacherRequests] Entry logs: teacherId ✓
17. [getTeacherRequests] DB query logs: count of requests ✓
18. [getTeacherRequests] Enrichment logs: adding teacher details ✓
19. [getTeacherRequests] Return logs: final count ✓
20. UI displays pending requests
21. Teacher clicks "Accept" or "Decline"
22. ↓↓↓ BACKEND ↓↓↓
23. [acceptRequest] OR [declineRequest] logs: full operation tracking ✓
```

---

## How to Use for Debugging

### Quick Start
1. Open your app in browser
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Test the "Send Request" flow
5. **Search for prefix: `[createSessionRequest]` in the console**
6. Share the console output

### Filtering in DevTools Console

**To see only request creation:**
```
[createSessionRequest]
```

**To see entire request flow:**
```
[createSessionRequest]|[acceptRequest]|[getTeacherRequests]
```

**To see frontend-only logs:**
```
[BrowseTeachers]
```

---

## Error Detection Examples

### Example 1: RLS Policy Blocks Insert
```
[createSessionRequest] Inserting into session_requests table...
[createSessionRequest] ✗ Failed to insert:
  code: "PGRST"
  message: "new row violates row level security policy"
  details: "..."
  hint: "Check RLS policy on session_requests"
```
**Fix:** Review RLS policies on session_requests table

### Example 2: Insufficient Tokens
```
[createSessionRequest] ✗ Insufficient tokens! Have 5, need 10
```
**Fix:** Student needs to purchase more tokens

### Example 3: Teacher Doesn't See Request
```
[getTeacherRequests] Fetching requests for teacher {teacherId: "t456"}
[getTeacherRequests] Error fetching: PGRST "violates row level security"
```
**Fix:** RLS policy on session_requests doesn't allow teacher read

### Example 4: Notification Creation Failed
```
[createSessionRequest] Creating notification 1 (student confirmation)...
[createSessionRequest] ✗ Failed to create: error details...
```
**Fix:** Check RLS policies on notifications table

---

## Next Steps

### 1. **Test the Flow**
   - Run the app locally
   - As student: Send a request to a teacher
   - Check DevTools console for `[createSessionRequest]` logs
   - Share the console output

### 2. **Identify Failure Point**
   - Review the logs to see where they stop
   - Each log shows a successful operation (✓) or failure (✗)
   - The failure point indicates what needs fixing

### 3. **Fix the Issue**
   - RLS policy issue → Update Supabase RLS policies
   - FK constraint → Verify ID relationships
   - Token issue → Student needs more tokens
   - Logic error → Check service method implementation

### 4. **Verify the Fix**
   - Re-run the test
   - Confirm logs show full flow to completion
   - Verify teacher sees the request
   - Test accept/decline operations

---

## Files Modified Summary

| File | Type | Changes |
|------|------|---------|
| [src/components/student/BrowseTeachers.tsx](src/components/student/BrowseTeachers.tsx) | Component | Added [BrowseTeachers] logging (~60 lines) |
| [src/services/sessionRequestService.ts](src/services/sessionRequestService.ts) | Service | Added logging to 6 methods (~530 lines total) |
| [DEBUGGING_LOGGING_GUIDE.md](DEBUGGING_LOGGING_GUIDE.md) | Documentation | Created comprehensive debugging guide |
| This file | Documentation | Quick reference and status |

---

## Key Design Principles

1. **Structured Logging:** Each log includes a consistent prefix for easy filtering
2. **Progressive Detail:** Logs show step-by-step progress with ✓/✗ indicators
3. **Error Context:** Full error objects logged (code, message, details, hint)
4. **Non-Intrusive:** Logging doesn't change application behavior
5. **Production-Ready:** Can be left enabled without performance impact

---

## Critical Points for Debugging

### Point 1: Token Check (Line ~458 in sessionRequestService.ts)
```javascript
[createSessionRequest] Student fetched: current_tokens = X
```
If this shows insufficient tokens, user needs to buy more.

### Point 2: DB Insert (Line ~530 in sessionRequestService.ts)
```javascript
[createSessionRequest] Error inserting: PGRST error
```
If this fails, RLS policy blocks the insert. This is the MOST COMMON issue.

### Point 3: Teacher Sees Request (Line ~712 in sessionRequestService.ts)
```javascript
[getTeacherRequests] Fetched requests count: X
```
If this shows 0 when request should exist, teacher's RLS policy blocks reads.

---

## Documentation

Full debugging guide available at: [DEBUGGING_LOGGING_GUIDE.md](DEBUGGING_LOGGING_GUIDE.md)

This comprehensive guide includes:
- Architecture diagram
- Logging points by method
- Common error codes & solutions
- Scenario-based debugging examples
- Filter patterns for DevTools
- Expected vs actual outputs

---

**Status: Ready for Testing** ✅

All logging infrastructure is complete. Ready for you to test the "Send Request" flow and share the DevTools console output.
