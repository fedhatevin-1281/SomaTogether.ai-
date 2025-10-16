import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  User, 
  Settings, 
  Upload, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Clock,
  DollarSign,
  Globe,
  Bell,
  Shield,
  GraduationCap,
  Award,
  Languages,
  Link,
  Eye,
  EyeOff
} from 'lucide-react';
import { TeacherSettingsService, TeacherProfile, TeacherPreferences, TeacherSubject, TeacherSkill, Subject } from '../../services/teacherSettingsService';
import { useAuth } from '../../contexts/AuthContext';

export function TeacherSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile data
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [preferences, setPreferences] = useState<TeacherPreferences | null>(null);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [skills, setSkills] = useState<TeacherSkill[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    hourly_rate: 0,
    teaching_philosophy: '',
    specialties: [] as string[],
    education: [] as string[],
    experience_years: 0,
    languages: [] as string[],
    social_links: {} as any,
    timezone: 'UTC'
  });

  const [preferencesForm, setPreferencesForm] = useState({
    preferred_student_ages: [] as string[],
    preferred_class_duration: 60,
    max_students_per_class: 1,
    auto_accept_bookings: false,
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    marketing_emails: false,
    timezone: 'UTC',
    preferred_payment_method: 'stripe' as 'stripe' | 'mpesa' | 'bank_transfer',
    profile_visibility: 'public' as 'public' | 'private' | 'students_only',
    show_contact_info: false,
    show_social_links: true,
    language: 'en',
    currency: 'USD'
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: '',
    proficiency_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
    years_experience: 0,
    is_certified: false
  });

  // File upload refs
  const profileImageRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadTeacherData();
    }
  }, [user?.id]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileData, preferencesData, subjectsData, skillsData, availableSubjectsData] = await Promise.all([
        TeacherSettingsService.getTeacherProfile(user!.id),
        TeacherSettingsService.getTeacherPreferences(user!.id),
        TeacherSettingsService.getTeacherSubjects(user!.id),
        TeacherSettingsService.getTeacherSkills(user!.id),
        TeacherSettingsService.getAvailableSubjects()
      ]);

      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          hourly_rate: profileData.hourly_rate || 0,
          teaching_philosophy: profileData.teaching_philosophy || '',
          specialties: profileData.specialties || [],
          education: profileData.education || [],
          experience_years: profileData.experience_years || 0,
          languages: profileData.languages || [],
          social_links: profileData.social_links || {},
          timezone: profileData.timezone || 'UTC'
        });
      }

      if (preferencesData) {
        setPreferences(preferencesData);
        setPreferencesForm({
          preferred_student_ages: preferencesData.preferred_student_ages || [],
          preferred_class_duration: preferencesData.preferred_class_duration || 60,
          max_students_per_class: preferencesData.max_students_per_class || 1,
          auto_accept_bookings: preferencesData.auto_accept_bookings || false,
          email_notifications: preferencesData.email_notifications || true,
          sms_notifications: preferencesData.sms_notifications || false,
          push_notifications: preferencesData.push_notifications || true,
          marketing_emails: preferencesData.marketing_emails || false,
          timezone: preferencesData.timezone || 'UTC',
          preferred_payment_method: preferencesData.preferred_payment_method || 'stripe',
          profile_visibility: preferencesData.profile_visibility || 'public',
          show_contact_info: preferencesData.show_contact_info || false,
          show_social_links: preferencesData.show_social_links || true,
          language: preferencesData.language || 'en',
          currency: preferencesData.currency || 'USD'
        });
      }

      setSubjects(subjectsData);
      setSkills(skillsData);
      setAvailableSubjects(availableSubjectsData);
    } catch (err) {
      setError('Failed to load teacher data');
      console.error('Error loading teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      const success = await TeacherSettingsService.updateTeacherProfile(user!.id, profileForm);
      if (success) {
        setSuccess('Profile updated successfully!');
        await loadTeacherData();
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);

      const success = await TeacherSettingsService.updateTeacherPreferences(user!.id, preferencesForm);
      if (success) {
        setSuccess('Preferences updated successfully!');
        await loadTeacherData();
      } else {
        setError('Failed to update preferences');
      }
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error updating preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'profile_image' | 'cover_image') => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate file before upload
      if (!file) {
        setError('No file selected');
        return;
      }

      if (file.size === 0) {
        setError('Selected file is empty');
        return;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB
        setError('File size must be less than 50MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, GIF, and WebP images are allowed');
        return;
      }

      console.log('Starting image upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        documentType: type
      });

      const result = await TeacherSettingsService.uploadDocument(user!.id, file, type);
      
      if (result.success) {
        setSuccess(`${type === 'profile_image' ? 'Profile' : 'Cover'} image updated successfully!`);
        await loadTeacherData();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        const errorMsg = result.error || 'Failed to upload image';
        setError(errorMsg);
        
        // If it's an RLS error, provide additional guidance
        if (errorMsg.includes('security policy') || errorMsg.includes('row-level security')) {
          setError(errorMsg + ' Please contact support if this issue persists.');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMsg);
      console.error('Error uploading image:', err);
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !profileForm.specialties.includes(newSpecialty.trim())) {
      setProfileForm(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setProfileForm(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const addEducation = () => {
    if (newEducation.trim() && !profileForm.education.includes(newEducation.trim())) {
      setProfileForm(prev => ({
        ...prev,
        education: [...prev.education, newEducation.trim()]
      }));
      setNewEducation('');
    }
  };

  const removeEducation = (education: string) => {
    setProfileForm(prev => ({
      ...prev,
      education: prev.education.filter(e => e !== education)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !profileForm.languages.includes(newLanguage.trim())) {
      setProfileForm(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setProfileForm(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const addSkill = async () => {
    if (newSkill.name.trim()) {
      const success = await TeacherSettingsService.addTeacherSkill(user!.id, {
        skill_name: newSkill.name.trim(),
        skill_category: newSkill.category.trim(),
        proficiency_level: newSkill.proficiency_level,
        years_experience: newSkill.years_experience,
        is_certified: newSkill.is_certified
      });

      if (success) {
        setSuccess('Skill added successfully!');
        await loadTeacherData();
        setNewSkill({
          name: '',
          category: '',
          proficiency_level: 'intermediate',
          years_experience: 0,
          is_certified: false
        });
      } else {
        setError('Failed to add skill');
      }
    }
  };

  const removeSkill = async (skillId: string) => {
    const success = await TeacherSettingsService.removeTeacherSkill(skillId);
    if (success) {
      setSuccess('Skill removed successfully!');
      await loadTeacherData();
    } else {
      setError('Failed to remove skill');
    }
  };

  const toggleStudentAge = (age: string) => {
    setPreferencesForm(prev => ({
      ...prev,
      preferred_student_ages: prev.preferred_student_ages.includes(age)
        ? prev.preferred_student_ages.filter(a => a !== age)
        : [...prev.preferred_student_ages, age]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Settings</h1>
          <p className="text-slate-600">Manage your profile, preferences, and teaching details</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          {profile?.verification_status || 'pending'}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your teaching profile and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Profile Image</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      {profile?.profile_image_url ? (
                        <img 
                          src={profile.profile_image_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        onClick={() => profileImageRef.current?.click()}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 mr-2" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                      <input
                        ref={profileImageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'profile_image');
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Cover Image</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-16 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                      {profile?.cover_image_url ? (
                        <img 
                          src={profile.cover_image_url} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Upload className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => coverImageRef.current?.click()}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Cover
                          </>
                        )}
                      </Button>
                      <input
                        ref={coverImageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'cover_image');
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={profileForm.hourly_rate}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={profileForm.experience_years}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teaching_philosophy">Teaching Philosophy</Label>
                <Textarea
                  id="teaching_philosophy"
                  value={profileForm.teaching_philosophy}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, teaching_philosophy: e.target.value }))}
                  placeholder="Describe your teaching approach and philosophy..."
                  rows={4}
                />
              </div>

              {/* Specialties */}
              <div className="space-y-4">
                <Label>Specialties</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profileForm.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {specialty}
                      <button
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-1 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a specialty..."
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                  />
                  <Button onClick={addSpecialty} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Education */}
              <div className="space-y-4">
                <Label>Education</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profileForm.education.map((education, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {education}
                      <button
                        onClick={() => removeEducation(education)}
                        className="ml-1 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add education qualification..."
                    value={newEducation}
                    onChange={(e) => setNewEducation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEducation()}
                  />
                  <Button onClick={addEducation} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-4">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profileForm.languages.map((language, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {language}
                      <button
                        onClick={() => removeLanguage(language)}
                        className="ml-1 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add language..."
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                  />
                  <Button onClick={addLanguage} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="class_duration">Class Duration (minutes)</Label>
                  <Input
                    id="class_duration"
                    type="number"
                    value={preferencesForm.preferred_class_duration}
                    onChange={(e) => setPreferencesForm(prev => ({ ...prev, preferred_class_duration: parseInt(e.target.value) || 60 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_students">Max Students per Class</Label>
                  <Input
                    id="max_students"
                    type="number"
                    value={preferencesForm.max_students_per_class}
                    onChange={(e) => setPreferencesForm(prev => ({ ...prev, max_students_per_class: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Preferred Student Ages</Label>
                <div className="flex flex-wrap gap-2">
                  {['6-12', '13-17', '18+'].map((age) => (
                    <Button
                      key={age}
                      variant={preferencesForm.preferred_student_ages.includes(age) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStudentAge(age)}
                    >
                      {age}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Notifications</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <Switch
                      id="email_notifications"
                      checked={preferencesForm.email_notifications}
                      onCheckedChange={(checked) => setPreferencesForm(prev => ({ ...prev, email_notifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms_notifications">SMS Notifications</Label>
                    <Switch
                      id="sms_notifications"
                      checked={preferencesForm.sms_notifications}
                      onCheckedChange={(checked) => setPreferencesForm(prev => ({ ...prev, sms_notifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push_notifications">Push Notifications</Label>
                    <Switch
                      id="push_notifications"
                      checked={preferencesForm.push_notifications}
                      onCheckedChange={(checked) => setPreferencesForm(prev => ({ ...prev, push_notifications: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={preferencesForm.timezone}
                    onValueChange={(value) => setPreferencesForm(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Preferred Payment Method</Label>
                  <Select
                    value={preferencesForm.preferred_payment_method}
                    onValueChange={(value: 'stripe' | 'mpesa' | 'bank_transfer') => setPreferencesForm(prev => ({ ...prev, preferred_payment_method: value }))}
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

              <Button onClick={handleSavePreferences} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
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
                Add your skills and certifications to showcase your expertise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Skill */}
              <div className="space-y-4">
                <h3 className="font-semibold">Add New Skill</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill_name">Skill Name</Label>
                    <Input
                      id="skill_name"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Mathematics, Programming"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skill_category">Category</Label>
                    <Input
                      id="skill_category"
                      value={newSkill.category}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Technical, Soft Skills"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proficiency">Proficiency Level</Label>
                    <Select
                      value={newSkill.proficiency_level}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced' | 'expert') => setNewSkill(prev => ({ ...prev, proficiency_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years_experience">Years Experience</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      value={newSkill.years_experience}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_certified"
                    checked={newSkill.is_certified}
                    onCheckedChange={(checked) => setNewSkill(prev => ({ ...prev, is_certified: checked }))}
                  />
                  <Label htmlFor="is_certified">Certified</Label>
                </div>
                <Button onClick={addSkill} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </div>

              {/* Current Skills */}
              <div className="space-y-4">
                <h3 className="font-semibold">Current Skills</h3>
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{skill.skill_name}</div>
                        <div className="text-sm text-slate-600">
                          {skill.skill_category && `${skill.skill_category} • `}
                          {skill.proficiency_level} • {skill.years_experience} years
                          {skill.is_certified && ' • Certified'}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(skill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-slate-500 text-center py-4">No skills added yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Documents & Verification
              </CardTitle>
              <CardDescription>
                Upload verification documents and certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Upload Documents</h3>
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Certificate
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Diploma
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload ID Verification
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Background Check
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Verification Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Profile Verification</div>
                        <div className="text-sm text-slate-600">Identity and credentials</div>
                      </div>
                      <Badge variant={profile?.verification_status === 'verified' ? 'default' : 'secondary'}>
                        {profile?.verification_status || 'pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Background Check</div>
                        <div className="text-sm text-slate-600">Criminal background verification</div>
                      </div>
                      <Badge variant="secondary">pending</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}