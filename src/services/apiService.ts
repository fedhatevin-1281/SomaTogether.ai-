// API service for communicating with the backend
const API_BASE_URL = 'http://localhost:3001/api';

export interface DashboardStats {
  wallet_balance: number;
  tokens: number;
  total_classes: number;
  completed_assignments: number;
  upcoming_sessions: number;
  unread_messages: number;
}

export interface ClassData {
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

export interface AssignmentData {
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

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface SessionData {
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

export interface WalletData {
  balance: number;
  tokens: number;
  currency: string;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    description: string;
    status: string;
    created_at: string;
  }>;
}

class ApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Dashboard API calls
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    return this.makeRequest<DashboardStats>(`/student/dashboard/stats?userId=${userId}`);
  }

  async getClasses(userId: string, status: string = 'active', limit: number = 5): Promise<ClassData[]> {
    return this.makeRequest<ClassData[]>(`/student/classes?userId=${userId}&status=${status}&limit=${limit}`);
  }

  async getAssignments(userId: string, status: string = 'upcoming', limit: number = 5): Promise<AssignmentData[]> {
    return this.makeRequest<AssignmentData[]>(`/student/assignments?userId=${userId}&status=${status}&limit=${limit}`);
  }

  async getNotifications(userId: string, unreadOnly: boolean = false, limit: number = 5): Promise<NotificationData[]> {
    return this.makeRequest<NotificationData[]>(`/student/notifications?userId=${userId}&unreadOnly=${unreadOnly}&limit=${limit}`);
  }

  async getSessions(userId: string, limit: number = 5): Promise<SessionData[]> {
    return this.makeRequest<SessionData[]>(`/student/sessions?userId=${userId}&limit=${limit}`);
  }

  async getWallet(userId: string): Promise<WalletData> {
    return this.makeRequest<WalletData>(`/student/wallet?userId=${userId}`);
  }

  // Payment API calls
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    metadata: any;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    return this.makeRequest<{ clientSecret: string; paymentIntentId: string }>('/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCustomer(data: {
    email: string;
    name: string;
    userId: string;
  }): Promise<{ customerId: string }> {
    return this.makeRequest<{ customerId: string }>('/create-customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.makeRequest<{ status: string; message: string }>('/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

