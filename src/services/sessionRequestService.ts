import { supabase } from '../supabaseClient';

export interface SessionRequest {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id?: string;
  requested_start: string;
  requested_end: string;
  duration_hours: number;
  tokens_required: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  message?: string;
  teacher_response?: string;
  declined_reason?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    id: string;
    full_name: string;
    email: string;
    bio?: string;
    avatar_url?: string;
    education_system_id?: string;
    education_level_id?: string;
    school_name?: string;
    interests?: string[];
    preferred_languages?: string[];
  };
  teacher?: {
    id: string;
    full_name: string;
    email: string;
    bio?: string;
    avatar_url?: string;
    hourly_rate: number;
    currency: string;
    subjects: string[];
    specialties: string[];
    experience_years: number;
    rating: number;
    total_reviews: number;
    verification_status: string;
  };
}

export interface CreateSessionRequestData {
  teacher_id: string;
  requested_start: string;
  requested_end: string;
  duration_hours: number;
  message?: string;
}

export interface TeacherProfile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  language?: string;
  // Teacher specific
  hourly_rate: number;
  currency: string;
  subjects: string[];
  specialties: string[];
  education: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  total_students: number;
  total_sessions: number;
  max_students: number;
  is_available: boolean;
  verification_status: string;
  verification_documents: string[];
  zoom_connected: boolean;
  zoom_email?: string;
  // Education system data
  preferred_curriculums?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  preferred_subjects?: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  availability?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
  }>;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  language?: string;
  // Student specific
  grade_level?: string;
  school_name?: string;
  learning_goals: string[];
  interests: string[];
  tokens: number;
  preferred_languages: string[];
  learning_style?: string;
  // Education system data
  education_system?: {
    id: string;
    name: string;
    description?: string;
  };
  education_level?: {
    id: string;
    level_name: string;
    description?: string;
  };
}

export class SessionRequestService {
  /**
   * Get all available teachers for browsing
   */
  static async getAvailableTeachers(): Promise<TeacherProfile[]> {
    try {
      // First, get all available teachers
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select(`
          id,
          hourly_rate,
          currency,
          subjects,
          specialties,
          education,
          experience_years,
          rating,
          total_reviews,
          total_students,
          total_sessions,
          max_students,
          is_available,
          verification_status,
          verification_documents,
          zoom_connected,
          zoom_email,
          profiles!inner(
            full_name,
            email,
            bio,
            avatar_url,
            phone,
            location,
            timezone,
            language
          )
        `)
        .eq('is_available', true)
        .eq('profiles.role', 'teacher')
        .eq('profiles.is_active', true)
        .order('created_at', { ascending: false });

      if (teachersError) throw teachersError;

      // Get education data for each teacher
      const teachersWithEducation = await Promise.all(
        (teachers || []).map(async (teacher) => {
          // Get preferred curriculums
          const { data: curriculums } = await supabase
            .from('teacher_onboarding_responses')
            .select(`
              teacher_preferred_curriculums(
                education_systems(
                  id,
                  name,
                  description
                )
              )
            `)
            .eq('teacher_id', teacher.id)
            .single();

          // Get preferred subjects
          const { data: subjects } = await supabase
            .from('teacher_onboarding_responses')
            .select(`
              teacher_preferred_subjects(
                subjects(
                  id,
                  name,
                  category
                )
              )
            `)
            .eq('teacher_id', teacher.id)
            .single();

          return {
            id: teacher.id,
            full_name: teacher.profiles?.full_name || 'Unknown Teacher',
            email: teacher.profiles?.email || '',
            bio: teacher.profiles?.bio || '',
            avatar_url: teacher.profiles?.avatar_url,
            phone: teacher.profiles?.phone,
            location: teacher.profiles?.location,
            timezone: teacher.profiles?.timezone || 'UTC',
            language: teacher.profiles?.language || 'en',
            hourly_rate: teacher.hourly_rate || 0,
            currency: teacher.currency || 'USD',
            subjects: teacher.subjects || [],
            specialties: teacher.specialties || [],
            education: teacher.education || [],
            experience_years: teacher.experience_years || 0,
            rating: teacher.rating || 0,
            total_reviews: teacher.total_reviews || 0,
            total_students: teacher.total_students || 0,
            total_sessions: teacher.total_sessions || 0,
            max_students: teacher.max_students || 20,
            is_available: teacher.is_available || false,
            verification_status: teacher.verification_status || 'pending',
            verification_documents: teacher.verification_documents || [],
            zoom_connected: teacher.zoom_connected || false,
            zoom_email: teacher.zoom_email,
            preferred_curriculums: curriculums?.teacher_preferred_curriculums?.map((c: any) => c.education_systems) || [],
            preferred_subjects: subjects?.teacher_preferred_subjects?.map((s: any) => s.subjects) || [],
          };
        })
      );

      // Sort by rating in JavaScript
      return teachersWithEducation.sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.error('Error fetching available teachers:', error);
      throw error;
    }
  }

  /**
   * Get teacher profile by ID
   */
  static async getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          bio,
          avatar_url,
          phone,
          location,
          timezone,
          language,
          teachers!inner(
            hourly_rate,
            currency,
            subjects,
            specialties,
            education,
            experience_years,
            rating,
            total_reviews,
            total_students,
            total_sessions,
            max_students,
            is_available,
            verification_status,
            verification_documents,
            zoom_connected,
            zoom_email
          )
        `)
        .eq('id', teacherId)
        .eq('role', 'teacher')
        .single();

      if (error) throw error;
      if (!data) return null;

      // Get education data
      const { data: onboardingData } = await supabase
        .from('teacher_onboarding_responses')
        .select(`
          teacher_preferred_curriculums(
            education_systems(
              id,
              name,
              description
            )
          ),
          teacher_preferred_subjects(
            subjects(
              id,
              name,
              category
            )
          ),
          teacher_onboarding_availability(
            day_of_week,
            start_time,
            end_time,
            timezone
          )
        `)
        .eq('teacher_id', teacherId)
        .single();

      return {
        ...data,
        hourly_rate: data.teachers[0]?.hourly_rate || 0,
        currency: data.teachers[0]?.currency || 'USD',
        subjects: data.teachers[0]?.subjects || [],
        specialties: data.teachers[0]?.specialties || [],
        education: data.teachers[0]?.education || [],
        experience_years: data.teachers[0]?.experience_years || 0,
        rating: data.teachers[0]?.rating || 0,
        total_reviews: data.teachers[0]?.total_reviews || 0,
        total_students: data.teachers[0]?.total_students || 0,
        total_sessions: data.teachers[0]?.total_sessions || 0,
        max_students: data.teachers[0]?.max_students || 20,
        is_available: data.teachers[0]?.is_available || false,
        verification_status: data.teachers[0]?.verification_status || 'pending',
        verification_documents: data.teachers[0]?.verification_documents || [],
        zoom_connected: data.teachers[0]?.zoom_connected || false,
        zoom_email: data.teachers[0]?.zoom_email,
        preferred_curriculums: onboardingData?.teacher_preferred_curriculums?.map((c: any) => c.education_systems) || [],
        preferred_subjects: onboardingData?.teacher_preferred_subjects?.map((s: any) => s.subjects) || [],
        availability: onboardingData?.teacher_onboarding_availability || [],
      };
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      throw error;
    }
  }

  /**
   * Get student profile by ID
   */
  static async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          bio,
          avatar_url,
          phone,
          location,
          timezone,
          language,
          students!inner(
            grade_level,
            school_name,
            learning_goals,
            interests,
            tokens,
            preferred_languages,
            learning_style,
            education_system_id,
            education_level_id
          )
        `)
        .eq('id', studentId)
        .eq('role', 'student')
        .single();

      if (error) throw error;
      if (!data) return null;

      // Get education system and level data
      let educationSystem = null;
      let educationLevel = null;

      if (data.students[0]?.education_system_id) {
        const { data: systemData } = await supabase
          .from('education_systems')
          .select('id, name, description')
          .eq('id', data.students[0].education_system_id)
          .single();
        educationSystem = systemData;
      }

      if (data.students[0]?.education_level_id) {
        const { data: levelData } = await supabase
          .from('education_levels')
          .select('id, level_name, description')
          .eq('id', data.students[0].education_level_id)
          .single();
        educationLevel = levelData;
      }

      return {
        ...data,
        grade_level: data.students[0]?.grade_level,
        school_name: data.students[0]?.school_name,
        learning_goals: data.students[0]?.learning_goals || [],
        interests: data.students[0]?.interests || [],
        tokens: data.students[0]?.tokens || 0,
        preferred_languages: data.students[0]?.preferred_languages || ['en'],
        learning_style: data.students[0]?.learning_style,
        education_system: educationSystem,
        education_level: educationLevel,
      };
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  }

  /**
   * Create a session request (deducts 10 tokens from student)
   */
  static async createSessionRequest(
    studentId: string,
    requestData: CreateSessionRequestData
  ): Promise<SessionRequest> {
    try {
      // Check if student has enough tokens (10 tokens required)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('tokens')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      // Check if student has enough tokens (will be deducted after Zoom class completion)
      // The "Send request" button just links the student to the teacher - no tokens deducted here
      // Tokens are only deducted after a Zoom class session is completed
      if (!student || student.tokens < 10) {
        throw new Error('Insufficient tokens. You need at least 10 tokens to send a session request. Tokens will be deducted after the Zoom class is completed.');
      }

      // Check if there's already a pending request for this teacher
      const { data: existingRequest } = await supabase
        .from('session_requests')
        .select('id')
        .eq('student_id', studentId)
        .eq('teacher_id', requestData.teacher_id)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        throw new Error('You already have a pending request for this teacher.');
      }

      // Calculate tokens required (10 tokens per request)
      const tokensRequired = 10;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create the session request
      const { data: request, error: requestError } = await supabase
        .from('session_requests')
        .insert({
          student_id: studentId,
          teacher_id: requestData.teacher_id,
          requested_start: requestData.requested_start,
          requested_end: requestData.requested_end,
          duration_hours: requestData.duration_hours,
          tokens_required: tokensRequired,
          message: requestData.message,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Note: Tokens will be deducted after the session is completed, not when the request is sent

      // Get teacher profile for notification (teacher_id should be profile ID)
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', requestData.teacher_id)
        .single();

      const teacherName = teacherProfile?.full_name || 'the teacher';
      const teacherProfileId = teacherProfile?.id || requestData.teacher_id;

      // Get student profile for notification (studentId should be profile ID)
      const { data: studentProfile, error: studentProfileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', studentId)
        .single();

      if (studentProfileError) {
        console.error('Error fetching student profile for notification:', studentProfileError);
      }

      const studentName = studentProfile?.full_name || 'a student';
      const studentProfileId = studentId;

      console.log('Creating notifications:', {
        studentProfileId,
        teacherProfileId,
        studentName,
        teacherName,
        requestId: request.id
      });

      // Create notification for student (confirmation that request was sent)
      const studentNotificationData = {
        user_id: studentProfileId,
        type: 'session_request_sent',
        title: 'Session Request Sent',
        message: `Your session request has been sent to ${teacherName}. You will be notified when they respond. Tokens (${tokensRequired}) will be deducted after the Zoom class is completed.`,
        data: {
          request_id: request.id,
          teacher_id: requestData.teacher_id,
          teacher_name: teacherName,
          requested_start: requestData.requested_start,
          requested_end: requestData.requested_end,
          tokens_required: tokensRequired,
        },
        priority: 'normal' as const,
      };

      const { data: studentNotification, error: studentNotificationError } = await supabase
        .from('notifications')
        .insert(studentNotificationData)
        .select()
        .maybeSingle();

      if (studentNotificationError) {
        console.error('Error creating student notification:', studentNotificationError);
        console.error('Student notification error details:', {
          code: studentNotificationError.code,
          message: studentNotificationError.message,
          details: studentNotificationError.details,
          hint: studentNotificationError.hint,
          user_id: studentProfileId,
          notificationData: studentNotificationData
        });
        // Try to insert without select to see if it's a select issue
        const { error: retryError } = await supabase
          .from('notifications')
          .insert(studentNotificationData);
        if (retryError) {
          console.error('Retry also failed:', retryError);
        } else {
          console.log('Notification created on retry (without select)');
        }
      } else {
        console.log('Student notification created successfully:', studentNotification?.id || 'created');
      }

      // Create notification for teacher
      const teacherNotificationData = {
        user_id: teacherProfileId,
        type: 'session_request',
        title: 'New Session Request',
        message: `You have received a new session request from ${studentName}`,
        data: {
          request_id: request.id,
          student_id: studentId,
          student_name: studentName,
          requested_start: requestData.requested_start,
          requested_end: requestData.requested_end,
        },
        priority: 'normal' as const,
      };

      const { data: teacherNotification, error: teacherNotificationError } = await supabase
        .from('notifications')
        .insert(teacherNotificationData)
        .select()
        .maybeSingle();

      if (teacherNotificationError) {
        console.error('Error creating teacher notification:', teacherNotificationError);
        console.error('Teacher notification error details:', {
          code: teacherNotificationError.code,
          message: teacherNotificationError.message,
          details: teacherNotificationError.details,
          hint: teacherNotificationError.hint,
          user_id: teacherProfileId,
          notificationData: teacherNotificationData
        });
        // Try to insert without select to see if it's a select issue
        const { error: retryError } = await supabase
          .from('notifications')
          .insert(teacherNotificationData);
        if (retryError) {
          console.error('Retry also failed:', retryError);
        } else {
          console.log('Notification created on retry (without select)');
        }
      } else {
        console.log('Teacher notification created successfully:', teacherNotification?.id || 'created');
      }

      return request;
    } catch (error) {
      console.error('Error creating session request:', error);
      throw error;
    }
  }

  /**
   * Get session requests for a teacher
   */
  static async getTeacherRequests(teacherId: string): Promise<SessionRequest[]> {
    try {
      const { data, error } = await supabase
        .from('session_requests')
        .select(`
          *,
          students!session_requests_student_id_fkey(
            id,
            education_system_id,
            education_level_id,
            school_name,
            interests,
            preferred_languages,
            profiles!students_id_fkey(
              id,
              full_name,
              email,
              bio,
              avatar_url
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get education system and level data for students
      const requestsWithEducation = await Promise.all(
        (data || []).map(async (request: any) => {
          const studentData = request.students;
          const profileData = studentData?.profiles;
          
          let educationSystem = null;
          let educationLevel = null;

          if (studentData?.education_system_id) {
            const { data: systemData } = await supabase
              .from('education_systems')
              .select('id, name, description')
              .eq('id', studentData.education_system_id)
              .single();
            educationSystem = systemData;
          }

          if (studentData?.education_level_id) {
            const { data: levelData } = await supabase
              .from('education_levels')
              .select('id, level_name, description')
              .eq('id', studentData.education_level_id)
              .single();
            educationLevel = levelData;
          }

          return {
            ...request,
            student: {
              id: profileData?.id || studentData?.id,
              full_name: profileData?.full_name,
              email: profileData?.email,
              bio: profileData?.bio,
              avatar_url: profileData?.avatar_url,
              education_system: educationSystem,
              education_level: educationLevel,
              school_name: studentData?.school_name,
              interests: studentData?.interests || [],
              preferred_languages: studentData?.preferred_languages || [],
            },
          };
        })
      );

      return requestsWithEducation;
    } catch (error) {
      console.error('Error fetching teacher requests:', error);
      throw error;
    }
  }

  /**
   * Accept a session request
   */
  static async acceptRequest(requestId: string, teacherResponse?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_requests')
        .update({
          status: 'accepted',
          teacher_response: teacherResponse,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Get request details for notification
      const { data: request, error: requestError } = await supabase
        .from('session_requests')
        .select('student_id, teacher_id, requested_start, requested_end')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Get teacher name for notification message
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', request.teacher_id)
        .single();

      const teacherName = teacherProfile?.full_name || 'the teacher';

      // Since students.id and teachers.id both reference profiles.id,
      // student_id and teacher_id should be profile IDs
      const studentProfileId = request.student_id;

      // Create notification for student
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: studentProfileId,
          type: 'session_request_accepted',
          title: 'Session Request Accepted',
          message: `Your session request has been accepted by ${teacherName}. The session is scheduled!`,
          data: {
            request_id: requestId,
            teacher_id: request.teacher_id,
            teacher_name: teacherName,
            requested_start: request.requested_start,
            requested_end: request.requested_end,
          },
          priority: 'high',
        });

      if (notificationError) {
        console.error('Error creating acceptance notification:', notificationError);
        throw notificationError;
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  }

  /**
   * Decline a session request
   */
  static async declineRequest(
    requestId: string,
    declinedReason?: string,
    teacherResponse?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_requests')
        .update({
          status: 'declined',
          declined_reason: declinedReason,
          teacher_response: teacherResponse,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Get request details for refund and notification
      const { data: request, error: requestError } = await supabase
        .from('session_requests')
        .select('student_id, teacher_id, tokens_required, requested_start, requested_end')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Refund tokens to student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('tokens')
        .eq('id', request.student_id)
        .single();

      if (studentError) throw studentError;

      const { error: refundError } = await supabase
        .from('students')
        .update({
          tokens: (student?.tokens || 0) + request.tokens_required,
        })
        .eq('id', request.student_id);

      if (refundError) throw refundError;

      // Create refund transaction record
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: request.student_id,
          type: 'refund',
          amount_tokens: request.tokens_required,
          amount_usd: 0,
          token_rate: 0.1,
          description: `Refund for declined session request - ${requestId}`,
          related_entity_type: 'session_request',
          related_entity_id: requestId,
          status: 'completed',
        });

      if (transactionError) throw transactionError;

      // Create notification for student
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.student_id,
          type: 'session_request_declined',
          title: 'Session Request Declined',
          message: 'Your session request has been declined by the teacher',
          data: {
            request_id: requestId,
            teacher_id: request.teacher_id,
            declined_reason,
            requested_start: request.requested_start,
            requested_end: request.requested_end,
          },
          priority: 'normal',
        });

      if (notificationError) throw notificationError;
    } catch (error) {
      console.error('Error declining request:', error);
      throw error;
    }
  }

  /**
   * Get session requests for a student
   */
  static async getStudentRequests(studentId: string): Promise<SessionRequest[]> {
    try {
      const { data, error } = await supabase
        .from('session_requests')
        .select(`
          *,
          profiles!teacher_id(
            id,
            full_name,
            email,
            bio,
            avatar_url,
            teachers(
              hourly_rate,
              currency,
              subjects,
              specialties,
              experience_years,
              rating,
              total_reviews,
              verification_status
            )
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((request) => ({
        ...request,
        teacher: {
          ...request.profiles,
          hourly_rate: (request.profiles as any)?.teachers?.[0]?.hourly_rate || 0,
          currency: (request.profiles as any)?.teachers?.[0]?.currency || 'USD',
          subjects: (request.profiles as any)?.teachers?.[0]?.subjects || [],
          specialties: (request.profiles as any)?.teachers?.[0]?.specialties || [],
          experience_years: (request.profiles as any)?.teachers?.[0]?.experience_years || 0,
          rating: (request.profiles as any)?.teachers?.[0]?.rating || 0,
          total_reviews: (request.profiles as any)?.teachers?.[0]?.total_reviews || 0,
          verification_status: (request.profiles as any)?.teachers?.[0]?.verification_status || 'pending',
        },
      }));
    } catch (error) {
      console.error('Error fetching student requests:', error);
      throw error;
    }
  }
}
