import React from 'react';
import { SELECTABLE_MODELS, type ModelTier } from '@shared/aiModels';
import { BookOpen, TrendingUp, Code, MessageSquare, BarChart3, Users, Lightbulb, Target, Zap } from 'lucide-react';

interface ModelInfoPageProps {
  model: string;
  provider: 'openai';
}

const TIER_INFO: Record<ModelTier, {
  useCases: string[];
  targetAudience: string[];
  valueProposition: string;
  limitations: string[];
}> = {
  fast: {
    useCases: ['High-volume classification and tagging', 'Quick replies and autocomplete', 'Contact scoring at scale'],
    targetAudience: ['High-volume teams', 'Cost-sensitive workflows'],
    valueProposition: 'Lowest latency and cost for routine CRM automation.',
    limitations: ['Less depth on multi-step reasoning'],
  },
  default: {
    useCases: ['Email drafting', 'Deal and pipeline summaries', 'Everyday CRM assistance'],
    targetAudience: ['Sales reps', 'Account managers'],
    valueProposition: 'The recommended default: fast, efficient and capable for most tasks.',
    limitations: ['Consider a deeper tier for complex analysis'],
  },
  deep: {
    useCases: ['Deal risk analysis', 'Proposal and strategy drafting', 'Multi-step research'],
    targetAudience: ['Sales leaders', 'Strategic accounts'],
    valueProposition: 'Balanced speed, cost and intelligence for demanding work.',
    limitations: ['Higher cost and latency than faster tiers'],
  },
  max: {
    useCases: ['Complex forecasting', 'Expert-level analysis', 'Critical decisions'],
    targetAudience: ['Executives', 'Enterprise teams'],
    valueProposition: 'Highest intelligence for the hardest problems.',
    limitations: ['Highest cost and latency'],
  },
};

const OPENAI_MODEL_INFO = SELECTABLE_MODELS.map((m) => ({
  key: m.id,
  title: m.label,
  description: m.description,
  tier: m.tier,
  ...TIER_INFO[m.tier],
}));

const GTM_CONTENT = {
  introduction: "OpenAI's latest models represent the cutting edge of AI capability. From fast, cost-effective tiers to maximum-intelligence reasoning, the GPT-6 family transforms how businesses leverage AI for strategic advantage.",
  frameworks: [
    {
      name: 'Match the Tier to the Task',
      description: 'Use the fast tier for high-volume classification, the default tier for everyday drafting and summaries, and the deep or max tiers for strategic analysis.'
    },
    {
      name: 'Cost Intelligence',
      description: 'Routing routine work to the fast and default tiers keeps spend low, while reserving deeper tiers for the few decisions that need them. See the OpenAI pricing page for current rates.'
    },
    {
      name: 'Hybrid Reasoning Architecture',
      description: 'Combine tiers in one workflow: fast for triage, default for drafting, deep or max for final review of high-value deals.'
    }
  ],
  objections: [
    {
      concern: 'Cost is too high',
      response: 'Start on the fast or default tier and upgrade only the tasks where quality measurably improves.'
    },
    {
      concern: 'Quality varies',
      response: 'Pick a deeper tier for critical tasks and validate outputs with a human in the loop before sending to customers.'
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
          {OPENAI_MODEL_INFO.map((info) => (
            <div key={info.key} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">{info.title}</h4>
                  <p className="text-gray-600 mt-1">{info.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">{info.key}</div>
                  <div className="text-xs text-gray-500">See OpenAI pricing page</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Value Proposition</h5>
                  <p className="text-sm text-gray-700 mb-2">{info.valueProposition}</p>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Target:</span> {info.targetAudience.join(', ')}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tier</h5>
                  <div className="text-xs text-gray-600">
                    <div><span className="font-medium">Tier:</span> {info.tier}</div>
                    <div className="mt-1"><span className="font-medium">Limitations:</span></div>
                    <ul className="mt-1 pl-3">
                      {info.limitations.map((lim, i) => (
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