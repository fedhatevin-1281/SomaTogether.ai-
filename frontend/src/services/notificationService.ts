import { supabase } from '../supabaseClient';
import { apiService } from './apiService';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  read_at?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  session_requests: boolean;
  session_reminders: boolean;
  payment_updates: boolean;
  system_updates: boolean;
}

class NotificationService {
  private static subscription: any = null;
  private static listeners: Array<(notification: Notification) => void> = [];

  /**
   * Initialize real-time notifications for the current user
   */
  static async initializeNotifications(userId: string): Promise<void> {
    try {
      console.log('Initializing notifications for user:', userId);

      // Clean up existing subscription
      if (this.subscription) {
        await this.subscription.unsubscribe();
      }

      // Create new subscription
      this.subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('New notification received:', payload);
            const notification = payload.new as Notification;
            
            // Notify all listeners
            this.listeners.forEach(listener => {
               try {
                 listener(notification);
               } catch (error) {
                 console.error('Error in notification listener:', error);
               }
            });

            // Show browser notification if permission granted
            this.showBrowserNotification(notification);
          }
        )
        .subscribe();

      console.log('Notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Add notification listener
   */
  static addListener(listener: (notification: Notification) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove notification listener
   */
  static removeListener(listener: (notification: Notification) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get user notifications
   */
  static async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<{notifications: Notification[], total: number}> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Notification[] }>(`/notifications/${userId}?limit=${limit}&unreadOnly=${unreadOnly}`);
      return {
        notifications: res.data || [],
        total: res.data?.length || 0
      };
    } catch (error) {
      console.error('Error in getNotifications via API:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const res = await apiService.makeRequest<{ success: boolean }>(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      return res.success;
    } catch (error) {
      console.error('Error in markAsRead via API:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const res = await apiService.makeRequest<{ success: boolean }>(`/notifications/user/${userId}/read`, {
        method: 'PUT'
      });
      return res.success;
    } catch (error) {
      console.error('Error in markAllAsRead via API:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const res = await apiService.makeRequest<{ success: boolean }>(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      return res.success;
    } catch (error) {
      console.error('Error in deleteNotification via API:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; count: number }>(`/notifications/${userId}/unread-count`);
      return res.count;
    } catch (error) {
      console.error('Error in getUnreadCount via API:', error);
      return 0;
    }
  }

  /**
   * Create notification
   */
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    expiresAt?: string
  ): Promise<string | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Notification }>('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          type,
          title,
          message,
          data: data || {},
          priority,
          expires_at: expiresAt
        })
      });
      return res.data?.id || null;
    } catch (error) {
      console.error('Error in createNotification via API:', error);
      return null;
    }
  }

  /**
   * Get user notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any }>(`/notifications/preferences/${userId}`);
      if (res.data) {
        return {
          email_notifications: res.data.email_notifications,
          sms_notifications: res.data.sms_notifications,
          push_notifications: res.data.push_notifications,
          marketing_emails: res.data.marketing_emails,
          session_requests: true,
          session_reminders: true,
          payment_updates: true,
          system_updates: true
        };
      }
      return {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        marketing_emails: false,
        session_requests: true,
        session_reminders: true,
        payment_updates: true,
        system_updates: true
      };
    } catch (error) {
      console.error('Error in getNotificationPreferences via API:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const res = await apiService.makeRequest<{ success: boolean }>(`/notifications/preferences/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
      return res.success;
    } catch (error) {
      console.error('Error in updateNotificationPreferences via API:', error);
      return false;
    }
  }

  /**
   * Request browser notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('Notification permission denied');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show browser notification
   */
  private static async showBrowserNotification(notification: Notification): Promise<void> {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const shouldShow = await this.shouldShowNotification(notification);
      if (!shouldShow) {
        return;
      }

      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        data: notification.data
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        this.markAsRead(notification.id);
        
        if (notification.data?.navigate_to) {
          window.location.href = notification.data.navigate_to;
        }
      };

      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Check if notification should be shown based on user preferences
   */
  private static async shouldShowNotification(notification: Notification): Promise<boolean> {
    try {
      const preferences = await this.getNotificationPreferences(notification.user_id);
      if (!preferences) return true;

      switch (notification.type) {
        case 'session_request':
          return preferences.session_requests;
        case 'session_reminder':
          return preferences.session_reminders;
        case 'payment_update':
          return preferences.payment_updates;
        case 'system_update':
          return preferences.system_updates;
        case 'marketing':
          return preferences.marketing_emails;
        default:
          return preferences.push_notifications;
      }
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendBulkNotification(
    userIds: string[],
    type: string,
    title: string,
    message: string,
    data?: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<number> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; count: number }>('/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify({
          userIds,
          type,
          title,
          message,
          data,
          priority
        })
      });
      return res.count || 0;
    } catch (error) {
      console.error('Error in sendBulkNotification via API:', error);
      return 0;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      await apiService.makeRequest('/notifications/cleanup', {
        method: 'POST'
      }).catch(() => null);
    } catch (error) {
      console.error('Error in cleanupExpiredNotifications:', error);
    }
  }

  /**
   * Clean up resources
   */
  static async cleanup(): Promise<void> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
      }
      this.listeners = [];
      console.log('Notification service cleaned up');
    } catch (error) {
      console.error('Error cleaning up notification service:', error);
    }
  }
}

export default NotificationService;