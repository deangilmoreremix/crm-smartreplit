import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Users, 
  Search, 
  Tag, 
  BarChart3, 
  CheckCheck, 
  ChevronRight,
  ArrowRight,
  Play,
  Smartphone,
  Mail,
  MessageSquare,
  Star,
  Filter,
  UserPlus,
  Brain,
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const ContactsFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Contact Management <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Reimagined</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Organize all your contacts, track interactions, and get AI-powered insights to build stronger customer relationships.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#features" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition duration-300 flex items-center">
                  See Features <ChevronRight size={18} className="ml-1" />
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
                  src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Contact Management Interface"
                  className="relative rounded-xl shadow-2xl border border-gray-200 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Contact Management Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to organize, track, and engage with your contacts efficiently.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Intelligent Contact Profiles</h3>
              <p className="text-gray-600">
                Create rich contact profiles with all relevant information, interaction history, and automatic social media enrichment.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-green-100 rounded-full w-min mb-4">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Contact Segmentation</h3>
              <p className="text-gray-600">
                Organize contacts with custom fields, tags, and automated segmentation based on behavior and attributes.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Lead Scoring</h3>
              <p className="text-gray-600">
                Automatically score leads based on engagement, behavior, and profile data to prioritize your efforts.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <Search className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Advanced Search & Filtering</h3>
              <p className="text-gray-600">
                Find exactly who you're looking for with powerful search capabilities and customizable filters.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-indigo-100 rounded-full w-min mb-4">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Interaction Tracking</h3>
              <p className="text-gray-600">
                Log all communications and track every touchpoint with detailed interaction history.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-rose-100 rounded-full w-min mb-4">
                <BarChart3 className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Engagement Analytics</h3>
              <p className="text-gray-600">
                Measure engagement and response rates to optimize your communication strategy.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* AI Lead Scoring Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold">AI Lead Score</h3>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start mb-6">
                    <img 
                      src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                      alt="Contact avatar" 
                      className="h-12 w-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">Michael Johnson</h4>
                      <p className="text-gray-600 text-sm">VP of Technology, TechCorp</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-medium text-gray-700">Lead Score</span>
                      <span className="text-lg font-bold text-blue-600">85</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
                    <h4 className="font-semibold text-blue-800 mb-2">AI Analysis & Insights</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-2 flex-shrink-0 mt-0.5">1</span>
                        <span><strong>High-value prospect</strong> based on company size, industry, and position</span>
                      </li>
                      <li className="flex items-start">
                        <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-2 flex-shrink-0 mt-0.5">2</span>
                        <span><strong>Engagement level:</strong> High (opened 5 emails, visited pricing page 3 times)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-2 flex-shrink-0 mt-0.5">3</span>
                        <span><strong>Decision maker</strong> with budget authority</span>
                      </li>
                      <li className="flex items-start">
                        <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-2 flex-shrink-0 mt-0.5">4</span>
                        <span><strong>Recommend:</strong> Schedule a demo this week to maintain momentum</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                      View Full Profile
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Take Recommended Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold ml-3">AI Lead Scoring</h3>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Focus on the Right Leads at the Right Time</h2>
              
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Our AI automatically analyzes dozens of data points to identify your hottest leads and opportunities, so you can prioritize effectively.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Predictive Lead Scoring</h4>
                    <p className="text-gray-600">Score leads based on likelihood to convert using machine learning algorithms.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Engagement Tracking</h4>
                    <p className="text-gray-600">Automatically track interactions across email, calls, and website activity.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Personalized Recommendations</h4>
                    <p className="text-gray-600">Get AI-suggested next actions for each contact to move relationships forward.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Automatic Data Enrichment</h4>
                    <p className="text-gray-600">Enhance contact profiles with company data, social insights, and more.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Link to="/register" className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mr-4">
                  Try It Free
                </Link>
                <button className="flex items-center text-blue-600 font-medium">
                  <Play size={16} className="mr-2" fill="currentColor" />
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Multi-channel Communication Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Multi-Channel Communication</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Reach your contacts through their preferred channels, all from one unified platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Email Integration</h3>
              <p className="text-gray-600">
                Send personalized emails directly from contact records with templates, tracking, and scheduling.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-green-100 rounded-full w-min mb-4">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">SMS & Text Messaging</h3>
              <p className="text-gray-600">
                Send and receive text messages with contacts for quick, direct communication.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Activity Timeline</h3>
              <p className="text-gray-600">
                See a chronological history of all interactions with each contact in one unified view.
              </p>
            </div>
          </div>
          
          <div className="mt-16 flex justify-center">
            <Link to="/features/communications" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
              Explore Communication Tools
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our contact management features are transforming sales teams
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {Array(5).fill(0).map((_, index) => (
                  <Star 
                    key={index}
                    className="h-5 w-5 text-yellow-400 fill-yellow-400" 
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "The contact management in Smart CRM has completely transformed how we track and engage with prospects. The AI lead scoring is like having a sales assistant that never sleeps."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Customer" 
                  className="h-12 w-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">Alex Thompson</p>
                  <p className="text-gray-600 text-sm">Sales Manager, Innovate Inc</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {Array(5).fill(0).map((_, index) => (
                  <Star 
                    key={index}
                    className="h-5 w-5 text-yellow-400 fill-yellow-400" 
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "The ability to track all interactions in one place and get AI insights on which leads to prioritize has boosted our team's productivity by at least 30%. It's been a game-changer."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.pexels.com/photos/3775534/pexels-photo-3775534.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Customer" 
                  className="h-12 w-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">Samantha Rodriguez</p>
                  <p className="text-gray-600 text-sm">VP of Business Development, GrowFast</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {Array(5).fill(0).map((_, index) => (
                  <Star 
                    key={index}
                    className="h-5 w-5 text-yellow-400 fill-yellow-400" 
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "Smart CRM's contact management and segmentation features allow us to organize thousands of contacts effortlessly. The AI lead scoring ensures we're always focusing on high-value opportunities."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Customer" 
                  className="h-12 w-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">Marcus Chen</p>
                  <p className="text-gray-600 text-sm">Sales Director, Enterprise Solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Contact Management?</h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of sales teams who are organizing, tracking, and engaging with their contacts more effectively than ever before.
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

export default ContactsFeaturePage;