import React, { useState, useEffect } from 'react';
import { useGemini } from '../../services/geminiService';
import { MessageSquare, Copy, RefreshCw, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResponseTemplate {
  id: string;
  title: string;
  purpose: string;
  prompt: string;
}

const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'follow-up',
    title: 'Follow-up Email',
    purpose: 'Send a follow-up after no response',
    prompt: 'Write a brief follow-up email for {{contact}} who has not responded to my previous message about {{topic}}.'
  },
  {
    id: 'thank-you',
    title: 'Thank You Note',
    purpose: 'Thank a client after a meeting',
    prompt: 'Write a thank you note to {{contact}} following our meeting about {{topic}}.'
  },
  {
    id: 'objection',
    title: 'Handle Objection',
    purpose: 'Respond to a common objection',
    prompt: 'Create a response to {{contact}} who raised the following objection: "{{topic}}".'
  },
  {
    id: 'proposal',
    title: 'Proposal Summary',
    purpose: 'Summarize a proposal',
    prompt: 'Write a brief summary of our proposal for {{contact}} regarding {{topic}}.'
  },
  {
    id: 'check-in',
    title: 'Check-In Message',
    purpose: 'Friendly check-in with a prospect',
    prompt: 'Write a friendly check-in message to {{contact}} to see how they\'re doing with {{topic}}.'
  }
];

const InstantAIResponseGenerator: React.FC = () => {
  const gemini = useGemini();
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);
  const [contactName, setContactName] = useState('');
  const [topic, setTopic] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Generate response using Gemini 2.5 Flash for instant results
  const generateResponse = async () => {
    if (!selectedTemplate || !contactName || !topic) return;
    
    setIsGenerating(true);
    
    try {
      // Replace template variables with actual values
      const promptWithValues = selectedTemplate.prompt
        .replace('{{contact}}', contactName)
        .replace('{{topic}}', topic);
      
      // Enhanced prompt for better results
      const fullPrompt = `${promptWithValues}
      
      Context:
      - This is for a professional sales context
      - Be concise but personable
      - Include a clear call to action
      - Sound natural and conversational
      - Limit to 3-4 sentences maximum`;
      
      const result = await gemini.generateQuickContent('email', fullPrompt, 'short');
      setGeneratedResponse(result);
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  // Generate response when inputs change (with debounce)
  useEffect(() => {
    if (selectedTemplate && contactName && topic) {
      const timer = setTimeout(() => {
        generateResponse();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedTemplate, contactName, topic]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-teal-50 to-blue-50">
        <h3 className="text-lg font-semibold flex items-center">
          <Sparkles size={20} className="text-teal-600 mr-2" />
          Instant Response Generator
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Generate professional responses in seconds using Gemini 2.5 Flash
        </p>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Response Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RESPONSE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`text-sm p-2 rounded-md flex flex-col items-center justify-center h-24 transition-colors ${
                  selectedTemplate?.id === template.id 
                    ? 'bg-teal-50 border-2 border-teal-500 text-teal-700' 
                    : 'border border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <MessageSquare size={18} className={`mb-2 ${
                  selectedTemplate?.id === template.id ? 'text-teal-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${selectedTemplate?.id === template.id ? 'text-teal-700' : 'text-gray-700'}`}>{template.title}</span>
                <span className="text-xs text-gray-500 mt-1">{template.purpose}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Variables */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g. John Smith"
                  />
                </div>
                
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                    Topic / Context
                  </label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g. our product demo, pricing concerns"
                  />
                </div>
              </div>
              
              <AnimatePresence>
                {generatedResponse && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center">
                        <Sparkles size={16} className="text-teal-600 mr-1.5" />
                        Generated Response
                      </h4>
                      <button 
                        onClick={copyToClipboard}
                        className={`text-xs px-2 py-1 rounded flex items-center transition-colors ${
                          isCopied 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check size={12} className="mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} className="mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-line">
                      {generatedResponse}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {isGenerating && !generatedResponse && (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw size={20} className="text-teal-600 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Generating response...</span>
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={generateResponse}
                  disabled={!selectedTemplate || !contactName || !topic || isGenerating}
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                    !selectedTemplate || !contactName || !topic || isGenerating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Regenerate
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InstantAIResponseGenerator;