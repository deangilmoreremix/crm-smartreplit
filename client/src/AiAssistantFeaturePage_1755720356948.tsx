import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Brain, 
  MessageSquare, 
  Zap, 
  Code, 
  Database, 
  ChevronRight, 
  CheckCheck, 
  ArrowRight, 
  Play,
  Star,
  Sparkles,
  PlusCircle,
  Settings,
  RefreshCw,
  Check,
  X,
  FileText,
  BarChart3,
  Calendar,
  Search
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const AiAssistantFeaturePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'functions' | 'customization'>('overview');
  const [playingDemo, setPlayingDemo] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Simulated chat conversation for the demo
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI sales assistant. How can I help you today?' },
  ]);
  const [demoMessageIndex, setDemoMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypedMessage, setCurrentTypedMessage] = useState('');
  
  const demoMessages = [
    { role: 'user', content: 'Can you help me find my high-value deals?' },
    { role: 'assistant', content: 'I\'ll search for your high-value deals. Based on your CRM data, here are the top 3 highest value deals in your pipeline:\n\n1. Enterprise License with Acme Inc - $75,000 (Qualification stage)\n2. Cloud Migration with Wayne Enterprises - $95,000 (Qualification stage)\n3. Implementation Services with Umbrella Corp - $50,000 (Negotiation stage)\n\nWould you like more details on any of these deals?' },
    { role: 'user', content: 'Give me more details about the Cloud Migration deal' },
    { role: 'assistant', content: 'Here are the details for the Cloud Migration deal with Wayne Enterprises:\n\n• Value: $95,000\n• Current stage: Qualification\n• Probability: 10%\n• Days in stage: 1\n• Priority: High\n• Contact: Bruce Wayne (CTO)\n• Expected close date: August 5, 2025\n\nThis deal is still in early stages. Would you like me to help you move this deal forward by creating a follow-up task?' },
    { role: 'user', content: 'Yes, please schedule a follow-up task for next Tuesday' },
    { role: 'assistant', content: 'I\'ve created a follow-up task for the Cloud Migration deal with Wayne Enterprises.\n\n✅ Task details:\n• Title: "Follow up with Bruce Wayne about Cloud Migration proposal"\n• Due date: Next Tuesday at 10:00 AM\n• Priority: High\n• Notes: "Discuss technical requirements and timeline for the Cloud Migration project"\n\nThe task has been added to your calendar. Is there anything else you need help with?' }
  ];
  
  // Advance the demo conversation
  const advanceDemo = () => {
    if (demoMessageIndex >= demoMessages.length) {
      setDemoMessageIndex(0);
      setChatMessages([{ role: 'assistant', content: 'Hello! I\'m your AI sales assistant. How can I help you today?' }]);
      return;
    }
    
    const nextMessage = demoMessages[demoMessageIndex];
    setIsTyping(true);
    
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      setCurrentTypedMessage(nextMessage.content.substring(0, charIndex));
      charIndex++;
      
      if (charIndex > nextMessage.content.length) {
        clearInterval(typingInterval);
        setIsTyping(false);
        setChatMessages([...chatMessages, { ...nextMessage, content: currentTypedMessage }]);
        setCurrentTypedMessage('');
        setDemoMessageIndex(demoMessageIndex + 1);
      }
    }, 20); // Typing speed
  };
  
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                AI Assistant That <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Understands</span> Your Business
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Experience the power of a persistent AI assistant that remembers context, understands your CRM data, and can take actions on your behalf to save you time and close more deals.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#demo" className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition duration-300 flex items-center">
                  See It in Action <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
              <div className="mt-8 flex items-center text-sm text-gray-500">
                <CheckCheck size={18} className="text-green-500 mr-2" />
                No credit card required • 14-day free trial
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div className="flex items-center">
                      <Brain size={20} className="text-indigo-600 mr-2" />
                      <h3 className="font-semibold">AI Sales Assistant</h3>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  
                  <div className="h-80 p-4 overflow-y-auto bg-white">
                    <div className="space-y-4">
                      {chatMessages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-3/4 p-3 rounded-lg ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                            <p className="whitespace-pre-line">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="max-w-3/4 p-3 rounded-lg bg-gray-100 text-gray-800">
                            <p className="whitespace-pre-line">{currentTypedMessage}</p>
                            <span className="inline-block ml-1 animate-pulse">▋</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ask your AI assistant..."
                        className="w-full p-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        readOnly
                      />
                      <button 
                        className="absolute right-2 top-2 text-indigo-600 hover:text-indigo-800"
                        onClick={advanceDemo}
                      >
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ 
          clipPath: 'polygon(100% 0%, 0% 0%, 0% 100%, 4% 95%, 8% 100%, 12% 95%, 16% 90%, 20% 95%, 24% 100%, 28% 95%, 32% 90%, 36% 95%, 40% 100%, 44% 95%, 48% 90%, 52% 95%, 56% 100%, 60% 95%, 64% 90%, 68% 95%, 72% 100%, 76% 95%, 80% 90%, 84% 95%, 88% 100%, 92% 95%, 96% 90%, 100% 95%)'
        }}></div>
      </section>
      
      {/* Key Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">More Than Just a Chatbot</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI Assistant is deeply integrated with your CRM data and can perform real actions to help you work more efficiently.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="p-3 bg-indigo-100 rounded-full w-min mb-4">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Remembers Context</h3>
              <p className="text-gray-600">
                Unlike simple chatbots, our AI Assistant remembers your entire conversation history and maintains context across sessions for truly meaningful interactions.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="p-3 bg-violet-100 rounded-full w-min mb-4">
                <Database className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Accesses Your CRM Data</h3>
              <p className="text-gray-600">
                Get instant answers about your contacts, deals, and activities without having to search through multiple screens or run reports.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="p-3 bg-fuchsia-100 rounded-full w-min mb-4">
                <Zap className="h-6 w-6 text-fuchsia-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Takes Action For You</h3>
              <p className="text-gray-600">
                Create tasks, schedule meetings, update deals, and more—directly through your conversation with the AI Assistant.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-b from-indigo-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block p-2 bg-indigo-100 rounded-full text-indigo-600 mb-4">
              <MessageSquare size={24} />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See the AI Assistant in Action</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Watch how our AI Assistant can help you find information, analyze data, and take action all in a natural conversation.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-5xl mx-auto">
            {/* Demo Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'functions' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('functions')}
              >
                Function Capabilities
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'customization' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('customization')}
              >
                Customization
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                    {/* This would be a video in a real implementation */}
                    <div className="flex items-center justify-center h-full bg-indigo-900">
                      <div className="text-center">
                        {playingDemo ? (
                          <div className="space-y-4">
                            <div className="relative mx-auto w-full max-w-2xl bg-white rounded-lg shadow-lg p-4">
                              <div className="flex items-center justify-between mb-4 border-b pb-2">
                                <div className="flex items-center">
                                  <Brain size={20} className="text-indigo-600 mr-2" />
                                  <span className="font-medium">AI Sales Assistant Demo</span>
                                </div>
                                <button 
                                  onClick={() => setPlayingDemo(false)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                              <div className="space-y-4 min-h-[200px] max-h-[300px] overflow-y-auto p-2">
                                {chatMessages.map((msg, idx) => (
                                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md p-3 rounded-lg ${
                                      msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      <p className="whitespace-pre-line text-sm">{msg.content}</p>
                                    </div>
                                  </div>
                                ))}
                                {isTyping && (
                                  <div className="flex justify-start">
                                    <div className="max-w-md p-3 rounded-lg bg-gray-100">
                                      <div className="flex space-x-2">
                                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                        <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 pt-2 border-t">
                                <button
                                  onClick={advanceDemo}
                                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                  {demoMessageIndex >= demoMessages.length 
                                    ? 'Restart Demo' 
                                    : demoMessageIndex % 2 === 0 
                                      ? 'Send Message' 
                                      : 'Continue Demo'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="h-20 w-20 mx-auto rounded-full bg-indigo-600 flex items-center justify-center cursor-pointer"
                              onClick={() => setPlayingDemo(true)}
                            >
                              <Play size={36} fill="white" stroke="none" />
                            </div>
                            <p className="text-white font-medium">Click to play demo</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Search size={18} className="text-indigo-600 mr-2" />
                        <h3 className="font-medium">Find Information</h3>
                      </div>
                      <p className="text-sm text-gray-600">Ask about contacts, deals, or activities in natural language without hunting through your CRM.</p>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Calendar size={18} className="text-indigo-600 mr-2" />
                        <h3 className="font-medium">Create Tasks & Events</h3>
                      </div>
                      <p className="text-sm text-gray-600">Schedule follow-ups, create tasks, and manage your calendar through simple conversation.</p>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <BarChart3 size={18} className="text-indigo-600 mr-2" />
                        <h3 className="font-medium">Get Insights</h3>
                      </div>
                      <p className="text-sm text-gray-600">Receive data-driven recommendations and analysis of your sales performance.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'functions' && (
                <div className="space-y-6">
                  <p className="text-gray-700">
                    Our AI Assistant can perform real actions in your CRM through function calling. This goes beyond just answering questions—it can actually do things for you.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Available Functions</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600 mr-3 mt-0.5">
                          <Search size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium">Search Deals & Contacts</h4>
                          <p className="text-sm text-gray-600">Find records matching various criteria including status, value, name, etc.</p>
                          <code className="block mt-1 text-xs bg-gray-100 p-2 rounded text-indigo-700">
                            "Find all deals worth over $50,000 in the negotiation stage"
                          </code>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="p-2 bg-green-100 rounded-full text-green-600 mr-3 mt-0.5">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium">Create Tasks & Schedule Events</h4>
                          <p className="text-sm text-gray-600">Create follow-up tasks, reminders, or schedule meetings.</p>
                          <code className="block mt-1 text-xs bg-gray-100 p-2 rounded text-indigo-700">
                            "Schedule a follow up with John from Acme Inc next Tuesday at 2pm"
                          </code>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600 mr-3 mt-0.5">
                          <Database size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium">Update Records</h4>
                          <p className="text-sm text-gray-600">Modify deal details, update contact information, or change statuses.</p>
                          <code className="block mt-1 text-xs bg-gray-100 p-2 rounded text-indigo-700">
                            "Move the Acme Inc deal to negotiation stage and update the probability to 60%"
                          </code>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="p-2 bg-purple-100 rounded-full text-purple-600 mr-3 mt-0.5">
                          <FileText size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium">Generate Content</h4>
                          <p className="text-sm text-gray-600">Create emails, meeting agendas, or call scripts based on your CRM data.</p>
                          <code className="block mt-1 text-xs bg-gray-100 p-2 rounded text-indigo-700">
                            "Draft a follow-up email to Sarah about our recent proposal"
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                    <div 
                      className="absolute top-4 right-4 text-indigo-600 cursor-pointer" 
                      onMouseEnter={() => setShowTooltip(true)} 
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <Sparkles size={16} />
                    </div>
                    {showTooltip && (
                      <div className="absolute top-0 right-0 mt-8 mr-4 w-60 p-2 bg-white border border-gray-200 rounded-lg shadow-lg text-xs text-gray-600 z-10">
                        All function calls are securely executed through your CRM with proper authentication and logging.
                      </div>
                    )}
                    <h3 className="font-medium text-indigo-900 mb-2">Security & Control</h3>
                    <p className="text-sm text-indigo-800">
                      You maintain complete control over what functions the AI Assistant can access. Easily enable or disable specific capabilities and set permissions based on user roles.
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'customization' && (
                <div className="space-y-6">
                  <p className="text-gray-700">
                    Our AI Assistant is highly customizable to match your specific business needs, communication style, and sales process.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-center mb-3">
                        <Settings size={18} className="text-indigo-600 mr-2" />
                        <h3 className="font-medium">Customizable Instructions</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Define exactly how your AI Assistant should communicate, what information it should focus on, and your preferred response style.
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-center mb-3">
                        <Code size={18} className="text-indigo-600 mr-2" />
                        <h3 className="font-medium">Custom Functions</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Connect the AI Assistant to your specific business operations and tools through custom function definitions.
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-center mb-3">
                        <FileText size={18} className="text-indigo-600 mr-2" />
                        <h3 className="font-medium">Knowledge Base Integration</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Upload your company documents, product information, and sales materials for the AI to reference during conversations.
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-center mb-3">
                        <Brain size={18} className="text-indigo-600 mr-2" />
                        <h3 className="font-medium">Model Selection</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Choose between different AI models based on your needs for speed, accuracy, or specialized capabilities.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 p-4 rounded-lg border border-indigo-100 relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="font-medium text-indigo-900 mb-3">Create Multiple Assistants</h3>
                      <div className="flex flex-wrap gap-3 mb-3">
                        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">Sales Coach</div>
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Lead Qualifier</div>
                        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Deal Analyzer</div>
                        <div className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">Meeting Prep</div>
                        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center">
                          <PlusCircle size={14} className="mr-1" />
                          Custom Assistant
                        </div>
                      </div>
                      <p className="text-sm text-indigo-800">
                        Create specialized AI assistants for different roles and tasks within your sales organization.
                      </p>
                    </div>
                    
                    {/* Decorative element */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-200 rounded-full opacity-20"></div>
                    <div className="absolute -top-10 -left-10 w-20 h-20 bg-purple-200 rounded-full opacity-20"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Results Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Real-World Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI Assistant is transforming sales teams and driving measurable outcomes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2 flex justify-center items-baseline">
                32% <span className="text-base text-gray-500 ml-1">faster</span>
              </div>
              <p className="text-gray-700">Average response time to customer inquiries</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2 flex justify-center items-baseline">
                4.8 <span className="text-base text-gray-500 ml-1">hours</span>
              </div>
              <p className="text-gray-700">Weekly time saved per sales representative</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2 flex justify-center items-baseline">
                28% <span className="text-base text-gray-500 ml-1">increase</span>
              </div>
              <p className="text-gray-700">In qualified opportunities identified</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/3 mb-6 md:mb-0 md:pr-8">
                <img 
                  src="https://images.pexels.com/photos/1587014/pexels-photo-1587014.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Testimonial" 
                  className="rounded-xl shadow-md w-full"
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="text-yellow-400 fill-yellow-400" size={20} />
                  ))}
                </div>
                <blockquote className="text-gray-700 italic mb-4">
                  "The AI Assistant has completely transformed how our team operates. It's like having an extra team member who works 24/7, helping us identify opportunities, manage our pipeline, and stay on top of follow-ups. The most impressive part is how it accesses our CRM data and can take actions for us."
                </blockquote>
                <div>
                  <p className="font-semibold text-gray-900">Michael Rodriguez</p>
                  <p className="text-gray-500">Sales Director, TechSolutions Inc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features In Depth */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Capabilities In Depth</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore the full range of what our AI Assistant can do for your sales team.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="p-3 bg-blue-100 rounded-full h-min text-blue-600">
                <Search size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Smart Data Retrieval</h3>
                <p className="text-gray-600 mb-3">
                  Ask for information in natural language and get precisely what you need without navigating complex CRM screens.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Find deals by value, stage, or probability</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Look up contact details and interaction history</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Identify overdue tasks and upcoming meetings</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="p-3 bg-purple-100 rounded-full h-min text-purple-600">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Task & Event Management</h3>
                <p className="text-gray-600 mb-3">
                  Create and manage your tasks and appointments through simple conversations with your AI Assistant.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Create follow-up tasks with natural language</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Schedule meetings with availability checking</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Get reminders for upcoming deadlines</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="p-3 bg-green-100 rounded-full h-min text-green-600">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Deal Management</h3>
                <p className="text-gray-600 mb-3">
                  Update deals, move them through your pipeline, and get insights on what actions to take next.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Update deal stages and values with a simple message</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Get AI-powered recommendations on next steps</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Identify deals at risk or with high closing potential</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="p-3 bg-amber-100 rounded-full h-min text-amber-600">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Sales Coaching</h3>
                <p className="text-gray-600 mb-3">
                  Get personalized sales coaching, objection handling help, and performance insights.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Ask for help with specific customer objections</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Receive personalized performance insights</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Get strategic advice on complex deals</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Comparison Section */}
      <section className="py-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Not All AI Is Created Equal</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our purpose-built AI Assistant compares to general-purpose AI tools.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-gray-600 font-medium text-sm uppercase tracking-wider">Feature</th>
                  <th className="px-6 py-4 text-center text-indigo-600 font-medium text-sm uppercase tracking-wider border-l border-gray-200">
                    <div className="flex items-center justify-center">
                      <Brain size={16} className="mr-2" />
                      Smart CRM AI Assistant
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-gray-600 font-medium text-sm uppercase tracking-wider border-l border-gray-200">General-Purpose AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Access to your CRM data</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">
                    <Check size={20} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 border-l border-gray-200">
                    <X size={20} />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Can perform actions in your CRM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">
                    <Check size={20} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 border-l border-gray-200">
                    <X size={20} />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sales-specific training</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">
                    <Check size={20} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 border-l border-gray-200">
                    <X size={20} />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Remembers conversation history</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">
                    <Check size={20} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600 border-l border-gray-200">
                    <Check size={20} />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Customizable for your business</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">
                    <Check size={20} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 border-l border-gray-200">
                    <span className="text-xs">Limited</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Data privacy & security</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">
                    <div className="flex justify-center items-center">
                      <Check size={20} />
                      <span className="ml-1 text-xs">Enterprise-grade</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-yellow-600 border-l border-gray-200">
                    <span className="text-xs">Varies by provider</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      {/* Setup & Getting Started */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Easy to Set Up, Powerful to Use</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with our AI Assistant takes minutes, not days or weeks.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="relative">
                <div className="absolute top-0 left-8 h-full w-0.5 bg-indigo-100 z-0"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mb-4">1</div>
                  <h3 className="font-bold text-lg mb-2 text-center">Create Your Assistant</h3>
                  <p className="text-gray-600 text-center text-sm">
                    Set up your AI Assistant with a few clicks and customize its name and capabilities.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute top-0 left-8 h-full w-0.5 bg-indigo-100 z-0"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mb-4">2</div>
                  <h3 className="font-bold text-lg mb-2 text-center">Connect Your Data</h3>
                  <p className="text-gray-600 text-center text-sm">
                    Enable the functions you want your assistant to access and set security parameters.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mb-4">3</div>
                  <h3 className="font-bold text-lg mb-2 text-center">Start Conversing</h3>
                  <p className="text-gray-600 text-center text-sm">
                    Begin talking to your assistant immediately—no training or complex setup required.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Ready to Experience the Future of Sales?</h3>
                <p className="text-lg opacity-90 mb-6">
                  Join thousands of sales professionals who are using our AI Assistant to work smarter and close more deals.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    to="/register" 
                    className="px-6 py-3 bg-white text-indigo-600 hover:bg-gray-100 font-medium rounded-lg transition-colors"
                  >
                    Start Free Trial
                  </Link>
                  <Link 
                    to="/ai-tools" 
                    className="px-6 py-3 bg-indigo-500 bg-opacity-30 hover:bg-opacity-40 text-white font-medium rounded-lg transition-colors"
                  >
                    Explore All AI Tools
                  </Link>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default AiAssistantFeaturePage;