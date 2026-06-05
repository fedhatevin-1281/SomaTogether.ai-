# 📚 Migration Guide: JWT to OAuth 2.0

## Overview

Your Zoom integration is moving from **JWT** (deprecated) to **Server to Server OAuth 2.0** (recommended).

This guide explains what changed and how to migrate.

---

## 🔄 Key Differences

| Aspect | JWT | OAuth 2.0 |
|--------|-----|----------|
| **App Type** | Server App | Server to Server OAuth |
| **Credentials** | API Key + Secret | Client ID + Client Secret |
| **Token** | Long-lived | 1 hour (auto-refresh) |
| **Status** | Phased out ⚠️ | **Recommended** ✅ |
| **Setup** | Manual | Automatic |
| **Complexity** | Simple | Moderate |
| **Security** | Good | Better |

---

## 🛠️ What Changed

### **Credentials**

**JWT (Old)**
```env
VITE_ZOOM_API_KEY=l-z_kNTXVT9CWYvzDBVSM5Q
VITE_ZOOM_API_SECRET=G3aczsGfydHM2JyHVijA0nQV5N7rwILR
VITE_ZOOM_ACCOUNT_ID=...
```

**OAuth 2.0 (New)**
```env
ZOOM_OAUTH_CLIENT_ID=krrTrMonQLKtx9SLmxJMDQ
ZOOM_OAUTH_CLIENT_SECRET=FQr4jxJfWcG9GW4zv2LcNuNdU6ZmUxId
ZOOM_ACCOUNT_ID=dKp06igqSOaKu98cve0vBA
ZOOM_WEBHOOK_SECRET_TOKEN=5EhrGFt9QOm9hwnPxPRu9Q
```

### **Token Generation**

**JWT (Old)**
```javascript
// Manual JWT token generation
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { iss: API_KEY },
  API_SECRET,
  { expiresIn: '1h' }
);
```

**OAuth 2.0 (New)**
```javascript
// Automatic token generation via axios
const response = await axios.post('https://zoom.us/oauth/token', null, {
  params: { grant_type: 'account_credentials', account_id: ACCOUNT_ID },
  auth: { username: CLIENT_ID, password: CLIENT_SECRET }
});
// Tokens automatically cached and refreshed
```

### **API Calls**

**JWT (Old)**
```javascript
const token = generateJWT(); // Manual token generation
axios.get('https://api.zoom.us/v2/meetings/123', {
  headers: { Authorization: `Bearer ${token}` }
});
```

**OAuth 2.0 (New)**
```javascript
const token = await zoomOAuthService.getAccessToken(); // Automatic
const meeting = await zoomOAuthService.request('GET', '/meetings/123');
```

---

## 📋 Migration Steps

### **Step 1: Update Environment Variables** (5 min)

Replace in your `.env` file:

```diff
# OLD JWT CREDENTIALS
- VITE_ZOOM_API_KEY=l-z_kNTXVT9CWYvzDBVSM5Q
- VITE_ZOOM_API_SECRET=G3aczsGfydHM2JyHVijA0nQV5N7rwILR
- VITE_ZOOM_ACCOUNT_ID=your_account_id

# NEW OAUTH 2.0 CREDENTIALS
+ ZOOM_OAUTH_CLIENT_ID=krrTrMonQLKtx9SLmxJMDQ
+ ZOOM_OAUTH_CLIENT_SECRET=FQr4jxJfWcG9GW4zv2LcNuNdU6ZmUxId
+ ZOOM_ACCOUNT_ID=dKp06igqSOaKu98cve0vBA
+ ZOOM_WEBHOOK_SECRET_TOKEN=5EhrGFt9QOm9hwnPxPRu9Q
```

### **Step 2: Update vite-env.d.ts** (5 min)

Replace type definitions:

```diff
interface ImportMetaEnv {
  // OLD
-  readonly VITE_ZOOM_API_KEY: string
-  readonly VITE_ZOOM_API_SECRET: string
-  readonly VITE_ZOOM_ACCOUNT_ID: string

  // NEW (Vite vars don't expose backend env, but keep for reference)
+  readonly VITE_ZOOM_ACCOUNT_ID: string
}
```

### **Step 3: Remove Old JWT Service** (5 min)

Delete or backup:
- Any old JWT token generation code
- `jsonwebtoken` package (if only used for Zoom)

```bash
# Optional: Remove jwt package if not used elsewhere
npm uninstall jsonwebtoken
```

### **Step 4: Add New OAuth Service** (5 min)

Copy file to your project:
```
src/services/zoomOAuthService.ts ✅
```

### **Step 5: Update Backend Endpoints** (15 min)

Replace endpoints in `server.js`:

**Old JWT endpoints:**
```javascript
// OLD - Remove this
app.post('/api/zoom/connect', async (req, res) => {
  // Uses old API key/secret from request body
  // Stores credentials in zoom_accounts table
});
```

**New OAuth endpoints:**
```javascript
// NEW - Add this from zoom-oauth-api-endpoints.js
app.post('/api/zoom/meetings/create', async (req, res) => {
  // Uses server-side OAuth tokens
  // No credentials in request body
});
```

### **Step 6: Update Frontend** (varies)

If frontend was sending credentials:

**Old:**
```typescript
// DON'T DO THIS ANYMORE
const response = await fetch('/api/zoom/connect', {
  method: 'POST',
  body: JSON.stringify({
    teacherId: '123',
    apiKey: userInput.apiKey,      // ❌ No longer needed
    apiSecret: userInput.apiSecret // ❌ No longer needed
  })
});
```

**New:**
```typescript
// Server handles OAuth automatically
const response = await fetch('/api/zoom/meetings/create', {
  method: 'POST',
  body: JSON.stringify({
    zoomUserId: '123',
    topic: 'Class Session',
    startTime: new Date()
    // ✅ No credentials needed
  })
});
```

### **Step 7: Update Database** (optional)

Old `zoom_accounts` table columns are now different:

```sql
-- OLD columns (still there but not used)
- api_key
- api_secret

-- NEW columns (now used)
+ access_token
+ refresh_token
+ token_expires_at
```

No migration needed - they coexist. The OAuth service doesn't require storing credentials.

### **Step 8: Test Migration** (30 min)

```bash
# 1. Restart server
npm run server

# 2. Check service status
curl http://localhost:5000/api/zoom/status

# 3. Generate token
curl -X POST http://localhost:5000/api/zoom/test-token

# 4. Create a meeting
curl -X POST http://localhost:5000/api/zoom/meetings/create \
  -H "Content-Type: application/json" \
  -d '{"zoomUserId":"user123","topic":"Test"}'

# 5. Check server logs for any errors
```

---

## 🔒 Security Improvements

### **JWT Issues (Old)**
- ❌ Long-lived tokens
- ❌ Manual token generation
- ❌ Credentials stored in database
- ❌ Token expiration not monitored

### **OAuth 2.0 Benefits (New)**
- ✅ Auto-refreshing tokens (1 hour max)
- ✅ Automatic token management
- ✅ Server-side credentials only
- ✅ Better error handling
- ✅ Industry standard
- ✅ Zoom's recommended approach

---

## ⚠️ Breaking Changes

1. **Teacher Dashboard**: No longer accepts user-entered credentials
   - Teachers don't need to provide API keys
   - All meetings use server credentials

2. **API Endpoints**: Structure changed
   - Old: `/api/zoom/connect` (for adding credentials)
   - New: `/api/zoom/meetings/create` (uses server OAuth)

3. **Database**: Existing `zoom_accounts` with API keys become inactive
   - No automatic migration needed
   - Old accounts can be cleaned up

4. **Webhooks**: New webhook format from Zoom
   - Different event structure
   - Service auto-handles this

---

## 📊 Comparison Table

| Operation | JWT (Old) | OAuth 2.0 (New) |
|-----------|-----------|-----------------|
| Setup | Manual token generation | Automatic |
| Token refresh | Manual | Automatic (hourly) |
| Error handling | Manual | Built-in |
| Credentials | User-provided | Server-only |
| Webhooks | Manual setup | Auto-handled |
| Token storage | Database | In-memory cache |
| Security audit | Manual | Built-in |

---

## 🎯 Benefits of Switching

1. **No More User Credentials**
   - Teachers don't enter API keys
   - Simpler UX

2. **Better Security**
   - Shorter token lifetime
   - Automatic refresh
   - Less exposure

3. **Easier Maintenance**
   - Fewer manual steps
   - Less debugging needed
   - Better error messages

4. **Future-Proof**
   - JWT is being phased out by Zoom
   - OAuth is their recommended approach
   - Won't break in future updates

5. **Better Developer Experience**
   - Pre-built service class
   - Automatic token management
   - Clear error messages

---

## 🆘 Troubleshooting Migration

### **Issue: "Missing credentials" error**

**Cause:** Old env vars still being used
**Fix:**
```bash
# Check which env vars are set
echo $ZOOM_OAUTH_CLIENT_ID
echo $VITE_ZOOM_API_KEY  # Should NOT be set

# Update .env file with new credentials
```

### **Issue: "Old endpoints still being called"**

**Cause:** Frontend still using old endpoints
**Fix:**
```bash
# Search for old endpoint paths
grep -r "/api/zoom/connect" src/

# Replace with new endpoints
# /api/zoom/connect → /api/zoom/meetings/create
```

### **Issue: Token generation fails**

**Cause:** Incorrect credentials or timezone issues
**Fix:**
```bash
# Verify credentials
echo $ZOOM_OAUTH_CLIENT_ID
echo $ZOOM_OAUTH_CLIENT_SECRET
echo $ZOOM_ACCOUNT_ID

# Check server time
date

# Restart server
npm run server
```

---

## 📚 Resources

- **OAuth 2.0 Guide**: https://marketplace.zoom.us/docs/guides/auth/oauth
- **JWT Deprecation**: https://marketplace.zoom.us/docs/guide/deprecations
- **Migration Help**: https://marketplace.zoom.us/docs/support

---

## ✅ Checklist

- [ ] Updated `.env` with new credentials
- [ ] Removed old VITE_ZOOM variables
- [ ] Added `zoomOAuthService.ts` to project
- [ ] Updated `server.js` with new endpoints
- [ ] Removed old endpoint code from `server.js`
- [ ] Updated frontend to not send credentials
- [ ] Tested `/api/zoom/status` endpoint
- [ ] Tested meeting creation
- [ ] Configured webhooks in Zoom Marketplace
- [ ] Tested webhooks
- [ ] Updated team documentation
- [ ] Deployed to production

---

**Migration Time**: ~1-2 hours
**Complexity**: Moderate
**Risk**: Low (OAuth is more stable than JWT)

**Status**: ✅ Ready to Migrate
