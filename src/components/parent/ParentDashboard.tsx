import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { FloatingAIButton } from '../shared/FloatingAIButton';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  MessageSquare,
  Clock,
  Star,
  Award,
  BarChart3,
  CreditCard,
  FileText,
  Settings,
  Loader2
} from 'lucide-react';
import { AppScreen } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import ParentService, { ParentDashboardData, ChildData } from '../../services/parentService';

interface ParentDashboardProps {
  onScreenChange: (screen: AppScreen) => void;
}

export function ParentDashboard({ onScreenChange }: ParentDashboardProps) {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await ParentService.getDashboardData(user.id);
        setDashboardData(data);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || 'Parent'}!</h1>
            <p className="text-purple-100 text-lg">Track your children's learning journey and stay connected</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100">Today</p>
            <p className="text-2xl font-bold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Teachers</p>
              <p className="text-2xl font-bold">{dashboardData.active_teachers}</p>
              <p className="text-xs text-purple-600">Working with your children</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Overall Progress</p>
              <p className="text-2xl font-bold">{dashboardData.overall_progress}%</p>
              <p className="text-xs text-green-600">Across all subjects</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Hours This Week</p>
              <p className="text-2xl font-bold">{dashboardData.hours_this_week}</p>
              <p className="text-xs text-blue-600">{dashboardData.monthly_summary.total_sessions} sessions completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">This Month</p>
              <p className="text-2xl font-bold">${dashboardData.monthly_spending.toFixed(2)}</p>
              <p className="text-xs text-orange-600">{dashboardData.monthly_summary.total_sessions} sessions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          className="h-24 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
          variant="outline"
          onClick={() => onScreenChange('child-progress')}
        >
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Child Progress</span>
          </div>
        </Button>
        <Button 
          className="h-24 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
          variant="outline"
          onClick={() => onScreenChange('teacher-overview')}
        >
          <div className="text-center">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Teachers</span>
          </div>
        </Button>
        <Button 
          className="h-24 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
          variant="outline"
          onClick={() => onScreenChange('payment-history')}
        >
          <div className="text-center">
            <CreditCard className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Payments</span>
          </div>
        </Button>
        <Button 
          className="h-24 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
          variant="outline"
          onClick={() => onScreenChange('reports')}
        >
          <div className="text-center">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Reports</span>
          </div>
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          className="h-16 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
          variant="outline"
          onClick={() => onScreenChange('parent-messages')}
        >
          <div className="flex items-center justify-center space-x-3">
            <MessageSquare className="h-6 w-6" />
            <span className="font-medium">Messages</span>
            <Badge className="bg-red-100 text-red-800">
              {dashboardData.recent_messages.length > 0 ? dashboardData.recent_messages.length : '0'} New
            </Badge>
          </div>
        </Button>
        <Button 
          className="h-16 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
          variant="outline"
          onClick={() => onScreenChange('settings')}
        >
          <div className="flex items-center justify-center space-x-3">
            <Settings className="h-6 w-6" />
            <span className="font-medium">Settings</span>
          </div>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Children Overview */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Children's Progress Overview</h2>
              <Button variant="outline" size="sm" onClick={() => onScreenChange('child-progress')}>
                View Details
              </Button>
            </div>
            
            {/* Children List */}
            <div className="space-y-6">
              {dashboardData.children.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No children registered yet</p>
                  <p className="text-sm text-gray-500 mt-2">Contact support to add your children to the platform</p>
                </div>
              ) : (
                dashboardData.children.map((child, childIndex) => (
                  <div key={childIndex} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={child.avatar_url || '/default-avatar.png'}
                        alt={child.full_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-lg">{child.full_name}</h3>
                        <p className="text-slate-600">{child.grade_level || 'Student'} • {child.education_level?.level_name || 'Level'}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">Active Student</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {child.interests.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-sm">Interests</h5>
                              <p className="text-xs text-slate-600">{child.interests.join(', ')}</p>
                            </div>
                            <Badge variant="secondary">Learning</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>Active</span>
                            </div>
                            <Progress value={75} className="h-1.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">No active subjects yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Upcoming Sessions</h3>
            <div className="space-y-3">
              {dashboardData.upcoming_sessions.length === 0 ? (
                <p className="text-gray-600 text-sm">No upcoming sessions</p>
              ) : (
                dashboardData.upcoming_sessions.slice(0, 4).map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-purple-900 text-sm">
                        {new Date(session.scheduled_start).toLocaleString()}
                      </p>
                      <p className="text-sm text-purple-700">{session.child_name} - {session.teacher_name}</p>
                      <p className="text-xs text-purple-600">{session.subject}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {dashboardData.recent_activity.length === 0 ? (
                <p className="text-gray-600 text-sm">No recent activity</p>
              ) : (
                dashboardData.recent_activity.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-slate-600">
                        {item.subject} • {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Monthly Summary */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">This Month Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Sessions</span>
                <span className="font-medium">{dashboardData.monthly_summary.total_sessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Study Hours</span>
                <span className="font-medium">{dashboardData.monthly_summary.study_hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Assignments</span>
                <span className="font-medium">
                  {dashboardData.monthly_summary.assignments_completed}/{dashboardData.monthly_summary.total_assignments} completed
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Average Grades</span>
                <span className="font-medium">{dashboardData.monthly_summary.average_grades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Amount Spent</span>
                <span className="font-medium">${dashboardData.monthly_summary.amount_spent.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Teacher Messages */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Recent Messages</h3>
              <Button variant="outline" size="sm" onClick={() => onScreenChange('messages')}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {dashboardData.recent_messages.length === 0 ? (
                <p className="text-gray-600 text-sm">No recent messages</p>
              ) : (
                dashboardData.recent_messages.map((message, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{message.from}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(message.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{message.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Floating AI Assistant Button */}
      <FloatingAIButton />
    </div>
  );
}