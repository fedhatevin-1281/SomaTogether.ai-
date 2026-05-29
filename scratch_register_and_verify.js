const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runRegisterAndVerify() {
  const timestamp = Date.now();
  const email = `test_student_${timestamp}@gmail.com`;
  const password = 'demoPassword123!';

  console.log(`\n1. Registering new student with email: ${email}...`);
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `Test Student ${timestamp}`,
          role: 'student',
          timezone: 'UTC',
          language: 'en'
        }
      }
    });

    if (signUpError) {
      console.error('Signup failed:', signUpError);
      return;
    }

    const userId = signUpData.user?.id;
    console.log('Signup succeeded! User ID:', userId);

    console.log('Waiting 3 seconds for trigger/async processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n2. Verifying if profile was created...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else {
      console.log('Profile database row:', profile);
    }

    console.log('\n3. Verifying if student record was created...');
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (studentError) {
      console.error('Error fetching student:', studentError);
    } else {
      console.log('Student database row:', student);
    }

    console.log('\n4. Verifying if wallet was created...');
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
    } else {
      console.log('Wallet database row:', wallet);
    }

  } catch (err) {
    console.error('Exception during register/verify:', err);
  }
}

runRegisterAndVerify();
