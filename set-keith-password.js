/**
 * Set Keith's password directly in Supabase Auth
 * Using service role key to bypass RLS
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gadedbrnqzpfqtsdfzcg.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZGVkYnJucXpwZnF0c2RmemNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU2NjExNSwiZXhwIjoyMDU4MTQyMTE1fQ.8tJswPmNq0inajAtfMK6nINr-WQwE_vVJO13Aqf70-w';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setKeithPassword() {
  const newPassword = 'LXKTtPz6tkde#trr';
  const userEmail = 'keith@beappsolute.com';
  
  console.log('🔐 Setting password for ' + userEmail + '...');
  
  try {
    const { data: response, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    let users = [];
    if (Array.isArray(response)) {
      users = response;
    } else if (response && Array.isArray(response.users)) {
      users = response.users;
    } else if (response && response.data && Array.isArray(response.data)) {
      users = response.data;
    }
    
    let keithUser = users.find(u => u.email === userEmail);
    
    if (!keithUser) {
      console.log('User ' + userEmail + ' not found. Creating user...');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: newPassword,
        email_confirmed: true,
        user_metadata: {
          first_name: 'Keith',
          last_name: 'User',
          role: 'wl_user',
          tier: 'basic'
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        return;
      }
      
      keithUser = newUser.user;
      console.log('✅ User created successfully!');
    } else {
      console.log('✅ Found existing user');
      
      const { data, error } = await supabase.auth.admin.updateUserById(
        keithUser.id,
        { password: newPassword }
      );
      
      if (error) {
        console.error('Error updating password:', error);
        return;
      }
      
      console.log('✅ Password updated successfully!');
    }
    
    console.log('📧 User email:', keithUser.email);
    console.log('👤 User ID:', keithUser.id);
    console.log('🔑 Password set to:', newPassword);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

setKeithPassword();
