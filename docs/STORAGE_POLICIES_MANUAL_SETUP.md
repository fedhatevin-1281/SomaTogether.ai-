# Manual Storage Policies Setup

The `storage.policies` table doesn't exist in your Supabase setup, so we need to create the policies manually through the Dashboard.

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Go to Storage → Policies
1. Open your Supabase Dashboard
2. Go to **Storage** in the left sidebar
3. Click on **Policies**

### Step 2: Create Policies for Each Bucket

For each bucket (`materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`):

#### Upload Policy (INSERT)
1. Click **"New Policy"**
2. **Policy Name**: "Teachers can upload [bucket-type]"
3. **Allowed Operation**: `INSERT`
4. **Target Roles**: `authenticated`
5. **Policy Definition**:
   ```sql
   true
   ```
6. **With Check Expression**:
   ```sql
   auth.uid() IN (SELECT id FROM public.teachers WHERE id = auth.uid())
   ```

#### View Policy (SELECT)
1. Click **"New Policy"**
2. **Policy Name**: "Users can view [bucket-type]"
3. **Allowed Operation**: `SELECT`
4. **Target Roles**: `authenticated`
5. **Policy Definition**:
   ```sql
   true
   ```

#### Update Policy (UPDATE)
1. Click **"New Policy"**
2. **Policy Name**: "Teachers can update [bucket-type]"
3. **Allowed Operation**: `UPDATE`
4. **Target Roles**: `authenticated`
5. **Policy Definition**:
   ```sql
   true
   ```

#### Delete Policy (DELETE)
1. Click **"New Policy"**
2. **Policy Name**: "Teachers can delete [bucket-type]"
3. **Allowed Operation**: `DELETE`
4. **Target Roles**: `authenticated`
5. **Policy Definition**:
   ```sql
   true
   ```

### Step 3: Repeat for All Buckets
Create the same 4 policies for each of these buckets:
- `materials-videos`
- `materials-pdfs`
- `materials-images`
- `materials-other`

## Method 2: Simplified SQL Approach

If you prefer SQL, try this simpler approach that might work:

```sql
-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated');
```

## Method 3: Make Buckets Public (Quick Fix)

If you want to test quickly, you can temporarily make the buckets public:

1. Go to **Storage** → **Buckets**
2. Click on each bucket (`materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`)
3. Toggle **"Public bucket"** to ON
4. Click **Save**

⚠️ **Warning**: This makes files publicly accessible. Only use for testing!

## Test the Fix

After setting up the policies:

1. **Refresh your browser**
2. Go to **Materials Library**
3. Look at the **Debug Information** section
4. Click **"Test File Upload"**
5. Check if the upload works

## Expected Result

You should see:
- ✅ Test upload successful
- ✅ No more 400 errors
- ✅ Upload buttons working
- ✅ Files appearing in the materials list

## Troubleshooting

### If uploads still don't work:
1. **Check bucket names** - they must be exactly: `materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`
2. **Verify you're logged in** as a teacher
3. **Check browser console** for specific error messages
4. **Try Method 3** (make buckets public) as a quick test

### If you get "bucket not found" errors:
1. **Create the missing buckets** in Storage → Buckets
2. **Set them as private** (not public)
3. **Add the policies** using Method 1 or 2

The key is getting the storage policies set up correctly. Method 1 (Dashboard) is usually the most reliable approach.





