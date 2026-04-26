import { supabase } from '../lib/supabase';
import { globalEventBus } from './moduleFederationOrchestrator';

// Shared GTM Analytics Service for Monorepos
export class SharedGTMAnalyticsService {
  private static instance: SharedGTMAnalyticsService;

  static getInstance(): SharedGTMAnalyticsService {
    if (!SharedGTMAnalyticsService.instance) {
      SharedGTMAnalyticsService.instance = new SharedGTMAnalyticsService();
    }
    return SharedGTMAnalyticsService.instance;
  }

  // Request contact analytics from GTM system
  async getContactAnalytics(contactId: number): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'get_contact_analytics',
          contactId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get contact analytics: ${response.status}`);
      }

      const data = await response.json();

      // Emit event to update shared state
      globalEventBus.emit('CONTACT_ANALYTICS_RECEIVED', { contactId, data });

      return data;
    } catch (error) {
      console.error('Error getting contact analytics:', error);
      throw error;
    }
  }

  // Request deal analytics from GTM system
  async getDealAnalytics(dealId: number): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'get_deal_analytics',
          dealId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get deal analytics: ${response.status}`);
      }

      const data = await response.json();

      // Emit event to update shared state
      globalEventBus.emit('DEAL_ANALYTICS_RECEIVED', { dealId, data });

      return data;
    } catch (error) {
      console.error('Error getting deal analytics:', error);
      throw error;
    }
  }

  // Generate AI recommendations for contacts
  async generateContactRecommendations(contactData: any): Promise<any[]> {
    try {
      // Analyze contact data and generate recommendations
      const recommendations = [];

      // Example recommendation logic based on contact data
      if (contactData.score && contactData.score < 0.5) {
        recommendations.push({
          type: 'engagement',
          title: 'Improve Contact Engagement',
          description: 'Contact has low engagement score. Consider personalized follow-up.',
          priority: 'high',
          actions: ['schedule_follow_up', 'send_personalized_email']
        });
      }

      if (contactData.lastActivityAt) {
        const daysSinceActivity = Math.floor(
          (Date.now() - new Date(contactData.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceActivity > 30) {
          recommendations.push({
            type: 'reengagement',
            title: 'Re-engage Inactive Contact',
            description: `Contact hasn't been active for ${daysSinceActivity} days.`,
            priority: 'medium',
            actions: ['send_newsletter', 'schedule_check_in']
          });
        }
      }

      // Emit recommendations to shared state
      globalEventBus.emit('CONTACT_RECOMMENDATIONS_GENERATED', {
        contactId: contactData.id,
        recommendations
      });

      return recommendations;
    } catch (error) {
      console.error('Error generating contact recommendations:', error);
      return [];
    }
  }

  // Generate AI recommendations for deals
  async generateDealRecommendations(dealData: any): Promise<any[]> {
    try {
      const recommendations = [];

      // Example recommendation logic based on deal data
      if (dealData.healthScore && dealData.healthScore < 50) {
        recommendations.push({
          type: 'health',
          title: 'Improve Deal Health',
          description: 'Deal health score is low. Focus on stakeholder engagement.',
          priority: 'high',
          actions: ['schedule_stakeholder_meeting', 'gather_requirements']
        });
      }

      if (dealData.stage === 'negotiation' && dealData.value > 50000) {
        recommendations.push({
          type: 'negotiation',
          title: 'High-Value Negotiation Strategy',
          description: 'This is a high-value deal in negotiation. Consider executive involvement.',
          priority: 'high',
          actions: ['involve_executive', 'prepare_detailed_proposal']
        });
      }

      const daysInStage = dealData.daysInStage || 0;
      if (daysInStage > 60) {
        recommendations.push({
          type: 'stagnation',
          title: 'Address Deal Stagnation',
          description: `Deal has been in ${dealData.stage} stage for ${daysInStage} days.`,
          priority: 'medium',
          actions: ['schedule_progress_meeting', 'identify_blockers']
        });
      }

      // Emit recommendations to shared state
      globalEventBus.emit('DEAL_RECOMMENDATIONS_GENERATED', {
        dealId: dealData.id,
        recommendations
      });

      return recommendations;
    } catch (error) {
      console.error('Error generating deal recommendations:', error);
      return [];
    }
  }

  // Track user interactions with recommendations
  async trackRecommendationUsage(recommendationId: string, action: string, context: any): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'track_response',
          responseData: {
            promptId: recommendationId,
            responseText: `Applied recommendation: ${action}`,
            qualityScore: 0.8,
            category: context.type || 'recommendation',
            context: context
          }
        })
      });

      // Emit tracking event
      globalEventBus.emit('RECOMMENDATION_TRACKED', {
        recommendationId,
        action,
        context
      });

    } catch (error) {
      console.error('Error tracking recommendation usage:', error);
    }
  }

  // Get performance metrics for prompts
  async getPromptPerformance(timeRange: string = '30d'): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'performance',
          timeRange
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get performance data: ${response.status}`);
      }

      const data = await response.json();

      // Emit performance data to shared state
      globalEventBus.emit('PERFORMANCE_DATA_RECEIVED', data);

      return data;
    } catch (error) {
      console.error('Error getting prompt performance:', error);
      throw error;
    }
  }

  // Subscribe to analytics events
  subscribeToAnalyticsEvents(callback: (event: string, data: any) => void): () => void {
    const events = [
      'CONTACT_ANALYTICS_RECEIVED',
      'DEAL_ANALYTICS_RECEIVED',
      'CONTACT_RECOMMENDATIONS_GENERATED',
      'DEAL_RECOMMENDATIONS_GENERATED',
      'RECOMMENDATION_TRACKED',
      'PERFORMANCE_DATA_RECEIVED'
    ];

    const unsubscribers = events.map(event =>
      globalEventBus.on(event, (data: any) => callback(event, data))
    );

    // Return unsubscribe function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
}

// Export singleton instance
export const sharedGTMAnalytics = SharedGTMAnalyticsService.getInstance();