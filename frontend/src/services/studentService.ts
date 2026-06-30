import { apiService } from './apiService';

export interface StudentDashboardStats {
  wallet_balance: number;
  tokens: number;
  total_classes: number;
  completed_assignments: number;
  upcoming_sessions: number;
  unread_messages: number;
}

export interface StudentClass {
  id: string;
  title: string;
  subject: string;
  teacher_name: string;
  teacher_avatar?: string;
  progress: number;
  status: string;
  hourly_rate: number;
  created_at: string;
}

export interface StudentAssignment {
  id: string;
  title: string;
  subject: string;
  teacher_name: string;
  due_date: string;
  status: string;
  max_points: number;
  difficulty_level: string;
  created_at: string;
}

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface StudentSession {
  id: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  meeting_url?: string;
  class_title: string;
  subject: string;
  teacher_name: string;
  teacher_avatar?: string;
}

export class StudentService {
  /**
   * Get dashboard statistics for a student
   */
  static async getDashboardStats(studentId: string): Promise<StudentDashboardStats> {
    try {
      const stats = await apiService.getDashboardStats(studentId);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats from API:', error);
      return {
        wallet_balance: 0,
        tokens: 0,
        total_classes: 0,
        completed_assignments: 0,
        upcoming_sessions: 0,
        unread_messages: 0
      };
    }
  }

  /**
   * Get active classes for a student
   */
  static async getActiveClasses(studentId: string, limit: number = 5): Promise<StudentClass[]> {
    try {
      const classes = await apiService.getClasses(studentId, 'active', limit);
      return classes;
    } catch (error) {
      console.error('Error fetching classes from API:', error);
      return [];
    }
  }

  /**
   * Get upcoming assignments for a student
   */
  static async getUpcomingAssignments(studentId: string, limit: number = 5): Promise<StudentAssignment[]> {
    try {
      const assignments = await apiService.getAssignments(studentId, 'upcoming', limit);
      return assignments;
    } catch (error) {
      console.error('Error fetching assignments from API:', error);
      return [];
    }
  }

  /**
   * Get recent notifications for a student
   */
  static async getNotifications(studentId: string, unreadOnly: boolean = false, limit: number = 5): Promise<StudentNotification[]> {
    try {
      const notifications = await apiService.getNotifications(studentId, unreadOnly, limit);
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications from API:', error);
      return [];
    }
  }

  /**
   * Mark a notification as read
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

  /**
   * Get upcoming sessions for a student
   */
  static async getUpcomingSessions(studentId: string, limit: number = 5): Promise<StudentSession[]> {
    try {
      const sessions = await apiService.getSessions(studentId, limit);
      return sessions;
    } catch (error) {
      console.error('Error fetching sessions from API:', error);
      return [];
    }
  }

  /**
   * Get student wallet information
   */
  static async getWallet(studentId: string) {
    try {
      const wallet = await apiService.getWallet(studentId);
      return wallet;
    } catch (error) {
      console.error('Error fetching wallet from API:', error);
      return null;
    }
  }

  /**
   * Create a sample notification for testing
   */
  static async createSampleNotification(studentId: string, title: string, message: string): Promise<boolean> {
    try {
      const res = await apiService.makeRequest<{ success: boolean }>('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          user_id: studentId,
          type: 'info',
          title,
          message,
          is_read: false
        })
      });
      return res.success;
    } catch (error) {
      console.error('Error creating sample notification via API:', error);
      return false;
    }
  }
}
