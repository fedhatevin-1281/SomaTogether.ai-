import axios, { AxiosInstance } from 'axios';
import { supabase } from '../supabaseClient';

/**
 * Zoom OAuth 2.0 Server to Server Service
 * Handles token generation and API requests using OAuth 2.0
 */

interface ZoomOAuthToken {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

class ZoomOAuthService {
  private clientId: string;
  private clientSecret: string;
  private accountId: string;
  private axiosInstance: AxiosInstance;
  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor() {
    this.clientId = process.env.ZOOM_OAUTH_CLIENT_ID || '';
    this.clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET || '';
    this.accountId = process.env.ZOOM_ACCOUNT_ID || '';

    if (!this.clientId || !this.clientSecret || !this.accountId) {
      throw new Error('Missing Zoom OAuth credentials in environment variables');
    }

    this.axiosInstance = axios.create({
      baseURL: 'https://api.zoom.us/v2',
      timeout: 30000
    });
  }

  /**
   * Get a valid OAuth access token
   * Handles token refresh and caching automatically
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = 'zoom_oauth_token';

    // Check if cached token is still valid
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log('✅ Using cached Zoom OAuth token');
      return cached.token;
    }

    console.log('🔄 Requesting new Zoom OAuth token...');

    try {
      const response = await axios.post(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'account_credentials',
            account_id: this.accountId
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret
          }
        }
      );

      const data: ZoomOAuthToken = response.data;

      // Cache the token (subtract 60 seconds for safety margin)
      const expiresAt = Date.now() + (data.expires_in - 60) * 1000;
      this.tokenCache.set(cacheKey, {
        token: data.access_token,
        expiresAt
      });

      console.log('✅ New Zoom OAuth token obtained');
      return data.access_token;
    } catch (error) {
      console.error('❌ Failed to get Zoom OAuth token:', error);
      throw new Error('Failed to authenticate with Zoom OAuth');
    }
  }

  /**
   * Make an authenticated API request to Zoom
   */
  async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const config = {
        method,
        url: endpoint,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        (config as any).data = data;
      }

      const response = await this.axiosInstance(config);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('❌ Zoom OAuth token expired or invalid');
        this.tokenCache.clear(); // Clear cache to force new token on retry
        throw new Error('Zoom authentication failed. Please reconnect.');
      }

      console.error('❌ Zoom API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a Zoom meeting
   */
  async createMeeting(
    userId: string,
    meetingOptions: {
      topic: string;
      type?: number;
      start_time?: string;
      duration?: number;
      timezone?: string;
      password?: string;
      agenda?: string;
      settings?: any;
    }
  ): Promise<any> {
    const endpoint = `/users/${userId}/meetings`;
    
    const payload = {
      topic: meetingOptions.topic,
      type: meetingOptions.type || 1, // 1 = instant, 2 = scheduled
      start_time: meetingOptions.start_time,
      duration: meetingOptions.duration || 60,
      timezone: meetingOptions.timezone || 'UTC',
      password: meetingOptions.password,
      agenda: meetingOptions.agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'cloud',
        ...meetingOptions.settings
      }
    };

    try {
      const meeting = await this.request('POST', endpoint, payload);
      console.log('✅ Zoom meeting created:', meeting.id);
      return meeting;
    } catch (error) {
      console.error('❌ Failed to create Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Get meeting details
   */
  async getMeeting(meetingId: string): Promise<any> {
    const endpoint = `/meetings/${meetingId}`;
    
    try {
      const meeting = await this.request('GET', endpoint);
      return meeting;
    } catch (error) {
      console.error('❌ Failed to get Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Update a meeting
   */
  async updateMeeting(
    meetingId: string,
    updates: any
  ): Promise<any> {
    const endpoint = `/meetings/${meetingId}`;
    
    try {
      await this.request('PUT', endpoint, updates);
      console.log('✅ Zoom meeting updated:', meetingId);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(meetingId: string): Promise<any> {
    const endpoint = `/meetings/${meetingId}`;
    
    try {
      await this.request('DELETE', endpoint);
      console.log('✅ Zoom meeting deleted:', meetingId);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Get user's meetings
   */
  async getUserMeetings(
    userId: string,
    type: 'scheduled' | 'live' | 'upcoming' = 'upcoming'
  ): Promise<any> {
    const endpoint = `/users/${userId}/meetings`;
    
    try {
      const meetings = await this.request('GET', `${endpoint}?type=${type}`);
      return meetings;
    } catch (error) {
      console.error('❌ Failed to get user meetings:', error);
      throw error;
    }
  }

  /**
   * Get meeting participants
   */
  async getMeetingParticipants(meetingId: string): Promise<any> {
    const endpoint = `/meetings/${meetingId}/participants`;
    
    try {
      const participants = await this.request('GET', endpoint);
      return participants;
    } catch (error) {
      console.error('❌ Failed to get meeting participants:', error);
      throw error;
    }
  }

  /**
   * Get meeting recordings
   */
  async getMeetingRecordings(meetingId: string): Promise<any> {
    const endpoint = `/meetings/${meetingId}/recordings`;
    
    try {
      const recordings = await this.request('GET', endpoint);
      return recordings;
    } catch (error) {
      console.error('❌ Failed to get meeting recordings:', error);
      throw error;
    }
  }

  /**
   * Get user details from Zoom
   */
  async getUser(userId: string): Promise<any> {
    const endpoint = `/users/${userId}`;
    
    try {
      const user = await this.request('GET', endpoint);
      return user;
    } catch (error) {
      console.error('❌ Failed to get Zoom user:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * Use the Secret Token from Zoom to verify incoming webhooks
   */
  verifyWebhookSignature(
    headers: any,
    body: string,
    secretToken: string
  ): boolean {
    const crypto = require('crypto');
    
    const timestamp = headers['x-zm-request-timestamp'];
    const signature = headers['x-zm-signature'];

    if (!timestamp || !signature) {
      console.error('❌ Missing webhook signature headers');
      return false;
    }

    // Only accept requests within 5 minutes
    const requestTime = parseInt(timestamp) * 1000;
    const currentTime = Date.now();
    if (currentTime - requestTime > 5 * 60 * 1000) {
      console.error('❌ Webhook request too old');
      return false;
    }

    // Compute signature
    const message = `v0:${timestamp}:${body}`;
    const hash = crypto
      .createHmac('sha256', secretToken)
      .update(message)
      .digest('hex');

    const computedSignature = `v0=${hash}`;

    if (computedSignature === signature) {
      console.log('✅ Webhook signature verified');
      return true;
    } else {
      console.error('❌ Webhook signature invalid');
      return false;
    }
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(event: any): Promise<void> {
    const { event: eventType, payload } = event;

    console.log(`📢 Zoom webhook event: ${eventType}`);

    switch (eventType) {
      case 'meeting.started':
        await this.handleMeetingStarted(payload);
        break;
      case 'meeting.ended':
        await this.handleMeetingEnded(payload);
        break;
      case 'recording.completed':
        await this.handleRecordingCompleted(payload);
        break;
      case 'meeting.participant_joined':
        await this.handleParticipantJoined(payload);
        break;
      case 'meeting.participant_left':
        await this.handleParticipantLeft(payload);
        break;
      default:
        console.log(`⚠️ Unknown event type: ${eventType}`);
    }
  }

  /**
   * Handle meeting started webhook
   */
  private async handleMeetingStarted(payload: any): Promise<void> {
    const { object } = payload;
    const zoomMeetingId = object.id;

    try {
      await supabase
        .from('zoom_meetings')
        .update({ status: 'started' })
        .eq('meeting_id', zoomMeetingId);

      console.log(`✅ Meeting ${zoomMeetingId} marked as started`);
    } catch (error) {
      console.error('❌ Failed to update meeting status:', error);
    }
  }

  /**
   * Handle meeting ended webhook
   */
  private async handleMeetingEnded(payload: any): Promise<void> {
    const { object } = payload;
    const zoomMeetingId = object.id;

    try {
      await supabase
        .from('zoom_meetings')
        .update({ status: 'ended' })
        .eq('meeting_id', zoomMeetingId);

      console.log(`✅ Meeting ${zoomMeetingId} marked as ended`);
    } catch (error) {
      console.error('❌ Failed to update meeting status:', error);
    }
  }

  /**
   * Handle recording completed webhook
   */
  private async handleRecordingCompleted(payload: any): Promise<void> {
    const { object } = payload;
    const zoomMeetingId = object.id;
    const recordings = object.recording_files || [];

    try {
      // Get the meeting from database
      const { data: meeting } = await supabase
        .from('zoom_meetings')
        .select('id')
        .eq('meeting_id', zoomMeetingId)
        .single();

      if (!meeting) return;

      // Store recordings
      for (const recording of recordings) {
        await supabase
          .from('meeting_recordings')
          .upsert({
            meeting_id: meeting.id,
            recording_type: recording.recording_type,
            play_url: recording.play_url,
            download_url: recording.download_url,
            status: 'completed',
            file_size: recording.file_size,
            duration: recording.duration
          });
      }

      console.log(`✅ Recording completed for meeting ${zoomMeetingId}`);
    } catch (error) {
      console.error('❌ Failed to process recording:', error);
    }
  }

  /**
   * Handle participant joined webhook
   */
  private async handleParticipantJoined(payload: any): Promise<void> {
    const { object } = payload;
    const zoomMeetingId = object.id;
    const participant = object.participant;

    try {
      const { data: meeting } = await supabase
        .from('zoom_meetings')
        .select('id')
        .eq('meeting_id', zoomMeetingId)
        .single();

      if (!meeting) return;

      await supabase
        .from('meeting_participants')
        .upsert({
          meeting_id: meeting.id,
          user_id: participant.id,
          join_time: new Date().toISOString(),
          is_host: participant.user_id === object.host_id
        });

      console.log(`✅ Participant joined meeting ${zoomMeetingId}`);
    } catch (error) {
      console.error('❌ Failed to record participant join:', error);
    }
  }

  /**
   * Handle participant left webhook
   */
  private async handleParticipantLeft(payload: any): Promise<void> {
    const { object } = payload;
    const zoomMeetingId = object.id;
    const participant = object.participant;

    try {
      const { data: meeting } = await supabase
        .from('zoom_meetings')
        .select('id')
        .eq('meeting_id', zoomMeetingId)
        .single();

      if (!meeting) return;

      await supabase
        .from('meeting_participants')
        .update({ leave_time: new Date().toISOString() })
        .match({
          meeting_id: meeting.id,
          user_id: participant.id
        });

      console.log(`✅ Participant left meeting ${zoomMeetingId}`);
    } catch (error) {
      console.error('❌ Failed to record participant leave:', error);
    }
  }
}

// Export singleton instance
export const zoomOAuthService = new ZoomOAuthService();
export default ZoomOAuthService;
