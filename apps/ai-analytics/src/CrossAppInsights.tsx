import React from 'react'

interface CrossAppInsightsProps {
  insights?: Array<{
    app: string;
    insight: string;
    priority: 'high' | 'medium' | 'low';
  }>
}

const CrossAppInsights: React.FC<CrossAppInsightsProps> = ({ insights = [] }) => {
  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="font-semibold mb-3">Cross-App Insights</h3>
      <div className="space-y-2">
        {insights.map((i, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-medium">{i.app}:</span> {i.insight}
          </div>
        ))}
        {insights.length === 0 && (
          <p className="text-gray-500 text-sm">No insights available</p>
        )}
      </div>
    </div>
  );
};

export { CrossAppInsights };
