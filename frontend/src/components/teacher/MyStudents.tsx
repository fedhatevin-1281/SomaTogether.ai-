import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  MessageSquare,
  MoreVertical,
  Award,
  Clock,
  Star,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TeacherService, TeacherStudent } from '../../services/teacherService';

interface MyStudentsProps {
  onBack?: () => void;
}

export function MyStudents({ onBack }: MyStudentsProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const studentsData = await TeacherService.getMyStudents(user.id);
        setStudents(studentsData);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user?.id]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.class_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalSessions = students.reduce((sum, s) => sum + s.completed_sessions, 0);
  const avgImprovement = students.length > 0 ? 
    Math.round(students.reduce((sum, s) => sum + (s.completed_sessions / Math.max(s.total_sessions, 1)) * 100, 0) / students.length) : 0;
  const successRate = students.length > 0 ? 
    Math.round((students.filter(s => s.average_grade && ['A', 'B'].includes(s.average_grade)).length / students.length) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPaymentColor = (tokens: number) => {
    if (tokens >= 100) return 'bg-green-100 text-green-800';
    if (tokens >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    if (grade === 'N/A') return 'text-slate-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatNextSession = (nextSession: TeacherStudent['next_session']) => {
    if (!nextSession) return 'No upcoming session';
    
    const sessionDate = new Date(nextSession.start_time);
    const now = new Date();
    const diffTime = sessionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    
    return sessionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading students...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Students</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Students</h1>
          <p className="text-slate-600">Manage your student relationships and progress</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          {activeStudents} Active Students
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-slate-600">Active Students</p>
              <p className="text-2xl font-bold">{activeStudents}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-slate-600">Avg Progress</p>
              <p className="text-2xl font-bold">{avgImprovement}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-slate-600">Total Sessions</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-slate-600">Success Rate</p>
              <p className="text-2xl font-bold">{successRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('completed')}
              size="sm"
            >
              Completed
            </Button>
            <Button
              variant={filterStatus === 'paused' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('paused')}
              size="sm"
            >
              Paused
            </Button>
          </div>
        </div>
      </Card>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Students Found</h3>
          <p className="text-slate-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'No students match your current filters.' 
              : 'You don\'t have any students yet. Students will appear here once they join your classes.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                    alt={student.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold">{student.name}</h3>
                    <p className="text-sm text-slate-600">{student.subject_name}</p>
                    <p className="text-xs text-slate-500">Joined {formatDate(student.join_date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(student.status)}>
                    {student.status}
                  </Badge>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Session Progress</span>
                    <span>{student.completed_sessions}/{student.total_sessions}</span>
                  </div>
                  <Progress 
                    value={student.total_sessions > 0 ? (student.completed_sessions / student.total_sessions) * 100 : 0} 
                    className="h-2" 
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-600">Average Grade</p>
                    <p className={`font-bold ${getGradeColor(student.average_grade)}`}>
                      {student.average_grade}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Assignments</p>
                    <p className="font-bold text-blue-600">{student.completed_assignments}/{student.total_assignments}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Tokens</p>
                    <Badge className={`${getPaymentColor(student.tokens)} text-xs`}>
                      {student.tokens}
                    </Badge>
                  </div>
                </div>

                {/* Next Session */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Next Session</p>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatNextSession(student.next_session)}</span>
                    </div>
                  </div>
                  {student.status === 'active' && student.next_session && (
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      Join Session
                    </Button>
                  )}
                  {student.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {student.status === 'active' && !student.next_session && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      No upcoming session
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Progress
                  </Button>
                  {student.parent_info && (
                    <Button variant="outline" className="flex-1">
                      Contact Parent
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}