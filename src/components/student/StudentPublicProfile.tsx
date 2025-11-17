import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Star, MapPin, Clock, BookOpen, Award, Users, Calendar, Edit, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { AppScreen } from '../../App';

interface StudentPublicProfileProps {
  onBack: () => void;
  onScreenChange: (screen: AppScreen) => void;
}

interface StudentData {
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
}

export function StudentPublicProfile({ onBack, onScreenChange }: StudentPublicProfileProps) {
  const { user, profile } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch student data with profile information
      const { data: studentInfo, error } = await supabase
        .from('students')
        .select(`
          id,
          grade_level,
          learning_goals,
          interests,
          learning_style,
          wallet_balance,
          tokens,
          profiles!students_id_fkey (
            id,
            full_name,
            email,
            avatar_url,
            bio,
            location,
            created_at
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching student data:', error);
        return;
      }

      // Transform the data
      if (studentInfo && studentInfo.profiles) {
        setStudentData({
          id: studentInfo.id,
          full_name: studentInfo.profiles.full_name,
          email: studentInfo.profiles.email,
          avatar_url: studentInfo.profiles.avatar_url,
          bio: studentInfo.profiles.bio,
          location: studentInfo.profiles.location,
          grade_level: studentInfo.grade_level,
          learning_goals: studentInfo.learning_goals || [],
          interests: studentInfo.interests || [],
          learning_style: studentInfo.learning_style,
          wallet_balance: studentInfo.wallet_balance,
          tokens: studentInfo.tokens,
          created_at: studentInfo.profiles.created_at,
        });
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
        <Card className="p-12 text-center">
          <p className="text-slate-600">Unable to load profile data. Please try again later.</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </Card>
      </div>
    );
  }

  const mockAchievements = [
    { id: 1, title: 'Mathematics Excellence', description: 'Top 10% in Algebra', date: '2024-01-15' },
    { id: 2, title: 'Language Learning', description: 'Completed French Level 2', date: '2024-01-10' },
    { id: 3, title: 'Science Project', description: 'First place in Chemistry Fair', date: '2023-12-20' },
  ];

  const mockStats = {
    totalSessions: 24,
    completedAssignments: 18,
    averageGrade: 'A-',
    studyHours: 120,
    streak: 7
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onScreenChange('settings')}
          className="ml-auto"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-start space-x-6">
              <div className="relative">
                <img
                  src={studentData.avatar_url || '/default-avatar.png'}
                  alt={studentData.full_name}
                  className="w-24 h-24 rounded-full object-cover bg-slate-200"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{studentData.full_name}</h2>
                    <p className="text-lg text-slate-600 mb-2">
                      {studentData.grade_level || 'Student'}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{studentData.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Member since {new Date(studentData.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{studentData.tokens || 0}</div>
                    <div className="text-sm text-slate-500">tokens</div>
                  </div>
                </div>
                
                {studentData.bio && (
                  <div className="mb-4">
                    <p className="text-slate-700">{studentData.bio}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => onScreenChange('wallet')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage Wallet
                  </Button>
                  <Button variant="outline" onClick={() => onScreenChange('settings')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
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
                  {studentData.learning_goals && studentData.learning_goals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {studentData.learning_goals.map((goal, index) => (
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
                  {studentData.interests && studentData.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {studentData.interests.map((interest, index) => (
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
                    {studentData.learning_style || 'Not specified'}
                  </p>
                </Card>

                {/* Grade Level */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-yellow-500" />
                    Grade Level
                  </h3>
                  <p className="text-slate-700">
                    {studentData.grade_level || 'Not specified'}
                  </p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Subject Interests</h3>
                {studentData.learning_goals && studentData.learning_goals.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {studentData.learning_goals.map((subject, index) => (
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
                    <div className="text-2xl font-bold text-blue-600">{mockStats.totalSessions}</div>
                    <div className="text-sm text-slate-600">Total Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{mockStats.completedAssignments}</div>
                    <div className="text-sm text-slate-600">Assignments</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{mockStats.averageGrade}</div>
                    <div className="text-sm text-slate-600">Average Grade</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{mockStats.studyHours}h</div>
                    <div className="text-sm text-slate-600">Study Hours</div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Achievements & Awards</h3>
                <div className="space-y-4">
                  {mockAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Award className="h-6 w-6 text-yellow-500 mt-1" />
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-slate-600">{achievement.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
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
                <span className="font-medium">{mockStats.streak} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Wallet Balance</span>
                <span className="font-medium">${studentData.wallet_balance || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Available Tokens</span>
                <span className="font-medium">{studentData.tokens || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Learning Style</span>
                <span className="font-medium">{studentData.learning_style || 'Not set'}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600" 
                onClick={() => onScreenChange('teacher-browse')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Find Teachers
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onScreenChange('wallet')}
              >
                <Star className="h-4 w-4 mr-2" />
                Manage Wallet
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onScreenChange('student-classes')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Classes
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

