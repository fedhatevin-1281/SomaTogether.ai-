const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runExtendedDiagnostics() {
  console.log('\n--- EXTENDED DIAGNOSTICS ---');

  try {
    // 1. Fetch ALL profiles
    console.log('\n1. Fetching ALL Profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    console.log(`Found ${profiles.length} total profiles:`);
    profiles.forEach(p => console.log(` - ID: ${p.id}, Role: ${p.role}, Email: ${p.email}, Name: ${p.full_name}`));

    // 2. Fetch ALL students
    console.log('\n2. Fetching ALL Students...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, tokens');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else {
      console.log(`Found ${students.length} student records:`);
      students.forEach(s => console.log(` - ID: ${s.id}, Tokens: ${s.tokens}`));
    }

    // 3. Fetch ALL teachers
    console.log('\n3. Fetching ALL Teachers...');
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('id, is_available');

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
    } else {
      console.log(`Found ${teachers.length} teacher records:`);
      teachers.forEach(t => console.log(` - ID: ${t.id}, Available: ${t.is_available}`));
    }

    // 4. Fetch ALL session requests
    console.log('\n4. Fetching ALL Session Requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('session_requests')
      .select('id, student_id, teacher_id, status');

    if (requestsError) {
      console.error('Error fetching session requests:', requestsError);
    } else {
      console.log(`Found ${requests.length} session requests:`);
      requests.forEach(r => console.log(` - ID: ${r.id}, Student: ${r.student_id}, Teacher: ${r.teacher_id}, Status: ${r.status}`));
    }

  } catch (err) {
    console.error('Fatal diagnostics error:', err);
  }
}

runExtendedDiagnostics();
