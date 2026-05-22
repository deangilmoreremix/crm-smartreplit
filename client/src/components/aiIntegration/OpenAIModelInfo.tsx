import React from 'react';
import { BookOpen, TrendingUp, Code, MessageSquare, BarChart3, Users, Lightbulb, Target, Zap } from 'lucide-react';

interface ModelInfoPageProps {
  model: string;
  provider: 'openai' | 'gemini';
}

const OPENAI_MODEL_INFO: Record<string, {
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
  'gpt-5.5-preview': {
    title: 'GPT-5.5 Preview',
    description: 'OpenAI\'s latest frontier model featuring enhanced reasoning, multimodal capabilities, and next-generation AI architecture.',
    useCases: [
      'Advanced strategic planning and analysis',
      'Complex multimodal document understanding',
      'Next-gen creative content generation',
      'Enterprise AI agent development',
      'Cutting-edge research and development'
    ],
    gtm: {
      valueProposition: 'The most advanced AI available - experience next-generation reasoning and capabilities',
      targetAudience: ['AI researchers', 'Enterprise innovators', 'Tech-forward companies', 'R&D teams'],
      competitiveAdvantage: 'First-to-market with breakthrough reasoning capabilities and massive multimodal context',
      messagingAngles: [
        'Experience the future of AI today',
        'Breakthrough capabilities not available anywhere else',
        'Built for the next decade of AI applications'
      ]
    },
    technical: {
      architecture: 'Next-generation transformer with enhanced attention mechanisms',
      training: 'Trained on diverse data with reinforcement learning from human feedback',
      limitations: ['Preview may have output variability', 'Rate limits during preview period']
    },
    pricing: { input: '$7.50', output: '$75.00', currency: 'per 1M tokens' }
  },
  'gpt-4o': {
    title: 'GPT-4o (Omni)',
    description: 'OpenAI\'s most advanced multimodal model, understanding and generating text, images, and audio with human-level intelligence.',
    useCases: [
      'Complex reasoning and problem solving',
      'Multimodal document analysis (PDFs, images, spreadsheets)',
      'Advanced code generation and debugging',
      'Strategic business analysis and planning',
      'Creative content generation with deep context'
    ],
    gtm: {
      valueProposition: 'The most capable AI for complex business intelligence and creative tasks',
      targetAudience: ['Enterprise AI teams', 'Business strategists', 'Data scientists', 'Creative professionals'],
      competitiveAdvantage: 'Human-level multimodal reasoning with 128K context and advanced tool use',
      messagingAngles: [
        'Handles complex, multi-step reasoning better than any other model',
        'Perfect for high-stakes business decisions requiring deep analysis',
        'Transforms how teams work with AI-powered insights'
      ]
    },
    technical: {
      architecture: 'Transformer-based with multimodal attention mechanisms',
      training: 'Trained on diverse internet text with reinforcement learning from human feedback',
      limitations: ['May hallucinate on very specific facts', 'Context window can be exceeded with long documents']
    },
    pricing: { input: '$5.00', output: '$15.00', currency: 'per 1M tokens' }
  },
  'o1-preview': {
    title: 'o1 Preview',
    description: 'Advanced reasoning model designed for complex problem-solving with extended thinking capabilities.',
    useCases: [
      'Mathematical and scientific reasoning',
      'Code debugging and optimization',
      'Strategic business planning',
      'Research and analysis',
      'Complex decision modeling'
    ],
    gtm: {
      valueProposition: 'Specialized reasoning for the most complex challenges',
      targetAudience: ['Research scientists', 'Engineers', 'Strategic planners', 'Data analysts'],
      competitiveAdvantage: 'Industry-leading reasoning accuracy with transparent thought process',
      messagingAngles: [
        'Solves problems traditional models cannot',
        'Transparent reasoning you can trust',
        'Perfect for high-stakes analytical work'
      ]
    },
    technical: {
      architecture: 'Reasoning-focused transformer with chain-of-thought training',
      training: 'Specialized training for reasoning tasks with human feedback',
      limitations: ['Slower response times', 'Higher cost per token', 'Preview limitations']
    },
    pricing: { input: '$15.00', output: '$60.00', currency: 'per 1M tokens' }
  },
  'gpt-4o-mini': {
    title: 'GPT-4o Mini',
    description: 'A faster, more affordable version of GPT-4o that delivers 82% of the quality at 40% of the cost.',
    useCases: [
      'Everyday customer interactions',
      'Email and message composition',
      'Quick document summarization',
      'Real-time chat responses',
      'Data extraction and categorization'
    ],
    gtm: {
      valueProposition: 'Enterprise-grade AI performance at a fraction of the cost',
      targetAudience: ['SMB teams', 'Customer support agents', 'Sales professionals', 'Content creators'],
      competitiveAdvantage: 'Best cost-to-performance ratio for production AI workflows',
      messagingAngles: [
        '82% of GPT-4o quality at 40% of the cost',
        'Perfect for scaling AI across your entire team',
        'No compromise on accuracy for everyday tasks'
      ]
    },
    technical: {
      architecture: 'Optimized transformer with efficient attention',
      training: 'Distilled from GPT-4o with specialized fine-tuning',
      limitations: ['Less capable on highly complex reasoning', 'Smaller context window optimization']
    },
    pricing: { input: '$0.10', output: '$0.20', currency: 'per 1M tokens' }
  },
  'gpt-3.5-turbo': {
    title: 'GPT-3.5 Turbo',
    description: 'Reliable, fast, and cost-effective model that has powered millions of applications.',
    useCases: [
      'Simple chatbots and assistants',
      'Basic text generation and editing',
      'Quick question answering',
      'Template-based content creation',
      'Language translation tasks'
    ],
    gtm: {
      valueProposition: 'Proven reliability at the lowest price point',
      targetAudience: ['Startups', 'Developers prototyping', 'Small businesses', 'Educational use'],
      competitiveAdvantage: 'Battle-tested model with consistent performance',
      messagingAngles: [
        'Millions of developers trust this model',
        'Lowest barrier to entry for AI integration',
        'Perfect for proof-of-concept and MVP development'
      ]
    },
    technical: {
      architecture: 'Standard transformer decoder',
      training: 'Trained on diverse internet text through supervised learning',
      limitations: ['Limited multimodal capabilities', 'Outdated knowledge cutoff']
    },
    pricing: { input: '$0.50', output: '$1.50', currency: 'per 1M tokens' }
  }
};

const GTM_CONTENT = {
  introduction: "OpenAI's latest models represent the cutting edge of AI capability. From GPT-5.5 Preview delivering next-generation reasoning to o1 solving complex problems with deep thought, these models transform how businesses leverage AI for strategic advantage.",
  frameworks: [
    {
      name: 'The Frontier Advantage',
      description: 'GPT-5.5 and o1 represent 2-3 years ahead of previous capabilities. While competitors struggle with basic reasoning, these models solve complex, multi-step problems with human-level accuracy.'
    },
    {
      name: 'Cost Intelligence 2.0',
      description: 'New pricing tiers enable enterprise-scale AI. GPT-4o Mini at $0.10/1M tokens makes AI free for most workflows. GPT-5.5 at $7.50/1M delivers premium capability at 1/4 the cost of previous frontier models.'
    },
    {
      name: 'Hybrid Reasoning Architecture',
      description: 'Use o1 for strategic decisions requiring deep analysis. Use GPT-4o for daily operations. Use GPT-4o Mini for high-volume tasks. This approach reduces AI costs by 70% while improving outcomes.'
    }
  ],
  objections: [
    {
      concern: 'Cost is too high',
      response: 'GPT-4o Mini delivers 82% of GPT-4o capability at 40% of the cost. GPT-5.5 delivers 95% of premium capability at 25% of the cost. Start with Mini and upgrade strategically.'
    },
    {
      concern: 'Quality varies',
      response: 'OpenAI\'s distillation process ensures even smaller models maintain enterprise-grade reliability. The new models show 30-50% improvement in reasoning benchmarks.'
    }
  ]
};

export const OpenAIModelInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">OpenAI Models: Strategic Intelligence for CRM</h2>
        <p className="text-gray-600 leading-relaxed">{GTM_CONTENT.introduction}</p>
      </section>

      {/* Model Deep Dive */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Models</h3>
        <div className="space-y-4">
          {Object.entries(OPENAI_MODEL_INFO).map(([key, info]) => (
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
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5"></span>
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
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales & Marketing Frameworks</h3>
        <div className="space-y-4">
          {GTM_CONTENT.frameworks.map((fw, i) => (
            <div key={i} className="flex items-start">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
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

export default OpenAIModelInfo;