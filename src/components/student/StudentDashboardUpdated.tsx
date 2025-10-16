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
import { apiService, DashboardStats, ClassData, AssignmentData, NotificationData, SessionData, WalletData } from '../../services/apiService';

interface StudentDashboardProps {
  currentScreen: AppScreen;
  onScreenChange: (screen: AppScreen) => void;
}

export function StudentDashboard({ currentScreen, onScreenChange }: StudentDashboardProps) {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<DashboardStats>({
    wallet_balance: 0,
    tokens: 0,
    total_classes: 0,
    completed_assignments: 0,
    upcoming_sessions: 0,
    unread_messages: 0
  });
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [wallet, setWallet] = useState<WalletData>({
    balance: 0,
    tokens: 0,
    currency: 'USD',
    transactions: []
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dashboard data in parallel
      const [
        statsData,
        classesData,
        assignmentsData,
        notificationsData,
        sessionsData,
        walletData
      ] = await Promise.all([
        apiService.getDashboardStats(user.id),
        apiService.getClasses(user.id, 'active', 5),
        apiService.getAssignments(user.id, 'upcoming', 5),
        apiService.getNotifications(user.id, true, 5),
        apiService.getSessions(user.id, 5),
        apiService.getWallet(user.id)
      ]);

      // Update all states
      setStats(statsData);
      setClasses(classesData);
      setAssignments(assignmentsData);
      setNotifications(notificationsData);
      setSessions(sessionsData);
      setWallet(walletData);

      console.log('Dashboard data loaded successfully:', {
        stats: statsData,
        classes: classesData.length,
        assignments: assignmentsData.length,
        notifications: notificationsData.length,
        sessions: sessionsData.length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Dashboard</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
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

  return (
    <div className="p-6 space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || 'Student'}!</h1>
          <p className="text-slate-600">Here's what's happening with your learning journey</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total_classes}</div>
          <div className="text-sm text-slate-600">Active Classes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed_assignments}</div>
          <div className="text-sm text-slate-600">Completed Assignments</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.upcoming_sessions}</div>
          <div className="text-sm text-slate-600">Upcoming Sessions</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.tokens}</div>
          <div className="text-sm text-slate-600">Available Tokens</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Classes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Classes</h2>
            <Button variant="ghost" size="sm" onClick={() => onScreenChange('my-classes')}>
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div key={cls.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{cls.title}</h3>
                    <p className="text-sm text-slate-600">{cls.subject} with {cls.teacher_name}</p>
                    <div className="mt-2">
                      <Progress value={cls.progress} className="h-2" />
                      <p className="text-xs text-slate-500 mt-1">{cls.progress}% complete</p>
                    </div>
                  </div>
                  <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                    {cls.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No active classes found</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => onScreenChange('browse-teachers')}>
                  Browse Teachers
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Assignments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Assignments</h2>
            <Button variant="ghost" size="sm" onClick={() => onScreenChange('assignments')}>
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{assignment.title}</h3>
                    <p className="text-sm text-slate-600">{assignment.subject}</p>
                    <p className="text-xs text-slate-500">{formatDate(assignment.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{assignment.max_points} pts</Badge>
                    <p className="text-xs text-slate-500 mt-1">{assignment.difficulty_level}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No upcoming assignments</p>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Sessions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
            <Button variant="ghost" size="sm" onClick={() => onScreenChange('my-classes')}>
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div key={session.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{session.title}</h3>
                    <p className="text-sm text-slate-600">{session.class_title} - {session.subject}</p>
                    <p className="text-xs text-slate-500">with {session.teacher_name}</p>
                    <p className="text-xs text-blue-600 mt-1">{formatDate(session.scheduled_start)}</p>
                  </div>
                  {session.meeting_url && (
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No upcoming sessions</p>
              </div>
            )}
          </div>
        </Card>

        {/* Wallet Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Wallet</h2>
            <Button variant="ghost" size="sm" onClick={() => onScreenChange('wallet')}>
              Manage
            </Button>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(wallet.balance, wallet.currency)}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Token Balance: <span className="font-medium">{wallet.tokens}</span>
              </p>
            </div>
            {wallet.transactions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Transactions</h4>
                <div className="space-y-2">
                  {wallet.transactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between text-sm">
                      <span>{transaction.description}</span>
                      <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Notifications</h2>
          <Button variant="ghost" size="sm" onClick={() => onScreenChange('messages')}>
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${!notification.is_read ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{notification.title}</h4>
                  <p className="text-sm text-slate-600">{notification.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(notification.created_at)}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {notification.type}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No new notifications</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
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
            onClick={() => onScreenChange('ai-assistant')}
          >
            <div className="text-center">
              <Bot className="h-8 w-8 mx-auto mb-2" />
              <span className="font-medium">AI Assistant</span>
            </div>
          </Button>
          
          <Button
            className="h-24 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
            variant="outline"
            onClick={() => onScreenChange('wallet')}
          >
            <div className="text-center">
              <Wallet className="h-8 w-8 mx-auto mb-2" />
              <span className="font-medium">Manage Wallet</span>
            </div>
          </Button>
          
          <Button
            className="h-24 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
            variant="outline"
            onClick={() => onScreenChange('messages')}
          >
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <span className="font-medium">Messages</span>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}

