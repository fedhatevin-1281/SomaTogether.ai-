import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SessionRequestService, SessionRequest, StudentProfile } from '../../services/sessionRequestService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Eye,
  User,
  MapPin,
  BookOpen,
  Star,
  AlertCircle,
  Calendar,
  DollarSign,
  RefreshCw
} from 'lucide-react';

interface TeacherRequestsProps {
  onBack?: () => void;
}

export function TeacherRequests({ onBack }: TeacherRequestsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SessionRequest | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);
  const [teacherResponse, setTeacherResponse] = useState('');
  const [declinedReason, setDeclinedReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id]);

  const fetchRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const requestsData = await SessionRequestService.getTeacherRequests(user.id);
      setRequests(requestsData);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      setError(null);
      
      await SessionRequestService.acceptRequest(selectedRequest.id, teacherResponse);
      
      setSuccessMessage('Request accepted successfully!');
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setTeacherResponse('');
      fetchRequests();
    } catch (error: any) {
      console.error('Error accepting request:', error);
      setError(error.message || 'Failed to accept request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      setError(null);
      
      await SessionRequestService.declineRequest(
        selectedRequest.id,
        declinedReason,
        teacherResponse
      );
      
      setSuccessMessage('Request declined. Tokens have been refunded to the student.');
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setDeclinedReason('');
      setTeacherResponse('');
      fetchRequests();
    } catch (error: any) {
      console.error('Error declining request:', error);
      setError(error.message || 'Failed to decline request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewStudentProfile = async (studentId: string) => {
    try {
      setLoading(true);
      const studentProfile = await SessionRequestService.getStudentProfile(studentId);
      setSelectedStudent(studentProfile);
      setViewProfileDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching student profile:', error);
      setError('Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (request: SessionRequest, type: 'accept' | 'decline') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
    setTeacherResponse('');
    setDeclinedReason('');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const otherRequests = requests.filter(r => r.status !== 'pending');

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Student Requests</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Student Requests</h1>
          <p className="text-gray-600 mt-1">
            Manage session requests from students
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Requests Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Requests ({requests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">
                  You don't have any pending session requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Student Info */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {request.student?.avatar_url ? (
                              <img
                                src={request.student.avatar_url}
                                alt={request.student.full_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-foreground">{request.student?.full_name}</h3>
                            <p className="text-sm text-gray-600">{request.student?.email}</p>
                            {request.student?.education_system && (
                              <p className="text-xs text-gray-500">
                                {request.student.education_system.name} - {request.student.education_level?.level_name}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Request Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-foreground">
                              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                              <span><strong>Date:</strong> {formatDateTime(request.requested_start)}</span>
                            </div>
                            <div className="flex items-center text-sm text-foreground">
                              <Clock className="h-4 w-4 mr-2 text-gray-500" />
                              <span><strong>Duration:</strong> {formatDuration(request.duration_hours)}</span>
                            </div>
                            <div className="flex items-center text-sm text-foreground">
                              <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                              <span><strong>Cost:</strong> {request.tokens_required} tokens</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-foreground">
                              <Clock className="h-4 w-4 mr-2 text-gray-500" />
                              <span><strong>Expires:</strong> {formatDateTime(request.expires_at)}</span>
                            </div>
                            {request.student?.school_name && (
                              <div className="flex items-center text-sm text-foreground">
                                <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                                <span><strong>School:</strong> {request.student.school_name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Message */}
                        {request.message && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-foreground">
                              <strong>Student Message:</strong> {request.message}
                            </p>
                          </div>
                        )}

                        {/* Student Interests */}
                        {request.student?.interests && request.student.interests.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Student Interests:</p>
                            <div className="flex flex-wrap gap-1">
                              {request.student.interests.slice(0, 5).map((interest) => (
                                <Badge key={interest} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                              {request.student.interests.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{request.student.interests.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Badge className={`${getStatusColor(request.status)} capitalize`}>
                          {request.status}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStudentProfile(request.student_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Profile
                          </Button>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => openActionDialog(request, 'accept')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openActionDialog(request, 'decline')}
                            className="dark:bg-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-600">
                  You haven't received any session requests from students yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className={`border-l-4 ${
                  request.status === 'pending' ? 'border-l-yellow-500' :
                  request.status === 'accepted' ? 'border-l-green-500' :
                  request.status === 'declined' ? 'border-l-red-500' :
                  'border-l-gray-500'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {request.student?.avatar_url ? (
                              <img
                                src={request.student.avatar_url}
                                alt={request.student.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{request.student?.full_name}</h3>
                            <p className="text-sm text-gray-600">
                              {formatDateTime(request.requested_start)} • {formatDuration(request.duration_hours)}
                            </p>
                          </div>
                        </div>
                        
                        {request.message && (
                          <p className="text-sm text-gray-600 mb-2">
                            "{request.message}"
                          </p>
                        )}
                        
                        {request.teacher_response && (
                          <div className="p-2 bg-blue-50 rounded text-sm text-foreground">
                            <strong>Your response:</strong> {request.teacher_response}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={`${getStatusColor(request.status)} capitalize`}>
                          {request.status}
                        </Badge>
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStudentProfile(request.student_id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Profile
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openActionDialog(request, 'accept')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openActionDialog(request, 'decline')}
                              className="dark:bg-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' ? 'Accept Request' : 'Decline Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept' 
                ? 'Send a response to the student about the accepted session.'
                : 'Provide a reason for declining and optionally send a message to the student.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {selectedRequest.student?.avatar_url ? (
                      <img
                        src={selectedRequest.student.avatar_url}
                        alt={selectedRequest.student.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{selectedRequest.student?.full_name}</div>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(selectedRequest.requested_start)} • {formatDuration(selectedRequest.duration_hours)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {actionType === 'decline' && (
              <div>
                <Label htmlFor="declinedReason">Reason for declining</Label>
                <Select value={declinedReason} onValueChange={setDeclinedReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule_conflict">Schedule conflict</SelectItem>
                    <SelectItem value="not_available">Not available at requested time</SelectItem>
                    <SelectItem value="subject_not_covered">Don't teach this subject</SelectItem>
                    <SelectItem value="other">Other reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="teacherResponse">
                {actionType === 'accept' ? 'Response to student (optional)' : 'Message to student (optional)'}
              </Label>
              <Textarea
                id="teacherResponse"
                placeholder={
                  actionType === 'accept' 
                    ? "Great! I'm excited to help you with your studies. Looking forward to our session!"
                    : "I'm sorry, but I won't be able to accommodate this request. Best of luck with your studies!"
                }
                value={teacherResponse}
                onChange={(e) => setTeacherResponse(e.target.value)}
                rows={3}
              />
            </div>

            {actionType === 'decline' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The student's tokens will be automatically refunded when you decline this request.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={actionType === 'accept' ? handleAcceptRequest : handleDeclineRequest}
              disabled={processing || (actionType === 'decline' && !declinedReason)}
              className={actionType === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'accept' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Request
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline Request
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={viewProfileDialogOpen} onOpenChange={setViewProfileDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
            <DialogDescription>
              View detailed information about the student
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  {selectedStudent.avatar_url ? (
                    <img
                      src={selectedStudent.avatar_url}
                      alt={selectedStudent.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedStudent.full_name}</h3>
                  <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                  {selectedStudent.education_system && (
                    <p className="text-xs text-gray-500">
                      {selectedStudent.education_system.name} - {selectedStudent.education_level?.level_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Education Info */}
              {(selectedStudent.education_system || selectedStudent.school_name) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                  <div className="space-y-1 text-sm text-foreground">
                    {selectedStudent.education_system && (
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{selectedStudent.education_system.name}</span>
                      </div>
                    )}
                    {selectedStudent.school_name && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{selectedStudent.school_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedStudent.bio && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">About</h4>
                  <p className="text-sm text-gray-600">{selectedStudent.bio}</p>
                </div>
              )}

              {/* Interests */}
              {selectedStudent.interests && selectedStudent.interests.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedStudent.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Goals */}
              {selectedStudent.learning_goals && selectedStudent.learning_goals.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Learning Goals</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedStudent.learning_goals.map((goal) => (
                      <Badge key={goal} variant="outline" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {selectedStudent.preferred_languages && selectedStudent.preferred_languages.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedStudent.preferred_languages.map((language) => (
                      <Badge key={language} variant="outline" className="text-xs">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewProfileDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
