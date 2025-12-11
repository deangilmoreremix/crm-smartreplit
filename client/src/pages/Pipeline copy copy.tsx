import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDealStore } from '../store/dealStore';
import { useGemini } from '../services/geminiService';
import { 
  BarChart3, 
  Briefcase, 
  ChevronRight, 
  Plus, 
  RefreshCw, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  Brain, 
  X,
  Move,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Deal } from '../types';
import AIEnhancedDealCard from '../components/deals/AIEnhancedDealCard';
import DealDetail from '../components/DealDetail';

// Import KanbanBoard and PipelineStats components if available
// For the example here, we'll assume they exist
import PipelineStats from '../components/PipelineStats';

const Pipeline: React.FC = () => {
  const { 
    deals, 
    columns, 
    columnOrder, 
    stageValues,
    fetchDeals, 
    isLoading, 
    error, 
    selectDeal, 
    selectedDeal,
    aiInsight,
    isAnalyzing,
    generateAiInsight,
    moveDealToStage
  } = useDealStore();
  
  const gemini = useGemini();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterValue, setFilterValue] = useState<[number, number] | null>(null);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [newDealData, setNewDealData] = useState<Partial<Deal>>({
    title: '',
    value: 0,
    stage: 'qualification',
    company: '',
    contact: '',
    probability: 10,
    priority: 'medium',
  });
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDealDetail, setShowDealDetail] = useState(false);
  
  // Load deals data
  useEffect(() => {
    fetchDeals();
  }, []);
  
  // Filter and sort deals
  const filteredDeals = Object.values(deals).filter(deal => {
    // Search filter
    if (searchTerm && 
        !deal.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !deal.company.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && deal.stage !== filterStatus) {
      return false;
    }
    
    // Priority filter
    if (filterPriority !== 'all' && deal.priority !== filterPriority) {
      return false;
    }
    
    // Value filter
    if (filterValue && (deal.value < filterValue[0] || deal.value > filterValue[1])) {
      return false;
    }
    
    return true;
  });
  
  // Sort deals for list view
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate || !b.dueDate) return 0;
      return sortOrder === 'asc' ? 
        a.dueDate.getTime() - b.dueDate.getTime() : 
        b.dueDate.getTime() - a.dueDate.getTime();
    }
    
    if (sortBy === 'value') {
      return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
    }
    
    if (sortBy === 'probability') {
      return sortOrder === 'asc' ? 
        (a.probability || 0) - (b.probability || 0) : 
        (b.probability || 0) - (a.probability || 0);
    }
    
    // Default to title
    return sortOrder === 'asc' ? 
      a.title.localeCompare(b.title) : 
      b.title.localeCompare(a.title);
  });
  
  // Create a function to handle deal click
  const handleDealClick = (dealId: string) => {
    selectDeal(dealId);
    setShowDealDetail(true);
  };
  
  // Handle closing the deal detail modal
  const handleCloseDealDetail = () => {
    setShowDealDetail(false);
  };
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Move deal between stages in the kanban view
  const handleMoveDeal = (dealId: string, sourceStage: string, destinationStage: string) => {
    if (sourceStage === destinationStage) return;
    
    // Calculate the destination index (usually at the end)
    const destinationIndex = columns[destinationStage].dealIds.length;
    
    // Move the deal in the store
    moveDealToStage(dealId, sourceStage, destinationStage, destinationIndex);
  };
  
  // Handle form submission for creating a new deal
  const handleAddDeal = () => {
    // In a real app, this would call an API
    // Also would need more validation
    setShowAddDealModal(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-600 mt-1">Manage your sales pipeline with AI-powered insights</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="inline-flex shadow-sm rounded-md">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                viewMode === 'kanban' ? 
                  'bg-blue-600 text-white' : 
                  'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                viewMode === 'list' ? 
                  'bg-blue-600 text-white' : 
                  'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              List
            </button>
          </div>
          <button 
            onClick={() => setShowAddDealModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1.5" />
            Add Deal
          </button>
        </div>
      </header>
      
      {/* Pipeline Stats Overview */}
      <PipelineStats />
      
      {/* Filtering and search tools */}
      <div className="bg-white rounded-lg shadow-sm p-4 my-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search deals by title, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md p-2 text-sm"
            >
              <option value="all">All Stages</option>
              <option value="qualification">Qualification</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed-won">Closed Won</option>
              <option value="closed-lost">Closed Lost</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border rounded-md p-2 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Filter size={16} className="mr-1.5" />
              More Filters
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw size={24} className="text-blue-500 animate-spin" />
            <span className="text-gray-600">Loading deals...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" aria-hidden="true" />
            <span>Error loading deals: {error}</span>
          </div>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' ? 
              'Try adjusting your search or filters' : 
              'Get started by adding your first deal'}
          </p>
          <button 
            onClick={() => setShowAddDealModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={18} className="mr-1.5" />
            Add Your First Deal
          </button>
        </div>
      ) : (
        viewMode === 'kanban' ? (
          // Kanban Board View
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-flow-col auto-cols-min gap-4 min-w-max">
              {columnOrder.map(columnId => {
                const column = columns[columnId];
                const columnDeals = column.dealIds
                  .map(dealId => deals[dealId])
                  .filter(deal => {
                    // Apply filters here for consistency
                    if (searchTerm && 
                        !deal.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                        !deal.company.toLowerCase().includes(searchTerm.toLowerCase())) {
                      return false;
                    }
                    
                    if (filterPriority !== 'all' && deal.priority !== filterPriority) {
                      return false;
                    }
                    
                    if (filterValue && (deal.value < filterValue[0] || deal.value > filterValue[1])) {
                      return false;
                    }
                    
                    return true;
                  });
                
                return (
                  <div key={column.id} className="w-80 flex flex-col">
                    {/* Column header */}
                    <div className="rounded-t-lg p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-gray-900">{column.title}</h3>
                        <span className="text-sm bg-white px-2 py-1 rounded-full text-gray-700 shadow-sm border border-gray-200">
                          {columnDeals.length}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(stageValues[columnId] || 0)}
                      </div>
                    </div>
                    
                    {/* Column content */}
                    <div 
                      className="flex-1 min-h-[70vh] bg-gray-50 p-2 rounded-b-lg border-l border-r border-b border-gray-200 overflow-y-auto"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-blue-50', 'border-blue-200');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200');
                        
                        try {
                          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                          if (data.dealId && data.sourceStage) {
                            handleMoveDeal(data.dealId, data.sourceStage, column.id);
                          }
                        } catch (err) {
                          console.error('Error parsing drag data:', err);
                        }
                      }}
                    >
                      <div className="space-y-2">
                        {columnDeals.map((deal) => (
                          <div 
                            key={deal.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', JSON.stringify({
                                dealId: deal.id,
                                sourceStage: columnId
                              }));
                              
                              // Add dragging style
                              e.currentTarget.classList.add('opacity-50');
                            }}
                            onDragEnd={(e) => {
                              // Remove dragging style
                              e.currentTarget.classList.remove('opacity-50');
                            }}
                          >
                            <AIEnhancedDealCard 
                              deal={deal} 
                              onClick={() => handleDealClick(deal.id)}
                              showAnalyzeButton={false}
                            />
                          </div>
                        ))}
                        
                        {columnDeals.length === 0 && (
                          <div className="p-4 text-center text-gray-500 text-sm bg-gray-100 rounded-lg border border-dashed border-gray-300">
                            No deals in this stage
                            <div className="mt-1">
                              <button
                                onClick={() => {
                                  setNewDealData({
                                    ...newDealData,
                                    stage: columnId
                                  });
                                  setShowAddDealModal(true);
                                }}
                                className="text-xs text-blue-600 flex items-center justify-center mt-2"
                              >
                                <Plus size={12} className="mr-1" />
                                Add deal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">All Deals ({filteredDeals.length})</h2>
              <div className="flex items-center space-x-2">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-gray-300 rounded-md text-sm"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="value">Value</option>
                  <option value="probability">Probability</option>
                  <option value="title">Title</option>
                </select>
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-700"
                >
                  {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </button>
              </div>
            </div>
            
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deal
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stage
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Probability
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedDeals.map(deal => (
                      <tr key={deal.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleDealClick(deal.id)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">{deal.title}</div>
                              <div className="text-sm text-gray-500">
                                <div className="flex items-center">
                                  <User size={12} className="mr-1 text-gray-400" />
                                  {deal.contact}
                                </div>
                                <div className="flex items-center">
                                  <Briefcase size={12} className="mr-1 text-gray-400" />
                                  {deal.company}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            deal.stage === 'qualification' ? 'bg-blue-100 text-blue-800' :
                            deal.stage === 'proposal' ? 'bg-indigo-100 text-indigo-800' :
                            deal.stage === 'negotiation' ? 'bg-purple-100 text-purple-800' :
                            deal.stage === 'closed-won' ? 'bg-green-100 text-green-800' :
                            deal.stage === 'closed-lost' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {deal.stage === 'closed-won' ? 'Closed Won' :
                             deal.stage === 'closed-lost' ? 'Closed Lost' :
                             deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
                          </span>
                          {deal.priority && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              deal.priority === 'high' ? 'bg-red-100 text-red-800' :
                              deal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {deal.priority}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(deal.value)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  deal.stage === 'closed-won' ? 'bg-green-500' : 
                                  deal.probability && deal.probability >= 75 ? 'bg-green-500' :
                                  deal.probability && deal.probability >= 50 ? 'bg-blue-500' :
                                  deal.probability && deal.probability >= 25 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${deal.probability || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">
                              {deal.probability || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${
                            !deal.dueDate ? 'text-gray-500' :
                            new Date() > deal.dueDate ? 'text-red-600 font-medium' : 'text-gray-900'
                          } flex items-center`}>
                            {deal.dueDate ? (
                              <>
                                <Calendar size={12} className="mr-1 text-gray-400" />
                                {deal.dueDate.toLocaleDateString()}
                              </>
                            ) : (
                              'Not set'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectDeal(deal.id);
                              generateAiInsight(deal.id);
                            }}
                          >
                            <Zap size={18} />
                          </button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-purple-600 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open notes or log activity
                            }}
                          >
                            <MessageSquare size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
      
      {/* Deal Detail Modal */}
      {showDealDetail && selectedDeal && (
        <DealDetail 
          dealId={selectedDeal} 
          onClose={handleCloseDealDetail} 
        />
      )}
      
      {/* Add Deal Modal */}
      {showAddDealModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Deal</h3>
                  <button
                    onClick={() => setShowAddDealModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Deal Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={newDealData.title}
                      onChange={(e) => setNewDealData({...newDealData, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={newDealData.company}
                      onChange={(e) => setNewDealData({...newDealData, company: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      id="contact"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={newDealData.contact}
                      onChange={(e) => setNewDealData({...newDealData, contact: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                        Deal Value
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="value"
                          className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={newDealData.value?.toString() || ''}
                          onChange={(e) => setNewDealData({...newDealData, value: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
                        Stage
                      </label>
                      <select
                        id="stage"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newDealData.stage}
                        onChange={(e) => setNewDealData({...newDealData, stage: e.target.value})}
                      >
                        <option value="qualification">Qualification</option>
                        <option value="proposal">Proposal</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed-won">Closed Won</option>
                        <option value="closed-lost">Closed Lost</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="probability" className="block text-sm font-medium text-gray-700">
                        Probability
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="number"
                          id="probability"
                          min="0"
                          max="100"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={newDealData.probability?.toString() || '0'}
                          onChange={(e) => setNewDealData({...newDealData, probability: parseInt(e.target.value) || 0})}
                        />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        id="priority"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newDealData.priority}
                        onChange={(e) => setNewDealData({...newDealData, priority: e.target.value as 'high' | 'medium' | 'low'})}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={newDealData.dueDate ? new Date(newDealData.dueDate).toISOString().substr(0, 10) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        setNewDealData({...newDealData, dueDate: date});
                      }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={newDealData.notes || ''}
                      onChange={(e) => setNewDealData({...newDealData, notes: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleAddDeal}
                >
                  Add Deal
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddDealModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;