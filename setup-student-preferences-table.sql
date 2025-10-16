-- Create student_preferences table for student settings
CREATE TABLE IF NOT EXISTS public.student_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  class_reminders boolean DEFAULT true,
  assignment_due_reminders boolean DEFAULT true,
  teacher_messages boolean DEFAULT true,
  weekly_progress_reports boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  profile_visibility text DEFAULT 'public'::text CHECK (profile_visibility = ANY (ARRAY['public'::text, 'private'::text, 'teachers_only'::text])),
  show_online_status boolean DEFAULT true,
  allow_teacher_contact boolean DEFAULT true,
  share_progress_with_parents boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT student_preferences_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_preferences_student_id ON public.student_preferences(student_id);

-- Enable Row Level Security
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Students can view their own preferences" ON public.student_preferences;
    DROP POLICY IF EXISTS "Students can update their own preferences" ON public.student_preferences;
    DROP POLICY IF EXISTS "Students can insert their own preferences" ON public.student_preferences;
    
    -- Create new policies
    CREATE POLICY "Students can view their own preferences" ON public.student_preferences
      FOR SELECT USING (auth.uid() = student_id);

    CREATE POLICY "Students can update their own preferences" ON public.student_preferences
      FOR UPDATE USING (auth.uid() = student_id);

    CREATE POLICY "Students can insert their own preferences" ON public.student_preferences
      FOR INSERT WITH CHECK (auth.uid() = student_id);
EXCEPTION
    WHEN undefined_object THEN
        -- Policies don't exist, create them
        CREATE POLICY "Students can view their own preferences" ON public.student_preferences
          FOR SELECT USING (auth.uid() = student_id);

        CREATE POLICY "Students can update their own preferences" ON public.student_preferences
          FOR UPDATE USING (auth.uid() = student_id);

        CREATE POLICY "Students can insert their own preferences" ON public.student_preferences
          FOR INSERT WITH CHECK (auth.uid() = student_id);
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_student_preferences_updated_at ON public.student_preferences;
CREATE TRIGGER update_student_preferences_updated_at
    BEFORE UPDATE ON public.student_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_student_preferences_updated_at();

-- Add missing fields to profiles table if they don't exist
DO $$
BEGIN
    -- Add date_of_birth column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth date;
    END IF;
END $$;

-- Add missing fields to students table if they don't exist  
DO $$
BEGIN
    -- Add preferred_languages column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'preferred_languages') THEN
        ALTER TABLE public.students ADD COLUMN preferred_languages text[] DEFAULT '{en}'::text[];
    END IF;
END $$;

