import { DemoBanner } from '@/components/ui/DemoBanner';
import { Brain, Zap, Target, TrendingUp, Users, DollarSign, BarChart3, Sparkles } from 'lucide-react';

export default function AIToolsDemo() {
  const tools = [
    { id: 1, name: 'Deal Intelligence', icon: Target, description: 'AI-powered deal scoring and insights', color: 'blue' },
    { id: 2, name: 'Smart Forecasting', icon: TrendingUp, description: 'Predictive revenue analytics', color: 'purple' },
    { id: 3, name: 'Lead Scoring', icon: Users, description: 'Intelligent lead prioritization', color: 'green' },
    { id: 4, name: 'Revenue Intelligence', icon: DollarSign, description: 'Real-time revenue tracking', color: 'yellow' },
    { id: 5, name: 'Pipeline Analytics', icon: BarChart3, description: 'Advanced pipeline insights', color: 'red' },
    { id: 6, name: 'Smart Automation', icon: Zap, description: 'Automated workflow optimization', color: 'indigo' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="AI Tools" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Tools Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <div key={tool.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className={`w-12 h-12 bg-gradient-to-r from-${tool.color}-500 to-${tool.color}-600 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
                  Launch Tool
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
          <div className="flex items-center space-x-4 mb-4">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Powered by GPT-5 AI</h2>
          </div>
          <p className="text-lg opacity-90">
            Our AI tools leverage advanced machine learning to help you close more deals, increase revenue, and optimize your sales process.
          </p>
        </div>
      </div>
    </div>
  );
}
