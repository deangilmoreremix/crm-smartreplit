import React, { useState } from 'react';
import { useGemini } from '../../services/geminiService';
import AIToolContent from '../shared/AIToolContent';
import { Volume2, User, MessageCircle, RefreshCw, Copy, Check } from 'lucide-react';

const VoiceToneOptimizerContent: React.FC = () => {
  const [formData, setFormData] = useState({
    content: '',
    targetAudience: '',
    communicationGoal: 'persuasion'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content || !formData.targetAudience || !formData.communicationGoal) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const optimizedContent = await gemini.optimizeVoiceTone(
        formData.content,
        formData.targetAudience,
        formData.communicationGoal
      );
      
      setResult(optimizedContent);
      setCopied(false);
    } catch (err) {
      console.error('Error optimizing voice tone:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while optimizing the voice tone');
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

  // Common communication goals
  const communicationGoals = [
    { value: 'persuasion', label: 'Persuasion - Convince the audience' },
    { value: 'informational', label: 'Informational - Educate the audience' },
    { value: 'relationship_building', label: 'Relationship Building - Build trust and rapport' },
    { value: 'problem_solving', label: 'Problem Solving - Address concerns or issues' },
    { value: 'inspirational', label: 'Inspirational - Motivate or encourage action' }
  ];
  
  // Target audience suggestions
  const audienceSuggestions = [
    'C-level executives',
    'IT professionals',
    'Small business owners',
    'Marketing directors',
    'Financial analysts',
    'Healthcare administrators',
    'HR managers',
    'Operations managers'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <div className="flex items-start">
          <Volume2 className="text-purple-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-purple-800">Voice Tone Optimizer</h3>
            <p className="text-sm text-purple-700 mt-1">
              Perfect your communication tone for different audiences and purposes. Get enhanced messaging that resonates with your specific audience.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Optimizing your message tone..."
        resultTitle="Optimized Communication"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content to Optimize
            </label>
            <textarea
              name="content"
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter the message or content you want to optimize"
              value={formData.content}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <User className="h-4 w-4 mr-1 text-gray-500" />
              Target Audience
            </label>
            <div className="relative">
              <input
                list="audience-options"
                name="targetAudience"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., C-level executives, technical professionals, etc."
                value={formData.targetAudience}
                onChange={handleChange}
                required
              />
              <datalist id="audience-options">
                {audienceSuggestions.map((option, index) => (
                  <option key={index} value={option} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <MessageCircle className="h-4 w-4 mr-1 text-gray-500" />
              Communication Goal
            </label>
            <select
              name="communicationGoal"
              value={formData.communicationGoal}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              required
            >
              {communicationGoals.map(goal => (
                <option key={goal.value} value={goal.value}>{goal.label}</option>
              ))}
            </select>
          </div>
            
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.content.trim() || !formData.targetAudience.trim()}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Volume2 size={18} className="mr-2" />
                  Optimize Tone
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
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceToneOptimizerContent;