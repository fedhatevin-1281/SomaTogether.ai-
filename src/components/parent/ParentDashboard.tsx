import React from 'react';
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
  Settings
} from 'lucide-react';
import { AppScreen } from '../../App';

interface ParentDashboardProps {
  onScreenChange: (screen: AppScreen) => void;
}

export function ParentDashboard({ onScreenChange }: ParentDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Jennifer!</h1>
            <p className="text-purple-100 text-lg">Track your children's learning journey and stay connected</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100">Today</p>
            <p className="text-2xl font-bold">Oct 4, 2025</p>
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
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-purple-600">Math, Physics, English</p>
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
              <p className="text-2xl font-bold">87%</p>
              <p className="text-xs text-green-600">+12% this month</p>
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
              <p className="text-2xl font-bold">12.5</p>
              <p className="text-xs text-blue-600">5 sessions completed</p>
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
              <p className="text-2xl font-bold">$485</p>
              <p className="text-xs text-orange-600">16 sessions</p>
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
          onClick={() => onScreenChange('messages')}
        >
          <div className="flex items-center justify-center space-x-3">
            <MessageSquare className="h-6 w-6" />
            <span className="font-medium">Messages</span>
            <Badge className="bg-red-100 text-red-800">3 New</Badge>
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
              {[
                {
                  name: 'Alex Thompson',
                  age: 16,
                  grade: '10th Grade',
                  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                  subjects: [
                    { name: 'Advanced Mathematics', teacher: 'Dr. Sarah Johnson', progress: 85, grade: 'B+' },
                    { name: 'Physics', teacher: 'Prof. Michael Chen', progress: 78, grade: 'B' }
                  ]
                },
                {
                  name: 'Emma Thompson',
                  age: 14,
                  grade: '8th Grade',
                  image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                  subjects: [
                    { name: 'Algebra', teacher: 'Ms. Rodriguez', progress: 92, grade: 'A-' },
                    { name: 'English', teacher: 'Mr. Wilson', progress: 88, grade: 'B+' }
                  ]
                }
              ].map((child, childIndex) => (
                <div key={childIndex} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={child.image}
                      alt={child.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{child.name}</h3>
                      <p className="text-slate-600">{child.grade} • Age {child.age}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">Excellent Student</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {child.subjects.map((subject, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-sm">{subject.name}</h5>
                            <p className="text-xs text-slate-600">with {subject.teacher}</p>
                          </div>
                          <Badge variant="secondary">{subject.grade}</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{subject.progress}%</span>
                          </div>
                          <Progress value={subject.progress} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Upcoming Sessions</h3>
            <div className="space-y-3">
              {[
                { time: 'Today 3:00 PM', student: 'Alex', teacher: 'Dr. Sarah Johnson', subject: 'Mathematics' },
                { time: 'Today 5:00 PM', student: 'Emma', teacher: 'Ms. Rodriguez', subject: 'Algebra' },
                { time: 'Tomorrow 10:00 AM', student: 'Alex', teacher: 'Prof. Michael Chen', subject: 'Physics' },
                { time: 'Wed 2:00 PM', student: 'Emma', teacher: 'Mr. Wilson', subject: 'English' }
              ].map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-purple-900 text-sm">{session.time}</p>
                    <p className="text-sm text-purple-700">{session.student} - {session.teacher}</p>
                    <p className="text-xs text-purple-600">{session.subject}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { activity: 'Assignment submitted', student: 'Alex', subject: 'Mathematics', time: '2 hours ago' },
                { activity: 'Session completed', student: 'Emma', subject: 'Algebra', time: '3 hours ago' },
                { activity: 'Grade updated', student: 'Alex', subject: 'Physics', time: '1 day ago' },
                { activity: 'Session completed', student: 'Emma', subject: 'English', time: '1 day ago' }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.activity}</p>
                    <p className="text-xs text-slate-600">{item.student} • {item.subject} • {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Summary */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">This Month Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Sessions</span>
                <span className="font-medium">16</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Study Hours</span>
                <span className="font-medium">24h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Assignments</span>
                <span className="font-medium">12/14 completed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Average Grades</span>
                <span className="font-medium">B+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Amount Spent</span>
                <span className="font-medium">$485</span>
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
              {[
                { from: 'Dr. Sarah Johnson', message: 'Alex is doing excellent work in calculus!', time: '1h ago' },
                { from: 'Ms. Rodriguez', message: 'Emma submitted her algebra homework early', time: '2h ago' },
                { from: 'Prof. Michael Chen', message: 'Lab report feedback sent for Alex', time: '1d ago' }
              ].map((message, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{message.from}</span>
                    <span className="text-xs text-slate-500">{message.time}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{message.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Floating AI Assistant Button */}
      <FloatingAIButton />
    </div>
  );
}