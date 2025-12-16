import React, { useState, useEffect, Suspense } from 'react';
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';

// Local development analytics dashboard
const LocalAnalyticsDashboard: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = React.useState('revenue');
  const [timeRange, setTimeRange] = React.useState('30d');

  const metrics = {
    revenue: { value: '$124,583', change: '+12.5%', trend: 'up', color: 'text-green-600' },
    users: { value: '8,492', change: '+8.3%', trend: 'up', color: 'text-blue-600' },
    conversion: { value: '3.24%', change: '-0.8%', trend: 'down', color: 'text-red-600' },
    sessions: { value: '24,891', change: '+15.2%', trend: 'up', color: 'text-purple-600' }
  };

  const chartData = [
    { month: 'Jan', revenue: 85000, users: 6500 },
    { month: 'Feb', revenue: 92000, users: 7200 },
    { month: 'Mar', revenue: 101000, users: 7800 },
    { month: 'Apr', revenue: 118000, users: 8200 },
    { month: 'May', revenue: 124583, users: 8492 }
  ];

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Business Intelligence Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-Powered Analytics & Insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(metrics).map(([key, data]) => (
            <div key={key} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {data.value}
                  </p>
                </div>
                <div className={`text-lg ${data.color}`}>
                  {data.trend === 'up' ? '↗' : '↘'}
                </div>
              </div>
              <p className={`text-sm mt-2 ${data.color}`}>
                {data.change} from last period
              </p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue Trend
            </h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t"
                    style={{ height: `${(data.revenue / 130000) * 200}px` }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              User Growth
            </h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-green-600 rounded-t"
                    style={{ height: `${(data.users / 9000) * 200}px` }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Insights & Recommendations
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Revenue Optimization Opportunity
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Increasing email open rates by 15% could generate an additional $18,500 in monthly revenue.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Customer Retention Alert
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  23 customers haven't logged in for 30+ days. Consider sending re-engagement campaigns.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  Market Trend Analysis
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Similar businesses in your sector are seeing 22% higher conversion rates with personalized onboarding.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Development Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Development Mode:</strong> This is a local analytics dashboard for testing.
              In production, this would load via Module Federation from the remote analytics service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fallback iframe component (kept for production fallback)
const AnalyticsFallback: React.FC = () => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('✅ Analytics iframe loaded');
      try {
        iframe.contentWindow?.postMessage({
          type: 'SET_THEME',
          theme: 'light',
          mode: 'light'
        }, '*');
      } catch (err) {
        console.log('Could not send theme message to iframe');
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <iframe
        ref={iframeRef}
        src="https://ai-analytics.smartcrm.vip?theme=light&mode=light"
        className="flex-1 w-full border-0"
        title="AI-Powered Analytics Dashboard"
        allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
        allowFullScreen
        loading="lazy"
        onError={(e) => {
          console.error('iframe failed to load:', e);
        }}
      />
    </div>
  );
};

// Error boundary to catch rendering errors
class AnalyticsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ AnalyticsApp rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.warn('❌ Remote analytics component failed to render, using local dashboard');
      return <LocalAnalyticsDashboard />;
    }

    return this.props.children;
  }
}

const AnalyticsApp: React.FC = () => {
  const [RemoteAnalytics, setRemoteAnalytics] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRemote = async () => {
      try {
        setIsLoading(true);
        console.log('🚀 Loading Module Federation Analytics...');
        const module = await loadRemoteComponent(
          'https://ai-analytics.smartcrm.vip',
          'AnalyticsApp',
          './AnalyticsApp'
        );
        
        // Validate that we got a valid component
        if (typeof module === 'function' || (typeof module === 'object' && module?.$$typeof)) {
          setRemoteAnalytics(() => module);
          console.log('✅ Module Federation Analytics loaded successfully');
        } else {
          throw new Error('Invalid module format received');
        }
      } catch (err) {
        console.warn('❌ Module Federation failed, using iframe fallback:', err);
        setError(err instanceof Error ? err.message : String(err));
        setRemoteAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadRemote();
  }, []);

  // Show local analytics dashboard if module federation fails
  if (error || !RemoteAnalytics) {
    console.log('🔄 Module Federation failed, showing local analytics dashboard');
    return <LocalAnalyticsDashboard />;
  }

  // Wrap remote component with error boundary to catch rendering errors
  return (
    <AnalyticsErrorBoundary>
      <Suspense fallback={<LocalAnalyticsDashboard />}>
        <RemoteAnalytics />
      </Suspense>
    </AnalyticsErrorBoundary>
  );
};

interface ModuleFederationAnalyticsProps {
  showHeader?: boolean;
}

const ModuleFederationAnalytics: React.FC<ModuleFederationAnalyticsProps> = ({ showHeader = false }) => {
  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Analytics</h3>
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Module Federation
            </div>
          </div>
        </div>
      )}
      <div className="flex-1">
        <AnalyticsApp />
      </div>
    </div>
  );
};

export default ModuleFederationAnalytics;