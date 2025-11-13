import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
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
  UserPlus,
  Calendar,
  DollarSign,
  Users,
  BookOpen,
  Loader2,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import ParentService, { ChildData } from '../../services/parentService';

export function ParentSettings() {
  const { user, profile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    relationship: 'Mother',
    occupation: ''
  });

  const [children, setChildren] = useState<ChildData[]>([]);
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const isOpeningRef = useRef(false);
  
  // Debug: Log dialog state changes
  useEffect(() => {
    console.log('Dialog state is now:', showAddChildDialog);
  }, [showAddChildDialog]);
  
  // Handler for dialog open change
  const handleDialogOpenChange = useCallback((open: boolean) => {
    console.log('Dialog onOpenChange called with:', open, 'isOpeningRef:', isOpeningRef.current, 'current state:', showAddChildDialog, 'addingChild:', addingChild);
    
    // If trying to close
    if (!open) {
      // If we just opened and ref is still true, ignore the close and reset the ref
      if (isOpeningRef.current) {
        console.log('Ignoring immediate close after opening - isOpeningRef is still true');
        // Reset the ref now since we've caught the immediate close attempt
        setTimeout(() => {
          isOpeningRef.current = false;
          console.log('Reset isOpeningRef to false (after preventing close)');
        }, 500);
        return;
      }
      // If we're adding, prevent closing
      if (addingChild) {
        console.log('Preventing close - currently adding child');
        return;
      }
      // Otherwise, allow closing
      console.log('Allowing dialog to close');
      setShowAddChildDialog(false);
      setAddChildError(null);
      setAddChildSuccess(false);
      setNewChildData({ name: '', email: '' });
    }
    // Note: We don't handle the open=true case here because we control that via button click
  }, [showAddChildDialog, addingChild]);
  const [addChildError, setAddChildError] = useState<string | null>(null);
  const [addChildSuccess, setAddChildSuccess] = useState(false);
  const [newChildData, setNewChildData] = useState({
    name: '',
    email: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: true,
    sessionReminders: true,
    progressUpdates: true,
    paymentReminders: true,
    teacherMessages: true,
    weeklyReports: true,
    assignmentDue: true,
    gradeUpdates: true
  });

  const [privacy, setPrivacy] = useState({
    shareProgressWithTeachers: true,
    allowTeacherContact: true,
    shareContactInfo: false,
    publicProfile: false,
    dataSharing: false
  });

  const [preferences, setPreferences] = useState({
    preferredLanguage: 'English',
    timezone: 'UTC',
    currency: 'USD',
    sessionRemindersTime: '15',
    reportFrequency: 'weekly',
    communicationMethod: 'email'
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !profile) return;
      
      try {
        setLoading(true);
        
        // Load profile data
        const nameParts = (profile.full_name || '').split(' ');
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.location || '',
          emergencyContact: '',
          relationship: 'Mother',
          occupation: ''
        });

        // Load preferences from profile
        setPreferences({
          preferredLanguage: profile.language || 'English',
          timezone: profile.timezone || 'UTC',
          currency: 'USD',
          sessionRemindersTime: '15',
          reportFrequency: 'weekly',
          communicationMethod: 'email'
        });

        // Load children
        const childrenData = await ParentService.getChildren(user.id);
        setChildren(childrenData);

        // Get parent data if exists
        const { data: parentData } = await supabase
          .from('parents')
          .select('*')
          .eq('id', user.id)
          .single();

        // TODO: Load notification and privacy preferences from database
        // These would typically be in a parent_preferences table
        
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, profile]);

  const handleAddChild = async () => {
    if (!user) return;

    if (!newChildData.name.trim() || !newChildData.email.trim()) {
      setAddChildError('Please enter both name and email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newChildData.email.trim())) {
      setAddChildError('Please enter a valid email address');
      return;
    }

    try {
      setAddingChild(true);
      setAddChildError(null);
      setAddChildSuccess(false);

      const result = await ParentService.linkChildToParent(
        user.id,
        newChildData.email.trim(),
        newChildData.name.trim()
      );

      if (result.success) {
        setAddChildSuccess(true);
        setNewChildData({ name: '', email: '' });
        
        // Refresh children list
        const childrenData = await ParentService.getChildren(user.id);
        setChildren(childrenData);

        // Close dialog after a short delay
        setTimeout(() => {
          setShowAddChildDialog(false);
          setAddChildSuccess(false);
        }, 1500);
      } else {
        setAddChildError(result.error || 'Failed to add child');
      }
    } catch (error) {
      console.error('Error adding child:', error);
      setAddChildError('An unexpected error occurred. Please try again.');
    } finally {
      setAddingChild(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Parent Settings</h1>
          <p className="text-gray-600">Manage your account and children's educational preferences</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={async () => {
          // TODO: Implement save functionality
          console.log('Saving settings...', { formData, notifications, privacy, preferences });
        }}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Profile Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <User className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Profile Information</h2>
        </div>

        <div className="flex items-start space-x-6 mb-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-purple-600" />
                </div>
              )}
            </Avatar>
            <Button size="sm" className="absolute -bottom-2 -right-2 p-1 rounded-full bg-purple-600 hover:bg-purple-700">
              <Camera className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <Badge className="bg-purple-100 text-purple-800">Parent Account</Badge>
              <Badge className="bg-green-100 text-green-800">{children.length} Active {children.length === 1 ? 'Child' : 'Children'}</Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>Active Tutoring Sessions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
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
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Home Address</Label>
            <Input 
              id="address" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="relationship">Relationship to Children</Label>
              <select 
                id="relationship"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.relationship}
                onChange={(e) => setFormData({...formData, relationship: e.target.value})}
              >
                <option>Mother</option>
                <option>Father</option>
                <option>Guardian</option>
                <option>Grandparent</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input 
                id="occupation" 
                value={formData.occupation}
                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input 
              id="emergencyContact" 
              value={formData.emergencyContact}
              onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
              placeholder="Name and phone number"
            />
          </div>
        </div>
      </Card>

      {/* Children Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Children & Students</h2>
          </div>
          <Button 
            type="button"
            variant="outline" 
            className="text-purple-600 border-purple-200"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Add Child button clicked, setting dialog to true');
              // Set ref to true BEFORE any state updates
              isOpeningRef.current = true;
              console.log('isOpeningRef set to:', isOpeningRef.current);
              // Set state immediately
              setShowAddChildDialog(true);
              setAddChildError(null);
              setAddChildSuccess(false);
              setNewChildData({ name: '', email: '' });
              console.log('Dialog state should now be true');
              // Reset ref after a longer delay to ensure onOpenChange has time to check it
              setTimeout(() => {
                if (isOpeningRef.current) {
                  isOpeningRef.current = false;
                  console.log('Reset isOpeningRef to false (timeout)');
                }
              }, 2000);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>

        <div className="space-y-4">
          {children.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No children registered yet</p>
              <p className="text-sm text-gray-500 mt-2">Contact support to add your children to the platform</p>
            </div>
          ) : (
            children.map((child) => (
              <div key={child.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      {child.avatar_url ? (
                        <img src={child.avatar_url} alt={child.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{child.full_name}</h3>
                      <p className="text-sm text-gray-600">{child.grade_level || 'Student'} • {child.education_level?.level_name || 'Level'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">School</Label>
                    <p>{child.school_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Interests</Label>
                    <p>{child.interests.length > 0 ? child.interests.join(', ') : 'None'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-medium text-gray-500">Learning Goals</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {child.learning_goals.length > 0 ? (
                        child.learning_goals.map((goal, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {goal}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No learning goals set</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Child Dialog */}
      <Dialog 
        open={showAddChildDialog} 
        onOpenChange={(open) => {
          // Only handle closing, not opening (opening is controlled by button)
          if (!open) {
            handleDialogOpenChange(open);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[500px]"
          onEscapeKeyDown={(e) => {
            if (addingChild || isOpeningRef.current) {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            if (addingChild || isOpeningRef.current) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Add Child</DialogTitle>
            <DialogDescription>
              Enter your child's name and email to link them to your account. 
              If your child already has an account, they will be linked immediately. 
              If not, a student account will be created for them.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="childName">Child's Full Name</Label>
              <Input
                id="childName"
                placeholder="Enter child's full name"
                value={newChildData.name}
                onChange={(e) => setNewChildData({ ...newChildData, name: e.target.value })}
                disabled={addingChild}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="childEmail">Child's Email</Label>
              <Input
                id="childEmail"
                type="email"
                placeholder="Enter child's email address"
                value={newChildData.email}
                onChange={(e) => setNewChildData({ ...newChildData, email: e.target.value })}
                disabled={addingChild}
              />
            </div>

            {addChildError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{addChildError}</p>
              </div>
            )}

            {addChildSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Child added successfully! They will appear in your dashboard shortly.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddChildDialog(false);
                setAddChildError(null);
                setAddChildSuccess(false);
                setNewChildData({ name: '', email: '' });
              }}
              disabled={addingChild}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddChild}
              disabled={addingChild || !newChildData.name.trim() || !newChildData.email.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {addingChild ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Child
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Bell className="w-5 h-5 text-purple-600" />
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
              { key: 'sessionReminders', label: 'Session Reminders', desc: 'Upcoming tutoring sessions for your children' },
              { key: 'progressUpdates', label: 'Progress Updates', desc: 'Weekly and monthly progress reports' },
              { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Upcoming payment due dates' },
              { key: 'teacherMessages', label: 'Teacher Messages', desc: 'Direct messages from your children\'s teachers' },
              { key: 'assignmentDue', label: 'Assignment Due Dates', desc: 'When assignments are due or submitted' },
              { key: 'gradeUpdates', label: 'Grade Updates', desc: 'When new grades are posted' },
              { key: 'weeklyReports', label: 'Weekly Summary Reports', desc: 'Summary of your children\'s progress' }
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

      {/* Privacy & Communication */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Shield className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Privacy & Communication Settings</h2>
        </div>

        <div className="space-y-4">
          {[
            { 
              key: 'shareProgressWithTeachers', 
              label: 'Share Progress Between Teachers', 
              desc: 'Allow teachers to share your child\'s progress with other teachers' 
            },
            { 
              key: 'allowTeacherContact', 
              label: 'Allow Direct Teacher Contact', 
              desc: 'Teachers can contact you directly about your children' 
            },
            { 
              key: 'shareContactInfo', 
              label: 'Share Contact Information', 
              desc: 'Allow teachers to see your phone number for emergencies' 
            },
            { 
              key: 'dataSharing', 
              label: 'Anonymous Data Sharing', 
              desc: 'Help improve the platform by sharing anonymous usage data' 
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
      </Card>

      {/* Account Preferences */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Globe className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Account Preferences</h2>
        </div>


        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="language">Preferred Language</Label>
            <select 
              id="language"
              className="w-full border rounded-lg px-3 py-2"
              value={preferences.preferredLanguage}
              onChange={(e) => setPreferences({...preferences, preferredLanguage: e.target.value})}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Chinese</option>
            </select>
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select 
              id="timezone"
              className="w-full border rounded-lg px-3 py-2"
              value={preferences.timezone}
              onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
            >
              <option>UTC-6 (CST)</option>
              <option>UTC-5 (EST)</option>
              <option>UTC-7 (MST)</option>
              <option>UTC-8 (PST)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select 
              id="currency"
              className="w-full border rounded-lg px-3 py-2"
              value={preferences.currency}
              onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
            </select>
          </div>
          <div>
            <Label htmlFor="reminderTime">Session Reminder Time</Label>
            <select 
              id="reminderTime"
              className="w-full border rounded-lg px-3 py-2"
              value={preferences.sessionRemindersTime}
              onChange={(e) => setPreferences({...preferences, sessionRemindersTime: e.target.value})}
            >
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Lock className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Security Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input 
                id="currentPassword" 
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                autoComplete="current-password"
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
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword" 
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>
          <Button variant="outline" className="mt-4">
            <Lock className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </div>
      </Card>

      {/* Payment & Billing */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <CreditCard className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Payment & Billing</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium">•••• •••• •••• 4532</p>
                <p className="text-sm text-gray-600">Expires 12/26</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Primary</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="billingEmail">Billing Email</Label>
              <Input 
                id="billingEmail" 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="billingFrequency">Billing Frequency</Label>
              <select className="w-full border rounded-lg px-3 py-2">
                <option>Pay per session</option>
                <option>Weekly billing</option>
                <option>Monthly billing</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline">
              Add Payment Method
            </Button>
            <Button variant="outline">
              View Billing History
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}