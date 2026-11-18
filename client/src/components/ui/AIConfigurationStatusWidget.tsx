import React from 'react';
import { Bot, Key, CheckCircle, AlertCircle, Settings, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAIConfiguration } from '../../contexts/AIConfigurationContext';
import { useAIApiKeys } from '../../hooks/useAIApiKeys';

interface AIConfigurationStatusWidgetProps {
  className?: string;
}

const AIConfigurationStatus: React.FC<AIConfigurationStatusWidgetProps> = ({ className }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { openAIProviderModal } = useAIConfiguration();
  const { apiConfig, isLoading, error } = useAIApiKeys();
  // Status only: whether a key exists, never the key itself
  const configuredProviders = (['openai', 'openclaw'] as const).filter(
    (id) => !!apiConfig[id]?.apiKey
  );

  const getProviderDisplayName = (providerId: string): string => {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      openclaw: 'OpenClaw',
    };
    return names[providerId] || providerId;
  };

  const getProviderColor = (providerId: string): string => {
    const colors: Record<string, string> = {
      openai: 'text-green-600',
      openclaw: 'text-blue-600',
    };
    return colors[providerId] || 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const hasAnyKeys = configuredProviders.length > 0;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Bot className="h-5 w-5 mr-2 text-purple-600" />
          AI Configuration
        </h3>
        <button
          onClick={openAIProviderModal}
          className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center"
        >
          <Settings className="h-4 w-4 mr-1" />
          Settings
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {!hasAnyKeys ? (
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            AI features require API key configuration
          </p>
          <button
            onClick={openAIProviderModal}
            className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Key className="h-4 w-4 mr-1" />
            Configure AI Keys
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">
              {configuredProviders.length} AI provider{configuredProviders.length !== 1 ? 's' : ''}{' '}
              configured
            </span>
          </div>

          <div className="space-y-2">
            {configuredProviders.map((providerId) => (
              <div key={providerId} className="flex items-center justify-between py-1">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                  <span className={`text-sm font-medium ${getProviderColor(providerId)}`}>
                    {getProviderDisplayName(providerId)}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Zap className="h-3 w-3 mr-1" />
                  Ready
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              AI features are now available across all apps
            </p>
            <button
              onClick={openAIProviderModal}
              className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
            >
              Manage providers →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Remount when the settings dialog opens/closes so the status is re-fetched after a save
const AIConfigurationStatusWidget: React.FC<AIConfigurationStatusWidgetProps> = (props) => {
  const { showAIProviderModal } = useAIConfiguration();
  return <AIConfigurationStatus key={String(showAIProviderModal)} {...props} />;
};

export default AIConfigurationStatusWidget;
