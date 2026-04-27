import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const email = 'trcole3@theritegroup.com';
  const password = 'SmartCRM2026';

  console.log('Testing login for', email);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Login failed:', error.message);
    console.error('Error details:', error);
  } else {
    console.log('Login successful:', data.user?.email);
  }
}

testLogin();
