import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ArrowLeft, TrendingUp, Star, Calendar, BookOpen } from 'lucide-react';

interface ChildProgressProps {
  onBack?: () => void;
}

export function ChildProgress({ onBack }: ChildProgressProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Children's Progress</h1>
          <p className="text-slate-600">Detailed view of your children's learning journey</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800">2 Active Students</Badge>
      </div>

      {/* Child Overview */}
      <Card className="p-6">
        <div className="flex items-center space-x-6 mb-6">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
            alt="Alex"
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold">Alex Thompson</h2>
            <p className="text-slate-600">Grade 11 • Age 16</p>
            <div className="flex items-center space-x-4 mt-2">
              <Badge className="bg-green-100 text-green-800">Excellent Student</Badge>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">Overall: B+ Average</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">87%</p>
            <p className="text-sm text-slate-600">Overall Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">24</p>
            <p className="text-sm text-slate-600">Sessions Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">36h</p>
            <p className="text-sm text-slate-600">Total Study Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">94%</p>
            <p className="text-sm text-slate-600">Assignment Rate</p>
          </div>
        </div>
      </Card>

      {/* Subject Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          {
            subject: 'Advanced Mathematics',
            teacher: 'Dr. Sarah Johnson',
            progress: 85,
            grade: 'B+',
            sessions: 12,
            nextSession: 'Today 3:00 PM',
            improvement: '+23%',
            color: 'blue'
          },
          {
            subject: 'Physics Fundamentals',
            teacher: 'Prof. Michael Chen',
            progress: 78,
            grade: 'B',
            sessions: 8,
            nextSession: 'Tomorrow 10:00 AM',
            improvement: '+15%',
            color: 'green'
          },
          {
            subject: 'English Literature',
            teacher: 'Ms. Emily Davis',
            progress: 92,
            grade: 'A-',
            sessions: 10,
            nextSession: 'Wed 2:00 PM',
            improvement: '+18%',
            color: 'purple'
          }
        ].map((subject, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">{subject.subject}</h3>
                <p className="text-sm text-slate-600">{subject.teacher}</p>
              </div>
              <Badge variant="secondary">{subject.grade}</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="text-green-600">{subject.improvement}</span>
                </div>
                <Progress value={subject.progress} className="h-2" />
                <p className="text-xs text-slate-500 mt-1">{subject.progress}% complete</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Sessions</p>
                  <p className="font-medium">{subject.sessions}</p>
                </div>
                <div>
                  <p className="text-slate-600">Next Session</p>
                  <p className="font-medium text-xs">{subject.nextSession}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { activity: 'Completed Calculus Assignment #5', subject: 'Mathematics', grade: 'A-', time: '2 hours ago' },
              { activity: 'Attended Physics Lab Session', subject: 'Physics', grade: 'B+', time: '1 day ago' },
              { activity: 'Submitted Hamlet Essay', subject: 'Literature', grade: 'A', time: '2 days ago' },
              { activity: 'Quiz: Derivatives', subject: 'Mathematics', grade: 'B+', time: '3 days ago' }
            ].map((item, index) => (
              <div key={index} className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.activity}</p>
                  <p className="text-xs text-slate-600">{item.subject} • {item.time}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.grade}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Study Consistency</span>
                <span className="text-green-600">Excellent</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Assignment Completion</span>
                <span className="text-blue-600">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Session Attendance</span>
                <span className="text-purple-600">100%</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Teacher Feedback</span>
                <span className="text-yellow-600">Positive</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}