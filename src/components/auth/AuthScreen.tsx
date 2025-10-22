import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Eye, EyeOff, User, Mail, Lock, Phone, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSafeEmail, logEmailConfig } from '../../utils/emailUtils';
import { LogoSimple } from '../LogoSimple';
import { EducationService, EducationSystem, EducationLevel, Subject } from '../../services/educationService';
import { TeacherSignupForm } from '../teacher/TeacherSignupForm';
import { TeacherSignupService, TeacherSignupData } from '../../services/teacherSignupService';
import { StepByStepSignup } from './StepByStepSignup';

interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
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
  preferred_language?: string;
  preferred_curriculums?: string[];
  preferred_subjects?: string[];
  availability?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
  }>;
}

interface SignInData {
  email: string;
  password: string;
}

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTeacherSignup, setIsTeacherSignup] = useState(false);
  
  // Education data state
  const [educationSystems, setEducationSystems] = useState<EducationSystem[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingEducationData, setLoadingEducationData] = useState(false);

  const [signInData, setSignInData] = useState<SignInData>({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'student',
    phone: '',
    date_of_birth: '',
    location: '',
    bio: '',
    education_system_id: '',
    education_level_id: '',
    school_name: '',
    interests: [],
    preferred_language: 'en',
    preferred_subjects: [],
    max_children: 5,
    preferred_curriculums: [],
    availability: [],
  });

  // Load education data when component mounts
  useEffect(() => {
    loadEducationData();
  }, []);

  // Handle URL parameters for login/signup mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const screen = urlParams.get('screen');
    const mode = urlParams.get('mode');
    
    if (screen === 'login') {
      if (mode === 'signup') {
        setActiveTab('signup');
      } else {
        setActiveTab('signin');
      }
    }
  }, []);

  const loadEducationData = async () => {
    setLoadingEducationData(true);
    try {
      const [systems, subjectsData] = await Promise.all([
        EducationService.getEducationSystems(),
        EducationService.getSubjects()
      ]);
      setEducationSystems(systems);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading education data:', error);
    } finally {
      setLoadingEducationData(false);
    }
  };

  // Load education levels when system is selected
  const handleEducationSystemChange = async (systemId: string) => {
    setSignUpData({ ...signUpData, education_system_id: systemId, education_level_id: '' });
    if (systemId) {
      try {
        const levels = await EducationService.getEducationLevels(systemId);
        setEducationLevels(levels);
      } catch (error) {
        console.error('Error loading education levels:', error);
      }
    } else {
      setEducationLevels([]);
    }
  };

  const validateSignUp = (): string | null => {
    if (!signUpData.full_name.trim()) {
      return 'Full name is required';
    }
    if (!signUpData.email.trim()) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      return 'Please enter a valid email address';
    }
    if (signUpData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    // Role-specific validation
    if (signUpData.role === 'student') {
      if (!signUpData.education_system_id) {
        return 'Education system is required for students';
      }
      if (!signUpData.education_level_id) {
        return 'Education level is required for students';
      }
    }
    
    if (signUpData.role === 'teacher') {
      if (!signUpData.max_children || signUpData.max_children <= 0) {
        return 'Maximum number of children is required for teachers';
      }
    }
    
    return null;
  };

  const validateSignIn = (): string | null => {
    if (!signInData.email.trim()) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      return 'Please enter a valid email address';
    }
    if (!signInData.password.trim()) {
      return 'Password is required';
    }
    return null;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateSignIn();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(signInData.email, signInData.password);
      if (error) {
        setError(error.message || 'Failed to sign in');
      } else {
        setSuccess('Successfully signed in!');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateSignUp();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp({
        email: signUpData.email,
        password: signUpData.password,
        full_name: signUpData.full_name,
        role: signUpData.role,
        phone: signUpData.phone || undefined,
        date_of_birth: signUpData.date_of_birth || undefined,
        location: signUpData.location || undefined,
        bio: signUpData.bio || undefined,
        timezone: 'UTC',
        language: signUpData.preferred_language || 'en',
        currency: 'USD',
        // Student specific fields
        education_system_id: signUpData.education_system_id || undefined,
        education_level_id: signUpData.education_level_id || undefined,
        school_name: signUpData.school_name || undefined,
        interests: signUpData.interests || [],
        preferred_subjects: signUpData.preferred_subjects || [],
        // Teacher specific fields
        max_children: signUpData.max_children || 5,
        preferred_curriculums: signUpData.preferred_curriculums || [],
        availability: signUpData.availability || [],
      });

      if (error) {
        // Handle specific error cases with better user feedback
        if (error.code === 'EMAIL_ALREADY_EXISTS') {
          setError('An account with this email already exists. Please try signing in instead.');
          // Switch to sign in tab to help user
          setActiveTab('signin');
          // Pre-fill the email field
          setSignInData(prev => ({ ...prev, email: signUpData.email }));
        } else {
          setError(error.message || 'Failed to create account');
        }
      } else {
        setSuccess('Account created successfully! You are now logged in.');
        // Clear form
        setSignUpData({
          email: '',
          password: '',
          confirmPassword: '',
          full_name: '',
          role: 'student',
          phone: '',
          date_of_birth: '',
          location: '',
          bio: '',
          education_system_id: '',
          education_level_id: '',
          school_name: '',
          interests: [],
          preferred_language: 'en',
          preferred_subjects: [],
          max_children: 5,
          preferred_curriculums: [],
          availability: [],
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSignup = async (teacherData: TeacherSignupData) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // First create the basic auth user
      const authResult = await signUp({
        email: teacherData.email,
        password: 'temp_password', // This will be set properly in the auth flow
        full_name: teacherData.full_name,
        role: 'teacher'
      });

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Failed to create user account');
      }

      // Then create the comprehensive teacher profile
      const teacherResult = await TeacherSignupService.createTeacherProfile(
        authResult.user.id,
        teacherData
      );

      if (teacherResult.success) {
        setSuccess('Teacher profile created successfully! Please check your email to verify your account.');
        setIsTeacherSignup(false);
      } else {
        throw new Error(teacherResult.error || 'Failed to create teacher profile');
      }
    } catch (error) {
      console.error('Teacher signup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create teacher account');
    } finally {
      setLoading(false);
    }
  };

  const handleStepByStepSignup = async (data: any) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Create the basic auth user
      const { error: authError, user } = await signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone || undefined,
        date_of_birth: data.date_of_birth || undefined,
        location: data.location || undefined,
      });

      if (authError || !user) {
        setError(authError?.message || 'Failed to create account');
        return;
      }

      // Create role-specific records based on the database schema
      if (data.role === 'student') {
        // Create student record with education system and level
        const studentData = {
          id: user.id,
          grade_level: data.education_level_id ? 
            educationLevels.find(l => l.id === data.education_level_id)?.level_name : undefined,
          school_name: data.school_name || undefined,
          learning_goals: data.interests || [],
          interests: data.preferred_subjects || [],
          preferred_languages: [data.preferred_language || 'en'],
          education_system_id: data.education_system_id || undefined,
          education_level_id: data.education_level_id || undefined,
        };

        // Here you would call a service to create the student record
        // await StudentService.createStudent(studentData);
      } else if (data.role === 'teacher') {
        // Create teacher record with preferences
        const teacherData = {
          id: user.id,
          hourly_rate: 25.00, // Default rate
          currency: 'USD',
          subjects: data.preferred_subjects || [],
          specialties: [],
          education: [],
          experience_years: 0,
          max_students: data.max_children || 5,
          preferred_languages: [data.preferred_language || 'en'],
          timezone: 'UTC',
        };

        // Here you would call a service to create the teacher record
        // await TeacherService.createTeacher(teacherData);

        // Create teacher preferences
        const preferencesData = {
          teacher_id: user.id,
          preferred_student_ages: [],
          preferred_class_duration: 60,
          max_students_per_class: data.max_children || 5,
          auto_accept_bookings: false,
          require_student_approval: true,
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          marketing_emails: false,
          profile_visibility: 'public',
          show_contact_info: false,
          show_social_links: true,
          show_verification_badges: true,
          preferred_payment_method: 'stripe',
          auto_withdraw: false,
          withdraw_threshold: 100.00,
        };

        // await TeacherPreferencesService.createPreferences(preferencesData);
      } else if (data.role === 'parent') {
        // Create parent record
        const parentData = {
          id: user.id,
          children_ids: [],
          payment_methods: {},
          billing_address: null,
          emergency_contact: null,
        };

        // await ParentService.createParent(parentData);
      }

      setSuccess('Account created successfully! Please check your email to verify your account.');
      setActiveTab('signin');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'teacher' | 'parent') => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    // Log email configuration for debugging
    logEmailConfig();
    
    // Generate safe demo emails that won't cause bounces
    const demoCredentials = {
      student: { 
        email: getSafeEmail('student'), 
        password: 'Demo123!@#',
        full_name: 'Demo Student',
        role: 'student' as const,
        phone: '+1 (555) 123-4567',
        location: 'New York, NY'
      },
      teacher: { 
        email: getSafeEmail('teacher'), 
        password: 'Demo123!@#',
        full_name: 'Demo Teacher',
        role: 'teacher' as const,
        phone: '+1 (555) 234-5678',
        location: 'Los Angeles, CA'
      },
      parent: { 
        email: getSafeEmail('parent'), 
        password: 'Demo123!@#',
        full_name: 'Demo Parent',
        role: 'parent' as const,
        phone: '+1 (555) 345-6789',
        location: 'Chicago, IL'
      },
    };

    try {
      // First try to sign in
      const { error: signInError } = await signIn(demoCredentials[role].email, demoCredentials[role].password);
      
      if (signInError) {
        // If sign in fails, create the demo account
        console.log(`Creating demo ${role} account...`);
        const { error: signUpError } = await signUp(demoCredentials[role]);
        
        if (signUpError) {
          setError(`Failed to create demo ${role} account: ${signUpError.message}`);
        } else {
          setSuccess(`Demo ${role} account created successfully! You can now use the demo button to sign in.`);
        }
      } else {
        setSuccess(`Signed in as demo ${role}!`);
      }
    } catch (err: any) {
      setError(`Demo ${role} login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoSimple size="lg" showText={false} animated={true} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to SomaTogether.ai</h1>
          <p className="text-gray-600">Connect, Learn, and Grow Together</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or try demo accounts</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDemoLogin('student')}
                      disabled={loading}
                      className="text-xs"
                    >
                      Student
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDemoLogin('teacher')}
                      disabled={loading}
                      className="text-xs"
                    >
                      Teacher
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDemoLogin('parent')}
                      disabled={loading}
                      className="text-xs"
                    >
                      Parent
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Create Your Account</h3>
                    <p className="text-sm text-gray-600">Follow our guided signup process</p>
                  </div>
                  <StepByStepSignup
                    onSubmit={handleStepByStepSignup}
                    loading={loading}
                    error={error}
                    success={success}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}