import { supabase } from '../supabaseClient';

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
      console.log('Fetching notifications for user:', userId);

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter out expired notifications
      const now = new Date().toISOString();
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return {
        notifications: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
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
      console.log('Creating notification:', { userId, type, title, message });

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: data || {},
          priority,
          expires_at: expiresAt
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return notification.id;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Get user notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      // Get from teacher preferences if user is teacher
      const { data: teacherPrefs } = await supabase
        .from('teacher_preferences')
        .select('email_notifications, sms_notifications, push_notifications, marketing_emails')
        .eq('teacher_id', userId)
        .single();

      if (teacherPrefs) {
        return {
          email_notifications: teacherPrefs.email_notifications,
          sms_notifications: teacherPrefs.sms_notifications,
          push_notifications: teacherPrefs.push_notifications,
          marketing_emails: teacherPrefs.marketing_emails,
          session_requests: true, // Default
          session_reminders: true, // Default
          payment_updates: true, // Default
          system_updates: true // Default
        };
      }

      // Default preferences for non-teachers
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
      console.error('Error in getNotificationPreferences:', error);
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
      // Update teacher preferences if user is teacher
      const { error } = await supabase
        .from('teacher_preferences')
        .upsert({
          teacher_id: userId,
          email_notifications: preferences.email_notifications,
          sms_notifications: preferences.sms_notifications,
          push_notifications: preferences.push_notifications,
          marketing_emails: preferences.marketing_emails
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateNotificationPreferences:', error);
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

      // Check if notification should be shown based on preferences
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
        
        // Mark as read when clicked
        this.markAsRead(notification.id);
        
        // Navigate to relevant page if data contains navigation info
        if (notification.data?.navigate_to) {
          window.location.href = notification.data.navigate_to;
        }
      };

      // Auto-close after 5 seconds
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

      // Check specific notification types
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
      return true; // Default to showing notification
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
      console.log('Sending bulk notification to', userIds.length, 'users');

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        priority
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error sending bulk notification:', error);
        return 0;
      }

      return userIds.length;
    } catch (error) {
      console.error('Error in sendBulkNotification:', error);
      return 0;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error cleaning up expired notifications:', error);
      }
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