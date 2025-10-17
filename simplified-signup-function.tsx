// =====================================================
// SIMPLIFIED SIGNUP FUNCTION - TRIGGER-BASED
// =====================================================
// Replace the signUp function in AuthContext.tsx with this version
// This version relies on the database trigger to create profiles

const signUp = async (userData: SignUpData) => {
  try {
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
      return { error };
    }

    if (!data.user) {
      console.error('No user data returned from signup');
      return { error: { message: 'No user data returned from signup' } };
    }

    console.log('User created successfully:', data.user.id);
    console.log('Database trigger will automatically create profile, wallet, and role-specific records');

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to fetch the profile to verify it was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile not found after signup:', profileError);
      // Don't fail signup, the trigger might still be processing
    } else {
      console.log('Profile created successfully by trigger:', profile);
    }

    return { error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { error };
  }
};
