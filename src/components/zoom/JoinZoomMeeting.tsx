import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar, Clock, Users, Video, ExternalLink, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import zoomService from '../../services/zoomService';

interface ZoomMeeting {
  id: string;
  meeting_id: string;
  topic: string;
  description?: string;
  start_time: string;
  duration_minutes: number;
  timezone: string;
  join_url: string;
  password?: string;
  status: 'scheduled' | 'started' | 'ended' | 'cancelled';
  participants_count: number;
  class_sessions?: {
    title: string;
    description?: string;
    classes?: {
      title: string;
      teachers?: {
        profiles?: {
          full_name: string;
          avatar_url?: string;
        };
      };
    };
  };
}

interface JoinZoomMeetingProps {
  studentId: string;
  onMeetingJoined?: (meetingId: string) => void;
}

export function JoinZoomMeeting({ studentId, onMeetingJoined }: JoinZoomMeetingProps) {
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, [studentId]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/zoom/meetings/student/${studentId}?status=upcoming`);
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to fetch upcoming meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async (meetingId: string, joinUrl: string) => {
    try {
      setJoining(meetingId);
      setError(null);

      // Record that student is joining the meeting
      const response = await fetch(`/api/zoom/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: studentId,
          userType: 'student'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Open Zoom meeting in new tab
        window.open(joinUrl, '_blank');
        
        if (onMeetingJoined) {
          onMeetingJoined(meetingId);
        }
      } else {
        setError(data.error || 'Failed to join meeting');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      setError('Failed to join meeting');
    } finally {
      setJoining(null);
    }
  };

  const handleCopyLink = async (joinUrl: string, meetingId: string) => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(meetingId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const getMeetingStatus = (meeting: ZoomMeeting) => {
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(startTime.getTime() + meeting.duration_minutes * 60000);
    const now = new Date();

    if (meeting.status === 'cancelled') {
      return { status: 'cancelled', label: 'Cancelled', variant: 'destructive' as const };
    }

    if (meeting.status === 'ended') {
      return { status: 'ended', label: 'Ended', variant: 'secondary' as const };
    }

    if (now < startTime) {
      const timeUntil = zoomService.getTimeUntilMeeting(meeting.start_time);
      return { status: 'upcoming', label: `Starts in ${timeUntil}`, variant: 'outline' as const };
    }

    if (now >= startTime && now <= endTime) {
      return { status: 'live', label: 'Live Now', variant: 'default' as const };
    }

    return { status: 'ended', label: 'Ended', variant: 'secondary' as const };
  };

  const canJoinMeeting = (meeting: ZoomMeeting) => {
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(startTime.getTime() + meeting.duration_minutes * 60000);
    const now = new Date();

    return meeting.status === 'scheduled' || 
           meeting.status === 'started' || 
           (now >= startTime && now <= endTime);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No Upcoming Meetings</h3>
          <p className="text-gray-600">
            You don't have any upcoming Zoom meetings scheduled.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => {
        const statusInfo = getMeetingStatus(meeting);
        const canJoin = canJoinMeeting(meeting);

        return (
          <Card key={meeting.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{meeting.topic}</CardTitle>
                  {meeting.class_sessions?.classes?.title && (
                    <CardDescription>
                      Class: {meeting.class_sessions.classes.title}
                    </CardDescription>
                  )}
                  {meeting.class_sessions?.classes?.teachers?.profiles?.full_name && (
                    <CardDescription>
                      Teacher: {meeting.class_sessions.classes.teachers.profiles.full_name}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={statusInfo.variant}>
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {zoomService.formatMeetingTime(meeting.start_time, meeting.timezone)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{meeting.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{meeting.participants_count} participants</span>
                </div>
                {meeting.password && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Password: {meeting.password}</span>
                  </div>
                )}
              </div>

              {meeting.description && (
                <div className="text-sm text-gray-600">
                  <p>{meeting.description}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleJoinMeeting(meeting.id, meeting.join_url)}
                  disabled={!canJoin || joining === meeting.id}
                  className="flex-1"
                >
                  {joining === meeting.id ? (
                    'Joining...'
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      {canJoin ? 'Join Meeting' : 'Meeting Not Available'}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleCopyLink(meeting.join_url, meeting.id)}
                  className="px-3"
                >
                  {copiedLink === meeting.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open(meeting.join_url, '_blank')}
                  className="px-3"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {meeting.password && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This meeting requires a password: <strong>{meeting.password}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Meeting Details Component
interface MeetingDetailsProps {
  meetingId: string;
  onClose: () => void;
}

export function MeetingDetails({ meetingId, onClose }: MeetingDetailsProps) {
  const [meeting, setMeeting] = useState<ZoomMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/zoom/meetings/${meetingId}`);
      const data = await response.json();
      setMeeting(data);
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      setError('Failed to fetch meeting details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !meeting) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Meeting not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{meeting.topic}</CardTitle>
        <CardDescription>
          {zoomService.formatMeetingTime(meeting.start_time, meeting.timezone)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Duration:</strong> {meeting.duration_minutes} minutes
          </div>
          <div>
            <strong>Status:</strong> {meeting.status}
          </div>
          <div>
            <strong>Participants:</strong> {meeting.participants_count}
          </div>
          {meeting.password && (
            <div>
              <strong>Password:</strong> {meeting.password}
            </div>
          )}
        </div>

        {meeting.description && (
          <div>
            <strong>Description:</strong>
            <p className="mt-1 text-sm text-gray-600">{meeting.description}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => window.open(meeting.join_url, '_blank')}
            className="flex-1"
          >
            <Video className="h-4 w-4 mr-2" />
            Join Meeting
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

