import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Clock, 
  User, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Star,
  MapPin,
  GraduationCap,
  BookOpen,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../contexts/AuthContext';
import { SessionRequestService, SessionRequest } from '../../services/sessionRequestService';
import { toast } from 'sonner';

interface TeacherRequestManagementProps {
  onBack?: () => void;
}

export function TeacherRequestManagement({ onBack }: TeacherRequestManagementProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SessionRequest | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline'>('accept');
  const [teacherResponse, setTeacherResponse] = useState('');
  const [declinedReason, setDeclinedReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const requestsData = await SessionRequestService.getTeacherRequests(user.id);
      setRequests(requestsData);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load session requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = (request: SessionRequest) => {
    setSelectedRequest(request);
    setActionType('accept');
    setTeacherResponse('');
    setResponseDialogOpen(true);
  };

  const handleDeclineRequest = (request: SessionRequest) => {
    setSelectedRequest(request);
    setActionType('decline');
    setTeacherResponse('');
    setDeclinedReason('');
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      
      if (actionType === 'accept') {
        await SessionRequestService.acceptRequest(selectedRequest.id, teacherResponse || undefined);
        toast.success('Request accepted successfully!');
      } else {
        await SessionRequestService.declineRequest(
          selectedRequest.id, 
          declinedReason || undefined, 
          teacherResponse || undefined
        );
        toast.success('Request declined');
      }

      setResponseDialogOpen(false);
      setSelectedRequest(null);
      setTeacherResponse('');
      setDeclinedReason('');
      
      // Reload requests
      await loadRequests();
    } catch (err: any) {
      console.error('Error processing request:', err);
      toast.error(err.message || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading session requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadRequests}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Session Requests</h1>
          <p className="text-slate-600">Manage incoming session requests from students</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'accepted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Declined</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'declined').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Session Requests</h3>
            <p className="text-gray-600">You haven't received any session requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.student?.avatar_url} alt={request.student?.full_name} />
                      <AvatarFallback>
                        {getInitials(request.student?.full_name || 'Student')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{request.student?.full_name}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              {formatDate(request.requested_start)} - {formatDate(request.requested_end)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{request.duration_hours} hours</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">{request.tokens_required} tokens</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {request.student?.school_name && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <GraduationCap className="h-4 w-4" />
                              <span className="text-sm">{request.student.school_name}</span>
                            </div>
                          )}
                          {request.student?.education_system && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <BookOpen className="h-4 w-4" />
                              <span className="text-sm">{request.student.education_system.name}</span>
                            </div>
                          )}
                          {request.student?.interests && request.student.interests.length > 0 && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Star className="h-4 w-4" />
                              <span className="text-sm">
                                {request.student.interests.slice(0, 2).join(', ')}
                                {request.student.interests.length > 2 && '...'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {request.message && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-gray-700">
                            <strong>Student Message:</strong> {request.message}
                          </p>
                        </div>
                      )}

                      {request.teacher_response && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-gray-700">
                            <strong>Your Response:</strong> {request.teacher_response}
                          </p>
                        </div>
                      )}

                      {request.declined_reason && (
                        <div className="bg-red-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-red-700">
                            <strong>Decline Reason:</strong> {request.declined_reason}
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Requested on {formatDate(request.created_at)}
                        {request.expires_at && (
                          <span className="ml-2">
                            • Expires on {formatDate(request.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineRequest(request)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' ? 'Accept Session Request' : 'Decline Session Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept' 
                ? 'Add a message to confirm the session details with the student.'
                : 'Provide a reason for declining and optionally add a message to the student.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">{selectedRequest.student?.full_name}</p>
                <p className="text-xs text-gray-600">
                  {formatDate(selectedRequest.requested_start)} - {selectedRequest.duration_hours} hours
                </p>
              </div>
            )}

            {actionType === 'decline' && (
              <div>
                <Label htmlFor="declinedReason">Reason for declining (Optional)</Label>
                <Textarea
                  id="declinedReason"
                  placeholder="e.g., Not available at that time, Outside my expertise..."
                  value={declinedReason}
                  onChange={(e) => setDeclinedReason(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            <div>
              <Label htmlFor="teacherResponse">
                {actionType === 'accept' ? 'Confirmation Message' : 'Message to Student'} (Optional)
              </Label>
              <Textarea
                id="teacherResponse"
                placeholder={
                  actionType === 'accept' 
                    ? "Great! I'm looking forward to our session. We'll cover..."
                    : "Thank you for your interest. Unfortunately..."
                }
                value={teacherResponse}
                onChange={(e) => setTeacherResponse(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResponseDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={processing}
              className={actionType === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'accept' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {actionType === 'accept' ? 'Accept Request' : 'Decline Request'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}







