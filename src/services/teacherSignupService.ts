import { supabase } from '../supabaseClient';

export interface TeacherSignupData {
  // Basic Profile Information (from profiles table)
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  location?: string;
  bio?: string;
  timezone: string;
  language: string;

  // Teacher Information (from teachers table)
  hourly_rate: number;
  currency: string;
  subjects: string[];
  specialties: string[];
  education: string[];
  experience_years: number;
  teaching_philosophy?: string;
  languages: string[];
  social_links: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  tsc_number?: string;

  // Teacher Preferences (from teacher_preferences table)
  preferred_student_ages: string[];
  preferred_class_duration: number;
  max_students_per_class: number;
  auto_accept_bookings: boolean;
  require_student_approval: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  profile_visibility: 'public' | 'private' | 'students_only';
  show_contact_info: boolean;
  show_social_links: boolean;
  show_verification_badges: boolean;
  preferred_payment_method: 'stripe' | 'mpesa' | 'bank_transfer';
  auto_withdraw: boolean;
  withdraw_threshold: number;

  // Teacher Skills (from teacher_skills table)
  skills: Array<{
    skill_name: string;
    skill_category?: string;
    proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    years_experience: number;
    is_certified: boolean;
    certification_body?: string;
    certification_date?: string;
  }>;

  // Teacher Subjects (from teacher_subjects table)
  teacher_subjects: Array<{
    subject_id: string;
    proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    years_experience: number;
    is_primary: boolean;
  }>;

  // Availability (from teacher_availability table)
  availability: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
    is_active: boolean;
    max_students_per_slot: number;
    buffer_minutes: number;
  }>;
}

export interface TeacherSignupResult {
  success: boolean;
  teacherId?: string;
  error?: string;
}

export class TeacherSignupService {
  /**
   * Create a complete teacher profile with all related data
   */
  static async createTeacherProfile(
    userId: string,
    signupData: TeacherSignupData
  ): Promise<TeacherSignupResult> {
    try {
      console.log('Creating teacher profile for user:', userId);
      console.log('Signup data:', signupData);

      // Start a transaction-like operation by creating all records in sequence
      // 1. Update profile with teacher-specific data
      const profileUpdate = {
        full_name: signupData.full_name,
        phone: signupData.phone,
        date_of_birth: signupData.date_of_birth,
        location: signupData.location,
        bio: signupData.bio,
        timezone: signupData.timezone,
        language: signupData.language,
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile:', profileUpdate);
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // 2. Create teacher record
      const teacherData = {
        id: userId,
        hourly_rate: signupData.hourly_rate,
        currency: signupData.currency,
        subjects: signupData.subjects,
        specialties: signupData.specialties,
        education: signupData.education,
        experience_years: signupData.experience_years,
        teaching_philosophy: signupData.teaching_philosophy,
        languages: signupData.languages,
        social_links: signupData.social_links,
        tsc_number: signupData.tsc_number,
        is_available: true,
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating teacher record:', teacherData);
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert(teacherData);

      if (teacherError) {
        console.error('Teacher creation error:', teacherError);
        throw teacherError;
      }

      // 3. Create teacher preferences
      const preferencesData = {
        teacher_id: userId,
        preferred_student_ages: signupData.preferred_student_ages,
        preferred_class_duration: signupData.preferred_class_duration,
        max_students_per_class: signupData.max_students_per_class,
        auto_accept_bookings: signupData.auto_accept_bookings,
        require_student_approval: signupData.require_student_approval,
        email_notifications: signupData.email_notifications,
        sms_notifications: signupData.sms_notifications,
        push_notifications: signupData.push_notifications,
        marketing_emails: signupData.marketing_emails,
        profile_visibility: signupData.profile_visibility,
        show_contact_info: signupData.show_contact_info,
        show_social_links: signupData.show_social_links,
        show_verification_badges: signupData.show_verification_badges,
        preferred_payment_method: signupData.preferred_payment_method,
        auto_withdraw: signupData.auto_withdraw,
        withdraw_threshold: signupData.withdraw_threshold,
        timezone: signupData.timezone,
        language: signupData.language,
        currency: signupData.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating teacher preferences:', preferencesData);
      const { error: preferencesError } = await supabase
        .from('teacher_preferences')
        .insert(preferencesData);

      if (preferencesError) {
        console.error('Teacher preferences error:', preferencesError);
        throw preferencesError;
      }

      // 4. Create teacher skills
      if (signupData.skills.length > 0) {
        const skillsData = signupData.skills.map(skill => ({
          teacher_id: userId,
          skill_name: skill.skill_name,
          skill_category: skill.skill_category,
          proficiency_level: skill.proficiency_level,
          years_experience: skill.years_experience,
          is_certified: skill.is_certified,
          certification_body: skill.certification_body,
          certification_date: skill.certification_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log('Creating teacher skills:', skillsData);
        const { error: skillsError } = await supabase
          .from('teacher_skills')
          .insert(skillsData);

        if (skillsError) {
          console.error('Teacher skills error:', skillsError);
          throw skillsError;
        }
      }

      // 5. Create teacher subjects (if any)
      if (signupData.teacher_subjects.length > 0) {
        const subjectsData = signupData.teacher_subjects.map(subject => ({
          teacher_id: userId,
          subject_id: subject.subject_id,
          proficiency_level: subject.proficiency_level,
          years_experience: subject.years_experience,
          is_primary: subject.is_primary,
          is_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log('Creating teacher subjects:', subjectsData);
        const { error: subjectsError } = await supabase
          .from('teacher_subjects')
          .insert(subjectsData);

        if (subjectsError) {
          console.error('Teacher subjects error:', subjectsError);
          throw subjectsError;
        }
      }

      // 6. Create teacher availability
      if (signupData.availability.length > 0) {
        const availabilityData = signupData.availability.map(slot => ({
          teacher_id: userId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          timezone: slot.timezone,
          is_active: slot.is_active,
          max_students_per_slot: slot.max_students_per_slot,
          buffer_minutes: slot.buffer_minutes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log('Creating teacher availability:', availabilityData);
        const { error: availabilityError } = await supabase
          .from('teacher_availability')
          .insert(availabilityData);

        if (availabilityError) {
          console.error('Teacher availability error:', availabilityError);
          throw availabilityError;
        }
      }

      // 7. Create teacher onboarding response record
      const onboardingData = {
        teacher_id: userId,
        max_children: signupData.max_students_per_class,
        preferred_language: signupData.language,
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating teacher onboarding response:', onboardingData);
      const { data: onboardingResponse, error: onboardingError } = await supabase
        .from('teacher_onboarding_responses')
        .insert(onboardingData)
        .select()
        .single();

      if (onboardingError) {
        console.error('Teacher onboarding error:', onboardingError);
        throw onboardingError;
      }

      // 8. Create teacher preferred curriculums (if any)
      // Note: This would require curriculum IDs from the education systems
      // For now, we'll skip this as it's not in the signup data

      // 9. Create teacher preferred subjects (if any)
      if (signupData.teacher_subjects.length > 0 && onboardingResponse) {
        const preferredSubjectsData = signupData.teacher_subjects.map(subject => ({
          onboarding_id: onboardingResponse.id,
          subject_id: subject.subject_id,
          created_at: new Date().toISOString()
        }));

        console.log('Creating teacher preferred subjects:', preferredSubjectsData);
        const { error: preferredSubjectsError } = await supabase
          .from('teacher_preferred_subjects')
          .insert(preferredSubjectsData);

        if (preferredSubjectsError) {
          console.error('Teacher preferred subjects error:', preferredSubjectsError);
          throw preferredSubjectsError;
        }
      }

      // 10. Create teacher availability for onboarding (if any)
      if (signupData.availability.length > 0 && onboardingResponse) {
        const onboardingAvailabilityData = signupData.availability.map(slot => ({
          onboarding_id: onboardingResponse.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          timezone: slot.timezone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log('Creating teacher onboarding availability:', onboardingAvailabilityData);
        const { error: onboardingAvailabilityError } = await supabase
          .from('teacher_onboarding_availability')
          .insert(onboardingAvailabilityData);

        if (onboardingAvailabilityError) {
          console.error('Teacher onboarding availability error:', onboardingAvailabilityError);
          throw onboardingAvailabilityError;
        }
      }

      // 11. Create wallet for teacher
      const walletData = {
        user_id: userId,
        balance: 0.00,
        currency: signupData.currency,
        tokens: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating teacher wallet:', walletData);
      const { error: walletError } = await supabase
        .from('wallets')
        .insert(walletData);

      if (walletError) {
        console.error('Teacher wallet error:', walletError);
        // Don't throw here as wallet creation might fail if it already exists
        console.warn('Wallet creation failed, but continuing...');
      }

      console.log('Teacher profile created successfully');
      return {
        success: true,
        teacherId: userId
      };

    } catch (error) {
      console.error('Error creating teacher profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create teacher profile'
      };
    }
  }

  /**
   * Get available subjects for teacher signup
   */
  static async getAvailableSubjects(): Promise<Array<{ id: string; name: string; category: string }>> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available subjects:', error);
      return [];
    }
  }

  /**
   * Get education systems for teacher signup
   */
  static async getEducationSystems(): Promise<Array<{ id: string; name: string }>> {
    try {
      const { data, error } = await supabase
        .from('education_systems')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching education systems:', error);
      return [];
    }
  }

  /**
   * Validate teacher signup data
   */
  static validateSignupData(data: TeacherSignupData): string | null {
    // Required fields validation
    if (!data.full_name?.trim()) {
      return 'Full name is required';
    }
    if (!data.email?.trim()) {
      return 'Email is required';
    }
    if (!data.hourly_rate || data.hourly_rate <= 0) {
      return 'Hourly rate must be greater than 0';
    }
    if (data.experience_years < 0) {
      return 'Years of experience cannot be negative';
    }
    if (data.preferred_class_duration <= 0) {
      return 'Class duration must be greater than 0';
    }
    if (data.max_students_per_class <= 0) {
      return 'Max students per class must be greater than 0';
    }
    if (data.skills.length === 0) {
      return 'At least one skill is required';
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return 'Please enter a valid email address';
    }

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: data.timezone });
    } catch {
      return 'Please select a valid timezone';
    }

    return null;
  }
}


