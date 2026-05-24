// Edge Function Service for Supabase functions
// Falls back to server-side OpenAI when Supabase is not available
import { supabase } from '../lib/supabase';
import { useApiStore } from '../store/apiStore';

interface ContactInfo {
  name?: string;
  position?: string;
  company?: string;
}

const getOpenAIClient = () => {
  const { apiKeys } = useApiStore.getState();
  return apiKeys.openai ? { apiKey: apiKeys.openai } : null;
};

const useServerAPI = async (prompt: string, featureName: string): Promise<string> => {
  const response = await fetch('/api/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, featureUsed: featureName }),
  });
  if (!response.ok) throw new Error('Server API error');
  const data = await response.json();
  return data.output_text || data.content || '';
};

export async function generateCallScript(
  contactInfo: ContactInfo,
  callPurpose: string,
  previousInteractions: string[]
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-sales-pitch', {
      body: { contactInfo, callPurpose, previousInteractions },
    });
    if (error) throw error;
    return data?.script || 'Unable to generate call script at this time.';
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    const prompt = `Create a personalized sales call script for ${contactInfo.name} at ${contactInfo.company || 'their company'}.
Purpose: ${callPurpose}
Previous interactions: ${previousInteractions.join(', ') || 'None'}
Include: Opening, Value Proposition, Key Questions, Objection Handling, Close.`;
    return useServerAPI(prompt, 'call-script-generator');
  }
}

export async function analyzeSentiment(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
      body: { text },
    });
    if (error) throw error;
    return data || { sentiment: 'neutral', confidence: 0.5, summary: 'Analysis complete.' };
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    return { sentiment: 'neutral', confidence: 0.5, summary: 'Unable to complete sentiment analysis.' };
  }
}

export async function draftEmailResponse(originalEmail: string, context?: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('draft-email-response', {
      body: { originalEmail, context },
    });
    if (error) throw error;
    return data?.response || 'Unable to draft email response at this time.';
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    const prompt = `Analyze this email and draft a professional response:\n\nOriginal: ${originalEmail}\nContext: ${context || 'General follow-up'}`;
    return useServerAPI(prompt, 'email-response-generator');
  }
}

export async function analyzeCustomerEmail(email: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-customer-email', {
      body: { email },
    });
    if (error) throw error;
    return data?.analysis || 'Unable to analyze email at this time.';
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    const prompt = `Analyze this customer email and extract key insights:\n\n${email}\n\nInclude: Key topics, Sentiment, Urgency, Action items, Recommended response approach.`;
    return useServerAPI(prompt, 'email-analyzer');
  }
}

export async function generateMeetingSummary(meeting: any): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-meeting-summary', {
      body: { meeting },
    });
    if (error) throw error;
    return data?.summary || 'Unable to generate meeting summary at this time.';
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    const prompt = `Summarize this meeting transcript and identify:\n1. Key discussion points\n2. Decisions made\n3. Action items with owners\n4. Next steps\n\nTranscript: ${typeof meeting === 'string' ? meeting : JSON.stringify(meeting)}`;
    return useServerAPI(prompt, 'meeting-summarizer');
  }
}

export async function analyzeMarketTrends(market: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-market-trends', {
      body: { market },
    });
    if (error) throw error;
    return data?.trends || 'Unable to analyze market trends at this time.';
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    const prompt = `Analyze market trends for: ${market}\n\nProvide insights on: Industry trends, Competitive landscape, Growth opportunities, Risk factors, Strategic recommendations.`;
    return useServerAPI(prompt, 'market-trends-analyzer');
  }
}

export async function analyzeCompetitor(competitor: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-competitor', {
      body: { competitor },
    });
    if (error) throw error;
    return data?.analysis || 'Unable to analyze competitor at this time.';
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    const prompt = `Provide a comprehensive competitive analysis for: ${competitor}\n\nInclude: Strengths, Weaknesses, Market position, Product offerings, Pricing strategy, Strategic moves.`;
    return useServerAPI(prompt, 'competitor-analyzer');
  }
}

export async function generateSalesInsights(contacts: any[], deals: any[]): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-sales-insights', {
      body: { contacts, deals },
    });
    if (error) throw error;
    return data?.insights || 'Unable to generate sales insights at this time.';
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    const prompt = `Analyze this sales data and provide actionable insights:\n\nContacts: ${JSON.stringify(contacts)}\n\nDeals: ${JSON.stringify(deals)}\n\nInclude: Pipeline health, Key opportunities, Risk factors, Recommendations.`;
    return useServerAPI(prompt, 'sales-insights-generator');
  }
}

export async function generateSalesForecast(deals: any[], timeframe: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-sales-forecast', {
      body: { deals, timeframe },
    });
    if (error) throw error;
    return data?.forecast || 'Unable to generate sales forecast at this time.';
  } catch (error) {
    console.warn('Edge function unavailable, using fallback:', error);
    const prompt = `Generate a sales forecast for ${timeframe} based on these deals:\n\n${JSON.stringify(deals)}\n\nInclude: Revenue projection, Confidence level, Key assumptions, Risk factors, Recommendations for hitting targets.`;
    return useServerAPI(prompt, 'sales-forecast-generator');
  }
}

// Additional AI tools with fallback
export async function generateContent(prompt: string, type: string): Promise<string> {
  return useServerAPI(prompt, `content-generator-${type}`);
}

export async function analyzeText(text: string, analysisType: string): Promise<string> {
  return useServerAPI(`Analyze this text (${analysisType}):\n\n${text}`, `text-analyzer-${analysisType}`);
}
