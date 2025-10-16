import { supabase } from '../supabaseClient';

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
  parent_info?: {
    full_name: string;
    email: string;
    phone?: string;
  } | null;
  class_id: string;
  class_title: string;
  subject_name: string;
  subject_category?: string;
  hourly_rate: number;
  currency: string;
  join_date: string;
  completed_sessions: number;
  total_sessions: number;
  next_session?: {
    start_time: string;
    title: string;
  } | null;
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
      // Get teacher basic stats
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('rating, total_reviews, total_sessions, total_students')
        .eq('id', teacherId)
        .single();

      if (teacherError) {
        console.error('Error fetching teacher stats:', teacherError);
      }

      // Get wallet data
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, tokens')
        .eq('user_id', teacherId)
        .single();

      if (walletError) {
        console.error('Error fetching wallet data:', walletError);
      }

      // Get active classes count
      const { count: activeClassesCount, error: classesError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .eq('status', 'active');

      // Get pending session requests count
      const { count: pendingRequestsCount, error: requestsError } = await supabase
        .from('session_requests')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .eq('status', 'pending');

      // Get upcoming sessions count (next 7 days)
      const { count: upcomingSessionsCount, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .lte('scheduled_start', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get completed assignments count
      const { count: completedAssignmentsCount, error: assignmentsError } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments!inner(teacher_id)
        `, { count: 'exact', head: true })
        .eq('assignments.teacher_id', teacherId)
        .eq('status', 'graded');

      // Get unread messages count
      const { count: unreadMessagesCount, error: messagesError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', teacherId)
        .eq('is_read', false);

      // Get total earnings from token transactions
      const { data: earningsData, error: earningsError } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('user_id', teacherId)
        .eq('type', 'earn')
        .eq('status', 'completed');

      const totalEarnings = earningsData?.reduce((sum, transaction) => sum + (transaction.amount_usd || 0), 0) || 0;

      return {
        total_earnings: totalEarnings,
        total_sessions: teacherData?.total_sessions || 0,
        active_students: activeClassesCount || 0,
        pending_requests: pendingRequestsCount || 0,
        upcoming_sessions: upcomingSessionsCount || 0,
        completed_assignments: completedAssignmentsCount || 0,
        average_rating: teacherData?.rating || 0,
        total_reviews: teacherData?.total_reviews || 0,
        unread_messages: unreadMessagesCount || 0,
        wallet_balance: walletData?.balance || 0,
        tokens: walletData?.tokens || 0,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  /**
   * Get active classes for the teacher
   */
  static async getActiveClasses(teacherId: string): Promise<TeacherClass[]> {
    try {
      // Get classes without complex joins
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (classesError) {
        console.error('Error fetching classes:', classesError);
        return [];
      }

      if (!classesData || classesData.length === 0) {
        return [];
      }

      // Get student IDs and subject IDs
      const studentIds = classesData.map(c => c.student_id).filter(Boolean);
      const subjectIds = classesData.map(c => c.subject_id).filter(Boolean);

      // Fetch students with profiles
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          profiles(id, full_name, avatar_url)
        `)
        .in('id', studentIds);

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', subjectIds);

      // Create lookup maps
      const studentsMap = new Map();
      studentsData?.forEach(student => {
        studentsMap.set(student.id, student);
      });

      const subjectsMap = new Map();
      subjectsData?.forEach(subject => {
        subjectsMap.set(subject.id, subject);
      });

      // Map the data
      return classesData.map(classItem => {
        const student = studentsMap.get(classItem.student_id);
        const subject = subjectsMap.get(classItem.subject_id);
        
        return {
          id: classItem.id,
          student_id: classItem.student_id,
          student_name: student?.profiles?.full_name || 'Unknown Student',
          student_avatar: student?.profiles?.avatar_url,
          subject_name: subject?.name || 'Unknown Subject',
          title: classItem.title,
          hourly_rate: classItem.hourly_rate,
          currency: classItem.currency,
          status: classItem.status,
          completed_sessions: classItem.completed_sessions,
          start_date: classItem.start_date,
          end_date: classItem.end_date,
          next_session: undefined, // TODO: Get next scheduled session
        };
      });
    } catch (error) {
      console.error('Error in getActiveClasses:', error);
      return [];
    }
  }

  /**
   * Get detailed student information for My Students page
   */
  static async getMyStudents(teacherId: string): Promise<TeacherStudent[]> {
    try {
      // Get all active classes with detailed student information
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            *,
            students!classes_student_id_fkey(
              id,
              grade_level,
              school_name,
              parent_id,
              learning_goals,
              interests,
              wallet_balance,
              tokens,
              preferred_languages,
              learning_style,
              education_system_id,
              education_level_id,
              profiles!students_profile_id_fkey(id, full_name, avatar_url, email, bio, date_of_birth, location, timezone)
            ),
            subjects(id, name, category, description)
          `)
        .eq('teacher_id', teacherId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (classesError) {
        console.error('Error fetching classes:', classesError);
        return [];
      }

      // Get session statistics for each student
      const studentsWithStats = await Promise.all(
        (classesData || []).map(async (classItem) => {
          const student = classItem.students;
          if (!student) return null;

          // Get completed sessions count
          const { count: completedSessions } = await supabase
            .from('class_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('teacher_id', teacherId)
            .eq('status', 'completed');

          // Get total sessions count
          const { count: totalSessions } = await supabase
            .from('class_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('teacher_id', teacherId)
            .in('status', ['completed', 'scheduled']);

          // Get next upcoming session
          const { data: nextSession } = await supabase
            .from('class_sessions')
            .select('scheduled_start, title')
            .eq('student_id', student.id)
            .eq('teacher_id', teacherId)
            .eq('status', 'scheduled')
            .gte('scheduled_start', new Date().toISOString())
            .order('scheduled_start', { ascending: true })
            .limit(1)
            .single();

          // Get assignment statistics
          const { count: totalAssignments } = await supabase
            .from('assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('class_id', classItem.id);

          const { count: completedAssignments } = await supabase
            .from('assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('class_id', classItem.id)
            .eq('status', 'graded');

          // Get average grade from completed assignments
          const { data: assignments } = await supabase
            .from('assignment_submissions')
            .select('points_earned, max_points, grade')
            .eq('student_id', student.id)
            .eq('class_id', classItem.id)
            .eq('status', 'graded')
            .not('grade', 'is', null);

          let averageGrade = 'N/A';
          if (assignments && assignments.length > 0) {
            const totalPoints = assignments.reduce((sum, a) => sum + (a.points_earned || 0), 0);
            const maxPoints = assignments.reduce((sum, a) => sum + (a.max_points || 100), 0);
            const percentage = (totalPoints / maxPoints) * 100;
            
            if (percentage >= 90) averageGrade = 'A';
            else if (percentage >= 80) averageGrade = 'B';
            else if (percentage >= 70) averageGrade = 'C';
            else if (percentage >= 60) averageGrade = 'D';
            else averageGrade = 'F';
          }

          // Get parent information if available
          let parentInfo: {
            full_name: string;
            email: string;
            phone?: string;
          } | null = null;
          if (student.parent_id) {
            const { data: parent } = await supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('id', student.parent_id)
              .single();
            parentInfo = parent;
          }

          return {
            id: student.id,
            name: student.profiles?.full_name || 'Unknown Student',
            avatar_url: student.profiles?.avatar_url,
            email: student.profiles?.email,
            bio: student.profiles?.bio,
            grade_level: student.grade_level,
            school_name: student.school_name,
            learning_goals: student.learning_goals || [],
            interests: student.interests || [],
            preferred_languages: student.preferred_languages || ['en'],
            learning_style: student.learning_style,
            timezone: student.profiles?.timezone || 'UTC',
            parent_info: parentInfo,
            class_id: classItem.id,
            class_title: classItem.title,
            subject_name: classItem.subjects?.name || 'Unknown Subject',
            subject_category: classItem.subjects?.category,
            hourly_rate: classItem.hourly_rate,
            currency: classItem.currency,
            join_date: classItem.created_at,
            completed_sessions: completedSessions || 0,
            total_sessions: totalSessions || 0,
            next_session: nextSession ? {
              start_time: nextSession.scheduled_start,
              title: nextSession.title
            } : null,
            total_assignments: totalAssignments || 0,
            completed_assignments: completedAssignments || 0,
            average_grade: averageGrade,
            status: classItem.status,
            wallet_balance: student.wallet_balance || 0,
            tokens: student.tokens || 0
          } as TeacherStudent;
        })
      );

      return studentsWithStats.filter(Boolean) as TeacherStudent[];
    } catch (error) {
      console.error('Error in getMyStudents:', error);
      return [];
    }
  }

  /**
   * Get upcoming sessions for the teacher
   */
  static async getUpcomingSessions(teacherId: string, limit: number = 5): Promise<TeacherSession[]> {
    try {
      // Get sessions without complex joins
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(limit);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        return [];
      }

      if (!sessionsData || sessionsData.length === 0) {
        return [];
      }

      // Get class IDs and student IDs
      const classIds = sessionsData.map(s => s.class_id).filter(Boolean);
      const studentIds = sessionsData.map(s => s.student_id).filter(Boolean);

      // Fetch classes with subjects
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          id,
          subjects(id, name)
        `)
        .in('id', classIds);

      // Fetch students with profiles
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          profiles(id, full_name)
        `)
        .in('id', studentIds);

      // Create lookup maps
      const classesMap = new Map();
      classesData?.forEach(cls => {
        classesMap.set(cls.id, cls);
      });

      const studentsMap = new Map();
      studentsData?.forEach(student => {
        studentsMap.set(student.id, student);
      });

      // Map the data
      return sessionsData.map(session => {
        const classData = classesMap.get(session.class_id);
        const student = studentsMap.get(session.student_id);
        
        return {
          id: session.id,
          class_id: session.class_id,
          student_id: session.student_id,
          student_name: student?.profiles?.full_name || 'Unknown Student',
          subject_name: classData?.subjects?.name || 'Unknown Subject',
          title: session.title,
          scheduled_start: session.scheduled_start,
          scheduled_end: session.scheduled_end,
          status: session.status,
          meeting_url: session.meeting_url,
          rate: session.rate,
          notes: session.notes,
        };
      });
    } catch (error) {
      console.error('Error in getUpcomingSessions:', error);
      return [];
    }
  }

  /**
   * Get recent assignments for the teacher
   */
  static async getRecentAssignments(teacherId: string, limit: number = 5): Promise<TeacherAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          subjects(id, name),
          assignment_submissions(id, status)
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent assignments:', error);
        return [];
      }

      return data?.map(assignment => ({
        id: assignment.id,
        class_id: assignment.class_id,
        subject_name: assignment.subjects?.name || 'Unknown Subject',
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        max_points: assignment.max_points,
        status: assignment.status,
        difficulty_level: assignment.difficulty_level,
        submissions_count: assignment.assignment_submissions?.length || 0,
        graded_count: assignment.assignment_submissions?.filter(sub => sub.status === 'graded').length || 0,
        created_at: assignment.created_at,
      })) || [];
    } catch (error) {
      console.error('Error in getRecentAssignments:', error);
      return [];
    }
  }

  /**
   * Get recent notifications for the teacher
   */
  static async getNotifications(teacherId: string, limit: number = 5): Promise<TeacherNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data?.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        is_read: notification.is_read,
        priority: notification.priority,
        created_at: notification.created_at,
        data: notification.data,
      })) || [];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  }

  /**
   * Get recent activity for the teacher
   */
  static async getRecentActivity(teacherId: string, limit: number = 10): Promise<TeacherRecentActivity[]> {
    try {
      // Get recent sessions
      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select(`
          *,
          classes!inner(
            subjects(id, name),
            students!inner(
              profiles!inner(full_name)
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          students!inner(
            profiles!inner(full_name)
          ),
          classes!inner(
            subjects(id, name)
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: TeacherRecentActivity[] = [];

      // Process sessions
      sessionsData?.forEach(session => {
        activities.push({
          id: session.id,
          type: 'session',
          title: `${session.status === 'completed' ? 'Completed' : 'Scheduled'} Session`,
          description: `${session.classes?.subjects?.name} with ${session.classes?.students?.profiles?.full_name}`,
          timestamp: session.created_at,
          student_name: session.classes?.students?.profiles?.full_name,
          status: session.status,
        });
      });

      // Process reviews
      reviewsData?.forEach(review => {
        activities.push({
          id: review.id,
          type: 'review',
          title: `New ${review.rating}-star Review`,
          description: review.comment || 'No comment provided',
          timestamp: review.created_at,
          student_name: review.students?.profiles?.full_name,
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      return false;
    }
  }
}
