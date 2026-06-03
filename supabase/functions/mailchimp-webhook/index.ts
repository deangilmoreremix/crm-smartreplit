import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MailchimpWebhookPayload {
  type: string; // subscribe, unsubscribe, profile, upemail, cleaned
  fired_at: string;
  data: {
    id: string; // Mailchimp list ID
    list_id: string;
    email: string;
    email_type: string; // html or text
    ip_opt: string; // IP address of opt-in
    ip_signup: string; // IP address of signup
    [key: string]: unknown;
  };
  // For email events (opens, clicks)
  event?: string; // open, click, etc.
  timestamp?: string;
  ip_address?: string;
  url?: string; // For clicks
};

function createResponse(data: unknown, statusCode = 200) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUserFromToken(token: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  return user;
}

async function findContactByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string
) {
  const { data } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();
  
  return data;
}

async function updateContactMailchimpData(
  supabase: ReturnType<typeof createClient>,
  contactId: number,
  payload: MailchimpWebhookPayload
) {
  const updates: any = {
    mailchimpSyncedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Update Mailchimp ID if not already set
  if (payload.data.id) {
    updates.mailchimpId = payload.data.id;
  }

  // Update email ID
  if (payload.data.email) {
    updates.mailchimpEmailId = payload.data.email;
  }

  // Update status based on webhook type
  if (payload.type) {
    updates.mailchimpStatus = payload.type;
  }

  // Store merge fields if available
  if (payload.data.merge_fields) {
    updates.mailchimpMergeFields = payload.data.merge_fields;
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createMailchimpActivity(
  supabase: ReturnType<typeof createClient>,
  contactId: number,
  payload: MailchimpWebhookPayload
) {
  const workspaceMemberRes = await supabase
    .from('workspace_members')
    .select('id')
    .limit(1)
    .single();
  
  const workspaceMemberId = workspaceMemberRes.data?.id;

  let activityName = 'Mailchimp Event';
  let activityType = 'mailchimp_event';
  let properties: any = {
    mailchimpEventType: payload.type,
    mailchimpListId: payload.data.id,
    mailchimpEmail: payload.data.email,
    rawPayload: payload,
  };

  // Set specific activity name and type based on event
  if (payload.type === 'subscribe') {
    activityName = 'Subscribed to Mailchimp List';
    activityType = 'mailchimp_subscribe';
  } else if (payload.type === 'unsubscribe') {
    activityName = 'Unsubscribed from Mailchimp List';
    activityType = 'mailchimp_unsubscribe';
  } else if (payload.type === 'cleaned') {
    activityName = 'Email Cleaned from Mailchimp List';
    activityType = 'mailchimp_cleaned';
  } else if (payload.type === 'profile') {
    activityName = 'Profile Updated in Mailchimp';
    activityType = 'mailchimp_profile_update';
  } else if (payload.type === 'upemail') {
    activityName = 'Email Changed in Mailchimp';
    activityType = 'mailchimp_email_change';
  }

  // Handle email events (opens, clicks)
  if (payload.event) {
    if (payload.event === 'open') {
      activityName = 'Opened Mailchimp Email';
      activityType = 'mailchimp_open';
      properties = {
        ...properties,
        mailchimpCampaignId: payload.data.campaign_id,
        mailchimpEmailSubject: payload.data.subject,
        ipAddress: payload.ip_address,
        timestamp: payload.timestamp,
      };
    } else if (payload.event === 'click') {
      activityName = 'Clicked Link in Mailchimp Email';
      activityType = 'mailchimp_click';
      properties = {
        ...properties,
        mailchimpCampaignId: payload.data.campaign_id,
        mailchimpUrl: payload.url,
        ipAddress: payload.ip_address,
        timestamp: payload.timestamp,
      };
    }
  }

  const activityData = {
    contact_id: contactId,
    workspace_member_id: workspaceMemberId,
    activity_type: activityType,
    name: activityName,
    properties: properties,
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
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse({ error: 'Missing or invalid authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');

    let body: MailchimpWebhookPayload;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!body.data?.email) {
      return createResponse({ error: 'Email is required in webhook payload' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const user = await getUserFromToken(token);
    
    // Find contact by email
    const contact = await findContactByEmail(supabase, body.data.email);
    if (!contact) {
      return createResponse({ error: 'Contact not found for email: ' + body.data.email }, 404);
    }

    // Update contact with Mailchimp data
    await updateContactMailchimpData(supabase, contact.id, body);
    
    // Create activity record
    const activity = await createMailchimpActivity(supabase, contact.id, body);

    return createResponse({
      success: true,
      contact_id: contact.id,
      activity_id: activity?.id,
      message: 'Mailchimp webhook processed successfully',
    });

  } catch (error) {
    console.error('Mailchimp webhook error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});