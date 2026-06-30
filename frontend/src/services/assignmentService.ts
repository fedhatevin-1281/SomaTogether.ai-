import { apiService } from './apiService';

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
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignments/insert', {
        method: 'POST',
        body: JSON.stringify({
          ...assignmentData,
          max_points: assignmentData.max_points || 100,
          difficulty_level: assignmentData.difficulty_level || 'medium',
          is_published: false,
          status: 'draft',
          attachments: assignmentData.attachments || [],
          resources: assignmentData.resources || []
        })
      });

      const assignment = res.data?.[0];
      if (!assignment) throw new Error('Failed to create assignment');

      // Fetch the full populated assignment details
      const populated = await this.getAssignmentById(assignment.id);
      if (!populated) throw new Error('Failed to retrieve populated assignment details');

      return populated;
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
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignments/update', {
        method: 'PUT',
        body: JSON.stringify({
          eq: { id: assignmentId },
          updates: {
            is_published: true,
            status: 'published'
          }
        })
      });

      const populated = await this.getAssignmentById(assignmentId);
      if (!populated) throw new Error('Failed to retrieve published assignment details');

      return populated;
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
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignments/query', {
        method: 'POST',
        body: JSON.stringify({
          select: `
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
          `,
          eq: { teacher_id: teacherId },
          order: { column: 'created_at', ascending: false }
        })
      });

      return (res.data || []).map(assignmentData => ({
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
      // First, get all classes for this student
      const classesRes = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/classes/query', {
        method: 'POST',
        body: JSON.stringify({
          select: 'id',
          eq: { student_id: studentId, status: 'active' }
        })
      });

      const studentClasses = classesRes.data || [];
      if (studentClasses.length === 0) return [];

      const classIds = studentClasses.map(c => c.id);

      // Get assignments from classes the student is enrolled in
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignments/query', {
        method: 'POST',
        body: JSON.stringify({
          select: `
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
          `,
          order: { column: 'due_date', ascending: true }
        })
      });

      // Filter and map assignments by enrolled class ids in memory
      return (res.data || [])
        .filter(a => classIds.includes(a.class_id) && a.is_published && a.status === 'published')
        .map(assignmentData => ({
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
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignments/query', {
        method: 'POST',
        body: JSON.stringify({
          select: `
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
          `,
          eq: { id: assignmentId }
        })
      });

      const data = res.data?.[0];
      if (!data) return null;

      return {
        ...data,
        teacher: data.teachers?.profiles,
        subject: data.subjects,
        class: data.classes
      };
    } catch (error) {
      console.error('Error fetching assignment by ID:', error);
      return null;
    }
  }

  /**
   * Get all active subjects
   */
  static async getSubjects(): Promise<any[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/subjects/query', {
        method: 'POST',
        body: JSON.stringify({
          eq: { is_active: true },
          order: { column: 'name' }
        })
      });
      return res.data || [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  }

  /**
   * Submit an assignment
   */
  static async submitAssignment(submissionData: SubmitAssignmentData): Promise<AssignmentSubmission> {
    try {
      const assignment = await this.getAssignmentById(submissionData.assignment_id);
      if (!assignment) throw new Error('Assignment not found');

      // Check if already submitted
      const checkRes = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignment_submissions/query', {
        method: 'POST',
        body: JSON.stringify({
          eq: {
            assignment_id: submissionData.assignment_id,
            student_id: submissionData.student_id
          }
        })
      });

      if (checkRes.data && checkRes.data.length > 0) {
        throw new Error('Assignment already submitted');
      }

      const isLate = assignment.due_date ? new Date() > new Date(assignment.due_date) : false;

      const insertRes = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignment_submissions/insert', {
        method: 'POST',
        body: JSON.stringify({
          ...submissionData,
          max_points: assignment.max_points,
          due_date: assignment.due_date,
          is_late: isLate,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          attachments: submissionData.attachments || []
        })
      });

      const submission = insertRes.data?.[0];
      if (!submission) throw new Error('Failed to submit assignment');

      // Fetch the full populated submission details
      const populated = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignment_submissions/query', {
        method: 'POST',
        body: JSON.stringify({
          select: `
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
          `,
          eq: { id: submission.id }
        })
      });

      const populatedData = populated.data?.[0];
      if (!populatedData) throw new Error('Failed to retrieve populated submission details');

      return {
        ...populatedData,
        assignment: populatedData.assignments,
        student: populatedData.students?.profiles
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
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignment_submissions/query', {
        method: 'POST',
        body: JSON.stringify({
          select: `
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
          `,
          eq: { assignment_id: assignmentId },
          order: { column: 'submitted_at', ascending: false }
        })
      });

      return (res.data || []).map(submissionData => ({
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
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignment_submissions/query', {
        method: 'POST',
        body: JSON.stringify({
          select: `
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
          `,
          eq: { student_id: studentId },
          order: { column: 'submitted_at', ascending: false }
        })
      });

      return (res.data || []).map(submissionData => ({
        ...submissionData,
        assignment: submissionData.assignments
      }));
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for assignments belonging to a teacher
   */
  static async getTeacherSubmissions(teacherId: string): Promise<AssignmentSubmission[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignment_submissions/query', {
        method: 'POST',
        body: JSON.stringify({
          select: `
            *,
            assignments!inner (
              id,
              title,
              teacher_id,
              subjects!assignments_subject_id_fkey (id, name)
            ),
            students!assignment_submissions_student_id_fkey (
              id,
              profiles!students_id_fkey (full_name, avatar_url)
            )
          `,
          order: { column: 'submitted_at', ascending: false }
        })
      });

      return (res.data || [])
        .filter(s => s.assignments?.teacher_id === teacherId)
        .map(submissionData => ({
          ...submissionData,
          assignment: submissionData.assignments,
          student: submissionData.students?.profiles
        }));
    } catch (error) {
      console.error('Error fetching teacher submissions:', error);
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
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignment_submissions/update', {
        method: 'PUT',
        body: JSON.stringify({
          eq: { id: submissionId },
          updates: {
            points_earned: pointsEarned,
            feedback: feedback,
            grade: grade,
            status: 'graded',
            graded_at: new Date().toISOString()
          }
        })
      });

      const populated = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignment_submissions/query', {
        method: 'POST',
        body: JSON.stringify({
          select: `
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
          `,
          eq: { id: submissionId }
        })
      });

      const populatedData = populated.data?.[0];
      if (!populatedData) throw new Error('Failed to retrieve graded submission details');

      return {
        ...populatedData,
        assignment: populatedData.assignments,
        student: populatedData.students?.profiles
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
      await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/assignments/update', {
        method: 'PUT',
        body: JSON.stringify({
          eq: { id: assignmentId },
          updates
        })
      });

      const populated = await this.getAssignmentById(assignmentId);
      if (!populated) throw new Error('Failed to retrieve updated assignment details');

      return populated;
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

  /**
   * Get teacher's classes for assignment assignment
   */
  static async getTeacherClasses(teacherId: string): Promise<Array<{ id: string; title: string; student_name: string }>> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>(`/classes/teacher/${teacherId}`);
      return (res.data || []).map((cls: any) => ({
        id: cls.id,
        title: cls.title,
        student_name: cls.student?.full_name || 'Unknown Student'
      }));
    } catch (error) {
      console.error('Error fetching teacher classes in AssignmentService:', error);
      return [];
    }
  }
}