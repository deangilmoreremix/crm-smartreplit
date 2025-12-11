import React from 'react';
import { Copy, Download, Check } from 'lucide-react';

interface StructuredAIResultProps {
  title: string;
  data: any;
  isLoading?: boolean;
  error?: string | null;
  onCopy?: () => void;
  copySuccess?: boolean;
}

const StructuredAIResult: React.FC<StructuredAIResultProps> = ({
  title,
  data,
  isLoading = false,
  error = null,
  onCopy,
  copySuccess = false
}) => {
  const handleCopy = () => {
    if (data && onCopy) {
      const textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(textContent);
      onCopy();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 animate-pulse">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Processing...</h3>
        <p className="text-blue-600">Analyzing data and generating insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-green-800">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            {copySuccess ? <Check size={16} /> : <Copy size={16} />}
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="text-green-700">
        {typeof data === 'string' ? (
          <div className="whitespace-pre-wrap">{data}</div>
        ) : (
          <div className="space-y-2">
            <p className="font-medium">Analysis Complete</p>
            <p className="text-sm text-green-600">
              {data?.summary || data?.message || 'Data processed successfully'}
            </p>
            {/* Hide raw JSON from users - only show in dev mode */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-green-500 hover:text-green-700">
                  Show Raw Data (Debug)
                </summary>
                <pre className="mt-2 text-xs bg-green-100 p-2 rounded text-green-800 overflow-auto max-h-40">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StructuredAIResult;