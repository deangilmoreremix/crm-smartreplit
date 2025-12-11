import React, { useState } from 'react';
import { useGemini } from '../../services/geminiService';
import AIToolContent from '../shared/AIToolContent';
import { Mail, Reply, User, Briefcase, RefreshCw, Copy, Check } from 'lucide-react';

const EmailResponseContent: React.FC = () => {
  const [formData, setFormData] = useState({
    originalEmail: '',
    contactName: '',
    contactPosition: '',
    contactCompany: '',
    dealContext: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const gemini = useGemini();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.originalEmail.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const contactInfo = {
        name: formData.contactName,
        position: formData.contactPosition,
        company: formData.contactCompany
      };
      
      const emailResponse = await gemini.generateEmailResponse(
        formData.originalEmail,
        contactInfo,
        formData.dealContext
      );
      
      setResult(emailResponse);
      setCopied(false);
    } catch (err) {
      console.error('Error generating email response:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the email response');
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

  return (
    <div className="space-y-6">
      <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
        <div className="flex items-start">
          <Reply className="text-teal-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-teal-800">Smart Email Response Generator</h3>
            <p className="text-sm text-teal-700 mt-1">
              Quickly generate personalized, effective responses to customer and prospect emails. Save time while maintaining the personal touch.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Crafting your response..."
        resultTitle="Generated Email Response"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Email to Respond To
            </label>
            <textarea
              name="originalEmail"
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              placeholder="Paste the email you need to respond to here..."
              value={formData.originalEmail}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 mr-1 text-gray-500" />
                Contact Name (Optional)
              </label>
              <input
                name="contactName"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. John Smith"
                value={formData.contactName}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                Company (Optional)
              </label>
              <input
                name="contactCompany"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. Acme Corp"
                value={formData.contactCompany}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 mr-1 text-gray-500" />
                Position (Optional)
              </label>
              <input
                name="contactPosition"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g. CTO"
                value={formData.contactPosition}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal/Relationship Context (Optional)
            </label>
            <textarea
              name="dealContext"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              placeholder="Provide any context about the deal or relationship (e.g., 'They're evaluating our solution', 'Long-term customer considering upgrade')"
              value={formData.dealContext}
              onChange={handleChange}
            ></textarea>
          </div>
            
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.originalEmail.trim()}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Mail size={18} className="mr-2" />
                  Generate Response
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

export default EmailResponseContent;