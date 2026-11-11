import React from 'react';
import { Brain } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Lightweight status strip. The KPI, analytics and deal-intelligence panels (and the header)
 * render as their own dashboard sections, so this composite no longer embeds them.
 */
const GPT5EnhancedDashboard: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div
      data-testid="gpt5-status-strip"
      className={`flex items-center gap-3 p-4 rounded-xl border ${
        isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'
      }`}
    >
      <Brain className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
      <div>
        <h3 className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          AI Dashboard
        </h3>
        <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
          AI-powered KPIs, analytics and deal intelligence appear in the sections below. They show
          an explicit message when an OpenAI key is missing or the AI request fails.
        </p>
      </div>
    </div>
  );
};

export default GPT5EnhancedDashboard;
