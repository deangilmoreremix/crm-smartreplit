import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
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
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const AiToolsFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                AI-Powered Sales Tools that <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Close More Deals</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Our suite of AI tools helps you work smarter, personalize your outreach, and get data-driven insights to close more deals in less time.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#ai-tools" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition duration-300 flex items-center">
                  Explore Tools <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
              <div className="mt-8 flex items-center text-sm text-gray-500">
                <CheckCheck size={18} className="text-green-500 mr-2" />
                No credit card required • 14-day free trial
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                <img
                  src="https://images.pexels.com/photos/5561942/pexels-photo-5561942.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="AI Sales Tools Dashboard"
                  className="relative rounded-xl shadow-2xl border border-gray-200 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Supercharge Your Sales with AI</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI tools automate routine tasks, provide data-driven insights, and help you make better decisions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Save 5+ Hours Per Week</h3>
              <p className="text-gray-600">
                Automate repetitive tasks like email drafting, call summaries, and data entry to focus your time on closing deals.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-green-100 rounded-full w-min mb-4">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Personalize at Scale</h3>
              <p className="text-gray-600">
                Create personalized messages for each prospect based on their behavior, interests, and past interactions.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Data-Driven Decisions</h3>
              <p className="text-gray-600">
                Get AI-powered insights that help you prioritize leads, identify opportunities, and forecast sales accurately.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* AI Tools Showcase Section */}
      <section id="ai-tools" className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our AI Tools Suite</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how our comprehensive set of AI tools can transform every part of your sales process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Email Analysis</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Automatically extract key insights, sentiment, and action items from customer emails to prioritize your responses.
              </p>
              <Link to="/features/ai-tools/email-analysis" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Meeting Summarizer</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Transform meeting transcripts into concise, actionable summaries with key points and follow-up items.
              </p>
              <Link to="/features/ai-tools/meeting-summary" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-emerald-100 rounded-full w-min mb-4">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Proposal Generator</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Create professional, customized sales proposals in seconds that address specific client needs and pain points.
              </p>
              <Link to="/features/ai-tools/proposal-generator" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-indigo-100 rounded-full w-min mb-4">
                <Phone className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Call Script Generator</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Create personalized sales call scripts for more effective conversations, including objection handling.
              </p>
              <Link to="/features/ai-tools/call-script" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-rose-100 rounded-full w-min mb-4">
                <Target className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Subject Line Optimizer</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Generate high-converting email subject lines with performance predictions to maximize open rates.
              </p>
              <Link to="/features/ai-tools/subject-optimizer" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <FileSearch className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Competitor Analysis</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Analyze competitors and develop effective differentiation strategies to position your products better.
              </p>
              <Link to="/features/ai-tools/competitor-analysis" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-cyan-100 rounded-full w-min mb-4">
                <TrendingUp className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Market Trend Analysis</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Get insights on industry trends, market opportunities, and strategic recommendations for your target market.
              </p>
              <Link to="/features/ai-tools/market-trends" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-green-100 rounded-full w-min mb-4">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sales Insights Generator</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Get AI-powered insights and recommendations based on your CRM data to improve sales performance.
              </p>
              <Link to="/features/ai-tools/sales-insights" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sales Forecasting</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Generate AI-powered revenue projections and deal closure probability analysis for your sales pipeline.
              </p>
              <Link to="/features/ai-tools/sales-forecast" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Tool Demo Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                    <h3 className="font-semibold">Meeting Summarizer</h3>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="mb-2 text-sm font-medium text-gray-700">Meeting Transcript</div>
                    <div className="p-4 bg-gray-50 rounded-lg text-gray-700 text-sm max-h-48 overflow-y-auto border border-gray-200">
                      <p className="mb-2"><strong>John:</strong> Thanks everyone for joining today. We're here to discuss the new product features.</p>
                      <p className="mb-2"><strong>Sarah:</strong> I've reviewed the specs and have a few concerns about the timeline.</p>
                      <p className="mb-2"><strong>Mike:</strong> I think we can address those. What specifically are you worried about?</p>
                      <p className="mb-2"><strong>Sarah:</strong> The integration with our existing systems might take longer than estimated.</p>
                      <p className="mb-2"><strong>John:</strong> That's a good point. Let's allocate an additional week for testing.</p>
                      <p className="mb-2"><strong>Mike:</strong> Agreed. We should also consider bringing in the IT team earlier.</p>
                      <p className="mb-2"><strong>John:</strong> Great idea. Let's plan for that. Any other concerns?</p>
                      <p className="mb-2"><strong>Sarah:</strong> We need to ensure we have proper training materials ready for the sales team.</p>
                      <p className="mb-2"><strong>John:</strong> Absolutely. Mike, can you take the lead on that?</p>
                      <p><strong>Mike:</strong> Yes, I'll prepare a training plan by next Friday.</p>
                    </div>
                  </div>
                  
                  <div className="text-center py-4">
                    <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center mx-auto">
                      Summarize Meeting
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <div className="mb-2 text-sm font-medium text-gray-700">AI-Generated Summary</div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg text-gray-700 border border-purple-100">
                      <h4 className="font-semibold mb-2">Meeting Summary:</h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong>Key Discussion Points:</strong> New product features, integration timeline, and training materials.</li>
                        <li><strong>Concerns:</strong> Integration with existing systems may take longer than estimated.</li>
                        <li><strong>Decisions Made:</strong> Allocate an additional week for testing, involve IT team earlier in the process.</li>
                        <li><strong>Action Items:</strong>
                          <ul className="list-circle pl-4 mt-1">
                            <li>Mike to prepare training plan for sales team by next Friday</li>
                            <li>Revise project timeline to include extra testing week</li>
                            <li>Schedule early involvement of IT team</li>
                          </ul>
                        </li>
                        <li><strong>Overall Sentiment:</strong> Constructive and solution-oriented discussion.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <div>
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold ml-3">Meeting Summarizer</h3>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Never Miss a Key Detail From Your Meetings</h2>
                
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  Turn hours of meeting recordings into concise, actionable summaries in seconds. Our AI extracts key points, decisions, and follow-up items automatically.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Save Hours on Meeting Notes</h4>
                      <p className="text-gray-600">Automatically create comprehensive summaries of every call and meeting.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Extract Action Items</h4>
                      <p className="text-gray-600">Never drop the ball on follow-ups with automatically identified tasks.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Understand Customer Sentiment</h4>
                      <p className="text-gray-600">Gauge interest and identify concerns from tone and language analysis.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Share Insights with Your Team</h4>
                      <p className="text-gray-600">Easily distribute meeting insights to stakeholders who couldn't attend.</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Link to="/features/ai-tools/meeting-summary" className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors mr-4">
                    Learn More
                  </Link>
                  <button className="flex items-center text-purple-600 font-medium">
                    <Play size={16} className="mr-2" fill="currentColor" />
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Results & Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Real Results from Real Customers</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI tools are transforming sales processes and driving growth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">47%</div>
              <p className="text-gray-700">Increase in email response rates</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">68%</div>
              <p className="text-gray-700">Less time spent on meeting notes</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">32%</div>
              <p className="text-gray-700">Higher deal close rate</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">3.2x</div>
              <p className="text-gray-700">Return on investment</p>
            </div>
          </div>
          
          <div className="mt-16 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/3 mb-6 md:mb-0 md:pr-8">
                <img 
                  src="https://images.pexels.com/photos/5325104/pexels-photo-5325104.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Success Story"
                  className="rounded-xl shadow-md"
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="flex items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">TechFirm Increased Sales by 43%</h3>
                  <div className="ml-4 flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={20} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "Before using Smart CRM, our sales team was drowning in administrative tasks and struggling to prioritize leads effectively. The AI tools have been a game-changer. The email analysis and meeting summarizer save hours each week, and the lead scoring has helped us focus on the right opportunities."
                </p>
                <div className="flex items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Jennifer Williams</p>
                    <p className="text-sm text-gray-600">VP of Sales, TechFirm Inc.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Integration Partners Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Seamless Integrations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI tools work with all your favorite tools and services, providing a unified workflow.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 max-w-5xl mx-auto">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                <div className="text-gray-400 font-semibold text-lg">LOGO</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Supercharge Your Sales with AI?</h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of sales professionals using Smart CRM to close more deals with less effort.
            </p>
            <Link to="/register" className="px-8 py-4 bg-white text-blue-700 font-medium rounded-lg hover:shadow-lg transition duration-300 inline-block">
              Start Your Free Trial
            </Link>
            <p className="mt-4 opacity-80">No credit card required • Free for 14 days</p>
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default AiToolsFeaturePage;