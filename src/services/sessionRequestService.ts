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
      console.log('[createSessionRequest] Starting request creation', {
        studentId,
        teacherId: requestData.teacher_id,
        requestedStart: requestData.requested_start,
        requestedEnd: requestData.requested_end,
        durationHours: requestData.duration_hours,
      });

      // Check if student has enough tokens (10 tokens required)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('tokens')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('[createSessionRequest] Error fetching student tokens:', {
          error: studentError,
          studentId,
        });
        throw studentError;
      }

      console.log('[createSessionRequest] Student fetched', {
        studentId,
        tokens: student?.tokens,
      });

      // Check if student has enough tokens (will be deducted after Zoom class completion)
      // The "Send request" button just links the student to the teacher - no tokens deducted here
      // Tokens are only deducted after a Zoom class session is completed
      if (!student || student.tokens < 10) {
        const message = 'Insufficient tokens. You need at least 10 tokens to send a session request. Tokens will be deducted after the Zoom class is completed.';
        console.warn('[createSessionRequest] Insufficient tokens', {
          studentId,
          availableTokens: student?.tokens || 0,
          requiredTokens: 10,
        });
        throw new Error(message);
      }

      // Check if there's already a pending request for this teacher
      const { data: existingRequest, error: existingError } = await supabase
        .from('session_requests')
        .select('id')
        .eq('student_id', studentId)
        .eq('teacher_id', requestData.teacher_id)
        .eq('status', 'pending')
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('[createSessionRequest] Error checking existing requests:', existingError);
      }

      if (existingRequest) {
        const message = 'You already have a pending request for this teacher.';
        console.warn('[createSessionRequest] Duplicate request attempt', {
          studentId,
          teacherId: requestData.teacher_id,
          existingRequestId: existingRequest.id,
        });
        throw new Error(message);
      }

      console.log('[createSessionRequest] No existing pending request found');

      // Calculate tokens required (10 tokens per request)
      const tokensRequired = 10;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      console.log('[createSessionRequest] Preparing to insert request into database', {
        studentId,
        teacherId: requestData.teacher_id,
        tokensRequired,
        expiresAt: expiresAt.toISOString(),
      });

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
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) {
        console.error('[createSessionRequest] Error inserting session request:', {
          error: requestError,
          code: requestError.code,
          message: requestError.message,
          details: requestError.details,
          hint: requestError.hint,
          studentId,
          teacherId: requestData.teacher_id,
        });
        throw requestError;
      }

      console.log('[createSessionRequest] Request created successfully', {
        requestId: request.id,
        studentId,
        teacherId: requestData.teacher_id,
      });

      // Note: Tokens will be deducted after the session is completed, not when the request is sent

      // Get teacher profile for notification (teacher_id should be profile ID)
      const { data: teacherProfile, error: teacherProfileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', requestData.teacher_id)
        .single();

      if (teacherProfileError) {
        console.warn('[createSessionRequest] Error fetching teacher profile:', {
          error: teacherProfileError,
          teacherId: requestData.teacher_id,
        });
      }

      const teacherName = teacherProfile?.full_name || 'the teacher';
      const teacherProfileId = teacherProfile?.id || requestData.teacher_id;

      console.log('[createSessionRequest] Teacher profile fetched', {
        teacherProfileId,
        teacherName,
      });

      // Get student profile for notification (studentId should be profile ID)
      const { data: studentProfile, error: studentProfileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', studentId)
        .single();

      if (studentProfileError) {
        console.warn('[createSessionRequest] Error fetching student profile:', {
          error: studentProfileError,
          studentId,
        });
      }

      const studentName = studentProfile?.full_name || 'a student';
      const studentProfileId = studentId;

      console.log('[createSessionRequest] Student profile fetched', {
        studentProfileId,
        studentName,
      });

      console.log('[createSessionRequest] Creating notifications:', {
        studentProfileId,
        teacherProfileId,
        studentName,
        teacherName,
        requestId: request.id,
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
        console.error('[createSessionRequest] Error creating student notification:', studentNotificationError);
        console.error('[createSessionRequest] Student notification error details:', {
          code: studentNotificationError.code,
          message: studentNotificationError.message,
          details: studentNotificationError.details,
          hint: studentNotificationError.hint,
          user_id: studentProfileId,
          notificationData: studentNotificationData,
        });
        // Try to insert without select to see if it's a select issue
        const { error: retryError } = await supabase
          .from('notifications')
          .insert(studentNotificationData);
        if (retryError) {
          console.error('[createSessionRequest] Retry also failed:', retryError);
        } else {
          console.log('[createSessionRequest] Notification created on retry (without select)');
        }
      } else {
        console.log('[createSessionRequest] Student notification created successfully:', studentNotification?.id || 'created');
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
        console.error('[createSessionRequest] Error creating teacher notification:', teacherNotificationError);
        console.error('[createSessionRequest] Teacher notification error details:', {
          code: teacherNotificationError.code,
          message: teacherNotificationError.message,
          details: teacherNotificationError.details,
          hint: teacherNotificationError.hint,
          user_id: teacherProfileId,
          notificationData: teacherNotificationData,
        });
        // Try to insert without select to see if it's a select issue
        const { error: retryError } = await supabase
          .from('notifications')
          .insert(teacherNotificationData);
        if (retryError) {
          console.error('[createSessionRequest] Retry also failed:', retryError);
        } else {
          console.log('[createSessionRequest] Notification created on retry (without select)');
        }
      } else {
        console.log('[createSessionRequest] Teacher notification created successfully:', teacherNotification?.id || 'created');
      }

      console.log('[createSessionRequest] Request creation completed successfully', {
        requestId: request.id,
      });

      return request;
    } catch (error) {
      console.error('[createSessionRequest] Fatal error creating session request:', error);
      if (error instanceof Error) {
        console.error('[createSessionRequest] Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Get session requests for a teacher
   */
  static async getTeacherRequests(teacherId: string): Promise<SessionRequest[]> {
    try {
      console.log('[getTeacherRequests] Fetching requests for teacher', { teacherId });

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

      if (error) {
        console.error('[getTeacherRequests] Database error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          teacherId,
        });
        throw error;
      }

      console.log('[getTeacherRequests] Fetched requests count:', {
        teacherId,
        count: data?.length || 0,
      });

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

      console.log('[getTeacherRequests] Returning enriched requests', {
        teacherId,
        count: requestsWithEducation.length,
      });

      return requestsWithEducation;
    } catch (error) {
      console.error('[getTeacherRequests] Error fetching teacher requests:', {
        error,
        teacherId,
      });
      if (error instanceof Error) {
        console.error('[getTeacherRequests] Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Accept a session request
   */
  static async acceptRequest(requestId: string, teacherResponse?: string): Promise<void> {
    try {
      console.log('[acceptRequest] Starting request acceptance', {
        requestId,
        teacherResponse: teacherResponse ? '(provided)' : '(none)',
      });

      const { error, data: updateData } = await supabase
        .from('session_requests')
        .update({
          status: 'accepted',
          teacher_response: teacherResponse,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('[acceptRequest] Failed to update session_requests table', {
          requestId,
          error,
        });
        throw error;
      }

      console.log('[acceptRequest] Successfully updated session_requests status to accepted', {
        requestId,
      });

      // Get request details for notification
      const { data: request, error: requestError } = await supabase
        .from('session_requests')
        .select('student_id, teacher_id, requested_start, requested_end')
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('[acceptRequest] Failed to fetch request details', {
          requestId,
          error: requestError,
        });
        throw requestError;
      }

      console.log('[acceptRequest] Fetched request details', {
        requestId,
        student_id: request?.student_id,
        teacher_id: request?.teacher_id,
      });

      // Get teacher name for notification message
      const { data: teacherProfile, error: teacherProfileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', request.teacher_id)
        .single();

      if (teacherProfileError) {
        console.error('[acceptRequest] Failed to fetch teacher profile', {
          teacher_id: request.teacher_id,
          error: teacherProfileError,
        });
      }

      const teacherName = teacherProfile?.full_name || 'the teacher';

      console.log('[acceptRequest] Retrieved teacher name', { teacherName });

      // Since students.id and teachers.id both reference profiles.id,
      // student_id and teacher_id should be profile IDs
      const studentProfileId = request.student_id;

      console.log('[acceptRequest] Creating notification for student', {
        studentProfileId,
        requestId,
      });

      // Create notification for student
      const { error: notificationError, data: notificationData } = await supabase
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
        console.error('[acceptRequest] Failed to create notification', {
          studentProfileId,
          requestId,
          error: notificationError,
        });
        throw notificationError;
      }

      console.log('[acceptRequest] Successfully created acceptance notification', {
        studentProfileId,
        requestId,
      });

      console.log('[acceptRequest] Request acceptance completed successfully', {
        requestId,
        status: 'accepted',
      });
    } catch (error) {
      console.error('[acceptRequest] Error accepting request:', {
        error,
        requestId,
      });
      if (error instanceof Error) {
        console.error('[acceptRequest] Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
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
      console.log('[declineRequest] Starting request decline process', {
        requestId,
        declinedReason: declinedReason ? '(provided)' : '(none)',
        teacherResponse: teacherResponse ? '(provided)' : '(none)',
      });

      const { error: updateError } = await supabase
        .from('session_requests')
        .update({
          status: 'declined',
          declined_reason: declinedReason,
          teacher_response: teacherResponse,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('[declineRequest] Failed to update session_requests status', {
          requestId,
          error: updateError,
        });
        throw updateError;
      }

      console.log('[declineRequest] Successfully updated status to declined', { requestId });

      // Get request details for refund and notification
      const { data: request, error: requestError } = await supabase
        .from('session_requests')
        .select('student_id, teacher_id, tokens_required, requested_start, requested_end')
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('[declineRequest] Failed to fetch request details', {
          requestId,
          error: requestError,
        });
        throw requestError;
      }

      console.log('[declineRequest] Fetched request details for refund', {
        requestId,
        tokens_required: request?.tokens_required,
        student_id: request?.student_id,
      });

      // Refund tokens to student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('tokens')
        .eq('id', request.student_id)
        .single();

      if (studentError) {
        console.error('[declineRequest] Failed to fetch student record', {
          student_id: request.student_id,
          error: studentError,
        });
        throw studentError;
      }

      console.log('[declineRequest] Fetched student token balance', {
        student_id: request.student_id,
        current_tokens: student?.tokens || 0,
      });

      const newTokenBalance = (student?.tokens || 0) + request.tokens_required;

      const { error: refundError } = await supabase
        .from('students')
        .update({
          tokens: newTokenBalance,
        })
        .eq('id', request.student_id);

      if (refundError) {
        console.error('[declineRequest] Failed to refund tokens', {
          student_id: request.student_id,
          tokens_to_refund: request.tokens_required,
          error: refundError,
        });
        throw refundError;
      }

      console.log('[declineRequest] Successfully refunded tokens', {
        student_id: request.student_id,
        tokens_refunded: request.tokens_required,
        new_balance: newTokenBalance,
      });

      // Create refund transaction record
      const { error: transactionError, data: transactionData } = await supabase
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

      if (transactionError) {
        console.error('[declineRequest] Failed to create transaction record', {
          student_id: request.student_id,
          error: transactionError,
        });
        throw transactionError;
      }

      console.log('[declineRequest] Successfully created refund transaction', {
        student_id: request.student_id,
        tokens_refunded: request.tokens_required,
      });

      // Create notification for student
      console.log('[declineRequest] Creating decline notification for student', {
        student_id: request.student_id,
        requestId,
      });

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

      if (notificationError) {
        console.error('[declineRequest] Failed to create notification', {
          student_id: request.student_id,
          error: notificationError,
        });
        throw notificationError;
      }

      console.log('[declineRequest] Successfully completed request decline', {
        requestId,
        status: 'declined',
        tokens_refunded: request.tokens_required,
      });
    } catch (error) {
      console.error('[declineRequest] Error declining request:', {
        error,
        requestId,
      });
      if (error instanceof Error) {
        console.error('[declineRequest] Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }

  /**
   * Get session requests for a student
   */
  static async getStudentRequests(studentId: string): Promise<SessionRequest[]> {
    try {
      console.log('[getStudentRequests] Fetching requests for student', { studentId });

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

      if (error) {
        console.error('[getStudentRequests] Error fetching student requests', {
          studentId,
          error,
        });
        throw error;
      }

      console.log('[getStudentRequests] Successfully fetched requests', {
        studentId,
        count: (data || []).length,
      });

      const enrichedRequests = (data || []).map((request) => ({
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

      console.log('[getStudentRequests] Returning enriched requests', {
        studentId,
        count: enrichedRequests.length,
      });

      return enrichedRequests;
    } catch (error) {
      console.error('[getStudentRequests] Error fetching student requests:', {
        error,
        studentId,
      });
      if (error instanceof Error) {
        console.error('[getStudentRequests] Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }
}
