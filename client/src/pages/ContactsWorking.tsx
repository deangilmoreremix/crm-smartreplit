import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ModuleFederationContacts from '../components/ModuleFederationContacts';
import GTMIntegration from '../components/GTMIntegration';

const ContactsWorking: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('contacts');

  const tabs = [
    { id: 'contacts', label: 'Contacts', icon: '👥' },
    { id: 'analytics', label: 'AI Analytics', icon: '📊' },
  ];

  return (
    <div
      className="absolute inset-0 w-full overflow-hidden"
      style={{ top: '80px', height: 'calc(100vh - 80px)' }}
    >
      {/* Tab Navigation */}
      <div className={`border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} px-6 py-3`}>
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="h-full overflow-hidden">
        {activeTab === 'contacts' && (
          <div className="h-full w-full">
            <ModuleFederationContacts showHeader={false} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Contact AI Analytics & Insights
                </h2>
                <p className="text-gray-600">
                  AI-powered recommendations and analytics for your contact management.
                  Get intelligent insights to improve engagement and conversion rates.
                </p>
              </div>

              <GTMIntegration contactId={undefined} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsWorking;
