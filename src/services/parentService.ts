import { supabase } from '../supabaseClient';

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
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          grade_level,
          school_name,
          learning_goals,
          interests,
          preferred_languages,
          learning_style,
          timezone,
          wallet_balance,
          tokens,
          created_at,
          updated_at,
          parent_id,
          education_system_id,
          education_level_id,
          profiles!inner (
            id,
            full_name,
            email,
            avatar_url
          ),
          education_systems (
            id,
            name
          ),
          education_levels (
            id,
            level_name
          )
        `)
        .eq('parent_id', parentId);

      if (error) {
        console.error('Error fetching children:', error);
        return [];
      }

      return (data || []).map((child: any) => ({
        id: child.id,
        full_name: child.profiles.full_name,
        email: child.profiles.email,
        avatar_url: child.profiles.avatar_url,
        grade_level: child.grade_level,
        school_name: child.school_name,
        learning_goals: child.learning_goals || [],
        interests: child.interests || [],
        preferred_languages: child.preferred_languages || ['en'],
        learning_style: child.learning_style,
        timezone: child.timezone || 'UTC',
        education_system: child.education_systems ? {
          id: child.education_systems.id,
          name: child.education_systems.name
        } : undefined,
        education_level: child.education_levels ? {
          id: child.education_levels.id,
          level_name: child.education_levels.level_name
        } : undefined,
        wallet_balance: child.wallet_balance || 0,
        tokens: child.tokens || 0,
        created_at: child.created_at,
        updated_at: child.updated_at
      }));
    } catch (error) {
      console.error('Error in getChildren:', error);
      return [];
    }
  }

  /**
   * Get detailed progress for a specific child
   */
  static async getChildProgress(childId: string): Promise<ChildProgress | null> {
    try {
      if (!childId) {
        console.error('Child ID is required');
        return null;
      }

      // Get child basic info
      const { data: childData, error: childError } = await supabase
        .from('students')
        .select(`
          id,
          profiles!inner (
            full_name
          )
        `)
        .eq('id', childId)
        .single();

      if (childError || !childData) {
        console.error('Error fetching child data:', childError);
        return null;
      }

      // Get class sessions for this child
      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          status,
          duration_minutes,
          classes!inner (
            id,
            title,
            subjects!inner (
              id,
              name
            ),
            teachers!inner (
              id,
              profiles!inner (
                full_name
              )
            )
          )
        `)
        .eq('student_id', childId);

      // Get assignments for this child
      const { data: assignmentsData } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          status,
          points_earned,
          max_points,
          submitted_at,
          assignments!inner (
            id,
            title,
            subjects!inner (
              name
            )
          )
        `)
        .eq('student_id', childId);

      // Calculate progress metrics
      const completedSessions = (sessionsData || []).filter(s => s.status === 'completed');
      const totalSessions = sessionsData?.length || 0;
      const totalStudyHours = completedSessions.reduce((sum, session) => {
        return sum + (session.duration_minutes || 0) / 60;
      }, 0);

      const completedAssignments = (assignmentsData || []).filter(a => a.status === 'graded');
      const totalAssignments = assignmentsData?.length || 0;
      const assignmentCompletionRate = totalAssignments > 0 ? 
        Math.round((completedAssignments.length / totalAssignments) * 100) : 0;

      // Calculate average grade
      const grades = completedAssignments
        .filter(a => a.points_earned && a.max_points)
        .map(a => (a.points_earned! / a.max_points!) * 100);
      const averageGrade = grades.length > 0 ? 
        this.calculateLetterGrade(grades.reduce((sum, grade) => sum + grade, 0) / grades.length) : 'N/A';

      // Get subject progress
      const subjects = await this.getChildSubjectProgress(childId);

      // Get recent activity
      const recentActivity = await this.getChildRecentActivity(childId);

      // Get upcoming sessions
      const upcomingSessions = await this.getUpcomingSessions(childId);

      return {
        child_id: childId,
        child_name: childData.profiles.full_name,
        overall_progress: Math.round((completedSessions.length / Math.max(totalSessions, 1)) * 100),
        total_sessions: totalSessions,
        completed_sessions: completedSessions.length,
        total_study_hours: Math.round(totalStudyHours * 10) / 10,
        assignment_completion_rate: assignmentCompletionRate,
        average_grade: averageGrade,
        subjects,
        recent_activity: recentActivity,
        upcoming_sessions: upcomingSessions
      };
    } catch (error) {
      console.error('Error in getChildProgress:', error);
      return null;
    }
  }

  /**
   * Get subject progress for a child
   */
  private static async getChildSubjectProgress(childId: string): Promise<ChildSubjectProgress[]> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          title,
          subjects!inner (
            id,
            name
          ),
          teachers!inner (
            id,
            profiles!inner (
              full_name
            )
          ),
          class_sessions (
            id,
            status,
            scheduled_start
          )
        `)
        .eq('student_id', childId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching subject progress:', error);
        return [];
      }

      const colors = ['blue', 'green', 'purple', 'orange', 'red', 'indigo'];
      
      return (data || []).map((classData: any, index: number) => {
        const completedSessions = classData.class_sessions.filter((s: any) => s.status === 'completed');
        const totalSessions = classData.class_sessions.length;
        const progress = totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0;
        
        const nextSession = classData.class_sessions
          .filter((s: any) => s.status === 'scheduled')
          .sort((a: any, b: any) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())[0];

        return {
          subject_id: classData.subjects.id,
          subject_name: classData.subjects.name,
          teacher_name: classData.teachers.profiles.full_name,
          teacher_id: classData.teachers.id,
          progress,
          grade: this.calculateLetterGrade(progress),
          sessions_completed: completedSessions.length,
          next_session: nextSession ? new Date(nextSession.scheduled_start).toLocaleString() : undefined,
          improvement: `+${Math.floor(Math.random() * 20) + 10}%`, // Mock improvement for now
          color: colors[index % colors.length]
        };
      });
    } catch (error) {
      console.error('Error in getChildSubjectProgress:', error);
      return [];
    }
  }

  /**
   * Get recent activity for a child
   */
  private static async getChildRecentActivity(childId: string): Promise<ChildActivity[]> {
    try {
      // Get recent assignments
      const { data: assignmentsData } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          status,
          points_earned,
          max_points,
          submitted_at,
          assignments!inner (
            title,
            subjects!inner (
              name
            )
          )
        `)
        .eq('student_id', childId)
        .order('submitted_at', { ascending: false })
        .limit(5);

      // Get recent sessions
      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select(`
          id,
          status,
          actual_start,
          classes!inner (
            title,
            subjects!inner (
              name
            ),
            teachers!inner (
              profiles!inner (
                full_name
              )
            )
          )
        `)
        .eq('student_id', childId)
        .order('actual_start', { ascending: false })
        .limit(5);

      const activities: ChildActivity[] = [];

      // Process assignments
      (assignmentsData || []).forEach(assignment => {
        activities.push({
          id: assignment.id,
          type: 'assignment',
          title: `Assignment: ${assignment.assignments.title}`,
          description: assignment.status === 'graded' ? 'Assignment graded' : 'Assignment submitted',
          subject: assignment.assignments.subjects.name,
          grade: assignment.points_earned && assignment.max_points ? 
            this.calculateLetterGrade((assignment.points_earned / assignment.max_points) * 100) : undefined,
          timestamp: assignment.submitted_at,
          teacher_name: undefined
        });
      });

      // Process sessions
      (sessionsData || []).forEach(session => {
        activities.push({
          id: session.id,
          type: 'session',
          title: `Session: ${session.classes.title}`,
          description: `Session ${session.status}`,
          subject: session.classes.subjects.name,
          timestamp: session.actual_start || new Date().toISOString(),
          teacher_name: session.classes.teachers.profiles.full_name
        });
      });

      // Sort by timestamp and return most recent
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('Error in getChildRecentActivity:', error);
      return [];
    }
  }

  /**
   * Get upcoming sessions for a child
   */
  private static async getUpcomingSessions(childId: string): Promise<UpcomingSession[]> {
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          status,
          classes!inner (
            title,
            subjects!inner (
              name
            ),
            teachers!inner (
              profiles!inner (
                full_name
              )
            )
          )
        `)
        .eq('student_id', childId)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching upcoming sessions:', error);
        return [];
      }

      return (data || []).map(session => ({
        id: session.id,
        child_name: 'Child', // We'll get this from context
        teacher_name: session.classes.teachers.profiles.full_name,
        subject: session.classes.subjects.name,
        scheduled_start: session.scheduled_start,
        scheduled_end: session.scheduled_end,
        status: session.status
      }));
    } catch (error) {
      console.error('Error in getUpcomingSessions:', error);
      return [];
    }
  }

  /**
   * Get comprehensive dashboard data for parent
   */
  static async getDashboardData(parentId: string): Promise<ParentDashboardData> {
    try {
      const children = await this.getChildren(parentId);
      const childrenIds = children.map(child => child.id);

      // Get active teachers count
      const { count: activeTeachers } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      // Get sessions data for all children
      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select(`
          id,
          status,
          scheduled_start,
          duration_minutes,
          student_id
        `)
        .in('student_id', childrenIds);

      // Get assignments data for all children
      const { data: assignmentsData } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          status,
          student_id,
          points_earned,
          max_points
        `)
        .in('student_id', childrenIds);

      // Get transactions for spending calculation
      const { data: transactionsData } = await supabase
        .from('token_transactions')
        .select(`
          amount_usd,
          created_at
        `)
        .in('user_id', childrenIds)
        .eq('type', 'purchase')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      // Calculate metrics
      const completedSessions = (sessionsData || []).filter(s => s.status === 'completed');
      const thisWeekSessions = completedSessions.filter(s => {
        const sessionDate = new Date(s.scheduled_start);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate >= weekAgo;
      });

      const hoursThisWeek = thisWeekSessions.reduce((sum, session) => {
        return sum + (session.duration_minutes || 0) / 60;
      }, 0);

      const completedAssignments = (assignmentsData || []).filter(a => a.status === 'graded');
      const totalAssignments = assignmentsData?.length || 0;

      const monthlySpending = (transactionsData || []).reduce((sum, t) => sum + (t.amount_usd || 0), 0);

      // Calculate overall progress
      const totalSessions = sessionsData?.length || 0;
      const overallProgress = totalSessions > 0 ? 
        Math.round((completedSessions.length / totalSessions) * 100) : 0;

      // Get upcoming sessions
      const upcomingSessions = await this.getUpcomingSessions(childrenIds[0] || '');

      // Get recent activity
      const recentActivity = await this.getChildRecentActivity(childrenIds[0] || '');

      // Get recent messages (mock for now)
      const recentMessages = [
        {
          from: 'Dr. Sarah Johnson',
          message: 'Your child is doing excellent work in mathematics!',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          from: 'Ms. Rodriguez',
          message: 'Assignment submitted early - great job!',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      return {
        children,
        total_children: children.length,
        active_teachers: activeTeachers || 0,
        overall_progress: overallProgress,
        hours_this_week: Math.round(hoursThisWeek * 10) / 10,
        monthly_spending: Math.round(monthlySpending * 100) / 100,
        upcoming_sessions: upcomingSessions,
        recent_activity: recentActivity,
        monthly_summary: {
          total_sessions: completedSessions.length,
          study_hours: Math.round(completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0) / 60, 0) * 10) / 10,
          assignments_completed: completedAssignments.length,
          total_assignments: totalAssignments,
          average_grades: this.calculateLetterGrade(overallProgress),
          amount_spent: monthlySpending
        },
        recent_messages: recentMessages
      };
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      return {
        children: [],
        total_children: 0,
        active_teachers: 0,
        overall_progress: 0,
        hours_this_week: 0,
        monthly_spending: 0,
        upcoming_sessions: [],
        recent_activity: [],
        monthly_summary: {
          total_sessions: 0,
          study_hours: 0,
          assignments_completed: 0,
          total_assignments: 0,
          average_grades: 'N/A',
          amount_spent: 0
        },
        recent_messages: []
      };
    }
  }

  /**
   * Calculate letter grade from percentage
   */
  private static calculateLetterGrade(percentage: number): string {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  }
}

export default ParentService;
