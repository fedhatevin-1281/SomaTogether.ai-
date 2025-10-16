import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { shouldSkipEmailVerification } from '../utils/emailUtils';
import { EducationService } from '../services/educationService';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  avatar_url?: string;
  phone?: string;
  bio?: string;
  date_of_birth?: string;
  location?: string;
  timezone: string;
  language: string;
  is_verified: boolean;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (userData: SignUpData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  confirmPassword?: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  phone?: string;
  date_of_birth?: string;
  location?: string;
  bio?: string;
  // Student specific fields
  education_system_id?: string;
  education_level_id?: string;
  school_name?: string;
  interests?: string[];
  preferred_language?: string;
  preferred_subjects?: string[];
  // Teacher specific fields
  max_children?: number;
  preferred_curriculums?: string[];
  availability?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          // If there's an existing session, use it
          setSession(existingSession);
          setUser(existingSession.user);
          await fetchUserProfile(existingSession.user.id);
        } else {
          // No existing session, user needs to login
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Force logout when user closes browser/tab
    const handleBeforeUnload = () => {
      supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: userData.user.email || '',
                full_name: userData.user.user_metadata?.full_name || 'User',
                role: userData.user.user_metadata?.role || 'student',
                timezone: 'UTC',
                language: 'en',
                is_verified: false,
                is_active: true,
              });

            if (createError) {
              console.error('Error creating profile:', createError);
            } else {
              // Fetch the newly created profile
              const { data: newProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
              setProfile(newProfile);
            }
          }
        }
        setLoading(false);
        return;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: SignUpData) => {
    try {
      const signUpOptions: any = {
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
          },
        },
      };

      // Skip email verification in development mode to prevent bounces
      if (shouldSkipEmailVerification()) {
        console.log('🔧 Development mode: Skipping email verification to prevent bounces');
        signUpOptions.options.emailRedirectTo = undefined;
      }

      console.log('Attempting signup with options:', signUpOptions);
      const { data, error } = await supabase.auth.signUp(signUpOptions);

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      if (!data.user) {
        console.error('No user data returned from signup');
        return { error: { message: 'No user data returned from signup' } };
      }

      // Create the profile first (no trigger exists)
      console.log('Creating profile for user:', data.user.id);
      
      const profileData = {
        id: data.user.id,
        email: data.user.email!,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        date_of_birth: userData.date_of_birth,
        location: userData.location,
        bio: userData.bio,
        timezone: userData.timezone || 'UTC',
        language: userData.language || 'en',
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't return error here, continue with user creation
      } else {
        console.log('Profile created successfully');
      }

      // Create wallet for the user
      const walletData = {
        user_id: data.user.id,
        balance: 0.00,
        currency: 'USD',
        tokens: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating wallet for user:', data.user.id);
      const { error: walletError } = await supabase
        .from('wallets')
        .insert(walletData);

      if (walletError) {
        console.error('Error creating wallet:', walletError);
        // Don't fail signup for wallet creation error
      } else {
        console.log('Wallet created successfully');
      }

      // Create role-specific records
      if (userData.role === 'student') {
        // Create student record
        const studentData = {
          id: data.user.id,
          education_system_id: userData.education_system_id,
          education_level_id: userData.education_level_id,
          school_name: userData.school_name,
          interests: userData.interests || [],
          preferred_languages: userData.preferred_language ? [userData.preferred_language] : ['en'],
        };

        console.log('Creating student record:', studentData);
        const { error: studentError } = await supabase
          .from('students')
          .insert(studentData);

        if (studentError) {
          console.error('Error creating student record:', studentError);
        } else {
          console.log('Student record created successfully');
        }

        // Create onboarding response
        const onboardingData = {
          user_id: data.user.id,
          system_id: userData.education_system_id,
          level_id: userData.education_level_id,
          interests: userData.interests || [],
          preferred_language: userData.preferred_language || 'en',
        };

        const { success: onboardingSuccess, response: onboardingResponse } = await EducationService.createOnboardingResponse(onboardingData);

        if (onboardingSuccess && onboardingResponse && userData.preferred_subjects && userData.preferred_subjects.length > 0) {
          // Add preferred subjects
          const { success: subjectsSuccess } = await EducationService.addPreferredSubjects(onboardingResponse.id, userData.preferred_subjects);

          if (!subjectsSuccess) {
            console.error('Error adding preferred subjects');
          }
        }
      } else if (userData.role === 'teacher') {
        // Create teacher record
        const teacherData = {
          id: data.user.id,
          is_available: true,
        };

        console.log('Creating teacher record:', teacherData);
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert(teacherData);

        if (teacherError) {
          console.error('Error creating teacher record:', teacherError);
        } else {
          console.log('Teacher record created successfully');
        }

        // Create teacher onboarding response
        const teacherOnboardingData = {
          teacher_id: data.user.id,
          max_children: userData.max_children || 5,
          preferred_language: userData.preferred_language || 'en',
        };

        const { success: teacherOnboardingSuccess, response: teacherOnboardingResponse } = await EducationService.createTeacherOnboardingResponse(teacherOnboardingData);

        if (teacherOnboardingSuccess && teacherOnboardingResponse) {
          // Add preferred curriculums
          if (userData.preferred_curriculums && userData.preferred_curriculums.length > 0) {
            const { success: curriculumsSuccess } = await EducationService.addPreferredCurriculums(teacherOnboardingResponse.id, userData.preferred_curriculums);

            if (!curriculumsSuccess) {
              console.error('Error adding preferred curriculums');
            }
          }

          // Add preferred subjects
          if (userData.preferred_subjects && userData.preferred_subjects.length > 0) {
            const { success: subjectsSuccess } = await EducationService.addTeacherPreferredSubjects(teacherOnboardingResponse.id, userData.preferred_subjects);

            if (!subjectsSuccess) {
              console.error('Error adding preferred subjects');
            }
          }

          // Add availability (if provided)
          if (userData.availability && userData.availability.length > 0) {
            const { success: availabilitySuccess } = await EducationService.addTeacherAvailability(teacherOnboardingResponse.id, userData.availability);

            if (!availabilitySuccess) {
              console.error('Error adding teacher availability');
            }
          }
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      // Update last login time
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', currentUser.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Clear any stored session data
      localStorage.clear();
      sessionStorage.clear();
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: { message: 'No user logged in' } };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) return { error };

      // Refresh profile data
      await fetchUserProfile(user.id);
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
