import { supabase } from '../supabaseClient';

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
      // Get wallet data
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, tokens')
        .eq('user_id', studentId)
        .single();

      // Get active classes count
      const { count: activeClassesCount, error: classesError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'active');

      // Get completed assignments count
      const { count: completedAssignmentsCount, error: assignmentsError } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'graded');

      // Get upcoming sessions count
      const { count: upcomingSessionsCount, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString());

      // Get unread notifications count
      const { count: unreadMessagesCount, error: messagesError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('is_read', false);

      return {
        wallet_balance: walletData?.balance || 0,
        tokens: walletData?.tokens || 0,
        total_classes: activeClassesCount || 0,
        completed_assignments: completedAssignmentsCount || 0,
        upcoming_sessions: upcomingSessionsCount || 0,
        unread_messages: unreadMessagesCount || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values on error
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
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          title,
          status,
          hourly_rate,
          created_at,
          completed_sessions,
          subjects (
            name
          ),
          teachers!teacher_id (
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching classes:', error);
        return [];
      }

      return (data || []).map(cls => ({
        id: cls.id,
        title: cls.title,
        subject: cls.subjects?.name || 'Unknown Subject',
        teacher_name: cls.teachers?.profiles?.full_name || 'Unknown Teacher',
        teacher_avatar: cls.teachers?.profiles?.avatar_url,
        progress: Math.min(100, Math.round((cls.completed_sessions / 10) * 100)), // Assuming 10 sessions per class
        status: cls.status,
        hourly_rate: cls.hourly_rate || 0,
        created_at: cls.created_at
      }));
    } catch (error) {
      console.error('Error fetching classes:', error);
      return [];
    }
  }

  /**
   * Get upcoming assignments for a student
   */
  static async getUpcomingAssignments(studentId: string, limit: number = 5): Promise<StudentAssignment[]> {
    try {
      // First get classes for this student
      const { data: studentClasses, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (classesError || !studentClasses?.length) {
        return [];
      }

      const classIds = studentClasses.map(c => c.id);

      // Get assignments for these classes
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          due_date,
          max_points,
          status,
          difficulty_level,
          created_at,
          subjects!assignments_subject_id_fkey (
            name
          ),
          profiles!assignments_teacher_id_fkey (
            full_name
          )
        `)
        .in('class_id', classIds)
        .eq('is_published', true)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching assignments:', error);
        return [];
      }

      return (data || []).map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        subject: assignment.subjects?.name || 'Unknown Subject',
        teacher_name: assignment.profiles?.full_name || 'Unknown Teacher',
        due_date: assignment.due_date,
        status: assignment.status,
        max_points: assignment.max_points || 100,
        difficulty_level: assignment.difficulty_level || 'medium',
        created_at: assignment.created_at
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  }

  /**
   * Get recent notifications for a student
   */
  static async getNotifications(studentId: string, unreadOnly: boolean = false, limit: number = 5): Promise<StudentNotification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at')
        .eq('user_id', studentId);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get upcoming sessions for a student
   */
  static async getUpcomingSessions(studentId: string, limit: number = 5): Promise<StudentSession[]> {
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          status,
          meeting_url,
          classes!class_sessions_class_id_fkey (
            title,
            subjects!classes_subject_id_fkey (
              name
            )
          ),
          profiles!class_sessions_teacher_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return (data || []).map(session => ({
        id: session.id,
        title: session.title,
        description: session.description,
        scheduled_start: session.scheduled_start,
        scheduled_end: session.scheduled_end,
        status: session.status,
        meeting_url: session.meeting_url,
        class_title: session.classes?.title || 'Unknown Class',
        subject: session.classes?.subjects?.name || 'Unknown Subject',
        teacher_name: session.profiles?.full_name || 'Unknown Teacher',
        teacher_avatar: session.profiles?.avatar_url
      }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Get student wallet information
   */
  static async getWallet(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          balance,
          tokens,
          currency,
          transactions (
            id,
            type,
            amount,
            currency,
            description,
            status,
            created_at
          )
        `)
        .eq('user_id', studentId)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  }

  /**
   * Create a sample notification for testing
   */
  static async createSampleNotification(studentId: string, title: string, message: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          type: 'info',
          title,
          message,
          is_read: false
        });

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }
}
