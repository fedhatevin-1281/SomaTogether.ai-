import { supabase } from '../supabaseClient';

export interface Assignment {
  id: string;
  teacher_id: string;
  class_id?: string;
  subject_id: string;
  title: string;
  description: string;
  instructions?: string;
  attachments: any[];
  resources: any[];
  max_points: number;
  due_date?: string;
  is_published: boolean;
  status: 'draft' | 'published' | 'closed';
  difficulty_level: 'easy' | 'medium' | 'hard';
  estimated_time_minutes?: number;
  metadata: any;
  created_at: string;
  updated_at: string;
  // Joined data
  subject?: {
    name: string;
    category: string;
  };
  teacher?: {
    full_name: string;
    avatar_url?: string;
  };
  class?: {
    title: string;
  };
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  class_id?: string;
  content?: string;
  attachments: any[];
  points_earned?: number;
  max_points: number;
  feedback?: string;
  grade?: string;
  status: 'submitted' | 'graded' | 'returned' | 'late';
  submitted_at: string;
  graded_at?: string;
  due_date?: string;
  is_late: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
  // Joined data
  assignment?: Assignment;
  student?: {
    full_name: string;
    avatar_url?: string;
  };
}

export class AssignmentService {
  /**
   * Create a new assignment
   */
  static async createAssignment(assignmentData: {
    teacher_id: string;
    class_id?: string;
    subject_id: string;
    title: string;
    description: string;
    instructions?: string;
    attachments?: any[];
    resources?: any[];
    max_points?: number;
    due_date?: string;
    is_published?: boolean;
    difficulty_level?: 'easy' | 'medium' | 'hard';
    estimated_time_minutes?: number;
  }): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...assignmentData,
        attachments: assignmentData.attachments || [],
        resources: assignmentData.resources || [],
        max_points: assignmentData.max_points || 100,
        is_published: assignmentData.is_published || false,
        difficulty_level: assignmentData.difficulty_level || 'medium',
        status: 'draft',
        metadata: {}
      })
      .select(`
        *,
        subjects (
          name,
          category
        ),
        teachers!teacher_id (
          profiles (
            full_name,
            avatar_url
          )
        ),
        classes (
          title
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      subject: data.subjects,
      teacher: data.teachers?.profiles,
      class: data.classes
    };
  }

  /**
   * Update an assignment
   */
  static async updateAssignment(
    assignmentId: string,
    updates: Partial<Assignment>
  ): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select(`
        *,
        subjects (
          name,
          category
        ),
        teachers!teacher_id (
          profiles (
            full_name,
            avatar_url
          )
        ),
        classes (
          title
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      subject: data.subjects,
      teacher: data.teachers?.profiles,
      class: data.classes
    };
  }

  /**
   * Publish an assignment
   */
  static async publishAssignment(assignmentId: string): Promise<Assignment> {
    return this.updateAssignment(assignmentId, {
      is_published: true,
      status: 'published'
    });
  }

  /**
   * Get assignments for a teacher
   */
  static async getTeacherAssignments(teacherId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        subjects (
          name,
          category
        ),
        classes (
          title
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(assignment => ({
      ...assignment,
      subject: assignment.subjects,
      class: assignment.classes
    }));
  }

  /**
   * Get assignments for a student (from accepted teachers)
   */
  static async getStudentAssignments(studentId: string): Promise<Assignment[]> {
    // First, get all classes where the student is enrolled
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (classesError) throw classesError;

    if (!classes || classes.length === 0) {
      return [];
    }

    const teacherIds = classes.map(cls => cls.teacher_id);

    // Get published assignments from these teachers
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        subjects (
          name,
          category
        ),
        teachers!teacher_id (
          profiles (
            full_name,
            avatar_url
          )
        ),
        classes (
          title
        )
      `)
      .in('teacher_id', teacherIds)
      .eq('is_published', true)
      .eq('status', 'published')
      .order('due_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(assignment => ({
      ...assignment,
      subject: assignment.subjects,
      teacher: assignment.teachers?.profiles,
      class: assignment.classes
    }));
  }

  /**
   * Submit an assignment
   */
  static async submitAssignment(submissionData: {
    assignment_id: string;
    student_id: string;
    class_id?: string;
    content?: string;
    attachments?: any[];
    due_date?: string;
  }): Promise<AssignmentSubmission> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({
        ...submissionData,
        attachments: submissionData.attachments || [],
        max_points: 100, // Will be updated from assignment
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        is_late: submissionData.due_date ? 
          new Date() > new Date(submissionData.due_date) : false,
        metadata: {}
      })
      .select(`
        *,
        assignments (
          *,
          subjects (
            name,
            category
          ),
          teachers!teacher_id (
            profiles (
              full_name,
              avatar_url
            )
          )
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      assignment: data.assignments,
      max_points: data.assignments?.max_points || 100
    };
  }

  /**
   * Get assignment submissions for a teacher
   */
  static async getTeacherSubmissions(teacherId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments!assignment_id (
          *,
          subjects (
            name,
            category
          )
        ),
        students!student_id (
          profiles (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('assignments.teacher_id', teacherId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(submission => ({
      ...submission,
      assignment: submission.assignments,
      student: submission.students?.profiles,
      max_points: submission.assignments?.max_points || 100
    }));
  }

  /**
   * Get student's assignment submissions
   */
  static async getStudentSubmissions(studentId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments (
          *,
          subjects (
            name,
            category
          ),
          teachers!teacher_id (
            profiles (
              full_name,
              avatar_url
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(submission => ({
      ...submission,
      assignment: submission.assignments,
      max_points: submission.assignments?.max_points || 100
    }));
  }

  /**
   * Grade an assignment submission
   */
  static async gradeSubmission(
    submissionId: string,
    gradeData: {
      points_earned: number;
      grade?: string;
      feedback?: string;
    }
  ): Promise<AssignmentSubmission> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        ...gradeData,
        status: 'graded',
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select(`
        *,
        assignments (
          *,
          subjects (
            name,
            category
          )
        ),
        students!student_id (
          profiles (
            full_name,
            avatar_url
          )
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      assignment: data.assignments,
      student: data.students?.profiles,
      max_points: data.assignments?.max_points || 100
    };
  }

  /**
   * Get available subjects for assignments
   */
  static async getSubjects(): Promise<Array<{ id: string; name: string; category: string }>> {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, category')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get teacher's classes for assignment assignment
   */
  static async getTeacherClasses(teacherId: string): Promise<Array<{ id: string; title: string; student_name: string }>> {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        title,
        students!classes_student_id_fkey (
          profiles (
            full_name
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((cls: any) => ({
      id: cls.id,
      title: cls.title,
      student_name: cls.students?.profiles?.full_name || 'Unknown Student'
    }));
  }
}

