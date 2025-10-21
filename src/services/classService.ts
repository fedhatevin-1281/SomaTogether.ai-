import { supabase } from '../supabaseClient';

export interface Class {
  id: string;
  teacher_id: string;
  student_id: string;
  subject_id: string;
  title: string;
  description?: string;
  hourly_rate: number;
  currency: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  start_date: string;
  end_date?: string;
  completed_sessions: number;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  teacher?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  student?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  subject?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface CreateClassData {
  teacher_id: string;
  student_id: string;
  subject_id: string;
  title: string;
  description?: string;
  hourly_rate: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  teacher_id: string;
  student_id: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meeting_url?: string;
  meeting_id?: string;
  duration_minutes?: number;
  rate?: number;
  notes?: string;
  student_feedback?: string;
  teacher_feedback?: string;
  tokens_charged?: number;
  tokens_deducted_at?: string;
  tokens_credited_at?: string;
  teacher_earning_usd?: number;
  student_cost_usd?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  class?: Class;
  teacher?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  student?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface CreateSessionData {
  class_id: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes?: number;
  notes?: string;
}

export class ClassService {
  /**
   * Create a new class
   */
  static async createClass(classData: CreateClassData): Promise<Class> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          ...classData,
          currency: classData.currency || 'USD',
          start_date: classData.start_date || new Date().toISOString().split('T')[0],
          completed_sessions: 0,
          status: 'active'
        })
        .select(`
          *,
          teachers!classes_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          students!classes_student_id_fkey (
            id,
            profiles!students_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!classes_subject_id_fkey (
            id,
            name,
            category
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        teacher: data.teachers?.profiles,
        student: data.students?.profiles,
        subject: data.subjects
      };
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }

  /**
   * Get classes for a teacher
   */
  static async getTeacherClasses(teacherId: string): Promise<Class[]> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          students!classes_student_id_fkey (
            id,
            profiles!students_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!classes_subject_id_fkey (
            id,
            name,
            category
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(classData => ({
        ...classData,
        student: classData.students?.profiles,
        subject: classData.subjects
      }));
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      throw error;
    }
  }

  /**
   * Get classes for a student
   */
  static async getStudentClasses(studentId: string): Promise<Class[]> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teachers!classes_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!classes_subject_id_fkey (
            id,
            name,
            category
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(classData => ({
        ...classData,
        teacher: classData.teachers?.profiles,
        subject: classData.subjects
      }));
    } catch (error) {
      console.error('Error fetching student classes:', error);
      throw error;
    }
  }

  /**
   * Get class by ID
   */
  static async getClassById(classId: string): Promise<Class | null> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teachers!classes_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          students!classes_student_id_fkey (
            id,
            profiles!students_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!classes_subject_id_fkey (
            id,
            name,
            category
          )
        `)
        .eq('id', classId)
        .single();

      if (error) throw error;

      return {
        ...data,
        teacher: data.teachers?.profiles,
        student: data.students?.profiles,
        subject: data.subjects
      };
    } catch (error) {
      console.error('Error fetching class:', error);
      return null;
    }
  }

  /**
   * Update class
   */
  static async updateClass(classId: string, updates: Partial<Class>): Promise<Class> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', classId)
        .select(`
          *,
          teachers!classes_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          ),
          students!classes_student_id_fkey (
            id,
            profiles!students_id_fkey (
              full_name,
              avatar_url
            )
          ),
          subjects!classes_subject_id_fkey (
            id,
            name,
            category
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        teacher: data.teachers?.profiles,
        student: data.students?.profiles,
        subject: data.subjects
      };
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  }

  /**
   * Create a class session
   */
  static async createSession(sessionData: CreateSessionData): Promise<ClassSession> {
    try {
      // Get class details first
      const classData = await this.getClassById(sessionData.class_id);
      if (!classData) {
        throw new Error('Class not found');
      }

      // Calculate tokens required (default 10 tokens per hour)
      const durationHours = sessionData.duration_minutes ? sessionData.duration_minutes / 60 : 1;
      const tokensCharged = Math.ceil(durationHours * 10);

      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          ...sessionData,
          teacher_id: classData.teacher_id,
          student_id: classData.student_id,
          duration_minutes: sessionData.duration_minutes || 60,
          rate: classData.hourly_rate,
          tokens_charged: tokensCharged,
          status: 'scheduled'
        })
        .select(`
          *,
          classes!class_sessions_class_id_fkey (
            *,
            teachers!classes_teacher_id_fkey (
              id,
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            ),
            students!classes_student_id_fkey (
              id,
              profiles!students_id_fkey (
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
        class: data.classes,
        teacher: data.classes?.teachers?.profiles,
        student: data.classes?.students?.profiles
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get sessions for a class
   */
  static async getClassSessions(classId: string): Promise<ClassSession[]> {
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          classes!class_sessions_class_id_fkey (
            *,
            teachers!classes_teacher_id_fkey (
              id,
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            ),
            students!classes_student_id_fkey (
              id,
              profiles!students_id_fkey (
                full_name,
                avatar_url
              )
            )
          )
        `)
        .eq('class_id', classId)
        .order('scheduled_start', { ascending: false });

      if (error) throw error;

      return (data || []).map(sessionData => ({
        ...sessionData,
        class: sessionData.classes,
        teacher: sessionData.classes?.teachers?.profiles,
        student: sessionData.classes?.students?.profiles
      }));
    } catch (error) {
      console.error('Error fetching class sessions:', error);
      throw error;
    }
  }

  /**
   * Get upcoming sessions for a teacher
   */
  static async getTeacherUpcomingSessions(teacherId: string): Promise<ClassSession[]> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          classes!class_sessions_class_id_fkey (
            *,
            students!classes_student_id_fkey (
              id,
              profiles!students_id_fkey (
                full_name,
                avatar_url
              )
            ),
            subjects!classes_subject_id_fkey (
              id,
              name,
              category
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .gte('scheduled_start', now)
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_start', { ascending: true });

      if (error) throw error;

      return (data || []).map(sessionData => ({
        ...sessionData,
        class: sessionData.classes,
        student: sessionData.classes?.students?.profiles,
        subject: sessionData.classes?.subjects
      }));
    } catch (error) {
      console.error('Error fetching teacher upcoming sessions:', error);
      throw error;
    }
  }

  /**
   * Get upcoming sessions for a student
   */
  static async getStudentUpcomingSessions(studentId: string): Promise<ClassSession[]> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          classes!class_sessions_class_id_fkey (
            *,
            teachers!classes_teacher_id_fkey (
              id,
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            ),
            subjects!classes_subject_id_fkey (
              id,
              name,
              category
            )
          )
        `)
        .eq('student_id', studentId)
        .gte('scheduled_start', now)
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_start', { ascending: true });

      if (error) throw error;

      return (data || []).map(sessionData => ({
        ...sessionData,
        class: sessionData.classes,
        teacher: sessionData.classes?.teachers?.profiles,
        subject: sessionData.classes?.subjects
      }));
    } catch (error) {
      console.error('Error fetching student upcoming sessions:', error);
      throw error;
    }
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    sessionId: string, 
    status: ClassSession['status'],
    updates?: Partial<ClassSession>
  ): Promise<ClassSession> {
    try {
      const updateData = {
        status,
        ...updates
      };

      const { data, error } = await supabase
        .from('class_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select(`
          *,
          classes!class_sessions_class_id_fkey (
            *,
            teachers!classes_teacher_id_fkey (
              id,
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            ),
            students!classes_student_id_fkey (
              id,
              profiles!students_id_fkey (
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
        class: data.classes,
        teacher: data.classes?.teachers?.profiles,
        student: data.classes?.students?.profiles
      };
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  /**
   * Get class statistics
   */
  static async getClassStats(classId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalHours: number;
    averageRating?: number;
  }> {
    try {
      // Get all sessions for the class
      const sessions = await this.getClassSessions(classId);
      
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      
      const totalMinutes = sessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      const totalHours = totalMinutes / 60;

      // TODO: Get average rating from reviews table
      const averageRating = undefined;

      return {
        totalSessions,
        completedSessions,
        totalHours,
        averageRating
      };
    } catch (error) {
      console.error('Error getting class stats:', error);
      throw error;
    }
  }
}


