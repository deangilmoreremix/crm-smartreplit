
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { batchAPIService } from '../../services/openai-batch-api.service';
import { 
  Users, 
  Mail, 
  TrendingUp, 
  Share2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface BatchProcessingPanelProps {
  selectedContactIds?: string[];
  selectedDealIds?: string[];
  onJobCreated?: (jobId: string) => void;
}

const BatchProcessingPanel: React.FC<BatchProcessingPanelProps> = ({
  selectedContactIds = [],
  selectedDealIds = [],
  onJobCreated
}) => {
  const { isDark } = useTheme();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveJobs(batchAPIService.getAllBatchJobs());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleBatchEnrichment = async () => {
    if (selectedContactIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      const job = await batchAPIService.enrichContactsBulk(
        selectedContactIds, 
        ['scoring', 'social', 'personality']
      );
      onJobCreated?.(job.id);
    } catch (error) {
      console.error('Batch enrichment failed:', error);
    }
    setIsProcessing(false);
  };

  const handleBulkEmailGeneration = async () => {
    if (selectedContactIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      const job = await batchAPIService.generateCampaignEmailsBulk(selectedContactIds, {
        subject: "Strategic Partnership Opportunity",
        tone: "professional",
        purpose: "introduce new product features",
        callToAction: "schedule a demo"
      });
      onJobCreated?.(job.id);
    } catch (error) {
      console.error('Bulk email generation failed:', error);
    }
    setIsProcessing(false);
  };

  const handlePipelineAnalysis = async () => {
    if (selectedDealIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      const job = await batchAPIService.analyzePipelineBulk(selectedDealIds);
      onJobCreated?.(job.id);
    } catch (error) {
      console.error('Pipeline analysis failed:', error);
    }
    setIsProcessing(false);
  };

  const handleSocialResearch = async () => {
    if (selectedContactIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      const job = await batchAPIService.researchSocialProfilesBulk(selectedContactIds);
      onJobCreated?.(job.id);
    } catch (error) {
      console.error('Social research failed:', error);
    }
    setIsProcessing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className={`${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Batch API Processing
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Process thousands of items at 50% cost - runs overnight for maximum savings
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isDark ? 'bg-green-400/20 text-green-400' : 'bg-green-100 text-green-800'
        }`}>
          50% Cost Savings
        </div>
      </div>

      {/* Batch Operation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleBatchEnrichment}
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
              Mass Contact Enrichment
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedContactIds.length} contacts selected
            </p>
            <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Est: {formatCost(selectedContactIds.length * 0.0015)}
            </p>
          </div>
        </button>

        <button
          onClick={handleBulkEmailGeneration}
          disabled={selectedContactIds.length === 0 || isProcessing}
          className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
            selectedContactIds.length === 0 || isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : isDark
                ? 'bg-gray-700/50 border-white/10 hover:bg-gray-700/80'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Mail className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <div className="text-left">
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Bulk Email Campaign
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedContactIds.length} emails to generate
            </p>
            <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Est: {formatCost(selectedContactIds.length * 0.0008)}
            </p>
          </div>
        </button>

        <button
          onClick={handlePipelineAnalysis}
          disabled={selectedDealIds.length === 0 || isProcessing}
          className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
            selectedDealIds.length === 0 || isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : isDark
                ? 'bg-gray-700/50 border-white/10 hover:bg-gray-700/80'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <div className="text-left">
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Pipeline Analysis
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedDealIds.length} deals selected
            </p>
            <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Est: {formatCost(selectedDealIds.length * 0.0012)}
            </p>
          </div>
        </button>

        <button
          onClick={handleSocialResearch}
          disabled={selectedContactIds.length === 0 || isProcessing}
          className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
            selectedContactIds.length === 0 || isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : isDark
                ? 'bg-gray-700/50 border-white/10 hover:bg-gray-700/80'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Share2 className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          <div className="text-left">
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Bulk Social Research
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedContactIds.length} profiles to research
            </p>
            <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Est: {formatCost(selectedContactIds.length * 0.001)}
            </p>
          </div>
        </button>
      </div>

      {/* Active Jobs Status */}
      {activeJobs.length > 0 && (
        <div>
          <h4 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Active Batch Jobs
          </h4>
          <div className="space-y-3">
            {activeJobs.slice(0, 5).map(job => (
              <div
                key={job.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-gray-700/30' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {job.type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {job.itemCount} items • {formatCost(job.estimatedCost)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm capitalize ${
                    job.status === 'completed' ? 'text-green-500' :
                    job.status === 'processing' ? 'text-blue-500' :
                    job.status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {job.status}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Savings Information */}
      <div className={`mt-6 p-4 rounded-lg ${
        isDark ? 'bg-green-400/10 border border-green-400/20' : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <DollarSign className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <h5 className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-800'}`}>
            Batch Processing Benefits
          </h5>
        </div>
        <ul className={`text-sm space-y-1 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
          <li>• 50% cost reduction compared to real-time processing</li>
          <li>• Process thousands of items without rate limits</li>
          <li>• Runs during off-peak hours (24-hour completion window)</li>
          <li>• Perfect for large campaigns and bulk operations</li>
        </ul>
      </div>
    </div>
  );
};

export default BatchProcessingPanel;
