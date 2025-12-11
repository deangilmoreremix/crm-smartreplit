import React, { useState, useEffect, useRef } from 'react';
import { useGemini } from '../../services/geminiService';
import { Send, RefreshCw, CheckCircle, AlertCircle, Sparkles, Copy, Check, Mail, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailSuggestion {
  type: 'subject' | 'greeting' | 'body' | 'closing';
  text: string;
}

const RealTimeEmailComposer: React.FC = () => {
  const gemini = useGemini();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emailContext, setEmailContext] = useState('sales follow-up');
  const [sentiment, setSentiment] = useState<{score: number; emotions: string[]}>(
    {score: 0, emotions: []}
  );
  const [copied, setCopied] = useState(false);
  
  // Refs to track typing and implement debounce
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisRef = useRef('');
  
  // Context options for different email types
  const contextOptions = [
    { value: 'sales follow-up', label: 'Sales Follow-up' },
    { value: 'meeting request', label: 'Meeting Request' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'cold outreach', label: 'Cold Outreach' },
    { value: 'thank you', label: 'Thank You' }
  ];

  // Analyze email content and provide real-time suggestions
  const analyzeEmailContent = async (emailContent: string) => {
    if (emailContent.trim() === lastAnalysisRef.current || emailContent.length < 5) return;
    
    setIsAnalyzing(true);
    lastAnalysisRef.current = emailContent.trim();
    
    try {
      // Get suggestions based on email content
      const analysisPrompt = `
        Analyze this email text and suggest improvements:
        
        Email Context: ${emailContext}
        Email Content: "${emailContent}"
        
        Format response as strict JSON array with "type" and "text" properties only:
        [{type: "subject|greeting|body|closing", text: "suggested text"}]
        
        Limit to 2 suggestions max.
      `;

      // Generate suggestions
      const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Try to parse the response as JSON
      try {
        // Extract the JSON part if needed
        const jsonText = responseText.includes('[') 
          ? responseText.substring(responseText.indexOf('['), responseText.lastIndexOf(']') + 1)
          : responseText;
        
        const parsedSuggestions = JSON.parse(jsonText);
        if (Array.isArray(parsedSuggestions)) {
          setSuggestions(parsedSuggestions);
        }
      } catch (e) {
        console.error("Failed to parse suggestions:", e);
      }
      
      // Analyze sentiment (separate call for better results)
      if (emailContent.length > 20) {
        try {
          const sentimentResult = await gemini.analyzeSentimentRealTime(emailContent);
          setSentiment({
            score: sentimentResult.sentiment,
            emotions: sentimentResult.emotions.slice(0, 2) // Limit to top 2 emotions
          });
        } catch (e) {
          console.error("Error analyzing sentiment:", e);
        }
      }
    } catch (error) {
      console.error("Error analyzing email:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Use debounce to avoid too many API calls while typing
  useEffect(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    if (emailBody.length > 5) {
      typingTimerRef.current = setTimeout(() => {
        analyzeEmailContent(emailBody);
      }, 800);
    }
    
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [emailBody, emailContext]);

  // Apply suggestion to the email
  const applySuggestion = (suggestion: EmailSuggestion) => {
    switch (suggestion.type) {
      case 'subject':
        setSubject(suggestion.text);
        break;
      case 'greeting':
        // Insert greeting at the beginning
        setEmailBody(prevBody => {
          const lines = prevBody.split('\n');
          lines[0] = suggestion.text;
          return lines.join('\n');
        });
        break;
      case 'body':
        // Replace a portion of the body or append
        setEmailBody(prevBody => {
          return suggestion.text;
        });
        break;
      case 'closing':
        // Append closing to the end
        setEmailBody(prevBody => {
          const bodyWithoutClosing = prevBody.replace(/(?:Regards|Sincerely|Best|Thanks|Thank you)[\s\S]*$/, '').trim();
          return `${bodyWithoutClosing}\n\n${suggestion.text}`;
        });
        break;
    }
    
    // Remove the used suggestion
    setSuggestions(prev => prev.filter(s => s.text !== suggestion.text));
  };

  // Format sentiment score as a color and descriptor
  const getSentimentColor = () => {
    if (sentiment.score > 0.5) return 'text-green-600';
    if (sentiment.score > 0) return 'text-blue-600';
    if (sentiment.score > -0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentDescription = () => {
    if (sentiment.score > 0.5) return 'Very Positive';
    if (sentiment.score > 0) return 'Positive';
    if (sentiment.score > -0.5) return 'Neutral';
    if (sentiment.score > -0.7) return 'Negative';
    return 'Very Negative';
  };

  // Copy email to clipboard
  const copyToClipboard = () => {
    const fullEmail = `To: ${to}\nSubject: ${subject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Mail size={20} className="text-blue-600 mr-2" />
            Real-time Email Composer
          </h3>
          <div>
            <select 
              value={emailContext}
              onChange={(e) => setEmailContext(e.target.value)}
              className="text-sm border border-gray-300 rounded-md py-1 px-2 bg-white"
            >
              {contextOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <div className="flex items-center">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject line"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Hash 
                size={16} 
                className={`absolute right-3 ${subject.length > 5 ? 'text-green-500' : 'text-gray-400'}`} 
                title={subject.length > 5 ? "Good subject length" : "Subject line too short"}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
            <div className="relative">
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Compose your email..."
                rows={8}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-7"
              ></textarea>
              {isAnalyzing && (
                <div className="absolute right-3 top-3">
                  <RefreshCw size={16} className="text-blue-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Real-time Suggestions */}
        {suggestions.length > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4"
            >
              <div className="flex items-center mb-2">
                <Sparkles size={16} className="text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-blue-900">AI Suggestions</h4>
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <motion.div 
                    key={`${suggestion.type}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start bg-white p-2 rounded border border-blue-100"
                  >
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="p-1.5 bg-blue-100 rounded-full text-blue-700 hover:bg-blue-200 mr-2 flex-shrink-0"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <div>
                      <div className="text-xs text-blue-700 font-medium">
                        {suggestion.type === 'subject' ? 'Subject Line' : 
                         suggestion.type === 'greeting' ? 'Greeting' :
                         suggestion.type === 'closing' ? 'Closing' : 'Content'}
                      </div>
                      <p className="text-sm text-gray-800">{suggestion.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Sentiment Analysis */}
        {(sentiment.score !== 0 || sentiment.emotions.length > 0) && emailBody.length > 20 && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Email Tone Analysis</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center">
                <div className="text-sm font-medium mr-2">Tone:</div>
                <div className={`text-sm ${getSentimentColor()}`}>
                  {getSentimentDescription()}
                </div>
              </div>
              
              {sentiment.emotions.length > 0 && (
                <div className="flex items-center">
                  <div className="text-sm font-medium mr-2">Emotions:</div>
                  <div className="flex space-x-1">
                    {sentiment.emotions.map((emotion, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={copyToClipboard}
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
                Copy Email
              </>
            )}
          </button>
          
          <button
            disabled={!to || !subject || !emailBody.trim()}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <Send size={16} className="mr-1" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealTimeEmailComposer;