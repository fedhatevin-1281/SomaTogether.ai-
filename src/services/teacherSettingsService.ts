import { supabase } from '../supabaseClient';

export interface TeacherProfile {
  id: string;
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
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_documents: string[];
  profile_image_url?: string;
  cover_image_url?: string;
  teaching_philosophy?: string;
  certifications?: any[];
  languages?: string[];
  social_links?: any;
  timezone?: string;
  notification_preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface TeacherDocument {
  id: string;
  teacher_id: string;
  document_type: 'profile_image' | 'cover_image' | 'certificate' | 'diploma' | 'degree' | 'license' | 'portfolio_item' | 'id_verification' | 'background_check';
  file_name: string;
  file_type: 'image' | 'pdf' | 'document';
  file_size_bytes: number;
  file_path: string;
  bucket_name: string;
  download_url?: string;
  thumbnail_url?: string;
  is_public: boolean;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface TeacherPreferences {
  id: string;
  teacher_id: string;
  preferred_student_ages: string[];
  preferred_class_duration: number;
  max_students_per_class: number;
  auto_accept_bookings: boolean;
  require_student_approval: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  timezone: string;
  working_hours: any;
  vacation_mode: boolean;
  vacation_start_date?: string;
  vacation_end_date?: string;
  preferred_payment_method: 'stripe' | 'mpesa' | 'bank_transfer';
  auto_withdraw: boolean;
  withdraw_threshold: number;
  profile_visibility: 'public' | 'private' | 'students_only';
  show_contact_info: boolean;
  show_social_links: boolean;
  show_verification_badges: boolean;
  language: string;
  date_format: string;
  time_format: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherSubject {
  id: string;
  teacher_id: string;
  subject_id: string;
  subject_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  is_primary: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherSkill {
  id: string;
  teacher_id: string;
  skill_name: string;
  skill_category?: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  is_certified: boolean;
  certification_body?: string;
  certification_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherMetrics {
  id: string;
  teacher_id: string;
  metric_date: string;
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_show_sessions: number;
  average_rating: number;
  total_reviews: number;
  five_star_reviews: number;
  four_star_reviews: number;
  three_star_reviews: number;
  two_star_reviews: number;
  one_star_reviews: number;
  total_earnings: number;
  total_hours_taught: number;
  average_session_value: number;
  new_students: number;
  returning_students: number;
  total_students: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface DashboardData {
  teacher: TeacherProfile;
  preferences: TeacherPreferences;
  metrics?: TeacherMetrics;
  subjects: TeacherSubject[];
  skills: TeacherSkill[];
}

export interface FileUploadResult {
  success: boolean;
  file_url?: string;
  thumbnail_url?: string;
  error?: string;
  document_id?: string;
}

export class TeacherSettingsService {
  /**
   * Get teacher dashboard data
   */
  static async getDashboardData(teacherId: string): Promise<DashboardData | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_teacher_dashboard_data', { teacher_uuid: teacherId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching teacher dashboard data:', error);
      return null;
    }
  }

  /**
   * Get teacher profile
   */
  static async getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      return null;
    }
  }

  /**
   * Update teacher profile
   */
  static async updateTeacherProfile(
    teacherId: string, 
    profileData: Partial<TeacherProfile>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('update_teacher_profile', {
          teacher_uuid: teacherId,
          profile_data: profileData
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating teacher profile:', error);
      return false;
    }
  }

  /**
   * Get teacher preferences
   */
  static async getTeacherPreferences(teacherId: string): Promise<TeacherPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('teacher_preferences')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create default preferences if they don't exist
        const { data: newPrefs, error: createError } = await supabase
          .rpc('create_teacher_preferences', { teacher_uuid: teacherId });

        if (createError) throw createError;

        // Fetch the newly created preferences
        const { data: prefsData, error: fetchError } = await supabase
          .from('teacher_preferences')
          .select('*')
          .eq('teacher_id', teacherId)
          .single();

        if (fetchError) throw fetchError;
        return prefsData;
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching teacher preferences:', error);
      return null;
    }
  }

  /**
   * Update teacher preferences
   */
  static async updateTeacherPreferences(
    teacherId: string,
    preferences: Partial<TeacherPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_preferences')
        .upsert({
          teacher_id: teacherId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating teacher preferences:', error);
      return false;
    }
  }

  /**
   * Get teacher documents
   */
  static async getTeacherDocuments(
    teacherId: string,
    documentType?: string
  ): Promise<TeacherDocument[]> {
    try {
      let query = supabase
        .from('teacher_documents')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher documents:', error);
      return [];
    }
  }

  /**
   * Upload teacher document
   */
  static async uploadDocument(
    teacherId: string,
    file: File,
    documentType: TeacherDocument['document_type'],
    metadata?: any
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      if (!file || file.size === 0) {
        return { success: false, error: 'No file provided' };
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return { success: false, error: 'File size exceeds 50MB limit' };
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'File type not allowed. Only images and PDFs are accepted.' };
      }

      // Create file name with timestamp to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${teacherId}/${documentType}/${timestamp}.${fileExt}`;
      
      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('teacher-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // If it's an RLS error, provide more specific guidance
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
          return { 
            success: false, 
            error: 'Upload failed due to security policy. Please ensure storage policies are configured correctly. Contact support if this persists.' 
          };
        }
        
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('teacher-documents')
        .getPublicUrl(fileName);

      // Create thumbnail URL for images
      let thumbnailUrl = publicUrl;
      if (file.type.startsWith('image/')) {
        // For images, we can use the same URL or create a thumbnail version
        thumbnailUrl = publicUrl;
      }

      // Save document record
      const fileInfo = {
        file_name: file.name,
        file_type: file.type.startsWith('image/') ? 'image' : 'document',
        file_size_bytes: file.size,
        file_path: fileName,
        bucket_name: 'teacher-documents',
        download_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        is_public: true,
        metadata: metadata || {}
      };

      console.log('Saving document record:', fileInfo);

      const { data: documentId, error: docError } = await supabase
        .rpc('upload_teacher_document', {
          teacher_uuid: teacherId,
          document_type_param: documentType,
          file_info: fileInfo
        });

      if (docError) {
        console.error('Document record error:', docError);
        
        // If document record fails, try to clean up the uploaded file
        await supabase.storage
          .from('teacher-documents')
          .remove([fileName]);
        
        throw docError;
      }

      console.log('Document record created:', documentId);

      return {
        success: true,
        file_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        document_id: documentId
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete teacher document
   */
  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from('teacher_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('teacher-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: deleteError } = await supabase
        .from('teacher_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Get teacher subjects
   */
  static async getTeacherSubjects(teacherId: string): Promise<TeacherSubject[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_subjects')
        .select(`
          *,
          subjects (
            name
          )
        `)
        .eq('teacher_id', teacherId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        subject_name: item.subjects?.name || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      return [];
    }
  }

  /**
   * Add teacher subject
   */
  static async addTeacherSubject(
    teacherId: string,
    subjectId: string,
    proficiencyLevel: TeacherSubject['proficiency_level'] = 'intermediate',
    yearsExperience: number = 0,
    isPrimary: boolean = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .insert({
          teacher_id: teacherId,
          subject_id: subjectId,
          proficiency_level: proficiencyLevel,
          years_experience: yearsExperience,
          is_primary: isPrimary,
          is_available: true
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding teacher subject:', error);
      return false;
    }
  }

  /**
   * Update teacher subject
   */
  static async updateTeacherSubject(
    subjectId: string,
    updates: Partial<TeacherSubject>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .update(updates)
        .eq('id', subjectId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating teacher subject:', error);
      return false;
    }
  }

  /**
   * Remove teacher subject
   */
  static async removeTeacherSubject(subjectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing teacher subject:', error);
      return false;
    }
  }

  /**
   * Get teacher skills
   */
  static async getTeacherSkills(teacherId: string): Promise<TeacherSkill[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_skills')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher skills:', error);
      return [];
    }
  }

  /**
   * Add teacher skill
   */
  static async addTeacherSkill(
    teacherId: string,
    skillData: Omit<TeacherSkill, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_skills')
        .insert({
          teacher_id: teacherId,
          ...skillData
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding teacher skill:', error);
      return false;
    }
  }

  /**
   * Update teacher skill
   */
  static async updateTeacherSkill(
    skillId: string,
    updates: Partial<TeacherSkill>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_skills')
        .update(updates)
        .eq('id', skillId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating teacher skill:', error);
      return false;
    }
  }

  /**
   * Remove teacher skill
   */
  static async removeTeacherSkill(skillId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing teacher skill:', error);
      return false;
    }
  }

  /**
   * Get available subjects
   */
  static async getAvailableSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
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
   * Get teacher metrics
   */
  static async getTeacherMetrics(
    teacherId: string,
    limit: number = 30
  ): Promise<TeacherMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_metrics')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('metric_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher metrics:', error);
      return [];
    }
  }

  /**
   * Update teacher availability
   */
  static async updateAvailability(
    teacherId: string,
    isAvailable: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ is_available: isAvailable })
        .eq('id', teacherId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating teacher availability:', error);
      return false;
    }
  }

  /**
   * Get teacher time off
   */
  static async getTeacherTimeOff(
    teacherId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('teacher_time_off')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('start_date', { ascending: true });

      if (startDate && endDate) {
        query = query.gte('start_date', startDate).lte('end_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher time off:', error);
      return [];
    }
  }

  /**
   * Add teacher time off
   */
  static async addTimeOff(
    teacherId: string,
    timeOffData: {
      type: 'vacation' | 'sick_leave' | 'personal' | 'holiday' | 'maintenance';
      start_date: string;
      end_date: string;
      start_time?: string;
      end_time?: string;
      is_full_day?: boolean;
      reason?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_time_off')
        .insert({
          teacher_id: teacherId,
          ...timeOffData
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding teacher time off:', error);
      return false;
    }
  }
}
