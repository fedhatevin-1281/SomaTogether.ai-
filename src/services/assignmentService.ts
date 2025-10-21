import { supabase } from '../supabaseClient';

export interface Assignment {
  id: string;
  teacher_id: string;
  class_id?: string;
  subject_id: string;
  title: string;
  description: string;
  instructions?: string;
  attachments?: any[];
  resources?: any[];
  max_points: number;
  due_date?: string;
  is_published: boolean;
  status: 'draft' | 'published' | 'closed';
  difficulty_level: 'easy' | 'medium' | 'hard';
  estimated_time_minutes?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  teacher?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  subject?: {
    id: string;
    name: string;
    category: string;
  };
  class?: {
    id: string;
    title: string;
  };
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  class_id?: string;
  content?: string;
  attachments?: any[];
  points_earned?: number;
  max_points: number;
  feedback?: string;
  grade?: string;
  status: 'submitted' | 'graded' | 'returned' | 'late';
  submitted_at?: string;
  graded_at?: string;
  due_date?: string;
  is_late: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  assignment?: Assignment;
  student?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface CreateAssignmentData {
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
  difficulty_level?: 'easy' | 'medium' | 'hard';
  estimated_time_minutes?: number;
}

export interface SubmitAssignmentData {
  assignment_id: string;
  student_id: string;
  class_id?: string;
  content?: string;
  attachments?: any[];
}

export class AssignmentService {
  /**
   * Create a new assignment
   */
  static async createAssignment(assignmentData: CreateAssignmentData): Promise<Assignment> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          ...assignmentData,
          max_points: assignmentData.max_points || 100,
          difficulty_level: assignmentData.difficulty_level || 'medium',
          is_published: false,
          status: 'draft',
          attachments: assignmentData.attachments || [],
          resources: assignmentData.resources || []
        })
        .select(`
          *,
          teachers!assignments_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!assignments_subject_id_fkey (
            id,
            name,
            category
          ),
          classes!assignments_class_id_fkey (
            id,
            title
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        teacher: data.teachers?.profiles,
        subject: data.subjects,
        class: data.classes
      };
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  /**
   * Publish an assignment
   */
  static async publishAssignment(assignmentId: string): Promise<Assignment> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          is_published: true,
          status: 'published'
        })
        .eq('id', assignmentId)
        .select(`
          *,
          teachers!assignments_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!assignments_subject_id_fkey (
            id,
            name,
            category
          ),
          classes!assignments_class_id_fkey (
            id,
            title
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        teacher: data.teachers?.profiles,
        subject: data.subjects,
        class: data.classes
      };
    } catch (error) {
      console.error('Error publishing assignment:', error);
      throw error;
    }
  }

  /**
   * Get assignments for a teacher
   */
  static async getTeacherAssignments(teacherId: string): Promise<Assignment[]> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          subjects!assignments_subject_id_fkey (
            id,
            name,
            category
          ),
          classes!assignments_class_id_fkey (
            id,
            title
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(assignmentData => ({
        ...assignmentData,
        subject: assignmentData.subjects,
        class: assignmentData.classes
      }));
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignments for a student
   */
  static async getStudentAssignments(studentId: string): Promise<Assignment[]> {
    try {
      // Get assignments from classes the student is enrolled in
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          teachers!assignments_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!assignments_subject_id_fkey (
            id,
            name,
            category
          ),
          classes!assignments_class_id_fkey (
            id,
            title
          )
        `)
        .eq('is_published', true)
        .eq('status', 'published')
        .or(`class_id.in.(
          select id from classes where student_id.eq.${studentId}
        )`)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data || []).map(assignmentData => ({
        ...assignmentData,
        teacher: assignmentData.teachers?.profiles,
        subject: assignmentData.subjects,
        class: assignmentData.classes
      }));
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          teachers!assignments_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!assignments_subject_id_fkey (
            id,
            name,
            category
          ),
          classes!assignments_class_id_fkey (
            id,
            title
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (error) throw error;

      return {
        ...data,
        teacher: data.teachers?.profiles,
        subject: data.subjects,
        class: data.classes
      };
    } catch (error) {
      console.error('Error fetching assignment:', error);
      return null;
    }
  }

  /**
   * Submit an assignment
   */
  static async submitAssignment(submissionData: SubmitAssignmentData): Promise<AssignmentSubmission> {
    try {
      // Get assignment details
      const assignment = await this.getAssignmentById(submissionData.assignment_id);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Check if already submitted
      const { data: existingSubmission } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', submissionData.assignment_id)
        .eq('student_id', submissionData.student_id)
        .single();

      if (existingSubmission) {
        throw new Error('Assignment already submitted');
      }

      // Check if due date has passed
      const isLate = assignment.due_date ? new Date() > new Date(assignment.due_date) : false;

      const { data, error } = await supabase
        .from('assignment_submissions')
        .insert({
          ...submissionData,
          max_points: assignment.max_points,
          due_date: assignment.due_date,
          is_late: isLate,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          attachments: submissionData.attachments || []
        })
        .select(`
          *,
          assignments!assignment_submissions_assignment_id_fkey (
            *,
            teachers!assignments_teacher_id_fkey (
              id,
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            ),
            subjects!assignments_subject_id_fkey (
              id,
              name,
              category
            )
          ),
          students!assignment_submissions_student_id_fkey (
            id,
            profiles!students_id_fkey (
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
        student: data.students?.profiles
      };
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  }

  /**
   * Get submissions for an assignment
   */
  static async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments!assignment_submissions_assignment_id_fkey (
            *,
            teachers!assignments_teacher_id_fkey (
              id,
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            )
          ),
          students!assignment_submissions_student_id_fkey (
            id,
            profiles!students_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(submissionData => ({
        ...submissionData,
        assignment: submissionData.assignments,
        student: submissionData.students?.profiles
      }));
    } catch (error) {
      console.error('Error fetching assignment submissions:', error);
      throw error;
    }
  }

  /**
   * Get student's submissions
   */
  static async getStudentSubmissions(studentId: string): Promise<AssignmentSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments!assignment_submissions_assignment_id_fkey (
            *,
            teachers!assignments_teacher_id_fkey (
              id,
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            ),
            subjects!assignments_subject_id_fkey (
              id,
              name,
              category
            )
          )
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(submissionData => ({
        ...submissionData,
        assignment: submissionData.assignments
      }));
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      throw error;
    }
  }

  /**
   * Grade an assignment submission
   */
  static async gradeSubmission(
    submissionId: string,
    pointsEarned: number,
    feedback?: string,
    grade?: string
  ): Promise<AssignmentSubmission> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          points_earned: pointsEarned,
          feedback: feedback,
          grade: grade,
          status: 'graded',
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select(`
          *,
          assignments!assignment_submissions_assignment_id_fkey (
            *,
            teachers!assignments_teacher_id_fkey (
              id,
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            )
          ),
          students!assignment_submissions_student_id_fkey (
            id,
            profiles!students_id_fkey (
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
        student: data.students?.profiles
      };
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  }

  /**
   * Update assignment
   */
  static async updateAssignment(
    assignmentId: string,
    updates: Partial<Assignment>
  ): Promise<Assignment> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select(`
          *,
          teachers!assignments_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!assignments_subject_id_fkey (
            id,
            name,
            category
          ),
          classes!assignments_class_id_fkey (
            id,
            title
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        teacher: data.teachers?.profiles,
        subject: data.subjects,
        class: data.classes
      };
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  /**
   * Get assignment statistics
   */
  static async getAssignmentStats(assignmentId: string): Promise<{
    totalSubmissions: number;
    gradedSubmissions: number;
    averageScore?: number;
    lateSubmissions: number;
  }> {
    try {
      const submissions = await this.getAssignmentSubmissions(assignmentId);
      
      const totalSubmissions = submissions.length;
      const gradedSubmissions = submissions.filter(s => s.status === 'graded').length;
      const lateSubmissions = submissions.filter(s => s.is_late).length;
      
      const gradedSubsWithScores = submissions.filter(s => s.points_earned !== null);
      const averageScore = gradedSubsWithScores.length > 0
        ? gradedSubsWithScores.reduce((sum, s) => sum + (s.points_earned || 0), 0) / gradedSubsWithScores.length
        : undefined;

      return {
        totalSubmissions,
        gradedSubmissions,
        averageScore,
        lateSubmissions
      };
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      throw error;
    }
  }
}