import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import NotificationCenter from './NotificationCenter';
import NotificationService, { Notification } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

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

  // Setup notification listener
  useEffect(() => {
    if (!user?.id) return;

    // Initialize notifications
    NotificationService.initializeNotifications(user.id);

    // Add listener for real-time notifications
    const handleNewNotification = (notification: Notification) => {
      setUnreadCount(prev => prev + 1);
      setHasNewNotifications(true);
      
      // Reset animation after 3 seconds
      setTimeout(() => {
        setHasNewNotifications(false);
      }, 3000);
    };

    NotificationService.addListener(handleNewNotification);

    // Load initial count
    loadUnreadCount();

    // Cleanup
    return () => {
      NotificationService.removeListener(handleNewNotification);
    };
  }, [user?.id]);

  // Periodic unread count update
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleClick = () => {
    setIsOpen(true);
    setHasNewNotifications(false);
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          className={`relative h-9 w-9 p-0 ${
            hasNewNotifications ? 'animate-pulse' : ''
          }`}
        >
          <Bell className={`h-5 w-5 ${
            hasNewNotifications ? 'text-blue-600' : 'text-gray-600'
          }`} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default NotificationBell;