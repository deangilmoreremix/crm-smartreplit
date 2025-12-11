import React, { useState } from 'react';
import { Settings, Save, Database, Mail, Shield, Globe, Bell, Lock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AdminSettings: React.FC = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    siteName: 'SmartCRM',
    siteUrl: 'https://app.smartcrm.vip',
    emailNotifications: true,
    maintenanceMode: false,
    allowSignups: true,
    requireEmailVerification: true
  });

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'System settings have been updated successfully.',
    });
  };

  const settingSections = [
    {
      title: 'General Settings',
      icon: Globe,
      settings: [
        {
          id: 'siteName',
          label: 'Site Name',
          type: 'text',
          value: settings.siteName
        },
        {
          id: 'siteUrl',
          label: 'Site URL',
          type: 'text',
          value: settings.siteUrl
        }
      ]
    },
    {
      title: 'Email Settings',
      icon: Mail,
      settings: [
        {
          id: 'emailNotifications',
          label: 'Enable Email Notifications',
          type: 'checkbox',
          value: settings.emailNotifications
        }
      ]
    },
    {
      title: 'Security Settings',
      icon: Shield,
      settings: [
        {
          id: 'requireEmailVerification',
          label: 'Require Email Verification',
          type: 'checkbox',
          value: settings.requireEmailVerification
        },
        {
          id: 'allowSignups',
          label: 'Allow New Signups',
          type: 'checkbox',
          value: settings.allowSignups
        }
      ]
    },
    {
      title: 'System Settings',
      icon: Database,
      settings: [
        {
          id: 'maintenanceMode',
          label: 'Maintenance Mode',
          type: 'checkbox',
          value: settings.maintenanceMode
        }
      ]
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Admin Settings
              </h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Configure system-wide settings and preferences
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-save-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {settingSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className={`${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Icon className="w-6 h-6 text-blue-600" />
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {section.title}
                </h2>
              </div>
              <div className="space-y-4">
                {section.settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <label
                      htmlFor={setting.id}
                      className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      {setting.label}
                    </label>
                    {setting.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        id={setting.id}
                        checked={setting.value as boolean}
                        onChange={(e) => setSettings({ ...settings, [setting.id]: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        data-testid={`input-${setting.id}`}
                      />
                    ) : (
                      <input
                        type="text"
                        id={setting.id}
                        value={setting.value as string}
                        onChange={(e) => setSettings({ ...settings, [setting.id]: e.target.value })}
                        className={`px-3 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500`}
                        data-testid={`input-${setting.id}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSettings;
