import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AssignmentService, Assignment, AssignmentSubmission } from '../../services/assignmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  Download,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  User,
  Tag,
  Star
} from 'lucide-react';

interface AssignmentsProps {
  onBack: () => void;
}

export function Assignments({ onBack }: AssignmentsProps) {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignmentsData, submissionsData] = await Promise.all([
        AssignmentService.getStudentAssignments(user!.id),
        AssignmentService.getStudentSubmissions(user!.id)
      ]);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      // Extract user-friendly error message
      let errorMessage = 'Failed to load assignments';
      if (error?.message) {
        // Check if it's a database error with SQL syntax
        if (error.message.includes('invalid input syntax for type uuid')) {
          errorMessage = 'There was an issue loading your assignments. Please try again.';
        } else if (error.message.includes('JWT')) {
          errorMessage = 'Please log in again to view your assignments.';
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !user?.id) return;
    
    setIsSubmitting(true);
    try {
      await AssignmentService.submitAssignment({
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        class_id: selectedAssignment.class_id,
        content: submissionContent,
        due_date: selectedAssignment.due_date
      });
      
      setIsSubmissionDialogOpen(false);
      setSubmissionContent('');
      setSelectedAssignment(null);
      loadData(); // Refresh data
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      setError(error.message || 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = submissions.find(sub => sub.assignment_id === assignment.id);
    if (submission) {
      return submission.status;
    }
    return 'pending';
  };

  const getTimeUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    if (hours > 0) return `${hours} hours`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} minutes`;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingAssignments = assignments.filter(assignment => 
    getAssignmentStatus(assignment) === 'pending'
  );
  
  const submittedAssignments = assignments.filter(assignment => {
    const status = getAssignmentStatus(assignment);
    return status === 'submitted' || status === 'graded' || status === 'returned';
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assignments</h1>
            <p className="text-slate-600">View and submit your assignments</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedAssignments.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Assignments */}
        <TabsContent value="pending" className="space-y-4">
          {pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No pending assignments</h3>
                <p className="text-slate-500">You're all caught up! Check back later for new assignments.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingAssignments.map(assignment => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(assignment.difficulty_level)}>
                        {assignment.difficulty_level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Assignment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span>{assignment.teacher?.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4 text-slate-500" />
                          <span>{assignment.subject?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-slate-500" />
                          <span>{assignment.max_points} points</span>
                        </div>
                      </div>

                      {/* Due Date and Time */}
                      {assignment.due_date && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className={`text-sm font-medium ${
                              getTimeUntilDue(assignment.due_date) === 'Overdue' ? 'text-red-600' : 'text-slate-600'
                            }`}>
                              {getTimeUntilDue(assignment.due_date)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      {assignment.instructions && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Instructions:</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                            {assignment.instructions}
                          </p>
                        </div>
                      )}

                      {/* Attachments */}
                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Attachments:</h4>
                          <div className="flex flex-wrap gap-2">
                            {assignment.attachments.map((attachment, index) => (
                              <Button key={index} variant="outline" size="sm">
                                <Download className="h-3 w-3 mr-2" />
                                {attachment.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setIsSubmissionDialogOpen(true);
                          }}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Assignment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Submitted Assignments */}
        <TabsContent value="submitted" className="space-y-4">
          {submittedAssignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No submitted assignments</h3>
                <p className="text-slate-500">Your submitted assignments will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {submittedAssignments.map(assignment => {
                const submission = submissions.find(sub => sub.assignment_id === assignment.id);
                return (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <CardDescription>{assignment.description}</CardDescription>
                        </div>
                        <Badge variant={
                          submission?.status === 'graded' ? 'default' :
                          submission?.status === 'returned' ? 'secondary' :
                          'outline'
                        }>
                          {submission?.status || 'pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Submission Details */}
                        {submission && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-slate-500" />
                              <span>
                                {submission.points_earned !== null ? 
                                  `${submission.points_earned}/${submission.max_points} points` : 
                                  'Not graded yet'
                                }
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {submission.is_late ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              <span className={submission.is_late ? 'text-red-600' : 'text-green-600'}>
                                {submission.is_late ? 'Late submission' : 'On time'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Grade and Feedback */}
                        {submission?.status === 'graded' && (
                          <div className="space-y-3">
                            {submission.grade && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-1">Grade: {submission.grade}</h4>
                                <p className="text-sm text-blue-800">{submission.points_earned}/{submission.max_points} points</p>
                              </div>
                            )}
                            {submission.feedback && (
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <h4 className="font-medium text-sm mb-2">Teacher Feedback:</h4>
                                <p className="text-sm text-slate-700">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {submission?.status === 'graded' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download Feedback
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submission Dialog */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              Submit your work for: {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submission-content">Your Submission</Label>
              <Textarea
                id="submission-content"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Describe your work, provide answers, or explain your approach..."
                rows={6}
              />
            </div>
            
            {selectedAssignment?.instructions && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Instructions:</h4>
                <p className="text-sm text-slate-700">{selectedAssignment.instructions}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAssignment}
              disabled={!submissionContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Submit Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}