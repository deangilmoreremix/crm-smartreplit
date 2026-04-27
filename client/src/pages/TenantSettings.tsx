import React from 'react';
import { Settings, Users, Globe, Shield, Database } from 'lucide-react';
import TenantManagement from '../components/admin/TenantManagement';

const TenantSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tenant Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage multi-tenant configurations, domains, and white-label settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <TenantManagement />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  <Users className="w-4 h-4 mr-2" />
                  Add New Tenant
                </button>
                <button className="w-full flex items-center px-4 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30">
                  <Globe className="w-4 h-4 mr-2" />
                  Configure Domain
                </button>
                <button className="w-full flex items-center px-4 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30">
                  <Settings className="w-4 h-4 mr-2" />
                  White-label Settings
                </button>
              </div>
            </div>

            {/* Security Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                Security Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tenant Isolation</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Domain Verification
                  </span>
                  <span className="text-sm font-medium text-yellow-600">Pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SSL Certificates</span>
                  <span className="text-sm font-medium text-green-600">Valid</span>
                </div>
              </div>
            </div>

            {/* Database Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                Database
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Tenants</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Storage</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">2.4 GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Backup Status</span>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Need Help?
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                Learn more about multi-tenant configuration and domain setup.
              </p>
              <a
                href="#"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
              >
                View Documentation →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;
