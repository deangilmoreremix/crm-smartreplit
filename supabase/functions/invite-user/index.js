/**
 * Supabase Edge Function: invite-user
 * 
 * This function is used to send user invitations via email.
 * It requires the service_role key and should only be called from the server.
 * 
 * Deploy with: supabase functions deploy invite-user
 * 
 * Usage:
 * POST /functions/v1/invite-user
 * Headers: Authorization: Bearer SERVICE_ROLE_KEY
 * Body: { "email": "user@example.com" }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ 
        error: 'Service role key not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ 
        error: 'Valid email is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Send invitation email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);

    if (error) {
      console.error('Invite error:', error);
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Invitation sent successfully:', email);

    return new Response(JSON.stringify({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        user: data.user,
        message: data.message
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ 
      error: err.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
