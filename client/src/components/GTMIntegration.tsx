import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateAI } from '../services/aiGenerate';

const RECOMMENDATION_SCHEMA = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          category: { type: 'string' },
          reasoning: { type: 'string' },
        },
        required: ['id', 'title', 'category', 'reasoning'],
        additionalProperties: false,
      },
    },
  },
  required: ['recommendations'],
  additionalProperties: false,
};

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
  const [contactRecs, setContactRecs] = useState<any[]>([]);
  const [dealRecs, setDealRecs] = useState<any[]>([]);
  const [contactRecsLoading, setContactRecsLoading] = useState(false);
  const [dealRecsLoading, setDealRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const recommendedPrompts = [...contactRecs, ...dealRecs];
  const loading = contactRecsLoading || dealRecsLoading;

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

  // Generate recommendations from the loaded record once it is available
  useEffect(() => {
    if (contact) generateRecommendations('contact', contact);
  }, [contact]);

  useEffect(() => {
    if (deal) generateRecommendations('deal', deal);
  }, [deal]);

  const loadContact = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('smartcrm_contacts')
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
        .from('smartcrm_deals')
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
    } catch (error) {
      console.error('Error loading deal analytics:', error);
    }
  };

  const generateRecommendations = async (kind: 'contact' | 'deal', record: Contact | Deal) => {
    const setRecs = kind === 'contact' ? setContactRecs : setDealRecs;
    const setBusy = kind === 'contact' ? setContactRecsLoading : setDealRecsLoading;
    try {
      setBusy(true);
      setRecsError(null);
      // enrichmentData can be large, so only send the core fields
      const { enrichmentData, ...fields } = record as any;
      const { data } = await generateAI({
        system:
          'You are a go-to-market assistant. Recommend next-step sales prompts/actions grounded only in ' +
          'the record provided. Do not invent facts about the record.',
        prompt:
          `Recommend up to 3 next-step actions for this ${kind}. For each give a short snake_case id, a ` +
          `title, a category (e.g. communication, sales, research), and reasoning that cites the ` +
          `record's own fields.\n\n${JSON.stringify(fields)}`,
        schema: RECOMMENDATION_SCHEMA,
        schemaName: `${kind}_recommendations`,
        json: true,
      });
      setRecs(data?.recommendations || []);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecs([]);
      setRecsError(error instanceof Error ? error.message : 'Failed to generate recommendations');
    } finally {
      setBusy(false);
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
        ) : recsError ? (
          <div className="text-center py-8 text-red-600">
            <p>{recsError}</p>
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
                <p>Stagnation risk: {analytics.deal.stagnationRisk || 'N/A'}</p>
                <p>Next action recommended: {analytics.deal.nextAction || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GTMIntegration;