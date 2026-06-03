import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WebmeticVisitor {
  visitorId: string;
  email?: string;
  company?: string;
  name?: string;
  pagesVisited?: string[];
  lastActivity?: string;
  source?: string;
  metadata?: Record<string, string>;
}

interface WebmeticWebhookPayload {
  type: 'visitor' | 'pageview' | 'conversion';
  visitor: WebmeticVisitor;
  timestamp?: string;
}

function createResponse(data: unknown, statusCode = 200) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function findContactByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string
) {
  const { data } = await supabase
    .from('contacts')
    .select('id, full_name, company_name')
    .eq('email', email.toLowerCase())
    .single();
  
  return data;
}

async function syncVisitorToContact(
  supabase: ReturnType<typeof createClient>,
  payload: WebmeticWebhookPayload
) {
  const { visitor } = payload;
  
  let contactId: string | null = null;
  let companyId: string | null = null;

  if (visitor.email) {
    const contact = await findContactByEmail(supabase, visitor.email);
    if (contact) {
      contactId = contact.id;
      
      if (contact.company_name && !visitor.company) {
        visitor.company = contact.company_name;
      }
    }
  }

  const workspaceMemberRes = await supabase
    .from('workspace_members')
    .select('id')
    .limit(1)
    .single();
  
  const workspaceMemberId = workspaceMemberRes.data?.id;

  const activityData = {
    contact_id: contactId,
    workspace_member_id: workspaceMemberId,
    activity_type: 'web_visitor',
    name: `Web Visit: ${visitor.pagesVisited?.[0] || 'Landing Page'}`,
    properties: {
      visitor_id: visitor.visitorId,
      pages_visited: visitor.pagesVisited || [],
      last_activity: visitor.lastActivity,
      source: visitor.source,
      company: visitor.company,
      metadata: visitor.metadata,
      event_type: payload.type,
    },
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('contact_activities')
    .insert(activityData)
    .select()
    .single();

  if (error) throw error;
  return { activityId: data?.id, contactId, companyId };
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

    let body: WebmeticWebhookPayload;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!body.visitor?.visitorId) {
      return createResponse({ error: 'Visitor ID is required' }, 400);
    }

    console.log(`Processing Webmetic webhook: ${body.type}`);

    const result = await syncVisitorToContact(supabase, body);

    return createResponse({
      success: true,
      ...result,
      message: 'Webmetic visitor synced successfully',
    });

  } catch (error) {
    console.error('Webmetic webhook error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});