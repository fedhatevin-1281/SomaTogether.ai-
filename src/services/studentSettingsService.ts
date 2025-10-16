import { supabase } from '../supabaseClient';

export interface StudentSettingsData {
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    timezone: string;
    language: string;
    date_of_birth?: string;
  };
  student: {
    grade_level?: string;
    school_name?: string;
    learning_goals: string[];
    interests: string[];
    preferred_languages: string[];
    learning_style?: string;
    education_system_id?: string;
    education_level_id?: string;
  };
  preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    class_reminders: boolean;
    assignment_due_reminders: boolean;
    teacher_messages: boolean;
    weekly_progress_reports: boolean;
    marketing_emails: boolean;
    profile_visibility: string;
    show_online_status: boolean;
    allow_teacher_contact: boolean;
    share_progress_with_parents: boolean;
  };
}

export class StudentSettingsService {
  /**
   * Get student settings data
   */
  static async getStudentSettings(studentId: string): Promise<StudentSettingsData> {
    try {
      console.log('Fetching student settings for:', studentId);

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // Get student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('Error fetching student data:', studentError);
        throw studentError;
      }

      // Get or create student preferences
      let { data: preferences, error: preferencesError } = await supabase
        .from('student_preferences')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.error('Error fetching student preferences:', preferencesError);
        throw preferencesError;
      }

      // If no preferences exist, create default ones
      if (!preferences) {
        const { data: newPreferences, error: createError } = await supabase
          .from('student_preferences')
          .insert({
            student_id: studentId,
            email_notifications: true,
            sms_notifications: false,
            push_notifications: true,
            class_reminders: true,
            assignment_due_reminders: true,
            teacher_messages: true,
            weekly_progress_reports: false,
            marketing_emails: false,
            profile_visibility: 'public',
            show_online_status: true,
            allow_teacher_contact: true,
            share_progress_with_parents: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating student preferences:', createError);
          throw createError;
        }

        preferences = newPreferences;
      }

      const settingsData: StudentSettingsData = {
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          location: profile.location,
          timezone: profile.timezone || 'UTC',
          language: profile.language || 'en',
          date_of_birth: profile.date_of_birth
        },
        student: {
          grade_level: student.grade_level,
          school_name: student.school_name,
          learning_goals: student.learning_goals || [],
          interests: student.interests || [],
          preferred_languages: student.preferred_languages || ['en'],
          learning_style: student.learning_style,
          education_system_id: student.education_system_id,
          education_level_id: student.education_level_id
        },
        preferences: {
          email_notifications: preferences.email_notifications,
          sms_notifications: preferences.sms_notifications,
          push_notifications: preferences.push_notifications,
          class_reminders: preferences.class_reminders,
          assignment_due_reminders: preferences.assignment_due_reminders,
          teacher_messages: preferences.teacher_messages,
          weekly_progress_reports: preferences.weekly_progress_reports,
          marketing_emails: preferences.marketing_emails,
          profile_visibility: preferences.profile_visibility,
          show_online_status: preferences.show_online_status,
          allow_teacher_contact: preferences.allow_teacher_contact,
          share_progress_with_parents: preferences.share_progress_with_parents
        }
      };

      console.log('Student settings data:', settingsData);
      return settingsData;

    } catch (error) {
      console.error('Error fetching student settings:', error);
      throw error;
    }
  }

  /**
   * Update student profile
   */
  static async updateStudentProfile(studentId: string, profileData: Partial<StudentSettingsData['profile']>): Promise<void> {
    try {
      console.log('Updating student profile:', profileData);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          bio: profileData.bio,
          location: profileData.location,
          timezone: profileData.timezone,
          language: profileData.language,
          date_of_birth: profileData.date_of_birth,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating student profile:', error);
      throw error;
    }
  }

  /**
   * Update student data
   */
  static async updateStudentData(studentId: string, studentData: Partial<StudentSettingsData['student']>): Promise<void> {
    try {
      console.log('Updating student data:', studentData);

      const { error } = await supabase
        .from('students')
        .update({
          grade_level: studentData.grade_level,
          school_name: studentData.school_name,
          learning_goals: studentData.learning_goals,
          interests: studentData.interests,
          preferred_languages: studentData.preferred_languages,
          learning_style: studentData.learning_style,
          education_system_id: studentData.education_system_id,
          education_level_id: studentData.education_level_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        console.error('Error updating student data:', error);
        throw error;
      }

      console.log('Student data updated successfully');
    } catch (error) {
      console.error('Error updating student data:', error);
      throw error;
    }
  }

  /**
   * Update student preferences
   */
  static async updateStudentPreferences(studentId: string, preferencesData: Partial<StudentSettingsData['preferences']>): Promise<void> {
    try {
      console.log('Updating student preferences:', preferencesData);

      const { error } = await supabase
        .from('student_preferences')
        .update({
          email_notifications: preferencesData.email_notifications,
          sms_notifications: preferencesData.sms_notifications,
          push_notifications: preferencesData.push_notifications,
          class_reminders: preferencesData.class_reminders,
          assignment_due_reminders: preferencesData.assignment_due_reminders,
          teacher_messages: preferencesData.teacher_messages,
          weekly_progress_reports: preferencesData.weekly_progress_reports,
          marketing_emails: preferencesData.marketing_emails,
          profile_visibility: preferencesData.profile_visibility,
          show_online_status: preferencesData.show_online_status,
          allow_teacher_contact: preferencesData.allow_teacher_contact,
          share_progress_with_parents: preferencesData.share_progress_with_parents,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId);

      if (error) {
        console.error('Error updating student preferences:', error);
        throw error;
      }

      console.log('Student preferences updated successfully');
    } catch (error) {
      console.error('Error updating student preferences:', error);
      throw error;
    }
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(studentId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log('Uploading profile image for student:', studentId);

      // Validate file
      if (!file || file.size === 0) {
        return { success: false, error: 'No file provided' };
      }

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { success: false, error: 'File size exceeds 5MB limit' };
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'File type not allowed. Only images are accepted.' };
      }

      // Create file name with timestamp to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${studentId}/profile/${timestamp}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

      // First, try to ensure the bucket exists
      await this.ensureStorageBucketExists('student-documents');

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // If bucket doesn't exist, provide helpful error message
        if (uploadError.message?.includes('Bucket not found')) {
          return {
            success: false,
            error: 'Storage bucket not configured. Please contact support or check the setup-storage-buckets.sql file.'
          };
        }
        
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (updateError) {
        console.error('Error updating profile with new avatar URL:', updateError);
        // Try to clean up the uploaded file
        try {
          await supabase.storage
            .from('student-documents')
            .remove([fileName]);
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError);
        }
        throw updateError;
      }

      console.log('Profile image updated successfully:', publicUrl);

      return {
        success: true,
        url: publicUrl
      };
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Ensure storage bucket exists
   */
  private static async ensureStorageBucketExists(bucketName: string): Promise<void> {
    try {
      // Try to list the bucket to check if it exists
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking buckets:', error);
        return;
      }

      const bucketExists = data?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.warn(`Storage bucket '${bucketName}' does not exist. Please run the setup-storage-buckets.sql script.`);
        // Note: We can't create buckets from the client side due to security restrictions
        // The bucket needs to be created via Supabase Dashboard or CLI
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }
}

export default StudentSettingsService;
