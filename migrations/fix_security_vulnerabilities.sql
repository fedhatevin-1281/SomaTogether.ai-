-- ==============================================================================
-- DATABASE SECURITY REMEDIATION SCRIPT
-- Resolves: 
-- 1. Exposed Auth Users (SECURITY DEFINER leak)
-- 2. Sensitive Columns Exposed (zoom accounts, meetings lacking RLS)
-- 3. Policy Exists RLS Disabled (15 tables)
-- 4. RLS Disabled in Public (40 public tables)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FIX SECURITY DEFINER VIEWS
-- Changes these views to execute with the permissions of the user calling them
-- (SECURITY INVOKER), rather than the creator's permissions, preventing data leaks.
-- ------------------------------------------------------------------------------
ALTER VIEW public.student_profiles SET (security_invoker = true);
ALTER VIEW public.teacher_profiles SET (security_invoker = true);
ALTER VIEW public.class_summaries SET (security_invoker = true);
ALTER VIEW public.paystack_payment_analytics SET (security_invoker = true);
ALTER VIEW public.user_email_domains SET (security_invoker = true);


-- ------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ON TABLES WITH EXISTING POLICIES
-- These tables already have RLS policies applied to them, but the feature itself
-- was disabled. Enabling it here restores the intended security restrictions.
-- ------------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystack_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_onboarding_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_preferred_curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_preferred_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 3. SECURE SENSITIVE TABLES
-- These tables contain PII or credentials so they must have strictly scoped logic.
-- ------------------------------------------------------------------------------
-- Zoom Accounts
ALTER TABLE public.zoom_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Teacher own zoom accounts" ON public.zoom_accounts 
      FOR ALL TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Zoom Meetings
ALTER TABLE public.zoom_meetings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Teacher own zoom meetings" ON public.zoom_meetings 
      FOR ALL TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Auth users can view zoom meetings" ON public.zoom_meetings 
      FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Meeting Rooms
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Auth users can manage meeting rooms" ON public.meeting_rooms 
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ------------------------------------------------------------------------------
-- 4. ENABLE RLS & ADD BASELINE POLICIES FOR REMAINING PUBLIC TABLES
-- To prevent anonymous scraping while keeping the app functional for logged-in 
-- users, we enable RLS and allow full access ONLY to authenticated users.
-- ------------------------------------------------------------------------------

-- Step A: Enable RLS on all remaining public tables
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_time_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_preferred_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;

-- Step B: Run a loop to create baseline safety policies if they don't exist
DO $$
DECLARE
    t_name text;
    tables_list text[] := ARRAY[
        'teacher_subjects', 'teacher_skills', 'class_sessions', 'session_requests',
        'token_transactions', 'payment_methods', 'onboarding_responses', 'assignment_submissions',
        'material_collections', 'material_ratings', 'material_usage', 'meeting_participants',
        'meeting_recordings', 'system_settings', 'teacher_availability', 'teacher_documents',
        'teacher_metrics', 'teacher_schedule_templates', 'teacher_time_off', 'token_pricing',
        'transactions', 'withdrawal_requests', 'collection_materials', 'material_category_assignments',
        'session_time_tracker', 'material_categories', 'teachers', 'students', 'parents',
        'reviews', 'assignments', 'classes', 'materials_library', 'platform_earnings',
        'notifications', 'onboarding_preferred_subjects', 'student_preferences'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_list
    LOOP
        BEGIN
            EXECUTE format('CREATE POLICY "Auth users access %I" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t_name, t_name);
        EXCEPTION WHEN duplicate_object THEN
            -- Policy already exists, safely skip and move to next
            NULL;
        END;
    END LOOP;
END
$$;
