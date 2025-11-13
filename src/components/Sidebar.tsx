import React from 'react';
import { 
  Home, 
  Users, 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  Wallet, 
  Settings,
  User,
  GraduationCap,
  FileText,
  Bot,
  UserCheck,
  Shield,
  CreditCard,
  Eye,
  Star,
  Calendar,
  HelpCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { UserRole, AppScreen } from '../App';

interface SidebarProps {
  currentRole: UserRole;
  onScreenChange: (screen: AppScreen) => void;
  currentScreen: AppScreen;
  isCollapsed: boolean;
}

const sidebarItems = {
  student: [
    { icon: Home, label: 'Dashboard', screen: 'dashboard' as AppScreen },
    { icon: Users, label: 'Browse Teachers', screen: 'teacher-browse' as AppScreen },
    { icon: BookOpen, label: 'My Classes', screen: 'student-classes' as AppScreen },
    { icon: FileText, label: 'Assignments', screen: 'assignments' as AppScreen },
    { icon: Bot, label: 'AI Assistant', screen: 'ai-assistant' as AppScreen },
    { icon: MessageSquare, label: 'Messages', screen: 'messages' as AppScreen },
    { icon: Wallet, label: 'Wallet', screen: 'wallet' as AppScreen },
    { icon: HelpCircle, label: 'Help & Support', screen: 'student-help-support' as AppScreen },
    { icon: Settings, label: 'Settings', screen: 'settings' as AppScreen },
  ],
  teacher: [
    { icon: Home, label: 'Dashboard', screen: 'dashboard' as AppScreen },
    { icon: BookOpen, label: 'Class Management', screen: 'class-management' as AppScreen },
    { icon: Calendar, label: 'Session Management', screen: 'session-management' as AppScreen },
    { icon: UserCheck, label: 'Student Requests', screen: 'teacher-requests' as AppScreen },
    { icon: Users, label: 'My Students', screen: 'my-students' as AppScreen },
    { icon: FileText, label: 'Upload Assignment', screen: 'upload-assignment' as AppScreen },
    { icon: Star, label: 'Grade Submissions', screen: 'teacher-submissions' as AppScreen },
    { icon: BookOpen, label: 'Materials Library', screen: 'materials-library' as AppScreen },
    { icon: Wallet, label: 'Wallet', screen: 'wallet' as AppScreen },
    { icon: MessageSquare, label: 'Messages', screen: 'messages' as AppScreen },
    { icon: BarChart3, label: 'Analytics', screen: 'analytics' as AppScreen },
    { icon: HelpCircle, label: 'Help & Support', screen: 'teacher-help-support' as AppScreen },
    { icon: Settings, label: 'Settings', screen: 'settings' as AppScreen },
  ],
  parent: [
    { icon: Home, label: 'Dashboard', screen: 'dashboard' as AppScreen },
    { icon: BarChart3, label: 'Child Progress', screen: 'child-progress' as AppScreen },
    { icon: GraduationCap, label: 'Teacher Overview', screen: 'teacher-overview' as AppScreen },
    { icon: CreditCard, label: 'Payment History', screen: 'payment-history' as AppScreen },
    { icon: FileText, label: 'Reports', screen: 'reports' as AppScreen },
    { icon: MessageSquare, label: 'Messages', screen: 'messages' as AppScreen },
    { icon: HelpCircle, label: 'Help & Support', screen: 'parent-help-support' as AppScreen },
    { icon: Settings, label: 'Settings', screen: 'settings' as AppScreen },
  ],
  admin: [
    { icon: Home, label: 'Dashboard', screen: 'dashboard' as AppScreen },
    { icon: Users, label: 'User Management', screen: 'user-management' as AppScreen },
    { icon: UserCheck, label: 'Teacher Verification', screen: 'teacher-verification' as AppScreen },
    { icon: CreditCard, label: 'Payment Management', screen: 'payment-management' as AppScreen },
    { icon: BarChart3, label: 'Analytics', screen: 'analytics' as AppScreen },
    { icon: Eye, label: 'Content Moderation', screen: 'content-moderation' as AppScreen },
    { icon: Shield, label: 'System Settings', screen: 'system-settings' as AppScreen },
  ],
};

const roleColors = {
  student: 'text-blue-600 bg-blue-50',
  teacher: 'text-green-600 bg-green-50',
  parent: 'text-purple-600 bg-purple-50',
  admin: 'text-red-600 bg-red-50'
};

export function Sidebar({ currentRole, onScreenChange, currentScreen, isCollapsed }: SidebarProps) {
  const items = sidebarItems[currentRole];

  return (
    <aside className={`fixed left-0 top-16 h-screen bg-white border-r border-slate-200 p-4 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <nav className="space-y-2">
        {items.map((item, index) => {
          const isActive = currentScreen === item.screen;
          return (
            <Button
              key={index}
              variant={isActive ? "default" : "ghost"}
              className={`${isCollapsed ? 'w-8 h-8 p-0' : 'w-full justify-start'} ${
                isActive 
                  ? `${roleColors[currentRole]} hover:${roleColors[currentRole]}` 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              onClick={() => onScreenChange(item.screen)}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && item.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}