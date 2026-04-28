import React from 'react';
import { Lock, Settings, Brain } from 'lucide-react';

interface OpenClawFeatureGateProps {
  feature: string;
  onSetupClick: () => void;
  className?: string;
  compact?: boolean;
}

const OpenClawFeatureGate: React.FC<OpenClawFeatureGateProps> = ({
  feature,
  onSetupClick,
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={`flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}
      >
        <div className="text-center">
          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {feature} requires OpenClaw API key
          </p>
          <button
            onClick={onSetupClick}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <Settings className="w-4 h-4" />
            <span>Setup API Key</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center min-h-[300px] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 ${className}`}
    >
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-purple-600" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Unlock {feature}</h3>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This AI-powered feature requires an OpenClaw API key. Set up your API key to access
          contact enrichment, deal scoring, and intelligent CRM automation.
        </p>

        <div className="space-y-3">
          <button
            onClick={onSetupClick}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Settings className="w-5 h-5" />
            <span>Setup OpenClaw API Key</span>
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-500">
            Don't have an API key?{' '}
            <a
              href="https://openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 underline"
            >
              Get one at openclaw.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OpenClawFeatureGate;
