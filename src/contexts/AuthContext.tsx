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
      // First, check if user already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', userData.email)
        .single();

      if (existingProfile && !checkError) {
        console.log('User with this email already exists:', existingProfile.email);
        return { 
          error: { 
            message: 'An account with this email already exists. Please try signing in instead.',
            code: 'EMAIL_ALREADY_EXISTS'
          } 
        };
      }

      const signUpOptions: any = {
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
            phone: userData.phone,
            date_of_birth: userData.date_of_birth,
            location: userData.location,
            bio: userData.bio,
            timezone: userData.timezone || 'UTC',
            language: userData.language || 'en',
            // Student specific fields
            education_system_id: userData.education_system_id,
            education_level_id: userData.education_level_id,
            school_name: userData.school_name,
            interests: userData.interests,
            preferred_language: userData.preferred_language,
            preferred_subjects: userData.preferred_subjects,
            // Teacher specific fields
            max_children: userData.max_children,
            preferred_curriculums: userData.preferred_curriculums,
            availability: userData.availability,
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
        // Handle specific error cases
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          return { 
            error: { 
              message: 'An account with this email already exists. Please try signing in instead.',
              code: 'EMAIL_ALREADY_EXISTS'
            } 
          };
        }
        return { error };
      }

      if (!data.user) {
        console.error('No user data returned from signup');
        return { error: { message: 'No user data returned from signup' } };
      }

      console.log('User created successfully:', data.user.id);
      console.log('Database trigger will automatically create profile, wallet, and role-specific records');

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to fetch the profile to verify it was created by the trigger
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile not found after signup:', profileError);
        // If profile creation failed due to duplicate email constraint, handle gracefully
        if (profileError.code === '23505' && profileError.message?.includes('email')) {
          console.log('Profile creation failed due to duplicate email - user may already exist');
          return { 
            error: { 
              message: 'An account with this email already exists. Please try signing in instead.',
              code: 'EMAIL_ALREADY_EXISTS'
            } 
          };
        }
        console.log('This might be normal if the trigger is still processing');
      } else {
        console.log('Profile created successfully by trigger:', profile);
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
