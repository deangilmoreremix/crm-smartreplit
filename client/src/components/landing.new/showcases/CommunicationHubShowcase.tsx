import React, { useState } from 'react';
import {
  Calendar, Phone, Mail, MessageSquare, Video, FileText, Users, DollarSign,
  Target, Send, Mic, Monitor, CreditCard, Workflow, MapPin, FileCheck,
  BarChart3, Palette, Mic, ChevronRight, Check, ArrowRight, Play
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface CommTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
}

const CommunicationHubShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('appointments');

  const commTools: CommTool[] = [
    {
      id: 'appointments',
      name: 'Appointments',
      icon: <Calendar size={24} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Smart scheduling with calendar integration, automated reminders, and meeting preparation.',
      features: ['Calendar integration', 'Automated reminders', 'Meeting preparation', 'Video link generation', 'Conflict detection', 'Recurring appointments']
    },
    {
      id: 'video-email',
      name: 'Video Email',
      icon: <Video size={24} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Personalized video messages for outreach that increase engagement by 3x.',
      features: ['Screen recording', 'Custom thumbnails', 'Analytics tracking', 'A/B testing', 'Template library', 'CRM integration']
    },
    {
      id: 'text-messages',
      name: 'Text Messages',
      icon: <MessageSquare size={24} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'SMS marketing campaigns with automation, tracking, and compliance management.',
      features: ['Bulk SMS', 'Automated sequences', 'Delivery analytics', 'Opt-in management', 'Personalization', 'Segmentation']
    },
    {
      id: 'phone',
      name: 'Phone System',
      icon: <Phone size={24} />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Cloud-based VoIP with call recording, routing, IVR, and analytics.',
      features: ['Call recording', 'IVR menus', 'Call routing', 'VoIP integration', 'Quality monitoring', 'Analytics']
    },
    {
      id: 'invoicing',
      name: 'Invoicing',
      icon: <CreditCard size={24} />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      description: 'Automated invoice generation with payment tracking and reminders.',
      features: ['Auto-generation', 'Payment tracking', 'Overdue management', 'Custom branding', 'Reminder automation', 'Analytics']
    },
    {
      id: 'lead-automation',
      name: 'Lead Automation',
      icon: <Target size={24} />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Automated lead nurturing with scoring, routing, and follow-up sequences.',
      features: ['Lead scoring', 'Nurturing sequences', 'Automated routing', 'Follow-up automation', 'Conversion optimization', 'Quality assessment']
    },
    {
      id: 'circle-prospecting',
      name: 'Circle Prospecting',
      icon: <MapPin size={24} />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      description: 'Geographic targeting with database enrichment and automated outreach.',
      features: ['Geo-targeting', 'Database integration', 'Qualification', 'Automated outreach', 'Analytics', 'Enrichment']
    },
    {
      id: 'forms',
      name: 'Forms & Surveys',
      icon: <FileCheck size={24} />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Custom form creation with response analysis and optimization.',
      features: ['Drag-drop builder', 'Response analysis', 'A/B testing', 'Survey templates', 'Insights', 'Optimization']
    },
    {
      id: 'voice-profiles',
      name: 'Voice Profiles',
      icon: <Mic size={24} />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      description: 'Voice recording analysis for coaching and performance improvement.',
      features: ['Recording', 'Performance tracking', 'Voice optimization', 'Coaching insights', 'Content management', 'Analytics']
    },
    {
      id: 'content-library',
      name: 'Content Library',
      icon: <FileText size={24} />,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100',
      description: 'Centralized content management with collaboration and distribution.',
      features: ['Central storage', 'Collaboration', 'Performance tracking', 'Distribution', 'Version control', 'Sharing']
    },
  ];

  const currentTool = commTools.find(t => t.id === activeTab) || commTools[0];

  return (
    <section className={`py-20 ${isDark ? 'bg-slate-800' : 'bg-gradient-to-br from-gray-50 to-blue-50'}`}>
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-full mb-4">
              COMMUNICATION HUB
            </span>
            <h2 className={`text-3xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              All Your Communication Tools in One Place
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              From appointments to voice profiles, manage all your customer communications 
              seamlessly integrated with your CRM data.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Tools navigation */}
          <ScrollAnimationWrapper animation="slide-in" delay={100}>
            <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-6 shadow-xl border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Communication Tools</h3>
              <div className="space-y-2">
                {commTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTab(tool.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                      activeTab === tool.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        : isDark
                          ? 'hover:bg-slate-800 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className={activeTab === tool.id ? '' : tool.color}>{tool.icon}</span>
                    <span className="font-medium">{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </ScrollAnimationWrapper>

          {/* Tool details */}
          <ScrollAnimationWrapper animation="slide-in" delay={200} className="lg:col-span-2">
            <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-8 shadow-xl border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-start space-x-4 mb-6">
                <div className={`p-4 rounded-2xl ${currentTool.bgColor}`}>
                  <span className={currentTool.color}>{currentTool.icon}</span>
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentTool.name}</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{currentTool.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {currentTool.features.map((feature, index) => (
                  <div key={index} className={`flex items-center space-x-2 ${isDark ? 'bg-slate-800' : 'bg-gray-50'} rounded-lg px-4 py-3`}>
                    <Check size={16} className="text-green-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                  Demo <Play size={16} className="ml-2" />
                </button>
                <button className={`inline-flex items-center font-medium ${currentTool.color}`}>
                  Learn more <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  );
};

export default CommunicationHubShowcase;