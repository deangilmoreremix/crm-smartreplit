import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Mail,
  Brain,
  Lightbulb,
  Target,
  Send,
  Copy,
  RefreshCw,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { generateAI } from '../../services/aiGenerate';

const ReasoningEmailGenerator: React.FC = () => {
  const { isDark } = useTheme();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEmail = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Strict JSON Schema so the result always has this shape (no parsing fallbacks)
      const { data } = await generateAI({
        prompt: `Generate a professional email with detailed reasoning for: ${input}

Provide: a complete email with subject line; the reasoning (strategy, tone, psychology, structure);
suggestions for improvement; and your own 0-100 assessment of the email's sentiment, formality,
persuasiveness and clarity.`,
        schemaName: 'reasoning_email',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['email', 'reasoning', 'improvements', 'analytics'],
          properties: {
            email: { type: 'string' },
            reasoning: {
              type: 'object',
              additionalProperties: false,
              required: ['strategy', 'tone', 'psychology', 'structure'],
              properties: {
                strategy: { type: 'string' },
                tone: { type: 'string' },
                psychology: { type: 'string' },
                structure: { type: 'string' },
              },
            },
            improvements: { type: 'array', items: { type: 'string' } },
            analytics: {
              type: 'object',
              additionalProperties: false,
              required: ['sentiment', 'formality', 'persuasiveness', 'clarity'],
              properties: {
                sentiment: { type: 'integer' },
                formality: { type: 'integer' },
                persuasiveness: { type: 'integer' },
                clarity: { type: 'integer' },
              },
            },
          },
        },
        tier: 'advanced',
      });
      if (!data) throw new Error('The AI returned no email');
      setResult(data);
    } catch (err) {
      console.error('Error generating email:', err);
      setError(err instanceof Error ? err.message : 'Email generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={`p-8 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center mb-6">
        <Mail className={`h-8 w-8 mr-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          AI Email Generator
        </h2>
      </div>

      <div className="mb-6">
        <label
          htmlFor="email-input"
          className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Enter your prompt or topic:
        </label>
        <textarea
          id="email-input"
          rows={5}
          className={`w-full p-3 border rounded-lg focus:outline-none ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
              : 'border-gray-300 text-gray-900 focus:border-blue-500'
          }`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Write an email to schedule a meeting about Q3 marketing strategy"
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={generateEmail}
          disabled={isGenerating || !input.trim()}
          className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
            isGenerating || !input.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Generate Email
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          AI email generation unavailable: {error}
        </div>
      )}

      {result && (
        <div className={`mt-8 p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Generated Email:
          </h3>
          <div
            className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-auto`}
          >
            <pre className="whitespace-pre-wrap font-sans">{result.email}</pre>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => copyToClipboard(result.email)}
              className={`p-2 rounded-lg transition-colors ${
                copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Reasoning & Analysis:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.reasoning && (
                <div>
                  <h4 className={`font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    Reasoning:
                  </h4>
                  <ul className="list-disc list-inside space-y-2">
                    {Object.entries(result.reasoning).map(([key, value], index) => (
                      <li key={index} className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        <span className="font-semibold capitalize">{key.replace('_', ' ')}:</span>{' '}
                        {value as string}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.improvements && (
                <div>
                  <h4 className={`font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    Improvements:
                  </h4>
                  <ul className="list-disc list-inside space-y-2">
                    {result.improvements.map((improvement: string, index: number) => (
                      <li key={index} className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.analytics && (
                <div>
                  <h4 className={`font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    Analytics:
                  </h4>
                  <ul className="list-disc list-inside space-y-2">
                    {Object.entries(result.analytics).map(([key, value], index) => (
                      <li key={index} className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        <span className="font-semibold capitalize">{key.replace('_', ' ')}:</span>{' '}
                        {value as string}%
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReasoningEmailGenerator;
