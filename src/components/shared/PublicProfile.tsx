import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, GraduationCap, DollarSign, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

interface StudentData {
  education_system_id?: string;
  education_level_id?: string;
  school_name?: string;
  interests: string[];
  preferred_languages: string[];
}

interface EducationSystem {
  id: string;
  name: string;
  description?: string;
}

interface EducationLevel {
  id: string;
  level_name: string;
  description?: string;
}

interface TeacherData {
  hourly_rate: number;
  currency: string;
  subjects: string[];
  specialties: string[];
  education: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  total_students: number;
  is_available: boolean;
}

interface PublicProfileProps {
  onScreenChange?: (screen: string) => void;
}

export function PublicProfile({ onScreenChange }: PublicProfileProps) {
  const { profile, user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [educationSystem, setEducationSystem] = useState<EducationSystem | null>(null);
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchRoleSpecificData();
    }
  }, [user, profile]);

  const fetchRoleSpecificData = async () => {
    if (!user || !profile) return;

    try {
      if (profile.role === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setStudentData(data);
          
          // Fetch education system and level if they exist
          if (data.education_system_id) {
            const { data: systemData } = await supabase
              .from('education_systems')
              .select('*')
              .eq('id', data.education_system_id)
              .single();
            setEducationSystem(systemData);
          }
          
          if (data.education_level_id) {
            const { data: levelData } = await supabase
              .from('education_levels')
              .select('*')
              .eq('id', data.education_level_id)
              .single();
            setEducationLevel(levelData);
          }
        }
      } else if (profile.role === 'teacher') {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setTeacherData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching role-specific data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGradeLevelLabel = (gradeLevel: string) => {
    const levels: { [key: string]: string } = {
      'elementary': 'Elementary (K-5)',
      'middle': 'Middle School (6-8)',
      'high': 'High School (9-12)',
      'college': 'College',
      'adult': 'Adult Learning'
    };
    return levels[gradeLevel] || gradeLevel;
  };

  const getLearningStyleLabel = (style: string) => {
    const styles: { [key: string]: string } = {
      'visual': 'Visual Learner',
      'auditory': 'Auditory Learner',
      'kinesthetic': 'Kinesthetic Learner',
      'reading': 'Reading/Writing Learner',
      'mixed': 'Mixed Learning Style'
    };
    return styles[style] || style;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profile?.full_name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={profile?.role === 'student' ? 'default' : 'secondary'}>
                  {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                </Badge>
                {profile?.is_verified && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <Mail className="h-4 w-4" />
                <span>{profile?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center space-x-2 text-slate-600">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center space-x-2 text-slate-600">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.date_of_birth && (
                <div className="flex items-center space-x-2 text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(profile.date_of_birth)}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {profile?.bio && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">About</h4>
                  <p className="text-slate-600 text-sm">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      {profile?.role === 'student' && studentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Student Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Education System</h4>
                  {educationSystem && educationLevel ? (
                    <div className="space-y-2">
                      <Badge variant="outline">{educationSystem.name}</Badge>
                      <p className="text-sm text-slate-600">{educationLevel.level_name}</p>
                      {studentData.school_name && (
                        <p className="text-sm text-slate-600">{studentData.school_name}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Education information not available</p>
                  )}
                </div>
                {studentData.preferred_languages && studentData.preferred_languages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Preferred Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {studentData.preferred_languages.map((language, index) => (
                        <Badge key={index} variant="outline">{language.toUpperCase()}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {studentData.interests && studentData.interests.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {studentData.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profile?.role === 'teacher' && teacherData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Teacher Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Experience & Rate</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">{teacherData.experience_years} years</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">${teacherData.hourly_rate}/hour</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Rating & Reviews</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{teacherData.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-slate-600">({teacherData.total_reviews} reviews)</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{teacherData.total_students} students taught</p>
                </div>
              </div>
              <div className="space-y-4">
                {teacherData.subjects.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Subjects</h4>
                    <div className="flex flex-wrap gap-2">
                      {teacherData.subjects.map((subject, index) => (
                        <Badge key={index} variant="secondary">{subject}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {teacherData.specialties.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {teacherData.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline">{specialty}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <Button 
              variant="outline"
              onClick={() => {
                if (onScreenChange) {
                  onScreenChange('settings');
                }
              }}
            >
              Edit Profile
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (onScreenChange) {
                  onScreenChange('settings');
                }
              }}
            >
              Privacy Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
