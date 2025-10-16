import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// ✅ Create and export the Supabase client with standard configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence for better UX
    autoRefreshToken: true, // Enable automatic token refresh
    detectSessionInUrl: true, // Enable URL-based session detection
  }
});
