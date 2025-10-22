-- =====================================================
-- SomaTogether.ai Database Functions and Triggers
-- =====================================================
-- This file contains all necessary database functions, triggers, and RLS policies
-- to ensure smooth authentication and proper data access control.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if a profile exists for a user
CREATE OR REPLACE FUNCTION check_profile_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id);
END;
$$;

-- Function to create user profile with all necessary related records
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT,
  user_phone TEXT DEFAULT NULL,
  user_date_of_birth DATE DEFAULT NULL,
  user_location TEXT DEFAULT NULL,
  user_bio TEXT DEFAULT NULL,
  user_timezone TEXT DEFAULT 'UTC',
  user_language TEXT DEFAULT 'en',
  user_currency TEXT DEFAULT 'USD'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id, email, full_name, role, phone, date_of_birth, 
    location, bio, timezone, language
  ) VALUES (
    user_id, user_email, user_full_name, user_role, user_phone,
    user_date_of_birth, user_location, user_bio, user_timezone, user_language
  ) RETURNING id INTO profile_id;

  -- Create wallet for the user
  INSERT INTO public.wallets (user_id, currency, balance, tokens)
  VALUES (user_id, user_currency, 0.00, 0);

  -- Create role-specific records
  IF user_role = 'student' THEN
    INSERT INTO public.students (id, timezone, preferred_languages)
    VALUES (user_id, user_timezone, ARRAY[user_language]);
    
    -- Create student preferences
    INSERT INTO public.student_preferences (student_id)
    VALUES (user_id);
    
  ELSIF user_role = 'teacher' THEN
    INSERT INTO public.teachers (id, timezone, languages)
    VALUES (user_id, user_timezone, ARRAY[user_language]);
    
    -- Create teacher preferences
    INSERT INTO public.teacher_preferences (teacher_id)
    VALUES (user_id);
    
  ELSIF user_role = 'parent' THEN
    INSERT INTO public.parents (id)
    VALUES (user_id);
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Function to get user profile with role-specific data
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data JSON;
  role_data JSON;
BEGIN
  -- Get base profile
  SELECT to_json(p.*) INTO profile_data
  FROM public.profiles p
  WHERE p.id = user_id;

  -- Get role-specific data
  IF (SELECT role FROM public.profiles WHERE id = user_id) = 'student' THEN
    SELECT to_json(s.*) INTO role_data
    FROM public.students s
    WHERE s.id = user_id;
  ELSIF (SELECT role FROM public.profiles WHERE id = user_id) = 'teacher' THEN
    SELECT to_json(t.*) INTO role_data
    FROM public.teachers t
    WHERE t.id = user_id;
  ELSIF (SELECT role FROM public.profiles WHERE id = user_id) = 'parent' THEN
    SELECT to_json(p.*) INTO role_data
    FROM public.parents p
    WHERE p.id = user_id;
  END IF;

  -- Combine profile and role data
  RETURN json_build_object(
    'profile', profile_data,
    'role_data', role_data
  );
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile for new user
  PERFORM create_user_profile(
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'bio',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'USD')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_accounts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for manual creation)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Public profiles can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- STUDENTS TABLE POLICIES
-- =====================================================

-- Students can view their own data
CREATE POLICY "Students can view own data" ON public.students
  FOR SELECT USING (auth.uid() = id);

-- Students can update their own data
CREATE POLICY "Students can update own data" ON public.students
  FOR UPDATE USING (auth.uid() = id);

-- Students can insert their own data
CREATE POLICY "Students can insert own data" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Teachers can view students they teach
CREATE POLICY "Teachers can view their students" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c 
      WHERE c.student_id = students.id 
      AND c.teacher_id = auth.uid()
    )
  );

-- Parents can view their children
CREATE POLICY "Parents can view their children" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parents p 
      WHERE p.id = auth.uid() 
      AND students.id = ANY(p.children_ids)
    )
  );

-- =====================================================
-- TEACHERS TABLE POLICIES
-- =====================================================

-- Teachers can view their own data
CREATE POLICY "Teachers can view own data" ON public.teachers
  FOR SELECT USING (auth.uid() = id);

-- Teachers can update their own data
CREATE POLICY "Teachers can update own data" ON public.teachers
  FOR UPDATE USING (auth.uid() = id);

-- Teachers can insert their own data
CREATE POLICY "Teachers can insert own data" ON public.teachers
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Students can view teachers they have classes with
CREATE POLICY "Students can view their teachers" ON public.teachers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c 
      WHERE c.teacher_id = teachers.id 
      AND c.student_id = auth.uid()
    )
  );

-- Public teacher profiles can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public teacher profiles" ON public.teachers
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- PARENTS TABLE POLICIES
-- =====================================================

-- Parents can view their own data
CREATE POLICY "Parents can view own data" ON public.parents
  FOR SELECT USING (auth.uid() = id);

-- Parents can update their own data
CREATE POLICY "Parents can update own data" ON public.parents
  FOR UPDATE USING (auth.uid() = id);

-- Parents can insert their own data
CREATE POLICY "Parents can insert own data" ON public.parents
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- WALLETS TABLE POLICIES
-- =====================================================

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own wallet
CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own wallet
CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CLASSES TABLE POLICIES
-- =====================================================

-- Teachers and students can view classes they're involved in
CREATE POLICY "Users can view their classes" ON public.classes
  FOR SELECT USING (
    auth.uid() = teacher_id OR 
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM public.parents p 
      WHERE p.id = auth.uid() 
      AND student_id = ANY(p.children_ids)
    )
  );

-- Teachers can create classes
CREATE POLICY "Teachers can create classes" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their classes
CREATE POLICY "Teachers can update their classes" ON public.classes
  FOR UPDATE USING (auth.uid() = teacher_id);

-- =====================================================
-- CLASS SESSIONS TABLE POLICIES
-- =====================================================

-- Teachers and students can view sessions they're involved in
CREATE POLICY "Users can view their sessions" ON public.class_sessions
  FOR SELECT USING (
    auth.uid() = teacher_id OR 
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM public.parents p 
      WHERE p.id = auth.uid() 
      AND student_id = ANY(p.children_ids)
    )
  );

-- Teachers can create sessions
CREATE POLICY "Teachers can create sessions" ON public.class_sessions
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their sessions
CREATE POLICY "Teachers can update their sessions" ON public.class_sessions
  FOR UPDATE USING (auth.uid() = teacher_id);

-- =====================================================
-- ASSIGNMENTS TABLE POLICIES
-- =====================================================

-- Teachers can manage their assignments
CREATE POLICY "Teachers can manage their assignments" ON public.assignments
  FOR ALL USING (auth.uid() = teacher_id);

-- Students can view assignments for their classes
CREATE POLICY "Students can view their assignments" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c 
      WHERE c.id = assignments.class_id 
      AND c.student_id = auth.uid()
    )
  );

-- Parents can view assignments for their children's classes
CREATE POLICY "Parents can view children's assignments" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c 
      JOIN public.parents p ON c.student_id = ANY(p.children_ids)
      WHERE c.id = assignments.class_id 
      AND p.id = auth.uid()
    )
  );

-- =====================================================
-- ASSIGNMENT SUBMISSIONS TABLE POLICIES
-- =====================================================

-- Students can manage their own submissions
CREATE POLICY "Students can manage their submissions" ON public.assignment_submissions
  FOR ALL USING (auth.uid() = student_id);

-- Teachers can view and grade submissions for their assignments
CREATE POLICY "Teachers can view and grade submissions" ON public.assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assignments a 
      WHERE a.id = assignment_submissions.assignment_id 
      AND a.teacher_id = auth.uid()
    )
  );

-- Parents can view their children's submissions
CREATE POLICY "Parents can view children's submissions" ON public.assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parents p 
      WHERE p.id = auth.uid() 
      AND assignment_submissions.student_id = ANY(p.children_ids)
    )
  );

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Users can view messages in conversations they participate in
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND auth.uid() = ANY(c.participants)
    )
  );

-- Users can send messages in conversations they participate in
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND auth.uid() = ANY(c.participants)
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- =====================================================
-- CONVERSATIONS TABLE POLICIES
-- =====================================================

-- Users can view conversations they participate in
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = ANY(participants));

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

-- Users can update conversations they participate in
CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = ANY(participants));

-- =====================================================
-- REVIEWS TABLE POLICIES
-- =====================================================

-- Students can create reviews
CREATE POLICY "Students can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can update their own reviews
CREATE POLICY "Students can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = student_id);

-- Teachers can respond to reviews about them
CREATE POLICY "Teachers can respond to reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Public reviews can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public reviews" ON public.reviews
  FOR SELECT USING (auth.role() = 'authenticated' AND is_public = true);

-- =====================================================
-- SESSION REQUESTS TABLE POLICIES
-- =====================================================

-- Students can manage their session requests
CREATE POLICY "Students can manage their requests" ON public.session_requests
  FOR ALL USING (auth.uid() = student_id);

-- Teachers can view and respond to requests for them
CREATE POLICY "Teachers can view and respond to requests" ON public.session_requests
  FOR ALL USING (auth.uid() = teacher_id);

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- MATERIALS LIBRARY TABLE POLICIES
-- =====================================================

-- Teachers can manage their materials
CREATE POLICY "Teachers can manage their materials" ON public.materials_library
  FOR ALL USING (auth.uid() = teacher_id);

-- Public materials can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public materials" ON public.materials_library
  FOR SELECT USING (auth.role() = 'authenticated' AND is_public = true);

-- Students can view materials for their classes
CREATE POLICY "Students can view class materials" ON public.materials_library
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c 
      WHERE c.id = materials_library.id 
      AND c.student_id = auth.uid()
    )
  );

-- =====================================================
-- PAYMENT METHODS TABLE POLICIES
-- =====================================================

-- Users can manage their own payment methods
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TOKEN TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.token_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- WITHDRAWAL REQUESTS TABLE POLICIES
-- =====================================================

-- Teachers can manage their withdrawal requests
CREATE POLICY "Teachers can manage their withdrawals" ON public.withdrawal_requests
  FOR ALL USING (auth.uid() = teacher_id);

-- =====================================================
-- ZOOM MEETINGS TABLE POLICIES
-- =====================================================

-- Teachers can manage their zoom meetings
CREATE POLICY "Teachers can manage their meetings" ON public.zoom_meetings
  FOR ALL USING (auth.uid() = teacher_id);

-- Students can view meetings for their classes
CREATE POLICY "Students can view their meetings" ON public.zoom_meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_sessions cs 
      WHERE cs.id = zoom_meetings.class_session_id 
      AND cs.student_id = auth.uid()
    )
  );

-- =====================================================
-- ZOOM ACCOUNTS TABLE POLICIES
-- =====================================================

-- Teachers can manage their zoom accounts
CREATE POLICY "Teachers can manage their zoom accounts" ON public.zoom_accounts
  FOR ALL USING (auth.uid() = teacher_id);

-- =====================================================
-- ADDITIONAL HELPER FUNCTIONS
-- =====================================================

-- Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id) = 'admin';
END;
$$;

-- Function to get user's wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT balance FROM public.wallets WHERE user_id = user_id);
END;
$$;

-- Function to get user's token balance
CREATE OR REPLACE FUNCTION get_token_balance(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT tokens FROM public.wallets WHERE user_id = user_id);
END;
$$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_student_id ON public.classes(student_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher_id ON public.class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_student_id ON public.class_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for auth functions
GRANT EXECUTE ON FUNCTION check_profile_exists(UUID) TO anon;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
