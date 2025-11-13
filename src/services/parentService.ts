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
          profiles!students_id_fkey (
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
      // Validate childId is a valid UUID
      if (!childId || childId.trim() === '' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(childId)) {
        return [];
      }

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
      // Validate childId is a valid UUID
      if (!childId || childId.trim() === '' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(childId)) {
        return [];
      }

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

      // Get active teachers count - only teachers working with parent's children
      let activeTeachers = 0;
      if (childrenIds.length > 0) {
        // Get unique teacher IDs from active classes with parent's children
        const { data: activeClasses, error: classesError } = await supabase
          .from('classes')
          .select('teacher_id')
          .in('student_id', childrenIds)
          .eq('status', 'active');

        if (!classesError && activeClasses && activeClasses.length > 0) {
          // Get unique teacher IDs
          const uniqueTeacherIds = [...new Set(activeClasses.map(c => c.teacher_id).filter(Boolean))];
          activeTeachers = uniqueTeacherIds.length;
        }
      }

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

      // Get upcoming sessions - only if we have children
      let upcomingSessions: UpcomingSession[] = [];
      let recentActivity: ChildActivity[] = [];
      
      if (childrenIds.length > 0 && childrenIds[0]) {
        // Get upcoming sessions for all children, not just the first one
        const allUpcomingSessions = await Promise.all(
          childrenIds.map(childId => this.getUpcomingSessions(childId))
        );
        upcomingSessions = allUpcomingSessions.flat().sort((a, b) => 
          new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
        ).slice(0, 10); // Limit to 10 most upcoming

        // Get recent activity for all children
        const allRecentActivity = await Promise.all(
          childrenIds.map(childId => this.getChildRecentActivity(childId))
        );
        recentActivity = allRecentActivity.flat().sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 10); // Limit to 10 most recent
      }

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

  /**
   * Get payment history for parent's children
   */
  static async getPaymentHistory(parentId: string): Promise<{
    payments: Array<{
      id: string;
      date: string;
      teacher: string;
      subject: string;
      amount: number;
      sessions: number;
      status: string;
      method: string;
    }>;
    monthlySpending: Array<{
      month: string;
      amount: number;
    }>;
    summary: {
      thisMonth: number;
      averageMonthly: number;
      totalPaid: number;
      pending: number;
      thisMonthSessions: number;
    };
  }> {
    try {
      // Get all children for this parent
      const children = await this.getChildren(parentId);
      const childrenIds = children.map(c => c.id);

      if (childrenIds.length === 0) {
        return {
          payments: [],
          monthlySpending: [],
          summary: {
            thisMonth: 0,
            averageMonthly: 0,
            totalPaid: 0,
            pending: 0,
            thisMonthSessions: 0,
          },
        };
      }

      // Get transactions for all children
      const { data: transactions } = await supabase
        .from('token_transactions')
        .select(`
          id,
          amount_usd,
          created_at,
          status,
          type,
          student_id,
          teacher_id,
          payment_method
        `)
        .in('student_id', childrenIds)
        .eq('type', 'purchase')
        .order('created_at', { ascending: false });

      // Get session data to count sessions per payment
      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select(`
          id,
          scheduled_start,
          student_id,
          classes!inner (
            id,
            teachers!inner (
              id,
              profiles!inner (
                full_name
              )
            ),
            subjects!inner (
              name
            )
          )
        `)
        .in('student_id', childrenIds)
        .eq('status', 'completed');

      // Process payments
      const payments = await Promise.all(
        (transactions || []).map(async (transaction) => {
          // Get teacher name
          let teacherName = 'Unknown';
          let subjectName = 'General';
          
          if (transaction.teacher_id) {
            const { data: teacher } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', transaction.teacher_id)
              .single();
            teacherName = teacher?.full_name || 'Unknown';
          }

          // Count sessions for this transaction (approximate by date)
          const transactionDate = new Date(transaction.created_at);
          const relatedSessions = (sessionsData || []).filter(s => {
            const sessionDate = new Date(s.scheduled_start);
            return (
              s.student_id === transaction.student_id &&
              Math.abs(sessionDate.getTime() - transactionDate.getTime()) < 7 * 24 * 60 * 60 * 1000 // Within 7 days
            );
          });
          
          if (relatedSessions.length > 0 && relatedSessions[0].classes) {
            const classes = relatedSessions[0].classes as any;
            subjectName = classes.subjects?.name || 'General';
            teacherName = classes.teachers?.profiles?.full_name || teacherName;
          }

          return {
            id: transaction.id,
            date: new Date(transaction.created_at).toISOString().split('T')[0],
            teacher: teacherName,
            subject: subjectName,
            amount: Number(transaction.amount_usd) || 0,
            sessions: relatedSessions.length || 1,
            status: transaction.status || 'paid',
            method: transaction.payment_method || 'Credit Card',
          };
        })
      );

      // Calculate monthly spending
      const monthlySpending: { [key: string]: number } = {};
      (transactions || []).forEach((transaction) => {
        const date = new Date(transaction.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        if (!monthlySpending[monthKey]) {
          monthlySpending[monthKey] = 0;
        }
        monthlySpending[monthKey] += Number(transaction.amount_usd) || 0;
      });

      const monthlySpendingArray = Object.entries(monthlySpending)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });

      // Calculate summary
      const currentMonth = new Date().toISOString().substring(0, 7);
      const thisMonthTransactions = (transactions || []).filter(t => 
        t.created_at.startsWith(currentMonth)
      );
      const thisMonth = thisMonthTransactions.reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);
      
      const thisMonthSessions = (sessionsData || []).filter(s => 
        s.scheduled_start.startsWith(currentMonth)
      ).length;

      const totalPaid = (transactions || []).reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);
      const averageMonthly = monthlySpendingArray.length > 0
        ? monthlySpendingArray.reduce((sum, m) => sum + m.amount, 0) / monthlySpendingArray.length
        : 0;

      const pending = (transactions || []).filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);

      return {
        payments: payments.slice(0, 20), // Limit to recent 20
        monthlySpending: monthlySpendingArray.slice(-12), // Last 12 months
        summary: {
          thisMonth,
          averageMonthly: Math.round(averageMonthly),
          totalPaid: Math.round(totalPaid),
          pending: Math.round(pending),
          thisMonthSessions,
        },
      };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return {
        payments: [],
        monthlySpending: [],
        summary: {
          thisMonth: 0,
          averageMonthly: 0,
          totalPaid: 0,
          pending: 0,
          thisMonthSessions: 0,
        },
      };
    }
  }

  /**
   * Get reports and analytics for parent's children
   */
  static async getReports(parentId: string): Promise<{
    reports: Array<{
      id: string;
      title: string;
      type: string;
      date: string;
      subjects: string[];
      status: string;
    }>;
    performanceData: Array<{
      subject: string;
      current: string;
      previous: string;
      improvement: string;
    }>;
    stats: {
      overallImprovement: number;
      sessionsAttended: string;
      studyHours: string;
      reportsGenerated: number;
    };
  }> {
    try {
      const children = await this.getChildren(parentId);
      const childrenIds = children.map(c => c.id);

      if (childrenIds.length === 0) {
        return {
          reports: [],
          performanceData: [],
          stats: {
            overallImprovement: 0,
            sessionsAttended: '0/0',
            studyHours: '0h',
            reportsGenerated: 0,
          },
        };
      }

      // Get sessions data
      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select('id, status, scheduled_start, duration_minutes')
        .in('student_id', childrenIds);

      // Get assignments for grade progression
      const { data: assignmentsData } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          points_earned,
          max_points,
          submitted_at,
          assignments!inner (
            subjects!inner (
              name
            )
          )
        `)
        .in('student_id', childrenIds)
        .eq('status', 'graded')
        .order('submitted_at', { ascending: false });

      // Calculate performance by subject
      const subjectGrades: { [key: string]: { current: number[]; previous: number[] } } = {};
      
      (assignmentsData || []).forEach((assignment: any) => {
        const subjectName = assignment.assignments?.subjects?.name || 'General';
        if (!subjectGrades[subjectName]) {
          subjectGrades[subjectName] = { current: [], previous: [] };
        }
        
        const grade = assignment.points_earned && assignment.max_points
          ? (assignment.points_earned / assignment.max_points) * 100
          : 0;
        
        const assignmentDate = new Date(assignment.submitted_at);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        if (assignmentDate >= monthAgo) {
          subjectGrades[subjectName].current.push(grade);
        } else {
          subjectGrades[subjectName].previous.push(grade);
        }
      });

      const performanceData = Object.entries(subjectGrades).map(([subject, grades]) => {
        const currentAvg = grades.current.length > 0
          ? grades.current.reduce((sum, g) => sum + g, 0) / grades.current.length
          : 0;
        const previousAvg = grades.previous.length > 0
          ? grades.previous.reduce((sum, g) => sum + g, 0) / grades.previous.length
          : 0;
        
        const currentGrade = this.calculateLetterGrade(currentAvg);
        const previousGrade = this.calculateLetterGrade(previousAvg);
        const improvement = currentAvg > previousAvg ? `+${Math.round(currentAvg - previousAvg)}%` : '0%';

        return {
          subject,
          current: currentGrade,
          previous: previousGrade,
          improvement,
        };
      });

      // Generate reports (simulated - in real app, these would be stored in a reports table)
      const currentMonth = new Date().toISOString().substring(0, 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().substring(0, 7);

      const reports = [
        {
          id: `report-${currentMonth}`,
          title: `Monthly Progress Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          type: 'progress',
          date: `${currentMonth}-01`,
          subjects: performanceData.map(p => p.subject),
          status: 'available',
        },
        ...(performanceData.length > 0 ? [{
          id: `report-${performanceData[0].subject.toLowerCase()}-${currentMonth}`,
          title: `${performanceData[0].subject} Assessment Report`,
          type: 'assessment',
          date: `${currentMonth}-15`,
          subjects: [performanceData[0].subject],
          status: 'available',
        }] : []),
      ];

      // Calculate stats
      const completedSessions = (sessionsData || []).filter(s => s.status === 'completed');
      const totalSessions = sessionsData?.length || 0;
      const studyHours = completedSessions.reduce((sum, s) => 
        sum + ((s.duration_minutes || 0) / 60), 0
      );

      // Calculate improvement (compare this month vs last month)
      const thisMonthSessions = completedSessions.filter(s => 
        s.scheduled_start.startsWith(currentMonth)
      );
      const lastMonthSessions = completedSessions.filter(s => 
        s.scheduled_start.startsWith(lastMonthStr)
      );
      const improvement = lastMonthSessions.length > 0
        ? Math.round(((thisMonthSessions.length - lastMonthSessions.length) / lastMonthSessions.length) * 100)
        : 0;

      return {
        reports,
        performanceData: performanceData.slice(0, 5), // Top 5 subjects
        stats: {
          overallImprovement: improvement,
          sessionsAttended: `${completedSessions.length}/${totalSessions}`,
          studyHours: `${Math.round(studyHours)}h`,
          reportsGenerated: reports.length,
        },
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      return {
        reports: [],
        performanceData: [],
        stats: {
          overallImprovement: 0,
          sessionsAttended: '0/0',
          studyHours: '0h',
          reportsGenerated: 0,
        },
      };
    }
  }

  /**
   * Link a child to a parent by email
   * This will find an existing student profile by email and link them to the parent
   */
  static async linkChildToParent(
    parentId: string,
    childEmail: string,
    childName: string
  ): Promise<{ success: boolean; error?: string; childId?: string }> {
    try {
      // First, check if a profile with this email exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, email, full_name')
        .eq('email', childEmail.toLowerCase().trim())
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking for existing profile:', profileError);
        return { success: false, error: 'Error checking for child account' };
      }

      let studentId: string;

      if (existingProfile) {
        // Profile exists - check if it's a student
        if (existingProfile.role !== 'student') {
          return {
            success: false,
            error: 'This email is registered as a ' + existingProfile.role + ', not a student',
          };
        }

        studentId = existingProfile.id;

        // Check if student already has a parent
        const { data: studentData } = await supabase
          .from('students')
          .select('parent_id')
          .eq('id', studentId)
          .single();

        if (studentData?.parent_id && studentData.parent_id !== parentId) {
          return {
            success: false,
            error: 'This student is already linked to another parent account',
          };
        }

        // Update the student's parent_id
        const { error: updateError } = await supabase
          .from('students')
          .update({ parent_id: parentId, updated_at: new Date().toISOString() })
          .eq('id', studentId);

        if (updateError) {
          console.error('Error linking child to parent:', updateError);
          return { success: false, error: 'Failed to link child to your account' };
        }

        // Update profile name if provided and different
        if (childName && childName.trim() !== existingProfile.full_name) {
          await supabase
            .from('profiles')
            .update({ full_name: childName.trim(), updated_at: new Date().toISOString() })
            .eq('id', studentId);
        }
      } else {
        // Profile doesn't exist - create a new student profile
        // Generate UUID v4 client-side
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };
        
        const newStudentId = generateUUID();

        // Create profile for the child (without auth user - they'll need to sign up later)
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: newStudentId,
            email: childEmail.toLowerCase().trim(),
            full_name: childName.trim(),
            role: 'student',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileCreateError) {
          console.error('Error creating child profile:', profileCreateError);
          return {
            success: false,
            error: 'Failed to create child account. Please ensure the email is valid and not already in use.',
          };
        }

        // Create student record
        const { error: studentCreateError } = await supabase
          .from('students')
          .insert({
            id: newStudentId,
            parent_id: parentId,
            timezone: 'UTC',
            preferred_languages: ['en'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (studentCreateError) {
          console.error('Error creating student record:', studentCreateError);
          // Try to clean up the profile if student creation fails
          await supabase.from('profiles').delete().eq('id', newStudentId);
          return {
            success: false,
            error: 'Failed to create student record',
          };
        }

        // Create wallet for the student
        await supabase.from('wallets').insert({
          user_id: newStudentId,
          currency: 'USD',
          balance: 0.00,
          tokens: 0,
        });

        // Create student preferences
        await supabase.from('student_preferences').insert({
          student_id: newStudentId,
        });

        studentId = newStudentId;
      }

      return { success: true, childId: studentId };
    } catch (error) {
      console.error('Error linking child to parent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}

export default ParentService;
