import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign,
  BookOpen,
  GraduationCap,
  Award,
  Users,
  MessageSquare,
  Calendar,
  CheckCircle,
  AlertCircle,
  Globe,
  ArrowLeft,
  Send,
  User
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../contexts/AuthContext';
import { SessionRequestService, TeacherProfile, CreateSessionRequestData } from '../../services/sessionRequestService';
import { toast } from 'sonner';

interface TeacherPublicProfileViewProps {
  teacherId: string;
  onBack: () => void;
  onSendRequest?: (teacher: TeacherProfile) => void;
}

export function TeacherPublicProfileView({ teacherId, onBack, onSendRequest }: TeacherPublicProfileViewProps) {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Request dialog state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestDate, setRequestDate] = useState('');
  const [requestTime, setRequestTime] = useState('');
  const [requestDuration, setRequestDuration] = useState('1');
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    loadTeacherProfile();
  }, [teacherId]);

  const loadTeacherProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await SessionRequestService.getTeacherProfile(teacherId);
      setTeacher(profile);
    } catch (err) {
      console.error('Error loading teacher profile:', err);
      setError('Failed to load teacher profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = () => {
    if (teacher) {
      setRequestDialogOpen(true);
      setRequestMessage('');
      setRequestDate('');
      setRequestTime('');
      setRequestDuration('1');
    }
  };

  const handleSendRequestSubmit = async () => {
    if (!user?.id || !teacher) return;

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
        teacher_id: teacher.id,
        requested_start: requestedStart.toISOString(),
        requested_end: requestedEnd.toISOString(),
        duration_hours: parseFloat(requestDuration),
        message: requestMessage || undefined,
      };

      await SessionRequestService.createSessionRequest(user.id, requestData);

      setRequestDialogOpen(false);
      toast.success('Session request sent successfully!');
      
      if (onSendRequest) {
        onSendRequest(teacher);
      }
    } catch (error: any) {
      console.error('Error sending request:', error);
      setError(error.message || 'Failed to send request. Please try again.');
      toast.error(error.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading teacher profile...</span>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error || 'Teacher profile not found'}</p>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teachers
          </Button>
        </div>
      </div>
    );
  }

  const isAvailable = teacher.is_available;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teachers
        </Button>
        <div className="flex space-x-3">
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button 
            onClick={handleSendRequest}
            disabled={!isAvailable}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Teacher Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={teacher.avatar_url} alt={teacher.full_name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(teacher.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{teacher.full_name}</CardTitle>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{teacher.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-500">({teacher.total_reviews} reviews)</span>
              </div>
              <div className="flex items-center justify-center space-x-2 mt-2">
                {teacher.verification_status === 'verified' ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending Verification
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                {teacher.location && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{teacher.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{teacher.timezone || 'UTC'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    {formatPrice(teacher.hourly_rate, teacher.currency)}/hour
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{teacher.total_students} students</span>
                </div>
              </div>

              {/* Availability Status */}
              <div className="pt-4 border-t">
                {isAvailable ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">Available for sessions</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="text-sm font-medium">Currently unavailable</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {teacher.bio && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-sm text-gray-600">{teacher.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Subjects & Specialties</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects.map((subject, index) => (
                      <Badge key={index} variant="secondary">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
                {teacher.specialties && teacher.specialties.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {teacher.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Education & Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Education & Experience</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Teaching Experience</span>
                  <span className="font-semibold">{teacher.experience_years} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Sessions</span>
                  <span className="font-semibold">{teacher.total_sessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Max Students</span>
                  <span className="font-semibold">{teacher.max_students}</span>
                </div>
                {teacher.education && teacher.education.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Education</h4>
                    <ul className="space-y-1">
                      {teacher.education.map((edu, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                          <Award className="h-3 w-3" />
                          <span>{edu}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preferred Curriculums */}
          {teacher.preferred_curriculums && teacher.preferred_curriculums.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Preferred Curriculums</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {teacher.preferred_curriculums.map((curriculum, index) => (
                    <Badge key={index} variant="outline">
                      {curriculum.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Availability Schedule */}
          {teacher.availability && teacher.availability.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Availability</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teacher.availability.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="text-sm font-medium">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.day_of_week]}
                      </span>
                      <span className="text-sm text-gray-600">
                        {slot.start_time} - {slot.end_time} ({slot.timezone})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Session Request</DialogTitle>
            <DialogDescription>
              Send a request to {teacher.full_name} for a tutoring session.
              This will cost 10 tokens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Teacher Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={teacher.avatar_url} alt={teacher.full_name} />
                <AvatarFallback>
                  {getInitials(teacher.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{teacher.full_name}</div>
                <div className="text-sm text-gray-600">
                  {formatPrice(teacher.hourly_rate, teacher.currency)}/hr
                </div>
              </div>
            </div>

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
}







