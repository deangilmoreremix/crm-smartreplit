import { enhancedGeminiService } from './enhancedGeminiService';
import { openAIService } from './openAIService';

// Feature types for orchestration
export type AIFeature = 
  | 'email_generation'
  | 'pipeline_analysis' 
  | 'deal_insights'
  | 'meeting_agenda'
  | 'contact_scoring'
  | 'content_creation'
  | 'quick_response'
  | 'lead_qualification'
  | 'business_analysis';

interface TaskContext {
  customerId?: string;
  modelId?: string;
  complexity?: 'low' | 'medium' | 'high';
  priority?: 'speed' | 'quality' | 'cost';
  maxBudget?: number;
  promptTokens?: number;
}

interface ServiceResponse {
  content: any;
  model: string;
  provider: string;
  responseTime: number;
  cost?: number;
  tokensUsed?: number;
  success: boolean;
  error?: string;
}

class AIOrchestratorService {
  // Track usage statistics for smart routing
  private usageStats: Record<string, {
    callCount: number;
    successCount: number;
    avgResponseTime: number;
    avgCost: number;
  }> = {};

  constructor() {
    this.initializeStats();
  }

  private initializeStats() {
    const models = [
      'gemma-2-2b-it', 'gemma-2-9b-it', 'gemma-2-27b-it',
      'gemini-2.5-flash', 'gemini-2.5-flash-8b',
      'gpt-4o-mini', 'gpt-3.5-turbo'
    ];

    models.forEach(model => {
      this.usageStats[model] = {
        callCount: 0,
        successCount: 0,
        avgResponseTime: 0,
        avgCost: 0
      };
    });
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
   * Parse JSON safely from AI response
   */
  private parseJsonSafely(content: string): any {
    // First strip any markdown code blocks
    const cleaned = this.stripMarkdownCodeBlocks(content);
    
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('Failed to parse JSON, attempting additional cleanup:', error);
      
      // Additional cleanup attempt - sometimes AI adds explanatory text before/after the JSON
      try {
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonPart = cleaned.substring(jsonStart, jsonEnd);
          return JSON.parse(jsonPart);
        }
      } catch (secondError) {
        console.error('Failed additional JSON parsing attempt:', secondError);
      }
      
      throw new Error('Failed to parse response as JSON');
    }
  }

  /**
   * Validate and clean customer ID for UUID compatibility
   */
  private validateCustomerId(customerId?: string): string | undefined {
    if (!customerId || 
        customerId === 'demo-customer-id' || 
        customerId.includes('demo') || 
        customerId.includes('placeholder') ||
        customerId === 'test-customer' ||
        customerId.startsWith('demo-') ||
        customerId.startsWith('test-') ||
        customerId.length < 10) {
      return undefined;
    }
    
    // Check if it's a valid UUID format (basic validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(customerId)) {
      console.debug(`Invalid customer ID format: ${customerId}, treating as null`);
      return undefined;
    }
    
    return customerId;
  }

  /**
   * Check if any required API providers are available (server-side check)
   */
  private async hasAvailableProvider(): Promise<boolean> {
    try {
      // Check server-side availability
      const response = await fetch('/api/openai/status');
      const openaiAvailable = response.ok && (await response.json()).configured === true;

      // For now, assume Gemini is available if OpenAI is (they use the same status endpoint)
      return openaiAvailable;
    } catch (error) {
      console.warn('Failed to check provider availability:', error);
      return false;
    }
  }

  /**
   * Get the optimal model for a given feature/task
   */
  private async getOptimalModel(feature: AIFeature, context: TaskContext): Promise<string> {
    // Check if user specified a model
    if (context.modelId) {
      return context.modelId;
    }

    // Get model recommendations based on feature type
    const modelType =
      feature === 'email_generation' ? 'email_generation' :
      feature === 'pipeline_analysis' ? 'business_analysis' :
      feature === 'deal_insights' ? 'business_analysis' :
      feature === 'meeting_agenda' ? 'content_creation' :
      feature === 'contact_scoring' ? 'contact_scoring' :
      feature === 'content_creation' ? 'content_creation' :
      feature === 'quick_response' ? 'categorization' :
      feature === 'lead_qualification' ? 'lead_qualification' :
      'categorization';

    // Check server-side availability to determine which models to use
    try {
      const response = await fetch('/api/openai/status');
      const status = await response.json();

      if (status.configured) {
        // If OpenAI is available, prefer it for quality tasks
        if (context.priority === 'quality' && feature === 'business_analysis') {
          return 'gpt-4o-mini';
        } else if (context.priority === 'cost') {
          return 'gpt-3.5-turbo';
        } else {
          return 'gpt-4o-mini';
        }
      }
    } catch (error) {
      console.warn('Failed to check server availability for model selection:', error);
    }

    // Default to Gemini models if OpenAI is not available or on error
    if (context.priority === 'speed') {
      return 'gemma-2-2b-it';
    } else {
      return 'gemini-2.5-flash';
    }
  }

  /**
   * Record usage statistics for smart routing
   */
  private updateStats(modelId: string, responseTime: number, cost: number, success: boolean) {
    if (!this.usageStats[modelId]) {
      this.usageStats[modelId] = {
        callCount: 0,
        successCount: 0,
        avgResponseTime: 0,
        avgCost: 0
      };
    }

    const stats = this.usageStats[modelId];
    stats.callCount++;
    if (success) stats.successCount++;

    // Update averages
    stats.avgResponseTime = (stats.avgResponseTime * (stats.callCount - 1) + responseTime) / stats.callCount;
    stats.avgCost = (stats.avgCost * (stats.callCount - 1) + cost) / stats.callCount;
  }

  /**
   * Check if a model is from Google (Gemini/Gemma)
   */
  private isGoogleModel(modelId: string): boolean {
    return modelId.startsWith('gemini') || modelId.startsWith('gemma');
  }

  /**
   * Get the appropriate service for a model
   */
  private getServiceForModel(modelId: string): any {
    return this.isGoogleModel(modelId) ? enhancedGeminiService : openAIService;
  }

  /**
   * Generate email with the optimal model
   */
  async generateEmail(
    context: {
      recipient: string;
      purpose: string;
      tone?: 'formal' | 'casual' | 'friendly';
      context?: string;
    },
    taskContext: TaskContext = {}
  ): Promise<ServiceResponse> {
    // Check if any provider is available
    if (!(await this.hasAvailableProvider())) {
      return {
        content: {
          subject: `Following up: ${context.purpose}`,
          body: `Dear ${context.recipient},\n\nI hope this email finds you well.\n\n[AI generation unavailable - please configure API keys]\n\nBest regards`
        },
        model: "none",
        provider: "none",
        responseTime: 0,
        success: false,
        error: "No AI provider configured. Please check your API keys."
      };
    }
    
    const modelId = await this.getOptimalModel('email_generation', taskContext);
    const service = this.getServiceForModel(modelId);
    const startTime = Date.now();

    try {
      const email = await service.generateEmail(context, this.validateCustomerId(taskContext.customerId), modelId);
      const responseTime = Date.now() - startTime;

      // Estimate cost
      const tokensUsed = (context.purpose.length + (context.context?.length || 0) + email.subject.length + email.body.length) / 4;
      const cost = this.estimateCost(modelId, tokensUsed);

      this.updateStats(modelId, responseTime, cost, true);

      return {
        content: email,
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime,
        cost,
        tokensUsed,
        success: true
      };
    } catch (error) {
      return {
        content: {
          subject: `Following up: ${context.purpose}`,
          body: `Dear ${context.recipient},\n\nI hope this email finds you well.\n\n[AI generation currently unavailable - please try again later]\n\nBest regards`
        },
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze pipeline health with the optimal model
   */
  async analyzePipelineHealth(
    pipelineData: any,
    taskContext: TaskContext = {}
  ): Promise<ServiceResponse> {
    // Check if any provider is available
    if (!(await this.hasAvailableProvider())) {
      return {
        content: {
          healthScore: 0,
          keyInsights: ["AI analysis unavailable - please configure API keys"],
          bottlenecks: ["API keys not configured"],
          opportunities: ["Configure API keys to enable AI analysis"],
          forecastAccuracy: 0
        },
        model: "none",
        provider: "none",
        responseTime: 0,
        success: false,
        error: "No AI provider configured. Please check your API keys."
      };
    }
    
    const modelId = await this.getOptimalModel('pipeline_analysis', taskContext);
    const startTime = Date.now();

    try {
      let result;
      if (this.isGoogleModel(modelId)) {
        result = await enhancedGeminiService.generateInsights(
          pipelineData, 
          this.validateCustomerId(taskContext.customerId), 
          modelId
        );
      } else {
        result = await openAIService.analyzePipelineHealth(
          pipelineData, 
          this.validateCustomerId(taskContext.customerId), 
          modelId
        );
      }

      const responseTime = Date.now() - startTime;
      // Estimate tokens from input/output size
      const inputSize = JSON.stringify(pipelineData).length;
      const outputSize = JSON.stringify(result).length;
      const tokensUsed = Math.ceil((inputSize + outputSize) / 4);
      const cost = this.estimateCost(modelId, tokensUsed);

      this.updateStats(modelId, responseTime, cost, true);

      return {
        content: result,
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime,
        cost,
        tokensUsed,
        success: true
      };
    } catch (error) {
      return {
        content: {
          healthScore: 0,
          keyInsights: ["Unable to analyze pipeline health. Please try again later."],
          bottlenecks: ["Analysis unavailable"],
          opportunities: ["Analysis unavailable"],
          forecastAccuracy: 0
        },
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate meeting agenda with the optimal model
   */
  async generateMeetingAgenda(
    context: {
      meetingTitle: string;
      attendees: string[];
      purpose: string;
      duration: number;
      previousNotes?: string;
    },
    taskContext: TaskContext = {}
  ): Promise<ServiceResponse> {
    // Check if any provider is available
    if (!(await this.hasAvailableProvider())) {
      return {
        content: {
          title: context.meetingTitle,
          objective: context.purpose,
          agendaItems: [
            {
              topic: "Introduction",
              duration: 5,
              owner: "All",
              description: "Welcome and meeting objectives"
            },
            {
              topic: "Main Discussion",
              duration: Math.max(context.duration - 10, 10),
              owner: "All",
              description: context.purpose
            },
            {
              topic: "Next Steps",
              duration: 5,
              owner: "All",
              description: "Action items and follow-up tasks"
            }
          ],
          notes: "AI generation unavailable - please configure API keys"
        },
        model: "none",
        provider: "none",
        responseTime: 0,
        success: false,
        error: "No AI provider configured. Please check your API keys."
      };
    }
    
    const modelId = await this.getOptimalModel('meeting_agenda', taskContext);
    const startTime = Date.now();

    try {
      // Generate meeting agenda using the appropriate service
      let result;
      if (this.isGoogleModel(modelId)) {
        // Format for Gemini
        const prompt = `
          Create a meeting agenda for:
          
          Meeting Title: ${context.meetingTitle}
          Attendees: ${context.attendees.join(', ')}
          Purpose: ${context.purpose}
          Duration: ${context.duration} minutes
          Previous Notes: ${context.previousNotes || 'None'}
          
          Format your response as a JSON object with the following structure, WITHOUT ANY MARKDOWN CODE BLOCKS:
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
          }
        `;
        
        const geminiResponse = await enhancedGeminiService.generateContent({
          prompt,
          model: modelId,
          customerId: this.validateCustomerId(taskContext.customerId),
          featureUsed: 'meeting-agenda',
          systemInstruction: "You are an expert meeting facilitator. Create focused, efficient meeting agendas. Return only valid JSON without markdown formatting."
        });
        
        result = this.parseJsonSafely(geminiResponse.content);
      } else {
        result = await openAIService.generateMeetingAgenda(
          context, 
          this.validateCustomerId(taskContext.customerId), 
          modelId
        );
      }

      const responseTime = Date.now() - startTime;
      const inputSize = context.meetingTitle.length + JSON.stringify(context.attendees).length + 
        context.purpose.length + (context.previousNotes?.length || 0);
      const outputSize = JSON.stringify(result).length;
      const tokensUsed = Math.ceil((inputSize + outputSize) / 4);
      const cost = this.estimateCost(modelId, tokensUsed);

      this.updateStats(modelId, responseTime, cost, true);

      return {
        content: result,
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime,
        cost,
        tokensUsed,
        success: true
      };
    } catch (error) {
      console.error(`Error generating meeting agenda with ${modelId}:`, error);
      
      // Fallback to basic structure
      return {
        content: {
          title: context.meetingTitle,
          objective: context.purpose,
          agendaItems: [
            {
              topic: "Introduction",
              duration: 5,
              owner: context.attendees[0] || "Meeting organizer",
              description: "Welcome and meeting objectives"
            },
            {
              topic: "Main Discussion",
              duration: Math.max(context.duration - 10, 10),
              owner: "All",
              description: context.purpose
            },
            {
              topic: "Next Steps",
              duration: 5,
              owner: "All",
              description: "Action items and follow-up tasks"
            }
          ],
          notes: "Generated agenda is a fallback due to service error."
        },
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate deal insights with the optimal model
   */
  async analyzeDeal(
    dealData: any,
    taskContext: TaskContext = {}
  ): Promise<ServiceResponse> {
    // Check if any provider is available
    if (!(await this.hasAvailableProvider())) {
      return {
        content: {
          riskLevel: "unknown",
          keyInsights: ["AI analysis unavailable - please configure API keys"],
          recommendedActions: ["Configure API keys to enable AI analysis"],
          winProbability: 0,
          potentialBlockers: ["API keys not configured"]
        },
        model: "none",
        provider: "none",
        responseTime: 0,
        success: false,
        error: "No AI provider configured. Please check your API keys."
      };
    }
    
    // For complex analytical tasks like deal analysis, prefer more capable models
    const useGPT4 = dealData.deals && dealData.deals.some((deal: any) => deal.value > 100000) || 
                   taskContext.complexity === 'high';
    const defaultModelId = useGPT4 ? 'gpt-4o-mini' : 'gemini-2.5-flash';
    
    const modelId = await this.getOptimalModel('deal_insights', {
      ...taskContext,
      modelId: taskContext.modelId || defaultModelId
    });
    
    const startTime = Date.now();

    try {
      let result;
      if (this.isGoogleModel(modelId)) {
        // Format for Gemini
        const prompt = `
          Analyze this deal data and provide actionable insights:
          
          ${JSON.stringify(dealData, null, 2)}
          
          Format your response as a JSON object with the following structure, WITHOUT ANY MARKDOWN CODE BLOCKS:
          {
            "riskLevel": "low|medium|high",
            "keyInsights": ["string"],
            "recommendedActions": ["string"],
            "winProbability": number,
            "potentialBlockers": ["string"]
          }
        `;
        
        const geminiResponse = await enhancedGeminiService.generateContent({
          prompt,
          model: modelId,
          customerId: this.validateCustomerId(taskContext.customerId),
          featureUsed: 'deal-insights',
          systemInstruction: "You are a sales analytics expert specializing in deal risk assessment. Return only plain JSON without markdown code blocks."
        });
        
        result = this.parseJsonSafely(geminiResponse.content);
      } else {
        result = await openAIService.generateDealInsights(
          dealData, 
          this.validateCustomerId(taskContext.customerId), 
          modelId
        );
      }

      const responseTime = Date.now() - startTime;
      const inputSize = JSON.stringify(dealData).length;
      const outputSize = JSON.stringify(result).length;
      const tokensUsed = Math.ceil((inputSize + outputSize) / 4);
      const cost = this.estimateCost(modelId, tokensUsed);

      this.updateStats(modelId, responseTime, cost, true);

      return {
        content: result,
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime,
        cost,
        tokensUsed,
        success: true
      };
    } catch (error) {
      console.error(`Error analyzing deal with ${modelId}:`, error);
      
      return {
        content: {
          riskLevel: "unknown",
          keyInsights: ["Unable to analyze deal. Please try again later."],
          recommendedActions: ["Manual review required"],
          winProbability: 0,
          potentialBlockers: ["AI analysis service unavailable"]
        },
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate insights for contacts
   */
  async generateContactInsights(
    contacts: any[],
    taskContext: TaskContext = {}
  ): Promise<ServiceResponse> {
    // Check if any provider is available
    if (!(await this.hasAvailableProvider())) {
      return {
        content: {
          highValueContacts: [],
          needFollowUp: [],
          patterns: ["AI analysis unavailable - please configure API keys"],
          scoringRecommendations: ["Configure API keys to enable AI analysis"]
        },
        model: "none",
        provider: "none",
        responseTime: 0,
        success: false,
        error: "No AI provider configured. Please check your API keys."
      };
    }
    
    // For contact analysis, prefer models with good pattern recognition
    const modelId = await this.getOptimalModel('contact_scoring', {
      ...taskContext,
      modelId: taskContext.modelId || 'gemini-2.5-flash'
    });
    
    const startTime = Date.now();
    const prompt = `
      Analyze these contacts and provide insights:
      
      ${JSON.stringify(contacts, null, 2)}
      
      Identify:
      1. The highest value contacts
      2. Contacts that need follow-up
      3. Patterns in the data
      4. Contact scoring recommendations
      
      Format your response as a JSON object with the following structure, WITHOUT ANY MARKDOWN CODE BLOCKS:
      {
        "highValueContacts": ["string"],
        "needFollowUp": ["string"],
        "patterns": ["string"],
        "scoringRecommendations": ["string"]
      }
    `;

    try {
      let result;
      if (this.isGoogleModel(modelId)) {
        const geminiResponse = await enhancedGeminiService.generateContent({
          prompt,
          model: modelId,
          customerId: this.validateCustomerId(taskContext.customerId),
          featureUsed: 'contact-insights',
          systemInstruction: "You are a CRM analytics expert specialized in contact scoring and analysis. Return only plain JSON without markdown code blocks."
        });
        
        result = this.parseJsonSafely(geminiResponse.content);
      } else {
        const openAIResponse = await openAIService.generateContent({
          messages: [
            { role: 'system', content: "You are a CRM analytics expert specialized in contact scoring and analysis. Return only plain JSON without markdown code blocks." },
            { role: 'user', content: prompt }
          ],
          model: modelId,
          customerId: this.validateCustomerId(taskContext.customerId),
          featureUsed: 'contact-insights'
        });
        
        result = this.parseJsonSafely(openAIResponse.content);
      }

      const responseTime = Date.now() - startTime;
      const inputSize = JSON.stringify(contacts).length;
      const outputSize = JSON.stringify(result).length;
      const tokensUsed = Math.ceil((inputSize + outputSize) / 4);
      const cost = this.estimateCost(modelId, tokensUsed);

      this.updateStats(modelId, responseTime, cost, true);

      return {
        content: result,
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime,
        cost,
        tokensUsed,
        success: true
      };
    } catch (error) {
      console.error(`Error generating contact insights with ${modelId}:`, error);
      
      return {
        content: {
          highValueContacts: [],
          needFollowUp: [],
          patterns: ["Unable to analyze contacts at this time."],
          scoringRecommendations: ["Manual review recommended"]
        },
        model: modelId,
        provider: this.isGoogleModel(modelId) ? 'Google' : 'OpenAI',
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Estimate cost based on model and tokens
   */
  private estimateCost(modelId: string, tokens: number): number {
    const pricing: Record<string, number> = {
      'gemma-2-2b-it': 0.00000035, // per token
      'gemma-2-9b-it': 0.00000050, // per token
      'gemma-2-27b-it': 0.00000125, // per token
      'gemini-2.5-flash': 0.00000075, // per token
      'gemini-2.5-flash-8b': 0.00000035, // per token
      'gpt-4o-mini': 0.00015, // per token
      'gpt-3.5-turbo': 0.0000015, // per token
    };

    return tokens * (pricing[modelId] || 0.0000015);
  }

  /**
   * Get usage statistics
   */
  getUsageStatistics(): any {
    return {
      modelStats: this.usageStats,
      totalCalls: Object.values(this.usageStats).reduce((sum, stat) => sum + stat.callCount, 0),
      totalSuccesses: Object.values(this.usageStats).reduce((sum, stat) => sum + stat.successCount, 0),
      avgResponseTime: this.calculateAverageResponseTime(),
      avgCost: this.calculateAverageCost(),
    };
  }

  private calculateAverageResponseTime(): number {
    const stats = Object.values(this.usageStats);
    if (stats.length === 0) return 0;

    const totalCalls = stats.reduce((sum, stat) => sum + stat.callCount, 0);
    if (totalCalls === 0) return 0;

    return stats.reduce((sum, stat) => sum + stat.avgResponseTime * stat.callCount, 0) / totalCalls;
  }

  private calculateAverageCost(): number {
    const stats = Object.values(this.usageStats);
    if (stats.length === 0) return 0;

    const totalCalls = stats.reduce((sum, stat) => sum + stat.callCount, 0);
    if (totalCalls === 0) return 0;

    return stats.reduce((sum, stat) => sum + stat.avgCost * stat.callCount, 0) / totalCalls;
  }
}

// Create singleton instance
export const aiOrchestratorService = new AIOrchestratorService();

// Export service for use in components
export default aiOrchestratorService;