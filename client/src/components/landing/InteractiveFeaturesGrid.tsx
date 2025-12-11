import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Users, 
  Briefcase, 
  Mail, 
  Calendar, 
  BarChart3,
  Eye, 
  Image as ImageIcon,
  Mic, 
  Search,
  Zap,
  FileText,
  ChevronRight
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  link: string;
}

const InteractiveFeaturesGrid: React.FC = () => {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  
  const features: Feature[] = [
    {
      id: 'ai-tools',
      title: 'AI Sales Tools',
      description: 'Access 20+ AI tools to automate tasks, get insights, and personalize your sales approach.',
      icon: <Brain className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      iconColor: 'text-white',
      link: '/features/ai-tools'
    },
    {
      id: 'contacts',
      title: 'Contact Management',
      description: 'Organize and track all your contacts, leads, and accounts in one unified database.',
      icon: <Users className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      iconColor: 'text-white',
      link: '/features/contacts'
    },
    {
      id: 'pipeline',
      title: 'Deal Pipeline',
      description: 'Visualize and optimize your sales pipeline with drag-and-drop simplicity and AI insights.',
      icon: <Briefcase className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      iconColor: 'text-white',
      link: '/features/pipeline'
    },
    {
      id: 'assistant',
      title: 'AI Assistant',
      description: 'Work with a context-aware AI assistant that remembers conversations and takes actions for you.',
      icon: <Brain className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-fuchsia-500 to-violet-600',
      iconColor: 'text-white',
      link: '/features/ai-assistant'
    },
    {
      id: 'vision',
      title: 'Vision Analyzer',
      description: 'Extract insights from images, documents, competitor materials, and visual content.',
      icon: <Eye className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      iconColor: 'text-white',
      link: '/features/vision-analyzer'
    },
    {
      id: 'image-generator',
      title: 'Image Generator',
      description: 'Create professional images for presentations, proposals, and marketing materials instantly.',
      icon: <ImageIcon className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      iconColor: 'text-white',
      link: '/features/image-generator'
    },
    {
      id: 'speech',
      title: 'Speech to Text',
      description: 'Convert meeting recordings and voice notes into searchable, actionable text.',
      icon: <Mic className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      iconColor: 'text-white',
      link: '/features/speech-to-text'
    },
    {
      id: 'semantic-search',
      title: 'Semantic Search',
      description: 'Find anything in your CRM with natural language queries and contextual understanding.',
      icon: <Search className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
      iconColor: 'text-white',
      link: '/features/semantic-search'
    },
    {
      id: 'function-assistant',
      title: 'Function Assistant',
      description: 'Let AI perform real actions in your CRM through natural conversation.',
      icon: <Zap className="h-8 w-8" />,
      iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-600',
      iconColor: 'text-white',
      link: '/features/function-assistant'
    },
  ];
  
  return (
    <div className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Interactive Feature Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our powerful features and see how they can transform your sales process
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto perspective-1000">
          {features.map((feature) => (
            <Link
              key={feature.id}
              to={feature.link}
              className="relative group"
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div 
                className={`h-full bg-white rounded-xl shadow-lg p-6 border border-gray-200 transition-all duration-500 transform ${
                  hoveredFeature === feature.id ? 'scale-105 shadow-xl -rotate-1' : 'scale-100'
                } animation-fix hover:z-10`}
              >
                <div className="flex flex-col h-full">
                  <div className={`p-4 rounded-xl ${feature.iconBg} ${feature.iconColor} w-min mb-6 transform transition-transform duration-500 ${
                    hoveredFeature === feature.id ? 'rotate-[360deg]' : ''
                  }`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{feature.description}</p>
                  <div className="mt-auto">
                    <span className={`inline-flex items-center font-medium transition-all duration-300 ${
                      hoveredFeature === feature.id ? 'text-blue-700 translate-x-2' : 'text-blue-600'
                    }`}>
                      Explore {feature.title}
                      <ChevronRight className="ml-1 w-5 h-5" />
                    </span>
                  </div>
                </div>
                
                {/* Particle effect on hover */}
                {hoveredFeature === feature.id && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 blur-lg transition-opacity z-[-1]"></div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveFeaturesGrid;