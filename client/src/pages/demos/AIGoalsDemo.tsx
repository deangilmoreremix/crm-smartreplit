import { DemoBanner } from '@/components/ui/DemoBanner';
import { Target, TrendingUp, Zap, CheckCircle, Clock, BarChart3 } from 'lucide-react';

export default function AIGoalsDemo() {
  const goals = [
    { id: 1, title: 'Increase Monthly Revenue by 25%', progress: 68, status: 'active', category: 'Revenue' },
    { id: 2, title: 'Close 10 Enterprise Deals', progress: 40, status: 'active', category: 'Sales' },
    { id: 3, title: 'Achieve 90% Customer Satisfaction', progress: 85, status: 'active', category: 'Customer Success' },
    { id: 4, title: 'Reduce Sales Cycle by 15 Days', progress: 92, status: 'completed', category: 'Efficiency' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="AI Goals System" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Goals Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <Target className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">58</p>
            <p className="text-gray-600">Total Goals</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">23</p>
            <p className="text-gray-600">Completed</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Clock className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-gray-600">In Progress</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">71%</p>
            <p className="text-gray-600">Avg Progress</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
          <div className="space-y-4">
            {goals.map(goal => (
              <div key={goal.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{goal.title}</p>
                    <p className="text-sm text-gray-600">{goal.category}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${goal.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {goal.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{goal.progress}% complete</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
