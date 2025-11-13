import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Settings, Mail, Phone, MessageSquare, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import NotificationService, { Notification } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case 'session_request':
      return <MessageSquare {...iconProps} />;
    case 'session_reminder':
      return <Bell {...iconProps} />;
    case 'payment_update':
      return <CreditCard {...iconProps} />;
    case 'system_update':
      return <AlertTriangle {...iconProps} />;
    case 'email':
      return <Mail {...iconProps} />;
    case 'sms':
      return <Phone {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className={`p-4 border-l-4 ${
      notification.is_read 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-white border-blue-500 shadow-sm'
    } hover:bg-gray-50 transition-colors`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 p-2 rounded-full ${
          notification.is_read ? 'bg-gray-100' : 'bg-blue-100'
        }`}>
          <NotificationIcon type={notification.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`text-sm font-medium ${
                  notification.is_read ? 'text-gray-900' : 'text-gray-900'
                }`}>
                  {notification.title}
                </h4>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                >
                  {notification.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <p className="text-xs text-gray-500">{formatTime(notification.created_at)}</p>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-6 w-6 p-0 hover:bg-green-100"
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-6 w-6 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Loading notifications for user:', user.id, 'unreadOnly:', activeTab === 'unread');
      const result = await NotificationService.getNotifications(
        user.id,
        50,
        0,
        activeTab === 'unread'
      );
      console.log('Notifications loaded:', result.notifications.length, 'notifications');
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const count = await NotificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    try {
      const success = await NotificationService.deleteNotification(notificationId);
      if (success) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const success = await NotificationService.markAllAsRead(user.id);
      if (success) {
        setNotifications(prev => 
          prev.map(n => ({ 
            ...n, 
            is_read: true, 
            read_at: new Date().toISOString() 
          }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Setup notification listener
  useEffect(() => {
    if (!user?.id) return;

    // Initialize notifications
    NotificationService.initializeNotifications(user.id);

    // Add listener for real-time notifications
    const handleNewNotification = (notification: Notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast for new notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000
      });
    };

    NotificationService.addListener(handleNewNotification);

    // Load initial data
    loadNotifications();
    loadUnreadCount();

    // Cleanup
    return () => {
      NotificationService.removeListener(handleNewNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Reload when tab changes or dropdown opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications();
      loadUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen, user?.id]);

  // Periodic unread count update
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const displayNotifications = activeTab === 'unread' ? unreadNotifications : notifications;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-[600px] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="h-6 w-6 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'unread'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[400px]">
            {loading ? (
              <div className="p-4">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2 text-gray-900">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-sm text-center">
                  {activeTab === 'unread' 
                    ? 'You\'re all caught up!' 
                    : 'You\'ll see notifications here when you receive them.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              // Navigate to notification settings
              console.log('Open notification settings');
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;