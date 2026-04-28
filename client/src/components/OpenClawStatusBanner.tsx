import React from 'react';
import { AlertTriangle, Settings, X } from 'lucide-react';

interface OpenClawStatusBannerProps {
  onSetupClick: () => void;
  onDismiss?: () => void;
  className?: string;
}

const OpenClawStatusBanner: React.FC<OpenClawStatusBannerProps> = ({
  onSetupClick,
  onDismiss,
  className = '',
}) => {
  return (
    <div className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 ${className}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Unlock AI-Powered CRM Features</h3>
            <p className="text-purple-100 text-sm">
              Set up your OpenClaw API key to access contact enrichment, AI deal scoring, and
              natural language commands.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onSetupClick}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            <Settings className="w-4 h-4" />
            <span>Setup OpenClaw</span>
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenClawStatusBanner;
