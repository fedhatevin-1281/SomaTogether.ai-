import { apiService } from './apiService';

export interface ChildData {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  grade_level?: string;
  school_name?: string;
  learning_goals: string[];
  interests: string[];
  preferred_languages: string[];
  learning_style?: string;
  timezone: string;
  education_system?: {
    id: string;
    name: string;
  };
  education_level?: {
    id: string;
    level_name: string;
  };
  wallet_balance: number;
  tokens: number;
  created_at: string;
  updated_at: string;
}

export interface ChildProgress {
  child_id: string;
  child_name: string;
  overall_progress: number;
  total_sessions: number;
  completed_sessions: number;
  total_study_hours: number;
  assignment_completion_rate: number;
  average_grade: string;
  subjects: ChildSubjectProgress[];
  recent_activity: ChildActivity[];
  upcoming_sessions: UpcomingSession[];
}

export interface ChildSubjectProgress {
  subject_id: string;
  subject_name: string;
  teacher_name: string;
  teacher_id: string;
  progress: number;
  grade: string;
  sessions_completed: number;
  next_session?: string;
  improvement: string;
  color: string;
}

export interface ChildActivity {
  id: string;
  type: 'assignment' | 'session' | 'grade' | 'message';
  title: string;
  description: string;
  subject: string;
  grade?: string;
  timestamp: string;
  teacher_name?: string;
}

export interface UpcomingSession {
  id: string;
  child_name: string;
  teacher_name: string;
  subject: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
}

export interface ParentDashboardData {
  children: ChildData[];
  total_children: number;
  active_teachers: number;
  overall_progress: number;
  hours_this_week: number;
  monthly_spending: number;
  upcoming_sessions: UpcomingSession[];
  recent_activity: ChildActivity[];
  monthly_summary: {
    total_sessions: number;
    study_hours: number;
    assignments_completed: number;
    total_assignments: number;
    average_grades: string;
    amount_spent: number;
  };
  recent_messages: {
    from: string;
    message: string;
    timestamp: string;
  }[];
}

class ParentService {
  /**
   * Get all children for a parent
   */
  static async getChildren(parentId: string): Promise<ChildData[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>(`/parent/${parentId}/children`);
      return (res.data || []).map(link => ({
        id: link.student.id,
        full_name: link.student.profiles.full_name,
        email: link.student.profiles.email,
        avatar_url: link.student.profiles.avatar_url,
        grade_level: link.student.grade_level,
        school_name: link.student.school_name,
        learning_goals: link.student.learning_goals || [],
        interests: link.student.interests || [],
        preferred_languages: link.student.preferred_languages || ['en'],
        learning_style: link.student.learning_style,
        timezone: link.student.timezone || 'UTC',
        wallet_balance: link.student.wallet_balance || 0,
        tokens: link.student.tokens || 0,
        created_at: link.created_at,
        updated_at: link.updated_at
      }));
    } catch (error) {
      console.error('Error in getChildren via API:', error);
      return [];
    }
  }

  /**
   * Link child to parent
   */
  static async linkChild(parentId: string, childEmail: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any }>('/parent/link-child', {
        method: 'POST',
        body: JSON.stringify({ parentId, childEmail })
      });
      return { success: res.success, data: res.data };
    } catch (error) {
      console.error('Error linking child via API:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Link failed' };
    }
  }

  /**
   * Get progress for a specific child
   */
  static async getChildProgress(childId: string): Promise<ChildProgress | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: ChildProgress }>(`/parent/child/${childId}/progress`);
      return res.data;
    } catch (error) {
      console.error('Error getting child progress via API:', error);
      return null;
    }
  }

  /**
   * Get dashboard data for parent
   */
  static async getDashboardData(parentId: string): Promise<ParentDashboardData> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: ParentDashboardData }>(`/parent/${parentId}/dashboard`);
      return res.data;
    } catch (error) {
      console.error('Error getting parent dashboard via API:', error);
      throw error;
    }
  }

  /**
   * Get payment history for parent's children
   */
  static async getPaymentHistory(parentId: string): Promise<any> {
    try {
      return await apiService.makeRequest(`/parent/${parentId}/payments`);
    } catch (error) {
      console.error('Error getting payment history via API:', error);
      throw error;
    }
  }
}

export default ParentService;
