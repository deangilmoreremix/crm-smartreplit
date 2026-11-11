import React from 'react';
import { AlertCircle, KeyRound } from 'lucide-react';
import { describeAIError, isNeedsApiKey } from '../../services/gpt5Service';

interface AIStateNoticeProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

/** Explicit error / no-key state for AI widgets. Never shows invented output. */
const AIStateNotice: React.FC<AIStateNoticeProps> = ({ error, onRetry, className = '' }) => {
  const needsKey = isNeedsApiKey(error);
  const Icon = needsKey ? KeyRound : AlertCircle;
  return (
    <div
      role="alert"
      data-testid={needsKey ? 'ai-needs-api-key' : 'ai-error'}
      className={`flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200 ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="flex-1">
        <p>{describeAIError(error)}</p>
        {onRetry && !needsKey && (
          <button type="button" onClick={onRetry} className="mt-1 underline">
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default AIStateNotice;
