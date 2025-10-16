# Storage Bucket Setup Guide

## Issue
The profile image upload is failing with "Bucket not found" error because the Supabase storage buckets haven't been created yet, or there was a duplicate key error when trying to create existing buckets.

## Solution

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project dashboard
   - Click on "Storage" in the left sidebar

2. **Create Storage Buckets**
   - Click "New bucket"
   - Create the following buckets:

   **student-documents**
   - Name: `student-documents`
   - Public: ✅ Yes
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

   **teacher-documents**
   - Name: `teacher-documents`
   - Public: ✅ Yes
   - File size limit: `10485760` (10MB)
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

   **class-materials**
   - Name: `class-materials`
   - Public: ✅ Yes
   - File size limit: `52428800` (50MB)
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, video/mp4, video/quicktime, audio/mpeg, audio/wav`

3. **Set up Row Level Security (RLS) Policies**
   - Go to "Authentication" > "Policies"
   - Click on "storage.objects" table
   - Add the following policies manually:

   **Policy 1: Students can upload profile images**
   - Policy name: `Students can upload their own profile images`
   - Operation: `INSERT`
   - Target roles: `authenticated`
   - USING expression: `bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]`

   **Policy 2: Students can view profile images**
   - Policy name: `Students can view their own profile images`
   - Operation: `SELECT`
   - Target roles: `authenticated`
   - USING expression: `bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]`

   **Policy 3: Public access for profile images**
   - Policy name: `Public access for profile images`
   - Operation: `SELECT`
   - Target roles: `anon, authenticated`
   - USING expression: `bucket_id = 'student-documents'`

### Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Run the SQL script**
   ```bash
   supabase db reset
   # Then run the setup-storage-buckets.sql file
   ```

### Option 3: Using SQL Editor (Buckets Only)

1. **Go to SQL Editor** in Supabase Dashboard
2. **Copy and paste** the contents of `setup-storage-buckets-simple.sql`
3. **Run the script**

**Note:** This simple script only creates the buckets without RLS policies to avoid permission issues. You'll need to set up the policies manually through the Dashboard.

### Option 4: Quick Fix (Just Create the Bucket)

If you just need to get the profile upload working quickly:

1. **Go to Supabase Dashboard > Storage**
2. **Click "New bucket"**
3. **Create bucket:**
   - Name: `student-documents`
   - Public: ✅ Yes
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`
4. **Click "Create bucket"**

That's it! The profile upload should work now. You can add security policies later if needed.

## Verification

After setting up the buckets, you can verify they exist by:

1. Going to Storage in your Supabase Dashboard
2. You should see the three buckets: `student-documents`, `teacher-documents`, and `class-materials`
3. Try uploading a profile image in the student settings

## Storage Policies

The setup includes proper Row Level Security (RLS) policies that ensure:

- **Students** can only upload/view/update/delete their own profile images
- **Teachers** can only upload/view/update/delete their own documents
- **Class materials** can be uploaded by teachers and viewed by students
- **Public access** is enabled for profile images and class materials

## File Organization

Files are organized in the following structure:

```
student-documents/
├── {student-id}/
│   └── profile/
│       └── {timestamp}.{extension}

teacher-documents/
├── {teacher-id}/
│   ├── profile/
│   ├── certificates/
│   └── documents/

class-materials/
├── {class-id}/
│   ├── assignments/
│   ├── resources/
│   └── recordings/
```

## Troubleshooting

If you still encounter issues:

1. **Check bucket permissions** - Ensure RLS policies are properly set
2. **Verify file types** - Make sure uploaded files match allowed MIME types
3. **Check file size** - Ensure files don't exceed the size limits
4. **Review console logs** - Check browser console for detailed error messages

## Support

If you need help setting up the storage buckets, please:
1. Check the Supabase documentation on Storage
2. Review the error messages in the browser console
3. Ensure your Supabase project has the necessary permissions
