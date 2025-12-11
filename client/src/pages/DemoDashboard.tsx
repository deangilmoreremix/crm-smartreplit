import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Dashboard from '../components/Dashboard';
import Navbar from '../components/Navbar';

// Demo Dashboard - Public version for sales page embeds
// Shows dashboard without authentication requirements
const DemoDashboard: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Include navbar for full experience */}
      <Navbar />
      
      {/* Add a subtle demo indicator */}
      <div className="fixed top-16 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isDark 
            ? 'bg-blue-900/20 text-blue-300 border border-blue-500/30' 
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          Demo Mode
        </div>
      </div>
      
      {/* Dashboard content */}
      <Dashboard />
    </div>
  );
};

export default DemoDashboard;