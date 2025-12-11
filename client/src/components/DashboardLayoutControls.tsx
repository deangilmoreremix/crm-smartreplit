import React, { useState } from 'react';
import { useDashboardLayout } from '../contexts/DashboardLayoutContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings, 
  RotateCcw, 
  Move3D, 
  Eye, 
  EyeOff, 
  ChevronDown,
  Check,
  X,
  Palette
} from 'lucide-react';

const DashboardLayoutControls: React.FC = () => {
  const { 
    sectionOrder, 
    setSectionOrder, 
    resetToDefault, 
    getSectionConfig 
  } = useDashboardLayout();
  
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSectionToggle = (sectionId: string, enabled: boolean) => {
    if (enabled) {
      // Add section back to the order if not present
      if (!sectionOrder.includes(sectionId)) {
        setSectionOrder([...sectionOrder, sectionId]);
      }
    } else {
      // Remove section from order
      setSectionOrder(sectionOrder.filter(id => id !== sectionId));
    }
  };

  const allSections = [
    'gpt5-enhanced-dashboard',
    'gpt5-smart-kpi-section',
    'executive-overview-section',
    'automations-section',
    'quick-actions-section',
    'gpt5-analytics-section',
    'gpt5-deal-intelligence-section',
    'ai-smart-features-hub',
    'sales-pipeline-deal-analytics',
    'customer-lead-management',
    'activities-communications',
    'integrations-system',
    'pipeline-section',
    'contacts-section',
    'tasks-section',
    'apps-section',
    'analytics-section'
  ];

  return (
    <div className="fixed top-24 right-2 sm:right-4 z-50">
      <div className="relative">
        {/* Control Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-xl ${
            isDark 
              ? 'bg-gray-800/90 hover:bg-gray-700/90 border-white/10' 
              : 'bg-white/90 hover:bg-gray-50/90 border-gray-200'
          } backdrop-blur-xl border shadow-lg transition-all duration-200 ${
            isOpen ? 'scale-105' : ''
          }`}
          title="Dashboard Layout Settings"
        >
          <Settings size={20} className={`${isDark ? 'text-white' : 'text-gray-700'} transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`} />
        </button>

        {/* Controls Panel */}
        {isOpen && (
          <div className={`absolute top-16 right-0 w-72 sm:w-80 ${
            isDark 
              ? 'bg-gray-800/95 border-white/10' 
              : 'bg-white/95 border-gray-200'
          } backdrop-blur-xl border rounded-xl shadow-xl p-4 transition-all duration-200 transform ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Palette size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Layout Settings
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-md ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 mb-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`w-full flex items-center justify-between p-3 rounded-lg ${
                  isDark 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                } transition-colors`}
              >
                <div className="flex items-center space-x-2">
                  <Move3D size={16} />
                  <span className="text-sm font-medium">Drag & Drop Mode</span>
                </div>
                <div className={`w-5 h-5 rounded border-2 ${
                  showPreview 
                    ? 'bg-blue-500 border-blue-500' 
                    : `border-gray-400 ${isDark ? 'dark:border-gray-600' : ''}`
                } flex items-center justify-center`}>
                  {showPreview && <Check size={12} className="text-white" />}
                </div>
              </button>

              <button
                onClick={resetToDefault}
                className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg ${
                  isDark 
                    ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400' 
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                } transition-colors`}
              >
                <RotateCcw size={16} />
                <span className="text-sm font-medium">Reset Layout</span>
              </button>
            </div>

            {/* Section Visibility Controls */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                Section Visibility
              </h4>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {allSections.map((sectionId) => {
                  const config = getSectionConfig(sectionId);
                  const isEnabled = sectionOrder.includes(sectionId);
                  
                  if (!config) return null;
                  
                  return (
                    <div
                      key={sectionId}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${config.color}`}></div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {config.title}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {config.description}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleSectionToggle(sectionId, !isEnabled)}
                        className={`p-1 rounded-md transition-colors ${
                          isEnabled 
                            ? `${isDark ? 'text-green-400 hover:bg-green-400/20' : 'text-green-600 hover:bg-green-100'}` 
                            : `${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`
                        }`}
                        title={isEnabled ? 'Hide Section' : 'Show Section'}
                      >
                        {isEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Order Preview */}
            {showPreview && (
              <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-4">
                <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Current Order
                </h4>
                <div className="space-y-1">
                  {sectionOrder.map((sectionId, index) => {
                    const config = getSectionConfig(sectionId);
                    if (!config) return null;
                    
                    return (
                      <div
                        key={sectionId}
                        className={`flex items-center space-x-3 p-2 rounded-md ${
                          isDark ? 'bg-white/5' : 'bg-gray-50'
                        }`}
                      >
                        <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {index + 1}
                        </span>
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`}></div>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {config.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border`}>
              <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                💡 <strong>Tip:</strong> Hover over any section and drag the handle (⋮⋮) to reorder. Changes are saved automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayoutControls;