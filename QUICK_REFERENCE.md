# Session Request Flow - Quick Reference Card

## 🚀 Quick Start - Testing Send Request

```
1. npm run dev                    (Start app)
2. F12                            (Open DevTools)
3. Console tab                    (Switch to console)
4. Log in as student
5. Go to Browse Teachers
6. Click "Send Request"
7. Fill form & submit
8. Search console: [createSessionRequest]
9. Share the output
```

---

## 📊 Log Prefix Quick Reference

| Prefix | Location | Logs What |
|--------|----------|-----------|
| `[BrowseTeachers]` | Frontend component | Form submission & validation |
| `[createSessionRequest]` | Service method | Request creation & DB insert |
| `[acceptRequest]` | Service method | Teacher accepting request |
| `[declineRequest]` | Service method | Teacher declining request |
| `[getTeacherRequests]` | Service method | Fetching teacher's requests |
| `[getStudentRequests]` | Service method | Fetching student's requests |

---

## 🔍 Finding the Problem

### In DevTools Console:

**Filter for:**
```
[createSessionRequest]
```

**Look for pattern:**
```
✓ = Success     (Shows next step)
✗ = Failure     (Shows error code)
```

**Common failure points:**
1. **Line 1:** `[createSessionRequest] Starting...` ← Did request start?
2. **Line 5:** `[createSessionRequest] Token check...` ← Are tokens sufficient?
3. **Line 8:** `[createSessionRequest] Inserting...` ← Can we insert? **← MOST COMMON FAILURE**
4. **Line 12:** `[createSessionRequest] Creating notifications...` ← Can we notify?
5. **Line 15:** `[createSessionRequest] ✓✓✓ SUCCESS` ← Did it work?

---

## 🐛 Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `PGRST` | RLS Policy violation | Update Supabase RLS policies |
| `23503` | Foreign key missing | Verify teacher/student IDs exist |
| `23502` | Not-null constraint | Check required columns |
| Timeout | Request too slow | Check network/database |
| No logs at all | Frontend error | Check for JS errors first |

---

## ✅ Success Path

```
[createSessionRequest] Starting request creation
    ↓
[createSessionRequest] Student fetched: current_tokens = 25
    ↓
[createSessionRequest] Token check passed ✓
    ↓
[createSessionRequest] No existing pending request found ✓
    ↓
[createSessionRequest] ✓ Successfully inserted session_requests record
    ↓
[createSessionRequest] ✓ Created notification 1
    ↓
[createSessionRequest] ✓ Created notification 2
    ↓
[createSessionRequest] ✓✓✓ Session request created successfully!
```

---

## ❌ Failure Path (RLS Policy)

```
[createSessionRequest] Starting request creation
    ↓
[createSessionRequest] Student fetched: current_tokens = 25
    ↓
[createSessionRequest] Token check passed ✓
    ↓
[createSessionRequest] ✗ Failed to insert into session_requests
    ↓
ERROR: code: "PGRST"
ERROR: message: "new row violates row level security policy"
    ↓
FIX: Check RLS policies on session_requests table
```

---

## 🎯 Critical Points to Check

### If DB insert fails (MOST LIKELY):
1. Go to Supabase dashboard
2. Click "Tables" → "session_requests"
3. Click "Policies" tab
4. Check if students can INSERT
5. Verify policy allows student_id = current_user

### If teacher can't see request:
1. Go to Supabase dashboard
2. Click "Tables" → "session_requests"
3. Click "Policies" tab
4. Check if teachers can SELECT
5. Verify policy allows teacher_id = current_user

### If notifications not created:
1. Go to Supabase dashboard
2. Click "Tables" → "notifications"
3. Click "Policies" tab
4. Check if inserts are allowed
5. Verify user_id policy

---

## 📋 Full Flow Checklist

```
□ Student clicks "Send Request"
  └─ [BrowseTeachers] logs appear ✓

□ Form validation passes
  └─ [BrowseTeachers] "Form fields:" log shows values ✓

□ Time parsing works
  └─ [BrowseTeachers] "Parsed times:" log shows ISO dates ✓

□ API call dispatches
  └─ [BrowseTeachers] "Calling SessionRequestService:" log appears ✓

□ Service receives request
  └─ [createSessionRequest] "Starting:" log appears ✓

□ Token check passes
  └─ [createSessionRequest] "Token check passed ✓" log appears ✓

□ DB insert succeeds
  └─ [createSessionRequest] "Successfully inserted:" log appears ✓

□ Notifications created
  └─ [createSessionRequest] "Created notification 1,2" logs appear ✓

□ Request completed
  └─ [createSessionRequest] "✓✓✓ SUCCESS" log appears ✓

□ Teacher sees request
  └─ Log in as teacher, check My Requests page ✓

□ Teacher can accept/decline
  └─ [acceptRequest] or [declineRequest] logs appear ✓

□ Student receives notification
  └─ Check student's Notifications page ✓
```

---

## 🔧 Minimal Fix Checklist

If RLS policy blocks insert (most common):

```sql
-- Add policy to allow students to create requests
ALTER POLICY "Allow students to create requests" 
  ON session_requests
  USING (auth.uid() = student_id);

-- Add policy to allow teachers to read their requests
ALTER POLICY "Allow teachers to read their requests"
  ON session_requests
  USING (auth.uid() = teacher_id);
```

---

## 📖 Detailed Docs

- **Full Guide:** [DEBUGGING_LOGGING_GUIDE.md](DEBUGGING_LOGGING_GUIDE.md)
- **Status & Summary:** [LOGGING_STATUS.md](LOGGING_STATUS.md)
- **Implementation Details:** [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)

---

## 💡 Pro Tips

1. **Copy console:** Right-click console → Save as... → Save output
2. **Filter logs:** Type in filter box at top of Console
3. **Pause on error:** Settings → Pause on exceptions
4. **Clear on navigate:** Settings → Preserve log
5. **Search:** Ctrl+F in console to find keywords

---

## 📞 Ready to Debug?

**Have logs showing:**
1. Copy the console output with all [createSessionRequest] logs
2. Note the exact log line where the ✗ failure appears
3. Share that point - it tells us exactly what's wrong

**Example output to share:**
```
[createSessionRequest] ✗ Failed to insert into session_requests {
  code: "PGRST",
  message: "new row violates row level security policy",
  ...
}
```

This tells us immediately: **Need to fix RLS policies**

---

**Logging Status: ✅ COMPLETE & READY**

All instrumentation in place. Ready to test and debug!
