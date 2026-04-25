import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeadScoringVisualizationProps {
  score: number;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-blue-600 bg-blue-100';
  if (score >= 40) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const getScoreIcon = (score: number) => {
  if (score >= 80) return <TrendingUp className="w-4 h-4" />;
  if (score >= 60) return <BarChart3 className="w-4 h-4" />;
  if (score >= 40) return <Minus className="w-4 h-4" />;
  return <TrendingDown className="w-4 h-4" />;
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Hot Lead';
  if (score >= 60) return 'Warm Lead';
  if (score >= 40) return 'Cold Lead';
  return 'Ice Cold';
};

export const LeadScoringVisualization: React.FC<LeadScoringVisualizationProps> = ({
  score,
  label,
  showLabel = true,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const displayLabel = label || getScoreLabel(score);

  return (
    <div className={`inline-flex items-center rounded-full ${getScoreColor(score)} ${sizeClasses[size]}`}>
      {showIcon && (
        <span className="mr-1.5">
          {getScoreIcon(score)}
        </span>
      )}
      <span className="font-medium mr-1">{score}</span>
      {showLabel && (
        <span className="text-gray-700">{displayLabel}</span>
      )}
    </div>
  );
};

export default LeadScoringVisualization;
