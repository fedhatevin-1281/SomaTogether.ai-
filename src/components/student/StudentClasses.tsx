import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Calendar, Clock, Users, BookOpen, Play, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { ClassService, Class, ClassSession } from '../../services/classService';
import { AssignmentService, Assignment, AssignmentSubmission } from '../../services/assignmentService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface StudentClassesProps {
  onBack: () => void;
}

export function StudentClasses({ onBack }: StudentClassesProps) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Form states
  const [submissionForm, setSubmissionForm] = useState({
    content: '',
    attachments: [] as any[]
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, assignmentsData, submissionsData, sessionsData] = await Promise.all([
        ClassService.getStudentClasses(user!.id),
        AssignmentService.getStudentAssignments(user!.id),
        AssignmentService.getStudentSubmissions(user!.id),
        ClassService.getStudentUpcomingSessions(user!.id)
      ]);
      setClasses(classesData);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);
      setUpcomingSessions(sessionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      await AssignmentService.submitAssignment({
        assignment_id: selectedAssignment.id,
        student_id: user!.id,
        class_id: selectedAssignment.class_id,
        content: submissionForm.content,
        attachments: submissionForm.attachments
      });
      toast.success('Assignment submitted successfully');
      setAssignmentDialogOpen(false);
      setSubmissionForm({ content: '', attachments: [] });
      setSelectedAssignment(null);
      loadData();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-purple-100 text-purple-800';
      case 'late': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isAssignmentSubmitted = (assignmentId: string) => {
    return submissions.some(s => s.assignment_id === assignmentId);
  };

  const isAssignmentLate = (assignment: Assignment) => {
    return assignment.due_date && new Date(assignment.due_date) < new Date();
  };

  const getAssignmentSubmission = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your classes and assignments...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-600">Track your learning progress and assignments</p>
          </div>
          <Button onClick={onBack} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Classes</p>
                  <p className="text-2xl font-semibold">{classes.filter(c => c.status === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                  <p className="text-2xl font-semibold">{upcomingSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assignments</p>
                  <p className="text-2xl font-semibold">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-2xl font-semibold">{submissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Upcoming Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingSessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{session.title}</p>
                            <p className="text-sm text-gray-600">
                              {session.class?.subject?.name} • {session.class?.teacher?.full_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(session.scheduled_start).toLocaleDateString()} at{' '}
                              {new Date(session.scheduled_start).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge className={getSessionStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Recent Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length > 0 ? (
                    <div className="space-y-3">
                      {assignments.slice(0, 3).map((assignment) => {
                        const submission = getAssignmentSubmission(assignment.id);
                        const isSubmitted = isAssignmentSubmitted(assignment.id);
                        const isLate = isAssignmentLate(assignment);
                        
                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{assignment.title}</p>
                              <p className="text-sm text-gray-600">
                                {assignment.subject?.name} • {assignment.max_points} points
                              </p>
                              {assignment.due_date && (
                                <p className={`text-sm ${isLate && !isSubmitted ? 'text-red-600' : 'text-gray-500'}`}>
                                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {isSubmitted ? (
                                <Badge className={getSubmissionStatusColor(submission?.status || 'submitted')}>
                                  {submission?.status || 'Submitted'}
                                </Badge>
                              ) : (
                                <Badge variant={isLate ? 'destructive' : 'secondary'}>
                                  {isLate ? 'Late' : 'Pending'}
                                </Badge>
                              )}
                              {submission?.points_earned !== null && (
                                <span className="text-sm font-medium">
                                  {submission.points_earned}/{assignment.max_points}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No assignments yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <h2 className="text-2xl font-semibold">My Classes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classData) => (
                <Card key={classData.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{classData.title}</CardTitle>
                        <CardDescription>
                          {classData.subject?.name || 'Unknown Subject'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(classData.status)}>
                        {classData.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Teacher: {classData.teacher?.full_name || 'Unknown'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Started: {new Date(classData.start_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        Rate: ${classData.hourly_rate}/hour
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Sessions: {classData.completed_sessions}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Join Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {classes.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Yet</h3>
                <p className="text-gray-600 mb-4">You haven't been enrolled in any classes yet.</p>
                <Button onClick={onBack}>
                  Browse Teachers
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <h2 className="text-2xl font-semibold">My Assignments</h2>
            <div className="grid grid-cols-1 gap-6">
              {assignments.map((assignment) => {
                const submission = getAssignmentSubmission(assignment.id);
                const isSubmitted = isAssignmentSubmitted(assignment.id);
                const isLate = isAssignmentLate(assignment);
                
                return (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <CardDescription>
                            {assignment.subject?.name} • {assignment.max_points} points
                          </CardDescription>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Badge variant={assignment.difficulty_level === 'easy' ? 'default' : 
                                       assignment.difficulty_level === 'medium' ? 'secondary' : 'destructive'}>
                            {assignment.difficulty_level}
                          </Badge>
                          {isSubmitted ? (
                            <Badge className={getSubmissionStatusColor(submission?.status || 'submitted')}>
                              {submission?.status || 'Submitted'}
                            </Badge>
                          ) : (
                            <Badge variant={isLate ? 'destructive' : 'secondary'}>
                              {isLate ? 'Late' : 'Pending'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-gray-700">{assignment.description}</p>
                        {assignment.instructions && (
                          <div>
                            <p className="font-medium text-sm text-gray-600">Instructions:</p>
                            <p className="text-sm text-gray-700">{assignment.instructions}</p>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                        </div>
                        {submission && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-sm text-gray-600">Your Submission:</p>
                            <p className="text-sm text-gray-700">{submission.content}</p>
                            {submission.points_earned !== null && (
                              <div className="mt-2">
                                <p className="font-medium text-sm text-gray-600">Grade:</p>
                                <p className="text-lg font-semibold text-green-600">
                                  {submission.points_earned}/{assignment.max_points}
                                </p>
                              </div>
                            )}
                            {submission.feedback && (
                              <div className="mt-2">
                                <p className="font-medium text-sm text-gray-600">Feedback:</p>
                                <p className="text-sm text-gray-700">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        {!isSubmitted && !isLate && (
                          <Button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setAssignmentDialogOpen(true);
                            }}
                          >
                            Submit Assignment
                          </Button>
                        )}
                        {isSubmitted && (
                          <Button variant="outline" disabled>
                            Already Submitted
                          </Button>
                        )}
                        {isLate && !isSubmitted && (
                          <Button variant="destructive" disabled>
                            Assignment Late
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {assignments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600 mb-4">Your teachers haven't assigned any homework yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Assignment Submission Dialog */}
        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
              <DialogDescription>
                Submit your work for: {selectedAssignment?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="submission-content">Your Answer</Label>
                <Textarea
                  id="submission-content"
                  value={submissionForm.content}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, content: e.target.value })}
                  placeholder="Write your answer here..."
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="submission-attachments">Attachments (Optional)</Label>
                <Input
                  id="submission-attachments"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSubmissionForm({ ...submissionForm, attachments: files });
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitAssignment}>
                Submit Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}








