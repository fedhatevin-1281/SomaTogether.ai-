import React, { useState } from 'react';
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
            <p className="text-2xl font-bold">Oct 4, 2025</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-2xl font-bold">2,487</p>
              <p className="text-xs text-blue-600">+127 this month</p>
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
              <p className="text-2xl font-bold">$45.2K</p>
              <p className="text-xs text-green-600">+18% from last month</p>
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
              <p className="text-2xl font-bold">156</p>
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
              <p className="text-2xl font-bold">12</p>
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
            <Badge className="bg-orange-500 text-white ml-2">12</Badge>
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
            <h2 className="text-xl font-bold mb-6">Recent Platform Activity</h2>
            <div className="space-y-4">
              {[
                { 
                  type: 'user_registration', 
                  message: 'New student registered: Sarah Kim',
                  time: '5 minutes ago',
                  priority: 'low',
                  icon: Users,
                  color: 'text-blue-600'
                },
                { 
                  type: 'teacher_application', 
                  message: 'Teacher verification required: Dr. David Wilson',
                  time: '15 minutes ago',
                  priority: 'high',
                  icon: UserCheck,
                  color: 'text-orange-600'
                },
                { 
                  type: 'payment_issue', 
                  message: 'Payment dispute reported by parent',
                  time: '1 hour ago',
                  priority: 'high',
                  icon: CreditCard,
                  color: 'text-red-600'
                },
                { 
                  type: 'content_report', 
                  message: 'Content flagged for review in Mathematics course',
                  time: '2 hours ago',
                  priority: 'medium',
                  icon: Eye,
                  color: 'text-purple-600'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    <div>
                      <p className="font-medium">{activity.message}</p>
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
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* System Health */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Server Status</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Database</span>
                <Badge className="bg-green-100 text-green-800">Normal</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">API Response</span>
                <Badge className="bg-yellow-100 text-yellow-800">Slow</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Payment Gateway</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          </Card>

          {/* Pending Tasks */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Pending Tasks</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Teacher Verifications</span>
                <Badge className="bg-orange-100 text-orange-800">12</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Content Reviews</span>
                <Badge className="bg-purple-100 text-purple-800">8</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Disputes</span>
                <Badge className="bg-red-100 text-red-800">3</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">User Reports</span>
                <Badge className="bg-blue-100 text-blue-800">5</Badge>
              </div>
            </div>
          </Card>

          {/* Platform Stats */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Platform Statistics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Active Students</span>
                <span className="font-medium">1,847</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Verified Teachers</span>
                <span className="font-medium">423</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Active Parents</span>
                <span className="font-medium">1,205</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-medium">94.2%</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
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
  );
}