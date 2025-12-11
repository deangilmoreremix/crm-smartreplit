import { supabase } from '../lib/supabase';

export interface AIModelConfig {
  id: string;
  provider: 'anthropic' | 'gemini' | 'mistral' | 'openai' | 'other';
  model_name: string;
  display_name: string;
  endpoint_url?: string;
  pricing?: {
    input_per_1m_tokens: number;
    output_per_1m_tokens: number;
  };
  capabilities: string[];
  context_window: number;
  max_tokens: number;
  is_active: boolean;
  is_recommended: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AIUsageLog {
  id: string;
  customer_id?: string;
  user_id?: string;
  model_id: string;
  feature_used: string;
  tokens_used: number;
  cost: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  created_at: Date;
}

// Fallback model configurations when database is not available
const FALLBACK_MODELS: Record<string, AIModelConfig> = {
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    model_name: 'gemini-2.5-flash',
    display_name: 'Gemini 2.5 Flash',
    pricing: {
      input_per_1m_tokens: 0.075,
      output_per_1m_tokens: 0.3
    },
    capabilities: ['text-generation', 'reasoning', 'code-generation'],
    context_window: 1000000,
    max_tokens: 8192,
    is_active: true,
    is_recommended: true,
    description: 'Fast and efficient model for most tasks',
    created_at: new Date(),
    updated_at: new Date()
  },
  'gemini-2.5-flash-8b': {
    id: 'gemini-2.5-flash-8b',
    provider: 'gemini',
    model_name: 'gemini-2.5-flash-8b',
    display_name: 'Gemini 2.5 Flash 8B',
    pricing: {
      input_per_1m_tokens: 0.0375,
      output_per_1m_tokens: 0.15
    },
    capabilities: ['text-generation', 'reasoning'],
    context_window: 1000000,
    max_tokens: 8192,
    is_active: true,
    is_recommended: false,
    description: 'Smaller, faster model for simple tasks',
    created_at: new Date(),
    updated_at: new Date()
  },
  'gemma-2-2b-it': {
    id: 'gemma-2-2b-it',
    provider: 'gemini',
    model_name: 'gemma-2-2b-it',
    display_name: 'Gemma 2 2B Instruct',
    pricing: {
      input_per_1m_tokens: 0.035,
      output_per_1m_tokens: 0.105
    },
    capabilities: ['text-generation', 'instruction-following'],
    context_window: 8192,
    max_tokens: 4096,
    is_active: true,
    is_recommended: false,
    description: 'Lightweight model for basic tasks',
    created_at: new Date(),
    updated_at: new Date()
  },
  'gemma-2-9b-it': {
    id: 'gemma-2-9b-it',
    provider: 'gemini',
    model_name: 'gemma-2-9b-it',
    display_name: 'Gemma 2 9B Instruct',
    pricing: {
      input_per_1m_tokens: 0.05,
      output_per_1m_tokens: 0.15
    },
    capabilities: ['text-generation', 'instruction-following', 'reasoning'],
    context_window: 8192,
    max_tokens: 4096,
    is_active: true,
    is_recommended: true,
    description: 'Mid-size model with good performance',
    created_at: new Date(),
    updated_at: new Date()
  },
  'gemma-2-27b-it': {
    id: 'gemma-2-27b-it',
    provider: 'gemini',
    model_name: 'gemma-2-27b-it',
    display_name: 'Gemma 2 27B Instruct',
    pricing: {
      input_per_1m_tokens: 0.125,
      output_per_1m_tokens: 0.375
    },
    capabilities: ['text-generation', 'instruction-following', 'reasoning', 'complex-tasks'],
    context_window: 8192,
    max_tokens: 4096,
    is_active: true,
    is_recommended: false,
    description: 'Large model for complex tasks',
    created_at: new Date(),
    updated_at: new Date()
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    model_name: 'gpt-4o-mini',
    display_name: 'GPT-4o Mini',
    pricing: {
      input_per_1m_tokens: 0.15,
      output_per_1m_tokens: 0.6
    },
    capabilities: ['text-generation', 'reasoning', 'function-calling', 'code-generation'],
    context_window: 128000,
    max_tokens: 16384,
    is_active: true,
    is_recommended: true,
    description: 'Cost-effective GPT-4 level model',
    created_at: new Date(),
    updated_at: new Date()
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    model_name: 'gpt-3.5-turbo',
    display_name: 'GPT-3.5 Turbo',
    pricing: {
      input_per_1m_tokens: 0.5,
      output_per_1m_tokens: 1.5
    },
    capabilities: ['text-generation', 'function-calling'],
    context_window: 16385,
    max_tokens: 4096,
    is_active: true,
    is_recommended: false,
    description: 'Fast and affordable model',
    created_at: new Date(),
    updated_at: new Date()
  }
};

class SupabaseAIService {
  private supabaseAvailable: boolean = false;
  private connectionChecked: boolean = false;

  constructor() {
    // Don't await this, let it run in background
    this.checkSupabaseConnection();
  }

  /**
   * Check if Supabase is properly configured and available
   */
  private async checkSupabaseConnection(): Promise<void> {
    try {
      // Check if environment variables are set to actual values (not placeholders)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('your_supabase_project_url') ||
          supabaseKey.includes('your_supabase_anon_key') ||
          supabaseUrl === 'your-project-ref.supabase.co' ||
          supabaseUrl.includes('placeholder') ||
          supabaseUrl.length < 10 ||
          supabaseKey.length < 10) {
        console.warn('Supabase not configured properly. Using fallback AI model configurations.');
        this.supabaseAvailable = false;
        this.connectionChecked = true;
        return;
      }

      // Skip testing connection if URL is invalid
      if (!supabaseUrl.startsWith('http')) {
        console.warn('Supabase connection failed. Using fallback configurations:', error);
        this.supabaseAvailable = false;
      } else {
        // Test connection with a simple query
        try {
          const { error } = await supabase.from('ai_models').select('id').limit(1);
          if (error) {
            console.warn('Supabase connection failed. Using fallback configurations:', error);
            this.supabaseAvailable = false;
          } else {
            this.supabaseAvailable = true;
            console.info('Supabase AI service connected successfully');
          }
        } catch (innerError) {
          console.warn('Supabase connection check failed. Using fallback configurations:', innerError);
          this.supabaseAvailable = false;
        }
      }
    } catch (error) {
      console.warn('Supabase connection check failed. Using fallback configurations:', error);
      this.supabaseAvailable = false;
    }
    
    this.connectionChecked = true;
  }

  /**
   * Wait for connection check to complete
   */
  private async ensureConnectionChecked(): Promise<void> {
    let attempts = 0;
    while (!this.connectionChecked && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  /**
   * Validate customer ID for UUID compatibility
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
   * Get all available AI models from the database or fallback
   */
  async getAvailableModels(): Promise<AIModelConfig[]> {
    await this.ensureConnectionChecked();
    
    if (!this.supabaseAvailable) {
      return Object.values(FALLBACK_MODELS).filter(model => model.is_active);
    }

    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('is_recommended', { ascending: false })
        .order('display_name');

      if (error) {
        console.warn('Database query failed, using fallback models:', error);
        return Object.values(FALLBACK_MODELS).filter(model => model.is_active);
      }

      if (!data || data.length === 0) {
        console.warn('No models found in database, using fallback models');
        return Object.values(FALLBACK_MODELS).filter(model => model.is_active);
      }

      return (data || []).map(model => ({
        ...model,
        created_at: new Date(model.created_at),
        updated_at: new Date(model.updated_at)
      }));
    } catch (error) {
      console.warn('Error fetching AI models from database, using fallback:', error);
      return Object.values(FALLBACK_MODELS).filter(model => model.is_active);
    }
  }

  /**
   * Get models by provider
   */
  async getModelsByProvider(provider: string): Promise<AIModelConfig[]> {
    await this.ensureConnectionChecked();
    
    if (!this.supabaseAvailable) {
      return Object.values(FALLBACK_MODELS).filter(model => 
        model.is_active && model.provider === provider
      );
    }

    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('provider', provider)
        .eq('is_active', true)
        .order('display_name');

      if (error || !data || data.length === 0) {
        console.warn(`Database query failed for provider ${provider}, using fallback models:`, error);
        return Object.values(FALLBACK_MODELS).filter(model => 
          model.is_active && model.provider === provider
        );
      }

      return (data || []).map(model => ({
        ...model,
        created_at: new Date(model.created_at),
        updated_at: new Date(model.updated_at)
      }));
    } catch (error) {
      console.warn('Error fetching models by provider from database, using fallback:', error);
      return Object.values(FALLBACK_MODELS).filter(model => 
        model.is_active && model.provider === provider
      );
    }
  }

  /**
   * Get a specific model by ID with robust fallback
   */
  async getModelById(modelId: string): Promise<AIModelConfig | null> {
    // Always check fallback first for immediate response
    if (FALLBACK_MODELS[modelId]) {
      console.debug(`Using fallback configuration for model ${modelId}`);
      return FALLBACK_MODELS[modelId];
    }

    await this.ensureConnectionChecked();

    if (!this.supabaseAvailable) {
      console.warn(`Model ${modelId} not found in fallback configurations`);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', modelId)
        .single();

      if (error || !data) {
        console.warn(`Model ${modelId} not found in database, fallback not available`);
        return null;
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      console.warn('Error fetching model by ID from database:', error);
      return null;
    }
  }

  /**
   * Get recommended models for a specific use case
   */
  async getRecommendedModels(useCase?: string): Promise<AIModelConfig[]> {
    await this.ensureConnectionChecked();
    
    if (!this.supabaseAvailable) {
      const recommended = Object.values(FALLBACK_MODELS).filter(model => 
        model.is_active && model.is_recommended
      );
      
      if (useCase) {
        return recommended.filter(model => 
          model.capabilities.includes(useCase)
        );
      }
      
      return recommended;
    }

    try {
      let query = supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .eq('is_recommended', true);

      // If use case is specified, filter by capabilities
      if (useCase) {
        query = query.contains('capabilities', [useCase]);
      }

      const { data, error } = await query.order('display_name');

      if (error || !data || data.length === 0) {
        console.warn('Database query failed for recommended models, using fallback:', error);
        const recommended = Object.values(FALLBACK_MODELS).filter(model => 
          model.is_active && model.is_recommended
        );
        
        if (useCase) {
          return recommended.filter(model => 
            model.capabilities.includes(useCase)
          );
        }
        
        return recommended;
      }

      return (data || []).map(model => ({
        ...model,
        created_at: new Date(model.created_at),
        updated_at: new Date(model.updated_at)
      }));
    } catch (error) {
      console.warn('Error fetching recommended models from database, using fallback:', error);
      const recommended = Object.values(FALLBACK_MODELS).filter(model => 
        model.is_active && model.is_recommended
      );
      
      if (useCase) {
        return recommended.filter(model => 
          model.capabilities.includes(useCase)
        );
      }
      
      return recommended;
    }
  }

  /**
   * Log AI usage for analytics (gracefully handle failures)
   */
  async logUsage(usage: Omit<AIUsageLog, 'id' | 'created_at'>): Promise<void> {
    await this.ensureConnectionChecked();
    
    if (!this.supabaseAvailable) {
      console.debug('Supabase not available, skipping usage logging');
      return;
    }

    // Validate customer ID before attempting to insert
    const validCustomerId = this.validateCustomerId(usage.customer_id);
    
    const cleanedUsage = {
      ...usage,
      customer_id: validCustomerId // This will be undefined if invalid, which Supabase treats as NULL
    };

    try {
      const { error } = await supabase
        .from('ai_usage_logs')
        .insert([cleanedUsage]);

      if (error) {
        console.warn('Failed to log AI usage to database (non-critical):', error);
      }
    } catch (error) {
      console.warn('Error logging AI usage (non-critical):', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Get usage statistics for a customer
   */
  async getUsageStats(customerId?: string, timeframe: 'day' | 'week' | 'month' = 'month') {
    await this.ensureConnectionChecked();
    
    if (!this.supabaseAvailable) {
      console.warn('Supabase not available, returning empty usage stats');
      return [];
    }

    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      let query = supabase
        .from('ai_usage_logs')
        .select(`
          model_id,
          tokens_used,
          cost,
          response_time_ms,
          feature_used,
          success,
          ai_models!inner(display_name, provider)
        `)
        .gte('created_at', startDate.toISOString());

      // Only filter by customer ID if it's valid
      const validCustomerId = this.validateCustomerId(customerId);
      if (validCustomerId) {
        query = query.eq('customer_id', validCustomerId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching usage stats:', error);
        return [];
      }

      // Process the data for statistics
      const stats = (data || []).reduce((acc, log) => {
        const modelId = log.model_id;
        
        if (!acc[modelId]) {
          acc[modelId] = {
            modelId,
            modelName: log.ai_models.display_name,
            provider: log.ai_models.provider,
            requests: 0,
            tokensUsed: 0,
            totalCost: 0,
            avgResponseTime: 0,
            successRate: 0,
            features: new Set()
          };
        }

        acc[modelId].requests++;
        acc[modelId].tokensUsed += log.tokens_used || 0;
        acc[modelId].totalCost += log.cost || 0;
        acc[modelId].avgResponseTime += log.response_time_ms || 0;
        acc[modelId].features.add(log.feature_used);
        
        if (log.success) {
          acc[modelId].successRate++;
        }

        return acc;
      }, {} as Record<string, any>);

      // Calculate averages and convert Sets to arrays
      Object.values(stats).forEach((stat: any) => {
        stat.avgResponseTime = stat.avgResponseTime / stat.requests / 1000; // Convert to seconds
        stat.successRate = (stat.successRate / stat.requests) * 100;
        stat.features = Array.from(stat.features);
      });

      return Object.values(stats);
    } catch (error) {
      console.warn('Error fetching usage stats:', error);
      return [];
    }
  }

  /**
   * Get AI model configuration for agent metadata
   */
  async getAgentModels(): Promise<AIModelConfig[]> {
    await this.ensureConnectionChecked();
    
    if (!this.supabaseAvailable) {
      return Object.values(FALLBACK_MODELS).filter(model => 
        model.is_active && 
        (model.capabilities.includes('reasoning') || 
         model.capabilities.includes('function-calling') || 
         model.capabilities.includes('text-generation'))
      );
    }

    try {
      // Get models that are suitable for agent tasks (reasoning, function calling, etc.)
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .overlaps('capabilities', ['reasoning', 'function-calling', 'text-generation'])
        .order('is_recommended', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn('Database query failed for agent models, using fallback:', error);
        return Object.values(FALLBACK_MODELS).filter(model => 
          model.is_active && 
          (model.capabilities.includes('reasoning') || 
           model.capabilities.includes('function-calling') || 
           model.capabilities.includes('text-generation'))
        );
      }

      return (data || []).map(model => ({
        ...model,
        created_at: new Date(model.created_at),
        updated_at: new Date(model.updated_at)
      }));
    } catch (error) {
      console.warn('Error fetching agent models from database, using fallback:', error);
      return Object.values(FALLBACK_MODELS).filter(model => 
        model.is_active && 
        (model.capabilities.includes('reasoning') || 
         model.capabilities.includes('function-calling') || 
         model.capabilities.includes('text-generation'))
      );
    }
  }

  /**
   * Update agent metadata with selected model
   */
  async updateAgentModel(agentId: string, modelId: string): Promise<void> {
    await this.ensureConnectionChecked();
    
    if (!this.supabaseAvailable) {
      console.warn('Supabase not available, cannot update agent model');
      return;
    }

    try {
      const { error } = await supabase
        .from('agent_metadata')
        .update({
          llm: modelId,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId);

      if (error) {
        console.warn('Error updating agent model:', error);
      }
    } catch (error) {
      console.warn('Error updating agent model:', error);
    }
  }

  /**
   * Check if Supabase is available
   */
  async isSupabaseAvailable(): Promise<boolean> {
    await this.ensureConnectionChecked();
    return this.supabaseAvailable;
  }

  /**
   * Get fallback model configuration
   */
  getFallbackModel(modelId: string): AIModelConfig | null {
    return FALLBACK_MODELS[modelId] || null;
  }

  /**
   * Get all fallback models
   */
  getAllFallbackModels(): AIModelConfig[] {
    return Object.values(FALLBACK_MODELS);
  }
}

// Create singleton instance
export const supabaseAIService = new SupabaseAIService();
export default supabaseAIService;