import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Clock, Users, BookOpen, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { ClassService, Class, CreateClassData } from '../../services/classService';
import { AssignmentService, Assignment } from '../../services/assignmentService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface ClassManagementProps {
  onBack: () => void;
}

export function ClassManagement({ onBack }: ClassManagementProps) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classes');
  
  // Dialog states
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [createAssignmentDialogOpen, setCreateAssignmentDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Form states
  const [classForm, setClassForm] = useState<CreateClassData>({
    teacher_id: user?.id || '',
    student_id: '',
    subject_id: '',
    title: '',
    description: '',
    hourly_rate: 0,
    currency: 'USD'
  });

  const [assignmentForm, setAssignmentForm] = useState({
    teacher_id: user?.id || '',
    class_id: '',
    subject_id: '',
    title: '',
    description: '',
    instructions: '',
    max_points: 100,
    due_date: '',
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard'
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, assignmentsData] = await Promise.all([
        ClassService.getTeacherClasses(user!.id),
        AssignmentService.getTeacherAssignments(user!.id)
      ]);
      setClasses(classesData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    try {
      await ClassService.createClass(classForm);
      toast.success('Class created successfully');
      setCreateClassDialogOpen(false);
      setClassForm({
        teacher_id: user?.id || '',
        student_id: '',
        subject_id: '',
        title: '',
        description: '',
        hourly_rate: 0,
        currency: 'USD'
      });
      loadData();
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    }
  };

  const handleCreateAssignment = async () => {
    try {
      await AssignmentService.createAssignment(assignmentForm);
      toast.success('Assignment created successfully');
      setCreateAssignmentDialogOpen(false);
      setAssignmentForm({
        teacher_id: user?.id || '',
        class_id: '',
        subject_id: '',
        title: '',
        description: '',
        instructions: '',
        max_points: 100,
        due_date: '',
        difficulty_level: 'medium'
      });
      loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classes and assignments...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
            <p className="text-gray-600">Manage your classes, students, and assignments</p>
          </div>
          <Button onClick={onBack} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classes">Classes ({classes.length})</TabsTrigger>
            <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Classes</h2>
              <Dialog open={createClassDialogOpen} onOpenChange={setCreateClassDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>
                      Set up a new class for a student.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Class Title</Label>
                      <Input
                        id="title"
                        value={classForm.title}
                        onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                        placeholder="e.g., Advanced Mathematics"
                      />
                    </div>
                    <div>
                      <Label htmlFor="student_id">Student ID</Label>
                      <Input
                        id="student_id"
                        value={classForm.student_id}
                        onChange={(e) => setClassForm({ ...classForm, student_id: e.target.value })}
                        placeholder="Student UUID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject_id">Subject ID</Label>
                      <Input
                        id="subject_id"
                        value={classForm.subject_id}
                        onChange={(e) => setClassForm({ ...classForm, subject_id: e.target.value })}
                        placeholder="Subject UUID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={classForm.hourly_rate}
                        onChange={(e) => setClassForm({ ...classForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                        placeholder="25.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={classForm.description}
                        onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                        placeholder="Class description..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateClassDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateClass}>Create Class</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

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
                        Student: {classData.student?.full_name || 'Unknown'}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClass(classData)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
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
                <p className="text-gray-600 mb-4">Create your first class to start teaching students.</p>
                <Button onClick={() => setCreateClassDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Class
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Assignments</h2>
              <Dialog open={createAssignmentDialogOpen} onOpenChange={setCreateAssignmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                      Create a new assignment for your students.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="assignment-title">Title</Label>
                      <Input
                        id="assignment-title"
                        value={assignmentForm.title}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                        placeholder="Assignment title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="assignment-description">Description</Label>
                      <Textarea
                        id="assignment-description"
                        value={assignmentForm.description}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                        placeholder="Assignment description..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-points">Max Points</Label>
                      <Input
                        id="max-points"
                        type="number"
                        value={assignmentForm.max_points}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, max_points: parseInt(e.target.value) || 100 })}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input
                        id="due-date"
                        type="datetime-local"
                        value={assignmentForm.due_date}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        value={assignmentForm.difficulty_level}
                        onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                          setAssignmentForm({ ...assignmentForm, difficulty_level: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateAssignmentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAssignment}>Create Assignment</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>
                          {assignment.subject?.name || 'Unknown Subject'}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Badge className={getDifficultyColor(assignment.difficulty_level)}>
                          {assignment.difficulty_level}
                        </Badge>
                        <Badge variant={assignment.is_published ? 'default' : 'secondary'}>
                          {assignment.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Max Points: {assignment.max_points}
                      </div>
                      {assignment.due_date && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        Created: {new Date(assignment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {assignments.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600 mb-4">Create your first assignment for your students.</p>
                <Button onClick={() => setCreateAssignmentDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Assignment
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}













