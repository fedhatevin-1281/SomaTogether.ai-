import { supabase } from '../supabaseClient';

export interface TeacherProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  timezone: string;
  is_verified: boolean;
  last_login_at?: string;
  // Teacher specific fields
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
  profile_image_url?: string;
  cover_image_url?: string;
  teaching_philosophy?: string;
  certifications: any[];
  languages: string[];
  social_links: any;
  // Preferences
  preferred_student_ages?: string[];
  preferred_class_duration?: number;
  max_students_per_class?: number;
  auto_accept_bookings?: boolean;
  require_student_approval?: boolean;
  profile_visibility?: string;
  show_contact_info?: boolean;
  show_social_links?: boolean;
  show_verification_badges?: boolean;
  // Availability
  availability?: any;
  vacation_mode?: boolean;
  vacation_start_date?: string;
  vacation_end_date?: string;
  // Teacher subjects with details
  teacher_subjects?: Array<{
    subject_id: string;
    subject_name: string;
    proficiency_level: string;
    years_experience: number;
    is_primary: boolean;
  }>;
  // Teacher skills
  teacher_skills?: Array<{
    skill_name: string;
    skill_category: string;
    proficiency_level: string;
    years_experience: number;
    is_certified: boolean;
  }>;
  // Reviews
  recent_reviews?: Array<{
    id: string;
    student_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
  // Online status
  is_online?: boolean;
  last_seen?: string;
  // Profile completion indicators
  profile_completion_percentage?: number;
  needs_profile_completion?: boolean;
  // Preferred curriculums
  preferred_curriculums?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

export interface TeacherBrowseFilters {
  subjects?: string[];
  min_rating?: number;
  max_hourly_rate?: number;
  availability?: boolean;
  languages?: string[];
  experience_years?: number;
  verification_status?: string;
  search_query?: string;
  sort_by?: 'rating' | 'price' | 'experience' | 'reviews' | 'availability';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedTeachers {
  teachers: TeacherProfile[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

class TeacherBrowseService {
  /**
   * Get paginated list of teachers for student browsing
   */
  static async getTeachers(
    filters: TeacherBrowseFilters = {},
    page: number = 1,
    perPage: number = 12
  ): Promise<PaginatedTeachers> {
    try {
      console.log('Fetching teachers with filters:', filters);

      // Get all available teachers with their profile information
      let query = supabase
        .from('teachers')
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            email,
            avatar_url,
            bio,
            location,
            timezone,
            is_verified,
            last_login_at,
            created_at,
            updated_at,
            is_active,
            role
          ),
          teacher_preferences (
            preferred_student_ages,
            preferred_class_duration,
            max_students_per_class,
            auto_accept_bookings,
            require_student_approval,
            profile_visibility,
            show_contact_info,
            show_social_links,
            show_verification_badges,
            vacation_mode,
            vacation_start_date,
            vacation_end_date
          ),
          teacher_subjects (
            subject_id,
            proficiency_level,
            years_experience,
            is_primary,
            subjects (
              id,
              name,
              category
            )
          )
        `)
        .eq('is_available', true);

      // Apply filters
      if (filters.subjects && filters.subjects.length > 0) {
        query = query.overlaps('subjects', filters.subjects);
      }

      if (filters.min_rating) {
        query = query.gte('rating', filters.min_rating);
      }

      if (filters.max_hourly_rate) {
        query = query.lte('hourly_rate', filters.max_hourly_rate);
      }

      if (filters.languages && filters.languages.length > 0) {
        query = query.overlaps('languages', filters.languages);
      }

      if (filters.experience_years) {
        query = query.gte('experience_years', filters.experience_years);
      }

      if (filters.verification_status) {
        query = query.eq('verification_status', filters.verification_status);
      }

      if (filters.search_query) {
        query = query.or(`profiles.full_name.ilike.%${filters.search_query}%,profiles.bio.ilike.%${filters.search_query}%,teaching_philosophy.ilike.%${filters.search_query}%,subjects.cs.{${filters.search_query}}`);
      }

      if (filters.availability) {
        query = query.eq('is_available', true);
        // Also check vacation mode
        query = query.eq('teacher_preferences.vacation_mode', false);
      }

      // Apply sorting
      const sortField = filters.sort_by || 'rating';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      // Get count separately for total count
      const { count } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching teachers:', error);
        throw error;
      }

      console.log('Fetched teachers:', data?.length, 'Total count:', count);

      // Filter out inactive profiles and non-teachers
      const filteredData = (data || []).filter((teacher: any) => {
        const profile = teacher.profiles;
        return profile && profile.is_active === true && profile.role === 'teacher';
      });

      // Transform the data
      const teachers: TeacherProfile[] = filteredData.map((teacher: any) => {
        const profile = teacher.profiles;
        const preferences = teacher.teacher_preferences?.[0];
        
        return {
          id: teacher.id,
          full_name: profile?.full_name || 'Unknown Teacher',
          email: profile?.email || '',
          avatar_url: teacher.profile_image_url || profile?.avatar_url || null,
          bio: profile?.bio || teacher.teaching_philosophy || null,
          location: profile?.location || null,
          timezone: profile?.timezone || teacher.timezone || 'UTC',
          is_verified: profile?.is_verified || false,
          last_login_at: profile?.last_login_at || teacher.updated_at || null,
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
          profile_image_url: teacher.profile_image_url || null,
          cover_image_url: teacher.cover_image_url || null,
          teaching_philosophy: teacher.teaching_philosophy || null,
          certifications: teacher.certifications || [],
          languages: teacher.languages || [],
          social_links: teacher.social_links || {},
          preferred_student_ages: preferences?.preferred_student_ages || [],
          preferred_class_duration: preferences?.preferred_class_duration || null,
          max_students_per_class: preferences?.max_students_per_class || null,
          auto_accept_bookings: preferences?.auto_accept_bookings || false,
          require_student_approval: preferences?.require_student_approval || true,
          profile_visibility: preferences?.profile_visibility || 'public',
          show_contact_info: preferences?.show_contact_info || false,
          show_social_links: preferences?.show_social_links || true,
          show_verification_badges: preferences?.show_verification_badges || true,
          vacation_mode: preferences?.vacation_mode || false,
          vacation_start_date: preferences?.vacation_start_date || null,
          vacation_end_date: preferences?.vacation_end_date || null,
          teacher_subjects: teacher.teacher_subjects?.map((ts: any) => ({
            subject_id: ts.subject_id,
            subject_name: ts.subjects?.name || 'Unknown Subject',
            proficiency_level: ts.proficiency_level,
            years_experience: ts.years_experience,
            is_primary: ts.is_primary
          })) || [],
          teacher_skills: [],
          is_online: this.isTeacherOnline(profile?.last_login_at),
          last_seen: profile?.last_login_at || null,
          // Profile completion indicators
          profile_completion_percentage: this.calculateProfileCompletion(teacher, profile),
          needs_profile_completion: this.needsProfileCompletion(teacher, profile)
        };
      });

      const totalPages = Math.ceil(teachers.length / perPage);

      return {
        teachers,
        total_count: teachers.length,
        page,
        per_page: perPage,
        total_pages: totalPages
      };
    } catch (error) {
      console.error('Error in getTeachers:', error);
      throw error;
    }
  }

  /**
   * Get detailed teacher profile for student view
   */
  static async getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
    try {
      console.log('Fetching teacher profile:', teacherId);

      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            email,
            avatar_url,
            bio,
            location,
            timezone,
            is_verified,
            last_login_at
          ),
          teacher_subjects (
            subject_id,
            proficiency_level,
            years_experience,
            is_primary,
            subjects (
              id,
              name,
              category
            )
          ),
          teacher_skills (
            skill_name,
            skill_category,
            proficiency_level,
            years_experience,
            is_certified
          ),
          teacher_preferences (
            preferred_student_ages,
            preferred_class_duration,
            max_students_per_class,
            auto_accept_bookings,
            require_student_approval,
            profile_visibility,
            show_contact_info,
            show_social_links,
            show_verification_badges,
            vacation_mode,
            vacation_start_date,
            vacation_end_date
          )
        `)
        .eq('id', teacherId)
        .single();

      if (error) {
        console.error('Error fetching teacher profile:', error);
        return null;
      }

      if (!data) return null;

      const profile = data.profiles;
      
      // Check if profile is active and user is a teacher
      if (!profile || !profile.is_active || profile.role !== 'teacher') {
        console.log('Teacher profile not found or inactive:', teacherId);
        return null;
      }
      
      const preferences = data.teacher_preferences?.[0];

      // Get preferred curriculums
      const { data: onboardingData } = await supabase
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
        .eq('teacher_id', teacherId)
        .single();

      // Get recent reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          students (
            profiles (
              full_name
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5);

      const teacher: TeacherProfile = {
        id: data.id,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: data.profile_image_url || profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        timezone: profile.timezone,
        is_verified: profile.is_verified,
        last_login_at: profile.last_login_at,
        hourly_rate: data.hourly_rate,
        currency: data.currency,
        subjects: data.subjects,
        specialties: data.specialties,
        education: data.education,
        experience_years: data.experience_years,
        rating: data.rating,
        total_reviews: data.total_reviews,
        total_students: data.total_students,
        total_sessions: data.total_sessions,
        max_students: data.max_students,
        is_available: data.is_available,
        verification_status: data.verification_status,
        profile_image_url: data.profile_image_url,
        cover_image_url: data.cover_image_url,
        teaching_philosophy: data.teaching_philosophy,
        certifications: data.certifications,
        languages: data.languages,
        social_links: data.social_links,
        preferred_student_ages: preferences?.preferred_student_ages,
        preferred_class_duration: preferences?.preferred_class_duration,
        max_students_per_class: preferences?.max_students_per_class,
        auto_accept_bookings: preferences?.auto_accept_bookings,
        require_student_approval: preferences?.require_student_approval,
        profile_visibility: preferences?.profile_visibility,
        show_contact_info: preferences?.show_contact_info,
        show_social_links: preferences?.show_social_links,
        show_verification_badges: preferences?.show_verification_badges,
        vacation_mode: preferences?.vacation_mode,
        vacation_start_date: preferences?.vacation_start_date,
        vacation_end_date: preferences?.vacation_end_date,
        teacher_subjects: data.teacher_subjects?.map((ts: any) => ({
          subject_id: ts.subject_id,
          subject_name: ts.subjects?.name || 'Unknown Subject',
          proficiency_level: ts.proficiency_level,
          years_experience: ts.years_experience,
          is_primary: ts.is_primary
        })),
        teacher_skills: data.teacher_skills?.map((skill: any) => ({
          skill_name: skill.skill_name,
          skill_category: skill.skill_category,
          proficiency_level: skill.proficiency_level,
          years_experience: skill.years_experience,
          is_certified: skill.is_certified
        })),
        recent_reviews: reviewsData?.map((review: any) => ({
          id: review.id,
          student_name: review.students?.profiles?.full_name || 'Anonymous',
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at
        })),
        preferred_curriculums: onboardingData?.teacher_preferred_curriculums?.map((c: any) => c.education_systems) || [],
        is_online: this.isTeacherOnline(profile.last_login_at),
        last_seen: profile.last_login_at
      };

      return teacher;
    } catch (error) {
      console.error('Error in getTeacherProfile:', error);
      return null;
    }
  }

  /**
   * Get available subjects for filtering
   */
  static async getSubjects(): Promise<Array<{id: string, name: string, category: string}>> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSubjects:', error);
      return [];
    }
  }

  /**
   * Check if teacher is online (logged in within last 15 minutes)
   */
  private static isTeacherOnline(lastLoginAt?: string): boolean {
    if (!lastLoginAt) return false;
    
    const lastLogin = new Date(lastLoginAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
    
    return diffMinutes <= 15;
  }

  /**
   * Calculate profile completion percentage
   */
  private static calculateProfileCompletion(teacher: any, profile: any): number {
    let completion = 0;
    const totalFields = 10;

    if (profile?.full_name) completion++;
    if (profile?.bio) completion++;
    if (profile?.avatar_url || teacher?.profile_image_url) completion++;
    if (teacher?.hourly_rate && teacher.hourly_rate > 0) completion++;
    if (teacher?.subjects && teacher.subjects.length > 0) completion++;
    if (teacher?.experience_years && teacher.experience_years > 0) completion++;
    if (teacher?.teaching_philosophy) completion++;
    if (teacher?.education && teacher.education.length > 0) completion++;
    if (teacher?.languages && teacher.languages.length > 0) completion++;
    if (teacher?.specialties && teacher.specialties.length > 0) completion++;

    return Math.round((completion / totalFields) * 100);
  }

  /**
   * Check if teacher needs profile completion
   */
  private static needsProfileCompletion(teacher: any, profile: any): boolean {
    return this.calculateProfileCompletion(teacher, profile) < 50;
  }

  /**
   * Get teacher availability for a specific date range
   */
  static async getTeacherAvailability(
    teacherId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{date: string, time_slots: Array<{start: string, end: string, available: boolean}>}>> {
    try {
      // This would integrate with a calendar/availability system
      // For now, return mock data structure
      const { data: availability } = await supabase
        .from('teacher_availability')
        .select('day_of_week, start_time, end_time, timezone')
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      // Process availability data and return structured time slots
      // This is a simplified implementation
      return [];
    } catch (error) {
      console.error('Error fetching teacher availability:', error);
      return [];
    }
  }

  /**
   * Send session request to teacher
   */
  static async sendSessionRequest(
    studentId: string,
    teacherId: string,
    requestedStart: string,
    requestedEnd: string,
    durationHours: number,
    tokensRequired: number,
    message?: string
  ): Promise<{success: boolean, requestId?: string, error?: string}> {
    try {
      console.log('Sending session request:', {
        studentId,
        teacherId,
        requestedStart,
        requestedEnd,
        durationHours,
        tokensRequired,
        message
      });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire in 24 hours

      const { data, error } = await supabase
        .from('session_requests')
        .insert({
          student_id: studentId,
          teacher_id: teacherId,
          requested_start: requestedStart,
          requested_end: requestedEnd,
          duration_hours: durationHours,
          tokens_required: tokensRequired,
          message: message,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating session request:', error);
        return { success: false, error: error.message };
      }

      // Send notification to teacher
      await this.sendNotification(
        teacherId,
        'session_request',
        'New Session Request',
        `You have a new session request from a student`,
        { request_id: data.id, student_id: studentId }
      );

      return { success: true, requestId: data.id };
    } catch (error) {
      console.error('Error in sendSessionRequest:', error);
      return { success: false, error: 'Failed to send session request' };
    }
  }

  /**
   * Send notification to user
   */
  private static async sendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: data || {},
          priority: 'normal'
        });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

export default TeacherBrowseService;
