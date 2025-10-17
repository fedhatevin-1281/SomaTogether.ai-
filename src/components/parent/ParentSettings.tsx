import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';

export function ParentSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Jennifer',
    lastName: 'Thompson',
    email: 'jennifer.thompson@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Oak Street, Springfield, IL 62701',
    emergencyContact: 'Michael Thompson - +1 (555) 987-6543',
    relationship: 'Mother',
    occupation: 'Marketing Manager'
  });

  const [children, setChildren] = useState([
    {
      id: 1,
      name: 'Alex Thompson',
      age: 16,
      grade: '10th Grade',
      school: 'Springfield High School',
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      primaryTeacher: 'Dr. Sarah Johnson'
    },
    {
      id: 2,
      name: 'Emma Thompson',
      age: 14,
      grade: '8th Grade', 
      school: 'Springfield Middle School',
      subjects: ['Algebra', 'English', 'History'],
      primaryTeacher: 'Mr. David Wilson'
    }
  ]);

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
    timezone: 'UTC-6 (CST)',
    currency: 'USD',
    sessionRemindersTime: '15',
    reportFrequency: 'weekly',
    communicationMethod: 'email'
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Parent Settings</h1>
          <p className="text-gray-600">Manage your account and children's educational preferences</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
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
              <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=96&h=96&fit=crop&crop=face" 
                   alt="Profile" className="w-full h-full object-cover" />
            </Avatar>
            <Button size="sm" className="absolute -bottom-2 -right-2 p-1 rounded-full bg-purple-600 hover:bg-purple-700">
              <Camera className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <Badge className="bg-purple-100 text-purple-800">Parent Account</Badge>
              <Badge className="bg-green-100 text-green-800">2 Active Children</Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>Member since Jan 2023</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>5 Active Tutoring Sessions</span>
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
          <Button variant="outline" className="text-purple-600 border-purple-200">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>

        <div className="space-y-4">
          {children.map((child) => (
            <div key={child.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <img src={`https://images.unsplash.com/photo-${child.id === 1 ? '1507003211169-0a1dd7243a33' : '1494790108755-2616b612b786'}?w=48&h=48&fit=crop&crop=face`} 
                         alt={child.name} className="w-full h-full object-cover" />
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{child.name}</h3>
                    <p className="text-sm text-gray-600">{child.age} years old • {child.grade}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium text-gray-500">School</Label>
                  <p>{child.school}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Primary Teacher</Label>
                  <p>{child.primaryTeacher}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-gray-500">Current Subjects</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {child.subjects.map((subject, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

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