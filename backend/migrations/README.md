# Database Migrations

## Adding Theme Column to Profiles Table

This migration adds a `theme` column to the `profiles` table to store user-specific dark/light mode preferences.

### Running the Migration

1. **Using Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `add_theme_to_profiles.sql`
   - Run the query

2. **Using Supabase CLI:**
   ```bash
   supabase db push
   ```

3. **Manual SQL Execution:**
   - Connect to your PostgreSQL database
   - Run the SQL commands from `add_theme_to_profiles.sql`

### What This Migration Does

- Adds a `theme` column to the `profiles` table
- Sets default value to `'light'`
- Adds a CHECK constraint to ensure only `'light'` or `'dark'` values are allowed
- The column is nullable, but defaults to `'light'` for new users

### After Migration

Once the migration is run, the application will:
- Store each user's theme preference in the database
- Load the user's theme preference when they log in
- Sync theme preferences across devices for the same user
- Fall back to localStorage if the database column doesn't exist (for backward compatibility)

### Notes

- Existing users will have their theme set to `'light'` by default
- Users can change their theme preference in Settings
- Theme preferences are user-specific and will persist across sessions and devices

