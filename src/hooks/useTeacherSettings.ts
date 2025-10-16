import { useState, useEffect, useCallback } from 'react';
import { TeacherSettingsService, TeacherProfile, TeacherPreferences, TeacherSubject, TeacherSkill, DashboardData } from '../services/teacherSettingsService';

export interface UseTeacherSettingsReturn {
  // Data
  profile: TeacherProfile | null;
  preferences: TeacherPreferences | null;
  subjects: TeacherSubject[];
  skills: TeacherSkill[];
  dashboardData: DashboardData | null;
  
  // Loading states
  loading: {
    profile: boolean;
    preferences: boolean;
    subjects: boolean;
    skills: boolean;
    dashboard: boolean;
    overall: boolean;
  };
  
  // Error states
  errors: {
    profile: string | null;
    preferences: string | null;
    subjects: string | null;
    skills: string | null;
    dashboard: string | null;
  };
  
  // Actions
  loadProfile: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  loadSubjects: () => Promise<void>;
  loadSkills: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadAll: () => Promise<void>;
  
  // Profile actions
  updateProfile: (profileData: Partial<TeacherProfile>) => Promise<boolean>;
  uploadDocument: (file: File, documentType: string) => Promise<{ success: boolean; error?: string; document_id?: string }>;
  
  // Preferences actions
  updatePreferences: (preferencesData: Partial<TeacherPreferences>) => Promise<boolean>;
  
  // Subjects actions
  addSubject: (subjectId: string, proficiencyLevel?: string, yearsExperience?: number, isPrimary?: boolean) => Promise<boolean>;
  updateSubject: (subjectId: string, updates: Partial<TeacherSubject>) => Promise<boolean>;
  removeSubject: (subjectId: string) => Promise<boolean>;
  
  // Skills actions
  addSkill: (skillData: Omit<TeacherSkill, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateSkill: (skillId: string, updates: Partial<TeacherSkill>) => Promise<boolean>;
  removeSkill: (skillId: string) => Promise<boolean>;
  
  // Availability actions
  updateAvailability: (isAvailable: boolean) => Promise<boolean>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  clearErrors: () => void;
}

export function useTeacherSettings(teacherId: string): UseTeacherSettingsReturn {
  // Data state
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [preferences, setPreferences] = useState<TeacherPreferences | null>(null);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [skills, setSkills] = useState<TeacherSkill[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState({
    profile: false,
    preferences: false,
    subjects: false,
    skills: false,
    dashboard: false,
    overall: false
  });
  
  // Error states
  const [errors, setErrors] = useState({
    profile: null as string | null,
    preferences: null as string | null,
    subjects: null as string | null,
    skills: null as string | null,
    dashboard: null as string | null
  });

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, profile: true }));
    setErrors(prev => ({ ...prev, profile: null }));
    
    try {
      const profileData = await TeacherSettingsService.getTeacherProfile(teacherId);
      setProfile(profileData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setErrors(prev => ({ ...prev, profile: errorMessage }));
      console.error('Error loading profile:', error);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, [teacherId]);

  // Load preferences data
  const loadPreferences = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, preferences: true }));
    setErrors(prev => ({ ...prev, preferences: null }));
    
    try {
      const preferencesData = await TeacherSettingsService.getTeacherPreferences(teacherId);
      setPreferences(preferencesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load preferences';
      setErrors(prev => ({ ...prev, preferences: errorMessage }));
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(prev => ({ ...prev, preferences: false }));
    }
  }, [teacherId]);

  // Load subjects data
  const loadSubjects = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, subjects: true }));
    setErrors(prev => ({ ...prev, subjects: null }));
    
    try {
      const subjectsData = await TeacherSettingsService.getTeacherSubjects(teacherId);
      setSubjects(subjectsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load subjects';
      setErrors(prev => ({ ...prev, subjects: errorMessage }));
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(prev => ({ ...prev, subjects: false }));
    }
  }, [teacherId]);

  // Load skills data
  const loadSkills = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, skills: true }));
    setErrors(prev => ({ ...prev, skills: null }));
    
    try {
      const skillsData = await TeacherSettingsService.getTeacherSkills(teacherId);
      setSkills(skillsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load skills';
      setErrors(prev => ({ ...prev, skills: errorMessage }));
      console.error('Error loading skills:', error);
    } finally {
      setLoading(prev => ({ ...prev, skills: false }));
    }
  }, [teacherId]);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, dashboard: true }));
    setErrors(prev => ({ ...prev, dashboard: null }));
    
    try {
      const dashboardData = await TeacherSettingsService.getDashboardData(teacherId);
      setDashboardData(dashboardData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setErrors(prev => ({ ...prev, dashboard: errorMessage }));
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [teacherId]);

  // Load all data
  const loadAll = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, overall: true }));
    
    try {
      await Promise.all([
        loadProfile(),
        loadPreferences(),
        loadSubjects(),
        loadSkills(),
        loadDashboard()
      ]);
    } catch (error) {
      console.error('Error loading all data:', error);
    } finally {
      setLoading(prev => ({ ...prev, overall: false }));
    }
  }, [teacherId, loadProfile, loadPreferences, loadSubjects, loadSkills, loadDashboard]);

  // Update profile
  const updateProfile = useCallback(async (profileData: Partial<TeacherProfile>): Promise<boolean> => {
    if (!teacherId) return false;
    
    try {
      const success = await TeacherSettingsService.updateTeacherProfile(teacherId, profileData);
      if (success) {
        await loadProfile(); // Refresh profile data
      }
      return success;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }, [teacherId, loadProfile]);

  // Upload document
  const uploadDocument = useCallback(async (
    file: File, 
    documentType: string
  ): Promise<{ success: boolean; error?: string; document_id?: string }> => {
    if (!teacherId) return { success: false, error: 'No teacher ID' };
    
    try {
      const result = await TeacherSettingsService.uploadDocument(teacherId, file, documentType as any);
      if (result.success) {
        await loadProfile(); // Refresh profile data to get updated image URLs
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      return { success: false, error: errorMessage };
    }
  }, [teacherId, loadProfile]);

  // Update preferences
  const updatePreferences = useCallback(async (preferencesData: Partial<TeacherPreferences>): Promise<boolean> => {
    if (!teacherId) return false;
    
    try {
      const success = await TeacherSettingsService.updateTeacherPreferences(teacherId, preferencesData);
      if (success) {
        await loadPreferences(); // Refresh preferences data
      }
      return success;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }, [teacherId, loadPreferences]);

  // Add subject
  const addSubject = useCallback(async (
    subjectId: string,
    proficiencyLevel: string = 'intermediate',
    yearsExperience: number = 0,
    isPrimary: boolean = false
  ): Promise<boolean> => {
    if (!teacherId) return false;
    
    try {
      const success = await TeacherSettingsService.addTeacherSubject(
        teacherId,
        subjectId,
        proficiencyLevel as any,
        yearsExperience,
        isPrimary
      );
      if (success) {
        await loadSubjects(); // Refresh subjects data
      }
      return success;
    } catch (error) {
      console.error('Error adding subject:', error);
      return false;
    }
  }, [teacherId, loadSubjects]);

  // Update subject
  const updateSubject = useCallback(async (
    subjectId: string,
    updates: Partial<TeacherSubject>
  ): Promise<boolean> => {
    try {
      const success = await TeacherSettingsService.updateTeacherSubject(subjectId, updates);
      if (success) {
        await loadSubjects(); // Refresh subjects data
      }
      return success;
    } catch (error) {
      console.error('Error updating subject:', error);
      return false;
    }
  }, [loadSubjects]);

  // Remove subject
  const removeSubject = useCallback(async (subjectId: string): Promise<boolean> => {
    try {
      const success = await TeacherSettingsService.removeTeacherSubject(subjectId);
      if (success) {
        await loadSubjects(); // Refresh subjects data
      }
      return success;
    } catch (error) {
      console.error('Error removing subject:', error);
      return false;
    }
  }, [loadSubjects]);

  // Add skill
  const addSkill = useCallback(async (
    skillData: Omit<TeacherSkill, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    if (!teacherId) return false;
    
    try {
      const success = await TeacherSettingsService.addTeacherSkill(teacherId, skillData);
      if (success) {
        await loadSkills(); // Refresh skills data
      }
      return success;
    } catch (error) {
      console.error('Error adding skill:', error);
      return false;
    }
  }, [teacherId, loadSkills]);

  // Update skill
  const updateSkill = useCallback(async (
    skillId: string,
    updates: Partial<TeacherSkill>
  ): Promise<boolean> => {
    try {
      const success = await TeacherSettingsService.updateTeacherSkill(skillId, updates);
      if (success) {
        await loadSkills(); // Refresh skills data
      }
      return success;
    } catch (error) {
      console.error('Error updating skill:', error);
      return false;
    }
  }, [loadSkills]);

  // Remove skill
  const removeSkill = useCallback(async (skillId: string): Promise<boolean> => {
    try {
      const success = await TeacherSettingsService.removeTeacherSkill(skillId);
      if (success) {
        await loadSkills(); // Refresh skills data
      }
      return success;
    } catch (error) {
      console.error('Error removing skill:', error);
      return false;
    }
  }, [loadSkills]);

  // Update availability
  const updateAvailability = useCallback(async (isAvailable: boolean): Promise<boolean> => {
    if (!teacherId) return false;
    
    try {
      const success = await TeacherSettingsService.updateAvailability(teacherId, isAvailable);
      if (success) {
        await loadProfile(); // Refresh profile data
      }
      return success;
    } catch (error) {
      console.error('Error updating availability:', error);
      return false;
    }
  }, [teacherId, loadProfile]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({
      profile: null,
      preferences: null,
      subjects: null,
      skills: null,
      dashboard: null
    });
  }, []);

  // Load data on mount
  useEffect(() => {
    if (teacherId) {
      loadAll();
    }
  }, [teacherId, loadAll]);

  return {
    // Data
    profile,
    preferences,
    subjects,
    skills,
    dashboardData,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Actions
    loadProfile,
    loadPreferences,
    loadSubjects,
    loadSkills,
    loadDashboard,
    loadAll,
    
    // Profile actions
    updateProfile,
    uploadDocument,
    
    // Preferences actions
    updatePreferences,
    
    // Subjects actions
    addSubject,
    updateSubject,
    removeSubject,
    
    // Skills actions
    addSkill,
    updateSkill,
    removeSkill,
    
    // Availability actions
    updateAvailability,
    
    // Utility functions
    refreshData,
    clearErrors
  };
}
