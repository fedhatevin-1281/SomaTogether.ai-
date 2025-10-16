# Teacher Settings System Setup Guide

## Overview

This guide provides comprehensive instructions for setting up the Teacher Settings system for SomaTogether.ai. The system includes profile management, document uploads, preferences configuration, and skill management.

## 🗄️ Database Schema Setup

### Step 1: Run the Schema Script

Execute the `teacher-settings-schema.sql` file in your Supabase SQL editor:

```sql
-- Copy and paste the entire content of teacher-settings-schema.sql
-- This will create all necessary tables, functions, and policies
```

### Step 2: Verify Schema Creation

Run these verification queries to ensure everything was created correctly:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'teacher_documents', 'teacher_preferences', 'teacher_subjects', 
  'teacher_skills', 'teacher_schedule_templates', 'teacher_time_off', 'teacher_metrics'
);

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'create_teacher_preferences', 'update_teacher_profile', 
  'get_teacher_dashboard_data', 'upload_teacher_document'
);

-- Check teacher table enhancements
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
AND column_name IN (
  'profile_image_url', 'cover_image_url', 'teaching_philosophy', 
  'certifications', 'languages', 'social_links', 'timezone', 'notification_preferences'
);
```

## 📁 Storage Setup

### Step 3: Create Storage Bucket

Create a new storage bucket for teacher documents:

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `teacher-documents`
4. Make it public: `true`
5. File size limit: `50MB`
6. Allowed MIME types: `image/*, application/pdf`

### Step 4: Configure Storage Policies

Run these policies to allow teachers to upload and manage their documents:

```sql
-- Allow teachers to upload their own documents
CREATE POLICY "Teachers can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teacher-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow teachers to view their own documents
CREATE POLICY "Teachers can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teacher-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow teachers to update their own documents
CREATE POLICY "Teachers can update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'teacher-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow teachers to delete their own documents
CREATE POLICY "Teachers can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teacher-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 🎯 Frontend Integration

### Step 5: Add Settings to Teacher Dashboard

Update your teacher dashboard to include the settings component:

```tsx
// In your teacher dashboard component
import { TeacherSettings } from '../components/teacher/TeacherSettings';

// Add to your navigation or routing
<Route path="/teacher/settings" element={<TeacherSettings />} />
```

### Step 6: Update Navigation

Add settings link to your teacher navigation:

```tsx
// Example navigation item
<NavItem href="/teacher/settings">
  <Settings className="h-4 w-4" />
  Settings
</NavItem>
```

## 🔧 Component Usage

### Basic Usage

```tsx
import { TeacherSettings } from '../components/teacher/TeacherSettings';
import { useAuth } from '../contexts/AuthContext';

function TeacherDashboard() {
  const { user } = useAuth();
  
  if (!user) return <div>Please log in</div>;
  
  return (
    <div>
      <TeacherSettings />
    </div>
  );
}
```

### Using the Hook

```tsx
import { useTeacherSettings } from '../hooks/useTeacherSettings';

function CustomTeacherComponent() {
  const {
    profile,
    preferences,
    loading,
    updateProfile,
    uploadDocument
  } = useTeacherSettings(userId);
  
  // Use the data and functions
}
```

## 📋 Features Overview

### 1. Profile Management
- **Profile Image Upload**: Upload and manage profile pictures
- **Cover Image Upload**: Set cover images for profile
- **Basic Information**: Hourly rate, experience, philosophy
- **Specialties**: Add and manage teaching specialties
- **Education**: Track educational qualifications
- **Languages**: Manage spoken languages

### 2. Preferences Configuration
- **Teaching Preferences**: Class duration, max students, auto-accept
- **Notification Settings**: Email, SMS, push notifications
- **Availability**: Timezone, working hours
- **Payment Preferences**: Preferred payment methods
- **Privacy Settings**: Profile visibility, contact info display

### 3. Subject Management
- **Add Subjects**: Select from available subjects
- **Proficiency Levels**: Set expertise level for each subject
- **Primary Subjects**: Mark main teaching areas
- **Experience Tracking**: Years of experience per subject

### 4. Skills & Certifications
- **Skill Addition**: Add custom skills and competencies
- **Certification Tracking**: Mark certified skills
- **Proficiency Levels**: Beginner to expert levels
- **Category Organization**: Organize skills by category

### 5. Document Management
- **Verification Documents**: Upload certificates, diplomas
- **ID Verification**: Upload identification documents
- **Background Checks**: Manage verification documents
- **Portfolio Items**: Showcase teaching materials

## 🔒 Security Features

### Row Level Security (RLS)
- Teachers can only access their own data
- Admins can view verification documents
- Public access to subjects and skills for discovery

### File Upload Security
- File type validation
- Size limits (50MB max)
- Secure storage with user-specific folders
- Automatic thumbnail generation for images

## 📊 Data Flow

### Profile Update Flow
1. User updates form data
2. `updateProfile()` called with changes
3. RPC function `update_teacher_profile()` executed
4. Database updated with new information
5. UI refreshed with updated data

### Document Upload Flow
1. User selects file
2. File uploaded to Supabase Storage
3. Document record created in `teacher_documents` table
4. Profile URLs updated if profile/cover image
5. UI updated with new image URLs

## 🚀 Advanced Features

### Dashboard Integration
The system provides a comprehensive dashboard data function:

```sql
SELECT * FROM get_teacher_dashboard_data('teacher-uuid');
```

This returns:
- Teacher profile information
- Preferences and settings
- Performance metrics
- Subject and skill lists

### Schedule Management
- Template-based scheduling
- Time off management
- Availability tracking
- Recurring schedule patterns

### Performance Analytics
- Session metrics
- Rating tracking
- Earnings analytics
- Student engagement data

## 🛠️ Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check storage bucket permissions
   - Verify file size limits
   - Ensure correct MIME types

2. **Permission Errors**
   - Verify RLS policies are active
   - Check user authentication
   - Ensure proper role assignments

3. **Data Not Loading**
   - Check database connections
   - Verify RPC function existence
   - Review error logs in browser console

### Debug Queries

```sql
-- Check teacher data
SELECT * FROM teachers WHERE id = 'your-teacher-id';

-- Check preferences
SELECT * FROM teacher_preferences WHERE teacher_id = 'your-teacher-id';

-- Check documents
SELECT * FROM teacher_documents WHERE teacher_id = 'your-teacher-id';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'teacher_documents';
```

## 📈 Performance Optimization

### Database Indexes
The schema includes optimized indexes for:
- Teacher ID lookups
- Document type filtering
- Date-based queries
- Performance metrics

### Caching Strategy
- Profile data cached in component state
- Preferences loaded once per session
- Document URLs cached for performance

### File Optimization
- Automatic image compression
- Thumbnail generation
- CDN distribution via Supabase

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Storage Usage**: Check bucket sizes
2. **Review Performance**: Monitor query performance
3. **Update Policies**: Review and update RLS policies
4. **Backup Data**: Regular database backups

### Scaling Considerations
- Storage bucket organization by date
- Database partitioning for large datasets
- CDN integration for global file delivery
- Caching layer for frequently accessed data

## 📝 API Reference

### Service Methods

```typescript
// Profile management
TeacherSettingsService.getTeacherProfile(teacherId: string)
TeacherSettingsService.updateTeacherProfile(teacherId: string, data: Partial<TeacherProfile>)

// Document management
TeacherSettingsService.uploadDocument(teacherId: string, file: File, type: string)
TeacherSettingsService.getTeacherDocuments(teacherId: string, type?: string)

// Preferences
TeacherSettingsService.getTeacherPreferences(teacherId: string)
TeacherSettingsService.updateTeacherPreferences(teacherId: string, data: Partial<TeacherPreferences>)

// Subjects and skills
TeacherSettingsService.getTeacherSubjects(teacherId: string)
TeacherSettingsService.addTeacherSubject(teacherId: string, subjectId: string, ...)
TeacherSettingsService.getTeacherSkills(teacherId: string)
TeacherSettingsService.addTeacherSkill(teacherId: string, skillData: ...)
```

## 🎉 Success Metrics

After successful implementation, you should have:

✅ **Complete Profile Management**
- Profile and cover image uploads
- Comprehensive teacher information
- Specialties and education tracking

✅ **Flexible Preferences**
- Teaching and notification preferences
- Privacy and visibility controls
- Payment and availability settings

✅ **Subject & Skill Management**
- Dynamic subject assignment
- Skill tracking with proficiency levels
- Certification management

✅ **Document Verification**
- Secure document uploads
- Verification status tracking
- Portfolio management

✅ **Performance Analytics**
- Comprehensive dashboard data
- Metrics and analytics tracking
- Performance insights

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the database logs in Supabase
3. Check browser console for frontend errors
4. Verify all setup steps were completed

The Teacher Settings system is now ready to provide a comprehensive profile management experience for your teachers!
