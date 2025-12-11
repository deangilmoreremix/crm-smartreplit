import { supabase } from '../lib/supabase';
import { supabaseAIService } from './supabaseAIService';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

interface GenerateRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  customerId?: string;
  featureUsed?: string;
  functions?: any[];
  functionCall?: 'auto' | 'none' | { name: string };
}

interface GenerateResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  responseTime: number;
  functionCalls?: any[];
}

class OpenAIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private defaultModel: string = 'gpt-4o-mini';

  constructor(apiKey?: string) {
    // API key is now handled server-side only
    this.apiKey = apiKey || '';
  }

  /**
   * Check if server-side API is available
   */
  private async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/openai/status');
      const data = await response.json();
      return data.configured === true;
    } catch (error) {
      console.warn('Failed to check server availability:', error);
      return false;
    }
  }

  /**
   * Strip markdown code blocks from AI response
   */
  private stripMarkdownCodeBlocks(content: string): string {
    // Remove markdown code blocks (```json...``` or ```...```)
    let cleaned = content.trim();
    
    // Remove opening code block markers
    cleaned = cleaned.replace(/^```(?:json|javascript|js)?\s*/i, '');
    
    // Remove closing code block markers
    cleaned = cleaned.replace(/\s*```\s*$/i, '');
    
    // Remove any remaining leading/trailing whitespace
    return cleaned.trim();
  }

  /**
   * Validate and clean customer ID for UUID compatibility
   */
  private validateCustomerId(customerId?: string): string | undefined {
    if (!customerId || customerId === 'demo-customer-id' || customerId.includes('demo') || customerId.includes('placeholder')) {
      return undefined;
    }
    return customerId;
  }

  /**
   * Generate content using server-side OpenAI API
   */
  async generateContent(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    try {
      const response = await fetch('/api/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.messages.map(m => m.content).join('\n'),
          model,
          temperature: request.temperature ?? 0.7,
          maxTokens: request.maxTokens ?? 1000,
          ...(request.functions ? { functions: request.functions } : {}),
          ...(request.functionCall ? { function_call: request.functionCall } : {})
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AI API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Extract content from server response format
      let content = data.output_text || data.content || '';
      // Always strip markdown code blocks from the content before returning
      content = this.stripMarkdownCodeBlocks(content);

      const result: GenerateResponse = {
        content,
        model: data.model || model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: 'stop', // Server doesn't provide finish reason
        responseTime,
        ...(data.tool_calls ? { functionCalls: data.tool_calls } : {})
      };

      // Log usage to Supabase (gracefully handle failures)
      const validCustomerId = this.validateCustomerId(request.customerId);
      if (validCustomerId) {
        try {
          const modelConfig = await supabaseAIService.getModelById(model);
          const cost = this.calculateCost(model, result.usage.totalTokens, modelConfig);
          
          await supabaseAIService.logUsage({
            customer_id: validCustomerId,
            model_id: model,
            feature_used: request.featureUsed || 'chat-completion',
            tokens_used: result.usage.totalTokens,
            cost,
            response_time_ms: responseTime,
            success: true
          });
        } catch (logError) {
          console.warn('Failed to log OpenAI usage (non-critical):', logError);
        }
      }

      return result;
    } catch (error) {
      // Log failed usage (gracefully handle failures)
      const validCustomerId = this.validateCustomerId(request.customerId);
      if (validCustomerId) {
        try {
          await supabaseAIService.logUsage({
            customer_id: validCustomerId,
            model_id: model,
            feature_used: request.featureUsed || 'chat-completion',
            tokens_used: 0,
            cost: 0,
            response_time_ms: Date.now() - startTime,
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (logError) {
          console.warn('Failed to log OpenAI error usage (non-critical):', logError);
        }
      }

      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(model: string, tokens: number, modelConfig: any): number {
    if (modelConfig?.pricing) {
      // Use pricing from database if available
      const inputTokens = Math.floor(tokens * 0.7);
      const outputTokens = tokens - inputTokens;
      
      const inputCost = (inputTokens / 1_000_000) * modelConfig.pricing.input_per_1m_tokens;
      const outputCost = (outputTokens / 1_000_000) * modelConfig.pricing.output_per_1m_tokens;
      
      return inputCost + outputCost;
    }

    // Default pricing if model not in database
    const pricing: Record<string, number> = {
      'gpt-4o': 5.0,
      'gpt-4o-mini': 0.15,
      'gpt-3.5-turbo': 0.0015,
      'gpt-4': 10.0,
      'gpt-4-turbo': 10.0
    };

    const costPer1kTokens = pricing[model] || 0.0015;
    return (tokens / 1000) * costPer1kTokens;
  }

  /**
   * Generate email content
   */
  async generateEmail(context: {
    recipient: string;
    purpose: string;
    tone?: 'formal' | 'casual' | 'friendly';
    context?: string;
  }, customerId?: string, model?: string): Promise<{ subject: string; body: string }> {
    const serverAvailable = await this.isServerAvailable();
    if (!serverAvailable) {
      console.warn('AI service not available, returning fallback email');
      return {
        subject: `Following up: ${context.purpose}`,
        body: `Dear ${context.recipient},\n\nI hope this email finds you well.\n\n[AI service temporarily unavailable - please try again later]\n\nBest regards`
      };
    }
    
    const tone = context.tone || 'professional';
    const systemPrompt = `You are a professional email writing assistant. Write clear, engaging emails that drive action. Always format your response as JSON with subject and body fields. Do not wrap the JSON in markdown code blocks.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a ${tone} email for the following context:
      
      Recipient: ${context.recipient}
      Purpose: ${context.purpose}
      Additional Context: ${context.context || 'None'}
      
      Format as JSON:
      {
        "subject": "string",
        "body": "string"
      }` }
    ];

    try {
      const response = await this.generateContent({
        messages,
        model: model || 'gpt-4o-mini',
        customerId,
        featureUsed: 'email-generation',
        temperature: 0.7
      });

      // Content is already stripped in generateContent, but parse safely
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        console.warn('Failed to parse JSON response, attempting additional cleanup:', parseError);
        // Additional cleanup attempt
        const cleanedContent = response.content
          .replace(/^[^{]*/, '') // Remove any text before the first {
          .replace(/[^}]*$/, ''); // Remove any text after the last }
        return JSON.parse(cleanedContent);
      }
    } catch (error) {
      console.error('Error generating email with OpenAI:', error);
      return {
        subject: `Following up: ${context.purpose}`,
        body: `Dear ${context.recipient},\n\nI hope this email finds you well.\n\n[Generated content unavailable - please try again]\n\nBest regards`
      };
    }
  }

  /**
   * Generate deal insights
   */
  async generateDealInsights(dealData: any, customerId?: string, model?: string): Promise<any> {
    const serverAvailable = await this.isServerAvailable();
    if (!serverAvailable) {
      console.warn('AI service not available, returning fallback insights');
      return {
        riskLevel: "unknown",
        keyInsights: ["AI service temporarily unavailable"],
        recommendedActions: ["Please try again later"],
        winProbability: 0,
        potentialBlockers: ["AI analysis unavailable"]
      };
    }
    
    const systemPrompt = `You are an AI specialized in sales analytics. Analyze the provided deal data and return insightful observations in JSON format only. Do not wrap the JSON in markdown code blocks.`;
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this deal data and provide actionable insights:
      
      ${JSON.stringify(dealData)}
      
      Format your response as JSON with the following structure:
      {
        "riskLevel": "low|medium|high",
        "keyInsights": ["string"],
        "recommendedActions": ["string"],
        "winProbability": number,
        "potentialBlockers": ["string"]
      }` }
    ];

    try {
      const response = await this.generateContent({
        messages,
        model: model || 'gpt-4o-mini',
        customerId,
        featureUsed: 'deal-insights',
        temperature: 0.3
      });

      // Content is already stripped in generateContent, but parse safely
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        console.warn('Failed to parse JSON response, attempting additional cleanup:', parseError);
        // Additional cleanup attempt
        const cleanedContent = response.content
          .replace(/^[^{]*/, '') // Remove any text before the first {
          .replace(/[^}]*$/, ''); // Remove any text after the last }
        return JSON.parse(cleanedContent);
      }
    } catch (error) {
      console.error('Error generating deal insights with OpenAI:', error);
      return {
        riskLevel: "unknown",
        keyInsights: ["Unable to generate insights. Please try again later."],
        recommendedActions: ["Review deal data manually"],
        winProbability: 0,
        potentialBlockers: ["AI analysis unavailable"]
      };
    }
  }

  /**
   * Generate pipeline health analysis
   */
  async analyzePipelineHealth(pipelineData: any, customerId?: string, model?: string): Promise<any> {
    const serverAvailable = await this.isServerAvailable();
    if (!serverAvailable) {
      console.warn('AI service not available, returning fallback analysis');
      return {
        healthScore: 0,
        keyInsights: ["AI service temporarily unavailable"],
        bottlenecks: ["Please try again later"],
        opportunities: ["AI analysis unavailable"],
        forecastAccuracy: 0
      };
    }
    
    const systemPrompt = `You are an AI specialized in sales pipeline analysis. Examine the provided pipeline data and identify patterns, bottlenecks, and opportunities. Return only valid JSON without markdown formatting.`;
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this pipeline data and provide actionable insights:
      
      ${JSON.stringify(pipelineData)}
      
      Format your response as JSON with the following structure:
      {
        "healthScore": number,
        "keyInsights": ["string"],
        "bottlenecks": ["string"],
        "opportunities": ["string"],
        "forecastAccuracy": number
      }` }
    ];

    try {
      const response = await this.generateContent({
        messages,
        model: model || 'gpt-4o-mini',
        customerId,
        featureUsed: 'pipeline-health',
        temperature: 0.3
      });

      // Content is already stripped in generateContent, but parse safely
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        console.warn('Failed to parse JSON response, attempting additional cleanup:', parseError);
        // Additional cleanup attempt
        const cleanedContent = response.content
          .replace(/^[^{]*/, '') // Remove any text before the first {
          .replace(/[^}]*$/, ''); // Remove any text after the last }
        return JSON.parse(cleanedContent);
      }
    } catch (error) {
      console.error('Error analyzing pipeline health with OpenAI:', error);
      return {
        healthScore: 0,
        keyInsights: ["Unable to analyze pipeline health. Please try again later."],
        bottlenecks: ["Analysis unavailable"],
        opportunities: ["Analysis unavailable"],
        forecastAccuracy: 0
      };
    }
  }

  /**
   * Generate meeting agenda
   */
  async generateMeetingAgenda(context: {
    meetingTitle: string;
    attendees: string[];
    purpose: string;
    duration: number;
    previousNotes?: string;
  }, customerId?: string, model?: string): Promise<any> {
    const serverAvailable = await this.isServerAvailable();
    if (!serverAvailable) {
      console.warn('AI service not available, returning fallback agenda');
      return {
        title: context.meetingTitle,
        objective: context.purpose,
        agendaItems: [
          {
            topic: "Introduction",
            duration: 5,
            owner: "All",
            description: "Welcome and meeting objectives"
          }
        ],
        notes: "AI service temporarily unavailable - please try again later."
      };
    }
    
    const systemPrompt = `You are an AI specialized in meeting planning and facilitation. Create clear, focused meeting agendas that make excellent use of time. Return only valid JSON without markdown formatting.`;
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a meeting agenda for the following context:
      
      Meeting Title: ${context.meetingTitle}
      Attendees: ${context.attendees.join(', ')}
      Purpose: ${context.purpose}
      Duration: ${context.duration} minutes
      Previous Notes: ${context.previousNotes || 'None'}
      
      Format your response as JSON with the following structure:
      {
        "title": "string",
        "objective": "string",
        "agendaItems": [
          {
            "topic": "string",
            "duration": number,
            "owner": "string",
            "description": "string"
          }
        ],
        "notes": "string"
      }` }
    ];

    try {
      const response = await this.generateContent({
        messages,
        model: model || 'gpt-4o-mini',
        customerId,
        featureUsed: 'meeting-agenda',
        temperature: 0.7
      });

      // Content is already stripped in generateContent, but parse safely
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        console.warn('Failed to parse JSON response, attempting additional cleanup:', parseError);
        // Additional cleanup attempt
        const cleanedContent = response.content
          .replace(/^[^{]*/, '') // Remove any text before the first {
          .replace(/[^}]*$/, ''); // Remove any text after the last }
        return JSON.parse(cleanedContent);
      }
    } catch (error) {
      console.error('Error generating meeting agenda with OpenAI:', error);
      return {
        title: context.meetingTitle,
        objective: context.purpose,
        agendaItems: [
          {
            topic: "Introduction",
            duration: 5,
            owner: "All",
            description: "Welcome and meeting objectives"
          }
        ],
        notes: "Failed to generate complete agenda. Please try again."
      };
    }
  }
}

// Create singleton instance
export const openAIService = new OpenAIService();

// Export service for use in components
export default openAIService;