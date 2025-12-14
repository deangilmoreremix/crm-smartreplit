// import { supabase } from '../../services/supabaseClient'; // Not available
// import { sendGmailEmail } from '../../services/composioService'; // Not available
import React, { useState } from 'react';
// import * as edgeFunctionService from '../../services/edgeFunctionService'; // Not available
import openAIService from '../../services/openAIService';
import AIToolContent from '../shared/AIToolContent';
import { Mail, User, Building, RefreshCw, Copy, FileText, Send } from 'lucide-react';
import Select from 'react-select';
const logEmailToLead = async ({
  leadId,
  summary,
  content,
}: {
  leadId: string;
  summary: string;
  content: string;
}) => {
  // TODO: Implement lead communication logging when database is available
  console.log('Email logged for lead:', { leadId, summary, content });
};

const EmailComposerContent: React.FC = () => {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPosition: '',
    recipientCompany: '',
    emailPurpose: '',
    additionalContext: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Using server-side OpenAI service

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.emailPurpose) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const contactInfo = {
        name: formData.recipientName,
        position: formData.recipientPosition,
        company: formData.recipientCompany
      };
      
      const prompt = `Generate a professional email draft with the following details:
        Recipient: ${formData.recipientName} ${formData.recipientPosition ? `(${formData.recipientPosition})` : ''}
        Company: ${formData.recipientCompany}
        Purpose: ${formData.emailPurpose}
        Additional Context: ${formData.additionalContext}
        
        Please create a complete email with subject line, greeting, body, and professional closing.`;
      
      const emailDraft = await openAIService.generateEmail({
        recipient: formData.recipientName,
        purpose: formData.emailPurpose,
        context: formData.additionalContext
      });
      
      setResult(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
      setCopied(false);
    } catch (err) {
      console.error('Error generating email:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      // TODO: Replace with real AI implementation;
    }
  };

  // Common email purposes for quick selection
  const emailPurposes = [
    'Introduction',
    'Follow-up after meeting',
    'Proposal follow-up',
    'Check-in',
    'Product update',
    'Scheduling a meeting',
    'Addressing concerns',
    'Re-engagement',
    'Request for feedback',
    'Custom...'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Mail className="text-blue-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-blue-800">Smart Email Composer</h3>
            <p className="text-sm text-blue-700 mt-1">
              Generate personalized, professional emails for your contacts with just a few details. Perfect for introductions, follow-ups, and more.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Composing your email..."
        resultTitle="Generated Email"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 mr-1 text-gray-500" />
                Recipient Name
              </label>
              <input
                name="recipientName"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. John Smith"
                value={formData.recipientName}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Building className="h-4 w-4 mr-1 text-gray-500" />
                Recipient Company
              </label>
              <input
                name="recipientCompany"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Acme Corp"
                value={formData.recipientCompany}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4 mr-1 text-gray-500" />
              Recipient Position (Optional)
            </label>
            <input
              name="recipientPosition"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. CTO"
              value={formData.recipientPosition}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Purpose
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
              {emailPurposes.map((purpose, index) => (
                <button
                  key={index}
                  type="button"
                  className={`text-xs p-2 border rounded-md transition-colors ${
                    formData.emailPurpose === purpose && purpose !== 'Custom...'
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (purpose !== 'Custom...') {
                      setFormData({...formData, emailPurpose: purpose});
                    }
                  }}
                >
                  {purpose}
                </button>
              ))}
            </div>
            
            <textarea
              name="emailPurpose"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the purpose of your email (e.g., follow up on recent meeting, introduce new features, etc.)"
              value={formData.emailPurpose}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Context (Optional)
            </label>
            <textarea
              name="additionalContext"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any specific details you want to include in the email"
              value={formData.additionalContext}
              onChange={handleChange}
            ></textarea>
          </div>
            
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.emailPurpose.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Composing...
                </>
              ) : (
                <>
                  <Mail size={18} className="mr-2" />
                  Generate Email
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
                  <CheckIcon size={16} className="mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-1" />
                  Copy to Clipboard
                </>
              )}
            </button>
            <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              <Send size={16} className="mr-1" />
              Send Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// CheckIcon component
const CheckIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

export default EmailComposerContent;