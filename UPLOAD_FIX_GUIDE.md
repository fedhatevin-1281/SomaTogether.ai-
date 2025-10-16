# Upload Buttons Fix Guide

## Issues Identified from Console Errors:

1. **Database Relationship Errors (PGRST201)** ✅ **FIXED**
   - Fixed foreign key relationships in TeacherService queries
   - Added explicit relationship specifications

2. **Storage Upload Permission Errors (400 Bad Request)** ❌ **NEEDS FIXING**
   - Missing or incorrect RLS policies for storage buckets

## Step-by-Step Fix:

### Step 1: Fix Database Issues ✅ (Already Done)
The database relationship errors have been fixed by updating the TeacherService queries.

### Step 2: Fix Storage Policies ❌ (You Need to Do This)

**Run this SQL script in your Supabase SQL Editor:**

```sql
-- Copy and paste the contents of setup-storage-policies.sql
-- This creates all the necessary RLS policies for your storage buckets
```

**Or manually create policies in Supabase Dashboard:**

1. Go to **Storage** → **Policies**
2. For each bucket (`materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`):
   - Create **INSERT** policy: "Teachers can upload"
   - Create **SELECT** policy: "Users can view" 
   - Create **UPDATE** policy: "Teachers can update"
   - Create **DELETE** policy: "Teachers can delete"

### Step 3: Test the Fix

1. **Refresh your browser** to clear any cached errors
2. Go to **Materials Library** in your teacher dashboard
3. Look at the **Debug Information** section at the bottom
4. Click **"Test File Upload"** button
5. Check the console for detailed error messages

### Step 4: Verify Everything Works

The debug component should show:
- ✅ User Authenticated: Yes
- ✅ Supabase Connected: Yes  
- ✅ All buckets exist
- ✅ All tables exist
- ✅ Test upload successful

### Step 5: Test Real Upload

Once the test upload works:
1. Click any **"Upload Material"** button
2. Select a file (PDF, image, or video)
3. Fill in the required fields (Title, Subject)
4. Click **Upload**

## Common Issues & Solutions:

### If you still get 400 errors:
- **Check bucket names** - they must be exactly: `materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`
- **Verify RLS policies** - run the SQL script I provided
- **Check user authentication** - make sure you're logged in as a teacher

### If you get "bucket not found" errors:
- **Create the missing buckets** in Supabase Dashboard → Storage
- **Set them as private** (not public)
- **Add the RLS policies** using the SQL script

### If uploads work but don't appear in the list:
- **Check database tables** - run the SQL from `MATERIALS_UPLOAD_SETUP.md`
- **Verify material_library table** exists and has correct structure

## Quick Test Commands:

**Check if buckets exist:**
```sql
SELECT name, public FROM storage.buckets WHERE name LIKE 'materials-%';
```

**Check if policies exist:**
```sql
SELECT id, bucket_id, name, command FROM storage.policies WHERE bucket_id LIKE 'materials-%';
```

**Check if tables exist:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_name IN ('materials_library', 'material_categories');
```

## Expected Result:

After fixing the storage policies, you should see:
- ✅ No more 400 errors in console
- ✅ Debug component shows all green checkmarks
- ✅ Test upload works successfully
- ✅ Real upload buttons work
- ✅ Files appear in the materials list

The main issue is the **missing storage RLS policies**. Once you run the SQL script I provided, the uploads should work perfectly! 🚀





