# Storage Bucket MIME Type Fix

The upload error shows: **"mime type text/plain is not supported"**

This means your storage buckets have MIME type restrictions. Here's how to fix it:

## Method 1: Remove MIME Type Restrictions (Recommended)

### Step 1: Go to Storage → Buckets
1. Open your Supabase Dashboard
2. Click **Storage** → **Buckets**

### Step 2: Edit Each Bucket
For each bucket (`materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`):

1. **Click on the bucket name**
2. **Scroll down to "File size limit" and "Allowed MIME types"**
3. **Clear the "Allowed MIME types" field** (make it empty)
4. **Set file size limit** to `100 MB` or higher
5. **Click "Save"**

### Step 3: Make Buckets Public (Temporary)
1. **Toggle "Public bucket" to ON**
2. **Click "Save"**

## Method 2: Add Specific MIME Types

If you want to keep restrictions, add these MIME types:

### For `materials-images`:
```
image/jpeg,image/png,image/gif,image/webp,image/svg+xml
```

### For `materials-pdfs`:
```
application/pdf
```

### For `materials-videos`:
```
video/mp4,video/avi,video/mov,video/quicktime,video/x-msvideo
```

### For `materials-other`:
```
application/pdf,image/jpeg,image/png,image/gif,image/webp,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,audio/mpeg,audio/wav
```

## Test the Fix

After updating the buckets:

1. **Refresh your browser**
2. **Go to Materials Library**
3. **Click "Test File Upload"** in the debug section
4. **Check if it works without errors**

## Expected Results

You should see:
- ✅ Test upload successful
- ✅ No more MIME type errors
- ✅ Upload buttons working
- ✅ Files appearing in materials list

## If You Still Get Errors

### Check Bucket Configuration:
1. **Verify buckets exist**
2. **Check file size limits are reasonable**
3. **Ensure MIME types are either empty or include your file types**
4. **Make sure buckets are public** (for testing)

### Try Different File Types:
- **Small image file** (.jpg, .png)
- **PDF file** (.pdf)
- **Document file** (.docx, .pptx)

The **Method 1 (Remove MIME restrictions)** is the fastest way to test if uploads work. Once confirmed working, you can add specific MIME type restrictions for security.





