// Exposed Pipeline Component for Module Federation
// File: src/PipelineApp.tsx (for pipeline app)

import React, { useEffect, useState } from 'react';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contactId?: string;
  contactName?: string;
  company?: string;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PipelineAppProps {
  onDealSelect?: (deal: Deal) => void;
  onDealCreate?: (deal: Deal) => void;
  onDealUpdate?: (deal: Deal) => void;
  onDealDelete?: (dealId: string) => void;
  initialDeals?: Deal[];
}

const PipelineApp: React.FC<PipelineAppProps> = ({
  onDealSelect,
  onDealCreate,
  onDealUpdate,
  onDealDelete,
  initialDeals = []
}) => {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [stages] = useState(['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']);

  // Listen for messages from parent CRM
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CRM_DEALS_SYNC') {
        setDeals(event.data.deals || []);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that pipeline module is ready
    window.parent.postMessage({
      type: 'PIPELINE_MODULE_READY',
      source: 'REMOTE_PIPELINE'
    }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDealAction = (action: string, deal: Deal) => {
    // Notify parent CRM of deal actions
    window.parent.postMessage({
      type: `DEAL_${action.toUpperCase()}`,
      data: deal,
      source: 'REMOTE_PIPELINE'
    }, '*');

    // Execute local callbacks
    switch (action) {
      case 'select':
        onDealSelect?.(deal);
        break;
      case 'create':
        onDealCreate?.(deal);
        break;
      case 'update':
        onDealUpdate?.(deal);
        break;
      case 'delete':
        onDealDelete?.(deal.id);
        break;
    }
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      'Lead': 'bg-gray-100 text-gray-800',
      'Qualified': 'bg-blue-100 text-blue-800',
      'Proposal': 'bg-yellow-100 text-yellow-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Closed Won': 'bg-green-100 text-green-800',
      'Closed Lost': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage] = deals.filter(deal => deal.stage === stage);
    return acc;
  }, {} as { [key: string]: Deal[] });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Sales Pipeline</h1>
        
        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stages.map((stage) => (
            <div key={stage} className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-sm mb-3 text-center">
                {stage}
                <span className="ml-2 text-xs text-gray-500">
                  ({dealsByStage[stage]?.length || 0})
                </span>
              </h3>
              
              <div className="space-y-2 min-h-[200px]">
                {dealsByStage[stage]?.map((deal) => (
                  <div
                    key={deal.id}
                    className="border rounded p-3 hover:shadow-md transition-shadow cursor-pointer bg-white"
                    onClick={() => handleDealAction('select', deal)}
                  >
                    <h4 className="font-medium text-sm mb-1">{deal.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      ${deal.value.toLocaleString()}
                    </p>
                    {deal.company && (
                      <p className="text-xs text-gray-500">{deal.company}</p>
                    )}
                    {deal.probability && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full"
                            style={{ width: `${deal.probability}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{deal.probability}%</p>
                      </div>
                    )}
                    
                    <div className="mt-2 flex justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDealAction('update', deal);
                        }}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDealAction('delete', deal);
                        }}
                        className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No deals in pipeline</p>
            <button
              onClick={() => handleDealAction('create', {
                id: Date.now().toString(),
                title: 'New Deal',
                value: 10000,
                stage: 'Lead'
              })}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add First Deal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineApp;