import React, { useState } from 'react';
import { 
  Brain,
  Users,
  BarChart3,
  Search,
  PieChart,
  ArrowRight,
  Check
} from 'lucide-react';
import AnimatedFeatureIcon from './AnimatedFeatureIcon';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
  image: string;
}

const FeatureShowcase: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('ai-assistant');
  
  const features: Feature[] = [
    {
      id: 'ai-assistant',
      title: 'AI Sales Assistant',
      description: 'Get personalized guidance and automation from your AI sales assistant that learns your business.',
      icon: <Brain size={24} className="text-indigo-600" />,
      color: 'bg-indigo-100',
      benefits: [
        'Automatically prioritize leads and opportunities',
        'Get personalized email and call scripts',
        'Receive strategic recommendations',
        'Automate routine tasks and follow-ups'
      ],
      image: 'https://images.pexels.com/photos/8370380/pexels-photo-8370380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      id: 'contact-management',
      title: 'Contact Management',
      description: 'Organize all your contacts with AI-powered insights, scoring, and recommendations.',
      icon: <Users size={24} className="text-blue-600" />,
      color: 'bg-blue-100',
      benefits: [
        'AI lead scoring prioritizes your best prospects',
        'Automated data enrichment from social profiles',
        'Complete interaction history at your fingertips',
        'Smart segmentation based on behavior and attributes'
      ],
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      id: 'analytics',
      title: 'Advanced Analytics',
      description: 'Get deep insights into your sales performance with AI-powered analytics and forecasting.',
      icon: <BarChart3 size={24} className="text-emerald-600" />,
      color: 'bg-emerald-100',
      benefits: [
        'Sales forecasting with 42% greater accuracy',
        'Identify pipeline bottlenecks automatically',
        'Conversion rate optimization recommendations',
        'Customer cohort analysis and LTV predictions'
      ],
      image: 'https://images.pexels.com/photos/6476589/pexels-photo-6476589.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      id: 'semantic-search',
      title: 'Semantic Search',
      description: 'Find exactly what you need with natural language search across all your CRM data.',
      icon: <Search size={24} className="text-purple-600" />,
      color: 'bg-purple-100',
      benefits: [
        'Natural language queries instead of complex filters',
        'Find information across all CRM data at once',
        'Voice search capability for hands-free operation',
        'Contextual understanding of your search intent'
      ],
      image: 'https://images.pexels.com/photos/8370717/pexels-photo-8370717.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    },
    {
      id: 'forecasting',
      title: 'AI Forecasting',
      description: 'Predict your sales with remarkable accuracy using our advanced AI forecasting engine.',
      icon: <PieChart size={24} className="text-rose-600" />,
      color: 'bg-rose-100',
      benefits: [
        'Machine learning models trained on your sales patterns',
        'Probability-weighted pipeline projections',
        'Identify deals at risk before they stall',
        'Scenario planning and what-if analysis'
      ],
      image: 'https://images.pexels.com/photos/7821874/pexels-photo-7821874.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    }
  ];
  
  const currentFeature = features.find(f => f.id === activeFeature) || features[0];
  
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Designed for Modern Sales Teams</h2>
          <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
            Discover how our AI-powered features can transform your sales process
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center mb-12 gap-2">
          {features.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={`px-4 py-3 rounded-lg flex items-center transition-all ${
                activeFeature === feature.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <div className={`mr-2 ${activeFeature === feature.id ? '' : feature.color} p-1 rounded-full`}>
                {feature.icon}
              </div>
              <span className="font-medium">{feature.title}</span>
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="p-6 order-2 lg:order-1 animation-fix">
            <h3 className="text-2xl font-bold mb-4">{currentFeature.title}</h3>
            <p className="text-gray-700 mb-6">{currentFeature.description}</p>
            
            <ul className="space-y-3 mb-8">
              {currentFeature.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <div className="p-1 bg-green-100 rounded-full text-green-600 mr-3 mt-0.5">
                    <Check size={16} />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            
            <button className="inline-flex items-center text-blue-600 font-medium group">
              Learn more about {currentFeature.title}
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          
          <div className="relative order-1 lg:order-2 h-80 md:h-96 animation-fix">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/20 to-indigo-100/20 rounded-xl blur-xl transform rotate-3 animate-pulse gpu-accelerated" style={{animationDuration: '8s'}}></div>
            <div className="relative h-full rounded-xl overflow-hidden shadow-xl border border-gray-100">
              <img 
                src={currentFeature.image} 
                alt={currentFeature.title} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                <h4 className="font-bold">{currentFeature.title}</h4>
                <p className="text-sm text-gray-700">{currentFeature.description}</p>
              </div>
              
              {/* Add floating animated icons */}
              <div className="absolute top-2 right-2">
                <AnimatedFeatureIcon 
                  icon={currentFeature.icon}
                  color={currentFeature.color}
                  delay={0}
                  size="sm"
                />
              </div>
              
              <div className="absolute top-14 left-4">
                <AnimatedFeatureIcon 
                  icon={features[(features.findIndex(f => f.id === activeFeature) + 1) % features.length].icon}
                  color={features[(features.findIndex(f => f.id === activeFeature) + 1) % features.length].color}
                  delay={1}
                  size="sm"
                />
              </div>
              
              <div className="absolute top-8 right-16">
                <AnimatedFeatureIcon 
                  icon={features[(features.findIndex(f => f.id === activeFeature) + 2) % features.length].icon}
                  color={features[(features.findIndex(f => f.id === activeFeature) + 2) % features.length].color}
                  delay={2}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase;