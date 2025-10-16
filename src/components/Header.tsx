import React, { useState } from 'react';
import { Bell, MessageSquare, User, ChevronDown, Settings, HelpCircle, LogOut, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserRole, AppScreen } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { LogoSimple } from './LogoSimple';
import NotificationBell from './shared/NotificationBell';

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
  const { profile } = useAuth();
  const currentRole = profile?.role || 'student';
  const [showProfile, setShowProfile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onClick={() => setShowMessages(!showMessages)} // 🔹 toggle messages
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            {/* Messages Dropdown */}
            {showMessages && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                <div className="p-4 border-b border-slate-100 font-semibold">Messages</div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 text-center text-slate-600">
                    <p>No messages yet</p>
                    <p className="text-sm">Messages will appear here when you receive them</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className={`w-8 h-8 ${roleColors[currentRole]} rounded-full flex items-center justify-center`}>
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden md:block">{profile?.full_name || 'User'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                <div className="p-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
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
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => onScreenChange('settings')} // 🔹 Navigate to settings
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help
                  </Button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <Button variant="ghost" className="w-full justify-start text-red-600" onClick={onLogout}>
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
