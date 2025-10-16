import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Settings,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { EducationService, EducationSystem, EducationLevel, Subject } from '../../services/educationService';

interface StepByStepSignupData {
  // Basic info
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  phone?: string;
  date_of_birth?: string;
  location?: string;
  bio?: string;
  
  // Student specific
  education_system_id?: string;
  education_level_id?: string;
  school_name?: string;
  interests?: string[];
  preferred_language?: string;
  preferred_subjects?: string[];
  
  // Teacher specific
  max_children?: number;
  preferred_curriculums?: string[];
  availability?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    timezone: string;
  }>;
}

interface StepByStepSignupProps {
  onSubmit: (data: StepByStepSignupData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
}

const steps = [
  { id: 'role', title: 'Choose Role', description: 'Select your role on the platform' },
  { id: 'basic', title: 'Basic Info', description: 'Your personal information' },
  { id: 'education', title: 'Education', description: 'Educational background and preferences' },
  { id: 'preferences', title: 'Preferences', description: 'Your teaching/learning preferences' },
  { id: 'review', title: 'Review', description: 'Review and confirm your information' }
];

export function StepByStepSignup({ onSubmit, loading = false, error, success }: StepByStepSignupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Education data state
  const [educationSystems, setEducationSystems] = useState<EducationSystem[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingEducationData, setLoadingEducationData] = useState(false);

  const [formData, setFormData] = useState<StepByStepSignupData>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    availability: []
  });

  // Load education data when component mounts
  useEffect(() => {
    loadEducationData();
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
    setFormData({ ...formData, education_system_id: systemId, education_level_id: '' });
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

  const validateStep = (step: string): string | null => {
    switch (step) {
      case 'role':
        if (!formData.role) {
          return 'Please select a role';
        }
        return null;
      
      case 'basic':
        if (!formData.full_name.trim()) {
          return 'Full name is required';
        }
        if (!formData.email.trim()) {
          return 'Email is required';
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
          return 'Please enter a valid email address';
        }
        if (formData.password.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        if (formData.password !== formData.confirmPassword) {
          return 'Passwords do not match';
        }
        return null;
      
      case 'education':
        if (formData.role === 'student') {
          if (!formData.education_system_id) {
            return 'Education system is required for students';
          }
          if (!formData.education_level_id) {
            return 'Education level is required for students';
          }
        }
        return null;
      
      case 'preferences':
        if (formData.role === 'teacher') {
          if (!formData.max_children || formData.max_children <= 0) {
            return 'Maximum number of children is required for teachers';
          }
        }
        return null;
      
      default:
        return null;
    }
  };

  const handleNext = () => {
    const currentStepId = steps[currentStep].id;
    const validationError = validateStep(currentStepId);
    
    if (validationError) {
      // You could show this error in the UI
      console.error(validationError);
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const addSubject = (subjectId: string) => {
    if (subjectId && !formData.preferred_subjects?.includes(subjectId)) {
      setFormData({ 
        ...formData, 
        preferred_subjects: [...(formData.preferred_subjects || []), subjectId] 
      });
    }
  };

  const removeSubject = (subjectId: string) => {
    setFormData({ 
      ...formData, 
      preferred_subjects: formData.preferred_subjects?.filter(id => id !== subjectId) || []
    });
  };

  const addCurriculum = (curriculumId: string) => {
    if (curriculumId && !formData.preferred_curriculums?.includes(curriculumId)) {
      setFormData({ 
        ...formData, 
        preferred_curriculums: [...(formData.preferred_curriculums || []), curriculumId] 
      });
    }
  };

  const removeCurriculum = (curriculumId: string) => {
    setFormData({ 
      ...formData, 
      preferred_curriculums: formData.preferred_curriculums?.filter(id => id !== curriculumId) || []
    });
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'role':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
              <p className="text-gray-600">Select how you'll be using the platform</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  role: 'student',
                  title: 'Student',
                  description: 'Learn from qualified teachers and access educational resources',
                  icon: <BookOpen className="h-8 w-8" />,
                  bgColor: 'bg-blue-500',
                  hoverColor: 'hover:bg-blue-600',
                  borderColor: 'border-blue-500',
                  textColor: 'text-white',
                  selectedColor: 'ring-2 ring-blue-500 ring-offset-2'
                },
                {
                  role: 'teacher',
                  title: 'Teacher',
                  description: 'Teach students and earn money through our platform',
                  icon: <GraduationCap className="h-8 w-8" />,
                  bgColor: 'bg-green-500',
                  hoverColor: 'hover:bg-green-600',
                  borderColor: 'border-green-500',
                  textColor: 'text-white',
                  selectedColor: 'ring-2 ring-green-500 ring-offset-2'
                },
                {
                  role: 'parent',
                  title: 'Parent',
                  description: 'Monitor your child\'s progress and connect with teachers',
                  icon: <Users className="h-8 w-8" />,
                  bgColor: 'bg-purple-500',
                  hoverColor: 'hover:bg-purple-600',
                  borderColor: 'border-purple-500',
                  textColor: 'text-white',
                  selectedColor: 'ring-2 ring-purple-500 ring-offset-2'
                },
                {
                  role: 'admin',
                  title: 'Admin',
                  description: 'Manage platform users and system settings',
                  icon: <Settings className="h-8 w-8" />,
                  bgColor: 'bg-red-500',
                  hoverColor: 'hover:bg-red-600',
                  borderColor: 'border-red-500',
                  textColor: 'text-white',
                  selectedColor: 'ring-2 ring-red-500 ring-offset-2'
                }
              ].map(({ role, title, description, icon, bgColor, hoverColor, borderColor, textColor, selectedColor }) => (
                <Card
                  key={role}
                  className={`cursor-pointer transition-all duration-200 ${bgColor} ${hoverColor} ${textColor} ${
                    formData.role === role ? selectedColor : ''
                  } transform hover:scale-105 shadow-lg hover:shadow-xl`}
                  onClick={() => setFormData({ ...formData, role: role as any })}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      {icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-sm opacity-90">{description}</p>
                    {formData.role === role && (
                      <div className="mt-3">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-20 text-xs font-medium">
                          ✓ Selected
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-gray-600">Tell us about yourself</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="date_of_birth"
                    type="date"
                    className="pl-10"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, Country"
                    className="pl-10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  type="text"
                  placeholder="Tell us about yourself"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'education':
        if (formData.role === 'student') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Educational Background</h2>
                <p className="text-gray-600">Help us understand your educational needs</p>
              </div>
              
              {loadingEducationData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading education data...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="education_system">Education System *</Label>
                      <Select 
                        value={formData.education_system_id} 
                        onValueChange={handleEducationSystemChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select education system" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationSystems.map((system) => (
                            <SelectItem key={system.id} value={system.id}>
                              {system.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="education_level">Education Level *</Label>
                      <Select 
                        value={formData.education_level_id} 
                        onValueChange={(value) => setFormData({ ...formData, education_level_id: value })}
                        disabled={!formData.education_system_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.level_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="school_name">School Name</Label>
                    <Input
                      id="school_name"
                      type="text"
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      placeholder="Enter school name (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_language">Preferred Language</Label>
                    <Select 
                      value={formData.preferred_language} 
                      onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Subjects</Label>
                    <Select 
                      value="" 
                      onValueChange={addSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.preferred_subjects && formData.preferred_subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.preferred_subjects.map((subjectId) => {
                          const subject = subjects.find(s => s.id === subjectId);
                          return subject ? (
                            <Badge key={subjectId} variant="secondary" className="flex items-center gap-1">
                              {subject.name}
                              <button
                                type="button"
                                onClick={() => removeSubject(subjectId)}
                                className="ml-1 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        } else if (formData.role === 'teacher') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Teaching Information</h2>
                <p className="text-gray-600">Tell us about your teaching experience</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_children">Maximum Number of Children</Label>
                <Input
                  id="max_children"
                  type="number"
                  value={formData.max_children}
                  onChange={(e) => setFormData({ ...formData, max_children: parseInt(e.target.value) || 5 })}
                  placeholder="5"
                  min="1"
                  max="20"
                />
                <p className="text-xs text-gray-600">Maximum number of students you can handle at once</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_language">Preferred Language</Label>
                <Select 
                  value={formData.preferred_language} 
                  onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Curriculums</Label>
                <Select 
                  value="" 
                  onValueChange={addCurriculum}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a curriculum" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationSystems.map((system) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.preferred_curriculums && formData.preferred_curriculums.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferred_curriculums.map((systemId) => {
                      const system = educationSystems.find(s => s.id === systemId);
                      return system ? (
                        <Badge key={systemId} variant="secondary" className="flex items-center gap-1">
                          {system.name}
                          <button
                            type="button"
                            onClick={() => removeCurriculum(systemId)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Preferred Subjects</Label>
                <Select 
                  value="" 
                  onValueChange={addSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.preferred_subjects && formData.preferred_subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferred_subjects.map((subjectId) => {
                      const subject = subjects.find(s => s.id === subjectId);
                      return subject ? (
                        <Badge key={subjectId} variant="secondary" className="flex items-center gap-1">
                          {subject.name}
                          <button
                            type="button"
                            onClick={() => removeSubject(subjectId)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferences</h2>
              <p className="text-gray-600">Set your preferences for using the platform</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferred_language">Preferred Language</Label>
              <Select 
                value={formData.preferred_language} 
                onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Swahili</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Preferences</h2>
              <p className="text-gray-600">Review and adjust your preferences</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Account Summary</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Role:</strong> {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}</p>
                <p><strong>Name:</strong> {formData.full_name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                {formData.role === 'student' && formData.education_system_id && (
                  <p><strong>Education System:</strong> {educationSystems.find(s => s.id === formData.education_system_id)?.name}</p>
                )}
                {formData.role === 'teacher' && (
                  <p><strong>Max Students:</strong> {formData.max_children}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Information</h2>
              <p className="text-gray-600">Please review your information before creating your account</p>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{formData.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <Badge variant="secondary">{formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}</Badge>
                  </div>
                  {formData.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                  )}
                  {formData.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{formData.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {formData.role === 'student' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Educational Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {formData.education_system_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Education System:</span>
                        <span className="font-medium">
                          {educationSystems.find(s => s.id === formData.education_system_id)?.name}
                        </span>
                      </div>
                    )}
                    {formData.education_level_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Education Level:</span>
                        <span className="font-medium">
                          {educationLevels.find(l => l.id === formData.education_level_id)?.level_name}
                        </span>
                      </div>
                    )}
                    {formData.school_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">School:</span>
                        <span className="font-medium">{formData.school_name}</span>
                      </div>
                    )}
                    {formData.preferred_subjects && formData.preferred_subjects.length > 0 && (
                      <div>
                        <span className="text-gray-600">Preferred Subjects:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.preferred_subjects.map((subjectId) => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return subject ? (
                              <Badge key={subjectId} variant="outline" className="text-xs">
                                {subject.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {formData.role === 'teacher' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Teaching Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Students:</span>
                      <span className="font-medium">{formData.max_children}</span>
                    </div>
                    {formData.preferred_curriculums && formData.preferred_curriculums.length > 0 && (
                      <div>
                        <span className="text-gray-600">Preferred Curriculums:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.preferred_curriculums.map((systemId) => {
                            const system = educationSystems.find(s => s.id === systemId);
                            return system ? (
                              <Badge key={systemId} variant="outline" className="text-xs">
                                {system.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {formData.preferred_subjects && formData.preferred_subjects.length > 0 && (
                      <div>
                        <span className="text-gray-600">Preferred Subjects:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.preferred_subjects.map((subjectId) => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return subject ? (
                              <Badge key={subjectId} variant="outline" className="text-xs">
                                {subject.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
        
        <Progress value={(currentStep + 1) / steps.length * 100} className="mb-4" />
        
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center text-center ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  index < currentStep
                    ? 'bg-blue-600 text-white'
                    : index === currentStep
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="text-xs font-medium">{step.title}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}
            
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
