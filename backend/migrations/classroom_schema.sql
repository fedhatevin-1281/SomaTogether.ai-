-- ================================================
-- VIRTUAL CLASSROOM SYSTEM - ENHANCED DATABASE SCHEMA
-- ================================================
-- This schema extends the existing SomaTogether.ai schema
-- with virtual classroom features (group classes, attendance, certificates)

-- ================================================
-- ENHANCEMENTS TO EXISTING CLASSES TABLE
-- ================================================
-- NOTE: The existing classes table is 1-on-1. This adds group class support.
-- Add these columns to your existing classes table via migration:

-- ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_type VARCHAR(50) DEFAULT 'one-on-one';
-- ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;
-- ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS zoom_host_url TEXT;
-- ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS zoom_password VARCHAR(100);
-- ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS learning_objectives TEXT[] DEFAULT '{}';
-- ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;
-- ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) DEFAULT 0.00;

-- ================================================
-- VIRTUAL CLASSROOM - GROUP CLASSES TABLE
-- ================================================
-- For group classes/workshops (different from 1-on-1 lessons)
CREATE TABLE IF NOT EXISTS public.group_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE SET NULL,
  
  -- Class Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  learning_objectives TEXT[] DEFAULT '{}',
  syllabus TEXT,
  
  -- Pricing & Capacity
  max_students INTEGER DEFAULT 50,
  current_enrollment INTEGER DEFAULT 0,
  price DECIMAL(10, 2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Zoom Integration
  zoom_meeting_id VARCHAR(255),
  zoom_join_url TEXT,
  zoom_host_url TEXT,
  zoom_password VARCHAR(100),
  
  -- Scheduling
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER DEFAULT 60,
  timezone VARCHAR(50) DEFAULT 'UTC',
  recurrence VARCHAR(50) DEFAULT 'once', -- 'once', 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE,
  
  -- Status & Metadata
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed', 'cancelled'
  is_featured BOOLEAN DEFAULT FALSE,
  difficulty_level VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  language VARCHAR(50) DEFAULT 'en',
  
  -- Analytics
  enrollment_count INTEGER DEFAULT 0,
  total_attendees INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 1) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled'))
);

CREATE INDEX idx_group_classes_teacher ON public.group_classes(teacher_id);
CREATE INDEX idx_group_classes_subject ON public.group_classes(subject_id);
CREATE INDEX idx_group_classes_status ON public.group_classes(status);
CREATE INDEX idx_group_classes_start_time ON public.group_classes(start_time);

-- ================================================
-- GROUP CLASS ENROLLMENTS TABLE
-- ================================================
-- Tracks student enrollments in group classes
CREATE TABLE IF NOT EXISTS public.group_class_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'refunded'
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255),
  amount_paid DECIMAL(10, 2),
  wallet_transaction_id UUID,
  
  -- Enrollment
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'dropped', 'completed'
  
  -- Progress
  attendance_duration INTEGER DEFAULT 0, -- in minutes
  total_sessions_attended INTEGER DEFAULT 0,
  
  -- Metadata
  is_attended BOOLEAN DEFAULT FALSE,
  attendance_percentage DECIMAL(5, 2) DEFAULT 0.0,
  rating DECIMAL(3, 1),
  review TEXT,
  certificate_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(group_class_id, student_id),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  CONSTRAINT valid_enrollment_status CHECK (status IN ('active', 'dropped', 'completed'))
);

CREATE INDEX idx_group_enrollments_class ON public.group_class_enrollments(group_class_id);
CREATE INDEX idx_group_enrollments_student ON public.group_class_enrollments(student_id);
CREATE INDEX idx_group_enrollments_payment_status ON public.group_class_enrollments(payment_status);
CREATE INDEX idx_group_enrollments_status ON public.group_class_enrollments(status);

-- ================================================
-- GROUP CLASS ATTENDANCE TABLE
-- ================================================
-- Tracks attendance for each class session
CREATE TABLE IF NOT EXISTS public.group_class_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_number INTEGER DEFAULT 1,
  
  -- Join/Leave Times
  join_time TIMESTAMP WITH TIME ZONE,
  leave_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Engagement
  participant_id VARCHAR(255), -- Zoom participant ID
  is_host BOOLEAN DEFAULT FALSE,
  attended BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_group_attendance_class ON public.group_class_attendance(group_class_id);
CREATE INDEX idx_group_attendance_student ON public.group_class_attendance(student_id);
CREATE INDEX idx_group_attendance_session ON public.group_class_attendance(group_class_id, session_number);

-- ================================================
-- GROUP CLASS RECORDINGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.group_class_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
  session_number INTEGER,
  
  -- Recording Details
  recording_id VARCHAR(255) NOT NULL UNIQUE,
  topic VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Storage
  play_url TEXT,
  download_url TEXT,
  file_size BIGINT,
  storage_path TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  is_available BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_group_recordings_class ON public.group_class_recordings(group_class_id);

-- ================================================
-- GROUP CLASS CERTIFICATES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.group_class_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  group_class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  
  -- Certificate Details
  certificate_number VARCHAR(100) UNIQUE,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completion_date DATE,
  hours_completed DECIMAL(5, 2),
  attendance_percentage DECIMAL(5, 2),
  
  -- File
  pdf_url TEXT,
  certificate_data JSONB DEFAULT '{}',
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_group_certificates_student ON public.group_class_certificates(student_id);
CREATE INDEX idx_group_certificates_class ON public.group_class_certificates(group_class_id);
CREATE INDEX idx_group_certificates_teacher ON public.group_class_certificates(teacher_id);

-- ================================================
-- GROUP CLASS REVIEWS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.group_class_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Review
  rating DECIMAL(3, 1) NOT NULL,
  title VARCHAR(255),
  comment TEXT,
  is_helpful BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_group_reviews_class ON public.group_class_reviews(group_class_id);
CREATE INDEX idx_group_reviews_student ON public.group_class_reviews(student_id);

-- ================================================
-- NOTIFICATIONS - EXTEND EXISTING TABLE
-- ================================================
-- Add these columns to your existing notifications table:
-- ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(100);
-- ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_class_id UUID REFERENCES public.group_classes(id);
-- ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Additional classroom notification types can include:
-- 'group_class_created', 'group_class_started', 'group_class_cancelled'
-- 'group_enrollment_confirmation', 'group_enrollment_reminder'
-- 'group_certificate_earned', 'group_class_recording_available'
-- 'group_review_requested', 'new_group_class_in_subject'

-- ================================================
-- ROW LEVEL SECURITY (RLS) FOR GROUP CLASSES
-- ================================================

-- Group Classes RLS
ALTER TABLE public.group_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their group classes" ON public.group_classes
  FOR ALL USING (teacher_id IN (SELECT id FROM public.teachers WHERE id = auth.uid()));

CREATE POLICY "Anyone can view published group classes" ON public.group_classes
  FOR SELECT USING (status != 'cancelled' OR teacher_id IN (SELECT id FROM public.teachers WHERE id = auth.uid()));

-- Group Class Enrollments RLS
ALTER TABLE public.group_class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their enrollments" ON public.group_class_enrollments
  FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE id = auth.uid()));

CREATE POLICY "Teachers can view enrollments in their classes" ON public.group_class_enrollments
  FOR SELECT USING (group_class_id IN (
    SELECT id FROM public.group_classes WHERE teacher_id IN (
      SELECT id FROM public.teachers WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Students can enroll in classes" ON public.group_class_enrollments
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM public.students WHERE id = auth.uid()));

CREATE POLICY "Teachers can update enrollments in their classes" ON public.group_class_enrollments
  FOR UPDATE USING (group_class_id IN (
    SELECT id FROM public.group_classes WHERE teacher_id IN (
      SELECT id FROM public.teachers WHERE id = auth.uid()
    )
  ));

-- Group Class Attendance RLS
ALTER TABLE public.group_class_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their attendance" ON public.group_class_attendance
  FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE id = auth.uid()));

CREATE POLICY "Teachers can view attendance in their classes" ON public.group_class_attendance
  FOR SELECT USING (group_class_id IN (
    SELECT id FROM public.group_classes WHERE teacher_id IN (
      SELECT id FROM public.teachers WHERE id = auth.uid()
    )
  ));

CREATE POLICY "System can insert attendance" ON public.group_class_attendance
  FOR INSERT WITH CHECK (TRUE);

-- Group Class Certificates RLS
ALTER TABLE public.group_class_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their certificates" ON public.group_class_certificates
  FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE id = auth.uid()));

CREATE POLICY "Teachers can view certificates issued by them" ON public.group_class_certificates
  FOR SELECT USING (teacher_id IN (SELECT id FROM public.teachers WHERE id = auth.uid()));

-- Group Class Reviews RLS
ALTER TABLE public.group_class_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON public.group_class_reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "Students can write reviews" ON public.group_class_reviews
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM public.students WHERE id = auth.uid()));

CREATE POLICY "Students can update their own reviews" ON public.group_class_reviews
  FOR UPDATE USING (student_id IN (SELECT id FROM public.students WHERE id = auth.uid()));

-- Group Class Recordings RLS
ALTER TABLE public.group_class_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled students can view recordings" ON public.group_class_recordings
  FOR SELECT USING (
    is_public = TRUE OR 
    group_class_id IN (SELECT group_class_id FROM public.group_class_enrollments WHERE student_id IN (SELECT id FROM public.students WHERE id = auth.uid())) OR
    group_class_id IN (SELECT id FROM public.group_classes WHERE teacher_id IN (SELECT id FROM public.teachers WHERE id = auth.uid()))
  );

CREATE POLICY "Teachers can manage recordings" ON public.group_class_recordings
  FOR ALL USING (group_class_id IN (
    SELECT id FROM public.group_classes WHERE teacher_id IN (
      SELECT id FROM public.teachers WHERE id = auth.uid()
    )
  ));

-- ================================================
-- HELPER FUNCTIONS FOR GROUP CLASSES
-- ================================================

-- Function to update group class enrollment count
CREATE OR REPLACE FUNCTION update_group_class_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.group_classes
    SET enrollment_count = enrollment_count + 1,
        current_enrollment = current_enrollment + 1
    WHERE id = NEW.group_class_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.group_classes
    SET enrollment_count = GREATEST(0, enrollment_count - 1),
        current_enrollment = GREATEST(0, current_enrollment - 1)
    WHERE id = OLD.group_class_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_enrollment_count
AFTER INSERT OR DELETE ON public.group_class_enrollments
FOR EACH ROW EXECUTE FUNCTION update_group_class_enrollment_count();

-- Function to update group class status based on time
CREATE OR REPLACE FUNCTION check_group_class_status()
RETURNS TABLE(class_id UUID, new_status VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT gc.id, 
    CASE 
      WHEN gc.start_time <= CURRENT_TIMESTAMP AND gc.start_time + (gc.duration_minutes || ' minutes')::INTERVAL > CURRENT_TIMESTAMP
        THEN 'live'
      WHEN gc.start_time + (gc.duration_minutes || ' minutes')::INTERVAL <= CURRENT_TIMESTAMP AND gc.status = 'live'
        THEN 'completed'
      WHEN gc.start_time > CURRENT_TIMESTAMP
        THEN 'scheduled'
      ELSE gc.status
    END
  FROM public.group_classes gc
  WHERE gc.status != 'cancelled';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate attendance percentage for enrollment
CREATE OR REPLACE FUNCTION calculate_attendance_percentage(
  p_enrollment_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  v_total_minutes INTEGER;
  v_attended_minutes INTEGER;
  v_class_id UUID;
  v_student_id UUID;
BEGIN
  -- Get enrollment details
  SELECT group_class_id, student_id INTO v_class_id, v_student_id
  FROM public.group_class_enrollments
  WHERE id = p_enrollment_id;
  
  -- Get total class duration
  SELECT SUM(duration_minutes) INTO v_total_minutes
  FROM public.group_classes
  WHERE id = v_class_id;
  
  -- Get student's total attendance
  SELECT SUM(duration_minutes) INTO v_attended_minutes
  FROM public.group_class_attendance
  WHERE group_class_id = v_class_id AND student_id = v_student_id;
  
  IF v_total_minutes = 0 OR v_attended_minutes IS NULL THEN
    RETURN 0.0;
  END IF;
  
  RETURN (v_attended_minutes * 100.0) / v_total_minutes;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate certificates for completed classes
CREATE OR REPLACE FUNCTION auto_generate_certificates(p_class_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_enrollment_record RECORD;
  v_certificate_count INTEGER := 0;
  v_min_attendance_percentage DECIMAL := 75.0;
BEGIN
  FOR v_enrollment_record IN
    SELECT id, student_id, group_class_id, teacher_id
    FROM public.group_class_enrollments
    WHERE group_class_id = p_class_id
  LOOP
    IF calculate_attendance_percentage(v_enrollment_record.id) >= v_min_attendance_percentage THEN
      -- Check if certificate already exists
      IF NOT EXISTS (
        SELECT 1 FROM public.group_class_certificates
        WHERE group_class_id = p_class_id AND student_id = v_enrollment_record.student_id
      ) THEN
        -- Create certificate
        INSERT INTO public.group_class_certificates (
          student_id, group_class_id, teacher_id,
          certificate_number, completion_date,
          hours_completed, attendance_percentage
        ) VALUES (
          v_enrollment_record.student_id,
          p_class_id,
          v_enrollment_record.teacher_id,
          'CERT-' || p_class_id::VARCHAR || '-' || v_enrollment_record.student_id::VARCHAR || '-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::VARCHAR,
          CURRENT_DATE,
          (
            SELECT COALESCE(SUM(duration_minutes), 0) / 60.0
            FROM public.group_class_attendance
            WHERE group_class_id = p_class_id AND student_id = v_enrollment_record.student_id
          ),
          calculate_attendance_percentage(v_enrollment_record.id)
        );
        
        v_certificate_count := v_certificate_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_certificate_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get class attendance statistics
CREATE OR REPLACE FUNCTION get_class_attendance_stats(p_class_id UUID)
RETURNS TABLE(
  total_students INTEGER,
  total_attended INTEGER,
  average_attendance_minutes DECIMAL,
  average_attendance_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT gce.student_id)::INTEGER,
    COUNT(DISTINCT gca.student_id)::INTEGER,
    COALESCE(AVG(gca.duration_minutes), 0)::DECIMAL,
    COALESCE(AVG(gca.duration_minutes * 100.0 / gc.duration_minutes), 0)::DECIMAL
  FROM public.group_class_enrollments gce
  LEFT JOIN public.group_class_attendance gca ON gce.student_id = gca.student_id AND gce.group_class_id = gca.group_class_id
  CROSS JOIN public.group_classes gc
  WHERE gce.group_class_id = p_class_id AND gc.id = p_class_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- SAMPLE DATA FOR GROUP CLASSES (Optional - for testing)
-- ================================================
-- Uncomment to add sample data

-- INSERT INTO public.group_classes (
--   teacher_id, subject_id, title, description, category,
--   learning_objectives, max_students, price, start_time, duration_minutes, timezone
-- ) VALUES (
--   'sample-teacher-id'::UUID, 
--   'sample-subject-id'::UUID,
--   'Introduction to React - Group Workshop',
--   'Learn the basics of React.js in a group setting',
--   'Technology',
--   ARRAY['Understand React fundamentals', 'Build your first component', 'Master hooks'],
--   30,
--   29.99,
--   CURRENT_TIMESTAMP + INTERVAL '1 day',
--   60,
--   'UTC'
-- );

-- ================================================
-- MIGRATION NOTES
-- ================================================
-- This schema extends the existing SomaTogether.ai database with group class functionality.
-- 
-- Existing System (1-on-1):
-- - classes: 1-on-1 lessons between teacher and single student
-- - class_sessions: Individual session tracking
-- - meeting_rooms: Zoom rooms for class_sessions
-- 
-- New System (Group Classes):
-- - group_classes: Group classes/workshops taught by teachers
-- - group_class_enrollments: Track student enrollments in group classes
-- - group_class_attendance: Per-session attendance tracking
-- - group_class_certificates: Auto-generated certificates on 75%+ attendance
-- - group_class_reviews: Student reviews of group classes
-- - group_class_recordings: Class session recordings
--
-- Both systems coexist and use the existing payment/wallet system.
--
-- Migration Steps:
-- 1. Run this entire migration file
-- 2. Update ClassroomService to handle both 1-on-1 and group classes
-- 3. Update API endpoints to support group class operations
-- 4. Create React components for group class discovery and enrollment

