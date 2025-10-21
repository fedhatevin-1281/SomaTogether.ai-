import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar, Clock, Users, Video, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import zoomService, { ZoomMeeting } from '../../services/zoomService';

interface ZoomIntegrationProps {
  teacherId: string;
  onMeetingCreated?: (meeting: ZoomMeeting) => void;
}

interface ZoomAccount {
  id: string;
  teacher_id: string;
  zoom_user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  personal_meeting_url: string;
  is_active: boolean;
}

export function ZoomIntegration({ teacherId, onMeetingCreated }: ZoomIntegrationProps) {
  const [account, setAccount] = useState<ZoomAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Connection form state
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [email, setEmail] = useState('');

  // Meeting creation state
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    topic: '',
    startTime: '',
    duration: 60,
    timezone: 'UTC'
  });

  useEffect(() => {
    fetchZoomStatus();
  }, [teacherId]);

  const fetchZoomStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/zoom/status/${teacherId}`);
      const data = await response.json();

      if (data.connected && data.account) {
        setAccount(data.account);
      }
    } catch (error) {
      console.error('Error fetching Zoom status:', error);
      setError('Failed to fetch Zoom account status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/zoom/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId,
          zoomUserId: email, // Using email as Zoom user ID for now
          email,
          firstName: 'Teacher', // You might want to get this from profile
          lastName: 'User',
          apiKey,
          apiSecret
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Zoom account connected successfully!');
        setAccount(data.zoomAccount);
        // Clear form
        setApiKey('');
        setApiSecret('');
        setEmail('');
      } else {
        setError(data.error || 'Failed to connect Zoom account');
      }
    } catch (error) {
      console.error('Error connecting Zoom account:', error);
      setError('Failed to connect Zoom account');
    } finally {
      setConnecting(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMeeting(true);
    setError(null);

    try {
      const response = await fetch('/api/zoom/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'temp-session', // You'll need to pass actual session ID
          topic: meetingForm.topic,
          startTime: meetingForm.startTime,
          duration: meetingForm.duration,
          timezone: meetingForm.timezone
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Meeting created successfully!');
        if (onMeetingCreated) {
          onMeetingCreated(data.meeting);
        }
        // Clear form
        setMeetingForm({
          topic: '',
          startTime: '',
          duration: 60,
          timezone: 'UTC'
        });
      } else {
        setError(data.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError('Failed to create meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading Zoom integration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={account ? "meetings" : "connect"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connect">Connect Account</TabsTrigger>
          <TabsTrigger value="meetings">Manage Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Connect Your Zoom Account
              </CardTitle>
              <CardDescription>
                Connect your Zoom account to create and manage online classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {account ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Zoom Account Connected</p>
                      <p className="text-sm text-green-600">{account.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Personal Meeting Room</Label>
                    <p className="text-sm text-gray-600">
                      <a 
                        href={account.personal_meeting_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {account.personal_meeting_url}
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConnect} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Zoom Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Zoom API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Zoom API Key"
                      autoComplete="off"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">Zoom API Secret</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Enter your Zoom API Secret"
                      autoComplete="off"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={connecting} className="w-full">
                    {connecting ? 'Connecting...' : 'Connect Zoom Account'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          {account ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Meeting</CardTitle>
                  <CardDescription>
                    Schedule a new Zoom meeting for your class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateMeeting} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Meeting Topic</Label>
                      <Input
                        id="topic"
                        value={meetingForm.topic}
                        onChange={(e) => setMeetingForm({ ...meetingForm, topic: e.target.value })}
                        placeholder="e.g., Advanced Mathematics - Chapter 5"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={meetingForm.startTime}
                          onChange={(e) => setMeetingForm({ ...meetingForm, startTime: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={meetingForm.duration}
                          onChange={(e) => setMeetingForm({ ...meetingForm, duration: parseInt(e.target.value) })}
                          min="15"
                          max="480"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={meetingForm.timezone}
                        onChange={(e) => setMeetingForm({ ...meetingForm, timezone: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>

                    <Button type="submit" disabled={creatingMeeting} className="w-full">
                      {creatingMeeting ? 'Creating Meeting...' : 'Create Meeting'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <MeetingList teacherId={teacherId} />
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Connect Zoom Account First</h3>
                <p className="text-gray-600 mb-4">
                  You need to connect your Zoom account before you can create meetings.
                </p>
                <Button onClick={() => document.querySelector('[value="connect"]')?.click()}>
                  Connect Account
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Meeting List Component
function MeetingList({ teacherId }: { teacherId: string }) {
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, [teacherId]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/zoom/meetings/teacher/${teacherId}?status=upcoming`);
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Meetings</CardTitle>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No upcoming meetings</p>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h4 className="font-medium">{meeting.topic}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {zoomService.formatMeetingTime(meeting.start_time, meeting.timezone)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {meeting.duration} minutes
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {meeting.status}
                  </Badge>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(meeting.join_url, '_blank')}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Join Meeting
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(meeting.join_url)}
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

