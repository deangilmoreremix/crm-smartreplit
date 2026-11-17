import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Activity, Database, Clock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const AdminAnalytics: React.FC = () => {
  const { isDark } = useTheme();

  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/stats', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.totalUsers === 'number') {
          setTotalUsers(data.totalUsers);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Only total users has a real source (/api/admin/stats). The server tracks no sessions,
  // API call counts or response times, so those are shown as unavailable rather than invented.
  const metrics = [
    {
      title: 'Total Users',
      value: totalUsers === null ? 'Unavailable' : totalUsers.toLocaleString(),
      icon: Users,
      color: 'blue',
    },
    { title: 'Active Sessions', value: 'Unavailable', icon: Activity, color: 'green' },
    { title: 'API Calls Today', value: 'Unavailable', icon: Database, color: 'purple' },
    { title: 'Avg Response Time', value: 'Unavailable', icon: Clock, color: 'green' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              System Analytics
            </h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              System metrics and usage statistics
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className={`${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}
              data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon
                  className={`w-8 h-8 ${
                    metric.color === 'blue'
                      ? 'text-blue-600'
                      : metric.color === 'green'
                        ? 'text-green-600'
                        : metric.color === 'purple'
                          ? 'text-purple-600'
                          : 'text-gray-600'
                  }`}
                />
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {metric.title}
              </p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Placeholder for Charts */}
      <div
        className={`${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}
      >
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Usage Trends
        </h2>
        <div className="h-64 flex items-center justify-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Usage analytics are not available yet
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
