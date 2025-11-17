import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Star, MapPin, Clock, Filter, Search, ArrowLeft, Users, BookOpen, MessageSquare } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { StudentProfileView } from '../student/StudentProfileView';

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  grade_level?: string;
  learning_goals?: string[];
  interests?: string[];
  learning_style?: string;
  wallet_balance?: number;
  tokens?: number;
  created_at: string;
}

interface BrowseStudentsProps {
  onBack: () => void;
  teacherId: string;
}

export function BrowseStudents({ onBack, teacherId }: BrowseStudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch students with their profile information
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          grade_level,
          learning_goals,
          interests,
          learning_style,
          wallet_balance,
          tokens,
          profiles!students_id_fkey (
            id,
            full_name,
            email,
            avatar_url,
            bio,
            location,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
      }

      // Transform the data to match our interface
      const transformedStudents = studentsData?.map(item => ({
        id: item.id,
        full_name: item.profiles.full_name,
        email: item.profiles.email,
        avatar_url: item.profiles.avatar_url,
        bio: item.profiles.bio,
        location: item.profiles.location,
        grade_level: item.grade_level,
        learning_goals: item.learning_goals || [],
        interests: item.interests || [],
        learning_style: item.learning_style,
        wallet_balance: item.wallet_balance,
        tokens: item.tokens,
        created_at: item.profiles.created_at,
      })) || [];

      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = gradeFilter === 'all' || student.grade_level === gradeFilter;
    
    const matchesSubject = subjectFilter === 'all' || 
                          (student.learning_goals && student.learning_goals.some(goal => 
                            goal.toLowerCase().includes(subjectFilter.toLowerCase())
                          ));

    return matchesSearch && matchesGrade && matchesSubject;
  });

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleMessageStudent = () => {
    // TODO: Implement messaging functionality
    console.log('Message student:', selectedStudent?.id);
  };

  const handleBookSession = () => {
    // TODO: Implement session booking functionality
    console.log('Send request to student:', selectedStudent?.id);
  };

  if (selectedStudent) {
    return (
      <StudentProfileView
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
        onMessageStudent={handleMessageStudent}
        onBookSession={handleBookSession}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Browse Students</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Browse Students</h1>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="Grade 1">Grade 1</SelectItem>
              <SelectItem value="Grade 2">Grade 2</SelectItem>
              <SelectItem value="Grade 3">Grade 3</SelectItem>
              <SelectItem value="Grade 4">Grade 4</SelectItem>
              <SelectItem value="Grade 5">Grade 5</SelectItem>
              <SelectItem value="Grade 6">Grade 6</SelectItem>
              <SelectItem value="Grade 7">Grade 7</SelectItem>
              <SelectItem value="Grade 8">Grade 8</SelectItem>
              <SelectItem value="Form 1">Form 1</SelectItem>
              <SelectItem value="Form 2">Form 2</SelectItem>
              <SelectItem value="Form 3">Form 3</SelectItem>
              <SelectItem value="Form 4">Form 4</SelectItem>
              <SelectItem value="College">College</SelectItem>
            </SelectContent>
          </Select>

          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="history">History</SelectItem>
              <SelectItem value="geography">Geography</SelectItem>
              <SelectItem value="computer">Computer Science</SelectItem>
              <SelectItem value="art">Art</SelectItem>
              <SelectItem value="music">Music</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Users className="h-4 w-4" />
            <span>{filteredStudents.length} students found</span>
          </div>
        </div>
      </Card>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStudentSelect(student)}>
            <div className="flex items-start space-x-4">
              <img
                src={student.avatar_url || '/default-avatar.png'}
                alt={student.full_name}
                className="w-16 h-16 rounded-full object-cover bg-slate-200"
              />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1 truncate">{student.full_name}</h3>
                <p className="text-slate-600 text-sm mb-2">{student.grade_level || 'Student'}</p>
                
                {student.location && (
                  <div className="flex items-center space-x-1 text-sm text-slate-500 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{student.location}</span>
                  </div>
                )}

                {student.bio && (
                  <p className="text-sm text-slate-700 mb-3 line-clamp-2">{student.bio}</p>
                )}

                {student.learning_goals && student.learning_goals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {student.learning_goals.slice(0, 3).map((goal, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {goal.length > 15 ? `${goal.substring(0, 15)}...` : goal}
                      </Badge>
                    ))}
                    {student.learning_goals.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{student.learning_goals.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-slate-600">
                    <Clock className="h-3 w-3" />
                    <span>Member since {new Date(student.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button size="sm" variant="outline">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No students found</h3>
          <p className="text-slate-500">
            {searchTerm || gradeFilter !== 'all' || subjectFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No students have registered yet'}
          </p>
        </Card>
      )}
    </div>
  );
}
