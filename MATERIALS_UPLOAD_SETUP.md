# Materials Upload Setup Guide

## Step 1: Database Setup

First, you need to create the database tables. Run the following SQL in your Supabase SQL editor:

```sql
-- Run this entire script in your Supabase SQL Editor
-- This creates all the necessary tables for the materials library

-- Materials Library Table
CREATE TABLE IF NOT EXISTS public.materials_library (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('video', 'pdf', 'image', 'document', 'audio', 'other')),
  file_extension text NOT NULL,
  file_size_bytes bigint NOT NULL,
  file_path text NOT NULL,
  bucket_name text NOT NULL,
  download_url text,
  thumbnail_url text,
  subject_id uuid NOT NULL,
  grade_level text,
  difficulty_level text DEFAULT 'medium' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  download_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  rating_average numeric DEFAULT 0.0,
  rating_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'pending_review', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT materials_library_pkey PRIMARY KEY (id),
  CONSTRAINT materials_library_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE,
  CONSTRAINT materials_library_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT
);

-- Material Categories Table
CREATE TABLE IF NOT EXISTS public.material_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  icon_url text,
  parent_category_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT material_categories_pkey PRIMARY KEY (id),
  CONSTRAINT material_categories_parent_fkey FOREIGN KEY (parent_category_id) REFERENCES public.material_categories(id) ON DELETE SET NULL
);

-- Material Category Assignments (Junction Table)
CREATE TABLE IF NOT EXISTS public.material_category_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  material_id uuid NOT NULL,
  category_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT material_category_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT material_category_assignments_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials_library(id) ON DELETE CASCADE,
  CONSTRAINT material_category_assignments_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.material_categories(id) ON DELETE CASCADE,
  CONSTRAINT material_category_assignments_unique UNIQUE (material_id, category_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_library_teacher_id ON public.materials_library(teacher_id);
CREATE INDEX IF NOT EXISTS idx_materials_library_subject_id ON public.materials_library(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_library_file_type ON public.materials_library(file_type);
CREATE INDEX IF NOT EXISTS idx_materials_library_status ON public.materials_library(status);

-- Enable Row Level Security
ALTER TABLE public.materials_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_category_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for materials_library
DROP POLICY IF EXISTS "Teachers can view all materials" ON public.materials_library;
CREATE POLICY "Teachers can view all materials" ON public.materials_library
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can insert their own materials" ON public.materials_library;
CREATE POLICY "Teachers can insert their own materials" ON public.materials_library
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can update their own materials" ON public.materials_library;
CREATE POLICY "Teachers can update their own materials" ON public.materials_library
  FOR UPDATE USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can delete their own materials" ON public.materials_library;
CREATE POLICY "Teachers can delete their own materials" ON public.materials_library
  FOR DELETE USING (auth.uid() = teacher_id);

-- RLS Policies for material_categories
DROP POLICY IF EXISTS "Everyone can view categories" ON public.material_categories;
CREATE POLICY "Everyone can view categories" ON public.material_categories
  FOR SELECT USING (true);

-- Insert default categories
INSERT INTO public.material_categories (name, description) VALUES
('Lecture Videos', 'Educational videos and recorded lectures'),
('Practice Exercises', 'Worksheets and practice problems'),
('Reference Materials', 'Textbooks, guides, and reference documents'),
('Interactive Content', 'Quizzes, simulations, and interactive materials'),
('Assessment Tools', 'Tests, exams, and evaluation materials'),
('Multimedia', 'Images, audio files, and visual aids'),
('Templates', 'Document templates and frameworks'),
('Case Studies', 'Real-world examples and case studies')
ON CONFLICT (name) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_materials_library_updated_at ON public.materials_library;
CREATE TRIGGER update_materials_library_updated_at BEFORE UPDATE ON public.materials_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 2: Storage Bucket Setup

Go to your Supabase Dashboard → Storage and create these buckets:

### Bucket 1: materials-videos
- **Name**: `materials-videos`
- **Public**: No (Private)
- **File size limit**: 500MB
- **Allowed MIME types**: `video/*`

### Bucket 2: materials-pdfs
- **Name**: `materials-pdfs`
- **Public**: No (Private)
- **File size limit**: 50MB
- **Allowed MIME types**: `application/pdf`

### Bucket 3: materials-images
- **Name**: `materials-images`
- **Public**: No (Private)
- **File size limit**: 10MB
- **Allowed MIME types**: `image/*`

### Bucket 4: materials-other
- **Name**: `materials-other`
- **Public**: No (Private)
- **File size limit**: 100MB
- **Allowed MIME types**: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `audio/*`, etc.

## Step 3: Storage Policies

For each bucket, create these policies in Supabase Dashboard → Storage → Policies:

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
-- USING expression: true
-- WITH CHECK expression: true
```

### Delete Policy (DELETE)
```sql
-- Policy Name: "Teachers can delete their own materials"
-- Operation: DELETE
-- Target roles: authenticated
-- USING expression: true
-- WITH CHECK expression: true
```

## Step 4: Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5: Test the Upload

1. Go to your teacher dashboard
2. Navigate to Materials Library
3. Click "Upload Material"
4. Select a file (PDF, image, or video)
5. Fill in the required fields (Title, Subject)
6. Click Upload

## Troubleshooting

### If upload buttons don't work:
1. Check browser console for errors
2. Verify database tables exist
3. Check storage bucket policies
4. Verify environment variables

### If you get permission errors:
1. Make sure RLS policies are correct
2. Verify user is authenticated as a teacher
3. Check storage bucket permissions

### If files don't appear after upload:
1. Check database for new records
2. Verify file paths in storage
3. Check for JavaScript errors in console

## Quick Test

You can test if everything is working by running this in your browser console while on the materials library page:

```javascript
// Test if MaterialService is available
console.log('MaterialService available:', typeof MaterialService !== 'undefined');

// Test if user is authenticated
console.log('User authenticated:', !!window.user);
```

## Next Steps

Once the basic upload is working, you can:
1. Add file validation
2. Implement progress tracking
3. Add thumbnail generation for videos
4. Set up CDN for faster downloads
5. Add material sharing features





