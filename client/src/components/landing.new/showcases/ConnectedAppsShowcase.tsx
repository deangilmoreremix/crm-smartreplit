import React, { useState } from 'react';
import {
  Link2, ExternalLink, Check, Play, ArrowRight, Globe, BarChart3, Users,
  Briefcase, Target, Mail, Zap, FileText, Palette, Workflow
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface RemoteApp {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  status: 'live' | 'coming-soon';
  features: string[];
  description: string;
}

const ConnectedAppsShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [activeApp, setActiveApp] = useState<string>('funnelcraft');

  const remoteApps: RemoteApp[] = [
    {
      id: 'funnelcraft',
      name: 'FunnelCraft AI',
      url: 'https://serene-valkyrie-fec320.netlify.app/',
      icon: <Target size={24} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      status: 'live',
      description: 'Marketing funnel creation with AI-powered optimization and A/B testing.',
      features: ['Landing page builder', 'A/B testing', 'Lead nurturing', 'Conversion analytics', 'Template library', 'CRM integration']
    },
    {
      id: 'closer',
      name: 'SmartCRM Closer',
      url: 'https://stupendous-twilight-64389a.netlify.app/',
      icon: <Briefcase size={24} />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      status: 'live',
      description: 'Sales automation and deal closing tools with objection handling.',
      features: ['Outreach automation', 'Deal closing', 'Sales playbooks', 'Performance analytics', 'Contact enrichment', 'Sequence management']
    },
    {
      id: 'contentai',
      name: 'ContentAI',
      url: 'https://capable-mermaid-3c73fa.netlify.app/',
      icon: <FileText size={24} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      status: 'live',
      description: 'AI-powered content generation for blogs, social media, and marketing.',
      features: ['Blog writing', 'SEO optimization', 'Social scheduling', 'Content calendar', 'Multi-language', 'Brand voice']
    },
    {
      id: 'whitelabel',
      name: 'White-Label Platform',
      url: 'https://moonlit-tarsier-239e70.netlify.app',
      icon: <Palette size={24} />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      status: 'live',
      description: 'Complete white-label solution with custom branding and mobile apps.',
      features: ['Custom branding', 'Custom domain', 'Mobile apps', 'Multi-tenant', 'API access', 'Support portal']
    },
    {
      id: 'pipeline',
      name: 'Remote Pipeline',
      url: 'https://cheery-syrniki-b5b6ca.netlify.app',
      icon: <Workflow size={24} />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      status: 'live',
      description: 'Advanced pipeline management with AI-powered forecasting.',
      features: ['Pipeline visualization', 'AI forecasting', 'Team collaboration', 'Automation', 'Custom reports', 'Mobile access']
    },
    {
      id: 'aigoals',
      name: 'AI Goals',
      url: 'https://tubular-choux-2a9b3c.netlify.app',
      icon: <Target size={24} />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      status: 'live',
      description: 'Goal setting and achievement tracking with AI recommendations.',
      features: ['AI goal setting', 'Progress tracking', 'Milestone management', 'Team goals', 'Analytics', 'Automation']
    },
    {
      id: 'contacts',
      name: 'Remote Contacts',
      url: 'https://taupe-sprinkles-83c9ee.netlify.app',
      icon: <Users size={24} />,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100',
      status: 'live',
      description: 'Advanced contact management with AI segmentation and enrichment.',
      features: ['AI segmentation', 'Data enrichment', 'Bulk operations', 'Lead scoring', 'Social profiles', 'Communication history']
    },
    {
      id: 'analytics',
      name: 'Business Intelligence',
      url: 'https://ai-powered-analytics-fibd.bolt.host',
      icon: <BarChart3 size={24} />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      status: 'live',
      description: 'Advanced analytics with predictive insights and custom dashboards.',
      features: ['Custom dashboards', 'Predictive analytics', 'KPI monitoring', 'Competitive intel', 'Data export', 'Automated reports']
    },
    {
      id: 'research',
      name: 'Product Research',
      url: 'https://product-research-mod-uay0.bolt.host/',
      icon: <Globe size={24} />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      status: 'live',
      description: 'Market research and competitor analysis with AI synthesis.',
      features: ['Market research', 'Competitor analysis', 'Customer surveys', 'AI synthesis', 'Automated reports', 'Trend tracking']
    },
  ];

  const currentApp = remoteApps.find(a => a.id === activeApp) || remoteApps[0];

  return (
    <section className={`py-20 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 to-cyan-50'}`}>
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-full mb-4">
              CONNECTED APPS
            </span>
            <h2 className={`text-3xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Full Ecosystem of Business Tools
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              9 integrated applications working together seamlessly. Each app is purpose-built 
              for specific business functions while sharing data through the SmartCRM hub.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 max-w-6xl mx-auto">
          {remoteApps.map((app, index) => (
            <ScrollAnimationWrapper key={app.id} animation="scale-in" delay={index * 50}>
              <button
                onClick={() => setActiveApp(app.id)}
                className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl p-4 border text-center transition-all hover:shadow-lg ${
                  activeApp === app.id ? 'ring-2 ring-cyan-500 shadow-lg' : ''
                }`}
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${app.bgColor}`}>
                  <span className={app.color}>{app.icon}</span>
                </div>
                <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{app.name}</h4>
                {app.status === 'live' ? (
                  <span className="text-xs text-green-600 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span> Live
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Coming Soon</span>
                )}
              </button>
            </ScrollAnimationWrapper>
          ))}
        </div>

        <ScrollAnimationWrapper animation="fade-up" delay={200}>
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-8 shadow-xl border max-w-4xl mx-auto`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${currentApp.bgColor}`}>
                  <span className={currentApp.color}>{currentApp.icon}</span>
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentApp.name}</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{currentApp.description}</p>
                </div>
              </div>
              <a
                href={currentApp.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-4 py-2 ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-lg hover:bg-gray-200 transition-colors`}
              >
                <ExternalLink size={16} className="mr-2" />
                Open App
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentApp.features.map((feature, index) => (
                <div key={index} className={`flex items-center space-x-2 ${isDark ? 'bg-slate-900' : 'bg-gray-50'} rounded-lg px-4 py-3`}>
                  <Check size={16} className="text-cyan-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="text-center mt-8">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>All apps are powered by SmartCRM's unified data layer</p>
            <button className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700">
              Explore all connected apps <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default ConnectedAppsShowcase;