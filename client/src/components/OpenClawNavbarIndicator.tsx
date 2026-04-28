import React from 'react';
import { Bot, AlertTriangle } from 'lucide-react';

interface OpenClawNavbarIndicatorProps {
  hasApiKey: boolean;
  onClick: () => void;
}

const OpenClawNavbarIndicator: React.FC<OpenClawNavbarIndicatorProps> = ({
  hasApiKey,
  onClick,
}) => {
  if (hasApiKey) {
    return <Bot className="w-5 h-5" />;
  }

  return (
    <div className="relative">
      <Bot className="w-5 h-5" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-2 h-2 text-white" />
      </div>
    </div>
  );
};

export default OpenClawNavbarIndicator;
