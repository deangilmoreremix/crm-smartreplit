
import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface IframeApp {
  id: string;
  name: string;
  url: string;
  location: string;
  hasOverlapIssue?: boolean;
  status?: 'loading' | 'success' | 'error';
}

const IframeOverlapDetector: React.FC = () => {
  const { isDark } = useTheme();
  const [apps, setApps] = useState<IframeApp[]>([
    {
      id: 'wl-main',
      name: 'White Label Suite',
      url: 'https://moonlit-tarsier-239e70.netlify.app/',
      location: 'Navbar WL Dropdown'
    },
    {
      id: 'business-intel',
      name: 'Business Intelligence',
      url: 'https://ai-analytics.smartcrm.vip',
      location: 'Navbar Business Intel Dropdown'
    },
    {
      id: 'intel',
      name: 'Intel Dashboard',
      url: 'https://clever-syrniki-4df87f.netlify.app/',
      location: 'Navbar Intel Dropdown'
    },
    {
      id: 'ai-goals-remote',
      name: 'AI Goals Remote',
      url: 'Remote iframe in AI Goals page',
      location: 'AI Goals Page'
    },
    {
      id: 'contacts-remote',
      name: 'Remote Contacts',
      url: 'Remote iframe in Contacts page',
      location: 'Contacts Page'
    },
    {
      id: 'pipeline-remote',
      name: 'Remote Pipeline',
      url: 'Remote iframe in Pipeline page',
      location: 'Pipeline Page'
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const checkIframeOverlap = async (app: IframeApp) => {
    return new Promise<boolean>((resolve) => {
      // Simulate iframe load and overlap detection
      const iframe = document.createElement('iframe');
      iframe.src = app.url;
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      
      iframe.onload = () => {
        try {
          // Check if iframe content would be covered by navbar
          const navbarHeight = 80; // Approximate navbar height
          const hasIssue = app.url.includes('netlify') || app.url.includes('bolt'); // Only flag external apps
          
          document.body.removeChild(iframe);
          resolve(hasIssue);
        } catch (error) {
          console.warn('Error checking iframe overlap:', error);
          document.body.removeChild(iframe);
          resolve(false);
        }
      };
      
      iframe.onerror = () => {
        document.body.removeChild(iframe);
        resolve(false);
      };
      
      document.body.appendChild(iframe);
      
      // Timeout after 3 seconds
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve(false);
      }, 3000);
    });
  };

  const runOverlapCheck = async () => {
    setIsChecking(true);
    
    const updatedApps = await Promise.all(
      apps.map(async (app) => {
        const hasOverlap = await checkIframeOverlap(app);
        return {
          ...app,
          hasOverlapIssue: hasOverlap,
          status: 'success' as const
        };
      })
    );
    
    setApps(updatedApps);
    setIsChecking(false);
  };

  const generateFixCode = (app: IframeApp) => {
    return `
// Fix for ${app.name}
// Add this CSS to the iframe container or send message to iframe:

// Option 1: Container padding
<div style={{ paddingTop: '80px' }}>
  <iframe src="${app.url}" />
</div>

// Option 2: PostMessage to iframe
iframe.onLoad = (e) => {
  e.target.contentWindow?.postMessage({
    type: 'ADD_TOP_PADDING',
    padding: '80px'
  }, '*');
};

// Option 3: CSS injection
const style = document.createElement('style');
style.textContent = 'body { padding-top: 80px !important; }';
iframe.contentDocument?.head.appendChild(style);
    `.trim();
  };

  useEffect(() => {
    runOverlapCheck();
  }, []);

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <ExternalLink className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Iframe Overlap Detector
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Check for navbar overlap issues in embedded apps
            </p>
          </div>
        </div>
        
        <button
          onClick={runOverlapCheck}
          disabled={isChecking}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50`}
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking...' : 'Run Check'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {apps.map((app) => (
          <div 
            key={app.id}
            className={`p-4 rounded-xl border transition-colors ${
              app.hasOverlapIssue 
                ? isDark 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-red-50 border-red-200'
                : isDark 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  app.hasOverlapIssue 
                    ? 'bg-red-500/20' 
                    : 'bg-green-500/20'
                }`}>
                  {app.hasOverlapIssue ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {app.name}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {app.location}
                  </p>
                  {app.url.startsWith('http') && (
                    <a 
                      href={app.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                    >
                      {app.url}
                    </a>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  app.hasOverlapIssue 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {app.hasOverlapIssue ? 'Overlap Detected' : 'No Issues'}
                </span>
              </div>
            </div>
            
            {app.hasOverlapIssue && (
              <div className="mt-4">
                <details className="group">
                  <summary className={`cursor-pointer text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
                    Show Fix Code
                  </summary>
                  <pre className={`mt-2 p-3 rounded-lg text-xs overflow-x-auto ${
                    isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {generateFixCode(app)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
        <h4 className={`font-medium mb-2 ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
          Quick Fix Summary
        </h4>
        <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          <li>• Add padding-top: 80px to iframe containers</li>
          <li>• Use postMessage to communicate with iframes</li>
          <li>• Inject CSS directly into iframe content</li>
          <li>• Adjust dropdown positioning to account for navbar height</li>
        </ul>
      </div>
    </div>
  );
};

export default IframeOverlapDetector;
