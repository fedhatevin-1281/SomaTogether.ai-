import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Star, MapPin, Clock, MessageSquare, BookOpen, Award, Users, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface StudentProfileViewProps {
  student: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    grade_level?: string;
    learning_goals?: string[];
    interests?: string[];
    learning_style?: string;
    wallet_balance?: number;
    tokens?: number;
    created_at: string;
    // Additional profile data
    subjects?: string[];
    languages?: string[];
    achievements?: any[];
    parent_info?: any;
  };
  onBack: () => void;
  onMessageStudent: () => void;
  onBookSession: () => void;
}

export function StudentProfileView({ 
  student, 
  onBack, 
  onMessageStudent, 
  onBookSession 
}: StudentProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedAssignments: 0,
    averageGrade: 'N/A',
    studyHours: 0,
    streak: 0
  });

  useEffect(() => {
    if (student?.id) {
      fetchStudentData();
    }
  }, [student?.id]);

  const fetchStudentData = async () => {
    if (!student?.id) return;

    try {
      setLoading(true);
      
      // Fetch class sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('student_id', student.id);

      // Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', student.id);

      // Calculate stats
      const totalSessions = sessions?.length || 0;
      const completedAssignments = assignments?.filter(a => a.status === 'graded').length || 0;
      const averageGrade = calculateAverageGrade(assignments || []);
      const studyHours = totalSessions * 1; // Assuming 1 hour per session
      const streak = calculateStreak(sessions || []);

      setStats({
        totalSessions,
        completedAssignments,
        averageGrade,
        studyHours,
        streak
      });

      // For now, we'll use empty achievements array
      // In the future, this could be fetched from an achievements table
      setAchievements([]);

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageGrade = (assignments: any[]) => {
    const gradedAssignments = assignments.filter(a => a.grade && a.status === 'graded');
    if (gradedAssignments.length === 0) return 'N/A';
    
    const totalPoints = gradedAssignments.reduce((sum, a) => sum + (a.points_earned || 0), 0);
    const maxPoints = gradedAssignments.reduce((sum, a) => sum + (a.max_points || 100), 0);
    const percentage = (totalPoints / maxPoints) * 100;
    
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const calculateStreak = (sessions: any[]) => {
    // Simple streak calculation - in a real app, this would be more sophisticated
    return Math.min(sessions.length, 7);
  };

  if (!student) {
    return (
      <div className="text-center p-6">
        <p>No student data available</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-6">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading student data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          ←
        </Button>
        <h1 className="text-2xl font-bold">Student Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-start space-x-6">
              <div className="relative">
                <img
                  src={student.avatar_url || '/default-avatar.png'}
                  alt={student.full_name}
                  className="w-24 h-24 rounded-full object-cover bg-slate-200"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{student.full_name}</h2>
                    <p className="text-lg text-slate-600 mb-2">
                      {student.grade_level || 'Student'}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{student.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Member since {new Date(student.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{student.tokens || 0}</div>
                    <div className="text-sm text-slate-500">tokens</div>
                  </div>
                </div>
                
                {student.bio && (
                  <div className="mb-4">
                    <p className="text-slate-700">{student.bio}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button className="bg-blue-500 hover:bg-blue-600" onClick={onMessageStudent}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" onClick={onBookSession}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Send request
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Learning Goals */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                    Learning Goals
                  </h3>
                  {student.learning_goals && student.learning_goals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {student.learning_goals.map((goal, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No learning goals specified</p>
                  )}
                </Card>

                {/* Interests */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-purple-500" />
                    Interests
                  </h3>
                  {student.interests && student.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {student.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No interests specified</p>
                  )}
                </Card>

                {/* Learning Style */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-green-500" />
                    Learning Style
                  </h3>
                  <p className="text-slate-700">
                    {student.learning_style || 'Not specified'}
                  </p>
                </Card>

                {/* Grade Level */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-yellow-500" />
                    Grade Level
                  </h3>
                  <p className="text-slate-700">
                    {student.grade_level || 'Not specified'}
                  </p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Subject Interests</h3>
                {student.subjects && student.subjects.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {student.subjects.map((subject, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-slate-50">
                        <h4 className="font-medium">{subject}</h4>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No subjects specified</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Learning Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
                    <div className="text-sm text-slate-600">Total Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.completedAssignments}</div>
                    <div className="text-sm text-slate-600">Assignments</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.averageGrade}</div>
                    <div className="text-sm text-slate-600">Average Grade</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.studyHours}h</div>
                    <div className="text-sm text-slate-600">Study Hours</div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Achievements & Awards</h3>
                <div className="space-y-4">
                  {achievements.length > 0 ? achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Award className="h-6 w-6 text-yellow-500 mt-1" />
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-slate-600">{achievement.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{achievement.date}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-500">
                      <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No achievements yet</p>
                      <p className="text-sm">Achievements will appear here as you progress</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Study Streak</span>
                <span className="font-medium">{stats.streak} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Wallet Balance</span>
                <span className="font-medium">${student.wallet_balance || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Available Tokens</span>
                <span className="font-medium">{student.tokens || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Learning Style</span>
                <span className="font-medium">{student.learning_style || 'Not set'}</span>
              </div>
            </div>
          </Card>

          {/* Contact Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Connect</h3>
            <div className="space-y-3">
              <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={onMessageStudent}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full" onClick={onBookSession}>
                <Calendar className="h-4 w-4 mr-2" />
                Send request
              </Button>
              <p className="text-xs text-slate-500 text-center">
                Start a conversation to learn more about this student's needs.
              </p>
            </div>
          </Card>

          {/* Parent Info (if available) */}
          {student.parent_info && (
            <Card className="p-6">
              <h3 className="font-bold mb-4">Parent Contact</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {student.parent_info.name}</p>
                <p><strong>Email:</strong> {student.parent_info.email}</p>
                <p><strong>Phone:</strong> {student.parent_info.phone}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

