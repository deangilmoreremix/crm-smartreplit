import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedPage() {
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page. Your current role is{' '}
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {role}
            </span>.
          </p>

          <div className="space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="mb-2">Required permissions for different areas:</p>
              <ul className="text-left space-y-1">
                <li>• <strong>Super Admin:</strong> Full platform management</li>
                <li>• <strong>Reseller:</strong> Partner management and analytics</li>
                <li>• <strong>User:</strong> Basic CRM features</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              
              <Button asChild>
                <Link to="/contact-support">
                  Request Access
                </Link>
              </Button>
            </div>
          </div>

          {user && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Signed in as: {user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}