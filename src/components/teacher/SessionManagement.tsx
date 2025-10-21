import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Calendar, Clock, Users, BookOpen, Play, Pause, Square, Plus, Eye, Edit } from 'lucide-react';
import { ClassService, ClassSession, CreateSessionData } from '../../services/classService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface SessionManagementProps {
  onBack: () => void;
}

export function SessionManagement({ onBack }: SessionManagementProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Dialog states
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  // Form states
  const [sessionForm, setSessionForm] = useState<CreateSessionData>({
    class_id: '',
    title: '',
    description: '',
    scheduled_start: '',
    scheduled_end: '',
    duration_minutes: 60,
    notes: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, classesData] = await Promise.all([
        ClassService.getTeacherUpcomingSessions(user!.id),
        ClassService.getTeacherClasses(user!.id)
      ]);
      setSessions(sessionsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      await ClassService.createSession(sessionForm);
      toast.success('Session created successfully');
      setCreateSessionDialogOpen(false);
      setSessionForm({
        class_id: '',
        title: '',
        description: '',
        scheduled_start: '',
        scheduled_end: '',
        duration_minutes: 60,
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await ClassService.updateSessionStatus(sessionId, 'in_progress', {
        actual_start: new Date().toISOString()
      });
      toast.success('Session started');
      loadData();
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await ClassService.updateSessionStatus(sessionId, 'completed', {
        actual_end: new Date().toISOString()
      });
      toast.success('Session completed');
      loadData();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'completed': return <Square className="w-4 h-4" />;
      case 'cancelled': return <Pause className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
            <p className="text-gray-600">Manage your teaching sessions and track progress</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={onBack} variant="outline">
              Back to Dashboard
            </Button>
            <Dialog open={createSessionDialogOpen} onOpenChange={setCreateSessionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Session</DialogTitle>
                  <DialogDescription>
                    Schedule a new teaching session for your class.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="class_id">Class</Label>
                    <select
                      id="class_id"
                      value={sessionForm.class_id}
                      onChange={(e) => setSessionForm({ ...sessionForm, class_id: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a class</option>
                      {classes.map((classData) => (
                        <option key={classData.id} value={classData.id}>
                          {classData.title} - {classData.student?.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="title">Session Title</Label>
                    <Input
                      id="title"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                      placeholder="e.g., Algebra Review Session"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={sessionForm.description}
                      onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                      placeholder="Session description..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduled_start">Start Time</Label>
                    <Input
                      id="scheduled_start"
                      type="datetime-local"
                      value={sessionForm.scheduled_start}
                      onChange={(e) => setSessionForm({ ...sessionForm, scheduled_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={sessionForm.duration_minutes}
                      onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) || 60 })}
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={sessionForm.notes}
                      onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                      placeholder="Session notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateSessionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSession}>Create Session</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-semibold">{upcomingSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-semibold">
                    {sessions.filter(s => s.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Square className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold">{completedSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-semibold">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="completed">Completed Sessions</TabsTrigger>
          </TabsList>

          {/* Upcoming Sessions Tab */}
          <TabsContent value="upcoming" className="space-y-6">
            <h2 className="text-2xl font-semibold">Upcoming Sessions</h2>
            <div className="grid grid-cols-1 gap-6">
              {upcomingSessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription>
                          {session.class?.subject?.name || 'Unknown Subject'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1">{session.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Student: {session.student?.full_name || 'Unknown'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Scheduled: {new Date(session.scheduled_start).toLocaleDateString()} at{' '}
                        {new Date(session.scheduled_start).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        Duration: {session.duration_minutes || 60} minutes
                      </div>
                      {session.description && (
                        <p className="text-sm text-gray-700">{session.description}</p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {session.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleStartSession(session.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Session
                        </Button>
                      )}
                      {session.status === 'in_progress' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleEndSession(session.id)}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          End Session
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {upcomingSessions.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Sessions</h3>
                <p className="text-gray-600 mb-4">You don't have any scheduled sessions yet.</p>
                <Button onClick={() => setCreateSessionDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Session
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Completed Sessions Tab */}
          <TabsContent value="completed" className="space-y-6">
            <h2 className="text-2xl font-semibold">Completed Sessions</h2>
            <div className="grid grid-cols-1 gap-6">
              {completedSessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription>
                          {session.class?.subject?.name || 'Unknown Subject'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {getStatusIcon(session.status)}
                        <span className="ml-1">{session.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Student: {session.student?.full_name || 'Unknown'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Completed: {session.actual_end ? 
                          new Date(session.actual_end).toLocaleDateString() : 
                          new Date(session.scheduled_start).toLocaleDateString()
                        }
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        Duration: {session.duration_minutes || 60} minutes
                      </div>
                      {session.teacher_feedback && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-sm text-gray-600">Teacher Notes:</p>
                          <p className="text-sm text-gray-700">{session.teacher_feedback}</p>
                        </div>
                      )}
                      {session.student_feedback && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium text-sm text-blue-600">Student Feedback:</p>
                          <p className="text-sm text-blue-700">{session.student_feedback}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {completedSessions.length === 0 && (
            <div className="text-center py-12">
              <Square className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Sessions</h3>
              <p className="text-gray-600">You haven't completed any sessions yet.</p>
            </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Session Details Dialog */}
        {selectedSession && (
          <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Session Details</DialogTitle>
                <DialogDescription>
                  View detailed information about this session.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Title</Label>
                  <p className="text-sm text-gray-700">{selectedSession.title}</p>
                </div>
                <div>
                  <Label className="font-medium">Student</Label>
                  <p className="text-sm text-gray-700">{selectedSession.student?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="font-medium">Subject</Label>
                  <p className="text-sm text-gray-700">{selectedSession.class?.subject?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="font-medium">Scheduled Time</Label>
                  <p className="text-sm text-gray-700">
                    {new Date(selectedSession.scheduled_start).toLocaleString()}
                  </p>
                </div>
                {selectedSession.actual_start && (
                  <div>
                    <Label className="font-medium">Actual Start</Label>
                    <p className="text-sm text-gray-700">
                      {new Date(selectedSession.actual_start).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedSession.actual_end && (
                  <div>
                    <Label className="font-medium">Actual End</Label>
                    <p className="text-sm text-gray-700">
                      {new Date(selectedSession.actual_end).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedSession.status)}>
                    {selectedSession.status}
                  </Badge>
                </div>
                {selectedSession.description && (
                  <div>
                    <Label className="font-medium">Description</Label>
                    <p className="text-sm text-gray-700">{selectedSession.description}</p>
                  </div>
                )}
                {selectedSession.notes && (
                  <div>
                    <Label className="font-medium">Notes</Label>
                    <p className="text-sm text-gray-700">{selectedSession.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
