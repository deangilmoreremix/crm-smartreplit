import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart3, TrendingUp } from 'lucide-react';
import DealAnalytics from '../DealAnalytics';
import ChartsSection from '../dashboard/ChartsSection';
import { useSalesData } from '../../hooks/useSalesData';
import { stageConversions, mergeConversions, type ConversionPoint } from '../dashboard/chartData';
import { useDemoDataSafe } from '../../contexts/DemoDataContext';
import { DEMO_CONVERSIONS } from '../../data/demoData';
import SampleBadge from '../SampleBadge';

const SalesPipelineDealAnalytics: React.FC = () => {
  const { isDark } = useTheme();
  const { deals, loading, error } = useSalesData();
  const { showDemoData } = useDemoDataSafe();
  const conversions = React.useMemo<ConversionPoint[]>(() => {
    const real = stageConversions(deals);
    return showDemoData ? mergeConversions(real, DEMO_CONVERSIONS) : real;
  }, [deals, showDemoData]);

  return (
    <div className="mb-10">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sales Pipeline & Analytics
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Comprehensive deal performance and pipeline insights
          </p>
        </div>
      </div>

      {/* Deal Analytics */}
      <div
        className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 mb-6`}
      >
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
          Deal Analytics
        </h3>
        <DealAnalytics />
      </div>

      {/* Charts Section */}
      <div className="mb-6">
        <ChartsSection />
      </div>

      {/* Conversion Metrics */}
      <div
        className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 mb-6`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sales Conversion Metrics
            {showDemoData && <SampleBadge label="Includes sample data" className="ml-3 align-middle" />}
          </h3>
          <TrendingUp className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {conversions.map((c) => (
            <div
              key={c.label}
              className={`p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            >
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{c.label}</p>
              <p className={`text-2xl font-semibold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? '…' : error || c.rate === null ? '—' : `${Math.round(c.rate)}%`}
              </p>
              {c.delta !== undefined && !loading && !error && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    c.delta >= 0
                      ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'
                      : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {c.delta >= 0 ? '+' : ''}{c.delta}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesPipelineDealAnalytics;
