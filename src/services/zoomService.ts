import { supabase } from '../supabaseClient';

export interface ZoomMeeting {
  id: string;
  meeting_id: string;
  teacher_id: string;
  class_session_id?: string;
  topic: string;
  description?: string;
  start_time: string;
  duration_minutes: number;
  timezone: string;
  join_url: string;
  start_url: string;
  password?: string;
  meeting_type: number;
  status: 'scheduled' | 'started' | 'ended' | 'cancelled';
  recording_url?: string;
  participants_count: number;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface ZoomAccount {
  id: string;
  teacher_id: string;
  zoom_user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  personal_meeting_url?: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingRequest {
  topic: string;
  description?: string;
  start_time: string;
  duration_minutes: number;
  timezone?: string;
  password?: string;
  waiting_room?: boolean;
  recording_enabled?: boolean;
  auto_recording?: 'local' | 'cloud' | 'none';
  mute_upon_entry?: boolean;
  watermark?: boolean;
}

class ZoomService {
  /**
   * Check if teacher has Zoom account connected
   */
  static async isZoomConnected(teacherId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('zoom_accounts')
        .select('id, is_active')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking Zoom connection:', error);
      return false;
    }
  }

  /**
   * Get teacher's Zoom account details
   */
  static async getZoomAccount(teacherId: string): Promise<ZoomAccount | null> {
    try {
      const { data, error } = await supabase
        .from('zoom_accounts')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data as ZoomAccount;
    } catch (error) {
      console.error('Error getting Zoom account:', error);
      return null;
    }
  }

  /**
   * Create a Zoom meeting
   */
  static async createMeeting(
    teacherId: string,
    meetingRequest: CreateMeetingRequest,
    classSessionId?: string
  ): Promise<{ success: boolean; meeting?: ZoomMeeting; error?: string }> {
    try {
      console.log('Creating Zoom meeting for teacher:', teacherId);

      // Get teacher's Zoom account
      const zoomAccount = await this.getZoomAccount(teacherId);
      if (!zoomAccount) {
        return { success: false, error: 'Zoom account not connected' };
      }

      // Check if access token is valid
      if (!zoomAccount.access_token || this.isTokenExpired(zoomAccount.token_expires_at)) {
        // Refresh token if needed
        const refreshed = await this.refreshAccessToken(teacherId);
        if (!refreshed) {
          return { success: false, error: 'Failed to refresh Zoom access token' };
        }
      }

      // Prepare meeting settings
      const meetingSettings = {
        topic: meetingRequest.topic,
        type: 2, // Scheduled meeting
        start_time: meetingRequest.start_time,
        duration: meetingRequest.duration_minutes,
        timezone: meetingRequest.timezone || 'UTC',
        password: meetingRequest.password || '',
        settings: {
          host_video: true,
          participant_video: true,
          cn_meeting: false,
          in_meeting: false,
          join_before_host: false,
          jbh_time: 0,
          mute_upon_entry: meetingRequest.mute_upon_entry || false,
          watermark: meetingRequest.watermark || false,
          use_pmi: false,
          approval_type: 2,
          audio: 'both',
          auto_recording: meetingRequest.auto_recording || 'cloud',
          enforce_login: false,
          enforce_login_domains: '',
          alternative_hosts: '',
          close_registration: false,
          show_share_button: true,
          allow_multiple_devices: true,
          registrants_confirmation_email: true,
          waiting_room: meetingRequest.waiting_room !== false,
          request_permission_to_unmute_participants: false,
          global_dial_in_countries: [],
          global_dial_in_numbers: [],
          registrants_email_notification: true
        }
      };

      // Make API call to Zoom
      const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${zoomAccount.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingSettings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Zoom API error:', errorData);
        return { success: false, error: errorData.message || 'Failed to create Zoom meeting' };
      }

      const meetingData = await response.json();

      // Save meeting to database
      const { data: savedMeeting, error: dbError } = await supabase
        .from('zoom_meetings')
        .insert({
          meeting_id: meetingData.id.toString(),
          teacher_id: teacherId,
          class_session_id: classSessionId,
          topic: meetingData.topic,
          description: meetingData.agenda,
          start_time: meetingData.start_time,
          duration_minutes: meetingData.duration,
          timezone: meetingData.timezone,
          join_url: meetingData.join_url,
          start_url: meetingData.start_url,
          password: meetingData.password,
          meeting_type: meetingData.type,
          status: 'scheduled',
          settings: meetingData.settings
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving meeting to database:', dbError);
        return { success: false, error: 'Failed to save meeting to database' };
      }

      console.log('Zoom meeting created successfully:', savedMeeting.id);

      return { success: true, meeting: savedMeeting as ZoomMeeting };
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      return { success: false, error: 'Failed to create Zoom meeting' };
    }
  }

  /**
   * Get meeting details
   */
  static async getMeeting(meetingId: string): Promise<ZoomMeeting | null> {
    try {
      const { data, error } = await supabase
        .from('zoom_meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as ZoomMeeting;
    } catch (error) {
      console.error('Error getting meeting:', error);
      return null;
    }
  }

  /**
   * Update meeting status
   */
  static async updateMeetingStatus(
    meetingId: string,
    status: 'scheduled' | 'started' | 'ended' | 'cancelled',
    additionalData?: any
  ): Promise<boolean> {
    try {
      const updateData: any = { status };
      
      if (status === 'ended' && additionalData?.recording_url) {
        updateData.recording_url = additionalData.recording_url;
      }

      const { error } = await supabase
        .from('zoom_meetings')
        .update(updateData)
        .eq('id', meetingId);

      if (error) {
        console.error('Error updating meeting status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMeetingStatus:', error);
      return false;
    }
  }

  /**
   * Delete a meeting
   */
  static async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        return false;
      }

      // Get Zoom account to make API call
      const zoomAccount = await this.getZoomAccount(meeting.teacher_id);
      if (!zoomAccount || !zoomAccount.access_token) {
        return false;
      }

      // Delete from Zoom API
      const response = await fetch(`https://api.zoom.us/v2/meetings/${meeting.meeting_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${zoomAccount.access_token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to delete meeting from Zoom');
      }

      // Delete from database
      const { error } = await supabase
        .from('zoom_meetings')
        .delete()
        .eq('id', meetingId);

      if (error) {
        console.error('Error deleting meeting from database:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteMeeting:', error);
      return false;
    }
  }

  /**
   * Get meetings for a teacher
   */
  static async getTeacherMeetings(
    teacherId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ meetings: ZoomMeeting[], total: number }> {
    try {
      const { data, error, count } = await supabase
        .from('zoom_meetings')
        .select('*', { count: 'exact' })
        .eq('teacher_id', teacherId)
        .order('start_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting teacher meetings:', error);
        return { meetings: [], total: 0 };
      }

      return {
        meetings: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getTeacherMeetings:', error);
      return { meetings: [], total: 0 };
    }
  }

  /**
   * Connect Zoom account (OAuth flow)
   */
  static async connectZoomAccount(
    teacherId: string,
    authCode: string,
    redirectUri: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Connecting Zoom account for teacher:', teacherId);

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${process.env.REACT_APP_ZOOM_CLIENT_ID}:${process.env.REACT_APP_ZOOM_CLIENT_SECRET}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Zoom OAuth error:', errorData);
        return { success: false, error: 'Failed to exchange authorization code' };
      }

      const tokenData = await tokenResponse.json();

      // Get user info from Zoom
      const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      if (!userResponse.ok) {
        console.error('Failed to get Zoom user info');
        return { success: false, error: 'Failed to get user information from Zoom' };
      }

      const userData = await userResponse.json();

      // Save to database
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

      const { error } = await supabase
        .from('zoom_accounts')
        .upsert({
          teacher_id: teacherId,
          zoom_user_id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          personal_meeting_url: userData.pmi,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_active: true
        });

      if (error) {
        console.error('Error saving Zoom account:', error);
        return { success: false, error: 'Failed to save Zoom account' };
      }

      // Update teacher's zoom_connected status
      await supabase
        .from('teachers')
        .update({ zoom_connected: true })
        .eq('id', teacherId);

      console.log('Zoom account connected successfully');

      return { success: true };
    } catch (error) {
      console.error('Error connecting Zoom account:', error);
      return { success: false, error: 'Failed to connect Zoom account' };
    }
  }

  /**
   * Refresh access token
   */
  private static async refreshAccessToken(teacherId: string): Promise<boolean> {
    try {
      const zoomAccount = await this.getZoomAccount(teacherId);
      if (!zoomAccount || !zoomAccount.refresh_token) {
        return false;
      }

      const response = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${process.env.REACT_APP_ZOOM_CLIENT_ID}:${process.env.REACT_APP_ZOOM_CLIENT_SECRET}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: zoomAccount.refresh_token
        })
      });

      if (!response.ok) {
        console.error('Failed to refresh Zoom token');
        return false;
      }

      const tokenData = await response.json();

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

      const { error } = await supabase
        .from('zoom_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString()
        })
        .eq('teacher_id', teacherId);

      if (error) {
        console.error('Error updating refreshed token:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  private static isTokenExpired(expiresAt?: string): boolean {
    if (!expiresAt) return true;
    
    const expiration = new Date(expiresAt);
    const now = new Date();
    
    // Consider token expired if it expires within the next 5 minutes
    return now.getTime() >= (expiration.getTime() - 5 * 60 * 1000);
  }

  /**
   * Disconnect Zoom account
   */
  static async disconnectZoomAccount(teacherId: string): Promise<boolean> {
    try {
      // Deactivate in database
      const { error } = await supabase
        .from('zoom_accounts')
        .update({ is_active: false })
        .eq('teacher_id', teacherId);

      if (error) {
        console.error('Error deactivating Zoom account:', error);
        return false;
      }

      // Update teacher's zoom_connected status
      await supabase
        .from('teachers')
        .update({ zoom_connected: false })
        .eq('id', teacherId);

      return true;
    } catch (error) {
      console.error('Error disconnecting Zoom account:', error);
      return false;
    }
  }

  /**
   * Get meeting participants
   */
  static async getMeetingParticipants(meetingId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('meeting_participants')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('join_time', { ascending: true });

      if (error) {
        console.error('Error getting meeting participants:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMeetingParticipants:', error);
      return [];
    }
  }

  /**
   * Add meeting participant
   */
  static async addMeetingParticipant(
    meetingId: string,
    userId: string,
    userType: 'teacher' | 'student' | 'guest',
    isHost: boolean = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: meetingId,
          user_id: userId,
          user_type: userType,
          join_time: new Date().toISOString(),
          is_host: isHost
        });

      if (error) {
        console.error('Error adding meeting participant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addMeetingParticipant:', error);
      return false;
    }
  }

  /**
   * Update participant leave time
   */
  static async updateParticipantLeaveTime(
    meetingId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const leaveTime = new Date().toISOString();
      
      const { error } = await supabase
        .from('meeting_participants')
        .update({ leave_time: leaveTime })
        .eq('meeting_id', meetingId)
        .eq('user_id', userId)
        .is('leave_time', null);

      if (error) {
        console.error('Error updating participant leave time:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateParticipantLeaveTime:', error);
      return false;
    }
  }
}

export default ZoomService;