import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useEnhancedGemini } from '../../services/enhancedGeminiService';
import { aiUsageTracker } from '../../services/aiUsageTracker';
import { FileText, Loader2, Download, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface ProposalData {
  clientName: string;
  companyName: string;
  projectDescription: string;
  requirements: string[];
  budget?: number;
  timeline?: string;
  deliverables: string[];
}

export default function ProposalGenerator() {
  const { isDark } = useTheme();
  const { generateProposal } = useEnhancedGemini();
  
  const [proposalData, setProposalData] = useState<ProposalData>({
    clientName: '',
    companyName: '',
    projectDescription: '',
    requirements: [''],
    budget: undefined,
    timeline: '',
    deliverables: ['']
  });
  
  const [generatedProposal, setGeneratedProposal] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof ProposalData, value: string | number | undefined) => {
    setProposalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayAdd = (field: 'requirements' | 'deliverables') => {
    setProposalData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const handleArrayUpdate = (field: 'requirements' | 'deliverables', index: number, value: string) => {
    setProposalData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleArrayRemove = (field: 'requirements' | 'deliverables', index: number) => {
    setProposalData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleGenerate = async () => {
    if (!proposalData.clientName || !proposalData.companyName || !proposalData.projectDescription) {
      setError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess(false);
    
    const startTime = Date.now();

    try {
      const filteredData = {
        ...proposalData,
        requirements: proposalData.requirements.filter(req => req.trim()),
        deliverables: proposalData.deliverables.filter(del => del.trim())
      };

      const proposal = await generateProposal(filteredData);
      setGeneratedProposal(proposal);
      setSuccess(true);

      // Track usage
      await aiUsageTracker.trackUsage({
        toolId: 'proposal-generator',
        toolName: 'Proposal Generator',
        category: 'Core AI Tools',
        executionTime: Date.now() - startTime,
        success: true,
        customerId: 'current-user'
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate proposal';
      setError(errorMsg);
      
      // Track failed usage
      await aiUsageTracker.trackUsage({
        toolId: 'proposal-generator',
        toolName: 'Proposal Generator',
        category: 'Core AI Tools',
        executionTime: Date.now() - startTime,
        success: false,
        error: errorMsg,
        customerId: 'current-user'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedProposal) {
      await navigator.clipboard.writeText(generatedProposal);
      // Could add a toast notification here
    }
  };

  const handleDownload = () => {
    if (generatedProposal) {
      const blob = new Blob([generatedProposal], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${proposalData.companyName.replace(/\s+/g, '-').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div 
      className={`max-w-6xl mx-auto p-4 sm:p-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8 text-center sm:text-left"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mx-auto sm:mx-0 sm:mr-4 mb-4 sm:mb-0">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">AI Proposal Generator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Create professional business proposals with AI assistance
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Input Form */}
        <motion.div 
          className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Proposal Details</h2>
          
          {/* Basic Information */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2">Client Name *</label>
              <input
                type="text"
                value={proposalData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation`}
                placeholder="Enter client name"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2">Company Name *</label>
              <input
                type="text"
                value={proposalData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation`}
                placeholder="Enter company name"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2">Project Description *</label>
              <textarea
                value={proposalData.projectDescription}
                onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                rows={4}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Describe the project in detail"
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Budget</label>
                <input
                  type="number"
                  value={proposalData.budget || ''}
                  onChange={(e) => handleInputChange('budget', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={`w-full p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter budget"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Timeline</label>
                <input
                  type="text"
                  value={proposalData.timeline}
                  onChange={(e) => handleInputChange('timeline', e.target.value)}
                  className={`w-full p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g., 3 months"
                />
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium mb-2">Requirements</label>
              {proposalData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayUpdate('requirements', index, e.target.value)}
                    className={`flex-1 p-3 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter requirement"
                  />
                  <button
                    onClick={() => handleArrayRemove('requirements', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleArrayAdd('requirements')}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Requirement
              </button>
            </div>

            {/* Deliverables */}
            <div>
              <label className="block text-sm font-medium mb-2">Deliverables</label>
              {proposalData.deliverables.map((del, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={del}
                    onChange={(e) => handleArrayUpdate('deliverables', index, e.target.value)}
                    className={`flex-1 p-3 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter deliverable"
                  />
                  <button
                    onClick={() => handleArrayRemove('deliverables', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleArrayAdd('deliverables')}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Deliverable
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Proposal...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Generate Proposal
              </>
            )}
          </button>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">Proposal generated successfully!</span>
            </div>
          )}
        </motion.div>

        {/* Generated Proposal */}
        <motion.div 
          className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Generated Proposal</h2>
            {generatedProposal && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            )}
          </div>

          {generatedProposal ? (
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            } max-h-96 overflow-y-auto`}>
              <pre className="whitespace-pre-wrap text-sm">{generatedProposal}</pre>
            </div>
          ) : (
            <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
              isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
            }`}>
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Your generated proposal will appear here</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
