-- Create storage buckets for file uploads
-- Note: These commands need to be run in Supabase Dashboard > Storage or via Supabase CLI

-- Create student-documents bucket for student profile images and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create teacher-documents bucket for teacher profile images and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teacher-documents',
  'teacher-documents',
  true,
  10485760, -- 10MB limit for teachers (they might upload larger files)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create class-materials bucket for class-related files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-materials',
  'class-materials',
  true,
  52428800, -- 50MB limit for class materials
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies for student-documents bucket
DROP POLICY IF EXISTS "Students can upload their own profile images" ON storage.objects;
CREATE POLICY "Students can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'student-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Students can view their own profile images" ON storage.objects;
CREATE POLICY "Students can view their own profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'student-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Students can update their own profile images" ON storage.objects;
CREATE POLICY "Students can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'student-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Students can delete their own profile images" ON storage.objects;
CREATE POLICY "Students can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'student-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for teacher-documents bucket
DROP POLICY IF EXISTS "Teachers can upload their own documents" ON storage.objects;
CREATE POLICY "Teachers can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'teacher-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Teachers can view their own documents" ON storage.objects;
CREATE POLICY "Teachers can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'teacher-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Teachers can update their own documents" ON storage.objects;
CREATE POLICY "Teachers can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'teacher-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Teachers can delete their own documents" ON storage.objects;
CREATE POLICY "Teachers can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'teacher-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for class-materials bucket
DROP POLICY IF EXISTS "Teachers can upload class materials" ON storage.objects;
CREATE POLICY "Teachers can upload class materials" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'class-materials' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

DROP POLICY IF EXISTS "Students and teachers can view class materials" ON storage.objects;
CREATE POLICY "Students and teachers can view class materials" ON storage.objects
FOR SELECT USING (
  bucket_id = 'class-materials'
);

DROP POLICY IF EXISTS "Teachers can update class materials" ON storage.objects;
CREATE POLICY "Teachers can update class materials" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'class-materials' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

DROP POLICY IF EXISTS "Teachers can delete class materials" ON storage.objects;
CREATE POLICY "Teachers can delete class materials" ON storage.objects
FOR DELETE USING (
  bucket_id = 'class-materials' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
