import { supabase } from '../supabaseClient';

export interface EducationSystem {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface EducationLevel {
  id: string;
  system_id: string;
  level_name: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  category: string;
  description?: string;
  is_active: boolean;
}

export class EducationService {
  /**
   * Get all active education systems
   */
  static async getEducationSystems(): Promise<EducationSystem[]> {
    try {
      const { data, error } = await supabase
        .from('education_systems')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching education systems:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching education systems:', error);
      return [];
    }
  }

  /**
   * Get education levels for a specific system
   */
  static async getEducationLevels(systemId: string): Promise<EducationLevel[]> {
    try {
      const { data, error } = await supabase
        .from('education_levels')
        .select('*')
        .eq('system_id', systemId)
        .order('order_index');

      if (error) {
        console.error('Error fetching education levels:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching education levels:', error);
      return [];
    }
  }

  /**
   * Get all active subjects
   */
  static async getSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  }

  /**
   * Create onboarding response
   */
  static async createOnboardingResponse(data: {
    user_id: string;
    system_id: string;
    level_id: string;
    interests: string[];
    preferred_language: string;
  }) {
    try {
      const { data: response, error } = await supabase
        .from('onboarding_responses')
        .insert({
          user_id: data.user_id,
          system_id: data.system_id,
          level_id: data.level_id,
          interests: data.interests,
          preferred_language: data.preferred_language,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating onboarding response:', error);
        return { success: false, error };
      }

      return { success: true, response };
    } catch (error) {
      console.error('Error creating onboarding response:', error);
      return { success: false, error };
    }
  }

  /**
   * Add preferred subjects to onboarding response
   */
  static async addPreferredSubjects(onboardingId: string, subjectIds: string[]) {
    try {
      const subjectInserts = subjectIds.map(subjectId => ({
        onboarding_id: onboardingId,
        subject_id: subjectId
      }));

      const { error } = await supabase
        .from('onboarding_preferred_subjects')
        .insert(subjectInserts);

      if (error) {
        console.error('Error adding preferred subjects:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding preferred subjects:', error);
      return { success: false, error };
    }
  }

  /**
   * Create teacher onboarding response
   */
  static async createTeacherOnboardingResponse(data: {
    teacher_id: string;
    max_children: number;
    preferred_language: string;
  }) {
    try {
      const { data: response, error } = await supabase
        .from('teacher_onboarding_responses')
        .insert({
          teacher_id: data.teacher_id,
          max_children: data.max_children,
          preferred_language: data.preferred_language,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating teacher onboarding response:', error);
        return { success: false, error };
      }

      return { success: true, response };
    } catch (error) {
      console.error('Error creating teacher onboarding response:', error);
      return { success: false, error };
    }
  }

  /**
   * Add preferred curriculums to teacher onboarding
   */
  static async addPreferredCurriculums(onboardingId: string, systemIds: string[]) {
    try {
      const curriculumInserts = systemIds.map(systemId => ({
        onboarding_id: onboardingId,
        system_id: systemId
      }));

      const { error } = await supabase
        .from('teacher_preferred_curriculums')
        .insert(curriculumInserts);

      if (error) {
        console.error('Error adding preferred curriculums:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding preferred curriculums:', error);
      return { success: false, error };
    }
  }

  /**
   * Add preferred subjects to teacher onboarding
   */
  static async addTeacherPreferredSubjects(onboardingId: string, subjectIds: string[]) {
    try {
      const subjectInserts = subjectIds.map(subjectId => ({
        onboarding_id: onboardingId,
        subject_id: subjectId
      }));

      const { error } = await supabase
        .from('teacher_preferred_subjects')
        .insert(subjectInserts);

      if (error) {
        console.error('Error adding teacher preferred subjects:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding teacher preferred subjects:', error);
      return { success: false, error };
    }
  }

  /**
   * Add availability to teacher onboarding
   */
  static async addTeacherAvailability(onboardingId: string, availability: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
  }>) {
    try {
      const availabilityInserts = availability.map(slot => ({
        onboarding_id: onboardingId,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        timezone: slot.timezone
      }));

      const { error } = await supabase
        .from('teacher_onboarding_availability')
        .insert(availabilityInserts);

      if (error) {
        console.error('Error adding teacher availability:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding teacher availability:', error);
      return { success: false, error };
    }
  }
}
