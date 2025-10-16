import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AssignmentService } from '../../services/assignmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ArrowLeft, 
  Upload, 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  X,
  Users,
  Tag,
  Save,
  Eye,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface UploadAssignmentProps {
  onBack: () => void;
}

export function UploadAssignment({ onBack }: UploadAssignmentProps) {
  const { user } = useAuth();
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    instructions: '',
    subject_id: '',
    class_id: '',
    due_date: '',
    max_points: 100,
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
    estimated_time_minutes: '',
    attachments: [] as any[],
    resources: [] as any[]
  });

  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; title: string; student_name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subjectsData, classesData] = await Promise.all([
        AssignmentService.getSubjects(),
        AssignmentService.getTeacherClasses(user!.id)
      ]);
      setSubjects(subjectsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load subjects and classes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAttachment = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const fileData = Array.from(files).map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file) // For preview, in real app upload to storage
        }));
        setAssignmentData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...fileData]
        }));
      }
    };
    fileInput.click();
  };

  const handleAddResource = () => {
    const resource = prompt('Enter resource URL or description:');
    if (resource) {
      setAssignmentData(prev => ({
        ...prev,
        resources: [...prev.resources, { url: resource, description: resource }]
      }));
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAssignmentData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveResource = (index: number) => {
    setAssignmentData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleSaveDraft = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await AssignmentService.createAssignment({
        teacher_id: user.id,
        subject_id: assignmentData.subject_id,
        class_id: assignmentData.class_id || undefined,
        title: assignmentData.title,
        description: assignmentData.description,
        instructions: assignmentData.instructions || undefined,
        attachments: assignmentData.attachments,
        resources: assignmentData.resources,
        max_points: assignmentData.max_points,
        due_date: assignmentData.due_date || undefined,
        is_published: false,
        difficulty_level: assignmentData.difficulty_level,
        estimated_time_minutes: assignmentData.estimated_time_minutes ? parseInt(assignmentData.estimated_time_minutes) : undefined
      });
      setSuccess('Assignment saved as draft successfully!');
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      setError(error.message || 'Failed to save assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await AssignmentService.createAssignment({
        teacher_id: user.id,
        subject_id: assignmentData.subject_id,
        class_id: assignmentData.class_id || undefined,
        title: assignmentData.title,
        description: assignmentData.description,
        instructions: assignmentData.instructions || undefined,
        attachments: assignmentData.attachments,
        resources: assignmentData.resources,
        max_points: assignmentData.max_points,
        due_date: assignmentData.due_date || undefined,
        is_published: true,
        difficulty_level: assignmentData.difficulty_level,
        estimated_time_minutes: assignmentData.estimated_time_minutes ? parseInt(assignmentData.estimated_time_minutes) : undefined
      });
      
      setSuccess('Assignment published successfully!');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error: any) {
      console.error('Error publishing assignment:', error);
      setError(error.message || 'Failed to publish assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = assignmentData.title && assignmentData.description && assignmentData.subject_id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Assignment</h1>
            <p className="text-slate-600">Upload a new assignment for your students</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignment Details
          </CardTitle>
          <CardDescription>
            Fill in the details for your assignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                value={assignmentData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter assignment title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={assignmentData.subject_id} onValueChange={(value) => handleInputChange('subject_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={assignmentData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what students need to do"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={assignmentData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Provide step-by-step instructions"
              rows={4}
            />
          </div>

          {/* Assignment Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxPoints">Max Points</Label>
              <Input
                id="maxPoints"
                type="number"
                value={assignmentData.max_points}
                onChange={(e) => handleInputChange('max_points', parseInt(e.target.value) || 100)}
                min="1"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={assignmentData.difficulty_level} onValueChange={(value) => handleInputChange('difficulty_level', value)}>
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
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
              <Input
                id="estimatedTime"
                type="number"
                value={assignmentData.estimated_time_minutes}
                onChange={(e) => handleInputChange('estimated_time_minutes', e.target.value)}
                placeholder="e.g., 60"
                min="1"
              />
            </div>
          </div>

          {/* Due Date and Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={assignmentData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Assign to Class (Optional)</Label>
              <Select value={assignmentData.class_id} onValueChange={(value) => handleInputChange('class_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.title} - {cls.student_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Attachments</Label>
              <Button variant="outline" size="sm" onClick={handleAddAttachment}>
                <Plus className="h-4 w-4 mr-2" />
                Add Files
              </Button>
            </div>
            {assignmentData.attachments.length > 0 && (
              <div className="space-y-2">
                {assignmentData.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">{attachment.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Resources</Label>
              <Button variant="outline" size="sm" onClick={handleAddResource}>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>
            {assignmentData.resources.length > 0 && (
              <div className="space-y-2">
                {assignmentData.resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Tag className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">{resource.description}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveResource(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!isFormValid || isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish Assignment
          </Button>
        </div>
      </div>
    </div>
  );
}