import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, User, ChevronDown, Settings, HelpCircle, LogOut, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserRole, AppScreen } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { LogoSimple } from './LogoSimple';
import NotificationBell from './shared/NotificationBell';
import MessagesDropdown from './shared/MessagesDropdown';
import StudentMessagingService from '../services/studentMessagingService';
import ParentMessagingService from '../services/parentMessagingService';
import { messagingService } from '../services/messagingService';

interface HeaderProps {
  onLogout: () => void;
  onScreenChange: (screen: AppScreen, query?: string) => void; // 🔹 Added optional query
  currentScreen: AppScreen;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const roleColors = {
  student: 'bg-blue-500',
  teacher: 'bg-green-500', 
  parent: 'bg-purple-500',
  admin: 'bg-red-500'
};

const roleNames = {
  student: 'Student',
  teacher: 'Teacher',
  parent: 'Parent', 
  admin: 'Admin'
};

export function Header({ onLogout, onScreenChange, currentScreen, isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const { profile, user } = useAuth();
  const currentRole = profile?.role || 'student';
  const [showProfile, setShowProfile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Load unread message count
  useEffect(() => {
    if (!user?.id || !profile?.role) return;

    const loadUnreadCount = async () => {
      try {
        let convs: any[] = [];
        
        switch (profile.role) {
          case 'student':
            convs = await StudentMessagingService.getConversations(user.id);
            break;
          case 'parent':
            convs = await ParentMessagingService.getConversations(user.id);
            break;
          case 'teacher':
          case 'admin':
            convs = await messagingService.getConversations(user.id);
            break;
        }

        // Filter to only count conversations with unread messages
        const unreadConvs = convs.filter(conv => (conv.unread_count || 0) > 0);
        const unread = unreadConvs.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setUnreadMessageCount(unread);
      } catch (error) {
        console.error('Error loading unread message count:', error);
      }
    };

    loadUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id, profile?.role]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const profileButton = document.querySelector('[data-profile-button]');
      const profileDropdown = document.querySelector('[data-profile-dropdown]');
      
      if (
        profileDropdown &&
        !profileDropdown.contains(target) &&
        profileButton &&
        !profileButton.contains(target)
      ) {
        setShowProfile(false);
      }
    };
    
    if (showProfile) {
      // Use a small delay to avoid closing immediately when opening
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfile]);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <LogoSimple size="md" showText={true} animated={true} />
          <Badge variant="secondary" className="ml-4">
            {roleNames[currentRole]} View
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <input 
            type="text" 
            placeholder="Search teachers, classes, or assignments..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
            value={searchQuery} // 🔹 bind search state
            onChange={(e) => setSearchQuery(e.target.value)} // 🔹 update state
            onKeyDown={(e) => { // 🔹 trigger search on Enter
              if (e.key === 'Enter' && searchQuery.trim() !== '') {
                onScreenChange('browse-teachers', searchQuery); // 🔹 pass query to BrowseTeachers
                setSearchQuery(''); // 🔹 clear input
              }
            }}
          />
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">

          {/* Messages */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={(e) => {
                e.stopPropagation();
                setShowMessages(!showMessages);
              }}
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessageCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </Badge>
              )}
            </Button>

            <MessagesDropdown
              isOpen={showMessages}
              onClose={() => setShowMessages(false)}
              onNavigateToMessages={(conversationId) => {
                // Navigate to messages screen based on role
                // TODO: In the future, we can use conversationId to open a specific conversation
                if (currentRole === 'student') {
                  onScreenChange('student-messages');
                } else if (currentRole === 'parent') {
                  onScreenChange('parent-messages');
                } else if (currentRole === 'teacher' || currentRole === 'admin') {
                  // Teachers and admins use 'messages' screen
                  onScreenChange('messages');
                } else {
                  onScreenChange('messages');
                }
              }}
            />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              type="button"
              data-profile-button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowProfile(!showProfile);
              }}
            >
              <div className={`w-8 h-8 ${roleColors[currentRole]} rounded-full flex items-center justify-center`}>
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden md:block text-slate-900">{profile?.full_name || 'User'}</span>
              <ChevronDown className="h-4 w-4 text-slate-600" />
            </Button>

            {showProfile && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50"
                data-profile-dropdown
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-900 hover:bg-slate-100"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfile(false);
                      // Navigate to appropriate profile based on role
                      if (currentRole === 'teacher') {
                        onScreenChange('teacher-profile');
                      } else if (currentRole === 'student') {
                        onScreenChange('student-profile');
                      } else {
                        onScreenChange('student-profile'); // Default fallback
                      }
                    }}
                  >
                    <User className="h-4 w-4 mr-2 text-slate-700" />
                    View Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-900 hover:bg-slate-100"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfile(false);
                      onScreenChange('settings');
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2 text-slate-700" />
                    Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-900 hover:bg-slate-100"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (currentRole === 'parent') {
                        onScreenChange('parent-help-support');
                      } else if (currentRole === 'student') {
                        onScreenChange('student-help-support');
                      } else if (currentRole === 'teacher') {
                        onScreenChange('teacher-help-support');
                      }
                    }}
                  >
                    <HelpCircle className="h-4 w-4 mr-2 text-slate-700" />
                    Help
                  </Button>
                  <div className="border-t border-slate-200 my-1"></div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:bg-red-50" 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfile(false);
                      onLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
