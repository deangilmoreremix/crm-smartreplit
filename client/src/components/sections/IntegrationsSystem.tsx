import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Grid3X3, Settings, Cpu } from 'lucide-react';
import ConnectedApps from '../dashboard/ConnectedApps';
import AIModelSelector from '../AIModelSelector';

const IntegrationsSystem: React.FC = () => {
  const { isDark } = useTheme();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isOpenAIConnected, setIsOpenAIConnected] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    // Check server-side API availability
    const checkConnections = async () => {
      try {
        // Check OpenAI status
        const openaiResponse = await fetch('/api/openai/status');
        const openaiStatus = await openaiResponse.json();
        setIsOpenAIConnected(openaiStatus.configured === true);

        // Check Supabase connection
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        setIsSupabaseConnected(!!supabaseUrl && supabaseUrl.includes('supabase.co'));

        // For Google AI, assume it's available if OpenAI is (they use the same status endpoint)
        setIsGoogleConnected(openaiStatus.configured === true);
      } catch (error) {
        console.warn('Failed to check API connections:', error);
        setIsGoogleConnected(false);
        setIsOpenAIConnected(false);
        setIsSupabaseConnected(false);
      }
    };

    checkConnections();
  }, []);

  return (
    <div className="mb-10">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-700 rounded-xl mr-3">
          <Grid3X3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Integrations & System</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage connected apps and system settings
          </p>
        </div>
      </div>

      {/* Connected Apps */}
      <div className="mb-6">
        <ConnectedApps />
      </div>
      
      {/* System Settings */}
      <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 mb-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
            <Settings className="h-5 w-5 mr-2 text-gray-500" />
            System Settings
          </h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Default AI Model Settings */}
          <div className={`p-4 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
            <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Default AI Model</h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Select the default model for general AI operations
            </p>
            <AIModelSelector 
              selectedModel="gemini-2.5-flash"
              onModelChange={() => {}}
              className="w-full"
            />
          </div>
          
          {/* API Settings */}
          <div className={`p-4 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
            <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>API Configuration</h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Configure external API connections
            </p>
            
            <div className={`p-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-lg flex items-center justify-between mb-3`}>
              <div className="flex items-center space-x-2">
                <Cpu size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Google AI API</span>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${
                isGoogleConnected
                  ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                  : (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
              }`}>
                {isGoogleConnected ? 'Connected' : 'Not Connected'}
              </div>
            </div>
            
            <div className={`p-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-lg flex items-center justify-between mb-3`}>
              <div className="flex items-center space-x-2">
                <Cpu size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>OpenAI API</span>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${
                isOpenAIConnected
                  ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                  : (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
              }`}>
                {isOpenAIConnected ? 'Connected' : 'Not Connected'}
              </div>
            </div>
            
            <div className={`p-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-lg flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <Cpu size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Supabase</span>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${
                isSupabaseConnected
                  ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                  : (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
              }`}>
                {isSupabaseConnected ? 'Connected' : 'Not Connected'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsSystem;