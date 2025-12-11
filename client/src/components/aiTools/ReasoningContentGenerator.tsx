import React, { useState } from 'react';
import { useOpenAI } from '../../services/openaiLegacyService';
import AIToolContent from '../shared/AIToolContent';
import { 
  Brain, 
  FileText, 
  RefreshCw, 
  Copy, 
  Check, 
  Target, 
  Users, 
  MessageSquare,
  Sparkles,
  Zap,
  Mail,
  Phone,
  Shield,
  Hash
} from 'lucide-react';

interface ReasoningContentGeneratorProps {
  contentType?: 'email' | 'proposal' | 'script' | 'objection' | 'social';
}

const ReasoningContentGenerator: React.FC<ReasoningContentGeneratorProps> = ({ 
  contentType = 'email' 
}) => {
  const openai = useOpenAI();
  
  const [formData, setFormData] = useState({
    audience: '',
    context: '',
    objective: '',
    constraints: '',
    previousCommunication: '',
    tone: 'professional'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reasoningVisible, setReasoningVisible] = useState(false);
  const [reasoningInsights, setReasoningInsights] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.audience || !formData.objective) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Get the content title based on type
      const contentTitle = getContentTitle();
      
      // Generate reasoning insights first
      const reasoningPrompt = `
        You are an expert AI reasoning engine for ${contentTitle} creation.
        
        Analyze the following context and provide strategic reasoning about how to create the most effective content:
        
        Audience: ${formData.audience}
        Objective: ${formData.objective}
        Context: ${formData.context}
        Constraints: ${formData.constraints}
        Previous Communication: ${formData.previousCommunication}
        Tone: ${formData.tone}
        
        Provide your strategic reasoning about:
        1. Key audience motivations and pain points
        2. Psychological triggers that would be effective
        3. Content structure recommendations
        4. Tone and language considerations
        5. Specific persuasion techniques to employ
        6. Potential objections to address
        7. Call-to-action strategy
        
        Format your response as a strategic analysis that would help a sales or marketing professional understand the reasoning behind the content creation approach.
      `;
      
      const reasoningText = await openai.generateReasoning(reasoningPrompt);
      setReasoningInsights(reasoningText);
      
      // Now generate the actual content using the reasoning insights
      const contentPrompt = `
        You are an expert ${contentTitle} creator.
        
        Based on the following information and strategic reasoning, create a highly effective ${contentType}:
        
        Audience: ${formData.audience}
        Objective: ${formData.objective}
        Context: ${formData.context}
        Constraints: ${formData.constraints}
        Previous Communication: ${formData.previousCommunication}
        Tone: ${formData.tone}
        
        Strategic Reasoning:
        ${reasoningText}
        
        Now, create the ${contentType} content that implements this strategic reasoning. The content should be ready to use without further editing.
        
        ${getContentSpecificInstructions()}
      `;
      
      const contentText = await openai.generateScript(contentPrompt);
      
      setResult(contentText);
      setCopied(false);
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating content');
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
  
  const getContentTitle = () => {
    switch(contentType) {
      case 'email': return 'Email';
      case 'proposal': return 'Sales Proposal';
      case 'script': return 'Call Script';
      case 'objection': return 'Objection Handler';
      case 'social': return 'Social Media Content';
      default: return 'Content';
    }
  };
  
  const getContentSpecificInstructions = () => {
    switch(contentType) {
      case 'email':
        return 'Include a subject line, greeting, body, and signature. Make it concise but persuasive.';
      case 'proposal':
        return 'Include an executive summary, understanding of needs, proposed solution, pricing options, timeline, and next steps.';
      case 'script':
        return 'Include an introduction, key talking points, questions to ask, objection handling, and closing.';
      case 'objection':
        return 'Structure the response with acknowledgment, reframing, evidence, and redirection to value.';
      case 'social':
        return 'Create engaging, platform-appropriate content with hooks, hashtags, and clear calls to action.';
      default:
        return '';
    }
  };
  
  const getContentIcon = () => {
    switch(contentType) {
      case 'email': return <Mail className="h-6 w-6 text-blue-600" />;
      case 'proposal': return <FileText className="h-6 w-6 text-purple-600" />;
      case 'script': return <MessageSquare className="h-6 w-6 text-green-600" />;
      case 'objection': return <Shield className="h-6 w-6 text-red-600" />;
      case 'social': return <Hash className="h-6 w-6 text-cyan-600" />;
      default: return <FileText className="h-6 w-6 text-blue-600" />;
    }
  };
  
  // Tone options
  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'persuasive', label: 'Persuasive' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'empathetic', label: 'Empathetic' },
    { value: 'authoritative', label: 'Authoritative' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
        <div className="flex items-start">
          <Brain className="text-purple-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-purple-800">{getContentTitle()} Generator with AI Reasoning</h3>
            <p className="text-sm text-purple-700 mt-1">
              Create highly effective {contentType} content using our advanced AI reasoning engine that understands context, audience, and strategic objectives.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage={`Generating your ${contentType}...`}
        resultTitle={`Generated ${getContentTitle()}`}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Users className="h-4 w-4 mr-1 text-gray-500" />
              Target Audience
            </label>
            <textarea
              name="audience"
              rows={2}
              value={formData.audience}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="Describe your audience (e.g., 'IT decision-makers at enterprise companies with 1000+ employees')"
              required
            ></textarea>
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Target className="h-4 w-4 mr-1 text-gray-500" />
              Objective
            </label>
            <textarea
              name="objective"
              rows={2}
              value={formData.objective}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="What do you want to achieve? (e.g., 'Schedule a product demo call', 'Get approval on the proposal')"
              required
            ></textarea>
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4 mr-1 text-gray-500" />
              Context
            </label>
            <textarea
              name="context"
              rows={3}
              value={formData.context}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="Provide relevant context about your product/service, the current situation, and any specific details that would help create better content"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
                Previous Communication (Optional)
              </label>
              <textarea
                name="previousCommunication"
                rows={3}
                value={formData.previousCommunication}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="Summarize any previous communications or interactions"
              ></textarea>
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 mr-1 text-gray-500" />
                Constraints (Optional)
              </label>
              <textarea
                name="constraints"
                rows={3}
                value={formData.constraints}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="Any limitations or specific requirements (e.g., 'Must be under 300 words', 'Cannot mention pricing')"
              ></textarea>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tone
            </label>
            <select
              name="tone"
              value={formData.tone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            >
              {toneOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
            
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.audience || !formData.objective}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain size={18} className="mr-2" />
                  Generate with AI Reasoning
                </>
              )}
            </button>
          </div>
        </form>
      </AIToolContent>

      {result && !isLoading && !error && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <button 
              onClick={() => setReasoningVisible(!reasoningVisible)}
              className="flex items-center text-purple-600 hover:text-purple-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              {reasoningVisible ? 'Hide AI Reasoning' : 'Show AI Reasoning'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              {copied ? <Check className="h-4 w-4 mr-1 text-green-600" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied!' : 'Copy Result'}
            </button>
          </div>
          
          {reasoningVisible && reasoningInsights && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Strategic Reasoning
              </h4>
              <div className="text-sm text-purple-700 whitespace-pre-wrap">
                {reasoningInsights}
              </div>
            </div>
          )}
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              {getContentIcon()}
              <span className="ml-2">Generated {getContentTitle()}</span>
            </h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReasoningContentGenerator;