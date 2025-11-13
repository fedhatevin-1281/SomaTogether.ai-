# Database Migration Required for Theme Feature

## Issue
The `theme` column doesn't exist in the `profiles` table yet. You need to run the migration to add it.

## How to Run the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `migrations/add_theme_to_profiles.sql`
5. Click **Run** (or press Ctrl+Enter)

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution
Connect to your PostgreSQL database and run:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light' CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text]));
```

## What This Does
- Adds a `theme` column to the `profiles` table
- Sets default value to `'light'`
- Adds a CHECK constraint to ensure only `'light'` or `'dark'` values are allowed
- Allows each user to have their own theme preference stored in the database

## After Migration
Once the migration is run:
- Theme preferences will be stored per user in the database
- Theme preferences will sync across devices for the same user
- The error messages will stop appearing
- Theme will work correctly for all users

## Note
Until the migration is run, the app will:
- Still work correctly
- Store theme preferences in localStorage (browser-specific)
- Show error messages in the console (these are harmless)

