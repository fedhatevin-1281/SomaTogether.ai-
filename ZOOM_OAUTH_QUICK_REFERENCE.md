# 🎯 Zoom OAuth 2.0 Quick Reference Card

## 🔑 Credentials

```
Account ID:          dKp06igqSOaKu98cve0vBA
Client ID:           krrTrMonQLKtx9SLmxJMDQ
Client Secret:       FQr4jxJfWcG9GW4zv2LcNuNdU6ZmUxId
Webhook Secret:      5EhrGFt9QOm9hwnPxPRu9Q
```

## 📝 Environment Variables

```env
ZOOM_OAUTH_CLIENT_ID=krrTrMonQLKtx9SLmxJMDQ
ZOOM_OAUTH_CLIENT_SECRET=FQr4jxJfWcG9GW4zv2LcNuNdU6ZmUxId
ZOOM_ACCOUNT_ID=dKp06igqSOaKu98cve0vBA
ZOOM_WEBHOOK_SECRET_TOKEN=5EhrGFt9QOm9hwnPxPRu9Q
```

## 📚 Essential Docs

| Document | Purpose |
|----------|---------|
| **ZOOM_OAUTH_SETUP_GUIDE.md** | Start here! Full setup |
| **ZOOM_OAUTH_IMPLEMENTATION_CHECKLIST.md** | Step-by-step guide |
| **ZOOM_WEBHOOK_CONFIGURATION_GUIDE.md** | Webhook setup |
| **ZOOM_JWT_TO_OAUTH_MIGRATION.md** | Migration guide |

## 🚀 Quick Start

```bash
# 1. Add credentials to .env
# 2. Copy zoomOAuthService.ts to src/services/
# 3. Add endpoints to server.js from zoom-oauth-api-endpoints.js
# 4. Restart server
# 5. Test: curl http://localhost:5000/api/zoom/status
```

## 🔌 API Endpoints

```
POST   /api/zoom/meetings/create
GET    /api/zoom/meetings/:meetingId
PUT    /api/zoom/meetings/:meetingId
DELETE /api/zoom/meetings/:meetingId

GET    /api/zoom/users/:userId/meetings
GET    /api/zoom/meetings/:meetingId/participants
GET    /api/zoom/meetings/:meetingId/recordings

GET    /api/zoom/status
POST   /api/zoom/test-token (dev only)
POST   /api/zoom/webhook
```

## 🧪 Test Commands

```bash
# Check service status
curl http://localhost:5000/api/zoom/status

# Generate token (dev only)
curl -X POST http://localhost:5000/api/zoom/test-token

# Create meeting
curl -X POST http://localhost:5000/api/zoom/meetings/create \
  -H "Content-Type: application/json" \
  -d '{
    "zoomUserId":"user123",
    "topic":"Test Meeting",
    "startTime":"2024-01-15T10:00:00Z",
    "duration":60
  }'
```

## ⚙️ Key Features

- ✅ Automatic token refresh
- ✅ Webhook event handling
- ✅ Meeting CRUD operations
- ✅ Participant tracking
- ✅ Recording management
- ✅ Error handling & retries

## 🔒 Security

- ✅ OAuth 2.0 standard
- ✅ 1-hour token expiration
- ✅ Webhook signature verification
- ✅ Server-side credentials only
- ✅ No frontend exposure

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Token fails | Check credentials in .env |
| Webhook not received | Set URL in Marketplace |
| Permission denied | Verify app scopes |
| Rate limited | Implement request queue |

## 🔗 Important Links

- Zoom App: https://marketplace.zoom.us/
- API Docs: https://marketplace.zoom.us/docs/api-reference/zoom-api
- OAuth Guide: https://marketplace.zoom.us/docs/guides/auth/oauth
- Webhooks: https://marketplace.zoom.us/docs/guide/webhooks

## 📱 Webhook Configuration

**URL**: `https://yourdomain.com/api/zoom/webhook`

**Events**:
- [ ] meeting.started
- [ ] meeting.ended
- [ ] recording.completed
- [ ] meeting.participant_joined
- [ ] meeting.participant_left

## 🎯 Implementation Timeline

- Config: 15 min
- Code: 30 min
- Webhook: 20 min
- Database: 15 min
- Frontend: 30 min
- Testing: 30 min
- **Total: 2.5 hours**

## ✅ Checklist

- [ ] Credentials added to .env
- [ ] zoomOAuthService.ts copied
- [ ] Endpoints added to server.js
- [ ] Service status endpoint tested
- [ ] Webhook configured in Marketplace
- [ ] Meeting creation tested
- [ ] Frontend integrated
- [ ] Webhooks tested
- [ ] Ready for production

## 📊 OAuth Token Flow

```
Request Token → Zoom OAuth → Get Access Token
                              (1 hour validity)
                              
Use Token → Zoom API → Process Request

Automatic Refresh When Needed
```

## 🚀 Ready to Code

1. Start with: **ZOOM_OAUTH_SETUP_GUIDE.md**
2. Follow: **ZOOM_OAUTH_IMPLEMENTATION_CHECKLIST.md**
3. Configure: **ZOOM_WEBHOOK_CONFIGURATION_GUIDE.md**
4. Deploy: Test all endpoints

**Good luck!** 🎉
