import { apiService } from './apiService';

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
      const res = await apiService.makeRequest<any>(`/zoom/status/${teacherId}`);
      return !!(res.connected && res.account?.is_active);
    } catch (error) {
      console.error('Error checking Zoom connection via API:', error);
      return false;
    }
  }

  /**
   * Get teacher's Zoom account details
   */
  static async getZoomAccount(teacherId: string): Promise<ZoomAccount | null> {
    try {
      const res = await apiService.makeRequest<any>(`/zoom/status/${teacherId}`);
      return res.account || null;
    } catch (error) {
      console.error('Error getting Zoom account via API:', error);
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
      const res = await apiService.makeRequest<{ success: boolean; meeting?: ZoomMeeting; error?: string }>('/zoom/meetings/create', {
        method: 'POST',
        body: JSON.stringify({
          teacherId,
          classSessionId,
          ...meetingRequest
        })
      });
      return res;
    } catch (error: any) {
      console.error('Error creating Zoom meeting via API:', error);
      return { success: false, error: error.message || 'Failed to create Zoom meeting' };
    }
  }

  /**
   * Get meeting details
   */
  static async getMeeting(meetingId: string): Promise<ZoomMeeting | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; meeting?: ZoomMeeting }>(`/zoom/meetings/${meetingId}`);
      return res.meeting || null;
    } catch (error) {
      console.error('Error getting meeting via API:', error);
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
      await apiService.makeRequest(`/zoom/meetings/${meetingId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, ...additionalData })
      });
      return true;
    } catch (error) {
      console.error('Error in updateMeetingStatus via API:', error);
      return false;
    }
  }

  /**
   * Delete a meeting
   */
  static async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      await apiService.makeRequest(`/zoom/meetings/${meetingId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error in deleteMeeting via API:', error);
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
      const res = await apiService.makeRequest<{ meetings: ZoomMeeting[], total: number }>(`/zoom/meetings/teacher/${teacherId}?limit=${limit}&offset=${offset}`);
      return res;
    } catch (error) {
      console.error('Error in getTeacherMeetings via API:', error);
      return { meetings: [], total: 0 };
    }
  }

  /**
   * Connect Zoom account
   */
  static async connectZoomAccount(
    teacherId: string,
    authCode?: string,
    redirectUri?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; error?: string }>('/zoom/connect', {
        method: 'POST',
        body: JSON.stringify({ teacherId, authCode, redirectUri })
      });
      return res;
    } catch (error: any) {
      console.error('Error connecting Zoom account via API:', error);
      return { success: false, error: error.message || 'Unable to connect to Zoom' };
    }
  }

  /**
   * Disconnect Zoom account
   */
  static async disconnectZoomAccount(teacherId: string): Promise<boolean> {
    try {
      await apiService.makeRequest('/db/zoom_accounts/update', {
        method: 'PUT',
        body: JSON.stringify({
          eq: { teacher_id: teacherId },
          updates: { is_active: false }
        })
      });

      await apiService.makeRequest('/db/teachers/update', {
        method: 'PUT',
        body: JSON.stringify({
          eq: { id: teacherId },
          updates: { zoom_connected: false }
        })
      });

      return true;
    } catch (error) {
      console.error('Error disconnecting Zoom account via API:', error);
      return false;
    }
  }

  /**
   * Get meeting participants
   */
  static async getMeetingParticipants(meetingId: string): Promise<any[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/meeting_participants/query', {
        method: 'POST',
        body: JSON.stringify({
          eq: { meeting_id: meetingId },
          order: { column: 'join_time', ascending: true }
        })
      });
      return res.data || [];
    } catch (error) {
      console.error('Error getting meeting participants via API:', error);
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
      await apiService.makeRequest('/db/meeting_participants/insert', {
        method: 'POST',
        body: JSON.stringify({
          meeting_id: meetingId,
          user_id: userId,
          user_type: userType,
          join_time: new Date().toISOString(),
          is_host: isHost
        })
      });
      return true;
    } catch (error) {
      console.error('Error adding meeting participant via API:', error);
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
      await apiService.makeRequest('/db/meeting_participants/update', {
        method: 'PUT',
        body: JSON.stringify({
          eq: { meeting_id: meetingId, user_id: userId, leave_time: null },
          updates: { leave_time: new Date().toISOString() }
        })
      });
      return true;
    } catch (error) {
      console.error('Error in updateParticipantLeaveTime via API:', error);
      return false;
    }
  }

  static formatMeetingTime(startTime: string, timezone: string = 'UTC'): string {
    return new Date(startTime).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone
    });
  }

  static getTimeUntilMeeting(startTime: string): string {
    const diffMs = new Date(startTime).getTime() - Date.now();

    if (diffMs <= 0) return 'now';

    const minutes = Math.ceil(diffMs / 60000);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.ceil(minutes / 60);
    if (hours < 24) return `${hours}h`;

    return `${Math.ceil(hours / 24)}d`;
  }
}

export default ZoomService;
