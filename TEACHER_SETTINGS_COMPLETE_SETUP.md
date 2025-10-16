# Teacher Settings Complete Setup Guide

## 🎯 Overview
This guide provides step-by-step instructions to set up the Teacher Settings system with your existing SomaTogether.ai database schema, avoiding conflicts and ensuring proper integration.

## 📋 Prerequisites
- Supabase project with existing schema
- Admin access to Supabase Dashboard
- SQL editor access in Supabase

## 🗄️ Step 1: Database Schema Setup

### Run the Integrated Schema
Execute the `teacher-settings-integrated-schema.sql` file in your Supabase SQL editor:

1. **Open Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content** of `teacher-settings-integrated-schema.sql`
4. **Click "Run"**

This will:
- ✅ Enhance your existing `teachers` table with new columns
- ✅ Create new tables for teacher settings
- ✅ Set up RLS policies for security
- ✅ Create helper functions
- ✅ Add performance indexes

## 📁 Step 2: Storage Bucket Setup

### Create Storage Bucket
1. **Go to Supabase Dashboard → Storage**
2. **Click "New Bucket"**
3. **Configure the bucket:**
   - **Name**: `teacher-documents`
   - **Public**: `true` (checked)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: `image/*, application/pdf`

### Set Up Storage Policies
Execute the `teacher-storage-policies.sql` file in your Supabase SQL editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view public teacher documents" ON storage.objects;

-- Create new policies
CREATE POLICY "Teachers can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teacher-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teacher-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers can update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'teacher-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teacher-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view public teacher documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teacher-documents' AND
    (
      (storage.foldername(name))[2] IN ('profile_image', 'cover_image') OR
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );
```

## ✅ Step 3: Verification

### Verify Database Setup
Run these queries to ensure everything was created correctly:

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

### Verify Storage Setup
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'teacher-documents';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

## 🧪 Step 4: Testing

### Test Profile Image Upload
1. **Navigate to Teacher Settings** in your app
2. **Go to Profile tab**
3. **Click "Upload Photo"**
4. **Select an image file**
5. **Verify upload succeeds**

### Test Cover Image Upload
1. **In the same Profile tab**
2. **Click "Upload Cover"**
3. **Select an image file**
4. **Verify upload succeeds**

### Test Settings Save
1. **Go to Preferences tab**
2. **Make some changes**
3. **Click "Save Preferences"**
4. **Verify changes are saved**

## 🔧 Step 5: Frontend Integration

The frontend components are already integrated in your app:

### Files Already Created
- ✅ `src/components/teacher/TeacherSettings.tsx`
- ✅ `src/services/teacherSettingsService.ts`
- ✅ `src/hooks/useTeacherSettings.ts`

### Navigation Already Set Up
- ✅ Teacher Settings accessible via sidebar
- ✅ Integrated in App.tsx routing
- ✅ Settings link in teacher navigation

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Issue 1: "new row violates row-level security policy"
**Solution**: Run the storage policies SQL script above.

#### Issue 2: "bucket does not exist"
**Solution**: Create the `teacher-documents` bucket in Supabase Dashboard.

#### Issue 3: "function does not exist"
**Solution**: Re-run the `teacher-settings-integrated-schema.sql` script.

#### Issue 4: "column does not exist"
**Solution**: The schema script uses `IF NOT EXISTS` checks, but if you still get this error, manually add the missing columns:

```sql
-- Add missing columns manually if needed
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_philosophy text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[];
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}'::jsonb;
```

#### Issue 5: "foreign key constraint fails"
**Solution**: Ensure all referenced tables exist and have the correct structure.

### Debug Queries

```sql
-- Check if user is authenticated
SELECT auth.uid();

-- Check user role
SELECT role FROM public.profiles WHERE id = auth.uid();

-- Check teacher record
SELECT * FROM public.teachers WHERE id = auth.uid();

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'teacher-documents';

-- Check storage policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 📊 What's Included

### Database Tables Created
1. **`teacher_documents`** - File uploads and verification documents
2. **`teacher_preferences`** - Comprehensive settings and preferences
3. **`teacher_subjects`** - Enhanced subject management with proficiency
4. **`teacher_skills`** - Skills and certifications tracking
5. **`teacher_schedule_templates`** - Reusable schedule configurations
6. **`teacher_time_off`** - Time off management
7. **`teacher_metrics`** - Performance and analytics data

### Enhanced Existing Tables
- **`teachers`** table enhanced with 8 new columns for profile management

### Security Features
- **Row Level Security (RLS)** on all new tables
- **Storage policies** for secure file uploads
- **User-specific access control**
- **Admin override capabilities**

### Helper Functions
- **`create_teacher_preferences()`** - Initialize default preferences
- **`update_teacher_profile()`** - Update teacher profile data
- **`get_teacher_dashboard_data()`** - Get comprehensive dashboard data
- **`upload_teacher_document()`** - Handle file uploads with database updates

## 🎉 Success Checklist

After completing the setup, you should have:

- [ ] All database tables created successfully
- [ ] Teacher table enhanced with new columns
- [ ] Storage bucket created and configured
- [ ] Storage policies applied
- [ ] RLS policies working correctly
- [ ] Helper functions available
- [ ] Profile image upload working
- [ ] Cover image upload working
- [ ] Settings save functionality working
- [ ] No console errors in browser
- [ ] Files appearing in storage bucket
- [ ] Database records being created

## 🚀 Next Steps

Once the setup is complete:

1. **Test all functionality** thoroughly
2. **Train your team** on the new features
3. **Monitor usage** and performance
4. **Gather user feedback** for improvements
5. **Consider additional features** like:
   - Schedule template management
   - Advanced analytics
   - Bulk document uploads
   - Document verification workflow

## 📞 Support

If you encounter any issues:

1. **Check the troubleshooting section** above
2. **Review the console logs** for specific errors
3. **Verify all setup steps** were completed
4. **Check Supabase logs** for database errors
5. **Test with a simple policy** first if RLS is causing issues

The Teacher Settings system is now ready for production use! 🎉
