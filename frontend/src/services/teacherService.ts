import { apiService } from './apiService';

export interface TeacherDashboardStats {
  total_earnings: number;
  total_sessions: number;
  active_students: number;
  pending_requests: number;
  upcoming_sessions: number;
  completed_assignments: number;
  average_rating: number;
  total_reviews: number;
  unread_messages: number;
  wallet_balance: number;
  tokens: number;
}

export interface TeacherClass {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar?: string;
  subject_name: string;
  title: string;
  hourly_rate: number;
  currency: string;
  status: string;
  completed_sessions: number;
  start_date: string;
  end_date?: string;
  next_session?: string;
}

export interface TeacherSession {
  id: string;
  class_id: string;
  student_id: string;
  student_name: string;
  subject_name: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  meeting_url?: string;
  rate: number;
  notes?: string;
}

export interface TeacherAssignment {
  id: string;
  class_id: string;
  subject_name: string;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  status: string;
  difficulty_level: string;
  submissions_count: number;
  graded_count: number;
  created_at: string;
}

export interface TeacherNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  created_at: string;
  data: any;
}

export interface TeacherRecentActivity {
  id: string;
  type: 'session' | 'assignment' | 'review' | 'message' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  student_name?: string;
  amount?: number;
  status?: string;
}

export interface TeacherStudent {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
  bio?: string;
  grade_level?: string;
  school_name?: string;
  learning_goals: string[];
  interests: string[];
  preferred_languages: string[];
  learning_style?: string;
  timezone: string;
  class_id: string;
  class_title: string;
  subject_name: string;
  hourly_rate: number;
  currency: string;
  join_date: string;
  completed_sessions: number;
  total_sessions: number;
  total_assignments: number;
  completed_assignments: number;
  average_grade: string;
  status: string;
  wallet_balance: number;
  tokens: number;
}

export class TeacherService {
  /**
   * Get comprehensive dashboard stats for a teacher
   */
  static async getDashboardStats(teacherId: string): Promise<TeacherDashboardStats> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherDashboardStats }>(`/teacher/dashboard/stats?teacherId=${teacherId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching dashboard stats from API:', error);
      throw error;
    }
  }

  /**
   * Get active classes for the teacher
   */
  static async getActiveClasses(teacherId: string): Promise<TeacherClass[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherClass[] }>(`/teacher/classes?teacherId=${teacherId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching teacher classes from API:', error);
      return [];
    }
  }

  /**
   * Get detailed student information for My Students page
   */
  static async getMyStudents(teacherId: string): Promise<TeacherStudent[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherStudent[] }>(`/teacher/students?teacherId=${teacherId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching teacher students from API:', error);
      return [];
    }
  }

  /**
   * Get upcoming sessions for the teacher
   */
  static async getUpcomingSessions(teacherId: string, limit: number = 5): Promise<TeacherSession[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherSession[] }>(`/teacher/sessions?teacherId=${teacherId}&limit=${limit}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching teacher sessions from API:', error);
      return [];
    }
  }

  /**
   * Get recent assignments for the teacher
   */
  static async getRecentAssignments(teacherId: string, limit: number = 5): Promise<TeacherAssignment[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherAssignment[] }>(`/teacher/assignments?teacherId=${teacherId}&limit=${limit}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching teacher assignments from API:', error);
      return [];
    }
  }

  /**
   * Get recent notifications for the teacher
   */
  static async getNotifications(teacherId: string, limit: number = 5): Promise<TeacherNotification[]> {
    try {
      const res = await apiService.makeRequest<TeacherNotification[]>(`/student/notifications?userId=${teacherId}&limit=${limit}`);
      return res;
    } catch (error) {
      console.error('Error fetching notifications from API:', error);
      return [];
    }
  }

  /**
   * Get recent activity for the teacher
   */
  static async getRecentActivity(teacherId: string, limit: number = 10): Promise<TeacherRecentActivity[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherRecentActivity[] }>(`/teacher/activity?teacherId=${teacherId}&limit=${limit}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching teacher activity from API:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const res = await apiService.makeRequest<{ success: boolean }>(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      return res.success;
    } catch (error) {
      console.error('Error marking notification as read via API:', error);
      return false;
    }
  }
}
