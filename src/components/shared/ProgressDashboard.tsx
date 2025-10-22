import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Calendar, Clock, BookOpen, FileText, TrendingUp, Users, Award, Target } from 'lucide-react';
import { ProgressService, StudentProgress, TeacherProgress, ClassProgress } from '../../services/progressService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../App';

interface ProgressDashboardProps {
  role: UserRole;
  onBack?: () => void;
}

export function ProgressDashboard({ role, onBack }: ProgressDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [teacherProgress, setTeacherProgress] = useState<TeacherProgress | null>(null);
  const [classProgress, setClassProgress] = useState<ClassProgress | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProgress();
    }
  }, [user?.id, role]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      
      if (role === 'student') {
        const progress = await ProgressService.getStudentProgress(user!.id);
        setStudentProgress(progress);
      } else if (role === 'teacher') {
        const progress = await ProgressService.getTeacherProgress(user!.id);
        setTeacherProgress(progress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  const renderStudentProgress = () => {
    if (!studentProgress) return null;

    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Classes</p>
                  <p className="text-2xl font-semibold">{studentProgress.overallStats.activeClasses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Study Hours</p>
                  <p className="text-2xl font-semibold">{studentProgress.overallStats.totalStudyHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assignments</p>
                  <p className="text-2xl font-semibold">{studentProgress.overallStats.assignmentsSubmitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Grade</p>
                  <p className="text-2xl font-semibold">
                    {studentProgress.overallStats.averageGrade ? 
                      Math.round(studentProgress.overallStats.averageGrade) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Progress</CardTitle>
            <CardDescription>Your progress across different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentProgress.subjectProgress.map((subject) => (
                <div key={subject.subjectId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{subject.subjectName}</h4>
                    <div className="flex items-center space-x-2">
                      {subject.averageGrade && (
                        <Badge variant="secondary">
                          Grade: {Math.round(subject.averageGrade)}
                        </Badge>
                      )}
                      <Badge>
                        {subject.studyHours}h studied
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>Classes: {subject.classesCount}</div>
                    <div>Sessions: {subject.sessionsCompleted}</div>
                    <div>Assignments: {subject.assignmentsCount}</div>
                  </div>
                  {subject.lastActivity && (
                    <p className="text-xs text-gray-500">
                      Last activity: {new Date(subject.lastActivity).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentProgress.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.type === 'session' && <Clock className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'assignment' && <FileText className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'grade' && <Award className="w-5 h-5 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">
                      {activity.subject} • {new Date(activity.date).toLocaleDateString()}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-500">{activity.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTeacherProgress = () => {
    if (!teacherProgress) return null;

    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-semibold">{teacherProgress.overallStats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Teaching Hours</p>
                  <p className="text-2xl font-semibold">{teacherProgress.overallStats.totalTeachingHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assignments</p>
                  <p className="text-2xl font-semibold">{teacherProgress.overallStats.assignmentsGraded}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-semibold">${teacherProgress.overallStats.totalEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Performance overview of your students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teacherProgress.studentStats.map((student) => (
                <div key={student.studentId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{student.studentName}</h4>
                    <div className="flex items-center space-x-2">
                      {student.averageGrade && (
                        <Badge variant="secondary">
                          Avg: {Math.round(student.averageGrade)}
                        </Badge>
                      )}
                      <Badge>
                        {student.studyHours}h
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>Classes: {student.classesCount}</div>
                    <div>Sessions: {student.sessionsCompleted}</div>
                    <div>Assignments: {student.assignmentsSubmitted}</div>
                    <div>Study Time: {student.studyHours}h</div>
                  </div>
                  {student.lastActivity && (
                    <p className="text-xs text-gray-500">
                      Last activity: {new Date(student.lastActivity).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest teaching activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teacherProgress.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.type === 'session' && <Clock className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'assignment' && <FileText className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'grade' && <Award className="w-5 h-5 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">
                      {activity.student} • {new Date(activity.date).toLocaleDateString()}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-500">{activity.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Tasks that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teacherProgress.upcomingSessions.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">
                    {teacherProgress.upcomingSessions.length} Upcoming Sessions
                  </p>
                  <p className="text-sm text-blue-700">Review and prepare for upcoming sessions</p>
                </div>
              )}
              {teacherProgress.pendingGrading.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-900">
                    {teacherProgress.pendingGrading.length} Assignments to Grade
                  </p>
                  <p className="text-sm text-yellow-700">Grade submitted assignments</p>
                </div>
              )}
              {teacherProgress.upcomingSessions.length === 0 && teacherProgress.pendingGrading.length === 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900">All caught up!</p>
                  <p className="text-sm text-green-700">No pending tasks at the moment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {role === 'student' ? 'Learning Progress' : 'Teaching Analytics'}
            </h1>
            <p className="text-gray-600">
              {role === 'student' 
                ? 'Track your learning journey and achievements' 
                : 'Monitor your teaching performance and student progress'
              }
            </p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Back to Dashboard
            </Button>
          )}
        </div>

        {/* Progress Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {role === 'student' ? renderStudentProgress() : renderTeacherProgress()}
          </TabsContent>

          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>
                  {role === 'student' 
                    ? 'Comprehensive view of your learning progress' 
                    : 'Detailed teaching analytics and insights'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Analytics Coming Soon</h3>
                  <p className="text-gray-600">
                    Advanced analytics and detailed progress tracking will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}






