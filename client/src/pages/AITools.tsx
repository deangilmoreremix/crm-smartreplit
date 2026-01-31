import React, { useState } from 'react';
import { useAITools, AIToolType } from '../components/AIToolsProvider';
import { 
  Brain, 
  Mail, 
  MessageSquare, 
  FileText, 
  Phone, 
  Target, 
  FileSearch, 
  TrendingUp, 
  BarChart3,
  PieChart, 
  ChevronRight,
  CheckCheck,
  ArrowRight,
  Play,
  User,
  Clock,
  Star,
  ExternalLink,
  BarChart,
  Users,
  Briefcase,
  Eye,
  Image,
  Mic,
  Search,
  Zap,
  MessagesSquare,
  CheckCircle,
  Sparkles,
  Shield,
  Volume2,
  Reply,
  Calendar,
  X,
  Bot,
  Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StreamingChat from '../components/aiTools/StreamingChat';
import RealTimeFormValidation from '../components/aiTools/RealTimeFormValidation';
import LiveDealAnalysis from '../components/aiTools/LiveDealAnalysis';
import InstantAIResponseGenerator from '../components/aiTools/InstantAIResponseGenerator';
import DocumentAnalyzerRealtime from '../components/aiTools/DocumentAnalyzerRealtime';
import RealTimeEmailComposer from '../components/aiTools/RealTimeEmailComposer';
import VoiceAnalysisRealtime from '../components/aiTools/VoiceAnalysisRealtime';
import SmartSearchRealtime from '../components/aiTools/SmartSearchRealtime';
import AutoFormCompleter from '../components/aiTools/AutoFormCompleter';
import CallScriptContent from '../components/aiTools/CallScriptContent';
import EmailResponseContent from '../components/aiTools/EmailResponseContent';
import MeetingAgendaContent from '../components/aiTools/MeetingAgendaContent';
import CustomerPersonaContent from '../components/aiTools/CustomerPersonaContent';
import GeminiImageModal from '../components/GeminiImageModal';
import FunctionAssistantContent from '../components/aiTools/FunctionAssistantContent';
import ObjectionHandlerContent from '../components/aiTools/ObjectionHandlerContent';
import ProposalGenerator from '../components/aiTools/ProposalGenerator';
import MeetingSummaryContent from '../components/aiTools/MeetingSummaryContent';
import SocialMediaGenerator from '../components/aiTools/SocialMediaGenerator';
import AgentWorkflowChat from '../components/aiTools/AgentWorkflowChat';
import ImageGallery from '../components/ImageGallery';
import AIAssistantChat from '../components/aiTools/AIAssistantChat';

const AITools: React.FC = () => {
  const { openTool } = useAITools();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [activeDemoTool, setActiveDemoTool] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Tools' },
    { id: 'email', name: 'Email Tools' },
    { id: 'sales', name: 'Sales Tools' },
    { id: 'meeting', name: 'Meeting Tools' },
    { id: 'content', name: 'Content Tools' },
    { id: 'analysis', name: 'Analysis Tools' },
    { id: 'reasoning', name: 'AI Reasoning' },
    { id: 'voice', name: 'Voice & Audio' },
    { id: 'vision', name: 'Vision & Image' },
    { id: 'advanced', name: 'Advanced AI' },
    { id: 'realtime', name: 'Real-time' }
  ];

  const aiFeatures = [
    // Original tools
    {
      title: "Smart Email Composer",
      description: "Generate personalized, professional emails for your contacts in seconds",
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      id: "email-composer" as const,
      categories: ['email']
    },
    {
      title: "Email Analysis",
      description: "Extract key insights, sentiment, and action items from customer emails",
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      id: "email-analysis" as const,
      categories: ['email', 'analysis']
    },
    {
      title: "Meeting Summary",
      description: "Transform meeting transcripts into concise, actionable summaries",
      icon: <MessageSquare className="h-6 w-6 text-purple-600" />,
      id: "meeting-summary" as const,
      categories: ['meeting']
    },
    {
      title: "Smart Proposal Generator",
      description: "Create professional, customized sales proposals in seconds",
      icon: <FileText className="h-6 w-6 text-emerald-600" />,
      id: "proposal-generator" as const,
      categories: ['content', 'sales']
    },
    {
      title: "Call Script Generator",
      description: "Create personalized sales call scripts for more effective conversations",
      icon: <Phone className="h-6 w-6 text-indigo-600" />,
      id: "call-script" as const,
      categories: ['sales']
    },
    {
      title: "Subject Line Optimizer",
      description: "Generate high-converting email subject lines with performance predictions",
      icon: <Target className="h-6 w-6 text-rose-600" />,
      id: "subject-optimizer" as const,
      categories: ['email']
    },
    {
      title: "Competitor Analysis",
      description: "Analyze competitors and develop effective differentiation strategies",
      icon: <FileSearch className="h-6 w-6 text-amber-600" />,
      id: "competitor-analysis" as const,
      categories: ['analysis']
    },
    {
      title: "Market Trend Analysis",
      description: "Get insights on industry trends and market opportunities",
      icon: <TrendingUp className="h-6 w-6 text-cyan-600" />,
      id: "market-trends" as const,
      categories: ['analysis']
    },
    {
      title: "Sales Insights Generator",
      description: "AI-powered insights and recommendations based on your CRM data",
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      id: "sales-insights" as const,
      categories: ['sales', 'analysis']
    },
    {
      title: "Sales Forecasting",
      description: "Revenue projections and deal closure probability analysis",
      icon: <PieChart className="h-6 w-6 text-blue-600" />,
      id: "sales-forecast" as const,
      categories: ['sales', 'analysis']
    },
    {
      title: "Objection Handler",
      description: "Get expert strategies for handling sales objections effectively",
      icon: <Shield className="h-6 w-6 text-indigo-600" />,
      id: "objection-handler" as const,
      categories: ['sales']
    },
    {
      title: "Customer Persona Generator",
      description: "Create detailed, data-driven customer personas for targeted sales",
      icon: <Users className="h-6 w-6 text-emerald-600" />,
      id: "customer-persona" as const,
      categories: ['sales']
    },
    {
      title: "Voice Tone Optimizer",
      description: "Perfect your communication tone for different audiences and purposes",
      icon: <Volume2 className="h-6 w-6 text-purple-600" />,
      id: "voice-tone-optimizer" as const,
      categories: ['content', 'voice']
    },
    {
      title: "Email Response Generator",
      description: "Quickly create personalized responses to customer and prospect emails",
      icon: <Reply className="h-6 w-6 text-teal-600" />,
      id: "email-response" as const,
      categories: ['email']
    },
    {
      title: "Visual Content Generator",
      description: "Generate professional visual content ideas for sales presentations, marketing materials, and client communications",
      icon: <Image className="h-6 w-6 text-rose-600" />,
      id: "visual-content-generator" as const,
      categories: ['content']
    },
    {
      title: "Meeting Agenda Generator",
      description: "Create structured, effective meeting agendas for your sales meetings",
      icon: <Calendar className="h-6 w-6 text-amber-600" />,
      id: "meeting-agenda" as const,
      categories: ['meeting']
    },

    // Advanced AI features
    {
      title: "AI Assistant",
      description: "Interact with a persistent AI assistant that remembers context and can help with various sales tasks",
      icon: <Brain className="h-6 w-6 text-violet-600" />,
      id: "ai-assistant" as const,
      categories: ['advanced', 'sales'],
      new: true
    },
    {
      title: "Vision Analyzer",
      description: "Analyze images, screenshots, and visual content to extract insights and information",
      icon: <Eye className="h-6 w-6 text-fuchsia-600" />,
      id: "vision-analyzer" as const,
      categories: ['vision', 'analysis'],
      new: true
    },
    {
      title: "SmartCRM Image Generator",
      description: "Create branded marketing materials with SmartCRM templates, history tracking, and drag-and-drop seed images",
      icon: <Image className="h-6 w-6 text-emerald-600" />,
      id: "image-generator" as const,
      categories: ['vision', 'content'],
      new: true
    },
    {
      title: "Semantic Search",
      description: "Find anything in your CRM with natural language queries and contextual understanding",
      icon: <Search className="h-6 w-6 text-blue-600" />,
      id: "semantic-search" as const,
      categories: ['advanced', 'analysis'],
      new: true
    },
    {
      title: "Agent Workflow",
      description: "Create and manage automated AI workflows",
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      id: "agent-workflow" as const,
      categories: ['advanced', 'automation'],
      new: true,
      isPremium: true
    },

    // Real-time/streaming features
    {
      title: "Real-time Chat",
      description: "Experience real-time AI responses with our streaming chat interface",
      icon: <MessagesSquare className="h-6 w-6 text-blue-600" />,
      id: "streaming-chat" as const,
      categories: ['advanced', 'sales', 'realtime'],
      new: true,
      demoId: "streaming-chat"
    },
    {
      title: "Function Assistant",
      description: "Chat with an AI that can perform real actions in your CRM through natural conversation",
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      id: "function-assistant" as const,
      categories: ['advanced', 'sales', 'realtime'],
      new: true
    },
    {
      title: "Real-time Form Validation",
      description: "Get instant feedback on form fields with AI-powered validation",
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      id: "form-validation" as const,
      categories: ['analysis', 'realtime'],
      new: true,
      demoId: "form-validation"
    },
    {
      title: "Live Deal Analysis",
      description: "Get real-time insights and recommendations on your deals",
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      id: "live-deal-analysis" as const,
      categories: ['analysis', 'sales', 'realtime'],
      new: true,
      demoId: "live-deal-analysis"
    },
    {
      title: "Instant Response Generator",
      description: "Generate professional responses to common scenarios in milliseconds",
      icon: <Sparkles className="h-6 w-6 text-teal-600" />,
      id: "instant-response" as const,
      categories: ['content', 'email', 'realtime'],
      new: true,
      demoId: "instant-response"
    },
    {
      title: "Real-time Document Analyzer",
      description: "Extract insights from documents and images with live progress updates",
      icon: <Eye className="h-6 w-6 text-indigo-600" />,
      id: "document-analyzer-realtime" as const,
      categories: ['vision', 'analysis', 'realtime'],
      new: true,
      demoId: "document-analyzer"
    },
    {
      title: "Real-time Email Composer",
      description: "Write emails with real-time AI suggestions and sentiment analysis",
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      id: "realtime-email-composer" as const,
      categories: ['email', 'content', 'realtime'],
      new: true,
      demoId: "realtime-email"
    },
    {
      title: "Real-time Voice Analysis",
      description: "Analyze voice calls in real-time for sentiment, pacing, and coaching",
      icon: <Mic className="h-6 w-6 text-purple-600" />,
      id: "voice-analysis-realtime" as const,
      categories: ['voice', 'analysis', 'realtime'],
      new: true,
      demoId: "voice-analysis"
    },
    {
      title: "Smart Search with Typeahead",
      description: "Semantic search with AI-powered suggestions as you type",
      icon: <Search className="h-6 w-6 text-cyan-600" />,
      id: "smart-search-realtime" as const,
      categories: ['advanced', 'realtime'],
      new: true,
      demoId: "smart-search"
    },
    {
      title: "AI Form Auto-completion",
      description: "Automatically fill forms using AI-powered suggestions",
      icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
      id: "auto-form-completer" as const,
      categories: ['content', 'realtime'],
      new: true,
      demoId: "auto-form"
    },
    // Reasoning-based content generators
    {
      title: "AI Reasoning Email Generator",
      description: "Generate emails with step-by-step AI reasoning and explanations",
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      id: "reasoning-email" as const,
      categories: ['email', 'reasoning'],
      new: true
    },
    {
      title: "AI Reasoning Proposal Generator", 
      description: "Create proposals with detailed reasoning and strategic insights",
      icon: <FileText className="h-6 w-6 text-green-600" />,
      id: "reasoning-proposal" as const,
      categories: ['sales', 'reasoning'],
      new: true
    },
    {
      title: "AI Reasoning Call Script Generator",
      description: "Build call scripts with reasoning-based conversation flows",
      icon: <Phone className="h-6 w-6 text-purple-600" />,
      id: "reasoning-script" as const,
      categories: ['sales', 'reasoning'],
      new: true
    },
    {
      title: "AI Reasoning Objection Handler",
      description: "Handle objections with AI-powered reasoning and counter-arguments",
      icon: <Shield className="h-6 w-6 text-red-600" />,
      id: "reasoning-objection" as const,
      categories: ['sales', 'reasoning'],
      new: true
    },
    {
      title: "AI Reasoning Social Content Generator",
      description: "Create social media content with strategic reasoning",
      icon: <MessagesSquare className="h-6 w-6 text-pink-600" />,
      id: "reasoning-social" as const,
      categories: ['content', 'reasoning'],
      new: true
    },
    {
      title: "My Image Gallery",
      description: "View and manage all your AI-generated images stored in the cloud",
      icon: <Image className="h-6 w-6 text-purple-600" />,
      id: "image-gallery" as const,
      categories: ['vision', 'content'],
      new: true
    }
  ];

  // Filter tools based on search and category
  const filteredTools = aiFeatures.filter(tool => {
    const matchesSearch = 
      tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      !activeCategory || 
      activeCategory === 'all' || 
      tool.categories.includes(activeCategory);

    return matchesSearch && matchesCategory;
  });

  const handleOpenDemoTool = (demoId: string) => {
    setActiveDemoTool(demoId);
    setShowDemo(true);
  };

  // Function to render individual AI tool components based on currentTool
  const renderAITool = (toolId: string) => {
    switch (toolId) {
      case 'email-composer-content':
      case 'email-composer':
        return <EmailResponseContent />;
      case 'ai-assistant':
        return <AIAssistantChat />;
      case 'agent-workflow':
        return <AgentWorkflowChat />;
      case 'live-deal-analysis':
        return <LiveDealAnalysis />;
      case 'auto-form-completer':
        return <AutoFormCompleter />;
      case 'call-script':
      case 'call-script-generator':
        return <CallScriptContent />;
      case 'document-analyzer-realtime':
        return <DocumentAnalyzerRealtime />;
      case 'email-analysis':
        return <EmailResponseContent />;
      case 'function-assistant':
        return <FunctionAssistantContent />;
      case 'image-generator':
        return <GeminiImageModal open={true} onClose={() => {}} />;
      case 'instant-response':
        return <InstantAIResponseGenerator />;
      case 'meeting-agenda':
        return <MeetingAgendaContent />;
      case 'customer-persona':
        return <CustomerPersonaContent />;
      case 'objection-handler':
        return <ObjectionHandlerContent />;
      case 'realtime-email-composer':
        return <RealTimeEmailComposer />;
      case 'form-validation':
        return <RealTimeFormValidation />;
      case 'proposal-generator':
        return <ProposalGenerator />;
      case 'meeting-summary':
        return <MeetingSummaryContent />;
      case 'social-media-generator':
        return <SocialMediaGenerator />;
      case 'smart-search-realtime':
        return <SmartSearchRealtime />;
      case 'voice-analysis-realtime':
        return <VoiceAnalysisRealtime />;
      default:
        return (
          <div className="text-center py-16">
            <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">AI Tool Not Found</h3>
            <p className="text-gray-500">The requested AI tool could not be loaded.</p>
          </div>
        );
    }
  };

  // The modal system now handles tool rendering, so we only show the main grid

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Tools</h1>
        <p className="text-gray-600 mt-1">Advanced AI capabilities for your CRM</p>
      </header>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search AI tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(activeCategory === category.id ? 'all' : category.id)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                activeCategory === category.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-xl shadow-sm mb-10 border border-blue-100">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white shadow-lg">
            <Zap className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Complete AI Tools Suite</h2>
            <p className="text-gray-700 text-lg">
              Experience our latest AI capabilities powered by OpenAI's GPT-4o and other advanced models. Get intelligent responses, detailed analysis, and comprehensive results for all your CRM and sales needs.
              <span className="font-medium text-indigo-600 ml-1">Click any tool below to get started!</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.length > 0 ? (
          filteredTools.map((feature) => (
            <div 
              key={feature.id} 
              onClick={() => openTool(feature.id)}
              className="card-modern p-6 hover:shadow-md transition-all duration-300 group cursor-pointer"
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm relative" 
                      style={{backgroundImage: `linear-gradient(to right, ${getGradientColors(feature.id)})`}}>
                  {feature.icon}
                  {feature.new && (
                    <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">NEW</span>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4 flex-1">{feature.description}</p>
                <div className="mt-auto">
                  <span className="inline-flex items-center font-medium transition-all duration-300 group-hover:translate-x-1 text-blue-600">
                    Use Tool
                    <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No matching tools found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Interactive Demo Modal */}
      {showDemo && activeDemoTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
              <h3 className="font-bold text-lg flex items-center">
                <Star className="text-yellow-500 mr-2 h-5 w-5" />
                {activeDemoTool === "streaming-chat" ? "Real-time Streaming Chat" : 
                 activeDemoTool === "form-validation" ? "Real-time Form Validation" :
                 activeDemoTool === "live-deal-analysis" ? "Live Deal Analysis" :
                 activeDemoTool === "instant-response" ? "Instant Response Generator" :
                 activeDemoTool === "document-analyzer" ? "Real-time Document Analyzer" :
                 activeDemoTool === "realtime-email" ? "Real-time Email Composer" :
                 activeDemoTool === "voice-analysis" ? "Real-time Voice Analysis" :
                 activeDemoTool === "smart-search" ? "Smart Search with Typeahead" :
                 activeDemoTool === "auto-form" ? "AI Form Auto-completion" : 
                 activeDemoTool === "agent-workflow" ? "Agent Workflow Chat" : "Interactive Demo"}
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-normal">Interactive Demo</span>
              </h3>
              <button 
                onClick={() => {
                  setShowDemo(false);
                  setActiveDemoTool(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activeDemoTool === "streaming-chat" && <StreamingChat />}
              {activeDemoTool === "form-validation" && <RealTimeFormValidation />}
              {activeDemoTool === "live-deal-analysis" && <LiveDealAnalysis />}
              {activeDemoTool === "instant-response" && <InstantAIResponseGenerator />}
              {activeDemoTool === "document-analyzer" && <DocumentAnalyzerRealtime />}
              {activeDemoTool === "realtime-email" && <RealTimeEmailComposer />}
              {activeDemoTool === "voice-analysis" && <VoiceAnalysisRealtime />}
              {activeDemoTool === "smart-search" && <SmartSearchRealtime />}
              {activeDemoTool === "auto-form" && <AutoFormCompleter />}
              {activeDemoTool === "agent-workflow" && <AgentWorkflowChat />}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Powered by Gemini 2.5 and OpenAI's latest models
                </span>
                <button
                  onClick={() => {
                    setShowDemo(false);
                    setActiveDemoTool(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Close Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// Helper function to get gradient colors based on tool ID
const getGradientColors = (id: string): string => {
  switch(id) {
    case 'email-analysis':
    case 'email-composer':
    case 'email-response':
    case 'realtime-email-composer':
      return 'rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2)';
    case 'meeting-summary':
    case 'meeting-agenda':
    case 'voice-tone-optimizer':
      return 'rgba(147, 51, 234, 0.1), rgba(147, 51, 234, 0.2)';
    case 'proposal-generator':
    case 'customer-persona':
      return 'rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2)';
    case 'call-script':
    case 'objection-handler':
      return 'rgba(79, 70, 229, 0.1), rgba(79, 70, 229, 0.2)';
    case 'subject-optimizer':
    case 'visual-content-generator':
      return 'rgba(244, 63, 94, 0.1), rgba(244, 63, 94, 0.2)';
    case 'competitor-analysis':
      return 'rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.2)';
    case 'market-trends':
      return 'rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.2)';
    case 'sales-insights':
      return 'rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2)';
    case 'sales-forecast':
      return 'rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2)';
    case 'ai-assistant':
      return 'rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.2)';
    case 'vision-analyzer':
      return 'rgba(217, 70, 239, 0.1), rgba(217, 70, 239, 0.2)';
    case 'image-generator':
      return 'rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.2)';
    case 'semantic-search':
    case 'smart-search-realtime':
      return 'rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2)';
    case 'streaming-chat':
      return 'rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2)';
    case 'function-assistant':
      return 'rgba(250, 204, 21, 0.1), rgba(250, 204, 21, 0.2)';
    case 'form-validation':
    case 'auto-form-completer':
      return 'rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2)';
    case 'live-deal-analysis':
      return 'rgba(147, 51, 234, 0.1), rgba(147, 51, 234, 0.2)';
    case 'instant-response':
      return 'rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.2)';
    case 'document-analyzer-realtime':
      return 'rgba(79, 70, 229, 0.1), rgba(79, 70, 229, 0.2)';
    case 'voice-analysis-realtime':
      return 'rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.2)';
    case 'agent-workflow':
      return 'rgba(253, 186, 116, 0.1), rgba(253, 186, 116, 0.2)';
    default:
      return 'rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0.2)';
  }
};

export default AITools;