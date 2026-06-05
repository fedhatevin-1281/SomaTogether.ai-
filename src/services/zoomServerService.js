const axios = require('axios');

const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

let cachedToken = null;

function getZoomConfig() {
  return {
    accountId: process.env.ZOOM_ACCOUNT_ID || '',
    clientId: process.env.ZOOM_CLIENT_ID || '',
    clientSecret: process.env.ZOOM_CLIENT_SECRET || ''
  };
}

function getMissingZoomConfig() {
  const config = getZoomConfig();
  return Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => ({
      accountId: 'ZOOM_ACCOUNT_ID',
      clientId: 'ZOOM_CLIENT_ID',
      clientSecret: 'ZOOM_CLIENT_SECRET'
    }[key]));
}

function ensureZoomConfigured() {
  const missing = getMissingZoomConfig();
  if (missing.length > 0) {
    const error = new Error('Zoom is not configured by the administrator.');
    error.code = 'ZOOM_NOT_CONFIGURED';
    error.missing = missing;
    throw error;
  }
}

async function getZoomAccessToken() {
  ensureZoomConfigured();

  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken.accessToken;
  }

  const { accountId, clientId, clientSecret } = getZoomConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(
    ZOOM_TOKEN_URL,
    null,
    {
      params: {
        grant_type: 'account_credentials',
        account_id: accountId
      },
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    }
  );

  cachedToken = {
    accessToken: response.data.access_token,
    expiresAt: Date.now() + response.data.expires_in * 1000
  };

  return cachedToken.accessToken;
}

async function zoomRequest(method, endpoint, data) {
  const accessToken = await getZoomAccessToken();

  const response = await axios({
    method,
    baseURL: ZOOM_API_BASE_URL,
    url: endpoint,
    data,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  return response.data;
}

async function getZoomUser(userId = 'me') {
  return zoomRequest('GET', `/users/${encodeURIComponent(userId)}`);
}

async function createZoomMeeting(meeting) {
  const zoomUserId = meeting.zoomUserId || 'me';
  return zoomRequest('POST', `/users/${encodeURIComponent(zoomUserId)}/meetings`, {
    topic: meeting.topic,
    type: 2,
    start_time: meeting.startTime,
    duration: meeting.duration,
    timezone: meeting.timezone || 'UTC',
    password: meeting.password,
    agenda: meeting.agenda,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: true,
      auto_recording: meeting.autoRecording || 'none',
      ...meeting.settings
    }
  });
}

async function getZoomMeeting(meetingId) {
  return zoomRequest('GET', `/meetings/${encodeURIComponent(meetingId)}`);
}

async function updateZoomMeeting(meetingId, updates) {
  await zoomRequest('PATCH', `/meetings/${encodeURIComponent(meetingId)}`, updates);
  return getZoomMeeting(meetingId);
}

async function deleteZoomMeeting(meetingId) {
  await zoomRequest('DELETE', `/meetings/${encodeURIComponent(meetingId)}`);
  return { success: true };
}

function getZoomConfigurationStatus() {
  const missing = getMissingZoomConfig();
  return {
    configured: missing.length === 0,
    missing
  };
}

function clearZoomTokenCache() {
  cachedToken = null;
}

module.exports = {
  getZoomAccessToken,
  createZoomMeeting,
  updateZoomMeeting,
  deleteZoomMeeting,
  getZoomMeeting,
  getZoomUser,
  getZoomConfigurationStatus,
  clearZoomTokenCache
};
