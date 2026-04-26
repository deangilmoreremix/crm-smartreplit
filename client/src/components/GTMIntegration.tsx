import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  score?: number;
  lastActivityAt?: string;
  enrichmentData?: any;
}

interface Deal {
  id: number;
  title: string;
  value: number;
  stage: string;
  healthScore?: number;
  winProbability?: number;
  lastActivityAt?: string;
}

interface GTMIntegrationProps {
  contactId?: number;
  dealId?: number;
}

const GTMIntegration: React.FC<GTMIntegrationProps> = ({ contactId, dealId }) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [recommendedPrompts, setRecommendedPrompts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contactId) {
      loadContact(contactId);
      loadContactAnalytics(contactId);
    }
    if (dealId) {
      loadDeal(dealId);
      loadDealAnalytics(dealId);
    }
  }, [contactId, dealId]);

  const loadContact = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setContact(data);
    } catch (error) {
      console.error('Error loading contact:', error);
    }
  };

  const loadDeal = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDeal(data);
    } catch (error) {
      console.error('Error loading deal:', error);
    }
  };

  const loadContactAnalytics = async (id: number) => {
    try {
      // Get contact analytics from GTM system
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'get_contact_analytics',
          contactId: id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(prev => ({ ...prev, contact: data }));
      }

      // Generate AI recommendations based on contact data
      generateContactRecommendations(id);
    } catch (error) {
      console.error('Error loading contact analytics:', error);
    }
  };

  const loadDealAnalytics = async (id: number) => {
    try {
      // Get deal analytics from GTM system
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/.netlify/functions/gtm-prompt-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'get_deal_analytics',
          dealId: id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(prev => ({ ...prev, deal: data }));
      }

      // Generate AI recommendations based on deal data
      generateDealRecommendations(id);
    } catch (error) {
      console.error('Error loading deal analytics:', error);
    }
  };

  const generateContactRecommendations = async (contactId: number) => {
    try {
      setLoading(true);
      // This would call an AI service to analyze contact data and recommend prompts
      // For now, we'll simulate some recommendations
      const recommendations = [
        {
          id: 'follow_up_email',
          title: 'Personalized Follow-up Email',
          category: 'communication',
          confidence: 0.85,
          reasoning: 'Contact has been inactive for 30 days, suggesting a follow-up email to re-engage'
        },
        {
          id: 'pain_point_probe',
          title: 'Pain Point Discovery',
          category: 'sales',
          confidence: 0.72,
          reasoning: 'Contact score indicates buying intent, focus on understanding their challenges'
        }
      ];

      setRecommendedPrompts(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDealRecommendations = async (dealId: number) => {
    try {
      setLoading(true);
      // This would call an AI service to analyze deal data and recommend prompts
      const recommendations = [
        {
          id: 'objection_handling',
          title: 'Handle Pricing Objections',
          category: 'sales',
          confidence: 0.91,
          reasoning: 'Deal is stuck in negotiation stage, likely due to pricing concerns'
        },
        {
          id: 'value_proposition',
          title: 'Reinforce Value Proposition',
          category: 'sales',
          confidence: 0.78,
          reasoning: 'Deal health score indicates need to strengthen perceived value'
        }
      ];

      setRecommendedPrompts(prev => [...prev, ...recommendations]);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendedPrompt = async (recommendation: any) => {
    try {
      // Track that this recommendation was used
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
            promptId: recommendation.id,
            responseText: `Applied ${recommendation.title} recommendation`,
            qualityScore: 0.8,
            category: recommendation.category,
            context: contactId ? 'contact' : 'deal',
            entityId: contactId || dealId
          }
        })
      });

      // Refresh analytics
      if (contactId) loadContactAnalytics(contactId);
      if (dealId) loadDealAnalytics(dealId);

    } catch (error) {
      console.error('Error applying recommendation:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          GTM AI Recommendations
        </h3>
        <p className="text-sm text-gray-600">
          {contact && `AI-powered insights for ${contact.firstName} ${contact.lastName}`}
          {deal && `AI-powered insights for deal: ${deal.title}`}
        </p>
      </div>

      {/* Analytics Summary */}
      {(contact || deal) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {contact && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Contact Score</h4>
              <p className="text-2xl font-bold text-blue-600">{contact.score || 'N/A'}</p>
              <p className="text-sm text-blue-700">Engagement level</p>
            </div>
          )}

          {deal && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900">Deal Health</h4>
              <p className="text-2xl font-bold text-green-600">{deal.healthScore || 'N/A'}</p>
              <p className="text-sm text-green-700">Overall health score</p>
            </div>
          )}

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900">AI Insights</h4>
            <p className="text-2xl font-bold text-purple-600">{recommendedPrompts.length}</p>
            <p className="text-sm text-purple-700">Recommendations available</p>
          </div>
        </div>
      )}

      {/* Recommended Prompts */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Recommended Actions</h4>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : recommendedPrompts.length > 0 ? (
          <div className="space-y-3">
            {recommendedPrompts.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">{rec.title}</h5>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 capitalize">{rec.category}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      rec.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(rec.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{rec.reasoning}</p>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => applyRecommendedPrompt(rec)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Apply Recommendation
                  </button>

                  <span className="text-xs text-gray-500">
                    Click to track usage and improve AI recommendations
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No AI recommendations available at this time.</p>
            <p className="text-sm mt-1">Recommendations will appear as more data becomes available.</p>
          </div>
        )}
      </div>

      {/* Analytics Details */}
      {analytics && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Performance Analytics</h4>

          {analytics.contact && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Contact Interaction History</h5>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p>Last activity: {analytics.contact.lastActivity || 'Never'}</p>
                <p>Interaction score: {analytics.contact.interactionScore || 'N/A'}</p>
              </div>
            </div>
          )}

          {analytics.deal && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Deal Progress Analytics</h5>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p>Stagnation risk: {analytics.deal.stagnationRisk || 'Low'}</p>
                <p>Next action recommended: {analytics.deal.nextAction || 'Follow up'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GTMIntegration;