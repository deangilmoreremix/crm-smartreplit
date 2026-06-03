import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SummaryRequest {
  contactId?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  channel: 'slack' | 'discord' | 'email' | 'internal';
  channelConfig?: {
    webhookUrl?: string;
    email?: string;
  };
}

interface ActivitySummary {
  period: string;
  totalActivities: number;
  byType: Record<string, number>;
  keyEvents: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
}

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

async function generateSummaryWithOpenAI(
  activities: Array<{
    name: string;
    activity_type: string;
    created_at: string;
    properties?: Record<string, unknown>;
    workspace_member?: { full_name: string };
  }>,
  contactInfo: { name?: string; company?: string },
  apiKey: string
): Promise<ActivitySummary> {
  const activitiesText = activities.map(a => {
    const props = a.properties || {};
    const body = props.body || props.summary || '';
    return `[${a.activity_type.toUpperCase()}] ${a.workspace_member?.full_name || 'System'} - ${a.name}${body ? `: ${body}` : ''}`;
  }).join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: `You are an AI assistant that generates activity summaries from CRM data.

Contact: ${contactInfo.name || 'Unknown'}
Company: ${contactInfo.company || 'Unknown'}

Recent Activities:
${activitiesText}

Generate a JSON summary with:
{
  "period": "Description of time period",
  "totalActivities": number,
  "byType": {"email": 5, "call": 3, ...},
  "keyEvents": ["Key event 1", "Key event 2"],
  "actionItems": ["Action item 1", "Action item 2"],
  "sentiment": "positive/neutral/negative",
  "summary": "2-3 sentence summary of overall activity and status"
}`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate summary');
  }

  const result = await response.json();
  let outputText = '';
  
  if (result.output && result.output.length > 0) {
    for (const output of result.output) {
      if (output.type === 'message' && output.content) {
        for (const content of output.content) {
          if (content.type === 'output_text') {
            outputText = content.text || '';
            break;
          }
        }
      }
    }
  }

  if (!outputText) {
    outputText = result.choices?.[0]?.message?.content || JSON.stringify(result);
  }

  try {
    const parsed = JSON.parse(outputText);
    return {
      period: parsed.period || 'Recent activity',
      totalActivities: parsed.totalActivities || activities.length,
      byType: parsed.byType || {},
      keyEvents: parsed.keyEvents || [],
      actionItems: parsed.actionItems || [],
      sentiment: parsed.sentiment || 'neutral',
      summary: parsed.summary || 'Activity summary generated',
    };
  } catch {
    return {
      period: 'Recent activity',
      totalActivities: activities.length,
      byType: {},
      keyEvents: [],
      actionItems: [],
      sentiment: 'neutral' as const,
      summary: outputText || 'Summary generated',
    };
  }
}

async function sendToSlack(summary: ActivitySummary, webhookUrl: string): Promise<boolean> {
  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📊 Activity Summary Report' },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Summary*\n${summary.summary}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Total Activities:*\n${summary.totalActivities}` },
          { type: 'mrkdwn', text: `*Sentiment:*\n${summary.sentiment}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: summary.keyEvents.length > 0
            ? `*Key Events*\n${summary.keyEvents.map(e => `• ${e}`).join('\n')}`
            : '*Key Events*\nNo major events',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: summary.actionItems.length > 0
            ? `*Action Items*\n${summary.actionItems.map(a => `• ${a}`).join('\n')}`
            : '*Action Items*\nNo pending action items',
        },
      },
    ],
  };

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return resp.ok;
}

async function sendToDiscord(summary: ActivitySummary, webhookUrl: string): Promise<boolean> {
  const payload = {
    embeds: [
      {
        title: '📊 Activity Summary Report',
        color: 0x6366f1,
        fields: [
          { name: 'Summary', value: summary.summary, inline: false },
          { name: 'Total Activities', value: summary.totalActivities.toString(), inline: true },
          { name: 'Sentiment', value: summary.sentiment, inline: true },
          {
            name: 'Key Events',
            value: summary.keyEvents.length > 0 ? summary.keyEvents.join('\n') : 'No major events',
            inline: false,
          },
          {
            name: 'Action Items',
            value: summary.actionItems.length > 0 ? summary.actionItems.join('\n') : 'No pending actions',
            inline: false,
          },
        ],
        footer: { text: `Period: ${summary.period}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return resp.ok;
}

async function fetchActivities(
  supabase: ReturnType<typeof createClient>,
  request: SummaryRequest,
  userId: string
) {
  let query = supabase
    .from('contact_activities')
    .select(`
      *,
      workspace_member:workspace_members(full_name)
    `)
    .eq('workspace_member.user_id', userId);

  if (request.contactId) {
    query = query.eq('contact_id', request.contactId);
  }

  if (request.companyId) {
    query = query.eq('company_id', request.companyId);
  }

  if (request.startDate) {
    query = query.gte('created_at', request.startDate);
  }

  if (request.endDate) {
    query = query.lte('created_at', request.endDate);
  }

  query = query.order('created_at', { ascending: false }).limit(50);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getContactInfo(
  supabase: ReturnType<typeof createClient>,
  contactId?: string,
  companyId?: string
) {
  let name = 'Unknown Contact';
  let company = 'Unknown Company';

  if (contactId) {
    const { data } = await supabase
      .from('contacts')
      .select('full_name, company_name')
      .eq('id', contactId)
      .single();
    if (data) {
      name = data.full_name || name;
      company = data.company_name || company;
    }
  }

  if (companyId && name === 'Unknown Contact') {
    const { data } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();
    if (data) company = data.name;
  }

  return { name, company };
}

async function getOpenAIApiKey(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('provider', 'openai')
    .single();
  
  if (!data) throw new Error('OpenAI API key not configured');
  return data.api_key;
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

    let body: SummaryRequest;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!body.channel) {
      return createResponse({ error: 'Channel is required (slack, discord, email, or internal)' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const user = await getUserFromToken(token);
    
    const activities = await fetchActivities(supabase, body, user.id);
    
    if (activities.length === 0) {
      return createResponse({ error: 'No activities found for the specified criteria' }, 404);
    }

    const contactInfo = await getContactInfo(supabase, body.contactId, body.companyId);
    const apiKey = await getOpenAIApiKey(supabase, user.id);
    
    const summary = await generateSummaryWithOpenAI(activities, contactInfo, apiKey);
    
    let deliveryStatus = 'internal';
    
    if (body.channel === 'slack' && body.channelConfig?.webhookUrl) {
      const sent = await sendToSlack(summary, body.channelConfig.webhookUrl);
      deliveryStatus = sent ? 'slack_delivered' : 'slack_failed';
    } else if (body.channel === 'discord' && body.channelConfig?.webhookUrl) {
      const sent = await sendToDiscord(summary, body.channelConfig.webhookUrl);
      deliveryStatus = sent ? 'discord_delivered' : 'discord_failed';
    }
    
    await supabase
      .from('contact_activities')
      .insert({
        contact_id: body.contactId || null,
        company_id: body.companyId || null,
        workspace_member_id: user.id,
        activity_type: 'summary_report',
        name: `Activity Summary - ${summary.period}`,
        properties: {
          summary: summary.summary,
          total_activities: summary.totalActivities,
          sentiment: summary.sentiment,
          delivery_status: deliveryStatus,
        },
      });

    return createResponse({
      success: true,
      summary,
      deliveryStatus,
    });

  } catch (error) {
    console.error('Activity summary error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});