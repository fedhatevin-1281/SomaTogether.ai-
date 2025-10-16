import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, MapPin, Clock, Users, Award, MessageCircle, Heart, BookOpen, DollarSign, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import TeacherBrowseService, { TeacherProfile, TeacherBrowseFilters, PaginatedTeachers } from '../../services/teacherBrowseService';
import { useAuth } from '../../contexts/AuthContext';

interface TeacherCardProps {
  teacher: TeacherProfile;
  onViewProfile: (teacher: TeacherProfile) => void;
  onSendRequest: (teacher: TeacherProfile) => void;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, onViewProfile, onSendRequest }) => {
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white">
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
                {teacher.needs_profile_completion && (
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                    Profile Incomplete
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{teacher.location || 'Location not specified'}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Globe className="h-3 w-3" />
                <span>{teacher.languages?.join(', ') || 'English'}</span>
              </div>
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
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {teacher.bio}
          </p>
        )}

        {/* Subjects */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {teacher.teacher_subjects?.slice(0, 3).map((subject, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {subject.subject_name}
              </Badge>
            ))}
            {teacher.teacher_subjects && teacher.teacher_subjects.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{teacher.teacher_subjects.length - 3} more
              </Badge>
            )}
          </div>
        </div>

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

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProfile(teacher)}
            className="flex-1"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            View Profile
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

  const handleViewProfile = (teacher: TeacherProfile) => {
    // Navigate to teacher profile page
    console.log('View profile:', teacher);
    // This would open a modal or navigate to a profile page
  };

  const handleSendRequest = (teacher: TeacherProfile) => {
    // Navigate to session request page
    console.log('Send request:', teacher);
    // This would open a session request modal
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Teacher</h1>
        <p className="text-gray-600">Discover qualified teachers from around the world</p>
      </div>

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
                onViewProfile={handleViewProfile}
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
    </div>
  );
};

export default TeacherBrowse;
