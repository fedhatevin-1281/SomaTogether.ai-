import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, User, Mail, Phone, MapPin, Calendar, Globe, Shield, Camera } from 'lucide-react';
import { useAuth, UserProfile } from '../../contexts/AuthContext';

interface ProfileManagerProps {
  onProfileUpdate?: () => void;
}

export function ProfileManager({ onProfileUpdate }: ProfileManagerProps) {
  const { profile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    date_of_birth: profile?.date_of_birth || '',
    language: profile?.language || 'en',
    timezone: profile?.timezone || 'UTC',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await updateProfile(formData);
      if (error) {
        setError(error.message || 'Failed to update profile');
      } else {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        onProfileUpdate?.();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      date_of_birth: profile?.date_of_birth || '',
      language: profile?.language || 'en',
      timezone: profile?.timezone || 'UTC',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert>
        <AlertDescription>
          Profile not found. Please try logging in again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
              disabled={isSaving}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {isEditing && (
                <Button
                  size="sm"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0"
                  variant="outline"
                >
                  <Camera className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">{profile.full_name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {profile.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                {profile.is_verified ? 'Verified Account' : 'Unverified Account'}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
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
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="+1 (555) 123-4567"
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
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="City, Country"
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
                  value={formData.date_of_birth || ''}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={formData.language || 'en'}
                onValueChange={(value) => handleInputChange('language', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone || 'UTC'}
                onValueChange={(value) => handleInputChange('timezone', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (GMT-6)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (GMT-7)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (GMT+1)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (GMT+8)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Mumbai (GMT+5:30)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (GMT+10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={!isEditing}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and security information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Account Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">{profile.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Verification Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${profile.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-sm">{profile.is_verified ? 'Verified' : 'Pending Verification'}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Member Since</Label>
              <div className="text-sm text-gray-900 mt-1">
                {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Last Login</Label>
              <div className="text-sm text-gray-900 mt-1">
                {profile.last_login_at 
                  ? new Date(profile.last_login_at).toLocaleDateString()
                  : 'Never'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





