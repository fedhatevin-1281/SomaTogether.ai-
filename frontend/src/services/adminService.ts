import { apiService } from './apiService';

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
   * Get all users with filtering
   */
  static async getUsers(filters?: {
    searchTerm?: string;
    userType?: string;
    status?: string;
  }): Promise<AdminUser[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/admin/users');
      
      const mapped: AdminUser[] = (res.data || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Unknown',
        email: profile.email,
        type: profile.role || 'student',
        status: profile.is_active ? 'active' : 'inactive',
        joinDate: new Date(profile.created_at).toISOString().split('T')[0],
        lastActivity: profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'Never',
        verified: profile.is_verified || false,
        avatar: profile.avatar_url || undefined
      }));

      // Apply filtering client-side
      let filtered = mapped;
      if (filters?.userType && filters.userType !== 'all') {
        filtered = filtered.filter(u => u.type === filters.userType);
      }
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(u => u.status === filters.status);
      }
      if (filters?.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
      }

      return filtered;
    } catch (error) {
      console.error('Error fetching users via Admin API:', error);
      throw error;
    }
  }

  /**
   * Get detailed user information
   */
  static async getUserDetails(userId: string): Promise<AdminUser | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any }>(`/admin/users/${userId}`);
      if (!res.data) return null;
      return {
        id: res.data.id,
        name: res.data.full_name || 'Unknown',
        email: res.data.email,
        type: res.data.role || 'student',
        status: res.data.is_active ? 'active' : 'inactive',
        joinDate: new Date(res.data.created_at).toISOString().split('T')[0],
        lastActivity: res.data.last_login_at ? new Date(res.data.last_login_at).toLocaleString() : 'Never',
        verified: res.data.is_verified || false,
        avatar: res.data.avatar_url || undefined
      };
    } catch (error) {
      console.error('Error fetching user details via Admin API:', error);
      return null;
    }
  }

  /**
   * Toggle user suspension status
   */
  static async toggleUserSuspension(userId: string, suspend: boolean): Promise<boolean> {
    try {
      const res = await apiService.makeRequest<{ success: boolean }>('/admin/users/' + userId + '/suspend', {
        method: 'POST',
        body: JSON.stringify({ suspend })
      });
      return res.success;
    } catch (error) {
      console.error('Error toggling user suspension via Admin API:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive admin statistics
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any }>('/admin/stats');
      return {
        totalUsers: res.data.total_students + res.data.total_teachers + res.data.total_parents,
        students: res.data.total_students,
        teachers: res.data.total_teachers,
        parents: res.data.total_parents,
        suspended: 0,
        monthlyRevenue: 0,
        platformFee: 0,
        pendingPayouts: 0,
        disputes: 0,
        activeSessions: res.data.total_sessions,
        successRate: 100,
        pendingReviews: 0,
        verifiedTeachers: res.data.total_teachers,
        contentReviews: 0,
        userReports: 0
      };
    } catch (error) {
      console.error('Error fetching admin stats via API:', error);
      throw error;
    }
  }

  /**
   * Get teacher verification requests
   */
  static async getTeacherVerifications(): Promise<TeacherVerification[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: TeacherVerification[] }>('/admin/verifications');
      return res.data || [];
    } catch (error) {
      console.error('Error fetching verifications via Admin API:', error);
      throw error;
    }
  }

  /**
   * Approve teacher verification
   */
  static async approveTeacherVerification(teacherId: string, adminId: string): Promise<boolean> {
    try {
      const res = await apiService.makeRequest<{ success: boolean }>('/admin/users/' + teacherId + '/verify', {
        method: 'POST',
        body: JSON.stringify({ status: 'approved', adminId })
      });
      return res.success;
    } catch (error) {
      console.error('Error approving teacher via Admin API:', error);
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
      const res = await apiService.makeRequest<{ success: boolean }>('/admin/users/' + teacherId + '/verify', {
        method: 'POST',
        body: JSON.stringify({ status: 'rejected', reason, adminId })
      });
      return res.success;
    } catch (error) {
      console.error('Error rejecting teacher via Admin API:', error);
      throw error;
    }
  }

  /**
   * Get payment transactions
   */
  static async getPaymentTransactions(limit: number = 10): Promise<PaymentTransaction[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: PaymentTransaction[] }>(`/admin/transactions?limit=${limit}`);
      return res.data || [];
    } catch (error) {
      console.error('Error fetching transactions via Admin API:', error);
      throw error;
    }
  }

  /**
   * Get content flags
   */
  static async getContentFlags(): Promise<ContentFlag[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: ContentFlag[] }>('/admin/content-flags');
      return res.data || [];
    } catch (error) {
      console.error('Error fetching content flags via Admin API:', error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: SystemHealth }>('/admin/health');
      return res.data;
    } catch (error) {
      console.error('Error fetching system health via Admin API:', error);
      throw error;
    }
  }
}
