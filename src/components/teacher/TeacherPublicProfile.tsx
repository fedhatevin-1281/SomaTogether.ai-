import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  BookOpen, 
  GraduationCap, 
  Clock, 
  DollarSign,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Globe,
  Award,
  Users,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

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
  total_sessions: number;
  max_students: number;
  is_available: boolean;
  verification_status: string;
  verification_documents: string[];
  zoom_connected: boolean;
  zoom_email?: string;
}

interface EducationSystem {
  id: string;
  name: string;
  description?: string;
}

interface Subject {
  id: string;
  name: string;
  category: string;
}

interface TeacherOnboardingData {
  max_children: number;
  preferred_language: string;
  preferred_curriculums: EducationSystem[];
  preferred_subjects: Subject[];
  availability: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
  }>;
}

interface RecentReview {
  id: string;
  rating: number;
  comment: string;
  student_name: string;
  created_at: string;
}

export function TeacherPublicProfile() {
  const { user, profile } = useAuth();
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [onboardingData, setOnboardingData] = useState<TeacherOnboardingData | null>(null);
  const [educationSystems, setEducationSystems] = useState<EducationSystem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    bio: '',
    phone: '',
    location: '',
    hourly_rate: 0,
    specialties: [] as string[],
    education: [] as string[],
    max_students: 20,
    is_available: true,
  });

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      loadTeacherData();
    }
  }, [user, profile]);

  const loadTeacherData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load basic teacher data
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (teacherError) {
        console.error('Error fetching teacher data:', teacherError);
      } else {
        setTeacherData(teacherData);
        setEditForm({
          bio: profile?.bio || '',
          phone: profile?.phone || '',
          location: profile?.location || '',
          hourly_rate: teacherData?.hourly_rate || 0,
          specialties: teacherData?.specialties || [],
          education: teacherData?.education || [],
          max_students: teacherData?.max_students || 20,
          is_available: teacherData?.is_available ?? true,
        });
      }

      // Load onboarding data
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('teacher_onboarding_responses')
        .select(`
          *,
          teacher_preferred_curriculums(
            education_systems(id, name, description)
          ),
          teacher_preferred_subjects(
            subjects(id, name, category)
          ),
          teacher_onboarding_availability(*)
        `)
        .eq('teacher_id', user.id)
        .single();

      if (!onboardingError && onboardingData) {
        setOnboardingData({
          max_children: onboardingData.max_children,
          preferred_language: onboardingData.preferred_language,
          preferred_curriculums: onboardingData.teacher_preferred_curriculums?.map((item: any) => item.education_systems) || [],
          preferred_subjects: onboardingData.teacher_preferred_subjects?.map((item: any) => item.subjects) || [],
          availability: onboardingData.teacher_onboarding_availability || [],
        });
      }

      // Load education systems and subjects
      const [systemsResponse, subjectsResponse] = await Promise.all([
        supabase.from('education_systems').select('*').eq('is_active', true),
        supabase.from('subjects').select('*').eq('is_active', true)
      ]);

      if (systemsResponse.data) setEducationSystems(systemsResponse.data);
      if (subjectsResponse.data) setSubjects(subjectsResponse.data);

      // Load recent reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          students!inner(
            profiles!inner(full_name)
          )
        `)
        .eq('teacher_id', user.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!reviewsError && reviewsData) {
        setRecentReviews(reviewsData.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          student_name: review.students?.profiles?.full_name || 'Anonymous',
          created_at: review.created_at,
        })));
      }

    } catch (err) {
      console.error('Error loading teacher data:', err);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setSaveMessage(null);

      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          bio: editForm.bio,
          phone: editForm.phone,
          location: editForm.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Update teacher data
      const { error: teacherError } = await supabase
        .from('teachers')
        .update({
          hourly_rate: editForm.hourly_rate,
          specialties: editForm.specialties,
          education: editForm.education,
          max_students: editForm.max_students,
          is_available: editForm.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (teacherError) {
        console.error('Error updating teacher data:', teacherError);
        throw teacherError;
      }

      setSaveMessage({ type: 'success', message: 'Profile updated successfully!' });
      setEditing(false);
      await loadTeacherData(); // Reload data

    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveMessage({ type: 'error', message: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveMessage(null);
    // Reset form to original data
    if (teacherData && profile) {
      setEditForm({
        bio: profile.bio || '',
        phone: profile.phone || '',
        location: profile.location || '',
        hourly_rate: teacherData.hourly_rate || 0,
        specialties: teacherData.specialties || [],
        education: teacherData.education || [],
        max_students: teacherData.max_students || 20,
        is_available: teacherData.is_available ?? true,
      });
    }
  };

  const addSpecialty = (specialty: string) => {
    if (specialty && !editForm.specialties.includes(specialty)) {
      setEditForm(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    }
  };

  const removeSpecialty = (specialty: string) => {
    setEditForm(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const addEducation = (education: string) => {
    if (education && !editForm.education.includes(education)) {
      setEditForm(prev => ({
        ...prev,
        education: [...prev.education, education]
      }));
    }
  };

  const removeEducation = (education: string) => {
    setEditForm(prev => ({
      ...prev,
      education: prev.education.filter(e => e !== education)
    }));
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Profile</h1>
            <p className="text-gray-600">Manage your teaching profile and information</p>
          </div>
          <div className="flex space-x-2">
            {editing ? (
              <>
                <Button onClick={handleCancel} variant="outline" disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Save Message */}
        {saveMessage && (
          <Alert className={saveMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {saveMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {saveMessage.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-2xl font-bold">
                      {profile?.full_name?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                    <p className="text-gray-600">{profile?.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getStatusColor(teacherData?.verification_status || 'pending')}>
                        {teacherData?.verification_status || 'pending'}
                      </Badge>
                      {teacherData?.is_available ? (
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Not Available</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center mt-1">
                        <Phone className="h-4 w-4 mr-2" />
                        {profile?.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    {editing ? (
                      <Input
                        id="location"
                        value={editForm.location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter location"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-2" />
                        {profile?.location || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {editing ? (
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell students about yourself..."
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">
                      {profile?.bio || 'No bio provided yet.'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Teaching Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Teaching Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate</Label>
                    {editing ? (
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={editForm.hourly_rate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center mt-1">
                        <DollarSign className="h-4 w-4 mr-2" />
                        {formatCurrency(teacherData?.hourly_rate || 0, teacherData?.currency)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="max_students">Max Students</Label>
                    {editing ? (
                      <Input
                        id="max_students"
                        type="number"
                        value={editForm.max_students}
                        onChange={(e) => setEditForm(prev => ({ ...prev, max_students: parseInt(e.target.value) || 1 }))}
                        placeholder="20"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center mt-1">
                        <Users className="h-4 w-4 mr-2" />
                        {teacherData?.max_students || 20} students
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Specialties</Label>
                  {editing ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Add a specialty..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSpecialty(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        {editForm.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="flex items-center space-x-1">
                            <span>{specialty}</span>
                            <button
                              type="button"
                              onClick={() => removeSpecialty(specialty)}
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {teacherData?.specialties?.length ? (
                        teacherData.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">{specialty}</Badge>
                        ))
                      ) : (
                        <p className="text-gray-500">No specialties added yet</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Education Background</Label>
                  {editing ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Add education background..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEducation(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        {editForm.education.map((education) => (
                          <Badge key={education} variant="secondary" className="flex items-center space-x-1">
                            <span>{education}</span>
                            <button
                              type="button"
                              onClick={() => removeEducation(education)}
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {teacherData?.education?.length ? (
                        teacherData.education.map((education) => (
                          <Badge key={education} variant="secondary">{education}</Badge>
                        ))
                      ) : (
                        <p className="text-gray-500">No education background added yet</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preferred Subjects and Curriculums */}
            {onboardingData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Teaching Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Preferred Curriculums</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {onboardingData.preferred_curriculums.map((curriculum) => (
                        <Badge key={curriculum.id} variant="outline">
                          {curriculum.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Subjects</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {onboardingData.preferred_subjects.map((subject) => (
                        <Badge key={subject.id} variant="outline">
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Availability</Label>
                    <div className="space-y-2 mt-1">
                      {onboardingData.availability.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{getDayName(slot.day_of_week)}</span>
                          <span>{slot.start_time} - {slot.end_time}</span>
                          <Badge variant="outline" className="text-xs">{slot.timezone}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Teaching Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Rating</span>
                  </div>
                  <span className="font-bold">{teacherData?.rating?.toFixed(1) || '0.0'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Reviews</span>
                  </div>
                  <span className="font-bold">{teacherData?.total_reviews || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Students</span>
                  </div>
                  <span className="font-bold">{teacherData?.total_students || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600">Sessions</span>
                  </div>
                  <span className="font-bold">{teacherData?.total_sessions || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-orange-500 mr-2" />
                    <span className="text-sm text-gray-600">Experience</span>
                  </div>
                  <span className="font-bold">{teacherData?.experience_years || 0} years</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Recent Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentReviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div key={review.id} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{review.student_name}</span>
                        </div>
                        <p className="text-sm text-gray-600">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Zoom Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Zoom Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {teacherData?.zoom_connected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Not Connected</span>
                    </>
                  )}
                </div>
                {teacherData?.zoom_connected && teacherData?.zoom_email && (
                  <p className="text-xs text-gray-500 mt-1">{teacherData.zoom_email}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

