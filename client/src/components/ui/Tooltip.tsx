import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface TooltipProps {
  content: string | React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  position = 'top',
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <HelpCircle size={16} className="text-gray-400 hover:text-gray-600" />}
      </div>

      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 max-w-xs shadow-lg border border-gray-700">
            {title && (
              <div className="font-semibold mb-1 text-blue-300">{title}</div>
            )}
            <div className="text-gray-200">{content}</div>
            <div className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-b border-r' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-t border-l' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -mr-1 border-t border-r' :
              'right-full top-1/2 -translate-y-1/2 -ml-1 border-b border-l'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
};

interface FeatureTooltipProps {
  feature: string;
  description: string;
  benefits?: string[];
  examples?: string[];
  children?: React.ReactNode;
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  feature,
  description,
  benefits = [],
  examples = [],
  children
}) => {
  const content = (
    <div className="space-y-2">
      <div className="text-gray-200">{description}</div>

      {benefits.length > 0 && (
        <div>
          <div className="text-blue-300 font-medium text-xs uppercase tracking-wide mb-1">Benefits</div>
          <ul className="text-xs space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-400 mr-1">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {examples.length > 0 && (
        <div>
          <div className="text-purple-300 font-medium text-xs uppercase tracking-wide mb-1">Examples</div>
          <ul className="text-xs space-y-1">
            {examples.map((example, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-400 mr-1">•</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      title={feature}
      content={content}
      position="top"
      className="inline-flex items-center"
    >
      {children}
    </Tooltip>
  );
};