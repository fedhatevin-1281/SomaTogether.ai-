-- setup-storage-buckets.sql
-- Run this in the Supabase SQL editor after creating the bucket.
-- NOTE: Create the `student-documents` storage bucket first via the Supabase Dashboard
-- (Storage > Create new bucket > Name: student-documents). Optionally set Public access
-- depending on your needs. Then run the policies below to allow authenticated uploads
-- while keeping row-level security enforced.

-- Optionally create the bucket via Supabase CLI (if available):
-- supabase storage bucket create student-documents --public

-- Allow authenticated users to upload to student-documents bucket
-- Allow authenticated users to upload to student-documents bucket
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow authenticated uploads to student-documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow authenticated uploads to student-documents" ON storage.objects
      FOR INSERT WITH CHECK ( bucket_id = 'student-documents' );$$;
  END IF;
END $do$;

-- Allow public access to view files (adjust roles as needed)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow public access to view student-documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow public access to view student-documents" ON storage.objects
      FOR SELECT USING ( bucket_id = 'student-documents' );$$;
  END IF;
END $do$;

-- Allow users to update their own files
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow users to update their own files'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow users to update their own files" ON storage.objects
      FOR UPDATE USING ( bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1] );$$;
  END IF;
END $do$;

-- Allow users to delete their own files
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow users to delete their own files'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow users to delete their own files" ON storage.objects
      FOR DELETE USING ( bucket_id = 'student-documents' AND auth.uid()::text = (storage.foldername(name))[1] );$$;
  END IF;
END $do$;

-- End of script

-- ---------------------------------------------------------------------------
-- Policies for teacher-documents bucket (mirror student rules)
-- Create a storage bucket named: teacher-documents
-- ---------------------------------------------------------------------------

-- Allow authenticated users to upload to teacher-documents bucket
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow authenticated uploads to teacher-documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow authenticated uploads to teacher-documents" ON storage.objects
      FOR INSERT WITH CHECK ( bucket_id = 'teacher-documents' );$$;
  END IF;
END $do$;

-- Allow public access to view teacher files (adjust roles as needed)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow public access to view teacher-documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow public access to view teacher-documents" ON storage.objects
      FOR SELECT USING ( bucket_id = 'teacher-documents' );$$;
  END IF;
END $do$;

-- Allow teachers to update their own files
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow teachers to update their own files'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow teachers to update their own files" ON storage.objects
      FOR UPDATE USING ( bucket_id = 'teacher-documents' AND auth.uid()::text = (storage.foldername(name))[1] );$$;
  END IF;
END $do$;

-- Allow teachers to delete their own files
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow teachers to delete their own files'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow teachers to delete their own files" ON storage.objects
      FOR DELETE USING ( bucket_id = 'teacher-documents' AND auth.uid()::text = (storage.foldername(name))[1] );$$;
  END IF;
END $do$;

-- ---------------------------------------------------------------------------
-- Policies for parent-documents bucket (mirror student/teacher rules)
-- Create a storage bucket named: parent-documents
-- ---------------------------------------------------------------------------

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow authenticated uploads to parent-documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow authenticated uploads to parent-documents" ON storage.objects
      FOR INSERT WITH CHECK ( bucket_id = 'parent-documents' );$$;
  END IF;
END $do$;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow public access to view parent-documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow public access to view parent-documents" ON storage.objects
      FOR SELECT USING ( bucket_id = 'parent-documents' );$$;
  END IF;
END $do$;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow parents to update their own files'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow parents to update their own files" ON storage.objects
      FOR UPDATE USING ( bucket_id = 'parent-documents' AND auth.uid()::text = (storage.foldername(name))[1] );$$;
  END IF;
END $do$;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow parents to delete their own files'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow parents to delete their own files" ON storage.objects
      FOR DELETE USING ( bucket_id = 'parent-documents' AND auth.uid()::text = (storage.foldername(name))[1] );$$;
  END IF;
END $do$;
