import { supabase } from '../supabaseClient';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  type: 'student' | 'teacher' | 'parent' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  lastActivity: string;
  sessionsCount?: number;
  children?: number;
  verified?: boolean;
  avatar?: string;
}

export interface AdminStats {
  totalUsers: number;
  students: number;
  teachers: number;
  parents: number;
  suspended: number;
  monthlyRevenue: number;
  platformFee: number;
  pendingPayouts: number;
  disputes: number;
  activeSessions: number;
  successRate: number;
  pendingReviews: number;
  verifiedTeachers: number;
}

export interface TeacherVerification {
  id: string;
  name: string;
  email: string;
  subject: string;
  experience: string;
  qualifications: string[];
  documents: number;
  applicationDate: string;
  avatar?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  from: string;
  to: string;
  status: string;
  date: string;
}

export interface ContentFlag {
  id: string;
  type: string;
  title: string;
  reporter: string;
  reason: string;
  status: string;
  date: string;
}

export interface RecentActivity {
  type: string;
  message: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
}

export class AdminService {
  /**
   * Get all users with filtering
   */
  static async getUsers(filters?: {
    searchTerm?: string;
    userType?: string;
    status?: string;
  }): Promise<AdminUser[]> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          is_active,
          avatar_url,
          created_at,
          last_login_at,
          is_verified
        `);

      // Apply filters
      if (filters?.userType && filters.userType !== 'all') {
        query = query.eq('role', filters.userType);
      }

      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'active') {
          query = query.eq('is_active', true);
        } else if (filters.status === 'inactive') {
          query = query.eq('is_active', false);
        } else if (filters.status === 'suspended') {
          // Assuming suspended users have is_active = false and a specific flag
          // You may need to add a suspended field to profiles table
          query = query.eq('is_active', false);
        }
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Get additional data for each user type
      const users: AdminUser[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          let sessionsCount = 0;
          let children = 0;

          if (profile.role === 'student') {
            const { count } = await supabase
              .from('class_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', profile.id);
            sessionsCount = count || 0;
          } else if (profile.role === 'teacher') {
            const { count } = await supabase
              .from('class_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('teacher_id', profile.id);
            sessionsCount = count || 0;
          } else if (profile.role === 'parent') {
            const { count } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('parent_id', profile.id);
            children = count || 0;
          }

          // Format last activity
          const lastActivity = profile.last_login_at
            ? this.formatTimeAgo(new Date(profile.last_login_at))
            : 'Never';

          return {
            id: profile.id,
            name: profile.full_name || 'Unknown',
            email: profile.email,
            type: profile.role as 'student' | 'teacher' | 'parent' | 'admin',
            status: profile.is_active ? 'active' : 'inactive',
            joinDate: new Date(profile.created_at).toISOString().split('T')[0],
            lastActivity,
            sessionsCount,
            children,
            verified: profile.is_verified || false,
            avatar: profile.avatar_url || undefined,
          };
        })
      );

      // Apply search filter if provided
      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
      }

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive admin statistics
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      // Get user counts by role
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: students } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true);

      const { count: teachers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher')
        .eq('is_active', true);

      const { count: parents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'parent')
        .eq('is_active', true);

      const { count: suspended } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      const { count: verifiedTeachers } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'verified');

      // Get monthly revenue
      const currentMonth = new Date().toISOString().substring(0, 7);
      const { data: monthlyTransactions } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('type', 'earn')
        .eq('status', 'completed')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-32`);

      const monthlyRevenue =
        monthlyTransactions?.reduce(
          (sum, t) => sum + (Number(t.amount_usd) || 0),
          0
        ) || 0;

      // Get platform earnings (commission)
      const { data: platformEarnings } = await supabase
        .from('platform_earnings')
        .select('platform_commission_usd')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-32`);

      const platformFee =
        platformEarnings?.reduce(
          (sum, e) => sum + (Number(e.platform_commission_usd) || 0),
          0
        ) || 0;

      // Get pending payouts (teacher earnings not yet withdrawn)
      const { data: pendingPayouts } = await supabase
        .from('platform_earnings')
        .select('teacher_earnings_usd')
        .is('withdrawal_request_id', null);

      const pendingPayoutsTotal =
        pendingPayouts?.reduce(
          (sum, p) => sum + (Number(p.teacher_earnings_usd) || 0),
          0
        ) || 0;

      // Get disputes count (assuming disputes are in withdrawal_requests with status 'disputed')
      const { count: disputes } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disputed');

      // Get active sessions
      const { count: activeSessions } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      // Calculate success rate
      const { data: allSessions } = await supabase
        .from('class_sessions')
        .select('status');

      const totalSessions = allSessions?.length || 0;
      const completedSessions =
        allSessions?.filter((s) => s.status === 'completed').length || 0;
      const successRate =
        totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      // Get pending teacher verifications
      const { count: pendingReviews } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      return {
        totalUsers: totalUsers || 0,
        students: students || 0,
        teachers: teachers || 0,
        parents: parents || 0,
        suspended: suspended || 0,
        monthlyRevenue,
        platformFee,
        pendingPayouts: pendingPayoutsTotal,
        disputes: disputes || 0,
        activeSessions: activeSessions || 0,
        successRate,
        pendingReviews: pendingReviews || 0,
        verifiedTeachers: verifiedTeachers || 0,
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  /**
   * Get teacher verification requests
   */
  static async getTeacherVerifications(): Promise<TeacherVerification[]> {
    try {
      const { data: teachers, error } = await supabase
        .from('teachers')
        .select('id, verification_status, verification_documents, experience_years, education, subjects, created_at')
        .eq('verification_status', 'pending');

      if (error) throw error;

      // Get profiles for each teacher
      const verifications: TeacherVerification[] = await Promise.all(
        (teachers || []).map(async (teacher) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', teacher.id)
            .single();

          const subjects = (teacher.subjects as string[]) || [];
          const subjectName = subjects.length > 0 ? subjects[0] : 'General';

          return {
            id: teacher.id,
            name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            subject: subjectName,
            experience: `${teacher.experience_years || 0}+ years`,
            qualifications: (teacher.education as string[]) || [],
            documents: (teacher.verification_documents as string[])?.length || 0,
            applicationDate: new Date(teacher.created_at).toISOString().split('T')[0],
            avatar: profile?.avatar_url || undefined,
            verificationStatus: teacher.verification_status as 'pending' | 'verified' | 'rejected',
          };
        })
      );

      return verifications;
    } catch (error) {
      console.error('Error fetching teacher verifications:', error);
      throw error;
    }
  }

  /**
   * Get payment transactions
   */
  static async getPaymentTransactions(limit: number = 10): Promise<PaymentTransaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('token_transactions')
        .select(
          `
          id,
          amount_usd,
          status,
          created_at,
          student_id,
          teacher_id,
          type
        `
        )
        .eq('type', 'earn')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get user names
      const paymentTransactions: PaymentTransaction[] = await Promise.all(
        (transactions || []).map(async (transaction) => {
          let fromName = 'Unknown';
          let toName = 'Unknown';

          if (transaction.student_id) {
            const { data: student } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', transaction.student_id)
              .single();
            fromName = student?.full_name || 'Unknown';
          }

          if (transaction.teacher_id) {
            const { data: teacher } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', transaction.teacher_id)
              .single();
            toName = teacher?.full_name || 'Unknown';
          }

          return {
            id: transaction.id,
            amount: Number(transaction.amount_usd) || 0,
            from: fromName,
            to: toName,
            status: transaction.status || 'pending',
            date: new Date(transaction.created_at).toISOString().split('T')[0],
          };
        })
      );

      return paymentTransactions;
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      throw error;
    }
  }

  /**
   * Get recent platform activity
   */
  static async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent user registrations
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentUsers?.forEach((user) => {
        activities.push({
          type: 'user_registration',
          message: `New ${user.role} registered: ${user.full_name || 'Unknown'}`,
          time: this.formatTimeAgo(new Date(user.created_at)),
          priority: 'low',
        });
      });

      // Get pending teacher verifications
      const { count: pendingCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      if (pendingCount && pendingCount > 0) {
        activities.push({
          type: 'teacher_application',
          message: `${pendingCount} teacher verification${pendingCount > 1 ? 's' : ''} pending`,
          time: 'Recently',
          priority: 'high',
        });
      }

      // Get recent disputes
      const { data: disputes } = await supabase
        .from('withdrawal_requests')
        .select('id, status, created_at')
        .eq('status', 'disputed')
        .order('created_at', { ascending: false })
        .limit(3);

      disputes?.forEach((dispute) => {
        activities.push({
          type: 'payment_issue',
          message: 'Payment dispute reported',
          time: this.formatTimeAgo(new Date(dispute.created_at)),
          priority: 'high',
        });
      });

      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Get content flags (placeholder - implement when content moderation table exists)
   */
  static async getContentFlags(): Promise<ContentFlag[]> {
    // TODO: Implement when content moderation table is created
    return [];
  }

  /**
   * Format time ago
   */
  private static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Get user count change (for growth metrics)
   */
  static async getUserCountChange(): Promise<number> {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().substring(0, 7);

      const { count: currentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-32`);

      const { count: lastMonthCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('created_at', `${lastMonthStr}-01`)
        .lt('created_at', `${lastMonthStr}-32`);

      return (currentCount || 0) - (lastMonthCount || 0);
    } catch (error) {
      console.error('Error calculating user count change:', error);
      return 0;
    }
  }

  /**
   * Get revenue growth percentage
   */
  static async getRevenueGrowth(): Promise<number> {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().substring(0, 7);

      const { data: currentRevenue } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('type', 'earn')
        .eq('status', 'completed')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-32`);

      const { data: lastMonthRevenue } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('type', 'earn')
        .eq('status', 'completed')
        .gte('created_at', `${lastMonthStr}-01`)
        .lt('created_at', `${lastMonthStr}-32`);

      const currentTotal =
        currentRevenue?.reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0) || 0;
      const lastMonthTotal =
        lastMonthRevenue?.reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0) || 0;

      if (lastMonthTotal === 0) return currentTotal > 0 ? 100 : 0;
      return ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } catch (error) {
      console.error('Error calculating revenue growth:', error);
      return 0;
    }
  }
}

export default AdminService;

