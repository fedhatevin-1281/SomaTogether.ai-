import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, MapPin, Clock, Users, Award, MessageCircle, Heart, BookOpen, DollarSign, Globe, CheckCircle, AlertCircle, Send, User, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import TeacherBrowseService, { TeacherProfile, TeacherBrowseFilters, PaginatedTeachers } from '../../services/teacherBrowseService';
import { SessionRequestService, CreateSessionRequestData } from '../../services/sessionRequestService';
import { useAuth } from '../../contexts/AuthContext';

interface TeacherCardProps {
  teacher: TeacherProfile;
  isExpanded: boolean;
  onToggleExpand: (teacherId: string) => void;
  onSendRequest: (teacher: TeacherProfile) => void;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, isExpanded, onToggleExpand, onSendRequest }) => {
  const [detailedTeacher, setDetailedTeacher] = useState<typeof teacher | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isExpanded && !detailedTeacher) {
      loadTeacherDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const loadTeacherDetails = async () => {
    try {
      setLoadingDetails(true);
      const profile = await TeacherBrowseService.getTeacherProfile(teacher.id);
      if (profile) {
        setDetailedTeacher(profile);
      }
    } catch (error) {
      console.error('Error loading teacher details:', error);
    } finally {
      setLoadingDetails(false);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isOnline = teacher.is_online;
  const isAvailable = teacher.is_available && !teacher.vacation_mode;
  
  // Use detailed teacher data if available, otherwise use basic teacher data
  const displayTeacher = detailedTeacher || teacher;

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-0 bg-white ${isExpanded ? 'shadow-md' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={teacher.avatar_url} alt={teacher.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {getInitials(teacher.full_name)}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">{teacher.full_name}</h3>
                {teacher.is_verified && (
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              {teacher.location && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{teacher.location}</span>
                </div>
              )}
              {teacher.languages && teacher.languages.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Globe className="h-3 w-3" />
                  <span>{teacher.languages.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 mb-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="font-semibold text-gray-900">{teacher.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-600">({teacher.total_reviews})</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatPrice(teacher.hourly_rate, teacher.currency)}
              <span className="text-sm font-normal text-gray-600">/hr</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Bio */}
        {teacher.bio && (
          <p className={`text-sm text-gray-700 mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {teacher.bio}
          </p>
        )}

        {/* Subjects */}
        {((teacher.teacher_subjects && teacher.teacher_subjects.length > 0) || 
          (teacher.subjects && teacher.subjects.length > 0)) && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {teacher.teacher_subjects && teacher.teacher_subjects.length > 0 ? (
                <>
                  {teacher.teacher_subjects.slice(0, isExpanded ? undefined : 3).map((subject, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {subject.subject_name}
                    </Badge>
                  ))}
                  {!isExpanded && teacher.teacher_subjects.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{teacher.teacher_subjects.length - 3} more
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  {teacher.subjects.slice(0, isExpanded ? undefined : 3).map((subject, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                  {!isExpanded && teacher.subjects.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{teacher.subjects.length - 3} more
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{teacher.total_sessions}</div>
            <div className="text-xs text-gray-600">Sessions</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{teacher.experience_years}+</div>
            <div className="text-xs text-gray-600">Years</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{teacher.total_students}</div>
            <div className="text-xs text-gray-600">Students</div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          {isAvailable ? (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium">Available</span>
            </div>
          ) : teacher.vacation_mode ? (
            <div className="flex items-center space-x-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">On Vacation</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-sm font-medium">Unavailable</span>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 transition-all duration-300">
            {loadingDetails ? (
              <div className="text-center py-4 text-sm text-gray-600">Loading details...</div>
            ) : (
              <>
                {/* Curriculum */}
                {displayTeacher.preferred_curriculums && displayTeacher.preferred_curriculums.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Curriculums
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {displayTeacher.preferred_curriculums.map((curriculum) => (
                        <Badge key={curriculum.id} variant="secondary" className="text-xs">
                          {curriculum.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects */}
                {((displayTeacher.teacher_subjects && displayTeacher.teacher_subjects.length > 0) || 
                  (displayTeacher.subjects && displayTeacher.subjects.length > 0)) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Subjects Taught
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {displayTeacher.teacher_subjects && displayTeacher.teacher_subjects.length > 0 ? (
                        displayTeacher.teacher_subjects.map((subject, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subject.subject_name}
                            {subject.proficiency_level && (
                              <span className="ml-1 text-gray-500">({subject.proficiency_level})</span>
                            )}
                          </Badge>
                        ))
                      ) : (
                        displayTeacher.subjects?.map((subject, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Teaching Philosophy */}
                {displayTeacher.teaching_philosophy && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Teaching Philosophy</h4>
                    <p className="text-sm text-gray-700">{displayTeacher.teaching_philosophy}</p>
                  </div>
                )}

                {/* Education */}
                {displayTeacher.education && displayTeacher.education.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      Education
                    </h4>
                    <ul className="space-y-1">
                      {displayTeacher.education.map((edu, index) => (
                        <li key={index} className="text-sm text-gray-700">• {edu}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specialties */}
                {displayTeacher.specialties && displayTeacher.specialties.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      Specialties
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {displayTeacher.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {displayTeacher.certifications && displayTeacher.certifications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      Certifications
                    </h4>
                    <ul className="space-y-1">
                      {displayTeacher.certifications.map((cert: any, index: number) => (
                        <li key={index} className="text-sm text-gray-700">
                          • {typeof cert === 'string' ? cert : cert.name || cert.title || 'Certification'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {displayTeacher.max_students && (
                    <div>
                      <div className="text-xs text-gray-600">Max Students</div>
                      <div className="text-sm font-semibold text-gray-900">{displayTeacher.max_students}</div>
                    </div>
                  )}
                  {displayTeacher.preferred_class_duration && (
                    <div>
                      <div className="text-xs text-gray-600">Class Duration</div>
                      <div className="text-sm font-semibold text-gray-900">{displayTeacher.preferred_class_duration} min</div>
                    </div>
                  )}
                </div>

                {/* Recent Reviews */}
                {displayTeacher.recent_reviews && displayTeacher.recent_reviews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Reviews</h4>
                    <div className="space-y-2">
                      {displayTeacher.recent_reviews.slice(0, 2).map((review) => (
                        <div key={review.id} className="bg-gray-50 p-2 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-900">{review.student_name}</span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-700 ml-1">{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleExpand(teacher.id)}
            className="flex-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-1" />
                View Profile
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => onSendRequest(teacher)}
            disabled={!isAvailable}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Book Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TeacherBrowse: React.FC = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<TeacherBrowseFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total_pages: 0,
    total_count: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [subjects, setSubjects] = useState<Array<{id: string, name: string, category: string}>>([]);
  
  // Session request state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [requestDate, setRequestDate] = useState('');
  const [requestTime, setRequestTime] = useState('');
  const [requestDuration, setRequestDuration] = useState('1');
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load teachers
  const loadTeachers = async (page: number = 1, reset: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentFilters = {
        ...filters,
        search_query: searchQuery || undefined
      };

      const result = await TeacherBrowseService.getTeachers(currentFilters, page, pagination.per_page);

      if (reset) {
        setTeachers(result.teachers);
      } else {
        setTeachers(prev => [...prev, ...result.teachers]);
      }

      setPagination({
        page: result.page,
        per_page: result.per_page,
        total_pages: result.total_pages,
        total_count: result.total_count
      });
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load subjects for filter
  const loadSubjects = async () => {
    try {
      const subjectsData = await TeacherBrowseService.getSubjects();
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadTeachers(1, true);
    loadSubjects();
  }, []);

  // Load more when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTeachers(1, true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, searchQuery]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.total_pages && !loadingMore) {
      loadTeachers(pagination.page + 1, false);
    }
  };

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleToggleExpand = (teacherId: string) => {
    setExpandedCardId(prev => prev === teacherId ? null : teacherId);
  };

  const handleSendRequest = (teacher: TeacherProfile) => {
    setSelectedTeacher(teacher);
    setRequestDialogOpen(true);
    setError(null);
    setRequestSuccess(null);
  };

  const updateFilter = (key: keyof TeacherBrowseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleSendRequestSubmit = async () => {
    if (!user?.id || !selectedTeacher) return;

    try {
      setSendingRequest(true);
      setError(null);

      // Validate required fields
      if (!requestDate || !requestTime || !requestDuration) {
        setError('Please fill in all required fields.');
        return;
      }

      // Create date objects
      const requestedStart = new Date(`${requestDate}T${requestTime}`);
      const requestedEnd = new Date(requestedStart.getTime() + (parseFloat(requestDuration) * 60 * 60 * 1000));

      const requestData: CreateSessionRequestData = {
        teacher_id: selectedTeacher.id,
        requested_start: requestedStart.toISOString(),
        requested_end: requestedEnd.toISOString(),
        duration_hours: parseFloat(requestDuration),
        message: requestMessage || undefined,
      };

      await SessionRequestService.createSessionRequest(user.id, requestData);

      setRequestSuccess('Request sent successfully! The teacher will be notified.');
      setRequestDialogOpen(false);
      setRequestMessage('');
      setRequestDate('');
      setRequestTime('');
      setRequestDuration('1');
      setSelectedTeacher(null);
      
      toast.success('Session request sent successfully!');
    } catch (error: any) {
      console.error('Error sending request:', error);
      setError(error.message || 'Failed to send request. Please try again.');
      toast.error(error.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Teacher</h1>
        <p className="text-gray-600">Discover qualified teachers from around the world</p>
      </div>

      {/* Success Message */}
      {requestSuccess && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{requestSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teachers, subjects, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                <Select
                  value={filters.subjects?.[0] || ''}
                  onValueChange={(value) => updateFilter('subjects', value ? [value] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                <Select
                  value={filters.min_rating?.toString() || ''}
                  onValueChange={(value) => updateFilter('min_rating', value ? parseFloat(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any rating</SelectItem>
                    <SelectItem value="4.5">4.5+ stars</SelectItem>
                    <SelectItem value="4.0">4.0+ stars</SelectItem>
                    <SelectItem value="3.5">3.5+ stars</SelectItem>
                    <SelectItem value="3.0">3.0+ stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <Select
                  value={filters.max_hourly_rate?.toString() || ''}
                  onValueChange={(value) => updateFilter('max_hourly_rate', value ? parseFloat(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any price</SelectItem>
                    <SelectItem value="20">$20/hr</SelectItem>
                    <SelectItem value="50">$50/hr</SelectItem>
                    <SelectItem value="100">$100/hr</SelectItem>
                    <SelectItem value="200">$200/hr</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <Select
                  value={filters.sort_by || 'rating'}
                  onValueChange={(value) => updateFilter('sort_by', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="reviews">Reviews</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="available-only"
                    checked={filters.availability || false}
                    onCheckedChange={(checked) => updateFilter('availability', checked)}
                  />
                  <label htmlFor="available-only" className="text-sm text-gray-700">
                    Available only
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified-only"
                    checked={filters.verification_status === 'verified'}
                    onCheckedChange={(checked) => updateFilter('verification_status', checked ? 'verified' : undefined)}
                  />
                  <label htmlFor="verified-only" className="text-sm text-gray-700">
                    Verified only
                  </label>
                </div>
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Showing {teachers.length} of {pagination.total_count} teachers
          </p>
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="available-only-desktop"
                checked={filters.availability || false}
                onCheckedChange={(checked) => updateFilter('availability', checked)}
              />
              <label htmlFor="available-only-desktop" className="text-sm text-gray-700">
                Available only
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified-only-desktop"
                checked={filters.verification_status === 'verified'}
                onCheckedChange={(checked) => updateFilter('verification_status', checked ? 'verified' : undefined)}
              />
              <label htmlFor="verified-only-desktop" className="text-sm text-gray-700">
                Verified only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
          <Button onClick={clearFilters}>Clear Filters</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                isExpanded={expandedCardId === teacher.id}
                onToggleExpand={handleToggleExpand}
                onSendRequest={handleSendRequest}
              />
            ))}
          </div>

          {/* Load More */}
          {pagination.page < pagination.total_pages && (
            <div className="text-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Teachers'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Session Request</DialogTitle>
            <DialogDescription>
              Send a request to {selectedTeacher?.full_name} for a tutoring session.
              This will cost 10 tokens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Teacher Info */}
            {selectedTeacher && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {selectedTeacher.avatar_url ? (
                    <img
                      src={selectedTeacher.avatar_url}
                      alt={selectedTeacher.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{selectedTeacher.full_name}</div>
                  <div className="text-sm text-gray-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: selectedTeacher.currency || 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    }).format(selectedTeacher.hourly_rate)}/hr
                  </div>
                </div>
              </div>
            )}

            {/* Request Date */}
            <div>
              <Label htmlFor="requestDate">Session Date *</Label>
              <Input
                id="requestDate"
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Request Time */}
            <div>
              <Label htmlFor="requestTime">Session Time *</Label>
              <Input
                id="requestTime"
                type="time"
                value={requestTime}
                onChange={(e) => setRequestTime(e.target.value)}
                required
              />
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration">Duration (hours) *</Label>
              <Select value={requestDuration} onValueChange={setRequestDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30 minutes</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="1.5">1.5 hours</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="2.5">2.5 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the teacher about your learning goals or specific topics you'd like to cover..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Token Cost Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sending this request will cost <strong>10 tokens</strong>. 
                Tokens will be refunded if the teacher declines your request.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestDialogOpen(false)}
              disabled={sendingRequest}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendRequestSubmit}
              disabled={sendingRequest || !requestDate || !requestTime || !requestDuration}
            >
              {sendingRequest ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request (10 tokens)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TeacherBrowse;
