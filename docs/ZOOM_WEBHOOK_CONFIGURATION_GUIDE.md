# 🔔 Zoom Webhook Configuration Guide

## What are Webhooks?

Webhooks allow Zoom to notify your backend in **real-time** when important events happen:
- Meetings start/end
- Recordings complete
- Participants join/leave

Instead of polling Zoom for updates, they push events to you automatically.

---

## 🚀 Setting Up Webhooks in Zoom Marketplace

### **Step 1: Access Your App**
1. Go to https://marketplace.zoom.us/
2. Click "Develop" → "My Apps"
3. Select your app: **SomaTogether.ai Integration**

### **Step 2: Navigate to Webhooks Section**
1. In your app, look for **"Feature"** or **"Webhooks"** tab
2. You might see **"Event Subscriptions"**

### **Step 3: Configure Notification URL**
1. Find the field **"Event notification endpoint URL"**
2. Enter:
   ```
   https://yourdomain.com/api/zoom/webhook
   ```
   
   Replace `yourdomain.com` with your actual domain!

3. Click **"Save"**

### **Step 4: Subscribe to Events**

Enable these webhooks:

| Event | Purpose |
|-------|---------|
| `meeting.started` | Record when meetings begin |
| `meeting.ended` | Record when meetings finish |
| `recording.completed` | Get download/play URLs when recording finishes |
| `meeting.participant_joined` | Track attendance (participant joins) |
| `meeting.participant_left` | Track attendance (participant leaves) |

**To subscribe:**
1. Each event has a toggle/checkbox
2. Enable all 5 events listed above
3. Save

### **Step 5: Verify Webhook URL (Optional)**

Zoom will send a challenge request to verify your endpoint works:
1. Your endpoint should respond to `POST /api/zoom/webhook` with proper signature verification
2. The `zoomOAuthService` automatically handles this

---

## 🔒 Webhook Security

### **Webhook Signature Verification**

Every webhook from Zoom includes:
- **Header**: `x-zm-request-timestamp` - Request time
- **Header**: `x-zm-signature` - HMAC-SHA256 signature

Your service (`zoomOAuthService.verifyWebhookSignature`) verifies:
1. The request is actually from Zoom
2. The request hasn't been tampered with
3. The request is not too old (within 5 minutes)

### **Secret Token**

Your webhook secret token:
```
5EhrGFt9QOm9hwnPxPRu9Q
```

This is used to compute the signature. Keep it safe!

---

## 📥 Webhook Event Examples

### **Meeting Started**
```json
{
  "event": "meeting.started",
  "payload": {
    "object": {
      "id": 123456789,
      "uuid": "ABC123==",
      "host_id": "host_user_id",
      "topic": "Class Session",
      "type": 2,
      "start_time": "2024-01-15T10:00:00Z"
    }
  }
}
```

### **Participant Joined**
```json
{
  "event": "meeting.participant_joined",
  "payload": {
    "object": {
      "id": 123456789,
      "participant": {
        "id": "participant_id",
        "user_id": "zoom_user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "join_time": "2024-01-15T10:05:00Z"
      }
    }
  }
}
```

### **Recording Completed**
```json
{
  "event": "recording.completed",
  "payload": {
    "object": {
      "id": 123456789,
      "uuid": "ABC123==",
      "recording_files": [
        {
          "id": "recording_id",
          "recording_type": "shared_screen_with_speaker_view",
          "play_url": "https://zoom.us/rec/...",
          "download_url": "https://zoom.us/rec/...",
          "file_size": 1073741824,
          "duration": 3600,
          "status": "completed"
        }
      ]
    }
  }
}
```

---

## 🔄 Webhook Retry Logic

If your endpoint fails to respond:
1. **Immediate retry** - Within seconds
2. **Short retry** - Within minutes
3. **Long retry** - Within hours

To avoid retries:
- ✅ Respond with HTTP 200 immediately
- ✅ Process heavy operations asynchronously
- ❌ Don't do long-running tasks in webhook handler

---

## 🧪 Testing Webhooks

### **Option 1: Use Zoom Marketplace Test**

1. In Zoom Marketplace, find the webhook test button
2. Select an event type
3. Click "Send Test Event"
4. Check your server logs for the webhook

### **Option 2: Test Locally with ngrok**

For development, use ngrok to expose local server:

```bash
# Install ngrok: https://ngrok.com/

# Start ngrok (points to your local server on port 5000)
ngrok http 5000

# You'll get a URL like: https://abc123.ngrok.io
# Use this in Zoom Marketplace: https://abc123.ngrok.io/api/zoom/webhook
```

### **Option 3: Check Server Logs**

Your server logs will show webhook events:

```
✅ Zoom webhook event: meeting.started
✅ Webhook signature verified
✅ Meeting marked as started
```

---

## 🐛 Troubleshooting Webhooks

### **Issue: Webhooks Not Received**

**Checklist:**
1. ✅ URL is correct and publicly accessible
2. ✅ URL includes `/api/zoom/webhook` path
3. ✅ Server is running and responding
4. ✅ Firewall allows incoming traffic on port 443 (HTTPS)
5. ✅ Events are enabled in Marketplace

**Test with curl:**
```bash
# This simulates a webhook (without proper signature)
curl -X POST https://yourdomain.com/api/zoom/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "meeting.started"}'
```

### **Issue: "Invalid Webhook Signature"**

**Solutions:**
1. Verify `ZOOM_WEBHOOK_SECRET_TOKEN` is correct
2. Check server timezone is accurate (used for signature verification)
3. Ensure server time is synced with NTP

### **Issue: Webhooks Stop Working**

**Possible causes:**
1. URL changed but not updated in Zoom Marketplace
2. Domain/SSL certificate expired
3. Server restarted and needs restart of webhook listener
4. Rate limiting triggered

---

## 📊 Webhook Event Flow

```
Zoom Platform
    │
    │ Event occurs (e.g., meeting starts)
    │
    ▼
Zoom generates event payload
    │
    │ Creates HMAC-SHA256 signature
    │ Adds x-zm-request-timestamp header
    │ Adds x-zm-signature header
    │
    ▼
POST to your webhook URL
    │
    ▼
Your server receives webhook
    │
    ├─ Verify signature with ZOOM_WEBHOOK_SECRET_TOKEN
    │  │
    │  ├─ ✅ Valid → Process event
    │  │         └─ Update database
    │  │         └─ Trigger notifications
    │  │         └─ Return HTTP 200
    │  │
    │  └─ ❌ Invalid → Log error, return 401
    │
    ▼
Done! Respond within 3 seconds
```

---

## 🎯 Event Handling in Your Code

The `zoomOAuthService` automatically handles webhooks:

```typescript
// Receives webhook event
POST /api/zoom/webhook

// Service verifies signature
verifyWebhookSignature(headers, body, secretToken)

// Calls appropriate handler
handleWebhookEvent(event)
  ├─ meeting.started → handleMeetingStarted()
  ├─ meeting.ended → handleMeetingEnded()
  ├─ recording.completed → handleRecordingCompleted()
  ├─ meeting.participant_joined → handleParticipantJoined()
  └─ meeting.participant_left → handleParticipantLeft()

// Updates database automatically
await supabase.from('zoom_meetings').update(...)
```

---

## 📝 Webhook Response Format

**Always respond with:**

```json
{
  "success": true
}
```

**Status code**: `200 OK`

Zoom doesn't care about response body, but needs:
- ✅ Response within 3 seconds
- ✅ HTTP 200 status code
- ✅ No errors in processing

---

## 🔗 Important Links

- **Webhook Documentation**: https://marketplace.zoom.us/docs/guide/webhooks
- **Event Types**: https://marketplace.zoom.us/docs/api-reference/webhooks/webhook-events
- **Zoom Marketplace**: https://marketplace.zoom.us/
- **API Reference**: https://marketplace.zoom.us/docs/api-reference/zoom-api

---

## 🚀 Next Steps

1. ✅ Configure webhook URL in Zoom Marketplace
2. ✅ Subscribe to required events
3. ✅ Test webhook endpoint
4. ✅ Monitor server logs for events
5. ✅ Verify database updates when events occur

---

**Status**: ✅ Ready to Configure
**Setup Time**: 10-15 minutes
