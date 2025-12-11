import { useState, createElement } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEnhancedGemini } from '../../services/enhancedGeminiService';
import { aiUsageTracker } from '../../services/aiUsageTracker';
import { Brain, Loader2, MessageSquare, TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle } from 'lucide-react';

interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  analysis: string;
  timestamp: string;
}

const sampleTexts = [
  "I absolutely love this product! It has exceeded all my expectations and the customer service is outstanding.",
  "The service was okay, nothing special but not terrible either. Could use some improvements.",
  "This is the worst experience I've ever had. The product doesn't work and support is unresponsive.",
  "Your team was incredibly helpful during the implementation. Everything went smoothly and we're seeing great results!",
  "I'm having some issues with the software crashing. It's frustrating because it happens during important meetings."
];

export default function SentimentAnalysis() {
  const { isDark } = useTheme();
  const { analyzeSentiment } = useEnhancedGemini();
  
  const [inputText, setInputText] = useState<string>('');
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setSuccess(false);
    
    const startTime = Date.now();

    try {
      const result = await analyzeSentiment(inputText);
      setSentimentResult(result);
      setSuccess(true);

      // Track usage
      await aiUsageTracker.trackUsage({
        toolId: 'sentiment-analysis',
        toolName: 'Sentiment Analysis',
        category: 'Advanced Analytics',
        executionTime: Date.now() - startTime,
        success: true,
        customerId: 'current-user'
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze sentiment';
      setError(errorMsg);
      
      // Track failed usage
      await aiUsageTracker.trackUsage({
        toolId: 'sentiment-analysis',
        toolName: 'Sentiment Analysis',
        category: 'Advanced Analytics',
        executionTime: Date.now() - startTime,
        success: false,
        error: errorMsg,
        customerId: 'current-user'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSampleText = (text: string) => {
    setInputText(text);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      case 'neutral': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return TrendingUp;
      case 'negative': return TrendingDown;
      case 'neutral': return Minus;
      default: return Minus;
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-200';
      case 'negative': return isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200';
      case 'neutral': return isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';
      default: return isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.2) return 'text-green-500';
    if (score < -0.2) return 'text-red-500';
    return 'text-gray-500';
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mr-4">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Sentiment Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze the emotional tone and sentiment of any text
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-6">Text Analysis</h2>
          
          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Text to Analyze *</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className={`w-full p-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
              placeholder="Enter text to analyze sentiment (emails, reviews, feedback, social media posts, etc.)"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {inputText.length} characters
              </span>
              {inputText.length > 0 && (
                <button
                  onClick={() => setInputText('')}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Sample Texts */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Try Sample Texts</label>
            <div className="space-y-2">
              {sampleTexts.map((text, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleText(text)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    isDark 
                      ? 'border-gray-600 hover:border-gray-500 bg-gray-700 hover:bg-gray-600' 
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm line-clamp-2">{text}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Sentiment...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Analyze Sentiment
              </>
            )}
          </button>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">Sentiment analysis completed!</span>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Analysis Results</h2>
            {sentimentResult && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Brain className="w-4 h-4 mr-1" />
                {new Date(sentimentResult.timestamp).toLocaleDateString()}
              </div>
            )}
          </div>

          {sentimentResult ? (
            <div className="space-y-6">
              {/* Sentiment Overview */}
              <div className={`p-4 rounded-lg border ${getSentimentBg(sentimentResult.sentiment)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {createElement(getSentimentIcon(sentimentResult.sentiment), { 
                      className: `w-6 h-6 mr-2 ${getSentimentColor(sentimentResult.sentiment)}` 
                    })}
                    <span className={`text-lg font-semibold capitalize ${getSentimentColor(sentimentResult.sentiment)}`}>
                      {sentimentResult.sentiment}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(sentimentResult.score)}`}>
                      {formatScore(sentimentResult.score)}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                </div>
                
                {/* Score Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        sentimentResult.sentiment === 'positive' ? 'bg-green-500' :
                        sentimentResult.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${Math.abs(sentimentResult.score) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Negative</span>
                    <span>Neutral</span>
                    <span>Positive</span>
                  </div>
                </div>
              </div>

              {/* Original Text */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Analyzed Text
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-sm`}>
                  "{sentimentResult.text}"
                </div>
              </div>

              {/* Detailed Analysis */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  Detailed Analysis
                </h3>
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                } max-h-64 overflow-y-auto`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {sentimentResult.analysis}
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-200'} border`}>
                  <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Key Indicators</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {sentimentResult.sentiment === 'positive' ? 'Positive language, satisfaction' :
                     sentimentResult.sentiment === 'negative' ? 'Critical tone, concerns' : 'Balanced, neutral tone'}
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/20 border-purple-500' : 'bg-purple-50 border-purple-200'} border`}>
                  <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">Recommendation</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    {sentimentResult.sentiment === 'positive' ? 'Maintain current approach' :
                     sentimentResult.sentiment === 'negative' ? 'Address concerns promptly' : 'Monitor for changes'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
              isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
            }`}>
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Your sentiment analysis will appear here</p>
              <p className="text-sm mt-2">Enter text and click analyze to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
