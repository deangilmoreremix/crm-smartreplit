import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { useGemini } from '../services/geminiService';
import { useTaskStore } from '../store/taskStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useAITools } from '../components/AIToolsProvider';
import AppointmentWidget from '../components/AppointmentWidget';
import AIToolsCard from '../components/Dashboard/AIToolsCard';
import DealAnalytics from '../components/DealAnalytics';
import HelpTooltip from '../components/ui/HelpTooltip';
import { useEnhancedHelp } from '../contexts/EnhancedHelpContext';
import GeminiImageModal from '../components/GeminiImageModal';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Calendar, 
  Clock,
  Zap, 
  ChevronRight, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  CheckCircle,
  Users,
  Briefcase,
  Tag,
  PieChart,
  Building,
  Mail,
  CheckSquare,
  Plus,
  Search,
  ExternalLink,
  Grid3X3,
  Megaphone,
  FileText,
  Settings,
  Palette
} from 'lucide-react';

// Import AI tools components
import StreamingChat from '../components/aiTools/StreamingChat';
import SmartSearchRealtime from '../components/aiTools/SmartSearchRealtime';
import LiveDealAnalysis from '../components/aiTools/LiveDealAnalysis';

// Import recharts components for data visualization
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Dashboard: React.FC = () => {
  const { 
    deals, 
    fetchDeals, 
    isLoading,
    stageValues,
    totalPipelineValue 
  } = useDealStore();
  
  const { 
    contacts, 
    fetchContacts, 
    isLoading: contactsLoading 
  } = useContactStore();
  
  const { tasks, fetchTasks } = useTaskStore();
  const { fetchAppointments } = useAppointmentStore();
  const { openTool } = useAITools();
  const { showTours } = useEnhancedHelp();
  
  const gemini = useGemini();
  
  const [pipelineInsight, setPipelineInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiMetrics, setAiMetrics] = useState({
    activeSuggestions: 12,
    acceptedSuggestions: 8,
    efficiency: 32,
    qualityScore: 87
  });
  const [showAvatarGenerator, setShowAvatarGenerator] = useState(false);
  
  useEffect(() => {
    // Fetch all data when component mounts
    fetchDeals();
    fetchContacts();
    fetchTasks();
    fetchAppointments();
    
    // Generate AI recommendations
    generateRecommendations();
    
    // Set up timer to refresh data periodically
    const intervalId = setInterval(() => {
      fetchDeals();
      fetchContacts();
    }, 300000); // refresh every 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);
  
  const generateRecommendations = async () => {
    try {
      // Use real AI to generate recommendations based on actual CRM data
      const contactsArray = Object.values(contacts);
      
      const response = await fetch('/api/ai/business-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: contactsArray,
          deals: deals,
          tasks: tasks
        }),
      });

      if (!response.ok) {
        throw new Error(`Recommendations failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse AI recommendations or use structured fallback
      let recommendations = [];
      const aiResponse = data.result || data.insights || data.content;
      
      try {
        const aiResult = JSON.parse(aiResponse || '{}');
        recommendations = aiResult.recommendations || [];
      } catch (parseError) {
        // Create structured recommendations from AI text
        recommendations = [
          {
            id: 1,
            title: 'AI Business Analysis',
            description: aiResponse || 'Business analysis completed',
            type: 'general',
            priority: 'medium',
            action: 'Review AI insights',
            entityId: null
          }
        ];
      }
      
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Set empty array on error
      setAiRecommendations([]);
    }
  };
  
  // Generate AI insight for the pipeline using real data
  const generatePipelineInsight = async () => {
    setIsAnalyzing(true);
    
    try {
      // Convert contacts object to array for API
      const contactsArray = Object.values(contacts);
      
      // Prepare real data for the AI analysis
      const requestData = {
        contacts: contactsArray,
        deals: deals
      };
      
      // Call the real AI sales insights API
      const response = await fetch('/api/ai/sales-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setPipelineInsight(data.result || data.insights || data.content || data.message);
    } catch (error) {
      console.error('Error generating pipeline insight:', error);
      setPipelineInsight('Unable to generate insights at this time. Please ensure your OpenAI API key is configured and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate metrics from deal data
  const calculateMetrics = () => {
    const now = new Date();
    let totalActiveDeals = 0;
    let totalClosingThisMonth = 0;
    let totalAtRisk = 0;
    let totalValue = 0;
    let wonValue = 0;
    
    Object.values(deals).forEach(deal => {
      // Count active deals (not closed)
      if (deal.stage !== 'closed-won' && deal.stage !== 'closed-lost') {
        totalActiveDeals++;
        totalValue += deal.value;
        
        // Deals closing this month
        if (deal.dueDate && deal.dueDate.getMonth() === now.getMonth()) {
          totalClosingThisMonth++;
        }
        
        // Deals at risk (high priority or stalled)
        if (
          deal.priority === 'high' || 
          (deal.daysInStage && deal.daysInStage > 14)
        ) {
          totalAtRisk++;
        }
      }
      
      // Count won deals value
      if (deal.stage === 'closed-won') {
        wonValue += deal.value;
      }
    });
    
    return {
      totalActiveDeals,
      totalClosingThisMonth,
      totalAtRisk,
      totalValue,
      avgDealSize: totalActiveDeals > 0 ? totalValue / totalActiveDeals : 0,
      wonValue
    };
  };
  
  const metrics = calculateMetrics();

  // Prepare data for charts
  const prepareChartData = () => {
    // Pipeline by stage chart data
    const pipelineByStage = [
      { stage: 'Qual', value: stageValues.qualification || 0 },
      { stage: 'Proposal', value: stageValues.proposal || 0 },
      { stage: 'Negotiation', value: stageValues.negotiation || 0 },
    ];
    
    // Deal probability distribution
    const dealProbability = [
      { range: '0-25%', count: 0 },
      { range: '26-50%', count: 0 },
      { range: '51-75%', count: 0 },
      { range: '76-100%', count: 0 },
    ];
    
    Object.values(deals).forEach(deal => {
      const probability = deal.probability || 0;
      if (probability <= 25) dealProbability[0].count++;
      else if (probability <= 50) dealProbability[1].count++;
      else if (probability <= 75) dealProbability[2].count++;
      else dealProbability[3].count++;
    });
    
    // Monthly trend data (simulated for demo)
    const monthlyTrend = [
      { month: 'Jan', deals: 15, value: 125000 },
      { month: 'Feb', deals: 18, value: 150000 },
      { month: 'Mar', deals: 14, value: 110000 },
      { month: 'Apr', deals: 21, value: 180000 },
      { month: 'May', deals: 25, value: 210000 },
      { month: 'Jun', deals: 30, value: 275000 },
    ];
    
    return { pipelineByStage, dealProbability, monthlyTrend };
  };
  
  const chartData = prepareChartData();

  // Get upcoming deals (sorting by dueDate)
  const getUpcomingDeals = () => {
    const activeDeals = Object.values(deals).filter(
      deal => deal.stage !== 'closed-won' && deal.stage !== 'closed-lost'
    );
    
    // Sort by due date (ascending)
    return activeDeals
      .filter(deal => deal.dueDate)
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return a.dueDate.getTime() - b.dueDate.getTime();
      })
      .slice(0, 5); // Get top 5
  };
  
  // Get overdue and today's tasks
  const getImportantTasks = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const overdueTasks = Object.values(tasks).filter(task => 
      !task.completed && task.dueDate && task.dueDate < now
    );
    
    const todayTasks = Object.values(tasks).filter(task => 
      !task.completed && task.dueDate && 
      task.dueDate >= now && task.dueDate < tomorrow
    );
    
    return [...overdueTasks, ...todayTasks].sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return a.dueDate.getTime() - b.dueDate.getTime();
    }).slice(0, 5);
  };

  const upcomingDeals = getUpcomingDeals();
  const importantTasks = getImportantTasks();
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return 'No date';
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8" data-tour="welcome-header">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Your real-time sales performance overview</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => {/* Tour will auto-start when enabled */}}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-sm font-medium text-blue-700 transition-colors duration-200"
            >
              Take Tour
            </button>
            <div className="relative inline-block">
              <select 
                className="appearance-none pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={timeframe}
                onChange={e => setTimeframe(e.target.value)}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* AI Insight Panel */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-sm p-6 border border-blue-100 mb-6" data-tour="ai-insights">
        <div className="flex items-start">
          <div className="flex-shrink-0 p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg mr-4">
            <Brain size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold text-gray-900">AI Pipeline Intelligence</h2>
              <button 
                onClick={generatePipelineInsight}
                disabled={isAnalyzing}
                className="text-xs text-blue-700 hover:text-blue-900"
              >
                {isAnalyzing ? 'Analyzing...' : pipelineInsight ? 'Refresh' : 'Generate Insight'}
              </button>
            </div>
            
            {isAnalyzing ? (
              <div className="mt-2 flex items-center text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <p>Analyzing your pipeline and generating insights...</p>
              </div>
            ) : pipelineInsight ? (
              <p className="mt-2 text-gray-700">{pipelineInsight}</p>
            ) : (
              <p className="mt-2 text-gray-600">Generate AI-powered insights to understand your pipeline health and get strategic recommendations.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" data-tour="stats-cards">
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
          <div className="rounded-full p-3 mr-4 bg-gradient-to-r from-blue-50 to-blue-100">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Deals</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold">{metrics.totalActiveDeals}</p>
              <p className="ml-2 text-xs text-green-500 flex items-center">
                <ArrowUpRight size={12} className="mr-0.5" />
                12%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
          <div className="rounded-full p-3 mr-4 bg-gradient-to-r from-indigo-50 to-indigo-100">
            <DollarSign className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pipeline Value</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold">{formatCurrency(totalPipelineValue)}</p>
              <p className="ml-2 text-xs text-green-500 flex items-center">
                <ArrowUpRight size={12} className="mr-0.5" />
                8%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
          <div className="rounded-full p-3 mr-4 bg-gradient-to-r from-purple-50 to-purple-100">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Closing This Month</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold">{metrics.totalClosingThisMonth}</p>
              <p className="ml-2 text-xs text-red-500 flex items-center">
                <ArrowDownRight size={12} className="mr-0.5" />
                3%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
          <div className="rounded-full p-3 mr-4 bg-gradient-to-r from-amber-50 to-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Deals At Risk</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold">{metrics.totalAtRisk}</p>
              <p className="ml-2 text-xs text-amber-500 flex items-center">
                <ArrowUpRight size={12} className="mr-0.5" />
                2
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100 mb-6">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
            <Brain size={18} />
          </div>
          <h2 className="text-lg font-semibold">AI Enhancement Metrics</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Active Suggestions</p>
            <p className="text-2xl font-semibold mt-1">{aiMetrics.activeSuggestions}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${aiMetrics.activeSuggestions * 5}%` }}></div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Suggestions Accepted</p>
            <p className="text-2xl font-semibold mt-1">{aiMetrics.acceptedSuggestions}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${aiMetrics.acceptedSuggestions * 10}%` }}></div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Efficiency Boost</p>
            <p className="text-2xl font-semibold mt-1">{aiMetrics.efficiency}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${aiMetrics.efficiency}%` }}></div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">AI Quality Score</p>
            <p className="text-2xl font-semibold mt-1">{aiMetrics.qualityScore}/100</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${aiMetrics.qualityScore}%` }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Connected Apps Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600 mr-3">
              <Grid3X3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Connected Apps</h2>
              <p className="text-sm text-gray-500">Access your entire business toolkit</p>
            </div>
          </div>
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center">
            View All <ExternalLink size={14} className="ml-1" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* FunnelCraft AI - Marketing Team */}
          <a 
            href="https://serene-valkyrie-fec320.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                <Megaphone size={20} />
              </div>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">FunnelCraft AI</h3>
            <p className="text-sm text-gray-600 mb-2">Marketing Team</p>
            <p className="text-xs text-gray-500">Create high-converting funnels with AI-powered optimization</p>
          </a>

          {/* SmartCRM Closer - Outreach Team */}
          <a 
            href="https://stupendous-twilight-64389a.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                <Users size={20} />
              </div>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">SmartCRM Closer</h3>
            <p className="text-sm text-gray-600 mb-2">Outreach Team</p>
            <p className="text-xs text-gray-500">Advanced outreach automation and deal closing tools</p>
          </a>

          {/* ContentAI - Content & Support Team */}
          <a 
            href="https://capable-mermaid-3c73fa.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                <FileText size={20} />
              </div>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">ContentAI</h3>
            <p className="text-sm text-gray-600 mb-2">Content & Support</p>
            <p className="text-xs text-gray-500">AI-powered content creation and support documentation</p>
          </a>

          {/* White-Label Platform Management */}
          <a 
            href="https://moonlit-tarsier-239e70.netlify.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors">
                <Palette size={20} />
              </div>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">White-Label Platform</h3>
            <p className="text-sm text-gray-600 mb-2">Platform Management</p>
            <p className="text-xs text-gray-500">Customize and manage your branded platform solutions</p>
          </a>
        </div>
      </div>
      
      {/* Main Content - 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* AI Chat and Tools column */}
        <div className="space-y-6">
          {/* AI Assistant Chat */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="font-semibold flex items-center">
                <Brain size={18} className="text-blue-600 mr-2" />
                AI Assistant
              </h2>
            </div>
            <div className="h-80">
              <StreamingChat 
                systemPrompt="You are a helpful sales assistant that provides concise, actionable advice." 
                initialMessage="How can I help with your sales today? Ask me about leads, deals, or general sales advice." 
                placeholder="Ask something about your sales data..."
              />
            </div>
          </div>
          
          {/* Quick Search */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
              <h2 className="font-semibold flex items-center">
                <Search size={18} className="text-blue-600 mr-2" />
                Smart Search
              </h2>
            </div>
            <div className="h-64">
              <SmartSearchRealtime />
            </div>
          </div>
          
          {/* AI Tools Card */}
          <AIToolsCard />
        </div>
        
        {/* Middle column - Pipeline and deals */}
        <div className="space-y-6">
          {/* Deal Analysis */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold flex items-center">
                <Zap size={18} className="text-purple-600 mr-2" />
                Deal Analysis
              </h2>
              <Link to="/pipeline" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                View all deals <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="p-4">
              <LiveDealAnalysis />
            </div>
          </div>
          
          {/* AI Recommendations */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Brain size={20} className="text-indigo-600 mr-2" />
                AI Recommendations
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {aiRecommendations.map((rec) => (
                <div key={rec.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start">
                    <div className={`p-1.5 rounded-full ${
                      rec.type === 'deal' ? 'bg-purple-100 text-purple-600' :
                      rec.type === 'contact' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    } mr-3 mt-0.5`}>
                      {rec.type === 'deal' ? (
                        <Briefcase size={16} />
                      ) : rec.type === 'contact' ? (
                        <Users size={16} />
                      ) : (
                        <BarChart3 size={16} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{rec.title}</h3>
                      <p className="text-xs text-gray-500">{rec.description}</p>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap">
                      {rec.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right column - Tasks and upcoming activity */}
        <div className="space-y-6">
          {/* Important Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CheckSquare size={20} className="text-indigo-600 mr-2" />
                Important Tasks
              </h2>
              <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                View all <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
            
            {importantTasks.length > 0 ? (
              <div className="space-y-3">
                {importantTasks.map(task => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        readOnly
                      />
                      <div>
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock size={12} className="text-gray-400 mr-1" />
                          <span className={`text-xs ${
                            !task.completed && task.dueDate && task.dueDate < new Date() 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-500'
                          }`}>
                            {formatDate(task.dueDate)}
                          </span>
                          {task.priority && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Link to="/tasks" className="flex justify-center text-sm text-blue-600 hover:text-blue-800 py-2">
                  View all tasks
                </Link>
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckSquare size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No urgent tasks</p>
                <Link to="/tasks" className="mt-2 text-blue-600 hover:text-blue-800 text-sm inline-block">
                  Create a task
                </Link>
              </div>
            )}
          </div>
          
          {/* Upcoming Appointments */}
          <AppointmentWidget limit={3} />
          
          {/* Quick Actions */}
          <div id="quick-actions" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100" data-tour="quick-actions">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <HelpTooltip 
                content="These buttons let you quickly create new deals and contacts, or open AI tools for scheduling and email composition."
                placement="left"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <HelpTooltip
                content="Click here to go to the deals page where you can create a new deal opportunity."
                placement="top"
              >
                <Link
                  id="new-deal-btn"
                  to="/deals"
                  className="p-3 text-center bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors duration-200 no-underline"
                >
                  <Plus size={20} className="mx-auto mb-1" />
                  <span className="text-sm">New Deal</span>
                </Link>
              </HelpTooltip>

              <HelpTooltip
                content="Click here to go to the contacts page where you can add a new contact to your CRM."
                placement="top"
              >
                <Link
                  id="new-contact-btn"
                  to="/contacts"
                  className="p-3 text-center bg-green-50 hover:bg-green-100 rounded-lg text-green-700 transition-colors duration-200 no-underline"
                >
                  <Plus size={20} className="mx-auto mb-1" />
                  <span className="text-sm">New Contact</span>
                </Link>
              </HelpTooltip>

              <HelpTooltip
                content="Opens the AI meeting scheduler to help you organize and plan meetings with contacts."
                placement="bottom"
              >
                <button
                  id="schedule-btn"
                  onClick={() => openTool('meeting-agenda')}
                  className="p-3 text-center bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 transition-colors duration-200"
                >
                  <Calendar size={20} className="mx-auto mb-1" />
                  <span className="text-sm">Schedule</span>
                </button>
              </HelpTooltip>

              <HelpTooltip
                content="Opens the AI email composer to help you write personalized emails using AI."
                placement="bottom"
              >
                <button
                  id="send-email-btn"
                  onClick={() => openTool('email-composer')}
                  className="p-3 text-center bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors duration-200"
                >
                  <Mail size={20} className="mx-auto mb-1" />
                  <span className="text-sm">Send Email</span>
                </button>
              </HelpTooltip>

              <HelpTooltip
                content="Generate professional avatars for contacts and team members using AI."
                placement="bottom"
              >
                <button
                  onClick={() => setShowAvatarGenerator(true)}
                  className="p-3 text-center bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors duration-200"
                >
                  <img src="/api/placeholder/20/20" alt="Avatar" className="mx-auto mb-1 w-5 h-5" />
                  <span className="text-sm">Generate Avatar</span>
                </button>
              </HelpTooltip>
            </div>
          </div>
        </div>
      </div>
      
      {/* DealAnalytics Component */}
      <div data-tour="pipeline-overview">
        <DealAnalytics />
      </div>

      {/* Avatar Generator Modal */}
      {showAvatarGenerator && (
        <GeminiImageModal
          open={showAvatarGenerator}
          onClose={() => setShowAvatarGenerator(false)}
        />
      )}

      {/* Dashboard Tour - Temporarily disabled for syntax fix */}
    </div>
  );
};

export default Dashboard;