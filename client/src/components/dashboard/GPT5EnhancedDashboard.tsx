import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import DashboardHeader from './DashboardHeader';
import GPT5SmartKPICards from './GPT5SmartKPICards';
import GPT5AnalyticsPanel from './GPT5AnalyticsPanel';
import GPT5DealIntelligence from './GPT5DealIntelligence';

const GPT5EnhancedDashboard: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-8">
      {/* GPT-5 Enhanced Header */}
      <DashboardHeader 
        title="GPT-5 AI Dashboard" 
        subtitle="Advanced business intelligence powered by GPT-5's unified reasoning system"
      />

      {/* Smart KPI Cards */}
      <section>
        <GPT5SmartKPICards />
      </section>

      {/* Analytics and Intelligence Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* GPT-5 Analytics Panel */}
        <section className={`p-6 rounded-xl border ${
          isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
        }`}>
          <GPT5AnalyticsPanel />
        </section>

        {/* GPT-5 Deal Intelligence */}
        <section className={`p-6 rounded-xl border ${
          isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
        }`}>
          <GPT5DealIntelligence />
        </section>
      </div>

      {/* GPT-5 Features Notice */}
      <div className={`p-4 rounded-xl border text-center ${
        isDark 
          ? 'border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10' 
          : 'border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50'
      }`}>
        <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          GPT-5 Enhanced Features Active
        </h3>
        <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
          ✓ Expert-level business analysis (94.6% AIME accuracy)
          <br />
          ✓ Advanced multimodal understanding (84.2% MMMU performance)
          <br />
          ✓ Unified reasoning system with 50-80% efficiency improvement
          <br />
          ✓ Strategic insights across 40+ professional domains
        </p>
        
        <div className={`mt-3 text-xs ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
          Investment: $2,800-4,200/month • Expected ROI: 35% sales velocity improvement
        </div>
      </div>
    </div>
  );
};

export default GPT5EnhancedDashboard;