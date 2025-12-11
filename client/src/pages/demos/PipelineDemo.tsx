import React, { useState, useEffect } from 'react';
import { 
  Target, 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Plus,
  Filter,
  MoreHorizontal,
  Clock,
  Phone,
  Mail
} from 'lucide-react';

const PipelineDemo: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [animateDeals, setAnimateDeals] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateDeals(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const pipelineStages = [
    { id: 'prospecting', name: 'Prospecting', color: 'bg-blue-500' },
    { id: 'qualification', name: 'Qualification', color: 'bg-yellow-500' },
    { id: 'proposal', name: 'Proposal', color: 'bg-orange-500' },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-purple-500' },
    { id: 'closed-won', name: 'Closed Won', color: 'bg-green-500' },
    { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-500' }
  ];

  const demoDeals = [
    {
      id: 1,
      name: 'Acme Corp Enterprise Deal',
      company: 'Acme Corporation',
      contact: 'Sarah Johnson',
      value: 15000,
      stage: 'negotiation',
      probability: 85,
      closeDate: '2024-02-15',
      daysInStage: 5,
      nextAction: 'Contract review meeting',
      notes: 'Very positive signals. Discussing final terms.',
      avatar: 'AC'
    },
    {
      id: 2,
      name: 'TechStart Basic Package',
      company: 'TechStart Inc',
      contact: 'Michael Chen',
      value: 8500,
      stage: 'proposal',
      probability: 65,
      closeDate: '2024-02-20',
      daysInStage: 3,
      nextAction: 'Demo advanced features',
      notes: 'Interested in basic plan. Show ROI calculations.',
      avatar: 'TS'
    },
    {
      id: 3,
      name: 'Global Solutions Expansion',
      company: 'Global Solutions Ltd',
      contact: 'Emily Rodriguez',
      value: 12000,
      stage: 'qualification',
      probability: 45,
      closeDate: '2024-03-01',
      daysInStage: 12,
      nextAction: 'Budget confirmation call',
      notes: 'Waiting for Q1 budget approval.',
      avatar: 'GS'
    },
    {
      id: 4,
      name: 'InnovateTech Premium',
      company: 'InnovateTech',
      contact: 'David Park',
      value: 22000,
      stage: 'negotiation',
      probability: 90,
      closeDate: '2024-02-10',
      daysInStage: 2,
      nextAction: 'Final proposal review',
      notes: 'Ready to close. Final approval pending.',
      avatar: 'IT'
    },
    {
      id: 5,
      name: 'SmartBiz Standard',
      company: 'SmartBiz Solutions',
      contact: 'Lisa Thompson',
      value: 6800,
      stage: 'proposal',
      probability: 55,
      closeDate: '2024-02-25',
      daysInStage: 7,
      nextAction: 'Competitive analysis presentation',
      notes: 'Comparing with competitors. Emphasize unique features.',
      avatar: 'SB'
    },
    {
      id: 6,
      name: 'Future Corp Discovery',
      company: 'Future Corp',
      contact: 'Alex Johnson',
      value: 18500,
      stage: 'prospecting',
      probability: 25,
      closeDate: '2024-03-15',
      daysInStage: 1,
      nextAction: 'Initial discovery call',
      notes: 'New lead from website. High potential.',
      avatar: 'FC'
    }
  ];

  const getStageDeals = (stageId: string) => {
    return demoDeals.filter(deal => deal.stage === stageId);
  };

  const getStageValue = (stageId: string) => {
    return getStageDeals(stageId).reduce((sum, deal) => sum + deal.value, 0);
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600 bg-green-100';
    if (probability >= 60) return 'text-yellow-600 bg-yellow-100';
    if (probability >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const DealCard = ({ deal, index }: { deal: any; index: number }) => (
    <div
      className={`bg-white rounded-lg shadow-md p-4 mb-3 transition-all duration-500 hover:shadow-lg cursor-pointer border-l-4 border-blue-400 ${
        animateDeals ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {deal.avatar}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{deal.name}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Building className="w-3 h-3" />
              <span>{deal.company}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>{deal.contact}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-green-600 text-sm">${deal.value.toLocaleString()}</div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProbabilityColor(deal.probability)}`}>
            {deal.probability}%
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>Close: {new Date(deal.closeDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{deal.daysInStage} days in stage</span>
        </div>
        <div className="bg-gray-50 p-2 rounded text-gray-700">
          <strong>Next:</strong> {deal.nextAction}
        </div>
      </div>
      
      <div className="flex space-x-2 mt-3">
        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center">
          <Mail className="w-3 h-3 mr-1" />
          Email
        </button>
        <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-xs hover:bg-green-700 transition-colors flex items-center justify-center">
          <Phone className="w-3 h-3 mr-1" />
          Call
        </button>
      </div>
    </div>
  );

  const totalPipelineValue = demoDeals.reduce((sum, deal) => sum + deal.value, 0);
  const avgDealSize = totalPipelineValue / demoDeals.length;
  const totalDeals = demoDeals.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Demo Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline Demo</h1>
            <p className="text-gray-600 mt-2">Visual deal tracking with AI-powered insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Live Pipeline
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">${totalPipelineValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Deals</p>
              <p className="text-2xl font-bold text-blue-600">{totalDeals}</p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Deal Size</p>
              <p className="text-2xl font-bold text-purple-600">${Math.round(avgDealSize).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Close Rate</p>
              <p className="text-2xl font-bold text-orange-600">73%</p>
            </div>
            <Target className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Pipeline Kanban Board */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Pipeline Stages</h3>
          <div className="flex space-x-2">
            <button className="text-gray-500 hover:text-gray-700">
              <Filter className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {pipelineStages.map((stage) => {
            const stageDeals = getStageDeals(stage.id);
            const stageValue = getStageValue(stage.id);
            
            return (
              <div key={stage.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <h4 className="font-semibold text-gray-900 text-sm">{stage.name}</h4>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="text-lg font-bold text-green-600">${stageValue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{stageDeals.length} deals</div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stageDeals.map((deal, index) => (
                    <DealCard key={deal.id} deal={deal} index={index} />
                  ))}
                </div>

                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No deals in this stage</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Pipeline Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Deal moved to Negotiation</p>
              <p className="text-sm text-gray-600">Acme Corp Enterprise Deal - $15,000</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">New deal created</p>
              <p className="text-sm text-gray-600">Future Corp Discovery - $18,500</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Follow-up scheduled</p>
              <p className="text-sm text-gray-600">TechStart Basic Package - Demo meeting</p>
              <p className="text-xs text-gray-500">2 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ready to Close More Deals?</h3>
            <p className="opacity-90">Visualize your sales process and track every opportunity with our intelligent pipeline management</p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center">
              Start Free Trial
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Book Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineDemo;