const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const emails = [
  'derrickfedha09@gmail.com',
  'michellecheptoo9@gmail.com',
  'fedhatevin@gmail.com',
  'somatogether25@gmail.com',
  'martinluther200024@gmail.com',
  'peacetari2001@gmail.com',
  'rashelnick04@gmail.com'
];

async function findWorkingUser() {
  console.log('--- SCANNING TEST ACCOUNTS FOR LOGIN ---');
  const teacherId = '4348055b-a67b-497e-89df-c582a340bc79'; // Jumba Evans
  
  for (const email of emails) {
    console.log(`\nTrying to sign in with ${email}...`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'demo123'
      });
      
      if (error) {
        console.log(` > Failed: ${error.message}`);
        continue;
      }
      
      const studentId = data.user.id;
      console.log(` >> SUCCESS! Logged in as ${email} (ID: ${studentId})`);
      
      // Let's run the diagnostic and insert test for this working user!
      await executeDiagnosticAndTest(studentId, teacherId);
      return; // Stop after first working user
      
    } catch (err) {
      console.error(` > Exception for ${email}:`, err.message);
    }
  }
  
  console.error('\nCould not find any working test account with password "demo123"');
}

async function executeDiagnosticAndTest(studentId, teacherId) {
  try {
    // 2. Verify profiles and student record
    console.log('\n2. Checking if profile exists...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else {
      console.log('Profile record found in database:', {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        is_verified: profile.is_verified
      });
    }

    console.log('\n3. Checking if student record exists...');
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.warn('Student record not found in database, attempting manual INSERT...');
      
      const { data: studentInsert, error: studentInsertError } = await supabase
        .from('students')
        .insert({
          id: studentId,
          timezone: 'UTC',
          preferred_languages: ['en'],
          tokens: 100
        })
        .select()
        .single();

      if (studentInsertError) {
        console.error('Manual student insert failed:', studentInsertError);
      } else {
        console.log('Manual student insert succeeded! Row data:', studentInsert);
      }
    } else {
      console.log('Student record already exists:', student);
    }

    console.log('\n4. Checking if wallet record exists...');
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', studentId)
      .single();

    if (walletError) {
      console.warn('Wallet record not found in database, attempting manual INSERT...');
      
      const { data: walletInsert, error: walletInsertError } = await supabase
        .from('wallets')
        .insert({
          user_id: studentId,
          currency: 'USD',
          balance: 0.00,
          tokens: 100
        })
        .select()
        .single();

      if (walletInsertError) {
        console.error('Manual wallet insert failed:', walletInsertError);
      } else {
        console.log('Manual wallet insert succeeded! Row data:', walletInsert);
      }
    } else {
      console.log('Wallet record already exists:', wallet);
    }

    // 5. Ensure the teacher record exists in the public.teachers table
    console.log('\n5. Checking if teacher record exists for Jumba Evans...');
    const { data: teacherCheck, error: teacherCheckError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .single();

    if (teacherCheckError) {
      console.warn('Teacher record not found, attempting to manually create it...');
      
      const { data: teacherInsert, error: teacherInsertError } = await supabase
        .from('teachers')
        .insert({
          id: teacherId,
          hourly_rate: 20.00,
          currency: 'USD',
          is_available: true,
          verification_status: 'verified'
        })
        .select()
        .single();

      if (teacherInsertError) {
        console.error('Failed to manually create teacher record:', teacherInsertError);
      } else {
        console.log('Successfully created teacher record!', teacherInsert);
      }
    } else {
      console.log('Teacher record already exists:', teacherCheck);
    }

    // 6. Attempt to insert a test request into public.session_requests now that child rows are set up
    console.log('\n6. Attempting to insert a test request into public.session_requests...');
    
    const requestedStart = new Date();
    requestedStart.setDate(requestedStart.getDate() + 1); // tomorrow
    const requestedEnd = new Date(requestedStart.getTime() + 1 * 60 * 60 * 1000); // 1 hour duration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const payload = {
      student_id: studentId,
      teacher_id: teacherId,
      requested_start: requestedStart.toISOString(),
      requested_end: requestedEnd.toISOString(),
      duration_hours: 1.0,
      tokens_required: 10,
      message: 'Test message from diagnostic trace script',
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    };

    console.log('Session request payload:', payload);

    const { data: requestInsert, error: requestInsertError } = await supabase
      .from('session_requests')
      .insert(payload)
      .select()
      .single();

    console.log('Insert response:', requestInsert);
    console.log('Insert error:', requestInsertError);

  } catch (err) {
    console.error('Fatal execution error:', err);
  }
}

findWorkingUser();
