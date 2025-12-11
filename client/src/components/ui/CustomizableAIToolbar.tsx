import React from 'react';
import { Zap } from 'lucide-react';

interface CustomizableAIToolbarProps {
  entityType: string;
  entityId: string;
  entityData: any;
  location: string;
  layout: string;
  size: string;
  showCustomizeButton?: boolean;
}

export const CustomizableAIToolbar: React.FC<CustomizableAIToolbarProps> = ({
  entityType,
  entityId,
  entityData,
  location,
  layout,
  size,
  showCustomizeButton = true
}) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
        <Zap className="w-4 h-4 text-purple-600" />
      </div>
      <span className="text-xs text-gray-600">AI Tools Available</span>
    </div>
  );
};