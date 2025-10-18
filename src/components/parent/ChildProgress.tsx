import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ArrowLeft, TrendingUp, Star, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ParentService, { ChildProgress as ChildProgressData } from '../../services/parentService';

interface ChildProgressProps {
  onBack?: () => void;
}

export function ChildProgress({ onBack }: ChildProgressProps) {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childProgress, setChildProgress] = useState<ChildProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChildren = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const childrenData = await ParentService.getChildren(user.id);
        setChildren(childrenData);
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0].id);
        }
      } catch (err) {
        console.error('Error loading children:', err);
        setError('Failed to load children data');
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, [user]);

  useEffect(() => {
    const loadChildProgress = async () => {
      if (!selectedChild) return;
      
      try {
        const progress = await ParentService.getChildProgress(selectedChild);
        setChildProgress(progress);
      } catch (err) {
        console.error('Error loading child progress:', err);
        setError('Failed to load child progress');
      }
    };

    loadChildProgress();
  }, [selectedChild]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading progress data...</span>
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

  if (children.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No children registered yet</p>
        <p className="text-sm text-gray-500 mt-2">Contact support to add your children to the platform</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Children's Progress</h1>
          <p className="text-slate-600">Detailed view of your children's learning journey</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800">{children.length} Active Students</Badge>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Select Child</h3>
          <div className="flex space-x-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChild === child.id ? "default" : "outline"}
                onClick={() => setSelectedChild(child.id)}
                className="flex items-center space-x-2"
              >
                <img
                  src={child.avatar_url || '/default-avatar.png'}
                  alt={child.full_name}
                  className="w-6 h-6 rounded-full"
                />
                <span>{child.full_name}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Child Overview */}
      {childProgress && (
        <Card className="p-6">
          <div className="flex items-center space-x-6 mb-6">
            <img
              src={children.find(c => c.id === selectedChild)?.avatar_url || '/default-avatar.png'}
              alt={childProgress.child_name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold">{childProgress.child_name}</h2>
              <p className="text-slate-600">
                {children.find(c => c.id === selectedChild)?.grade_level || 'Student'} • 
                {children.find(c => c.id === selectedChild)?.education_level?.level_name || 'Level'}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className="bg-green-100 text-green-800">Active Student</Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">Overall: {childProgress.average_grade} Average</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{childProgress.overall_progress}%</p>
              <p className="text-sm text-slate-600">Overall Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{childProgress.completed_sessions}</p>
              <p className="text-sm text-slate-600">Sessions Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{childProgress.total_study_hours}h</p>
              <p className="text-sm text-slate-600">Total Study Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{childProgress.assignment_completion_rate}%</p>
              <p className="text-sm text-slate-600">Assignment Rate</p>
            </div>
          </div>
        </Card>
      )}

      {/* Subject Progress */}
      {childProgress && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {childProgress.subjects.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600">No active subjects yet</p>
              <p className="text-sm text-gray-500 mt-2">Subjects will appear here when your child starts classes</p>
            </div>
          ) : (
            childProgress.subjects.map((subject, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold">{subject.subject_name}</h3>
                    <p className="text-sm text-slate-600">{subject.teacher_name}</p>
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
                      <p className="font-medium">{subject.sessions_completed}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Next Session</p>
                      <p className="font-medium text-xs">{subject.next_session || 'Not scheduled'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Recent Activity & Performance */}
      {childProgress && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {childProgress.recent_activity.length === 0 ? (
                <p className="text-gray-600 text-sm">No recent activity</p>
              ) : (
                childProgress.recent_activity.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-slate-600">{item.subject} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    {item.grade && (
                      <Badge variant="outline" className="text-xs">
                        {item.grade}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Performance Trends</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Study Consistency</span>
                  <span className="text-green-600">
                    {childProgress.overall_progress > 80 ? 'Excellent' : childProgress.overall_progress > 60 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
                <Progress value={childProgress.overall_progress} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Assignment Completion</span>
                  <span className="text-blue-600">{childProgress.assignment_completion_rate}%</span>
                </div>
                <Progress value={childProgress.assignment_completion_rate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Session Attendance</span>
                  <span className="text-purple-600">
                    {childProgress.total_sessions > 0 ? Math.round((childProgress.completed_sessions / childProgress.total_sessions) * 100) : 0}%
                  </span>
                </div>
                <Progress value={childProgress.total_sessions > 0 ? (childProgress.completed_sessions / childProgress.total_sessions) * 100 : 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Performance</span>
                  <span className="text-yellow-600">{childProgress.average_grade}</span>
                </div>
                <Progress value={childProgress.overall_progress} className="h-2" />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}