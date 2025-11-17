import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  BarChart3,
  UserCheck,
  CreditCard,
  Eye
} from 'lucide-react';
import { UserManagement } from './UserManagement';
import { TeacherVerification } from './TeacherVerification';
import { PaymentManagement } from './PaymentManagement';
import { AdminAnalytics } from './AdminAnalytics';
import { ContentModeration } from './ContentModeration';
import { SystemSettings } from './SystemSettings';
import { AdminService, SystemHealth } from '../../services/adminService';

type AdminDashboardProps = {
  currentScreen: AdminScreen;
  onScreenChange: (screen: AdminScreen) => void;
};


export function AdminDashboard({ currentScreen, onScreenChange }: AdminDashboardProps) {
  const renderScreen = () => {
    switch (currentScreen) {
      case 'user-management':
        return <UserManagement onBack={() => onScreenChange('dashboard')} />;
      case 'teacher-verification':
        return <TeacherVerification onBack={() => onScreenChange('dashboard')} />;
      case 'payment-management':
        return <PaymentManagement onBack={() => onScreenChange('dashboard')} />;
      case 'analytics':
        return <AdminAnalytics onBack={() => onScreenChange('dashboard')} />;
      case 'content-moderation':
        return <ContentModeration onBack={() => onScreenChange('dashboard')} />;
      case 'system-settings':
        return <SystemSettings onBack={() => onScreenChange('dashboard')} />;
      default:
        return <DashboardHome onNavigate={onScreenChange} currentScreen={currentScreen} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderScreen()}
    </div>
  );
}

function DashboardHome({ onNavigate, currentScreen }: { onNavigate: (screen: AdminScreen) => void, currentScreen: AdminScreen }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    monthlyRevenue: 0,
    activeSessions: 0,
    pendingReviews: 0,
    students: 0,
    verifiedTeachers: 0,
    parents: 0,
    successRate: 0,
    disputes: 0,
    contentReviews: 0,
    userReports: 0,
  });
  const [userGrowth, setUserGrowth] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [adminStats, growth, revGrowth, activity] = await Promise.all([
          AdminService.getAdminStats(),
          AdminService.getUserCountChange(),
          AdminService.getRevenueGrowth(),
          AdminService.getRecentActivity(4),
        ]);

        setStats(adminStats);
        setUserGrowth(growth);
        setRevenueGrowth(revGrowth);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSystemHealth = async () => {
      try {
        setLoadingHealth(true);
        const health = await AdminService.getSystemHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('Error fetching system health:', error);
      } finally {
        setLoadingHealth(false);
      }
    };

    fetchData();
    fetchSystemHealth();
    
    // Refresh system health every 30 seconds
    const healthInterval = setInterval(fetchSystemHealth, 30000);
    
    return () => clearInterval(healthInterval);
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return Users;
      case 'teacher_application':
        return UserCheck;
      case 'payment_issue':
        return CreditCard;
      case 'content_report':
        return Eye;
      default:
        return Users;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registration':
        return 'text-blue-600';
      case 'teacher_application':
        return 'text-orange-600';
      case 'payment_issue':
        return 'text-red-600';
      case 'content_report':
        return 'text-purple-600';
      default:
        return 'text-slate-600';
    }
  };

  const today = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-red-100 text-lg">Platform overview and management tools</p>
          </div>
          <div className="text-right">
            <p className="text-red-100">Today</p>
            <p className="text-2xl font-bold">{today}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {loading ? (
        <div className="text-center py-8 text-foreground">Loading dashboard data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">
                    {userGrowth > 0 ? '+' : ''}{userGrowth} this month
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyRevenue)}</p>
                  <p className="text-xs text-green-600">
                    {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% from last month
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeSessions}</p>
                  <p className="text-xs text-purple-600">Live now</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingReviews}</p>
                  <p className="text-xs text-orange-600">Require attention</p>
                </div>
              </div>
            </Card>
          </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          className="h-24 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
          variant="outline"
          onClick={() => onNavigate('user-management')}
        >
          <div className="text-center">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">User Management</span>
          </div>
        </Button>
        <Button 
          className="h-24 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
          variant="outline"
          onClick={() => onNavigate('teacher-verification')}
        >
          <div className="text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Teacher Verification</span>
            {stats.pendingReviews > 0 && (
              <Badge className="bg-orange-500 text-white ml-2">{stats.pendingReviews}</Badge>
            )}
          </div>
        </Button>
        <Button 
          className="h-24 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
          variant="outline"
          onClick={() => onNavigate('analytics')}
        >
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <span className="font-medium">Analytics</span>
          </div>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-foreground">Recent Platform Activity</h2>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type);
                  const color = getActivityColor(activity.type);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-slate-50 bg-card">
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`h-5 w-5 ${color}`} />
                        <div>
                          <p className="font-medium text-foreground">{activity.message}</p>
                          <p className="text-sm text-slate-600">{activity.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={activity.priority === 'high' ? 'destructive' : activity.priority === 'medium' ? 'default' : 'secondary'}>
                          {activity.priority}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* System Health */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 text-foreground">System Health</h3>
            {loadingHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Loading...</span>
                  <Badge className="bg-slate-100 text-slate-800">-</Badge>
                </div>
              </div>
            ) : systemHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Server Status</span>
                  <Badge 
                    className={
                      systemHealth.serverStatus === 'healthy' 
                        ? 'bg-green-100 text-green-800'
                        : systemHealth.serverStatus === 'degraded'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                    title={systemHealth.serverStatusMessage}
                  >
                    {systemHealth.serverStatus === 'healthy' ? 'Healthy' : 
                     systemHealth.serverStatus === 'degraded' ? 'Degraded' : 'Down'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Database</span>
                  <Badge 
                    className={
                      systemHealth.database === 'normal' 
                        ? 'bg-green-100 text-green-800'
                        : systemHealth.database === 'slow'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                    title={systemHealth.databaseMessage}
                  >
                    {systemHealth.database === 'normal' ? 'Normal' : 
                     systemHealth.database === 'slow' ? 'Slow' : 'Down'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">API Response</span>
                  <Badge 
                    className={
                      systemHealth.apiResponse === 'fast' || systemHealth.apiResponse === 'normal'
                        ? 'bg-green-100 text-green-800'
                        : systemHealth.apiResponse === 'slow'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                    title={systemHealth.apiResponseMessage}
                  >
                    {systemHealth.apiResponse === 'fast' ? 'Fast' :
                     systemHealth.apiResponse === 'normal' ? 'Normal' :
                     systemHealth.apiResponse === 'slow' ? 'Slow' : 'Down'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Payment Gateway</span>
                  <Badge 
                    className={
                      systemHealth.paymentGateway === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : systemHealth.paymentGateway === 'degraded'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                    title={systemHealth.paymentGatewayMessage}
                  >
                    {systemHealth.paymentGateway === 'active' ? 'Active' : 
                     systemHealth.paymentGateway === 'degraded' ? 'Degraded' : 'Down'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status</span>
                  <Badge className="bg-red-100 text-red-800">Error</Badge>
                </div>
              </div>
            )}
          </Card>

          {/* Pending Tasks */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 text-foreground">Pending Tasks</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Teacher Verifications</span>
                <Badge className="bg-orange-100 text-orange-800">{stats.pendingReviews}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Content Reviews</span>
                <Badge className="bg-purple-100 text-purple-800">{stats.contentReviews}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Disputes</span>
                <Badge className="bg-red-100 text-red-800">{stats.disputes}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">User Reports</span>
                <Badge className="bg-blue-100 text-blue-800">{stats.userReports}</Badge>
              </div>
            </div>
          </Card>

          {/* Platform Stats */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 text-foreground">Platform Statistics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Active Students</span>
                <span className="font-medium text-foreground">{stats.students.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Verified Teachers</span>
                <span className="font-medium text-foreground">{stats.verifiedTeachers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Active Parents</span>
                <span className="font-medium text-foreground">{stats.parents.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-medium text-foreground">{stats.successRate.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate('content-moderation')}>
                <Eye className="h-4 w-4 mr-2" />
                Content Moderation
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate('payment-management')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Management
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate('system-settings')}>
                <Shield className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>
        </>
      )}
    </>
  );
}