-- Migration: Add theme column to profiles table
-- This migration adds a theme preference column to store user-specific dark/light mode preferences

-- Add theme column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light' CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text]));

-- Add comment to the column
COMMENT ON COLUMN public.profiles.theme IS 'User preference for theme: light or dark mode';

-- Update existing profiles to have a default theme (optional, but recommended)
-- UPDATE public.profiles SET theme = 'light' WHERE theme IS NULL;

