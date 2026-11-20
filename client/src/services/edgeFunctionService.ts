// AI tool helpers on the OpenAI Responses API (server routes, the user's own OpenAI key). These previously
// called Supabase edge functions that were never deployed. Research helpers (market trends, competitors,
// business analysis) use live web search and append the cited sources.
import { generateAI, researchAI, type UrlSource } from './aiGenerate';

interface ContactInfo {
  name?: string;
  position?: string;
  company?: string;
}

const generate = async (prompt: string, tier: 'default' | 'advanced' = 'default'): Promise<string> =>
  (await generateAI({ prompt, tier })).content;

const withSources = (text: string, sources: UrlSource[]) =>
  sources.length ? `${text}\n\nSources:\n${sources.map((s) => `- ${s.title || s.url}: ${s.url}`).join('\n')}` : text;

/** Web research (research features only) — returns the answer with its cited sources appended. */
const research = async (prompt: string): Promise<string> => {
  const { content, sources } = await researchAI({ prompt });
  return withSources(content, sources);
};

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
  const { data } = await generateAI({
    maxTokens: 300,
    schemaName: 'sentiment',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['sentiment', 'confidence', 'summary'],
      properties: {
        sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
        confidence: { type: 'number' },
        summary: { type: 'string' },
      },
    },
    prompt: `Analyze the sentiment of this text. confidence is between 0 and 1.\n\n${text}`,
  });
  if (!data) throw new Error('Sentiment analysis returned no result');
  const parsed = data;
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

export async function analyzeMarketTrends(market: string, targetMarket?: string, timeframe?: string): Promise<string> {
  const scope = [
    targetMarket ? `Target market: ${targetMarket}` : '',
    timeframe ? `Timeframe: ${timeframe}` : '',
  ].filter(Boolean).join('\n');
  return research(
    `Analyze current market trends for: ${market}${scope ? `\n${scope}` : ''}\n\nProvide insights on: Industry trends, Competitive landscape, Growth opportunities, Risk factors, Strategic recommendations.`
  );
}

export async function analyzeCompetitor(competitor: string, industry?: string, ourStrengths: string[] = []): Promise<string> {
  const context = [
    industry ? `Industry: ${industry}` : '',
    ourStrengths.length ? `Our strengths to compare against: ${ourStrengths.join('; ')}` : '',
  ].filter(Boolean).join('\n');
  return research(
    `Provide a comprehensive competitive analysis for: ${competitor}${context ? `\n${context}` : ''}\n\nInclude: Strengths, Weaknesses, Market position, Product offerings, Pricing strategy, Strategic moves.`
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

// Used by the Business Analyzer page (web research)
export async function analyzeBusinessData(business: any): Promise<string> {
  return research(
    `Research this business (including its website and public presence) and give a concise report: positioning, ` +
      `strengths, weaknesses, opportunities, marketing and sales recommendations, and next steps.\n\n${JSON.stringify(business, null, 2)}`
  );
}
