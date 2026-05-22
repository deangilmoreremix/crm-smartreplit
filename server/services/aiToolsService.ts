/**
 * Unified AI Tools Service
 * Core service for all Twenty CRM AI-powered features.
 * Handles OpenAI calls, prompt management, response parsing, and error handling.
 */

import OpenAI from 'openai';
import { memoryService } from '../memory';

// Cached OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Rate limiting (shared across all AI tools)
const aiRateLimit = new Map<string, { count: number; resetAt: number }>();
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX = 30;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of aiRateLimit) {
    if (now > entry.resetAt) aiRateLimit.delete(key);
  }
}, 5 * 60 * 1000);

export function checkAIRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = aiRateLimit.get(userId);
  if (!entry || now > entry.resetAt) {
    aiRateLimit.set(userId, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= AI_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export interface AIResult {
  success: boolean;
  data?: any;
  error?: string;
  source: 'openai' | 'fallback';
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

/**
 * Core AI call with JSON response format
 */
async function callAIJson(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'gpt-4o-mini',
  maxTokens: number = 1000,
  userId?: string,
  toolName?: string,
  metadata?: Record<string, any>
): Promise<AIResult> {
  const client = getOpenAIClient();
  if (!client) {
    return { success: false, error: 'OpenAI not configured', source: 'fallback' };
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    const content = response.choices[0].message.content || '{}';
    const parsedContent = JSON.parse(content);

    // Record successful AI call to memory if userId provided
    if (userId && memoryService.isEnabled()) {
      memoryService.recordObservation(
        userId,
        'tool_use',
        `AI tool: ${toolName || 'unknown'} - model: ${model}`,
        {
          tool: toolName,
          model,
          userPrompt: userPrompt?.slice(0, 200),
          tokensUsed: response.usage?.total_tokens || 0,
          parsedResult: Object.keys(parsedContent).join(', '),
          ...metadata,
        }
      ).catch(() => {});
    }

    return {
      success: true,
      data: parsedContent,
      source: 'openai',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error: any) {
    console.error('AI call error:', error.message);

    // Record error in memory
    if (userId && memoryService.isEnabled()) {
      memoryService.recordObservation(
        userId,
        'error',
        `AI tool ${toolName || 'unknown'} failed: ${error.message}`,
        { tool: toolName, model, error: error.message, ...metadata }
      ).catch(() => {});
    }

    return { success: false, error: error.message, source: 'fallback' };
  }
}

/**
 * Core AI call with text response
 */
async function callAIText(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'gpt-4o-mini',
  maxTokens: number = 1000
): Promise<AIResult> {
  const client = getOpenAIClient();
  if (!client) {
    return { success: false, error: 'OpenAI not configured', source: 'fallback' };
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: maxTokens,
    });

    const content = response.choices[0].message.content || '';
    return {
      success: true,
      data: { text: content },
      source: 'openai',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error: any) {
    console.error('AI call error:', error.message);
    return { success: false, error: error.message, source: 'fallback' };
  }
}

// ============================================================
// AI SALES TOOLS
// ============================================================

export async function analyzeLeadScore(contactData: any): Promise<AIResult> {
  return callAIJson(
    `You are an expert sales analyst. Analyze the contact data and provide a lead score (0-100) with detailed rationale. Consider: engagement level, company fit, deal history, response patterns, and buying signals. Return JSON with: score (number), rationale (string), buyingSignals (array), riskFactors (array), recommendedActions (array), priority (hot/warm/cold).`,
    `Analyze this contact for lead scoring: ${JSON.stringify(contactData)}`,
    'gpt-4o-mini',
    600
  );
}

export async function generateDealIntelligence(dealData: any, contactHistory: any[], marketContext?: any): Promise<AIResult> {
  return callAIJson(
    `You are an expert sales strategist. Provide comprehensive deal intelligence. Return JSON with: probability_score (number), risk_level (low/medium/high), key_factors (array), recommendations (array), confidence_level (number), estimated_close_days (number), value_optimization (string), competitive_threats (array), next_best_action (string).`,
    `Analyze this deal: ${JSON.stringify(dealData)}. Contact history: ${JSON.stringify(contactHistory)}. Market context: ${JSON.stringify(marketContext || {})}`,
    'gpt-4o-mini',
    800
  );
}

export async function analyzePipelineHealth(deals: any[]): Promise<AIResult> {
  return callAIJson(
    `You are a sales operations expert. Analyze the pipeline health and return JSON with: overall_health_score (number), healthy_deals (number), at_risk_deals (number), critical_deals (number), bottlenecks (array), recommendations (array), velocity_trend (improving/stable/declining), forecast_accuracy (number).`,
    `Analyze pipeline health for these deals: ${JSON.stringify(deals)}`,
    'gpt-4o-mini',
    700
  );
}

export async function monitorDealRisk(deals: any[]): Promise<AIResult> {
  return callAIJson(
    `You are a deal risk analyst. Identify at-risk deals and return JSON with: high_risk (array of {dealId, title, riskScore, riskFactors, recommendedAction}), medium_risk (array), low_risk (array), total_at_risk_value (number), summary (string).`,
    `Analyze deal risks for: ${JSON.stringify(deals)}`,
    'gpt-4o-mini',
    700
  );
}

export async function optimizeConversion(deals: any[], contacts: any[]): Promise<AIResult> {
  return callAIJson(
    `You are a conversion optimization expert. Analyze the sales funnel and return JSON with: conversion_rate (number), stage_conversion (object with stage names as keys), drop_off_points (array), optimization_opportunities (array), a_b_test_suggestions (array), projected_improvement (number).`,
    `Analyze conversion optimization. Deals: ${JSON.stringify(deals)}. Contacts: ${JSON.stringify(contacts)}`,
    'gpt-4o-mini',
    700
  );
}

export async function analyzeWinRate(deals: any[]): Promise<AIResult> {
  return callAIJson(
    `You are a sales performance analyst. Analyze win rate patterns and return JSON with: overall_win_rate (number), win_rate_by_stage (object), win_rate_by_deal_size (object), key_win_factors (array), key_loss_factors (array), recommendations (array), benchmark_comparison (string).`,
    `Analyze win rate intelligence for: ${JSON.stringify(deals)}`,
    'gpt-4o-mini',
    700
  );
}

export async function generateSalesForecast(deals: any[], period: string = 'quarter'): Promise<AIResult> {
  return callAIJson(
    `You are a sales forecasting expert. Generate AI-powered forecast and return JSON with: weighted_forecast (number), best_case (number), worst_case (number), confidence_level (number), period (string), monthly_breakdown (array of {month, forecast, probability}), key_drivers (array), risk_factors (array), recommendations (array).`,
    `Generate ${period} sales forecast for: ${JSON.stringify(deals)}`,
    'gpt-4o-mini',
    800
  );
}

export async function analyzeLiveDeals(deals: any[]): Promise<AIResult> {
  return callAIJson(
    `You are a real-time deal analyst. Provide live analysis and return JSON with: hot_deals (array), warm_deals (array), cold_deals (array), immediate_actions (array), engagement_insights (object with metrics), temperature_analysis (object), activity_feed (array of {dealId, title, activity, timestamp, priority}).`,
    `Provide live deal analysis for: ${JSON.stringify(deals)}`,
    'gpt-4o-mini',
    800
  );
}

// ============================================================
// AI COMMUNICATION TOOLS
// ============================================================

export async function composeEmail(context: {
  recipientName: string;
  recipientCompany: string;
  purpose: string;
  tone: string;
  keyPoints?: string[];
  callToAction?: string;
}): Promise<AIResult> {
  return callAIJson(
    `You are an expert sales email writer. Compose a professional, personalized email. Return JSON with: subject (string), body (string), tone (string), key_elements (array), follow_up_suggestion (string).`,
    `Compose email. Recipient: ${context.recipientName} at ${context.recipientCompany}. Purpose: ${context.purpose}. Tone: ${context.tone}. Key points: ${JSON.stringify(context.keyPoints || [])}. CTA: ${context.callToAction || 'none'}`,
    'gpt-4o-mini',
    500
  );
}

export async function generateEmailReply(originalEmail: string, context: string, tone: string = 'professional'): Promise<AIResult> {
  return callAIJson(
    `You are a sales communication expert. Generate a thoughtful reply. Return JSON with: subject (string), body (string), tone (string), key_points_addressed (array).`,
    `Generate reply to: "${originalEmail}". Context: ${context}. Tone: ${tone}`,
    'gpt-4o-mini',
    400
  );
}

export async function generateFollowUp(contactData: any, lastInteraction: string, purpose: string): Promise<AIResult> {
  return callAIJson(
    `You are a sales follow-up expert. Generate a strategic follow-up plan. Return JSON with: subject (string), message (string), timing (string), channel (email/call/sms), urgency (high/medium/low), personalization_tips (array).`,
    `Generate follow-up for contact: ${JSON.stringify(contactData)}. Last interaction: ${lastInteraction}. Purpose: ${purpose}`,
    'gpt-4o-mini',
    400
  );
}

export async function handleObjection(objection: string, productInfo: string, contactData?: any): Promise<AIResult> {
  return callAIJson(
    `You are a master sales objection handler. Provide expert strategies. Return JSON with: understanding_statement (string), reframing_strategy (string), response_options (array of strings), evidence_to_use (string), next_step (string), confidence_score (number).`,
    `Handle objection: "${objection}". Product: ${productInfo}. Contact: ${JSON.stringify(contactData || {})}`,
    'gpt-4o-mini',
    500
  );
}

export async function generateProposal(context: {
  clientName: string;
  projectDescription: string;
  budget?: string;
  timeline?: string;
  deliverables?: string[];
}): Promise<AIResult> {
  return callAIJson(
    `You are a proposal writing expert. Generate a professional proposal. Return JSON with: title (string), executive_summary (string), scope_of_work (string), timeline (string), pricing_structure (string), terms (string), next_steps (string).`,
    `Generate proposal for: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    800
  );
}

export async function generateAppointmentMessage(appointmentData: any, messageType: string = 'confirmation'): Promise<AIResult> {
  return callAIJson(
    `You are a scheduling assistant. Generate a professional appointment message. Return JSON with: subject (string), body (string), calendar_note (string), reminder_text (string).`,
    `Generate ${messageType} for appointment: ${JSON.stringify(appointmentData)}`,
    'gpt-4o-mini',
    300
  );
}

export async function generateVideoEmailScript(context: {
  recipientName: string;
  productName: string;
  keyMessage: string;
  duration: string;
}): Promise<AIResult> {
  return callAIJson(
    `You are a video email script writer. Create an engaging script. Return JSON with: hook (string), intro (string), main_content (string), call_to_action (string), closing (string), estimated_duration (string), tips (array).`,
    `Generate video email script: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    500
  );
}

export async function generateSMSMessage(purpose: string, contactName: string, context: string): Promise<AIResult> {
  return callAIJson(
    `You are a concise SMS message writer. Create a brief, effective SMS (max 160 chars). Return JSON with: message (string), character_count (number), follow_up_suggestion (string).`,
    `Generate SMS. Purpose: ${purpose}. Contact: ${contactName}. Context: ${context}`,
    'gpt-4o-mini',
    200
  );
}

export async function generateVoiceScript(context: {
  purpose: string;
  contactName: string;
  keyPoints: string[];
  duration: string;
}): Promise<AIResult> {
  return callAIJson(
    `You are a voice message script writer. Create a natural-sounding script. Return JSON with: script (string), talking_points (array), estimated_duration (string), tone_guidance (string).`,
    `Generate voice script: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    400
  );
}

// ============================================================
// CONTENT & MARKETING TOOLS
// ============================================================

export async function generateContent(context: {
  type: string;
  topic: string;
  audience: string;
  tone: string;
  keywords?: string[];
}): Promise<AIResult> {
  return callAIJson(
    `You are a content marketing expert. Generate high-quality marketing content. Return JSON with: title (string), content (string), meta_description (string), keywords (array), call_to_action (string), content_type (string).`,
    `Generate ${context.type} content. Topic: ${context.topic}. Audience: ${context.audience}. Tone: ${context.tone}. Keywords: ${JSON.stringify(context.keywords || [])}`,
    'gpt-4o-mini',
    800
  );
}

export async function generateSalesPage(context: {
  productName: string;
  targetAudience: string;
  keyBenefits: string[];
  price?: string;
}): Promise<AIResult> {
  return callAIJson(
    `You are a conversion copywriter. Generate a high-converting sales page. Return JSON with: headline (string), subheadline (string), hero_section (string), benefits (array), social_proof (string), cta (string), faq (array), guarantee (string).`,
    `Generate sales page: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    1000
  );
}

export async function generateOffer(context: {
  productName: string;
  targetAudience: string;
  pricePoint: string;
  uniqueValue: string;
}): Promise<AIResult> {
  return callAIJson(
    `You are a offers expert. Create an irresistible offer. Return JSON with: offer_headline (string), offer_summary (string), value_stack (array), bonus_items (array), urgency_element (string), guarantee (string), cta (string), price_anchor (string).`,
    `Generate offer: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    700
  );
}

export async function generateSocialPost(context: {
  platform: string;
  topic: string;
  tone: string;
  includeHashtags: boolean;
}): Promise<AIResult> {
  return callAIJson(
    `You are a social media expert. Create an engaging ${context.platform} post. Return JSON with: post_text (string), hashtags (array), engagement_tip (string), best_posting_time (string), character_count (number).`,
    `Generate ${context.platform} post. Topic: ${context.topic}. Tone: ${context.tone}. Hashtags: ${context.includeHashtags}`,
    'gpt-4o-mini',
    300
  );
}

export async function generateWebinarInvite(context: {
  topic: string;
  speakerName: string;
  date: string;
  duration: string;
  keyTakeaways: string[];
}): Promise<AIResult> {
  return callAIJson(
    `You are a webinar marketing expert. Create a compelling invitation. Return JSON with: subject_line (string), headline (string), description (string), key_benefits (array), speaker_bio (string), registration_cta (string), reminder_text (string).`,
    `Generate webinar invite: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    500
  );
}

export async function generateCaseStudy(context: {
  clientName: string;
  challenge: string;
  solution: string;
  results: string[];
}): Promise<AIResult> {
  return callAIJson(
    `You are a case study writer. Create a compelling case study. Return JSON with: title (string), executive_summary (string), challenge_section (string), solution_section (string), results_section (string), testimonial (string), key_metrics (array).`,
    `Generate case study: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    800
  );
}

export async function transformTestimonial(rawTestimonial: string, format: string = 'polished'): Promise<AIResult> {
  return callAIJson(
    `You are a testimonial expert. Transform this testimonial into a powerful social proof piece. Return JSON with: polished_testimonial (string), short_quote (string), social_media_version (string), headline_suggestion (string), key_themes (array).`,
    `Transform testimonial (${format}): "${rawTestimonial}"`,
    'gpt-4o-mini',
    300
  );
}

export async function analyzeBusiness(businessData: any): Promise<AIResult> {
  return callAIJson(
    `You are a senior business consultant. Provide comprehensive business analysis. Return JSON with: swot_analysis (object with strengths/weaknesses/opportunities/threats), market_position (string), growth_opportunities (array), risk_factors (array), strategic_recommendations (array), kpi_suggestions (array), competitive_advantages (array).`,
    `Analyze this business: ${JSON.stringify(businessData)}`,
    'gpt-4o-mini',
    1000
  );
}

// ============================================================
// MEETING & PRODUCTIVITY TOOLS
// ============================================================

export async function summarizeMeeting(transcript: string): Promise<AIResult> {
  return callAIJson(
    `You are a meeting summarizer. Create a concise, actionable summary. Return JSON with: summary (string), key_decisions (array), action_items (array of {task, owner, due_date}), follow_up_tasks (array), notable_quotes (array), next_meeting_suggestion (string).`,
    `Summarize this meeting transcript: "${transcript}"`,
    'gpt-4o-mini',
    700
  );
}

export async function speechToTextNote(audioContext: string): Promise<AIResult> {
  return callAIJson(
    `You are a note-taking assistant. Convert the spoken content into structured notes. Return JSON with: formatted_notes (string), key_points (array), action_items (array), summary (string).`,
    `Convert to structured notes: "${audioContext}"`,
    'gpt-4o-mini',
    500
  );
}

export async function createTaskFromDescription(description: string, context?: any): Promise<AIResult> {
  return callAIJson(
    `You are a task management assistant. Create a well-structured task. Return JSON with: title (string), description (string), priority (high/medium/low), estimated_duration (string), subtasks (array), due_date_suggestion (string), category (string).`,
    `Create task from: "${description}". Context: ${JSON.stringify(context || {})}`,
    'gpt-4o-mini',
    300
  );
}

export async function generateMeetingNotes(meetingData: any): Promise<AIResult> {
  return callAIJson(
    `You are a meeting notes expert. Generate comprehensive meeting notes. Return JSON with: agenda_summary (string), discussion_points (array), decisions_made (array), action_items (array of {task, owner, deadline}), parking_lot (array), next_steps (string).`,
    `Generate meeting notes for: ${JSON.stringify(meetingData)}`,
    'gpt-4o-mini',
    600
  );
}

export async function suggestFollowUpTasks(completedTask: string, context: any): Promise<AIResult> {
  return callAIJson(
    `You are a productivity expert. Suggest logical follow-up tasks. Return JSON with: suggested_tasks (array of {title, description, priority, estimated_time}), reasoning (string), automation_suggestions (array).`,
    `Suggest follow-up tasks for completed: "${completedTask}". Context: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    400
  );
}

// ============================================================
// ADVANCED AI TOOLS
// ============================================================

export async function analyzeImage(imageUrl: string, prompt?: string): Promise<AIResult> {
  const client = getOpenAIClient();
  if (!client) return { success: false, error: 'OpenAI not configured', source: 'fallback' };

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || 'Analyze this image in detail. Describe what you see, extract any text, identify objects, and provide insights.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 800,
    });

    return {
      success: true,
      data: { analysis: response.choices[0].message.content },
      source: 'openai',
    };
  } catch (error: any) {
    return { success: false, error: error.message, source: 'fallback' };
  }
}

export async function semanticSearch(query: string, items: any[]): Promise<AIResult> {
  return callAIJson(
    `You are a semantic search engine. Rank the items by relevance to the query. Return JSON with: results (array of {id, relevance_score, match_reason}), query_understanding (string), suggested_refinements (array).`,
    `Search query: "${query}". Items: ${JSON.stringify(items)}`,
    'gpt-4o-mini',
    600
  );
}

export async function generateRecommendations(context: {
  type: string;
  data: any;
  preferences?: any;
}): Promise<AIResult> {
  return callAIJson(
    `You are a recommendation engine. Provide smart, personalized recommendations. Return JSON with: recommendations (array of {item, score, reasoning}), insights (array), confidence (number).`,
    `Generate ${context.type} recommendations. Data: ${JSON.stringify(context.data)}. Preferences: ${JSON.stringify(context.preferences || {})}`,
    'gpt-4o-mini',
    600
  );
}

export async function researchTopic(topic: string, depth: string = 'comprehensive'): Promise<AIResult> {
  return callAIJson(
    `You are an AI research assistant. Conduct thorough research. Return JSON with: summary (string), key_findings (array), sources_suggested (array), related_topics (array), market_implications (array), action_items (string).`,
    `Research topic: "${topic}". Depth: ${depth}`,
    'gpt-4o-mini',
    800
  );
}

export async function generateReasoning(task: string, data: any): Promise<AIResult> {
  return callAIJson(
    `You are an AI reasoning engine. Provide step-by-step reasoning. Return JSON with: reasoning_steps (array of strings), conclusion (string), confidence (number), assumptions (array), alternative_approaches (array).`,
    `Reason through: "${task}". Data: ${JSON.stringify(data)}`,
    'gpt-4o-mini',
    600
  );
}

// ============================================================
// AUTOMATION TOOLS
// ============================================================

export async function generateWorkflow(workflowData: any): Promise<AIResult> {
  return callAIJson(
    `You are a workflow automation expert. Design an optimal workflow. Return JSON with: workflow_name (string), trigger (string), steps (array of {action, condition, delay}), expected_outcome (string), optimization_tips (array).`,
    `Generate workflow: ${JSON.stringify(workflowData)}`,
    'gpt-4o-mini',
    600
  );
}

export async function segmentContacts(contacts: any[], criteria: string): Promise<AIResult> {
  return callAIJson(
    `You are a contact segmentation expert. Segment contacts intelligently. Return JSON with: segments (array of {name, description, contact_count, contact_ids, characteristics}), unsegmented_count (number), recommendations (array).`,
    `Segment contacts by: ${criteria}. Contacts: ${JSON.stringify(contacts)}`,
    'gpt-4o-mini',
    600
  );
}

export async function generateAutomationRules(context: any): Promise<AIResult> {
  return callAIJson(
    `You are an automation rules expert. Generate smart automation rules. Return JSON with: rules (array of {name, trigger, condition, action, priority}), optimization_suggestions (array), estimated_time_saved (string).`,
    `Generate automation rules: ${JSON.stringify(context)}`,
    'gpt-4o-mini',
    500
  );
}

export async function autoSaveSuggestions(data: any, type: string): Promise<AIResult> {
  return callAIJson(
    `You are an AI assistant that auto-saves smart suggestions. Return JSON with: suggestions (array of {type, content, confidence, action}), auto_save_recommendations (array).`,
    `Generate auto-save suggestions for ${type}: ${JSON.stringify(data)}`,
    'gpt-4o-mini',
    400
  );
}

console.log('✅ AI Tools Service loaded');
