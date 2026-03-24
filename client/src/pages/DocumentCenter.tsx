import React from 'react';
import { FileText, Upload, Download } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from '../components/GlassCard';
import DocumentManager from '@/components/filemanagement/DocumentManager';

const DocumentCenter: React.FC = () => {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document Center</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Documents</span>
            <FileText className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>1,247</div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+23 this week</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Uploads Today</span>
            <Upload className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>12</div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+8% from yesterday</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-row items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Downloads</span>
            <Download className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>89</div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+12% from last week</p>
        </GlassCard>
      </div>

      <DocumentManager />
    </div>
  );
};

export default DocumentCenter;
