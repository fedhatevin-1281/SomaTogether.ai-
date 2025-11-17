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
  contentReviews: number;
  userReports: number;
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

export interface SystemHealth {
  serverStatus: 'healthy' | 'degraded' | 'down';
  database: 'normal' | 'slow' | 'down';
  apiResponse: 'fast' | 'normal' | 'slow' | 'down';
  paymentGateway: 'active' | 'degraded' | 'down';
  serverStatusMessage: string;
  databaseMessage: string;
  apiResponseMessage: string;
  paymentGatewayMessage: string;
}

export class AdminService {
  /**
   * Helper function to get the first day of the next month for date range queries
   */
  private static getNextMonthStart(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  }

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
   * Get detailed user information
   */
  static async getUserDetails(userId: string): Promise<AdminUser | null> {
    try {
      const { data: profile, error } = await supabase
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
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!profile) return null;

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
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }

  /**
   * Toggle user suspension status
   */
  static async toggleUserSuspension(userId: string, suspend: boolean): Promise<boolean> {
    try {
      console.log('toggleUserSuspension called:', { userId, suspend });
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: !suspend })
        .eq('id', userId)
        .select();

      console.log('Update response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No rows updated - user might not exist');
        throw new Error('User not found or update failed');
      }

      console.log('User status updated successfully:', data[0]);

      // Create a notification for the user
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile for notification:', profileError);
        } else if (profile) {
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: profile.id,
            type: suspend ? 'account_suspended' : 'account_reactivated',
            title: suspend ? 'Account Suspended' : 'Account Reactivated',
            message: suspend
              ? 'Your account has been suspended. Please contact support for more information.'
              : 'Your account has been reactivated. You can now access the platform.',
            priority: 'high',
          });

          if (notifError) {
            console.error('Error creating notification:', notifError);
            // Don't fail the whole operation if notification fails
          } else {
            console.log('Notification created successfully');
          }
        }
      } catch (notifError) {
        // Notification creation is optional, don't fail the whole operation
        console.error('Error creating notification:', notifError);
      }

      return true;
    } catch (error) {
      console.error('Error toggling user suspension:', error);
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
      const nextMonthStart = this.getNextMonthStart(currentMonth);
      const { data: monthlyTransactions } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('type', 'earn')
        .eq('status', 'completed')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', nextMonthStart);

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
        .lt('created_at', nextMonthStart);

      const platformFee =
        platformEarnings?.reduce(
          (sum, e) => sum + (Number(e.platform_commission_usd) || 0),
          0
        ) || 0;

      // Get pending payouts (teacher earnings not yet withdrawn)
      let pendingPayoutsTotal = 0;
      try {
        const { data: pendingPayouts, error: payoutError } = await supabase
          .from('platform_earnings')
          .select('teacher_earnings_usd')
          .is('withdrawal_request_id', null);

        if (payoutError) {
          // Check if error is due to column not existing (code 42703)
          if (payoutError.code === '42703') {
            // Column doesn't exist, skip this query
            console.log('withdrawal_request_id column does not exist, skipping pending payouts query');
            pendingPayoutsTotal = 0;
          } else {
            console.error('Error fetching pending payouts:', payoutError);
            pendingPayoutsTotal = 0;
          }
        } else {
          pendingPayoutsTotal =
            pendingPayouts?.reduce(
              (sum, p) => sum + (Number(p.teacher_earnings_usd) || 0),
              0
            ) || 0;
        }
      } catch (error) {
        console.error('Error calculating pending payouts:', error);
        pendingPayoutsTotal = 0;
      }


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

      // Get content reviews count (pending content flags)
      // Check if there's a content_flags or content_moderation table
      let contentReviews = 0;
      try {
        // Try to get pending content flags
        const { count: contentFlagsCount, error: contentFlagsError } = await supabase
          .from('content_flags')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (contentFlagsError && contentFlagsError.code !== 'PGRST116') {
          // PGRST116 is "relation does not exist" - table doesn't exist, which is fine
          throw contentFlagsError;
        }
        contentReviews = contentFlagsCount || 0;
      } catch (error: any) {
        // If table doesn't exist (404/404-like error), check notifications for content-related reports
        if (error?.code === 'PGRST116' || error?.status === 404) {
          try {
            const { count: contentNotifications } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .or('type.eq.content_flag,type.eq.content_report,type.eq.content_moderation')
              .eq('is_read', false);
            contentReviews = contentNotifications || 0;
          } catch (err) {
            // If no way to track, set to 0
            contentReviews = 0;
          }
        } else {
          // Other errors, set to 0
          contentReviews = 0;
        }
      }

      // Get user reports count (reported users or issues)
      let userReports = 0;
      try {
        // Try to get user reports from a reports table
        const { count: reportsCount, error: reportsError } = await supabase
          .from('user_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (reportsError && reportsError.code !== 'PGRST116') {
          // PGRST116 is "relation does not exist" - table doesn't exist, which is fine
          throw reportsError;
        }
        userReports = reportsCount || 0;
      } catch (error: any) {
        // If table doesn't exist (404/404-like error), check notifications for user reports
        if (error?.code === 'PGRST116' || error?.status === 404) {
          try {
            const { count: reportNotifications } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .or('type.eq.user_report,type.eq.report_user,type.eq.abuse_report')
              .eq('is_read', false);
            userReports = reportNotifications || 0;
          } catch (err) {
            // If no way to track, set to 0
            userReports = 0;
          }
        } else {
          // Other errors, set to 0
          userReports = 0;
        }
      }

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
        contentReviews,
        userReports,
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
   * Get teacher verification documents
   */
  static async getTeacherDocuments(teacherId: string): Promise<string[]> {
    try {
      const { data: teacher, error } = await supabase
        .from('teachers')
        .select('verification_documents')
        .eq('id', teacherId)
        .single();

      if (error) throw error;
      return (teacher?.verification_documents as string[]) || [];
    } catch (error) {
      console.error('Error fetching teacher documents:', error);
      throw error;
    }
  }

  /**
   * Approve teacher verification
   */
  static async approveTeacherVerification(teacherId: string, adminId: string): Promise<boolean> {
    try {
      console.log('Approving teacher verification:', teacherId);
      
      // Update teacher verification status
      // Only update verification_status as other columns may not exist
      const { data, error: updateError } = await supabase
        .from('teachers')
        .update({
          verification_status: 'verified',
        })
        .eq('id', teacherId)
        .select();

      console.log('Teacher update response:', { data, error: updateError });

      if (updateError) {
        console.error('Error updating teacher verification:', updateError);
        console.error('Update error details:', JSON.stringify(updateError, null, 2));
        throw new Error(`Failed to update teacher verification: ${updateError.message || updateError.code || 'Unknown error'}`);
      }

      if (!data || data.length === 0) {
        console.error('No data returned from update query');
        throw new Error('Teacher not found or update failed - no data returned');
      }

      console.log('Teacher verification status updated successfully:', data[0]);
      
      // Verify the update was successful
      if (data[0].verification_status !== 'verified') {
        console.error('Update did not change verification status:', data[0].verification_status);
        throw new Error('Update did not change verification status');
      }

      // Update profile verification status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', teacherId);

      if (profileError) {
        console.error('Error updating profile verification:', profileError);
        // Don't fail the whole operation if profile update fails
      } else {
        console.log('Profile verification status updated successfully');
      }

      // Create notification for teacher
      try {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: teacherId,
          type: 'teacher_verification_approved',
          title: 'Verification Approved',
          message: 'Congratulations! Your teacher verification has been approved. You can now start accepting students.',
          priority: 'high',
        });

        if (notifError) {
          console.error('Error creating notification:', notifError);
        } else {
          console.log('Notification created successfully');
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }

      console.log('Teacher verification approved successfully');
      return true;
    } catch (error) {
      console.error('Error approving teacher verification:', error);
      throw error;
    }
  }

  /**
   * Reject teacher verification
   */
  static async rejectTeacherVerification(
    teacherId: string,
    reason: string,
    adminId: string
  ): Promise<boolean> {
    try {
      console.log('Rejecting teacher verification:', teacherId, 'Reason:', reason);
      
      // Update teacher verification status
      // Only update verification_status as other columns may not exist
      // The rejection reason will be stored in the notification message
      const { data, error: updateError } = await supabase
        .from('teachers')
        .update({
          verification_status: 'rejected',
        })
        .eq('id', teacherId)
        .select();

      console.log('Teacher rejection response:', { data, error: updateError });

      if (updateError) {
        console.error('Error updating teacher verification:', updateError);
        console.error('Update error details:', JSON.stringify(updateError, null, 2));
        throw new Error(`Failed to update teacher verification: ${updateError.message || updateError.code || 'Unknown error'}`);
      }

      if (!data || data.length === 0) {
        console.error('No data returned from update query');
        throw new Error('Teacher not found or update failed - no data returned');
      }

      console.log('Teacher verification status updated to rejected successfully:', data[0]);
      
      // Verify the update was successful
      if (data[0].verification_status !== 'rejected') {
        console.error('Update did not change verification status:', data[0].verification_status);
        throw new Error('Update did not change verification status');
      }

      // Create notification for teacher
      try {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: teacherId,
          type: 'teacher_verification_rejected',
          title: 'Verification Rejected',
          message: `Your teacher verification has been rejected. Reason: ${reason}. Please review your documents and reapply.`,
          priority: 'high',
        });

        if (notifError) {
          console.error('Error creating notification:', notifError);
        } else {
          console.log('Notification created successfully');
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }

      console.log('Teacher verification rejected successfully');
      return true;
    } catch (error) {
      console.error('Error rejecting teacher verification:', error);
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

      const currentMonthEnd = this.getNextMonthStart(currentMonth);
      const lastMonthEnd = this.getNextMonthStart(lastMonthStr);

      const { count: currentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', currentMonthEnd);

      const { count: lastMonthCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('created_at', `${lastMonthStr}-01`)
        .lt('created_at', lastMonthEnd);

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

      const currentMonthEnd = this.getNextMonthStart(currentMonth);
      const lastMonthEnd = this.getNextMonthStart(lastMonthStr);

      const { data: currentRevenue } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('type', 'earn')
        .eq('status', 'completed')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', currentMonthEnd);

      const { data: lastMonthRevenue } = await supabase
        .from('token_transactions')
        .select('amount_usd')
        .eq('type', 'earn')
        .eq('status', 'completed')
        .gte('created_at', `${lastMonthStr}-01`)
        .lt('created_at', lastMonthEnd);

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

  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      serverStatus: 'healthy',
      database: 'normal',
      apiResponse: 'normal',
      paymentGateway: 'active',
      serverStatusMessage: 'All systems operational',
      databaseMessage: 'Connected',
      apiResponseMessage: 'Normal',
      paymentGatewayMessage: 'Operational',
    };

    try {
      // Check database connectivity and response time
      const dbStartTime = performance.now();
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const dbResponseTime = performance.now() - dbStartTime;

      if (dbError) {
        health.database = 'down';
        health.databaseMessage = 'Connection failed';
      } else if (dbResponseTime > 2000) {
        health.database = 'slow';
        health.databaseMessage = `Slow (${Math.round(dbResponseTime)}ms)`;
      } else if (dbResponseTime > 1000) {
        health.database = 'slow';
        health.databaseMessage = `Moderate (${Math.round(dbResponseTime)}ms)`;
      } else {
        health.database = 'normal';
        health.databaseMessage = `Fast (${Math.round(dbResponseTime)}ms)`;
      }

      // Check API response time (using a simple query)
      const apiStartTime = performance.now();
      const { error: apiError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const apiResponseTime = performance.now() - apiStartTime;

      if (apiError) {
        health.apiResponse = 'down';
        health.apiResponseMessage = 'Unavailable';
      } else if (apiResponseTime > 2000) {
        health.apiResponse = 'slow';
        health.apiResponseMessage = `Slow (${Math.round(apiResponseTime)}ms)`;
      } else if (apiResponseTime > 1000) {
        health.apiResponse = 'slow';
        health.apiResponseMessage = `Moderate (${Math.round(apiResponseTime)}ms)`;
      } else if (apiResponseTime < 300) {
        health.apiResponse = 'fast';
        health.apiResponseMessage = `Fast (${Math.round(apiResponseTime)}ms)`;
      } else {
        health.apiResponse = 'normal';
        health.apiResponseMessage = `Normal (${Math.round(apiResponseTime)}ms)`;
      }

      // Check payment gateway (check if there are recent successful transactions)
      try {
        const { data: recentTransactions, error: paymentError } = await supabase
          .from('token_transactions')
          .select('id, status')
          .eq('status', 'completed')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (paymentError) {
          health.paymentGateway = 'down';
          health.paymentGatewayMessage = 'Unavailable';
        } else {
          health.paymentGateway = 'active';
          health.paymentGatewayMessage = 'Operational';
        }
      } catch (error) {
        // If payment table doesn't exist or has issues, mark as degraded
        health.paymentGateway = 'degraded';
        health.paymentGatewayMessage = 'Limited access';
      }

      // Overall server status based on other checks
      if (health.database === 'down' || health.apiResponse === 'down') {
        health.serverStatus = 'down';
        health.serverStatusMessage = 'System unavailable';
      } else if (health.database === 'slow' || health.apiResponse === 'slow' || health.paymentGateway === 'degraded') {
        health.serverStatus = 'degraded';
        health.serverStatusMessage = 'Performance issues detected';
      } else {
        health.serverStatus = 'healthy';
        health.serverStatusMessage = 'All systems operational';
      }

      return health;
    } catch (error) {
      console.error('Error checking system health:', error);
      // Return degraded status on error
      return {
        serverStatus: 'degraded',
        database: 'down',
        apiResponse: 'down',
        paymentGateway: 'down',
        serverStatusMessage: 'Health check failed',
        databaseMessage: 'Check failed',
        apiResponseMessage: 'Check failed',
        paymentGatewayMessage: 'Check failed',
      };
    }
  }

  /**
   * Get system settings
   */
  static async getSystemSettings(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('is_public', false);

      if (error) throw error;

      const settings: Record<string, any> = {};
      data?.forEach((setting) => {
        settings[setting.key] = setting.value;
      });

      // Set defaults if settings don't exist
      return {
        twoFactorAuth: settings.two_factor_auth || false,
        autoLogout: settings.auto_logout || false,
        sessionTimeout: settings.session_timeout || 30,
        emailNotifications: settings.email_notifications || true,
        smsAlerts: settings.sms_alerts || false,
        pushNotifications: settings.push_notifications || true,
        platformFee: settings.platform_fee || 5,
        maxSessionDuration: settings.max_session_duration || 3,
        maintenanceMode: settings.maintenance_mode || false,
        ...settings,
      };
    } catch (error) {
      console.error('Error fetching system settings:', error);
      // Return defaults on error
      return {
        twoFactorAuth: false,
        autoLogout: false,
        sessionTimeout: 30,
        emailNotifications: true,
        smsAlerts: false,
        pushNotifications: true,
        platformFee: 5,
        maxSessionDuration: 3,
        maintenanceMode: false,
      };
    }
  }

  /**
   * Update system setting
   */
  static async updateSystemSetting(
    key: string,
    value: any,
    adminId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(
          {
            key,
            value,
            updated_by: adminId,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'key',
          }
        );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating system setting:', error);
      throw error;
    }
  }

  /**
   * Update multiple system settings
   */
  static async updateSystemSettings(
    settings: Record<string, any>,
    adminId: string
  ): Promise<boolean> {
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, {
          onConflict: 'key',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }
}

export default AdminService;

