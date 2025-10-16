# Quick Upload Fix - Dashboard Method

Since you can't modify the storage.objects table directly, let's use the Supabase Dashboard to fix the upload issue.

## Method 1: Make Buckets Public (Quickest Fix)

This is the fastest way to test if uploads work:

### Step 1: Go to Storage → Buckets
1. Open your Supabase Dashboard
2. Click **Storage** in the left sidebar
3. Click **Buckets**

### Step 2: Make Buckets Public
For each bucket (`materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`):
1. Click on the bucket name
2. Toggle **"Public bucket"** to **ON**
3. Click **Save**

⚠️ **Note**: This makes files publicly accessible, but it's the quickest way to test uploads.

## Method 2: Create Storage Policies via Dashboard

### Step 1: Go to Storage → Policies
1. In your Supabase Dashboard
2. Click **Storage** → **Policies**

### Step 2: Create Upload Policy
1. Click **"New Policy"**
2. **Policy Name**: "Allow authenticated uploads"
3. **Allowed Operation**: `INSERT`
4. **Target Roles**: `authenticated`
5. **Policy Definition**: `true`
6. **With Check Expression**: `auth.role() = 'authenticated'`
7. Click **Save**

### Step 3: Create Download Policy
1. Click **"New Policy"**
2. **Policy Name**: "Allow authenticated downloads"
3. **Allowed Operation**: `SELECT`
4. **Target Roles**: `authenticated`
5. **Policy Definition**: `true`
6. Click **Save**

### Step 4: Create Update Policy
1. Click **"New Policy"**
2. **Policy Name**: "Allow authenticated updates"
3. **Allowed Operation**: `UPDATE`
4. **Target Roles**: `authenticated`
5. **Policy Definition**: `true`
6. Click **Save**

### Step 5: Create Delete Policy
1. Click **"New Policy"**
2. **Policy Name**: "Allow authenticated deletes"
3. **Allowed Operation**: `DELETE`
4. **Target Roles**: `authenticated`
5. **Policy Definition**: `true`
6. Click **Save**

## Test the Fix

After setting up the policies (Method 1 or 2):

1. **Refresh your browser**
2. Go to **Materials Library**
3. Look at the **Debug Information** section
4. Click **"Test File Upload"**
5. Check if it works without errors

## Expected Results

You should see:
- ✅ Test upload successful
- ✅ No more 400 errors in console
- ✅ Upload buttons working
- ✅ Files appearing in materials list

## If You Still Get Errors

Try this alternative approach:

### Method 3: Check Bucket Configuration
1. Go to **Storage** → **Buckets**
2. Click on each bucket
3. Make sure:
   - Bucket exists
   - File size limit is set (e.g., 100MB)
   - Allowed MIME types include your file types

### Method 4: Test with Different File Types
Try uploading different file types:
- Small text file (.txt)
- Image file (.jpg, .png)
- PDF file (.pdf)

## Troubleshooting

### If uploads work but files don't appear in the list:
1. **Check database tables** - run the SQL from `MATERIALS_UPLOAD_SETUP.md`
2. **Verify material_library table** exists

### If you get "bucket not found" errors:
1. **Create missing buckets** in Storage → Buckets
2. **Set appropriate file size limits**
3. **Add allowed MIME types**

The **Method 1 (Make Buckets Public)** is the quickest way to test if the upload functionality works. Once you confirm it works, you can then set up proper security policies using Method 2.





