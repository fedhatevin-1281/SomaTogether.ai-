# Final Storage Fix - RLS Policy Issue

The error shows: **"new row violates row-level security policy"**

This means your storage buckets have RLS enabled but no policies to allow uploads.

## Quick Fix: Make Buckets Public

### Step 1: Go to Storage → Buckets
1. Open your Supabase Dashboard
2. Click **Storage** → **Buckets**

### Step 2: Configure Each Bucket
For each bucket (`materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`):

1. **Click on the bucket name**
2. **Toggle "Public bucket" to ON**
3. **Clear "Allowed MIME types"** (make it empty)
4. **Set file size limit** to `100 MB`
5. **Click "Save"**

## Alternative: Create Storage Policies

If you want to keep buckets private, create policies:

### Step 1: Go to Storage → Policies
1. Click **Storage** → **Policies**

### Step 2: Create Upload Policy
1. **Click "New Policy"**
2. **Policy Name**: "Allow authenticated uploads"
3. **Allowed Operation**: `INSERT`
4. **Target Roles**: `authenticated`
5. **Policy Definition**: `true`
6. **With Check Expression**: `auth.role() = 'authenticated'`
7. **Click "Save"**

### Step 3: Create Download Policy
1. **Click "New Policy"**
2. **Policy Name**: "Allow authenticated downloads"
3. **Allowed Operation**: `SELECT`
4. **Target Roles**: `authenticated`
5. **Policy Definition**: `true`
6. **Click "Save"**

### Step 4: Create Update Policy
1. **Click "New Policy"**
2. **Policy Name**: "Allow authenticated updates"
3. **Allowed Operation**: `UPDATE`
4. **Target Roles**: `authenticated`
5. **Policy Definition**: `true`
6. **Click "Save"**

### Step 5: Create Delete Policy
1. **Click "New Policy"**
2. **Policy Name**: "Allow authenticated deletes"
3. **Allowed Operation**: `DELETE`
4. **Target Roles**: `authenticated`
5. **Policy Definition**: `true`
6. **Click "Save"**

## Test the Fix

After configuring buckets:

1. **Refresh your browser**
2. **Go to Materials Library**
3. **Click "Test File Upload"** in the debug section
4. **Check if it works without errors**

## Expected Results

You should see:
- ✅ Test upload successful
- ✅ No more RLS policy errors
- ✅ Upload buttons working
- ✅ Files appearing in materials list

**Recommendation**: Use the **Quick Fix (Make Buckets Public)** first to test if uploads work, then set up proper policies later for security.





