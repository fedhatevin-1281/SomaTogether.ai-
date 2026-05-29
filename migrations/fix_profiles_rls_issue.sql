-- Fix for missing RLS policies on the profiles table
-- When RLS was specifically enabled on the profiles table, it locked down read access
-- causing teacher profiles to not load (returning 0 rows) and 406 Not Acceptable errors.

DO $$ BEGIN
    CREATE POLICY "Auth users select profiles" ON public.profiles 
      FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own profile" ON public.profiles 
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON public.profiles 
      FOR UPDATE TO authenticated USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- If unauthenticated users need to view teacher profiles on the landing page, we can also add:
DO $$ BEGIN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles 
      FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
