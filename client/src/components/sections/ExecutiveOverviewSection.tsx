import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import DashboardHeader from '../dashboard/DashboardHeader';
import KPICards from '../dashboard/KPICards';
import QuickActions from '../dashboard/QuickActions';
import AIGoalsCard from '../AIGoalsCard'; // Import the new AIGoalsCard component
import MetricsCards from '../dashboard/MetricsCards';

const ExecutiveOverviewSection: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="mb-10">
      {/* Dashboard Header */}
      <DashboardHeader />
      
      {/* KPI Cards */}
      <div className="mb-8">
        <KPICards />
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Quick Actions</h2>
        <QuickActions />
      </div>
      
      {/* Optional: MetricsCards as a secondary metrics display */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Performance Overview</h2>
        <MetricsCards />
      </div>
      
      {/* AI Goals Card */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>AI Goals Tracking</h2>
        <AIGoalsCard />
      </div>
    </div>
  );
};

export default ExecutiveOverviewSection;