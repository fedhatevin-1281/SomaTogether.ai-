import { supabase } from '../supabaseClient';

export interface TeacherAnalyticsData {
  totalStudents: number;
  totalSessions: number;
  totalEarnings: number;
  averageRating: number;
  successRate: number;
  monthlyPerformance: {
    sessionsCompleted: number;
    onTimeRate: number;
    studentSatisfaction: number;
    responseTime: number;
  };
  studentProgress: Array<{
    student_id: string;
    student_name: string;
    progress: number;
    improvement: number;
    total_sessions: number;
    last_session_date: string;
  }>;
  monthlyEarnings: Array<{
    month: string;
    earnings: number;
    sessions: number;
  }>;
  recentReviews: Array<{
    id: string;
    student_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
}

export class TeacherAnalyticsService {
  /**
   * Get comprehensive analytics data for a teacher
   */
  static async getTeacherAnalytics(teacherId: string): Promise<TeacherAnalyticsData> {
    try {
      console.log('Fetching teacher analytics for:', teacherId);

      // Get basic teacher stats
      const { data: teacherStats, error: teacherError } = await supabase
        .from('teachers')
        .select('total_students, total_sessions, rating, total_reviews')
        .eq('id', teacherId)
        .single();

      if (teacherError) {
        console.error('Error fetching teacher stats:', teacherError);
        throw teacherError;
      }

      // Get total earnings from token transactions
      const { data: earningsData, error: earningsError } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('user_id', teacherId)
        .eq('type', 'earn')
        .eq('status', 'completed');

      if (earningsError) {
        console.error('Error fetching earnings:', earningsError);
      }

      const totalEarnings = earningsData?.reduce((sum, transaction) => sum + (transaction.amount_usd || 0), 0) || 0;

      // Get student progress data
      const { data: studentProgress, error: progressError } = await supabase
        .from('class_sessions')
        .select(`
          student_id,
          students!class_sessions_student_id_fkey (
            profiles!students_id_fkey (
              full_name
            )
          ),
          created_at,
          status
        `)
        .eq('teacher_id', teacherId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (progressError) {
        console.error('Error fetching student progress:', progressError);
      }

      // Process student progress
      const studentProgressMap = new Map();
      studentProgress?.forEach(session => {
        const studentId = session.student_id;
        const studentName = session.students?.profiles?.full_name || 'Unknown Student';
        
        if (!studentProgressMap.has(studentId)) {
          studentProgressMap.set(studentId, {
            student_id: studentId,
            student_name: studentName,
            total_sessions: 0,
            last_session_date: session.created_at
          });
        }
        
        studentProgressMap.get(studentId).total_sessions += 1;
      });

      const processedStudentProgress = Array.from(studentProgressMap.values()).map(student => ({
        ...student,
        progress: Math.min(100, (student.total_sessions / 10) * 100), // Simple progress calculation
        improvement: Math.floor(Math.random() * 30) + 10 // Mock improvement for now
      }));

      // Get monthly earnings
      const { data: monthlyEarnings, error: monthlyError } = await supabase
        .from('token_transactions')
        .select('amount_usd, created_at')
        .eq('user_id', teacherId)
        .eq('type', 'earn')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (monthlyError) {
        console.error('Error fetching monthly earnings:', monthlyError);
      }

      // Process monthly earnings
      const monthlyMap = new Map();
      monthlyEarnings?.forEach(transaction => {
        const month = new Date(transaction.created_at).toISOString().substring(0, 7);
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { month, earnings: 0, sessions: 0 });
        }
        monthlyMap.get(month).earnings += transaction.amount_usd || 0;
        monthlyMap.get(month).sessions += 1;
      });

      const processedMonthlyEarnings = Array.from(monthlyMap.values()).slice(0, 6);

      // Get recent reviews
      const { data: recentReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          students!reviews_student_id_fkey (
            profiles!students_id_fkey (
              full_name
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsError) {
        console.error('Error fetching recent reviews:', reviewsError);
      }

      const processedReviews = recentReviews?.map(review => ({
        id: review.id,
        student_name: review.students?.profiles?.full_name || 'Anonymous',
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at
      })) || [];

      // Calculate success rate (sessions completed vs total sessions)
      const { data: allSessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('status')
        .eq('teacher_id', teacherId);

      if (sessionsError) {
        console.error('Error fetching all sessions:', sessionsError);
      }

      const totalSessions = allSessions?.length || 0;
      const completedSessions = allSessions?.filter(s => s.status === 'completed').length || 0;
      const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      // Get monthly performance metrics
      const currentMonth = new Date().toISOString().substring(0, 7);
      const { data: currentMonthSessions, error: monthSessionsError } = await supabase
        .from('class_sessions')
        .select('status, scheduled_start, actual_start')
        .eq('teacher_id', teacherId)
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-32`);

      if (monthSessionsError) {
        console.error('Error fetching current month sessions:', monthSessionsError);
      }

      const monthlySessionsCompleted = currentMonthSessions?.filter(s => s.status === 'completed').length || 0;
      const totalMonthlySessions = currentMonthSessions?.length || 0;
      const onTimeRate = totalMonthlySessions > 0 ? (monthlySessionsCompleted / totalMonthlySessions) * 100 : 100;

      const analyticsData: TeacherAnalyticsData = {
        totalStudents: teacherStats?.total_students || 0,
        totalSessions: teacherStats?.total_sessions || 0,
        totalEarnings,
        averageRating: teacherStats?.rating || 0,
        successRate,
        monthlyPerformance: {
          sessionsCompleted: monthlySessionsCompleted,
          onTimeRate,
          studentSatisfaction: teacherStats?.rating || 0,
          responseTime: 2 // Mock response time for now
        },
        studentProgress: processedStudentProgress,
        monthlyEarnings: processedMonthlyEarnings,
        recentReviews: processedReviews
      };

      console.log('Teacher analytics data:', analyticsData);
      return analyticsData;

    } catch (error) {
      console.error('Error fetching teacher analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics data for admin dashboard
   */
  static async getAdminAnalytics(): Promise<{
    totalUsers: number;
    monthlyRevenue: number;
    successRate: number;
    activeSessions: number;
  }> {
    try {
      console.log('Fetching admin analytics');

      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (usersError) {
        console.error('Error fetching total users:', usersError);
      }

      // Get monthly revenue
      const currentMonth = new Date().toISOString().substring(0, 7);
      const { data: monthlyRevenue, error: revenueError } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('type', 'earn')
        .eq('status', 'completed')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-32`);

      if (revenueError) {
        console.error('Error fetching monthly revenue:', revenueError);
      }

      const totalMonthlyRevenue = monthlyRevenue?.reduce((sum, transaction) => sum + (transaction.amount_usd || 0), 0) || 0;

      // Get active sessions
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('id')
        .eq('status', 'in_progress');

      if (sessionsError) {
        console.error('Error fetching active sessions:', sessionsError);
      }

      // Calculate success rate
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('class_sessions')
        .select('status');

      if (allSessionsError) {
        console.error('Error fetching all sessions:', allSessionsError);
      }

      const totalSessions = allSessions?.length || 0;
      const completedSessions = allSessions?.filter(s => s.status === 'completed').length || 0;
      const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      return {
        totalUsers: totalUsers || 0,
        monthlyRevenue: totalMonthlyRevenue,
        successRate,
        activeSessions: activeSessions?.length || 0
      };

    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  }
}

export default TeacherAnalyticsService;
