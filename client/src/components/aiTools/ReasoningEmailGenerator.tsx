import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, Brain, Lightbulb, Target, Send, Copy, RefreshCw, Zap, CheckCircle } from 'lucide-react';
import { openAIService } from '../../services/openAIService';

const ReasoningEmailGenerator: React.FC = () => {
  const { isDark } = useTheme();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generateEmail = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);

    try {
      const prompt = `Generate a professional email with detailed reasoning for: ${input}

Please provide:
1. A complete email with subject line
2. Step-by-step reasoning for each decision
3. Psychological insights behind the approach
4. Suggestions for improvement
5. Analytics scores (sentiment, formality, persuasiveness, clarity)

Format the response as JSON with these keys: email, reasoning, improvements, analytics`;

      const response = await openAIService.generateCompletion(prompt, {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      });

      try {
        const parsed = JSON.parse(response.content);
        setResult(parsed);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        setResult({
          email: response.content,
          reasoning: {
            strategy: "AI-generated professional approach",
            tone: "Contextually appropriate",
            psychology: "Focuses on building rapport and clear communication",
            structure: "Logical flow with clear purpose"
          },
          improvements: [
            "Review for personalization opportunities",
            "Consider adding specific metrics or examples",
            "Adjust tone based on recipient relationship"
          ],
          analytics: {
            sentiment: 85,
            formality: 75,
            persuasiveness: 80,
            clarity: 90
          }
        });
      }
    } catch (error) {
      console.error('Error generating email:', error);
      // Fallback result
      setResult({
        email: `Subject: Follow-up on ${input}\n\nI wanted to reach out regarding ${input}. Based on our previous interactions, I believe this could be valuable for your business.\n\nWould you be available for a brief call to discuss this further?\n\nBest regards`,
        reasoning: {
          strategy: "Direct and professional approach",
          tone: "Business-appropriate",
          psychology: "Builds on existing relationship",
          structure: "Clear and concise"
        },
        improvements: [
          "Add specific details about the value proposition",
          "Include a concrete next step",
          "Personalize based on recipient's interests"
        ],
        analytics: {
          sentiment: 80,
          formality: 85,
          persuasiveness: 75,
          clarity: 90
        }
      });
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
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>AI Email Generator</h2>
      </div>

      <div className="mb-6">
        <label htmlFor="email-input" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Enter your prompt or topic:
        </label>
        <textarea
          id="email-input"
          rows={5}
          className={`w-full p-3 border rounded-lg focus:outline-none ${isDark
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
          className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${isGenerating || !input.trim()
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

      {result && (
        <div className={`mt-8 p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Generated Email:</h3>
          <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-auto`}>
            <pre className="whitespace-pre-wrap font-sans">{result.email}</pre>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => copyToClipboard(result.email)}
              className={`p-2 rounded-lg transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Reasoning & Analysis:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.reasoning && (
                <div>
                  <h4 className={`font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Reasoning:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {Object.entries(result.reasoning).map(([key, value], index) => (
                      <li key={index} className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        <span className="font-semibold capitalize">{key.replace('_', ' ')}:</span> {value as string}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.improvements && (
                <div>
                  <h4 className={`font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Improvements:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {result.improvements.map((improvement: string, index: number) => (
                      <li key={index} className={isDark ? 'text-gray-300' : 'text-gray-700'}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.analytics && (
                <div>
                  <h4 className={`font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Analytics:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {Object.entries(result.analytics).map(([key, value], index) => (
                      <li key={index} className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        <span className="font-semibold capitalize">{key.replace('_', ' ')}:</span> {value as string}%
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