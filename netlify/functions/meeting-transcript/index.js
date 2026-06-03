// netlify/functions/meeting-transcript/index.js
import { createClient } from "@supabase/supabase-js";

let supabase = null;
function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function createResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
}

async function getUserFromToken(token) {
  try {
    const supabase2 = getSupabaseClient();
    const { data: { user }, error } = await supabase2.auth.getUser(token);
    if (error || !user) {
      throw new Error("Invalid token");
    }
    return user;
  } catch (error) {
    throw new Error("Authentication failed");
  }
}

// PII Redaction utility
function redactPII(text) {
  if (!text) return text;
  
  const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const NAME_PATTERNS = /\b(John|Jane|Michael|Sarah|David|Emily|Robert|Lisa|Christopher|Jessica|Daniel|Ashley|Matthew|Jennifer|Andrew|Elizabeth|Joseph|Jennifer|William|Margaret|Charles|Frances|Joseph|Betty|Carol|Sandra|Karen|Lisa|Nancy|Betty|Helen|Sandra|Donna|Carol|Ruth|Sharon|Michelle|Laura|Sarah|Kimberly|Deborah|Dorothy|Lisa|Nancy|Karen|Betty|Helen|Sandra|Donna|Carol|Ruth|Sharon|Michelle|Laura|Kimberly|Deborah|Dorothy)\b/gi;
  
  return text
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(NAME_PATTERNS, '[REDACTED_NAME]');
}

// Date parsing utility for relative dates
function parseRelativeDate(dateString, referenceDate = new Date()) {
  const lower = dateString.toLowerCase().trim();
  const now = new Date(referenceDate);
  
  // Handle specific relative dates
  if (lower.includes('today')) {
    return now.toISOString().split('T')[0];
  }
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  if (lower.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  // Handle "next X" patterns
  const nextWeekMatch = lower.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (nextWeekMatch) {
    const dayName = nextWeekMatch[1];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName);
    const currentDay = now.getDay();
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0) daysAhead += 7; // Next week
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + daysAhead);
    return nextDay.toISOString().split('T')[0];
  }
  
  // Handle "in X days" patterns
  const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  }
  
  // Handle "end of week" 
  if (lower.includes('end of week') || lower.includes('weekend')) {
    const endOfWeek = new Date(now);
    const daysUntilSaturday = 6 - now.getDay(); // Saturday is day 6
    if (daysUntilSaturday < 0) {
      endOfWeek.setDate(now.getDate() + daysUntilSaturday + 7);
    } else {
      endOfWeek.setDate(now.getDate() + daysUntilSaturday);
    }
    return endOfWeek.toISOString().split('T')[0];
  }
  
  // If we can't parse, return null to use meeting date
  return null;
}

async function handler(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }
  
  if (event.httpMethod !== "POST") {
    return createResponse({ error: "Method not allowed" }, 405);
  }
  
  try {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createResponse({ error: "Missing or invalid authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const user = await getUserFromToken(token);
    
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return createResponse({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { 
      transcript, 
      meetingTitle, 
      meetingDate, 
      participants = [], 
      token: webhookToken,
      relatedPersonId,
      relatedCompanyId,
      relatedDealId
    } = requestBody;
    
    // Validate required fields
    if (!transcript || transcript.trim().length === 0) {
      return createResponse({ error: "transcript is required and cannot be empty" }, 400);
    }
    
    if (!meetingTitle) {
      return createResponse({ error: "meetingTitle is required" }, 400);
    }
    
    if (!meetingDate) {
      return createResponse({ error: "meetingDate is required" }, 400);
    }
    
    // Validate webhook token (optional but recommended)
    const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;
    if (expectedToken && webhookToken !== expectedToken) {
      return createResponse({ error: "Invalid webhook token" }, 401);
    }
    
    // Redact PII from transcript for privacy
    const safeTranscript = redactPII(transcript);
    
    // Get AI provider configuration from user settings or environment
    const { data: userData, error: userError } = await getSupabaseClient()
      .from('user_api_keys')
      .select('openai_api_key, anthropic_api_key, gemini_api_key')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.warn('Could not fetch user API keys, using environment variables');
    }
    
    // Prepare AI analysis prompt
    const analysisPrompt = `
Analyze the following meeting transcript and extract:
1. A concise summary (2-3 sentences)
2. Action items with assignees and due dates (if mentioned)
3. Commitments made by each participant
4. Key decisions made
5. Any follow-up meetings scheduled

Meeting Title: ${meetingTitle}
Meeting Date: ${meetingDate}
Participants: ${participants.join(', ')}

Transcript:
${safeTranscript}

Please respond in JSON format with the following structure:
{
  "summary": "string",
  "action_items": [
    {
      "description": "string",
      "assignee": "string (participant name or 'unassigned')",
      "due_date": "string (ISO date format or null)",
      "completed": false
    }
  ],
  "commitments": [
    {
      "participant": "string",
      "commitment": "string"
    }
  ],
  "decisions": ["string"],
  "follow_up_meetings": [
    {
      "title": "string",
      "date": "string (ISO date format)",
      "participants": ["string"]
    }
  ]
}

If information is not available, use empty arrays or null values.
`;
    
    // Try OpenAI first, then fall back to other providers
    let aiResponse = null;
    let usedProvider = 'openai';
    
    // Try user-provided OpenAI key first
    let openaiKey = userData?.openai_api_key || process.env.OPENAI_API_KEY;
    
    if (openaiKey) {
      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an AI assistant that analyzes meeting transcripts and extracts structured information. Always respond with valid JSON."
              },
              {
                role: "user",
                content: analysisPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          })
        });
        
        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }
        
        const openaiData = await openaiResponse.json();
        aiResponse = JSON.parse(openaiData.choices[0].message.content);
        usedProvider = 'openai';
      } catch (openaiError) {
        console.warn('OpenAI failed, trying Anthropic:', openaiError.message);
      }
    }
    
    // Try Anthropic if OpenAI failed
    if (!aiResponse) {
      let anthropicKey = userData?.anthropic_api_key || process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        try {
          const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 2000,
              temperature: 0.3,
              messages: [
                {
                  role: "user",
                  content: analysisPrompt
                }
              ]
            })
          });
          
          if (!anthropicResponse.ok) {
            throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
          }
          
          const anthropicData = await anthropicResponse.json();
          // Extract text from Anthropic response
          const textContent = anthropicData.content[0].text;
          aiResponse = JSON.parse(textContent);
          usedProvider = 'anthropic';
        } catch (anthropicError) {
          console.warn('Anthropic failed:', anthropicError.message);
        }
      }
    }
    
    // Try Gemini if both failed
    if (!aiResponse) {
      let geminiKey = userData?.gemini_api_key || process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: analysisPrompt }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2000
              }
            })
          });
          
          if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.status}`);
          }
          
          const geminiData = await geminiResponse.json();
          const textContent = geminiData.candidates[0].content.parts[0].text;
          // Extract JSON from the response (handle potential markdown formatting)
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResponse = JSON.parse(jsonMatch[0]);
            usedProvider = 'gemini';
          } else {
            throw new Error('Could not extract JSON from Gemini response');
          }
        } catch (geminiError) {
          console.warn('Gemini failed:', geminiError.message);
        }
      }
    }
    
    // If all AI providers failed, use a basic fallback
    if (!aiResponse) {
      console.warn('All AI providers failed, using basic fallback');
      aiResponse = {
        summary: `Meeting transcript for "${meetingTitle}" on ${meetingDate} with ${participants.length} participants.`,
        action_items: [],
        commitments: [],
        decisions: [],
        follow_up_meetings: []
      };
      usedProvider = 'fallback';
    }
    
    // Process the AI response and create CRM records
    const supabase2 = getSupabaseClient();
    
    // Start a transaction-like approach by doing everything in sequence
    // First, create the note from the meeting transcript
    const noteContent = `
# Meeting: ${meetingTitle}

**Date:** ${new Date(meetingDate).toLocaleDateString()}
**Participants:** ${participants.join(', ')}

## Summary
${aiResponse.summary || 'No summary available.'}

## Key Decisions
${aiResponse.decisions && aiResponse.decisions.length > 0 
  ? aiResponse.decisions.map(d => `- ${d}`).join('\n') 
  : '- No specific decisions recorded.'}

## Commitments
${aiResponse.commitments && aiResponse.commitments.length > 0
  ? aiResponse.commitments.map(c => `- ${c.participant}: ${c.commitment}`).join('\n')
  : '- No specific commitments recorded.'}

## Action Items
${aiResponse.action_items && aiResponse.action_items.length > 0
  ? aiResponse.action_items.map(item => `- [${item.assignee || 'Unassigned'}] ${item.description}${item.due_date ? ` (Due: ${item.due_date})` : ''}`).join('\n')
  : '- No action items identified.'}
    
*Processed by AI Meeting Transcript Processor (${usedProvider})*
    `.trim();
    
    // Create the note as a communication record
    const { data: noteData, error: noteError } = await supabase2
      .from('communications')
      .insert({
        customer_id: user.id, // Assuming user has a customer_id, adjust as needed
        type: 'note',
        direction: 'outbound',
        subject: `Meeting: ${meetingTitle}`,
        content: noteContent,
        contact_id: relatedPersonId,
        deal_id: relatedDealId,
        created_by: user.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ai_processed: true,
          ai_provider: usedProvider,
          original_transcript_length: transcript.length,
          meeting_title: meetingTitle,
          meeting_date: meetingDate,
          participants: participants,
          related_person_id: relatedPersonId,
          related_company_id: relatedCompanyId,
          related_deal_id: relatedDealId
        }
      })
      .select()
      .single();
      
    if (noteError) {
      throw noteError;
    }
    
    // Create tasks from action items
    const createdTasks = [];
    if (aiResponse.action_items && Array.isArray(aiResponse.action_items)) {
      for (const actionItem of aiResponse.action_items) {
        if (!actionItem.description || actionItem.description.trim() === '') continue;
        
        // Try to find assignee by name if provided
        let assigneeId = null;
        if (actionItem.assignee && actionItem.assignee !== 'unassigned') {
          // Look for contact by name (simplified - in production you'd want better matching)
          const { data: contactData, error: contactError } = await supabase2
            .from('contacts')
            .select('id')
            .ilike('first_name', `%${actionItem.assignee.split(' ')[0]}%`)
            .limit(1);
          
          if (!contactError && contactData && contactData.length > 0) {
            assigneeId = contactData[0].id;
          }
        }
        
        // Parse due date
        let dueDate = null;
        if (actionItem.due_date) {
          const parsedDate = parseRelativeDate(actionItem.due_date, new Date(meetingDate));
          dueDate = parsedDate || actionItem.due_date; // Use parsed if valid, otherwise use as-is
        }
        
        // If no specific due date, set to 7 days from meeting date as default
        if (!dueDate) {
          const defaultDue = new Date(meetingDate);
          defaultDue.setDate(defaultDue.getDate() + 7);
          dueDate = defaultDue.toISOString().split('T')[0];
        }
        
        const { data: taskData, error: taskError } = await supabase2
          .from('communications')
          .insert({
            customer_id: user.id,
            type: 'task',
            direction: 'outbound',
            subject: actionItem.description,
            content: `Action item from meeting "${meetingTitle}"${assigneeId ? `\n\nAssigned to: ${actionItem.assignee}` : ''}${dueDate ? `\n\nDue: ${dueDate}` : ''}`,
            contact_id: relatedPersonId,
            deal_id: relatedDealId,
            created_by: user.id,
            status: 'pending',
            completed_at: null,
            metadata: {
              ai_generated: true,
              meeting_title: meetingTitle,
              meeting_date: meetingDate,
              related_person_id: relatedPersonId,
              related_company_id: relatedCompanyId,
              related_deal_id: relatedDealId,
              original_action_item: actionItem
            }
          })
          .select()
          .single();
          
        if (!taskError && taskData) {
          createdTasks.push(taskData);
        }
      }
    }
    
    // Process follow-up meetings
    const followUps = [];
    if (aiResponse.follow_up_meetings && Array.isArray(aiResponse.follow_up_meetings)) {
      for (const followUp of aiResponse.follow_up_meetings) {
        if (!followUp.title || !followUp.date) continue;
        
        // Create a communication record for the follow-up meeting
        const { data: followUpData, error: followUpError } = await supabase2
          .from('communications')
          .insert({
            customer_id: user.id,
            type: 'meeting',
            direction: 'outbound',
            subject: followUp.title,
            content: `Follow-up meeting from "${meetingTitle}"${followUp.participants && followUp.participants.length > 0 ? `\n\nParticipants: ${followUp.participants.join(', ')}` : ''}`,
            contact_id: relatedPersonId,
            deal_id: relatedDealId,
            created_by: user.id,
            scheduled_at: new Date(followUp.date).toISOString(),
            status: 'scheduled',
            metadata: {
              ai_generated: true,
              source_meeting_title: meetingTitle,
              source_meeting_date: meetingDate,
              related_person_id: relatedPersonId,
              related_company_id: relatedCompanyId,
              related_deal_id: relatedDealId
            }
          })
          .select()
          .single();
          
        if (!followUpError && followUpData) {
          followUps.push(followUpData);
        }
      }
    }
    
    return createResponse({
      success: true,
      noteId: noteData.id,
      taskIds: createdTasks.map(t => t.id),
      followUpMeetingIds: followUps.map(f => f.id),
      summary: {
        noteCreated: !!noteData,
        tasksCreated: createdTasks.length,
        followUpsCreated: followUps.length,
        actionItemsProcessed: aiResponse.action_items ? aiResponse.action_items.length : 0,
        commitmentsProcessed: aiResponse.commitments ? aiResponse.commitments.length : 0
      },
      aiAnalysis: {
        provider: usedProvider,
        summary: aiResponse.summary,
        actionItemsCount: aiResponse.action_items ? aiResponse.action_items.length : 0,
        commitmentsCount: aiResponse.commitments ? aiResponse.commitments.length : 0,
        decisionsCount: aiResponse.decisions ? aiResponse.decisions.length : 0,
        followUpMeetingsCount: aiResponse.follow_up_meetings ? aiResponse.follow_up_meetings.length : 0
      }
    });
    
  } catch (error) {
    console.error("Meeting transcript processor error:", error);
    return createResponse({
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
}

export { handler };