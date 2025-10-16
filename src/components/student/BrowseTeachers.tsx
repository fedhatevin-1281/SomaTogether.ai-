import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SessionRequestService, TeacherProfile, CreateSessionRequestData } from '../../services/sessionRequestService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, 
  Star, 
  Users, 
  Clock, 
  MapPin, 
  BookOpen, 
  Award, 
  MessageSquare,
  User,
  CheckCircle,
  AlertCircle,
  Filter,
  Eye,
  Send
} from 'lucide-react';

interface BrowseTeachersProps {
  onBack?: () => void;
}

export function BrowseTeachers({ onBack }: BrowseTeachersProps) {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [requestTime, setRequestTime] = useState('');
  const [requestDuration, setRequestDuration] = useState('1');
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const teachersData = await SessionRequestService.getAvailableTeachers();
      setTeachers(teachersData);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      setError('Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSubject = !selectedSubject || selectedSubject === 'all' || teacher.subjects.includes(selectedSubject);
    
    return matchesSearch && matchesSubject;
  });

  const handleSendRequest = async () => {
    if (!selectedTeacher || !user?.id) return;

    try {
      setSendingRequest(true);
      setError(null);

      // Validate form
      if (!requestDate || !requestTime || !requestDuration) {
        throw new Error('Please fill in all required fields.');
      }

      // Create datetime strings
      const requestedStart = new Date(`${requestDate}T${requestTime}`);
      const requestedEnd = new Date(requestedStart.getTime() + parseInt(requestDuration) * 60 * 60 * 1000);

      if (requestedStart < new Date()) {
        throw new Error('Requested time cannot be in the past.');
      }

      const requestData: CreateSessionRequestData = {
        teacher_id: selectedTeacher.id,
        requested_start: requestedStart.toISOString(),
        requested_end: requestedEnd.toISOString(),
        duration_hours: parseInt(requestDuration),
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
    } catch (error: any) {
      console.error('Error sending request:', error);
      setError(error.message || 'Failed to send request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  const getSubjects = () => {
    const allSubjects = teachers.flatMap(teacher => teacher.subjects);
    return [...new Set(allSubjects)].sort();
  };

  const formatPrice = (rate: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(rate);
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Browse Teachers</h1>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browse Teachers</h1>
          <p className="text-gray-600 mt-1">
            Find and connect with qualified teachers for your learning needs
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
      </div>

      {/* Success Message */}
      {requestSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{requestSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search teachers by name, subject, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {getSubjects().map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
          </Select>
      </div>

      {/* Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teachers found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedSubject
                ? 'Try adjusting your search criteria or filters.'
                : 'No teachers are currently available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {teacher.avatar_url ? (
                        <img
                          src={teacher.avatar_url}
                          alt={teacher.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{teacher.full_name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {formatRating(teacher.rating)} ({teacher.total_reviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {formatPrice(teacher.hourly_rate, teacher.currency)}/hr
                    </div>
                    <Badge
                      variant={teacher.verification_status === 'verified' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {teacher.verification_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bio */}
                {teacher.bio && (
                  <p className="text-sm text-gray-600 line-clamp-3">{teacher.bio}</p>
                )}

                {/* Subjects */}
                <div>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.slice(0, 3).map((subject) => (
                      <Badge key={subject} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                    {teacher.subjects.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{teacher.subjects.length - 3} more
                      </Badge>
                )}
              </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{teacher.total_students} students</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{teacher.total_sessions} sessions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4" />
                    <span>{teacher.experience_years} years exp</span>
              </div>
            </div>

                {/* Location */}
                {teacher.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                <span>{teacher.location}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setRequestDialogOpen(true);
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
              </div>
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
                    {formatPrice(selectedTeacher.hourly_rate, selectedTeacher.currency)}/hr
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
              onClick={handleSendRequest}
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
}