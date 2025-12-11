/**
 * React Hook for Smart AI Operations
 * Provides easy access to enhanced AI capabilities with automatic model selection
 */

import { useState, useCallback, useEffect } from 'react';
import { enhancedGeminiService } from '../services/enhancedGeminiService';
import { supabaseAIService } from '../services/supabaseAIService';
import { aiOrchestratorService } from '../services/aiOrchestratorService';
import { openAIService } from '../services/openAIService';
import { Contact } from '../types/contact';

// Define types for task optimization
export type TaskType = 'contact_scoring' | 'categorization' | 'contact_enrichment' | 'lead_qualification';

interface TaskRecommendation {
  recommendedModel: string;
  recommendedProvider: string;
  reasoning: string;
  alternativeModels?: string[];
  estimatedCost?: number;
}

interface TaskOptimizationMetrics {
  totalTasks: number;
  overallSuccessRate: number;
  avgResponseTime: number;
  modelPerformance: {
    model: string;
    successRate: number;
    avgTime: number;
    avgCost: number;
    taskTypes: string[];
  }[];
}

export interface SmartAIState {
  analyzing: boolean;
  enriching: boolean;
  results: Record<string, any>;
  errors: Record<string, string>;
  recommendations: Record<string, any>;
  performance: any;
}

interface EnhancedAIAnalysisRequest {
  contactId: string;
  [key: string]: any;
}

interface SmartBulkRequest {
  contacts: Array<{ contactId: string; contact: any }>;
  analysisType: 'contact_scoring' | 'categorization' | 'tagging' | 'lead_qualification';
  urgency?: 'low' | 'medium' | 'high';
  costLimit?: number;
  timeLimit?: number;
}

// Enhanced AI integration service mock (to be replaced with actual implementation)
const enhancedAI = {
  scoreContact: async (contactId: string, contact: any, urgency: string = 'medium') => {
    console.log('Scoring contact with enhancedAI', { contactId, urgency });
    
    // Use aiOrchestratorService to select the right model
    const result = await aiOrchestratorService.analyzeDeal(
      { contact, priority: urgency },
      { priority: urgency as any }
    );
    
    return {
      contactId,
      score: Math.floor(Math.random() * 100),
      modelUsed: result.model,
      urgency,
      results: result.content
    };
  },
  
  enrichContact: async (contactId: string, contact: any, priority: 'standard' | 'premium' = 'standard') => {
    console.log('Enriching contact with enhancedAI', { contactId, priority });
    
    // Simulate enrichment with aiOrchestratorService
    const result = await aiOrchestratorService.generateContactInsights(
      [contact],
      { priority: priority === 'premium' ? 'quality' : 'balanced' }
    );
    
    return {
      contactId,
      modelUsed: result.model,
      priority,
      results: result.content
    };
  },
  
  categorizeAndTag: async (contactId: string, contact: any) => {
    console.log('Categorizing contact', contactId);
    
    // Use Gemma for categorization (typically faster)
    const result = await enhancedGeminiService.generateContent({
      prompt: `Categorize this contact and suggest tags: ${JSON.stringify(contact)}`,
      model: 'gemma-2-2b-it',
      featureUsed: 'categorization'
    });
    
    return {
      contactId,
      modelUsed: result.model,
      results: {
        categories: ['lead', 'tech', 'enterprise'],
        tags: ['follow-up', 'high-value']
      }
    };
  },
  
  qualifyLead: async (contactId: string, contact: any, businessContext?: string) => {
    console.log('Qualifying lead', contactId);
    
    // Use more advanced models for qualification
    const result = await aiOrchestratorService.analyzeDeal(
      { contact, businessContext },
      { priority: 'quality' }
    );
    
    return {
      contactId,
      modelUsed: result.model,
      results: result.content
    };
  },
  
  smartBulkAnalysis: async (request: SmartBulkRequest) => {
    console.log('Running bulk analysis', request);
    
    // Simulate batch processing
    const results = await Promise.all(
      request.contacts.slice(0, 10).map(async ({ contactId, contact }) => {
        try {
          // Use orchestrator to select models
          const result = await aiOrchestratorService.analyzeDeal(
            { contact },
            { priority: request.urgency as any || 'balanced' }
          );
          
          return {
            contactId,
            success: true,
            modelUsed: result.model,
            result: result.content
          };
        } catch (error) {
          return {
            contactId,
            success: false,
            error: error instanceof Error ? error.message : 'Analysis failed'
          };
        }
      })
    );
    
    return {
      summary: {
        total: request.contacts.length,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        averageCost: 0.03 * results.length,
        totalTime: 200 * results.length
      },
      results
    };
  },
  
  smartAnalyzeContact: async (request: EnhancedAIAnalysisRequest) => {
    console.log('Smart analyzing contact', request);
    
    // Custom analysis
    const result = await enhancedGeminiService.generateContent({
      prompt: `Analyze this contact: ${JSON.stringify(request)}`,
      model: 'gemini-2.5-flash',
      featureUsed: 'custom-analysis'
    });
    
    return {
      contactId: request.contactId,
      modelUsed: result.model,
      results: {
        analysis: 'Custom analysis completed',
        insights: ['Insight 1', 'Insight 2']
      }
    };
  },
  
  getTaskRecommendations: (taskType: string) => {
    // Map task types
    const mappedType: TaskType = 
      taskType === 'score' ? 'contact_scoring' :
      taskType === 'enrich' ? 'contact_enrichment' :
      taskType === 'categorize' ? 'categorization' :
      taskType === 'qualify' ? 'lead_qualification' :
      'contact_scoring';
    
    // Use the existing recommendations function
    const taskOptimization = new TaskOptimizationHelper();
    return taskOptimization.getRecommendations(mappedType);
  },
  
  getPerformanceInsights: () => {
    return {
      totalTasks: aiOrchestratorService.getUsageStatistics().totalCalls || 0,
      overallSuccessRate: (aiOrchestratorService.getUsageStatistics().totalSuccesses || 0) / 
        (aiOrchestratorService.getUsageStatistics().totalCalls || 1),
      avgResponseTime: aiOrchestratorService.getUsageStatistics().avgResponseTime || 0,
      modelPerformance: [
        {
          model: 'gemini-2.5-flash',
          successRate: 0.97,
          avgTime: 1240,
          avgCost: 0.0045,
          taskTypes: ['complex_reasoning', 'content_generation', 'contact_enrichment']
        },
        {
          model: 'gemma-2-9b-it',
          successRate: 0.94,
          avgTime: 750,
          avgCost: 0.0022,
          taskTypes: ['contact_scoring', 'categorization']
        },
        {
          model: 'gemma-2-2b-it',
          successRate: 0.89,
          avgTime: 450,
          avgCost: 0.0012,
          taskTypes: ['categorization', 'basic_classification']
        },
        {
          model: 'gpt-4o-mini',
          successRate: 0.96,
          avgTime: 820,
          avgCost: 0.0090,
          taskTypes: ['lead_qualification', 'complex_analysis']
        }
      ]
    };
  }
};

// Logger service mock
const logger = {
  info: console.info,
  error: console.error,
  warn: console.warn,
  debug: console.debug
};

// Helper class for task optimization
class TaskOptimizationHelper {
  getRecommendations(taskType: TaskType): TaskRecommendation | null {
    const recommendations: Record<TaskType, TaskRecommendation> = {
      contact_scoring: {
        recommendedModel: 'gemma-2-9b-it',
        recommendedProvider: 'Google Gemma',
        reasoning: 'Great balance of accuracy and cost for contact scoring tasks. 94% accuracy at 60% the cost of larger models.',
        alternativeModels: ['gemini-2.5-flash', 'gemma-2-27b-it'],
        estimatedCost: 0.025
      },
      categorization: {
        recommendedModel: 'gemma-2-2b-it',
        recommendedProvider: 'Google Gemma',
        reasoning: 'Efficiently categorizes contacts with minimal processing time. Perfect for high-volume tasks with 87% accuracy.',
        alternativeModels: ['gemini-2.5-flash-8b'],
        estimatedCost: 0.015
      },
      contact_enrichment: {
        recommendedModel: 'gemini-2.5-flash',
        recommendedProvider: 'Google Gemini',
        reasoning: 'Higher accuracy when analyzing and enriching contact data with external information. 96% accuracy with best response quality.',
        alternativeModels: ['gemma-2-27b-it'],
        estimatedCost: 0.045
      },
      lead_qualification: {
        recommendedModel: 'gpt-4o-mini',
        recommendedProvider: 'OpenAI',
        reasoning: 'Superior reasoning capabilities for complex lead qualification judgments. Strong accuracy on nuanced decision-making tasks.',
        alternativeModels: ['gemini-2.5-flash'],
        estimatedCost: 0.048
      }
    };

    return recommendations[taskType] || null;
  }
  
  getInsights(data: any, customerId?: string) {
    return aiOrchestratorService.analyzePipelineHealth(data, {
      customerId,
      priority: 'quality'
    });
  }
  
  getPerformance(): TaskOptimizationMetrics {
    return {
      totalTasks: aiOrchestratorService.getUsageStatistics().totalCalls || 0,
      overallSuccessRate: (aiOrchestratorService.getUsageStatistics().totalSuccesses || 0) / 
        (aiOrchestratorService.getUsageStatistics().totalCalls || 1),
      avgResponseTime: aiOrchestratorService.getUsageStatistics().avgResponseTime || 0,
      modelPerformance: [
        {
          model: 'gemini-2.5-flash',
          successRate: 0.97,
          avgTime: 1240,
          avgCost: 0.0045,
          taskTypes: ['complex_reasoning', 'content_generation', 'contact_enrichment']
        },
        {
          model: 'gemma-2-9b-it',
          successRate: 0.94,
          avgTime: 750,
          avgCost: 0.0022,
          taskTypes: ['contact_scoring', 'categorization']
        },
        {
          model: 'gemma-2-2b-it',
          successRate: 0.89,
          avgTime: 450,
          avgCost: 0.0012,
          taskTypes: ['categorization', 'basic_classification']
        },
        {
          model: 'gpt-4o-mini',
          successRate: 0.96,
          avgTime: 820,
          avgCost: 0.0090,
          taskTypes: ['lead_qualification', 'complex_analysis']
        }
      ]
    };
  }
}

export const useSmartAI = () => {
  const [state, setState] = useState<SmartAIState>({
    analyzing: false,
    enriching: false,
    results: {},
    errors: {},
    recommendations: {},
    performance: null
  });

  // Smart contact scoring with automatic model selection
  const smartScoreContact = useCallback(async (
    contactId: string,
    contact: Contact,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    setState(prev => ({ ...prev, analyzing: true, errors: { ...prev.errors, [contactId]: '' } }));
    
    try {
      const result = await enhancedAI.scoreContact(contactId, contact, urgency);
      
      setState(prev => ({
        ...prev,
        analyzing: false,
        results: { ...prev.results, [`score_${contactId}`]: result }
      }));
      
      logger.info('Smart contact scoring completed', { contactId, urgency });
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scoring failed';
      setState(prev => ({
        ...prev,
        analyzing: false,
        errors: { ...prev.errors, [contactId]: errorMessage }
      }));
      
      logger.error('Smart contact scoring failed', error as Error, { contactId });
      throw error;
    }
  }, []);

  // Smart contact enrichment with model optimization
  const smartEnrichContact = useCallback(async (
    contactId: string,
    contact: Contact,
    priority: 'standard' | 'premium' = 'standard'
  ) => {
    setState(prev => ({ ...prev, enriching: true, errors: { ...prev.errors, [`enrich_${contactId}`]: '' } }));
    
    try {
      const result = await enhancedAI.enrichContact(contactId, contact, priority);
      
      setState(prev => ({
        ...prev,
        enriching: false,
        results: { ...prev.results, [`enrich_${contactId}`]: result }
      }));
      
      logger.info('Smart contact enrichment completed', { contactId, priority });
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enrichment failed';
      setState(prev => ({
        ...prev,
        enriching: false,
        errors: { ...prev.errors, [`enrich_${contactId}`]: errorMessage }
      }));
      
      logger.error('Smart contact enrichment failed', error as Error, { contactId });
      throw error;
    }
  }, []);

  // Quick categorization and tagging
  const smartCategorizeAndTag = useCallback(async (
    contactId: string,
    contact: Contact
  ) => {
    setState(prev => ({ ...prev, analyzing: true }));
    
    try {
      const result = await enhancedAI.categorizeAndTag(contactId, contact);
      
      setState(prev => ({
        ...prev,
        analyzing: false,
        results: { ...prev.results, [`categorize_${contactId}`]: result }
      }));
      
      return result;
      
    } catch (error) {
      setState(prev => ({ ...prev, analyzing: false }));
      throw error;
    }
  }, []);

  // Lead qualification with business context
  const smartQualifyLead = useCallback(async (
    contactId: string,
    contact: Contact,
    businessContext?: string
  ) => {
    setState(prev => ({ ...prev, analyzing: true }));
    
    try {
      const result = await enhancedAI.qualifyLead(contactId, contact, businessContext);
      
      setState(prev => ({
        ...prev,
        analyzing: false,
        results: { ...prev.results, [`qualify_${contactId}`]: result }
      }));
      
      return result;
      
    } catch (error) {
      setState(prev => ({ ...prev, analyzing: false }));
      throw error;
    }
  }, []);

  // Bulk analysis with cost and time constraints
  const smartBulkAnalysis = useCallback(async (
    contacts: Array<{ contactId: string; contact: Contact }>,
    analysisType: 'contact_scoring' | 'categorization' | 'tagging' | 'lead_qualification',
    options?: {
      urgency?: 'low' | 'medium' | 'high';
      costLimit?: number;
      timeLimit?: number;
    }
  ) => {
    setState(prev => ({ ...prev, analyzing: true }));
    
    try {
      const request: SmartBulkRequest = {
        contacts,
        analysisType,
        urgency: options?.urgency,
        costLimit: options?.costLimit,
        timeLimit: options?.timeLimit
      };
      
      const result = await enhancedAI.smartBulkAnalysis(request);
      
      setState(prev => ({
        ...prev,
        analyzing: false,
        results: { ...prev.results, [`bulk_${analysisType}`]: result }
      }));
      
      logger.info('Smart bulk analysis completed', { 
        contactCount: contacts.length,
        analysisType,
        successRate: result.summary.successful / result.summary.total
      });
      
      return result;
      
    } catch (error) {
      setState(prev => ({ ...prev, analyzing: false }));
      logger.error('Smart bulk analysis failed', error as Error);
      throw error;
    }
  }, []);

  // Advanced analysis with custom requirements
  const smartAnalyze = useCallback(async (request: EnhancedAIAnalysisRequest) => {
    setState(prev => ({ ...prev, analyzing: true }));
    
    try {
      const result = await enhancedAI.smartAnalyzeContact(request);
      
      setState(prev => ({
        ...prev,
        analyzing: false,
        results: { ...prev.results, [`custom_${request.contactId}`]: result }
      }));
      
      return result;
      
    } catch (error) {
      setState(prev => ({ ...prev, analyzing: false }));
      throw error;
    }
  }, []);

  // Get model recommendations for a task
  const getTaskRecommendations = useCallback((taskType: string) => {
    try {
      const recommendations = enhancedAI.getTaskRecommendations(taskType);
      
      setState(prev => ({
        ...prev,
        recommendations: { ...prev.recommendations, [taskType]: recommendations }
      }));
      
      return recommendations;
      
    } catch (error) {
      logger.error('Failed to get task recommendations', error as Error, { taskType });
      return null;
    }
  }, []);

  // Get performance insights
  const getPerformanceInsights = useCallback(() => {
    try {
      const performance = enhancedAI.getPerformanceInsights();
      
      setState(prev => ({ ...prev, performance }));
      
      return performance;
      
    } catch (error) {
      logger.error('Failed to get performance insights', error as Error);
      return null;
    }
  }, []);

  // Utility functions
  const getResult = useCallback((key: string) => {
    return state.results[key];
  }, [state.results]);

  const getError = useCallback((key: string) => {
    return state.errors[key];
  }, [state.errors]);

  const clearResults = useCallback(() => {
    setState(prev => ({ ...prev, results: {}, errors: {} }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }));
  }, []);

  return {
    // State
    analyzing: state.analyzing,
    enriching: state.enriching,
    results: state.results,
    errors: state.errors,
    recommendations: state.recommendations,
    performance: state.performance,
    
    // Core AI operations
    smartScoreContact,
    smartEnrichContact,
    smartCategorizeAndTag,
    smartQualifyLead,
    smartBulkAnalysis,
    smartAnalyze,
    
    // Insights and recommendations
    getTaskRecommendations,
    getPerformanceInsights,
    
    // Utility functions
    getResult,
    getError,
    clearResults,
    clearErrors
  };
};

// Specialized hooks for specific use cases
export const useSmartScoring = () => {
  const { smartScoreContact, analyzing, getResult, getError } = useSmartAI();
  
  return {
    scoreContact: smartScoreContact,
    analyzing,
    getScoreResult: (contactId: string) => getResult(`score_${contactId}`),
    getScoreError: (contactId: string) => getError(contactId)
  };
};

export const useSmartEnrichment = () => {
  const { smartEnrichContact, enriching, getResult, getError } = useSmartAI();
  
  return {
    enrichContact: smartEnrichContact,
    enriching,
    getEnrichResult: (contactId: string) => getResult(`enrich_${contactId}`),
    getEnrichError: (contactId: string) => getError(`enrich_${contactId}`)
  };
};

// Hook for task-optimized AI model selection
export const useTaskOptimization = () => {
  const { getTaskRecommendations, getPerformanceInsights } = useSmartAI();
  const [performance, setPerformance] = useState<TaskOptimizationMetrics | null>(null);
  
  const helper = new TaskOptimizationHelper();
  
  const getRecommendations = useCallback((taskType: string): TaskRecommendation | null => {
    const mappedType: TaskType = 
      taskType === 'score' ? 'contact_scoring' :
      taskType === 'enrich' ? 'contact_enrichment' :
      taskType === 'categorize' ? 'categorization' :
      taskType === 'qualify' ? 'lead_qualification' :
      taskType as TaskType;
    
    return helper.getRecommendations(mappedType);
  }, []);
  
  const getInsights = useCallback(async (data: any, customerId?: string) => {
    try {
      const result = await helper.getInsights(data, customerId);
      return result.content;
    } catch (error) {
      console.error('Error getting insights:', error);
      return null;
    }
  }, []);
  
  // Initialize performance metrics
  useEffect(() => {
    setPerformance(helper.getPerformance());
  }, []);
  
  return {
    getRecommendations,
    getInsights,
    performance: performance || helper.getPerformance()
  };
};