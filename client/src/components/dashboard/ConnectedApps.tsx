import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Grid3X3,
  ExternalLink,
  Megaphone,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Briefcase,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ConnectedApps: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Connected apps
  const connectedApps = [
    {
      name: 'Contacts',
      url: '/contacts',
      icon: Users,
      team: 'CRM Team',
      description: 'Advanced contact management and enrichment',
      color: isDark
        ? 'from-green-500/10 to-teal-500/10 border-white/10 hover:border-green-400/30'
        : 'from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 border-gray-200 hover:border-green-300',
      iconColor: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
    },
    {
      name: 'Pipeline Deals',
      url: '/pipeline',
      icon: Briefcase,
      team: 'Sales Team',
      description: 'Advanced pipeline management and deal tracking',
      color: isDark
        ? 'from-blue-500/10 to-indigo-500/10 border-white/10 hover:border-blue-400/30'
        : 'from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-gray-200 hover:border-blue-300',
      iconColor: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Calendar',
      url: '/calendar',
      icon: Calendar,
      team: 'Scheduling Team',
      description: 'Smart calendar and appointment management',
      color: isDark
        ? 'from-purple-500/10 to-indigo-500/10 border-white/10 hover:border-purple-400/30'
        : 'from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-gray-200 hover:border-purple-300',
      iconColor: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600',
    },
    {
      name: 'Agency',
      url: '/agency',
      icon: Megaphone,
      team: 'Marketing Team',
      description: 'AI-powered agency automation and optimization',
      color: isDark
        ? 'from-cyan-500/10 to-blue-500/10 border-white/10 hover:border-cyan-400/30'
        : 'from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border-gray-200 hover:border-cyan-300',
      iconColor: isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600',
    },
    {
      name: 'Analytics',
      url: '/analytics',
      icon: BarChart3,
      team: 'Analytics Team',
      description: 'AI-powered analytics and business intelligence',
      color: isDark
        ? 'from-emerald-500/10 to-green-500/10 border-white/10 hover:border-emerald-400/30'
        : 'from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-gray-200 hover:border-emerald-300',
      iconColor: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-green-600',
    },
    {
      name: 'FunnelCraft AI',
      url: 'https://ai-funnelcraft.videoremix.vip',
      icon: FileText,
      team: 'Marketing Team',
      description: 'AI-powered landing page and funnel creation',
      color: isDark
        ? 'from-pink-500/10 to-rose-500/10 border-white/10 hover:border-pink-400/30'
        : 'from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border-gray-200 hover:border-pink-300',
      iconColor: isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600',
      isExternal: true,
    },
    {
      name: 'SmartCRM Closer',
      url: 'https://smartcrmcloser.netlify.app',
      icon: Users,
      team: 'Sales Team',
      description: 'Advanced outreach automation and deal closing tools',
      color: isDark
        ? 'from-orange-500/10 to-amber-500/10 border-white/10 hover:border-orange-400/30'
        : 'from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-gray-200 hover:border-orange-300',
      iconColor: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600',
      isExternal: true,
    },
    {
      name: 'ContentAI',
      url: 'https://contentai.smartcrm.vip',
      icon: FileText,
      team: 'Content & Support',
      description: 'AI-powered content creation and social media calendar',
      color: isDark
        ? 'from-indigo-500/10 to-violet-500/10 border-white/10 hover:border-indigo-400/30'
        : 'from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 border-gray-200 hover:border-indigo-300',
      iconColor: isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600',
      isExternal: true,
    },
  ];

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div
            className={`p-2 rounded-lg ${isDark ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400' : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600'} mr-3`}
          >
            <Grid3X3 size={20} />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Connected Apps
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Access your entire business toolkit
            </p>
          </div>
        </div>
        <button
          className={`text-sm ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} font-medium flex items-center`}
        >
          View All <ExternalLink size={14} className="ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {connectedApps.map((app, index) => {
          const isExternal = app.isExternal || app.url.startsWith('http');

          if (isExternal) {
            return (
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
                  <ExternalLink
                    size={14}
                    className={`${isDark ? 'text-gray-400 group-hover:text-purple-400' : 'text-gray-400 group-hover:text-purple-600'} transition-colors`}
                  />
                </div>
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {app.name}
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  {app.team}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {app.description}
                </p>
              </a>
            );
          }

          return (
            <button
              key={index}
              onClick={() => navigate(app.url)}
              className={`group p-4 rounded-lg bg-gradient-to-br ${app.color} transition-all duration-200 text-left w-full`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${app.iconColor} transition-colors`}>
                  <app.icon size={20} />
                </div>
              </div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                {app.name}
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                {app.team}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {app.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectedApps;
