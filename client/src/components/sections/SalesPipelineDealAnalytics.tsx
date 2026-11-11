import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart3, TrendingUp } from 'lucide-react';
import DealAnalytics from '../DealAnalytics';
import ChartsSection, { useSalesData } from '../dashboard/ChartsSection';
import { stageConversions } from '../dashboard/chartData';

const SalesPipelineDealAnalytics: React.FC = () => {
  const { isDark } = useTheme();
  const { deals, loading, error } = useSalesData();
  const conversions = React.useMemo(() => stageConversions(deals), [deals]);

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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesPipelineDealAnalytics;
