# Fix Storage RLS Issue - Teacher Settings Upload

## Problem
Getting "new row violates row-level security policy during upload photo" error when trying to upload profile images in Teacher Settings.

## Solution Steps

### Step 1: Create Storage Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **"New Bucket"**
4. Set:
   - **Name**: `teacher-documents`
   - **Public**: `true` (checked)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: `image/*, application/pdf`

### Step 2: Run Storage Policies SQL
Execute the `teacher-storage-policies.sql` file in your Supabase SQL editor:

```sql
-- Enable RLS on storage.objects (if not already enabled)
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

### Step 3: Alternative Simplified Policies (if above doesn't work)
If the above policies still cause issues, use these simplified versions:

```sql
-- Simplified policies for testing
CREATE POLICY "Allow authenticated users to upload to teacher-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teacher-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to view teacher-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teacher-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to update teacher-documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'teacher-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to delete teacher-documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teacher-documents' AND
    auth.role() = 'authenticated'
  );
```

### Step 4: Verify Setup
Run these queries to verify everything is set up correctly:

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

### Step 5: Test Upload
1. Go to Teacher Settings in your app
2. Try uploading a profile image
3. Check browser console for any errors
4. Check Supabase Storage to see if file was uploaded

## Troubleshooting

### If you're still getting RLS errors:

1. **Check bucket exists**:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'teacher-documents';
   ```

2. **If bucket doesn't exist, create it**:
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('teacher-documents', 'teacher-documents', true);
   ```

3. **Check RLS status**:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

4. **If RLS is not enabled**:
   ```sql
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
   ```

5. **Check existing policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

6. **Drop all existing policies and recreate**:
   ```sql
   DROP POLICY IF EXISTS "policy_name" ON storage.objects;
   ```

7. **Test with a simple policy first**:
   ```sql
   CREATE POLICY "test_policy" ON storage.objects
   FOR ALL USING (auth.role() = 'authenticated');
   ```

8. **If still failing, temporarily disable RLS for testing**:
   ```sql
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   ```
   **⚠️ Remember to re-enable it after testing!**

## Common Issues

### Issue 1: "bucket does not exist"
**Solution**: Create the bucket in Supabase Dashboard or run the INSERT statement above.

### Issue 2: "permission denied for table storage.objects"
**Solution**: Make sure you're running the SQL as a user with appropriate permissions (usually the service role key).

### Issue 3: "policy already exists"
**Solution**: Drop the existing policy first before creating a new one.

### Issue 4: "RLS is disabled"
**Solution**: Enable RLS on the storage.objects table.

## Testing the Fix

After applying the policies:

1. **Test profile image upload**:
   - Go to Teacher Settings → Profile tab
   - Click "Upload Photo"
   - Select an image file
   - Should upload successfully

2. **Test cover image upload**:
   - Go to Teacher Settings → Profile tab
   - Click "Upload Cover"
   - Select an image file
   - Should upload successfully

3. **Check browser console**:
   - Should see successful upload messages
   - No RLS policy errors

4. **Check Supabase Storage**:
   - Files should appear in the `teacher-documents` bucket
   - Organized in folders by teacher ID and document type

## Security Notes

- The policies ensure teachers can only access their own documents
- Profile and cover images are publicly viewable (for display purposes)
- Other documents remain private to the teacher
- File uploads are validated for type and size
- All operations require authentication

If you continue to have issues, the problem might be with the Supabase configuration or authentication setup. Check that:
- The user is properly authenticated
- The user has the correct role (teacher)
- The Supabase client is configured correctly
- The storage bucket has the correct permissions
