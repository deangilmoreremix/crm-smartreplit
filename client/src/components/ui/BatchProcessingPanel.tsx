import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { batchAPIService, BatchJob } from '../../services/openai-batch-api.service';
import { Users, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface BatchProcessingPanelProps {
  selectedContactIds?: string[];
  /** Kept for compatibility; pipeline analysis has no real backend and is not offered. */
  selectedDealIds?: string[];
  onJobCreated?: (jobId: string) => void;
}

const BatchProcessingPanel: React.FC<BatchProcessingPanelProps> = ({
  selectedContactIds = [],
  onJobCreated,
}) => {
  const { isDark } = useTheme();
  const [activeJobs, setActiveJobs] = useState<BatchJob[]>(() => batchAPIService.getAllBatchJobs());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => batchAPIService.subscribe(setActiveJobs), []);

  const handleContactScoring = async () => {
    if (selectedContactIds.length === 0) return;

    setIsProcessing(true);
    setError(null);
    try {
      await batchAPIService.enrichContactsBulk(selectedContactIds, {
        onStart: (job) => onJobCreated?.(job.id),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div
      className={`${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Batch API Processing
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Scores each selected contact with your lead-automation settings, three at a time
          </p>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleContactScoring}
          disabled={selectedContactIds.length === 0 || isProcessing}
          className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
            selectedContactIds.length === 0 || isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : isDark
                ? 'bg-gray-700/50 border-white/10 hover:bg-gray-700/80'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className="text-left">
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Score Selected Contacts
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedContactIds.length} contacts selected
            </p>
          </div>
        </button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {/* Jobs */}
      {activeJobs.length > 0 && (
        <div>
          <h4 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Batch Jobs
          </h4>
          <div className="space-y-3">
            {activeJobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p
                        className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                      >
                        {job.completedCount} of {job.itemCount} scored
                        {job.failed.length > 0 && `, ${job.failed.length} failed`}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="text-sm capitalize">{job.status}</p>
                    {job.status === 'processing' && (
                      <button
                        onClick={() => batchAPIService.cancelBatchJob(job.id)}
                        className="text-xs underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                {job.failed.length > 0 && (
                  <ul className="mt-2 text-xs text-red-500 space-y-1">
                    {job.failed.map((f) => (
                      <li key={f.contactId}>
                        Contact {f.contactId}: {f.message}
                      </li>
                    ))}
                  </ul>
                )}
                {job.results.length > 0 && (
                  <ul className={`mt-2 text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {job.results.map((r) => (
                      <li key={r.contactId}>
                        Contact {r.contactId}: {r.score} ({r.priority}) - {r.rationale}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessingPanel;
