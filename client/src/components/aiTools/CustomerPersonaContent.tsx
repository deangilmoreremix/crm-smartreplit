import React, { useState } from 'react';
import { useGemini } from '../../services/geminiService';
import AIToolContent from '../shared/AIToolContent';
import { User, Users, Building, RefreshCw, Copy, Plus, Trash2, Check, Download } from 'lucide-react';

const CustomerPersonaContent: React.FC = () => {
  const [formData, setFormData] = useState({
    industry: '',
    companySize: 'mid-market', // default value
    painPoints: ['', '', '']
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const gemini = useGemini();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePainPointChange = (index: number, value: string) => {
    const newPainPoints = [...formData.painPoints];
    newPainPoints[index] = value;
    setFormData({
      ...formData,
      painPoints: newPainPoints
    });
  };

  const addPainPoint = () => {
    setFormData({
      ...formData,
      painPoints: [...formData.painPoints, '']
    });
  };

  const removePainPoint = (index: number) => {
    const newPainPoints = [...formData.painPoints];
    newPainPoints.splice(index, 1);
    setFormData({
      ...formData,
      painPoints: newPainPoints
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.industry) return;

    // Filter out empty pain points
    const validPainPoints = formData.painPoints.filter(point => point.trim() !== '');
    if (validPainPoints.length === 0) {
      setError("Please add at least one pain point");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const persona = await gemini.generateCustomerPersona(
        formData.industry,
        formData.companySize,
        validPainPoints
      );
      
      setResult(persona);
      setCopied(false);
    } catch (err) {
      console.error('Error generating customer persona:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the customer persona');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Company size options
  const companySizes = [
    { value: 'small', label: 'Small Business (1-50 employees)' },
    { value: 'mid-market', label: 'Mid-Market (51-500 employees)' },
    { value: 'enterprise', label: 'Enterprise (501-5,000 employees)' },
    { value: 'large-enterprise', label: 'Large Enterprise (5,000+ employees)' }
  ];

  // Industry suggestions
  const industryOptions = [
    'Software & Technology', 'Financial Services', 'Healthcare',
    'Manufacturing', 'Retail', 'Education', 'Professional Services',
    'Real Estate', 'Transportation', 'Energy & Utilities',
    'Media & Entertainment', 'Telecommunications'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
        <div className="flex items-start">
          <Users className="text-emerald-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-emerald-800">Customer Persona Generator</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Create detailed, data-driven customer personas to better understand your target audience and personalize your sales approach.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Creating customer persona..."
        resultTitle="Customer Persona"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <div className="relative">
              <input
                list="industry-options"
                id="industry"
                name="industry"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Software & Technology, Healthcare"
                value={formData.industry}
                onChange={handleChange}
                required
              />
              <datalist id="industry-options">
                {industryOptions.map((option, index) => (
                  <option key={index} value={option} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div>
            <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
              Company Size
            </label>
            <select
              id="companySize"
              name="companySize"
              value={formData.companySize}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            >
              {companySizes.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Key Pain Points & Challenges
              </label>
              <button
                type="button"
                onClick={addPainPoint}
                className="text-xs flex items-center text-emerald-600 hover:text-emerald-800"
              >
                <Plus size={14} className="mr-1" />
                Add Pain Point
              </button>
            </div>
            
            {formData.painPoints.map((painPoint, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={painPoint}
                  onChange={(e) => handlePainPointChange(index, e.target.value)}
                  placeholder={`Pain point ${index + 1} (e.g., "Difficulty tracking sales metrics")`}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
                {formData.painPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePainPoint(index)}
                    className="ml-2 p-2 text-red-600 hover:text-red-800 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            {error && formData.painPoints.every(p => !p.trim()) && (
              <p className="text-red-600 text-sm mt-1">Please add at least one pain point</p>
            )}
          </div>
            
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.industry.trim() || formData.painPoints.every(p => !p.trim())}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <User size={18} className="mr-2" />
                  Generate Persona
                </>
              )}
            </button>
          </div>
        </form>
      </AIToolContent>

      {result && !isLoading && !error && (
        <div className="mt-6">
          <div className="flex justify-end space-x-2 mb-2">
            <button 
              onClick={handleCopy}
              className={`inline-flex items-center px-3 py-1.5 rounded text-sm transition-colors ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} className="mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-1" />
                  Copy to Clipboard
                </>
              )}
            </button>
            <button className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">
              <Download size={16} className="mr-1" />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPersonaContent;