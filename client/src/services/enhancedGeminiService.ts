import { supabaseAIService, type AIModelConfig } from './supabaseAIService';
import { generateAI } from './aiGenerate';

interface GenerateContentRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  customerId?: string;
  featureUsed?: string;
}

interface GenerateContentResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  responseTime: number;
}

class EnhancedGeminiService {
  private availableModels: AIModelConfig[] = [];

  constructor() {
    this.loadAvailableModels();
  }

  /**
   * AI calls go through the server with the user's own OpenAI key; the server reports a missing key.
   */
  private isValidApiKey(): boolean {
    return true;
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
   * Load available models from Supabase or fallback
   */
  private async loadAvailableModels(): Promise<void> {
    try {
      // OpenAI models (the only provider used)
      this.availableModels = await supabaseAIService.getModelsByProvider('openai');
    } catch (error) {
      console.warn('Error loading available models, using fallback configurations:', error);
      // Fallback OpenAI models
      this.availableModels = supabaseAIService
        .getAllFallbackModels()
        .filter((model) => model.provider === 'openai');
    }
  }

  /**
   * Get available OpenAI models
   */
  async getAvailableModels(): Promise<AIModelConfig[]> {
    if (this.availableModels.length === 0) {
      await this.loadAvailableModels();
    }
    return this.availableModels;
  }

  /**
   * Generate content using Supabase-configured models
   */
  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    const startTime = Date.now();
    // Model hints from callers ("...pro...") map to the advanced tier; the server picks the OpenAI model
    const tier = request.model && /pro|sol|advanced/i.test(request.model) ? 'advanced' : 'default';

    const result = await generateAI({
      prompt: request.prompt,
      system: request.systemInstruction,
      maxTokens: request.maxTokens || 4096,
      tier,
    });

    return {
      content: this.stripMarkdownCodeBlocks(result.content),
      model: result.model,
      usage: {
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      finishReason: 'completed',
      responseTime: Date.now() - startTime,
    };
  }

  /**
   * Generate insights for CRM data
   */
  async generateInsights(data: any, customerId?: string, model?: string): Promise<any> {
    const prompt = `
    Analyze the following CRM data and provide actionable insights:
    
    ${JSON.stringify(data, null, 2)}
    
    Please provide:
    1. Key insights about the sales pipeline
    2. Recommendations for improving conversion rates
    3. Identification of high-priority opportunities
    4. Potential risks or concerns
    
    Format your response as JSON with the following structure:
    {
      "healthScore": 75,
      "keyInsights": ["Pipeline shows strong growth", "Deal velocity increasing"],
      "bottlenecks": ["3 deals stalled in negotiation stage"],
      "opportunities": ["Focus on high-value Microsoft opportunity"],
      "forecastAccuracy": 85
    }
    `;

    if (!this.isValidApiKey()) {
      return {
        healthScore: 75,
        keyInsights: ['API key not configured - unable to generate AI insights'],
        bottlenecks: ['Add your OpenAI API key in Settings'],
        opportunities: ['Set up API keys to enable AI analysis'],
        forecastAccuracy: 0,
      };
    }

    try {
      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6-luna',
        customerId,
        featureUsed: 'business_analysis',
        systemInstruction:
          'You are a CRM analytics expert. Provide concise, actionable insights in valid JSON format only. Do not wrap the JSON in markdown code blocks.',
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
      console.warn('Error generating insights:', error);
      return {
        healthScore: 0,
        keyInsights: ['Unable to generate insights at this time.'],
        bottlenecks: ['Analysis service unavailable'],
        opportunities: ['Manual review required'],
        forecastAccuracy: 0,
      };
    }
  }

  /**
   * Generate email content
   */
  async generateEmail(
    context: {
      recipient: string;
      purpose: string;
      tone?: 'formal' | 'casual' | 'friendly';
      context?: string;
    },
    customerId?: string,
    model?: string
  ): Promise<{ subject: string; body: string }> {
    if (!this.isValidApiKey()) {
      return {
        subject: `Following up: ${context.purpose}`,
        body: `Dear ${context.recipient},\n\nI hope this email finds you well.\n\n[Add your OpenAI API key in Settings to enable AI-generated content]\n\nBest regards`,
      };
    }

    const tone = context.tone || 'professional';
    const prompt = `
    Generate a ${tone} email for the following context:
    
    Recipient: ${context.recipient}
    Purpose: ${context.purpose}
    Additional Context: ${context.context || 'None'}
    
    Format as JSON:
    {
      "subject": "string",
      "body": "string"
    }
    `;

    try {
      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6-luna',
        customerId,
        featureUsed: 'email-generation',
        systemInstruction:
          'You are a professional email writing assistant. Write clear, engaging emails that drive action. Return only valid JSON without markdown formatting.',
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
      console.warn('Error generating email:', error);
      return {
        subject: `Following up: ${context.purpose}`,
        body: `Dear ${context.recipient},\n\nI hope this email finds you well.\n\n[Generated content unavailable - please try again]\n\nBest regards`,
      };
    }
  }

  /**
   * Generate business proposal
   */
  async generateProposal(
    context: {
      clientName: string;
      companyName: string;
      projectDescription: string;
      requirements?: string[];
      budget?: number;
      timeline?: string;
      deliverables?: string[];
    },
    customerId?: string,
    model?: string
  ): Promise<string> {
    try {
      if (!this.isValidApiKey()) {
        return `BUSINESS PROPOSAL

TO: ${context.clientName}
COMPANY: ${context.companyName}
PROJECT: ${context.projectDescription}

EXECUTIVE SUMMARY
This proposal outlines our recommended approach for ${context.projectDescription}.

REQUIREMENTS
${context.requirements?.map((req) => `• ${req}`).join('\n') || '• To be discussed'}

DELIVERABLES
${context.deliverables?.map((item) => `• ${item}`).join('\n') || '• Comprehensive solution'}

TIMELINE: ${context.timeline || 'To be determined'}
BUDGET: ${context.budget ? `$${context.budget.toLocaleString()}` : 'Upon consultation'}

We look forward to discussing this opportunity further.`;
      }

      const prompt = `Create a comprehensive business proposal with the following details:
Client: ${context.clientName}
Company: ${context.companyName}
Project: ${context.projectDescription}
Requirements: ${context.requirements?.join(', ') || 'To be discussed'}
Budget Range: ${context.budget ? `$${context.budget.toLocaleString()}` : 'Flexible'}
Timeline: ${context.timeline || 'To be determined'}
Deliverables: ${context.deliverables?.join(', ') || 'Comprehensive solution'}

Generate a professional proposal with sections for Executive Summary, Project Overview, Approach, Deliverables, Timeline, and Investment.`;

      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6.1-sol',
        temperature: 0.6,
        maxTokens: 2000,
        customerId,
        featureUsed: 'proposal_generation',
      });

      return this.stripMarkdownCodeBlocks(response.content);
    } catch (error) {
      console.error('Error generating proposal:', error);
      throw error;
    }
  }

  /**
   * Generate call script
   */
  async generateCallScript(
    context: {
      purpose: 'cold_call' | 'follow_up' | 'discovery' | 'closing' | 'objection_handling';
      contactName?: string;
      companyName?: string;
      industry?: string;
      painPoints?: string[];
      objectives?: string[];
    },
    customerId?: string,
    model?: string
  ): Promise<string> {
    try {
      const prompt = `Generate a professional sales call script for the following scenario:
Purpose: ${context.purpose}
Contact: ${context.contactName || 'Prospect'}
Company: ${context.companyName || 'Target Company'}
Industry: ${context.industry || 'General'}
Pain Points: ${context.painPoints?.join(', ') || 'To be discovered'}
Objectives: ${context.objectives?.join(', ') || 'Build relationship and qualify'}

Create a structured script with opening, discovery questions, value proposition, and closing.`;

      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6-luna',
        temperature: 0.7,
        maxTokens: 1500,
        customerId,
        featureUsed: 'call_script_generation',
      });

      return this.stripMarkdownCodeBlocks(response.content);
    } catch (error) {
      console.error('Error generating call script:', error);
      throw error;
    }
  }

  /**
   * Analyze competitor information
   */
  async analyzeCompetitor(
    context: {
      competitorName: string;
      industry: string;
      ourCompany: string;
      analysisType: 'strengths_weaknesses' | 'pricing' | 'market_position' | 'full_analysis';
    },
    customerId?: string,
    model?: string
  ): Promise<any> {
    try {
      const prompt = `Analyze the competitor "${context.competitorName}" in the ${context.industry} industry compared to "${context.ourCompany}".
Analysis Type: ${context.analysisType}

Provide insights on:
1. Market positioning
2. Strengths and weaknesses
3. Pricing strategy (if applicable)
4. Competitive advantages
5. Opportunities for differentiation

Format the response as structured data.`;

      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6.1-sol',
        temperature: 0.5,
        maxTokens: 2000,
        customerId,
        featureUsed: 'competitor_analysis',
      });

      return {
        competitor: context.competitorName,
        analysis: this.stripMarkdownCodeBlocks(response.content),
        timestamp: new Date().toISOString(),
        analysisType: context.analysisType,
      };
    } catch (error) {
      console.error('Error analyzing competitor:', error);
      throw error;
    }
  }

  /**
   * Analyze market trends
   */
  async analyzeMarketTrends(
    context: {
      industry: string;
      timeframe: '3months' | '6months' | '1year' | '2years';
      focusAreas?: string[];
    },
    customerId?: string,
    model?: string
  ): Promise<any> {
    try {
      const prompt = `Analyze market trends for the ${context.industry} industry over the ${context.timeframe} timeframe.
Focus Areas: ${context.focusAreas?.join(', ') || 'General market trends'}

Provide analysis on:
1. Key market trends and patterns
2. Growth opportunities
3. Emerging technologies or disruptions
4. Customer behavior changes
5. Competitive landscape shifts
6. Recommendations for strategy`;

      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6.1-sol',
        temperature: 0.6,
        maxTokens: 2000,
        customerId,
        featureUsed: 'market_analysis',
      });

      return {
        industry: context.industry,
        timeframe: context.timeframe,
        analysis: this.stripMarkdownCodeBlocks(response.content),
        timestamp: new Date().toISOString(),
        focusAreas: context.focusAreas,
      };
    } catch (error) {
      console.error('Error analyzing market trends:', error);
      throw error;
    }
  }

  /**
   * Predict customer churn risk
   */
  async predictChurnRisk(
    context: {
      customerId: string;
      engagementData: {
        lastContact: Date;
        emailOpens: number;
        websiteVisits: number;
        supportTickets: number;
        purchaseHistory: any[];
      };
      customerProfile: any;
    },
    customerId?: string,
    model?: string
  ): Promise<any> {
    try {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(context.engagementData.lastContact).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const prompt = `Analyze customer churn risk based on the following data:
Customer ID: ${context.customerId}
Days since last contact: ${daysSinceContact}
Email opens (last 30 days): ${context.engagementData.emailOpens}
Website visits (last 30 days): ${context.engagementData.websiteVisits}
Support tickets (last 30 days): ${context.engagementData.supportTickets}
Purchase history: ${JSON.stringify(context.engagementData.purchaseHistory)}
Customer profile: ${JSON.stringify(context.customerProfile)}

Provide a churn risk score (0-100) and specific recommendations to retain the customer.`;

      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6.1-sol',
        temperature: 0.3,
        maxTokens: 1000,
        customerId,
        featureUsed: 'churn_prediction',
      });

      // Extract risk score from response
      const content = this.stripMarkdownCodeBlocks(response.content);
      const riskMatch = content.match(/risk.*?(\d+)/i);
      const riskScore = riskMatch ? parseInt(riskMatch[1]) : 50;

      return {
        customerId: context.customerId,
        riskScore: Math.min(Math.max(riskScore, 0), 100),
        analysis: content,
        recommendations: content.split('recommendations:')[1] || 'Maintain regular contact',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error predicting churn risk:', error);
      throw error;
    }
  }

  /**
   * Analyze sentiment from text
   */
  async analyzeSentiment(text: string, customerId?: string, model?: string): Promise<any> {
    try {
      const prompt = `Analyze the sentiment of the following text and provide:
1. Overall sentiment (positive, negative, neutral)
2. Sentiment score (-1 to 1)
3. Key emotional indicators
4. Confidence level
5. Specific concerns or positive aspects

Text: "${text}"`;

      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6-luna',
        temperature: 0.3,
        maxTokens: 500,
        customerId,
        featureUsed: 'sentiment_analysis',
      });

      const content = this.stripMarkdownCodeBlocks(response.content);

      // Extract sentiment score
      const scoreMatch = content.match(/score.*?(-?\d*\.?\d+)/i);
      const sentimentScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

      // Extract sentiment type
      const sentimentMatch = content.match(/(positive|negative|neutral)/i);
      const sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral';

      return {
        text,
        sentiment,
        score: Math.min(Math.max(sentimentScore, -1), 1),
        analysis: content,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }

  /**
   * Generate social media post
   */
  async generateSocialMediaPost(
    context: {
      platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
      topic: string;
      tone: 'professional' | 'casual' | 'engaging' | 'promotional';
      keywords?: string[];
      callToAction?: string;
    },
    customerId?: string,
    model?: string
  ): Promise<string> {
    try {
      const prompt = `Create a ${context.tone} social media post for ${context.platform}:
Topic: ${context.topic}
Keywords: ${context.keywords?.join(', ') || 'None specified'}
Call to Action: ${context.callToAction || 'Engage with the content'}

Platform-specific requirements:
- LinkedIn: Professional, thought leadership
- Twitter: Concise, hashtags, engaging
- Facebook: Conversational, community-focused
- Instagram: Visual-first, inspiring

Generate an engaging post that drives engagement and aligns with the platform's best practices.`;

      const response = await this.generateContent({
        prompt,
        model: model || 'gpt-6-luna',
        temperature: 0.8,
        maxTokens: 300,
        customerId,
        featureUsed: 'social_media_generation',
      });

      return this.stripMarkdownCodeBlocks(response.content);
    } catch (error) {
      console.error('Error generating social media post:', error);
      throw error;
    }
  }
  async getRecommendedModel(useCase: string): Promise<AIModelConfig | null> {
    try {
      const models = await supabaseAIService.getRecommendedModels(useCase);
      return models.length > 0 ? models[0] : null;
    } catch (error) {
      console.warn('Error getting recommended model:', error);
      return null;
    }
  }
}

// Create singleton instance
export const enhancedGeminiService = new EnhancedGeminiService();

// Export the hook for React components
export const useEnhancedGemini = () => {
  return {
    generateInsights: (data: any, customerId?: string, model?: string) =>
      enhancedGeminiService.generateInsights(data, customerId, model),
    generateEmail: (context: any, customerId?: string, model?: string) =>
      enhancedGeminiService.generateEmail(context, customerId, model),
    generateProposal: (context: any, customerId?: string, model?: string) =>
      enhancedGeminiService.generateProposal(context, customerId, model),
    generateCallScript: (context: any, customerId?: string, model?: string) =>
      enhancedGeminiService.generateCallScript(context, customerId, model),
    analyzeCompetitor: (context: any, customerId?: string, model?: string) =>
      enhancedGeminiService.analyzeCompetitor(context, customerId, model),
    analyzeMarketTrends: (context: any, customerId?: string, model?: string) =>
      enhancedGeminiService.analyzeMarketTrends(context, customerId, model),
    predictChurnRisk: (context: any, customerId?: string, model?: string) =>
      enhancedGeminiService.predictChurnRisk(context, customerId, model),
    analyzeSentiment: (text: string, customerId?: string, model?: string) =>
      enhancedGeminiService.analyzeSentiment(text, customerId, model),
    generateSocialMediaPost: (context: any, customerId?: string, model?: string) =>
      enhancedGeminiService.generateSocialMediaPost(context, customerId, model),
    generateContent: (request: GenerateContentRequest) =>
      enhancedGeminiService.generateContent(request),
    getAvailableModels: () => enhancedGeminiService.getAvailableModels(),
    getRecommendedModel: (useCase: string) => enhancedGeminiService.getRecommendedModel(useCase),
  };
};

export default enhancedGeminiService;
