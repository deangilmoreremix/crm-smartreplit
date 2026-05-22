import React from 'react';
import { BookOpen, TrendingUp, Code, MessageSquare, BarChart3, Users, Lightbulb, Target, Zap, Database } from 'lucide-react';

interface ModelInfoPageProps {
  model: string;
  provider: 'openai' | 'gemini';
}

const GEMINI_MODEL_INFO: Record<string, {
  title: string;
  description: string;
  useCases: string[];
  gtm: {
    valueProposition: string;
    targetAudience: string[];
    competitiveAdvantage: string;
    messagingAngles: string[];
  };
  technical: {
    architecture: string;
    training: string;
    limitations: string[];
  };
  pricing: {
    input: string;
    output: string;
    currency: string;
  };
}> = {
  'gemini-2.0-flash-preview': {
    title: 'Gemini 2.0 Flash Preview',
    description: 'Google\'s next-generation model with enhanced reasoning, multimodality, and improved performance.',
    useCases: [
      'Next-generation AI agents',
      'Advanced multimodal tasks',
      'Real-time reasoning applications',
      'Enterprise AI workflows',
      'Cutting-edge research'
    ],
    gtm: {
      valueProposition: 'Next-generation AI capabilities now available',
      targetAudience: ['AI researchers', 'Enterprise innovators', 'Tech companies', 'R&D teams'],
      competitiveAdvantage: 'Improved reasoning and multimodality with faster performance',
      messagingAngles: [
        'Experience next-gen AI today',
        'Google\'s most advanced model yet',
        'Built for the future of AI applications'
      ]
    },
    technical: {
      architecture: 'Next-generation transformer with enhanced reasoning',
      training: 'Trained on massive diverse dataset with reinforcement learning',
      limitations: ['Preview may have output variability', 'Rate limits during preview']
    },
    pricing: { input: '$0.000075', output: '$0.00015', currency: 'per 1K tokens' }
  },
  'gemini-1.5-pro': {
    title: 'Gemini 1.5 Pro',
    description: 'Google\'s most capable AI model with a massive 1M token context window and advanced multimodal reasoning.',
    useCases: [
      'Large document analysis (contracts, reports, research papers)',
      'Complex business intelligence and data analysis',
      'Multimodal creative projects (combining text, images, code)',
      'Enterprise knowledge base querying',
      'Strategic planning with extensive context'
    ],
    gtm: {
      valueProposition: 'Unmatched context understanding for enterprise-scale AI applications',
      targetAudience: ['Enterprise architects', 'Data science teams', 'Research analysts', 'AI innovators'],
      competitiveAdvantage: '1M token context window is 8x larger than competitors, enabling analysis of entire codebases or lengthy documents',
      messagingAngles: [
        'Analyze entire contracts or reports in a single request',
        'No need to chunk large documents - process them whole',
        'Revolutionary context handling for complex business problems'
      ]
    },
    technical: {
      architecture: 'Transformer-based with advanced multimodal attention',
      training: 'Trained on massive diverse dataset with reinforcement learning',
      limitations: ['Higher latency for complex requests', 'Rate limits on large context requests']
    },
    pricing: { input: '$0.00125', output: '$0.0025', currency: 'per 1K tokens' }
  },
  'gemini-1.5-flash': {
    title: 'Gemini 1.5 Flash',
    description: 'Lightning-fast, cost-efficient model optimized for speed and throughput while maintaining strong reasoning capabilities.',
    useCases: [
      'Real-time chat and customer support',
      'Quick document summarization',
      'Fast email and message generation',
      'Live data processing and analysis',
      'High-volume API integrations'
    ],
    gtm: {
      valueProposition: 'Enterprise speed at startup prices',
      targetAudience: ['Dev teams', 'Customer success', 'Content creators', 'Startups scaling fast'],
      competitiveAdvantage: '2x faster than comparable models with 90% of the capability',
      messagingAngles: [
        'Process 1000s of requests per minute',
        'Perfect for real-time customer interactions',
        'Scale your AI workload without breaking your budget'
      ]
    },
    technical: {
      architecture: 'Optimized transformer with efficient routing',
      training: 'Distilled from Gemini Pro with speed optimizations',
      limitations: ['Less capable on highly complex reasoning', 'Optimized for throughput over depth']
    },
    pricing: { input: '$0.000075', output: '$0.00015', currency: 'per 1K tokens' }
  },
  'gemini-pro': {
    title: 'Gemini Pro',
    description: 'Stable, production-ready model with proven reliability for enterprise applications.',
    useCases: [
      'Production chatbots and assistants',
      'Business document processing',
      'Email automation and templates',
      'Basic Q&A and knowledge retrieval',
      'Language translation services'
    ],
    gtm: {
      valueProposition: 'Trusted reliability for mission-critical business applications',
      targetAudience: ['IT leaders', 'Operations managers', 'Business analysts', 'Compliance teams'],
      competitiveAdvantage: 'Battle-tested in Google products serving billions of users',
      messagingAngles: [
        'Powering Google\'s own products for years',
        'Enterprise-grade reliability and uptime',
        'Proven at scale with strict security standards'
      ]
    },
    technical: {
      architecture: 'Production-optimized transformer',
      training: 'Trained and fine-tuned for production stability',
      limitations: ['Smaller context window than 1.5 series', 'Legacy model being phased out']
    },
    pricing: { input: '$0.00025', output: '$0.0005', currency: 'per 1K tokens' }
  }
};

const GTM_CONTENT = {
  introduction: "Google's Gemini 2.0 represents a quantum leap in AI capability. With next-generation reasoning, enhanced multimodality, and breakthrough performance, these models deliver the future of enterprise AI today.",
  frameworks: [
    {
      name: 'The Context Revolution',
      description: 'While competitors struggle with document chunking, Gemini 2.0 processes entire codebases, contracts, and research papers in a single request. This isn\'t incremental - it\'s revolutionary.'
    },
    {
      name: 'Next-Gen Performance',
      description: 'Gemini 2.0 Flash delivers 2x throughput at 1/10th the cost of comparable models. For high-volume applications, this translates to 10x scalability and 50% cost reduction.'
    },
    {
      name: 'Future-Proof Reliability',
      description: 'Built on Google\'s infrastructure serving billions, Gemini 2.0 offers enterprise-grade reliability with strict privacy controls, compliance certifications, and zero data retention policies.'
    }
  ],
  objections: [
    {
      concern: 'Is it new?',
      response: 'Gemini 2.0 powers Google Workspace, Gmail, and Search. The underlying technology has been battle-tested for years across billions of users.'
    },
    {
      concern: 'What about OpenAI?',
      response: 'OpenAI is excellent for general tasks. Gemini 2.0 shines for enterprise data analysis with its unprecedented context handling and next-gen reasoning.'
    }
  ]
};

export const GeminiModelInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Gemini Models: Context-First Intelligence</h2>
        <p className="text-gray-600 leading-relaxed">{GTM_CONTENT.introduction}</p>
      </section>

      {/* Model Deep Dive */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Models</h3>
        <div className="space-y-4">
          {Object.entries(GEMINI_MODEL_INFO).map(([key, info]) => (
            <div key={key} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">{info.title}</h4>
                  <p className="text-gray-600 mt-1">{info.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">
                    {info.pricing.input} / {info.pricing.output}
                  </div>
                  <div className="text-xs text-gray-500">{info.pricing.currency}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Use Cases */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Use Cases</h5>
                  <ul className="space-y-1">
                    {info.useCases.map((uc, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start">
                        <Database size={12} className="mr-2 mt-0.5 text-teal-500" />
                        {uc}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* GTM */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Value Proposition</h5>
                  <p className="text-sm text-gray-700 mb-2">{info.gtm.valueProposition}</p>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Target:</span> {info.gtm.targetAudience.join(', ')}
                  </div>
                </div>

                {/* Technical */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Technical</h5>
                  <div className="text-xs text-gray-600">
                    <div><span className="font-medium">Architecture:</span> {info.technical.architecture}</div>
                    <div className="mt-1"><span className="font-medium">Limitations:</span></div>
                    <ul className="mt-1 pl-3">
                      {info.technical.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GTM Frameworks */}
      <section className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales & Marketing Frameworks</h3>
        <div className="space-y-4">
          {GTM_CONTENT.frameworks.map((fw, i) => (
            <div key={i} className="flex items-start">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <Lightbulb size={16} className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{fw.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{fw.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Objections Handling */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Common Objections & Responses</h3>
        <div className="space-y-3">
          {GTM_CONTENT.objections.map((obj, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-800">"{obj.concern}"</p>
              <p className="text-sm text-gray-600 mt-1">{obj.response}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GeminiModelInfo;