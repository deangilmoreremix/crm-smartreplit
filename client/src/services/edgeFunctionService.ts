// AI tool helpers. These previously called Supabase edge functions that were never deployed and then
// fell back to /api/respond; they now call the server's generation route with the user's OpenAI key.
import { generateAI } from './aiGenerate';

interface ContactInfo {
  name?: string;
  position?: string;
  company?: string;
}

const generate = async (prompt: string, tier: 'default' | 'advanced' = 'default'): Promise<string> =>
  (await generateAI({ prompt, tier })).content;

export async function generateCallScript(
  contactInfo: ContactInfo,
  callPurpose: string,
  previousInteractions: string[]
): Promise<string> {
  return generate(`Create a personalized sales call script for ${contactInfo.name}${contactInfo.position ? `, ${contactInfo.position}` : ''} at ${contactInfo.company || 'their company'}.
Purpose: ${callPurpose}
Previous interactions: ${previousInteractions.join(', ') || 'None'}
Include: Opening, Value Proposition, Key Questions, Objection Handling, Close.`);
}

export async function analyzeSentiment(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
}> {
  const { content } = await generateAI({
    json: true,
    maxTokens: 300,
    prompt: `Analyze the sentiment of this text. Return JSON {"sentiment": "positive" | "negative" | "neutral", "confidence": number between 0 and 1, "summary": string}.\n\n${text}`,
  });
  const parsed = JSON.parse(content);
  const sentiment = ['positive', 'negative', 'neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral';
  return {
    sentiment,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    summary: parsed.summary || '',
  };
}

export async function draftEmailResponse(originalEmail: string, context?: string): Promise<string> {
  return generate(
    `Analyze this email and draft a professional response:\n\nOriginal: ${originalEmail}\nContext: ${context || 'General follow-up'}`
  );
}

export async function analyzeCustomerEmail(email: string): Promise<string> {
  return generate(
    `Analyze this customer email and extract key insights:\n\n${email}\n\nInclude: Key topics, Sentiment, Urgency, Action items, Recommended response approach.`
  );
}

export async function generateMeetingSummary(meeting: any): Promise<string> {
  return generate(
    `Summarize this meeting transcript and identify:\n1. Key discussion points\n2. Decisions made\n3. Action items with owners\n4. Next steps\n\nTranscript: ${typeof meeting === 'string' ? meeting : JSON.stringify(meeting)}`
  );
}

export async function analyzeMarketTrends(market: string): Promise<string> {
  return generate(
    `Analyze market trends for: ${market}\n\nProvide insights on: Industry trends, Competitive landscape, Growth opportunities, Risk factors, Strategic recommendations. Note that you have no live web data.`,
    'advanced'
  );
}

export async function analyzeCompetitor(competitor: string): Promise<string> {
  return generate(
    `Provide a comprehensive competitive analysis for: ${competitor}\n\nInclude: Strengths, Weaknesses, Market position, Product offerings, Pricing strategy, Strategic moves. Note that you have no live web data.`,
    'advanced'
  );
}

export async function generateSalesInsights(contacts: any[], deals: any[]): Promise<string> {
  return generate(
    `Analyze this sales data and provide actionable insights:\n\nContacts: ${JSON.stringify(contacts)}\n\nDeals: ${JSON.stringify(deals)}\n\nInclude: Pipeline health, Key opportunities, Risk factors, Recommendations.`,
    'advanced'
  );
}

export async function generateSalesForecast(deals: any[], timeframe: string): Promise<string> {
  return generate(
    `Generate a sales forecast for ${timeframe} based on these deals:\n\n${JSON.stringify(deals)}\n\nInclude: Revenue projection, Confidence level, Key assumptions, Risk factors, Recommendations for hitting targets.`,
    'advanced'
  );
}

export async function generateContent(prompt: string, _type: string): Promise<string> {
  return generate(prompt);
}

export async function analyzeText(text: string, analysisType: string): Promise<string> {
  return generate(`Analyze this text (${analysisType}):\n\n${text}`);
}
