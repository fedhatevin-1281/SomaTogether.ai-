-- =====================================================
-- SomaTogether.ai Database Setup Script
-- =====================================================
-- This script sets up all necessary database functions, triggers, and RLS policies
-- Run this script in your Supabase SQL editor to complete the setup

-- First, run the main database functions
\i database-functions.sql

-- =====================================================
-- ADDITIONAL SETUP FOR PRODUCTION
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON public.profiles USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_class_sessions_scheduled_start ON public.class_sessions(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample education systems
INSERT INTO public.education_systems (name, description) VALUES
('Kenyan Curriculum (8-4-4)', 'Kenya Certificate of Primary Education and Kenya Certificate of Secondary Education'),
('British Curriculum', 'Cambridge International Examinations and IGCSE'),
('American Curriculum', 'Common Core State Standards and Advanced Placement'),
('IB (International Baccalaureate)', 'International Baccalaureate Primary Years, Middle Years, and Diploma Programmes'),
('CBC (Competency Based Curriculum)', 'Kenya''s new Competency Based Curriculum')
ON CONFLICT (name) DO NOTHING;

-- Insert sample education levels
INSERT INTO public.education_levels (system_id, level_name, description, order_index) VALUES
((SELECT id FROM public.education_systems WHERE name = 'Kenyan Curriculum (8-4-4)'), 'Grade 1-3', 'Lower Primary', 1),
((SELECT id FROM public.education_systems WHERE name = 'Kenyan Curriculum (8-4-4)'), 'Grade 4-6', 'Upper Primary', 2),
((SELECT id FROM public.education_systems WHERE name = 'Kenyan Curriculum (8-4-4)'), 'Grade 7-8', 'Lower Secondary', 3),
((SELECT id FROM public.education_systems WHERE name = 'Kenyan Curriculum (8-4-4)'), 'Form 1-4', 'Secondary School', 4),
((SELECT id FROM public.education_systems WHERE name = 'British Curriculum'), 'Key Stage 1', 'Ages 5-7', 1),
((SELECT id FROM public.education_systems WHERE name = 'British Curriculum'), 'Key Stage 2', 'Ages 7-11', 2),
((SELECT id FROM public.education_systems WHERE name = 'British Curriculum'), 'Key Stage 3', 'Ages 11-14', 3),
((SELECT id FROM public.education_systems WHERE name = 'British Curriculum'), 'Key Stage 4', 'Ages 14-16', 4),
((SELECT id FROM public.education_systems WHERE name = 'American Curriculum'), 'Elementary School', 'Grades K-5', 1),
((SELECT id FROM public.education_systems WHERE name = 'American Curriculum'), 'Middle School', 'Grades 6-8', 2),
((SELECT id FROM public.education_systems WHERE name = 'American Curriculum'), 'High School', 'Grades 9-12', 3)
ON CONFLICT DO NOTHING;

-- Insert sample subjects
INSERT INTO public.subjects (name, description, category, icon_url) VALUES
('Mathematics', 'Numbers, algebra, geometry, and problem solving', 'STEM', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('English Language', 'Reading, writing, speaking, and listening skills', 'Languages', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Science', 'Physics, chemistry, biology, and earth sciences', 'STEM', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('History', 'World history, local history, and historical analysis', 'Humanities', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Geography', 'Physical and human geography, maps, and environmental studies', 'Humanities', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Physics', 'Mechanics, thermodynamics, waves, and modern physics', 'STEM', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Chemistry', 'Organic, inorganic, physical, and analytical chemistry', 'STEM', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Biology', 'Cell biology, genetics, ecology, and human anatomy', 'STEM', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Computer Science', 'Programming, algorithms, data structures, and software development', 'STEM', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Art', 'Visual arts, drawing, painting, and creative expression', 'Arts', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Music', 'Music theory, instruments, composition, and performance', 'Arts', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Physical Education', 'Sports, fitness, health, and physical development', 'Physical', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('French', 'French language, literature, and culture', 'Languages', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Spanish', 'Spanish language, literature, and culture', 'Languages', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Business Studies', 'Entrepreneurship, economics, and business management', 'Business', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Religious Studies', 'World religions, ethics, and moral philosophy', 'Humanities', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png')
ON CONFLICT (name) DO NOTHING;

-- Insert sample material categories
INSERT INTO public.material_categories (name, description, icon_url) VALUES
('Lesson Plans', 'Structured lesson plans and teaching guides', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Worksheets', 'Practice exercises and activity sheets', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Presentations', 'PowerPoint slides and visual presentations', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Videos', 'Educational videos and multimedia content', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Assessments', 'Quizzes, tests, and evaluation materials', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Handouts', 'Reference materials and study guides', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Games', 'Educational games and interactive activities', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
('Experiments', 'Science experiments and lab activities', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png')
ON CONFLICT (name) DO NOTHING;

-- Insert token pricing
INSERT INTO public.token_pricing (user_type, tokens_per_dollar, dollars_per_token, is_active) VALUES
('student', 100, 0.01, true),
('teacher', 100, 0.01, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('platform_name', '"SomaTogether.ai"', 'The name of the platform', true),
('platform_description', '"AI-Powered Educational Platform"', 'Description of the platform', true),
('default_currency', '"USD"', 'Default currency for the platform', true),
('default_timezone', '"UTC"', 'Default timezone for the platform', true),
('default_language', '"en"', 'Default language for the platform', true),
('teacher_commission_rate', '0.4', 'Commission rate for teachers (40%)', false),
('platform_commission_rate', '0.6', 'Commission rate for platform (60%)', false),
('min_session_duration', '30', 'Minimum session duration in minutes', false),
('max_session_duration', '180', 'Maximum session duration in minutes', false),
('session_buffer_time', '15', 'Buffer time between sessions in minutes', false),
('email_verification_required', 'false', 'Whether email verification is required for signup', false),
('auto_approve_teachers', 'false', 'Whether to auto-approve teacher registrations', false),
('max_file_size_mb', '50', 'Maximum file size for uploads in MB', false),
('allowed_file_types', '["pdf", "doc", "docx", "ppt", "pptx", "jpg", "jpeg", "png", "gif", "mp4", "mp3", "wav"]', 'Allowed file types for uploads', false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify that all functions were created successfully
SELECT 
  'Functions created:' as status,
  count(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_profile_exists', 'create_user_profile', 'get_user_profile', 'handle_new_user');

-- Verify that all triggers were created successfully
SELECT 
  'Triggers created:' as status,
  count(*) as count
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'on_auth_user_created';

-- Verify that RLS is enabled on all tables
SELECT 
  'Tables with RLS enabled:' as status,
  count(*) as count
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
AND c.relrowsecurity = true;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Database setup completed successfully! All functions, triggers, and RLS policies have been created.' as message;
