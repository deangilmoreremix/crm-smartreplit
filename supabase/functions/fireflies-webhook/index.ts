import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FirefliesWebhookPayload {
  type: 'transcript' | 'summary' | 'meeting';
  meeting: {
    id: string;
    title: string;
    date: string;
    duration?: number;
    transcript?: string;
    summary?: string;
    participants?: Array<{
      name: string;
      email: string;
      role?: string;
    }>;
  };
  contactEmail?: string;
}

function createResponse(data: unknown, statusCode = 200) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function findOrCreateContact(
  supabase: ReturnType<typeof createClient>,
  email: string,
  name?: string
) {
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      email: email.toLowerCase(),
      full_name: name || email.split('@')[0],
      source: 'fireflies_webhook',
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id;
}

async function processFirefliesTranscript(
  supabase: ReturnType<typeof createClient>,
  payload: FirefliesWebhookPayload
) {
  const contactId = payload.contactEmail
    ? await findOrCreateContact(supabase, payload.contactEmail)
    : null;

  const workspaceMemberRes = await supabase
    .from('workspace_members')
    .select('id')
    .limit(1)
    .single();
  
  const workspaceMemberId = workspaceMemberRes.data?.id;

  const activityData = {
    contact_id: contactId,
    workspace_member_id: workspaceMemberId,
    activity_type: 'meeting_transcript',
    name: payload.meeting.title || 'Fireflies Meeting',
    properties: {
      meeting_id: payload.meeting.id,
      meeting_date: payload.meeting.date,
      duration_minutes: payload.meeting.duration,
      participants: payload.meeting.participants || [],
      summary: payload.meeting.summary,
      transcript: payload.meeting.transcript,
      source: 'fireflies',
      raw_payload: payload,
    },
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('contact_activities')
    .insert(activityData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: FirefliesWebhookPayload;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!body.meeting?.id) {
      return createResponse({ error: 'Meeting ID is required' }, 400);
    }

    if (!body.meeting?.transcript && !body.meeting?.summary) {
      return createResponse({ error: 'Either transcript or summary is required' }, 400);
    }

    const activity = await processFirefliesTranscript(supabase, body);

    return createResponse({
      success: true,
      activity_id: activity?.id,
      message: 'Fireflies webhook processed successfully',
    });

  } catch (error) {
    console.error('Fireflies webhook error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});