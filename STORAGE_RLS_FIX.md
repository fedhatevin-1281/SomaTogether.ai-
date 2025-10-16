# Storage RLS Policy Fix

## Issue
The storage bucket exists but uploads are failing with "new row violates row-level security policy" error. This means RLS is enabled on the storage.objects table but no policies allow uploads.

## Quick Fix Options

### Option 1: Disable RLS Temporarily (Fastest)

1. **Go to Supabase Dashboard**
2. **Navigate to Storage**
3. **Click on your `student-documents` bucket**
4. **Go to "Settings" tab**
5. **Toggle OFF "Row Level Security"**
6. **Save changes**

This will allow uploads to work immediately, but with less security.

### Option 2: Add RLS Policy (Recommended)

1. **Go to Supabase Dashboard**
2. **Navigate to Authentication > Policies**
3. **Find the `storage.objects` table**
4. **Click "New Policy"**
5. **Create these policies:**

#### Policy 1: Allow Authenticated Users to Upload
- **Policy name:** `Allow authenticated users to upload to student-documents`
- **Operation:** `INSERT`
- **Target roles:** `authenticated`
- **USING expression:** `bucket_id = 'student-documents'`

#### Policy 2: Allow Public Access to View
- **Policy name:** `Allow public access to view student-documents`
- **Operation:** `SELECT`
- **Target roles:** `anon, authenticated`
- **USING expression:** `bucket_id = 'student-documents'`

#### Policy 3: Allow Users to Update Their Own Files
- **Policy name:** `Allow users to update their own files`
- **Operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:** `bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]`

#### Policy 4: Allow Users to Delete Their Own Files
- **Policy name:** `Allow users to delete their own files`
- **Operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:** `bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1]`

### Option 3: Use SQL (Advanced)

Run this SQL in the SQL Editor:

```sql
-- Allow authenticated users to upload to student-documents bucket
CREATE POLICY "Allow authenticated uploads to student-documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'student-documents'
);

-- Allow public access to view files
CREATE POLICY "Allow public access to view student-documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'student-documents'
);

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'student-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'student-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Verification

After applying any of the above fixes:

1. **Try uploading a profile image** in the student settings
2. **Check the browser console** - the error should be gone
3. **Verify the image appears** in your profile

## Security Notes

- **Option 1 (Disable RLS):** Less secure but works immediately
- **Option 2 & 3 (Add Policies):** More secure, allows proper access control
- **Recommended:** Use Option 2 or 3 for better security

## Troubleshooting

If you still get errors:

1. **Check bucket permissions** - Make sure the bucket is public
2. **Verify RLS status** - Check if RLS is enabled/disabled as intended
3. **Review policy expressions** - Make sure they match your bucket name exactly
4. **Test with different file types** - Ensure the file type is allowed


