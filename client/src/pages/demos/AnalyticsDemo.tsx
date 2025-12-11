import { DemoBanner } from '@/components/ui/DemoBanner';
import { BarChart3, TrendingUp, DollarSign, Users, Target, PieChart } from 'lucide-react';

export default function AnalyticsDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="Analytics Dashboard" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
              <span className="text-green-600 text-sm font-semibold">+23.5%</span>
            </div>
            <p className="text-gray-600 text-sm">Revenue Growth</p>
            <p className="text-3xl font-bold mt-2">$127,500</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-blue-600 text-sm font-semibold">+12.3%</span>
            </div>
            <p className="text-gray-600 text-sm">New Contacts</p>
            <p className="text-3xl font-bold mt-2">1,248</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-purple-600" />
              <span className="text-purple-600 text-sm font-semibold">+8.7%</span>
            </div>
            <p className="text-gray-600 text-sm">Conversion Rate</p>
            <p className="text-3xl font-bold mt-2">28.5%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Sales Performance</h2>
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-4">
              {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, i) => (
                <div key={quarter}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{quarter} 2024</span>
                    <span className="text-sm font-semibold">${[85000, 92000, 108000, 127500][i].toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${[65, 70, 85, 100][i]}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Deal Distribution</h2>
              <PieChart className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-3">
              {[
                { stage: 'Prospecting', count: 45, color: 'bg-blue-500' },
                { stage: 'Qualification', count: 32, color: 'bg-yellow-500' },
                { stage: 'Proposal', count: 18, color: 'bg-orange-500' },
                { stage: 'Negotiation', count: 12, color: 'bg-purple-500' },
                { stage: 'Closed Won', count: 28, color: 'bg-green-500' },
              ].map(item => (
                <div key={item.stage} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm">{item.stage}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.count} deals</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
              <p className="opacity-90">Get real-time analytics and predictive insights to drive your business forward</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}
