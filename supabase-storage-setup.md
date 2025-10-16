# Supabase Storage Setup for Materials Library

## 1. Create Storage Buckets

Go to your Supabase Dashboard → Storage and create the following buckets:

### Bucket: `materials-videos`
- **Purpose**: Store video files (MP4, AVI, MOV, etc.)
- **Settings**:
  - Public: `false` (private bucket)
  - File size limit: `500MB` (adjust based on your needs)
  - Allowed MIME types: `video/*`

### Bucket: `materials-pdfs`
- **Purpose**: Store PDF documents
- **Settings**:
  - Public: `false` (private bucket)
  - File size limit: `50MB`
  - Allowed MIME types: `application/pdf`

### Bucket: `materials-images`
- **Purpose**: Store images (JPG, PNG, GIF, etc.)
- **Settings**:
  - Public: `false` (private bucket)
  - File size limit: `10MB`
  - Allowed MIME types: `image/*`

### Bucket: `materials-other`
- **Purpose**: Store other file types (documents, audio, etc.)
- **Settings**:
  - Public: `false` (private bucket)
  - File size limit: `100MB`
  - Allowed MIME types: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `audio/*`, etc.

## 2. Storage Policies

For each bucket, create the following RLS policies:

### Upload Policy (INSERT)
```sql
-- Policy Name: "Teachers can upload materials"
-- Operation: INSERT
-- Target roles: authenticated
-- USING expression: true
-- WITH CHECK expression: 
auth.uid() IN (
  SELECT id FROM public.teachers WHERE id = auth.uid()
)
```

### Download Policy (SELECT)
```sql
-- Policy Name: "Users can view materials"
-- Operation: SELECT  
-- Target roles: authenticated
-- USING expression: true
```

### Update Policy (UPDATE)
```sql
-- Policy Name: "Teachers can update their own materials"
-- Operation: UPDATE
-- Target roles: authenticated
-- USING expression: 
auth.uid() IN (
  SELECT teacher_id FROM public.materials_library 
  WHERE bucket_name = (SELECT bucket_name FROM public.materials_library WHERE file_path = (SELECT file_path FROM storage.objects WHERE id = (SELECT id FROM storage.objects WHERE name = (SELECT name FROM storage.objects WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'materials-videos')))))
)
-- WITH CHECK expression: Same as USING
```

### Delete Policy (DELETE)
```sql
-- Policy Name: "Teachers can delete their own materials"
-- Operation: DELETE
-- Target roles: authenticated
-- USING expression: 
auth.uid() IN (
  SELECT teacher_id FROM public.materials_library 
  WHERE bucket_name = (SELECT bucket_name FROM public.materials_library WHERE file_path = (SELECT file_path FROM storage.objects WHERE id = (SELECT id FROM storage.objects WHERE name = (SELECT name FROM storage.objects WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'materials-videos')))))
)
```

## 3. Alternative Simplified Storage Policy

For easier setup, you can use this simplified policy for all buckets:

### All Operations Policy
```sql
-- Policy Name: "Authenticated users can manage materials"
-- Operations: SELECT, INSERT, UPDATE, DELETE
-- Target roles: authenticated
-- USING expression: true
-- WITH CHECK expression: true
```

**Note**: This is less secure but easier to implement. For production, use the more specific policies above.

## 4. Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Storage
VITE_SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
VITE_MATERIALS_VIDEO_BUCKET=materials-videos
VITE_MATERIALS_PDF_BUCKET=materials-pdfs
VITE_MATERIALS_IMAGE_BUCKET=materials-images
VITE_MATERIALS_OTHER_BUCKET=materials-other

# File Upload Limits
VITE_MAX_VIDEO_SIZE=524288000  # 500MB in bytes
VITE_MAX_PDF_SIZE=52428800     # 50MB in bytes
VITE_MAX_IMAGE_SIZE=10485760   # 10MB in bytes
VITE_MAX_OTHER_SIZE=104857600  # 100MB in bytes
```

## 5. File Type Configuration

### Supported File Types by Bucket:

#### Video Bucket (`materials-videos`)
- `.mp4`, `.avi`, `.mov`, `.wmv`, `.flv`, `.webm`, `.mkv`

#### PDF Bucket (`materials-pdfs`)
- `.pdf`

#### Image Bucket (`materials-images`)
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp`

#### Other Bucket (`materials-other`)
- `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, `.xlsx`
- `.mp3`, `.wav`, `.ogg`, `.m4a`
- `.zip`, `.rar`, `.7z`
- `.txt`, `.rtf`

## 6. Storage URL Structure

Files will be stored with the following path structure:
```
materials-videos/
├── {teacher_id}/
│   ├── {year}/
│   │   ├── {month}/
│   │   │   └── {filename}
│   │   └── ...
│   └── ...
└── ...

materials-pdfs/
├── {teacher_id}/
│   ├── {year}/
│   │   ├── {month}/
│   │   │   └── {filename}
│   │   └── ...
│   └── ...
└── ...
```

This structure helps organize files by teacher and date, making management easier.

## 7. CDN Configuration (Optional)

For better performance, consider setting up a CDN for your Supabase storage:

1. Go to Supabase Dashboard → Storage → Settings
2. Enable CDN if available
3. Update your download URLs to use the CDN endpoint

## 8. Backup Strategy

Consider implementing:
- Regular backups of storage buckets
- Database backups including materials_library table
- File versioning for important materials





