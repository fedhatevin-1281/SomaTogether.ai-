import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AssignmentService, AssignmentSubmission } from '../../services/assignmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Star,
  User,
  Calendar,
  MessageSquare,
  Save,
  Eye,
  AlertCircle
} from 'lucide-react';

interface TeacherSubmissionsProps {
  onBack: () => void;
}

export function TeacherSubmissions({ onBack }: TeacherSubmissionsProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [grade, setGrade] = useState('');
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSubmissions();
    }
  }, [user?.id, selectedTab]);

  const fetchSubmissions = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const submissionsData = await AssignmentService.getTeacherSubmissions(user.id);
      
      // Filter submissions based on selected tab
      const filteredSubmissions = submissionsData.filter(submission => {
        if (selectedTab === 'pending') {
          return submission.status === 'submitted';
        } else if (selectedTab === 'graded') {
          return submission.status === 'graded';
        }
        return true;
      });
      
      setSubmissions(filteredSubmissions);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || '');
    setPointsEarned(submission.points_earned || 0);
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission || !user?.id) return;
    
    setGrading(true);
    setError(null);
    
    try {
      await AssignmentService.gradeSubmission({
        submissionId: selectedSubmission.id,
        grade: grade,
        pointsEarned: pointsEarned,
        feedback: feedback,
        gradedBy: user.id
      });
      
      setGradingDialogOpen(false);
      setSelectedSubmission(null);
      fetchSubmissions(); // Refresh submissions
    } catch (err: any) {
      console.error('Error grading submission:', err);
      setError(err.message || 'Failed to grade submission.');
    } finally {
      setGrading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'submitted': return 'secondary';
      case 'graded': return 'default';
      case 'late': return 'destructive';
      default: return 'outline';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Grade Submissions</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="graded" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Graded ({gradedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingSubmissions.length === 0 ? (
            <Card className="p-6 text-center text-slate-600">
              <Clock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p>No pending submissions to grade. Great work staying on top of grading!</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingSubmissions.map(submission => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{submission.assignment_title}</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3" />
                            {submission.student_name}
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(submission.status)}>
                        {submission.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-3 w-3" />
                      Submitted: {formatDate(submission.submitted_at)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText className="h-3 w-3" />
                      Max Points: {submission.max_points}
                    </div>
                    {submission.is_late && (
                      <Badge variant="destructive" className="text-xs">
                        Late Submission
                      </Badge>
                    )}
                    <Button 
                      className="w-full" 
                      onClick={() => handleGradeSubmission(submission)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Grade Submission
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="graded" className="mt-6">
          {gradedSubmissions.length === 0 ? (
            <Card className="p-6 text-center text-slate-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p>No graded submissions yet. Start grading to see them here!</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gradedSubmissions.map(submission => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{submission.assignment_title}</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3" />
                            {submission.student_name}
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(submission.status)}>
                        {submission.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Grade:</span>
                      <span className={`font-bold ${getGradeColor(submission.grade || '')}`}>
                        {submission.grade || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Points:</span>
                      <span className="font-bold">
                        {submission.points_earned}/{submission.max_points}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-3 w-3" />
                      Graded: {submission.graded_at ? formatDate(submission.graded_at) : 'N/A'}
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleGradeSubmission(submission)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View & Edit Grade
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Grading Dialog */}
      <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Grade Submission: {selectedSubmission?.assignment_title}
            </DialogTitle>
            <DialogDescription>
              Student: {selectedSubmission?.student_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Student's Submission Content */}
            <div className="space-y-2">
              <Label>Student's Submission:</Label>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedSubmission?.content || 'No content provided.'}
                </p>
              </div>
            </div>

            {/* Grade Input */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="A, B, C, D, F"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points Earned</Label>
                <Input
                  id="points"
                  type="number"
                  value={pointsEarned}
                  onChange={(e) => setPointsEarned(Number(e.target.value))}
                  min="0"
                  max={selectedSubmission?.max_points || 100}
                />
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide constructive feedback to help the student improve..."
                rows={4}
              />
            </div>

            {/* Submission Info */}
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <span className="font-medium">Max Points:</span> {selectedSubmission?.max_points}
              </div>
              <div>
                <span className="font-medium">Submitted:</span> {selectedSubmission?.submitted_at ? formatDate(selectedSubmission.submitted_at) : 'N/A'}
              </div>
            </div>

            {selectedSubmission?.is_late && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>This submission was submitted late.</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setGradingDialogOpen(false)}
              disabled={grading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveGrade} 
              disabled={grading || !grade.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {grading ? 'Saving...' : 'Save Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

