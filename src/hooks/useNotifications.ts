import { useState, useEffect, useCallback } from 'react';
import NotificationService, { type Notification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export interface UseNotificationsResult {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearError: () => void;
  
  // Helpers
  hasUnreadNotifications: boolean;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications on mount
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUnreadCount();
    }
    
    return () => {
      NotificationService.cleanup();
    };
  }, [user?.id]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!user?.id) return;

    // Initialize notifications with listener
    NotificationService.initializeNotifications(user.id);
    
    const handleNewNotification = (newNotification: Notification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: newNotification.id
        });
      }
    };

    NotificationService.addListener(handleNewNotification);

    return () => {
      NotificationService.removeListener(handleNewNotification);
    };
  }, [user?.id]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await NotificationService.getNotifications(user.id);
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const count = await NotificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await NotificationService.markAllAsRead(user.id);
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(notif => notif.id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, [notifications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasUnreadNotifications = unreadCount > 0;

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    
    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
    
    // Helpers
    hasUnreadNotifications
  };
}

// Helper function to request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}


