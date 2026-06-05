/**
 * Zoom OAuth 2.0 Server to Server API Endpoints
 * 
 * Add these endpoints to your server.js file for Zoom integration
 * Requires: zoomOAuthService.ts in src/services/
 * 
 * Environment Variables Required:
 * - ZOOM_OAUTH_CLIENT_ID
 * - ZOOM_OAUTH_CLIENT_SECRET
 * - ZOOM_ACCOUNT_ID
 * - ZOOM_WEBHOOK_SECRET_TOKEN
 */

const express = require('express');
const { zoomOAuthService } = require('./src/services/zoomOAuthService');

// ==============================================
// WEBHOOK HANDLING
// ==============================================

/**
 * POST /api/zoom/webhook
 * Zoom webhook endpoint for receiving event notifications
 * 
 * Zoom will send webhooks to this endpoint for:
 * - meeting.started
 * - meeting.ended
 * - recording.completed
 * - meeting.participant_joined
 * - meeting.participant_left
 */
app.post('/api/zoom/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const headers = req.headers;
    const body = req.body.toString();
    const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

    if (!secretToken) {
      console.error('❌ Missing ZOOM_WEBHOOK_SECRET_TOKEN');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify webhook signature
    const isValid = zoomOAuthService.verifyWebhookSignature(headers, body, secretToken);

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse the webhook event
    const event = JSON.parse(body);

    // Handle challenge verification (first-time setup)
    if (event.event === 'app_deauthorized') {
      console.log('App deauthorized');
      return res.status(200).json({});
    }

    // Handle the event asynchronously
    await zoomOAuthService.handleWebhookEvent(event);

    // Respond immediately to acknowledge receipt
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error handling Zoom webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// ==============================================
// MEETING MANAGEMENT
// ==============================================

/**
 * POST /api/zoom/meetings/create
 * Create a Zoom meeting
 * 
 * Body:
 * {
 *   "zoomUserId": "string",           // Zoom user ID
 *   "topic": "string",                // Meeting topic/title
 *   "startTime": "2024-01-15T10:00:00Z", // ISO 8601 format
 *   "duration": 60,                   // Duration in minutes
 *   "password": "string",             // Optional meeting password
 *   "agenda": "string"                // Optional meeting description
 * }
 */
app.post('/api/zoom/meetings/create', async (req, res) => {
  try {
    const { zoomUserId, topic, startTime, duration, password, agenda } = req.body;

    if (!zoomUserId || !topic) {
      return res.status(400).json({ error: 'Missing required fields: zoomUserId, topic' });
    }

    const meeting = await zoomOAuthService.createMeeting(zoomUserId, {
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration: duration || 60,
      timezone: 'UTC',
      password,
      agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'cloud'
      }
    });

    res.json({
      success: true,
      meeting: {
        id: meeting.id,
        topic: meeting.topic,
        join_url: meeting.join_url,
        start_url: meeting.start_url,
        start_time: meeting.start_time,
        duration: meeting.duration,
        timezone: meeting.timezone,
        password: meeting.password
      }
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create Zoom meeting' });
  }
});

/**
 * GET /api/zoom/meetings/:meetingId
 * Get meeting details
 */
app.get('/api/zoom/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await zoomOAuthService.getMeeting(meetingId);

    res.json({
      success: true,
      meeting: {
        id: meeting.id,
        topic: meeting.topic,
        join_url: meeting.join_url,
        start_url: meeting.start_url,
        start_time: meeting.start_time,
        duration: meeting.duration,
        timezone: meeting.timezone,
        status: meeting.status,
        participants_count: meeting.participants_count
      }
    });

  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting details' });
  }
});

/**
 * PUT /api/zoom/meetings/:meetingId
 * Update a meeting
 * 
 * Body: Any meeting fields to update (topic, start_time, duration, etc.)
 */
app.put('/api/zoom/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const updates = req.body;

    await zoomOAuthService.updateMeeting(meetingId, updates);

    res.json({
      success: true,
      message: 'Meeting updated successfully'
    });

  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

/**
 * DELETE /api/zoom/meetings/:meetingId
 * Delete a meeting
 */
app.delete('/api/zoom/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    await zoomOAuthService.deleteMeeting(meetingId);

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// ==============================================
// USER & PARTICIPANT MANAGEMENT
// ==============================================

/**
 * GET /api/zoom/users/:userId/meetings
 * Get all meetings for a user
 * 
 * Query params:
 * - type: 'scheduled' | 'live' | 'upcoming' (default: upcoming)
 */
app.get('/api/zoom/users/:userId/meetings', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'upcoming' } = req.query;

    const meetings = await zoomOAuthService.getUserMeetings(userId, type);

    res.json({
      success: true,
      meetings: meetings.meetings || []
    });

  } catch (error) {
    console.error('Error fetching user meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

/**
 * GET /api/zoom/meetings/:meetingId/participants
 * Get participants of a meeting
 */
app.get('/api/zoom/meetings/:meetingId/participants', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const participants = await zoomOAuthService.getMeetingParticipants(meetingId);

    res.json({
      success: true,
      participants: participants.participants || [],
      total: participants.total_records || 0
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

/**
 * GET /api/zoom/meetings/:meetingId/recordings
 * Get recordings of a meeting
 */
app.get('/api/zoom/meetings/:meetingId/recordings', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const recordings = await zoomOAuthService.getMeetingRecordings(meetingId);

    res.json({
      success: true,
      recordings: recordings.recording_files || [],
      total: recordings.total_records || 0
    });

  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

/**
 * GET /api/zoom/users/:userId
 * Get Zoom user details
 */
app.get('/api/zoom/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await zoomOAuthService.getUser(userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        personal_meeting_id: user.personal_meeting_id,
        status: user.status,
        pic_url: user.pic_url
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// ==============================================
// HEALTH & STATUS ENDPOINTS
// ==============================================

/**
 * GET /api/zoom/status
 * Check if Zoom service is properly configured
 */
app.get('/api/zoom/status', async (req, res) => {
  try {
    // Try to get a valid access token
    await zoomOAuthService.getAccessToken();

    res.json({
      success: true,
      status: 'connected',
      message: 'Zoom OAuth service is properly configured'
    });

  } catch (error) {
    console.error('Zoom service error:', error);
    res.status(500).json({
      success: false,
      status: 'disconnected',
      message: 'Zoom OAuth service is not properly configured'
    });
  }
});

/**
 * POST /api/zoom/test-token
 * Debug endpoint: Test if OAuth token can be generated
 */
app.post('/api/zoom/test-token', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Debug endpoint not available in production' });
    }

    const token = await zoomOAuthService.getAccessToken();

    res.json({
      success: true,
      message: 'Successfully obtained OAuth token',
      token: token.substring(0, 20) + '...' // Show only first 20 chars for security
    });

  } catch (error) {
    console.error('Token test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate token'
    });
  }
});

module.exports = { zoomOAuthService };
