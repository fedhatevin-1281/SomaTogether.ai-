import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Clock, BookOpen, Target, TrendingUp, Play, Bot, MessageSquare, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { AppScreen } from '../../App';
import { StudentSettings } from './StudentSettings';
import { MyClasses } from './MyClasses';
import { MessagesScreen } from '../shared/MessagesScreen';
import { useAuth } from '../../contexts/AuthContext';
import { StudentService, StudentDashboardStats, StudentClass, StudentAssignment, StudentNotification } from '../../services/studentService';

interface StudentDashboardProps {
  currentScreen: AppScreen;
  onScreenChange: (screen: AppScreen) => void;
}

// Types are now imported from studentService

export function StudentDashboard({ currentScreen, onScreenChange }: StudentDashboardProps) {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [stats, setStats] = useState<StudentDashboardStats>({
    wallet_balance: 0,
    tokens: 0,
    total_classes: 0,
    completed_assignments: 0,
    upcoming_sessions: 0,
    unread_messages: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [statsData, classesData, assignmentsData, notificationsData] = await Promise.all([
        StudentService.getDashboardStats(user.id),
        StudentService.getActiveClasses(user.id),
        StudentService.getUpcomingAssignments(user.id),
        StudentService.getNotifications(user.id, false)
      ]);

      setStats(statsData);
      setClasses(classesData);
      setAssignments(assignmentsData);
      setNotifications(notificationsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Old fetch functions removed - now using StudentService

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };
  // Messages Screen
  if (currentScreen === 'messages') {
    return (
      <MessagesScreen
        userRole="student"
        onBack={() => onScreenChange('dashboard')}
        classInfo={{ teacher: 'Dr. Sarah Johnson', subject: 'Mathematics' }}
      />
    );
  }

  // Settings Screen
  if (currentScreen === 'settings') {
    return <StudentSettings />;
  }

  // My Classes Screen
  if (currentScreen === 'my-classes') {
    return <MyClasses onScreenChange={onScreenChange} />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || 'Student'}!</h1>
              <p className="text-blue-100 text-lg">Loading your dashboard...</p>
            </div>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || 'Student'}!</h1>
              <p className="text-blue-100 text-lg">Dashboard temporarily unavailable</p>
            </div>
          </div>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Default Dashboard Layout
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || 'Student'}!</h1>
            <p className="text-blue-100 text-lg">Ready to continue your learning journey?</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-white hover:bg-blue-400/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="text-right">
              <p className="text-blue-100">Today</p>
              <p className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          className="h-24 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
          variant="outline"
          onClick={() => onScreenChange('browse-teachers')}
        >
          <div className="text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Browse Teachers</span>
          </div>
        </Button>

        <Button
          className="h-24 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
          variant="outline"
          onClick={() => onScreenChange('my-classes')}
        >
          <div className="text-center">
            <Play className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">My Classes</span>
          </div>
        </Button>

        <Button
          className="h-24 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
          variant="outline"
          onClick={() => onScreenChange('assignments')}
        >
          <div className="text-center">
            <Target className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Assignments</span>
          </div>
        </Button>

        <Button
          className="h-24 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
          variant="outline"
          onClick={() => onScreenChange('ai-assistant')}
        >
          <div className="text-center">
            <Bot className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">AI Assistant</span>
          </div>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total_classes}</div>
          <div className="text-sm text-slate-600">Active Classes</div>
          {stats.total_classes === 0 && (
            <div className="text-xs text-slate-400 mt-1">Start learning!</div>
          )}
        </Card>
        <Card className="p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-green-600">{stats.completed_assignments}</div>
          <div className="text-sm text-slate-600">Completed Assignments</div>
          {stats.completed_assignments === 0 && (
            <div className="text-xs text-slate-400 mt-1">Keep going!</div>
          )}
        </Card>
        <Card className="p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-purple-600">{stats.upcoming_sessions}</div>
          <div className="text-sm text-slate-600">Upcoming Sessions</div>
          {stats.upcoming_sessions === 0 && (
            <div className="text-xs text-slate-400 mt-1">Schedule one!</div>
          )}
        </Card>
        <Card className="p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-orange-600">{stats.tokens.toLocaleString()}</div>
          <div className="text-sm text-slate-600">Available Tokens</div>
          <div className="text-xs text-slate-400 mt-1">${stats.wallet_balance.toFixed(2)} USD</div>
        </Card>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          className="h-16 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
          variant="outline"
          onClick={() => onScreenChange('messages')}
        >
          <div className="flex items-center justify-center space-x-3">
            <MessageSquare className="h-6 w-6" />
            <span className="font-medium">Messages</span>
            {stats.unread_messages > 0 && (
              <Badge className="bg-blue-100 text-blue-800">{stats.unread_messages}</Badge>
            )}
          </div>
        </Button>

        <Button
          className="h-16 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
          variant="outline"
          onClick={() => onScreenChange('wallet')}
        >
          <div className="flex items-center justify-center space-x-3">
            <Wallet className="h-6 w-6" />
            <span className="font-medium">Wallet</span>
            <span className="text-sm">${stats.wallet_balance.toFixed(2)}</span>
          </div>
        </Button>

        <Button
          className="h-16 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
          variant="outline"
          onClick={() => onScreenChange('settings')}
        >
          <div className="flex items-center justify-center space-x-3">
            <TrendingUp className="h-6 w-6" />
            <span className="font-medium">Settings</span>
          </div>
        </Button>
      </div>

      {/* Active Classes & Right Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Left: Active Classes */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Active Classes</h2>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            {classes.length > 0 ? (
              <ul className="space-y-3">
                {classes.map((cls) => (
                  <li key={cls.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{cls.title}</div>
                      <div className="text-sm text-slate-600">{cls.subject} with {cls.teacher_name}</div>
                      <div className="text-xs text-slate-500 mt-1">${cls.hourly_rate}/hour</div>
                    </div>
                    <div className="w-24">
                      <Progress value={cls.progress} className="mb-1" />
                      <div className="text-xs text-slate-500 text-center">{cls.progress}%</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No active classes yet</h3>
                <p className="text-sm mb-4">Start your learning journey by finding the perfect teacher for you!</p>
                <Button 
                  variant="outline" 
                  onClick={() => onScreenChange('browse-teachers')}
                  className="mr-2"
                >
                  Browse Teachers
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => onScreenChange('browse-teachers')}
                >
                  Get Started
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-2">Upcoming Assignments</h2>
            {assignments.length > 0 ? (
              <ul className="space-y-3">
                {assignments.map((assignment) => (
                  <li key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{assignment.title}</div>
                      <div className="text-sm text-slate-600">{assignment.subject} by {assignment.teacher_name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {assignment.max_points} points • {assignment.difficulty_level}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-purple-100 text-purple-800 mb-1">
                        Due {formatDate(assignment.due_date)}
                      </Badge>
                      <div className="text-xs text-slate-500 capitalize">{assignment.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming assignments</h3>
                <p className="text-sm mb-2">You're all caught up!</p>
                <p className="text-xs">Assignments will appear here once you enroll in classes.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Sidebar / Notifications */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-2">Recent Notifications</h2>
            {notifications.length > 0 ? (
              <ul className="space-y-3">
                {notifications.map((notification) => (
                  <li key={notification.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-slate-50'
                  }`}>
                    <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      !notification.is_read ? 'text-blue-500' : 'text-slate-400'
                    }`} />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        !notification.is_read ? 'text-slate-900' : 'text-slate-700'
                      }`}>{notification.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(notification.created_at)}</p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No notifications</h3>
                <p className="text-sm mb-2">You're all caught up!</p>
                <p className="text-xs">Notifications will appear here for class updates, assignments, and messages.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
