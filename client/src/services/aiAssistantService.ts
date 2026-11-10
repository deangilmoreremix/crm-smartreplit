// AI assistant helpers backed by OpenAI only (POST /api/respond via openAIService).
// The server holds the API key and chooses the model; failures are thrown, never faked.
import { openAIService } from './openAIService';
import { enhancedAIService } from './enhancedAIService';

type Json = Record<string, any>;

async function ask(
  prompt: string,
  opts: { temperature?: number; maxTokens?: number; model?: string; customerId?: string; featureUsed?: string } = {}
): Promise<string> {
  const response = await openAIService.generateContent({
    messages: [{ role: 'user', content: prompt }],
    model: opts.model,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    customerId: opts.customerId,
    featureUsed: opts.featureUsed,
  });
  if (!response.content) throw new Error('AI returned an empty response');
  return response.content;
}

function parseJson<T = any>(text: string, open: '{' | '[' = '{'): T {
  const close = open === '{' ? '}' : ']';
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if (start === -1 || end <= start) throw new Error('AI response did not contain valid JSON');
  return JSON.parse(text.substring(start, end + 1)) as T;
}

class AIAssistantService {
  async isApiKeyConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/openai/status');
      const data = await response.json();
      return data.configured === true;
    } catch (error) {
      console.warn('Failed to check AI availability:', error);
      return false;
    }
  }

  async generatePersonalizedMessage(
    contact: any,
    messageType: 'email' | 'linkedin' | 'cold-outreach'
  ): Promise<string> {
    return ask(
      `Generate a personalized ${messageType} message for a contact with the following information:
${JSON.stringify(contact, null, 2)}

The message should be professional, concise, and tailored to their industry and role.`,
      { temperature: 0.7, maxTokens: 1024, featureUsed: 'personalized-message' }
    );
  }

  async generateCustomerPersona(industry: string, companySize: string, painPoints: string[]) {
    return ask(
      `Create a detailed customer persona for a B2B buyer.
Industry: ${industry}
Company size: ${companySize}
Pain points:
${painPoints.map((p) => `- ${p}`).join('\n')}

Include: demographics and role, goals, pain points, buying behavior, preferred channels, objections, and recommended messaging.`,
      { temperature: 0.7, maxTokens: 1500, featureUsed: 'customer-persona' }
    );
  }

  async generateMeetingAgenda(purpose: string, attendees: string[], previousNotes?: string) {
    return ask(
      `Create a structured meeting agenda.
Purpose: ${purpose}
Attendees: ${attendees.join(', ')}
${previousNotes ? `Previous meeting notes: ${previousNotes}` : ''}

Include time allocations, discussion topics, owners, and expected outcomes/next steps.`,
      { temperature: 0.6, maxTokens: 1200, featureUsed: 'meeting-agenda' }
    );
  }

  async generateObjectionHandler(objection: string, productInfo: string) {
    return ask(
      `A prospect raised this sales objection: "${objection}"
${productInfo}

Provide: acknowledgement, 2-3 response strategies with sample wording, supporting proof points, and a follow-up question.`,
      { temperature: 0.7, maxTokens: 1200, featureUsed: 'objection-handler' }
    );
  }

  async generateEmailResponse(
    originalEmail: string,
    contact: { name?: string; position?: string; company?: string },
    dealContext?: string
  ) {
    return ask(
      `Write a professional reply to this email.
Original email:
"""
${originalEmail}
"""
Contact: ${contact.name || 'Unknown'}, ${contact.position || ''} at ${contact.company || ''}
${dealContext ? `Deal context: ${dealContext}` : ''}

Return only the reply email (subject line and body).`,
      { temperature: 0.7, maxTokens: 1000, featureUsed: 'email-response' }
    );
  }

  async generateQuickContent(type: string, prompt: string, length: 'short' | 'medium' | 'long' = 'short') {
    const maxTokens = length === 'short' ? 300 : length === 'medium' ? 600 : 1200;
    return ask(`Write ${length} ${type} content.\n\n${prompt}`, {
      temperature: 0.7,
      maxTokens,
      featureUsed: 'quick-content',
    });
  }

  async optimizeVoiceTone(content: string, targetAudience: string, communicationGoal: string) {
    return ask(
      `Rewrite the following content to optimize its voice and tone.
Target audience: ${targetAudience}
Communication goal: ${communicationGoal}

Content:
"""
${content}
"""

Return the optimized version followed by a short list of the key tone changes you made.`,
      { temperature: 0.6, maxTokens: 1500, featureUsed: 'voice-tone' }
    );
  }

  async analyzeSentimentRealTime(text: string): Promise<{ sentiment: number; emotions: string[] }> {
    const content = await ask(
      `Analyze the sentiment of this text. Return only JSON: {"sentiment": number between -1 and 1, "emotions": ["emotion", ...]}.
Text: "${text}"`,
      { temperature: 0.2, maxTokens: 150, featureUsed: 'sentiment-realtime' }
    );
    const parsed = parseJson<Json>(content);
    return {
      sentiment: Number(parsed.sentiment) || 0,
      emotions: Array.isArray(parsed.emotions) ? parsed.emotions.map(String) : [],
    };
  }

  async suggestPersonalization(contact: any, previousInteractions?: any) {
    return ask(
      `Suggest personalization ideas for outreach to this contact.
Contact: ${JSON.stringify(contact, null, 2)}
Previous interactions: ${JSON.stringify(previousInteractions ?? [], null, 2)}

Give concise, specific talking points and a suggested opening line.`,
      { temperature: 0.7, maxTokens: 800, featureUsed: 'personalization' }
    );
  }

  async validateFormField(fieldLabel: string, fieldValue: string, context: string) {
    const content = await ask(
      `Validate this ${fieldLabel} field value: "${fieldValue}" in the context of a ${context} form.

Check for appropriateness for the field type, professional tone if applicable, completeness and clarity, and any suggestions for improvement.

Return only a JSON object: {"valid": boolean, "message": "validation message or suggestion"}`,
      { temperature: 0.3, maxTokens: 200, featureUsed: 'form-validation' }
    );
    const result = parseJson<Json>(content);
    return {
      valid: result.valid !== false,
      message: String(result.message || (result.valid !== false ? 'Valid input' : 'Please check your input')),
    };
  }
}

export const aiAssistantService = new AIAssistantService();

/** Hook-style accessor used by AI tool components. */
export const useAIAssistant = () => ({
  generateContent: (request: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemInstruction?: string;
    customerId?: string;
    featureUsed?: string;
  }) => enhancedAIService.generateContent(request),
  generateCustomerPersona: aiAssistantService.generateCustomerPersona.bind(aiAssistantService),
  generateMeetingAgenda: aiAssistantService.generateMeetingAgenda.bind(aiAssistantService),
  generateObjectionHandler: aiAssistantService.generateObjectionHandler.bind(aiAssistantService),
  generateEmailResponse: aiAssistantService.generateEmailResponse.bind(aiAssistantService),
  generateQuickContent: aiAssistantService.generateQuickContent.bind(aiAssistantService),
  optimizeVoiceTone: aiAssistantService.optimizeVoiceTone.bind(aiAssistantService),
  analyzeSentimentRealTime: aiAssistantService.analyzeSentimentRealTime.bind(aiAssistantService),
  suggestPersonalization: aiAssistantService.suggestPersonalization.bind(aiAssistantService),
  validateFormField: aiAssistantService.validateFormField.bind(aiAssistantService),
  generateEmail: (context: any, customerId?: string, model?: string) =>
    enhancedAIService.generateEmail(context, customerId, model),
  analyzeDeal: (dealData: any, customerId?: string, model?: string) =>
    enhancedAIService.generateInsights({ ...dealData, analysisType: 'deal' }, customerId, model),
  analyzePipelineHealth: (pipelineData: any, customerId?: string, model?: string) =>
    enhancedAIService.generateInsights({ ...pipelineData, analysisType: 'pipeline' }, customerId, model),
  getAvailableModels: () => enhancedAIService.getAvailableModels(),
  getRecommendedModel: (useCase: string) => enhancedAIService.getRecommendedModel(useCase),
});

export default aiAssistantService;
