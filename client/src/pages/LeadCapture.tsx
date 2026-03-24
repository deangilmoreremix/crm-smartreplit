import React from 'react';
import { Target, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from '../components/GlassCard';
import LeadCaptureForm from '@/components/leadmanagement/LeadCaptureForm';

const LeadCapture: React.FC = () => {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lead Capture Center</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Leads Today</span>
            <Target className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>47</div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+23% from yesterday</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Conversion Rate</span>
            <TrendingUp className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>68%</div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+8% from last week</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Leads</span>
            <Users className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>2,347</div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+12% this month</p>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadCaptureForm />

        <GlassCard className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Leads</h3>
          <div className="space-y-4">
            {[
              { name: 'Sarah Johnson', company: 'TechCorp', score: 85, time: '2 hours ago' },
              { name: 'Michael Chen', company: 'Global Finance', score: 92, time: '4 hours ago' },
              {
                name: 'Emily Rodriguez',
                company: 'Creative Studios',
                score: 78,
                time: '6 hours ago',
              },
              { name: 'David Kim', company: 'NextGen Solutions', score: 88, time: '8 hours ago' },
              { name: 'Lisa Wang', company: 'Smart Logistics', score: 95, time: '1 day ago' },
            ].map((lead, index) => (
              <div
                key={index}
                className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} last:border-0`}
              >
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.name}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{lead.company}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        lead.score >= 90
                          ? 'bg-green-500'
                          : lead.score >= 80
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                      }`}
                    ></div>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.score}</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{lead.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LeadCapture;
