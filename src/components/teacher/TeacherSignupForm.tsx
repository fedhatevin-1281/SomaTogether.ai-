import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  User, 
  GraduationCap, 
  DollarSign, 
  Clock, 
  Globe, 
  Award, 
  Languages, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  Plus,
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { EducationService, EducationSystem, EducationLevel, Subject } from '../../services/educationService';

interface TeacherSignupData {
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
  education_system_id?: string;
  education_level_id?: string;

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

interface TeacherSignupFormProps {
  onSubmit: (data: TeacherSignupData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
}

export function TeacherSignupForm({ onSubmit, loading = false, error, success }: TeacherSignupFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  
  // Education data state
  const [educationSystems, setEducationSystems] = useState<EducationSystem[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingEducationData, setLoadingEducationData] = useState(false);
  
  const [formData, setFormData] = useState<TeacherSignupData>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    location: '',
    bio: '',
    timezone: 'Africa/Nairobi',
    language: 'en',
    hourly_rate: 25,
    currency: 'KES',
    subjects: [],
    specialties: [],
    education: [],
    experience_years: 0,
    teaching_philosophy: '',
    languages: ['en'],
    social_links: {},
    tsc_number: '',
    education_system_id: '',
    education_level_id: '',
    preferred_student_ages: [],
    preferred_class_duration: 60,
    max_students_per_class: 1,
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
    withdraw_threshold: 100,
    skills: [],
    teacher_subjects: [],
    availability: []
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_category: '',
    proficiency_level: 'intermediate' as const,
    years_experience: 0,
    is_certified: false,
    certification_body: '',
    certification_date: ''
  });

  // Load education data when component mounts
  useEffect(() => {
    loadEducationData();
  }, []);

  const loadEducationData = async () => {
    setLoadingEducationData(true);
    try {
      console.log('Loading education data...');
      const [systems, subjectsData] = await Promise.all([
        EducationService.getEducationSystems(),
        EducationService.getSubjects()
      ]);
      console.log('Education systems loaded:', systems);
      console.log('Subjects loaded:', subjectsData);
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

  // Dropdown options
  const timezoneOptions = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Africa/Nairobi', label: 'Nairobi (EAT - East Africa Time)' },
    { value: 'Africa/Lagos', label: 'Lagos (WAT - West Africa Time)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST - South Africa Time)' },
    { value: 'Africa/Cairo', label: 'Cairo (EET - Eastern European Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'Mumbai/New Delhi (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'sw', label: 'Kiswahili (Swahili)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'am', label: 'አማርኛ (Amharic)' },
    { value: 'ha', label: 'Hausa' },
    { value: 'yo', label: 'Yoruba' },
    { value: 'ig', label: 'Igbo' },
    { value: 'zu', label: 'IsiZulu' },
    { value: 'xh', label: 'IsiXhosa' },
    { value: 'af', label: 'Afrikaans' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'it', label: 'Italiano (Italian)' },
    { value: 'pt', label: 'Português (Portuguese)' },
    { value: 'ru', label: 'Русский (Russian)' },
    { value: 'zh', label: '中文 (Chinese)' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'ko', label: '한국어 (Korean)' },
    { value: 'hi', label: 'हिन्दी (Hindi)' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'KES', label: 'KES - Kenyan Shilling' },
    { value: 'NGN', label: 'NGN - Nigerian Naira' },
    { value: 'ZAR', label: 'ZAR - South African Rand' },
    { value: 'EGP', label: 'EGP - Egyptian Pound' }
  ];

  const studentAgeOptions = [
    { value: '3-5', label: '3-5 years (Preschool)' },
    { value: '6-8', label: '6-8 years (Early Elementary)' },
    { value: '9-11', label: '9-11 years (Elementary)' },
    { value: '12-14', label: '12-14 years (Middle School)' },
    { value: '15-17', label: '15-17 years (High School)' },
    { value: '18+', label: '18+ years (Adult)' }
  ];

  const proficiencyLevelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  const dayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  // Helper functions
  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty.trim()]
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    });
  };

  const addEducation = () => {
    if (newEducation.trim() && !formData.education.includes(newEducation.trim())) {
      setFormData({
        ...formData,
        education: [...formData.education, newEducation.trim()]
      });
      setNewEducation('');
    }
  };

  const removeEducation = (education: string) => {
    setFormData({
      ...formData,
      education: formData.education.filter(e => e !== education)
    });
  };

  const addLanguage = () => {
    if (newLanguage && !formData.languages.includes(newLanguage)) {
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage]
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(l => l !== language)
    });
  };

  const addSkill = () => {
    if (newSkill.skill_name.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { ...newSkill }]
      });
      setNewSkill({
        skill_name: '',
        skill_category: '',
        proficiency_level: 'intermediate',
        years_experience: 0,
        is_certified: false,
        certification_body: '',
        certification_date: ''
      });
    }
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  const addAvailabilitySlot = () => {
    setFormData({
      ...formData,
      availability: [
        ...formData.availability,
        {
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00',
          timezone: formData.timezone,
          is_active: true,
          max_students_per_slot: 1,
          buffer_minutes: 15
        }
      ]
    });
  };

  const updateAvailabilitySlot = (index: number, updates: Partial<typeof formData.availability[0]>) => {
    const newAvailability = [...formData.availability];
    newAvailability[index] = { ...newAvailability[index], ...updates };
    setFormData({
      ...formData,
      availability: newAvailability
    });
  };

  const removeAvailabilitySlot = (index: number) => {
    setFormData({
      ...formData,
      availability: formData.availability.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Complete Your Teacher Profile</h1>
        <p className="text-gray-600 mt-2">
          Fill out your information to start teaching on our platform
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="teaching">Teaching</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Your personal and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tsc_number">TSC Number (if applicable)</Label>
                    <Input
                      id="tsc_number"
                      value={formData.tsc_number}
                      onChange={(e) => setFormData({ ...formData, tsc_number: e.target.value })}
                      placeholder="Teacher Service Commission number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself and your teaching experience"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Primary Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData({ ...formData, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teaching" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Teaching Information
                </CardTitle>
                <CardDescription>
                  Your teaching experience and qualifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="education_system">Education System</Label>
                    <Select
                      value={formData.education_system_id || ''}
                      onValueChange={(value) => {
                        setFormData({ ...formData, education_system_id: value, education_level_id: '' });
                        if (value) {
                          handleEducationSystemChange(value);
                        }
                      }}
                      disabled={loadingEducationData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingEducationData ? "Loading systems..." : "Select education system"} />
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

                  <div>
                    <Label htmlFor="education_level">Education Level</Label>
                    <Select
                      value={formData.education_level_id || ''}
                      onValueChange={(value) => setFormData({ ...formData, education_level_id: value })}
                      disabled={!formData.education_system_id || loadingEducationData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!formData.education_system_id ? "Select system first" : "Select education level"} />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate *</Label>
                    <div className="flex">
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                        placeholder="25"
                        min="0"
                        step="0.01"
                        className="ml-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="experience_years">Years of Experience *</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                      placeholder="5"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="teaching_philosophy">Teaching Philosophy</Label>
                  <Textarea
                    id="teaching_philosophy"
                    value={formData.teaching_philosophy}
                    onChange={(e) => setFormData({ ...formData, teaching_philosophy: e.target.value })}
                    placeholder="Describe your approach to teaching and education"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Specialties</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a specialty..."
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Education Background</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.education.map((education, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {education}
                        <button
                          type="button"
                          onClick={() => removeEducation(education)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add education (e.g., Bachelor's in Mathematics)"
                      value={newEducation}
                      onChange={(e) => setNewEducation(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEducation())}
                    />
                    <Button type="button" onClick={addEducation} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Teaching Subjects</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.teacher_subjects.map((subject, index) => {
                      const subjectData = subjects.find(s => s.id === subject.subject_id);
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {subjectData?.name || subject.subject_id}
                          <button
                            type="button"
                            onClick={() => {
                              const newSubjects = formData.teacher_subjects.filter((_, i) => i !== index);
                              setFormData({ ...formData, teacher_subjects: newSubjects });
                            }}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value=""
                      onValueChange={(subjectId) => {
                        if (subjectId && !formData.teacher_subjects.find(s => s.subject_id === subjectId)) {
                          const newSubject = {
                            subject_id: subjectId,
                            proficiency_level: 'intermediate' as const,
                            years_experience: 0,
                            is_primary: false
                          };
                          setFormData({
                            ...formData,
                            teacher_subjects: [...formData.teacher_subjects, newSubject]
                          });
                        }
                      }}
                      disabled={loadingEducationData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingEducationData ? "Loading subjects..." : "Add a subject..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.length === 0 ? (
                          <SelectItem value="no-subjects" disabled>
                            {loadingEducationData ? "Loading subjects..." : "No subjects available"}
                          </SelectItem>
                        ) : (
                          subjects
                            .filter(subject => !formData.teacher_subjects.find(s => s.subject_id === subject.id))
                            .map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name} ({subject.category})
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Languages Spoken</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.languages.map((language, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {languageOptions.find(opt => opt.value === language)?.label || language}
                        <button
                          type="button"
                          onClick={() => removeLanguage(language)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={newLanguage}
                      onValueChange={setNewLanguage}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add a language..." />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.filter(opt => !formData.languages.includes(opt.value)).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addLanguage} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Teaching Preferences
                </CardTitle>
                <CardDescription>
                  Configure your teaching preferences and availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferred_class_duration">Preferred Class Duration (minutes)</Label>
                    <Select
                      value={formData.preferred_class_duration.toString()}
                      onValueChange={(value) => setFormData({ ...formData, preferred_class_duration: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="max_students_per_class">Max Students Per Class</Label>
                    <Input
                      id="max_students_per_class"
                      type="number"
                      value={formData.max_students_per_class}
                      onChange={(e) => setFormData({ ...formData, max_students_per_class: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>

                <div>
                  <Label>Preferred Student Ages</Label>
                  <div className="flex flex-wrap gap-2">
                    {studentAgeOptions.map((option) => (
                      <Badge
                        key={option.value}
                        variant={formData.preferred_student_ages.includes(option.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const newAges = formData.preferred_student_ages.includes(option.value)
                            ? formData.preferred_student_ages.filter(age => age !== option.value)
                            : [...formData.preferred_student_ages, option.value];
                          setFormData({ ...formData, preferred_student_ages: newAges });
                        }}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-accept Bookings</Label>
                      <p className="text-sm text-gray-600">Automatically accept booking requests</p>
                    </div>
                    <Switch
                      checked={formData.auto_accept_bookings}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_accept_bookings: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Student Approval</Label>
                      <p className="text-sm text-gray-600">Students need approval before booking</p>
                    </div>
                    <Switch
                      checked={formData.require_student_approval}
                      onCheckedChange={(checked) => setFormData({ ...formData, require_student_approval: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={formData.email_notifications}
                      onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-600">Receive push notifications</p>
                    </div>
                    <Switch
                      checked={formData.push_notifications}
                      onCheckedChange={(checked) => setFormData({ ...formData, push_notifications: checked })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Profile Visibility</Label>
                    <Select
                      value={formData.profile_visibility}
                      onValueChange={(value: 'public' | 'private' | 'students_only') => 
                        setFormData({ ...formData, profile_visibility: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see</SelectItem>
                        <SelectItem value="students_only">Students Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Preferred Payment Method</Label>
                    <Select
                      value={formData.preferred_payment_method}
                      onValueChange={(value: 'stripe' | 'mpesa' | 'bank_transfer') => 
                        setFormData({ ...formData, preferred_payment_method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Skills & Certifications
                </CardTitle>
                <CardDescription>
                  Add your teaching skills and certifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{skill.skill_name}</div>
                        <div className="text-sm text-gray-600">
                          {skill.skill_category && `${skill.skill_category} • `}
                          {skill.proficiency_level} • {skill.years_experience} years
                          {skill.is_certified && ' • Certified'}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Add New Skill</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="skill_name">Skill Name *</Label>
                      <Input
                        id="skill_name"
                        value={newSkill.skill_name}
                        onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                        placeholder="e.g., Mathematics, Science, English"
                      />
                    </div>
                    <div>
                      <Label htmlFor="skill_category">Category</Label>
                      <Input
                        id="skill_category"
                        value={newSkill.skill_category}
                        onChange={(e) => setNewSkill({ ...newSkill, skill_category: e.target.value })}
                        placeholder="e.g., Academic, Technical, Language"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proficiency_level">Proficiency Level</Label>
                      <Select
                        value={newSkill.proficiency_level}
                        onValueChange={(value: 'beginner' | 'intermediate' | 'advanced' | 'expert') => 
                          setNewSkill({ ...newSkill, proficiency_level: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {proficiencyLevelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="years_experience">Years of Experience</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        value={newSkill.years_experience}
                        onChange={(e) => setNewSkill({ ...newSkill, years_experience: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newSkill.is_certified}
                        onCheckedChange={(checked) => setNewSkill({ ...newSkill, is_certified: checked })}
                      />
                      <Label>Certified</Label>
                    </div>
                  </div>

                  {newSkill.is_certified && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="certification_body">Certification Body</Label>
                        <Input
                          id="certification_body"
                          value={newSkill.certification_body}
                          onChange={(e) => setNewSkill({ ...newSkill, certification_body: e.target.value })}
                          placeholder="e.g., Microsoft, Google, TEFL"
                        />
                      </div>
                      <div>
                        <Label htmlFor="certification_date">Certification Date</Label>
                        <Input
                          id="certification_date"
                          type="date"
                          value={newSkill.certification_date}
                          onChange={(e) => setNewSkill({ ...newSkill, certification_date: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={addSkill}
                    className="mt-4"
                    disabled={!newSkill.skill_name.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Skill
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Availability Schedule
                </CardTitle>
                <CardDescription>
                  Set your available teaching hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {formData.availability.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <Label>Day</Label>
                          <Select
                            value={slot.day_of_week.toString()}
                            onValueChange={(value) => updateAvailabilitySlot(index, { day_of_week: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dayOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateAvailabilitySlot(index, { start_time: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateAvailabilitySlot(index, { end_time: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Max Students</Label>
                          <Input
                            type="number"
                            value={slot.max_students_per_slot}
                            onChange={(e) => updateAvailabilitySlot(index, { max_students_per_slot: parseInt(e.target.value) || 1 })}
                            min="1"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAvailabilitySlot(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={addAvailabilitySlot}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Availability Slot
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const tabs = ['basic', 'teaching', 'preferences', 'skills', 'availability'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1]);
              }
            }}
            disabled={activeTab === 'basic'}
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={() => {
              const tabs = ['basic', 'teaching', 'preferences', 'skills', 'availability'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1]);
              }
            }}
            disabled={activeTab === 'availability'}
          >
            Next
          </Button>
        </div>

        <div className="text-center pt-6">
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full max-w-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Complete Registration
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
