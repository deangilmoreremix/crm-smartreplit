import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Search, 
  Database, 
  Zap, 
  FileText, 
  ChevronRight, 
  CheckCheck, 
  ArrowRight, 
  Play,
  Star,
  Users,
  BarChart3,
  RefreshCw,
  Filter,
  ArrowUp,
  MousePointer
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const SemanticSearchFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Find <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Exactly What You Need</span> Instantly
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover the power of semantic search that understands meaning, not just keywords. Find contacts, deals, and information in your CRM using natural language.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#demo" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition duration-300 flex items-center">
                  See It in Action <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
              <div className="mt-8 flex items-center text-sm text-gray-500">
                <CheckCheck size={18} className="text-green-500 mr-2" />
                No credit card required
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Search size={20} className="text-blue-600 mr-2" />
                      <h3 className="font-semibold">Semantic Search</h3>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="relative mb-6">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-4 py-3 border-2 border-blue-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        placeholder="Search using natural language..."
                        defaultValue="customers with budget concerns about enterprise plan"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span className="font-medium">3 results found</span>
                        <div className="flex items-center">
                          <Filter size={14} className="mr-1" />
                          <span>Filter:</span>
                          <select className="ml-1 border-0 bg-transparent text-blue-600 font-medium focus:ring-0">
                            <option value="all">All</option>
                            <option value="contacts">Contacts</option>
                            <option value="deals">Deals</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Search Results */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-blue-600">John Doe</h3>
                            <p className="text-xs text-gray-500">CTO at Acme Inc</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium">
                              Match: 92%
                            </div>
                            <div className="text-xs text-gray-500">
                              contact
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          <span className="bg-yellow-200">Interested in enterprise plan. Has concerns about implementation timeline and budget.</span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-purple-600">Enterprise License</h3>
                            <p className="text-xs text-gray-500">Acme Inc - $75,000</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium">
                              Match: 85%
                            </div>
                            <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 capitalize">
                              qualification
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          <span className="bg-yellow-200">Client has expressed budget concerns about the enterprise plan pricing. Need to discuss ROI.</span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-blue-600">Robert Johnson</h3>
                            <p className="text-xs text-gray-500">CEO at Initech</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium">
                              Match: 78%
                            </div>
                            <div className="text-xs text-gray-500">
                              contact
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          <span className="bg-yellow-200">Interested in comprehensive CRM solution. Budget concerns, but decision maker.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Beyond Basic Search</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our semantic search doesn't just match keywords—it understands context, meaning, and intent.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <MousePointer className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Natural Language</h3>
              <p className="text-gray-600">
                Search the way you talk—using complete sentences, questions, and conversational language rather than rigid keywords.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-cyan-100 rounded-full w-min mb-4">
                <Database className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Cross-CRM Search</h3>
              <p className="text-gray-600">
                Search across all your CRM data at once—contacts, companies, deals, emails, notes, tasks, and more—from a single query.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Relevance</h3>
              <p className="text-gray-600">
                Results ranked by true relevance to your query, not just keyword matches, saving you time finding exactly what you need.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-1/2">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold ml-3">Search Examples</h3>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Find Anything in Seconds</h2>
                
                <p className="text-gray-600 mb-8">
                  See how semantic search understands context and meaning to find exactly what you need—even when your query doesn't contain exact keyword matches.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-gray-900">Contact Search</div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">Try it</button>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      "Find decision makers in the healthcare industry who haven't been contacted in the last month"
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-gray-900">Deal Search</div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">Try it</button>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      "Show me high-value deals that have been stuck in negotiation for more than two weeks"
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-gray-900">Activity Search</div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">Try it</button>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      "Find all meetings where we discussed pricing objections with enterprise clients"
                    </p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Play size={18} className="mr-2" />
                    Watch Demo Video
                  </button>
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center">
                      <Search className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold">Semantic Search Demo</h3>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        defaultValue="leads who expressed interest in AI features"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-blue-600">Michael Brown</h3>
                            <p className="text-xs text-gray-500">Head of Innovation at Stark Industries</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            95% match
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <p>
                            <span className="text-gray-500">Note:</span>
                            <span className="bg-yellow-100"> Interested in AI features</span>. Mentioned specific interest in the AI-powered analytics.
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-blue-600">Jane Smith</h3>
                            <p className="text-xs text-gray-500">Marketing Director at Globex Corp</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            87% match
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <p>
                            <span className="text-gray-500">Email:</span> "Would like to see a demo of your <span className="bg-yellow-100">AI capabilities</span>, particularly for marketing automation."
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-purple-600">Enterprise AI Package</h3>
                            <p className="text-xs text-gray-500">Deal with Wayne Enterprises - $95,000</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            82% match
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <p>
                            <span className="text-gray-500">Notes:</span> Client specifically <span className="bg-yellow-100">interested in advanced AI analysis features</span> for business intelligence.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Technical Highlights */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our semantic search uses advanced AI to understand meaning and context, not just keywords.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="font-bold text-lg">Embedding Creation</h3>
              </div>
              <p className="text-gray-600 text-sm">
                We convert all your CRM data into rich vector embeddings that capture the semantic meaning of each document, contact, and deal.
              </p>
              <div className="mt-4 h-24 w-full bg-blue-50 rounded-lg flex items-center justify-center">
                <RefreshCw size={32} className="text-blue-300" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <span className="font-bold">2</span>
                </div>
                <h3 className="font-bold text-lg">Query Understanding</h3>
              </div>
              <p className="text-gray-600 text-sm">
                When you search, our AI interprets your natural language query to understand your true intent and context.
              </p>
              <div className="mt-4 h-24 w-full bg-blue-50 rounded-lg flex items-center justify-center">
                <ArrowUp size={32} className="text-blue-300" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <span className="font-bold">3</span>
                </div>
                <h3 className="font-bold text-lg">Semantic Matching</h3>
              </div>
              <p className="text-gray-600 text-sm">
                We match your query against all CRM data using advanced vector similarity to find truly relevant results, not just keyword matches.
              </p>
              <div className="mt-4 h-24 w-full bg-blue-50 rounded-lg flex items-center justify-center">
                <Search size={32} className="text-blue-300" />
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-blue-50 rounded-xl p-6 max-w-5xl mx-auto border border-blue-100">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 mb-6 md:mb-0">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Always Learning and Improving</h3>
                <p className="text-gray-700 mb-4">
                  Our semantic search engine continually learns from your interactions to improve result relevance and adapt to your unique terminology and business context.
                </p>
                <Link to="/features/semantic-search/technology" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                  Learn more about our technology <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
              <div className="w-full md:w-1/2 md:pl-8">
                <img 
                  src="https://images.pexels.com/photos/7911758/pexels-photo-7911758.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="AI Learning Visualization" 
                  className="rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Common Use Cases</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how different sales roles leverage semantic search to work more efficiently.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                <h3 className="font-bold text-lg flex items-center">
                  <Users size={20} className="mr-2" />
                  Sales Representatives
                </h3>
              </div>
              <div className="p-5">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Quickly find similar deals that have closed successfully for winning strategies</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Search for contacts with specific pain points or interests</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Find past conversations about specific topics or objections</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Locate product information and materials mentioned in past meetings</span>
                  </li>
                </ul>
                <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  Example: "Show me contacts who mentioned budget concerns but were still interested in our enterprise plan"
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4">
                <h3 className="font-bold text-lg flex items-center">
                  <BarChart3 size={20} className="mr-2" />
                  Sales Managers
                </h3>
              </div>
              <div className="p-5">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Identify deals at risk across the entire team's pipeline</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Find patterns in successful and unsuccessful deals</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Search for team performance insights and coaching opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Discover which sales approaches work best for specific industries</span>
                  </li>
                </ul>
                <div className="mt-4 bg-cyan-50 p-3 rounded-lg text-sm text-cyan-800">
                  Example: "Find deals that have been stuck in negotiation phase for more than 30 days with high value"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Integration Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold ml-3">Fully Integrated</h3>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Works Across Your Entire CRM</h2>
              
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Our semantic search is deeply integrated into every part of your CRM, making all your data instantly accessible through natural language queries.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Global Search Bar</h4>
                    <p className="text-gray-600">Search from anywhere in the CRM with our omnipresent search bar that understands what you need.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Context-Aware Results</h4>
                    <p className="text-gray-600">Get results that understand your current workflow context for even higher relevance.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Smart Filters</h4>
                    <p className="text-gray-600">Combine natural language with structured filters for precision searching when needed.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Voice Search</h4>
                    <p className="text-gray-600">Simply speak your query for hands-free searching on mobile or desktop.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Link to="/features/semantic-search/integrations" className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mr-4">
                  Learn More
                </Link>
                <button className="flex items-center text-blue-600 font-medium">
                  <Play size={16} className="mr-2" fill="currentColor" />
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2">
              <img 
                src="https://images.pexels.com/photos/6476808/pexels-photo-6476808.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Integrated Search" 
                className="rounded-xl shadow-xl border border-gray-200"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how semantic search is changing how sales teams work with their CRM.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="text-yellow-400 fill-yellow-400" size={18} />
                ))}
              </div>
              <p className="text-gray-700 italic mb-6">
                "I used to spend so much time hunting for information in our CRM. With semantic search, I can find exactly what I need in seconds. It's like having a personal assistant who knows our entire database."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img 
                    src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Daniel Clark" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Daniel Clark</p>
                  <p className="text-gray-500 text-sm">Enterprise Sales, NextGen Solutions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="text-yellow-400 fill-yellow-400" size={18} />
                ))}
              </div>
              <p className="text-gray-700 italic mb-6">
                "The semantic search is a game-changer for our team. Being able to ask 'Show me deals at risk' and get actual meaningful results—not just keyword matches—saves us hours every week."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img 
                    src="https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Sophia Martinez" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sophia Martinez</p>
                  <p className="text-gray-500 text-sm">Sales Manager, FutureTech Inc.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="text-yellow-400 fill-yellow-400" size={18} />
                ))}
              </div>
              <p className="text-gray-700 italic mb-6">
                "As a new hire, I was struggling to find information in our CRM. The semantic search made onboarding so much easier—I could find relevant past deals and communications without knowing the exact keywords."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img 
                    src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Kyle Johnson" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Kyle Johnson</p>
                  <p className="text-gray-500 text-sm">Sales Rep, Innovate Digital</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform How You Search Your CRM?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Join thousands of sales professionals who are finding information faster and uncovering hidden insights with semantic search.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-white text-blue-700 font-medium rounded-lg hover:shadow-lg transition duration-300">
              Start Your Free Trial
            </Link>
            <Link to="/features" className="px-8 py-4 bg-blue-500 bg-opacity-30 hover:bg-opacity-40 text-white font-medium rounded-lg transition-colors">
              Explore All Features
            </Link>
          </div>
          <p className="mt-4 opacity-80">No credit card required</p>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default SemanticSearchFeaturePage;