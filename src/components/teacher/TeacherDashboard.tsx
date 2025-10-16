import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TeacherService, TeacherDashboardStats, TeacherClass, TeacherSession, TeacherAssignment, TeacherNotification, TeacherRecentActivity } from '../../services/teacherService';
import { ZoomStatus } from '../zoom/ZoomStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  DollarSign, 
  Star, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  Bell,
  RefreshCw,
  Video
} from 'lucide-react';

interface TeacherDashboardProps {
  onScreenChange?: (screen: string) => void;
}

export function TeacherDashboard({ onScreenChange }: TeacherDashboardProps) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [activeClasses, setActiveClasses] = useState<TeacherClass[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<TeacherSession[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<TeacherAssignment[]>([]);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [recentActivity, setRecentActivity] = useState<TeacherRecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      loadDashboardData();
    }
  }, [user, profile]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [
        statsData,
        classesData,
        sessionsData,
        assignmentsData,
        notificationsData,
        activityData
      ] = await Promise.all([
        TeacherService.getDashboardStats(user.id),
        TeacherService.getActiveClasses(user.id),
        TeacherService.getUpcomingSessions(user.id, 5),
        TeacherService.getRecentAssignments(user.id, 5),
        TeacherService.getNotifications(user.id, 5),
        TeacherService.getRecentActivity(user.id, 10)
      ]);

      setStats(statsData);
      setActiveClasses(classesData);
      setUpcomingSessions(sessionsData);
      setRecentAssignments(assignmentsData);
      setNotifications(notificationsData);
      setRecentActivity(activityData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    const success = await TeacherService.markNotificationAsRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">Welcome back, {profile?.full_name}</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.total_earnings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active_students}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Upcoming Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcoming_sessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Star className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Average Rating</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-gray-900">{stats.average_rating.toFixed(1)}</p>
                      <span className="text-sm text-gray-500 ml-1">({stats.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Secondary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(stats.wallet_balance)}
                    </p>
                    <p className="text-sm text-gray-500">{stats.tokens} tokens</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                    <p className="text-xl font-bold text-gray-900">{stats.pending_requests}</p>
                    <p className="text-sm text-gray-500">Session requests</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Unread Messages</p>
                    <p className="text-xl font-bold text-gray-900">{stats.unread_messages}</p>
                    <p className="text-sm text-gray-500">Notifications</p>
                  </div>
                  <Bell className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Active Classes</TabsTrigger>
            <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule New Session
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Messages
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Students
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Zoom Integration
                  </Button>
                </CardContent>
              </Card>

              {/* Zoom Integration */}
              {user?.id && (
                <ZoomStatus teacherId={user.id} />
              )}

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No notifications</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-3 rounded-lg border ${
                            notification.is_read 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkNotificationAsRead(notification.id)}
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Classes</CardTitle>
                <CardDescription>Your currently active student classes</CardDescription>
              </CardHeader>
              <CardContent>
                {activeClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active classes yet</p>
                    <p className="text-sm text-gray-400 mt-2">Start by accepting session requests from students</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeClasses.map((classItem) => (
                      <div key={classItem.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {classItem.student_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium">{classItem.title}</h3>
                              <p className="text-sm text-gray-600">
                                {classItem.student_name} • {classItem.subject_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(classItem.hourly_rate, classItem.currency)}/hr
                            </p>
                            <Badge className={getStatusColor(classItem.status)}>
                              {classItem.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your scheduled teaching sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming sessions</p>
                    <p className="text-sm text-gray-400 mt-2">Schedule new sessions to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div key={session.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Play className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{session.title}</h3>
                              <p className="text-sm text-gray-600">
                                {session.student_name} • {session.subject_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(session.scheduled_start)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(session.rate)}/hr
                            </p>
                            <Button size="sm" variant="outline">
                              Join Session
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>Your latest assignments and their progress</CardDescription>
              </CardHeader>
              <CardContent>
                {recentAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No assignments yet</p>
                    <p className="text-sm text-gray-400 mt-2">Create assignments to engage with your students</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                {assignment.subject_name}
                              </span>
                              <Badge className={getStatusColor(assignment.status)}>
                                {assignment.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {assignment.submissions_count} submissions
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{assignment.graded_count}/{assignment.submissions_count}</span>
                              </div>
                              <Progress 
                                value={(assignment.graded_count / assignment.submissions_count) * 100 || 0} 
                                className="h-2"
                              />
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium">{assignment.max_points} pts</p>
                            <p className="text-xs text-gray-500">
                              Due: {assignment.due_date ? formatDate(assignment.due_date) : 'No due date'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest teaching activities and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                    <p className="text-sm text-gray-400 mt-2">Start teaching to see your activity here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'session' && (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Play className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {activity.type === 'review' && (
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Star className="h-4 w-4 text-yellow-600" />
                            </div>
                          )}
                          {activity.type === 'assignment' && (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <FileText className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          {activity.type === 'message' && (
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-purple-600" />
                            </div>
                          )}
                          {activity.type === 'payment' && (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}