
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import IframeOverlapDetector from '../components/IframeOverlapDetector';
import { ArrowLeft, Settings, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const IframeOverlapChecker: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const quickFixes = [
    {
      title: 'Navbar Dropdown Iframes',
      description: 'Fix overlap in navbar dropdown embedded apps',
      status: 'Applied',
      file: 'client/src/components/Navbar.tsx'
    },
    {
      title: 'AI Goals Remote Iframe',
      description: 'Fix overlap in AI Goals remote integration',
      status: 'Needs Fix',
      file: 'client/src/pages/AIGoalsWithRemote.tsx'
    },
    {
      title: 'Contacts Remote Iframe',
      description: 'Fix overlap in Contacts remote integration',
      status: 'Needs Fix',
      file: 'client/src/pages/ContactsWithRemote.tsx'
    },
    {
      title: 'Pipeline Remote Iframe',
      description: 'Fix overlap in Pipeline remote integration',
      status: 'Needs Fix',
      file: 'client/src/pages/PipelineWithRemote.tsx'
    }
  ];

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/settings')}
            className={`flex items-center space-x-2 mb-4 text-sm ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Iframe Overlap Checker
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Detect and fix navbar overlap issues in embedded apps
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <IframeOverlapDetector />
          </div>
          
          <div className="space-y-6">
            <div className={`p-6 ${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="w-5 h-5 text-green-500" />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quick Fixes Status
                </h3>
              </div>
              
              <div className="space-y-3">
                {quickFixes.map((fix, index) => (
                  <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {fix.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        fix.status === 'Applied'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {fix.status}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {fix.description}
                    </p>
                    <code className={`text-xs mt-1 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {fix.file}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-6 ${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Common Solutions
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <strong className={isDark ? 'text-green-400' : 'text-green-600'}>
                    Container Padding:
                  </strong>
                  <code className={`block mt-1 p-2 rounded ${isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {'<div style={{ paddingTop: "80px" }}>'}
                  </code>
                </div>
                
                <div>
                  <strong className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                    PostMessage Fix:
                  </strong>
                  <code className={`block mt-1 p-2 rounded ${isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {'iframe.postMessage({type: "ADD_TOP_PADDING"})'}
                  </code>
                </div>
                
                <div>
                  <strong className={isDark ? 'text-purple-400' : 'text-purple-600'}>
                    CSS Injection:
                  </strong>
                  <code className={`block mt-1 p-2 rounded ${isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {'body { padding-top: 80px !important; }'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IframeOverlapChecker;
