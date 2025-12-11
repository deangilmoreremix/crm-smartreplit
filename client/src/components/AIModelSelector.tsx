import React, { useState } from 'react';
import { 
  Brain, 
  Zap, 
  DollarSign, 
  Clock, 
  Info, 
  ChevronDown,
  CheckCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  AI_MODELS, 
  getModelsByCategory, 
  MODEL_CATEGORIES,
  AI_MODEL_RECOMMENDATIONS,
  type AIModel,
  type AIModelRecommendation 
} from '../services/aiModels';

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  useCase?: AIModelRecommendation;
  showPricing?: boolean;
  showCapabilities?: boolean;
  className?: string;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  useCase,
  showPricing = true,
  showCapabilities = true,
  className = ''
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('recommended');

  // Get recommended models for the use case
  const recommendedModels = useCase ? AI_MODEL_RECOMMENDATIONS[useCase] : [];
  
  // Get models by category
  const categoryModels = getModelsByCategory(selectedCategory);
  
  // Get currently selected model details
  const currentModel = AI_MODELS[selectedModel];

  const formatPrice = (price: number) => {
    return price < 1 ? `$${price}` : `$${price.toFixed(2)}`;
  };

  const getModelBadge = (model: AIModel) => {
    if (recommendedModels.includes(model.id)) {
      return { text: 'Recommended', color: 'bg-green-500/20 text-green-400' };
    }
    if (model.recommended) {
      return { text: 'Popular', color: 'bg-blue-500/20 text-blue-400' };
    }
    if (model.family === 'gemma') {
      return { text: 'Lightweight', color: 'bg-orange-500/20 text-orange-400' };
    }
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Current Selection */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
          isDark 
            ? 'bg-white/5 border-white/10 hover:border-white/20 text-white' 
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            currentModel?.family === 'gemini' 
              ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
              : (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600')
          }`}>
            <Brain size={16} />
          </div>
          <div className="text-left">
            <p className="font-medium">{currentModel?.name || 'Select Model'}</p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentModel?.family} • {currentModel?.version}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {showPricing && currentModel && (
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatPrice(currentModel.pricing.input)}/1M tokens
              </p>
            </div>
          )}
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 ${
          isDark ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-xl border ${
          isDark ? 'border-white/20' : 'border-gray-200'
        } rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden`}>
          
          {/* Category Tabs */}
          <div className={`p-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex space-x-2">
              {Object.entries(MODEL_CATEGORIES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(value)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selectedCategory === value
                      ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700')
                      : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Models List */}
          <div className="max-h-80 overflow-y-auto">
            {categoryModels.map((model) => {
              const badge = getModelBadge(model);
              const isSelected = model.id === selectedModel;
              
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-left transition-colors border-b last:border-b-0 ${
                    isDark ? 'border-white/5' : 'border-gray-100'
                  } ${
                    isSelected 
                      ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50')
                      : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {model.name}
                        </h4>
                        {isSelected && (
                          <CheckCircle size={14} className="text-green-400" />
                        )}
                        {badge && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                      
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        {model.description}
                      </p>
                      
                      {showCapabilities && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {model.capabilities.slice(0, 3).map((capability) => (
                            <span
                              key={capability}
                              className={`px-2 py-0.5 rounded text-xs ${
                                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {capability}
                            </span>
                          ))}
                          {model.capabilities.length > 3 && (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              +{model.capabilities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <DollarSign size={12} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {formatPrice(model.pricing.input)}/1M
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={12} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {model.contextWindow.toLocaleString()} tokens
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {useCase && (
            <div className={`p-3 border-t ${isDark ? 'border-white/10 bg-blue-500/5' : 'border-gray-200 bg-blue-50'}`}>
              <div className="flex items-start space-x-2">
                <Info size={14} className={`mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                    Optimized for {useCase.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                    Recommended models are highlighted above
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIModelSelector;