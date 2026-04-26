import React, { useState, useEffect } from 'react';
import { sharedGTMAnalytics } from '../services/sharedGTMAnalytics';

interface ContactAnalyticsProps {
  contactId: number;
  contactData?: any;
  className?: string;
}

export const ContactAnalyticsWidget: React.FC<ContactAnalyticsProps> = ({
  contactId,
  contactData,
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
    if (contactData) {
      loadRecommendations();
    }
  }, [contactId, contactData]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await sharedGTMAnalytics.getContactAnalytics(contactId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load contact analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recs = await sharedGTMAnalytics.generateContactRecommendations(contactData);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleRecommendationClick = async (recommendation: any, action: string) => {
    await sharedGTMAnalytics.trackRecommendationUsage(
      recommendation.id || `rec_${Date.now()}`,
      action,
      { type: 'contact', contactId, recommendation: recommendation.title }
    );

    // Remove the recommendation from the list
    setRecommendations(prev => prev.filter(r => r !== recommendation));
  };

  if (loading) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Analytics Summary */}
      {analytics && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <h4 className="font-semibold text-blue-900 mb-2">Contact Insights</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Engagement:</span>
              <span className="ml-2 font-medium">{analytics.engagement || 'N/A'}</span>
            </div>
            <div>
              <span className="text-blue-700">Last Activity:</span>
              <span className="ml-2 font-medium">{analytics.lastActivity || 'Never'}</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">AI Recommendations</h4>
          {recommendations.map((rec, index) => (
            <div key={index} className="p-3 border rounded-lg bg-yellow-50">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-yellow-900">{rec.title}</h5>
                <span className={`px-2 py-1 rounded text-xs ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-yellow-800 mb-3">{rec.description}</p>
              <div className="flex space-x-2">
                {rec.actions?.map((action: string, actionIndex: number) => (
                  <button
                    key={actionIndex}
                    onClick={() => handleRecommendationClick(rec, action)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    {action.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button
          onClick={loadAnalytics}
          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          disabled={loading}
        >
          Refresh Analytics
        </button>
        <button
          onClick={() => window.open('/gtm-prompt-hub', '_blank')}
          className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          View Full Analytics
        </button>
      </div>
    </div>
  );
};

interface DealAnalyticsProps {
  dealId: number;
  dealData?: any;
  className?: string;
}

export const DealAnalyticsWidget: React.FC<DealAnalyticsProps> = ({
  dealId,
  dealData,
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
    if (dealData) {
      loadRecommendations();
    }
  }, [dealId, dealData]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await sharedGTMAnalytics.getDealAnalytics(dealId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load deal analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recs = await sharedGTMAnalytics.generateDealRecommendations(dealData);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleRecommendationClick = async (recommendation: any, action: string) => {
    await sharedGTMAnalytics.trackRecommendationUsage(
      recommendation.id || `rec_${Date.now()}`,
      action,
      { type: 'deal', dealId, recommendation: recommendation.title }
    );

    // Remove the recommendation from the list
    setRecommendations(prev => prev.filter(r => r !== recommendation));
  };

  if (loading) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Analytics Summary */}
      {analytics && (
        <div className="p-4 border rounded-lg bg-green-50">
          <h4 className="font-semibold text-green-900 mb-2">Deal Insights</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700">Win Probability:</span>
              <span className="ml-2 font-medium">{analytics.winProbability || 'N/A'}%</span>
            </div>
            <div>
              <span className="text-green-700">Next Action:</span>
              <span className="ml-2 font-medium">{analytics.nextAction || 'Follow up'}</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">AI Recommendations</h4>
          {recommendations.map((rec, index) => (
            <div key={index} className="p-3 border rounded-lg bg-orange-50">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-orange-900">{rec.title}</h5>
                <span className={`px-2 py-1 rounded text-xs ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-orange-800 mb-3">{rec.description}</p>
              <div className="flex space-x-2">
                {rec.actions?.map((action: string, actionIndex: number) => (
                  <button
                    key={actionIndex}
                    onClick={() => handleRecommendationClick(rec, action)}
                    className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                  >
                    {action.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button
          onClick={loadAnalytics}
          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          disabled={loading}
        >
          Refresh Analytics
        </button>
        <button
          onClick={() => window.open('/gtm-prompt-hub', '_blank')}
          className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          View Full Analytics
        </button>
      </div>
    </div>
  );
};