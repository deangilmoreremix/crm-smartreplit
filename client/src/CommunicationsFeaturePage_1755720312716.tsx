import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Video,
  Send,
  Volume2,
  Users,
  Clock,
  Target,
  CheckCheck,
  ChevronRight,
  ArrowRight,
  Star,
  Mic,
  FileText,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const CommunicationsFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Communicate Smarter with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Unified Messaging</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect with prospects and customers through email, phone, SMS, and video - all from one platform. Personalize every touchpoint and track engagement across all channels.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#communication-tools" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition duration-300 flex items-center">
                  Explore Tools <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
              <div className="mt-8 flex items-center text-sm text-gray-500">
                <CheckCheck size={18} className="text-green-500 mr-2" />
                No setup required • All channels included
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                <img
                  src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Communication Dashboard"
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Streamline All Your Communications</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to connect with customers, from first contact to closing the deal and beyond.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Unified Conversations</h3>
              <p className="text-gray-600">
                See all communication history with each contact in one place. Never lose context across email, phone, and messaging.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-emerald-100 rounded-full w-min mb-4">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Automation</h3>
              <p className="text-gray-600">
                Automate follow-ups, generate personalized messages, and get AI suggestions for the best communication timing.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Performance Insights</h3>
              <p className="text-gray-600">
                Track open rates, response times, and engagement metrics across all channels to optimize your outreach.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Communication Tools Showcase Section */}
      <section id="communication-tools" className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Communication Suite</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Reach your prospects and customers through their preferred channels with personalized, trackable messages.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Email</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Send personalized emails with AI-generated content, track opens and clicks, and automate follow-up sequences.
              </p>
              <Link to="/video-email" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Try Email Tools <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-emerald-100 rounded-full w-min mb-4">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">VoIP Phone System</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Make and receive calls directly from the CRM with automatic call logging and conversation tracking.
              </p>
              <Link to="/phone" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Explore Phone System <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">SMS Messaging</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Send bulk SMS campaigns, personalized text messages, and set up automated drip campaigns.
              </p>
              <Link to="/text-messages" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                View SMS Tools <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-rose-100 rounded-full w-min mb-4">
                <Video className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Video Email</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Create personalized video messages that stand out in crowded inboxes and increase response rates.
              </p>
              <Link to="/video-email" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Create Video Email <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <Volume2 className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Voice Profiles</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Create custom voice profiles and audio content for voicemails, presentations, and marketing materials.
              </p>
              <Link to="/voice-profiles" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Manage Voice Profiles <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="p-3 bg-cyan-100 rounded-full w-min mb-4">
                <FileText className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Email Templates</h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Use pre-built templates or create custom email templates with dynamic content and personalization.
              </p>
              <Link to="/video-email" className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
                Browse Templates <ArrowRight className="h-4 w-4 ml-1" />
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
                    <Mail className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold">Smart Email Composer</h3>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="mb-2 text-sm font-medium text-gray-700">To:</div>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 border border-gray-200">
                      sarah.johnson@techcorp.com
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="mb-2 text-sm font-medium text-gray-700">Subject:</div>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 border border-gray-200">
                      Follow-up: Your CRM Integration Project
                    </div>
                  </div>
                  
                  <div className="text-center py-4">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center mx-auto">
                      <Zap className="h-4 w-4 mr-2" />
                      Generate with AI
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <div className="mb-2 text-sm font-medium text-gray-700">AI-Generated Email</div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-gray-700 border border-blue-100">
                      <p className="mb-3">Hi Sarah,</p>
                      <p className="mb-3">I hope this email finds you well. I wanted to follow up on our conversation about your CRM integration project.</p>
                      <p className="mb-3">Based on your requirements for automated workflows and real-time analytics, I believe our Smart CRM platform would be an excellent fit. Here's how we can help:</p>
                      <ul className="list-disc pl-5 mb-3 space-y-1">
                        <li>Seamless integration with your existing tech stack</li>
                        <li>Custom workflow automation to save 5+ hours per week</li>
                        <li>Real-time dashboards for instant insights</li>
                      </ul>
                      <p className="mb-3">Would you be available for a 15-minute demo this week? I'd love to show you exactly how this would work for TechCorp.</p>
                      <p>Best regards,<br/>Your Name</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <div>
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold ml-3">Smart Email Composer</h3>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Personalized Emails in Seconds</h2>
                
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  Create compelling, personalized emails that get responses. Our AI analyzes your contact's profile and generates perfectly tailored messages every time.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Context-Aware Content</h4>
                      <p className="text-gray-600">AI understands your prospect's industry, role, and previous interactions.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Multiple Tone Options</h4>
                      <p className="text-gray-600">Choose from professional, friendly, or urgent tones based on the situation.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Performance Tracking</h4>
                      <p className="text-gray-600">Monitor open rates, click-through rates, and response rates.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">A/B Testing</h4>
                      <p className="text-gray-600">Test different subject lines and content to optimize performance.</p>
                    </div>
                  </div>
                </div>
                
                <Link to="/video-email" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300">
                  Try Email Tools <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Communication Statistics */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Communication That Gets Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how Smart CRM's communication tools help businesses connect better with their customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">35%</div>
              <div className="text-gray-600">Higher Email Open Rates</div>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">60%</div>
              <div className="text-gray-600">Faster Response Times</div>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">28%</div>
              <div className="text-gray-600">More Qualified Leads</div>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-rose-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">92%</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Integration Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Seamless Integration</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect your existing tools and workflows for a unified communication experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Email Providers</h3>
              <p className="text-gray-600">
                Connect Gmail, Outlook, and other email providers for seamless email management.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-emerald-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Phone className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Phone Systems</h3>
              <p className="text-gray-600">
                Integrate with popular VoIP providers and phone systems for unified calling.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Automation Tools</h3>
              <p className="text-gray-600">
                Connect with Zapier, webhooks, and other automation tools for workflow optimization.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Communication?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Start connecting with prospects and customers more effectively today. Try all communication features free for 14 days.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:shadow-lg transition duration-300">
              Start Free Trial
            </Link>
            <Link to="/dashboard" className="px-8 py-4 bg-blue-500 text-white font-medium rounded-lg border border-blue-400 hover:bg-blue-400 transition duration-300 flex items-center">
              View Demo <ChevronRight size={18} className="ml-1" />
            </Link>
          </div>
          
          <div className="mt-8 flex items-center justify-center text-blue-100">
            <CheckCheck size={18} className="mr-2" />
            No credit card required • Cancel anytime
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default CommunicationsFeaturePage;