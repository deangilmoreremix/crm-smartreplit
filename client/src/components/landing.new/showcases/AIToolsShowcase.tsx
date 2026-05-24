import React, { useState } from 'react';
import {
  Brain, Mail, MessageSquare, Calendar, FileText, Image, Video, Phone,
  BarChart3, TrendingUp, Users, Target, DollarSign, Sparkles, Search,
  Zap, Eye, Mic, Send, Code, Palette, Megaphone, Settings, Workflow,
  ChevronRight, ChevronDown, ChevronUp, Check, Star, ArrowRight
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface AITool {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  category: string;
  description: string;
  rating: number;
}

const AIToolsShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Tools', count: 68 },
    { id: 'communication', label: 'Communication', count: 12 },
    { id: 'sales', label: 'Sales', count: 14 },
    { id: 'content', label: 'Content', count: 10 },
    { id: 'analytics', label: 'Analytics', count: 8 },
    { id: 'automation', label: 'Automation', count: 12 },
    { id: 'assistant', label: 'Assistants', count: 12 },
  ];

  const tools: AITool[] = [
    // Communication
    { id: 'smart-email', name: 'Smart Email Composer', icon: <Mail size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-100', category: 'communication', description: 'AI-generated personalized emails with sentiment analysis and timing optimization', rating: 4.9 },
    { id: 'email-response', name: 'Email Response Generator', icon: <Send size={20} />, color: 'text-indigo-600', bgColor: 'bg-indigo-100', category: 'communication', description: 'Context-aware response generation with personalization', rating: 4.8 },
    { id: 'subject-optimizer', name: 'Subject Line Optimizer', icon: <Sparkles size={20} />, color: 'text-purple-600', bgColor: 'bg-purple-100', category: 'communication', description: 'Performance-based subject line suggestions with open rate predictions', rating: 4.7 },
    { id: 'voice-analyzer', name: 'Voice Tone Optimizer', icon: <Phone size={20} />, color: 'text-emerald-600', bgColor: 'bg-emerald-100', category: 'communication', description: 'Communication tone analysis for different audiences', rating: 4.8 },
    { id: 'meeting-summarizer', name: 'Meeting Summarizer', icon: <Calendar size={20} />, color: 'text-orange-600', bgColor: 'bg-orange-100', category: 'communication', description: 'Automated transcript analysis with key decisions', rating: 4.9 },
    { id: 'call-script', name: 'Call Script Generator', icon: <MessageSquare size={20} />, color: 'text-rose-600', bgColor: 'bg-rose-100', category: 'communication', description: 'Context-aware script generation with objection handling', rating: 4.7 },
    
    // Sales
    { id: 'lead-scoring', name: 'AI Lead Scoring', icon: <Target size={20} />, color: 'text-red-600', bgColor: 'bg-red-100', category: 'sales', description: 'Predictive lead scoring and qualification assessment', rating: 4.9 },
    { id: 'deal-forecasting', name: 'Sales Forecast AI', icon: <TrendingUp size={20} />, color: 'text-green-600', bgColor: 'bg-green-100', category: 'sales', description: 'Advanced forecasting with probability analysis', rating: 4.8 },
    { id: 'competitor-analysis', name: 'Competitor Analysis', icon: <BarChart3 size={20} />, color: 'text-cyan-600', bgColor: 'bg-cyan-100', category: 'sales', description: 'Automated competitor research and battle cards', rating: 4.7 },
    { id: 'pipeline-intel', name: 'Pipeline Intelligence', icon: <Workflow size={20} />, color: 'text-violet-600', bgColor: 'bg-violet-100', category: 'sales', description: 'Real-time pipeline health monitoring', rating: 4.8 },
    { id: 'win-rate', name: 'Win Rate Intelligence', icon: <Target size={20} />, color: 'text-amber-600', bgColor: 'bg-amber-100', category: 'sales', description: 'Win/loss analysis with pattern recognition', rating: 4.6 },
    { id: 'objection-handler', name: 'Objection Handler', icon: <Zap size={20} />, color: 'text-yellow-600', bgColor: 'bg-yellow-100', category: 'sales', description: 'AI-powered objection response generation', rating: 4.8 },
    
    // Content
    { id: 'proposal-gen', name: 'Proposal Generator', icon: <FileText size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-100', category: 'content', description: 'AI-powered proposal with customization', rating: 4.9 },
    { id: 'image-generator', name: 'Image Generator', icon: <Image size={20} />, color: 'text-pink-600', bgColor: 'bg-pink-100', category: 'content', description: 'Professional visual content creation', rating: 4.8 },
    { id: 'content-creation', name: 'Content Writer', icon: <FileText size={20} />, color: 'text-teal-600', bgColor: 'bg-teal-100', category: 'content', description: 'AI-powered content for blogs and articles', rating: 4.7 },
    { id: 'seo-optimizer', name: 'SEO Optimizer', icon: <Search size={20} />, color: 'text-green-600', bgColor: 'bg-green-100', category: 'content', description: 'SEO optimization with keyword research', rating: 4.6 },
    { id: 'video-email', name: 'Video Email Creator', icon: <Video size={20} />, color: 'text-purple-600', bgColor: 'bg-purple-100', category: 'content', description: 'Personalized video email creation', rating: 4.8 },
    
    // Analytics
    { id: 'market-trends', name: 'Market Trends AI', icon: <TrendingUp size={20} />, color: 'text-emerald-600', bgColor: 'bg-emerald-100', category: 'analytics', description: 'Real-time market intelligence', rating: 4.9 },
    { id: 'customer-persona', name: 'Customer Persona Generator', icon: <Users size={20} />, color: 'text-indigo-600', bgColor: 'bg-indigo-100', category: 'analytics', description: 'Data-driven persona creation', rating: 4.7 },
    { id: 'revenue-ai', name: 'Revenue Intelligence', icon: <DollarSign size={20} />, color: 'text-green-600', bgColor: 'bg-green-100', category: 'analytics', description: 'Revenue tracking and optimization', rating: 4.8 },
    { id: 'clv-calculator', name: 'Customer Lifetime Value', icon: <BarChart3 size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-100', category: 'analytics', description: 'CLV calculation and prediction', rating: 4.6 },
    
    // Automation
    { id: 'ai-assistant', name: 'AI Assistant', icon: <Brain size={20} />, color: 'text-violet-600', bgColor: 'bg-violet-100', category: 'automation', description: 'Persistent AI with conversation memory', rating: 4.9 },
    { id: 'function-assist', name: 'Function Assistant', icon: <Code size={20} />, color: 'text-cyan-600', bgColor: 'bg-cyan-100', category: 'automation', description: 'Natural language CRM actions', rating: 4.8 },
    { id: 'agent-workflow', name: 'Agent Workflow', icon: <Workflow size={20} />, color: 'text-orange-600', bgColor: 'bg-orange-100', category: 'automation', description: 'Automated AI workflow creation', rating: 4.7 },
    { id: 'semantic-search', name: 'Semantic Search', icon: <Search size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-100', category: 'automation', description: 'Natural language CRM search', rating: 4.9 },
    
    // Assistants
    { id: 'sales-assist', name: 'Sales Assistant', icon: <Brain size={20} />, color: 'text-emerald-600', bgColor: 'bg-emerald-100', category: 'assistant', description: 'AI-powered sales coaching', rating: 4.9 },
    { id: 'success-assist', name: 'Customer Success Assistant', icon: <Users size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-100', category: 'assistant', description: 'Automated customer support', rating: 4.7 },
    { id: 'marketing-assist', name: 'Marketing Assistant', icon: <Megaphone size={20} />, color: 'text-pink-600', bgColor: 'bg-pink-100', category: 'assistant', description: 'Campaign optimization support', rating: 4.8 },
    { id: 'data-assist', name: 'Data Analysis Assistant', icon: <BarChart3 size={20} />, color: 'text-purple-600', bgColor: 'bg-purple-100', category: 'assistant', description: 'Real-time insights automation', rating: 4.6 },
  ];

  const filteredTools = activeCategory === 'all' 
    ? tools 
    : tools.filter(t => t.category === activeCategory);

  return (
    <section className={`py-20 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'}`}>
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full mb-4">
              68+ AI TOOLS
            </span>
            <h2 className={`text-3xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              One AI Platform, Endless Possibilities
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              From email composition to sales forecasting, our comprehensive AI toolkit covers every aspect of your sales workflow.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Category tabs */}
        <ScrollAnimationWrapper animation="fade-up" delay={100}>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : isDark
                      ? 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {filteredTools.map((tool, index) => (
            <ScrollAnimationWrapper key={tool.id} animation="slide-in" delay={index * 50}>
              <div
                onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
                className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl p-5 border shadow-lg hover:shadow-xl transition-all cursor-pointer group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                    <span className={tool.color}>{tool.icon}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{tool.rating}</span>
                  </div>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{tool.name}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 line-clamp-2`}>{tool.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {tool.category}
                  </span>
                  <button className={`flex items-center text-sm font-medium ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Demo <ChevronRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        {/* CTA */}
        <ScrollAnimationWrapper animation="fade-up" delay={400}>
          <div className="text-center mt-12">
            <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              Explore All 68+ AI Tools <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default AIToolsShowcase;