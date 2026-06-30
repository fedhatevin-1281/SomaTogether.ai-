import { apiService } from './apiService';

export interface Class {
  id: string;
  teacher_id: string;
  student_id: string;
  subject_id: string;
  title: string;
  description?: string;
  hourly_rate: number;
  currency: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  start_date: string;
  end_date?: string;
  completed_sessions: number;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  student?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  subject?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface CreateClassData {
  teacher_id: string;
  student_id: string;
  subject_id: string;
  title: string;
  description?: string;
  hourly_rate: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  teacher_id: string;
  student_id: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meeting_url?: string;
  meeting_id?: string;
  duration_minutes?: number;
  rate?: number;
  notes?: string;
  student_feedback?: string;
  teacher_feedback?: string;
  tokens_charged?: number;
  tokens_deducted_at?: string;
  tokens_credited_at?: string;
  teacher_earning_usd?: number;
  student_cost_usd?: number;
  created_at: string;
  updated_at: string;
  class?: Class;
  teacher?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  student?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  zoom_warning?: string;
}

export interface CreateSessionData {
  class_id: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes?: number;
  notes?: string;
}

export class ClassService {
  /**
   * Create a new class
   */
  static async createClass(classData: CreateClassData): Promise<Class> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Class }>('/classes/create-class', {
        method: 'POST',
        body: JSON.stringify(classData)
      });
      return res.data;
    } catch (error) {
      console.error('Error creating class via API:', error);
      throw error;
    }
  }

  /**
   * Get classes for a teacher
   */
  static async getTeacherClasses(teacherId: string): Promise<Class[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Class[] }>(`/classes/teacher/${teacherId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching teacher classes via API:', error);
      throw error;
    }
  }

  /**
   * Get classes for a student
   */
  static async getStudentClasses(studentId: string): Promise<Class[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Class[] }>(`/classes/student/${studentId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching student classes via API:', error);
      throw error;
    }
  }

  /**
   * Get class by ID
   */
  static async getClassById(classId: string): Promise<Class | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Class }>(`/classes/${classId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching class details via API:', error);
      return null;
    }
  }

  /**
   * Update class
   */
  static async updateClass(classId: string, updates: Partial<Class>): Promise<Class> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Class }>(`/classes/${classId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return res.data;
    } catch (error) {
      console.error('Error updating class via API:', error);
      throw error;
    }
  }

  /**
   * Create a class session
   */
  static async createSession(sessionData: CreateSessionData): Promise<ClassSession> {
    try {
      // Calculate tokens charged
      const durationHours = sessionData.duration_minutes ? sessionData.duration_minutes / 60 : 1;
      const tokensCharged = Math.ceil(durationHours * 10);

      const res = await apiService.makeRequest<{ success: boolean; data: ClassSession }>('/classes/sessions', {
        method: 'POST',
        body: JSON.stringify({
          ...sessionData,
          tokens_charged: tokensCharged,
          status: 'scheduled'
        })
      });

      // Create Zoom meeting on server for the session
      try {
        const zoomResponse = await fetch('/api/zoom/meetings/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: res.data.id,
            topic: res.data.title,
            startTime: res.data.scheduled_start,
            duration: res.data.duration_minutes || 60,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
          })
        });

        const zoomResult = await zoomResponse.json().catch(() => null);
        if (zoomResponse.ok && zoomResult?.success) {
          return {
            ...res.data,
            meeting_url: zoomResult.meeting?.join_url || res.data.meeting_url,
            meeting_id: zoomResult.meeting?.meeting_id || res.data.meeting_id,
            zoom_meeting_id: zoomResult.meeting?.id || res.data.zoom_meeting_id
          };
        }
      } catch (zoomErr) {
        console.warn('Zoom meeting creation skipped or failed:', zoomErr);
      }

      return res.data;
    } catch (error) {
      console.error('Error creating session via API:', error);
      throw error;
    }
  }

  /**
   * Get sessions for a class
   */
  static async getClassSessions(classId: string): Promise<ClassSession[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: ClassSession[] }>(`/classes/${classId}/sessions`);
      return res.data;
    } catch (error) {
      console.error('Error fetching class sessions via API:', error);
      throw error;
    }
  }

  /**
   * Get upcoming sessions for a teacher
   */
  static async getTeacherUpcomingSessions(teacherId: string): Promise<ClassSession[]> {
    try {
      const classes = await this.getTeacherClasses(teacherId);
      const allSessions: ClassSession[] = [];
      
      for (const cls of classes) {
        const sessions = await this.getClassSessions(cls.id);
        allSessions.push(...sessions);
      }
      
      const now = new Date().getTime();
      return allSessions
        .filter(s => new Date(s.scheduled_start).getTime() >= now && ['scheduled', 'in_progress'].includes(s.status))
        .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
    } catch (error) {
      console.error('Error fetching teacher upcoming sessions:', error);
      return [];
    }
  }

  /**
   * Get upcoming sessions for a student
   */
  static async getStudentUpcomingSessions(studentId: string): Promise<ClassSession[]> {
    try {
      const sessions = await apiService.getSessions(studentId, 20);
      const now = new Date().getTime();
      return (sessions as any[] || [])
        .map(s => ({
          ...s,
          scheduled_start: s.scheduled_start,
          scheduled_end: s.scheduled_end,
          status: s.status
        }))
        .filter(s => new Date(s.scheduled_start).getTime() >= now && ['scheduled', 'in_progress'].includes(s.status))
        .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
    } catch (error) {
      console.error('Error fetching student upcoming sessions:', error);
      return [];
    }
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    sessionId: string, 
    status: ClassSession['status'],
    updates?: Partial<ClassSession>
  ): Promise<ClassSession> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: ClassSession }>(`/classes/sessions/${sessionId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          updates
        })
      });
      return res.data;
    } catch (error) {
      console.error('Error updating session status via API:', error);
      throw error;
    }
  }

  /**
   * Get class statistics
   */
  static async getClassStats(classId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalHours: number;
    averageRating?: number;
  }> {
    try {
      const sessions = await this.getClassSessions(classId);
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const totalMinutes = sessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      return {
        totalSessions,
        completedSessions,
        totalHours: totalMinutes / 60,
        averageRating: undefined
      };
    } catch (error) {
      console.error('Error getting class stats:', error);
      throw error;
    }
  }
}
