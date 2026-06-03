import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TranscriptPayload {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  transcript: string;
  participants?: string[];
  contactId?: string;
  companyId?: string;
}

interface ProcessedTranscript {
  summary: string;
  key_points: string[];
  action_items: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
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

async function getOpenAIApiKey(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('provider', 'openai')
    .single();
  
  if (error || !data) {
    const { data: globalData } = await supabase
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('provider', 'openai')
      .single();
    
    if (!globalData) throw new Error('OpenAI API key not configured');
    return globalData.api_key;
  }
  
  return data.api_key;
}

async function processTranscriptWithOpenAI(
  transcript: string,
  apiKey: string
): Promise<ProcessedTranscript> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: `You are an AI assistant that analyzes meeting transcripts and extracts key information. 
Analyze the following meeting transcript and provide a structured summary.

Transcript:
${transcript}

Provide a JSON response with the following structure:
{
  "summary": "A 2-3 sentence summary of the meeting",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "action_items": ["Action item 1", "Action item 2"],
  "sentiment": "positive/neutral/negative",
  "topics": ["topic1", "topic2", "topic3"]
}`,
      tools: [{ type: 'computer_20241022', display_width: 1024, display_height: 768 }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const result = await response.json();
  
  try {
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

    if (!outputText && result.choices && result.choices[0]) {
      outputText = result.choices[0].message?.content || '';
    }

    if (!outputText) {
      outputText = result.response || JSON.stringify(result);
    }

    const parsed = JSON.parse(outputText);
    return {
      summary: parsed.summary || '',
      key_points: parsed.key_points || [],
      action_items: parsed.action_items || [],
      sentiment: parsed.sentiment || 'neutral',
      topics: parsed.topics || [],
    };
  } catch (e) {
    return {
      summary: result.choices?.[0]?.message?.content || 'Transcript processed',
      key_points: [],
      action_items: [],
      sentiment: 'neutral',
      topics: [],
    };
  }
}

async function createContactActivity(
  supabase: ReturnType<typeof createClient>,
  payload: TranscriptPayload,
  processed: ProcessedTranscript,
  userId: string
) {
  const workspaceMember = await supabase
    .from('workspace_members')
    .select('id')
    .eq('user_id', userId)
    .single();

  const workspaceMemberId = workspaceMember.data?.id;

  const activityData = {
    contact_id: payload.contactId || null,
    company_id: payload.companyId || null,
    workspace_member_id: workspaceMemberId,
    activity_type: 'meeting_transcript',
    name: payload.meetingTitle || 'Meeting Transcript',
    properties: {
      meeting_id: payload.meetingId,
      meeting_date: payload.meetingDate,
      participants: payload.participants || [],
      summary: processed.summary,
      key_points: processed.key_points,
      action_items: processed.action_items,
      sentiment: processed.sentiment,
      topics: processed.topics,
      full_transcript: payload.transcript.substring(0, 10000),
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

async function handleTranscriptProcessing(
  supabase: ReturnType<typeof createClient>,
  payload: TranscriptPayload,
  userId: string
) {
  const openAIApiKey = await getOpenAIApiKey(supabase, userId);
  
  const processed = await processTranscriptWithOpenAI(payload.transcript, openAIApiKey);
  
  const activity = await createContactActivity(supabase, payload, processed, userId);
  
  return {
    success: true,
    activity_id: activity.id,
    summary: processed.summary,
    key_points: processed.key_points,
    action_items: processed.action_items,
    sentiment: processed.sentiment,
    topics: processed.topics,
  };
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

    let body: TranscriptPayload;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!body.transcript) {
      return createResponse({ error: 'Transcript is required' }, 400);
    }

    if (!body.meetingId) {
      return createResponse({ error: 'Meeting ID is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const user = await getUserFromToken(token);
    
    const result = await handleTranscriptProcessing(supabase, body, user.id);
    
    return createResponse({ success: true, ...result });

  } catch (error) {
    console.error('Transcript processor error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});