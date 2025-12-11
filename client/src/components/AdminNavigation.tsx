import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Users, Database, Settings, BarChart3, Video } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../contexts/ThemeContext';

const AdminNavigation: React.FC = () => {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const location = useLocation();

  // Admin emails list - must match server admin list
  const adminEmails = [
    'dean@videoremix.io',
    'dean@smartcrm.vip', // Production super admin
    'samuel@videoremix.io',
    'victor@videoremix.io',
    'dev@smartcrm.local' // Dev bypass user
  ];

  // Check if user is admin
  const isAdmin = user?.email && (
    adminEmails.includes(user.email.toLowerCase()) || 
    user.role === 'admin' || 
    user.role === 'super_admin'
  );

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const adminMenuItems = [
    {
      title: 'Bulk Import Users',
      href: '/admin/bulk-import',
      icon: Users,
      description: 'Import multiple users via CSV',
      testId: 'link-bulk-import'
    },
    {
      title: 'User Management',
      href: '/admin/users',
      icon: Database,
      description: 'Manage user accounts and permissions',
      testId: 'link-user-management'
    },
    {
      title: 'System Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'View system usage and metrics',
      testId: 'link-analytics'
    },
    {
      title: 'Admin Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'Configure system settings',
      testId: 'link-settings'
    },
    {
      title: 'Feature Management',
      href: '/admin/feature-management',
      icon: Shield,
      description: 'Manage feature access and permissions',
      testId: 'link-feature-management'
    },
    {
      title: 'Demo Recorder',
      href: '/demo-recorder',
      icon: Video,
      description: 'Record and generate GIFs/videos of features',
      testId: 'link-demo-recorder'
    }
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className={`${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 mb-6`}>
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-red-600" />
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Admin Panel
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            System administration tools
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                isActive
                  ? isDark 
                    ? 'bg-red-500/20 border-red-400/30 shadow-lg' 
                    : 'bg-red-50 border-red-200 shadow-lg'
                  : isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-gray-50/80 border-gray-200 hover:bg-gray-100/80'
              }`}
              data-testid={item.testId}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 mt-0.5 ${
                  isActive 
                    ? 'text-red-600' 
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div>
                  <h3 className={`font-medium ${
                    isActive
                      ? 'text-red-600'
                      : isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNavigation;