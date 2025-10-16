import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Award, 
  MessageCircle, 
  BookOpen, 
  DollarSign, 
  Globe, 
  CheckCircle, 
  Calendar,
  Video,
  Phone,
  Mail,
  ExternalLink,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  GraduationCap,
  Briefcase,
  Languages,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import TeacherBrowseService, { TeacherProfile } from '../../services/teacherBrowseService';
import { useAuth } from '../../contexts/AuthContext';

interface TeacherProfileViewProps {
  teacherId: string;
  onClose: () => void;
  onSendRequest: (teacher: TeacherProfile) => void;
}

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ 
  teacherId, 
  onClose, 
  onSendRequest 
}) => {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'availability'>('about');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadTeacherProfile();
  }, [teacherId]);

  const loadTeacherProfile = async () => {
    try {
      setLoading(true);
      const profile = await TeacherBrowseService.getTeacherProfile(teacherId);
      setTeacher(profile);
    } catch (error) {
      console.error('Error loading teacher profile:', error);
      toast.error('Failed to load teacher profile');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleBookSession = () => {
    if (teacher) {
      onSendRequest(teacher);
    }
  };

  const handleShare = async () => {
    if (navigator.share && teacher) {
      try {
        await navigator.share({
          title: `${teacher.full_name} - Teacher Profile`,
          text: `Check out ${teacher.full_name}'s teacher profile on SomaTogether.ai`,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-20 w-20 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-semibold mb-4">Teacher Not Found</h2>
            <p className="text-gray-600 mb-6">This teacher profile could not be loaded.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = teacher.is_online;
  const isAvailable = teacher.is_available && !teacher.vacation_mode;
  const images = [teacher.cover_image_url, teacher.profile_image_url].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="relative">
              {/* Cover Image */}
              {teacher.cover_image_url && (
                <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                  <img
                    src={teacher.cover_image_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30" />
                </div>
              )}
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-white"
              >
                ×
              </Button>

              {/* Profile Info */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-end space-x-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={teacher.avatar_url} alt={teacher.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                      {getInitials(teacher.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-white">
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-2xl font-bold">{teacher.full_name}</h1>
                      {teacher.is_verified && (
                        <CheckCircle className="h-6 w-6 text-blue-300" />
                      )}
                      {isOnline && (
                        <div className="flex items-center space-x-1 bg-green-500 px-2 py-1 rounded-full text-xs">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span>Online</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className={`h-4 w-4 ${getRatingColor(teacher.rating)}`} />
                        <span className="font-semibold">{teacher.rating.toFixed(1)}</span>
                        <span className="text-blue-200">({teacher.total_reviews} reviews)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{teacher.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{teacher.experience_years}+ years</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right text-white">
                    <div className="text-3xl font-bold mb-1">
                      {formatPrice(teacher.hourly_rate, teacher.currency)}
                    </div>
                    <div className="text-sm text-blue-200">per hour</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="flex h-full">
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {/* Status Bar */}
                    <div className="mb-6">
                      {isAvailable ? (
                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="font-medium">Available for sessions</span>
                        </div>
                      ) : teacher.vacation_mode ? (
                        <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span className="font-medium">
                            On vacation until {teacher.vacation_end_date && formatDate(teacher.vacation_end_date)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          <span className="font-medium">Currently unavailable</span>
                        </div>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b mb-6">
                      <button
                        onClick={() => setActiveTab('about')}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === 'about'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        About
                      </button>
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === 'reviews'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Reviews ({teacher.total_reviews})
                      </button>
                      <button
                        onClick={() => setActiveTab('availability')}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === 'availability'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Availability
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'about' && (
                      <div className="space-y-6">
                        {/* Bio */}
                        {teacher.bio && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">About Me</h3>
                            <p className="text-gray-700 leading-relaxed">{teacher.bio}</p>
                          </div>
                        )}

                        {/* Teaching Philosophy */}
                        {teacher.teaching_philosophy && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Teaching Philosophy</h3>
                            <p className="text-gray-700 leading-relaxed">{teacher.teaching_philosophy}</p>
                          </div>
                        )}

                        {/* Subjects */}
                        {teacher.teacher_subjects && teacher.teacher_subjects.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Subjects I Teach</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {teacher.teacher_subjects.map((subject, index) => (
                                <Card key={index} className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium">{subject.subject_name}</h4>
                                      <p className="text-sm text-gray-600">
                                        {subject.years_experience} years experience
                                      </p>
                                    </div>
                                    <Badge variant="outline">{subject.proficiency_level}</Badge>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {teacher.teacher_skills && teacher.teacher_skills.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Skills & Certifications</h3>
                            <div className="space-y-3">
                              {teacher.teacher_skills.map((skill, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    {skill.is_certified && <Award className="h-4 w-4 text-yellow-600" />}
                                    <div>
                                      <h4 className="font-medium">{skill.skill_name}</h4>
                                      <p className="text-sm text-gray-600">{skill.skill_category}</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline">{skill.proficiency_level}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Languages */}
                        {teacher.languages && teacher.languages.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Languages</h3>
                            <div className="flex flex-wrap gap-2">
                              {teacher.languages.map((language, index) => (
                                <Badge key={index} variant="secondary">
                                  <Globe className="h-3 w-3 mr-1" />
                                  {language}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Education */}
                        {teacher.education && teacher.education.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Education</h3>
                            <div className="space-y-2">
                              {teacher.education.map((edu, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <GraduationCap className="h-4 w-4 text-blue-600" />
                                  <span>{edu}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'reviews' && (
                      <div>
                        {teacher.recent_reviews && teacher.recent_reviews.length > 0 ? (
                          <div className="space-y-4">
                            {teacher.recent_reviews.map((review, index) => (
                              <Card key={index} className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs">
                                        {review.student_name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h4 className="font-medium">{review.student_name}</h4>
                                      <div className="flex items-center space-x-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-3 w-3 ${
                                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {formatDate(review.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-700">{review.comment}</p>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                            <p className="text-gray-600">This teacher hasn't received any reviews yet.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'availability' && (
                      <div>
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Availability Calendar</h3>
                          <p className="text-gray-600 mb-4">
                            Book a session to see available time slots
                          </p>
                          <Button onClick={handleBookSession} disabled={!isAvailable}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Session
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 border-l bg-gray-50 p-6">
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Students</span>
                          </div>
                          <span className="font-semibold">{teacher.total_students}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Sessions</span>
                          </div>
                          <span className="font-semibold">{teacher.total_sessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="text-sm">Experience</span>
                          </div>
                          <span className="font-semibold">{teacher.experience_years}+ years</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">Rating</span>
                          </div>
                          <span className="font-semibold">{teacher.rating.toFixed(1)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleBookSession}
                        disabled={!isAvailable}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Book Session
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={handleShare}>
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        <Button variant="outline">
                          <Heart className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {teacher.show_contact_info && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-600" />
                            <span className="text-sm">{teacher.email}</span>
                          </div>
                          {teacher.social_links && Object.keys(teacher.social_links).length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Social Links</h4>
                              {Object.entries(teacher.social_links).map(([platform, url]) => (
                                <div key={platform} className="flex items-center space-x-2">
                                  <ExternalLink className="h-3 w-3 text-gray-600" />
                                  <a
                                    href={url as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    {platform}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileView;
