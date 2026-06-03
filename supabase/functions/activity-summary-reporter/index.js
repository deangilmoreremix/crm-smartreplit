// supabase/functions/activity-summary-reporter/index.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ActivitySummary {
  newPeople: number;
  newCompanies: number;
  opportunitiesByStage: Record<string, number>;
  taskStats: {
    totalCreated: number;
    completedOnTime: number;
    overdue: Record<string, number>; // personName -> count
  };
  dateRange: {
    start: string;
    end: string;
  };
}

function createResponse(data: unknown, statusCode = 200) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getActivitySummary(
  supabase: ReturnType<typeof createClient>,
  daysAgo: number
): Promise<ActivitySummary> {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - daysAgo);
  
  // Get new people (contacts created in period)
  const { data: peopleData, error: peopleError } = await supabase
    .from('contacts')
    .select('id, created_at, contact_type')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
    
  if (peopleError) throw peopleError;
  
  const newPeople = peopleData.filter(p => 
    p.contact_type === 'person' || !p.contact_type
  ).length;
  
  const newCompanies = peopleData.filter(p => 
    p.contact_type === 'company'
  ).length;
  
  // Get opportunities (deals) created in period, grouped by stage
  const { data: dealsData, error: dealsError } = await supabase
    .from('deals')
    .select('id, stage, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
    
  if (dealsError) throw dealsError;
  
  const opportunitiesByStage: Record<string, number> = {};
  dealsData.forEach(deal => {
    const stage = deal.stage || 'unknown';
    opportunitiesByStage[stage] = (opportunitiesByStage[stage] || 0) + 1;
  });
  
  // Get tasks created in period
  const { data: tasksData, error: tasksError } = await supabase
    .from('communications')
    .select('id, created_at, completed_at, metadata, subject')
    .eq('type', 'task')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
    
  if (tasksError) throw tasksError;
  
  const totalCreated = tasksData.length;
  
  // Calculate completed on time and overdue tasks
  // For simplicity, we'll consider a task overdue if it's not completed and was due more than 3 days ago
  // In a real system, you'd have a proper due_date field
  const completedOnTime = tasksData.filter(task => 
    task.completed_at !== null
  ).length;
  
  // Get overdue tasks (not completed and created more than 3 days ago)
  const threeDaysAgo = new Date(endDate);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const overdueTasks = tasksData.filter(task => 
    !task.completed_at && 
    new Date(task.created_at) < threeDaysAgo
  );
  
  // Group overdue tasks by assignee (simplified - in reality you'd parse metadata or have assignee field)
  const overdueByPerson: Record<string, number> = {};
  overdueTasks.forEach(task => {
    // Try to extract assignee from metadata or subject
    const assignee = task.metadata?.assignee || 
                    (task.subject?.match(/assigned to:\s*([^\n]+)/i)?.[1]) || 
                    'Unassigned';
    overdueByPerson[assignee] = (overdueByPerson[assignee] || 0) + 1;
  });
  
  return {
    newPeople,
    newCompanies,
    opportunitiesByStage,
    taskStats: {
      totalCreated,
      completedOnTime,
      overdue: overdueByPerson
    },
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
  };
}

function formatSlackMessage(summary: ActivitySummary): string {
  const dateRange = `${summary.dateRange.start} to ${summary.dateRange.end}`;
  
  let message = `*CRM Activity Report* 📊\n*Period:* ${dateRange}\n\n`;
  
  message += `*👥 New People & Companies*\n`;
  message += `• ${summary.newPeople} New People\n`;
  message += `• ${summary.newCompanies} New Companies\n\n`;
  
  message += `*🎯 Opportunities by Stage*\n`;
  if (Object.keys(summary.opportunitiesByStage).length === 0) {
    message += `• No opportunities created in this period\n`;
  } else {
    for (const [stage, count] of Object.entries(summary.opportunitiesByStage)) {
      message += `• ${stage}: ${count}\n`;
    }
  }
  message += `\n`;
  
  message += `*📋 Task Statistics*\n`;
  message += `• Total Tasks Created: ${summary.taskStats.totalCreated}\n`;
  message += `• Tasks Completed: ${summary.taskStats.completedOnTime}\n`;
  
  const completionRate = summary.taskStats.totalCreated > 0 
    ? (summary.taskStats.completedOnTime / summary.taskStats.totalCreated) * 100 
    : 0;
  message += `• Completion Rate: ${completionRate.toFixed(1)}%\n\n`;
  
  if (Object.keys(summary.taskStats.overdue).length > 0) {
    message += `*⚠️ Overdue Tasks (by person)*\n`;
    const sortedOverdue = Object.entries(summary.taskStats.overdue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5
    
    for (const [person, count] of sortedOverdue) {
      message += `• ${person}: ${count} overdue task${count !== 1 ? 's' : ''}\n`;
    }
    message += `\n`;
  } else {
    message += `*✅ No overdue tasks!*\n\n`;
  }
  
  message += `_Report generated automatically by SmartCRM Activity Summary Reporter_`;
  
  return message;
}

function formatDiscordMessage(summary: ActivitySummary): string {
  // Similar to Slack but without markdown formatting
  const dateRange = `${summary.dateRange.start} to ${summary.dateRange.end}`;
  
  let message = `**CRM Activity Report** 📊\n**Period:** ${dateRange}\n\n`;
  
  message += `**👥 New People & Companies**\n`;
  message += `• ${summary.newPeople} New People\n`;
  message += `• ${summary.newCompanies} New Companies\n\n`;
  
  message += `**🎯 Opportunities by Stage**\n`;
  if (Object.keys(summary.opportunitiesByStage).length === 0) {
    message += `• No opportunities created in this period\n`;
  } else {
    for (const [stage, count] of Object.entries(summary.opportunitiesByStage)) {
      message += `• ${stage}: ${count}\n`;
    }
  }
  message += `\n`;
  
  message += `**📋 Task Statistics**\n`;
  message += `• Total Tasks Created: ${summary.taskStats.totalCreated}\n`;
  message += `• Tasks Completed: ${summary.taskStats.completedOnTime}\n`;
  
  const completionRate = summary.taskStats.totalCreated > 0 
    ? (summary.taskStats.completedOnTime / summary.taskStats.totalCreated) * 100 
    : 0;
  message += `• Completion Rate: ${completionRate.toFixed(1)}%\n\n`;
  
  if (Object.keys(summary.taskStats.overdue).length > 0) {
    message += `**⚠️ Overdue Tasks (by person)**\n`;
    const sortedOverdue = Object.entries(summary.taskStats.overdue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [person, count] of sortedOverdue) {
      message += `• ${person}: ${count} overdue task${count !== 1 ? 's' : ''}\n`;
    }
    message += `\n`;
  } else {
    message += `**✅ No overdue tasks!**\n\n`;
  }
  
  message += `_Report generated automatically by SmartCRM Activity Summary Reporter_`;
  
  return message;
}

function formatWhatsAppMessage(summary: ActivitySummary): string {
  // WhatsApp doesn't support rich formatting, so use plain text with emojis
  const dateRange = `${summary.dateRange.start} to ${summary.dateRange.end}`;
  
  let message = `📊 *CRM Activity Report*\n📅 *Period:* ${dateRange}\n\n`;
  
  message += `👥 *New People & Companies*\n`;
  message += `• ${summary.newPeople} New People\n`;
  message += `• ${summary.newCompanies} New Companies\n\n`;
  
  message += `🎯 *Opportunities by Stage*\n`;
  if (Object.keys(summary.opportunitiesByStage).length === 0) {
    message += `• No opportunities created in this period\n`;
  } else {
    for (const [stage, count] of Object.entries(summary.opportunitiesByStage)) {
      message += `• ${stage}: ${count}\n`;
    }
  }
  message += `\n`;
  
  message += `📋 *Task Statistics*\n`;
  message += `• Total Tasks Created: ${summary.taskStats.totalCreated}\n`;
  message += `• Tasks Completed: ${summary.taskStats.completedOnTime}\n`;
  
  const completionRate = summary.taskStats.totalCreated > 0 
    ? (summary.taskStats.completedOnTime / summary.taskStats.totalCreated) * 100 
    : 0;
  message += `• Completion Rate: ${completionRate.toFixed(1)}%\n\n`;
  
  if (Object.keys(summary.taskStats.overdue).length > 0) {
    message += `⚠️ *Overdue Tasks (by person)*\n`;
    const sortedOverdue = Object.entries(summary.taskStats.overdue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 for WhatsApp (shorter message)
    
    for (const [person, count] of sortedOverdue) {
      message += `• ${person}: ${count} overdue\n`;
    }
    message += `\n`;
  } else {
    message += `✅ *No overdue tasks!*\n\n`;
  }
  
  message += `_Generated by SmartCRM Activity Summary Reporter_`;
  
  return message;
}

async function sendToSlack(message: string): Promise<boolean> {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!webhookUrl) return false;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Slack webhook error:', error);
    return false;
  }
}

async function sendToDiscord(message: string): Promise<boolean> {
  const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
  if (!webhookUrl) return false;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
}

async function sendToWhatsApp(message: string): Promise<boolean> {
  // For WhatsApp, we'd typically use a service like Twilio or WhatsApp Business API
  // For simplicity, we'll check if there's a webhook URL configured
  const webhookUrl = Deno.env.get('WHATSAPP_WEBHOOK_URL');
  if (!webhookUrl) return false;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: message,
        to: Deno.env.get('WHATSAPP_TO_NUMBER') // Optional: specific recipient
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  // Only allow POST requests (for manual triggering) or allow GET for health checks
  if (req.method !== 'POST' && req.method !== 'GET') {
    return createResponse({ error: 'Method not allowed' }, 405);
  }
  
  // For GET requests, return health check info
  if (req.method === 'GET') {
    return createResponse({
      status: 'healthy',
      service: 'activity-summary-reporter',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // Get configuration from environment variables
    const daysAgoStr = Deno.env.get('ACTIVITY_SUMMARY_DAYS_AGO') || '1';
    const daysAgo = parseInt(daysAgoStr, 10);
    
    if (isNaN(daysAgo) || daysAgo < 1) {
      return createResponse({ error: 'Invalid ACTIVITY_SUMMARY_DAYS_AGO configuration' }, 400);
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get activity summary
    const summary = await getActivitySummary(supabase, daysAgo);
    
    // Format messages for each platform
    const slackMessage = formatSlackMessage(summary);
    const discordMessage = formatDiscordMessage(summary);
    const whatsappMessage = formatWhatsAppMessage(summary);
    
    // Send to configured platforms
    const results = {
      slack: await sendToSlack(slackMessage),
      discord: await sendToDiscord(discordMessage),
      whatsapp: await sendToWhatsApp(whatsappMessage)
    };
    
    // Check if at least one platform was successful
    const anySuccess = Object.values(results).some(result => result === true);
    
    if (!anySuccess) {
      return createResponse({ 
        error: 'Failed to send activity summary to any configured platform',
        details: results
      }, 500);
    }
    
    return createResponse({
      success: true,
      message: 'Activity summary sent successfully',
      dateRange: summary.dateRange,
      platforms: results
    });
    
  } catch (error) {
    console.error('Activity summary reporter error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
});