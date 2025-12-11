import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Plus, 
  MoreVertical, 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Target,
  Clock
} from 'lucide-react';
import { useDealStore } from '../store/dealStore';
import { Deal, DealStage } from '../types/deal';
import { useContactStore } from '../store/contactStore';

interface DealCardProps {
  deal: Deal;
  index: number;
  onEdit: (deal: Deal) => void;
  onView: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, index, onEdit, onView, onDelete }) => {
  const { contacts } = useContactStore();
  const contact = contacts[deal.contactId];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  const getDaysInStage = () => {
    if (!deal.daysInStage) return null;
    return deal.daysInStage === 1 ? '1 day' : `${deal.daysInStage} days`;
  };

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border-l-4 p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer ${
            getPriorityColor(deal.priority)
          } ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
              {deal.title}
            </h3>
            <div className="relative">
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical size={14} className="text-gray-400" />
              </button>
              {/* Dropdown menu would go here */}
            </div>
          </div>

          {/* Deal Value */}
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign size={16} className="text-green-600" />
            <span className="font-bold text-lg text-gray-900">
              {formatCurrency(deal.value)}
            </span>
            <span className="text-sm text-gray-500">
              ({deal.probability}%)
            </span>
          </div>

          {/* Contact */}
          {contact && (
            <div className="flex items-center space-x-2 mb-2">
              <User size={14} className="text-gray-400" />
              <span className="text-sm text-gray-600">{contact.name}</span>
            </div>
          )}

          {/* Due Date */}
          {deal.expectedCloseDate && (
            <div className="flex items-center space-x-2 mb-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {deal.expectedCloseDate.toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Days in Stage */}
          {deal.daysInStage && (
            <div className="flex items-center space-x-2 mb-3">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {getDaysInStage()} in stage
              </span>
            </div>
          )}

          {/* Tags */}
          {deal.tags && deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {deal.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {deal.tags.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{deal.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(deal);
                }}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                title="View Details"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(deal);
                }}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-green-600"
                title="Edit Deal"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(deal.id);
                }}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                title="Delete Deal"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="text-xs text-gray-400">
              #{deal.id.slice(-4)}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

interface StageColumnProps {
  stage: DealStage;
  deals: Deal[];
  onAddDeal: (stageId: string) => void;
  onEditDeal: (deal: Deal) => void;
  onViewDeal: (deal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
}

const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  deals,
  onAddDeal,
  onEditDeal,
  onViewDeal,
  onDeleteDeal
}) => {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[500px] w-80 flex-shrink-0">
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
            {deals.length}
          </span>
        </div>
        <button
          onClick={() => onAddDeal(stage.id)}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-blue-600"
          title="Add Deal"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Stage Value */}
      <div className="mb-4 p-3 bg-white rounded-lg border">
        <div className="flex items-center space-x-2">
          <TrendingUp size={16} className="text-green-600" />
          <span className="font-semibold text-gray-900">
            {formatCurrency(totalValue)}
          </span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Total value • {stage.probability}% probability
        </div>
      </div>

      {/* Deals List */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[300px] ${
              snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                onEdit={onEditDeal}
                onView={onViewDeal}
                onDelete={onDeleteDeal}
              />
            ))}
            {provided.placeholder}
            
            {deals.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center text-gray-500 mt-8">
                <Target size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No deals in this stage</p>
                <button
                  onClick={() => onAddDeal(stage.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  Add your first deal
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const DealKanbanBoard: React.FC = () => {
  const {
    deals,
    getActivePipeline,
    getFilteredDeals,
    moveDeal,
    deleteDeal,
    getSalesMetrics,
    getTotalPipelineValue,
    fetchDeals,
    setFilters,
    filters
  } = useDealStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [newDealStage, setNewDealStage] = useState<string>('');

  const pipeline = getActivePipeline();
  const filteredDeals = getFilteredDeals();
  const metrics = getSalesMetrics();
  const totalValue = getTotalPipelineValue();

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Update search filter
  useEffect(() => {
    setFilters({ searchTerm: searchTerm || undefined });
  }, [searchTerm, setFilters]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStageId = destination.droppableId;
    
    await moveDeal(draggableId, newStageId);
  };

  const handleAddDeal = (stageId: string) => {
    setNewDealStage(stageId);
    setIsAddingDeal(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      await deleteDeal(dealId);
    }
  };

  const getDealsByStage = (stageId: string) => {
    return filteredDeals.filter(deal => deal.stage.id === stageId);
  };

  if (!pipeline) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipeline Found</h3>
          <p className="text-gray-500">Please create a pipeline to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{pipeline.name}</h2>
          <p className="text-gray-600 mt-1">
            {filteredDeals.length} deals • {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(totalValue)} total value
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          <button
            onClick={() => handleAddDeal(pipeline.stages[0]?.id || '')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            <Plus size={16} className="mr-2" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Deals</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalDeals}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(totalValue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.winRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Deal Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(metrics.averageDealSize)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 pb-4">
            {pipeline.stages
              .sort((a, b) => a.order - b.order)
              .map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  deals={getDealsByStage(stage.id)}
                  onAddDeal={handleAddDeal}
                  onEditDeal={handleEditDeal}
                  onViewDeal={handleViewDeal}
                  onDeleteDeal={handleDeleteDeal}
                />
              ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modals would go here */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Deal Details</h3>
            <p>Deal modal content would go here for: {selectedDeal.title}</p>
            <button
              onClick={() => setSelectedDeal(null)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealKanbanBoard;
