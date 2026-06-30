import { apiService } from './apiService';

export interface SessionRequest {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id?: string;
  requested_start: string;
  requested_end: string;
  duration_hours: number;
  tokens_required: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  message?: string;
  teacher_response?: string;
  declined_reason?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    email: string;
    bio?: string;
    avatar_url?: string;
  };
  teacher?: {
    id: string;
    full_name: string;
    email: string;
    bio?: string;
    avatar_url?: string;
    hourly_rate: number;
    currency: string;
    subjects: string[];
    specialties: string[];
    experience_years: number;
    rating: number;
    total_reviews: number;
    verification_status: string;
  };
}

export interface CreateSessionRequestData {
  teacher_id: string;
  requested_start: string;
  requested_end: string;
  duration_hours: number;
  message?: string;
}

export interface TeacherProfile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  language?: string;
  hourly_rate: number;
  currency: string;
  subjects: string[];
  specialties: string[];
  education: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  total_students: number;
  total_sessions: number;
  max_students: number;
  is_available: boolean;
  verification_status: string;
  verification_documents: string[];
  zoom_connected: boolean;
  zoom_email?: string;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  language?: string;
  grade_level?: string;
  school_name?: string;
  learning_goals: string[];
  interests: string[];
  tokens: number;
  preferred_languages: string[];
  learning_style?: string;
}

export class SessionRequestService {
  /**
   * Get all available teachers for browsing
   */
  static async getAvailableTeachers(): Promise<TeacherProfile[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherProfile[] }>('/teachers');
      return res.data;
    } catch (error) {
      console.error('Error fetching available teachers via API:', error);
      throw error;
    }
  }

  /**
   * Get teacher profile by ID
   */
  static async getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherProfile }>(`/teachers/${teacherId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching teacher profile via API:', error);
      return null;
    }
  }

  /**
   * Get student profile by ID
   */
  static async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any }>(`/profiles/${studentId}`);
      if (res.data) {
        return {
          ...res.data,
          tokens: res.data.tokens || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching student profile via API:', error);
      throw error;
    }
  }

  /**
   * Create a session request
   */
  static async createSessionRequest(
    studentId: string,
    requestData: CreateSessionRequestData
  ): Promise<SessionRequest> {
    try {
      const payload = {
        student_id: studentId,
        teacher_id: requestData.teacher_id,
        requested_start: requestData.requested_start,
        requested_end: requestData.requested_end,
        duration_hours: requestData.duration_hours,
        tokens_required: 10,
        message: requestData.message || null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      };

      const res = await apiService.makeRequest<{ success: boolean; data: SessionRequest }>('/session-requests', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return res.data;
    } catch (error) {
      console.error('Error creating session request via API:', error);
      throw error;
    }
  }

  /**
   * Get session requests for a teacher
   */
  static async getTeacherRequests(teacherId: string): Promise<SessionRequest[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: SessionRequest[] }>(`/session-requests/teacher/${teacherId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching teacher requests via API:', error);
      throw error;
    }
  }

  /**
   * Get session requests for a student
   */
  static async getStudentRequests(studentId: string): Promise<SessionRequest[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: SessionRequest[] }>(`/session-requests/student/${studentId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching student requests via API:', error);
      throw error;
    }
  }

  /**
   * Respond to a session request (Accept/Decline)
   */
  static async respondToRequest(
    requestId: string,
    status: 'accepted' | 'declined',
    declinedReason?: string,
    teacherResponse?: string
  ): Promise<SessionRequest> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: SessionRequest }>(`/session-requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          declined_reason: declinedReason,
          teacher_response: teacherResponse
        })
      });
      return res.data;
    } catch (error) {
      console.error('Error responding to request via API:', error);
      throw error;
    }
  }
}
