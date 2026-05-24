import React from 'react';
import {
  Code, Database, Cloud, Zap, Shield, Lock, Link2, Key, Cpu, Layers,
  Github, Globe, Server, GitBranch, Box, Terminal, Sparkles, ArrowRight,
  CheckCircle, Layers3, Network, HardDrive, Workflow
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface TechStackItem {
  name: string;
  icon: React.ReactNode;
  color: string;
  category: 'frontend' | 'backend' | 'ai' | 'integration';
}

interface APIEndpoint {
  method: string;
  endpoint: string;
  description: string;
}

interface IntegrationBadge {
  name: string;
  icon: React.ReactNode;
  color: string;
}

const TechnicalArchShowcase: React.FC = () => {
  const { isDark } = useTheme();

  const techStack: TechStackItem[] = [
    { name: 'React 18+', icon: <Code size={20} />, color: 'bg-cyan-500', category: 'frontend' },
    { name: 'TypeScript', icon: <Code size={20} />, color: 'bg-blue-500', category: 'frontend' },
    { name: 'Tailwind CSS', icon: <Layers size={20} />, color: 'bg-sky-500', category: 'frontend' },
    { name: 'Framer Motion', icon: <Zap size={20} />, color: 'bg-pink-500', category: 'frontend' },
    { name: 'React Query', icon: <Workflow size={20} />, color: 'bg-red-500', category: 'frontend' },
    { name: 'React Router', icon: <Link2 size={20} />, color: 'bg-rose-500', category: 'frontend' },
    { name: 'Supabase', icon: <Database size={20} />, color: 'bg-emerald-500', category: 'backend' },
    { name: 'PostgreSQL', icon: <HardDrive size={20} />, color: 'bg-indigo-500', category: 'backend' },
    { name: 'Edge Functions', icon: <Server size={20} />, color: 'bg-violet-500', category: 'backend' },
    { name: 'OpenAI GPT-4o', icon: <Sparkles size={20} />, color: 'bg-amber-500', category: 'ai' },
    { name: 'Gemini 2.5 Pro', icon: <Cpu size={20} />, color: 'bg-blue-600', category: 'ai' },
    { name: 'Custom AI Agents', icon: <Network size={20} />, color: 'bg-purple-500', category: 'ai' },
  ];

  const apiEndpoints: APIEndpoint[] = [
    { method: 'GET', endpoint: '/api/v1/contacts', description: 'Fetch all contacts with filtering' },
    { method: 'POST', endpoint: '/api/v1/deals', description: 'Create new deal record' },
    { method: 'PUT', endpoint: '/api/v1/contacts/:id', description: 'Update contact information' },
    { method: 'DELETE', endpoint: '/api/v1/activities/:id', description: 'Delete activity record' },
    { method: 'GET', endpoint: '/api/v1/analytics/pipeline', description: 'Retrieve pipeline analytics' },
    { method: 'POST', endpoint: '/api/v1/ai/enrich', description: 'AI-powered contact enrichment' },
  ];

  const integrations: IntegrationBadge[] = [
    { name: 'REST API', icon: <Key size={18} />, color: 'bg-green-500' },
    { name: 'Webhooks', icon: <Link2 size={18} />, color: 'bg-blue-500' },
    { name: 'OAuth 2.0', icon: <Shield size={18} />, color: 'bg-purple-500' },
    { name: 'WebSocket', icon: <Network size={18} />, color: 'bg-amber-500' },
    { name: 'Module Fed', icon: <Layers3 size={18} />, color: 'bg-cyan-500' },
    { name: 'Embed API', icon: <Box size={18} />, color: 'bg-pink-500' },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-emerald-500';
      case 'POST': return 'bg-blue-500';
      case 'PUT': return 'bg-amber-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <section className="relative min-h-screen py-20 overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-blue-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-float-delayed-1" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-float-delayed-2" />
        <div className="absolute top-3/4 right-1/3 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl animate-pulse-slow-delayed" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-full mb-6 shadow-lg shadow-blue-500/30">
              <Code size={18} />
              <span>TECHNICAL ARCHITECTURE</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Built on Modern
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Tech Stack
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade architecture powering intelligent CRM with cutting-edge technologies for scalability, security, and performance.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto mb-16">
          <ScrollAnimationWrapper animation="slide-in" delay={100}>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                  <Layers size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Architecture Overview</h3>
                  <p className="text-gray-400 text-sm">System design diagram</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-xl" />
                <div className="relative bg-slate-900/80 rounded-xl p-5 border border-white/10">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 pb-4 border-b border-white/10">
                      <div className="px-3 py-1.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                        Client Layer
                      </div>
                      <ArrowRight size={14} className="text-gray-500" />
                      <div className="px-3 py-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30 text-blue-400 text-xs font-mono">
                        API Gateway
                      </div>
                      <ArrowRight size={14} className="text-gray-500" />
                      <div className="px-3 py-1.5 bg-violet-500/20 rounded-lg border border-violet-500/30 text-violet-400 text-xs font-mono">
                        Services
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Database size={20} className="text-cyan-400 mx-auto mb-2" />
                        <div className="text-gray-300 text-xs font-medium">PostgreSQL</div>
                        <div className="text-gray-500 text-[10px]">Primary DB</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Server size={20} className="text-blue-400 mx-auto mb-2" />
                        <div className="text-gray-300 text-xs font-medium">Edge Functions</div>
                        <div className="text-gray-500 text-[10px]">Serverless</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Sparkles size={20} className="text-amber-400 mx-auto mb-2" />
                        <div className="text-gray-300 text-xs font-medium">AI Engine</div>
                        <div className="text-gray-500 text-[10px]">GPT-4o / Gemini</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 rounded text-emerald-400 text-xs">
                        <CheckCircle size={12} />
                        <span>RLS Enabled</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/20 rounded text-cyan-400 text-xs">
                        <Network size={12} />
                        <span>Real-time</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/20 rounded text-violet-400 text-xs">
                        <Cloud size={12} />
                        <span>Edge Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4">
                <AnimatedFeatureIcon icon={<Github size={16} />} color="bg-gray-700" delay={0} size="sm" />
                <AnimatedFeatureIcon icon={<Globe size={16} />} color="bg-blue-600" delay={1} size="sm" />
                <AnimatedFeatureIcon icon={<Cloud size={16} />} color="bg-sky-500" delay={2} size="sm" />
              </div>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={200}>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl">
                  <Terminal size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">API Endpoints</h3>
                  <p className="text-gray-400 text-sm">RESTful API examples</p>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-500 text-xs ml-2">api.example.com</span>
                </div>
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {apiEndpoints.map((api, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getMethodColor(api.method)}`}>
                        {api.method}
                      </span>
                      <code className="text-cyan-400 text-sm font-mono flex-1 truncate">{api.endpoint}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Link2 size={14} />
                  <span>GraphQL also available</span>
                </div>
                <button className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  View docs <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>

        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Technology Stack</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
              {techStack.map((tech, index) => (
                <div
                  key={tech.name}
                  className="group bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 hover:border-cyan-500/30 transition-all duration-300 text-center cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl ${tech.color} mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform text-white`}>
                    {tech.icon}
                  </div>
                  <div className="text-white text-sm font-medium group-hover:text-cyan-300 transition-colors">{tech.name}</div>
                  <div className="text-gray-500 text-xs mt-1 capitalize">{tech.category}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper animation="fade-up" delay={400}>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 max-w-5xl mx-auto mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                <Box size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Module Federation Architecture</h3>
                <p className="text-gray-400 text-sm">Micro-frontend deployment strategy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-5 text-center border border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Globe size={28} className="text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Host Application</h4>
                <p className="text-gray-400 text-sm">Main shell loading remote modules dynamically</p>
                <div className="mt-4 text-xs text-cyan-400 font-mono">:3000</div>
              </div>

              <div className="bg-white/5 rounded-xl p-5 text-center border border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Box size={28} className="text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Calendar Remote</h4>
                <p className="text-gray-400 text-sm">Standalone calendar module</p>
                <div className="mt-4 text-xs text-violet-400 font-mono">:3001</div>
              </div>

              <div className="bg-white/5 rounded-xl p-5 text-center border border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Layers3 size={28} className="text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Analytics Remote</h4>
                <p className="text-gray-400 text-sm">Analytics dashboard module</p>
                <div className="mt-4 text-xs text-pink-400 font-mono">:3002</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                <GitBranch size={16} className="text-emerald-400" />
                <span className="text-gray-300 text-sm">Shared Dependencies</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                <Lock size={16} className="text-amber-400" />
                <span className="text-gray-300 text-sm">Version Control</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                <Shield size={16} className="text-cyan-400" />
                <span className="text-gray-300 text-sm">Secure Loading</span>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper animation="fade-up" delay={500}>
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Integration Capabilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {integrations.map((integration, index) => (
                <div
                  key={integration.name}
                  className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group"
                >
                  <div className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center group-hover:scale-110 transition-transform text-white`}>
                    {integration.icon}
                  </div>
                  <span className="text-gray-300 text-xs font-medium group-hover:text-white transition-colors">
                    {integration.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper animation="fade-up" delay={600}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '<50ms', label: 'API Latency' },
              { value: '10M+', label: 'API Calls/mo' },
              { value: '256-bit', label: 'Encryption' },
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper animation="fade-up" delay={700}>
          <div className="text-center mt-16">
            <button className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:-translate-y-1 mx-auto">
              <Code size={20} className="group-hover:scale-110 transition-transform" />
              <span>Explore Documentation</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-gray-400 text-sm mt-6">
              Trusted by 500+ enterprise teams worldwide
            </p>
          </div>
        </ScrollAnimationWrapper>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes float-delayed-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-2deg); }
        }
        @keyframes float-delayed-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes pulse-slow-delayed {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.08); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed-1 { animation: float-delayed-1 10s ease-in-out infinite; animation-delay: 0.5s; }
        .animate-float-delayed-2 { animation: float-delayed-2 9s ease-in-out infinite; animation-delay: 1s; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-pulse-slow-delayed { animation: pulse-slow-delayed 7s ease-in-out infinite; animation-delay: 0.5s; }
        .gpu-accelerated { transform: translateZ(0); }
      `}</style>
    </section>
  );
};

export default TechnicalArchShowcase;