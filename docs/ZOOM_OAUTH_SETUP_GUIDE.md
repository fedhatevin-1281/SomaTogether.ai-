# 🔐 Zoom OAuth 2.0 Server to Server Setup Guide

## ✅ Your Credentials

Your Zoom app has been created with **Server to Server OAuth 2.0**. Here are your credentials:

| Credential | Value |
|-----------|-------|
| **Account ID** | `dKp06igqSOaKu98cve0vBA` |
| **Client ID** | `krrTrMonQLKtx9SLmxJMDQ` |
| **Client Secret** | `FQr4jxJfWcG9GW4zv2LcNuNdU6ZmUxId` |
| **Webhook Secret Token** | `5EhrGFt9QOm9hwnPxPRu9Q` |

⚠️ **SECURITY WARNING**: Keep these credentials safe! Never commit them to git or share publicly.

---

## 🚀 Setup Steps

### **Step 1: Update Environment Variables**

Add these to your `.env` or `.env.local` file:

```env
# ===== Zoom OAuth 2.0 Configuration =====
ZOOM_OAUTH_CLIENT_ID=krrTrMonQLKtx9SLmxJMDQ
ZOOM_OAUTH_CLIENT_SECRET=FQr4jxJfWcG9GW4zv2LcNuNdU6ZmUxId
ZOOM_ACCOUNT_ID=dKp06igqSOaKu98cve0vBA
ZOOM_WEBHOOK_SECRET_TOKEN=5EhrGFt9QOm9hwnPxPRu9Q
```

### **Step 2: Install Dependencies**

If not already installed, add axios for HTTP requests:

```bash
npm install axios
```

### **Step 3: Add OAuth Service to Your Backend**

Copy `zoomOAuthService.ts` to `src/services/`:

```
src/services/zoomOAuthService.ts  ✅ Created
```

### **Step 4: Add API Endpoints**

Copy the endpoints from `zoom-oauth-api-endpoints.js` to your `server.js`:

```javascript
// Add at the top of server.js
const { zoomOAuthService } = require('./src/services/zoomOAuthService');

// Add all endpoints from zoom-oauth-api-endpoints.js
// See: zoom-oauth-api-endpoints.js
```

### **Step 5: Configure Webhook (Important!)**

In Zoom Marketplace, you need to set up the webhook:

1. Go to: https://marketplace.zoom.us/
2. Select your app
3. Go to **"Webhooks"** section
4. Set Webhook URL to:
   ```
   https://yourdomain.com/api/zoom/webhook
   ```
5. Subscribe to these events:
   - `meeting.started`
   - `meeting.ended`
   - `recording.completed`
   - `meeting.participant_joined`
   - `meeting.participant_left`

### **Step 6: Test the Integration**

```bash
# Test if OAuth token generation works
curl -X POST http://localhost:5000/api/zoom/test-token
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully obtained OAuth token",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 📋 How OAuth 2.0 Works (Server to Server)

### **Token Generation Flow:**

```
┌─────────────────┐
│  Your Backend   │
└────────┬────────┘
         │ 1. Request token with Client ID + Secret
         │ (grant_type: account_credentials)
         ▼
┌─────────────────────────┐
│  Zoom OAuth Endpoint    │
│  zoom.us/oauth/token    │
└────────┬────────────────┘
         │ 2. Return access token (expires in 1 hour)
         ▼
┌─────────────────┐
│  Your Backend   │ (Token cached for 59 minutes)
└────────┬────────┘
         │ 3. Use token for API requests
         ▼
┌──────────────────────────┐
│  Zoom API (v2)           │
│  api.zoom.us/v2/...      │
└──────────────────────────┘
```

### **Key Differences from JWT:**

| Feature | JWT | Server to Server OAuth |
|---------|-----|----------------------|
| Token Lifetime | Long-lived (custom) | Short (1 hour, auto-refresh) |
| Activation | Immediate | Usually immediate |
| Security | App credentials only | Bearer token based |
| Complexity | Simpler | More secure |
| Status | Phased out | **Recommended by Zoom** |

---

## 🔧 Available API Endpoints

### **Webhooks**
- `POST /api/zoom/webhook` - Receive Zoom events

### **Meeting Management**
- `POST /api/zoom/meetings/create` - Create a meeting
- `GET /api/zoom/meetings/:meetingId` - Get meeting details
- `PUT /api/zoom/meetings/:meetingId` - Update a meeting
- `DELETE /api/zoom/meetings/:meetingId` - Delete a meeting

### **User & Participant Management**
- `GET /api/zoom/users/:userId/meetings` - Get user's meetings
- `GET /api/zoom/meetings/:meetingId/participants` - Get meeting participants
- `GET /api/zoom/meetings/:meetingId/recordings` - Get meeting recordings
- `GET /api/zoom/users/:userId` - Get Zoom user details

### **Health & Status**
- `GET /api/zoom/status` - Check service status
- `POST /api/zoom/test-token` - Test token generation (dev only)

---

## 📝 Usage Examples

### **Create a Meeting**

```bash
curl -X POST http://localhost:5000/api/zoom/meetings/create \
  -H "Content-Type: application/json" \
  -d '{
    "zoomUserId": "user123",
    "topic": "Class Session",
    "startTime": "2024-01-15T10:00:00Z",
    "duration": 60,
    "password": "optional123"
  }'
```

### **Get Meeting Participants**

```bash
curl -X GET http://localhost:5000/api/zoom/meetings/123456789/participants
```

### **Get Meeting Recordings**

```bash
curl -X GET http://localhost:5000/api/zoom/meetings/123456789/recordings
```

---

## 🐛 Troubleshooting

### **Issue: "Missing credentials" Error**

**Solution**: Check that all environment variables are set:
```bash
echo $ZOOM_OAUTH_CLIENT_ID
echo $ZOOM_OAUTH_CLIENT_SECRET
echo $ZOOM_ACCOUNT_ID
echo $ZOOM_WEBHOOK_SECRET_TOKEN
```

### **Issue: "Invalid access token" Error**

**Solutions**:
1. Verify your credentials are correct
2. Check that your app is **activated** in Zoom Marketplace
3. Try restarting your server (will clear token cache)
4. Check timezone on your server (must be accurate for OAuth)

### **Issue: Webhook Events Not Received**

**Solutions**:
1. Verify webhook URL is accessible from the internet
2. Check that Secret Token is correct in environment
3. Look for webhook delivery logs in Zoom Marketplace
4. Use `POST /api/zoom/webhook` with proper signature headers

### **Issue: "Insufficient privileges" Error**

**Solution**: Make sure your Zoom app has the required scopes:
- `meeting:write:admin`
- `meeting:read:admin`
- `recording:read:admin`
- `user:read:admin`

Check in Zoom Marketplace → Your App → Scopes

---

## 🔒 Security Best Practices

### **1. Store Credentials Securely**
- ✅ Use environment variables
- ❌ Never hardcode credentials
- ❌ Never commit `.env` to git

### **2. Token Management**
- Tokens are automatically cached and refreshed
- Invalid tokens are cleared and re-requested
- Never expose tokens in logs (service redacts them)

### **3. Webhook Verification**
- Every webhook is verified using Secret Token
- Invalid signatures are rejected
- Prevents spoofed webhook events

### **4. API Rate Limiting**
- Zoom has rate limits (varies by plan)
- Service handles retries automatically
- Monitor your usage in Zoom Marketplace

---

## 📚 Files Created

1. **`src/services/zoomOAuthService.ts`** - OAuth 2.0 service
2. **`zoom-oauth-api-endpoints.js`** - API endpoints
3. **`ZOOM_OAUTH_SETUP_GUIDE.md`** - This guide

---

## 🎯 Next Steps

1. ✅ Add credentials to `.env`
2. ✅ Add endpoints to `server.js`
3. ✅ Configure webhook in Zoom Marketplace
4. ✅ Test with `/api/zoom/status`
5. ✅ Create first meeting with `/api/zoom/meetings/create`
6. ✅ Integrate with teacher/student dashboards

---

## 📞 Resources

- **Zoom OAuth Documentation**: https://marketplace.zoom.us/docs/guides/auth/oauth
- **Zoom API Reference**: https://marketplace.zoom.us/docs/api-reference/zoom-api
- **Webhooks Guide**: https://marketplace.zoom.us/docs/guide/webhooks
- **Zoom Marketplace**: https://marketplace.zoom.us/

---

## ⚠️ Important Notes

### **OAuth Token Expiration**
- Access tokens expire after **1 hour**
- `zoomOAuthService` automatically refreshes them
- You don't need to manually handle token refresh

### **Webhook Retries**
- Zoom retries failed webhooks multiple times
- Respond with 2xx status quickly
- Process heavy operations asynchronously

### **Rate Limits**
- Zoom API has rate limits based on your plan
- Default: 30 requests per second
- Monitor usage in Zoom Marketplace dashboard

---

**Status**: ✅ **Ready to Use**
**Last Updated**: 2024
**OAuth Version**: 2.0 (Server to Server)
