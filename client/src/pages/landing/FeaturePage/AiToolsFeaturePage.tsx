
import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Brain, 
  Zap, 
  FileText, 
  Mail, 
  TrendingUp, 
  Users, 
  Search, 
  Calendar, 
  CheckCircle, 
  ChevronRight,
  Star,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import FeatureCard from '../components/FeatureCard';
import TestimonialCard from '../components/TestimonialCard';

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
                20+ <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">AI Sales Tools</span> in One Platform
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Access a comprehensive suite of AI-powered tools designed specifically for sales professionals. From email generation to market analysis, everything you need to close more deals.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#tools" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition duration-300 flex items-center">
                  Explore Tools <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <Brain size={24} className="text-blue-600 mb-2" />
                      <h4 className="font-semibold text-sm">Email Generator</h4>
                      <p className="text-xs text-gray-600">AI-powered emails</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <BarChart3 size={24} className="text-purple-600 mb-2" />
                      <h4 className="font-semibold text-sm">Sales Analytics</h4>
                      <p className="text-xs text-gray-600">Performance insights</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <Target size={24} className="text-green-600 mb-2" />
                      <h4 className="font-semibold text-sm">Lead Scoring</h4>
                      <p className="text-xs text-gray-600">Intelligent scoring</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <Search size={24} className="text-orange-600 mb-2" />
                      <h4 className="font-semibold text-sm">Market Research</h4>
                      <p className="text-xs text-gray-600">Competitor analysis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Grid */}
      <section className="py-20" id="tools">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete AI Sales Toolkit
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every tool you need to automate, optimize, and accelerate your sales process with artificial intelligence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Mail className="h-8 w-8 text-blue-600" />}
              title="AI Email Generator"
              description="Generate personalized emails, follow-ups, and cold outreach that convert prospects into customers."
            />
            
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-green-600" />}
              title="Proposal Generator"
              description="Create winning proposals and presentations tailored to each prospect's specific needs and pain points."
            />
            
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-purple-600" />}
              title="Objection Handler"
              description="Get AI-powered responses to common objections and learn how to turn resistance into opportunities."
            />
            
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-red-600" />}
              title="Sales Forecasting"
              description="Predict revenue, identify risks, and optimize your pipeline with advanced predictive analytics."
            />
            
            <FeatureCard
              icon={<Users className="h-8 w-8 text-indigo-600" />}
              title="Customer Personas"
              description="Generate detailed buyer personas and ideal customer profiles based on your existing data."
            />
            
            <FeatureCard
              icon={<Search className="h-8 w-8 text-orange-600" />}
              title="Competitor Analysis"
              description="Research competitors, analyze their strategies, and identify opportunities to differentiate."
            />
            
            <FeatureCard
              icon={<Calendar className="h-8 w-8 text-cyan-600" />}
              title="Meeting Optimizer"
              description="Prepare for meetings with AI-generated agendas, talking points, and follow-up actions."
            />
            
            <FeatureCard
              icon={<Target className="h-8 w-8 text-pink-600" />}
              title="Lead Qualification"
              description="Automatically score and qualify leads based on behavior, demographics, and engagement data."
            />
            
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-yellow-600" />}
              title="Performance Analytics"
              description="Get insights into what's working, what's not, and how to improve your sales performance."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Sales Teams Choose Our AI Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Measurable results that drive revenue growth and sales efficiency
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">8+ Hours Saved Weekly</h3>
              <p className="text-gray-600">
                Automate repetitive tasks and focus on high-value activities that drive revenue growth.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">35% Higher Close Rate</h3>
              <p className="text-gray-600">
                Use AI insights to identify the best opportunities and optimize your sales approach.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Instant AI Insights</h3>
              <p className="text-gray-600">
                Get immediate analysis and recommendations to make better sales decisions faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Sales Pros Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real results from teams using our AI sales tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="The AI tools have completely transformed how we approach sales. We're closing deals faster and with higher success rates than ever before."
              name="Michael Zhang"
              position="Sales Manager"
              company="GrowthTech"
              image="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
            
            <TestimonialCard
              quote="The email generator alone has saved us 20+ hours per week. The quality is incredible and our response rates have doubled."
              name="Sarah Johnson"
              position="Account Executive"
              company="SalesMax"
              image="https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
            
            <TestimonialCard
              quote="Having 20+ AI tools in one platform is amazing. We can handle everything from lead research to proposal generation without switching apps."
              name="David Miller"
              position="VP of Sales"
              company="InnovateCorp"
              image="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Supercharge Your Sales with AI?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Get access to 20+ AI tools designed specifically for sales professionals. Start today.
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

export default AiToolsFeaturePage;
