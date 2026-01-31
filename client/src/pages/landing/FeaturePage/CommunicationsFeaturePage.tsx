
import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Video, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  ChevronRight,
  Star,
  Clock,
  Zap,
  Send,
  Archive
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import FeatureCard from '../components/FeatureCard';
import TestimonialCard from '../components/TestimonialCard';

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
                Unified <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Communication Hub</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Manage all your customer communications from one powerful platform. Email, calls, messages, and meetings - all integrated with your CRM for maximum efficiency.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#features" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition duration-300 flex items-center">
                  Explore Features <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Communication Center</h3>
                      <div className="flex space-x-2">
                        <Mail size={20} className="text-blue-600" />
                        <MessageSquare size={20} className="text-green-600" />
                        <Phone size={20} className="text-purple-600" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Mail size={16} className="text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Email sent to TechCorp</p>
                          <p className="text-xs text-gray-600">2 minutes ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <Phone size={16} className="text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Call logged with Innovation Labs</p>
                          <p className="text-xs text-gray-600">15 minutes ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <Calendar size={16} className="text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Meeting scheduled</p>
                          <p className="text-xs text-gray-600">Tomorrow at 2 PM</p>
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

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Communication Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to communicate effectively with prospects and customers, all in one integrated platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Mail className="h-8 w-8 text-blue-600" />}
              title="Smart Email Management"
              description="Send, track, and manage emails with templates, scheduling, and automated follow-ups integrated with your CRM."
            />
            
            <FeatureCard
              icon={<Phone className="h-8 w-8 text-green-600" />}
              title="Click-to-Call Integration"
              description="Make calls directly from contact records with automatic logging and call recording capabilities."
            />
            
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8 text-purple-600" />}
              title="SMS & Messaging"
              description="Send text messages and manage messaging campaigns with delivery tracking and automated responses."
            />
            
            <FeatureCard
              icon={<Video className="h-8 w-8 text-red-600" />}
              title="Video Conferencing"
              description="Schedule and conduct video meetings with screen sharing, recording, and automatic CRM integration."
            />
            
            <FeatureCard
              icon={<Calendar className="h-8 w-8 text-orange-600" />}
              title="Meeting Scheduling"
              description="Automated scheduling with calendar integration, time zone detection, and meeting reminders."
            />
            
            <FeatureCard
              icon={<Archive className="h-8 w-8 text-cyan-600" />}
              title="Communication History"
              description="Complete timeline of all interactions with contacts, searchable and automatically categorized."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Streamline Your Communication Workflow
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how unified communications improve sales team performance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">50% Faster Response</h3>
              <p className="text-gray-600">
                Respond to prospects faster with templates, automated workflows, and unified inbox management.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">30% More Touchpoints</h3>
              <p className="text-gray-600">
                Increase prospect engagement with automated follow-ups and multi-channel communication strategies.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Better Team Collaboration</h3>
              <p className="text-gray-600">
                Share communication history and collaborate on deals with team-wide visibility and notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Customer Success Stories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how teams are improving their communication effectiveness
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Having all our communications in one place has been a game-changer. We never miss a follow-up and our response times have improved dramatically."
              name="Mark Thompson"
              position="Sales Director"
              company="SalesForce Pro"
              image="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
            
            <TestimonialCard
              quote="The email templates and automation have saved us hours every week. Our team can focus on selling instead of writing the same emails over and over."
              name="Jennifer Kim"
              position="Account Manager"
              company="TechGrowth"
              image="https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
            
            <TestimonialCard
              quote="The communication history feature is invaluable. Anyone on our team can pick up a conversation exactly where it left off."
              name="Robert Wilson"
              position="VP of Sales"
              company="Enterprise Solutions"
              image="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              stars={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Unify Your Communications?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Start managing all your customer communications from one powerful platform today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-white text-blue-700 font-medium rounded-lg hover:shadow-lg transition duration-300">
              Start Your Free Trial
            </Link>
            <Link to="/features" className="px-8 py-4 bg-blue-500 bg-opacity-30 hover:bg-opacity-40 text-white font-medium rounded-lg transition-colors">
              Explore All Features
            </Link>
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default CommunicationsFeaturePage;
