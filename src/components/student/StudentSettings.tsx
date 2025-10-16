import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Smartphone,
  Mail,
  Lock,
  Camera,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  X,
  Target,
  Heart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StudentSettingsService, { StudentSettingsData } from '../../services/studentSettingsService';
import { toast } from 'sonner';

export function StudentSettings() {
  const { profile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsData, setSettingsData] = useState<StudentSettingsData | null>(null);
  const [profileImageRef] = useState(React.createRef<HTMLInputElement>());
  const [newInterest, setNewInterest] = useState('');
  const [newLearningGoal, setNewLearningGoal] = useState('');

  // Dropdown options based on database schema
  const timezoneOptions = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'Mumbai/New Delhi (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'Africa/Cairo', label: 'Cairo (EET/EEST)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
    { value: 'America/Toronto', label: 'Toronto (EST/EDT)' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'it', label: 'Italiano (Italian)' },
    { value: 'pt', label: 'Português (Portuguese)' },
    { value: 'ru', label: 'Русский (Russian)' },
    { value: 'zh', label: '中文 (Chinese)' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'ko', label: '한국어 (Korean)' },
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'hi', label: 'हिन्दी (Hindi)' },
    { value: 'th', label: 'ไทย (Thai)' },
    { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
    { value: 'nl', label: 'Nederlands (Dutch)' },
    { value: 'sv', label: 'Svenska (Swedish)' },
    { value: 'no', label: 'Norsk (Norwegian)' },
    { value: 'da', label: 'Dansk (Danish)' },
    { value: 'fi', label: 'Suomi (Finnish)' },
    { value: 'pl', label: 'Polski (Polish)' }
  ];

  const gradeLevelOptions = [
    { value: 'Pre-K', label: 'Pre-Kindergarten' },
    { value: 'Kindergarten', label: 'Kindergarten' },
    { value: 'Grade 1', label: 'Grade 1' },
    { value: 'Grade 2', label: 'Grade 2' },
    { value: 'Grade 3', label: 'Grade 3' },
    { value: 'Grade 4', label: 'Grade 4' },
    { value: 'Grade 5', label: 'Grade 5' },
    { value: 'Grade 6', label: 'Grade 6' },
    { value: 'Grade 7', label: 'Grade 7' },
    { value: 'Grade 8', label: 'Grade 8' },
    { value: 'Grade 9', label: 'Grade 9' },
    { value: 'Grade 10', label: 'Grade 10' },
    { value: 'Grade 11', label: 'Grade 11' },
    { value: 'Grade 12', label: 'Grade 12' },
    { value: 'A-Level', label: 'A-Level' },
    { value: 'IB', label: 'International Baccalaureate' },
    { value: 'AP', label: 'Advanced Placement' },
    { value: 'College', label: 'College/University' },
    { value: 'Adult Learning', label: 'Adult Learning' },
    { value: 'Other', label: 'Other' }
  ];

  const learningStyleOptions = [
    { value: 'Visual', label: 'Visual Learner' },
    { value: 'Auditory', label: 'Auditory Learner' },
    { value: 'Kinesthetic', label: 'Kinesthetic Learner' },
    { value: 'Reading/Writing', label: 'Reading/Writing Learner' },
    { value: 'Multimodal', label: 'Multimodal Learner' },
    { value: 'Not Sure', label: 'Not Sure' }
  ];

  const profileVisibilityOptions = [
    { value: 'public', label: 'Public - Anyone can see your profile' },
    { value: 'private', label: 'Private - Only you can see your profile' },
    { value: 'teachers_only', label: 'Teachers Only - Only teachers can see your profile' }
  ];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    timezone: 'UTC',
    language: 'en',
    dateOfBirth: '',
    gradeLevel: '',
    schoolName: '',
    learningStyle: '',
    interests: [] as string[],
    learningGoals: [] as string[],
    preferredLanguages: ['en'] as string[]
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    classReminders: true,
    assignmentDues: true,
    teacherMessages: true,
    weeklyReports: false,
    marketingEmails: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowTeacherContact: true,
    shareProgressWithParents: true
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!profile?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await StudentSettingsService.getStudentSettings(profile.id);
        setSettingsData(data);
        
        // Update form data with real data
        const nameParts = data.profile.full_name.split(' ');
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: data.profile.email,
          phone: data.profile.phone || '',
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          timezone: data.profile.timezone,
          language: data.profile.language,
          dateOfBirth: data.profile.date_of_birth || '',
          gradeLevel: data.student.grade_level || '',
          schoolName: data.student.school_name || '',
          learningStyle: data.student.learning_style || '',
          interests: data.student.interests || [],
          learningGoals: data.student.learning_goals || [],
          preferredLanguages: data.student.preferred_languages || ['en']
        });

        setNotifications({
          emailNotifications: data.preferences.email_notifications,
          pushNotifications: data.preferences.push_notifications,
          smsNotifications: data.preferences.sms_notifications,
          classReminders: data.preferences.class_reminders,
          assignmentDues: data.preferences.assignment_due_reminders,
          teacherMessages: data.preferences.teacher_messages,
          weeklyReports: data.preferences.weekly_progress_reports,
          marketingEmails: data.preferences.marketing_emails
        });

        setPrivacy({
          profileVisibility: data.preferences.profile_visibility,
          showOnlineStatus: data.preferences.show_online_status,
          allowTeacherContact: data.preferences.allow_teacher_contact,
          shareProgressWithParents: data.preferences.share_progress_with_parents
        });
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [profile?.id]);

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  const addLearningGoal = () => {
    if (newLearningGoal.trim() && !formData.learningGoals.includes(newLearningGoal.trim())) {
      setFormData({
        ...formData,
        learningGoals: [...formData.learningGoals, newLearningGoal.trim()]
      });
      setNewLearningGoal('');
    }
  };

  const removeLearningGoal = (goal: string) => {
    setFormData({
      ...formData,
      learningGoals: formData.learningGoals.filter(g => g !== goal)
    });
  };

  const handleSaveSettings = async () => {
    if (!profile?.id || !settingsData) return;
    
    try {
      setSaving(true);
      setError(null);

      // Update profile
      await StudentSettingsService.updateStudentProfile(profile.id, {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
        timezone: formData.timezone,
        language: formData.language,
        date_of_birth: formData.dateOfBirth || null
      });

      // Update student data
      await StudentSettingsService.updateStudentData(profile.id, {
        grade_level: formData.gradeLevel,
        school_name: formData.schoolName,
        learning_style: formData.learningStyle,
        interests: formData.interests,
        learning_goals: formData.learningGoals,
        preferred_languages: formData.preferredLanguages
      });

      // Update preferences
      await StudentSettingsService.updateStudentPreferences(profile.id, {
        email_notifications: notifications.emailNotifications,
        push_notifications: notifications.pushNotifications,
        sms_notifications: notifications.smsNotifications,
        class_reminders: notifications.classReminders,
        assignment_due_reminders: notifications.assignmentDues,
        teacher_messages: notifications.teacherMessages,
        weekly_progress_reports: notifications.weeklyReports,
        marketing_emails: notifications.marketingEmails,
        profile_visibility: privacy.profileVisibility,
        show_online_status: privacy.showOnlineStatus,
        allow_teacher_contact: privacy.allowTeacherContact,
        share_progress_with_parents: privacy.shareProgressWithParents
      });

      toast.success('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      setSaving(true);
      const result = await StudentSettingsService.uploadProfileImage(profile.id, file);
      
      if (result.success && result.url) {
        toast.success('Profile image updated successfully!');
        // Reload settings to get updated data
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading settings: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700" 
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Profile Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Profile Information</h2>
        </div>

        <div className="flex items-start space-x-6 mb-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <img 
                src={settingsData?.profile.avatar_url || '/default-avatar.png'} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                }}
              />
            </Avatar>
            <Button 
              size="sm" 
              className="absolute -bottom-2 -right-2 p-1 rounded-full bg-blue-600 hover:bg-blue-700"
              onClick={() => profileImageRef.current?.click()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Camera className="w-3 h-3" />
              )}
            </Button>
            <input
              ref={profileImageRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <Badge className="bg-blue-100 text-blue-800 mb-2">Student</Badge>
            <p className="text-sm text-gray-600">Upload a profile picture to help teachers recognize you</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName" 
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName" 
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input 
              id="bio" 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us about yourself"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Enter your location"
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input 
              id="dateOfBirth" 
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
            />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Academic Information</h3>
          <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gradeLevel">Grade Level</Label>
            <Select 
              value={formData.gradeLevel} 
              onValueChange={(value) => setFormData({...formData, gradeLevel: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your grade level" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
            <div>
              <Label htmlFor="schoolName">School Name</Label>
              <Input 
                id="schoolName" 
                value={formData.schoolName}
                onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                placeholder="Enter your school name"
              />
            </div>
            <div>
              <Label htmlFor="learningStyle">Learning Style</Label>
              <Select 
                value={formData.learningStyle} 
                onValueChange={(value) => setFormData({...formData, learningStyle: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your learning style" />
                </SelectTrigger>
                <SelectContent>
                  {learningStyleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Heart className="w-4 h-4 mr-2 text-red-500" />
              Interests
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.interests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              />
              <Button onClick={addInterest} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <Target className="w-4 h-4 mr-2 text-green-500" />
              Learning Goals
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.learningGoals.map((goal, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {goal}
                  <button
                    onClick={() => removeLearningGoal(goal)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a learning goal..."
                value={newLearningGoal}
                onChange={(e) => setNewLearningGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLearningGoal()}
              />
              <Button onClick={addLearningGoal} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Security */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Account Security</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input 
                id="currentPassword" 
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword" 
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword" 
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
            />
          </div>
          <Button variant="outline" className="mt-4">
            <Lock className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
            </div>
            <Switch 
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications on your device</p>
              </div>
            </div>
            <Switch 
              checked={notifications.pushNotifications}
              onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Notification Types</h3>
            
            {[
              { key: 'classReminders', label: 'Class Reminders', desc: '15 minutes before scheduled classes' },
              { key: 'assignmentDues', label: 'Assignment Due Dates', desc: '1 day before assignments are due' },
              { key: 'teacherMessages', label: 'Teacher Messages', desc: 'When teachers send you messages' },
              { key: 'weeklyReports', label: 'Weekly Progress Reports', desc: 'Summary of your weekly performance' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
                <Switch 
                  checked={notifications[key as keyof typeof notifications]}
                  onCheckedChange={(checked) => setNotifications({...notifications, [key]: checked})}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Privacy Settings</h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <Select 
              value={privacy.profileVisibility} 
              onValueChange={(value) => setPrivacy({...privacy, profileVisibility: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select profile visibility" />
              </SelectTrigger>
              <SelectContent>
                {profileVisibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-1">Control who can see your profile information</p>
          </div>

          <div className="space-y-4">
            {[
              { 
                key: 'showOnlineStatus', 
                label: 'Show Online Status', 
                desc: 'Let others see when you are online' 
              },
              { 
                key: 'allowTeacherContact', 
                label: 'Allow Teacher Contact', 
                desc: 'Teachers can send you direct messages' 
              },
              { 
                key: 'shareProgressWithParents', 
                label: 'Share Progress with Parents', 
                desc: 'Parents can view your academic progress' 
              }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
                <Switch 
                  checked={privacy[key as keyof typeof privacy]}
                  onCheckedChange={(checked) => setPrivacy({...privacy, [key]: checked})}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Preferences</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={formData.timezone} 
              onValueChange={(value) => setFormData({...formData, timezone: value})}
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
            <Label htmlFor="language">Language</Label>
            <Select 
              value={formData.language} 
              onValueChange={(value) => setFormData({...formData, language: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your language" />
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
      </Card>

      {/* Payment & Billing */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Payment & Billing</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 1234</p>
                <p className="text-sm text-gray-600">Expires 12/26</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Update</Button>
          </div>
          
          <Button variant="outline" className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      </Card>
    </div>
  );
}