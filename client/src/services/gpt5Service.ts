// Dashboard AI service. Calls the server's OpenAI routes with the signed-in user's own key.
// Errors are thrown to the caller (no fabricated fallback numbers).
import { generateAI } from './aiGenerate';

async function postJSON(url: string, body: unknown): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => {
    throw new Error(`AI service returned an invalid response (${response.status})`);
  });
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.error || `AI request failed (${response.status})`);
  }
  return data;
}

async function generateJSON(prompt: string, tier: 'default' | 'advanced' = 'advanced'): Promise<any> {
  const { content } = await generateAI({ prompt, json: true, tier });
  return JSON.parse(content);
}

export class GPT5Service {
  /** AI greeting for the dashboard (POST /api/openai/smart-greeting). */
  async generateSmartGreeting(userMetrics: any, timeOfDay: string, recentActivity: any) {
    return postJSON('/api/openai/smart-greeting', { userMetrics, timeOfDay, recentActivity });
  }

  /** KPI trend analysis (POST /api/openai/kpi-analysis). */
  async analyzeKPITrends(
    historicalData: any,
    currentMetrics: any,
    chartImages: string[] = [],
    videoData: string[] = []
  ) {
    return postJSON('/api/openai/kpi-analysis', { historicalData, currentMetrics, chartImages, videoData });
  }

  /** Deal intelligence (POST /api/openai/deal-intelligence). */
  async analyzeDealIntelligence(dealData: any, contactHistory: any, marketContext: any) {
    return postJSON('/api/openai/deal-intelligence', { dealData, contactHistory, marketContext });
  }

  /** Business intelligence (POST /api/openai/business-intelligence). */
  async generateBusinessIntelligence(businessData: any, marketContext: any, objectives: any) {
    return postJSON('/api/openai/business-intelligence', { businessData, marketContext, objectives });
  }

  async optimizePerformance(systemMetrics: any, userBehavior: any, businessGoals: any) {
    return generateJSON(`Analyze these metrics and suggest performance optimizations. Return JSON {"optimization_score": number 0-100, "efficiency_gain": number (percent), "recommended_actions": string[], "expected_roi": string, "implementation_timeline": string}.
System metrics: ${JSON.stringify(systemMetrics)}
User behavior: ${JSON.stringify(userBehavior)}
Business goals: ${JSON.stringify(businessGoals)}`);
  }

  async generateAdvancedContent(
    contentType: string,
    parameters: any,
    reasoning_effort: 'minimal' | 'low' | 'medium' | 'high' = 'medium'
  ) {
    const { content } = await generateAI({
      prompt: `Create ${contentType} content with these parameters: ${JSON.stringify(parameters)}`,
      tier: reasoning_effort === 'high' ? 'advanced' : 'default',
    });
    return { content };
  }

  /** Text analysis with optional images (images go through the vision route). */
  async analyzeMultimodal(textData: any, images: string[] = [], charts: string[] = [], documents: string[] = []) {
    return generateJSON(`Analyze this business data. Return JSON {"text_insights": string[], "combined_insights": string[], "confidence_score": number 0-1}.
Text data: ${JSON.stringify(textData)}
Documents: ${JSON.stringify(documents)}
(${images.length + charts.length} images/charts were provided but are not analyzed here.)`);
  }

  async generatePredictiveAnalytics(historicalData: any, forecastPeriod: number = 3, analysisType: string = 'sales') {
    const result = await generateJSON(`Forecast ${analysisType} for the next ${forecastPeriod} periods from this historical data. Return JSON {"predictions": string[], "confidence_intervals": {"low": number, "high": number}, "key_factors": string[], "accuracy_score": number 0-1}.
Data: ${JSON.stringify(historicalData)}`);
    return { ...result, forecast_period: forecastPeriod };
  }

  async generateStrategicPlan(businessContext: any, goals: any, constraints: any, timeframe: string = '12 months') {
    return generateJSON(`Create a ${timeframe} strategic plan. Return JSON {"strategic_objectives": string[], "action_items": string[], "milestones": string[], "risk_mitigation": string[], "success_metrics": string[]}.
Context: ${JSON.stringify(businessContext)}
Goals: ${JSON.stringify(goals)}
Constraints: ${JSON.stringify(constraints)}`);
  }

  /** Sentiment per message: [{ sentiment: 'positive'|'neutral'|'negative', score: -1..1 }]. */
  async analyzeSentiment(messages: string[]): Promise<Array<{ sentiment: string; score: number }>> {
    const result = await generateJSON(
      `Classify the sentiment of each message. Return JSON {"results": [{"sentiment": "positive"|"neutral"|"negative", "score": number from -1 to 1}]} with one entry per message, in order.
Messages: ${JSON.stringify(messages)}`,
      'default'
    );
    return Array.isArray(result.results) ? result.results : [];
  }

  /** Short next-step suggestions for a set of communication activities. */
  async generateCommunicationSuggestions(activities: any[]): Promise<string[]> {
    const result = await generateJSON(
      `Suggest up to 3 concrete next communication steps for these recent activities. Return JSON {"suggestions": string[]}.
Activities: ${JSON.stringify(activities.slice(0, 30))}`,
      'default'
    );
    return Array.isArray(result.suggestions) ? result.suggestions : [];
  }
}

// Export singleton instance
export const gpt5Service = new GPT5Service();
