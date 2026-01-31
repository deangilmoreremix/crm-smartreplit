
import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Brain, 
  MessageSquare, 
  Search, 
  Calendar, 
  Mail, 
  FileText, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  ChevronRight,
  Star,
  Clock,
  Zap
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import FeatureCard from '../components/FeatureCard';
import TestimonialCard from '../components/TestimonialCard';

const AiAssistantFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Your Personal <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">AI Sales Assistant</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Meet your context-aware AI assistant that remembers every conversation, understands your sales process, and takes action to help you close more deals faster.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#features" className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition duration-300 flex items-center">
                  Explore Features <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Brain size={16} className="text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">You: "Schedule a follow-up with TechCorp next Tuesday"</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle size={16} className="text-green-600" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-800">I've scheduled a follow-up meeting with TechCorp for next Tuesday at 2 PM. I've also prepared talking points based on your previous conversations and added a reminder to your calendar.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Intelligent Assistant Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your AI assistant understands context, learns from your interactions, and takes meaningful actions to accelerate your sales process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-indigo-600" />}
              title="Context-Aware Conversations"
              description="Remembers every interaction, understands your sales context, and provides relevant suggestions based on your history."
              link="/signup"
            />
            
            <FeatureCard
              icon={<Search className="h-8 w-8 text-blue-600" />}
              title="Intelligent CRM Search"
              description="Find any contact, deal, or information instantly using natural language queries across your entire CRM database."
              link="/signup"
            />
            
            <FeatureCard
              icon={<Calendar className="h-8 w-8 text-green-600" />}
              title="Smart Scheduling"
              description="Automatically schedule meetings, set reminders, and manage your calendar based on your conversation requests."
              link="/signup"
            />
            
            <FeatureCard
              icon={<Mail className="h-8 w-8 text-purple-600" />}
              title="Email Generation"
              description="Compose personalized emails, follow-ups, and proposals that match your tone and sales methodology."
              link="/signup"
            />
            
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-orange-600" />}
              title="Document Analysis"
              description="Analyze contracts, proposals, and documents to extract key insights and action items automatically."
              link="/signup"
            />
            
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-red-600" />}
              title="Sales Intelligence"
              description="Get real-time insights about deal progression, risk assessment, and next best actions for every opportunity."
              link="/signup"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transform Your Sales Productivity
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI assistant helps sales professionals achieve better results
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">5+ Hours Saved Daily</h3>
              <p className="text-gray-600">
                Automate routine tasks and get instant answers to complex questions, freeing up time for relationship building.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">40% More Deals Closed</h3>
              <p className="text-gray-600">
                Never miss a follow-up or opportunity with intelligent reminders and contextual recommendations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Instant Insights</h3>
              <p className="text-gray-600">
                Get immediate analysis of deals, contacts, and opportunities with natural language queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Sales Teams Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from professionals who've transformed their sales process with our AI assistant
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="The AI assistant feels like having a personal sales coach that never sleeps. It remembers everything and always knows what I need to do next."
              name="Sarah Mitchell"
              position="Senior Sales Rep"
              company="TechFlow"
              image="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
            
            <TestimonialCard
              quote="I can ask complex questions about my pipeline and get instant, accurate answers. It's like having a sales analyst on my team 24/7."
              name="David Chen"
              position="Account Executive"
              company="CloudVantage"
              image="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
            
            <TestimonialCard
              quote="The contextual email generation is incredible. It writes emails that sound exactly like me and always hits the right tone for each prospect."
              name="Lisa Rodriguez"
              position="Sales Manager"
              company="GrowthLabs"
              image="https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Your AI Sales Assistant?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of sales professionals who are closing more deals with the help of AI.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-white text-indigo-700 font-medium rounded-lg hover:shadow-lg transition duration-300">
              Start Your Free Trial
            </Link>
            <Link to="/features" className="px-8 py-4 bg-indigo-500 bg-opacity-30 hover:bg-opacity-40 text-white font-medium rounded-lg transition-colors">
              Explore All Features
            </Link>
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default AiAssistantFeaturePage;
