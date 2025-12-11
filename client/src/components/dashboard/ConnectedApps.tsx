import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Grid3X3, ExternalLink, Megaphone, Users, FileText, Palette } from 'lucide-react';

const ConnectedApps: React.FC = () => {
  const { isDark } = useTheme();
  
  // Connected apps
  const connectedApps = [
    { 
      name: 'FunnelCraft AI', 
      url: 'https://serene-valkyrie-fec320.netlify.app/', 
      icon: Megaphone, 
      team: 'Marketing Team',
      description: 'Create high-converting funnels with AI-powered optimization',
      color: isDark 
        ? 'from-purple-500/10 to-indigo-500/10 border-white/10 hover:border-purple-400/30' 
        : 'from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-gray-200 hover:border-purple-300',
      iconColor: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
    },
    { 
      name: 'SmartCRM Closer', 
      url: 'https://stupendous-twilight-64389a.netlify.app/', 
      icon: Users, 
      team: 'Outreach Team',
      description: 'Advanced outreach automation and deal closing tools',
      color: isDark 
        ? 'from-blue-500/10 to-cyan-500/10 border-white/10 hover:border-blue-400/30' 
        : 'from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-gray-200 hover:border-blue-300',
      iconColor: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
    },
    { 
      name: 'ContentAI', 
      url: 'https://capable-mermaid-3c73fa.netlify.app/', 
      icon: FileText, 
      team: 'Content & Support',
      description: 'AI-powered content creation and support documentation',
      color: isDark 
        ? 'from-green-500/10 to-emerald-500/10 border-white/10 hover:border-green-400/30' 
        : 'from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-gray-200 hover:border-green-300',
      iconColor: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
    },
    { 
      name: 'White-Label Platform', 
      url: 'https://moonlit-tarsier-239e70.netlify.app', 
      icon: Palette, 
      team: 'Platform Management',
      description: 'Customize and manage your branded platform solutions',
      color: isDark 
        ? 'from-orange-500/10 to-amber-500/10 border-white/10 hover:border-orange-400/30' 
        : 'from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-gray-200 hover:border-orange-300',
      iconColor: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400' : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600'} mr-3`}>
            <Grid3X3 size={20} />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Connected Apps</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Access your entire business toolkit</p>
          </div>
        </div>
        <button className={`text-sm ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} font-medium flex items-center`}>
          View All <ExternalLink size={14} className="ml-1" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {connectedApps.map((app, index) => (
          <a 
            key={index} 
            href={app.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`group p-4 rounded-lg bg-gradient-to-br ${app.color} transition-all duration-200`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${app.iconColor} transition-colors`}>
                <app.icon size={20} />
              </div>
              <ExternalLink size={14} className={`${isDark ? 'text-gray-400 group-hover:text-purple-400' : 'text-gray-400 group-hover:text-purple-600'} transition-colors`} />
            </div>
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{app.name}</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{app.team}</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{app.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ConnectedApps;