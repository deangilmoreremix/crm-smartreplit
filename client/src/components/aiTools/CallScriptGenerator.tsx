import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEnhancedGemini } from '../../services/enhancedGeminiService';
import { aiUsageTracker } from '../../services/aiUsageTracker';
import { Phone, Loader2, Copy, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface CallScriptData {
  purpose: 'cold_call' | 'follow_up' | 'discovery' | 'closing' | 'objection_handling';
  contactName: string;
  companyName: string;
  industry: string;
  painPoints: string[];
  objectives: string[];
}

const purposeOptions = [
  { value: 'cold_call', label: 'Cold Call', description: 'Initial outreach to new prospects' },
  { value: 'follow_up', label: 'Follow-up Call', description: 'Following up on previous contact' },
  { value: 'discovery', label: 'Discovery Call', description: 'Understanding client needs and pain points' },
  { value: 'closing', label: 'Closing Call', description: 'Moving towards deal closure' },
  { value: 'objection_handling', label: 'Objection Handling', description: 'Addressing client concerns' }
];

export default function CallScriptGenerator() {
  const { isDark } = useTheme();
  const { generateCallScript } = useEnhancedGemini();
  
  const [scriptData, setScriptData] = useState<CallScriptData>({
    purpose: 'cold_call',
    contactName: '',
    companyName: '',
    industry: '',
    painPoints: [''],
    objectives: ['']
  });
  
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof CallScriptData, value: string | number | undefined) => {
    setScriptData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayAdd = (field: 'painPoints' | 'objectives') => {
    setScriptData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const handleArrayUpdate = (field: 'painPoints' | 'objectives', index: number, value: string) => {
    setScriptData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleArrayRemove = (field: 'painPoints' | 'objectives', index: number) => {
    setScriptData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleGenerate = async () => {
    if (!scriptData.contactName || !scriptData.companyName) {
      setError('Please fill in contact name and company name');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess(false);
    
    const startTime = Date.now();

    try {
      const filteredData = {
        ...scriptData,
        painPoints: scriptData.painPoints.filter(point => point.trim()),
        objectives: scriptData.objectives.filter(obj => obj.trim())
      };

      const script = await generateCallScript(filteredData);
      setGeneratedScript(script);
      setSuccess(true);

      // Track usage
      await aiUsageTracker.trackUsage({
        toolId: 'call-script-generator',
        toolName: 'Call Script Generator',
        category: 'Core AI Tools',
        executionTime: Date.now() - startTime,
        success: true,
        customerId: 'current-user'
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate call script';
      setError(errorMsg);
      
      // Track failed usage
      await aiUsageTracker.trackUsage({
        toolId: 'call-script-generator',
        toolName: 'Call Script Generator',
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
    if (generatedScript) {
      await navigator.clipboard.writeText(generatedScript);
    }
  };

  const handleDownload = () => {
    if (generatedScript) {
      const blob = new Blob([generatedScript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-script-${scriptData.purpose}-${scriptData.companyName.replace(/\s+/g, '-').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mr-4">
          <Phone className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Call Script Generator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create effective sales call scripts for any scenario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-6">Call Details</h2>
          
          {/* Call Purpose */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Call Purpose *</label>
            <div className="grid grid-cols-1 gap-3">
              {purposeOptions.map((option) => (
                <label key={option.value} className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="purpose"
                    value={option.value}
                    checked={scriptData.purpose === option.value}
                    onChange={(e) => handleInputChange('purpose', e.target.value as any)}
                    className="mt-1 mr-3 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Name *</label>
              <input
                type="text"
                value={scriptData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company Name *</label>
              <input
                type="text"
                value={scriptData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Industry</label>
              <input
                type="text"
                value={scriptData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </div>

            {/* Pain Points */}
            <div>
              <label className="block text-sm font-medium mb-2">Known Pain Points</label>
              {scriptData.painPoints.map((point, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleArrayUpdate('painPoints', index, e.target.value)}
                    className={`flex-1 p-3 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter pain point"
                  />
                  <button
                    onClick={() => handleArrayRemove('painPoints', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleArrayAdd('painPoints')}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Pain Point
              </button>
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-sm font-medium mb-2">Call Objectives</label>
              {scriptData.objectives.map((obj, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => handleArrayUpdate('objectives', index, e.target.value)}
                    className={`flex-1 p-3 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter objective"
                  />
                  <button
                    onClick={() => handleArrayRemove('objectives', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleArrayAdd('objectives')}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Objective
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Script...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5 mr-2" />
                Generate Call Script
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
              <span className="text-green-700">Call script generated successfully!</span>
            </div>
          )}
        </div>

        {/* Generated Script */}
        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Generated Call Script</h2>
            {generatedScript && (
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

          {generatedScript ? (
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            } max-h-96 overflow-y-auto`}>
              <pre className="whitespace-pre-wrap text-sm">{generatedScript}</pre>
            </div>
          ) : (
            <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
              isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
            }`}>
              <Phone className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Your generated call script will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
