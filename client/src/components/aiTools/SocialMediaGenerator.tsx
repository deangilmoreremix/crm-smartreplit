import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { enhancedGeminiService } from '../../services/enhancedGeminiService';
import { aiUsageTracker } from '../../services/aiUsageTracker';
import { Share2, Download, Copy, Check, RefreshCw, Hash, Target, TrendingUp } from 'lucide-react';

export default function SocialMediaGenerator() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<{
    platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
    topic: string;
    tone: 'professional' | 'casual' | 'engaging' | 'promotional';
    keywords: string;
    callToAction: string;
    variations: number;
  }>({
    platform: 'linkedin',
    topic: '',
    tone: 'professional',
    keywords: '',
    callToAction: '',
    variations: 3
  });
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const platforms = [
    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600' },
    { value: 'twitter', label: 'Twitter/X', color: 'bg-gray-800' },
    { value: 'facebook', label: 'Facebook', color: 'bg-blue-700' },
    { value: 'instagram', label: 'Instagram', color: 'bg-pink-600' }
  ];

  const tones = ['professional', 'casual', 'engaging', 'promotional'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePosts = async () => {
    if (!formData.topic.trim()) {
      alert('Please enter a topic for your post');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const keywords = formData.keywords 
        ? formData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : [];

      // Generate multiple variations
      const variations = [];
      for (let i = 0; i < 3; i++) {
        const variation = await enhancedGeminiService.generateSocialMediaPost({
          platform: formData.platform,
          topic: formData.topic,
          tone: formData.tone,
          keywords: keywords.length > 0 ? keywords : undefined,
          callToAction: formData.callToAction || undefined
        });
        variations.push({
          content: variation,
          id: i + 1,
          engagement: Math.floor(// TODO: Replace with real AI implementation * 100) + 50, // Mock engagement score
          readability: Math.floor(// TODO: Replace with real AI implementation * 20) + 80,  // Mock readability score
        });
      }

      setGeneratedPosts(variations);

      // Track usage
      aiUsageTracker.trackUsage({
        toolId: 'social-media-generator',
        toolName: 'Social Media Generator',
        category: 'Content',
        executionTime: Date.now() - startTime,
        success: true
      });
    } catch (error) {
      console.error('Error generating social media posts:', error);
      alert('Failed to generate posts. Please try again.');
      
      aiUsageTracker.trackUsage({
        toolId: 'social-media-generator',
        toolName: 'Social Media Generator',
        category: 'Content',
        executionTime: Date.now() - startTime,
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      // TODO: Replace with real AI implementation;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadPost = (post: any, index: number) => {
    const content = `
SOCIAL MEDIA POST - ${formData.platform.toUpperCase()}
Generated: ${new Date().toLocaleDateString()}
Platform: ${formData.platform}
Tone: ${formData.tone}

CONTENT:
${post.content}

HASHTAGS:
${post.hashtags?.join(' ') || 'No hashtags'}

CALL TO ACTION:
${post.callToAction || 'No call to action'}

PERFORMANCE METRICS:
Engagement Score: ${post.engagement}/100
Readability Score: ${post.readability}/100
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-post-${formData.platform}-${index + 1}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.value === platform);
    return platformData ? platformData.color : 'bg-gray-600';
  };

  const getCharacterLimit = (platform: string) => {
    switch (platform) {
      case 'twitter': return 280;
      case 'linkedin': return 3000;
      case 'facebook': return 63206;
      case 'instagram': return 2200;
      default: return 1000;
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex items-center">
          <Share2 className="w-6 h-6 mr-2 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold">Social Media Post Generator</h2>
        </div>
      </motion.div>

      {/* Configuration Form */}
      <motion.div 
        className={`p-4 sm:p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3 className="text-lg font-semibold mb-4">Post Configuration</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Platform Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <label className="block text-sm font-medium mb-2">Platform *</label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map(platform => (
                <button
                  key={platform.value}
                  onClick={() => handleInputChange('platform', platform.value)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 touch-manipulation ${
                    formData.platform === platform.value
                      ? `${platform.color} text-white border-transparent`
                      : isDark
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{platform.label}</div>
                  <div className="text-xs opacity-75">
                    {getCharacterLimit(platform.value)} chars
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium mb-2">Tone</label>
            <select
              value={formData.tone}
              onChange={(e) => handleInputChange('tone', e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              {tones.map(tone => (
                <option key={tone} value={tone}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium mb-2">Keywords (Optional)</label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              placeholder="Enter keywords separated by commas..."
              className={`w-full p-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Call to Action */}
          <div>
            <label className="block text-sm font-medium mb-2">Call to Action (Optional)</label>
            <input
              type="text"
              value={formData.callToAction}
              onChange={(e) => handleInputChange('callToAction', e.target.value)}
              placeholder="e.g., Visit our website, Book a meeting..."
              className={`w-full p-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>

        {/* Topic */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">Topic/Message *</label>
          <textarea
            value={formData.topic}
            onChange={(e) => handleInputChange('topic', e.target.value)}
            placeholder="Describe what you want to post about..."
            rows={3}
            className={`w-full p-3 rounded-lg border ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={generatePosts}
            disabled={isLoading || !formData.topic.trim()}
            className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Posts...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Posts
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Generated Posts */}
      {generatedPosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Posts</h3>
          {generatedPosts.map((post, index) => (
            <div key={index} className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg ${getPlatformIcon(formData.platform)} flex items-center justify-center mr-3`}>
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Post Variation {index + 1}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)} • {formData.tone}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(post.content, index)}
                    className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadPost(post, index)}
                    className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{post.engagement}/100</div>
                  <div className="text-xs text-gray-500">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{post.readability}/100</div>
                  <div className="text-xs text-gray-500">Readability</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{post.content?.length || 0}</div>
                  <div className="text-xs text-gray-500">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{post.hashtags?.length || 0}</div>
                  <div className="text-xs text-gray-500">Hashtags</div>
                </div>
              </div>

              {/* Post Content */}
              <div className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}>
                <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.hashtags.map((hashtag: string, hashIndex: number) => (
                      <span
                        key={hashIndex}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                      >
                        <Hash className="w-3 h-3 mr-1" />
                        {hashtag}
                      </span>
                    ))}
                  </div>
                )}

                {post.callToAction && (
                  <div className={`p-3 rounded border-l-4 border-blue-500 ${
                    isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                  }`}>
                    <div className="flex items-center mb-1">
                      <Target className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">Call to Action</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{post.callToAction}</p>
                  </div>
                )}
              </div>

              {/* Character Count Warning */}
              {post.content && post.content.length > getCharacterLimit(formData.platform) && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center text-red-700 dark:text-red-300">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      Content exceeds {formData.platform} character limit ({post.content.length}/{getCharacterLimit(formData.platform)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}