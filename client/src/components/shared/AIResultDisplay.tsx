import React, { useState, useCallback } from 'react';
import { Copy, Check, Download, Save, Share2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { copyToClipboard, saveToFile, generateFilename, formatTimestamp } from '../../services/openaiStreamService';
import { motion, AnimatePresence } from 'framer-motion';

export interface AIResultDisplayProps {
  result: string | null;
  isLoading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  title?: string;
  onRetry?: () => void;
  showTimestamp?: boolean;
  resultTimestamp?: Date;
  contentType?: 'text' | 'json' | 'code' | 'email';
  filenamePrefix?: string;
  onSave?: (content: string) => void;
}

export const AIResultDisplay: React.FC<AIResultDisplayProps> = ({
  result,
  isLoading = false,
  loadingMessage = 'Generating response...',
  error = null,
  title = 'Generated Result',
  onRetry,
  showTimestamp = true,
  resultTimestamp = new Date(),
  contentType = 'text',
  filenamePrefix = 'ai-result',
  onSave,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const success = await copyToClipboard(result);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleSave = useCallback(() => {
    if (!result) return;

    let extension = 'txt';
    let mimeType = 'text/plain';

    switch (contentType) {
      case 'json':
        extension = 'json';
        mimeType = 'application/json';
        break;
      case 'code':
        extension = 'txt';
        mimeType = 'text/plain';
        break;
      case 'email':
        extension = 'eml';
        mimeType = 'message/rfc822';
        break;
      default:
        extension = 'txt';
        mimeType = 'text/plain';
    }

    const filename = generateFilename(filenamePrefix, extension);
    saveToFile(result, filename, mimeType);
    setSaved(true);
    if (onSave) {
      onSave(result);
    }
    setTimeout(() => setSaved(false), 2000);
  }, [result, contentType, filenamePrefix, onSave]);

  const getContentClass = () => {
    switch (contentType) {
      case 'json':
        return 'font-mono text-sm bg-slate-50 dark:bg-slate-900';
      case 'code':
        return 'font-mono text-sm';
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      {(result || isLoading || error) && (
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>
            {showTimestamp && result && (
              <div className="flex items-center text-xs text-gray-500">
                <Clock size={12} className="mr-1" />
                {formatTimestamp(resultTimestamp)}
              </div>
            )}
          </div>

          {result && !isLoading && !error && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`inline-flex items-center px-3 py-1.5 rounded text-sm transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check size={14} className="mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy
                  </>
                )}
              </button>

              <button
                onClick={handleSave}
                className={`inline-flex items-center px-3 py-1.5 rounded text-sm transition-all ${
                  saved
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                title="Save to file"
              >
                {saved ? (
                  <>
                    <Check size={14} className="mr-1" />
                    Saved
                  </>
                ) : (
                  <>
                    <Download size={14} className="mr-1" />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <Loader2 size={20} className="animate-spin text-indigo-500 mr-3" />
            <span className="text-gray-600 dark:text-gray-400">{loadingMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
          >
            <div className="flex items-start">
              <AlertCircle size={18} className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result State */}
      <AnimatePresence>
        {result && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${contentType === 'json' || contentType === 'code' ? 'bg-slate-50 dark:bg-slate-900' : 'bg-gray-50 dark:bg-gray-800'}`}
          >
            <div
              className={`whitespace-pre-wrap text-sm overflow-x-auto max-h-96 overflow-y-auto ${getContentClass()}`}
            >
              {result}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!result && !isLoading && !error && (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-gray-400 dark:text-gray-500">
            <Save size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Results will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResultDisplay;