
import { openaiService } from './openaiService';
import { geminiService } from './geminiService';

export interface AIToolRequest {
  toolType: string;
  prompt: string;
  context?: any;
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    provider?: 'openai' | 'gemini';
  };
}

export interface AIToolResponse {
  content: string;
  reasoning?: any;
  analytics?: any;
  suggestions?: string[];
  confidence?: number;
}

class AIToolsService {
  async processAIRequest(request: AIToolRequest): Promise<AIToolResponse> {
    const { toolType, prompt, context, options = {} } = request;
    
    try {
      const enhancedPrompt = this.buildEnhancedPrompt(toolType, prompt, context);
      
      let response;
      if (options.provider === 'gemini') {
        response = await geminiService.generateContent(enhancedPrompt, {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 1000
        });
      } else {
        response = await openaiService.generateCompletion(enhancedPrompt, {
          model: options.model || 'gpt-4',
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1000
        });
      }

      return this.parseAIResponse(response.content, toolType);
    } catch (error) {
      console.error(`AI Tool Service Error for ${toolType}:`, error);
      return this.getFallbackResponse(toolType, prompt);
    }
  }

  private buildEnhancedPrompt(toolType: string, prompt: string, context?: any): string {
    const basePrompts: Record<string, string> = {
      'email-composer': `Generate a professional email for: ${prompt}\n\nProvide the email content, reasoning for tone and structure choices, and suggestions for improvement.`,
      'call-script': `Create a sales call script for: ${prompt}\n\nInclude objection handling, conversation flow, and psychological insights.`,
      'objection-handler': `Generate responses to the sales objection: ${prompt}\n\nProvide multiple response strategies, psychological reasoning, and follow-up approaches.`,
      'proposal-generator': `Create a professional proposal for: ${prompt}\n\nInclude structure reasoning, persuasion techniques, and improvement suggestions.`,
      'competitor-analysis': `Analyze the competitive landscape for: ${prompt}\n\nProvide market insights, positioning strategies, and competitive advantages.`,
      'market-trend': `Analyze market trends related to: ${prompt}\n\nInclude trend analysis, predictions, and strategic recommendations.`,
      'customer-persona': `Create a detailed customer persona for: ${prompt}\n\nInclude demographics, pain points, motivations, and engagement strategies.`,
      'sentiment-analysis': `Analyze the sentiment and emotional tone of: ${prompt}\n\nProvide sentiment scores, emotional indicators, and communication recommendations.`
    };

    let enhancedPrompt = basePrompts[toolType] || `Process this request for ${toolType}: ${prompt}`;
    
    if (context) {
      enhancedPrompt += `\n\nContext: ${JSON.stringify(context)}`;
    }

    enhancedPrompt += `\n\nPlease format your response as JSON with appropriate fields for the tool type.`;
    
    return enhancedPrompt;
  }

  private parseAIResponse(content: string, toolType: string): AIToolResponse {
    try {
      const parsed = JSON.parse(content);
      return {
        content: parsed.content || parsed.text || content,
        reasoning: parsed.reasoning,
        analytics: parsed.analytics,
        suggestions: parsed.suggestions || parsed.improvements,
        confidence: parsed.confidence || 85
      };
    } catch (error) {
      // Fallback for non-JSON responses
      return {
        content: content,
        confidence: 75
      };
    }
  }

  private getFallbackResponse(toolType: string, prompt: string): AIToolResponse {
    const fallbacks: Record<string, string> = {
      'email-composer': `Subject: Regarding ${prompt}\n\nI wanted to reach out to discuss ${prompt}. I believe this could be valuable for your business.\n\nWould you like to schedule a call to explore this further?\n\nBest regards`,
      'call-script': `Opening: Hi [Name], this is [Your Name] from [Company]. I'm calling about ${prompt}.\n\nValue Prop: We help companies like yours improve their ${prompt} results.\n\nQuestion: What's your biggest challenge with ${prompt} right now?\n\nClose: Based on what you've shared, I'd love to show you how we can help. Are you available for a 15-minute demo this week?`,
      'objection-handler': `I understand your concern about ${prompt}. Many of our clients had similar reservations initially.\n\nWhat I've found is that [specific benefit]. Would it help if I shared a case study of how we helped a similar company overcome this exact challenge?\n\nAlternatively, we could start with a small pilot to demonstrate value before any major commitment.`,
      'default': `I've generated a response for ${prompt}. While this is a simplified version, our AI tools can provide more detailed and personalized content when fully configured.`
    };

    return {
      content: fallbacks[toolType] || fallbacks['default'],
      confidence: 60,
      suggestions: [
        'Configure AI providers for enhanced results',
        'Add more context for better personalization',
        'Review and customize the generated content'
      ]
    };
  }

  async generateReasoningContent(type: string, input: string, options?: any): Promise<any> {
    const prompt = `Generate ${type} content with detailed step-by-step reasoning for: ${input}

Please provide:
1. The main content
2. Detailed reasoning for each decision
3. Alternative approaches considered
4. Psychological insights
5. Optimization suggestions

Format as JSON with keys: content, reasoning, alternatives, psychology, suggestions`;

    return this.processAIRequest({
      toolType: `reasoning-${type}`,
      prompt,
      options
    });
  }

  async generateRealTimeContent(type: string, input: string, context?: any): Promise<any> {
    const prompt = `Generate real-time ${type} content for: ${input}

Context: ${JSON.stringify(context || {})}

Provide immediate, actionable content optimized for speed and relevance.`;

    return this.processAIRequest({
      toolType: `realtime-${type}`,
      prompt,
      context,
      options: { temperature: 0.8, maxTokens: 500 }
    });
  }
}

export const aiToolsService = new AIToolsService();
