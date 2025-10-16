-- Teacher Signup Database Setup
-- This script ensures all necessary functions and triggers are in place for comprehensive teacher signup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to create teacher preferences with defaults
CREATE OR REPLACE FUNCTION create_teacher_preferences(teacher_uuid UUID)
RETURNS UUID AS $$
DECLARE
    new_preferences_id UUID;
BEGIN
    INSERT INTO teacher_preferences (
        teacher_id,
        preferred_student_ages,
        preferred_class_duration,
        max_students_per_class,
        auto_accept_bookings,
        require_student_approval,
        email_notifications,
        sms_notifications,
        push_notifications,
        marketing_emails,
        timezone,
        working_hours,
        vacation_mode,
        preferred_payment_method,
        auto_withdraw,
        withdraw_threshold,
        profile_visibility,
        show_contact_info,
        show_social_links,
        show_verification_badges,
        language,
        date_format,
        time_format,
        currency,
        created_at,
        updated_at
    ) VALUES (
        teacher_uuid,
        '{}',
        60,
        1,
        false,
        true,
        true,
        false,
        true,
        false,
        'UTC',
        '{}',
        false,
        'stripe',
        false,
        100.00,
        'public',
        false,
        true,
        true,
        'en',
        'MM/DD/YYYY',
        '12h',
        'USD',
        NOW(),
        NOW()
    ) RETURNING id INTO new_preferences_id;
    
    RETURN new_preferences_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upload teacher document
CREATE OR REPLACE FUNCTION upload_teacher_document(
    teacher_uuid UUID,
    document_type_param TEXT,
    file_info JSONB
)
RETURNS UUID AS $$
DECLARE
    new_document_id UUID;
BEGIN
    INSERT INTO teacher_documents (
        teacher_id,
        document_type,
        file_name,
        file_type,
        file_size_bytes,
        file_path,
        bucket_name,
        download_url,
        thumbnail_url,
        is_public,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        teacher_uuid,
        document_type_param::TEXT,
        (file_info->>'file_name')::TEXT,
        (file_info->>'file_type')::TEXT,
        (file_info->>'file_size_bytes')::BIGINT,
        (file_info->>'file_path')::TEXT,
        (file_info->>'bucket_name')::TEXT,
        (file_info->>'download_url')::TEXT,
        (file_info->>'thumbnail_url')::TEXT,
        (file_info->>'is_public')::BOOLEAN,
        (file_info->>'metadata')::JSONB,
        NOW(),
        NOW()
    ) RETURNING id INTO new_document_id;
    
    RETURN new_document_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update teacher profile
CREATE OR REPLACE FUNCTION update_teacher_profile(
    teacher_uuid UUID,
    profile_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE teachers SET
        hourly_rate = COALESCE((profile_data->>'hourly_rate')::NUMERIC, hourly_rate),
        currency = COALESCE(profile_data->>'currency', currency),
        subjects = COALESCE((profile_data->'subjects')::TEXT[], subjects),
        specialties = COALESCE((profile_data->'specialties')::TEXT[], specialties),
        education = COALESCE((profile_data->'education')::TEXT[], education),
        experience_years = COALESCE((profile_data->>'experience_years')::INTEGER, experience_years),
        teaching_philosophy = COALESCE(profile_data->>'teaching_philosophy', teaching_philosophy),
        languages = COALESCE((profile_data->'languages')::TEXT[], languages),
        social_links = COALESCE((profile_data->'social_links')::JSONB, social_links),
        tsc_number = COALESCE(profile_data->>'tsc_number', tsc_number),
        profile_image_url = COALESCE(profile_data->>'profile_image_url', profile_image_url),
        cover_image_url = COALESCE(profile_data->>'cover_image_url', cover_image_url),
        updated_at = NOW()
    WHERE id = teacher_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get teacher dashboard data
CREATE OR REPLACE FUNCTION get_teacher_dashboard_data(teacher_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'teacher', to_jsonb(t.*),
        'preferences', to_jsonb(tp.*),
        'metrics', (
            SELECT to_jsonb(tm.*)
            FROM teacher_metrics tm
            WHERE tm.teacher_id = teacher_uuid
            ORDER BY tm.metric_date DESC
            LIMIT 1
        ),
        'subjects', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ts.id,
                    'subject_id', ts.subject_id,
                    'subject_name', s.name,
                    'proficiency_level', ts.proficiency_level,
                    'years_experience', ts.years_experience,
                    'is_primary', ts.is_primary,
                    'is_available', ts.is_available,
                    'created_at', ts.created_at,
                    'updated_at', ts.updated_at
                )
            )
            FROM teacher_subjects ts
            JOIN subjects s ON ts.subject_id = s.id
            WHERE ts.teacher_id = teacher_uuid
        ),
        'skills', (
            SELECT jsonb_agg(to_jsonb(tsk.*))
            FROM teacher_skills tsk
            WHERE tsk.teacher_id = teacher_uuid
        )
    )
    INTO result
    FROM teachers t
    LEFT JOIN teacher_preferences tp ON t.id = tp.teacher_id
    WHERE t.id = teacher_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create teacher preferences when a teacher is created
CREATE OR REPLACE FUNCTION trigger_create_teacher_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default teacher preferences
    PERFORM create_teacher_preferences(NEW.id);
    
    -- Create default wallet
    INSERT INTO wallets (
        user_id,
        balance,
        currency,
        tokens,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        0.00,
        NEW.currency,
        0,
        true,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS create_teacher_preferences_trigger ON teachers;
CREATE TRIGGER create_teacher_preferences_trigger
    AFTER INSERT ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_teacher_preferences();

-- Function to validate teacher signup data
CREATE OR REPLACE FUNCTION validate_teacher_signup_data(signup_data JSONB)
RETURNS JSONB AS $$
DECLARE
    errors TEXT[] := '{}';
    warnings TEXT[] := '{}';
BEGIN
    -- Required field validations
    IF NOT (signup_data ? 'full_name' AND signup_data->>'full_name' != '') THEN
        errors := array_append(errors, 'Full name is required');
    END IF;
    
    IF NOT (signup_data ? 'email' AND signup_data->>'email' != '') THEN
        errors := array_append(errors, 'Email is required');
    END IF;
    
    IF NOT (signup_data ? 'hourly_rate' AND (signup_data->>'hourly_rate')::NUMERIC > 0) THEN
        errors := array_append(errors, 'Hourly rate must be greater than 0');
    END IF;
    
    IF NOT (signup_data ? 'experience_years' AND (signup_data->>'experience_years')::INTEGER >= 0) THEN
        errors := array_append(errors, 'Years of experience cannot be negative');
    END IF;
    
    -- Email format validation
    IF signup_data ? 'email' AND signup_data->>'email' !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        errors := array_append(errors, 'Invalid email format');
    END IF;
    
    -- Warnings for missing optional but recommended fields
    IF NOT (signup_data ? 'teaching_philosophy' OR signup_data->>'teaching_philosophy' = '') THEN
        warnings := array_append(warnings, 'Teaching philosophy is recommended');
    END IF;
    
    IF NOT (signup_data ? 'bio' OR signup_data->>'bio' = '') THEN
        warnings := array_append(warnings, 'Bio is recommended');
    END IF;
    
    IF jsonb_array_length(COALESCE(signup_data->'skills', '[]'::JSONB)) = 0 THEN
        warnings := array_append(warnings, 'At least one skill is recommended');
    END IF;
    
    RETURN jsonb_build_object(
        'valid', array_length(errors, 1) IS NULL,
        'errors', to_jsonb(errors),
        'warnings', to_jsonb(warnings)
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_verification_status ON teachers(verification_status);
CREATE INDEX IF NOT EXISTS idx_teachers_is_available ON teachers(is_available);
CREATE INDEX IF NOT EXISTS idx_teachers_created_at ON teachers(created_at);
CREATE INDEX IF NOT EXISTS idx_teacher_preferences_teacher_id ON teacher_preferences(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_skills_teacher_id ON teacher_skills(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_documents_teacher_id ON teacher_documents(teacher_id);

-- Create RLS policies for teacher data
DO $$ BEGIN
    -- Enable RLS on teacher tables
    ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_preferences ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_skills ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_metrics ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_time_off ENABLE ROW LEVEL SECURITY;
    
    -- Teachers can view and update their own data
    DROP POLICY IF EXISTS "Teachers can view own data" ON teachers;
    CREATE POLICY "Teachers can view own data" ON teachers
        FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Teachers can update own data" ON teachers;
    CREATE POLICY "Teachers can update own data" ON teachers
        FOR UPDATE USING (auth.uid() = id);
    
    -- Public can view active teacher profiles
    DROP POLICY IF EXISTS "Public can view active teacher profiles" ON teachers;
    CREATE POLICY "Public can view active teacher profiles" ON teachers
        FOR SELECT USING (is_available = true AND verification_status = 'verified');
    
    -- Teacher preferences policies
    DROP POLICY IF EXISTS "Teachers can manage own preferences" ON teacher_preferences;
    CREATE POLICY "Teachers can manage own preferences" ON teacher_preferences
        FOR ALL USING (auth.uid() = teacher_id);
    
    -- Teacher skills policies
    DROP POLICY IF EXISTS "Teachers can manage own skills" ON teacher_skills;
    CREATE POLICY "Teachers can manage own skills" ON teacher_skills
        FOR ALL USING (auth.uid() = teacher_id);
    
    -- Teacher subjects policies
    DROP POLICY IF EXISTS "Teachers can manage own subjects" ON teacher_subjects;
    CREATE POLICY "Teachers can manage own subjects" ON teacher_subjects
        FOR ALL USING (auth.uid() = teacher_id);
    
    -- Public can view teacher subjects for browsing
    DROP POLICY IF EXISTS "Public can view teacher subjects" ON teacher_subjects;
    CREATE POLICY "Public can view teacher subjects" ON teacher_subjects
        FOR SELECT USING (is_available = true);
    
    -- Teacher availability policies
    DROP POLICY IF EXISTS "Teachers can manage own availability" ON teacher_availability;
    CREATE POLICY "Teachers can manage own availability" ON teacher_availability
        FOR ALL USING (auth.uid() = teacher_id);
    
    -- Public can view teacher availability
    DROP POLICY IF EXISTS "Public can view teacher availability" ON teacher_availability;
    CREATE POLICY "Public can view teacher availability" ON teacher_availability
        FOR SELECT USING (is_active = true);
    
    -- Teacher documents policies
    DROP POLICY IF EXISTS "Teachers can manage own documents" ON teacher_documents;
    CREATE POLICY "Teachers can manage own documents" ON teacher_documents
        FOR ALL USING (auth.uid() = teacher_id);
    
    -- Public can view public teacher documents
    DROP POLICY IF EXISTS "Public can view public teacher documents" ON teacher_documents;
    CREATE POLICY "Public can view public teacher documents" ON teacher_documents
        FOR SELECT USING (is_public = true);
    
    -- Teacher metrics policies
    DROP POLICY IF EXISTS "Teachers can view own metrics" ON teacher_metrics;
    CREATE POLICY "Teachers can view own metrics" ON teacher_metrics
        FOR SELECT USING (auth.uid() = teacher_id);
    
    -- Teacher time off policies
    DROP POLICY IF EXISTS "Teachers can manage own time off" ON teacher_time_off;
    CREATE POLICY "Teachers can manage own time off" ON teacher_time_off
        FOR ALL USING (auth.uid() = teacher_id);

EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privileges to create RLS policies. Please create them manually via the Supabase Dashboard.';
END $$;

-- Insert default subjects if they don't exist
INSERT INTO subjects (name, description, category, is_active) VALUES
('Mathematics', 'General mathematics including algebra, geometry, calculus', 'Academic', true),
('Science', 'General science including physics, chemistry, biology', 'Academic', true),
('English Language', 'English language and literature', 'Language', true),
('History', 'World history and social studies', 'Social Studies', true),
('Geography', 'Physical and human geography', 'Social Studies', true),
('Computer Science', 'Programming, computer fundamentals, and technology', 'Technology', true),
('Art', 'Visual arts, drawing, painting, and design', 'Creative Arts', true),
('Music', 'Music theory, instruments, and composition', 'Creative Arts', true),
('Physical Education', 'Sports, fitness, and health education', 'Physical', true),
('Foreign Languages', 'Spanish, French, German, Chinese, etc.', 'Language', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default education systems if they don't exist
INSERT INTO education_systems (name, description, is_active) VALUES
('American Curriculum', 'US-based K-12 education system', true),
('British Curriculum', 'UK-based education system (GCSE, A-Levels)', true),
('International Baccalaureate', 'IB World School Programme', true),
('Kenyan Curriculum', '8-4-4 and CBC education system', true),
('Nigerian Curriculum', '9-3-4 education system', true),
('South African Curriculum', 'CAPS education system', true),
('Indian Curriculum', 'CBSE and ICSE education systems', true),
('Canadian Curriculum', 'Provincial education systems', true),
('Australian Curriculum', 'ACARA education system', true),
('European Curriculum', 'Various European education systems', true)
ON CONFLICT (name) DO NOTHING;

-- Create a view for teacher browsing with all necessary information
CREATE OR REPLACE VIEW teacher_browse_view AS
SELECT 
    t.id,
    t.hourly_rate,
    t.currency,
    t.subjects,
    t.specialties,
    t.education,
    t.experience_years,
    t.rating,
    t.total_reviews,
    t.total_students,
    t.total_sessions,
    t.max_students,
    t.is_available,
    t.verification_status,
    t.teaching_philosophy,
    t.languages,
    t.social_links,
    t.tsc_number,
    t.profile_image_url,
    t.cover_image_url,
    t.created_at,
    t.updated_at,
    p.full_name,
    p.bio,
    p.location,
    p.timezone,
    p.language as primary_language,
    tp.profile_visibility,
    tp.show_contact_info,
    tp.show_social_links,
    tp.show_verification_badges,
    tp.preferred_student_ages,
    tp.preferred_class_duration,
    tp.max_students_per_class
FROM teachers t
JOIN profiles p ON t.id = p.id
LEFT JOIN teacher_preferences tp ON t.id = tp.teacher_id
WHERE t.is_available = true 
  AND t.verification_status IN ('verified', 'pending')
  AND (tp.profile_visibility IS NULL OR tp.profile_visibility != 'private');

-- Grant access to the view
GRANT SELECT ON teacher_browse_view TO authenticated;
GRANT SELECT ON teacher_browse_view TO anon;

-- Create function to calculate teacher profile completion percentage
CREATE OR REPLACE FUNCTION calculate_teacher_profile_completion(teacher_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_fields INTEGER := 20; -- Total number of important fields
BEGIN
    -- Basic profile fields (5 points)
    IF EXISTS (SELECT 1 FROM profiles WHERE id = teacher_uuid AND full_name IS NOT NULL AND full_name != '') THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM profiles WHERE id = teacher_uuid AND bio IS NOT NULL AND bio != '') THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM profiles WHERE id = teacher_uuid AND location IS NOT NULL AND location != '') THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND profile_image_url IS NOT NULL) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM profiles WHERE id = teacher_uuid AND phone IS NOT NULL AND phone != '') THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Teaching information (5 points)
    IF EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND hourly_rate > 0) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND experience_years > 0) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND teaching_philosophy IS NOT NULL AND teaching_philosophy != '') THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND array_length(specialties, 1) > 0) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND array_length(education, 1) > 0) THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Skills and subjects (5 points)
    IF EXISTS (SELECT 1 FROM teacher_skills WHERE teacher_id = teacher_uuid) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teacher_subjects WHERE teacher_id = teacher_uuid) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = teacher_uuid AND is_active = true) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND array_length(languages, 1) > 1) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teacher_documents WHERE teacher_id = teacher_uuid AND document_type IN ('certificate', 'diploma', 'degree')) THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Preferences and settings (5 points)
    IF EXISTS (SELECT 1 FROM teacher_preferences WHERE teacher_id = teacher_uuid) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teacher_preferences WHERE teacher_id = teacher_uuid AND array_length(preferred_student_ages, 1) > 0) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teacher_preferences WHERE teacher_id = teacher_uuid AND preferred_class_duration > 0) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teacher_preferences WHERE teacher_id = teacher_uuid AND max_students_per_class > 0) THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND tsc_number IS NOT NULL AND tsc_number != '') THEN
        completion_score := completion_score + 1;
    END IF;
    
    RETURN (completion_score * 100) / total_fields;
END;
$$ LANGUAGE plpgsql;

-- Create function to get teacher profile completion status
CREATE OR REPLACE FUNCTION get_teacher_profile_completion(teacher_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    completion_percentage INTEGER;
    missing_fields TEXT[] := '{}';
BEGIN
    completion_percentage := calculate_teacher_profile_completion(teacher_uuid);
    
    -- Check for missing critical fields
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = teacher_uuid AND full_name IS NOT NULL AND full_name != '') THEN
        missing_fields := array_append(missing_fields, 'Full name');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND hourly_rate > 0) THEN
        missing_fields := array_append(missing_fields, 'Hourly rate');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM teachers WHERE id = teacher_uuid AND experience_years > 0) THEN
        missing_fields := array_append(missing_fields, 'Teaching experience');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM teacher_skills WHERE teacher_id = teacher_uuid) THEN
        missing_fields := array_append(missing_fields, 'Teaching skills');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = teacher_uuid AND is_active = true) THEN
        missing_fields := array_append(missing_fields, 'Availability schedule');
    END IF;
    
    RETURN jsonb_build_object(
        'completion_percentage', completion_percentage,
        'missing_fields', to_jsonb(missing_fields),
        'is_complete', completion_percentage >= 80,
        'needs_attention', completion_percentage < 50
    );
END;
$$ LANGUAGE plpgsql;

-- Create notification for incomplete teacher profiles
CREATE OR REPLACE FUNCTION notify_incomplete_teacher_profile()
RETURNS TRIGGER AS $$
DECLARE
    completion_data JSONB;
BEGIN
    -- Check profile completion for new or updated teachers
    SELECT get_teacher_profile_completion(NEW.id) INTO completion_data;
    
    -- If profile is less than 50% complete, create a notification
    IF (completion_data->>'completion_percentage')::INTEGER < 50 THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            priority,
            created_at
        ) VALUES (
            NEW.id,
            'profile_incomplete',
            'Complete Your Teacher Profile',
            'Your teacher profile is incomplete. Complete it to start receiving student bookings.',
            completion_data,
            'high',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incomplete profile notifications
DROP TRIGGER IF EXISTS notify_incomplete_profile_trigger ON teachers;
CREATE TRIGGER notify_incomplete_profile_trigger
    AFTER INSERT OR UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION notify_incomplete_teacher_profile();

-- Final success message
DO $$ BEGIN
    RAISE NOTICE 'Teacher signup database setup completed successfully!';
    RAISE NOTICE 'Created functions: create_teacher_preferences, upload_teacher_document, update_teacher_profile, get_teacher_dashboard_data';
    RAISE NOTICE 'Created triggers: create_teacher_preferences_trigger, notify_incomplete_profile_trigger';
    RAISE NOTICE 'Created views: teacher_browse_view';
    RAISE NOTICE 'Created indexes and RLS policies for better performance and security';
    RAISE NOTICE 'Inserted default subjects and education systems';
END $$;

