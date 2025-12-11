import { DemoBanner } from '@/components/ui/DemoBanner';
import { FileCheck, Users, BarChart3, TrendingUp } from 'lucide-react';

export default function FormsSurveysDemo() {
  const forms = [
    { id: 1, name: 'Customer Feedback Survey', responses: 234, completion: 87, created: '2024-01-10' },
    { id: 2, name: 'Lead Capture Form', responses: 456, completion: 92, created: '2024-01-05' },
    { id: 3, name: 'Product Interest Form', responses: 189, completion: 78, created: '2024-01-15' },
    { id: 4, name: 'Event Registration', responses: 312, completion: 95, created: '2024-01-12' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner feature="Forms & Surveys" />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Forms & Surveys Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <FileCheck className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">24</p>
            <p className="text-gray-600">Active Forms</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Users className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">1.2k</p>
            <p className="text-gray-600">Total Responses</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">88%</p>
            <p className="text-gray-600">Avg Completion</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <BarChart3 className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">245</p>
            <p className="text-gray-600">This Week</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Forms</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Create Form
            </button>
          </div>
          <div className="space-y-4">
            {forms.map(form => (
              <div key={form.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <h3 className="font-semibold mb-2">{form.name}</h3>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {form.responses} responses
                      </span>
                      <span className="flex items-center">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        {form.completion}% completion
                      </span>
                      <span>Created: {new Date(form.created).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${form.completion}%` }}></div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button className="text-blue-600 hover:underline">View Results</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
