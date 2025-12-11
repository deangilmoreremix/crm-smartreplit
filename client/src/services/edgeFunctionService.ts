// Edge Function Service for Supabase functions
import { supabase } from '../lib/supabase';

interface ContactInfo {
  name?: string;
  position?: string;
  company?: string;
}

export async function generateCallScript(
  contactInfo: ContactInfo,
  callPurpose: string,
  previousInteractions: string[]
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-sales-pitch', {
      body: {
        contactInfo,
        callPurpose,
        previousInteractions
      }
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    return data?.script || 'Unable to generate call script at this time.';
  } catch (error) {
    console.error('Error calling edge function:', error);
    throw new Error('Failed to generate call script. Please try again.');
  }
}

export async function analyzeSentiment(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
      body: { text }
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    return data || {
      sentiment: 'neutral',
      confidence: 0.5,
      summary: 'Unable to analyze sentiment at this time.'
    };
  } catch (error) {
    console.error('Error calling sentiment analysis:', error);
    throw new Error('Failed to analyze sentiment. Please try again.');
  }
}

export async function draftEmailResponse(originalEmail: string, context?: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('draft-email-response', {
      body: { originalEmail, context }
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    return data?.response || 'Unable to draft email response at this time.';
  } catch (error) {
    console.error('Error calling email draft function:', error);
    throw new Error('Failed to draft email response. Please try again.');
  }
}

// Additional exports for AI tools
export async function analyzeCustomerEmail(email: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-customer-email', {
      body: { email }
    });
    return data?.analysis || 'Unable to analyze email at this time.';
  } catch (error) {
    console.error('Error analyzing customer email:', error);
    return 'Failed to analyze email. Please try again.';
  }
}

export async function generateMeetingSummary(meeting: any): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-meeting-summary', {
      body: { meeting }
    });
    return data?.summary || 'Unable to generate meeting summary at this time.';
  } catch (error) {
    console.error('Error generating meeting summary:', error);
    return 'Failed to generate meeting summary. Please try again.';
  }
}

export async function analyzeMarketTrends(market: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-market-trends', {
      body: { market }
    });
    return data?.trends || 'Unable to analyze market trends at this time.';
  } catch (error) {
    console.error('Error analyzing market trends:', error);
    return 'Failed to analyze market trends. Please try again.';
  }
}

export async function analyzeCompetitor(competitor: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-competitor', {
      body: { competitor }
    });
    return data?.analysis || 'Unable to analyze competitor at this time.';
  } catch (error) {
    console.error('Error analyzing competitor:', error);
    return 'Failed to analyze competitor. Please try again.';
  }
}

export async function generateSalesInsights(data: any): Promise<string> {
  try {
    const { data: result, error } = await supabase.functions.invoke('generate-sales-insights', {
      body: { data }
    });
    return result?.insights || 'Unable to generate sales insights at this time.';
  } catch (error) {
    console.error('Error generating sales insights:', error);
    return 'Failed to generate sales insights. Please try again.';
  }
}

export async function generateSalesForecast(data: any): Promise<string> {
  try {
    const { data: result, error } = await supabase.functions.invoke('generate-sales-forecast', {
      body: { data }
    });
    return result?.forecast || 'Unable to generate sales forecast at this time.';
  } catch (error) {
    console.error('Error generating sales forecast:', error);
    return 'Failed to generate sales forecast. Please try again.';
  }
}