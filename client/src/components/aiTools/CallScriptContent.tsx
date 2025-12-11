import React, { useState } from 'react';
import { Phone, User, Building, Tag, RefreshCw, Copy } from 'lucide-react';
import AIToolContent from '../shared/AIToolContent';
import { useOpenAI } from '../../services/openaiLegacyService';

const CallScriptContent: React.FC = () => {
  const [formData, setFormData] = useState({
    prospectName: '',
    companyName: '',
    industry: '',
    callPurpose: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const openai = useOpenAI();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    setReasoning(null);

    try {
      const prompt = `Create a personalized sales call script to ${formData.callPurpose} for ${formData.prospectName} at ${formData.companyName}, a company in the ${formData.industry} industry.`;
      const script = await openai.generateScript(prompt); // <- replace with your actual function
      const reason = await openai.generateReasoning(`Explain the strategy behind the call script for: ${formData.callPurpose}`);
      setResult(script);
      setReasoning(reason);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      alert('Call script copied to clipboard!');
    }
  };

  return (
    <div className="w-full">
      <AIToolContent>
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <h3 className="font-semibold text-indigo-800">Call Script Generator</h3>
            <p className="text-sm text-indigo-600">
              Enter basic details to generate a personalized, strategic sales call script with AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <User size={18} /> Prospect Name
              <input type="text" name="prospectName" className="input-modern" value={formData.prospectName} onChange={handleChange} required />
            </label>

            <label className="flex items-center gap-2">
              <Building size={18} /> Company Name
              <input type="text" name="companyName" className="input-modern" value={formData.companyName} onChange={handleChange} required />
            </label>

            <label className="flex items-center gap-2">
              <Tag size={18} /> Industry
              <input type="text" name="industry" className="input-modern" value={formData.industry} onChange={handleChange} />
            </label>

            <label className="flex items-center gap-2">
              <Phone size={18} /> Purpose of Call
              <input type="text" name="callPurpose" className="input-modern" value={formData.callPurpose} onChange={handleChange} required />
            </label>
          </div>

          <button type="submit" className="btn-primary flex items-center gap-2" disabled={isLoading}>
            {isLoading ? <RefreshCw className="animate-spin" size={16} /> : null}
            {isLoading ? 'Generating...' : 'Generate Call Script'}
          </button>

          {error && <p className="text-red-500">{error}</p>}

          {result && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-indigo-700 font-medium">Generated Script</h4>
                <button type="button" className="btn-secondary text-sm flex items-center gap-1" onClick={handleCopy}>
                  <Copy size={14} /> Copy
                </button>
              </div>
              <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{result}</div>
            </div>
          )}

          {result && reasoning && (
            <div className="mt-4">
              <h4 className="text-indigo-700 font-medium mb-2">Strategy Reasoning</h4>
              <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{reasoning}</p>
              </div>
            </div>
          )}
        </form>
      </AIToolContent>
    </div>
  );
};

export default CallScriptContent;